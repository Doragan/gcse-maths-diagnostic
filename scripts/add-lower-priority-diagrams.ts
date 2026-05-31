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

// ── bearings ──────────────────────────────────────────────────────────────────
// P=(100,115).  North arrow to (100,28).  PQ line at bearing ~130° CW from N.
// Bearing a° from North calculated as: x=sin(a°), y=−cos(a°) in SVG coords.
// Example 130°: direction (0.766,0.643) → Q=(100+75×0.766, 115+75×0.643) = (157,163).
// Bearing arc r=28 from North point (100,87) to PQ-25px point (121,133).
//   Arc: M100,87 A28,28 0 0 1 121,133  (sweep=1 CW = clockwise from N through a°)
// Label "a°" at ~65° bisector from P, 38px out: (134,99).
function bearings(): string {
  return wrap(
    // North arrow
    `<line x1="100" y1="115" x2="100" y2="28" stroke="${K}" stroke-width="1.5"/>` +
    `<polyline points="95,38 100,28 105,38" fill="none" stroke="${K}" stroke-width="1.5" stroke-linejoin="round"/>` +
    // Bearing line P→Q (bearing ~130°)
    `<line x1="100" y1="115" x2="157" y2="163" stroke="${K}" stroke-width="1.5"/>` +
    // Dots at P and Q
    `<circle cx="100" cy="115" r="3" fill="${K}"/>` +
    `<circle cx="157" cy="163" r="3" fill="${K}"/>` +
    // Bearing arc at P: clockwise from N direction to PQ direction (sweep=1)
    `<path d="M100,87 A28,28 0 0 1 121,133" fill="none" stroke="${K}" stroke-width="1.3"/>` +
    // Labels
    `<text x="87"  y="119" text-anchor="end"    font-size="12" fill="${K}" font-style="italic" font-family="${F}">P</text>` +
    `<text x="163" y="163" text-anchor="start"  font-size="12" fill="${K}" font-style="italic" font-family="${F}">Q</text>` +
    `<text x="100" y="18"  text-anchor="middle" font-size="12" fill="${K}" font-family="${F}">N</text>` +
    `<text x="134" y="99"  text-anchor="start"  font-size="11" fill="${K}" font-style="italic" font-family="${F}">a°</text>`,
    '0 0 215 185'
  )
}

// ── angles in polygons ────────────────────────────────────────────────────────
// Regular pentagon, centre (110,105), r=70.
// Vertices (SVG coords): V0(110,35) V1(43,83) V2(69,162) V3(151,162) V4(177,83)
//
// Interior angle arcs (radius 10) at each vertex, sweep=1 (CW in SVG), all going
// through the polygon interior — verified by checking midpoint is closer to centre.
//
// Arc endpoints (10px along each adjacent side from vertex):
//   V0: (118,41) → (102,41)   V1: (51,77) → (46,93)   V2: (66,153) → (79,162)
//   V3: (141,162) → (154,153) V4: (174,93) → (169,77)
function anglesInPolygons(): string {
  return wrap(
    // Pentagon sides
    `<polygon points="110,35 43,83 69,162 151,162 177,83" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Interior angle arcs (sweep=1, all go through polygon interior)
    `<path d="M118,41  A10,10 0 0 1 102,41"  fill="none" stroke="${K}" stroke-width="1.3"/>` +
    `<path d="M51,77   A10,10 0 0 1 46,93"   fill="none" stroke="${K}" stroke-width="1.3"/>` +
    `<path d="M66,153  A10,10 0 0 1 79,162"  fill="none" stroke="${K}" stroke-width="1.3"/>` +
    `<path d="M141,162 A10,10 0 0 1 154,153" fill="none" stroke="${K}" stroke-width="1.3"/>` +
    `<path d="M174,93  A10,10 0 0 1 169,77"  fill="none" stroke="${K}" stroke-width="1.3"/>`,
    '0 0 230 185'
  )
}

// ── congruence and similarity ─────────────────────────────────────────────────
// Two similar rectangles.
// Small (scale 1): x=15, y=52, w=56, h=44  →  centre (43,74)
// Large (scale k): x=120, y=33, w=90, h=71  →  centre (165,69)
// Ratio labels below each width: "1" at (43,107) and "k" at (165,115)
// Area labels inside: "A cm²" (small) and "?" blue (large)
function congruenceSimilarity(): string {
  return wrap(
    // Small rectangle
    `<rect x="15" y="52" width="56" height="44" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Large rectangle
    `<rect x="120" y="33" width="90" height="71" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Width bracket lines under each rectangle (small)
    `<line x1="15"  y1="104" x2="15"  y2="110" stroke="${K}" stroke-width="1.2"/>` +
    `<line x1="71"  y1="104" x2="71"  y2="110" stroke="${K}" stroke-width="1.2"/>` +
    `<line x1="15"  y1="107" x2="71"  y2="107" stroke="${K}" stroke-width="1.2"/>` +
    // Width bracket lines under large
    `<line x1="120" y1="112" x2="120" y2="118" stroke="${K}" stroke-width="1.2"/>` +
    `<line x1="210" y1="112" x2="210" y2="118" stroke="${K}" stroke-width="1.2"/>` +
    `<line x1="120" y1="115" x2="210" y2="115" stroke="${K}" stroke-width="1.2"/>` +
    // Length ratio labels
    `<text x="43"  y="128" text-anchor="middle" font-size="12" fill="${K}" font-family="${F}">1</text>` +
    `<text x="165" y="133" text-anchor="middle" font-size="12" fill="${K}" font-family="${F}">k</text>` +
    // Area labels inside rectangles
    `<text x="43"  y="77"  text-anchor="middle" font-size="11" fill="${K}" font-family="${F}">A cm²</text>` +
    `<text x="165" y="72"  text-anchor="middle" font-size="13" fill="${B}" font-weight="600" font-family="${F}">?</text>`,
    '0 0 230 145'
  )
}

// ── volume of a prism (cuboid) ────────────────────────────────────────────────
// Cabinet oblique projection.  Front face (35,70)→(145,70)→(145,140)→(35,140).
// Depth direction at 30°: offset vector (39,−22).
// Back-top-right (184,48), back-top-left (74,48), back-bottom-right (184,118).
//
// Visible: front face, top face, right face.
// Hidden (dashed): back-left vertical, back bottom, lower-left depth edge.
//
// Labels:  l below front base (90,155),  h left of front face (20,106),
//          w along top-right depth edge midpoint (165,55) above.
function cuboid(): string {
  return wrap(
    // Hidden edges (dashed)
    `<line x1="35"  y1="140" x2="74"  y2="118" stroke="${K}" stroke-width="1.2" stroke-dasharray="5 3"/>` +
    `<line x1="74"  y1="118" x2="184" y2="118" stroke="${K}" stroke-width="1.2" stroke-dasharray="5 3"/>` +
    `<line x1="74"  y1="118" x2="74"  y2="48"  stroke="${K}" stroke-width="1.2" stroke-dasharray="5 3"/>` +
    // Front face
    `<rect x="35" y="70" width="110" height="70" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Top face
    `<polygon points="35,70 145,70 184,48 74,48" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Right face
    `<polygon points="145,70 184,48 184,118 145,140" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Labels
    `<text x="90"  y="156" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">l</text>` +
    `<text x="20"  y="108" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">h</text>` +
    `<text x="168" y="44"  text-anchor="start"  font-size="13" fill="${K}" font-style="italic" font-family="${F}">w</text>`,
    '0 0 215 168'
  )
}

// ── area of rectangle ─────────────────────────────────────────────────────────
// Rectangle x=35, y=52, w=155, h=82.
// Right-angle markers at all four corners (standard for a rectangle diagram).
// Labels: l below centre (112,148),  w left-centre (22,93).
function rectangle(): string {
  return wrap(
    `<rect x="35" y="52" width="155" height="82" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Right-angle markers at all 4 corners (8px squares)
    `<path d="M35,60  L43,60  L43,52"  fill="none" stroke="${K}" stroke-width="1.3"/>` +
    `<path d="M182,52 L182,60 L190,60" fill="none" stroke="${K}" stroke-width="1.3"/>` +
    `<path d="M35,126 L43,126 L43,134" fill="none" stroke="${K}" stroke-width="1.3"/>` +
    `<path d="M182,134 L182,126 L190,126" fill="none" stroke="${K}" stroke-width="1.3"/>` +
    // Labels
    `<text x="112" y="148" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">l</text>` +
    `<text x="22"  y="96"  text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">w</text>`,
    '0 0 225 160'
  )
}

// ─── Diagram map ─────────────────────────────────────────────────────────────

const DIAGRAMS: Record<string, string> = {
  'f042df39-df6c-45c7-8873-684be849148c': bearings(),             // bearings
  'b5edccf8-9acb-4bd7-b45d-ff94000329f1': anglesInPolygons(),     // angles_in_polygons
  'fbae0909-6f00-488a-b971-73bda69a7d32': congruenceSimilarity(), // congruence_and_similarity
  'eb1c81e0-d67b-4f11-b1e3-6dfd94194697': cuboid(),               // volume_of_a_prism
  '6b4ccd3d-19ba-40c0-97a4-4fd69c779476': rectangle(),            // areas_of_squares_and_rectangles
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Adding lower-priority diagrams...\n')

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
