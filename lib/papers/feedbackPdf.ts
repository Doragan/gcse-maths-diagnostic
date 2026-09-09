import jsPDF from 'jspdf'
import type { WwwEbiSheet, AnswerKeyEntry } from './wwwEbi'
import type { RenderedGrid } from '../questions/gridDraw'
import { buildGridSvg, CELL } from '../questions/gridSvg'
import { parseInline, parseBlocks, type InlineToken } from '../questions/inlineMarkup'

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
 * This table used to be much longer, and most of it read as compromises: π
 * printed as the word "pi", √ as "sqrt", ⅓ as "1/3". Those are gone — π and √
 * now come from the built-in Symbol font (see SYMBOL) and the vulgar fractions
 * are drawn stacked (see inlineMarkup's VULGAR), so what is left is genuinely
 * a substitution rather than a surrender.
 */
const PDF_SAFE: Record<string, string> = {
  '−': '-',      // MINUS SIGN — not the ASCII hyphen, and the original bug
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
 * The Symbol font's own encoding, for characters WinAnsi simply does not have.
 *
 * jsPDF's standard 14 includes /Symbol, and it is emitted with NO /Encoding —
 * so the byte is an index into the font's own table, not Latin-1. Byte 0x70
 * ("p") is π, 0xD6 is √. That is why these look like nonsense as text: they
 * are, until the font is switched.
 *
 * This replaces the "π prints as the word pi" compromise the PDF_SAFE table
 * used to make, at no cost — Symbol is a built-in, so nothing is embedded and
 * the class pack stays about twenty kilobytes.
 */
const SYMBOL: Record<string, string> = {
  'π': 'p', '√': '\xD6', '≤': '\xA3', '≥': '\xB3', '≠': '\xB9',
  '±': '\xB1', '∞': '\xA5', '→': '\xAE', '←': '\xAC',
  'θ': 'q', 'α': 'a', 'β': 'b', 'μ': 'm', 'σ': 's', 'λ': 'l', 'φ': 'f',
  'Σ': 'S', 'Δ': 'D', 'Ω': 'W', '∠': '\xD0', '∴': '\\', '≈': '\xBB',
  // Set notation, for the Venn questions.
  '∩': '\xC7', '∪': '\xC8', '⊂': '\xCC', '⊆': '\xCD', '∈': '\xCE', '∅': '\xC6', '′': '\xA2',
}

/**
 * Make a string drawable by jsPDF's standard fonts.
 *
 * Applied to EVERY string that reaches doc.text — including before measuring
 * for wrapping, so the line breaks match what is actually drawn. Characters
 * SYMBOL covers never arrive here; toRuns has already split them out.
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

// ── Drawing the notation ─────────────────────────────────────────────────────
//
// `10^-4` is legible but it is not what a maths paper looks like, and the
// alternative first considered — embedding a Unicode TTF — costs about a
// megabyte on every sheet, against a whole class pack of roughly twenty
// kilobytes. jsPDF cannot subset a font, so that megabyte is not negotiable.
//
// Drawing instead costs nothing. An exponent is the SAME standard font at 68%
// size, raised off the baseline; a fraction is two such stacks with a rule
// between them; π and √ are the built-in Symbol font. The only real work is
// that measuring and wrapping have to walk runs of mixed size and font rather
// than one string.
//
// The vocabulary — <sup>, <sub>, <br>, entities, and <frac> — is parsed in
// lib/questions/inlineMarkup.ts, which the WEBSITE shares. See that file for
// why it lives there.

/** A piece of a line: text at some level, or a stacked fraction. */
export type Run =
  | { kind: 'text' | 'sup' | 'sub'; text: string; symbol?: boolean }
  | { kind: 'frac'; num: Run[]; den: Run[] }

const SUP_SIZE = 0.68        // exponent size, as a fraction of the base
const SUP_RISE = 0.30        // how far above the baseline, in base font heights
const SUB_DROP = 0.14        // how far below, for H2O and a1
const FRAC_SIZE = 0.78       // numerator and denominator size
const FRAC_RISE = 0.30       // numerator baseline above the rule
const FRAC_DROP = 0.62       // denominator baseline below the rule
const FRAC_RULE = 0.14       // where the rule sits, above the base baseline
const FRAC_PAD = 0.6         // mm of clear space each side of a fraction
const PT_TO_MM = 25.4 / 72

/** Split a string into WinAnsi runs and Symbol-font runs at `kind`. */
function fontRuns(text: string, kind: 'text' | 'sup' | 'sub'): Run[] {
  const out: Run[] = []
  let plain = ''
  const flush = () => { if (plain) { out.push({ kind, text: toPdfSafe(plain) }); plain = '' } }
  for (const ch of text) {
    if (SYMBOL[ch]) { flush(); out.push({ kind, text: SYMBOL[ch], symbol: true }) }
    else plain += ch
  }
  flush()
  return out
}

/** Authored question text to drawable runs. Newlines survive as "\n" runs. */
export function toRuns(text: string): Run[] {
  return tokensToRuns(parseInline(text))
}

/**
 * Tokens to runs, fractions kept STACKED. Use this anywhere a token list needs
 * drawing on its own — a table cell, say.
 */
export function tokensToRuns(tokens: InlineToken[]): Run[] {
  const out: Run[] = []
  for (const t of tokens) {
    if (t.kind === 'break') out.push({ kind: 'text', text: '\n' })
    else if (t.kind === 'frac') out.push({ kind: 'frac', num: flatRuns(t.num), den: flatRuns(t.den) })
    else out.push(...fontRuns(t.text, t.kind))
  }
  return out
}

/**
 * Tokens to runs, fractions FLATTENED to "a/b".
 *
 * Only for the inside of a fraction: a rule cannot be drawn over another rule
 * at a legible size, so a nested fraction becomes a slash rather than a second
 * stack. Everywhere else wants tokensToRuns.
 */
function flatRuns(tokens: InlineToken[]): Run[] {
  const out: Run[] = []
  for (const t of tokens) {
    if (t.kind === 'break') continue          // a line break inside a fraction is meaningless
    else if (t.kind === 'frac') out.push(...flatRuns(t.num), { kind: 'text', text: '/' }, ...flatRuns(t.den))
    else out.push(...fontRuns(t.text, t.kind))
  }
  return out
}

/** Point size a run is drawn at, given the size of the line it sits on. */
function sizeOf(run: Run, size: number): number {
  return run.kind === 'text' ? size : run.kind === 'frac' ? size * FRAC_SIZE : size * SUP_SIZE
}

function setRunFont(doc: jsPDF, run: Run, size: number, weight: string): void {
  doc.setFontSize(sizeOf(run, size))
  // SYMBOL HAS ONE WEIGHT. Asking for 'symbol','bold' makes jsPDF log "unable
  // to look up font label" and quietly fall back, so a π in a bold heading
  // used to come out in whatever font it landed on. Regular is the honest
  // answer: there is no bold π in the standard 14.
  if (run.kind !== 'frac' && run.symbol) doc.setFont('symbol', 'normal')
  else doc.setFont('helvetica', weight)
}

/** Width of one run, in mm. */
function runWidth(doc: jsPDF, run: Run, size: number): number {
  const weight = (doc.getFont() as { fontStyle?: string }).fontStyle ?? 'normal'
  if (run.kind === 'frac') {
    const w = Math.max(measureRuns(doc, run.num, size * FRAC_SIZE), measureRuns(doc, run.den, size * FRAC_SIZE))
    return w + FRAC_PAD * 2
  }
  setRunFont(doc, run, size, weight)
  const w = doc.getTextWidth(run.text)
  doc.setFontSize(size)
  doc.setFont('helvetica', weight)
  return w
}

/** Width of a run sequence at the current font, in mm. */
function measureRuns(doc: jsPDF, runs: Run[], size: number): number {
  let w = 0
  for (const r of runs) w += runWidth(doc, r, size)
  doc.setFontSize(size)
  return w
}

/** Break runs into lines that fit `width`, honouring any newlines in the text. */
export function wrapRuns(doc: jsPDF, runs: Run[], size: number, width: number): Run[][] {
  const lines: Run[][] = []
  let line: Run[] = []

  const flush = () => { lines.push(line); line = [] }
  for (const run of runs) {
    // A raised or stacked run never begins a line on its own — it belongs to
    // the token before it, so it rides along with whatever is already there.
    if (run.kind !== 'text') { line.push(run); continue }
    for (const part of run.text.split(/(\n)/)) {
      if (part === '\n') { flush(); continue }
      for (const word of part.split(/(\s+)/)) {
        if (!word) continue
        const candidate: Run[] = [...line, { kind: 'text', text: word, symbol: run.symbol }]
        if (measureRuns(doc, candidate, size) > width && line.length) {
          flush()
          if (/^\s+$/.test(word)) continue   // don't start a line with the space
        }
        line.push({ kind: 'text', text: word, symbol: run.symbol })
      }
    }
  }
  flush()
  return lines
}

/**
 * Extra leading, in mm, that a line needs because of what is stacked on it.
 *
 * A fraction is drawn ABOUT the baseline — numerator up, denominator down —
 * so it occupies roughly twice the height of ordinary text. At the fixed
 * advance every other line uses, consecutive fraction lines very nearly touch,
 * which is what "Work out 3/10 + 1/4 ÷ 1/2" looked like. Superscripts rise but
 * do not descend, so they need much less.
 */
export function extraLeading(runs: Run[], size: number): number {
  // No recursion needed: a fraction inside a fraction is flattened to a slash
  // by flatRuns, so nesting never adds height.
  if (runs.some(r => r.kind === 'frac')) return size * PT_TO_MM * 0.62
  if (runs.some(r => r.kind === 'sup' || r.kind === 'sub')) return size * PT_TO_MM * 0.12
  return 0
}

/** Draw one line of runs at (x, y). */
export function drawRuns(doc: jsPDF, runs: Run[], x: number, y: number, size: number): void {
  const weight = (doc.getFont() as { fontStyle?: string }).fontStyle ?? 'normal'
  let cx = x
  for (const r of runs) {
    const w = runWidth(doc, r, size)
    if (r.kind === 'frac') {
      const inner = size * FRAC_SIZE
      const numW = measureRuns(doc, r.num, inner)
      const denW = measureRuns(doc, r.den, inner)
      const barW = w - FRAC_PAD * 2
      const ruleY = y - size * FRAC_RULE * PT_TO_MM
      drawRuns(doc, r.num, cx + FRAC_PAD + (barW - numW) / 2, ruleY - size * FRAC_RISE * PT_TO_MM, inner)
      drawRuns(doc, r.den, cx + FRAC_PAD + (barW - denW) / 2, ruleY + size * FRAC_DROP * PT_TO_MM, inner)
      doc.setLineWidth(0.25)
      doc.line(cx + FRAC_PAD, ruleY, cx + FRAC_PAD + barW, ruleY)
    } else {
      setRunFont(doc, r, size, weight)
      const dy = r.kind === 'sup' ? -size * SUP_RISE * PT_TO_MM
        : r.kind === 'sub' ? size * SUB_DROP * PT_TO_MM
          : 0
      doc.text(r.text, cx, y + dy)
    }
    cx += w
  }
  doc.setFontSize(size)
  doc.setFont('helvetica', weight)
}

// ── Tables ───────────────────────────────────────────────────────────────────

const CELL_PAD = 1.8         // mm of space each side of a cell's text
const ROW_LEAD = 1.6         // mm above and below a row's text

/** Column widths in mm, each the widest cell in that column plus padding. */
function columnWidths(doc: jsPDF, rows: InlineToken[][][], size: number): number[] {
  const cols = Math.max(...rows.map(r => r.length))
  const w: number[] = Array.from({ length: cols }, () => 0)
  for (const row of rows)
    row.forEach((cell, i) => { w[i] = Math.max(w[i], measureRuns(doc, tokensToRuns(cell), size) + CELL_PAD * 2) })
  return w
}

/** Height a table will take, so a caller can page-break before starting one. */
export function tableHeight(rows: InlineToken[][][], size: number): number {
  return rows.length * (size * 0.42 + ROW_LEAD * 2)
}

/**
 * Draw a real table — ruled, with the columns aligned.
 *
 * Returns the height used. Cells go through drawRuns, so a cell can hold a
 * fraction or an exponent like any other text; that is the whole reason this
 * measures rather than using jspdf-autotable, which knows only about strings.
 *
 * Columns are sized to their content and then scaled down together if the
 * total overflows, so a wide table shrinks rather than running off the page.
 */
export function drawTable(
  doc: jsPDF, rows: InlineToken[][][], x: number, y: number, size: number, maxWidth: number,
): number {
  let widths = columnWidths(doc, rows, size)
  const total = widths.reduce((a, b) => a + b, 0)
  if (total > maxWidth) widths = widths.map(w => w * maxWidth / total)

  const rowH = size * 0.42 + ROW_LEAD * 2
  doc.setDrawColor(150)
  doc.setLineWidth(0.2)

  let cy = y
  for (const row of rows) {
    let cx = x
    row.forEach((cell, i) => {
      doc.rect(cx, cy, widths[i], rowH)
      drawRuns(doc, tokensToRuns(cell), cx + CELL_PAD, cy + rowH - ROW_LEAD - 0.6, size)
      cx += widths[i]
    })
    cy += rowH
  }
  doc.setDrawColor(0)
  return rows.length * rowH
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

/**
 * How a retry diagram is sized on the page.
 *
 * A FIXED WIDTH WAS A MISTAKE, and an expensive one: at a flat 72mm a
 * twelve-column grid gives 5mm squares, and two questions were written off as
 * impossible — a cuboid net and an exponential plot — on the strength of a
 * constant chosen here rather than anything about paper.
 *
 * So the square is what is held roughly fixed, not the width. A grid is drawn
 * at TARGET_CELL per square and then clamped: never wider than the text, never
 * more than about a third of a page tall, and never so small that a pencil
 * cannot work in it.
 */
const DIAGRAM_TARGET_CELL = 9    // mm per grid square
const DIAGRAM_MIN_WIDTH = 58
const DIAGRAM_MAX_WIDTH = 150
const DIAGRAM_MAX_HEIGHT = 108

/** Printed size for a diagram whose viewBox is w × h units. */
function diagramSize(w: number, h: number): { width: number; height: number } {
  let scale = DIAGRAM_TARGET_CELL / CELL
  if (w * scale > DIAGRAM_MAX_WIDTH) scale = DIAGRAM_MAX_WIDTH / w
  if (h * scale > DIAGRAM_MAX_HEIGHT) scale = DIAGRAM_MAX_HEIGHT / h
  if (w * scale < DIAGRAM_MIN_WIDTH) scale = DIAGRAM_MIN_WIDTH / w
  return { width: w * scale, height: h * scale }
}

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

  for (const group of practice) {
    // The question's number heads the block, so a multi-part question reads as
    // one thing rather than as several unrelated bullets.
    setBlack(doc, 10.5, 'bold')
    line(doc, c, `Question ${group.label} — ${group.parts[0].skill}`, 5.5, 10.5)

    // The scenario the parts share, set once above them — the paper prints it
    // once, and repeating it under (a) and again under (b) reads as two
    // unrelated questions that happen to use the same numbers.
    if (group.stem) {
      setBlack(doc, 10.5, 'normal')
      for (const l of group.stem.split('\n')) line(doc, c, l, 4.6, 10.5)
      c.y += 1
    }

    // A diagram shared by every part is drawn ONCE, under the heading. Two
    // parts reading off one conversion graph printed it twice before, which is
    // how it looks on a sheet and not how it looks on the paper.
    const shared = group.parts[0].diagram
    const allSame = shared && group.parts.every(p => p.diagram && sameGrid(p.diagram, shared))
    if (allSame) await drawGrid(doc, c, shared)

    for (const part of group.parts) {
      setBlack(doc, 10.5, 'normal')
      bullet(doc, c, group.parts.length > 1 ? `${part.label}  ${part.body}` : part.body)
      if (part.diagram && !allSame) await drawGrid(doc, c, part.diagram)
    }
    c.y += 2
  }
  c.y += 4
}

/** Same printed figure? Compared on what is drawn, not on object identity. */
function sameGrid(a: RenderedGrid, b: RenderedGrid): boolean {
  return a.background === b.background &&
    a.mode === b.mode &&
    JSON.stringify(a.x) === JSON.stringify(b.x) &&
    JSON.stringify(a.y) === JSON.stringify(b.y) &&
    JSON.stringify(a.labels ?? null) === JSON.stringify(b.labels ?? null)
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
  const { width, height } = diagramSize(Number(viewBox[1]), Number(viewBox[2]))

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
    await svg2pdf(el, doc, { x: MARGIN_X + 6, y: c.y, width, height })
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
function bullet(doc: jsPDF, c: Cursor, text: string, size = 10.5): void {
  let first = true
  for (const block of parseBlocks(text)) {
    if (block.kind === 'table') {
      ensureSpace(doc, c, tableHeight(block.rows, size - 0.5) + 2)
      c.y += drawTable(doc, block.rows, MARGIN_X + 4, c.y - 3, size - 0.5, CONTENT_WIDTH - 10) - 1
      continue
    }
    // Wrapped over RUNS, not a plain string: an exponent is drawn at a smaller
    // size, so measuring it as body text would break the line in the wrong place.
    for (const run of wrapRuns(doc, toRuns(block.text), size, CONTENT_WIDTH - 6)) {
      ensureSpace(doc, c, 6)
      doc.text(first ? '•' : ' ', MARGIN_X, c.y)
      drawRuns(doc, run, MARGIN_X + 4, c.y, size)
      c.y += 5.5 + extraLeading(run, size)
      first = false
    }
  }
  c.y += 1
}

/** One line of text at the cursor, advancing by `advance` mm. */
function line(doc: jsPDF, c: Cursor, text: string, advance = 5.5, size?: number): void {
  const size_ = size ?? doc.getFontSize()
  const runs = toRuns(text)
  ensureSpace(doc, c, advance)
  drawRuns(doc, runs, MARGIN_X, c.y, size_)
  c.y += advance + extraLeading(runs, size_)
}

/** Text that may need more than one line, at the current font. */
function wrapped(doc: jsPDF, c: Cursor, text: string): void {
  const size = doc.getFontSize()
  for (const run of wrapRuns(doc, toRuns(text), size, CONTENT_WIDTH)) {
    ensureSpace(doc, c, 4.5)
    drawRuns(doc, run, MARGIN_X, c.y, size)
    c.y += 4.5 + extraLeading(run, size)
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
