import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { HOME_INVESTIGATION_SKILL } from './homeInvestigation'
import { hasInvestigation, getInvestigation } from '../data/investigations'
import { investigatePath, slugToSkillId } from './skills/slug'

describe('the homepage investigation link', () => {
  it('points at an investigation that exists, so the link never lands on "no investigation here yet"', () => {
    expect(hasInvestigation(HOME_INVESTIGATION_SKILL)).toBe(true)
    expect(getInvestigation(HOME_INVESTIGATION_SKILL)?.skillId).toBe(HOME_INVESTIGATION_SKILL)
  })

  it('builds a URL that resolves back to that skill', () => {
    const path = investigatePath(HOME_INVESTIGATION_SKILL)
    expect(path).toBe('/skill/understanding-straight-line-graphs/investigate')
    const slug = path.split('/')[2]
    expect(slugToSkillId(slug)).toBe(HOME_INVESTIGATION_SKILL)
  })

  it('is actually wired into the landing page, through the shared helper and with its own click event', () => {
    const src = readFileSync(join(process.cwd(), 'app', 'Landing.tsx'), 'utf8')
    expect(src).toContain('href={investigatePath(HOME_INVESTIGATION_SKILL)}')
    expect(src).toContain("trackEvent('hero_investigation_clicked'")
    // not a hardcoded path that could drift from the registry
    expect(src).not.toContain('/investigate"')
  })

  it('does not pull the investigation registry into the landing page bundle', () => {
    const src = readFileSync(join(process.cwd(), 'app', 'Landing.tsx'), 'utf8')
    expect(src).not.toMatch(/from ['"]\.\.\/data\/investigations/)
  })
})
