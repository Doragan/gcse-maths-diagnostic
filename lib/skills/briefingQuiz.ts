// ─────────────────────────────────────────────────────────────────────────────
// The small decisions a briefing asks a student to make.
//
// The page used to be read-only apart from a reveal: the stems were labelled
// for the student rather than judged by them, so nothing they did could be
// right or wrong and nothing came back. These helpers are the pure part of
// turning those two sections into decisions — kept out of the page so the
// rules can be tested without rendering anything.
// ─────────────────────────────────────────────────────────────────────────────

/** What the student picked when asked whether a stem is the skill. */
export type Judgement = 'yes' | 'no'

/** True when the student's call matches what the stem actually is. */
export function judgedCorrectly(chose: Judgement, isThisSkill: boolean): boolean {
  return (chose === 'yes') === isThisSkill
}

/**
 * Which side of a comparison pair to show first.
 *
 * Always showing this skill's question first would teach the position rather
 * than the distinction — a student notices within two cards that the top one
 * is always the answer. Deterministic rather than random, so the order does not
 * change under the student mid-read (a re-render would otherwise shuffle the
 * options they are looking at) and so the tests are stable.
 */
function hashOf(key: string): number {
  let hash = 0
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return hash
}

export function showThisOneFirst(skillId: string, otherSkillId: string): boolean {
  return hashOf(`${skillId}|${otherSkillId}`) % 2 === 0
}

/**
 * The two questions in display order, each tagged with whether it is this
 * skill — so the page renders the buttons without knowing the rule.
 */
export function orderedPair(
  skillId: string,
  otherSkillId: string,
  pair: { thisOne: string; theOther: string },
): { question: string; isThisSkill: boolean }[] {
  const first = { question: pair.thisOne, isThisSkill: true }
  const second = { question: pair.theOther, isThisSkill: false }
  return showThisOneFirst(skillId, otherSkillId) ? [first, second] : [second, first]
}

/** One choice in a method step's "what is the next move?" question. */
export type MethodOption = { text: string; isCorrect: boolean }

/** The shape this reads off a resolved method step. */
type GatedStep = { do: string; nextMoveDistractors?: readonly [string, string] }

/**
 * The options for a method step, in display order — or null when the step
 * carries no distractors and should simply render as it always has.
 *
 * Rotated rather than shuffled, and keyed on the skill and the step's
 * position, for the same two reasons orderedPair is deterministic: a
 * re-render must not move the options under a student mid-choice, and the
 * right answer must not sit in the same slot on every step of a page, or the
 * student learns the position instead of the method.
 */
export function methodOptions(
  skillId: string,
  stepIndex: number,
  step: GatedStep,
): MethodOption[] | null {
  if (!step.nextMoveDistractors) return null
  const options: MethodOption[] = [
    { text: step.do, isCorrect: true },
    { text: step.nextMoveDistractors[0], isCorrect: false },
    { text: step.nextMoveDistractors[1], isCorrect: false },
  ]
  const shift = hashOf(`${skillId}|${stepIndex}`) % options.length
  return [...options.slice(shift), ...options.slice(0, shift)]
}

/**
 * The first step whose question the student has not answered yet, or -1 when
 * there is none left.
 *
 * Steps after it are not rendered: the section reveals in order, and a method
 * whose later steps are visible has already answered its own question. A step
 * with no distractors is never a stopping point.
 */
export function firstUnansweredStep(
  skillId: string,
  steps: readonly GatedStep[],
  picks: Readonly<Record<number, number>>,
): number {
  return steps.findIndex((step, i) =>
    methodOptions(skillId, i, step) !== null && picks[i] === undefined)
}
