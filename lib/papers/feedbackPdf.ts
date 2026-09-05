import jsPDF from 'jspdf'
import type { WwwEbiSheet, AnswerKeyEntry } from './wwwEbi'

// ─────────────────────────────────────────────────────────────────────────────
// Feedback sheets as a printable PDF — one page per student, one document.
//
// ONE DOCUMENT, NOT THIRTY FILES. The job this exists for is "thirty sheets by
// tomorrow", and thirty downloads is a worse version of the evening it was
// meant to save. A single PDF is one print job and one stack to hand out.
//
// BUILDING IS SEPARATE FROM SAVING. lib/results/generatePDF.ts calls doc.save()
// at the end of its only export, which means nothing about it can be checked
// without a browser. Here buildFeedbackPdf() returns the document and
// downloadFeedbackPdf() saves it, so the layout is testable and the same
// builder can later be used server-side (emailed sheets, a stored copy) without
// being rewritten.
//
// This runs in the BROWSER on the free path, which is the point: marks in,
// PDF out, nothing written anywhere. The generator never needed a database and
// neither does this.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Characters the paper data uses that jsPDF's built-in fonts CANNOT draw.
 *
 * The standard PDF fonts are limited to WinAnsi (CP1252). Most of the maths
 * typography in lib/demoPapers survives that — × ÷ ² ³ ° £ ½ — but these do
 * not, and an undrawable character does not fail loudly: it renders as a
 * fallback glyph, which is what made a practice question appear "in a strange
 * font" (the culprit was U+2212 MINUS SIGN in "Solve 3(4e − 2) = 42", which is
 * NOT the ASCII hyphen it looks like).
 *
 * Substituting is a rendering concern and belongs here, at the boundary — the
 * source data is correct as it stands and renders properly everywhere else.
 *
 * `sqrt` and `pi` are the two that read as compromises. Fixing those properly
 * means embedding a Unicode TTF and calling doc.addFont, which is worth doing
 * if the maths in these questions gets any richer.
 */
const PDF_SAFE: Record<string, string> = {
  '−': '-',      // MINUS SIGN — not the ASCII hyphen, and the original bug
  '→': '->',     // → in function machines
  '√': 'sqrt',   // √
  'π': 'pi',     // π
  '≥': '>=',     // ≥
  '≤': '<=',     // ≤
  '⅓': '1/3',    // ⅓
  '⅔': '2/3',
  '⅕': '1/5',    // ⅕
  '⅛': '1/8',
  '̇': '',       // combining dot above (recurring decimals); the questions
                      // using it also say "(recurring)" in words, so dropping
                      // the dot loses nothing a student needs.
}

/**
 * The characters CP1252 keeps in 0x80–0x9F, which Unicode numbers far above
 * 0xFF. They ARE drawable, so a naive "codepoint > 0xFF is unsafe" rule would
 * blank out the em dash — which appears in every paper subtitle.
 */
const CP1252_EXTRAS = new Set([...'€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'])

/**
 * Make a string drawable by jsPDF's standard fonts.
 *
 * Applied to EVERY string that reaches doc.text — including before measuring
 * for wrapping, so the line breaks match what is actually drawn.
 */
export function toPdfSafe(text: string): string {
  let out = ''
  for (const ch of text) {
    const mapped = PDF_SAFE[ch]
    if (mapped !== undefined) { out += mapped; continue }
    const cp = ch.codePointAt(0)!
    // Anything else outside WinAnsi would render as a fallback glyph. Better a
    // visible gap than a wrong symbol in a maths question.
    out += cp <= 0xff || CP1252_EXTRAS.has(ch) ? ch : ' '
  }
  return out
}

/** A4 portrait in mm, matching jsPDF's defaults and lib/results/generatePDF.ts. */
const MARGIN_X = 20
const MARGIN_TOP = 20
const PAGE_BOTTOM = 277
const CONTENT_WIDTH = 170

const GREY: [number, number, number] = [110, 110, 110]
const BLACK: [number, number, number] = [0, 0, 0]

export type FeedbackPdfOptions = {
  /** "AQA GCSE Mathematics 8300/3F". */
  paperTitle: string
  /** "Foundation Tier Paper 3 Calculator — November 2024". */
  paperSubtitle?: string
  /** Shown under the student's name when known. */
  className?: string
  /** When the class sat it, already formatted for display. */
  satOn?: string
}

/**
 * Lay the sheets out as a PDF, one student per page.
 *
 * Returns the document rather than saving it — see the header. An empty list
 * still produces a valid (single blank) document rather than throwing, because
 * the caller that asked for zero sheets has a UI problem, not an exception.
 */
export function buildFeedbackPdf(
  sheets: WwwEbiSheet[],
  options: FeedbackPdfOptions,
  answerKey: AnswerKeyEntry[] = [],
): jsPDF {
  const doc = new jsPDF()

  sheets.forEach((sheet, i) => {
    // Each student gets their own page: these are handed out individually.
    if (i > 0) doc.addPage()
    renderSheet(doc, sheet, options)
  })

  // The key goes LAST and on its own page, so separating the student sheets
  // leaves it behind rather than in the middle of the pile.
  if (answerKey.length) {
    if (sheets.length) doc.addPage()
    renderAnswerKey(doc, answerKey, options)
  }

  return doc
}

/** Build and download. The browser entry point. */
export function downloadFeedbackPdf(
  sheets: WwwEbiSheet[],
  options: FeedbackPdfOptions,
  answerKey: AnswerKeyEntry[] = [],
): void {
  buildFeedbackPdf(sheets, options, answerKey).save(feedbackPdfFilename(options))
}

/** "mathsense-feedback-aqa-gcse-mathematics-8300-3f.pdf" */
export function feedbackPdfFilename(options: FeedbackPdfOptions): string {
  const slug = options.paperTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `mathsense-feedback-${slug || 'paper'}.pdf`
}

// ── Layout ───────────────────────────────────────────────────────────────────

type Cursor = { y: number }

function renderSheet(doc: jsPDF, sheet: WwwEbiSheet, options: FeedbackPdfOptions): void {
  const c: Cursor = { y: MARGIN_TOP }

  // Paper identity first, small — the sheet is about the student, not the paper.
  setGrey(doc, 10)
  line(doc, c, options.paperTitle)
  if (options.paperSubtitle) line(doc, c, options.paperSubtitle)
  if (options.satOn) line(doc, c, `Sat ${options.satOn}`)
  c.y += 4

  setBlack(doc, 18, 'bold')
  line(doc, c, sheet.studentRef, 9)

  if (options.className) {
    setGrey(doc, 10)
    line(doc, c, options.className)
  }

  setBlack(doc, 13, 'bold')
  line(doc, c, sheet.score, 8)

  // The coverage sentence is the one that stops a part paper reading as a whole
  // one, so it sits directly under the score rather than in a footnote.
  if (sheet.coverage) {
    setGrey(doc, 9.5)
    wrapped(doc, c, sheet.coverage)
    c.y += 2
  }

  c.y += 4

  // Empty sections are OMITTED, heading and all. An empty "Even better if" is
  // the correct output for a perfect paper, and printing a bare heading under
  // it reads as a bug rather than as praise.
  section(doc, c, 'What went well', sheet.www)
  section(doc, c, 'Even better if', sheet.ebi)
  section(doc, c, 'Practise these', sheet.practice.map(p => `${p.skill}: ${p.question}`))
  section(doc, c, 'Push yourself', sheet.challenge.map(q => `${q.skill}: ${q.question}`))
}

/**
 * The teacher's answer key, one page at the back.
 *
 * Answers exist on the evidence but are deliberately absent from every student
 * sheet, so this is the only place they are printed. It is headed unambiguously
 * because the rest of this document gets handed out.
 */
function renderAnswerKey(
  doc: jsPDF,
  entries: AnswerKeyEntry[],
  options: FeedbackPdfOptions,
): void {
  const c: Cursor = { y: MARGIN_TOP }

  setGrey(doc, 10)
  line(doc, c, options.paperTitle)
  if (options.paperSubtitle) line(doc, c, options.paperSubtitle)
  c.y += 4

  setBlack(doc, 18, 'bold')
  line(doc, c, 'Answers — teacher copy', 8)

  setGrey(doc, 10)
  wrapped(doc, c, 'Not for handing out. These are the answers to the practice and challenge questions on the sheets in this pack.')
  c.y += 5

  for (const e of entries) {
    ensureSpace(doc, c, 16)
    setBlack(doc, 10.5, 'bold')
    line(doc, c, e.skill, 5)

    setBlack(doc, 10.5, 'normal')
    for (const part of doc.splitTextToSize(toPdfSafe(e.question), CONTENT_WIDTH) as string[]) {
      line(doc, c, part, 5)
    }

    setBlack(doc, 10.5, 'bold')
    line(doc, c, `Answer: ${e.answer}`, 5)

    if (e.working) {
      setGrey(doc, 9.5)
      wrapped(doc, c, e.working)
    }
    c.y += 4
  }
}

function section(doc: jsPDF, c: Cursor, heading: string, lines: string[]): void {
  if (!lines.length) return

  ensureSpace(doc, c, 18)
  setBlack(doc, 12, 'bold')
  line(doc, c, heading, 7)

  setBlack(doc, 10.5, 'normal')
  for (const text of lines) bullet(doc, c, text)
  c.y += 5
}

/**
 * A wrapped bullet. Continuation lines are indented past the bullet so a long
 * practice question stays readable as one item rather than merging into the
 * next.
 */
function bullet(doc: jsPDF, c: Cursor, text: string): void {
  // Sanitised BEFORE measuring, so the wrap points match the drawn glyphs.
  const parts = doc.splitTextToSize(toPdfSafe(text), CONTENT_WIDTH - 6) as string[]
  parts.forEach((part, i) => {
    ensureSpace(doc, c, 6)
    doc.text(i === 0 ? `• ${part}` : `  ${part}`, MARGIN_X, c.y)
    c.y += 5.5
  })
  c.y += 1
}

/** One line of text at the cursor, advancing by `advance` mm. */
function line(doc: jsPDF, c: Cursor, text: string, advance = 5.5): void {
  ensureSpace(doc, c, advance)
  doc.text(toPdfSafe(text), MARGIN_X, c.y)
  c.y += advance
}

/** Text that may need more than one line, at the current font. */
function wrapped(doc: jsPDF, c: Cursor, text: string): void {
  for (const part of doc.splitTextToSize(toPdfSafe(text), CONTENT_WIDTH) as string[]) {
    line(doc, c, part, 4.5)
  }
}

/**
 * Start a new page if the next block will not fit.
 *
 * A student's sheet may run onto a second page — a weak paper produces the most
 * lines — and that is preferable to shrinking the type or dropping content the
 * formatter already capped deliberately.
 */
function ensureSpace(doc: jsPDF, c: Cursor, needed: number): void {
  if (c.y + needed > PAGE_BOTTOM) {
    doc.addPage()
    c.y = MARGIN_TOP
  }
}

function setBlack(doc: jsPDF, size: number, weight: 'normal' | 'bold' = 'normal'): void {
  doc.setFont('helvetica', weight)
  doc.setFontSize(size)
  doc.setTextColor(...BLACK)
}

function setGrey(doc: jsPDF, size: number): void {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(size)
  doc.setTextColor(...GREY)
}
