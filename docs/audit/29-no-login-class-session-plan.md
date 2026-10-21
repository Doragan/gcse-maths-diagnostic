# No-login class sessions — scope

_Scoped 2026-10-20, the day of the first trust conversation. Facts about the
system were verified against the code on the day, not recalled; every file
reference below was opened._

**The one-line version.** A teacher starts a session and gets a code; pupils join
with a display name and nothing else; attempts post to a session-scoped store
that deletes itself the same day; the teacher watches the live view that already
exists. No pupil accounts, no email, no persistence.

---

## 1. Why this, and why now

Russ's trust takes **two months** to approve a new pupil login system. That is a
provisioning constraint, not a price or feature objection, and it makes every
plan that begins "pupils sign up" untrialable this term. So the wedge is whatever
needs no pupil accounts.

Two things already need none:

| | status |
|---|---|
| `/mark` — mark a paper, get feedback sheets | live, no login at all (`app/mark/page.tsx`) |
| Anonymous practice | live; attempts park in `localStorage` (`lib/pendingPractice.ts`) and migrate on login |

**The gap is aggregation, not practice.** An anonymous attempt never reaches the
database, so no teacher view can see it. That is the whole of what this scope
builds: somewhere for an anonymous attempt to go that a teacher can read, for as
long as the lesson lasts.

### What this is worth, stated honestly

It is not the product. It is the way in, and it is cheap because the two
expensive halves already exist: the question surface works signed-out, and the
live teacher view was built in `docs/audit/24` Part 3 and is sitting unused.

It also lines up exactly with the freemium line already under consideration in
`docs/audit/16` Part 7 — **pay for persistence, not for assessing.** Free: assess
a class in a lesson with no accounts. Paid: keep it.

---

## 2. What already exists, verified

This matters more than usual here, because most of the build is wiring.

### 2.1 The live view is built

`docs/audit/24` Part 3 recommended polling over realtime and specified a head
probe. All of it shipped (`5576138`):

| | where |
|---|---|
| Polling loop, visibility-gated, 45-minute stand-down, "Paused · Resume" | `app/dashboard/assignments/[id]/page.tsx:82`–`:116` |
| Cheap change probe | `app/api/assignments/[id]/results/head/route.ts` |
| Pure, clock-injected rules — `headChanged`, `isAnsweringNow`, `shouldPause`, `formatLastAttempt`, `POLL_MS` | `lib/liveProgress.ts` |
| The results table, with the presence dot and "answering now" | `app/dashboard/assignments/[id]/page.tsx:269`–`:316` |

Two corrections to Part 3's own text, found while reading it:

- It asks to "add `lastAttemptAt` per student to the results payload". It was
  already there (`app/api/assignments/[id]/results/route.ts`, `last_attempt_at`).
- Its gate — "build when a real class runs a real assignment" — is
  **unsatisfiable by the route it assumed**, because a real class running a real
  assignment requires thirty pupil accounts, which is the two-month problem. See
  §7.

### 2.2 `lib/liveProgress.ts` needs no changes at all

Every function in it takes a timestamp or two and returns a string or a boolean.
Nothing in it knows what an assignment is. A session view imports it unchanged.
That is the single cleanest piece of reuse in this plan and it is free.

### 2.3 There is already a no-login join flow in the product

The legacy diagnostic: `app/join/page.tsx` takes a 4-character code and a name,
resolves the code through a service-role route (`app/api/assessment/lookup`,
rate-limited 20/min/IP by `lib/rateLimit.ts`), inserts an anonymous
`student_sessions` row, stashes its id in `sessionStorage`, and the owning
teacher reads the results at `app/dashboard/[id]/page.tsx`.

**That is this feature's shape, already proven, already security-reviewed** — its
one hole (an `UPDATE` policy of `USING (true)`) was found and fixed in
`20260612_sec2b_lock_sessions.sql`. §5 copies the pattern and its fix.

It is unused since April and diagnostic-shaped (`skill_results` holds per-skill
verdicts from the adaptive test), which is why §3 builds beside it rather than
on top of it.

### 2.4 The question surface already works signed-out

`app/practice/question/[id]/page.tsx` handles `studentId === null` throughout.
`resolveSkillIds()` (`:109`) honours a `practice_focus_skills` key in
`sessionStorage`, so **the join flow can point a whole class at a set of skills
without one line of new question-selection code.**

---

## 3. The data model

### 3.1 The decision: three new tables, not a nullable column on a live one

The tempting shortcut is to make `assignment_attempts.student_id` nullable and
add a `participant_id`. Reject it:

- `student_id` is `NOT NULL REFERENCES students(id)` and the insert policy is
  `WITH CHECK (auth.uid() = student_id)` (`20260606_assignments.sql`). Both
  would have to be loosened on a table a teacher can already read.
- `project_security_rls`'s own post-mortem is about exactly this class of
  change: a policy whose write gate was weakened by accident let a student
  self-grant admin. A live, teacher-visible attempts table is the last place to
  introduce a nullable identity.
- The two things genuinely differ. An assignment attempt is owned by a pupil for
  ever and feeds mastery. A session attempt is owned by nobody and feeds one
  lesson. Shared storage would force every future query to ask which kind it has.

### 3.2 The tables

```sql
-- class_sessions — one lesson. Teacher-owned, short-lived.
id              uuid primary key default gen_random_uuid()
teacher_id      uuid not null references teachers(id) on delete cascade
title           text not null check (char_length(title) between 1 and 120)
code            text not null check (code ~ '^[A-Z0-9]{4}$')
skill_ids       text[] not null default '{}'   -- what the class is working on
target_count    integer check (target_count > 0 and target_count <= 50)
course_id       text not null                   -- qualification scoping, per project_exam_audit_corpus
status          text not null default 'open' check (status in ('open','closed'))
expires_at      timestamptz not null default now() + interval '6 hours'
created_at      timestamptz not null default now()
closed_at       timestamptz

-- One live code at a time, and old codes die rather than exhausting the space.
create unique index class_sessions_open_code on class_sessions (code) where status = 'open';

-- session_participants — a pupil, for one lesson. This is the entire identity.
id              uuid primary key default gen_random_uuid()
session_id      uuid not null references class_sessions(id) on delete cascade
display_name    text not null check (char_length(display_name) between 1 and 24)
joined_at       timestamptz not null default now()

-- session_attempts — one row per question, per participant.
id              uuid primary key default gen_random_uuid()
session_id      uuid not null references class_sessions(id) on delete cascade
participant_id  uuid not null references session_participants(id) on delete cascade
question_id     uuid not null references questions(id) on delete cascade
correct         boolean not null
attempted_at    timestamptz not null default now()
```

Notes on the choices:

- **No `student_id` anywhere, deliberately.** There is no column into which an
  account could be written, which is what makes the DP answer in §4 short.
- **`session_id` is denormalised onto `session_attempts`** even though it is
  reachable via the participant. The head probe and the results query both filter
  by session, and keeping it one column avoids a join on the hot path.
- **`expires_at` defaults to six hours**: a school day, not a lesson, so a
  teacher who runs the same session period 1 and period 5 is not punished for it.
- **`display_name` capped at 24 characters** in the database, not only in the
  form. See §4.4 on why the field asks for a first name.
- **No `completion_mode`, no `selection_mode`.** Sessions are pool-mode,
  attempt-once only. §6 says why.

### 3.3 The one thing never to add

**`session_attempts` must never be mirrored into `practice_attempts`.** An
assignment attempt is written to both, by design (`20260606_assignments.sql`
header; `app/practice/question/[id]/page.tsx:595`). A session attempt cannot be,
because there is no `student_id` to key it on — a happy accident that should be
written down before somebody helpfully "fixes" it.

The consequence is the product's own upgrade story, and it is honest: **session
work earns no mastery.** To keep it, the pupils need accounts. That is the
freemium line expressed as a foreign key.

---

## 4. What it means for the data protection position

This is the part with real consequences, and the news is mostly good but not
uniformly so.

### 4.1 It adds a row to the roles table — and the row is the one §2 keeps empty

`docs/audit/21` §2 is built on a single architectural fact: a pupil's account is
created by the pupil, exists before any school, and outlives it, so we are the
**controller** and no school instructs us about anything. The last row of that
table — "anything the school directs us to do for it" → processor — is
deliberately empty.

A class session fills it:

| Processing | Who decides purpose and means | Role |
|---|---|---|
| A class session: a teacher sets the work, tells the class to join, and alone reads the output | The school | School is **controller**; we are **processor** |

There is no pupil act creating anything. The teacher directs the whole of it.
Pretending otherwise would be the mistake §2 warns about.

### 4.2 Why that is acceptable here, when §7 says it is not for accounts

`docs/audit/21` §7 refuses school-directed enrolment, and the refusal is
specific: it creates **persistent accounts** a pupil never consented to and
cannot withdraw, which destroys the consent foundation `docs/audit/20`'s model
rests on.

A session has no account. Nothing survives the afternoon, so there is nothing to
withdraw from and nothing for the school to be given access to later. The
processor role attaches to six hours of right-and-wrong marks against a first
name — not to a child's record.

So the position becomes two sentences rather than one, and both are defensible:

> For a pupil's own account, we are the controller and the school instructs us
> about nothing. For a class session, we are your processor, the processing is
> what you see on screen, and it is deleted the same day.

**What this costs:** a scoped Article 28 annex at `/dpa`, covering class sessions
only. Note the history — `app/dpa/page.tsx` served a processor agreement until
2026-09-17, when it was withdrawn as contradicting the controller position
(`docs/audit/23` §2.1). This revives the need for one, narrowly. Reintroducing it
without the scope line would re-create exactly the contradiction that was fixed.

### 4.3 The 13+ gate: the sharpest consequence

The account path carries a `confirmed_13` gate and the published notice states
13+ throughout (`app/privacy/page.tsx`, `docs/audit/21` §4).

**A no-login session would be the first path in this product lawfully used by an
eleven-year-old.** A Year 7 class is 11–12. There is no age gate to apply,
because there is no account and no consent being collected from the child — the
school operates in loco parentis under its own privacy information.

That is normal and workable, but it must be *stated*, in three places, before a
real class runs:

1. The join page: no age question, and a line saying the school asked you to be
   here.
2. The notice: a class-session section saying this path has no 13+ requirement
   because the school is the controller and its own privacy information applies.
3. The `/dpa` annex: the school warrants it has the lawful basis for its pupils.

This is also the item that forces the open question in
`project_school_data_protection` — "one lawful basis" — to be answered. For the
account path it is contract plus consent with the pupil. For a session there is
no contract with a child and no consent from one; the basis is the school's
(public task, or legitimate interests) and we process on instruction. Decide it
on paper before a pupil uses it, not after.

### 4.4 Minimisation, and the name field

The legacy join page asks for "Your name", placeholder "e.g. Jamie Smith" — a
full name. For a session, ask for the least that lets a teacher find a row:

- Label **"Your first name"**, placeholder `e.g. Jamie B`.
- The 24-character cap from §3.2, enforced in the database.
- **Reject anything containing `@`.** A child typing an email address into a name
  box is the commonest way a minimised field stops being minimised.
- One line under the field: _your name and answers are deleted at the end of the
  day_. True, checkable, and it is also the best possible answer to a DPO.

### 4.5 Deletion, which is the whole argument

`expires_at` is not decoration. A sweep deletes expired sessions, and the FK
cascades take participants and attempts with them. Put it alongside the one-year
inactivity rule in `lib/retention.ts` and give it the same dry-run-first
discipline that rule got.

That single mechanism does three jobs at once: it is the DP answer, it is the
freemium line, and it is what keeps the product's claim in `app/mark/page.tsx`
honest — _nothing is saved_ becomes _nothing is kept_, which is a smaller change
to the story than it looks.

### 4.6 What does not change

- **No new sub-processor, no new transfer.** Everything is Supabase (London) and
  Vercel (London). The join route's IP goes to Upstash for about a minute, which
  the schedule already covers for `app/api/classes/join`.
- **No email anywhere.** The strongest single fact in the DP position —
  `students` has no email column — is improved on here: a session has no pupil
  table at all.
- **No email-cap exposure.** `docs/audit/21` §5 records the live landmine: the
  Supabase built-in mailer caps at **two messages an hour**, so a class of thirty
  signing up in a lesson gets two confirmation emails and twenty-eight silent
  failures. A no-login session sends nothing and sidesteps it entirely — which is
  a second, independent reason this is the right shape for a first lesson.
- **The DPIA must be revised first.** `docs/legal/dpia-student-data.md` v0.2 is
  drafted and unsigned, and was written for the account path. Children under 13,
  school-directed processing and a processor role are all new to it. Revise
  before a real class, not after.

---

## 5. Security — the anonymous-write problem

Anonymous inserts gated only by a 4-character code are precisely the shape that
has already bitten this codebase once. The rules, each tied to the thing that
taught it:

1. **No `FOR ALL` policies.** `project_security_rls`: a `FOR ALL` policy with no
   `WITH CHECK` makes `USING` the insert gate, which let a student self-grant
   admin. Write `FOR INSERT` and `FOR SELECT` separately, always.
2. **The code resolves only through a service-role route**, never a client
   `select` on `class_sessions`. Copy `app/api/assessment/lookup/route.ts`,
   keep `rateLimitLookup` (20/min/IP — the enumeration guard on a 4-character
   space), and return `{ id, title, target_count, skill_ids, course_id }` and
   nothing about the teacher or the school.
3. **Participants get INSERT only.** No UPDATE, no DELETE, and — the deliberate
   improvement on `assignment_attempts` — **no SELECT on `session_attempts` at
   all.** The pupil's own progress counter already lives in `sessionStorage`
   (`session_total` / `session_correct`, `app/practice/question/[id]:516`), so
   the client never needs to read back what it wrote.
4. **The insert gate is the session's state, not an identity**, because there is
   no `auth.uid()` to scope to:

   ```sql
   create policy sa_participant_insert on session_attempts
     for insert with check (exists (
       select 1 from class_sessions s
       where s.id = session_id and s.status = 'open' and s.expires_at > now()
     ));
   ```

   This is the `20260612_sec2b_lock_sessions.sql` lesson generalised: gate on the
   session being still legitimately writable. A closed or expired session is
   immutable, which is what stops a code shared on a group chat from being
   writable next week.
5. **Teacher reads go through the service role**, gated on
   `teacher_id = auth.uid()`, exactly as both assignment routes do. Add a
   `cs_teacher_select` policy on `class_sessions` for the teacher's own list, and
   `REVOKE INSERT, UPDATE, DELETE` on all three tables from `anon, authenticated`
   except the two participant inserts.

### The limit that cannot be engineered away

**The roster is self-asserted.** With no identity, a pupil who has the code can
join as any name, including a classmate's. Participant ids are uuids so nothing
is guessable, and the insert gate stops writes to other sessions — but nothing
stops a second row called "Jamie".

That is not a bug to fix, it is the price of no accounts. Two consequences:

- Say it in the teacher UI, once, plainly: _these are names pupils typed._
- **A session is never summative.** It must not feed mastery (§3.3), must not
  produce a report, and must not be offered as evidence of anything. The moment
  it needs to be trustworthy, it needs accounts — which is the upgrade, and the
  honest version of the sales conversation.

---

## 6. Reusing the live results query

The ask is specifically whether the Part 3 view can be reused. It can, and the
seam is clean, because the existing route is two separable halves.

### 6.1 What the existing route does

`app/api/assignments/[id]/results/route.ts`:

| | half |
|---|---|
| ownership gate → resolve `assignment_targets` → class ids → `class_memberships` → `students`, into a `studentMap` of `{ display_name, year_group }` | **roster resolution** — four queries and a dedup |
| fetch all attempts → per-student aggregate → `is_complete` / `score` against `selection_mode` × `completion_mode` → sort | **aggregation** — pure, ~60 lines |

A session changes the first half completely and the second half not at all. And
it changes it in the easy direction: a session roster is **one query** on
`session_participants`, with no class, membership or dedup logic. There is no
pupil who can be targeted twice.

### 6.2 The seam

Extract the aggregation into a pure function — `lib/sessionResults.ts`, or beside
the existing rules in `lib/liveProgress.ts`:

```ts
export type RosterEntry = { id: string; display_name: string; year_group?: string | null }
export type AttemptRow  = { subject_id: string; question_id: string; correct: boolean; attempted_at: string }

export function aggregateProgress(
  roster: RosterEntry[],
  attempts: AttemptRow[],
  opts: { selectionMode: 'picked' | 'pool'; completionMode: string; assignedCount: number },
): ProgressRow[]
```

Both routes then map their own rows into `RosterEntry` / `AttemptRow` and call
it. **Keep the output field names identical** — `display_name`, `total_attempts`,
`is_complete`, `score`, `last_attempt_at` — so the table component is literally
the same component. `student_id` becomes `subject_id` on the shared type; it is
the React key and a modal lookup, and it never means anything else.

The existing route keeps its four roster queries and gains a tested pure
function it did not have. That is worth doing even if the session never ships.

### 6.3 The head probe transfers verbatim

`app/api/assignments/[id]/results/head/route.ts` is 60 lines, half of them the
comment explaining why it exists. The session version is the same file with
`assignment_attempts` → `session_attempts` and the ownership gate pointed at
`class_sessions`. Its contract — `{ attemptCount, lastAttemptAt }` — is exactly
what `headChanged` consumes, unchanged.

### 6.4 The one refactor this costs

The results table is **inline JSX** in `app/dashboard/assignments/[id]/page.tsx`
(`:269`–`:316`), not a component. Extract it to
`components/LiveProgressTable.tsx` taking `(rows, assignedCount, live, onResume,
now)` and leave the assignment page as a thin caller — the same move Part 1
recommends for `ClassMasteryTrend`.

Two things to carry across, and one to fix:

- **`year_group` is already null-safe** (`{r.year_group && …}`), so a session
  roster with no year group renders correctly with no change.
- **The no-descriptors rule comes with it** (`docs/audit/12` decision 2, carried
  into Part 3): presence and progress, never a verdict. No "stuck", no idle time,
  no red rows. It matters *more* in a live lesson view, projected or not.
- ✅ **The average-score bug — fixed 2026-10-20.**
  `app/dashboard/assignments/[id]/page.tsx:252` did
  `const pct = r.score ? parseInt(r.score) : 0`, but `score` is the string
  `"3/10"` (`results/route.ts`). `parseInt("3/10")` is `3`, and it was then
  rendered as `3%` — the tile labelled "Avg score" showed the mean *numerator*
  with a percent sign. Extracting the component as-is would have duplicated a
  wrong number onto a screen a teacher watches during a lesson.

  Now `averageScorePct` in `lib/liveProgress.ts` — pure, unit-tested, and
  already where §6.2's extraction wants it. It parses the fraction and averages
  over students who have **started**, so a class who have not opened the
  assignment no longer drag a real average to zero in the first ten minutes.

### 6.5 Realtime: still no

Part 3's reasoning holds and is stronger here. A change row carries a
`participant_id` and nothing nameable, so a subscription could only ever
supplement the snapshot, not replace it — and the session roster is one query, so
the snapshot is cheaper than the assignment one it was already judged adequate
for.

---

## 7. The pupil side

Smaller than the teacher side. Four changes, all in files that already handle
`studentId === null`.

1. **A join page.** `app/join/page.tsx` is the template. Code + first name →
   insert a participant → `sessionStorage` holds `session_participant_id` and
   `session_id` → set `practice_focus_skills` to the session's `skill_ids` →
   straight into `/practice/question/[id]?session=<id>`. The existing focus
   machinery (§2.4) serves the right questions with no new selection code.
2. **A session branch in `recordAttempt`**
   (`app/practice/question/[id]/page.tsx:511`). The anonymous path currently
   appends to `pendingPractice` and returns (`:579`–`:589`). Add the
   `session_attempts` insert **before** that return, and keep the
   `appendPendingAttempt` call: if the pupil later makes an account of their own,
   their lesson work migrates into it. That is a genuinely good upgrade path and
   it costs nothing.
3. **Suppress the sign-up nudge in a session.** `registerQuestionForNudge()` is
   gated on `!studentId` alone, at two call sites —
   `app/practice/question/[id]/page.tsx:579` and
   `components/practice/MultiPartQuestion.tsx:289`. In a session every pupil is
   signed out by design, so every one of them would be nudged to create an
   account mid-lesson: annoying, and an invitation to do the exact thing the
   school has not approved. Gate both on `!sessionId` too.
4. ✅ **The anonymous multi-part hole — fixed 2026-10-20.**
   `components/practice/MultiPartQuestion.tsx:155` was
   `onSessionAttempt(correct); if (!studentId) return` — and unlike the
   single-part path, **it never called `appendPendingAttempt`**. Anonymous
   multi-part attempts were discarded entirely. In a session, any multi-part
   question would have silently recorded nothing: the pupil answers, the
   teacher's screen shows them as not started. It was the one defect in this
   plan that would visibly fail a demo, and it was pre-existing, not new work.

   Now appends one entry per PART, carrying that part's own `skill_ids` and
   `kind`, mirroring the `practice_attempts` row the signed-in path writes.
   Verified signed-out in the browser against the three-part proportion
   question `e83de5b6`: three entries, each with its own skills and a real
   distinct timestamp. (It also surfaced that part (c) of that question is
   **untagged** — `skill_ids: []` — so it migrates into a row that counts
   towards no skill. A bank-tagging issue, equally true signed-in, not this.)

   Follow the existing rollup rule when adding the session write:
   `recordAssignmentRollup` posts **one** row per multi-part question, on the
   final part (`:174`). A session must do the same, or a three-part question
   counts as three answers against the target.

---

## 8. The gate, and the rule this has to answer to

`20260915_class_invitations.sql` carries a post-mortem written into the
migration: **teacher features should not be built before a real class has used
the existing ones.** It is there because the rule was broken and produced a
live-but-dead table. `docs/audit/24` respects it by gating Part 3 on a real class
running a real assignment.

**That gate cannot be met.** A real class running a real assignment needs thirty
pupil accounts, and pupil accounts are the two-month approval. The gate assumed a
door that is closed.

The argument for building this is therefore not that the rule does not apply. It
is that **this is the only way the rule can ever be satisfied** — the one shape
of class use that can happen this term, generating the first real live-lesson
data the teacher surface has ever had.

But the rule still bites, so replace the gate rather than waiving it:

> **Build it against a named teacher and a dated lesson.** Not "a school might
> like this" — a person who has agreed to run it with a class on a day.

Part 3 already allows the equivalent ("or when there is a scheduled pitch it
would be demoed in"). And keep the increment small enough to be cheap if the
lesson falls through: three new tables, nothing altered on a live one, one
component extracted, two routes that are thin wrappers over a shared function.

---

## 9. Build order

| | increment | why this order | cost |
|---|---|---|---|
| 0 | ✅ **Done 2026-10-20** — the anonymous multi-part hole (§7.4) and the avg-score bug (§6.4) | both were live bugs; the first made a demo fail silently | small |
| 1 | ✅ **Done** — schema + RLS migration (§3, §5) — SQL Editor, per the repo's DDL constraint | everything else needs the tables | small |
| 2 | ✅ **Done** — extract `aggregateProgress` + `LiveProgressTable` from the assignment page (§6.2, §6.4) | pure refactor, worth doing alone, and tested before anything depends on it | small |
| 3 | ✅ **Done** — teacher: start a session, show the code big, close it | the code has to exist before a pupil can join | small |
| 4 | ✅ **Done** — pupil: join page + `recordAttempt` session branch + nudge suppression (§7) | first point where data reaches the database | medium |
| 5 | ✅ **Done** — `results` + `results/head` routes over the shared function; point the live view at them | the payoff; thin, because 2 did the work | small |
| 6 | ✅ **Done** — expiry sweep (§4.5) + the DP copy: join-page line, notice section, scoped `/dpa` annex | must be live **before** a real class, not after | medium |
| — | DPIA revision + the lawful-basis decision (§4.3) | a gate on running with real pupils, not a code task | — |

**All six increments shipped 2026-10-20, on `feat/no-login-class-session`.** What
changed against this plan as it was built, because the plan was wrong about three
things and it is worth knowing which:

- **The attempt gate had to become a `SECURITY DEFINER` helper**, not §5.4's
  inline `EXISTS`. A policy subquery runs as the invoking role, so an inline
  check against `class_sessions` is filtered by that table's own RLS — under
  which anon sees nothing — and the insert would have failed closed for every
  pupil in every session.
- **`lib/useLiveProgress` was not in the plan.** §6 expected the polling loop to
  be copied; it is a hook both views call instead, because the loop is where all
  the judgement lives (visibility gating, the idle stand-down, seeding the probe
  baseline from the server) and two copies would drift on the first change.
- **The pupil's answered count needed its own key.** The banner first used the
  practice counter, which increments per PART, so a pupil on three-part questions
  read "5 of 5 answered" while the teacher's screen showed two. It now counts
  questions, bumped exactly where a `session_attempts` row is written, so the two
  numbers agree by construction.

Still open, and deliberately not decided while building:

- ~~**The score denominator.**~~ ✅ **Fixed 2026-10-21.** In pool/attempt_once the
  denominator was questions ATTEMPTED, so a pupil one question in read "1/1" while
  one who had finished three read "2/3" — the pupil furthest behind looking like
  full marks, on the screen whose entire job is comparing a class at a glance.
  `aggregateProgress` now takes `scoreAgainst: 'attempted' | 'target'`, the session
  route passes `'target'`, and the column reads 0/3, 1/3, 2/3.

  **It was worse than described here.** Measured on a three-pupil session, the
  "Avg score" tile read **83%** before and **50%** after: the old denominator was
  inflating the class average with that same "1/1", and the average is the number
  a teacher glances at first. Completion, attempt counts and row order are all
  unchanged — only the denominator moved.

  **Flipped for pool assignments too, later the same day**, on the user's call —
  the same figure was just as misleading there, and it is the one `is_complete`
  already counts against, so the two now agree. Measured before doing it: the
  database holds **one** assignment and it is picked mode, so **no live row
  changed**. The caution that kept it an option in the first place ("a teacher has
  been reading those numbers") turned out to describe a situation that does not
  exist — worth recording, because it was a guess and the query was cheap.

  It stays an option rather than becoming the only behaviour, since
  `scoreAgainst` is the honest name for the choice and `'attempted'` is still
  right for a view with no target. The guard matters: pool `assignedCount` comes
  from a NULLABLE `target_count`, so a pool assignment saved without one would
  render "2/0" — it falls back to attempted instead.
- **The DPIA**, per the row above. `docs/legal/dpia-student-data.md` v0.2 was
  written for the account path and is unsigned; children under 13, school-directed
  processing and a processor role are all new to it.
- **The authenticated cron path** is unverified locally for want of `CRON_SECRET`;
  the first production run reports its counts.

### Explicitly not in scope

Picked-question mode; any score shown to a pupil beyond their own session
counter; mastery writes; export; realtime; a session that outlives its day; any
report a teacher could keep. Each of those is either the paid tier or a reason
the DP answer stops being two sentences.

---

## 10. Pointers

- `project_trust_conversation` (memory) — the two-month constraint this exists to route around
- `docs/audit/24-teacher-visibility-and-sharing-plan.md` Part 3 — the live view, built
- `docs/audit/21-school-data-protection-position.md` §2, §4, §5, §7 — the roles table this adds a row to, the 13+ gate, the mailer cap
- `docs/audit/16-teacher-paywall-plan.md` Part 7 — free = ephemeral, and the table this one mirrors
- `docs/audit/20-school-accounts-design.md` §10 — why teacher-created accounts were not built
- `docs/audit/12-teacher-exam-readiness-plan.md` decision 2 — the no-descriptors rule the live table inherits
- `supabase/migrations/20260612_sec2b_lock_sessions.sql` — the anonymous-write lesson, generalised in §5
- `supabase/migrations/20260915_class_invitations.sql` — the don't-build-ahead rule §8 answers
- `app/join/page.tsx`, `app/dashboard/[id]/page.tsx` — the legacy no-login flow this is shaped like
- `app/mark/page.tsx` — the other free, no-login path, and the claim §4.5 keeps honest
