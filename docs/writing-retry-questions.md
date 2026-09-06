# Writing retry questions for a paper

How to give a coded paper its `retrySet`, so its feedback sheets print
"Practise these" instead of omitting the section.

Companion to [coding-a-paper.md](coding-a-paper.md), which turns a real paper
into a `PaperConfig`. That job produces derived metadata and never touches
question text. **This job does read the question text**, which is why the first
rule below is the one it is.

**The unit of work is ONE WHOLE PAPER.** `papers.test.ts` enforces all-or-
nothing: a paper with no `retrySet` is a documented state, and a paper with a
`retrySet` must have an entry for *every* non-visual question. Partial coverage
fails, and it should — a sheet that tells a student to practise question 4 and
says nothing about question 11 is worse than one that says nothing at all.

---

## What you need

- The **question paper** PDF. Not optional, and not replaceable by the repo:
  `data/exam-audit/` transcribes no exam text, and the `desc` field is
  structural (`"compare two totals against a multiplicative claim, with
  working"`). That is enough to write a *generic* question on the skill and not
  enough to write a *rewrite*.
- The paper's file in `lib/demoPapers/`, which gives you the item ids, labels,
  marks, skills and `visual` flags you must match.
- The **mark scheme**, to check your own answers against the original's demand.

Nine of the 39 papers have no QP to hand — AQA June 2024 (all six) and AQA
November 2024 Higher. See §4 of
[docs/audit/17-retry-and-challenge-plan.md](audit/17-retry-and-challenge-plan.md).

## The three rules

### 1. Parallel, never transcribed

A retry is **the same question with different numbers** — same context, same
framing, same demand, same number of steps. It is not the original lightly
edited, and it is not a generic question on the skill.

The test is blunt: **if a sentence you wrote could be found in the question
paper by searching for it, it is a transcription and it fails.** Change the
numbers, the names, the objects, the quantities, the setting. Keep the shape.

This is the line that keeps the repo publishable, and it is the one an agent
drifts across without noticing, because "rewrite this" and "restate this" feel
similar while writing and are not remotely the same afterwards.

The other direction fails too. Given an original about comparing two shopping
totals against a "twice as much" claim, `"Work out 3 × 4.50"` is not a retry —
it drops the comparison, the claim and the working. **A student who dropped that
question dropped the framing, and the framing is most of what they got wrong.**

### 2. If you cannot state it in words, do not write it

A retry is one line of text on a feedback sheet. There is no diagram. Three
cases, and the middle one is where the judgement lives:

1. **Describable** — the diagram was a convenience. *"A and B are points on a
   circle with centre O, and angle AOB = 84°"* carries everything a student
   needs. Triangles with labelled sides, solids given by their dimensions,
   angle chains on named lines: all fine. **"Geometry needs a picture" is too
   blunt a rule** and would throw away most of the shape questions.
2. **The diagram carries the data** — reading a bar chart, a cumulative
   frequency curve, a scale drawing, a grid. The question is unanswerable
   without it.
3. **The drawing IS the answer** — construct, enlarge, reflect, complete the
   shape, plot the points.

Cases 2 and 3 are `visual: true` and get no TEXT retry. Case 1 gets a normal
one. Cases 2 and 3 can still have a retry if it brings its own grid — see
"Diagrams" below.

**You may re-flag an item as `visual: true`, and doing so is an expected
output of this job, not a correction to the last one.** Coding a paper asked
"does this depend on a diagram?"; you are asking the sharper question "can I
state this configuration in words?", and they do not always agree. When you
re-flag, say why in the file header — and change it in
`data/exam-audit/*.json` too if the audit disagrees, or the next regeneration
undoes you.

A bad prose substitute for a graph-reading question is worse than no question,
because the student cannot tell which of the two they are holding.

### 3. Every retry carries its answer

```ts
{ skill: 'Ratio', question: '…', answer: '…', working: '…' }
```

`answer` is optional in the type only because the three hand-authored papers
predate it. **New authoring always includes one.**

This is not decoration. These questions have no parameters, no
`answer_template` and no grader, so `verify-question.ts` and `audit-bank.ts`
cannot see them at all — an answer written alongside is the *only* check
available on them. It also means a teacher handing out thirty sheets is not
left solving thirty questions first.

`working` is one line of method, where the answer alone would not show the
route. Skip it where the answer *is* the method (`'5.21 × 10⁻⁴'` needs
nothing). Not a full worked solution.

Answers print on a teacher-only page at the back of the PDF and never on a
student's sheet. There is a test for that; do not route around it.

---

## Working through a paper

Open the paper's `.ts` file beside the QP. Each question row gives you
everything you need to find its original and judge the rewrite:

```ts
{ id: '7b', label: '7(b)', marks: 3, topic: 'number',
  skill: 'Simple Arithmetic + Simple Charts',
  skillIds: ['simple_arithmetic', 'simple_charts'], kind: 'exam',
  visual: false, desc: 'total mixed-denomination money read from a chart, compared with a bound' }
```

- **`label`** is the number as printed — find `7(b)` in the QP.
- **`marks`** tells you the size. A 1-mark retry should take one step; a 4-mark
  retry should take four. Matching the step count matters more than matching
  the numbers' difficulty.
- **`skillIds`** is what the item is tagged with. If your rewrite no longer
  exercises those skills, the rewrite is wrong — or the tagging is, in which
  case fix it and note it.
- **`visual: false`** means it needs an entry. Unless rule 2 says otherwise.

Note `7b` above: `desc` says "read from a chart", yet it is `visual: false`,
because the *arithmetic* is the assessed part and the chart values can be
given in words. That is a case-1 item, and a fair retry states the money
amounts directly.

### Every retry must stand alone

**Parts are independent items.** 4(a) and 4(b) are separate entries competing
for the same three `MAX_PRACTICE` slots, ranked by marks lost — nothing groups
them, so a student can be given (b) and not (a). A retry that says "your answer
to part (a)", or "the probabilities above", is then unanswerable, and the
student cannot tell whether they are missing a page or missing the maths.

Twelve were written this way before it was noticed. Restate the context
instead — it costs a clause:

> ~~Is your answer to part (a) an overestimate or an underestimate?~~
>
> An estimate of 3.12 × 4.87 + 2.09² is made by rounding each number to 1
> significant figure, giving 19. Is 19 an overestimate or an underestimate of
> the true value?

There is a test for this. It also means sibling parts SHOULD repeat their
shared setup — two retries each opening "The only animals in a field are goats
and hens…" is correct, not redundant.

### Difficulty: parallel, not easier

The instinct is to make a retry gentler, since the student just dropped the
original. Resist it. A student who cannot do the retry has learned something
true; one who breezes through an easier version has learned they are fine, and
they are not. **Same demand, different numbers.**

Pick numbers that are *different in kind*, not just different in value — if the
original divided exactly, do not silently make the retry divide exactly too, or
you have written a question that tests recall of the original.

### Tier pairs share questions — reuse the retry

**Edexcel, OCR AND AQA reuse a block of each Foundation paper on its Higher
partner.** (An earlier version of coding-a-paper.md says AQA does not; June
2025 shows it does, on all three papers). From `coding-a-paper.md`, June 2025:

- Edexcel, contiguous: 2F q20–q27 = 2H q1–q8; 3F q22–q30 = 3H q1–q8;
  1F q20–q24 = 1H q2–q6.
- OCR, interleaved: six from 01 into 04, six from 02 into 05, seven from 03
  into 06.

**The same original must get the same retry**, under both item ids. This is
about forty questions across the two boards — a small saving in effort and a
large one in consistency, since the alternative is the same question being
offered two different practice questions depending on which paper a student
sat.

So do a tier pair in one sitting, exactly as the coding job does.

---

## The file

Fill in the `retrySet` object in `lib/demoPapers/<slug>.ts`. Keys are item ids,
in paper order:

```ts
  retrySet: {
    '1a': { skill: 'Indices', question: 'Work out the value of √81', answer: '9' },
    '2':  { skill: 'Converting Measurements',
            question: '1 stone = 14 pounds. Work out the number of pounds in 5 stone.',
            answer: '70 pounds', working: '5 × 14.' },
    '6':  { skill: 'Simple Arithmetic',
            question: 'Bilal buys three pens and two rulers. The total cost is £9.60. Each pen costs £1.20. Work out the cost of each ruler.',
            answer: '£3.00', working: 'Pens cost £3.60, leaving £6.00 for two rulers.' },
  },
```

`skill` is the human-readable label shown on the sheet — match the item's own
`skill` field unless the rewrite genuinely narrows it.

**Update the file header.** Generated files carry a "WHAT IS DELIBERATELY
ABSENT" note saying they have no `retrySet`; that stops being true. Say what
you added, and record any item you re-flagged as visual and why. The generator
refuses to overwrite without `--force` precisely so these notes survive.

### Characters

`lib/papers/feedbackPdf.ts` maps what jsPDF's built-in fonts cannot draw —
`−` → `-`, `√` → `sqrt`, `π` → `pi`, `≥` → `>=`. Those substitutions are
readable but ugly, so **prefer wording that avoids them**: "the square root of
81" beats `√81` on a printed sheet. `× ÷ ² ³ ° £ ½` all render properly and need
no avoidance.

---

## Checking it

```bash
npx tsc --noEmit && npx vitest run lib/demoPapers/
```

The registry tests catch the structural failures automatically: an entry for a
question that does not exist, an entry on a `visual: true` item, a question
that mentions a diagram, and — the one that matters most here — **partial
coverage**.

Then check the two things tests cannot:

**Read a real sheet.**

```bash
npx tsx scripts/preview-sheet.ts <slug>
```

It prints a weak, a middling and a strong student's sheet plus the answer key,
with no browser and no PDF. Read them as a student would. Only three practice
questions print (`MAX_PRACTICE`), chosen by marks lost, so this is also how you
see *which* of your questions a real sheet actually uses.

Does each one obviously correspond to something that student got wrong? Would
it be answerable by someone who has only this sheet and no exam paper?

**Solve every question cold.** Not "check the answer looks right" — work it
from the question and compare with what you wrote. This is the whole reason the
`answer` field exists, and it is the only gate these questions have. Where you
can, have someone (or something) other than the author do it.

## Diagrams: giving a visual item a retry after all

Rule 2 says a case-2 or case-3 item gets no retry. That holds for a TEXT
retry — but a retry can now carry its own grid, and then those items are back
in play: "reflect this shape" is perfectly answerable on paper once the shape
is printed. The student draws; the teacher marks by eye.

```ts
'14a': {
  skill: 'Congruence and Similarity',
  question: 'Triangle A is drawn on the grid. On the same grid, draw a triangle that is congruent to triangle A, in a different position.',
  answer: 'Any triangle with sides of 3, 4 and 5 units — for example vertices at (6,1), (9,1) and (6,5).',
  diagram: {
    mode: 'polygon',
    x: { min: 0, max: 10, step: 1, label: 'x' },
    y: { min: 0, max: 6, step: 1, label: 'y' },
    background: '<polygon points="1,1 4,1 1,5" stroke="#333" />',
    elements: [{ x: 6, y: 1, marks: 1 }, { x: 9, y: 1, marks: 1 }, { x: 6, y: 5, marks: 1 }],
    tolerance: 0,
  },
},
```

**`background` is what is PRINTED; `elements` is the answer and is not.** The
sheet renders with `showCanonical: false`, so the given shape appears and the
answer does not. Getting these the wrong way round hands the student the thing
they are meant to work out, and it will not look wrong in the source.

Coordinates are in axis units and the wrapper supplies `stroke-width`, so a
background fragment needs only a shape and a `stroke`.

**A background cannot carry text.** `axisCoordGroup` flips Y so grids grow
upward, which mirrors any text in the fragment. So points cannot be lettered
on the grid the way an exam letters them — name them in the QUESTION instead
("The points A(1, 3), B(4, 1) and C(7, 3) are plotted on the grid"), which
reads at least as clearly.

A `RenderedGrid` is deliberately the same spec the student-facing canvas and
the verification harness use — one renderer, and a spec authored here also
feeds the eventual drawing-input surface rather than being thrown away.

Three things learned building the first two:

- **A diagram costs about 45mm of page.** Two of them pushed "Push yourself"
  onto a second sheet. Not a bug, but three diagrams on one sheet will always
  overflow, and paper is what a teacher is printing.
- **Low-mark items are crowded out.** `MAX_PRACTICE` keeps the three questions
  that cost the most MARKS. The two authored here are worth 1 and 2, so a
  student who dropped marks anywhere else never sees them. Diagram retries pay
  off least on exactly the small items that most need a picture. There is a
  test pinning this so it is not rediscovered as a bug.
- **A shared diagram prints once per part.** 4(a) and 4(b) of 1F Jun25 read off
  the same conversion graph, and a student who dropped both gets the graph
  twice on one sheet. The exam prints it once with both parts beneath. Not
  wrong, and not worth special-casing, but it costs a second ~45mm block.
- **`cells` grids still carry tick numbers.** `gridSvg` always draws axes, so
  a pure shading task comes out numbered 0–6 where the exam's grid has no
  axes at all. Not wrong — it is still shadeable, and the numbers give the
  student a way to describe their answer — but it is not how the original
  presents, and an axis-free mode would need a change to `gridSvg` rather
  than to the spec.
- **You cannot eyeball a diagram from `preview-sheet.ts`.** svg2pdf walks a
  real SVG element, so grids need a browser; in Node the rest of the sheet
  builds and the grids are silently skipped. Check diagrams by generating a
  PDF from `/mark` in a browser.

### The diagram guard is not hypothetical

Writing this doc, `preview-sheet.ts` immediately surfaced *"Work out the
**shaded** area between the circles"* in a hand-authored retry set. Nothing was
shaded, because nothing was drawn — the author had the question paper open and
carried a word across from it without noticing. It had passed every test and
been in the repo for months.

That is exactly the failure rule 2 guards against, it was invisible in review,
and it is now a test.

---

## What this does not cover

**Challenge questions are already done** and are not per-paper — sixty of them
live pooled by topic and tier in `lib/papers/challengePool.ts`, and every paper
draws from that automatically. Do not add `challengeQuestions` to a paper unless
you deliberately want to override the pool for it.
