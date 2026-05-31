import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const F = 'system-ui,-apple-system,sans-serif'
const K = '#374151'
const B = '#2563eb'

function wrap(inner: string, viewBox: string, maxW = 240): string {
  return (
    `<div style="text-align:center;margin:4px 0 16px">` +
    `<svg viewBox="${viewBox}" style="width:100%;max-width:${maxW}px;display:block;margin:0 auto" aria-hidden="true">` +
    inner +
    `</svg></div>`
  )
}

// ── parallelogram ─────────────────────────────────────────────────────────────
// A(35,130) B(175,130) C(200,45) D(60,45)
// Dashed perpendicular height from D(60,45) to foot (60,130), right-angle at foot.
function parallelogram(): string {
  return wrap(
    `<polygon points="35,130 175,130 200,45 60,45" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Dashed height line
    `<line x1="60" y1="45" x2="60" y2="130" stroke="${K}" stroke-width="1.3" stroke-dasharray="5 3"/>` +
    // Right-angle marker at foot (60,130) — opens upward and rightward
    `<path d="M60,122 L68,122 L68,130" fill="none" stroke="${K}" stroke-width="1.3"/>` +
    // Labels
    `<text x="108" y="148" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">b</text>` +
    `<text x="50"  y="90"  text-anchor="end"    font-size="13" fill="${K}" font-style="italic" font-family="${F}">h</text>`,
    '0 0 230 162'
  )
}

// ── trapezium ─────────────────────────────────────────────────────────────────
// Bottom A(25,130) B(200,130) → label b.  Top D(55,45) C(170,45) → label a.
// Dashed perpendicular height at x=112 from (112,45) to (112,130).
function trapezium(): string {
  return wrap(
    `<polygon points="25,130 200,130 170,45 55,45" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Dashed height line
    `<line x1="112" y1="45" x2="112" y2="130" stroke="${K}" stroke-width="1.3" stroke-dasharray="5 3"/>` +
    // Right-angle marker at foot (112,130)
    `<path d="M112,122 L120,122 L120,130" fill="none" stroke="${K}" stroke-width="1.3"/>` +
    // Labels
    `<text x="113" y="37"  text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">a</text>` +
    `<text x="113" y="148" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">b</text>` +
    `<text x="122" y="92"  text-anchor="start"  font-size="13" fill="${K}" font-style="italic" font-family="${F}">h</text>`,
    '0 0 230 162'
  )
}

// ── sector ───────────────────────────────────────────────────────────────────
// Centre (75,145) r=90, sector angle ≈75° opening to upper-right.
// Start ray at 0° → (165,145).  End at 75° CCW → (75+23.3,145−86.9) = (98,58).
// Angle arc r=26: M101,145 A26,26 0 0 1 82,119   (sweep=1)
// θ label at bisector 37.5°: (75+28cos37.5°, 145−28sin37.5°) = (97,128)
// r label below right radius midpoint: (120,145) → text at (120,163)
function sector(): string {
  return wrap(
    // Sector (lightly filled)
    `<path d="M75,145 L165,145 A90,90 0 0 1 98,58 Z" fill="#eff6ff" stroke="${K}" stroke-width="1.8"/>` +
    // Angle arc at centre
    `<path d="M101,145 A26,26 0 0 1 82,119" fill="none" stroke="${K}" stroke-width="1.3"/>` +
    // Labels
    `<text x="97"  y="132" text-anchor="start"  font-size="13" fill="${K}" font-style="italic" font-family="${F}">θ</text>` +
    `<text x="121" y="163" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">r</text>`,
    '0 0 220 170'
  )
}

// ── surface area of a cone ────────────────────────────────────────────────────
// Apex (110,25). Base ellipse cx=110, cy=145, rx=75, ry=18.
// Left side (35,145)→(110,25). Right side (185,145)→(110,25).
// Slant height label "l" along right side (midpoint ≈ (147,85)).
// Radius label "r" along base centre→edge (110,145)→(185,145).
function coneSA(): string {
  return wrap(
    // Back (dashed) arc of base ellipse
    `<path d="M35,145 A75,18 0 0 0 185,145" fill="none" stroke="${K}" stroke-width="1.3" stroke-dasharray="5 3"/>` +
    // Cone sides
    `<line x1="110" y1="25" x2="35"  y2="145" stroke="${K}" stroke-width="1.8"/>` +
    `<line x1="110" y1="25" x2="185" y2="145" stroke="${K}" stroke-width="1.8"/>` +
    // Front arc of base ellipse
    `<path d="M35,145 A75,18 0 0 1 185,145" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Radius line (centre to right edge of base)
    `<line x1="110" y1="145" x2="185" y2="145" stroke="${K}" stroke-width="1.3" stroke-dasharray="4 3"/>` +
    // Labels
    `<text x="160" y="82"  text-anchor="start"  font-size="13" fill="${K}" font-style="italic" font-family="${F}">l</text>` +
    `<text x="147" y="163" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">r</text>`,
    '0 0 220 172'
  )
}

// ── surface area of a cylinder ────────────────────────────────────────────────
// Top ellipse cx=110 cy=38 rx=65 ry=15. Bottom ellipse cy=145.
// Sides: x=45 and x=175, y=38 to y=145.
// Radius "r" at top. Height "h" on right side.
function cylinderSA(): string {
  return wrap(
    // Top ellipse (full, solid)
    `<ellipse cx="110" cy="38" rx="65" ry="15" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Sides
    `<line x1="45"  y1="38" x2="45"  y2="145" stroke="${K}" stroke-width="1.8"/>` +
    `<line x1="175" y1="38" x2="175" y2="145" stroke="${K}" stroke-width="1.8"/>` +
    // Bottom back arc (dashed)
    `<path d="M45,145 A65,15 0 0 0 175,145" fill="none" stroke="${K}" stroke-width="1.3" stroke-dasharray="5 3"/>` +
    // Bottom front arc (solid)
    `<path d="M45,145 A65,15 0 0 1 175,145" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Radius line at top
    `<line x1="110" y1="38" x2="175" y2="38" stroke="${K}" stroke-width="1.3" stroke-dasharray="4 3"/>` +
    // Height bracket: small ticks at top and bottom of right side
    `<line x1="182" y1="38"  x2="190" y2="38"  stroke="${K}" stroke-width="1.3"/>` +
    `<line x1="182" y1="145" x2="190" y2="145" stroke="${K}" stroke-width="1.3"/>` +
    `<line x1="186" y1="38"  x2="186" y2="145" stroke="${K}" stroke-width="1.3"/>` +
    // Labels
    `<text x="142" y="28"  text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">r</text>` +
    `<text x="200" y="96"  text-anchor="start"  font-size="13" fill="${K}" font-style="italic" font-family="${F}">h</text>`,
    '0 0 230 170'
  )
}

// ── volume of cone (and pyramid) ──────────────────────────────────────────────
// Apex (110,25). Base ellipse cx=110, cy=148, rx=75, ry=18.
// Dashed vertical height line from apex (110,25) to base centre (110,148).
// Right-angle marker at base centre where height meets base.
// Radius "r" from centre (110,148) to right edge (185,148).
function coneVolume(): string {
  return wrap(
    // Back arc of base
    `<path d="M35,148 A75,18 0 0 0 185,148" fill="none" stroke="${K}" stroke-width="1.3" stroke-dasharray="5 3"/>` +
    // Cone sides
    `<line x1="110" y1="25" x2="35"  y2="148" stroke="${K}" stroke-width="1.8"/>` +
    `<line x1="110" y1="25" x2="185" y2="148" stroke="${K}" stroke-width="1.8"/>` +
    // Front arc of base
    `<path d="M35,148 A75,18 0 0 1 185,148" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Dashed perpendicular height
    `<line x1="110" y1="25" x2="110" y2="148" stroke="${K}" stroke-width="1.3" stroke-dasharray="5 3"/>` +
    // Right-angle marker at base centre (opens right and upward)
    `<path d="M110,140 L118,140 L118,148" fill="none" stroke="${K}" stroke-width="1.3"/>` +
    // Dashed radius line
    `<line x1="110" y1="148" x2="185" y2="148" stroke="${K}" stroke-width="1.3" stroke-dasharray="4 3"/>` +
    // Labels
    `<text x="98"  y="90"  text-anchor="end"    font-size="13" fill="${K}" font-style="italic" font-family="${F}">h</text>` +
    `<text x="147" y="165" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">r</text>`,
    '0 0 220 172'
  )
}

// ─── Diagram map ─────────────────────────────────────────────────────────────

const DIAGRAMS: Record<string, string> = {
  '33d28af2-ac58-4990-850b-bfd3d7c09c01': parallelogram(),   // area_of_parallelograms
  '683e0245-2cbf-4b91-900f-a44a39f3bd03': trapezium(),        // area_of_a_trapezium
  '51d2e490-b55f-479c-aae9-6422af1a4522': sector(),           // sector_calculations
  '0799c17c-b016-4728-ba84-91e1239244f7': coneSA(),           // surface_area_of_a_cone
  'f94db3f3-04b5-4a1d-9ea8-684143c530da': cylinderSA(),       // surface_area_of_a_cylinder
  'e6fc8f3f-6c7d-4476-9efa-9dc4c8675e58': coneVolume(),       // volume_of_a_pyramid_and_cone
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Adding area and solid diagrams...\n')

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

    console.log(`✓  ${String(data.skill_ids[0]).padEnd(40)}  ${id.slice(0, 8)}`)
  }

  console.log('\nDone.')
}

main()
