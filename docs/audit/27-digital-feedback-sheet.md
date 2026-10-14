# The feedback sheet, digitally

_Scoped 2026-10-14, out of the tutoring-lead sessions. The paper-marking tool
already produces a per-student feedback sheet as a PDF. This is the same thing
on the student's own screen, with the practice made answerable. Most of the
first half already exists; the second half should deliberately NOT be a copy of
the printed version._

**The short version.** A student can already read their own `paper_sittings` row
— the RLS policy is in place — and nothing in the product shows it to them. The
feedback half is a page on top of finished plumbing. The questions half cannot
be digitised as it stands, because the retries and challenges are static text
with no grader, and the right answer is not to fix that but to use the bank,
which is better digitally than a faithful retry would be.

---

## 1. What the printed sheet does today

Four sections, from `lib/papers/feedbackPdf.ts`:

| Section | Source | Shape |
|---|---|---|
| **What went well** | `lib/papers/wwwEbi.ts`, from the marks | derived |
| **Even better if** | same | derived |
| **Practise these** | `PaperConfig.retrySet` | hand-authored static text |
| **Push yourself** | `lib/papers/challengePool.ts` | hand-authored static text, ~60 pooled |

A tutor enters marks question by question, the sitting is written, and
`practice_attempts` rows are created against the dropped skills so the marks feed
the skill map.

---

## 2. What already exists for a digital version

Checked against `origin/main` on 2026-10-14:

- **`paper_sittings`** holds `marks`, `marks_earned`, `marks_total`,
  `selected_items`, `sat_on`, `source_paper`.
- **A student can already read their own.** `paper_sittings` has exactly one
  policy, `paper_sittings_student_select`, on `auth.uid() = student_id`. This is
  the part that would normally be the blocker and it is already done.
- **WWW/EBI is derived, not stored**, by `toWwwEbiSheets` — so it can be computed
  for the student exactly as it is for the sheet, with no new data.
- **The skills are already tagged.** Marking writes `practice_attempts` with
  `sitting_id` and `skill_ids`, so "which skills did this paper expose" is a
  query, not a new inference.

**What is missing: a student-facing route.** There is none —
`git ls-tree app/student` has dashboard, assignments, classes, diagnostic, exam
and upgrade, and nothing reads `paper_sittings` on the student side. That is the
whole gap for the feedback half.

---

## 3. Why the questions cannot simply be digitised

**Retries and challenges are static text with no grader.**
`PaperRetryQuestion` is `{ skill, question, answer, working? }` and its own type
comment says the answer exists because it is "the only check these questions
have (no parameters, no grader)". The challenge pool is the same. Nothing in
either can be rendered as an answerable question, marked, or fed back into
mastery.

**And they barely exist.** Three of the registered papers carry `retrySet` and
`challengeQuestions`; the rest omit both, and `docs/audit/17` §3 names the
blocker — the repo contains no exam text, so faithful retries for the remaining
papers are stalled on content that cannot be generated.

So "make the retries interactive" would mean authoring every one of them into
the bank as a parametric, graded question, per paper, blocked behind the same
missing exam text. That is not a UI change.

---

## 4. The constraint that forced static text does not apply digitally

This is the part worth getting right, because the obvious move is to copy the
printed sheet and the printed sheet was shaped by print.

**`docs/audit/17` §1 is emphatic:** a retry is "a rewritten version of the
question that appeared on the paper — same style, same framing, different
numbers. **Not** a generic question on the same skill."

That rule is correct **for paper**, and it is correct because paper is one shot.
A sheet offers three or four questions, marks nothing, explains nothing and
cannot adapt, so every one has to be faithful or it is wasted.

Digitally every one of those limits disappears. The bank grades the answer,
explains the method, carries misconception traps for the specific wrong answers,
and can serve as many questions as the student wants. **A generic same-skill
question is weak on paper and strong in an app**, because the app can respond to
it. The faithful retry is worth its authoring cost only where nothing can
respond.

**The same applies to challenges, and more sharply.** `challengePool.ts`
documents its own bias at length: no diagrams anywhere, because a challenge is
one line of text on a sheet — so reading charts, grids, transformations, loci,
constructions, box plots and cumulative frequency are all excluded, and a
student strong in shape because they are good at transformations gets pushed on
trigonometry instead. Its comment says the fix "is a drawing surface rather than
more questions here".

Digitally, that fix is partly already there: the bank has diagram questions, so a
digital "Push yourself" can reach the topics the printed pool is structurally
unable to offer.

**Conclusion: the printed sheet keeps its hand-authored questions, and the
digital version draws from the bank.** They are different media with different
constraints, and making them identical would mean inheriting print's limits for
no reason.

---

## 5. What to build

### 5.1 — A student route for a sitting

`/student/papers` (the list) and `/student/papers/[id]` (one sitting), reading
through the existing RLS policy. Shows the score, What went well, Even better
if, and the per-question marks the tutor entered.

**Say who marked it.** The student should not have to guess why a paper they sat
on paper has appeared in their account. `paper_sittings.marked_by` exists, is
set once in `app/api/papers/sittings` and is read nowhere — `docs/audit/23` §2.8
notes it is write-only. This is the first thing with a use for it.

### 5.2 — "Practise these" as skill-targeted practice

For each skill the paper exposed, a link into practice on that skill. The
`practice_attempts` rows written at marking time already carry the skill ids, so
this is a query and a link, and it works for **every** registered paper rather
than the three with an authored `retrySet`.

⚠ **Mind the marking rulings.** The pipeline is full-marks-only and
positive-only: full marks counts as secure and a dropped mark never pulls a
skill down. So a dropped mark is NOT recorded as negative evidence, and
"practise these" must be derived from the marks on the sitting rather than from
a drop in mastery, which will not be there.

### 5.3 — "Push yourself" from the bank

Harder questions on topics the student is strong in, selected from the bank by
topic and difficulty, rather than from the static pool. Gains the visual topics
the printed pool excludes.

### 5.4 — A link from the tutor's side

The tutor marks the paper and the student gets the feedback. The tutor should be
able to see that it exists and that the student opened it, or the loop is
invisible from the side that started it.

---

## 6. Rules this must not break

- **The printed sheet keeps working, unchanged.** It is the only output that
  exists today and it demos with no account at all. Nothing here replaces it.
- **No mastery is written by viewing feedback.** Practice done from the links
  records attempts as practice normally does; opening a page records nothing.
- **A student sees only their own sitting.** The existing policy is the whole
  gate; no new cross-account read, and nothing teacher-scoped.
- **Nothing here needs the student to have sat a mini-exam**, or to be paid.
  Feedback on a paper their tutor marked is about work they already did.

---

## 7. Why this is worth doing now

**It is the tutor's spreadsheet, finished.** Her Excel goes marks → topics to
focus on, for her. This goes marks → feedback → practice, for the student,
automatically, which is the half she cannot build.

**It is an induction route that needs no placement test.** The trial starts after
the Year 9 mocks, so every student will have a freshly marked paper. Mark it, and
the student has a feedback page and a practice list before answering a single
question — and their skill map is seeded from real evidence rather than from a
cold diagnostic.

**It gives the marking pipeline a reason to be used.** No paper has ever been
marked through the product. Today marking produces a PDF the tutor hands over;
this makes it produce something the student does, which is the difference between
a tool a tutor tries once and one they use weekly.

---

## 8. Open questions

- **Does the student see their per-question marks, or only the summary?** The
  marks are the tutor's judgement of work done on paper, and a student
  disagreeing with one has nowhere to say so.
- **What happens when a tutor edits a sitting?** `app/api/papers/sittings`
  rebuilds that sitting's attempts on update. The feedback page would change
  under the student with no notice.
- **Is "Push yourself" wanted at all digitally**, where the student can already
  choose any practice they like? It earns its place on paper by being the only
  stretch available.
- **Does this need the tutor's permission to show?** Marking is currently a
  private act by the teacher; this makes it visible to the student. Worth being
  deliberate rather than assuming.
