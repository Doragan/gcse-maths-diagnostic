import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// badfd8eb: add a diagram of the two similar cuboids.
//
// Geometry is FIXED and the labels are parametric — the house pattern (see the
// trough question 2e5dd32f and scripts/add-area-solid-diagrams.ts). Drawing to
// true scale would mean redrawing for every draw and would distort badly at
// n = 3, so B is drawn ~1.6x A and the diagram carries the standard "Not drawn
// accurately" note.
//
// The <svg> is aria-hidden, so the prose keeps every value: the diagram is a
// visual aid, never the only source of a number.
const ID = 'badfd8eb-5fe8-43d3-af66-3b652c21d82c'

const F = 'system-ui,-apple-system,sans-serif'
const K = '#374151'      // edges + labels
const HID = '#9ca3af'    // hidden edges

/** Oblique-projection cuboid: (x,y) is the front-top-left corner. */
function cuboid(x: number, y: number, w: number, h: number, dx: number, dy: number): string {
  const FTL = [x, y], FTR = [x + w, y], FBR = [x + w, y + h], FBL = [x, y + h]
  const BTL = [x + dx, y - dy], BTR = [x + w + dx, y - dy]
  const BBR = [x + w + dx, y + h - dy], BBL = [x + dx, y + h - dy]
  const p = (pts: number[][]) => pts.map(q => q.join(',')).join(' ')
  const dash = (a: number[], b: number[]) =>
    `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${HID}" stroke-width="1.1" stroke-dasharray="4 3"/>`
  return (
    // Hidden edges first, so the solid faces paint over them.
    dash(BBL, BTL) + dash(BBL, BBR) + dash(BBL, FBL) +
    `<polygon points="${p([FTL, BTL, BTR, FTR])}" fill="#eff6ff" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<polygon points="${p([FTR, BTR, BBR, FBR])}" fill="#bfdbfe" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<polygon points="${p([FTL, FTR, FBR, FBL])}" fill="#dbeafe" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"/>`
  )
}

// size/weight are parameters rather than an appended attribute string — an
// appended `font-size` would REDEFINE the attribute, which browsers tolerate
// but is invalid XML (the harness's --svg rasteriser rejects it outright).
const label = (x: number, y: number, anchor: string, text: string, size = 12, weight = '400') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${K}" font-family="${F}">${text}</text>`

// Layout is spaced so no label is clipped by the viewBox or collides with its
// neighbour (a label reaching ~40 units at font-size 12):
//   A height label  12..52   | A  58..120  | A depth label 126..166
//   B height label 188..228  | B 234..326  | right margin to 380
// Bottoms aligned at y=140 so the two solids sit on a common baseline.
const SVG =
  '<div style="text-align:center;margin:6px 0 4px">'
  + '<svg viewBox="0 0 380 196" style="width:100%;max-width:360px;display:block;margin:0 auto" aria-hidden="true">'
  + cuboid(58, 100, 44, 40, 18, 14)
  + cuboid(234, 58, 66, 82, 26, 20)
  // A's three dimensions.
  + label(80, 157, 'middle', '{{a}} cm')                 // front bottom edge
  + label(126, 143, 'start', '{{b}} cm')                 // receding bottom edge
  + label(52, 124, 'end', '{{c}} cm')                    // left vertical edge
  // B: only the height is known — the rest is what the student works out.
  + label(228, 103, 'end', '{{n*c}} cm')
  // Solid names.
  + label(89, 181, 'middle', 'A', 14, '700')
  + label(274, 181, 'middle', 'B', 14, '700')
  + '</svg></div>'
  + '<p style="text-align:center;font-size:12px;color:#6b7280;margin:0 0 12px;font-style:italic">Not drawn accurately</p>'

const STEM =
  '<p>Two solid blocks, <strong>A</strong> and <strong>B</strong>, are mathematically similar and are made of the same material.</p>'
  + SVG
  + '<p>Block <strong>A</strong> is a cuboid with a base measuring <strong>{{a}} cm</strong> by <strong>{{b}} cm</strong>, and a height of <strong>{{c}} cm</strong>. Its mass is <strong>{{d*a*b*c}} g</strong>.</p>'
  + '<p>Block <strong>B</strong> has a height of <strong>{{n*c}} cm</strong>.</p>'
  + '<p>Work out the mass of block <strong>B</strong>.</p>'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions')
    .select('parameters, answer_template, traps, explanation').eq('id', ID).single()
  if (error) throw error

  // Balanced-tag sanity on the raw template. A malformed SVG renders as a
  // blank box rather than throwing, so nothing else would catch it.
  for (const tag of ['div', 'svg', 'text', 'p']) {
    const open = (SVG.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length
    const close = (SVG.match(new RegExp(`</${tag}>`, 'g')) ?? []).length
    if (open !== close) throw new Error(`unbalanced <${tag}>: ${open} open, ${close} close`)
  }
  // Self-closing shapes must each end in "/>".
  for (const tag of ['polygon', 'line']) {
    const open = (SVG.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length
    const selfClosed = (SVG.match(new RegExp(`<${tag}[^>]*/>`, 'g')) ?? []).length
    if (open !== selfClosed) throw new Error(`<${tag}>: ${open} opened but ${selfClosed} self-closed`)
  }

  let combos = 0
  for (let a = 2; a <= 5; a++) for (let b = 2; b <= 5; b++) for (let c = 3; c <= 6; c++) {
    if (c === a) continue // the cube-blocking constraint
    for (let n = 2; n <= 3; n++) for (let d = 2; d <= 5; d++) {
      const v = { a, b, c, n, d }
      const stem = evaluateTemplate(STEM, v)
      if (/\[error|\{\{/.test(stem)) throw new Error(`${JSON.stringify(v)}: stem render error`)

      // Every value the student needs must survive in the PROSE, since the
      // svg is aria-hidden. Strip the svg, then check.
      const prose = stem.replace(/<svg[\s\S]*?<\/svg>/g, '')
      for (const [what, val] of [['A width', a], ['A depth', b], ['A height', c],
                                 ['A mass', d * a * b * c], ['B height', n * c]] as [string, number][]) {
        if (!new RegExp(`\\b${val}\\b`).test(prose)) {
          throw new Error(`${JSON.stringify(v)}: ${what} (${val}) missing from prose once the svg is removed`)
        }
      }

      // Previous invariants must survive the stem change.
      const answer = evaluateTemplate(data.answer_template, v).replace(/ g$/, '')
      const trapVals = (data.traps as any[]).map(t => evaluateTemplate(t.answer_template, v))
      const all = [answer, ...trapVals]
      if (new Set(all).size !== all.length) throw new Error(`${JSON.stringify(v)}: value collision [${all}]`)
      if (Number(answer) !== d * (n * a) * (n * b) * (n * c)) throw new Error(`${JSON.stringify(v)}: routes disagree`)
      combos++
    }
  }
  console.log(`verified across all ${combos} combos: stem renders clean, every value still present in the prose`)
  console.log('  (svg is aria-hidden), traps distinct, routes agree.')

  const { error: upErr } = await supabase.from('questions')
    .update({ question_template: STEM }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: added a two-cuboid diagram.`)
}

main().catch(e => { console.error(e); process.exit(1) })
