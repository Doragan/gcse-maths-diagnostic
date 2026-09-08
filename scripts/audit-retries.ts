/**
 * Audit every paper's retrySet for the defects a person found by reading one.
 *
 *   npx tsx scripts/audit-retries.ts
 *
 * WHY THIS EXISTS. Retry questions have no automated gate — no parameters, no
 * answer_template, no grader — so verify-question and audit-bank cannot see
 * them at all (docs/writing-retry-questions.md, "Checking it"). The only check
 * is a person reading the review PDF, and a person reads one paper, not
 * fourteen. Every rule below is a defect a review of AQA 1F and 2F June 2025
 * actually turned up; this generalises that reading to the other thirteen
 * papers, so the same mistake does not have to be found twice.
 *
 * Reports only — it changes nothing.
 */
import { PAPERS } from '../lib/demoPapers/index'

type Hit = { paper: string; id: string; note: string }
const hits: Record<string, Hit[]> = {}
const add = (kind: string, paper: string, id: string, note: string) =>
  (hits[kind] ??= []).push({ paper, id, note })

const short = (s: string) => s.replace('aqa-8300-', '').replace('edexcel-', 'edx-').replace('-jun25', '').replace('-nov24', '~n24')

for (const p of Object.values(PAPERS)) {
  const byId = new Map(p.questions.map(q => [q.id, q]))
  for (const [id, r] of Object.entries(p.retrySet)) {
    const q = byId.get(id)!
    const lines = r.question.split('\n')
    const options = lines.filter(l => l.trim().startsWith('[')).map(l => l.replace(/^\s*\[\s*\]\s*/, '').trim())
    const ans = (r.answer ?? '').trim()

    // A. A tick list whose answer is not one of the options, word for word.
    if (options.length && ans && !options.some(o => o.toLowerCase() === ans.toLowerCase())) {
      add('tick list: answer is not one of the options', p.id, id, `answer "${ans}" vs [${options.join(' | ')}]`)
    }

    // B. Says "tick" but offers nothing to tick, and does not ask for working
    //    instead (the deliberate rephrase).
    if (/\btick\b/i.test(r.question) && !options.length &&
        !/show working|give a reason|show your working/i.test(r.question)) {
      add('says "tick" with no boxes', p.id, id, lines[lines.length - 1].slice(0, 70))
    }

    // C. Refers to a table it does not show. A real table here is a following
    //    line carrying a colon or several spaces of alignment.
    // A real <table> block counts, obviously. The looser test behind it is for
    // data still set as aligned text, which is what this rule was written to
    // catch before there was a table to render.
    if (/\b(a|the) table shows\b/i.test(r.question) &&
        !r.question.includes('<table>') &&
        !lines.some(l => /: |\s{2,}/.test(l) && !/table shows/i.test(l))) {
      add('mentions a table it does not show', p.id, id, lines[0].slice(0, 70))
    }

    // D. A retry that rewrites a WHOLE item, labelled with only part of that
    //    item's compound skill. It mirrors the original, so it demands the
    //    original's skills — "3(b² − 2b) when b = 5" labelled Substitution is
    //    under-reporting the Indices in it.
    //
    //    A LETTERED PART of a multi-part item is exempt: there the compound
    //    label describes the question as a whole and each part legitimately
    //    tests one of its skills.
    const siblings = Object.keys(p.retrySet)
      .filter(k => (k.replace(/[a-z]+$/i, '') || k) === (id.replace(/[a-z]+$/i, '') || id)).length
    const isPart = /[a-z]$/i.test(id) && siblings > 1
    if (!isPart && q.skill.includes(' + ') && !r.skill.includes(' + ') && q.skill !== r.skill) {
      add('skill label drops part of the item\'s', p.id, id, `retry "${r.skill}" vs item "${q.skill}"`)
    }

    // E. Foundation exact trig away from 0° and 90°.
    if (/exact trig/i.test(q.skill) && /foundation/i.test(p.subtitle) &&
        /\b(sin|cos|tan)\s*\d+/i.test(r.question) && !/\b(sin|cos|tan)\s*(0|90)\b/i.test(r.question)) {
      add('Foundation exact trig away from 0°/90°', p.id, id, r.question.split('\n')[0].slice(0, 60))
    }

    // F. An estimation question whose roundings do not all go the same way —
    //    the student cannot then know the direction without evaluating.
    if (/1 significant figure/i.test(r.question) && /overestimate|underestimate/i.test(r.question + ans)) {
      const nums = [...r.question.matchAll(/\d+\.\d+/g)].map(m => Number(m[0]))
      const dirs = new Set(nums.map(n => {
        const p1 = Number(n.toPrecision(1))
        return p1 === n ? 'same' : p1 < n ? 'down' : 'up'
      }))
      if (dirs.size > 1) add('estimate: roundings go both ways', p.id, id, `${nums.join(', ')} -> ${[...dirs].join('/')}`)
    }
  }

  // ── Rules from the 2F read, which was mostly about FIGURES ───────────────
  for (const [id, r] of Object.entries(p.retrySet)) {
    const q = byId.get(id)!
    const d = r.diagram

    // H. The item needs a picture and the retry has none. 2F 19 was tagged
    //    "tree-diagram multi-cell entry" and was set as a wall of text.
    //
    //    "STATIC DIAGRAM SUPPORTED" DOES NOT COUNT. That note means the app
    //    COULD show a picture, not that the question needs one — "a triangle
    //    with a hypotenuse of 15 cm and an angle of 38°" is fully specified in
    //    words, and 19 questions like it were being reported as defects. What
    //    counts is a figure that CARRIES data the sentence cannot: a tree, a
    //    pie chart, a Venn, a pictogram, a pattern to count.
    const loadBearing = /\btree\b|pie chart|venn|pictogram|bar chart|from the diagram|pattern diagram/i
    if (!d && (q.visual || loadBearing.test(q.desc ?? ''))) {
      add('item wants a figure, retry has none', p.id, id, q.desc || 'visual: true')
    }

    if (!d) continue

    // I. A BAR CHART with no gaps is a histogram, which means something else.
    if (d.mode === 'bars' && (d.barWidth ?? 1) >= 1) {
      add('bar chart drawn as a histogram (no gaps)', p.id, id, 'set barWidth ~0.62')
    }

    // J. Grid squares under a figure that is not a grid question. 2F 26 was a
    //    trigonometry triangle ruled like graph paper.
    //
    //    NOTHING TO DRAW is the test, not the mode. "Complete the kite on the
    //    grid", "enlarge by scale factor 1/3", "shade the region" are all
    //    polygons whose squares ARE the question, and every one of them has
    //    canonical `elements` because the student draws something. A figure
    //    with none is a labelled picture to read, and squares under it are
    //    furniture the exam does not print.
    if (d.mode === 'polygon' && d.showGrid !== false &&
        d.elements.length === 0 && d.showAxes === false) {
      add('shape drawn on squares it does not use', p.id, id, 'set showGrid: false')
    }

    // K. A figure that CONTRADICTS its own question: an angle other than 90°
    //    marked on a shape every one of whose corners is a right angle. 2F
    //    10(a) labelled a rectangle 68°.
    const angles = (d.labels ?? []).filter(l => /^\d+°$/.test(l.text)).map(l => parseInt(l.text))
    if (angles.some(a => a !== 90)) {
      const polys = [...(d.background ?? '').matchAll(/<polygon points="([^"]+)"/g)].map(m => m[1])
      const axisAligned = polys.length > 0 && polys.every(pts => {
        const v = pts.trim().split(/\s+/).map(pt => pt.split(',').map(Number))
        return v.every((a, i) => {
          const b = v[(i + 1) % v.length]
          return Math.abs(a[0] - b[0]) < 1e-9 || Math.abs(a[1] - b[1]) < 1e-9
        })
      })
      if (axisAligned) {
        add('figure contradicts its own question', p.id, id,
          `marks ${angles.filter(a => a !== 90).join(', ')}° on a shape with only right angles`)
      }
    }
  }

  // L. Parts of one question carrying DIFFERENT figures. On the paper they read
  //    off one picture, and the sheet only draws a shared diagram once when the
  //    two match exactly — so near-identical copies print twice.
  const byQuestion = new Map<string, string[]>()
  for (const id of Object.keys(p.retrySet)) {
    const n = id.replace(/[a-z]+$/i, '') || id
    ;(byQuestion.get(n) ?? byQuestion.set(n, []).get(n)!).push(id)
  }
  for (const [n, ids] of byQuestion) {
    const withGrid = ids.filter(i => p.retrySet[i].diagram)
    if (withGrid.length < 2) continue
    // Compare ONLY what feedbackPdf's sameGrid() compares — the printed
    // figure. `elements` is the ANSWER and is rightly different per part:
    // 1F 4(a) and (b) read off one conversion graph but mark different points
    // on it, and 1H 21(a) and (b) transform one curve two different ways.
    const printed = new Set(withGrid.map(i => {
      const g = p.retrySet[i].diagram!
      return JSON.stringify([g.background, g.mode, g.x, g.y, g.labels ?? null])
    }))
    const shapes = new Set(withGrid.map(i => p.retrySet[i].diagram!.background))
    if (shapes.size === 1 && printed.size > 1) {
      add('parts draw the same figure two different ways', p.id, n, withGrid.join(', '))
    }
  }

  // G. Sibling parts sharing a long opening that the sheet CANNOT lift out.
  //
  //    Sharing one is normal and fine: a multi-part question is set as a batch
  //    and wwwEbi's sharedStem() prints the shared scenario once above the
  //    parts. But it can only lift WHOLE LINES — half a hoisted sentence reads
  //    as a fragment. So a long overlap that does not reach a line break is
  //    the case a reader still meets twice, and only that is worth reporting.
  const groups = new Map<string, string[]>()
  for (const id of Object.keys(p.retrySet)) {
    const n = id.replace(/[a-z]+$/i, '') || id
    ;(groups.get(n) ?? groups.set(n, []).get(n)!).push(id)
  }
  for (const [n, ids] of groups) {
    if (ids.length < 2) continue
    const qs = ids.map(i => p.retrySet[i].question)
    let common = 0
    while (common < qs[0].length && qs.every(q => q[common] === qs[0][common])) common++
    const lifted = Math.max(qs[0].lastIndexOf('\n', common - 1), 0)
    if (common - lifted <= 40) continue
    // A WHOLE SENTENCE inside that overlap is the tell. It means a piece of
    // scenario is being restated under each part when it could have been set
    // once — the defect. Without one, the parts merely open with the same
    // words ("Write down the number from the card that is a…"), which is
    // parallel phrasing and exactly how the paper asks it.
    if (!['. ', '? ', '! '].some(m => qs[0].lastIndexOf(m, common - 1) > lifted)) continue
    add('shared opening the sheet cannot lift out', p.id, n,
      `${common - lifted} chars past the last line break: "${qs[0].slice(lifted, lifted + 50).trim()}…"`)
  }
}

for (const [kind, list] of Object.entries(hits)) {
  console.log(`\n### ${kind}  (${list.length})`)
  for (const h of list.slice(0, 14)) console.log(`  ${short(h.paper).padEnd(10)} ${h.id.padEnd(5)} ${h.note}`)
  if (list.length > 14) console.log(`  … and ${list.length - 14} more`)
}
if (!Object.keys(hits).length) console.log('no hits')
