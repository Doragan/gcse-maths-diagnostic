import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const F = 'system-ui,-apple-system,sans-serif'
const K = '#374151'
const B = '#2563eb'

// Exact 3-4-5 × 20 geometry.  Right angle at P verified: PO·PT = 0.
//
// O=(95,158)  T=(195,158)  P=(131,110)  r=60
//   P_x = 95  + 60²/100 = 131
//   P_y = 158 − 60×80/100 = 110
//   PO=(−36,48), PT=(64,48) → dot = −2304+2304 = 0 ✓
//
// Content bounds (with labels):
//   x: 35 (left circle edge) → ~215 (T label)
//   y: 100 (P label)         → 218 (circle bottom)
//
// ViewBox crops tightly: "20 88 205 140"
//   x 20→225, y 88→228  — 8px margin above P label, 10px below circle bottom
//
// At max-width:360px → rendered height ≈ 360×140/205 ≈ 246px  (reasonable for this diagram)

function tangentDiagram(): string {
  return (
    `<div style="text-align:center;margin:4px 0 16px">` +
    `<svg viewBox="20 88 205 140" style="width:100%;max-width:360px;display:block;margin:0 auto" aria-hidden="true">` +
    // Circle
    `<circle cx="95" cy="158" r="60" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Dashed radii O→P and O→T
    `<line x1="95" y1="158" x2="131" y2="110" stroke="${K}" stroke-width="1.5" stroke-dasharray="5 3"/>` +
    `<line x1="95" y1="158" x2="195" y2="158" stroke="${K}" stroke-width="1.5" stroke-dasharray="5 3"/>` +
    // Tangent line (extends ~12px past P toward upper-left, then to T)
    `<line x1="121" y1="103" x2="195" y2="158" stroke="${K}" stroke-width="2"/>` +
    // Right-angle marker at P
    `<path d="M126,116 L133,121 L137,115" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Point dots
    `<circle cx="95"  cy="158" r="2.5" fill="${K}"/>` +
    `<circle cx="195" cy="158" r="2.5" fill="${K}"/>` +
    `<circle cx="131" cy="110" r="2.5" fill="${K}"/>` +
    // Vertex labels
    `<text x="83"  y="172" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">O</text>` +
    `<text x="208" y="163" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">T</text>` +
    `<text x="135" y="101" text-anchor="middle" font-size="13" fill="${K}" font-style="italic" font-family="${F}">P</text>` +
    // Side labels
    `<text x="105" y="128" text-anchor="end"    font-size="12" fill="${K}" font-family="${F}">{{3*k}} cm</text>` +
    `<text x="145" y="175" text-anchor="middle" font-size="12" fill="${K}" font-family="${F}">{{5*k}} cm</text>` +
    `<text x="168" y="123" text-anchor="start"  font-size="12" fill="${B}" font-weight="600" font-family="${F}">? cm</text>` +
    `</svg></div>`
  )
}

function stripSvgPrefix(template: string): string {
  const pIdx = template.indexOf('<p>')
  return pIdx >= 0 ? template.slice(pIdx) : template
}

async function main() {
  const id = 'a7cff7db-2c25-4628-9877-75b966d5dcaa'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('skill_ids, question_template')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  const cleaned = stripSvgPrefix(data.question_template)

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ question_template: tangentDiagram() + cleaned })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  circle_theorem_tangent  a7cff7db  — viewBox cropped, fits cleanly')
}

main()
