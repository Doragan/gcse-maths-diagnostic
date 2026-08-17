import { skills } from '../../data/skills'

// ─────────────────────────────────────────────────────────────────────────────
// Skill ids are already human-readable (`expanding_double_brackets`) because
// skills live in data/skills.ts, not the database — the random uuids are on
// questions. So a skill URL needs no id mapping, only a separator swap:
// search engines read a hyphen as a word separator and an underscore as a word
// joiner, so `/skill/expanding-double-brackets` is indexable in a way that
// `/skill/expanding_double_brackets` is not.
// ─────────────────────────────────────────────────────────────────────────────

export const skillIdToSlug = (skillId: string): string => skillId.replace(/_/g, '-')

/**
 * Resolve a URL slug back to a skill id. Accepts the underscore form too, so
 * an old or hand-typed link still lands rather than 404ing.
 */
export function slugToSkillId(slug: string): string | null {
  const normalised = slug.toLowerCase().replace(/-/g, '_')
  return skills.some(s => s.id === normalised) ? normalised : null
}

export const skillPath = (skillId: string): string => `/skill/${skillIdToSlug(skillId)}`
