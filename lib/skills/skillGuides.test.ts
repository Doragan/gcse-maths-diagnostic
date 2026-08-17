import { describe, it, expect } from 'vitest'
import { getGuide, hasGuide, resolveGuide, skillGuides } from '../../data/skillGuides'
import { skillsById } from './skillGraph'
import { skillIdToSlug, slugToSkillId } from './slug'

describe('skill guide registry', () => {
  it('only registers guides for real skills', () => {
    for (const skillId of Object.keys(skillGuides)) {
      expect(skillsById[skillId], `${skillId} is not a skill in data/skills.ts`).toBeDefined()
    }
  })

  it('reports guides that do not exist as absent', () => {
    expect(hasGuide('proportion')).toBe(true)
    expect(hasGuide('completely_made_up_skill')).toBe(false)
    expect(getGuide('completely_made_up_skill')).toBeNull()
  })

  it('points every confusable and near-miss at a real skill', () => {
    for (const guide of Object.values(skillGuides)) {
      const referenced = [
        ...guide.confusableWith.map(c => c.skillId),
        ...guide.examples.flatMap(e => (e.actuallySkillId ? [e.actuallySkillId] : [])),
        ...(guide.higher?.confusableWith ?? []).map(c => c.skillId),
        ...(guide.higher?.examples ?? []).flatMap(e => (e.actuallySkillId ? [e.actuallySkillId] : [])),
      ]
      for (const id of referenced) {
        expect(skillsById[id], `${guide.skillId} references unknown skill ${id}`).toBeDefined()
      }
    }
  })

  it('gives every example set at least one near-miss', () => {
    // A set where everything IS the skill only confirms what the student already
    // assumed. The near-miss is what makes it a selection drill.
    for (const guide of Object.values(skillGuides)) {
      const foundation = guide.examples
      expect(foundation.some(e => !e.isThisSkill), `${guide.skillId} has no near-miss`).toBe(true)
      // A near-miss must say what it actually is, or the tell has nowhere to land.
      for (const e of foundation.filter(e => !e.isThisSkill)) {
        expect(e.actuallySkillId, `near-miss "${e.stem}" has no actuallySkillId`).toBeTruthy()
      }
    }
  })
})

describe('resolveGuide', () => {
  const guide = getGuide('proportion')!

  it('gives Foundation the shared content only', () => {
    const g = resolveGuide(guide, 'foundation')
    expect(g.recognise).toEqual(guide.recognise)
    expect(g.examples).toEqual(guide.examples)
    expect(g.steps).toEqual(guide.steps)
    expect(g.higherNote).toBeNull()
  })

  it('merges the Higher block on top of the shared content', () => {
    const f = resolveGuide(guide, 'foundation')
    const h = resolveGuide(guide, 'higher')

    // Merge, never replace — the Foundation method is still the method.
    expect(h.steps.slice(0, f.steps.length)).toEqual(f.steps)
    expect(h.recognise.slice(0, f.recognise.length)).toEqual(f.recognise)
    expect(h.examples.slice(0, f.examples.length)).toEqual(f.examples)

    expect(h.steps.length).toBeGreaterThan(f.steps.length)
    expect(h.examples.length).toBeGreaterThan(f.examples.length)
    expect(h.higherNote).toBeTruthy()
    expect(h.higherStepCount).toBe(h.steps.length - f.steps.length)
  })
})

describe('skill slugs', () => {
  it('round-trips every skill id through its URL slug', () => {
    for (const skillId of Object.keys(skillsById)) {
      expect(slugToSkillId(skillIdToSlug(skillId))).toBe(skillId)
    }
  })

  it('uses hyphens, not underscores, in the URL', () => {
    expect(skillIdToSlug('expanding_double_brackets')).toBe('expanding-double-brackets')
  })

  it('still resolves the underscore form, so old links land', () => {
    expect(slugToSkillId('expanding_double_brackets')).toBe('expanding_double_brackets')
  })

  it('rejects an unknown slug rather than inventing a skill', () => {
    expect(slugToSkillId('not-a-real-skill')).toBeNull()
  })
})
