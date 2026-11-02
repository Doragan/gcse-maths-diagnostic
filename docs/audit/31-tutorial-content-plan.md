# Tutorial content — scope

_Scoped 2026-11-02. Every file and figure below was opened on the day, not
recalled. Counts of what exists are from the working tree; the two claims that
depend on the database (how many published questions a skill has) are marked as
unverified where they appear._

**The one-line version.** The app can already tell a student how to recognise
and work a skill; it cannot yet build the concept underneath. This scopes a
third content layer — a short interactive investigation where the student
predicts, varies one thing, watches it move, and commits to a generalisation —
built on the grid widget that already exists, and piloted on one skill before
anything is authored at scale.

---

## 1. Why this, and why now

The teaching surfaces today answer two questions: _what is on the paper_
(`lib/skills/examProfile.ts`) and _how do I spot and work this_ (the briefings).
Neither answers _what does this mean_. A student who does not know what `c` does
to a line can read the whole briefing on straight-line graphs, agree with all of
it, and still not have the idea.

The motivating case is a classroom investigation that worked: plot several lines
that differ only in `c`, ask what `c` is doing, then vary `m` and ask the same
again. Its value is not the plotting — it is that the student forms the rule
themselves and can then state it.

### What this is NOT evidence-backed for

Retention is the measured problem (`project_retention_baseline`: median active
days = 1; the leak is day 1 → 2), and nothing measured says missing concept
teaching is why. The plausible story — a student hits a wall, gets a briefing
written for someone who already has the concept, and leaves — is a story. §10
makes it falsifiable before the content bill is paid. **Two of 160 skills, then
measure.** That is the whole discipline this plan is asking for.

---

## 2. What already exists, verified

Most of this build is wiring, which is the reason it is worth doing at all.

| | where |
|---|---|
| 19 authored skill guides: recognition cues, confusables with minimal pairs, judgeable stems, method steps carrying `because` + `watch`, check questions | `data/skillBriefings/*.ts`, types in `data/skillBriefings/types.ts` |
| Tier-aware flattening (Foundation never sees Higher material) | `resolveBriefing()`, `data/skillBriefings/types.ts` |
| Sparse-by-design registry; every entry point checks first | `getBriefing` / `hasBriefing` / `briefedSkillIds`, `data/skillBriefings/index.ts:82` |
| The page, in the order a stuck student needs: recognise → confusable → judge → method → check | `app/skill/[slug]/page.tsx` (1,438 lines) |
| Student decisions already on that page (judge a stem; pick which of a pair is this skill), with deterministic ordering so position can't be learned | `lib/skills/briefingQuiz.ts` |
| Authored inline SVG held to shapes-and-text by test: `currentColor` only, viewBox, no fetch, `alt` required | `lib/skills/briefingFigures.ts`, `briefingFigures.test.ts` |
| **Interactive snap-to-grid canvas**: tap to place, tap to remove, arrow-key + Enter, hover preview, ghosted canonical overlay | `components/practice/GridCanvas.tsx` |
| Eight grid modes — `points`, `polyline`, `line`, `cells`, `polygon`, `bars`, `bars_free`, `number_line` — with per-element marks and wrong-drawing traps | `lib/questions/gridDraw.ts:167`, `checkGridDraw` at `:272` |
| Static grid rendering from the same builders the canvas uses | `lib/questions/gridSvg.ts` (`gridGeometry`, `buildGridFrame`, `buildPointsLayer`, `buildSolutionLayer`, `buildLabelsLayer`, `buildGridSvg`) |
| Upright text at axis coordinates (a background cannot carry text — the Y-flip mirrors it) | `GridLabel`, `lib/questions/gridDraw.ts:66` |
| The attach point: a prompt shown **only after a wrong answer**, only when the skill has a guide | `app/practice/question/[id]/page.tsx:1198` |
| Pre-publish verification incl. `--svg` rasterise-and-eyeball | `scripts/verify-question.ts` |
| Misconception taxonomy wired to a live teacher surface | `data/misconceptions.ts` (41 entries), `project_trap_tagging_feeds_teachers` |

Two facts worth stating plainly, because they decide the design:

1. **`grid_draw` is built and essentially unexploited.** `docs/audit/06` §Revised
   counts ~86 marks of coded exam traffic fitting its modes against **6 authored
   parts**. The interaction this plan needs is the one already paid for.
2. **The briefing is a decision surface, not a document.** `briefingQuiz.ts`
   exists because the page used to be read-only and "nothing they did could be
   right or wrong and nothing came back". An investigation is the same argument
   carried one step further.

---

## 3. The gap, named

| layer | question it answers | status |
|---|---|---|
| Exam profile | What does the paper do with this? | derived, live |
| Briefing | How do I spot it, work it, check it? | 19 of 160 skills |
| **Investigation** | **What does this actually mean?** | **missing** |

Keep it a separate layer rather than a fourth field on `SkillBriefing`. A
briefing addresses a student about to sit a paper; an investigation addresses one
who does not yet have the concept. Different reader, different moment, different
authoring rhythm — and the briefing schema is already dense.

---

## 4. The design problem: discovery without the dialogue

What makes the classroom version work is the teacher responding to what the
student says. That part cannot be had. What can be had is the part that does most
of the work:

> **Make the student commit to a prediction, then let the figure contradict them.**

A student who predicts the line crosses at 3, is wrong, and watches it cross at
−3 has had something close to the conversation. Every step below is a
**constrained, markable** action — no free text anywhere:

| phase | the student does | marked by |
|---|---|---|
| **Predict** | taps where they think it crosses, before anything is drawn | `checkGridDraw` |
| **Act** | types their own values and draws them, within an authored domain | — |
| **Observe** | a table fills as they go, so the pattern accumulates visibly | — |
| **Generalise** | completes a sentence from drop-down slots, then meets the word for what they just found (§6.1) | exact match per slot |
| **Transfer** | answers one real question on the skill | the real grader |

The generalisation step is where free text is tempting. Don't: free-text marking
is parked (`project_free_text_marking`), and a wrong verdict at the moment a
concept is forming teaches the misconception. Drop-down slots still force the
articulation — the student must choose between "moves up" and "moves right",
which is exactly the distinction being taught.

### The wrong options are diagnoses

A wrong slot choice is a misconception, and misconception ids drive a live
teacher surface. The taxonomy's own rule is that an entry must be able to fire in
more than one skill (`data/misconceptions.ts` header), and one new entry clears
it: **`confused_gradient_with_intercept`**, which would fire in
`understanding_straight_line_graphs`, `perpendicular_gradients`,
`kinematic_graphs`, `trig_graphs` and `gradient_of_a_curve`. Direction slips
reuse the existing **`sign_error`**. Minting the one new id is part of
Increment 2, not a separate project.

### The rule this layer needs that questions do not

> **Every wrong option must be wrong for a reason that survives a
> mathematician reading it sideways.**

The first draft of this plan had stage 1 ask whether a bigger `c` moves the line
"up" or "to the right", marking "right" wrong and tagging it
`translated_the_wrong_axis`. That option set is unsound: for a straight line,
**moving up by `k` is the same line as moving left by `k ÷ m`**, so a student
reasoning about horizontal shifts is not making an error — the picture genuinely
cannot distinguish them. The slot now asks up versus **down**, which has one
answer.

This is the investigation equivalent of a dead trap, and the harness cannot
catch it: `verify-question.ts` can prove a distractor is reachable and distinct,
not that it is *defensibly* wrong. So it is a review rule, and it belongs in the
authoring doc. The compensation is that the ambiguity itself is worth teaching —
see `aside` in §6.

---

## 5. Three tiers, so 160 skills stays tractable

Bespoke investigations do not scale; that is the whole reason this needs a plan
rather than enthusiasm.

| tier | what it is | cost | how many |
|---|---|---|---|
| **A — investigation** | predict → vary → observe → generalise → transfer | a real build each | ~20 skills |
| **B — gated demonstration** | the briefing's existing worked example, with each step's reveal gated behind "what's the next move?" | one additive field + a renderer change | every briefed skill |
| **C — briefing as it stands** | unchanged | nil | the rest |

**Tier A is only for skills where the concept is a visible change in something
the grid can draw** — or in a table, which needs no figure at all (§6.2).
Verified ids from
`data/skills.ts`: `understanding_straight_line_graphs`,
`plotting_straight_line_graphs`, `perpendicular_gradients`, `quadratic_functions`,
`gradient_of_a_curve`, `kinematic_graphs`, `scatter_graphs`, `enlargements`,
`fractional_enlargements`, `reflections`, `rotations`, `translations`, `symmetry`,
`sequences`, `finding_the_nth_term`, `nth_term_quadratic_sequences`,
`direct_proportion`, `inverse_proportion`, `proportion_with_powers`, `trig_graphs`.
A skill whose concept is a rule to apply rather than a behaviour to notice
(`rounding`, `converting_measurements`) gets Tier B and loses nothing.

**Tier B is what gets coverage**, and it is nearly free. `MethodStep` already
carries `do`, `example`, `because`, `watch` and the page already runs one worked
question down the side. Add one optional field:

```ts
// data/skillBriefings/types.ts, on MethodStep
/**
 * Two plausible WRONG next moves, for gating this step's reveal behind a
 * decision. The real `do` is the third option. Omit to leave the step
 * ungated — a briefing with none behaves exactly as it does today.
 */
nextMoveDistractors?: [string, string]
```

That is additive, back-compatible, authorable for all 19 existing briefings
without rewriting them, and needs no new file, route or data shape.

---

## 6. The authoring format

**The student chooses the values.** An earlier draft had the author enumerate
three to five frames, each carrying a prebuilt `RenderedGrid`, so the harness
could rasterise every frame a student could ever see. That is the wrong trade,
and the repo already says so: a question's numbers are not enumerated either —
they are **parameters with constraints**, and `verify-question.ts` samples the
space (exhaustive to 20k, `--draws N` above it). An investigation's control is
the same object. Authoring a domain and sampling it gives the same verification
guarantee while letting a student type the value they are curious about, which is
what the classroom version does and the whole reason it works.

What replaces the frame list is a **domain plus a coverage rule**. The domain
bounds what can be drawn (so a line never leaves the axes, and `verify` can
sample it); the coverage rule decides when the generalisation may be attempted,
and it is a teaching move, not a counter: three positive values of `c` do not
show what `c` does, so the conclusion stays shut until the student has drawn a
negative one too. Suggested values remain, as a nudge for a stuck student, never
as the path.

```ts
// data/investigations/types.ts (new)

export type Control = {
  /** The letter the student is changing. 'c' */
  name: string
  /** What the student may type. Sampled by the harness, enforced in the UI. */
  domain: { min: number; max: number; step: number }
  /** Offered when nothing has been drawn yet. A nudge, not the path. */
  suggest?: number[]
  /** The line (or shape) this value produces, as a RenderedGrid. */
  render: (v: number) => RenderedGrid
  /** How the equation is written at this value. */
  label: (v: number) => string
  /** This value's row in the observation table, one cell per header. */
  row: (v: number) => string[]
  /**
   * null when the conclusion may open, else what is still missing, in the
   * student's words. The teaching move: a pattern is not visible from three
   * values on the same side of zero.
   */
  coverage: (drawn: number[]) => string | null
}

export type Stage = {
  /** What to notice. One sentence, above the figure. */
  ask: string
  /**
   * The commitment, asked BEFORE any frame is shown.
   *
   * Without it the student scrubs the control, agrees with whatever happens,
   * and learns nothing — the read-only failure briefingQuiz.ts was written to
   * fix, in a new costume.
   */
  predict?: {
    prompt: string
    on:
      | { kind: 'grid'; grid: RenderedGrid; expect: GridPoint[] }
      | { kind: 'choice'; options: string[]; correct: number }
    /** Shown after the reveal either way. States what happened; never scolds. */
    reveal: string
  }
  /** Absent on a stage with nothing to vary (stage 3 of the pilot). */
  control?: Control
  observe?: { headers: string[] }
  /** The generalisation. */
  conclude: {
    /** 'As c increases, the line moves {0} and its steepness {1}.' */
    sentence: string
    slots: {
      options: string[]
      correct: number
      /** Per wrong option, the diagnosis. Null where none fits — never mint one to fill a gap. */
      misconceptions: (string | null)[]
    }[]
    /** Why — shown once every slot is right. */
    because: string
  }
  /**
   * Something true that the slots had to flatten to have one answer.
   *
   * Shown with `because`, asked about never. Stage 1's is the up-versus-left
   * equivalence (§4): the option set cannot admit it, and a student who
   * noticed it deserves to see it named rather than marked wrong.
   */
  aside?: { head: string; body: string }
}

export type Investigation = {
  /** Must exist in data/skills.ts. */
  skillId: string
  title: string
  /** Author-facing: why this concept needs varying rather than telling. */
  premise: string
  stages: Stage[]
  /**
   * PUBLISHED question ids on this skill, 3–5 of them, walked one at a time
   * through /practice/question/[id] — real grader, real attempts, real
   * mastery, and the measurement in §10.
   *
   * Deliberately an authored list rather than a practice run: skill-focused
   * practice is a PAID focus mode (app/practice/page.tsx:352 sends free and
   * anonymous students to /student/upgrade), and the students an investigation
   * exists for are exactly the ones that would bounce off. Individual question
   * pages work signed out, with attempts held in localStorage and migrated on
   * login (lib/pendingPractice.ts). Opening skill-focused practice to them is
   * a pricing decision, not part of this scope.
   */
  transferQuestionIds: string[]
}
```

### 6.1 Naming the thing: the vocabulary step

The slots deliberately say "how much `y` changes for every 1 across" rather than
"the gradient". That keeps the generalisation answerable by a student who has
just built the idea — and leaves them without the word the exam uses, which is
a real hole. **The investigation teaches the concept and works around its name.**

So each stage may carry a `naming` block, shown **after** `because` and never
before it: a name lands on a concept that already exists, which is the whole
reason this layer is the right place for it. Four fields:

```ts
naming?: {
  /** 'the gradient' */
  term: string
  /** What the student has just built, pointing at their own table. */
  means: string
  /** The same word doing work outside mathematics. */
  elsewhere: string
  /** How the paper words it, so the term is recognisable in an exam. */
  onThePaper: string
}
```

`elsewhere` is the field that does the unusual work, and it is not decoration.
A road sign warning of a steep hill gives its **gradient** — 1 in 5, 20%, rise
over run, exactly what the student has been measuring; the word is Latin
*gradus*, a step, which is also *grade*, *gradual* and *degree*. To **intercept**
is to cut across something's path and meet it — a pass, a message, a runner — and
the y-intercept is where the travelling line meets the axis in its way. A student
who has those anchors can say "the gradient is 3" instead of "it goes up 3 each
time", which is the actual goal.

**The vocabulary is then checked by being used, not by being recalled.** Stage 1
names the y-intercept, stage 2 names the gradient, and stage 3's slots are the
formal words with each other as the distractor: _c is the_ {y-intercept /
x-intercept} _and m is the_ {gradient / intercept}. No new input type, no
glossary page, and a wrong choice is still a tagged misconception.

This has a precedent in the repo, and the principle is already written down.
`scripts/gloss-universal-set.ts` added one grey line to four set-notation stems
because "a symbol they cannot read is a question they cannot start", and its
comment states the rule this section generalises:

> This is the one place our questions should say more than the paper does.

That gloss is per-question and hand-placed. `naming` is the systematic version,
and it sits one layer up: a word explained once, where the concept was built,
rather than re-glossed in every stem that uses it.

### 6.1.1 What still waits on free text

The half of this that needs free text is the half about the student's own
language: **helping them describe their thinking in correct mathematical terms.**
That needs them to produce a sentence and get something back about it, and
nothing here can do that.

An earlier draft of this plan put an unmarked "in your own words" box before the
slots, on the theory that articulation teaches even ungraded. **Cut, 2026-11-02.**
A box that returns nothing teaches nothing a student can act on, and the line
admitting it is unmarked only tells them it is optional. If the writing is worth
asking for, it is worth answering — so it comes back with free text or not at
all, and `project_free_text_marking` holds the conditions.

What that means for the increments: no student-written text is stored, so no
column, no RLS policy and no privacy-notice line. The data-protection work that
was Increment 3 is gone with it.

### 6.1.2 Free text: now or after this ships? After — with a named trigger

Asked 2026-11-02. The answer is after, and not for the reasons the original
parking decision gave.

**What a marker here would actually be is much narrower than exam marking.** Not
a proof, not an open "explain why": a sentence about one concept, against a
reference answer this plan already authors (`conclude.because`) and a term it
already defines (`naming.term`). Rubric-shaped, a handful of marking points,
reference answer in hand. That is the easiest marking job in the product, which
is exactly why it is tempting to do first.

**Three reasons it still waits.**

1. **There are no real answers to tune it against.** A marker built now would be
   measured against sentences I invented, and it would score beautifully on
   them. Real ones read "it gets steeper when the number is biger" — misspelt,
   half-right, using "number" for two different things in one clause. A marker
   that has never seen those is not a marker, and no amount of care in the
   prompt substitutes for the corpus.
2. **Waiting costs almost nothing, structurally.** Free text is additive here: a
   field on `conclude`, a route, a prompt. The naming step and the slots stand
   on their own and the investigation is complete without it. Compare that with
   the cost of getting it wrong early, which is a wrong verdict at the moment a
   concept is forming.
3. **The notice and DPIA work is unchanged and is the bigger half.** It does not
   get cheaper by happening sooner, and it blocks a PR rather than a feature.

**And one reason that is new: stage 3 measures the thing free text would check,
for free.** The formal-word slots (§6.1) are a vocabulary test. If students pick
`gradient` and `y-intercept` correctly, the vocabulary problem is substantially
solved without any marking; if they cannot, that failure *is* the specification
for what the marker is for, and it comes with data. Shipping first turns a guess
into a measurement.

**The trigger, so "later" means something.** Build it when **both** hold:

- Increment 3 has reported, and either the stage-3 formal slots show students
  can recognise the words but there is reason to think they cannot produce them,
  or a teacher asks for written explanation.
- **~50–100 real student sentences exist to measure against.** They do **not**
  have to come from the app. One lesson, on paper, answering "in your own words,
  what does the gradient tell you?" gets there with no engineering at all, and
  it is the cheapest experiment in this document. Reading thirty of those would
  tell us more about whether this is markable than any amount of design.

The thing not to do is ship the box before the marking. An unmarked box was cut
from this plan for good reason (§6.1.1), and a silently-stored one is worse: it
buys a corpus of deliberately low-effort answers from students who were told it
did not matter, which is a biased sample aimed at the wrong target. When the box
returns, it returns working.

### 6.2 The figure is the plug-in point, and it is wider than it looks

Everything in §6 except `Control.render` is subject-agnostic. The stage shell,
the lock/unlock, the prediction, the coverage gate, the table, the naming step,
the slot sentence, the registry, the route, the events — none of it knows what a
line is. Only `render(v) => RenderedGrid` does.

So the question for every later investigation is what its figure needs, and
`RenderedGrid` carries **four independent layers**, verified in
`lib/questions/gridSvg.ts`:

| layer | what it can hold | interactive |
|---|---|---|
| `background` | arbitrary SVG shapes in axis coordinates, via `axisCoordGroup` — a curve, a shaded region, a printed shape. **No text**: the group flips Y, which mirrors it (`:205`) | no |
| `elements` | one `GridDrawMode`'s worth of marks, with per-element marks and traps | **yes** — this is what `checkGridDraw` grades |
| `solution` | a method overlay drawn on reveal only (`buildSolutionLayer`) | no |
| `labels` | upright text at axis coordinates, drawn last (`buildLabelsLayer`) | no |

That is a much larger drawing surface than "eight modes" suggests. A curve with a
tangent on it is a `background` polyline plus a `line` element. A scatter graph
with a line of best fit is the same shape of thing. The real constraint is that
**only one layer is checkable**, which bites on the prediction step and nowhere
else — and a prediction is a single gesture anyway.

Two consequences for the format, both already in the types:

- **A stage may have no figure at all.** `control` is optional and so is
  `observe`; a sequences investigation is a control, a table and a conclusion,
  and needs no grid. That case is cheaper than the pilot, not dearer.
- **A skill whose concept is not a visible change in a drawable figure is not
  Tier A.** "Why does dividing by a fraction multiply" wants an area or bar
  model, which is not a `RenderedGrid` and would be a genuinely new build. It
  gets Tier B until someone decides that model is worth having. The standing
  risk, once the shell exists, is forcing such a skill through the grid because
  the shell is there.

Registry mirrors the briefings exactly — `data/investigations/index.ts` with
`getInvestigation` / `hasInvestigation` / `investigatedSkillIds`, sparse by
design, every entry point checking first. A registry test holds every authored
frame to the `briefingFigures` safety rules (`currentColor` only, viewBox, no
`<script>`, no external href, `alt` present).

---

### 6.3 An investigation is a parameterised object, like a question

Every fixed number in an investigation is **drawn under constraints**, not
authored: the value the student predicts in stage 1, the comparison in stage 2's
prompt, the line to read in stage 3. A student who comes back does not meet the
dot they remember, and two students side by side are not predicting the same
point.

This is `paramEngine` applied one level up, and it means the same thing has to be
true of the harness: an investigation's parameter space is sampled the way a
question's is, and the same degeneracy checks apply. That is not theoretical.
Enumerating the pilot's stage-3 space found that **4 of its 24 combinations are
degenerate** — when `m = c`, the "swapped `m` and `c`" distractor renders as the
same equation as the right answer, so a student reading the line backwards is
marked correct. `verify-question.ts` already FAILs exactly this for explicit MC
options, and its rule is the one to follow here: where a constraint exists that
removes every degenerate case, use the constraint rather than rejection
sampling. So `c3 ≠ m3` is a constraint on the draw.

Two smaller things the same enumeration settled, both worth copying into any
later investigation:

- **The correct option's position must be checked, not assumed.** The first
  deterministic shuffle put the right answer in the last two positions twice as
  often as the first two. Hashing the signs as well as the magnitudes spreads it
  evenly (5/5/5/5 across the 20 valid draws).
- **Some parameters are bounded by the teaching, not the geometry.** Stage 1's
  target must be ≥ 2 so the new line is visibly clear of `y = x` and the stem
  reads "+ c"; stage 2's comparison must exceed 1, or "steeper" is not the
  answer. A domain that only keeps the figure on the axes is not enough.

---

## 7. The pilot: what `m` and `c` do

Teaches `understanding_straight_line_graphs` (prereq `plotting_straight_line_graphs`,
itself prereq `coordinates` — so plotting is assumed, not taught). Mode `line`
throughout; two elements define each line.

**Stage 1 — what `c` does.**
- _ask_: "This is `y = x`. Before you change anything: where will `y = x + 3`
  cross the y-axis?"
- _predict_: `kind: 'grid'`, the student taps one point, `expect: [{x: 0, y: c1}]`
  where `c1` is drawn from 2…5 (§6.3) — the target is not fixed at 3
- _control_ `c`: domain `−6…6` step 1, suggests `3, −2, 5`. The student types
  the values; every line drawn stays on the axes as a ghost.
- _coverage_: two values at least, one positive, one negative
- _observe_: headers `['your equation', 'crosses the y-axis at']`
- _conclude_: "In `y = x + c`, the number `c` tells you
  {0}, and making `c` bigger moves the line {1}."
  - slot 0: _where it crosses the y-axis_ / _how steep it is_ →
    `confused_gradient_with_intercept`
  - slot 1: _up_ / _down_ → `sign_error`. **Not** up-versus-right, which has two
    defensible answers — see §4.
- _aside_: up by `k` is the same line as left by `k ÷ m`, which is why a line is
  pinned down by intercept and gradient rather than by a direction of push, and
  why that stops being true for a curve.

**Stage 2 — what `m` does.**
- _ask_: "Now `c` stays at 0. What changes when the number in front of `x` changes?"
- _predict_: `kind: 'choice'` — "`y = m₂x` will be …" _steeper_ / _less steep_ /
  _shifted up_, with `m₂` drawn from 2…4 (above 1, or "steeper" is not the answer)
- _control_ `m`: domain `−4…4` step 0.5, suggests `2, ½, −1`
- _coverage_: two values at least, one positive, one negative — a student who
  only ever tries `2` and `3` has not met the interesting case
- _observe_: headers `['your equation', 'across 1, y changes by', 'direction']`
- _conclude_: "In `y = mx + c`, `m` tells you {0}, and a negative `m` makes the
  line slope {1} as you go right."
  - slot 0: _how much y changes for every 1 across_ / _where it crosses the
    y-axis_ → `confused_gradient_with_intercept`
  - slot 1: _down_ / _up_ → no id; it is a misread of their own table

**Stage 3 — reverse it.** Give the line, ask for the equation — the skill's own
exam task, and the strongest framing per `feedback_synthesis_authoring`
(reverse/constraint beats forward application).
- _ask_: "Here is a line you have not seen. What is its equation?"
- _predict_: `kind: 'choice'` over four equations, the distractors being `m`/`c`
  swapped, the sign of `m` flipped, and the sign of `c` flipped. The line itself
  is drawn (`m₃` from ±2, ±3; `c₃` from ±2…±4, constrained `c₃ ≠ m₃` — §6.3)
- _no control_: there is nothing to vary here, which is the point
- _conclude_: "To read any straight line: `c` is {0}, and `m` is {1}."

Then `transferQuestionIds` → 3–5 published questions on the skill, one at a
time, through the existing question page. **Unverified:** whether suitable ones
exist in the bank (`docs/audit/06` lists the skill at 21 marks of coded traffic,
so it is well covered on paper). Authoring whatever is missing is part of
Increment 2 and goes through `verify-question.ts` as usual.

---

## 8. Where it attaches

| | |
|---|---|
| Route | `/skill/[slug]/investigate` — a sibling of the briefing, not a section inside 1,438 lines |
| Title rule | one row in `lib/pageTitles.ts` RULES: `[/^\/skill\/[^/]+\/investigate$/, 'Investigation', '/skill/[slug]/investigate']`. The existing briefing pattern at `:82` is `$`-anchored so it cannot swallow this, but house order is specific-before-parent anyway. The third element is not optional — without it the slug reaches GA4 |
| Entry 1 | the existing after-a-wrong-answer prompt (`app/practice/question/[id]/page.tsx:1198`) — offer the investigation ahead of the briefing when both exist, because a wrong answer on a concept the student lacks is the exact moment |
| Entry 2 | `/skills` and the briefing page, as a quiet link — never a thing to browse |
| Mastery | **the investigation writes none.** Internal steps are not evidence. The only row that reaches `practice_attempts` is the transfer question, answered normally through the real loop |
| Analytics | `trackEvent` (`lib/analytics.ts:164`): `investigation_start`, `investigation_predict` (stage, correct), `investigation_conclude` (stage, slot, misconception), `investigation_transfer` (correct). **Which skill rides on the event, not the path** — the same split the briefing already uses (`lib/pageTitles.ts:77`, `skill_briefing_view`). Enough for §10 and nothing more |
| Signed-out | works, like the briefing and anonymous practice. No gate |

---

## 9. Increments

Each is independently shippable and each ends with something the user can look at.

1. **Tier B gating** — `nextMoveDistractors` on `MethodStep`, the gated reveal in
   the method section, distractors authored for **one** briefing. Smallest
   possible test of "does a decision beat a reveal". No new route, no new file.
2. **The shell, with the straight-line investigation as its first consumer** —
   `data/investigations/` (types, registry, registry test), the
   `/skill/[slug]/investigate` route, `GridCanvas` in predict mode, the
   student-entered control with its domain and coverage rule, the observation
   table, the slot sentence, the `naming` blocks for gradient and y-intercept
   (§6.1), the parameter draw and its constraints (§6.3), the one new
   misconception id, the title rule, the analytics events, the authored
   transfer list.
   Build it as a **shell that renders an `Investigation`**, never as a page
   about lines — §6.2 is why that distinction decides whether Increment 4 is
   cheap. **Harness work is part of it:** the control's domain is sampled the
   way question parameters are, so `verify-question.ts` (or a sibling reusing
   its sampling) must draw every value a student could type and assert the
   figure stays on the axes and the labels stay legible.
3. **Entry points + measurement** — wire both entries, ship the events, leave it
   alone for long enough to read §10.
4. **Second investigation — chosen to stress the shell, not to be easy.** A
   second line-shaped skill would prove nothing. Take `enlargements`: a
   `polygon` figure, two shapes on the axes at once, a scale factor as the
   control, and the concept is visibly the same kind of thing while every
   detail of the figure differs. If the shell survives that with no changes
   outside `data/investigations/`, it generalised; if it does not, Increment 2
   was secretly a page about lines and this is where that is discovered —
   cheaply, on the second one, rather than on the seventh.
5. **Tier B at breadth** — distractors for the remaining 18 briefings, once
   Increment 1 has been measured. Authoring, no engineering.

Do **not** author investigations 3–20 before Increment 4 has reported whether
the shell held. That is the mistake this document exists to prevent.

---

## 10. How we will know

Measured on the pilot skill, with the events from §8:

| question | read it from |
|---|---|
| Do they finish one? | `investigation_start` vs `investigation_conclude` on the last stage |
| Does the prediction bite? | share wrong at `investigation_predict` stage 1 — **if almost everyone predicts correctly the investigation is teaching nothing** and the frames are too easy |
| Do they explore, or take the suggestions? | share of drawn values that came from the student's own typing versus the `suggest` chips — if nobody types their own, the control may as well have been a frame list |
| Does it transfer? | `investigation_transfer` correct rate, against the same skill's first-attempt rate for students who never opened it |
| Does it hold? | next-day return rate for students who completed one, against the day-2 baseline in `project_retention_baseline` |

Honest limits: the cohort is small (103 students ever, 17 ever returned), so this
cannot be a clean A/B. Treat the transfer-rate comparison as the primary signal
and retention as directional only. A null result after a few dozen completions
means stop at two investigations and put the effort into Tier B, which is cheap
enough not to need the evidence.

---

## 11. Why not Desmos

Asked 2026-11-02 and worth recording, because it will be asked again. Facts
below are from the Desmos API v1.8 documentation
(`https://www.desmos.com/api/v1.8/docs/index.html`), read on the day.

**What it would genuinely give us.** Real function plotting rather than a
polyline approximation; `sliderBounds` plus `playing` for continuously animated
variation; a student typing any equation and having it parsed and drawn
properly; `HelperExpression(...).observe('numericValue', …)` to watch a value
change; Braille modes (`nemeth`, `ueb`), six-key input and audio trace, which
exceed anything hand-rolled here. For curve-shaped skills — `quadratic_functions`,
`gradient_of_a_curve`, `trig_graphs` — it is plainly nicer than a background
polyline.

**Why it is not the figure engine for this layer.**

| | |
|---|---|
| **Exam fidelity** | GCSE prints ruled squares with integer lattice points and labelled axes; `gridSvg` is built to look like that, and `feedback_exam_format_fidelity` is a standing rule here. Desmos looks like a graphing calculator — a tool the student does not have in the exam |
| **Nothing to grade with** | `checkGridDraw`, per-element marks, wrong-drawing traps and misconception ids all key off `RenderedGrid`. The prediction step would stay on our own grid regardless, so Desmos could only ever be the display half |
| **No read-only mode** | the docs state there is no general non-interactive mode; the only lock is `authorFeatures: true` with readonly expressions, and display properties stay editable |
| **The harness cannot see it** | `verify-question.ts --svg` rasterises authored grids outside a browser. `asyncScreenshot` can emit SVG, but only from a live calculator built on a DOM element, and no server-side or headless path is documented |
| **Commercial unknown** | the demo key `dcb31709b452b1cf9dc26972add0fda6` is development-only; production means e-mailing partnerships@desmos.com. The docs page carries no pricing, no licence terms and no educational-versus-commercial distinction, so the cost of shipping it in a paid product is simply not knowable from the documentation |
| **A third party on a student page** | `calculator.js` loads from www.desmos.com at runtime (no npm package; self-hosting exists but only via a private repo they grant). That is another processor seeing a pupil's IP, which lands back in the same notice work as `project_school_data_protection` |

**Where it could still earn a place, later.** A free-exploration sandbox at the
end of a curve investigation, marked nothing and graded nothing — the one job
where interactivity beats fidelity and no grading integration is needed. That is
a feature with a partnership e-mail attached and no assessment value, so it waits
until there is a curve investigation to hang it on.

**Note for anyone prototyping it:** it cannot be shown in an Artifact. The
artifact CSP admits scripts only from a fixed CDN allowlist, and www.desmos.com
is not on it. Trying Desmos means a local branch.

---

## Explicitly not in scope

Free text of any kind, marked or not (§6.1.1); storing anything a student
writes; a general graphing
engine; video; any investigation writing mastery; opening paid skill-focused
practice to free students (a pricing decision, see §6's `transferQuestionIds`);
teacher-facing investigation analytics; investigations for skills outside §5's
list; dragging on the canvas (the gesture vocabulary stays tap-only, per
`GridCanvas.tsx`); a box-plot mode (`docs/audit/06` — still the one drawing case
`grid_draw` does not cover).

---

## Pointers

- `data/skillBriefings/types.ts` — the schema this layer deliberately does not extend, and the authoring rules worth copying (`Cue.example`, the near-miss rule)
- `lib/skills/briefingQuiz.ts` — why a reveal is not a decision; the deterministic-ordering argument reused in §4
- `lib/skills/briefingFigures.ts` + `briefingFigures.test.ts` — the figure safety rules the frame registry test inherits
- `lib/questions/gridDraw.ts` / `gridSvg.ts` / `components/practice/GridCanvas.tsx` — the whole interaction surface, already built
- `docs/audit/06-app-gap-plan.md` §Revised — `grid_draw` shipped and unexploited; "the actual bottleneck is now authoring, not engineering"
- `docs/audit/28-induction-stub.md` — the other parked teaching surface; this is not that
- `project_retention_baseline` (memory) — the day-2 cliff §1 refuses to claim this fixes
- `project_trap_tagging_feeds_teachers` (memory) — why §4's wrong options carry misconception ids
- `feedback_synthesis_authoring` (memory) — the reverse/constraint framing Stage 3 uses
- `project_page_titles` (memory) — the rule §8 must add, and where to put it
- `project_verify_harness` (memory) — the gate every frame goes through
