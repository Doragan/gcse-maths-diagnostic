import type { Investigation } from './types'
import {
  understandingStraightLineGraphsInvestigation,
} from './understandingStraightLineGraphs'

// ─────────────────────────────────────────────────────────────────────────────
// Registry of authored investigations.
//
// Sparse by design, exactly like data/skillBriefings: a skill with no
// investigation simply has none, nothing links to one, and every entry point
// checks hasInvestigation first.
//
// Deliberately NOT written out across the twenty candidate skills at once.
// docs/audit/31 §9 holds the reason: the second one is chosen to STRESS the
// shell rather than to be easy — enlargements, a polygon figure with two shapes
// on the axes — because that is what finds out whether this generalised while
// it is still cheap to discover it did not.
// ─────────────────────────────────────────────────────────────────────────────

export const investigations: Record<string, Investigation> = {
  [understandingStraightLineGraphsInvestigation.skillId]:
    understandingStraightLineGraphsInvestigation,
}

export const getInvestigation = (skillId: string): Investigation | null =>
  investigations[skillId] ?? null

export const hasInvestigation = (skillId: string): boolean => skillId in investigations

export const investigatedSkillIds = (): string[] => Object.keys(investigations)

export type { Investigation } from './types'
