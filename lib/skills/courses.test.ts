import { describe, it, expect } from 'vitest'
import { skills } from '../../data/skills'
import { courses, foundationSkillIds, higherOnlySkillIds } from '../../data/courses'
import { getAccessibleSkillIds } from './masteryEngine'
import { getPrerequisiteTree } from './skillGraph'

// ─────────────────────────────────────────────────────────────────────────────
// The tier lists in data/courses.ts are what actually reaches a student: they
// drive the practice pool, the question page and the diagnostic. A skill can
// exist in data/skills.ts, carry questions, and appear in the exam profiles
// while being completely unreachable — nothing errors, it is simply never
// served.
//
// Worse, an unreachable skill POISONS its dependents. getAccessibleSkillIds
// requires every prerequisite to have been attempted, so a skill whose
// prerequisite is in no tier list can never become accessible either. That is
// how `ratio` and `pythagoras_theorem` were silently gated: 19 skills had been
// added to skills.ts over time without ever being placed in a tier.
//
// These tests exist so that failure mode is loud instead of silent.
// ─────────────────────────────────────────────────────────────────────────────

const tiered = new Set([...foundationSkillIds, ...higherOnlySkillIds])
const knownIds = new Set(skills.map(s => s.id))

describe('tier lists', () => {
  it('places every defined skill in exactly one tier', () => {
    const missing = skills.filter(s => !tiered.has(s.id)).map(s => s.id)
    expect(missing, 'skills in data/skills.ts but in no tier list').toEqual([])
  })

  it('does not reference a skill that no longer exists', () => {
    const ghosts = [...tiered].filter(id => !knownIds.has(id))
    expect(ghosts, 'tier list ids with no matching skill').toEqual([])
  })

  it('never lists the same skill as both Foundation and Higher-only', () => {
    const both = foundationSkillIds.filter(id => higherOnlySkillIds.includes(id))
    expect(both, 'ids in both tier lists').toEqual([])
  })

  it('builds the Higher course as Foundation plus the Higher-only skills', () => {
    const higher = courses.find(c => c.id === 'gcse_higher')!
    expect(higher.skills).toEqual([...foundationSkillIds, ...higherOnlySkillIds])
  })
})

describe('prerequisite reachability', () => {
  it('never gates an in-pool skill behind a prerequisite outside the tier lists', () => {
    // The specific bug: a prerequisite that is in no tier list can never be
    // attempted, so every dependent fails getAccessibleSkillIds forever.
    const gated = skills
      .filter(s => tiered.has(s.id))
      .map(s => ({ skill: s.id, blockedBy: (s.prerequisites ?? []).filter(p => !tiered.has(p)) }))
      .filter(g => g.blockedBy.length > 0)

    expect(gated, 'in-pool skills whose prerequisites are unreachable').toEqual([])
  })

  it('keeps every prerequisite pointing at a real skill', () => {
    const dangling = skills.flatMap(s =>
      (s.prerequisites ?? []).filter(p => !knownIds.has(p)).map(p => `${s.id} -> ${p}`))
    expect(dangling, 'prerequisites naming a skill that does not exist').toEqual([])
  })

  it('opens the whole Foundation tier to a student who masters everything', () => {
    // End-to-end proof that no skill is permanently unreachable: give the
    // student mastery of every skill and assert the accessible pool is the
    // entire tier. Any skill missing here can never be served, whatever the
    // student does.
    const mastery = Object.fromEntries(
      foundationSkillIds.map(id => [
        id,
        { skillId: id, status: 'mastered' as const, recentAttempts: 5, recentCorrect: 5 },
      ]),
    )
    const accessible = getAccessibleSkillIds(mastery, foundationSkillIds, getPrerequisiteTree)
    const unreachable = foundationSkillIds.filter(id => !accessible.includes(id))
    expect(unreachable, 'Foundation skills unreachable even at full mastery').toEqual([])
  })
})
