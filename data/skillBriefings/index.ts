import type { SkillBriefing } from './types'
import { proportionBriefing } from './proportion'
import { ratioBriefing } from './ratio'
import { compoundUnitsBriefing } from './compoundUnits'
import { percentageChangeBriefing } from './percentageChange'
import { inverseProportionBriefing } from './inverseProportion'
import { growthAndDecayBriefing } from './growthAndDecay'

// ─────────────────────────────────────────────────────────────────────────────
// Registry of authored exam briefings.
//
// Sparse by design. A skill with no briefing simply has no briefing page, and
// nothing links to one — every entry point checks `hasBriefing` first, and the
// /skills index lists such skills without making them links.
//
// The six written so far are one cluster, not the six heaviest skills. Authoring
// by cluster means the comparison cards resolve to pages that exist: proportion,
// ratio and compound units all point at each other, and percentage change,
// inverse proportion and growth and decay close the ring. Picking by marks alone
// would have left every "don't confuse it with" pointing at a page that isn't
// there.
// ─────────────────────────────────────────────────────────────────────────────

export const skillBriefings: Record<string, SkillBriefing> = {
  [proportionBriefing.skillId]: proportionBriefing,
  [ratioBriefing.skillId]: ratioBriefing,
  [compoundUnitsBriefing.skillId]: compoundUnitsBriefing,
  [percentageChangeBriefing.skillId]: percentageChangeBriefing,
  [inverseProportionBriefing.skillId]: inverseProportionBriefing,
  [growthAndDecayBriefing.skillId]: growthAndDecayBriefing,
}

export const getBriefing = (skillId: string): SkillBriefing | null => skillBriefings[skillId] ?? null

export const hasBriefing = (skillId: string): boolean => skillId in skillBriefings

/** Skill ids with a briefing — used by the prompt on the question page. */
export const briefedSkillIds = (): string[] => Object.keys(skillBriefings)

export type { SkillBriefing, ResolvedBriefing, MethodStep, ConfusableWith } from './types'
export { resolveBriefing } from './types'
