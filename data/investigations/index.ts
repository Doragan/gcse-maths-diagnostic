import type { Investigation } from './types'
import {
  understandingStraightLineGraphsInvestigation,
} from './understandingStraightLineGraphs'
import { percentageChangeInvestigation } from './percentageChange'
import { compoundUnitsInvestigation } from './compoundUnits'
import { ratioInvestigation } from './ratio'

// ─────────────────────────────────────────────────────────────────────────────
// Registry of authored investigations.
//
// Sparse by design, exactly like data/skillBriefings: a skill with no
// investigation simply has none, nothing links to one, and every entry point
// checks hasInvestigation first.
//
// Deliberately NOT written out across the twenty candidate skills at once.
// docs/audit/31 §9 says the second one is chosen to STRESS the shell rather
// than to be easy. It names enlargements — a polygon figure — but percentage
// change stresses it harder and in a more useful direction: it DRAWS NOTHING,
// which the type system did not allow until this was built. Ranking every
// skill by exam marks also put it at 231 against enlargements' 43, and
// enlargements has exactly one bank question that could serve as a section
// check, because its exam format is drawing and BankQuestion refuses
// grid_draw.
// ─────────────────────────────────────────────────────────────────────────────

export const investigations: Record<string, Investigation> = {
  [understandingStraightLineGraphsInvestigation.skillId]:
    understandingStraightLineGraphsInvestigation,
  [percentageChangeInvestigation.skillId]: percentageChangeInvestigation,
  [compoundUnitsInvestigation.skillId]: compoundUnitsInvestigation,
  [ratioInvestigation.skillId]: ratioInvestigation,
}

export const getInvestigation = (skillId: string): Investigation | null =>
  investigations[skillId] ?? null

export const hasInvestigation = (skillId: string): boolean => skillId in investigations

export const investigatedSkillIds = (): string[] => Object.keys(investigations)

export type { Investigation } from './types'
