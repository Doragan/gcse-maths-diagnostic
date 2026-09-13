import { describe, it, expect } from 'vitest'
import { buildClassEvidence } from './feedbackEvidence'
import { buildClassSummary } from './classSummary'
import type { PaperConfig } from '../demoPapers'

// Driven through buildClassEvidence, like every other test in this pipeline:
// the class view is built FROM the sheets, so testing it against hand-made
// evidence would not prove the two agree — which is the whole point of it.
const paper = {
  id: 'test-paper',
  title: 'Test',
  subtitle: 'Test',
  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
  ],
  questions: [
    { id: '1', label: '1', marks: 2, topic: 'number',  skill: 'Indices',   skillIds: ['indices'], kind: 'mastery', desc: 'powers', visual: false },
    { id: '2', label: '2', marks: 5, topic: 'algebra', skill: 'Equations', skillIds: ['solving_linear_equations'], kind: 'exam', desc: 'solve', visual: false },
    { id: '3', label: '3', marks: 1, topic: 'number',  skill: 'Ratio',     skillIds: ['ratio'], kind: 'mastery', desc: 'share', visual: false },
  ],
  retrySet: {}, challengeQuestions: [], sampleStudents: [], sampleMarks: {},
} as unknown as PaperConfig

/** Four students: 8/8, 5/8, 3/8, 0/8. */
const CLASS = [
  { studentRef: 'Ama',  marks: { '1': 2, '2': 5, '3': 1 } },
  { studentRef: 'Bo',   marks: { '1': 2, '2': 3, '3': 0 } },
  { studentRef: 'Cara', marks: { '1': 1, '2': 2, '3': 0 } },
  { studentRef: 'Dev',  marks: { '1': 0, '2': 0, '3': 0 } },
]
const summaryOf = (entries = CLASS, selection?: string[]) =>
  buildClassSummary(buildClassEvidence(paper, entries, selection))

describe('the class as a whole', () => {
  it('reports the spread, not just the average', () => {
    const s = summaryOf()
    expect(s.students).toBe(4)
    expect(s.marksAvailable).toBe(8)
    // 8 + 5 + 3 + 0 = 16 across four students.
    expect(s.mean).toBe(4)
    expect(s.meanPercentage).toBe(50)
    expect(s.median).toBe(4)
    expect(s.lowest).toBe(0)
    expect(s.highest).toBe(8)
  })

  it('lists students lowest first, so the spread is visible', () => {
    expect(summaryOf().students_.map(x => x.studentRef)).toEqual(['Dev', 'Cara', 'Bo', 'Ama'])
    expect(summaryOf().students_[0]).toEqual({ studentRef: 'Dev', earned: 0, percentage: 0 })
  })

  it('is empty rather than broken for no students', () => {
    const s = buildClassSummary([])
    expect(s.students).toBe(0)
    expect(s.questions).toEqual([])
    expect(s.meanPercentage).toBe(0)
  })

  it('carries the coverage line only for a part paper', () => {
    expect(summaryOf().coverage).toBeNull()
    expect(summaryOf(CLASS, ['1', '2'])?.coverage?.itemsAssessed).toBe(2)
  })
})

describe('questions to revisit', () => {
  it('ranks by MARKS LOST, not by percentage', () => {
    // Q2 is 5 marks and the class lost 10 of 20 — the lesson worth planning.
    // Q3 is 1 mark and three of four got zero: a worse percentage, a smaller
    // problem. Marks lost, not ratio, is what puts Q2 first.
    const s = summaryOf()
    expect(s.questions[0].itemId).toBe('2')
    expect(s.questions[0].marksLost).toBe(10)
    expect(s.questions.map(q => q.marksLost)).toEqual([10, 3, 3])
  })

  it('breaks a marks-lost tie on the worse proportion', () => {
    // Q1 and Q3 both cost the class 3 marks, but Q3 went far worse (25% vs
    // 63%), so it is the more urgent of the two.
    const s = summaryOf()
    expect(s.questions.map(q => q.itemId)).toEqual(['2', '3', '1'])
    expect(s.questions[1].ratio).toBeLessThan(s.questions[2].ratio)
  })

  it('counts how many got everything and how many got nothing', () => {
    const q3 = summaryOf().questions.find(q => q.itemId === '3')!
    expect(q3.possible).toBe(4)      // 1 mark × 4 students
    expect(q3.earned).toBe(1)
    expect(q3.fullMarks).toBe(1)     // Ama only
    expect(q3.zero).toBe(3)
    expect(q3.ratio).toBeCloseTo(0.25, 2)
  })

  it('carries the skill and description through, so the row is actionable', () => {
    const q = summaryOf().questions[0]
    expect(q.skill).toBe('Equations')
    expect(q.skillIds).toEqual(['solving_linear_equations'])
    expect(q.desc).toBe('solve')
    expect(q.label).toBe('2')
  })
})

describe('topics and skills', () => {
  it('keeps topics in paper order rather than ranking them', () => {
    expect(summaryOf().topics.map(t => t.topicId)).toEqual(['number', 'algebra'])
  })

  it('totals a topic across the class', () => {
    // Number is Q1 (2m) + Q3 (1m) = 3 each, 12 across four students.
    // Earned: (2+1) + (2+0) + (1+0) + (0+0) = 6.
    const number = summaryOf().topics.find(t => t.topicId === 'number')!
    expect(number.possible).toBe(12)
    expect(number.earned).toBe(6)
    expect(number.ratio).toBeCloseTo(0.5, 2)
  })

  it('ranks skills worst first and counts who dropped nothing', () => {
    const s = summaryOf()
    expect(s.skills[0].skillId).toBe('solving_linear_equations')
    expect(s.skills[0].marksLost).toBe(10)
    // Only Ama got full marks on every equations item.
    expect(s.skills[0].fullMarks).toBe(1)
  })
})

describe('it cannot disagree with the sheets', () => {
  // The reason this is built from StudentEvidence rather than from the marks:
  // both sides being right separately is weaker than them being the same sum.
  it('totals exactly what the individual sheets total', () => {
    const evidences = buildClassEvidence(paper, CLASS)
    const s = buildClassSummary(evidences)
    const fromSheets = evidences.reduce((a, e) => a + e.earned, 0)
    expect(s.mean * s.students).toBe(fromSheets)
    expect(s.questions.reduce((a, q) => a + q.earned, 0)).toBe(fromSheets)
  })

  it('gives every topic the same total the sheets do', () => {
    const evidences = buildClassEvidence(paper, CLASS)
    const s = buildClassSummary(evidences)
    for (const t of s.topics) {
      const fromSheets = evidences.reduce(
        (a, e) => a + (e.topics.find(x => x.topicId === t.topicId)?.earned ?? 0), 0)
      expect(t.earned).toBe(fromSheets)
    }
  })

  it('respects a part-paper selection in every total', () => {
    const s = summaryOf(CLASS, ['1'])
    expect(s.marksAvailable).toBe(2)
    expect(s.questions).toHaveLength(1)
    expect(s.questions[0].possible).toBe(8)   // 2 marks × 4 students
  })
})
