/**
 * What goes in /sitemap.xml — a pure function (no Next, no I/O) so the rules are
 * unit-tested; app/sitemap.ts only feeds it the registries and the site URL.
 *
 * The sitemap exists for one reason: organic Google is the one acquisition
 * channel that works without ads, and the skill briefings and investigations are
 * the content it can rank — but they are linked only from /skills, with no other
 * way for a crawler to find them.
 *
 * It is an allowlist, not a crawl of the route tree. Everything not named here
 * is left out deliberately:
 *   - account, auth, admin, /dashboard, /student/*, /join, /invite, /pay and /s
 *     are private, tokenised or session-specific;
 *   - /practice/question/[id] is a client-rendered page for ONE randomised
 *     question, not content worth ranking, and it is what the non-human traffic
 *     already lands on;
 *   - /privacy, /terms and /dpa are legal pages, not discovery targets.
 *
 * No lastModified, changeFrequency or priority. The first is unknowable per page
 * without a content timestamp (stamping every URL with "now" teaches Google to
 * ignore the field), and Google documents ignoring the other two.
 */

export type SitemapEntry = { url: string }

/** Public pages that are real content for a visitor who is not signed in. */
export const STATIC_PATHS: readonly string[] = [
  '/',
  '/practice',
  '/skills',
  '/student/diagnostic',
  '/mark',
  '/for-teachers',
  '/demo',
  '/guide',
  '/about',
]

/** `expanding_double_brackets` → `expanding-double-brackets` (see lib/skills/slug.ts). */
const slugOf = (skillId: string): string => skillId.replace(/_/g, '-')

/** Strip any trailing slashes so `https://x.net/` and `https://x.net` give one URL, not `//`. */
export const normaliseBase = (base: string): string => base.replace(/\/+$/, '')

/**
 * Entries for the whole sitemap, in a stable order: static pages, then one
 * briefing per briefed skill, then one investigation per investigated skill.
 * The two lists are independent: an investigation is listed whether or not its
 * skill also has a briefing, because /skills links straight to the investigation
 * when there is no briefing (app/skills/page.tsx), so it is a real, reachable page.
 */
export function buildSitemapEntries(
  base: string,
  briefedSkillIds: readonly string[],
  investigatedSkillIds: readonly string[],
): SitemapEntry[] {
  const root = normaliseBase(base)
  const briefed = [...new Set(briefedSkillIds)].sort()
  const investigated = [...new Set(investigatedSkillIds)].sort()

  const paths = [
    ...STATIC_PATHS,
    ...briefed.map(id => `/skill/${slugOf(id)}`),
    ...investigated.map(id => `/skill/${slugOf(id)}/investigate`),
  ]
  // `/` becomes the bare origin with a trailing slash; everything else is root + path.
  return paths.map(p => ({ url: p === '/' ? `${root}/` : `${root}${p}` }))
}
