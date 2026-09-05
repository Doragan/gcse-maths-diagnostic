# Retry and challenge questions for the 39 generated papers

Scoped 2026-09-05, revised the same day once the brief was pinned down.
Prerequisite: the 42-paper registry and the feedback pipeline (PR #61).

Three of the 42 papers carry `retrySet` and `challengeQuestions`, so their
sheets print "Practise these" and "Push yourself". The other 39 omit both.

## 1. The brief

**A retry is a rewritten version of the question that appeared on the paper —
same style, same framing, different numbers.** Not a generic question on the
same skill.

That is a deliberate rejection of the cheaper model first proposed here (one
pooled question per skill, 153 of them). It is also the right call: a student
who dropped "compare two supermarket totals against a multiplicative claim,
with working" is not served by a bare ratio drill. The framing is most of what
they got wrong.

**What it does NOT need**, and this is what keeps it affordable: no parameters,
no traps, no explanations, no SVG, no `answer_template`, no tolerance, no
`verify-question` run. None of the machinery that makes a bank question
expensive. It is prose.

## 2. The consequence: this is per-item

| | |
|---|---|
| generated papers | 39 |
| items on them | 1,425 |
| `visual` — no retry, by design | 101 |
| **retries to write** | **1,324** |
| mean per paper | 33.9 |

Pooling is dead for retries — a rewrite is bound to its original, so it cannot
be shared between papers. **The existing schema is therefore already correct**:
`retrySet: Record<questionId, …>`, per paper, is exactly the shape this work
produces. No refactor, no resolver, no migration.

Two things from the previous draft drop out as unnecessary:

- *Dedupe practice by skill* — proposed to stop the same pooled question
  printing three times. Under per-item rewrites, three dropped
  `simple_arithmetic` items give three different questions. Nothing to fix.
- *Per-skill variants* — same reason.

Challenges are unaffected and stay pooled (§7).

## 3. The blocker: the repo contains no exam text

This is the finding that decides the shape of the work.

`data/exam-audit/` rows are `{q, part, marks, skill_ids, kind, answer_form,
app_gap_note}`. Every `meta.source` says it outright — *"Derived metadata only.
No exam text transcribed."* The paper files carry a one-line `desc`
("compare two totals against a multiplicative claim, with working"), which is
structural: no numbers, no context, no wording.

`desc` is good enough to write a *generic* question on the skill. It is not
good enough to write a *rewrite*, which is the whole brief. **The input for
this work is the question paper PDF, not the repo.**

So it is a per-paper job: open the QP, read Q1, write a parallel Q1. Bounded by
paper rather than by skill, and parallelisable one agent per paper — the same
shape as `docs/coding-a-paper.md`, which already worked across 39 papers.

## 4. Nine papers cannot start yet

Checked against the PDFs on hand:

| papers | QP to hand | retries |
|---|---|---|
| AQA Jun23, Jun25, Nov23 (18) | yes | ~623 |
| Edexcel 1MA1 Jun25 (6) | yes | 185 |
| OCR J560 Jun25 (6) | yes | 221 |
| **ready** | | **1,029 across 30 papers** |
| AQA Jun24 (6) | **no** | 208 |
| AQA Nov24 Higher 1H/2H/3H (3) | **no** | 87 |
| **blocked** | | **295 across 9 papers** |

There are no AQA June 2024 papers in Downloads at all, and the only Nov24 PDFs
are the three Foundation ones — which are the hand-authored papers that already
have retry sets. **Those nine QPs need downloading before their papers can be
done.** Everything else can start now.

## 5. The real risk is that nothing checks this

1,324 questions, written by agents, printed on sheets handed to real students,
with **no automated gate whatsoever**. `verify-question.ts` cannot help: there
is no answer to evaluate, no parameter set to render, no grader to run.
`audit-bank.ts` never sees these — they are not rows in the `questions` table.

Every other authoring path in this project has a committed pre-publish gate.
This one has none, and it would be the largest single body of content the
project has produced.

**Recommendation: add an `answer` to `PaperRetryQuestion`.** Not for the sheet
— it must not print beside the question — but because it makes the output
checkable: the author writes question *and* answer, and a second independent
pass solves the question cold and compares. A mismatch is a flag. That is a
real gate for the cost of one field, and it is the only one available here.

It is also what a teacher wants. Handing out thirty practice questions you then
have to solve yourself is a chore, and "here are the answers" is the difference
between a sheet used and a sheet filed.

## 6. The line this work must not cross

The project's rule so far has been absolute: **no exam text in the repo.** This
work moves toward that line, so the boundary needs stating before an agent is
ever pointed at a PDF.

- **Allowed**: the same structure, demand and framing, with different numbers,
  names, contexts and quantities. That is what a parallel question is, and it
  is ordinary practice.
- **Not allowed**: the original wording, lightly edited. If a sentence could be
  found in the QP by searching for it, it is a transcription and it fails.

A subagent told to "rewrite this question" will drift toward transcription
unless told plainly. The authoring doc must lead with this, the way
`docs/coding-a-paper.md` leads with its untagged cap.

## 7. Challenges — DONE (commit 39ef545)

Sixty questions, pooled by topic × tier in `lib/papers/challengePool.ts`, so
all 39 generated papers now print "Push yourself". A paper's own
`challengeQuestions` still win, and the draw is hashed on paper id and topic so
regenerating never changes what a student is offered.

Two decisions were settled in the building and apply to the retry work below:

- **Answers are required**, with a line of working where the answer alone would
  not show the route (§5 resolved). The 30 hand-authored challenges were given
  answers too, so the field could be required rather than optional.
- **Answers reach the teacher on a final "Answers — teacher copy" page** and
  never touch a student's sheet. Built in the FORMATTER, not from the evidence:
  the evidence offers a challenge per strong topic while the sheet prints at
  most `MAX_CHALLENGE`, so an evidence-built key listed answers to questions no
  student received.

**Diagram rule, which retries inherit.** A challenge is one line of text, so
nothing in the pool needs a picture. Three cases, and the middle one is the
useful part:

1. **Describable** — the diagram is a convenience and the configuration can be
   stated in words. Circle theorems with named points, triangles with labelled
   sides, solids given by their dimensions. These are fine, and they are why
   "geometry needs diagrams" is too blunt a rule.
2. **Diagram carries the data** — charts, grids, scale drawings, cumulative
   frequency, box plots. Excluded: the question is unanswerable without it.
3. **Diagram IS the answer** — construct, draw, enlarge, reflect. Excluded.

For challenges this was a free choice, and the resulting bias is recorded in
the file: shape and probability lean toward trigonometry and calculation, so a
student strong in shape *because* they are good at transformations gets pushed
on trigonometry instead. The fix for that is a drawing surface, not more text.

For retries it is not a free choice — see §7a.

## 7a. What the diagram rule means for retries

A retry is bound to its original, so case 2 and case 3 questions cannot be
rewritten as prose at all. The existing `visual` flag already excludes 101
items on that basis, and those contribute no practice suggestion by design.

The risk is items in cases 2 and 3 that are flagged `visual: false`. One is
already visible in the registry: Edexcel 1F Jun25 `8b`, "name a solid from its
picture", is `visual: false` — arguably right, since naming a solid can be
restated in words, but it shows how fine the line is. Coding a paper asks "does
this depend on a diagram", and rewriting asks the sharper question "can I state
this configuration in words", which is not the same test.

So the retry authoring pass must be allowed to **re-flag an item as visual**
when it turns out to be case 2 or 3, and that should be an expected output of
the work rather than a correction to it. A bad prose substitute for a
graph-reading question is worse than no practice question, because the student
cannot tell which of the two it is.

## 7b. Challenges — the original scoping, kept for the record

Challenges attach to a *topic* a student is strong in, not to a question they
dropped, so they were never per-item. 10 topic × tier pairs, capped at
`MAX_CHALLENGE = 2` per sheet. A pool of ~6 each ≈ **60 questions**, written
once and sampled deterministically per paper (hash the paper id) so
regenerating a sheet never changes which challenge it shows — the rule
`wwwEbiPhrases` already follows.

These need no PDF. They can be written today, independently of everything
above, and they switch on "Push yourself" for all 39 papers at once.

## 8. Order of work

1. ~~**Challenges (~60).**~~ **DONE** — §7.
2. ~~**Decide the `answer` field.**~~ **DONE** — required, with working, and
   printed only on the teacher's page. `PaperRetryQuestion.answer` is already
   in place (optional, because the three hand-authored retry sets predate it);
   new retry authoring should always carry one.
3. **Write the authoring doc**, modelled on `docs/coding-a-paper.md`, leading
   with the transcription boundary (§6) and the diagram rule (§7a).
4. **One paper by hand, end to end.** Calibrates the doc and gives a worked
   example to point the agents at. Pick a Foundation paper with a QP to hand.
5. **The 30 ready papers**, one agent per paper, in board batches.
6. **Fetch the nine missing QPs**, then the last 295.

Steps 3–4 are small and unblock everything. Step 5 is the bulk and the only
genuinely large part.

## 9. Open questions

1. **Does every non-visual item need a retry?** 1,324 assumes yes. A cheaper
   cut is to skip 1-mark recall items, where a rewrite adds least — but a
   student who dropped one then sees nothing, and the sheet caps at 3 practice
   questions anyway, so the saving is smaller than it looks.
2. **Who writes them?** These are a TypeScript module, not `questions` rows, so
   they do not belong in the DB-only authoring session despite being called
   questions. Worth confirming, because the naming invites the wrong split.
3. **A student strong in several topics still sees only two challenges, both
   from the same topic** — `MAX_CHALLENGE` slices a list that is in paper-topic
   order, so the first strong topic takes both slots. Pre-existing, not
   introduced by the pool, and arguably wrong: one challenge from each of two
   strong topics would read better. Left alone because it changes what existing
   sheets say.
