# Retention diagnosis — answer to `18-retention-brief.md` §6

_Written 2026-09-11 from the brief, the memory notes and the journey-map code. No
queries were run for this document; every number is from the brief or the
2026-09-01 baseline unless marked as computed from them._

> **Verification, 2026-09-11 (after this was written).** Checked against the code
> and a fresh read-only recount:
> - **Confirmed:** `WEEKLY_GOAL` = `SESSION_LENGTH` = 10; the summer landing-page
>   split figures; `signup_success` firing at email submit, before confirmation
>   (`app/student/page.tsx`).
> - **Confirmed, and it was an error in the brief:** "reached a question page"
>   counted the `/practice` picker. On the real question screen, ad sessions are
>   32% answered / 39% saw a question with no answer evidence / **15% stopped at the
>   picker**. The brief's §1 now carries the corrected table.
> - **Wrong:** the signup-prompt funnel *had* been reported (summer shown→clicked
>   ≈ 5.4%). Now: 5.9% of ad sessions (7.0% overall), and only 15 of 32 clickers
>   finish signing up in the same session, so intervention 3's second branch
>   (losing people after the click) looks like the live one.
> - **Unverified:** "the auth trigger creates the `students` row before
>   confirmation". The `handle_new_user` in migrations skips students, and no
>   repo SQL or app code creates an email student's row, so the trigger lives
>   only in the live DB. Settle it with an aggregate count of
>   `auth.users.email_confirmed_at is null` joined to `students`.

Confidence key. **High**: measured directly, in people, no obvious confound.
**Medium**: measured but confounded, small-n, or per-tab. **Low**: inferred
from code or a bound, not measured.

## 1. Diagnosis

**The biggest measured leak is day 1 to day 2. It is the one to fix first, but not
with the tools that exist today.** The biggest *unmeasured* leak is inside the
first anonymous session, and one event is needed before anyone can size it.
First-question-to-signup is the best-instrumented step and the only one where a
query, not a build, is the next move.

### What the data shows

- Excluding May's 4 known accounts, **6 of 63 signups ever returned on a second
  day**. Among Jul+Aug signups who did 6+ questions, at most 4 of 29 returned
  (14%). **High.** Counted from `practice_attempts` and `students`, so it is
  people, not tabs. `daysActive` counts UTC dates, so the true figure is if
  anything lower.
- The loss is not disinterest. July: 24 of 27 signups practised, 19 did 6+.
  August: 13 of 14 and 10. People sign up, do a full session, and vanish. **High.**
- Ad traffic does try the product: 32% of ad sessions have hard evidence of
  answering (3+ practice answers or a demo answer) and 85% reach a question page.
  **Medium-high** (session = tab, but ad sessions rarely duplicate).
- Signups per answering session: 47 signups over ~718 answering sessions in 60
  days, about 6.5% per tab, 1.2% of all sessions. **Medium** (per-tab
  understates per-person; `signup_success` fires at email submit, before
  confirmation).
- All three payers are returners. **Low** as evidence (n=3), but it is why
  returners, not signups, are the number that matters for the parent-pays funnel.
- The Sept cohort (0 of 11 returned) is ≤11 days old and mostly ≤4 days.
  **Uninformative** for another ~3 weeks.
- The weekly-goal nudge's "0 sends ever" is not evidence of anything yet. It
  shipped 2026-09-01; the only Saturday since was 5 Sept, in the ad-paused
  trough (181 sessions, 1 signup that week). **The first informative run is
  Saturday 12 Sept 10:00 UTC.** **High.**

### What the data cannot show

- **How many of the 53% grey ad sessions answered 0 vs 1–2 questions.** A
  definitional flag: for ads, 24% single-event sessions exceeds the 15% that
  "never reached a question page", and ads land on `/practice` (a mode picker)
  or `/`. So "reached a question page" must be counting `/practice` itself, and
  the grey zone may include sessions that never pressed Start. Pin the
  definition before instrumenting.
- **Why non-returners don't return.** Nothing is measured between the 10-question
  checkpoint on day 1 and the day-4 email. No event distinguishes a student who
  saw a reason to come back from one who didn't.
- **Whether the summer level is the true level.** Jul/Aug signups had no exam
  pressure. The trend inside the summer (18% → 11% → 7%) is not explained by
  season, but broader ad targeting confounds it.
- **Whether the re-engagement email works.** 0 of 24 clicks is consistent with a
  5% click rate (probability 29%) and happens 8% of the time at 10%.
- **Anonymous return visits.** Sessions are tabs. A student who practises
  anonymously on three evenings is three non-converting sessions.
- **Whether the zero-attempt signups are real accounts.** The auth trigger
  creates the `students` row at signup, before email confirmation, and
  `signup_success` fires at submit. So the 9 zero-attempt students in the
  baseline may be unconfirmed email signups. One aggregate count of
  `auth.users.email_confirmed_at is null` answers it. **Low-medium** as a
  hypothesis; it changes the base of every cohort rate.

### Why day 1→2 is only conditionally recoverable

The only mechanisms that act after day 1 are email (26% opt-in cap, unproven
click rate) and the weekly goal. From the code: `WEEKLY_GOAL` is 10 and
`SESSION_LENGTH` (the measured median sitting) is also 10. A typical engaged
first session therefore **completes the week's goal in one sitting**. The card
then shows green until Monday, and the Saturday nudge, which only selects
students short of the goal, has nothing to say to exactly the students who are
about to lapse. The product's one in-app retention mechanic is satisfied by the
behaviour that precedes the cliff. **Medium**: the logic is straight from
`lib/skills/weeklyGoal.ts` and `lib/practice/session.ts`; the effect of changing
it is untested.

## 2. Instrumentation first?

Yes for the first session; no for day 1→2, which is already measured cleanly
(what is missing there is cause, and no event supplies cause).

**Smallest change:** one event, `practice_question_answered`, fired from
`recordAttempt` for anonymous sessions at answers 1 and 2 only (the 3rd already
fires `practice_signup_prompt_shown`). Properties: `questions` and the landing
page. Two rows per session at most, no PII, same first-party basis as the
existing events.

**How long to run:** the grey zone is ~240 ad sessions a week at the current
pace (327 ad sessions in the partial week of 7 Sept). **One week** tells you
whether it is mostly zero-answer or mostly 1–2-answer sessions (±6%). **Two
weeks** before quoting the number. If it is mostly zero-answer, the leak is the
question page itself (load, input, first-question difficulty). If mostly 1–2,
the leak is questions 1–2 → 3.

**Three zero-code reads to do alongside** (aggregates and opaque ids only):

1. The signup-prompt funnel, already instrumented and never reported:
   `practice_signup_prompt_shown` → `practice_signup_prompt_clicked` (by
   `method`) → `signup_success`, plus the demo equivalents.
2. Count of students with no confirmed email.
3. The Vercel cron log for `weekly-nudge` after 12 Sept 10:00 UTC. If it
   reports zero eligible, the selector is too narrow (see §1); if eligible but
   zero sent, it is a bug.

**Optional, not smallest:** a persistent anonymous id in `localStorage` attached
to `page_view` (turns tabs into browsers; it is a persistent identifier, so it
needs a line in the privacy notice under the Children's Code), and
`document.referrer` on `page_view` (explains the 1,196 question-page landings).
Don't block on either.

## 3. Interventions, ranked by expected impact per unit of effort

"First" here means cheapest per expected gain, which is not the same order as
leak size.

**1. Landing-page split on the live Students ad group (zero code).** Summer:
Students → `/practice` practised 78%, signed up 1.18%; Parents → `/` practised
28%, signed up 2.70%. Audience and landing page are confounded, and the autumn
campaign relaunched with the same pairing. Duplicate the Students ad group with
final URL `/`. Metric: `signup_success` per ad session by `landing_page`, from
first-party `gclid` rows. Decision point: ~200 sessions per arm, about two weeks
at 23 Students sessions a day. Give up: if neither arm reaches 1.5× the other on
signups per session, the landing page is not the lever; keep whichever practised
more.

**2. Make the weekly goal need two days, and say so at the checkpoint.** For
example "10 questions on at least 2 days this week". `computeWeeklyGoal` is pure
and clock-injected, the 10-question summary already opens at exactly the moment
a student is deciding to stop, and the Saturday nudge's "short of goal" test
follows automatically, so students who did 10 on Monday become eligible for it.
Randomise by student-id parity so the autumn season does not confound the
before/after. Metric: share of engaged (6+) signups returning within 7 days,
baseline 14%. Give up: 60 engaged post-change signups (six to eight weeks at ad
pace) with treatment under 20% or not above control. Children's Code: keep it a
goal, no loss-aversion countdowns, no "you'll lose your streak" copy.

**3. Fix the signup-prompt step after the funnel query, not before.** If
shown→clicked is under ~5%, the offer is weak: change what the account is for
(the anonymous product is full-featured, so "save your progress" is a small
promise). If clicked→success is low, the email path (13+ check, confirmation
round-trip, then routing into a 5-minute placement test) is losing them: make
Google the only path from the prompt, or stop confirmation blocking the return.
Metric: `signup_success` per `practice_signup_prompt_shown` session, baseline from
the query. Give up: ~300 prompt-shown sessions (about two weeks) with no lift.

## 4. What not to do

- **Don't build PWA/push now.** The plan's own note says push fixes lapse, not
  bounce; its reach is capped by a permission prompt the way email is by opt-in;
  10–13 evenings to add a second pipe to a message that hasn't been shown to work.
- **Don't rewrite the re-engagement email or redo deliverability.** 0/24 is not
  evidence, the seed test landed in the inbox, the cadence was already lifted,
  and volume arrives with the ads. Read it at 100+ sends.
- **Don't change the email opt-in default.** Compliance cost, and reach is not
  what stops day 2: the product has no day-2 hook for the 74% either way.
- **Don't spend the ad credit faster to move the numbers.** At a 10–15% return
  rate, signups are not the scarce thing.
- **Don't touch the placement test on retention grounds.** 89% of signups
  practise, and the handoff was just fixed in PR #64.
- **Don't investigate the 1,196 question-page landings.** 0.6% ads, 0.6%
  students, 41% single-event. Exclude them from every all-traffic denominator and
  headline the ad-attributed rates instead.
- **Don't A/B signup copy before the funnel query.** You would be guessing which
  of two steps is leaking.
- **Don't read the Sept cohort before about 1 October, and don't read the weekly
  nudge before the 12 Sept run.**
- **Don't build the admin aggregates or peer-comparison backlog as a retention
  measure.** Nothing in the data links either to day-2 return.
- **Don't count sessions as people anywhere after signup.** Pre-signup rates are
  per tab; post-signup rates are per student. Mixing them produced both earlier
  errors.
