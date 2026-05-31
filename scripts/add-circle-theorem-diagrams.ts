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

// ── same segment ─────────────────────────────────────────────────────────────
// Circle cx=115 cy=100 r=70.  Chord AB at y=153: A=(69,153) B=(161,153).
// C ≈ (103,31) at ~100° from +x-axis.  D ≈ (169,55) at ~40°.
// Both subtend chord AB in the same (major) segment.
function sameSegment(): string {
  return wrap(
    `<circle cx="115" cy="100" r="70" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Chord AB
    `<line x1="69" y1="153" x2="161" y2="153" stroke="${K}" stroke-width="1.5"/>` +
    // Lines from C (primary angle)
    `<line x1="103" y1="31" x2="69"  y2="153" stroke="${K}" stroke-width="1.5"/>` +
    `<line x1="103" y1="31" x2="161" y2="153" stroke="${K}" stroke-width="1.5"/>` +
    // Lines from D (secondary, faded)
    `<line x1="169" y1="55" x2="69"  y2="153" stroke="${K}" stroke-width="1.3" opacity="0.4"/>` +
    `<line x1="169" y1="55" x2="161" y2="153" stroke="${K}" stroke-width="1.3" opacity="0.4"/>` +
    // Angle arc at C
    `<path d="M100,43 A12,12 0 0 1 108,42" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Angle arc at D (faded)
    `<path d="M160,63 A12,12 0 0 1 167,67" fill="none" stroke="${K}" stroke-width="1.3" opacity="0.4"/>` +
    // Label a° at C
    `<text x="105" y="57" text-anchor="middle" font-size="11" fill="${K}" font-style="italic" font-family="${F}">a°</text>` +
    // Vertex labels
    `<text x="58"  y="168" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">A</text>` +
    `<text x="172" y="168" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">B</text>` +
    `<text x="91"  y="22"  text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">C</text>` +
    `<text x="182" y="52"  text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">D</text>`,
    '0 0 230 185'
  )
}

// ── cyclic quadrilateral ─────────────────────────────────────────────────────
// Circle cx=115 cy=105 r=72.  A(47,130) B(170,151) C(170,59) D(69,50) — all ≈ on circle.
// Angle A (given, a°) and opposite angle C (unknown, ?) sum to 180°.
function cyclicQuad(): string {
  return wrap(
    `<circle cx="115" cy="105" r="72" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Quadrilateral
    `<polygon points="47,130 170,151 170,59 69,50" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Angle arc at A: 12px along AD=(50,118) and along AB=(59,132), sweep CW
    `<path d="M50,118 A12,12 0 0 1 59,132" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Angle arc at C: 12px along CB=(170,71) and along CD=(158,58), sweep CCW (blue)
    `<path d="M170,71 A12,12 0 0 0 158,58" fill="none" stroke="${B}" stroke-width="1.5"/>` +
    // Labels
    `<text x="63"  y="126" text-anchor="start" font-size="11" fill="${K}" font-style="italic" font-family="${F}">a°</text>` +
    `<text x="155" y="73"  text-anchor="end"   font-size="11" fill="${B}" font-weight="600" font-family="${F}">?</text>` +
    // Vertex labels
    `<text x="32"  y="133" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">A</text>` +
    `<text x="184" y="157" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">B</text>` +
    `<text x="184" y="57"  text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">C</text>` +
    `<text x="57"  y="40"  text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">D</text>`,
    '0 0 230 200'
  )
}

// ── tangent from external point ──────────────────────────────────────────────
// 3-4-5 triangle scaled ×16: OP=48, OT=80, PT=64.
// O=(82,132)  T=(162,132)  P=(111,94)  — right angle at P.
// u = OP²/OT = 2304/80 = 28.8 → P.x = 82+29 = 111
// v = sqrt(48²−29²) = sqrt(1463) ≈ 38 → P.y = 132−38 = 94
// Right-angle marker: 7px along PO=(107,100) and along PT=(117,98), corner=(113,104)
// Tangent line extended 15px past P: start=(99,85) end=T=(162,132)
function tangentDiagram(): string {
  return wrap(
    `<circle cx="82" cy="132" r="48" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Dashed helper lines: radius OP and base OT
    `<line x1="82"  y1="132" x2="111" y2="94"  stroke="${K}" stroke-width="1.5" stroke-dasharray="5 3"/>` +
    `<line x1="82"  y1="132" x2="162" y2="132" stroke="${K}" stroke-width="1.5" stroke-dasharray="5 3"/>` +
    // Tangent line (solid, extended past P)
    `<line x1="99"  y1="85"  x2="162" y2="132" stroke="${K}" stroke-width="2"/>` +
    // Right-angle marker at P
    `<path d="M107,100 L113,104 L117,98" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Dots at vertices
    `<circle cx="82"  cy="132" r="2.5" fill="${K}"/>` +
    `<circle cx="162" cy="132" r="2.5" fill="${K}"/>` +
    `<circle cx="111" cy="94"  r="2.5" fill="${K}"/>` +
    // Vertex labels
    `<text x="70"  y="147" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">O</text>` +
    `<text x="174" y="136" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">T</text>` +
    `<text x="117" y="86"  text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">P</text>` +
    // Side labels
    `<text x="88"  y="107" text-anchor="end"    font-size="11" fill="${K}" font-family="${F}">3k</text>` +
    `<text x="122" y="147" text-anchor="middle" font-size="11" fill="${K}" font-family="${F}">5k</text>` +
    `<text x="144" y="104" text-anchor="start"  font-size="11" fill="${B}" font-weight="600" font-family="${F}">? cm</text>`,
    '0 0 230 185'
  )
}

// ── alternate segment theorem ────────────────────────────────────────────────
// Circle cx=115 cy=90 r=65.  P=(115,155) at bottom (tangent is horizontal).
// Q=(73,40) upper-left.  R=(171,123) on major arc (right side).
// Angle arc at P: between leftward tangent and chord PQ, sweep CCW (=0).
//   12px left of P = (103,155); 12px along PQ from P = (111,144).
// Angle arc at R: between RP and RQ, sweep CCW (=0).
//   12px along RP from R = (161,129); 12px along RQ from R = (162,115).
function alternateSegment(): string {
  return wrap(
    `<circle cx="115" cy="90" r="65" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Horizontal tangent at P
    `<line x1="35" y1="155" x2="195" y2="155" stroke="${K}" stroke-width="2"/>` +
    // Chord PQ
    `<line x1="115" y1="155" x2="73"  y2="40"  stroke="${K}" stroke-width="1.5"/>` +
    // Lines from R
    `<line x1="171" y1="123" x2="115" y2="155" stroke="${K}" stroke-width="1.5"/>` +
    `<line x1="171" y1="123" x2="73"  y2="40"  stroke="${K}" stroke-width="1.5"/>` +
    // Angle arc at P (given, CCW)
    `<path d="M103,155 A12,12 0 0 0 111,144" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Angle arc at R (unknown, CCW, blue)
    `<path d="M161,129 A12,12 0 0 0 162,115" fill="none" stroke="${B}" stroke-width="1.5"/>` +
    // Labels
    `<text x="97"  y="149" text-anchor="end"    font-size="11" fill="${K}" font-style="italic" font-family="${F}">a°</text>` +
    `<text x="153" y="120" text-anchor="end"    font-size="11" fill="${B}" font-weight="600"   font-family="${F}">?</text>` +
    // Vertex labels
    `<text x="115" y="172" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">P</text>` +
    `<text x="61"  y="32"  text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">Q</text>` +
    `<text x="185" y="121" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">R</text>`,
    '0 0 230 185'
  )
}

// ─── Diagram map ─────────────────────────────────────────────────────────────

const DIAGRAMS: Record<string, string> = {
  '3a59b15a-60c8-466c-af1c-b52d6c86635a': sameSegment(),
  '04b37198-85e6-4487-887a-eafd5a99b47a': cyclicQuad(),
  'a7cff7db-2c25-4628-9877-75b966d5dcaa': tangentDiagram(),
  '6bc803e1-b16b-40d5-aded-e3cfe6c8e4fa': alternateSegment(),
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Adding circle theorem diagrams...\n')

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
