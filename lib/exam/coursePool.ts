import { courseFor, type Qualification, type CourseTier } from '../../data/courses'

/**
 * Which questions a mini-exam paper may be built from.
 *
 * Extracted from ExamRunner so it can be tested. The runner is a client
 * component wired to Supabase and a monthly quota, so while this lived inline
 * nothing could assert what a paper was allowed to contain — and the rule it
 * expressed was wrong twice over.
 *
 * ONE rule, positively stated: every skill a question carries must be on the
 * student's course. Two things it replaces, both measured against the live bank
 * of 281 published questions:
 *
 *  1. There was no course filter at all, only a TIER block, so content that is
 *     off-syllabus without being higher-only went straight through: 2
 *     set-notation questions into a GCSE paper (4MA1 content), and 18 questions
 *     into an iGCSE Higher paper on iteration, time series, the equation of a
 *     circle and six more topics 4MA1 does not examine.
 *
 *  2. That tier block was the GCSE higher-only list, applied to a Foundation
 *     paper on EITHER qualification — and a skill's tier is a fact about a
 *     course, not about the skill. `venn_diagrams` and `upper_and_lower_bounds`
 *     are Higher on GCSE and Foundation on 4MA1 (see `igcseMovedToFoundation`),
 *     so the block was removing 10 questions an iGCSE Foundation student should
 *     be asked — 6 bounds, 4 Venn — from a pool of 216. Roughly a third of
 *     their papers would otherwise have carried one.
 *
 * No block list survives here, and that is deliberate rather than an omission.
 * A Foundation paper excludes Higher content because the Foundation pool IS the
 * Foundation pool: `courseFor(q, 'foundation').skills` and
 * `higherOnlySkillsFor(q)` are complements by construction. A second,
 * separately-maintained list of what to keep out is what produced (2), and it
 * can only ever disagree with the pool it is meant to be describing.
 */
export function coursePoolOptions(
  qualification: Qualification,
  tier: CourseTier,
): { allowedSkillIds: Set<string> } {
  return { allowedSkillIds: new Set(courseFor(qualification, tier).skills) }
}
