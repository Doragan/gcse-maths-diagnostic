import { hasBriefing } from '../../data/skillBriefings'
import { getInvestigation, hasInvestigation } from '../../data/investigations'
import { sectionForQuestion } from './investigation'

// ─────────────────────────────────────────────────────────────────────────────
// Which teaching surface to offer a stuck student.
//
// Two layers now answer different questions for the same skill — a briefing
// says how to spot and work it, an investigation builds the idea underneath —
// and a question can be tagged with several skills. Choosing between them is a
// decision, so it lives here with a test rather than inline in a page.
// ─────────────────────────────────────────────────────────────────────────────

export type SkillEntry =
  /** The investigation, at `section` (0-based) when one teaches the mistake, else from the start. */
  | { kind: 'investigation'; skillId: string; section: number | null }
  /**
   * An investigation the student has FINISHED, whose section teaches this
   * mistake: offered again as a revisit, beside the briefing where there is
   * one, and the student chooses (docs/audit/33, D4).
   */
  | { kind: 'revisit'; skillId: string; section: number; briefing: boolean }
  | { kind: 'briefing'; skillId: string }

/** What is known about the wrong answer: the question, and the misconception its trap named. */
export type WrongAnswer = { questionId: string; misconception?: string | null }

/**
 * The best surface for a question's skills, or null when neither exists.
 *
 * **Investigation first.** A wrong answer is the moment a missing concept
 * shows, and sending a student who has not got the idea to a page that assumes
 * it is how the briefing fails them — the briefing is written for someone
 * about to sit a paper. The briefing stays the offer when there is no
 * investigation.
 *
 * **At the section that teaches the mistake**, when the wrong answer is known
 * and one does (docs/audit/33) — not four sections from the start.
 *
 * Where several tagged skills qualify, the FIRST in the question's own list
 * wins rather than the first investigated one: `skill_ids` is ordered by the
 * author, so its head is the skill the question is mainly about.
 */
export function entryForSkills(
  skillIds: readonly string[],
  /**
   * Skills whose investigation this student has already finished
   * (lib/investigationCompletions.ts). One they have done is not offered from
   * the start again: a mistake its section teaches offers that section as a
   * revisit, with the briefing beside it; otherwise the briefing alone
   * (docs/audit/32 D3, extended by doc 33 D4). Empty for a student who is not
   * signed in.
   */
  finished: ReadonlySet<string> = new Set(),
  wrong?: WrongAnswer,
): SkillEntry | null {
  for (const id of skillIds) {
    const inv = hasInvestigation(id) ? getInvestigation(id) : null
    if (!inv) continue
    const section = wrong ? sectionForQuestion(inv, wrong.questionId, wrong.misconception) : null
    if (!finished.has(id)) return { kind: 'investigation', skillId: id, section }
    if (section !== null) return { kind: 'revisit', skillId: id, section, briefing: hasBriefing(id) }
  }
  const briefed = skillIds.find(hasBriefing)
  if (briefed) return { kind: 'briefing', skillId: briefed }
  return null
}

/** Does this skill have anything beyond practice to send a student to? */
export function hasTeaching(skillId: string): boolean {
  return hasInvestigation(skillId) || hasBriefing(skillId)
}
