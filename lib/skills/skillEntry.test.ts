import { describe, it, expect } from 'vitest'
import { entryForSkills, hasTeaching } from './skillEntry'
import { briefedSkillIds } from '../../data/skillBriefings'
import { investigatedSkillIds, getInvestigation } from '../../data/investigations'
import { allDraws, sectionForQuestion } from './investigation'

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
      .toEqual({ kind: 'investigation', skillId: INVESTIGATED, section: null })
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
    expect(entryForSkills([a, b], new Set([a]))).toEqual({ kind: 'investigation', skillId: b, section: null })
    // Finishing something else changes nothing.
    expect(entryForSkills([INVESTIGATED], new Set(['not_a_skill'])))
      .toEqual({ kind: 'investigation', skillId: INVESTIGATED, section: null })
  })

  it('prefers an investigated skill over a merely briefed one in the same question', () => {
    expect(entryForSkills([BRIEFED_ONLY, INVESTIGATED]))
      .toEqual({ kind: 'investigation', skillId: INVESTIGATED, section: null })
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

describe('a wrong answer opens the section that teaches it (docs/audit/33)', () => {
  const ratio = getInvestigation('ratio')!
  const proportion = getInvestigation('proportion')!
  const RATIO_SECTION_2_CHECK = '1af11a98-9049-4937-b626-e1c01d18609f'
  const RATIO_THREE_PEOPLE = '8fae0cf9-b732-4cb4-a82a-21b7533b9efa'   // authored: section 4
  const SIMPLIFY_A_RATIO = '9e709cea-54e8-4d83-a31d-b98ff17b3e82'     // authored: no section

  it('takes a check to its own section, and an authored question to its section', () => {
    expect(sectionForQuestion(ratio, RATIO_SECTION_2_CHECK)).toBe(1)
    expect(sectionForQuestion(ratio, RATIO_THREE_PEOPLE)).toBe(3)
  })

  it('gives no section for a question no section teaches, or one it has never seen', () => {
    expect(sectionForQuestion(ratio, SIMPLIFY_A_RATIO)).toBeNull()
    expect(sectionForQuestion(ratio, '00000000-0000-0000-0000-000000000000')).toBeNull()
  })

  it('lets a misconception that belongs to ONE section decide, and not one shared by several', () => {
    // Best buys' rule alone is tagged compared_unlike_quantities.
    expect(sectionForQuestion(proportion, '00000000-0000-0000-0000-000000000000', 'compared_unlike_quantities')).toBe(2)
    expect(sectionForQuestion(proportion, 'f7e179b6-8dbe-4e55-9d08-d42bc35781be', 'compared_unlike_quantities')).toBe(2)
    // part_used_as_whole is in more than one ratio section: the question decides.
    expect(sectionForQuestion(ratio, RATIO_THREE_PEOPLE, 'part_used_as_whole')).toBe(3)
  })

  it('offers the section to a student who has not finished, from the start without one', () => {
    expect(entryForSkills(['ratio'], new Set(), { questionId: RATIO_THREE_PEOPLE }))
      .toEqual({ kind: 'investigation', skillId: 'ratio', section: 3 })
    expect(entryForSkills(['ratio'], new Set(), { questionId: SIMPLIFY_A_RATIO }))
      .toEqual({ kind: 'investigation', skillId: 'ratio', section: null })
  })

  it('offers a finished student the section to revisit, beside the briefing (D4)', () => {
    expect(entryForSkills(['ratio'], new Set(['ratio']), { questionId: RATIO_THREE_PEOPLE }))
      .toEqual({ kind: 'revisit', skillId: 'ratio', section: 3, briefing: briefedSkillIds().includes('ratio') })
    // No section for this mistake: the briefing, as before.
    expect(entryForSkills(['ratio'], new Set(['ratio']), { questionId: SIMPLIFY_A_RATIO }))
      .toEqual(briefedSkillIds().includes('ratio') ? { kind: 'briefing', skillId: 'ratio' } : null)
  })

  it('maps every authored question to a real section, and never against its own check', () => {
    for (const id of investigatedSkillIds()) {
      const inv = getInvestigation(id)!
      const sections = inv.build(allDraws(inv.parameters)[0])
      for (const [q, n] of Object.entries(inv.questionSections ?? {})) {
        if (n === null) continue
        expect(n, `${id}: ${q}`).toBeGreaterThanOrEqual(1)
        expect(n, `${id}: ${q}`).toBeLessThanOrEqual(sections.length)
        // A check maps itself; listing it again with another section would be
        // two answers to one question.
        const own = sections.findIndex(s => (s.check ?? []).some(c => c.questionId === q))
        if (own !== -1) expect(n - 1, `${id}: ${q} is section ${own + 1}'s check`).toBe(own)
      }
    }
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
