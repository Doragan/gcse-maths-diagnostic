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
 *   • the item's label, marks and skill — the retry should demand the same
 *     number of steps as the original
 *   • THE ORIGINAL'S `desc` — the only record in this repo of what the real
 *     question asked, and so the only way to judge whether the rewrite is
 *     faithful without the question paper open
 *   • the question, its answer, and the working
 *   • the grid, where the retry carries one, rasterised at print resolution
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
import { toPdfSafe } from '../lib/papers/feedbackPdf'
import { buildGridSvg } from '../lib/questions/gridSvg'

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
  const text = (s: string, size: number, weight: 'normal' | 'bold', indent = 0, grey = false) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', weight)
    doc.setTextColor(...(grey ? [110, 110, 110] : [0, 0, 0]) as [number, number, number])
    for (const line of doc.splitTextToSize(toPdfSafe(s), WIDTH - indent) as string[]) {
      ensure(size * 0.5)
      doc.text(line, MARGIN_X + indent, y)
      y += size * 0.42 + 1.4
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
  y += 3
  text(
    'ORIGINAL ASKED is the audit\'s note on the real question — the repo holds no exam text, so it is the only ' +
    'thing here to judge faithfulness against. Check that the retry demands the same steps, not that it looks similar.',
    8.5, 'normal', 0, true,
  )
  y += 5

  // ── One block per retry, in paper order ───────────────────────────────────
  for (const q of paper.questions) {
    const r = paper.retrySet[q.id]
    if (!r) continue

    ensure(34)
    doc.setDrawColor(200)
    doc.line(MARGIN_X, y - 3, MARGIN_X + WIDTH, y - 3)

    text(`${q.label}   ${q.marks} mark${q.marks === 1 ? '' : 's'}   ·   ${r.skill}`, 10.5, 'bold')
    if (q.desc) text(`ORIGINAL ASKED: ${q.desc}`, 8.5, 'normal', 0, true)
    y += 1.5

    text(r.question, 10, 'normal')
    y += 1

    if (r.diagram) {
      const svg = buildGridSvg(r.diagram, { showCanonical: false })
      const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
      if (vb) {
        const w = 66, h = (Number(vb[2]) / Number(vb[1])) * 66
        ensure(h + 4)
        try {
          const sharp = (await import('sharp')).default
          const png = await sharp(Buffer.from(svg), { density: 220 })
            .flatten({ background: '#ffffff' }).png().toBuffer()
          doc.addImage(`data:image/png;base64,${png.toString('base64')}`, 'PNG', MARGIN_X + 4, y, w, h)
          y += h + 3
        } catch (e) {
          text(`[grid could not be rendered: ${e instanceof Error ? e.message : String(e)}]`, 9, 'normal', 4, true)
        }
      }
    }

    text(`Answer:  ${r.answer ?? '(none authored)'}`, 10, 'bold', 4)
    if (r.working) text(r.working, 9, 'normal', 4, true)
    y += 6
  }

  const file = join(outDir, `${paper.id}-retries-for-review.pdf`)
  writeFileSync(file, Buffer.from(doc.output('arraybuffer')))
  console.log(`${Object.keys(paper.retrySet).length} retries, ${doc.getNumberOfPages()} pages -> ${file}`)
}

main()
