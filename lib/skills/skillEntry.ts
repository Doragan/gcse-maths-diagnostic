import { hasBriefing } from '../../data/skillBriefings'
import { hasInvestigation } from '../../data/investigations'

// ─────────────────────────────────────────────────────────────────────────────
// Which teaching surface to offer a stuck student.
//
// Two layers now answer different questions for the same skill — a briefing
// says how to spot and work it, an investigation builds the idea underneath —
// and a question can be tagged with several skills. Choosing between them is a
// decision, so it lives here with a test rather than inline in a page.
// ─────────────────────────────────────────────────────────────────────────────

export type SkillEntry =
  | { kind: 'investigation'; skillId: string }
  | { kind: 'briefing'; skillId: string }

/**
 * The best surface for a question's skills, or null when neither exists.
 *
 * **Investigation first.** A wrong answer is the moment a missing concept
 * shows, and sending a student who has not got the idea to a page that assumes
 * it is how the briefing fails them — the briefing is written for someone
 * about to sit a paper. The briefing stays the offer when there is no
 * investigation, which is all but one skill today.
 *
 * Where several tagged skills qualify, the FIRST in the question's own list
 * wins rather than the first investigated one: `skill_ids` is ordered by the
 * author, so its head is the skill the question is mainly about.
 */
export function entryForSkills(skillIds: readonly string[]): SkillEntry | null {
  const investigated = skillIds.find(hasInvestigation)
  if (investigated) return { kind: 'investigation', skillId: investigated }
  const briefed = skillIds.find(hasBriefing)
  if (briefed) return { kind: 'briefing', skillId: briefed }
  return null
}

/** Does this skill have anything beyond practice to send a student to? */
export function hasTeaching(skillId: string): boolean {
  return hasInvestigation(skillId) || hasBriefing(skillId)
}
