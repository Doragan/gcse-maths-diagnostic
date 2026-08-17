import type { SkillGuide } from './types'
import { proportionGuide } from './proportion'

// ─────────────────────────────────────────────────────────────────────────────
// Registry of authored skill guides.
//
// Deliberately sparse. A skill with no guide simply has no guide page, and
// nothing anywhere in the app links to one — every entry point checks
// `hasGuide` first. That is what makes it safe to trial the format on a single
// skill before committing to authoring 150 of them.
// ─────────────────────────────────────────────────────────────────────────────

export const skillGuides: Record<string, SkillGuide> = {
  [proportionGuide.skillId]: proportionGuide,
}

export const getGuide = (skillId: string): SkillGuide | null => skillGuides[skillId] ?? null

export const hasGuide = (skillId: string): boolean => skillId in skillGuides

/** Skill ids with a guide — used by the trial prompt on the question page. */
export const guidedSkillIds = (): string[] => Object.keys(skillGuides)

export type { SkillGuide, ResolvedGuide, MethodStep, ConfusableWith } from './types'
export { resolveGuide } from './types'
