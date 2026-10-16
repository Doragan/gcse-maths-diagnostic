# The 1:1 tutor dashboard — scope

_Scoped 2026-10-13, from the tutoring-lead sessions. The teacher surface was
designed around a class of thirty; a tutor works with one student at a time, and
1:1 is currently a degenerate case of a class rather than a shape the product
understands. This says what is actually wrong, what to build, and — at some
length — one obvious fix that was considered and rejected._

**Not a rewrite.** The data layer already computes everything a 1:1 view needs,
per student. What is missing is a way to reach it that is not shaped like a
classroom.

## The standing caveat

The one in `docs/audit/24` §"The standing caveat" still applies and has barely
moved. As of 2026-10-13: 5 teacher accounts, **2 classes in existence**, 0 paper
sittings ever recorded, 127 students. The teacher surface has still never been
used by a real class, so everything below is reasoning about a thing nobody has
used in anger. The trial in §9 is the gate for exactly that reason.

---

## 1. Why 1:1 is not just "a small class"

A tutor with eight students has to choose how to model them, and **the obvious
choice is wrong**:

- **One class containing all eight** — wrong, and silently so. Coverage is keyed
  `(class_id, skill_id)` (`20260615`-era `class_skill_coverage`), so eight
  students who are taught completely different things share one taught-list. The
  mastery denominator is then wrong for all of them, no warning is shown, and
  the percentages simply mean something other than what they say.
- **Eight classes of one** — correct, and the rule a tutor must be told. Each
  student gets their own coverage, so every denominator is right.

So the correct usage is a discipline the tutor has to know about, and the
incorrect one fails silently. That alone is worth fixing, independent of any
interface work.

---

## 2. What already works — do not rebuild it

Checked against `main` on 2026-10-13:

- **The per-student detail is good.** `components/StudentDetailModal.tsx` shows
  overall mastery, that student's own weekly trend, exam readiness when they have
  sat a paper, per-topic bars, and a per-skill breakdown grouped by topic with
  mastered / needs practice / in progress.
- **The data is already per student.** `get_class_skill_mastery` returns
  `student_id` rows; `computeClassAnalytics` builds a full `StudentAnalytics`
  per member. Nothing needs new computation.
- **Nothing blocks a class of one.** No class cap exists, and there is no minimum
  class size or aggregation threshold anywhere in the mastery RPC or the
  readiness view. A class of one reports that one student.
- **Assignments already target individuals** (`targetStudentIds`), so work can be
  set for one student regardless of class shape.

---

## 3. What is actually wrong

Five things, each checked rather than asserted:

1. **The primary object is backwards.** For 1:1 the student is the thing and the
   class is plumbing, but every analytics read is class-keyed —
   `get_class_skill_mastery(_class_id)`, `get_class_exam_sessions(_class_id)`,
   `get_class_exam_paper(_class_id, _session_id)`. There is no teacher-keyed read
   in the schema at all.
2. **The best screen is a modal behind a one-row table.** Reaching a student's
   detail means opening their class and clicking the only name in the roster.
3. **The class page is mostly class furniture.** For one student it still shows a
   join code, an invitations panel, a roster of one, a "marked a paper?" card, a
   coverage picker and class-level aggregates that restate that single student.
4. **Setup scales linearly, and invitations made it slightly heavier.** N students
   means N classes, N join codes and N invitation panels. PR #138 improved
   chasing but added a per-class surface.
5. **There is no cross-student view.** A tutor with eight students has eight
   pages and no way to ask "who do I need to worry about this week", which is the
   actual daily question.

---

## 4. The design

Keep the class as the permission and data boundary. Hide it from the interface.
Make the student the thing you navigate.

### 4.1 — A teacher-keyed read (the only new plumbing)

One `SECURITY DEFINER` function returning the caller's students across all the
classes they own. The permission model already roots in the teacher —
`teacher_owns_class(_class_id, auth.uid())` — so the predicate is
`classes.teacher_id = auth.uid()` and needs no new concept.

⚠ `20260915_class_grant_execute_grant.sql` is the precedent to follow:
`grant execute ... to authenticated` does **not** restrict anything, because
PostgreSQL grants EXECUTE to PUBLIC by default. Revoke from PUBLIC in the same
block, and pin `search_path`.

### 4.2 — "My students", flat

The tutor's landing page: one row per student across every class they own, with
name, last active, questions this week, and overall mastery. Sortable by who has
gone quiet. This is the answer to the daily question in §3.5.

### 4.3 — The student as a page, not a modal

Promote `StudentDetailModal` to a route. Same content; reachable directly,
linkable, and no longer requiring a class to be opened first.

### 4.4 — Classes created invisibly

Adding a student from the tutor view creates its class behind the scenes, so
one-class-per-student becomes an invariant the system maintains rather than a
rule the tutor has to remember. §1's silent failure stops being reachable from
this path.

---

## 5. The denominator question, and the fix that was rejected

**The problem.** A student can belong to several classes — uniqueness is on
`(class_id, student_id)`, not on the student. Coverage is per class, and the
mastery denominator is literally `ctx.total`, the count of skills marked covered
*for that class* (`lib/teacherAnalytics.ts`). So a student in both a 1:1 slot and
a group has **two different mastery percentages**, and a flat list showing one
number per student has no principled way to choose between them.

**The obvious fix — move coverage onto the student — was considered and
rejected.** It would give every denominator a single unambiguous value and make
§4.4's hidden class stop being load-bearing. It also breaks four things for a
genuine multi-student class:

1. **`scoped` and `coveredCount` stop having a single value.** Both are returned
   per class and mean "skills marked covered"; there is no one answer once
   members differ.
2. **`avgMastery` and `topicAvgs` become means over different denominators.**
   Today every member's `overallMastery` uses the same `overallTotal`, so the
   mean is comparable. Per-student coverage quietly makes it an average of
   percentages computed over different bases.
3. **`gaps` changes meaning.** `studentsWithData` is tallied only over `inScope`
   skills, so it would count only those students for whom the skill is in their
   own coverage — a subtler quantity than the panel's label claims.
4. **Mid-year joiners regress.** Today a student joining in March instantly
   inherits the class's whole taught-list. Per-student, they would have no
   coverage until someone re-applied it, so they would show unscoped
   whole-curriculum mastery and drag the class average down until noticed.

That is a schema change to a working group model in order to solve a 1:1
presentation problem. The ratio is wrong.

**What to do instead: stop using a ratio on that screen.** The ambiguity exists
only in the flat list, and the answer turned out not to be a better denominator
but no denominator at all.

**Two percentages were tried first, and both are recorded here because the next
person will reach for one of them.**

*mastered / WHOLE CURRICULUM.* The first answer, and what the list originally
shipped with. It is comparable across students, needs no choice, and is useless:
the curriculum is around 170 skills, so real tutees read **0%, 1% and 3%**. Those
were the actual figures over the seeded class. A column that cannot rank anybody
fails the one job the list has.

*mastered / ATTEMPTED.* The obvious correction, and it ranks perfectly well — and
it **inverts the incentive**. The denominator grows every time a student meets
something new, so 5-of-12 (42%) becomes 5-of-15 (33%) after three fresh attempts.
The student did more work and the number went down. For a product whose blocking
problem is getting students to return at all, a figure that falls when they
practise is the wrong thing to put in front of the adult encouraging them. Any
ratio with a growing denominator has this property; the fault is the shape, not
the choice of numerator.

**So the list shows counts:** skills mastered, and skills to work on. Nothing
there falls when a student practises — "to work on" rising is informative rather
than punitive, because it means new material has been met. Sorting by a count is
also better than sorting by a ratio, which pushed the busiest students to the
bottom.

Over the seeded class the counts separate students the percentages could not:

| | mastered | to work on | in progress | (old %) |
|---|---|---|---|---|
| Priya K | 5 | 4 | 3 | 3% |
| Christopher | 0 | 0 | 5 | 0% |
| Egg | 2 | 0 | 17 | 1% |

**Percentages keep their place on the detail page**, where topic bars and a trend
give them context, and the scoped "% of what I've taught" stays on the class page
where the class is known. No migration, and nothing in the group path is touched.

**A consequence worth following up separately.** The reason counts work is that
early mastery is achievable while any whole-course denominator is enormous. That
makes the first few sessions decisive: a student who finishes an early session
having mastered four things has had a different experience from one shown 3%, and
the day-two return rate is the product's standing problem (10 of 56 students have
ever come back on a second day). An induction that front-loads reachable wins is
its own piece of work, and the fast-track already in `masteryStatusFor` — first
three correct marks a skill mastered early — is the existing hook for it.

---

## 6. Rules this must not break

- **Multi-student classes behave exactly as they do today.** §4.1–4.4 are
  additive; §5 is explicitly a decision not to touch them.
- **"My students" does not replace the class list.** Thirty rows is right for a
  tutor and noise for a group teacher; both views coexist.
- **Class-level aggregates stay.** `gaps`, `avgMastery` and `topicAvgs` are the
  reason a group class has a page at all.
- **No new cross-account read.** The teacher-keyed RPC must expose exactly what
  the class-keyed ones already do, for exactly the students a teacher already
  sees. It is a different key, not a wider door.
- **No email address reaches a teacher.** See `docs/audit/23` §4 and the fix in
  PR #138: the roster masks, and the privacy notice, `docs/legal/dpa-schools.md`
  §4 and the DPIA all state a teacher cannot see a pupil's address.

---

## 7. Build order

1. **§4.1 teacher-keyed RPC** — no interface change; nothing is visible yet.
2. **§4.2 "My students" list**, showing counts rather than a percentage per §5.
3. **§4.3 student detail as a route**, with the modal kept until the route is
   proven.
4. **§4.4 invisible class creation** — last, because it changes a write path and
   the first three are read-only.

Increments 1 and 2 are the useful half and are independently shippable.

---

## 8. What this does NOT address

- **Group teaching**, which is served by what exists.
- **Primary and KS3.** `data/courses.ts` holds four courses, all GCSE and iGCSE.
  A tutor whose work is mostly primary is not served by this or by any interface
  change; see `docs/sales/tutoring-followup.md`.
- **Co-working in a session.** There is no shared-session surface — no pushing a
  question to a student's screen, no watching them work. A tutor may assume it
  exists. Out of scope here and not costed.

---

## 9. The gate

**Do not build ahead of the trial**, which is `docs/audit/19` §4's rule and the
one the September invitations build broke, at the cost of a revert.

The trial starting after the Year 9 mocks is the first real use of the teacher
surface by anybody. The specific thing to watch is whether the N-classes setup is
a shrug or a wall.

**The exception, and the trigger for building §4.1–4.2 first:** if the tutor has
more than about five students, the setup ceremony stops being something that can
be absorbed by hand and becomes the most likely week-two death. Their number is
not yet known — it is question 2 on `docs/sales/tutoring-call-note.md` and still
unanswered.

**The cheaper mitigation, to try before any of this:** run the setup for them.
Create the classes and send the invitations using
`docs/runbooks/tutoring-trial-setup.md`. They never touch the ceremony, and the
per-student view still gets tested. Roughly twenty minutes, and it buys the
evidence this document is waiting for.
