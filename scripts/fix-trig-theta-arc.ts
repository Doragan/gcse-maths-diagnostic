import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const F = 'system-ui,-apple-system,sans-serif'
const K = '#374151'
const B = '#2563eb'

function wrap(svgInner: string, viewBox: string): string {
  return (
    `<div style="text-align:center;margin:4px 0 16px">` +
    `<svg viewBox="${viewBox}" style="width:100%;max-width:240px;display:block;margin:0 auto" aria-hidden="true">` +
    svgInner +
    `</svg></div>`
  )
}

// Right-angled triangle with an angle arc at the θ vertex.
//
// Vertices:  right-angle (65,132)  •  θ (190,132)  •  apex (65,28)
//
// Angle arc at θ=(190,132):
//   Hyp direction from θ: toward (65,28) = (-125,−104)/163 ≈ (−0.766,−0.638)
//   18px along base (leftward)  → (172,132)
//   18px along hyp direction    → (176,121)
//   Arc M172,132 A18,18 0 0 0 176,121  (sweep=0, CCW in SVG → bulges into angle interior)
//
// θ label at 28px along bisector dir (−0.940,−0.340) from θ → (164,122)
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
    // Sides
    `<line x1="65" y1="132" x2="190" y2="132" stroke="${K}" stroke-width="2"/>` +
    `<line x1="65" y1="132" x2="65"  y2="28"  stroke="${K}" stroke-width="2"/>` +
    `<line x1="65" y1="28"  x2="190" y2="132" stroke="${hc}" stroke-width="2.5"/>` +
    // Right-angle marker
    `<path d="M65,122 L75,122 L75,132" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Angle arc at θ vertex — sweep=0 (CCW in SVG) curves through the angle interior
    `<path d="M172,132 A18,18 0 0 0 176,121" fill="none" stroke="${tc}" stroke-width="1.4"/>` +
    // Side labels
    (opts.adjLabel ? `<text x="128" y="149" text-anchor="middle" font-size="13" fill="${K}"  font-family="${F}">${opts.adjLabel}</text>` : '') +
    (opts.oppLabel ? `<text x="54"  y="83"  text-anchor="end"    font-size="13" fill="${K}"  font-family="${F}">${opts.oppLabel}</text>` : '') +
    (opts.hypLabel ? `<text x="140" y="66"  text-anchor="middle" font-size="13" fill="${hc}"${opts.hypBlue ? ' font-weight="600"' : ''} font-family="${F}">${opts.hypLabel}</text>` : '') +
    // θ label — just inside the arc along the bisector direction
    `<text x="164" y="125" text-anchor="middle" font-size="13" fill="${tc}"${tw} font-style="italic" font-family="${F}">${opts.thetaLabel}</text>`,
    '0 0 240 158',
  )
}

// Strip whatever SVG prefix was prepended and return only the original <p>...</p> question body.
function stripSvgPrefix(template: string): string {
  const pIdx = template.indexOf('<p>')
  return pIdx >= 0 ? template.slice(pIdx) : template
}

const FIXES: Record<string, string> = {
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
}

async function main() {
  console.log('Fixing trig θ arc...\n')

  for (const [id, newPrefix] of Object.entries(FIXES)) {
    const { data, error: fetchErr } = await supabase
      .from('questions')
      .select('skill_ids, question_template')
      .eq('id', id)
      .single()

    if (fetchErr || !data) {
      console.error(`✗ fetch failed  ${id}:`, fetchErr?.message)
      process.exit(1)
    }

    const cleaned = stripSvgPrefix(data.question_template)
    const { error: updateErr } = await supabase
      .from('questions')
      .update({ question_template: newPrefix + cleaned })
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
