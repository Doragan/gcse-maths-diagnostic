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

## 7. Challenges — unchanged, and cheap

Challenges attach to a *topic* a student is strong in, not to a question they
dropped, so they were never per-item. 10 topic × tier pairs, capped at
`MAX_CHALLENGE = 2` per sheet. A pool of ~6 each ≈ **60 questions**, written
once and sampled deterministically per paper (hash the paper id) so
regenerating a sheet never changes which challenge it shows — the rule
`wwwEbiPhrases` already follows.

These need no PDF. They can be written today, independently of everything
above, and they switch on "Push yourself" for all 39 papers at once.

## 8. Order of work

1. **Challenges (~60).** No PDF, no blocker, immediate visible effect on all 39
   papers. First, because it is the cheapest thing that changes what a teacher
   sees.
2. **Decide the `answer` field (§5).** It changes the type and the authoring
   doc, so it must be settled before batch authoring rather than after 1,029
   questions exist.
3. **Write the authoring doc**, modelled on `docs/coding-a-paper.md`, leading
   with the transcription boundary (§6).
4. **One paper by hand, end to end.** Calibrates the doc and gives a worked
   example to point the agents at. Pick a Foundation paper with a QP to hand.
5. **The 30 ready papers**, one agent per paper, in board batches.
6. **Fetch the nine missing QPs**, then the last 295.

Steps 1–4 are small and unblock everything. Step 5 is the bulk and the only
genuinely large part.

## 9. Open questions

1. **The `answer` field** (§5). Recommendation: yes — it is the only quality
   gate available, and teachers want it regardless.
2. **Does every non-visual item need one?** 1,324 assumes yes. A cheaper cut is
   to skip 1-mark recall items, where a rewrite adds least — but a student who
   dropped one then sees nothing, and the sheet caps at 3 practice questions
   anyway, so the saving is smaller than it looks.
3. **Who writes them?** These are a TypeScript module, not `questions` rows, so
   they do not belong in the DB-only authoring session despite being called
   questions. Worth confirming, because the naming invites the wrong split.
