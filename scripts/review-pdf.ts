/**
 * Print a paper's whole retrySet as a PDF for checking, answers included.
 *
 *   npx tsx scripts/review-pdf.ts aqa-8300-2f-jun25
 *   npx tsx scripts/review-pdf.ts aqa-8300-2f-jun25 --out ~/Desktop
 *
 * WHY THIS EXISTS. Retry questions have no automated gate at all — no
 * parameters, no answer_template, no grader, so verify-question and audit-bank
 * cannot see them (docs/writing-retry-questions.md, "Checking it"). A person
 * reading them is the only check there is, and 300+ of them do not fit in
 * terminal scrollback.
 *
 * WHAT IT PRINTS, and why each part is there:
 *   • the question's label, total marks and skills — the retry should demand
 *     the same number of steps as the original
 *   • the question, its answer, and the working
 *   • the grid, where the retry carries one, rasterised at print resolution
 *
 * It used to print the audit's `desc` as "ORIGINAL ASKED", on the theory that
 * it was the only record of the real question. It is not much of one — the
 * note describes what the APP would need to support the question, not what the
 * question says — and a reader with the paper in front of them does not need
 * it. Out, rather than left cluttering every block.
 *
 * Diagrams go through sharp rather than svg2pdf: svg2pdf walks a real SVG
 * element and needs a browser, and a review document that only runs in one
 * would be a worse tool. The cost is that grids are images here, where a
 * student's sheet gets them as vectors.
 */
import { writeFileSync } from 'fs'
import { join } from 'path'
import jsPDF from 'jspdf'
import { PAPERS } from '../lib/demoPapers/index'
import { toRuns, wrapRuns, drawRuns, drawTable, tableHeight } from '../lib/papers/feedbackPdf'
import { parseBlocks } from '../lib/questions/inlineMarkup'
import { buildGridSvg } from '../lib/questions/gridSvg'
import type { RenderedGrid } from '../lib/questions/gridDraw'

const MARGIN_X = 18
const PAGE_BOTTOM = 280
const WIDTH = 174

async function main() {
  const args = process.argv.slice(2)
  const slug = args.find(a => !a.startsWith('--'))
  const outAt = args.indexOf('--out')
  const outDir = outAt >= 0 ? args[outAt + 1] : process.cwd()

  if (!slug || !PAPERS[slug]) {
    console.error('Usage: npx tsx scripts/review-pdf.ts <slug> [--out <dir>]\n\nPapers with a retrySet:')
    for (const p of Object.values(PAPERS)) {
      if (Object.keys(p.retrySet).length) console.error(`  ${p.id}  (${Object.keys(p.retrySet).length} retries)`)
    }
    process.exit(1)
  }

  const paper = PAPERS[slug]
  const doc = new jsPDF()
  let y = 20

  const ensure = (needed: number) => {
    if (y + needed > PAGE_BOTTOM) { doc.addPage(); y = 20 }
  }
  // Shares the sheet's text path rather than keeping its own. This file had a
  // private splitTextToSize/toPdfSafe version, so when superscripts started
  // being DRAWN on a student's sheet the review copy carried on spelling them
  // "10^-4" — the same content rendering two different ways depending on which
  // document you were reading.
  const text = (s: string, size: number, weight: 'normal' | 'bold', indent = 0, grey = false) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', weight)
    doc.setTextColor(...(grey ? [110, 110, 110] : [0, 0, 0]) as [number, number, number])
    for (const block of parseBlocks(s)) {
      if (block.kind === 'table') {
        ensure(tableHeight(block.rows, size - 0.5) + 3)
        y += drawTable(doc, block.rows, MARGIN_X + indent, y - 3, size - 0.5, WIDTH - indent) + 2
        continue
      }
      for (const run of wrapRuns(doc, toRuns(block.text), size, WIDTH - indent)) {
        ensure(size * 0.5)
        drawRuns(doc, run, MARGIN_X + indent, y, size)
        y += size * 0.42 + 1.4
      }
    }
  }

  // ── Header ────────────────────────────────────────────────────────────────
  text(paper.title, 15, 'bold')
  text(paper.subtitle, 10, 'normal', 0, true)
  y += 2
  const withDiagram = Object.values(paper.retrySet).filter(r => r.diagram).length
  const noRetry = paper.questions.filter(q => !paper.retrySet[q.id])
  text(
    `${Object.keys(paper.retrySet).length} retry questions for checking` +
    `${withDiagram ? `, ${withDiagram} with a grid` : ''}. ` +
    `${noRetry.length} item${noRetry.length === 1 ? '' : 's'} deliberately without one: ` +
    `${noRetry.map(q => q.label).join(', ') || 'none'}.`,
    9, 'normal', 0, true,
  )
  y += 5

  /**
   * Draw a grid. `showCanonical` gives the ANSWER copy — the solution
   * overlay and the canonical points — which is the only useful way to
   * present a drawn answer: "the four faces still to draw are 4 × 3, 4 × 2…"
   * is nearly impossible to mark a student's net against.
   */
  const drawDiagram = async (grid: RenderedGrid, showCanonical: boolean) => {
    const svg = buildGridSvg(grid, { showCanonical })
    const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    if (!vb) return
    // Sized the way a sheet sizes it — hold the SQUARE roughly fixed, not
    // the width, or a wide grid comes out with squares too small to draw
    // in. Slightly tighter caps than the sheet's, since this page also
    // carries the question, the answer and the working.
    const vbW = Number(vb[1]), vbH = Number(vb[2])
    let scale = 8 / 28                      // ~8mm per grid square
    if (vbW * scale > 140) scale = 140 / vbW
    if (vbH * scale > 95) scale = 95 / vbH
    if (vbW * scale < 52) scale = 52 / vbW
    const w = vbW * scale, h = vbH * scale
    ensure(h + 4)
    try {
      // RASTERISE AT THE SIZE IT IS PRINTED, not at whatever the SVG's
      // nominal size times 220 DPI happens to be. Without the resize a
      // single grid could carry several megapixels for a 70mm square on the
      // page, and an eleven-page review document came out at 18 MB — big
      // enough that sending it anywhere timed out. 8 px/mm is a little over
      // 200 DPI, which is past what this is read at.
      const sharp = (await import('sharp')).default
      const png = await sharp(Buffer.from(svg), { density: 220 })
        .flatten({ background: '#ffffff' })
        .resize({ width: Math.round(w * 8), withoutEnlargement: true })
        .png({ compressionLevel: 9, palette: true })
        .toBuffer()
      doc.addImage(`data:image/png;base64,${png.toString('base64')}`, 'PNG', MARGIN_X + 4, y, w, h)
      y += h + 3
    } catch (e) {
      text(`[grid could not be rendered: ${e instanceof Error ? e.message : String(e)}]`, 9, 'normal', 4, true)
    }
  }

  // ── One block per QUESTION, parts together, in paper order ────────────────
  //
  // Grouped rather than one block per part, because that is how the question
  // was asked and how the student's sheet sets it (wwwEbi's groupPractice).
  // Printing parts standalone made every shared scenario appear two or three
  // times, which reads as sloppy authoring when it is really the review
  // document showing what the data holds rather than what anyone receives.
  const groups: { label: string; parts: typeof paper.questions }[] = []
  for (const q of paper.questions) {
    if (!paper.retrySet[q.id]) continue
    const n = q.id.replace(/[a-z]+$/i, '') || q.id
    const last = groups[groups.length - 1]
    if (last && last.label === n) last.parts.push(q)
    else groups.push({ label: n, parts: [q] })
  }

  for (const g of groups) {
    const rs = g.parts.map(q => paper.retrySet[q.id])
    // The opening every part shares, lifted to whole lines — same rule as the
    // sheet's sharedStem, and for the same reason.
    const qs = rs.map(r => r.question)
    let common = 0
    while (common < qs[0].length && qs.every(v => v[common] === qs[0][common])) common++
    const cut = qs[0].lastIndexOf('\n', common - 1)
    const stem = cut >= 30 && qs.every(v => v.slice(cut + 1).trim()) ? qs[0].slice(0, cut) : ''

    ensure(34)
    doc.setDrawColor(200)
    doc.line(MARGIN_X, y - 3, MARGIN_X + WIDTH, y - 3)

    const marks = g.parts.reduce((a, q) => a + q.marks, 0)
    const skills = [...new Set(rs.map(r => r.skill))].join('  ·  ')
    text(`${g.parts.length > 1 ? `Question ${g.label}` : g.parts[0].label}   ` +
      `${marks} mark${marks === 1 ? '' : 's'}   ·   ${skills}`, 10.5, 'bold')
    y += 1.5

    if (stem) { text(stem, 10, 'normal'); y += 1 }

    // A figure is drawn ONCE and then not again until it changes. Comparing
    // only against the FIRST part missed the middle case: 3F 4 has (a) and (b)
    // on one machine and (c) on another, so "do all three match?" was false
    // and all three drew — including the two that were identical.
    //
    // Compared on what is PRINTED — `elements` is the answer, and 1(a) carries
    // a completed Pattern 4 that 1(b) does not, which made two identical blank
    // grids look like two different figures.
    const printed = (g?: RenderedGrid) =>
      g && JSON.stringify([g.background, g.mode, g.x, g.y, g.labels ?? null, g.showAxes, g.showGrid])
    let shown: string | null | undefined = null
    const showFigure = async (grid: RenderedGrid | undefined) => {
      if (!grid || printed(grid) === shown) return
      await drawDiagram(grid, false)
      shown = printed(grid)
    }
    const allSame = rs[0].diagram && rs.every(r => printed(r.diagram) === printed(rs[0].diagram))
    if (allSame) { await showFigure(rs[0].diagram); y += 1 }

    for (const [i, q] of g.parts.entries()) {
      const r = rs[i]
      const body = stem ? r.question.slice(stem.length + 1) : r.question
      text(g.parts.length > 1 ? `${q.label}   ${body}` : body, 10, 'normal', g.parts.length > 1 ? 4 : 0)
      if (!allSame) await showFigure(r.diagram)
      text(`Answer:  ${r.answer ?? '(none authored)'}`, 10, 'bold', 8)
      if (r.working) text(r.working, 9, 'normal', 8, true)
      // The answer AS A DRAWING, but only where the answer IS a drawing —
      // `visual` says so. Keying off the grid having canonical elements drew
      // it for every part sharing that grid, so 1(b), whose answer is the
      // number 13, was getting a completed Pattern 4 as its "answer".
      if (q.visual && r.diagram && (r.diagram.solution || r.diagram.elements.length)) {
        text('The answer drawn:', 9, 'bold', 8, true)
        await drawDiagram(r.diagram, true)
        shown = null      // the next part must redraw the blank copy
      }
      y += 2
    }
    y += 4
  }


  const file = join(outDir, `${paper.id}-retries-for-review.pdf`)
  writeFileSync(file, Buffer.from(doc.output('arraybuffer')))
  console.log(`${Object.keys(paper.retrySet).length} retries, ${doc.getNumberOfPages()} pages -> ${file}`)
}

main()
