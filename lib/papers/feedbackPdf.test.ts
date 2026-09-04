import { describe, it, expect } from 'vitest'
import { buildFeedbackPdf, feedbackPdfFilename } from './feedbackPdf'
import { buildClassEvidence, buildStudentEvidence } from './feedbackEvidence'
import { toWwwEbi, toWwwEbiSheets, MAX_WWW, MAX_EBI, MAX_PRACTICE, MAX_CHALLENGE } from './wwwEbi'
import type { PaperConfig } from '../demoPapers'
import type { WwwEbiSheet } from './wwwEbi'

const options = {
  paperTitle: 'AQA GCSE Mathematics 8300/3F',
  paperSubtitle: 'Foundation Tier Paper 3 Calculator — November 2024',
  className: '11B/Ma1',
  satOn: '12 November 2026',
}

const paper = {
  id: 'test-paper',
  title: 'Test',
  subtitle: 'Test',
  topics: [
    { id: 'number', label: 'Number' },
    { id: 'algebra', label: 'Algebra' },
  ],
  questions: [
    { id: '1', label: '1', marks: 5, topic: 'number',  skill: 'Indices',   skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
    { id: '2', label: '2', marks: 8, topic: 'algebra', skill: 'Equations', skillIds: ['solving_linear_equations'], kind: 'exam', desc: '', visual: false },
  ],
  retrySet: {
    '1': { skill: 'Indices',   question: 'Work out 4 squared' },
    '2': { skill: 'Equations', question: 'Solve 3x + 1 = 10' },
  },
  challengeQuestions: [
    { topic: 'number', skill: 'Standard Form', question: 'Write 0.00047 in standard form.' },
  ],
  sampleStudents: [],
  sampleMarks: {},
} as unknown as PaperConfig

const sheetFor = (marks: Record<string, number>, ref = 'stu', selection?: string[]) =>
  toWwwEbi(buildStudentEvidence(paper, marks, ref, selection))

describe('buildFeedbackPdf', () => {
  it('gives each student their own page — these are handed out individually', () => {
    const sheets = toWwwEbiSheets(buildClassEvidence(paper, [
      { studentRef: 'Amira', marks: { '1': 5, '2': 8 } },
      { studentRef: 'Ben',   marks: { '1': 3, '2': 4 } },
      { studentRef: 'Cara',  marks: { '1': 0, '2': 0 } },
    ]))
    expect(buildFeedbackPdf(sheets, options).getNumberOfPages()).toBe(3)
  })

  it('produces a valid document for an empty class rather than throwing', () => {
    // Asking for zero sheets is a UI problem upstream, not an exception here.
    expect(() => buildFeedbackPdf([], options)).not.toThrow()
    expect(buildFeedbackPdf([], options).getNumberOfPages()).toBe(1)
  })

  it('renders a perfect paper, whose EBI section is empty', () => {
    const s = sheetFor({ '1': 5, '2': 8 })
    expect(s.ebi).toEqual([])
    expect(() => buildFeedbackPdf([s], options)).not.toThrow()
  })

  it('renders a blank paper, whose WWW section is empty', () => {
    const s = sheetFor({ '1': 0, '2': 0 })
    expect(s.www).toEqual([])
    expect(() => buildFeedbackPdf([s], options)).not.toThrow()
  })

  it('renders a part paper, which carries the extra coverage line', () => {
    const s = sheetFor({ '1': 3 }, 'stu', ['1'])
    expect(s.coverage).not.toBeNull()
    expect(buildFeedbackPdf([s], options).getNumberOfPages()).toBe(1)
  })

  it('works with only the paper title supplied', () => {
    const s = sheetFor({ '1': 3, '2': 4 })
    expect(() => buildFeedbackPdf([s], { paperTitle: 'A Paper' })).not.toThrow()
  })

  // The formatter's caps exist so a sheet fits one page; this is the check that
  // they are set generously enough to be worth having. A worst case at the caps
  // — every section full, with practice questions as long as the real papers'
  // wordiest — must still be one sheet of paper per student.
  it('keeps a worst case at the formatter caps on a single page', () => {
    const worstCase: WwwEbiSheet = {
      studentRef: 'Wordy',
      score: '9 out of 40 (23%)',
      coverage:
        'Based on 8 of 30 questions (42 of 80 marks). Anything not on those questions was not assessed.',
      www: Array.from({ length: MAX_WWW }, (_, i) => `Good attempt at Topic ${i} (6/10).`),
      ebi: Array.from({ length: MAX_EBI }, (_, i) => `Revise Topic ${i} — 2/10 marks.`),
      practice: Array.from({ length: MAX_PRACTICE }, (_, i) => ({
        skill: `Skill ${i}`,
        // Longer than any question in lib/demoPapers.
        question: 'A shelf holds 8 books each 25 mm thick and 2 bookends each 18 mm thick. '.repeat(2),
      })),
      challenge: Array.from({ length: MAX_CHALLENGE }, (_, i) => ({
        skill: `Challenge ${i}`,
        question: 'A laptop costs £612 after a 15% discount. What was the original price?',
      })),
    }
    expect(buildFeedbackPdf([worstCase], options).getNumberOfPages()).toBe(1)
  })

  it('flows onto another page rather than dropping content off the bottom', () => {
    // Beyond any cap — a formatter that ever emits this much must still get
    // every line onto paper, not silently lose the tail.
    const enormous: WwwEbiSheet = {
      studentRef: 'Verbose',
      score: '1 out of 13 (8%)',
      coverage: null,
      www: [],
      ebi: [],
      practice: Array.from({ length: 10 }, (_, i) => ({
        skill: `Skill ${i}`,
        question: 'A very long question. '.repeat(40),
      })),
      challenge: [],
    }
    expect(buildFeedbackPdf([enormous], options).getNumberOfPages()).toBeGreaterThan(1)
  })

  it('starts each student on a fresh page even after one overflowed', () => {
    const enormous: WwwEbiSheet = {
      studentRef: 'Verbose', score: '1 out of 13 (8%)', coverage: null, www: [], ebi: [],
      practice: Array.from({ length: 10 }, (_, i) => ({
        skill: `Skill ${i}`, question: 'A very long question. '.repeat(40),
      })),
      challenge: [],
    }
    const short = sheetFor({ '1': 5, '2': 8 }, 'Brief')
    const alone = buildFeedbackPdf([enormous], options).getNumberOfPages()
    const together = buildFeedbackPdf([enormous, short], options).getNumberOfPages()
    // Whatever the first student took, the second adds exactly one more page.
    expect(together).toBe(alone + 1)
  })
})

describe('feedbackPdfFilename', () => {
  it('slugifies the paper title', () => {
    expect(feedbackPdfFilename(options))
      .toBe('mathsense-feedback-aqa-gcse-mathematics-8300-3f.pdf')
  })

  it('falls back rather than producing a bare or trailing-dash name', () => {
    expect(feedbackPdfFilename({ paperTitle: '—' })).toBe('mathsense-feedback-paper.pdf')
    expect(feedbackPdfFilename({ paperTitle: 'Paper 1!' })).toBe('mathsense-feedback-paper-1.pdf')
  })
})
