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

// ── alternate & corresponding angles ─────────────────────────────────────────
// Two horizontal parallel lines (y=60, y=145) cut by a transversal.
// Transversal from (55,20) to (181,180), crossing upper at (87,60) and lower at (154,145).
// Corresponding angle a° at upper, ? (blue) at lower — both in the same F-position
// (right of transversal, below each parallel line).
function correspondingAngles(): string {
  // angle arcs: 12px along rightward direction and 12px along transversal (downward)
  // transversal direction normalised: (126,160)/203 ≈ (0.621,0.788)
  // Upper (87,60): right→(99,60), down-transversal→(94.5,69.5)≈(95,70)
  // Lower (154,145): right→(166,145), down-transversal→(161.5,154.5)≈(162,155)
  return wrap(
    // Parallel line indicators (double tick marks perpendicular to each line)
    `<line x1="168" y1="54" x2="168" y2="66" stroke="${K}" stroke-width="1.5"/>` +
    `<line x1="172" y1="54" x2="172" y2="66" stroke="${K}" stroke-width="1.5"/>` +
    `<line x1="168" y1="139" x2="168" y2="151" stroke="${K}" stroke-width="1.5"/>` +
    `<line x1="172" y1="139" x2="172" y2="151" stroke="${K}" stroke-width="1.5"/>` +
    // Parallel lines
    `<line x1="20"  y1="60"  x2="210" y2="60"  stroke="${K}" stroke-width="2"/>` +
    `<line x1="20"  y1="145" x2="210" y2="145" stroke="${K}" stroke-width="2"/>` +
    // Transversal
    `<line x1="55"  y1="20"  x2="181" y2="180" stroke="${K}" stroke-width="1.5"/>` +
    // Angle arc at upper intersection (given, black)
    `<path d="M99,60 A12,12 0 0 1 95,70" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Angle arc at lower intersection (unknown, blue)
    `<path d="M166,145 A12,12 0 0 1 162,155" fill="none" stroke="${B}" stroke-width="1.5"/>` +
    // Labels
    `<text x="103" y="70" text-anchor="start" font-size="11" fill="${K}" font-style="italic" font-family="${F}">a°</text>` +
    `<text x="170" y="157" text-anchor="start" font-size="11" fill="${B}" font-weight="600" font-family="${F}">?</text>`,
    '0 0 230 175'
  )
}

// ── angles around a point ─────────────────────────────────────────────────────
// Three rays from centre (100,100) create three sectors summing to 360°.
// Ray 1: 0° → (170,100).  Ray 2: ~100° → (88,31).  Ray 3: ~215° → (43,140).
// Sectors labelled a° (0°–100°), b° (100°–215°), x (215°–360°, blue).
function anglesAtPoint(): string {
  // Arc markers r=22 — all sweep=1 (SVG CW = math CCW, going round the circle)
  // Sector 1: M122,100 A22,22 0 0 1 96,78   (0°→100°, 100°<180° → large-arc=0)
  //   end: (100+22cos100°, 100−22sin100°) = (96.2,78.3)
  // Sector 2: M96,78 A22,22 0 0 1 82,113    (100°→215°, 115°<180°)
  //   end: (100+22cos215°, 100−22sin215°) = (81.9,112.6)
  // Sector 3: M82,113 A22,22 0 0 1 122,100  (215°→360°, 145°<180°)
  // Label positions at sector bisectors, r=35:
  //   a°  bisector 50°:  (100+35cos50°, 100−35sin50°) = (122.5,73.2)
  //   b°  bisector 157°: (100+35cos157°, 100−35sin157°) = (67.8,86.4)
  //   x   bisector 287°: (100+35cos287°, 100−35sin287°) = (110.3,133.4)
  return wrap(
    // Rays from centre
    `<line x1="100" y1="100" x2="170" y2="100" stroke="${K}" stroke-width="1.5"/>` +
    `<line x1="100" y1="100" x2="88"  y2="31"  stroke="${K}" stroke-width="1.5"/>` +
    `<line x1="100" y1="100" x2="43"  y2="140" stroke="${K}" stroke-width="1.5"/>` +
    // Centre dot
    `<circle cx="100" cy="100" r="2.5" fill="${K}"/>` +
    // Sector arcs
    `<path d="M122,100 A22,22 0 0 1 96,78"   fill="none" stroke="${K}" stroke-width="1.3"/>` +
    `<path d="M96,78  A22,22 0 0 1 82,113"   fill="none" stroke="${K}" stroke-width="1.3"/>` +
    `<path d="M82,113 A22,22 0 0 1 122,100"  fill="none" stroke="${B}" stroke-width="1.3"/>` +
    // Labels
    `<text x="123" y="77"  text-anchor="middle" font-size="11" fill="${K}" font-style="italic" font-family="${F}">a°</text>` +
    `<text x="66"  y="89"  text-anchor="middle" font-size="11" fill="${K}" font-style="italic" font-family="${F}">b°</text>` +
    `<text x="113" y="136" text-anchor="middle" font-size="12" fill="${B}" font-weight="600"   font-family="${F}">x</text>`,
    '0 0 200 190'
  )
}

// ── exterior angle of a regular polygon ──────────────────────────────────────
// Pentagon, centre (110,100), r=68.
// Vertices (SVG coords, starting top, going CW):
//   V0(90°)=(110,32)  V1(162°)=(45,79)  V2(234°)=(70,155)
//   V3(306°)=(150,155)  V4(18°)=(175,79)
// Exterior angle highlighted at V4:
//   Side in: V3→V4=(150,155)→(175,79), direction (25,−76) normalised (0.313,−0.950)
//   Extension past V4 by 50px: (175+15.6,79−47.5)=(191,32)
//   Side out: V4→V0=(175,79)→(110,32), direction (−65,−47) normalised (−0.810,−0.586)
// Exterior angle arc r=15:
//   15px along extension: (179.7,64.8)≈(180,65)
//   15px along V4→V0:     (162.9,70.2)≈(163,70)
//   sweep=0 (SVG CCW, arc passes through exterior angle region above V4)
function exteriorAngle(): string {
  return wrap(
    // Pentagon sides (V0–V4 connected, plus V4–V0)
    `<polygon points="110,32 45,79 70,155 150,155 175,79" fill="none" stroke="${K}" stroke-width="1.8"/>` +
    // Extension of side V3→V4 past V4
    `<line x1="150" y1="155" x2="191" y2="32" stroke="${K}" stroke-width="1.5" stroke-dasharray="6 3"/>` +
    // Exterior angle arc at V4 (blue)
    `<path d="M180,65 A15,15 0 0 0 163,70" fill="none" stroke="${B}" stroke-width="2"/>` +
    // Dot at V4
    `<circle cx="175" cy="79" r="2.5" fill="${K}"/>` +
    // Label (blue) near arc midpoint
    `<text x="188" y="60" text-anchor="start" font-size="12" fill="${B}" font-weight="600" font-family="${F}">ext°</text>`,
    '0 0 230 180'
  )
}

// ─── Diagram map ─────────────────────────────────────────────────────────────

const DIAGRAMS: Record<string, string> = {
  '1761d75b-4c11-4604-9850-85918ea17efa': correspondingAngles(),  // alternate_and_corresponding_angles
  '2f63be67-8ac5-4291-93d9-8f2fac947ba4': anglesAtPoint(),         // angles_on_lines_and_circles
  'c0c02057-d8d1-43d1-adf0-4ecc5ee570cf': exteriorAngle(),         // exterior_angles
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Adding angle rule diagrams...\n')

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

    console.log(`✓  ${String(data.skill_ids[0]).padEnd(42)}  ${id.slice(0, 8)}`)
  }

  console.log('\nDone.')
}

main()
