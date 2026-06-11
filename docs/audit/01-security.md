# Security Audit — Workstream ① (Access Control & Payments)

_Read-only static review. No code or data changed. Date: 2026-06-10._

**Method:** static review of all 16 API routes, the auth/client boundary
(`lib/supabase`, `lib/auth`, `lib/admin`, `lib/entitlements`), the Stripe flows,
the 8 migrations, secrets hygiene, and the template-eval / HTML-render surface.

**Scope limit:** this is a _code_ review. The live database was **not** queried,
so whether RLS is actually _enabled_ per table and which column REVOKEs exist is
**unverified** — see S1.

## What's already correct (do not "fix")
- **No price tampering** — Stripe price IDs are server-side env vars; client only
  sends a whitelisted `plan` key.
- **Webhook metadata is trustworthy** — `student_id`/`teacher_id` come from the
  authenticated `user.id` at checkout creation, not client input. Webhook
  signature is verified via `constructEvent`.
- **Privileged routes check ownership, not just identity** —
  `classes/[id]/members`, `assignments/[id]/results`, `classes/create` all verify
  `teacher_id === user.id` and return 404 (not 403) to avoid confirming IDs.
  Cross-account roster reads are column-scoped to `display_name`/`year_group`.
- **`account/delete`** is authenticated and scoped to the caller's own id;
  **`dev/reset-progress`** is gated to `NODE_ENV === 'development'`.
- **Secrets hygiene** — `.env*` gitignored, nothing tracked, no
  `NEXT_PUBLIC_`-prefixed secret.
- Email routes **HTML-escape** all attacker-controllable fields.

## Findings (severity-ranked)

### 🔴 S1 — RLS/REVOKE on core tables is not in version control _(High)_
Migrations enable RLS only for `analytics_events`, `classes`, `class_memberships`,
`assignments`, `assignment_*`. The most sensitive tables — **`students`,
`teachers`, `questions`, `practice_attempts`** — have no RLS or REVOKE in any
migration; that posture was applied by hand in the SQL editor.
- No reviewable/diffable source of truth; not reproducible on a new environment.
- From code alone, cannot confirm RLS is even enabled on these tables.
- The whole model (incl. S5) rests on `teachers.is_admin` and student billing
  columns being locked — which lives only in the SQL editor.
- **Action:** introspect live (`pg_policies`, `pg_class.relrowsecurity`, column
  grants); commit the exact current state as a migration. _(Read-only step.)_

### 🟠 S2 — Stripe webhook swallows entitlement-write failures _(Medium)_
`students` updates don't check `.error` and always return 200. A failed write
means **the student pays but gets no access**, and Stripe won't retry (got 200).
Also: no event idempotency; hardcoded expiry dates (`2026-12-31`, `2027-07-31`).
- **Action:** check each write, return 500 on failure; add idempotency guard;
  move expiry dates to config/relative logic.

### 🟠 S3 — No rate limiting on public endpoints _(Medium)_
`feedback` + `report-question` are unauthenticated and **send email per request**
(spam/cost). `assessment/lookup` + `classes/lookup` accept a **4-char code**
(≈10⁶) with no throttle → brute-force enumeration. `diagnostic` is open too.
- **Action:** IP/user rate limiting; captcha/honeypot on public email routes;
  consider longer codes.

### 🟡 S4 — `report-question` builds the service-role client at module scope _(Low-Med)_
Unlike `feedback` (per-request, documented), `report-question` creates the admin
client at module top-level — the documented footgun (can throw during build;
long-lived service-role client).
- **Action:** move it inside the handler.

### 🟡 S5 — Admin authoring = client code-execution on students _(Low-Med, by design)_
Question templates run via `new Function(...)` **client-side** and render via
`dangerouslySetInnerHTML` (6 components). Anyone who can write a question
(`is_admin`) can ship arbitrary JS/HTML to students. Acceptable for a trusted
admin, but hinges on `is_admin` being un-grantable — ties back to S1.
- **Action:** confirm `teachers.is_admin` is REVOKE-locked (via S1); consider a
  Content-Security-Policy as defence-in-depth.

### 🟡 S6 — `diagnostic` trusts a client-held session, no auth/validation _(Low)_
Stateless transform over a client-supplied `session`; a student can fabricate
diagnostic state/results. Fine _only if_ diagnostic outcomes are never treated as
authoritative (entitlements, teacher-visible proof). Needs a deliberate ruling.

## Suggested fix sequence
1. **S1** live introspection (read-only) → commit RLS/REVOKE as migrations.
2. **S2** webhook hardening (real money, silent failures).
3. **S3** rate limiting.
4. **S4** refactor; **S6** decision; **S5** CSP.

## Open verification (most important unknown)
Run a read-only introspection of `pg_policies` + `relrowsecurity` + column grants
on `students` / `teachers` / `questions` / `practice_attempts`. Result either
closes S1 or escalates it.

---

## Phase 0 — Half 1 results (behavioural probe, 2026-06-11)

Ran a read-only behavioural probe against the **anonymous** role (the public
surface every visitor has via the anon key). No direct Postgres connection is in
env, so `pg_policies` can't be read via REST — the probe tests *enforcement*, not
policy text.

### ✅ Anon READ surface is fully locked
Every sensitive table returns **0 rows to anon despite holding real data** — RLS
is enabled and filtering on all of them:

| table | rows exist | anon sees |
|---|---|---|
| students | 6 | 0 🔒 |
| teachers | 2 | 0 🔒 |
| practice_attempts | 244 | 0 🔒 |
| analytics_events | 1178 | 0 🔒 |
| assignments / assignment_* / classes / class_memberships | 1–3 | 0 🔒 |

- Draft questions: 2 exist, **anon sees 0** (L8 closed for the anon path). The 133
  published questions are anon-visible as intended.
- Sensitive columns on `students`/`teachers` unreachable (table filters all rows
  first).

### ✅ Anon cannot escalate (the first probe's "ALLOWED" was a framing trap)
A zero-row UPDATE probe initially read as "allowed at grant layer." Verified: the
anon **UPDATE grant is open on every table** (no `42501`), but an anonymous caller
has `auth.uid() = null`, so no `auth.uid() = id` policy can ever match a real row —
**anon can't actually write anything.** Confirmed the grant layer IS used
selectively: `anon INSERT classes → 42501` (grant-revoked), matching the
documented posture.

### ⚠ RLS is the sole UPDATE gate → column REVOKEs are load-bearing & UNVERIFIED
Because table-level UPDATE is granted to the client roles across the board (the
documented "RLS-only, no grant-layer defence" model), the **only** thing stopping
a logged-in student from `update students set subscription_tier='paid' where
id = auth.uid()` is a **column-level REVOKE** on the billing columns (and on
`teachers.is_admin`). Memory says these REVOKEs exist; the probe **cannot confirm
them** without an authenticated student session (which the agent may not create).

### Sharpened S1 → one decisive question
> Do `students.{subscription_tier, paid_until, stripe_*}` and `teachers.is_admin`
> have UPDATE **revoked** for the `authenticated` role?
> - **Yes** → S1 downgrades to "correct, just not in version control"; capture as
>   a migration (Half 2).
> - **No** → a logged-in student can self-grant premium / admin = the most serious
>   finding of the audit.

**Half 1b (user-run):** `scripts/rls-introspect.sql` answers this — query 4 is the
decisive one (billing/admin columns must be ABSENT from the `authenticated` UPDATE
grants). Its output also provides the policy text needed for the Half-2 migration.
