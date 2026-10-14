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
export function showThisOneFirst(skillId: string, otherSkillId: string): boolean {
  let hash = 0
  for (const ch of `${skillId}|${otherSkillId}`) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return hash % 2 === 0
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
