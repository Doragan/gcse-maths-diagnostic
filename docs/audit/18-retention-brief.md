# Retention brief — input for a Fable diagnosis session

_Assembled 2026-09-11 from `analytics_events` (last 60 days, internal traffic
excluded), `students`, `practice_attempts` and the email-send tables, all read-only.
Aggregates and opaque ids only — no emails or names were fetched._

**Purpose.** Everything a diagnosis session needs to decide **where the funnel
leaks worst and what to do first**. The output is a ranked recommendation, not
code.

---

## 0. Read this first — corrections to earlier figures

- **"94% of visitors never try a question" is wrong** (it came from the
  2026-09-02 funnel). It treated *tried the homepage demo* (6%) as *tried any
  question*, ignoring the larger number of sessions that practise on
  `/practice` directly. It was also counted in sessions (browser tabs), not people.
- **The true figure can't be measured with current tracking.** Anonymous
  practice emits nothing per answer. The only trace is
  `practice_signup_prompt_shown`, which fires at the **3rd** answer
  (`components/practice/SignUpPrompt.tsx`). A session that answers one or two
  questions and leaves is indistinguishable from one that reads the page and leaves.

## 1. Top of funnel (60 days: 2026-07-13 → 2026-09-11)

Sessions = distinct `session_id` (one browser tab, reset on tab close).

| Segment | Sessions | Answered ≥1 (hard evidence) | Reached a question page, no evidence | Single event only |
|---|---:|---:|---:|---:|
| All external | 3,884 | **18.5%** | 59.8% | 37.0% |
| Ad-attributed (gclid/utm) | 1,666 | **32.2%** | 53.0% | 24.0% |
| Not ad-attributed | 2,218 | 8.1% | 64.9% | 46.7% |

**Correction (2026-09-11, same day):** the "reached a question page" column above
counts `/practice` itself, which is the mode picker, not a question, so it
overstates the grey zone. Recounted on the real question screen
(`/practice/question/[id]`), leaving out sessions that *landed* on a question URL:

| Segment | Sessions | Answered | Saw a question, no evidence (0–2 answers) | Stopped at the picker | Other / bounced |
|---|---:|---:|---:|---:|---:|
| All (excl. question-URL landings) | 2,690 | 24.3% | 28.5% | 15.4% | 31.8% |
| Ad-attributed | 1,657 | 32.1% | 38.7% | 15.1% | 14.1% |

So for ad traffic, "never tried" is between **29% and 68%**, and 15% reached the
picker but never pressed Start.

**Signup prompt funnel (60 days):** shown 459 → clicked 32 (7.0%; Google 25,
email 7) → `signup_success` in the same session 15. Ad traffic: 408 → 24
(5.9%) → 13. That matches the summer baseline of ~5.4% shown→clicked in
`project_ad_campaign`. Ad traffic is the cleanest human signal. Non-ad traffic is heavily
polluted: 78% of it is one page with nothing but a page view or cookie-banner click.

**By landing page:**

| Landing page | Sessions | Answered | Single event |
|---|---:|---:|---:|
| `/practice` | 1,446 | 26.8% | 23.4% |
| `/practice/question/[id]` | 1,196 | 5.3% | 40.7% |
| `/` (homepage with demo) | 1,033 | 25.1% | 50.0% |

The 1,196 question-page landings are **not ads (0.6%) and not signed-in students
(0.6%)**. In-app navigation to a question uses `router.push` (same tab, same
session), so a *new* session starting on a question URL is a new tab, a
restored tab, a shared link, or a crawler. Their origin is unknown and they drag
every "all traffic" ratio down. There is no sitemap, so question URLs aren't
submitted for indexing.

Ads land on `/practice` (1,188 sessions) and `/` (469). `/practice` shows a
mode picker with a start button (`startPractice`), not a question.

**By week** (ads paused w/c 2026-08-10, **restarted w/c 2026-09-07**):

| Week | Sessions | Ad | Answered | Signups |
|---|---:|---:|---:|---:|
| 07-13 | 552 | 303 | 21.0% | 8 |
| 07-20 | 685 | 352 | 16.8% | 6 |
| 07-27 | 659 | 369 | 21.7% | 8 |
| 08-03 | 705 | 300 | 16.6% | 8 |
| 08-10 | 274 | 7 | 18.2% | 2 |
| 08-17 | 165 | 4 | 12.1% | 2 |
| 08-24 | 150 | 0 | 9.3% | 2 |
| 08-31 | 181 | 4 | 3.3% | 1 |
| 09-07 (partial) | 513 | 327 | **26.5%** | **10** |

## 2. After signup

From the app's own `computeUsage` (`lib/adminUsage.ts`, as shown on `/admin/usage`):

- **67 students**, 2,056 attempts. **10 have ever returned on a second day (15%).**
- 4 have premium access (this includes manual grants; the memory records 3 payers).
  `subscription_started` events: 0, because the event was added after those purchases.

| Signup cohort | Signed up | Practised | Engaged (6+) | Returned another day | Retained |
|---|---:|---:|---:|---:|---:|
| 2026-05 | 4 | 4 | 4 | 4 | 2 |
| 2026-06 | 11 | 6 | 6 | 2 | 1 |
| 2026-07 | 27 | 24 | 19 | 3 | 1 |
| 2026-08 | 14 | 13 | 10 | 1 | 0 |
| 2026-09 (≤11 days old) | 11 | 9 | 6 | 0 | 0 |

May is almost certainly the maintainer's own or known accounts. The pattern
from the 2026-09-01 analysis holds: **people who sign up do a real first session,
then don't come back.** Summer is a real confound (no exam pressure). September
is the first honest test, and its cohort is too young to read yet.

## 3. Re-engagement machinery — state today

- **Re-engagement email** (`app/api/cron/reengagement`, daily at 16:00 UTC):
  24 sends to 13 students, **0 clicks**. It is firing (latest sends 2026-09-05
  and 2026-09-08). Deliverability was unresolved as of the last memory note.
- **Weekly-goal nudge** (`app/api/cron/weekly-nudge`, Saturdays at 10:00 UTC,
  shipped 2026-09-01): **0 sends ever**. That's either no eligible students
  (it needs opt-in, ≥3 answers this week and still short of the goal) or a
  failure. **Unverified**: needs the Vercel cron logs.
- Email opt-in was 26% at the last check. Today's count couldn't be read from
  the script, so re-check it in the admin view.

## 4. Known unknowns (measurement gaps)

1. No event for the 1st and 2nd anonymous practice answers, so "tried a
   question" can't be measured. A single `practice_question_answered` event
   (first answer per session) would close this.
2. Sessions are tabs, not people. There is no persistent anonymous id, so a
   returning anonymous visitor is invisible.
3. The origin of 1,196 question-page landings (new tabs? crawlers?) is unknown.
   No user agent or referrer is stored.
4. Anonymous practice lives in local storage until signup
   (`pending_practice_migrated`: 26 sessions), so pre-signup depth is only
   visible for people who later sign up.

## 5. Journey map (code to read)

| Step | Code |
|---|---|
| Homepage demo | `app/Landing.tsx` (`demo_question_answered`) |
| Practice entry | `app/practice/page.tsx` (mode picker, `startPractice`) |
| Question screen | `app/practice/question/[id]/page.tsx` |
| Signup prompt (3 / 15 / every 15 after 30) | `components/practice/SignUpPrompt.tsx` |
| Tracking | `lib/analytics.ts` (`trackEvent`, `getSessionId`, attribution) |
| Weekly goal | `lib/skills/weeklyGoal.ts` |
| Re-engagement / nudge | `app/api/cron/reengagement`, `app/api/cron/weekly-nudge` |
| Usage report | `lib/adminUsage.ts`, `app/admin/usage` |
| Deferred PWA/push plan | `docs/audit/13-pwa-push-plan.md` |

## 6. What the Fable session should produce

1. **Diagnosis:** where the biggest *recoverable* leak is — arrival to first
   question, first question to signup, or day 1 to day 2 — with the evidence
   and an honest confidence level. Separate what the data shows from what it
   can't show.
2. **Instrumentation first?** If the leak can't be located without better data,
   name the smallest tracking change that would locate it, and how long it must
   run (the ads are live again, so data accrues fast).
3. **1–3 interventions,** ranked by expected impact per unit of effort, each
   with the metric that would show it worked and a threshold for giving up.
4. **What not to do,** including anything that looks attractive but the data
   says won't move the needle.

Constraints: aggregates and opaque ids only (no PII in queries). Children's
Code applies to student-facing changes. Don't recommend work that duplicates
what's already shipped (see §3 and `project_engagement_stats`).
