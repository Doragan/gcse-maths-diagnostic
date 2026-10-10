import { describe, it, expect } from 'vitest'
import { skills } from '../../data/skills'
import {
  courses,
  foundationSkillIds, higherOnlySkillIds,
  igcseFoundationSkillIds, igcseHigherOnlySkillIds,
} from '../../data/courses'
import { getAccessibleSkillIds } from './masteryEngine'
import { prerequisiteTreeWithin } from './skillGraph'

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
//
// ─── Why these are per-COURSE and not global ─────────────────────────────────
// They used to assert that every skill sat in exactly ONE tier, full stop. That
// held while GCSE Foundation and Higher were the only two tiers in existence.
// It stopped being true when iGCSE (4MA1) arrived in 2026-10: `vectors` is
// Foundation on GCSE and Higher-only on 4MA1, and `venn_diagrams` and
// `upper_and_lower_bounds` go the other way. A skill's tier is a fact about a
// COURSE, not about the skill.
//
// So the invariant is now: every skill belongs to at least one course, and
// within any single course it sits in exactly one tier. Adding a qualification
// means adding its pair to TIERS_BY_COURSE below and nothing else here.
// ─────────────────────────────────────────────────────────────────────────────

/** Each course's (foundation, higher-only) pair, by the course id they build. */
const TIERS_BY_COURSE = [
  { course: 'gcse_higher', foundation: foundationSkillIds, higherOnly: higherOnlySkillIds },
  { course: 'igcse_higher', foundation: igcseFoundationSkillIds, higherOnly: igcseHigherOnlySkillIds },
] as const

const knownIds = new Set(skills.map(s => s.id))
const everyTieredId = new Set(
  TIERS_BY_COURSE.flatMap(t => [...t.foundation, ...t.higherOnly]),
)

describe('tier lists', () => {
  it('places every defined skill in at least one course', () => {
    const missing = skills.filter(s => !everyTieredId.has(s.id)).map(s => s.id)
    expect(missing, 'skills in data/skills.ts but in no course').toEqual([])
  })

  it('does not reference a skill that no longer exists', () => {
    const ghosts = [...everyTieredId].filter(id => !knownIds.has(id))
    expect(ghosts, 'tier list ids with no matching skill').toEqual([])
  })

  it.each(TIERS_BY_COURSE)(
    '$course never lists the same skill as both Foundation and Higher-only',
    ({ foundation, higherOnly }) => {
      const both = foundation.filter(id => higherOnly.includes(id))
      expect(both, 'ids in both tier lists of one course').toEqual([])
    },
  )

  it.each(TIERS_BY_COURSE)(
    'builds $course as its Foundation list plus its Higher-only skills',
    ({ course, foundation, higherOnly }) => {
      const higher = courses.find(c => c.id === course)!
      expect(higher.skills).toEqual([...foundation, ...higherOnly])
    },
  )
})

describe('prerequisite reachability', () => {
  it.each(TIERS_BY_COURSE)(
    '$course never gates an in-pool skill behind a prerequisite outside its tiers',
    ({ foundation, higherOnly }) => {
      // The specific bug: a prerequisite that is in no tier list can never be
      // attempted, so every dependent fails getAccessibleSkillIds forever.
      // Scoped per course: a prerequisite outside the course is not a
      // prerequisite OF the course (see prerequisiteTreeWithin). What must not
      // happen is a skill being gated behind something the course never
      // teaches, which is what this now checks.
      const tiered = [...foundation, ...higherOnly]
      const inPool = prerequisiteTreeWithin(tiered)
      const gated = skills
        .filter(s => tiered.includes(s.id))
        .map(s => ({ skill: s.id, blockedBy: inPool(s.id).filter(p => !tiered.includes(p)) }))
        .filter(g => g.blockedBy.length > 0)

      expect(gated, 'in-pool skills whose prerequisites are unreachable').toEqual([])
    },
  )

  it('keeps every prerequisite pointing at a real skill', () => {
    const dangling = skills.flatMap(s =>
      (s.prerequisites ?? []).filter(p => !knownIds.has(p)).map(p => `${s.id} -> ${p}`))
    expect(dangling, 'prerequisites naming a skill that does not exist').toEqual([])
  })

  it.each(TIERS_BY_COURSE)(
    'opens the whole of $course Foundation to a student who masters everything',
    ({ foundation }) => {
      // End-to-end proof that no skill is permanently unreachable: give the
      // student mastery of every skill and assert the accessible pool is the
      // entire tier. Any skill missing here can never be served, whatever the
      // student does.
      const mastery = Object.fromEntries(
        foundation.map(id => [
          id,
          { skillId: id, status: 'mastered' as const, recentAttempts: 5, recentCorrect: 5 },
        ]),
      )
      const accessible = getAccessibleSkillIds(mastery, [...foundation], prerequisiteTreeWithin(foundation))
      const unreachable = foundation.filter(id => !accessible.includes(id))
      expect(unreachable, 'Foundation skills unreachable even at full mastery').toEqual([])
    },
  )
})
