import { describe, it, expect, afterEach, vi } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { buildSitemapEntries, normaliseBase, STATIC_PATHS } from './sitemap'
import { CANONICAL_ORIGIN, siteUrl } from './siteUrl'
import { briefedSkillIds } from '../../data/skillBriefings'
import { investigatedSkillIds } from '../../data/investigations'
import { slugToSkillId } from '../skills/slug'

const BASE = 'https://www.mathsense.net'
const urls = (b: string[], i: string[], base = BASE) => buildSitemapEntries(base, b, i).map(e => e.url)

describe('buildSitemapEntries', () => {
  it('lists the static pages first, then briefings, then investigations', () => {
    const u = urls(['ratio'], ['ratio'])
    expect(u.slice(0, STATIC_PATHS.length)).toEqual(
      STATIC_PATHS.map(p => (p === '/' ? `${BASE}/` : `${BASE}${p}`)),
    )
    expect(u.slice(STATIC_PATHS.length)).toEqual([`${BASE}/skill/ratio`, `${BASE}/skill/ratio/investigate`])
  })

  it('turns underscores in skill ids into hyphens, to match the live URL scheme', () => {
    const u = urls(['expanding_double_brackets'], [])
    expect(u).toContain(`${BASE}/skill/expanding-double-brackets`)
    expect(u.join('\n')).not.toContain('expanding_double')
  })

  it('lists an investigation even when its skill has no briefing (the /skills index links straight to it)', () => {
    const u = urls([], ['straight_line_graphs'])
    expect(u).toContain(`${BASE}/skill/straight-line-graphs/investigate`)
    expect(u.some(x => x.endsWith('/skill/straight-line-graphs'))).toBe(false)
  })

  it('is stable: sorted, and a duplicated id appears once', () => {
    const a = urls(['b_skill', 'a_skill', 'b_skill'], [])
    const b = urls(['a_skill', 'b_skill'], [])
    expect(a).toEqual(b)
    const briefings = a.filter(x => x.includes('/skill/'))
    expect(briefings).toEqual([`${BASE}/skill/a-skill`, `${BASE}/skill/b-skill`])
  })

  it('never produces a double slash, whatever trailing slashes the base carries', () => {
    for (const base of [BASE, `${BASE}/`, `${BASE}///`]) {
      for (const u of urls(['ratio'], ['ratio'], base)) {
        expect(u.replace('https://', '')).not.toContain('//')
        expect(u.startsWith(`${BASE}/`)).toBe(true)
      }
    }
  })

  it('has no duplicate URLs', () => {
    const u = urls(['ratio', 'mean'], ['ratio'])
    expect(new Set(u).size).toBe(u.length)
  })

  it('never lists a private, tokenised or per-question page', () => {
    const banned = ['/account', '/auth', '/admin', '/dashboard', '/student/dashboard', '/student/exam', '/student/classes',
      '/student/assignments', '/student/upgrade', '/join', '/invite', '/pay', '/s', '/practice/question', '/privacy', '/terms', '/dpa']
    for (const path of STATIC_PATHS) {
      for (const b of banned) {
        expect(path === b || path.startsWith(`${b}/`), `${path} should not be listed (${b})`).toBe(false)
      }
    }
  })
})

describe('against the real repo', () => {
  it('every static path is a page that exists, so a rename or deletion fails here, not in Search Console', () => {
    for (const path of STATIC_PATHS) {
      const file = path === '/' ? join('app', 'page.tsx') : join('app', ...path.split('/').filter(Boolean), 'page.tsx')
      expect(existsSync(join(process.cwd(), file)), `${path} → ${file}`).toBe(true)
    }
  })

  it('every briefed and investigated skill resolves from its slug, so no listed URL is a 404', () => {
    for (const id of [...briefedSkillIds(), ...investigatedSkillIds()]) {
      const slug = id.replace(/_/g, '-')
      expect(slugToSkillId(slug), `${id} → /skill/${slug}`).toBe(id)
    }
  })

  it('lists every briefing and every investigation the site has', () => {
    const u = new Set(urls(briefedSkillIds(), investigatedSkillIds()))
    for (const id of briefedSkillIds()) expect(u.has(`${BASE}/skill/${id.replace(/_/g, '-')}`)).toBe(true)
    for (const id of investigatedSkillIds()) expect(u.has(`${BASE}/skill/${id.replace(/_/g, '-')}/investigate`)).toBe(true)
    expect(briefedSkillIds().length).toBeGreaterThan(0)
  })
})

describe('normaliseBase / siteUrl', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('strips trailing slashes and nothing else', () => {
    expect(normaliseBase('https://x.net/')).toBe('https://x.net')
    expect(normaliseBase('https://x.net///')).toBe('https://x.net')
    expect(normaliseBase('https://x.net/a')).toBe('https://x.net/a')
  })

  it('uses NEXT_PUBLIC_SITE_URL when set, the same variable as metadataBase', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://staging.example.net/')
    expect(siteUrl()).toBe('https://staging.example.net')
  })

  it('falls back to the real production origin, never localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect(siteUrl()).toBe(CANONICAL_ORIGIN)
    expect(CANONICAL_ORIGIN).toBe('https://www.mathsense.net')
  })
})
