import { describe, it, expect } from 'vitest'
import { buildStudentEvidence, buildClassEvidence } from './feedbackEvidence'
import { toWwwEbi, toWwwEbiSheets, MAX_WWW, MAX_EBI, MAX_PRACTICE } from './wwwEbi'
import type { PaperConfig } from '../demoPapers'

// Driven through buildStudentEvidence rather than hand-built evidence objects:
// the pair has to work together, and a formatter tested against a fixture the
// generator would never produce proves nothing.
//
// Four topics so the bands (strong / middling / weak) can all appear at once.
const paper = {
  id: 'test-paper',
  title: 'Test',
  subtitle: 'Test',
  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
    { id: 'ratio', label: 'Ratio and Proportion' },
    { id: 'stats', label: 'Statistics' },
  ],
  questions: [
    { id: '1', label: '1', marks: 5, topic: 'number',  skill: 'Indices',   skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
    { id: '2', label: '2', marks: 8, topic: 'algebra', skill: 'Equations', skillIds: ['solving_linear_equations'], kind: 'exam', desc: '', visual: false },
    { id: '3', label: '3', marks: 4, topic: 'ratio',   skill: 'Ratio',     skillIds: ['ratio'], kind: 'mastery', desc: '', visual: false },
    { id: '4', label: '4', marks: 3, topic: 'stats',   skill: 'Median',    skillIds: ['median'], kind: 'mastery', desc: '', visual: false },
  ],
  retrySet: {
    '1': { skill: 'Indices',   question: 'Work out 4 squared' },
    '2': { skill: 'Equations', question: 'Solve 3x + 1 = 10' },
    '3': { skill: 'Ratio',     question: 'Share 20 in the ratio 2:3' },
    '4': { skill: 'Median',    question: 'Find the median of 3, 7, 4' },
  },
  challengeQuestions: [
    { topic: 'number', skill: 'Standard Form', question: 'Write 0.00047 in standard form.' },
    { topic: 'ratio',  skill: 'Reverse Percentages', question: 'A laptop costs £612 after 15% off.' },
  ],
  sampleStudents: [],
  sampleMarks: {},
} as unknown as PaperConfig

const sheetFor = (marks: Record<string, number>, selection?: string[]) =>
  toWwwEbi(buildStudentEvidence(paper, marks, 'stu', selection))

describe('score and coverage', () => {
  it('states the score against the whole paper', () => {
    // 5 + 6 + 4 + 2 = 17 of 20.
    expect(sheetFor({ '1': 5, '2': 6, '3': 4, '4': 2 }).score).toBe('17 out of 20 (85%)')
  })

  it('omits the coverage line on a full paper', () => {
    expect(sheetFor({ '1': 5, '2': 8, '3': 4, '4': 3 }).coverage).toBeNull()
  })

  it('states what was NOT assessed on a part paper', () => {
    // Silence about the unset questions reads as "no problem there".
    const s = sheetFor({ '1': 5, '2': 4 }, ['1', '2'])
    expect(s.score).toBe('9 out of 13 (69%)')
    expect(s.coverage).toBe(
      'Based on 2 of 4 questions (13 of 20 marks). Anything not on those questions was not assessed.',
    )
  })
})

describe('what went well', () => {
  it('calls a topic at or above the strong bar strong, best first', () => {
    // Number 5/5, Ratio 4/4 — both perfect, Ratio carries fewer marks.
    const s = sheetFor({ '1': 5, '2': 0, '3': 4, '4': 0 })
    expect(s.www[0]).toBe('Strong work on Number (5/5).')
    expect(s.www[1]).toBe('Strong work on Ratio and Proportion (4/4).')
  })

  it('puts a middling topic in WWW rather than EBI', () => {
    // Algebra 6/8 = 0.75: below strong, above the revise bar. A student on 6 of
    // 8 has done something well and must not be told only what went wrong.
    const s = sheetFor({ '1': 0, '2': 6, '3': 0, '4': 0 })
    expect(s.www).toContain('Good attempt at Algebra (6/8).')
    expect(s.ebi.some(l => l.startsWith('Revise Algebra'))).toBe(false)
  })

  it('uses fullMarks for the one sentence that really is "dropped nothing"', () => {
    const s = sheetFor({ '1': 5, '2': 8, '3': 4, '4': 3 })
    expect(s.www.some(l => l.startsWith('Full marks on every question testing'))).toBe(true)
  })

  // Regression: the full-marks line used to be appended and then truncated by
  // the cap, so on a PERFECT paper — where every topic is strong and fills the
  // cap — the best sentence on the sheet fell off the end.
  it('keeps the full-marks line even when every topic is strong', () => {
    const s = sheetFor({ '1': 5, '2': 8, '3': 4, '4': 3 })
    expect(s.www.length).toBe(MAX_WWW)
    expect(s.www[s.www.length - 1]).toMatch(/^Full marks on every question testing/)
  })

  it('names the highest-mark skills in the full-marks line, capped', () => {
    const s = sheetFor({ '1': 5, '2': 8, '3': 4, '4': 3 })
    // Algebra (8) then Number (5) then Ratio (4); Median (3) is cut.
    expect(s.www[s.www.length - 1]).toBe(
      'Full marks on every question testing Solving Linear Equations, Indices and Ratio.',
    )
  })

  it('names the best topic when nothing clears either bar', () => {
    // 1/5, 1/8, 1/4, 1/3 — all weak, but the sheet must not be all criticism.
    const s = sheetFor({ '1': 1, '2': 1, '3': 1, '4': 1 })
    expect(s.www).toEqual(['Best work was on Statistics (1/3).'])
  })

  it('invents nothing when the student scored nothing', () => {
    // A sheet that congratulates a blank paper is worse than one that says
    // nothing. The empty list is the signal.
    expect(sheetFor({ '1': 0, '2': 0, '3': 0, '4': 0 }).www).toEqual([])
  })

  it('caps the number of lines', () => {
    expect(sheetFor({ '1': 5, '2': 8, '3': 4, '4': 3 }).www.length).toBeLessThanOrEqual(MAX_WWW)
  })
})

describe('even better if', () => {
  it('names a weak topic with its marks, worst first', () => {
    // Algebra 1/8 = 0.125, Statistics 1/3 = 0.33.
    const s = sheetFor({ '1': 5, '2': 1, '3': 4, '4': 1 })
    expect(s.ebi[0]).toBe('Revise Algebra (1/8).')
    expect(s.ebi).toContain('Revise Statistics (1/3).')
  })

  it('adds skill-level actions for what to practise', () => {
    const s = sheetFor({ '1': 5, '2': 1, '3': 4, '4': 3 })
    expect(s.ebi).toContain('Practise Solving Linear Equations (1/8).')
  })

  it('does not nag about a skill that only just dropped a mark', () => {
    // Algebra 7/8 = 0.875 — above the strong bar, so no "practise" line even
    // though a mark was lost. Nagging about 7 of 8 buries what matters.
    const s = sheetFor({ '1': 5, '2': 7, '3': 4, '4': 3 })
    expect(s.ebi.some(l => l.includes('Solving Linear Equations'))).toBe(false)
  })

  it('is empty on a perfect paper', () => {
    expect(sheetFor({ '1': 5, '2': 8, '3': 4, '4': 3 }).ebi).toEqual([])
  })

  it('caps the number of lines', () => {
    expect(sheetFor({ '1': 0, '2': 0, '3': 0, '4': 0 }).ebi.length).toBeLessThanOrEqual(MAX_EBI)
  })
})

describe('never claims mastery', () => {
  // The vocabulary rule, enforced rather than trusted: one sitting cannot say a
  // skill is held, so no sentence on the sheet may imply it.
  const forbidden = /\b(secure|mastered|mastery|has mastered|proficient)\b/i

  it('uses no mastery vocabulary in any line, at any score', () => {
    for (const marks of [
      { '1': 5, '2': 8, '3': 4, '4': 3 },
      { '1': 3, '2': 4, '3': 2, '4': 1 },
      { '1': 0, '2': 0, '3': 0, '4': 0 },
    ]) {
      const s = sheetFor(marks)
      for (const line of [...s.www, ...s.ebi, s.score, s.coverage ?? '']) {
        expect(line).not.toMatch(forbidden)
      }
    }
  })
})

describe('practice and challenge', () => {
  it('offers practice questions worst first, capped', () => {
    const s = sheetFor({ '1': 0, '2': 0, '3': 0, '4': 0 })
    expect(s.practice.length).toBeLessThanOrEqual(MAX_PRACTICE)
    // Algebra is the 8-mark question, so it is the biggest loss.
    expect(s.practice[0].skill).toBe('Equations')
  })

  it('offers challenges to a student doing well overall, on their strong topics', () => {
    // 19/20 = 95% overall; Number 5/5 and Ratio 4/4 both strong.
    const s = sheetFor({ '1': 5, '2': 7, '3': 4, '4': 3 })
    expect(s.challenge.map(c => c.skill)).toEqual(['Standard Form', 'Reverse Percentages'])
  })

  // The regression this guards: judged on topics alone, a struggling student
  // who happened to take one small section cleanly was handed extension work.
  it('withholds challenges from a struggling student who aced one topic', () => {
    // 5/20 = 25% overall, but Number is 5/5.
    const s = sheetFor({ '1': 5, '2': 0, '3': 0, '4': 0 })
    expect(s.www.some(l => l.startsWith('Strong work on Number'))).toBe(true)
    expect(s.challenge).toEqual([])
  })

  it('offers no challenge when nothing is strong', () => {
    expect(sheetFor({ '1': 1, '2': 1, '3': 1, '4': 1 }).challenge).toEqual([])
  })

  it('still requires a strong TOPIC, not just a strong paper', () => {
    // 17/20 = 85% overall, but spread evenly — no topic reaches the bar and
    // the paper has no challenge question for Algebra anyway.
    const s = sheetFor({ '1': 4, '2': 7, '3': 3, '4': 3 })
    expect(s.challenge.map(c => c.skill)).not.toContain('Reverse Percentages')
  })
})

describe('marks are written the same way everywhere', () => {
  // The sheet mixed "(6/8)" with "— 6/13 marks", which on paper reads as two
  // different things being measured.
  it('uses (earned/available) on every line and never "n/m marks"', () => {
    for (const marks of [
      { '1': 5, '2': 8, '3': 4, '4': 3 },
      { '1': 4, '2': 5, '3': 2, '4': 1 },
      { '1': 0, '2': 1, '3': 0, '4': 0 },
    ]) {
      const s = sheetFor(marks)
      for (const line of [...s.www, ...s.ebi]) {
        expect(line).not.toMatch(/\d+\/\d+\s*marks/)
        if (/\d+\/\d+/.test(line)) expect(line).toMatch(/\(\d+\/\d+\)\.$/)
      }
    }
  })
})

describe('sheets for a class', () => {
  it('formats every student and keeps their ref', () => {
    const sheets = toWwwEbiSheets(buildClassEvidence(paper, [
      { studentRef: 'a', marks: { '1': 5, '2': 8, '3': 4, '4': 3 } },
      { studentRef: 'b', marks: { '1': 0, '2': 0, '3': 0, '4': 0 } },
    ]))
    expect(sheets.map(s => s.studentRef)).toEqual(['a', 'b'])
    expect(sheets[0].ebi).toEqual([])
    expect(sheets[1].www).toEqual([])
  })

  it('is deterministic', () => {
    const marks = { '1': 4, '2': 5, '3': 2, '4': 3 }
    expect(sheetFor(marks)).toEqual(sheetFor(marks))
  })
})
