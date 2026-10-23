# The teacher dashboard's front door

_Reviewed and changed 2026-10-21. A review of the whole teacher surface, three
layout options, and the smallest of them built. The options are on a canvas
rather than in here; this records what was decided and why._

## What the review found

Counted in the code, not inferred from usage:

| | |
|---|---|
| Page routes under `/dashboard` | 16 |
| Flat nav buttons, no hierarchy | 7 |
| Ways to give pupils work | 5 — legacy diagnostic, assignment (picked), assignment (pool), mini-exam, class session |
| Ways to read how they did | 5 — legacy results, class analytics, student page, assignment results, session live view |

Each arrived for a reason and none replaced the one before it, so a teacher
chooses between overlapping tools with no guidance on which is for what.

**And `/dashboard` itself was the legacy join-code diagnostic** — a "New
assessment" form and a list, nothing else. Correct when it was the only teacher
feature; left in place as five others were built around it. Nothing has been
submitted to it since **4 April**, and it offers GCSE Foundation and Higher
only, so it cannot serve the International GCSE courses the rest of the app has
served since PR #140.

## ⚠ Usage numbers are not evidence here, and the first draft of this misused them

The first version of the review led with counts — 5 teacher accounts, 2
classes, 1 assignment with 0 answers — and drew conclusions from them. The user
pushed back, correctly: **with no real teacher use, those numbers measure the
absence of teachers, not the merit of features.** "0 answers to set work" says
nothing about assignments, because nobody was there to set one.

The worst instance was presenting **17 mini-exams sat** as "the one with real
use". `exam_sessions` is written when a *pupil* starts a mini-exam from
`/student/exam`. It is not a teacher action at all, so it was a student-side
number in a row about teacher surfaces, with a conclusion drawn from it.

What the counts legitimately do is **bound the risk** of changing things:
nothing here is load-bearing, so changes are cheap and reversible. That is an
argument about safety, not about merit, and it is the only way they are used
below.

The front-door argument needs no usage data at all: it is what the *next*
teacher sees first, and it points at a GCSE-only flow with nothing recent in it.

## The three options

On the canvas (the artifact titled "Teacher dashboard — layout options"):

- **A — Fix the front door only.** Keep the nav; replace the hub's content with
  what a teacher can do today. The legacy flow moves behind a link.
- **B — Students first.** Promote `docs/audit/26`'s flat "My students" to the
  landing page; nav collapses to four; classes become a filter, not a
  destination. The tutor-shaped bet.
- **C — Today, then records.** Split by time: what is happening in the room now
  above, everything persistent below. Makes the freemium line visible in the
  furniture.

**Chosen: A.** Not because the evidence favours it — there is none either way —
but because with no data to favour anything, a rebuild bets on an unknown, and
B and C point in different directions depending on whether this becomes a tutor
product or a class product. One real lesson settles that for free.
`docs/audit/24` carries the same rule as a post-mortem.

## What was built

1. **`/dashboard` is now a landing page.** Three cards: *Run a lesson* (start a
   class session, plus set work / set a mini-exam / mark a paper), *Your
   students*, and a quiet link to the older diagnostic — shown only when the
   teacher has any.
2. **`/dashboard/assessments`** holds the legacy flow, create form and all.
   `/dashboard/[id]` (its results page) now returns there rather than to the
   hub.
3. **A page-title rule** for the new route, above the `/dashboard/[id]`
   catch-all that would otherwise swallow it.

**No new reads.** `getTutorStudents()` already returns per-student analytics
across every class a teacher owns, built for the tutor view in
`docs/audit/26` §4.2. The landing page calls it and shows five rows.

### Two decisions worth recording

**The legacy diagnostic was MOVED, not retired.** Nothing else replaces it: an
adaptive placement across the curriculum needing no pupil accounts. A class
session is the modern no-accounts flow but does something different — practice
on skills the teacher picks, not an adaptive diagnostic — so deleting it would
remove a capability rather than tidy one. Its GCSE-only limitation is now stated
on its own page. **Retiring it properly is still available and is the user's
call**; the argument for it is that every new one an iGCSE teacher creates
serves the wrong content.

**"Who needs a look" was renamed to "Your students".** The approved mockup used
that heading, sorted quietest-first. `docs/audit/12` decision 2 bans qualitative
descriptors on this surface — "no sort category called 'needs chasing'" — and a
heading breaks that rule exactly as a chip would. The sort is kept, because a
sort is a sort; the verdict in the title is not. A zero this week renders in
`textSecondary`, never in danger red, and there is no row highlight.

## Not verified

The rendered page. Both routes compile and return 200, the signed-out guard
redirects, the suite is green and the production build is clean — but
`/dashboard` is behind a teacher login and nobody has seen it draw. That is one
sign-in away for the user and worth doing before this is believed.

## Pointers

- The canvas — "Teacher dashboard — layout options": the review and all three options
- `docs/audit/26-one-to-one-tutor-dashboard.md` §4.2 — `getTutorStudents`, reused here
- `docs/audit/24-teacher-visibility-and-sharing-plan.md` — the standing caveat, and Part 1's rules
- `docs/audit/12-teacher-exam-readiness-plan.md` decision 2 — the no-descriptors rule
- `docs/audit/29-no-login-class-session-plan.md` — the class session the new front door leads with
