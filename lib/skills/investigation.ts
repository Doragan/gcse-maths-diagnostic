import { checkGridDraw, type GridPoint } from '../questions/gridDraw'
import type {
  Investigation, Params, ParameterSpec, ResolvedInvestigation, Stage,
} from '../../data/investigations/types'

// ─────────────────────────────────────────────────────────────────────────────
// The rules an investigation runs by, kept out of the page so they can be
// tested without rendering anything — the same split briefingQuiz.ts makes for
// the briefing's decisions.
// ─────────────────────────────────────────────────────────────────────────────

/** Every combination of a parameter spec's values, constraint applied. */
export function allDraws(spec: ParameterSpec): Params[] {
  const names = Object.keys(spec.values)
  let draws: Params[] = [{}]
  for (const name of names) {
    const next: Params[] = []
    for (const partial of draws) {
      for (const v of spec.values[name]) next.push({ ...partial, [name]: v })
    }
    draws = next
  }
  return spec.valid ? draws.filter(spec.valid) : draws
}

/**
 * One draw, at random from the legal ones.
 *
 * Rejection-free by construction: allDraws has already applied the constraint,
 * so a spec whose rule excludes everything fails loudly here rather than
 * looping. The harness walks allDraws in full, so nothing a student can be
 * given is unverified.
 */
export function drawParams(spec: ParameterSpec, random: () => number = Math.random): Params {
  const legal = allDraws(spec)
  if (legal.length === 0) throw new Error('parameter spec has no legal draw')
  return legal[Math.floor(random() * legal.length) % legal.length]
}

/** An investigation with its numbers chosen, ready to render. */
export function resolveInvestigation(
  inv: Investigation,
  random: () => number = Math.random,
): ResolvedInvestigation {
  const params = drawParams(inv.parameters, random)
  const seed = `${inv.skillId}|${JSON.stringify(params)}`
  return {
    skillId: inv.skillId,
    title: inv.title,
    params,
    stages: inv.build(params).map((stage, i) => shuffleChoices(stage, `${seed}|${i}`)),
    transferQuestionIds: inv.transferQuestionIds,
  }
}

/**
 * A fixed shuffle of 0…n−1 for this seed: the same draw always gets the same
 * order, so options never move under a student mid-visit, while different
 * draws get different orders.
 */
export function seededOrder(n: number, seed: string): number[] {
  // FNV-1a for the seed, then xorshift for the stream.
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h = h || 1
  const next = () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return (h >>> 0) / 4294967296
  }
  const order = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/**
 * The stage as a student sees it: every set of options in a fixed shuffle.
 *
 * Both investigations are AUTHORED with the right answer first — every choice
 * prediction and almost every rule blank — and a reviewer noticed the pattern:
 * the answer to every selection was the first option. Shuffled here, once per
 * draw, so authoring keeps its readable convention and no student meets it.
 *
 * Everything indexed by option moves with it: a prediction's per-option wrong
 * responses, and a slot's diagnoses and misconception ids.
 */
export function shuffleChoices(stage: Stage, seed: string): Stage {
  const on = stage.predict.on
  let predict = stage.predict
  if (on.kind === 'choice') {
    const o = seededOrder(on.options.length, `${seed}|predict`)
    predict = {
      ...stage.predict,
      on: {
        ...on,
        options: o.map(k => on.options[k]),
        correct: o.indexOf(on.correct),
        wrong: o.map(k => on.wrong[k]),
      },
    }
  }
  const slots = stage.conclude.slots.map((slot, s) => {
    const o = seededOrder(slot.options.length, `${seed}|slot${s}`)
    return {
      ...slot,
      options: o.map(k => slot.options[k]),
      correct: o.indexOf(slot.correct),
      diagnosis: o.map(k => slot.diagnosis[k]),
      misconception: o.map(k => slot.misconception[k]),
    }
  })
  return { ...stage, predict, conclude: { ...stage.conclude, slots } }
}

/**
 * Whether a predicted drawing is right, graded by the same function that marks
 * a grid_draw part rather than by a comparison written for this page.
 */
export function predictionCorrect(
  stage: Stage,
  placed: readonly GridPoint[],
): boolean {
  const on = stage.predict.on
  if (on.kind !== 'grid') return false
  // A grid prediction is marked against the stage's own step sizes, so a
  // stage carrying one must carry axes too.
  if (!stage.axes) return false
  const result = checkGridDraw(
    [...placed],
    on.grid.elements,
    'points',
    on.grid.tolerance,
    { xStep: stage.axes.x.step, yStep: stage.axes.y.step },
  )
  return result.correct
}

/**
 * What is still missing before the rule may be stated, or null when nothing is.
 *
 * A stage with no control has nothing to cover, so its conclusion opens as
 * soon as the prediction is in.
 */
export function concludeGate(stage: Stage, drawn: readonly number[]): string | null {
  if (!stage.control) return null
  return stage.control.coverage(drawn)
}

/** Why a typed value cannot be drawn, or null when it can. */
export function rejectValue(stage: Stage, raw: string): string | null {
  const control = stage.control
  if (!control) return 'Nothing to change on this one.'
  const trimmed = raw.trim()
  if (trimmed === '') return `Type a number for ${control.name} first.`

  const v = Number(trimmed)
  if (!Number.isFinite(v)) return `${trimmed} is not a number.`

  const { min, max, step } = control.domain
  if (v < min || v > max) {
    return `Keep ${control.name} between ${fmtNum(min)} and ${fmtNum(max)}, `
      + 'so the line stays on these axes.'
  }
  // Rounded before comparing: 0.1 + 0.2 arithmetic makes an exact multiple
  // test reject values the domain plainly allows.
  const steps = v / step
  if (Math.abs(steps - Math.round(steps)) > 1e-9) {
    return step === 1
      ? `Whole numbers only for ${control.name} here.`
      : `Use steps of ${fmtNum(step)} for ${control.name}.`
  }
  return null
}

/** A number with a real minus sign. */
function fmtNum(n: number): string {
  return String(n).replace('-', '−')
}

/**
 * The drawn history after a value is added.
 *
 * A repeat is not appended — it makes the existing line live again. Otherwise
 * a student who types 3 twice gets two identical rows in the table and the
 * coverage rule counts a value it has already seen.
 */
export function addValue(drawn: readonly number[], v: number): { drawn: number[]; current: number } {
  const at = drawn.indexOf(v)
  if (at > -1) return { drawn: [...drawn], current: at }
  return { drawn: [...drawn, v], current: drawn.length }
}

/**
 * Moving the figure to try `k`: the try on screen until now becomes the one
 * shown before it — unless it is the same value, when nothing has changed.
 *
 * The figure compares with the try the student was LOOKING AT, not the one
 * typed last: after trying 2, 6 and 4, going back to 2 and then to 6 has to
 * compare 6 with 2. Reading "last" off the order typed compared it with 4.
 * Indices into the history are stable: `addValue` only ever appends.
 */
export function showTry(
  drawn: readonly number[],
  current: number,
  before: number | undefined,
  k: number,
): { current: number; before: number | undefined } {
  const shown = drawn[current]
  if (shown === undefined || shown === drawn[k]) return { current: k, before }
  return { current: k, before: current }
}

/** Which slots are answered, and whether the sentence is complete and right. */
export function sentenceState(
  stage: Stage,
  picks: Readonly<Record<number, number>>,
): { complete: boolean; correct: boolean; firstWrong: number } {
  const slots = stage.conclude.slots
  let firstWrong = -1
  let complete = true
  slots.forEach((slot, i) => {
    const pick = picks[i]
    if (pick === undefined) { complete = false; return }
    if (pick !== slot.correct && firstWrong === -1) firstWrong = i
  })
  return { complete, correct: complete && firstWrong === -1, firstWrong }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section checks
// ─────────────────────────────────────────────────────────────────────────────

/** Has every check on this stage been attempted at least once? */
export function checksAttempted(
  stage: Stage,
  answered: Readonly<Record<number, boolean>>,
): boolean {
  const checks = stage.check ?? []
  // A CHALLENGE never holds anyone up. It is flagged as harder than the
  // section needs precisely so that not doing it is a fair outcome, and
  // requiring it anyway contradicts the label the student is reading.
  return checks.every((c, i) => c.challenge === true || answered[i] === true)
}

/**
 * Is this section finished — rule stated, and every check had a go?
 *
 * "Had a go", not "got right": the investigation is low stakes by design and a
 * student stuck on a check is exactly the one who must not be trapped on the
 * page.
 */
export function stageComplete(
  stage: Stage,
  ruleCorrect: boolean,
  answered: Readonly<Record<number, boolean>>,
): boolean {
  return ruleCorrect && checksAttempted(stage, answered)
}

/**
 * The step numbers a stage actually has.
 *
 * Numbered from what is PRESENT rather than from a fixed list. A stage with
 * nothing to vary has no "draw your own" step, and with the numbers hard-coded
 * that stage ran 1, 3, 4 — which reads as a step that failed to load rather
 * than one that does not exist. 0 means the step is absent.
 */
export function stepNumbers(stage: Stage): {
  predict: number; draw: number; rule: number; check: number
} {
  let n = 0
  return {
    predict: ++n,
    draw: stage.control ? ++n : 0,
    rule: ++n,
    check: (stage.check ?? []).length ? ++n : 0,
  }
}
