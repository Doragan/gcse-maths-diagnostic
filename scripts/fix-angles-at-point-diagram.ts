import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const F = 'system-ui,-apple-system,sans-serif'
const K = '#374151'
const B = '#2563eb'

// Angles at a point — 2f63be67
//
// Centre (100,100). Three rays:
//   Right     → (170,100)        direction (1, 0)
//   Upper-left → (88, 31)        direction (-12,−69)/70.04 = (−0.1713,−0.9852)
//   Lower-left → (43, 140)       direction (−57, 40)/69.64 = (−0.8186, 0.5745)
//
// Three sectors (all arcs sweep=0: CCW on screen → passes through each sector interior):
//   a° : right      → upper-left   r=15   M115,100  → A15,15  0 0 0  97,85
//   b° : upper-left → lower-left   r=22   M96,78    → A22,22  0 0 0  82,113
//   x  : lower-left → right        r=19   M84,111   → A19,19  0 0 0  119,100
//
// Arc endpoint derivations (rounded to integer):
//   a start: (100+15, 100)                           = (115, 100)
//   a end:   (100+15×(−0.1713), 100+15×(−0.9852))  = (97.4, 85.2) ≈ (97, 85)
//   b start: (100+22×(−0.1713), 100+22×(−0.9852))  = (96.2, 78.3) ≈ (96, 78)
//   b end:   (100+22×(−0.8186), 100+22×0.5745)     = (82.0,112.6) ≈ (82, 113)
//   x start: (100+19×(−0.8186), 100+19×0.5745)     = (84.5,110.9) ≈ (84, 111)
//   x end:   (100+19, 100)                           = (119, 100)
//
// Labels also updated: static "a°"/"b°" → template expressions "{{a}}°"/"{{b}}°"

function anglesAtPoint(): string {
  return (
    `<div style="text-align:center;margin:4px 0 16px">` +
    `<svg viewBox="0 0 200 190" style="width:100%;max-width:240px;display:block;margin:0 auto" aria-hidden="true">` +
    // Three rays
    `<line x1="100" y1="100" x2="170" y2="100" stroke="${K}" stroke-width="1.5"/>` +
    `<line x1="100" y1="100" x2="88"  y2="31"  stroke="${K}" stroke-width="1.5"/>` +
    `<line x1="100" y1="100" x2="43"  y2="140" stroke="${K}" stroke-width="1.5"/>` +
    // Centre dot
    `<circle cx="100" cy="100" r="2.5" fill="${K}"/>` +
    // Arc a (r=15, grey): right ray → upper-left ray, sweep=0
    `<path d="M115,100 A15,15 0 0 0 97,85"   fill="none" stroke="${K}" stroke-width="1.3"/>` +
    // Arc b (r=22, grey): upper-left ray → lower-left ray, sweep=0
    `<path d="M96,78  A22,22 0 0 0 82,113"   fill="none" stroke="${K}" stroke-width="1.3"/>` +
    // Arc x (r=19, blue): lower-left ray → right ray, sweep=0
    `<path d="M84,111 A19,19 0 0 0 119,100"  fill="none" stroke="${B}" stroke-width="1.3"/>` +
    // Labels — now use template expressions for a and b
    `<text x="123" y="77"  text-anchor="middle" font-size="11" fill="${K}" font-style="italic" font-family="${F}">{{a}}°</text>` +
    `<text x="66"  y="89"  text-anchor="middle" font-size="11" fill="${K}" font-style="italic" font-family="${F}">{{b}}°</text>` +
    `<text x="113" y="136" text-anchor="middle" font-size="12" fill="${B}" font-weight="600"   font-family="${F}">x</text>` +
    `</svg></div>`
  )
}

function stripSvgPrefix(template: string): string {
  const pIdx = template.indexOf('<p>')
  return pIdx >= 0 ? template.slice(pIdx) : template
}

async function main() {
  const id = '2f63be67-8ac5-4291-93d9-8f2fac947ba4'

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
    .update({ question_template: anglesAtPoint() + cleaned })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  angles_on_lines_and_circles  2f63be67')
  console.log('   arcs: all r=22 → r=15/22/19 (visually distinct)')
  console.log('   labels: "a°"/"b°" → "{{a}}°"/"{{b}}°"')
  console.log('   sweeps: preserved as 0 (CCW on screen)')
}

main()
