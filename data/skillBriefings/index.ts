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
import { convertingMeasurementsBriefing } from './convertingMeasurements'
import { meanBriefing } from './mean'
import { calculatingSimpleProbabilityBriefing } from './calculatingSimpleProbability'
import { treeDiagramsBriefing } from './treeDiagrams'

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
//
// Converting measurements is the first written alone rather than as a cluster.
// It only needs one comparison — with compound units — and that page already
// existed, so nothing is left pointing at a page that is not there.
//
// The fourth cluster opens Probability and Data, which had no briefing at all:
// mean, calculating simple probability and tree diagrams. Mean also closes the
// comparison compoundUnits.ts had been making one-directionally since it was
// written.
//
// Shape and Space is now the only topic with no briefing.
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
  [convertingMeasurementsBriefing.skillId]: convertingMeasurementsBriefing,
  [meanBriefing.skillId]: meanBriefing,
  [calculatingSimpleProbabilityBriefing.skillId]: calculatingSimpleProbabilityBriefing,
  [treeDiagramsBriefing.skillId]: treeDiagramsBriefing,
}

export const getBriefing = (skillId: string): SkillBriefing | null => skillBriefings[skillId] ?? null

export const hasBriefing = (skillId: string): boolean => skillId in skillBriefings

/** Skill ids with a briefing — used by the prompt on the question page. */
export const briefedSkillIds = (): string[] => Object.keys(skillBriefings)

export type { SkillBriefing, ResolvedBriefing, MethodStep, ConfusableWith } from './types'
export { resolveBriefing } from './types'
