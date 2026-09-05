import { describe, it, expect } from 'vitest'
import { buildFeedbackPdf, feedbackPdfFilename, toPdfSafe } from './feedbackPdf'
import { buildClassEvidence, buildStudentEvidence } from './feedbackEvidence'
import { toWwwEbi, toWwwEbiSheets, MAX_WWW, MAX_EBI_TOPICS, MAX_PRACTICE, MAX_CHALLENGE } from './wwwEbi'
import type { PaperConfig } from '../demoPapers'
import type { WwwEbiSheet } from './wwwEbi'
import { PAPERS } from '../demoPapers/index'
import { buildGridSvg } from '../questions/gridSvg'

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
  it('gives each student their own page — these are handed out individually', async () => {
    const sheets = toWwwEbiSheets(buildClassEvidence(paper, [
      { studentRef: 'Amira', marks: { '1': 5, '2': 8 } },
      { studentRef: 'Ben',   marks: { '1': 3, '2': 4 } },
      { studentRef: 'Cara',  marks: { '1': 0, '2': 0 } },
    ]))
    expect((await buildFeedbackPdf(sheets, options)).getNumberOfPages()).toBe(3)
  })

  it('produces a valid document for an empty class rather than throwing', async () => {
    // Asking for zero sheets is a UI problem upstream, not an exception here.
    await expect(buildFeedbackPdf([], options)).resolves.toBeDefined()
    expect((await buildFeedbackPdf([], options)).getNumberOfPages()).toBe(1)
  })

  it('renders a perfect paper, whose EBI section is empty', async () => {
    const s = sheetFor({ '1': 5, '2': 8 })
    expect(s.ebi).toEqual([])
    await expect(buildFeedbackPdf([s], options)).resolves.toBeDefined()
  })

  it('renders a blank paper, whose WWW section is empty', async () => {
    const s = sheetFor({ '1': 0, '2': 0 })
    expect(s.www).toEqual([])
    await expect(buildFeedbackPdf([s], options)).resolves.toBeDefined()
  })

  it('renders a part paper, which carries the extra coverage line', async () => {
    const s = sheetFor({ '1': 3 }, 'stu', ['1'])
    expect(s.coverage).not.toBeNull()
    expect((await buildFeedbackPdf([s], options)).getNumberOfPages()).toBe(1)
  })

  it('works with only the paper title supplied', async () => {
    const s = sheetFor({ '1': 3, '2': 4 })
    await expect(buildFeedbackPdf([s], { paperTitle: 'A Paper' })).resolves.toBeDefined()
  })

  // The formatter's caps exist so a sheet fits one page; this is the check that
  // they are set generously enough to be worth having. A worst case at the caps
  // — every section full, with practice questions as long as the real papers'
  // wordiest — must still be one sheet of paper per student.
  it('keeps a worst case at the formatter caps on a single page', async () => {
    const worstCase: WwwEbiSheet = {
      studentRef: 'Wordy',
      score: '9 out of 40 (23%)',
      coverage:
        'Based on 8 of 30 questions (42 of 80 marks). Anything not on those questions was not assessed.',
      www: Array.from({ length: MAX_WWW }, (_, i) => `Good attempt at Topic ${i} (6/10).`),
      ebi: Array.from({ length: MAX_EBI_TOPICS + 1 }, (_, i) => `It looks like you found Topic ${i} difficult, picking up around half of the 10 marks. This would be a good place to revise properly.`),
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
    expect((await buildFeedbackPdf([worstCase], options)).getNumberOfPages()).toBe(1)
  })

  it('flows onto another page rather than dropping content off the bottom', async () => {
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
    expect((await buildFeedbackPdf([enormous], options)).getNumberOfPages()).toBeGreaterThan(1)
  })

  it('starts each student on a fresh page even after one overflowed', async () => {
    const enormous: WwwEbiSheet = {
      studentRef: 'Verbose', score: '1 out of 13 (8%)', coverage: null, www: [], ebi: [],
      practice: Array.from({ length: 10 }, (_, i) => ({
        skill: `Skill ${i}`, question: 'A very long question. '.repeat(40),
      })),
      challenge: [],
    }
    const short = sheetFor({ '1': 5, '2': 8 }, 'Brief')
    const alone = (await buildFeedbackPdf([enormous], options)).getNumberOfPages()
    const together = (await buildFeedbackPdf([enormous, short], options)).getNumberOfPages()
    // Whatever the first student took, the second adds exactly one more page.
    expect(together).toBe(alone + 1)
  })
})

describe('toPdfSafe', () => {
  // jsPDF's built-in fonts are WinAnsi only. An undrawable character does not
  // fail loudly — it renders as a fallback glyph, which is what made a practice
  // question appear in the wrong font on a real sheet.
  it('replaces the MINUS SIGN that broke a real practice question', () => {
    // U+2212, not the ASCII hyphen it resembles.
    expect(toPdfSafe('Solve  3(4e − 2) = 42')).toBe('Solve  3(4e - 2) = 42')
  })

  it('gives every undrawable character in the paper data a readable form', () => {
    expect(toPdfSafe('Work out the value of √81')).toBe('Work out the value of sqrt81')
    expect(toPdfSafe('Simplify fully ⅓p × 9q')).toBe('Simplify fully 1/3p × 9q')
    expect(toPdfSafe('Input → ×3 → +5 → Output')).toBe('Input -> ×3 -> +5 -> Output')
    expect(toPdfSafe('Convert 0.4̇5̇ (recurring)')).toBe('Convert 0.45 (recurring)')
    expect(toPdfSafe('area of a circle, π')).toBe('area of a circle, pi')
    expect(toPdfSafe('x ≥ 4')).toBe('x >= 4')
  })

  it('leaves the maths typography WinAnsi can already draw', () => {
    expect(toPdfSafe('£612 × 3 ÷ 2, 19² and 5³ at 90°, ½')).toBe('£612 × 3 ÷ 2, 19² and 5³ at 90°, ½')
  })

  it('keeps the CP1252 characters whose codepoints exceed 0xFF', () => {
    // The em dash is in every paper subtitle; a naive ">0xFF is unsafe" rule
    // would blank it.
    expect(toPdfSafe('Paper 3 Calculator — November 2024'))
      .toBe('Paper 3 Calculator — November 2024')
    expect(toPdfSafe('and so on…')).toBe('and so on…')
  })

  it('drops anything else rather than drawing a wrong symbol', () => {
    expect(toPdfSafe('a ∮ b')).toBe('a   b')
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

describe('diagrams on a practice question', () => {
  const paper = PAPERS['aqa-8300-1f-nov24']
  /** Zero everywhere, so every retry — including the visual ones — is offered. */
  const zero = Object.fromEntries(paper.questions.map(q => [q.id, 0]))
  /** Full marks EXCEPT the two diagram items, so those reach the capped sheet. */
  const dropped14 = Object.fromEntries(
    paper.questions.map(q => [q.id, q.id === '14a' || q.id === '14b' ? 0 : q.marks]))

  it('lets a visual item have a retry once it brings its own grid', () => {
    // The whole point of the field. These two items are `visual: true` and had
    // no retry at all before, because a question depending on a diagram cannot
    // be reissued as text.
    const withDiagram = Object.entries(paper.retrySet).filter(([, r]) => r.diagram)
    expect(withDiagram.length).toBeGreaterThan(0)
    for (const [id] of withDiagram) {
      expect(paper.questions.find(q => q.id === id)!.visual).toBe(true)
    }
  })

  it('carries the grid through evidence and onto the sheet', () => {
    // Unlike `answer`, this must survive to the student's sheet — it is what
    // they draw on.
    const evidence = buildStudentEvidence(paper, dropped14, 'Ama')
    expect(evidence.practice.some(p => p.diagram)).toBe(true)

    const all = evidence.practice
    const sheet = toWwwEbi(evidence)
    for (const printed of sheet.practice) {
      const source = all.find(p => p.question === printed.question)!
      expect(printed.diagram).toEqual(source.diagram)
    }
  })

  it('prints an EMPTY grid, never the answer', () => {
    // `elements` is the answer. buildGridSvg is called with showCanonical:false
    // so it is not drawn — printing it would hand the student the thing they
    // are meant to work out.
    const grid = paper.retrySet['14a'].diagram!
    expect(grid.elements.length).toBeGreaterThan(0)
    const empty = buildGridSvg(grid, { showCanonical: false })
    const revealed = buildGridSvg(grid, { showCanonical: true })
    expect(empty.length).toBeLessThan(revealed.length)
    // The given shape IS printed — that is the background layer, not the answer.
    expect(empty).toContain('polygon points="1,1 4,1 1,5"')
  })

  it('still builds a document without a DOM, minus the grids', () => {
    // svg2pdf walks a real SVG element, so grids need a browser. Node must
    // still produce the rest of the sheet rather than throwing — that is what
    // keeps this file testable at all.
    expect(typeof document).toBe('undefined')
    const sheets = toWwwEbiSheets(buildClassEvidence(paper, [{ studentRef: 'Ama', marks: dropped14 }]))
    expect(sheets[0].practice.some(p => p.diagram)).toBe(true)
    return expect(buildFeedbackPdf(sheets, options)).resolves.toBeDefined()
  })

  it('is crowded off the sheet by heavier questions', () => {
    // Worth pinning down rather than discovering later. `MAX_PRACTICE` keeps
    // the three questions that cost the most MARKS, and the diagram items here
    // are worth 1 and 2 — so a student who dropped marks elsewhere never sees
    // them, however useful the grid would be. Not wrong, but it means diagram
    // retries pay off least on exactly the low-mark items that need them most.
    const sheet = toWwwEbi(buildStudentEvidence(paper, zero, 'Ama'))
    expect(sheet.practice).toHaveLength(MAX_PRACTICE)
    expect(sheet.practice.some(p => p.diagram)).toBe(false)
  })
})
