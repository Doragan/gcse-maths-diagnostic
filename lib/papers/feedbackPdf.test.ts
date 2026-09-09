import { describe, it, expect } from 'vitest'
import { buildFeedbackPdf, feedbackPdfFilename, toPdfSafe, toRuns, type Run } from './feedbackPdf'
import { buildClassEvidence, buildStudentEvidence } from './feedbackEvidence'
import { toWwwEbi, toWwwEbiSheets, MAX_WWW, MAX_EBI_TOPICS, MAX_PRACTICE, MAX_CHALLENGE } from './wwwEbi'
import type { PaperConfig } from '../demoPapers'
import type { WwwEbiSheet } from './wwwEbi'
import { PAPERS } from '../demoPapers/index'
import { buildGridSvg } from '../questions/gridSvg'
import { parseInline, plainText } from '../questions/inlineMarkup'

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
        label: String(i + 1),
        parts: [{
          label: String(i + 1),
          skill: `Skill ${i}`,
          // Longer than any question in lib/demoPapers.
          question: 'A shelf holds 8 books each 25 mm thick and 2 bookends each 18 mm thick. '.repeat(2),
          body: 'A shelf holds 8 books each 25 mm thick and 2 bookends each 18 mm thick. '.repeat(2),
        }],
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
        label: String(i + 1),
        parts: [{ label: String(i + 1), skill: `Skill ${i}`, question: 'A very long question. '.repeat(40), body: 'A very long question. '.repeat(40) }],
      })),
      challenge: [],
    }
    expect((await buildFeedbackPdf([enormous], options)).getNumberOfPages()).toBeGreaterThan(1)
  })

  it('starts each student on a fresh page even after one overflowed', async () => {
    const enormous: WwwEbiSheet = {
      studentRef: 'Verbose', score: '1 out of 13 (8%)', coverage: null, www: [], ebi: [],
      practice: Array.from({ length: 10 }, (_, i) => ({
        label: String(i + 1),
        parts: [{ label: String(i + 1), skill: `Skill ${i}`, question: 'A very long question. '.repeat(40), body: 'A very long question. '.repeat(40) }],
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

  it('drops the recurring-decimal dot, which the words already carry', () => {
    expect(toPdfSafe('Convert 0.4̇5̇ (recurring)')).toBe('Convert 0.45 (recurring)')
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
    // The whole point of the field: a `visual: true` item had no retry at all
    // before, because a question depending on a diagram cannot be reissued as
    // text. So EVERY visual item with a retry must carry one.
    //
    // The converse is NOT asserted, and used to be. A figure is not only for
    // visual items — a function machine, a Venn, a circle theorem all read off
    // a picture while the answer is written on a line, and this paper's 20(a)
    // to (c) are exactly that.
    const visualRetries = paper.questions.filter(q => q.visual && paper.retrySet[q.id])
    expect(visualRetries.length).toBeGreaterThan(0)
    for (const q of visualRetries) expect(paper.retrySet[q.id].diagram).toBeDefined()
  })

  it('carries the grid through evidence and onto the sheet', () => {
    // Unlike `answer`, this must survive to the student's sheet — it is what
    // they draw on.
    const evidence = buildStudentEvidence(paper, dropped14, 'Ama')
    expect(evidence.practice.some(p => p.diagram)).toBe(true)

    const sheet = toWwwEbi(evidence)
    for (const printed of sheet.practice.flatMap(g => g.parts)) {
      const source = evidence.practice.find(p => p.question === printed.question)!
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
    expect(sheets[0].practice.flatMap(g => g.parts).some(p => p.diagram)).toBe(true)
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
    expect(sheet.practice.flatMap(g => g.parts).some(p => p.diagram)).toBe(false)
  })
})

describe('notation', () => {
  // WHAT CHANGED AND WHY. This used to be a list of surrenders: π printed as
  // the word "pi", √ as "sqrt", ⅓ as "1/3", and any exponent past ³ as "^4",
  // because jsPDF's built-in fonts are WinAnsi and WinAnsi has none of them.
  // Two things fixed that without embedding a font. Exponents and fractions
  // are DRAWN — raised, or stacked over a rule. π and √ come from /Symbol,
  // which is one of the standard 14 and so costs nothing to use.
  const flat = (runs: Run[]): string =>
    runs.map(r => r.kind === 'frac' ? `[${flat(r.num)}/${flat(r.den)}]`
      : r.kind === 'vec' ? `(${r.rows.map(flat).join('|')})`
      : r.kind === 'paren' ? `{${flat(r.body)}}`
        : r.kind === 'sup' ? `^${r.text}`
          : r.kind === 'sub' ? `_${r.text}`
            : r.text).join('')

  /**
   * The characters that actually reach the page, with none of flat's markers.
   *
   * flat() is for reading an assertion; this is for the silent-loss guard, and
   * the difference matters — flat's brackets and slashes are indistinguishable
   * from a tick box's "[   ]" or an ordinary "3/4", so stripping them reported
   * both as lost content.
   */
  const drawnChars = (runs: Run[]): string =>
    // The punctuation here stands for what is DRAWN as shape rather than as a
    // glyph — a fraction's rule, a vector's brackets and the gap between its
    // rows — so this lines up with plainText and none of them reads as lost.
    runs.map(r => r.kind === 'frac' ? `${drawnChars(r.num)}/${drawnChars(r.den)}`
      : r.kind === 'vec' ? `(${r.rows.map(drawnChars).join(', ')})`
        : r.kind === 'paren' ? `(${drawnChars(r.body)})` : r.text).join('')

  it('splits an exponent into its own raised run', () => {
    expect(toRuns('10⁻⁴')).toEqual([
      { kind: 'text', text: '10' },
      { kind: 'sup', text: '-4' },
    ])
  })

  it('returns to the baseline after one', () => {
    expect(flat(toRuns('50 × 60 × 10⁴. Give your answer')))
      .toBe('50 × 60 × 10^4. Give your answer')
  })

  it('raises the ones CP1252 can draw too, so a page has one style', () => {
    // ² is drawable inline, but leaving it there while ⁴ is raised would put
    // two sizes of exponent on one sheet.
    expect(toRuns('x²')).toEqual([{ kind: 'text', text: 'x' }, { kind: 'sup', text: '2' }])
  })

  it('still sanitises the plain runs', () => {
    expect(toRuns('3(4e − 2)')).toEqual([{ kind: 'text', text: '3(4e - 2)' }])
  })

  it('takes the website\'s markup, so a bank question can be pasted in', () => {
    expect(flat(toRuns('Work out 3x<sup>2</sup> when x = 4'))).toBe('Work out 3x^2 when x = 4')
    expect(flat(toRuns('a<sub>1</sub> = 5'))).toBe('a_1 = 5')
    expect(flat(toRuns('Line one<br>Line two'))).toBe('Line one\nLine two')
    expect(flat(toRuns('x &le; 4 &amp; y &gt; 1'))).toContain('&')
  })

  it('draws π and √ properly instead of spelling them out', () => {
    const runs = toRuns('area = πr² and √81')
    expect(runs.filter(r => r.kind !== 'frac' && r.kind !== 'vec' && r.kind !== 'paren' && r.symbol)).toHaveLength(2)
    expect(flat(runs)).not.toContain('sqrt')
    expect(flat(runs)).not.toContain('pi')
  })

  it('stacks a fraction, written or typed', () => {
    expect(toRuns('<frac>3/4</frac>')).toEqual([
      { kind: 'frac', num: [{ kind: 'text', text: '3' }], den: [{ kind: 'text', text: '4' }] },
    ])
    // The single-character fractions already in the paper data get it free.
    expect(flat(toRuns('Simplify fully ⅓p × 9q'))).toBe('Simplify fully [1/3]p × 9q')
  })

  it('shows a stray "<" rather than eating it as a tag', () => {
    // An author will write "x < 5" sooner or later, and silently deleting the
    // rest of the sentence would be far worse than printing a literal "<".
    expect(flat(toRuns('Solve x < 5 and y > 2'))).toBe('Solve x < 5 and y > 2')
  })

  it('leaves no paper losing a character silently', () => {
    // The guard that would have caught the original defect — "Simplify fully
    // k × k × k × k. Answer: k". It asks the DRAWING path, not toPdfSafe:
    // toPdfSafe alone would report π as lost when Symbol draws it fine.
    for (const paper of Object.values(PAPERS)) {
      const strings = [
        ...Object.entries(paper.retrySet).flatMap(([id, r]) =>
          [r.question, r.answer ?? '', r.working ?? ''].map(v => [`${paper.id} ${id}`, v] as const)),
        ...paper.challengeQuestions.flatMap(c =>
          [c.question, c.answer, c.working ?? ''].map(v => [`${paper.id} challenge ${c.skill}`, v] as const)),
      ]
      for (const [where, v] of strings) {
        const drawn = drawnChars(toRuns(v))
        // Compare against the PARSED text, not the raw string: a <frac> tag's
        // own angle brackets are meant to be consumed, and counting them as
        // lost content would make this guard fire on correct markup.
        const expected = plainText(parseInline(v))
        const lost = [...expected].filter(ch => !' \n'.includes(ch) && !drawn.includes(ch) &&
          // These are drawn, just not as themselves: as a Symbol glyph, a
          // stacked fraction, a raised digit, or an ASCII substitute.
          !'−→←√π≤≥≠±∞θαβμσλφΣΔΩ∠∴≈∩∪⊂⊆∈∅′⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿˣ₀₁₂₃₄₅₆₇₈₉½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞'.includes(ch) &&
          ch !== '\u0307')
        expect(lost, `${where}: ${JSON.stringify(lost.join(''))}`).toEqual([])
      }
    }
  })
})
