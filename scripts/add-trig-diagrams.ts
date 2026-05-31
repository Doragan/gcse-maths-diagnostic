import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const F = 'system-ui,-apple-system,sans-serif'
const K = '#374151'   // ink – structural lines and given labels
const B = '#2563eb'   // blue – unknown side or angle

// ─── SVG helpers ────────────────────────────────────────────────────────────
//
// Right triangle layout  (viewBox 0 0 240 158)
//   right-angle at (65,132)  •  θ vertex at (190,132)  •  apex at (65,28)
//   adj = bottom horizontal  •  opp = left vertical  •  hyp = diagonal
//
// General triangle layout  (viewBox 0 0 230 155)
//   A(38,130) bottom-left  •  B(192,130) bottom-right  •  C(115,28) top
//   side a = BC (right)  •  side b = AC (left)  •  side c = AB (bottom)

function wrap(svgInner: string, viewBox: string): string {
  return (
    `<div style="text-align:center;margin:4px 0 16px">` +
    `<svg viewBox="${viewBox}" style="width:100%;max-width:240px;display:block;margin:0 auto" aria-hidden="true">` +
    svgInner +
    `</svg></div>`
  )
}

// Right-angled triangle
function rightTri(opts: {
  adjLabel?: string
  oppLabel?: string
  hypLabel?: string
  hypBlue?: boolean
  thetaLabel: string
  thetaBlue?: boolean
}): string {
  const hc = opts.hypBlue   ? B : K
  const tc = opts.thetaBlue ? B : K
  const tw = opts.thetaBlue ? ' font-weight="600"' : ''
  return wrap(
    // sides
    `<line x1="65" y1="132" x2="190" y2="132" stroke="${K}" stroke-width="2"/>` +
    `<line x1="65" y1="132" x2="65"  y2="28"  stroke="${K}" stroke-width="2"/>` +
    `<line x1="65" y1="28"  x2="190" y2="132" stroke="${hc}" stroke-width="2.5"/>` +
    // right-angle marker
    `<path d="M65,122 L75,122 L75,132" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // labels
    (opts.adjLabel ? `<text x="128" y="149" text-anchor="middle" font-size="13" fill="${K}"  font-family="${F}">${opts.adjLabel}</text>` : '') +
    (opts.oppLabel ? `<text x="54"  y="83"  text-anchor="end"    font-size="13" fill="${K}"  font-family="${F}">${opts.oppLabel}</text>` : '') +
    (opts.hypLabel ? `<text x="140" y="66"  text-anchor="middle" font-size="13" fill="${hc}"${opts.hypBlue ? ' font-weight="600"' : ''} font-family="${F}">${opts.hypLabel}</text>` : '') +
    `<text x="174" y="124" text-anchor="middle" font-size="14" fill="${tc}"${tw} font-style="italic" font-family="${F}">${opts.thetaLabel}</text>`,
    '0 0 240 158',
  )
}

// General triangle
function generalTri(opts: {
  labelA?: string           // angle label at bottom-left vertex
  labelB?: string           // angle label at bottom-right vertex
  labelC?: string           // label above top vertex
  sideA?: string            // label for BC (right side)
  sideB?: string            // label for AC (left side)
  sideC?: string            // label for AB (bottom)
  sideABlue?: boolean
  sideBBlue?: boolean
  sideCBlue?: boolean
  bottomDashed?: boolean
  angleArc?: boolean        // small arc at top vertex C (for included-angle questions)
}): string {
  const ac = opts.sideABlue ? B : K
  const bc = opts.sideBBlue ? B : K
  const cc = opts.sideCBlue ? B : K
  const dash = opts.bottomDashed ? ' stroke-dasharray="6 4"' : ''
  return wrap(
    // sides
    `<line x1="192" y1="130" x2="115" y2="28"  stroke="${ac}" stroke-width="2"/>` +
    `<line x1="38"  y1="130" x2="115" y2="28"  stroke="${bc}" stroke-width="2"/>` +
    `<line x1="38"  y1="130" x2="192" y2="130" stroke="${cc}" stroke-width="2"${dash}/>` +
    // optional angle arc at top vertex
    (opts.angleArc ? `<path d="M107,39 A14,14 0 0 1 123,39" fill="none" stroke="${K}" stroke-width="1.5"/>` : '') +
    // vertex labels
    (opts.labelA ? `<text x="62"  y="122" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">${opts.labelA}</text>` : '') +
    (opts.labelB ? `<text x="168" y="122" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">${opts.labelB}</text>` : '') +
    (opts.labelC ? `<text x="115" y="20"  text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">${opts.labelC}</text>` : '') +
    // side labels
    (opts.sideA ? `<text x="170" y="68"  text-anchor="start"  font-size="13" fill="${ac}"${opts.sideABlue ? ' font-weight="600"' : ''} font-family="${F}">${opts.sideA}</text>` : '') +
    (opts.sideB ? `<text x="60"  y="68"  text-anchor="end"    font-size="13" fill="${bc}"${opts.sideBBlue ? ' font-weight="600"' : ''} font-family="${F}">${opts.sideB}</text>` : '') +
    (opts.sideC ? `<text x="115" y="149" text-anchor="middle" font-size="13" fill="${cc}"${opts.sideCBlue ? ' font-weight="600"' : ''} font-family="${F}">${opts.sideC}</text>` : ''),
    '0 0 230 155',
  )
}

// ─── Diagram definitions ─────────────────────────────────────────────────────

const DIAGRAMS: Record<string, string> = {

  // trigonometry_missing_sides — given adj + θ, find hyp
  '28f4dd18-0cc0-4598-a8e8-85b8c8def293': rightTri({
    adjLabel: 'adj',
    hypLabel: 'hyp = ?',
    hypBlue: true,
    thetaLabel: 'θ',
  }),

  // trigonometry_missing_angles — given opp + hyp, find θ
  '2e343e27-1140-4d99-9888-3d0dac39479c': rightTri({
    oppLabel: 'opp',
    hypLabel: 'hyp',
    thetaLabel: 'θ = ?',
    thetaBlue: true,
  }),

  // sine_rule — given A, B, a; find b
  '042fa99f-d9e1-4528-adf6-2f3ca756ac12': generalTri({
    labelA: 'A',
    labelB: 'B',
    sideA: 'a',
    sideB: 'b = ?',
    sideBBlue: true,
  }),

  // cosine_rule — given a, b, angle C; find c
  'b544504a-fbfc-4c73-a203-c68e81910adb': generalTri({
    labelC: 'C',
    sideA: 'a',
    sideB: 'b',
    sideC: 'c = ?',
    sideCBlue: true,
  }),

  // area_of_triangle_sine — given a, b, included angle; find area
  '0959d8d5-aafa-41e3-a84a-03db28c5281e': generalTri({
    sideA: 'a',
    sideB: 'b',
    bottomDashed: true,
    angleArc: true,
  }),
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Adding diagrams to 5 trig questions...\n')

  for (const [id, svgPrefix] of Object.entries(DIAGRAMS)) {
    const { data, error: fetchErr } = await supabase
      .from('questions')
      .select('skill_ids, question_template')
      .eq('id', id)
      .single()

    if (fetchErr || !data) {
      console.error(`✗ fetch failed  ${id}:`, fetchErr?.message)
      process.exit(1)
    }

    const { error: updateErr } = await supabase
      .from('questions')
      .update({ question_template: svgPrefix + data.question_template })
      .eq('id', id)

    if (updateErr) {
      console.error(`✗ update failed ${id}:`, updateErr.message)
      process.exit(1)
    }

    console.log(`✓  ${String(data.skill_ids[0]).padEnd(38)}  ${id.slice(0, 8)}`)
  }

  console.log('\nDone.')
}

main()
