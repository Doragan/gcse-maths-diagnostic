import type { SkillBriefing } from './types'
import { proportionBriefing } from './proportion'
import { ratioBriefing } from './ratio'
import { compoundUnitsBriefing } from './compoundUnits'

// ─────────────────────────────────────────────────────────────────────────────
// Registry of authored skill guides.
//
// Deliberately sparse. A skill with no guide simply has no guide page, and
// nothing anywhere in the app links to one — every entry point checks
// `hasBriefing` first. That is what makes it safe to trial the format on a single
// skill before committing to authoring 150 of them.
// ─────────────────────────────────────────────────────────────────────────────

export const skillBriefings: Record<string, SkillBriefing> = {
  [proportionBriefing.skillId]: proportionBriefing,
  [ratioBriefing.skillId]: ratioBriefing,
  [compoundUnitsBriefing.skillId]: compoundUnitsBriefing,
}

export const getBriefing = (skillId: string): SkillBriefing | null => skillBriefings[skillId] ?? null

export const hasBriefing = (skillId: string): boolean => skillId in skillBriefings

/** Skill ids with a guide — used by the trial prompt on the question page. */
export const briefedSkillIds = (): string[] => Object.keys(skillBriefings)

export type { SkillBriefing, ResolvedBriefing, MethodStep, ConfusableWith } from './types'
export { resolveBriefing } from './types'
