import { describe, it, expect } from 'vitest'
import { entryForSkills, hasTeaching } from './skillEntry'
import { briefedSkillIds } from '../../data/skillBriefings'
import { investigatedSkillIds } from '../../data/investigations'

const INVESTIGATED = investigatedSkillIds()[0]
const BRIEFED_ONLY = briefedSkillIds().find(id => !investigatedSkillIds().includes(id))!

describe('entryForSkills', () => {
  it('offers nothing for a skill with neither', () => {
    expect(entryForSkills(['simple_arithmetic'])).toBeNull()
    expect(entryForSkills([])).toBeNull()
  })

  it('offers the briefing when that is all there is', () => {
    expect(entryForSkills([BRIEFED_ONLY])).toEqual({ kind: 'briefing', skillId: BRIEFED_ONLY })
  })

  it('prefers the investigation over the briefing', () => {
    // A wrong answer is where a missing concept shows, and the briefing is
    // written for someone who already has it.
    expect(entryForSkills([INVESTIGATED]))
      .toEqual({ kind: 'investigation', skillId: INVESTIGATED })
  })

  it('does not offer an investigation the student has already finished', () => {
    // docs/audit/32 D3: the briefing where there is one, else nothing.
    const both = investigatedSkillIds().find(id => briefedSkillIds().includes(id))
    if (both) {
      expect(entryForSkills([both], new Set([both]))).toEqual({ kind: 'briefing', skillId: both })
    }
    const onlyInvestigated = investigatedSkillIds().find(id => !briefedSkillIds().includes(id))
    if (onlyInvestigated) {
      expect(entryForSkills([onlyInvestigated], new Set([onlyInvestigated]))).toBeNull()
    }
    // A finished one does not hide another skill's investigation in the same question.
    const [a, b] = investigatedSkillIds()
    expect(entryForSkills([a, b], new Set([a]))).toEqual({ kind: 'investigation', skillId: b })
    // Finishing something else changes nothing.
    expect(entryForSkills([INVESTIGATED], new Set(['not_a_skill'])))
      .toEqual({ kind: 'investigation', skillId: INVESTIGATED })
  })

  it('prefers an investigated skill over a merely briefed one in the same question', () => {
    expect(entryForSkills([BRIEFED_ONLY, INVESTIGATED]))
      .toEqual({ kind: 'investigation', skillId: INVESTIGATED })
  })

  it('takes the question order among equals', () => {
    // skill_ids is authored in order, so its head is what the question is
    // mainly about — not whichever registry happens to list a skill first.
    const two = briefedSkillIds()
      .filter(id => !investigatedSkillIds().includes(id))
      .slice(0, 2)
    if (two.length < 2) return
    expect(entryForSkills(two)).toEqual({ kind: 'briefing', skillId: two[0] })
    expect(entryForSkills([two[1], two[0]])).toEqual({ kind: 'briefing', skillId: two[1] })
  })

  it('ignores skills that have nothing when choosing', () => {
    expect(entryForSkills(['simple_arithmetic', BRIEFED_ONLY]))
      .toEqual({ kind: 'briefing', skillId: BRIEFED_ONLY })
  })
})

describe('hasTeaching', () => {
  it('is true for either layer and false for neither', () => {
    expect(hasTeaching(INVESTIGATED)).toBe(true)
    expect(hasTeaching(BRIEFED_ONLY)).toBe(true)
    expect(hasTeaching('simple_arithmetic')).toBe(false)
  })

  it('agrees with entryForSkills on every authored skill', () => {
    for (const id of [...briefedSkillIds(), ...investigatedSkillIds()]) {
      expect(hasTeaching(id), id).toBe(true)
      expect(entryForSkills([id]), id).not.toBeNull()
    }
  })
})
