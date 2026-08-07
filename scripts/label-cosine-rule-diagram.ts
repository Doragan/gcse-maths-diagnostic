import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// 6aa8982b (cosine_rule): the diagram labelled its sides with bare letters
// a, b, c, so every actual length lived only in the prose. Put the lengths on
// the diagram as "a = 8 cm" etc — keeping the letter as well as the value, so
// the prose and the picture still map onto each other — and mark the angle
// being asked for with an arc and a "?" at C.
//
// The old triangle was also drawn ISOSCELES (both slanted sides 127.8) while
// the parameters force a, b and c to be pairwise distinct, so the picture
// contradicted the question. The new one is clearly scalene (155/139/118) and
// its apex is 73.4°, inside the 42.8°–83.3° that angle C actually spans
// (verified: it is never obtuse), so the shape stays representative.
const ID = '6aa8982b-8e4a-477f-8456-1187d49d149f'

const F = 'system-ui,-apple-system,sans-serif'
const K = '#374151'
const BLUE = '#2563eb'

// A = bottom-left, B = bottom-right, C = apex. Side a is opposite A (so it is
// BC, the right edge), b is opposite B (AC, the left edge), c is opposite C
// (AB, the base) — matching how the prose names them.
const A = [45, 140], B = [200, 140], C = [140, 38]

const line = (p: number[], q: number[]) =>
  `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${K}" stroke-width="2"/>`
const text = (x: number, y: number, anchor: string, s: string, fill = K, weight = '400', size = 12) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="${F}">${s}</text>`

// Angle arc at C, swept between the two edges leaving it.
const unit = (from: number[], to: number[]) => {
  const v = [to[0] - from[0], to[1] - from[1]]
  const m = Math.hypot(v[0], v[1])
  return [v[0] / m, v[1] / m]
}
const uA = unit(C, A), uB = unit(C, B)
const R = 24
const pA = [C[0] + uA[0] * R, C[1] + uA[1] * R]
const pB = [C[0] + uB[0] * R, C[1] + uB[1] * R]
const r1 = (n: number) => Math.round(n * 10) / 10
// Sweep 1 goes from the B edge round to the A edge (screen y is down).
const arc = `<path d="M${r1(pB[0])},${r1(pB[1])} A${R},${R} 0 0 1 ${r1(pA[0])},${r1(pA[1])}" fill="none" stroke="${BLUE}" stroke-width="1.6"/>`
// "?" sits on the angle bisector, inside the triangle.
const bis = [uA[0] + uB[0], uA[1] + uB[1]]
const bm = Math.hypot(bis[0], bis[1])
const qx = C[0] + (bis[0] / bm) * 40, qy = C[1] + (bis[1] / bm) * 40

const SVG =
  '<div style="text-align:center;margin:4px 0 4px">'
  + '<svg viewBox="0 0 275 178" style="width:100%;max-width:270px;display:block;margin:0 auto" aria-hidden="true">'
  + line(A, B) + line(A, C) + line(B, C)
  + arc
  // Vertices.
  + text(A[0] - 7, A[1] + 13, 'end', 'A', BLUE, '600', 13)
  + text(B[0] + 7, B[1] + 13, 'start', 'B', BLUE, '600', 13)
  + text(C[0], C[1] - 10, 'middle', 'C', BLUE, '600', 13)
  // The angle being asked for.
  + text(r1(qx), r1(qy) + 4, 'middle', '?', BLUE, '700', 13)
  // Sides — letter AND value, so the prose still maps onto the picture.
  + text(180, 88, 'start', 'a = {{a}} cm')
  + text(84, 84, 'end', 'b = {{b}} cm')
  + text(122, 162, 'middle', 'c = {{c}} cm')
  + '</svg></div>'
  + '<p style="text-align:center;font-size:12px;color:#6b7280;margin:0 0 12px;font-style:italic">Not drawn accurately</p>'

// The prose keeps every value: the svg is aria-hidden, so it is never the only
// place a number appears.
const STEM = SVG
  + '<p>In triangle ABC, side <em>a</em> = <strong>{{a}} cm</strong>, side <em>b</em> = <strong>{{b}} cm</strong>, and side <em>c</em> = <strong>{{c}} cm</strong>.</p>'
  + '<p>Find angle C. Give your answer to 2 decimal places.</p>'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  for (const tag of ['div', 'svg', 'text', 'p']) {
    const open = (SVG.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length
    const close = (SVG.match(new RegExp(`</${tag}>`, 'g')) ?? []).length
    if (open !== close) throw new Error(`unbalanced <${tag}>: ${open} open, ${close} close`)
  }
  for (const tag of ['line', 'path']) {
    const open = (SVG.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length
    const selfClosed = (SVG.match(new RegExp(`<${tag}[^>]*/>`, 'g')) ?? []).length
    if (open !== selfClosed) throw new Error(`<${tag}>: ${open} opened, ${selfClosed} self-closed`)
  }

  let combos = 0
  for (let a = 7; a <= 10; a++) for (let b = 7; b <= 10; b++) for (let c = 7; c <= 10; c++) {
    if (a === b || a === c || b === c) continue
    const v = { a, b, c }
    const stem = evaluateTemplate(STEM, v)
    if (/\[error|\{\{/.test(stem)) throw new Error(`${JSON.stringify(v)}: stem render error`)
    // Each length must survive in the PROSE with the svg stripped out.
    const prose = stem.replace(/<svg[\s\S]*?<\/svg>/g, '')
    for (const [name, val] of [['a', a], ['b', b], ['c', c]] as [string, number][]) {
      if (!new RegExp(`${name}</em> = <strong>${val} cm`).test(prose)) {
        throw new Error(`${JSON.stringify(v)}: side ${name} (${val}) missing from the prose`)
      }
    }
    combos++
  }
  console.log(`verified across all ${combos} (a,b,c) combos: renders clean, every length still in the prose.`)

  const { error } = await supabase.from('questions').update({ question_template: STEM }).eq('id', ID)
  if (error) throw error
  console.log(`Updated ${ID}: lengths + angle marker on the diagram.`)
}

main().catch(e => { console.error(e); process.exit(1) })
