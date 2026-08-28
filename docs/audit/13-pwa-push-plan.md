# PWA + Web Push — Scoping Plan (retention Route A)

_Scoped 2026-08-27, from a "would an app improve return rates?" question.
Scope-only — nothing here is built, and this does NOT jump the queue in
`00-plan-of-attack.md`. It is written to be picked up later, so the last section
lists what to preserve in unrelated work so this stays cheap._

## Headline

A native app was the starting question. The mechanism that actually drives
return visits is **a notification permission plus a home-screen icon**, not
app-ness — and a PWA delivers both for roughly **1–2 weeks of evenings**, versus
~4–6 weeks for a Capacitor wrap (store review, OAuth deep-linking, £79/yr, a
payments decision) or 3–6 months for React Native.

The decisive finding is that **the expensive half of a retention loop is already
built**. `app/api/cron/reengagement/route.ts` already answers "who has lapsed and
should we contact them", and `lib/email/reengagement.ts` already answers "what do
we say, safely, to a 15-year-old". Push is a **second delivery pipe on an
existing pipeline**, not a new feature.

Route A is also not throwaway if a wrapped app follows: Capacitor serves the same
web build, and the subscription table, consent UX and send path all carry over
unchanged.

## What already exists

| | where |
|---|---|
| Lapsed-student selector (4d, ≥5 attempts, opted in, capped, batched 100) | `get_lapsed_students` in `20260630_reengagement.sql` |
| Nudge copy that is Children's-Code-safe by construction | `lib/email/reengagement.ts` |
| Daily cron wiring + `CRON_SECRET` auth + Vercel schedule | `app/api/cron/reengagement/route.ts`, `vercel.json` |
| Opt-in consent storage + toggle + one-click off | `auth.users.raw_user_meta_data->>'email_reminders'`, `app/student/dashboard/page.tsx:184`, `app/api/email/unsubscribe/route.ts` |
| Click-tracking redirect pattern to copy | `app/api/email/click/route.ts` |
| A streak worth reminding people about | `app/student/dashboard/page.tsx:429` |
| Consent-gated analytics + `trackEvent` | `lib/analytics.ts:119` |
| Static question SVGs (precacheable as-is) | `public/questions/**` |
| A client-only app to install | 42 of 52 pages are `'use client'`; one server route in the student journey |

## Increment 1 — installable PWA (~2–3 evenings)

* **Manifest** via the Next file convention `app/manifest.ts` (not a static file —
  it type-checks and picks up `NEXT_PUBLIC_SITE_URL` like `app/layout.tsx` does).
  `display: "standalone"`, theme/background colours from `lib/styles.ts`.
* **Icons.** `public/` is still the Next starter SVGs — there is no app icon of
  any kind today. Need 192 and 512 PNGs plus a 512 **maskable** variant.
* **Service worker.** Hand-roll ~80 lines in `public/sw.js` and register it from a
  small client component in `app/layout.tsx`, alongside `<Analytics />`.
  Deliberately no `next-pwa` dependency: package.json is lean on purpose and that
  package is a poor fit for App Router on Next 16.
* **Caching rule (non-negotiable).** App shell and `public/questions/**`
  precached; **everything to `*.supabase.co` is network-only, never cached.**
  These are shared family devices — no student data may sit in a cache a sibling
  can open offline.

**Decision to settle:** `start_url`. Students are the retention target
(`/student/dashboard`), but teachers install too. Recommend `/` and let the
existing role routing land them, so one install works for both.

## Increment 2 — subscription + consent (~3–4 evenings)

New migration `supabase/migrations/2026XXXX_push_subscriptions.sql`:

```sql
create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  endpoint     text not null,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
create unique index if not exists push_subscriptions_endpoint_uniq
  on push_subscriptions (endpoint);
alter table push_subscriptions enable row level security;
```

**This table breaks the `reengagement_sends` pattern, on purpose.** That one is
service-role only with no policies. This one is written by the student's own
browser, so it needs owner-scoped policies in the `20260611_rls_baseline.sql`
idiom — select/insert/delete `using (auth.uid() = student_id)`, insert
`with check (auth.uid() = student_id)`. Note that a row here is a *capability to
push to that device*, so owner-only is a real boundary, not bookkeeping.

* **No new API route for subscribe.** The client writes to Supabase directly under
  RLS, matching how the rest of the app talks to the database. Unsubscribe is a
  row delete.
* **One new dependency:** `web-push` (VAPID signing), server-side only. Env:
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
* **Consent is two-layer** — an app toggle *and* a browser permission — where the
  email flow has only one. Mirror the toggle at `app/student/dashboard/page.tsx:184`.

**The highest-stakes call in this plan:** never call `Notification.requestPermission()`
on page load. A denied browser permission is effectively permanent and unrecoverable
without the user digging through site settings. It must fire only from a deliberate
tap on an explained toggle, defaulted off. Same no-dark-patterns discipline as
`lib/email/reengagement.ts` — these are 14–16 year olds; no guilt, no countdowns,
plus quiet hours and a one-tap off.

## Increment 3 — send path (~3–4 evenings)

* `lib/push/nudge.ts` — a pure builder mirroring `lib/email/reengagement.ts`, so it
  unit-tests the same way (`lib/email/reengagement.test.ts` is the template).
* `app/api/cron/push-nudge/route.ts` + a `vercel.json` entry. **A separate cron, not
  a branch inside the email one** — different cadence (email caps at one per student
  ever; push should recur on a cooldown), different consent, and either can be
  killed without touching the other.
* New selector `get_lapsed_students_for_push(p_days, p_min_attempts, p_cooldown_days)`,
  same `security definer` + `revoke ... from anon, authenticated` shape as
  `get_lapsed_students`, joined to `push_subscriptions` and to a `push_sends` table
  for the cooldown cap.
* **Prune dead endpoints.** A 404/410 from the push service means the subscription is
  gone; delete the row. Not optional — endpoints expire constantly and a send loop
  that ignores this degrades quietly.
* Service worker `push` + `notificationclick` handlers; click focuses an existing tab
  or opens the dashboard through a click-tracked redirect like `/api/email/click`.

## Increment 4 — measurement (~1 evening)

`trackEvent`: `pwa_install_prompted` / `pwa_installed` (the `appinstalled` event),
`push_prompt_shown`, `push_permission_granted|denied`, `push_subscribed`,
`push_nudge_clicked`.

**The number that decides whether a wrapped app is ever worth building:** grant
rate among prompted students, and D7 return for granted vs declined. Route B's
main advantage over Route A is iOS notifications without the cliff below — only
worth £79/yr and store review if the grant-and-return effect is real.

## The iOS caveat

iOS delivers web push **only** to a PWA the user has added to the home screen via
Share → Add to Home Screen. There is no install prompt to trigger. Expect a
minority to complete it, and budget an evening for a detected, iOS-Safari-only
"how to install" hint (`navigator.standalone` + UA). Android Chrome has
`beforeinstallprompt` and full push with none of this.

## Out of scope

Offline *answering* (queued attempts need conflict resolution against
`practice_attempts` — a much bigger piece); teacher-side push; assignment-due and
exam-scheduled nudges (they want the assignment model wired first); anything
store-related.

## Keeping the door open

None of this needs building now. These are the things that, if quietly preserved
while doing unrelated work, keep Route A a 1–2 week job instead of a 6 week one.

1. **Keep the student journey client-rendered.** The whole case above rests on
   42/52 pages being `'use client'` with no SSR to unpick. If practice or exam
   pages acquire server-component data dependencies, the offline shell gets much
   harder — and a Capacitor wrap stops being viable at all.
2. **Make the streak computable server-side when you next touch it.** It is
   currently computed in the browser at `app/student/dashboard/page.tsx:61-69`.
   A cron cannot render a dashboard, so "your 5-day streak ends tonight" — the most
   compelling nudge available — needs that logic extracted as a shared pure
   function first. Cheap while already in the file; annoying later.
3. **Keep "who is lapsed" separate from "have we contacted them".** The email
   frequency cap is currently welded into `get_lapsed_students` via its
   `not exists (reengagement_sends)` clause. Any future edit there should split the
   two rather than deepen the coupling, so a second channel is a join and not a fork.
4. **Timestamp reminder-worthy moments; don't derive them at render time.** Anything
   built later that creates a natural "come back" hook — an assignment due date, a
   scheduled mini-exam, a mastery window expiring — should be stored with a
   timestamp a server job can query.
5. **Produce a square 512px logo** next time anything branding-adjacent is touched.
   There is no app icon in `public/` at all, and this is the one item that is
   near-free as a side effect of other work.
6. **Keep origin derivation centralised.** `lib/auth.ts:40` builds `redirectTo` from
   `window.location.origin` in exactly one place. Keep it that way — it is the single
   site a Capacitor wrap would later have to change, and the comment in that file
   records that Supabase's redirect allow-list has already bitten once.
7. **Keep question assets static.** `public/questions/**` precaches as-is;
   runtime-generated asset URLs would not.
8. If a notification-preferences route ever appears, `lib/pageTitles.ts` needs a rule
   for it (project convention).

## Effort summary

| Increment | Evenings |
|---|---|
| 1 — installable PWA | 2–3 |
| 2 — subscription + consent | 3–4 |
| 3 — send path | 3–4 |
| 4 — measurement | 1 |
| iOS install hint | 1 |
| **Total** | **~10–13 (1–2 weeks)** |
