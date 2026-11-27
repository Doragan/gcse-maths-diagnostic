# 34 — The class predicts together

**Status:** plan, 2026-11-27. Nothing built.
**Follows:** [33 — a wrong answer opens the section that teaches it](33-section-entry-from-a-wrong-answer.md)
and [29 — no-login class sessions](29-no-login-class-session-plan.md).
**Chosen by the reviewer** as the second suggestion to scope.

## The idea

Every investigation section opens with a prediction, a question with two to
four options, each wrong one a known misconception. That is a **diagnostic
question** in the Craig Barton sense, the hinge a lesson turns on.

So the class should answer it **together, live**:

1. The teacher puts a section's prediction on the board.
2. The class answers, by hand or on their phones.
3. Everyone sees how the answers split, before anyone is told which is right:
   "nine of you think 7 pens cost £9".
4. The teacher reveals the answer and runs the "try it yourself" on the
   board, the class agreeing the rule together.

It needs no pupil accounts. A school trust that takes two months to approve a
pupil login (the trust conversation, 2026-10-20) can still use it.

## 1. What the evidence says

Measured 2026-11-27.

**The content is ready.** 19 of the 20 sections predict from options:

| | §1 | §2 | §3 | §4 |
|---|---|---|---|---|
| straight lines | grid | 3 options | 3 | 4 |
| percentage change | 3 | 3 | 3 | 3 |
| compound units | 3 | 3 | 3 | 3 |
| ratio | 3 | 3 | 3 | 3 |
| proportion | 3 | 3 | 3 | 3 |

Straight lines §1 asks the student to tap where the line will cross: fine on
a board, not something to poll from 30 phones.

**Everyone can see the same question.** `resolveAt(investigation, params)` is
deterministic, the option order included (it shuffles from a seed built from
the params). A poll only has to store the params for every device to show the
same numbers in the same order. Nothing about the investigations needs to
change for that.

**But a prediction's wrong options carry no misconception tags.** Rule-sentence
options do; prediction options never needed them. To feed a teacher "nine
expected adding the gap in pounds", about 40 wrong options need a tag from
`data/misconceptions.ts`.

**And no real class has used a class session yet.** The tables hold nothing.
That says little on its own, because the nightly sweep deletes old sessions by
design. But class sessions log no analytics events either, so there is no
record of any use, and the memory of the trust conversation says no real class
has. **This is the main risk of the whole plan: building a device version
for a classroom that has not yet tried the simpler thing.** The increments are
ordered around it.

## 2. What exists today (verified in code)

- **Sessions:** `class_sessions`, `session_participants` and `session_attempts`
  (`20261020_class_sessions.sql`).
  - Pupils join at `/s` with a four-character code and a first name.
  - Anonymous inserts are gated on the session being open and unexpired (doc 29 §5).
  - Pupils cannot read anything back.
  - Teachers read through service-role routes.
- **Refresh:** both teacher views poll every `POLL_MS` (10 s). There is no
  Realtime, deliberately (doc 29 §6.5).
- **The projector page** (`/dashboard/sessions/[id]/display`) shows the code
  and counts, and **no names ever reach it**: they are not even fetched. Any
  poll view on the board keeps that rule.
- **Common mistakes:** `session_attempts.misconception` (since 2026-10-23)
  feeds `ClassInsightsPanel`, which tells a teacher what a wrong answer *was*.
  A poll response would feed it the same way.
- **The sections already open on their own:** `?section=N` (doc 33,
  increment 1). The board needs the same, plus the draw.

## 3. The decisions

### D1 — Start with the board, and no phones

**Recommended.** The first increment needs no devices, no data and no
migration: **a board mode for any section.**

- **The prediction at projector size**, with its options lettered A, B, C.
  The class answers by hand or on mini-whiteboards, the way hinge questions
  are usually run.
- **A "Reveal" button** marks the right option and shows the working.
- **Then the try-it**, at projector scale, for the teacher to drive while the
  class says what to try.
- **The rule**, for the class to agree aloud before the teacher picks it.

It is useful in a lesson tomorrow. It is what a named teacher can be shown,
and it tests whether a teacher wants this at all before anything is stored.

### D2 — Phones: a poll inside a class session

**Recommended, once a teacher is using D1.** In a live class session, the
teacher starts a **poll** on one section's prediction.

- **One draw for the whole class:** the poll stores the params, so every
  phone shows the same numbers and the same option order.
- **One answer per pupil**, as with session questions: attempt-once.
- **The board shows three stages, each when the teacher presses for it:**
  1. **counting:** "17 of 24 have answered";
  2. **the split:** a bar per option, with nothing marked right yet;
  3. **revealed:** the right option marked, and the working.

  Showing the split before the answer is the point. It is the moment the
  class sees it disagrees.

### D3 — What a poll stores

**Recommended:** two tables, beside the session ones, deleted with them.

```sql
-- session_polls — one prediction put to the class.
id          uuid primary key default gen_random_uuid()
session_id  uuid not null references class_sessions(id) on delete cascade
skill_id    text not null
section     integer not null check (section >= 1)
params      jsonb not null      -- the draw, so every phone shows the same question
status      text not null default 'open' check (status in ('open','split','revealed','closed'))
created_at  timestamptz not null default now()
-- at most one poll open per session at a time

-- poll_responses — one pupil's answer.
id              uuid primary key default gen_random_uuid()
poll_id         uuid not null references session_polls(id) on delete cascade
participant_id  uuid not null references session_participants(id) on delete cascade
option          integer not null check (option >= 0)
misconception   text            -- the chosen option's tag, if it has one
created_at      timestamptz not null default now()
unique (poll_id, participant_id)
```

The rules are doc 29's, unchanged:
- no `FOR ALL` policies;
- participants may INSERT only, gated on the poll being open *and* its session open and unexpired;
- no SELECT for pupils at all;
- teachers read through a service-role route;
- the board's route returns counts per option and never a name.

**No free text, and nothing a pupil types:** an option number and a tag from
a fixed list. The data-protection position in doc 29 §4 holds as written,
and the nightly sweep deletes polls with their session. The DPIA sign-off
that is still open covers this too; it adds no new kind of data.

### D4 — A pupil's phone

**Recommended:** **a banner, never a takeover.**
- A pupil mid-question is not yanked out of it. Their page checks every 10 s
  for an open poll, as the teacher's does.
- When there is one, a banner says "Your teacher has a question for the
  class", with a button to it.
- They answer and go back to where they were.

The check goes through a rate-limited service-role route that returns only
the open poll's section and params. The phone builds the question from the
investigation code it already has, so no question text or other pupils'
answers cross the wire.

### D5 — Tag the prediction options

**Recommended, before D2.**
- Add `misconception?: readonly string[]` to a choice prediction, aligned
  with its options and `''` on the right one, as rule-sentence slots already do.
- Tag the roughly 40 wrong options across the 19 choice sections.
- A test holds the alignment, and that every id exists in the taxonomy.

With the tags, a poll's split can say *why*. For example, "9 kept the gap
between the numbers as pounds" instead of only "9 chose B". Those tags reach
the Common mistakes panel the teacher already uses.

### D6 — Straight lines §1 (the grid prediction)

**Recommended:** board mode only. Placing a point on a phone and collecting
30 of them is a different feature. On the board, the class can point and argue.

## 4. Increments, in order

1. **Board mode.**
   - A "Teach this on the board" view of any section.
   - The prediction lettered, then Reveal, then the try-it and the rule at projector scale.
   - Reached from the teacher dashboard's "Run a lesson", with a list of
     investigations and their sections.
   - No data, no migration, no pupil devices. **Show it to a named teacher.**
2. **Tags on the prediction options** (D5): the ~40 tags and their test.
   Useful on its own, since a solo student's wrong prediction can then be logged
   with its misconception too.
3. **Phone polls** (D2–D4).
   - The migration, the routes, the pupil banner, and the board's three stages.
   - The teacher's session page gains "Start a poll" and the split by misconception.
   - **Gate:** build this when a teacher who has used increment 1 wants it.
     It costs a migration, anonymous-write security work and a review of the
     data-protection position. That is too much to spend on a feature nobody has asked for.
4. **Measure.** Polls run, the share of joined pupils who answer, and how
   often the class's majority was wrong before the reveal (the lessons where
   the poll earned its place).

Each increment is its own PR, merged to main before the next starts.

## 5. How we will know

| question | read it from | worry if |
|---|---|---|
| Does a teacher use the board mode? | a board-mode event, by teacher | no use after it has been shown to one |
| Do pupils answer a poll? | responses ÷ participants, per poll | well under half |
| Does it find disagreement? | polls where the right option had under half the class | almost never (the predictions are too easy for the class) |

The first row is the gate for increment 3. Until a teacher has used the
board, there is nothing to learn from the rest.

## Not in scope

- Free-text answers from pupils, or anything a pupil types beyond their name
  (doc 29 §4).
- Realtime. Polling every 10 s is enough for a class answering one question.
- Names on the board, ever.
- Mastery from polls. Session work earns none (doc 29 §3.3), and a
  prediction is not evidence of a skill.
- Polls on bank questions. The investigations' predictions are written to
  split a class; most bank questions are not.

## Pointers

- Sessions: `supabase/migrations/20261020_class_sessions.sql`; the plan, doc 29.
- The board page that never fetches names: `app/dashboard/sessions/[id]/display/page.tsx`.
- Refresh: `POLL_MS` in `lib/liveProgress.ts`.
- One draw for everyone: `resolveAt` in `lib/skills/investigation.ts`.
- Opening one section: doc 33, `parseSectionEntry`.
- The teacher's insights: `components/ClassInsightsPanel.tsx`.
