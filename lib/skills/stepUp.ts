// ─────────────────────────────────────────────────────────────────────────────
// "Ready for a longer question" — picking the step up after a skill is mastered.
//
// WHY MULTI-PART, AND NOT A SYNTHESIS QUESTION
//
// The obvious move is to follow mastery with an `exam`-kind synthesis question:
// you know the skill, now apply it. Measured against the live bank and real
// students, that is a cliff, not a step (docs/audit/15-adaptive-exam-surfacing-plan.md):
// synthesis questions average d3.9 because the authoring rule requires 2+
// genuinely INDEPENDENT skills, so the student who just mastered
// `simple_arithmetic` gets handed a grade 8/9 item. Requiring every constituent
// skill to be mastered first fixes the cliff and then fires for 1 student in 14.
//
// Multi-part questions whose parts are each single-skill are the rung between:
// several steps on one stem, marks that add up, the shape of a real exam
// question — without the leap. 71% of engaged students have one available
// against a skill they have mastered, against 7% for synthesis.
//
// A question containing an `exam`-kind part is EXCLUDED, because that part is
// exactly the synthesis leap this is designed to avoid.
// ─────────────────────────────────────────────────────────────────────────────

export type StepUpCandidate = {
  id: string
  difficulty: number
  skillIds: string[]
  /** Part kinds, in order. A question with any 'exam' part is not a step up. */
  partKinds: ('mastery' | 'exam')[]
  partCount: number
}

/**
 * Is this a clean middle-rung question — several single-skill steps on one stem?
 *
 * Single-part questions are excluded even when hard: the point of the step up is
 * the multi-step SHAPE, not extra difficulty. Another single-answer question is
 * just more practice, which is what the student was already doing.
 */
export function isStepUp(c: StepUpCandidate): boolean {
  return c.partCount >= 2 && c.partKinds.every(k => k !== 'exam')
}

/**
 * The best step up for a just-mastered skill, or null when there isn't one.
 *
 * `attemptedSkillIds` is everything the student has touched, mastered or not.
 * It is used only to prefer candidates that do not drag in a skill they have
 * never met — a "longer question" that silently requires an untouched skill is
 * a wall wearing a different hat.
 *
 * Ranking, in order:
 *   1. no unfamiliar skills beyond the mastered one
 *   2. fewest unfamiliar skills
 *   3. lowest difficulty
 *   4. id, so the choice is deterministic rather than incidental
 */
export function pickStepUp(
  masteredSkillId: string,
  candidates: StepUpCandidate[],
  attemptedSkillIds: Iterable<string>,
  excludeIds: Iterable<string> = [],
): StepUpCandidate | null {
  const familiar = new Set(attemptedSkillIds)
  familiar.add(masteredSkillId)
  const excluded = new Set(excludeIds)

  const eligible = candidates.filter(c =>
    isStepUp(c) &&
    c.skillIds.includes(masteredSkillId) &&
    !excluded.has(c.id))

  if (!eligible.length) return null

  const unfamiliarCount = (c: StepUpCandidate) =>
    c.skillIds.filter(s => !familiar.has(s)).length

  return eligible.slice().sort((a, b) =>
    unfamiliarCount(a) - unfamiliarCount(b) ||
    a.difficulty - b.difficulty ||
    a.id.localeCompare(b.id))[0]
}
