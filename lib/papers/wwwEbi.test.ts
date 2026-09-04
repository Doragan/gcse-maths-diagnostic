import { describe, it, expect } from 'vitest'
import { buildStudentEvidence, buildClassEvidence } from './feedbackEvidence'
import {
  toWwwEbi, toWwwEbiSheets,
  MAX_WWW, MAX_EBI_TOPICS, MAX_PRACTICE, NEAR_MISS_RATIO, STRUGGLING_RATIO,
} from './wwwEbi'
import {
  STRONG_PHRASES, NEAR_MISS_PHRASES, PARTIAL_PHRASES, STRUGGLING_PHRASES,
  BEST_EFFORT_PHRASES, FOCUS_PHRASES, phraseVars,
  type Phrase,
} from './wwwEbiPhrases'
import type { PaperConfig } from '../demoPapers'

// Driven through buildStudentEvidence rather than hand-built evidence objects:
// the pair has to work together, and a formatter tested against a fixture the
// generator would never produce proves nothing.
//
// Four topics so every band can appear at once.
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

const sheetFor = (marks: Record<string, number>, ref = 'stu', selection?: string[]) =>
  toWwwEbi(buildStudentEvidence(paper, marks, ref, selection))

/**
 * Assert a line came from a particular bank, without pinning its wording.
 *
 * The sentences in wwwEbiPhrases.ts are COPY and are meant to be rewritten. A
 * test that hard-codes them would fail on every edit and teach the next person
 * to change the test rather than think. What must not silently change is which
 * BAND a set of marks routes to.
 */
const cameFrom = (bank: Phrase[], line: string, topic: string, earned: number, available: number) =>
  bank.some(p => p(phraseVars(topic, earned, available)) === line)

describe('score and coverage', () => {
  it('states the score against the whole paper', () => {
    expect(sheetFor({ '1': 5, '2': 6, '3': 4, '4': 2 }).score).toBe('17 out of 20 (85%)')
  })

  it('omits the coverage line on a full paper', () => {
    expect(sheetFor({ '1': 5, '2': 8, '3': 4, '4': 3 }).coverage).toBeNull()
  })

  it('states what was NOT assessed on a part paper', () => {
    const s = sheetFor({ '1': 5, '2': 4 }, 'stu', ['1', '2'])
    expect(s.score).toBe('9 out of 13 (69%)')
    expect(s.coverage).toBe(
      'Based on 2 of 4 questions (13 of 20 marks). Anything not on those questions was not assessed.',
    )
  })
})

describe('what went well', () => {
  it('praises a topic at or above the strong bar, best first', () => {
    const s = sheetFor({ '1': 5, '2': 0, '3': 4, '4': 0 })
    // Number 5/5 and Ratio 4/4 are both perfect; Number carries more marks.
    expect(cameFrom(STRONG_PHRASES, s.www[0], 'Number', 5, 5)).toBe(true)
    expect(cameFrom(STRONG_PHRASES, s.www[1], 'Ratio and Proportion', 4, 4)).toBe(true)
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

  it('acknowledges the best topic when none reached the bar', () => {
    // 1/5, 1/8, 1/4, 1/3 — all weak. Statistics is relatively the best.
    const s = sheetFor({ '1': 1, '2': 1, '3': 1, '4': 1 })
    expect(s.www).toHaveLength(1)
    expect(cameFrom(BEST_EFFORT_PHRASES, s.www[0], 'Statistics', 1, 3)).toBe(true)
  })

  it('invents nothing when the student scored nothing', () => {
    // A sheet that congratulates a blank paper is worse than one that says
    // nothing. The empty list is the signal.
    expect(sheetFor({ '1': 0, '2': 0, '3': 0, '4': 0 }).www).toEqual([])
  })
})

describe('even better if — the band decides the tone', () => {
  it('gives a near miss a sentence that praises and instructs at once', () => {
    // Algebra 6/8 = 0.75. A student at three-quarters has done something well
    // and must not be told only what went wrong — so this band carries its own
    // praise rather than being filed under "what went well" and left silent.
    const s = sheetFor({ '1': 5, '2': 6, '3': 4, '4': 3 })
    const algebra = s.ebi.find(l => l.includes('Algebra'))!
    expect(cameFrom(NEAR_MISS_PHRASES, algebra, 'Algebra', 6, 8)).toBe(true)
    expect(0.75).toBeGreaterThanOrEqual(NEAR_MISS_RATIO)
  })

  it('gives a half-marks topic the revision sentence', () => {
    // Algebra 4/8 = 0.5.
    const s = sheetFor({ '1': 5, '2': 4, '3': 4, '4': 3 })
    const algebra = s.ebi.find(l => l.includes('Algebra'))!
    expect(cameFrom(PARTIAL_PHRASES, algebra, 'Algebra', 4, 8)).toBe(true)
  })

  it('gives a badly missed topic the strongest sentence', () => {
    // Algebra 1/8 = 0.125.
    const s = sheetFor({ '1': 5, '2': 1, '3': 4, '4': 3 })
    const algebra = s.ebi.find(l => l.includes('Algebra'))!
    expect(cameFrom(STRUGGLING_PHRASES, algebra, 'Algebra', 1, 8)).toBe(true)
    expect(0.125).toBeLessThan(STRUGGLING_RATIO)
  })

  it('orders topics worst first', () => {
    // Algebra 1/8 = 0.125, Statistics 1/3 = 0.33, Ratio 3/4 = 0.75.
    const s = sheetFor({ '1': 5, '2': 1, '3': 3, '4': 1 })
    const order = ['Algebra', 'Statistics', 'Ratio'].map(t => s.ebi.findIndex(l => l.includes(t)))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('is empty on a perfect paper', () => {
    expect(sheetFor({ '1': 5, '2': 8, '3': 4, '4': 3 }).ebi).toEqual([])
  })
})

describe('the topic sentence and the skill list do not duplicate', () => {
  // The defect this replaced: "Revise Algebra" followed by "Practise Solving
  // Linear Equations" is one instruction written twice.
  it('names specific skills once, in a single closing line', () => {
    const s = sheetFor({ '1': 5, '2': 1, '3': 4, '4': 1 })
    const focus = s.ebi.filter(l =>
      FOCUS_PHRASES.some(p => l === p('Solving Linear Equations and Median')))
    expect(focus).toHaveLength(1)
    expect(s.ebi[s.ebi.length - 1]).toBe(focus[0])
  })

  it('emits no per-skill line of its own', () => {
    const s = sheetFor({ '1': 5, '2': 1, '3': 4, '4': 1 })
    expect(s.ebi.filter(l => l.startsWith('Practise '))).toEqual([])
  })

  it('leaves out a skill that only just dropped a mark', () => {
    // Algebra 7/8 = 0.875 — above the strong bar, so not worth naming.
    const s = sheetFor({ '1': 5, '2': 7, '3': 4, '4': 3 })
    expect(s.ebi.some(l => l.includes('Solving Linear Equations'))).toBe(false)
  })

  it('caps the topic sentences', () => {
    const s = sheetFor({ '1': 0, '2': 0, '3': 0, '4': 0 })
    // At most the cap, plus the one focus line.
    expect(s.ebi.length).toBeLessThanOrEqual(MAX_EBI_TOPICS + 1)
  })
})

describe('the sheets do not read as generated', () => {
  it('varies the wording between students given identical marks', () => {
    const marks = { '1': 5, '2': 4, '3': 2, '4': 1 }
    const refs = ['Amira', 'Ben', 'Charlotte', 'Daniel', 'Emily', 'Finn']
    const firstLines = new Set(refs.map(r => sheetFor(marks, r).ebi[0]))
    // Not all identical — the whole point of the bank.
    expect(firstLines.size).toBeGreaterThan(1)
  })

  it('uses a different template for each line of one sheet', () => {
    const s = sheetFor({ '1': 1, '2': 1, '3': 1, '4': 1 }, 'Amira')
    const topicLines = s.ebi.slice(0, MAX_EBI_TOPICS)
    // Strip the topic-specific words and compare shapes: no two lines of one
    // sheet should be the same sentence with a different noun in it.
    const shapes = topicLines.map(l => l.replace(/Number|Algebra|Ratio and Proportion|Statistics/g, 'T'))
    expect(new Set(shapes).size).toBe(shapes.length)
  })

  it('gives the same student the same words every time', () => {
    // A teacher who regenerates after fixing one mark must not be handed
    // different feedback for everyone else.
    const marks = { '1': 4, '2': 5, '3': 2, '4': 3 }
    expect(sheetFor(marks, 'Amira')).toEqual(sheetFor(marks, 'Amira'))
  })
})

describe('never claims mastery', () => {
  // The vocabulary rule, enforced rather than trusted: one sitting cannot say a
  // skill is held, so no sentence on the sheet may imply it.
  const forbidden = /\b(secure|mastered|mastery|proficient)\b/i

  it('uses no mastery vocabulary in any line, at any score', () => {
    for (const marks of [
      { '1': 5, '2': 8, '3': 4, '4': 3 },
      { '1': 3, '2': 4, '3': 2, '4': 1 },
      { '1': 5, '2': 6, '3': 3, '4': 2 },
      { '1': 0, '2': 0, '3': 0, '4': 0 },
    ]) {
      for (const ref of ['Amira', 'Ben', 'Charlotte', 'Daniel', 'Emily']) {
        const s = sheetFor(marks, ref)
        for (const l of [...s.www, ...s.ebi, s.score, s.coverage ?? '']) {
          expect(l).not.toMatch(forbidden)
        }
      }
    }
  })

  it('writes every sentence as a complete one, ending in a full stop', () => {
    for (const marks of [
      { '1': 5, '2': 8, '3': 4, '4': 3 },
      { '1': 2, '2': 4, '3': 1, '4': 2 },
      { '1': 1, '2': 0, '3': 0, '4': 0 },
    ]) {
      const s = sheetFor(marks, 'Amira')
      for (const l of [...s.www, ...s.ebi]) expect(l).toMatch(/\.$/)
    }
  })
})

describe('practice and challenge', () => {
  it('offers practice questions worst first, capped', () => {
    const s = sheetFor({ '1': 0, '2': 0, '3': 0, '4': 0 })
    expect(s.practice.length).toBeLessThanOrEqual(MAX_PRACTICE)
    expect(s.practice[0].skill).toBe('Equations')
  })

  it('offers challenges to a student doing well overall, on their strong topics', () => {
    const s = sheetFor({ '1': 5, '2': 7, '3': 4, '4': 3 })
    expect(s.challenge.map(c => c.skill)).toEqual(['Standard Form', 'Reverse Percentages'])
  })

  // The regression this guards: judged on topics alone, a struggling student
  // who happened to take one small section cleanly was handed extension work.
  it('withholds challenges from a struggling student who aced one topic', () => {
    const s = sheetFor({ '1': 5, '2': 0, '3': 0, '4': 0 })
    expect(s.www.length).toBeGreaterThan(0)
    expect(s.challenge).toEqual([])
  })

  it('offers no challenge when nothing is strong', () => {
    expect(sheetFor({ '1': 1, '2': 1, '3': 1, '4': 1 }).challenge).toEqual([])
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
})

describe('a topic too small to talk about', () => {
  // On a part paper a topic can carry a single mark. "Algebra is clearly a
  // strength, with the mark" is a claim one mark cannot support, and it
  // appeared on a real sheet.
  const thin = {
    ...paper,
    topics: [
      { id: 'number', label: 'Number' },
      { id: 'algebra', label: 'Algebra' },
    ],
    questions: [
      { id: 'a', label: 'a', marks: 6, topic: 'number',  skill: 'Indices',   skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
      { id: 'b', label: 'b', marks: 1, topic: 'algebra', skill: 'Equations', skillIds: ['solving_linear_equations'], kind: 'mastery', desc: '', visual: false },
    ],
  } as unknown as PaperConfig

  it('says nothing about a one-mark topic', () => {
    const s = toWwwEbi(buildStudentEvidence(thin, { a: 6, b: 1 }, 'stu'))
    expect(s.www.some(l => l.includes('Algebra'))).toBe(false)
    // Its marks still count, and the full-marks line can still name the skill.
    expect(s.score).toBe('7 out of 7 (100%)')
  })

  it('never writes "all 1 marks"', () => {
    const s = toWwwEbi(buildStudentEvidence(thin, { a: 6, b: 1 }, 'stu'))
    for (const l of [...s.www, ...s.ebi]) expect(l).not.toMatch(/\ball 1 marks\b/)
  })

  it('still speaks when EVERY topic is too small, rather than going silent', () => {
    const tiny = {
      ...thin,
      questions: [
        { id: 'a', label: 'a', marks: 1, topic: 'number',  skill: 'Indices',   skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
        { id: 'b', label: 'b', marks: 1, topic: 'algebra', skill: 'Equations', skillIds: ['solving_linear_equations'], kind: 'mastery', desc: '', visual: false },
      ],
    } as unknown as PaperConfig
    const s = toWwwEbi(buildStudentEvidence(tiny, { a: 1, b: 0 }, 'stu'))
    expect(s.www.length + s.ebi.length).toBeGreaterThan(0)
  })
})
