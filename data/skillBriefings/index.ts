import type { SkillBriefing } from './types'
import { proportionBriefing } from './proportion'
import { ratioBriefing } from './ratio'
import { compoundUnitsBriefing } from './compoundUnits'
import { percentageChangeBriefing } from './percentageChange'
import { inverseProportionBriefing } from './inverseProportion'
import { growthAndDecayBriefing } from './growthAndDecay'
import { fractionsOfAmountsBriefing } from './fractionsOfAmounts'
import { fractionsDecimalsAndPercentagesBriefing } from './fractionsDecimalsAndPercentages'
import { reversePercentageBriefing } from './reversePercentage'
import { solvingLinearEquationsBriefing } from './solvingLinearEquations'
import { inequalitiesBriefing } from './inequalities'
import { simultaneousEquationsBriefing } from './simultaneousEquations'

// ─────────────────────────────────────────────────────────────────────────────
// Registry of authored exam briefings.
//
// Sparse by design. A skill with no briefing simply has no briefing page, and
// nothing links to one — every entry point checks `hasBriefing` first, and the
// /skills index lists such skills without making them links.
//
// Written a cluster at a time, not in order of the heaviest skills. Authoring
// by cluster means the comparison cards resolve to pages that exist: proportion,
// ratio and compound units all point at each other, and percentage change,
// inverse proportion and growth and decay close the ring. Picking by marks alone
// would have left every "don't confuse it with" pointing at a page that isn't
// there.
//
// The second cluster — fractions of amounts, fractions/decimals/percentages and
// reverse percentage — hangs off the first through ratio and percentage change.
//
// The third is algebra: solving linear equations, inequalities and simultaneous
// equations. It is self-contained (both neighbours have solving as their
// prerequisite) and reaches the earlier clusters through the ratio comparison
// that ratio.ts had already written pointing this way.
// ─────────────────────────────────────────────────────────────────────────────

export const skillBriefings: Record<string, SkillBriefing> = {
  [proportionBriefing.skillId]: proportionBriefing,
  [ratioBriefing.skillId]: ratioBriefing,
  [compoundUnitsBriefing.skillId]: compoundUnitsBriefing,
  [percentageChangeBriefing.skillId]: percentageChangeBriefing,
  [inverseProportionBriefing.skillId]: inverseProportionBriefing,
  [growthAndDecayBriefing.skillId]: growthAndDecayBriefing,
  [fractionsOfAmountsBriefing.skillId]: fractionsOfAmountsBriefing,
  [fractionsDecimalsAndPercentagesBriefing.skillId]: fractionsDecimalsAndPercentagesBriefing,
  [reversePercentageBriefing.skillId]: reversePercentageBriefing,
  [solvingLinearEquationsBriefing.skillId]: solvingLinearEquationsBriefing,
  [inequalitiesBriefing.skillId]: inequalitiesBriefing,
  [simultaneousEquationsBriefing.skillId]: simultaneousEquationsBriefing,
}

export const getBriefing = (skillId: string): SkillBriefing | null => skillBriefings[skillId] ?? null

export const hasBriefing = (skillId: string): boolean => skillId in skillBriefings

/** Skill ids with a briefing — used by the prompt on the question page. */
export const briefedSkillIds = (): string[] => Object.keys(skillBriefings)

export type { SkillBriefing, ResolvedBriefing, MethodStep, ConfusableWith } from './types'
export { resolveBriefing } from './types'
