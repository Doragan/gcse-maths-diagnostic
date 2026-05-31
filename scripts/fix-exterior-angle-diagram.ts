import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const F = 'system-ui,-apple-system,sans-serif'
const K = '#374151'
const B = '#2563eb'

// Exterior angle — c0c02057
//
// Replace fixed pentagon with a generic single-vertex diagram.
// This is correct for any n — the concept doesn't depend on how many sides
// the full polygon has.
//
// Geometry: vertex V = (100, 110)
//   Side 1 (incoming, solid):  (25, 110) → V  — horizontal, going right
//   Side 2 (outgoing, solid):  V → (133, 54)  — upper-right (~300° screen-CW)
//   Extension of side 1 (dashed): V → (195, 110) — continuing rightward
//
// Exterior angle arc (blue, sweep=1 CW on screen):
//   Between outgoing side direction (300°) and extension (0°) = 60° arc
//   Start: V + 25·(cos 300°, sin 300°) = (100+12.5, 110−21.7) ≈ (112, 88)
//   End:   V + 25·(1, 0)               = (125, 110)
//   Path:  M112,88 A25,25 0 0 1 125,110
//
// "?" label at midpoint direction ~330° from V, offset r=36:
//   (100+36·cos 330°, 110+36·sin 330°) ≈ (131, 92)

function exteriorAngleDiagram(): string {
  return (
    `<div style="text-align:center;margin:4px 0 16px">` +
    `<svg viewBox="0 30 230 110" style="width:100%;max-width:240px;display:block;margin:0 auto" aria-hidden="true">` +
    // Polygon side 1 — incoming from left
    `<line x1="25" y1="110" x2="100" y2="110" stroke="${K}" stroke-width="1.8"/>` +
    // Polygon side 2 — outgoing upper-right
    `<line x1="100" y1="110" x2="133" y2="54" stroke="${K}" stroke-width="1.8"/>` +
    // Extension of side 1 — dashed, going right
    `<line x1="100" y1="110" x2="195" y2="110" stroke="${K}" stroke-width="1.5" stroke-dasharray="6 3"/>` +
    // Vertex dot
    `<circle cx="100" cy="110" r="2.5" fill="${K}"/>` +
    // Exterior angle arc (60° representative, blue)
    `<path d="M112,88 A25,25 0 0 1 125,110" fill="none" stroke="${B}" stroke-width="2"/>` +
    // "?" label
    `<text x="135" y="97" text-anchor="start" font-size="13" fill="${B}" font-weight="600" font-family="${F}">?</text>` +
    `</svg></div>`
  )
}

function stripSvgPrefix(template: string): string {
  const pIdx = template.indexOf('<p>')
  return pIdx >= 0 ? template.slice(pIdx) : template
}

async function main() {
  const id = 'c0c02057-d8d1-43d1-adf0-4ecc5ee570cf'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('question_template')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  const cleaned = stripSvgPrefix(data.question_template)

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ question_template: exteriorAngleDiagram() + cleaned })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  exterior_angles  c0c02057  — generic vertex diagram (works for any n)')
  console.log('   two polygon sides + dashed extension + exterior angle arc + "?"')
}

main()
