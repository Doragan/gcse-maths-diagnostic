import jsPDF from 'jspdf'
import type { WwwEbiSheet, AnswerKeyEntry } from './wwwEbi'
import type { RenderedGrid } from '../questions/gridDraw'
import { buildGridSvg } from '../questions/gridSvg'

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
 * Superscripts, and the ASCII they fall back to.
 *
 * CP1252 has ¹ ² ³ AND NOTHING ELSE, which is a trap rather than a limitation:
 * `x²` draws perfectly while `k⁴` silently loses its exponent and prints as
 * "k". That is not a garbled answer, it is a WRONG one, and it reached a
 * printed review sheet — "Simplify fully k × k × k × k. Answer: k" — before
 * anyone noticed. Standard form was worse: `8 × 10⁻⁴` printed as "8 × 10".
 */
const SUPERSCRIPT: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁻': '-', '⁺': '+', 'ⁿ': 'n', 'ˣ': 'x',
}
/** The three CP1252 can actually draw. */
const SUPERSCRIPT_DRAWABLE = new Set(['¹', '²', '³'])

/**
 * Rewrite superscripts, deciding ONCE PER STRING rather than per run.
 *
 * If every superscript in the string is drawable the typography is kept, so
 * `cm²` and `x³` are untouched. If any is not, the whole string goes to caret
 * notation — because `3 × 10³ × 10⁴` rendering as "3 × 10³ × 10^4" is a third
 * style, worse than either consistent one, and that exact line existed.
 */
function superscriptsToAscii(text: string): string {
  const runs = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿˣ]+/g
  const all = text.match(runs)
  if (!all) return text
  if (all.every(run => [...run].every(ch => SUPERSCRIPT_DRAWABLE.has(ch)))) return text
  return text.replace(runs, run => '^' + [...run].map(ch => SUPERSCRIPT[ch]).join(''))
}

/**
 * Make a string drawable by jsPDF's standard fonts.
 *
 * Applied to EVERY string that reaches doc.text — including before measuring
 * for wrapping, so the line breaks match what is actually drawn.
 */
export function toPdfSafe(text: string): string {
  text = superscriptsToAscii(text)
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
export async function buildFeedbackPdf(
  sheets: WwwEbiSheet[],
  options: FeedbackPdfOptions,
  answerKey: AnswerKeyEntry[] = [],
): Promise<jsPDF> {
  const doc = new jsPDF()

  for (const [i, sheet] of sheets.entries()) {
    // Each student gets their own page: these are handed out individually.
    if (i > 0) doc.addPage()
    await renderSheet(doc, sheet, options)
  }

  // The key goes LAST and on its own page, so separating the student sheets
  // leaves it behind rather than in the middle of the pile.
  if (answerKey.length) {
    if (sheets.length) doc.addPage()
    renderAnswerKey(doc, answerKey, options)
  }

  return doc
}

/** Build and download. The browser entry point. */
export async function downloadFeedbackPdf(
  sheets: WwwEbiSheet[],
  options: FeedbackPdfOptions,
  answerKey: AnswerKeyEntry[] = [],
): Promise<void> {
  const doc = await buildFeedbackPdf(sheets, options, answerKey)
  doc.save(feedbackPdfFilename(options))
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

async function renderSheet(doc: jsPDF, sheet: WwwEbiSheet, options: FeedbackPdfOptions): Promise<void> {
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
  await practiceSection(doc, c, sheet.practice)
  section(doc, c, 'Push yourself', sheet.challenge.map(q => `${q.skill}: ${q.question}`))
}

/** Printed width of a retry diagram, in mm. Comfortably drawable with a pencil. */
const DIAGRAM_WIDTH = 72

/**
 * "Practise these", which unlike every other section may carry a diagram.
 *
 * A grid is printed under its question so the student has something to draw on
 * — which is what lets a `visual: true` item have a retry at all. Everything
 * else on the sheet is text, which is why this is its own function rather than
 * a flag on `section()`.
 */
async function practiceSection(
  doc: jsPDF,
  c: Cursor,
  practice: WwwEbiSheet['practice'],
): Promise<void> {
  if (!practice.length) return

  ensureSpace(doc, c, 18)
  setBlack(doc, 12, 'bold')
  line(doc, c, 'Practise these', 7)

  for (const p of practice) {
    setBlack(doc, 10.5, 'normal')
    bullet(doc, c, `${p.skill}: ${p.question}`)
    if (p.diagram) await drawGrid(doc, c, p.diagram)
  }
  c.y += 5
}

/**
 * Draw an EMPTY grid at the cursor.
 *
 * `showCanonical: false` is the whole point — the canonical layer is the
 * answer, and printing it would hand the student what they are meant to work
 * out. Same builder the student-facing canvas and the verification harness
 * use, so what is printed is what the app would draw.
 *
 * SILENTLY SKIPS WITHOUT A DOM. svg2pdf walks a real SVG element, so this only
 * works in a browser — which is where both callers run. Node keeps the rest of
 * the document buildable and testable, which is the property the header of this
 * file exists to protect; a sheet built in Node simply has no grids on it.
 *
 * The import is dynamic for the same reason: loading svg2pdf at module scope
 * would drag a browser-only dependency into every test that touches a PDF.
 */
async function drawGrid(doc: jsPDF, c: Cursor, grid: RenderedGrid): Promise<void> {
  if (typeof document === 'undefined') return

  const svg = buildGridSvg(grid, { showCanonical: false })
  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  if (!viewBox) return
  const w = Number(viewBox[1]), h = Number(viewBox[2])
  const height = (h / w) * DIAGRAM_WIDTH

  ensureSpace(doc, c, height + 6)

  // svg2pdf reads computed geometry, so the element has to be in the document.
  // Off-screen rather than hidden: display:none collapses it to nothing.
  const holder = document.createElement('div')
  holder.style.cssText = 'position:absolute;left:-9999px;top:0'
  holder.innerHTML = svg
  const el = holder.querySelector('svg')
  if (!el) return
  document.body.appendChild(holder)

  try {
    const { svg2pdf } = await import('svg2pdf.js')
    await svg2pdf(el, doc, { x: MARGIN_X + 6, y: c.y, width: DIAGRAM_WIDTH, height })
    c.y += height + 4
  } catch {
    // A diagram that will not render must not cost the teacher the whole pack
    // of sheets. The question above it still stands on its own.
  } finally {
    holder.remove()
  }
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
