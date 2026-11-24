import type { RenderedGrid, RenderedAxis, GridPoint } from '../../lib/questions/gridDraw'

// ─────────────────────────────────────────────────────────────────────────────
// An investigation — the concept layer under a skill briefing.
//
// A briefing addresses a student about to sit a paper: how to recognise the
// question, work it, and check it. An investigation addresses one who does not
// yet have the idea, and it builds the idea the only way that survives
// digitisation: the student COMMITS to a prediction, changes one thing, watches
// what happens, and then states the rule.
//
// Scoped in docs/audit/31-tutorial-content-plan.md. The two rules that decide
// the shape of everything below:
//
//   • Every student action is constrained enough to mark. No free text — not
//     because writing is worthless, but because an unanswered box teaches
//     nothing and a wrong verdict at the moment a concept forms teaches the
//     misconception (§6.1.1).
//   • The student picks the VALUES. The control is a domain, not a list of
//     frames, for the same reason a question's numbers are parameters rather
//     than an enumeration — and the harness samples it the same way (§6.3).
// ─────────────────────────────────────────────────────────────────────────────

/** One draw of an investigation's parameters: name to value. */
export type Params = Readonly<Record<string, number>>

/**
 * The numbers an investigation draws afresh for each visit.
 *
 * Deliberately a small enumerable space rather than a range: it is tiny, so
 * the harness can walk ALL of it and the degenerate draws have nowhere to
 * hide. Enumerating the pilot's stage-3 space is what found that 4 of its 24
 * combinations made a distractor render identically to the right answer.
 */
export type ParameterSpec = {
  /** Candidate values per parameter. */
  values: Readonly<Record<string, readonly number[]>>
  /**
   * False for a draw that must never reach a student.
   *
   * A CONSTRAINT, not rejection sampling after the fact: where a rule removes
   * every degenerate case, verify-question.ts demands the rule, and the same
   * applies here.
   */
  valid?: (p: Params) => boolean
}

/**
 * What the student varies, and the rules around it.
 *
 * `render` takes the WHOLE history rather than one value, which is the one
 * place this departs from the type sketch in docs/audit/31 §6. The figure is
 * cumulative — every line drawn stays on the axes, which is what makes the
 * pattern visible at all — so it is a function of everything drawn plus which
 * one is live, not of a single value. It lands naturally on the four layers a
 * RenderedGrid already has (§6.2): the ghosts go in `background`, which is
 * display-only, and the live one in `elements`.
 */
/**
 * A control the student drives by TAPPING THE LINE rather than typing a value.
 *
 * Some things cannot be asked for in a number box. "Pick two points and work
 * out the gradient between them" is one: the whole idea is that the pair is
 * the student's own choice and the answer comes out the same anyway, which a
 * slider over one number quietly does for them.
 *
 * Each tap contributes its x-coordinate to the same `drawn` list a typed
 * control fills, so everything downstream — the figure, the table, the
 * coverage rule — is unchanged.
 */
export type PickOnLine = {
  kind: 'onLine'
  /** The line taps have to land on. */
  m: number
  c: number
  /** The grid tapped on. */
  /** Said when a tap misses the line. */
  offLine: string
  /** How many points may be on the grid at once. */
  maxPoints: number
}

export type Control = {
  /** The letter the student is changing. 'c' */
  name: string
  /** Present when the student picks points instead of typing a value. */
  pick?: PickOnLine
  /** Shown above the input. */
  prompt: string
  /** The domain in the student's words, under the input. */
  hint: string
  /** What may be typed. Enforced in the UI, sampled by the harness. */
  domain: { min: number; max: number; step: number }
  /** Offered when nothing has been drawn yet. A nudge, never the path. */
  suggest?: readonly number[]
  /**
   * The figure for a history of drawn values, with one of them live.
   *
   * OPTIONAL, because not every concept is a picture. docs/audit/31 §5 says a
   * skill whose behaviour shows up in a TABLE needs no figure at all, but the
   * type demanded one anyway, so the whole table-native half of the candidate
   * list — percentages, indices, proportion, sequences, the mean — could not
   * be expressed. A control with no `render` is tabulated and not drawn.
   */
  render?: (drawn: readonly number[], current: number, before?: number) => RenderedGrid
  /**
   * A second figure drawn ABOVE `render`, of the same value: the real thing
   * the graph is a record of — a car on a road above its distance–time graph.
   *
   * The two are mounted together, so their animations share a clock, and the
   * scene is only worth having when they do: a car that moves while the line
   * draws is the argument that the line's steepness IS the speed. A scene that
   * merely decorates belongs nowhere. Needs `render`.
   *
   * `before` (on both) is the index of the try shown just before this one —
   * the one the student was looking at, which is not the same thing as the one
   * typed last once they go back to an earlier try. Absent before a second.
   */
  scene?: (drawn: readonly number[], current: number, before?: number) => RenderedGrid
  /**
   * What the student is doing, for the page's wording.
   *
   * 'draw' — the default when there is a `render` — is plotting lines that
   * stay on the axes: "Draw your own", "Draw it". 'try' is for a figure that
   * only pictures the value just typed, like percentage change's bar models:
   * the student is trying a percentage and the page draws it, so the page
   * keeps "Try it yourself".
   */
  verb?: 'draw' | 'try'
  /** How the equation reads at this value. */
  label: (v: number) => string
  /**
   * This value's row in the observation table, one cell per header.
   *
   * Optional, because a stage can observe through its figure instead: the
   * percentage-change bar models carry the numbers in their labels, and the
   * table beside them was dropped as repetition. A stage with `observe` needs
   * this or `rows`; a test holds that, and a stage with neither a table nor a
   * figure is refused.
   */
  row?: (v: number) => readonly string[]
  /**
   * The whole table at once, when a row is about a RELATIONSHIP between
   * values rather than about one value.
   *
   * A gradient measured between two points is the case: there is nothing to
   * say about a single point, and the row only exists once there is a pair.
   * Takes precedence over `row` when present.
   */
  rows?: (drawn: readonly number[]) => readonly (readonly string[])[]
  /**
   * null when the conclusion may open, else what is still missing, said to the
   * student.
   *
   * A teaching move rather than a counter: three positive values of c do not
   * show what c does, so the rule stays shut until a negative one is drawn.
   */
  coverage: (drawn: readonly number[]) => string | null
  /**
   * Several numbers instead of one — a ratio, typed `a : b` or `a : b : c`
   * in a box each, named here in order. `domain` then applies to each.
   *
   * Stored as ONE number, two decimal digits a box (joinInputs / splitInputs
   * in lib/skills/investigation.ts), so the history, the table, the chips and
   * `coverage` all keep working on numbers. Every function given a value
   * here gets the joined number and splits it.
   */
  inputs?: readonly string[]
  /**
   * A rule the boxes must keep TOGETHER, which no one box's domain can say —
   * Cara needing more parts than Amy. null when the value is fine, else what
   * to tell the student. Values it refuses are not part of the control.
   */
  valid?: (v: number) => string | null
}

/** The commitment, made before anything moves. */
export type Prediction = {
  prompt: string
  /**
   * Answered on the grid, or from options.
   *
   * The grid form is graded by checkGridDraw — the same function that marks a
   * grid_draw part — so a prediction is marked by the machinery that already
   * marks drawings, not by a comparison written for this page.
   *
   * `wrong` lives here because its shape depends on the kind. A choice has one
   * response PER OPTION, aligned with `options` and '' at `correct` — the same
   * convention as a conclusion slot's `diagnosis` — so the verdict talks about
   * the answer the student actually picked, not every distractor at once. A
   * grid placement can land anywhere, so it gets a single response.
   *
   * Never scolds: a wrong response says what the chosen answer actually was
   * (the percentage read as pounds, one step short, the other direction). The
   * working itself belongs in `explain`, not here.
   */
  on:
    | { kind: 'grid'; grid: RenderedGrid; expect: readonly GridPoint[]; wrong: string }
    | {
        kind: 'choice'
        options: readonly string[]
        correct: number
        wrong: readonly string[]
      }
  /** The verdict when they got it right: short, because `explain` follows. */
  right: string
  /**
   * How to work it out, shown under the verdict whether they were right or
   * wrong — a lucky guess needs the working as much as a miss does. One line
   * per step, each rendered on its own line.
   *
   * In THIS draw's numbers, never the general rule. Stating the rule here
   * would hand over the answer to the conclusion sentence two steps later,
   * which is the student's to put into words. A teacher works an example on
   * the board before asking the class what the rule is; this is the example.
   */
  explain: readonly string[]
  /**
   * The figure shown AFTER committing, with the answer on it.
   *
   * This is the moment the whole predict step exists for: the student has
   * said where the line will cross, and now sees whether it does. Without it
   * the page takes their guess, prints a sentence and moves on — the figure
   * that would settle it disappears at exactly the point it becomes useful.
   *
   * Its `elements` are the canonical answer, drawn ghosted via
   * `showCanonical`, and the student's own placement is drawn over the top.
   * Only meaningful for a `grid` prediction; a choice prediction has nothing
   * of the student's to put back on a figure.
   */
  reveal?: RenderedGrid
}

/**
 * The word for the thing the student has just built.
 *
 * Shown AFTER `because`, never before: a name lands on a concept that already
 * exists. The slots above deliberately say "how much y changes for every 1
 * across" rather than "the gradient", so the word arrives as a label for
 * something they hold rather than as the lesson itself.
 *
 * `elsewhere` is the field doing the unusual work and is not decoration — a
 * road sign's 1-in-5 gradient is the same rise over run the student has been
 * measuring. The repo already has the principle, from the one-line gloss added
 * to the set-notation stems: this is the one place our content should say more
 * than the paper does.
 */
export type Naming = {
  /**
   * The card's label. 'Definition' when omitted — set it when what the card
   * holds is not a definition. Percentage change's last section names an idea
   * worth carrying away ("changes in a row multiply"), not a term the exam
   * uses, and labelling that a definition dressed up a phrase as vocabulary.
   */
  label?: string
  /** 'the gradient' */
  term: string
  /** What they have just built, pointing at their own table. */
  means: string
  /** The same word doing work outside mathematics. */
  elsewhere: string
  /** How the paper words it, so the term is recognisable in an exam. */
  onThePaper: string
  /**
   * A formula triangle drawn under `means`: `top` over `left` and `right`,
   * with the three ways of covering one letter and the formula each gives.
   */
  triangle?: { top: string; left: string; right: string }
}

/** One slot in the conclusion sentence. */
export type Slot = {
  options: readonly string[]
  correct: number
  /**
   * Per wrong option, what to say. Indexed with `options`; the correct
   * option's entry is unused and authored as ''.
   */
  diagnosis: readonly string[]
  /**
   * Per wrong option, the misconception id from data/misconceptions.ts.
   *
   * '' where none fits — never mint one to fill a gap, which is the
   * taxonomy's own rule. A tagged wrong answer reaches the teacher's Common
   * mistakes surface, so this is worth getting right.
   */
  misconception: readonly string[]
}

export type Stage = {
  /**
   * A few words naming what this stage is about — "Up, then down". Shown after
   * the stage number ("Stage 4 · Up, then down") and on the numbered section
   * buttons, which otherwise said only "4". Short, and no full stop: it is a
   * heading, not a sentence.
   */
  title: string
  /** What to notice. One sentence, above the figure. */
  ask: string
  /**
   * The axes every figure in this stage is drawn on.
   *
   * Absent on a stage that draws nothing — there are no axes to put a table
   * on. Required as soon as the stage has a figure, a grid prediction or a
   * drawing control, and the test suite holds it to that.
   */
  axes?: { x: RenderedAxis; y: RenderedAxis }
  /**
   * A fixed figure for a stage with nothing to vary.
   *
   * A stage with a `control` builds its figure from the drawn history, and a
   * grid prediction carries its own. A stage that is neither — the pilot's
   * third, where the student READS a line rather than building one — still
   * needs something on screen, or its options refer to a graph that is not
   * there.
   */
  figure?: RenderedGrid
  predict: Prediction
  /** Absent on a stage with nothing to vary — stage 3 of the pilot. */
  control?: Control
  /** Absent when there is no control to tabulate. */
  observe?: { headers: readonly string[] }
  conclude: {
    /**
     * The sentence, split at the slots: N + 1 chunks around N slots.
     *
     * Split rather than templated, because a template needs a parser and the
     * only thing it would buy is writing the sentence on one line.
     */
    sentence: readonly string[]
    slots: readonly Slot[]
    /** Why — shown once every slot is right. */
    because: string
    /**
     * The same reason in algebra, on its own line under `because`.
     *
     * The words carry the idea and the line carries the proof; a student who
     * has the first still has to meet the second, because the exam is written
     * in it.
     */
    algebra?: string
    /**
     * One sentence introducing `algebra`, above it.
     *
     * Without it the block arrives as bare symbols: a student who has just
     * read the reason in words has no way of knowing whether the lines under
     * it are a restatement, a proof or a new rule to memorise — and the
     * second one introduces y₁ and y₂, which nothing else on the page has
     * used.
     */
    algebraLead?: string
  }
  /** Shown with `because`. Optional. */
  naming?: Naming
  /**
   * Applied questions closing the section, shown AFTER `naming` so the
   * student meets the word before being asked to use it.
   *
   * Answering one wrong never blocks the section: the student sees the
   * authored trap's explanation, and may take the same question on fresh
   * numbers.
   */
  check?: readonly Check[]
  /**
   * Something true that the slots had to flatten in order to have one answer.
   *
   * Shown with `because`, asked about never. Stage 1's is that moving a line
   * up by k is the same line as moving it left by k over m — the option set
   * cannot admit it, and a student who noticed deserves to see it named rather
   * than marked wrong.
   */
  aside?: { head: string; body: string }
}

export type Investigation = {
  /** Must exist in data/skills.ts. */
  skillId: string
  title: string
  /**
   * What this is and what they will be able to do, said TO them.
   *
   * The second thing on the page, so it is doing the work an opening does:
   * `lead` says what the topic IS and where it turns up, and `points` are
   * what they will be able to do, one per bullet. A paragraph of four
   * outcomes run together reads as a wall and gets skipped — which is the
   * same reason an exercise book has a list of objectives at the top.
   *
   * Each point opens with ONE measurable verb from Bloom's taxonomy
   * (lib/skills/bloom.ts) — "calculate", "explain", "deduce", never "understand"
   * or "look at… and say" — and the list as a whole reaches past procedure:
   * every section ends with the student stating a rule, which is
   * understanding, and the outcomes should say so. Tests hold all three.
   *
   * It was once a note to the author about why the concept needs varying
   * rather than telling, which meant the page opened by talking about "the
   * student" to the student.
   */
  outcomes: {
    lead: string
    points: readonly string[]
  }
  /**
   * Shown as a banner at the top of the page, before anything else.
   *
   * Per INVESTIGATION rather than per route, because the route is shared: the
   * straight-line pilot is finished enough to show people, and a notice over
   * it would undersell it. A new one being worked on says so in its own
   * words, and deleting the line is how it stops being under construction.
   */
  underConstruction?: string
  parameters: ParameterSpec
  /** The stages for one draw. Called once per visit. */
  build: (p: Params) => readonly Stage[]
  /**
   * PUBLISHED question ids on this skill, walked one at a time through
   * /practice/question/[id] — real grader, real attempts, real mastery.
   *
   * An authored list rather than a practice run on purpose: skill-focused
   * practice is a PAID focus mode (app/practice/page.tsx sends free and
   * anonymous students to /student/upgrade), and the students an investigation
   * exists for are exactly the ones who would bounce off it. Individual
   * question pages work signed out, with attempts held in localStorage and
   * migrated on login. Opening the paid mode to them is a pricing decision,
   * not part of this scope.
   *
   * Empty is legal: the page then links to practice on the skill instead,
   * which is the honest fallback while the bank has nothing suitable.
   */
  transferQuestionIds: readonly string[]
}

/** An investigation with its parameters drawn, ready to render. */
export type ResolvedInvestigation = {
  skillId: string
  title: string
  params: Params
  stages: readonly Stage[]
  transferQuestionIds: readonly string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// The check at the end of a section.
//
// The conclusion sentence teaches, but it is weak evidence: two slots of two
// options means a student guessing blind states the whole rule correctly one
// time in four. A couple of applied questions afterwards is what turns "they
// clicked the right words" into "they can use it", and it gives per-section
// measurement, which the end-of-investigation transfer question cannot.
//
// These are QUESTIONS FROM THE BANK, not questions authored here. An earlier
// version wrote its own, which duplicated content the bank already had and
// threw away everything that makes a bank question good: drawn parameters, the
// verification harness, and the authored traps that name WHY a particular
// wrong answer is wrong and carry the misconception id feeding the teacher's
// Common mistakes surface. Where no suitable question exists, the fix is to
// author one into the bank — where every other surface can use it too — rather
// than to write a private one here.
// ─────────────────────────────────────────────────────────────────────────────

export type Check = {
  /** A PUBLISHED question id. A check that cannot load is simply not shown. */
  questionId: string
  /**
   * Harder than the section needs, and labelled as such.
   *
   * A student who cannot do it has still understood the section; saying so on
   * the question is what stops it reading as a failure.
   */
  challenge?: boolean
  /**
   * Said to the student above the question, when the question asks for
   * something the section has not shown them.
   *
   * Not the same as `challenge`. A challenge is harder than the section needs;
   * this is a question the section's idea covers but whose method it never
   * demonstrated — the same relationship read backwards, say. Asking it without
   * saying so reads as "you should have known this", so the page says it first.
   */
  note?: string
  /**
   * Why this question closes this section. Author-facing only: it is the note
   * that stops someone swapping in a question about the wrong half of the
   * skill, which is easy to do when one skill covers gradient AND intercept.
   */
  because: string
}
