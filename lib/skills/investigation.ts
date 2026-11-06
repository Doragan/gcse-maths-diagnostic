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
  return {
    skillId: inv.skillId,
    title: inv.title,
    params,
    stages: inv.build(params),
    transferQuestionIds: inv.transferQuestionIds,
  }
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
