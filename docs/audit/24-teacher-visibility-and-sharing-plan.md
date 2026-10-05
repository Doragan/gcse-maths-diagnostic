# Teacher visibility + sharing — scope

_Scoped 2026-10-03, from a feature-exploration session. Three increments, in the
order they should be built. Parts 1 and 2 are surfacing work on data and
machinery that already exist; Part 3 is a design decision with a recommendation
and no build until its gate is met._

## The standing caveat

The teacher surface has never been used by a real class. Two teacher accounts
have ever existed, none has completed signup since April, the class diagnostic
has been unused since April, and zero paper sittings have been recorded
(`docs/audit/20` §7, `docs/audit/23` §1.1).

The repo already has a rule about this, written as a post-mortem into
`20260915_class_invitations.sql`: teacher features should not be built before a
real class has used the existing ones. That migration is a live-but-dead table
because the rule was broken.

This plan respects it two ways. Part 1 is deliberately small and adds no schema,
no RPC and no read surface, so it is cheap to be wrong about. Part 3 is gated on
a real class actually running an assignment.

The one thing worth noting against the caveat: `docs/audit/23` §1.1 identifies
that the teacher-visible reason to pay **already exists and is unsold** — the
readiness table is fed by mini-exams, and a free pupil gets
`FREE_MINI_EXAMS_PER_MONTH` (one) per calendar month, enforced in
`app/api/exam/quota/route.ts`. A class of free pupils therefore gives a teacher
one data point per pupil per month: a near-empty table. The seat is what fills
the dashboard. Nothing in the product or the sales docs says so. That is a
dashboard change and a sales argument at the same time, and it is the strongest
candidate for a fourth increment here.

---

## Part 1 — Effort surfacing (Increment A)

### Why

Mastery is a slow-moving number. A class can work hard for a fortnight and move
the headline figure by two points, so the dashboard reads as dead even when the
class is active. Volume moves daily.

### What already exists

Most of this is computed and barely shown.

| | where |
|---|---|
| `totalQuestions`, `questionsThisWeek`, `lastActive` per student | `lib/teacherAnalytics.ts:58` (`StudentAnalytics`) |
| ...rendered as one sentence inside a modal | `components/StudentDetailModal.tsx:86` |
| Class-level `questionsThisWeek` | `components/ClassAnalytics.tsx:70`, half a line of header text |
| Weekly series with `activeStudents` already per point | `TimelinePoint`, `lib/teacherAnalytics.ts:73` |
| Unbounded attempt rows incl. `attempted_at` | `get_class_skill_mastery` RPC — returns every member attempt, no date window |

**So there is no new data to fetch.** Questions-per-week for the last ten weeks
is computable from rows the page already has.

### A1 — An effort series on the weekly trend

Add `attempts: number` to `TimelinePoint` and populate it in
`computeClassMasteryTimeline` (`lib/teacherAnalytics.ts:153`). Note the existing
loop filters attempts to `<= cutoff` cumulatively; the effort figure wants the
attempts **in** that week, not up to it, so it is a separate tally rather than a
reuse of `upTo`.

Rendering: `ClassMasteryTrend` is a nice small SVG but hardcodes `masteryPct`,
the `%` axis labels and the "now X%" caption. Extract the SVG body into a
`WeeklySparkline` taking `points`, a value accessor and an axis formatter, and
leave `ClassMasteryTrend` as a thin wrapper so `StudentDetailModal.tsx:92`
keeps working unchanged. Then an effort chart is a second wrapper.

Keep the `< 2 weeks with data → render nothing` guard. It is right.

### A2 — Roster table: an Activity view, not two more columns

The per-student table is `tableLayout: 'fixed'` with `Student` at 30%, then
`Mastery`, `Exam`, up to five topic columns and a chevron, at
`minWidth: 380` (`components/ClassAnalytics.tsx`). It is already tight on a
phone. Adding `This week` and `Last active` as two more columns would break it.

Instead: a small two-state toggle above the table — **Mastery** | **Activity** —
that swaps the five topic columns for `This week`, `Total`, `Last active`. Same
rows, same row-click-to-modal, same `Student` column. One table, two views.

Make both views sortable by their numeric columns. The current fixed sort is
mastery-descending (`ranked`, line 62); in the Activity view the useful default
is `lastActive` descending.

### A3 — The header line

`{studentsWithData} of {studentCount} active · N answered this week` is doing
two jobs badly. In the Activity view it should read as counts a teacher can act
on: students active this week, questions this week, questions all term.

### Rules this increment must not break

- **No qualitative descriptors.** `docs/audit/12` decision 2 bans
  "strong / developing / concern" and the mastery and exam columns both follow
  it. Effort data is *more* tempting to label and *more* damaging when labelled.
  Concretely: a student with 0 this week renders `0` in `colors.textHint`, never
  in `colors.danger*`, and there is no "inactive" chip, no red row, no sort
  category called "needs chasing". A teacher reads the number and decides.
- **No per-question or per-session timing.** Volume and recency only. Anything
  finer reads as surveillance and is the wrong signal anyway.

### One inconsistency to fix while here

Mastery excludes placement attempts (`a.kind !== 'placement'`,
`lib/teacherAnalytics.ts:211`) but the engagement counts do not
(`totalQuestions: attempts.length`, lines 261–265 and 281). A student who has
only sat the placement test therefore shows a real `totalQuestions` and a recent
`lastActive`, but `overallMastery` is null — so they are simultaneously "not
active" in the header count and visibly active in their row.

Decide one way and apply it to both. Recommendation: **count placement in
effort, exclude it from mastery** (it is real work the student did, and hiding it
makes a keen new student look idle) — but then `studentsWithData` must stop
being the definition of "active" in the header, because it is a mastery-side
figure. That is the actual bug.

### Tests

`computeClassMasteryTimeline` is pure and already the right shape to test. Cover:
a week with attempts between two empty weeks (0, not a gap); the cumulative
mastery figure unchanged by the new per-week tally; placement handling per the
decision above.

---

## Part 2 — The parent-pay prompt (Increment B)

### Why

All three paying customers are returning students, and the one payment path a
13-year-old can actually complete is handing it to an adult.

### What already exists — effectively all of it

| | where |
|---|---|
| Signed, expiring share token | `lib/parentPay.ts` (`signPayToken` / `verifyPayToken`), tested |
| Link generation for the logged-in student | `app/api/parent-pay/link/route.ts` |
| Public parent page + checkout + webhook reuse | `app/pay/[token]/`, `app/api/parent-pay/checkout/route.ts` |
| Student-side UI: generate, copy, `navigator.share`, prefilled email | `app/student/upgrade/page.tsx:286–320` |
| Intent plumbing (`?want=` → a sentence) | `lib/studentPlans.ts:111`, rendered at `upgrade/page.tsx:172` |
| `parent_pay_link_created` event | `upgrade/page.tsx:96` |

**Nothing needs building.** The gap is placement and timing.

### The gap

Every student-side wall funnels to `/student/upgrade`
(`practice/page.tsx:339` and `:594`, `skill/[slug]/page.tsx:725`,
`student/dashboard/page.tsx:213`, `:222`, `:692`,
`components/exam/ExamRunner.tsx:366`). That page then presents, in order: the
`?want=` sentence, a plan selector, a features list, and *then*, last, the
parent box.

So a reader with no card is shown a card-shaped page and has to scroll past two
blocks of pricing to reach the only door they can open.

### B1 — Two doors at the top

When the student arrives from a wall, render a two-option chooser above the plan
selector: **Pay yourself** / **Ask a parent or guardian**. Choosing the second
reveals the existing parent box in place (and generates the link immediately,
rather than behind a further "create link" tap) and collapses the plan selector
to a line of small print. Choosing the first is today's page.

Do not try to infer which door to preselect. There is no age signal to use, and
guessing wrong on this page is expensive.

### B2 — Offer it at the quota wall

`QuotaNote` already takes `onUpgrade` and renders when
`!quota.isPaid && quota.remaining === 0` (`ExamRunner.tsx:366`, `:420`). Add a
second action, "Ask a parent", deep-linking
`/student/upgrade?want=exam&ask=parent` so B1's second door opens pre-selected.

This is the highest-intent moment in the product: the student wanted another
paper and was stopped.

### B3 — Instrument the share, not just the link

`parent_pay_link_created` fires on generation. Nothing fires when the student
actually copies, shares or emails it, and nothing fires when a parent opens the
page. Three events needed:

- `parent_pay_link_shared` with the method (`copy` / `share` / `email`) —
  `upgrade/page.tsx:108`, `:118`, `:129`
- `parent_pay_page_viewed` on `app/pay/[token]`
- `parent_pay_checkout_started`

Without the middle two, "link created" cannot be distinguished from "link sent"
or "parent looked", which is the entire funnel this increment is trying to move.
`lib/analytics.ts:164` already normalises the token out of the path, so the
page-view event is safe to add.

### Measurement honesty

Three payers total. This increment cannot be A/B tested to significance and
should not pretend otherwise. Judge it on the funnel events (does a link get
shared at all, does a parent open it) rather than on conversion.

---

## Part 3 — Live session progress: the polling-vs-realtime call

### Recommendation: poll. Build no realtime.

Not as a compromise — polling is the prerequisite for realtime, so it is the
first step of either path.

### The facts that decide it

1. **Realtime is permitted today.** `aa_teacher_select` on `assignment_attempts`
   already allows a teacher who owns the assignment to SELECT
   (`20260611_rls_baseline.sql:88`), and no table-level REVOKE covers that
   table. So this is *not* blocked by the lock-down work — an earlier reading
   that it was is wrong.
2. **There is no realtime anywhere in the codebase.** Zero `.channel()` or
   `postgres_changes` calls across `app`, `lib` and `components`. This would be
   the first, including the publication migration to add the table to
   `supabase_realtime`.
3. **A realtime payload is a raw row.** The teacher view needs per-student
   aggregates joined to `display_name` / `year_group`, which the existing
   snapshot gets by resolving targets → classes → memberships → students in
   `app/api/assignments/[id]/results/route.ts` under the service role. A change
   event carries `student_id` and nothing nameable.
4. **So realtime cannot replace the snapshot, only supplement it.** You would
   still call the route for the initial state, then maintain a second code path
   that merges a stream of INSERTs into those aggregates and re-derives
   `is_complete` against `completion_mode` client-side — a duplicate of logic
   that currently exists once, server-side.
5. The RLS gate is a function call (`teacher_owns_assignment`) evaluated per
   change per subscriber. Fine for thirty pupils; it is simply not free.

### Spec — the polling version

`app/dashboard/assignments/[id]/page.tsx:50` already loads results once, into
state, with `completedCount` / `startedCount` derived at `:79`. Make that
refetchable and:

- Poll every **10s while the tab is visible**; stop on
  `document.visibilityState === 'hidden'` and refetch once on return.
- Stop after ~45 minutes with no observed change, with a "resume" affordance. A
  teacher leaves tabs open for days.
- Add a **head probe** — `GET /api/assignments/[id]/results/head` returning
  `{ attemptCount, lastAttemptAt }` from a single count+max query — and only
  refetch the full payload when either changes. The full route runs four or five
  queries; at 10s that is ~360 full recomputes per hour per open tab, which is
  worth avoiding before it exists rather than after.
- Add `lastAttemptAt` per student to the results payload so "answering now"
  (within the last ~2 minutes) is derivable without new tables.
- Render it as presence and progress only: who has started, how far, who last
  answered when. Per the Part 1 rules — **no "stuck" badge, no idle-time
  callout**, and the same ban on descriptors applies.

### Gate

Build this when a real class runs a real assignment, or when there is a
scheduled pitch it would be demoed in. It is the only teacher feature that gives
someone a reason to open the dashboard *during* a lesson, which is the habit
every other teacher feature depends on — and it is also the one that is useless
without a live class, so it is exactly the feature `docs/audit/19` §4 is about.

### When to revisit realtime

More than ~60 pupils live at once, two or more teachers watching the same class,
or a desire to push to a device the teacher is not looking at. None is true now.

---

## Student-to-student sharing — why it is not an increment here

Raised in the same session and deliberately left out. Day-1-to-2 is the leak:
10 of 56 students have ever returned on a second day (`docs/audit/18`). A
referral mechanic on a bucket that leaks that fast recruits people to churn, and
spends the goodwill of the handful of engaged students, which is the one thing
that cannot be re-spent.

If it is built anyway, the constraints are:

- Share a **challenge**, not a profile — a question or a five-question set, not
  "look at my score". A link carrying a display name and marks for a 13-year-old
  is a safeguarding surface, and `docs/audit/21` is live and specific about
  exactly this.
- Tokens non-enumerable, carrying no identifying detail, on the `lib/parentPay.ts`
  pattern.
- With no incentive it is a top-of-funnel ad unit, not a referral programme, and
  should be measured as one. With an incentive, the margin maths at £1.49/mo
  needs doing first.

The weekly goal (10 questions across 2 days) is the natural shareable object and
is already a pure clock-injected function, so it is the cheapest starting point
if this is ever picked up.

---

## Build order

| | increment | gate | cost |
|---|---|---|---|
| 1 | Part 1 — effort surfacing + the placement/active inconsistency | none; no schema, no RPC, no new read surface | small |
| 2 | Part 2 — parent-pay doors + share instrumentation | none | small |
| 3 | §"The standing caveat" — say on the dashboard that seats fill the readiness table | wants a sales conversation to be real | small |
| 4 | Part 3 — live progress by polling | a real class running an assignment | medium |
| — | realtime | the §"When to revisit" conditions | large |

## Pointers

- `docs/audit/12-teacher-exam-readiness-plan.md` — the no-descriptors rule
- `docs/audit/20-school-accounts-design.md` §9, §10 — the teacher paid line
- `docs/audit/23-school-proposition-red-team.md` §1 — the unsold seat
- `supabase/migrations/20260915_class_invitations.sql` — the don't-build-ahead rule
- `docs/audit/18-retention-brief.md` — why student-to-student sharing is not here
