import { describe, it, expect } from 'vitest'
import { buildStudentEvidence, buildClassEvidence, STRONG_TOPIC_RATIO } from './feedbackEvidence'
import type { PaperConfig } from '../demoPapers'

// A fixture rather than a real paper: the boundary cases here (a multi-skill
// item, a visual item with no retry question, a topic that is strong and one
// that is not) have to stay put, and a real paper's marks may be corrected.
//
// Skill ids are real ones from data/skills.ts so the canonical-name lookup is
// exercised for what it is, plus one deliberately unknown id to prove the
// fallback.
const paper = {
  id: 'test-paper',
  title: 'Test',
  subtitle: 'Test',
  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'stats', label: 'Statistics' },
  ],
  questions: [
    { id: '1',  label: '1',    marks: 2, topic: 'number',  skill: 'Indices',      skillIds: ['indices'], kind: 'mastery', desc: 'Powers', visual: false },
    { id: '2',  label: '2',    marks: 3, topic: 'number',  skill: 'Ratio',        skillIds: ['ratio', 'proportion'], kind: 'exam', desc: 'Share a ratio', visual: false },
    { id: '3',  label: '3',    marks: 4, topic: 'algebra', skill: 'Equations',    skillIds: ['solving_linear_equations'], kind: 'mastery', desc: 'Solve', visual: false },
    { id: '4',  label: '4',    marks: 1, topic: 'stats',   skill: 'Charts',       skillIds: ['simple_charts'], kind: 'mastery', desc: 'Read a chart', visual: true },
    { id: '5',  label: '5',    marks: 2, topic: 'stats',   skill: 'Made Up',      skillIds: ['no_such_skill_id'], kind: 'mastery', desc: 'Unknown skill', visual: false },
  ],
  retrySet: {
    '1': { skill: 'Indices',   question: 'Work out 4 squared' },
    '2': { skill: 'Ratio',     question: 'Share 20 in the ratio 2:3' },
    '3': { skill: 'Equations', question: 'Solve 3x + 1 = 10' },
    // '4' is visual — deliberately absent, as retrySet only holds non-visual items.
    '5': { skill: 'Made Up',   question: 'A question' },
  },
  challengeQuestions: [
    { topic: 'number',  skill: 'Standard Form', question: 'Write 0.00047 in standard form.' },
    { topic: 'algebra', skill: 'Quadratics',    question: 'Solve x^2 - 5x + 6 = 0' },
  ],
  sampleStudents: [],
  sampleMarks: {},
} as unknown as PaperConfig

// Full marks everywhere except question 3, where 1 of 4 is lost.
const mostlyRight = { '1': 2, '2': 3, '3': 3, '4': 1, '5': 2 }

describe('buildStudentEvidence — totals', () => {
  it('scores the whole paper when no selection is given', () => {
    const e = buildStudentEvidence(paper, mostlyRight, 'stu')
    expect(e.available).toBe(12)
    expect(e.earned).toBe(11)
    expect(e.percentage).toBe(92)
    expect(e.coverage.fullPaper).toBe(true)
  })

  it('scores a partial paper against the selection, not the paper', () => {
    // Questions 1 and 3 only: 6 marks available, 5 earned.
    const e = buildStudentEvidence(paper, { '1': 2, '3': 3 }, 'stu', ['1', '3'])
    expect(e.available).toBe(6)
    expect(e.earned).toBe(5)
    expect(e.percentage).toBe(83)
  })

  it('reports coverage so a sheet can say what was not assessed', () => {
    const e = buildStudentEvidence(paper, { '1': 2 }, 'stu', ['1'])
    expect(e.coverage).toEqual({
      fullPaper: false,
      itemsAssessed: 1,
      itemsOnPaper: 5,
      marksAssessed: 2,
      marksOnPaper: 12,
    })
  })

  it('treats an unmarked item as nothing scored rather than nothing set', () => {
    const e = buildStudentEvidence(paper, { '1': 2 }, 'stu')
    expect(e.available).toBe(12)
    expect(e.earned).toBe(2)
    expect(e.items.find(i => i.itemId === '3')?.earned).toBe(0)
  })

  it('ignores a mark for an item outside the selection', () => {
    // validateEntries rejects this upstream; if one ever reaches here it must
    // not inflate the score above the available marks.
    const e = buildStudentEvidence(paper, { '1': 2, '3': 4 }, 'stu', ['1'])
    expect(e.earned).toBe(2)
    expect(e.available).toBe(2)
    expect(e.percentage).toBe(100)
  })

  it('does not divide by zero on an empty selection', () => {
    const e = buildStudentEvidence(paper, {}, 'stu', [])
    expect(e.available).toBe(0)
    expect(e.percentage).toBe(0)
  })
})

describe('buildStudentEvidence — skills', () => {
  it('counts a multi-skill item in full toward every skill it assesses', () => {
    // Q2 is 3 marks across two skills. Both must read 3, not 1.5 each.
    const e = buildStudentEvidence(paper, mostlyRight, 'stu')
    const ratio = e.skills.find(s => s.skillId === 'ratio')!
    const proportion = e.skills.find(s => s.skillId === 'proportion')!
    expect(ratio.available).toBe(3)
    expect(proportion.available).toBe(3)
    // Which is why skill marks deliberately exceed the paper total.
    expect(e.skills.reduce((s, k) => s + k.available, 0)).toBeGreaterThan(e.available)
  })

  it('sets fullMarks only on full marks, matching the derived-attempt rule', () => {
    const e = buildStudentEvidence(paper, mostlyRight, 'stu')
    expect(e.skills.find(s => s.skillId === 'indices')!.fullMarks).toBe(true)
    // 3 of 4 on Q3 earns no credit in deriveAttempts, so it must not read as
    // full marks here either — the sheet and the skill map have to agree.
    expect(e.skills.find(s => s.skillId === 'solving_linear_equations')!.fullMarks).toBe(false)
  })

  // The flag is descriptive, not a verdict: one paper cannot say a skill is
  // secure. A near miss and a blank both clear the flag, and the difference
  // between them lives in the marks, which is where a formatter must look.
  it('keeps a near miss distinguishable from a zero', () => {
    const nearMiss = buildStudentEvidence(paper, { '3': 3 }, 'stu', ['3'])
      .skills.find(s => s.skillId === 'solving_linear_equations')!
    const blank = buildStudentEvidence(paper, { '3': 0 }, 'stu', ['3'])
      .skills.find(s => s.skillId === 'solving_linear_equations')!

    expect(nearMiss.fullMarks).toBe(blank.fullMarks) // both false
    expect(nearMiss.marksLost).toBe(1)
    expect(blank.marksLost).toBe(4)
  })

  it('clears fullMarks when ANY of its items dropped a mark', () => {
    const twoItemSkill = {
      ...paper,
      questions: [
        { id: 'a', label: 'a', marks: 2, topic: 'number', skill: 'X', skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
        { id: 'b', label: 'b', marks: 2, topic: 'number', skill: 'X', skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
      ],
    } as unknown as PaperConfig
    const e = buildStudentEvidence(twoItemSkill, { a: 2, b: 1 }, 'stu')
    const skill = e.skills.find(s => s.skillId === 'indices')!
    expect(skill.fullMarks).toBe(false)
    expect(skill.earned).toBe(3)
    expect(skill.available).toBe(4)
  })

  it('orders skills worst first and splits them into full-marks and dropped', () => {
    const e = buildStudentEvidence(paper, mostlyRight, 'stu')
    expect(e.skills[0].skillId).toBe('solving_linear_equations')
    expect(e.droppedSkills.map(s => s.skillId)).toEqual(['solving_linear_equations'])
    expect(e.fullMarkSkills.every(s => s.marksLost === 0)).toBe(true)
    expect(e.fullMarkSkills.length + e.droppedSkills.length).toBe(e.skills.length)
  })

  it('names skills from the skill graph, falling back to the paper wording', () => {
    const e = buildStudentEvidence(paper, mostlyRight, 'stu')
    expect(e.skills.find(s => s.skillId === 'indices')!.label).toBe('Indices')
    // Not in data/skills.ts — the item's own label is still meaningful.
    expect(e.skills.find(s => s.skillId === 'no_such_skill_id')!.label).toBe('Made Up')
  })

  it('lists skills the selection did not assess', () => {
    const e = buildStudentEvidence(paper, { '1': 2 }, 'stu', ['1'])
    expect(e.unassessedSkillIds).toEqual(
      ['no_such_skill_id', 'proportion', 'ratio', 'simple_charts', 'solving_linear_equations'],
    )
  })

  it('does not call a skill unassessed when another set item also assesses it', () => {
    const shared = {
      ...paper,
      questions: [
        { id: 'a', label: 'a', marks: 1, topic: 'number', skill: 'X', skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
        { id: 'b', label: 'b', marks: 1, topic: 'number', skill: 'X', skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
      ],
    } as unknown as PaperConfig
    const e = buildStudentEvidence(shared, { a: 1 }, 'stu', ['a'])
    expect(e.unassessedSkillIds).toEqual([])
  })
})

describe('buildStudentEvidence — topics', () => {
  it('totals each topic and drops topics with no marks in the selection', () => {
    const e = buildStudentEvidence(paper, mostlyRight, 'stu', ['1', '3'])
    expect(e.topics.map(t => t.topicId)).toEqual(['number', 'algebra'])
    expect(e.topics.find(t => t.topicId === 'algebra')).toMatchObject({
      earned: 3, available: 4, ratio: 0.75,
    })
  })

  it('keeps the paper topic order rather than sorting by score', () => {
    const e = buildStudentEvidence(paper, mostlyRight, 'stu')
    expect(e.topics.map(t => t.topicId)).toEqual(['number', 'algebra', 'stats'])
  })
})

describe('buildStudentEvidence — suggestions', () => {
  it('suggests practice only for dropped items that have a retry question', () => {
    const e = buildStudentEvidence(paper, mostlyRight, 'stu')
    expect(e.practice.map(p => p.itemId)).toEqual(['3'])
    expect(e.practice[0]).toMatchObject({ itemLabel: '3', marksLost: 1 })
  })

  it('offers no practice for a dropped VISUAL item, which has no retry entry', () => {
    const e = buildStudentEvidence(paper, { '1': 2, '2': 3, '3': 4, '4': 0, '5': 2 }, 'stu')
    expect(e.practice).toEqual([])
  })

  it('orders practice by marks lost, worst first', () => {
    const e = buildStudentEvidence(paper, { '1': 0, '2': 3, '3': 1, '4': 1, '5': 2 }, 'stu')
    expect(e.practice.map(p => p.itemId)).toEqual(['3', '1'])
    expect(e.practice.map(p => p.marksLost)).toEqual([3, 2])
  })

  it('offers challenges only for topics at or above the strong threshold', () => {
    // Number is 5/5, Algebra 3/4 (0.75, below the bar).
    const e = buildStudentEvidence(paper, mostlyRight, 'stu')
    expect(e.challenges.map(c => c.topicId)).toEqual(['number'])
    expect(0.75).toBeLessThan(STRONG_TOPIC_RATIO)
  })

  it('offers no challenges when nothing is strong', () => {
    const e = buildStudentEvidence(paper, { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }, 'stu')
    expect(e.challenges).toEqual([])
  })
})

describe('determinism', () => {
  it('produces identical output for identical marks', () => {
    // A sheet regenerated from the same marks must not reshuffle.
    expect(buildStudentEvidence(paper, mostlyRight, 'stu'))
      .toEqual(buildStudentEvidence(paper, mostlyRight, 'stu'))
  })
})

describe('buildClassEvidence', () => {
  it('builds one evidence object per student, keeping the ref', () => {
    const all = buildClassEvidence(paper, [
      { studentRef: 'a', marks: mostlyRight },
      { studentRef: 'b', marks: { '1': 0 } },
    ])
    expect(all.map(e => e.studentRef)).toEqual(['a', 'b'])
    expect(all[0].earned).toBe(11)
    expect(all[1].earned).toBe(0)
  })

  it('applies one selection across the whole class', () => {
    const all = buildClassEvidence(
      paper,
      [{ studentRef: 'a', marks: { '1': 2 } }, { studentRef: 'b', marks: { '1': 1 } }],
      ['1'],
    )
    expect(all.every(e => e.available === 2)).toBe(true)
  })
})
