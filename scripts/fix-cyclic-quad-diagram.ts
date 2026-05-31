import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const F = 'system-ui,-apple-system,sans-serif'
const K = '#374151'
const B = '#2563eb'

// Cyclic quadrilateral — 04b37198
//
// Vertices: A(47,130)  B(170,151)  C(170,59)  D(69,50)
//
// Arc at A (angle a°, grey):
//   Start (50,118): 12px along AD from A  ✓ (already sweep=1, correct)
//   End   (59,132): 12px along AB from A  ✓
//   sweep=1 (CW on screen) → short ~85° arc through polygon interior  ✓
//
// Arc at C (unknown angle, blue):
//   Start (170,71): 12px along CB from C (directly below C)  ✓
//   End   (158,58): 12px along CD from C (upper-left of C)   ✓
//   From C the angles are: start≈90°, end≈185°
//   CW on screen (sweep=1): 90°→185° = 95° arc, passes through interior ✓
//   CCW on screen (sweep=0): 90°→185° the long way = 265° arc         ✗ (was wrong)
//
// Also fix: static label "a°" → template expression "{{a}}°"

function cyclicQuadDiagram(): string {
  return (
    `<div style="text-align:center;margin:4px 0 16px">` +
    `<svg viewBox="0 0 230 200" style="width:100%;max-width:240px;display:block;margin:0 auto" aria-hidden="true">` +
    `<circle cx="115" cy="105" r="72" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    `<polygon points="47,130 170,151 170,59 69,50" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Arc at A — sweep=1 (correct, unchanged)
    `<path d="M50,118 A12,12 0 0 1 59,132" fill="none" stroke="${K}" stroke-width="1.5"/>` +
    // Arc at C — sweep=1 (was 0, now fixed)
    `<path d="M170,71 A12,12 0 0 1 158,58" fill="none" stroke="${B}" stroke-width="1.5"/>` +
    // Labels — "a°" now uses template expression
    `<text x="63"  y="126" text-anchor="start"  font-size="11" fill="${K}" font-style="italic" font-family="${F}">{{a}}°</text>` +
    `<text x="155" y="73"  text-anchor="end"    font-size="11" fill="${B}" font-weight="600"   font-family="${F}">?</text>` +
    `<text x="32"  y="133" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">A</text>` +
    `<text x="184" y="157" text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">B</text>` +
    `<text x="184" y="57"  text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">C</text>` +
    `<text x="57"  y="40"  text-anchor="middle" font-size="12" fill="${K}" font-style="italic" font-family="${F}">D</text>` +
    `</svg></div>`
  )
}

function stripSvgPrefix(template: string): string {
  const pIdx = template.indexOf('<p>')
  return pIdx >= 0 ? template.slice(pIdx) : template
}

async function main() {
  const id = '04b37198-85e6-4487-887a-eafd5a99b47a'

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
    .update({ question_template: cyclicQuadDiagram() + cleaned })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  circle_theorem_cyclic_quadrilateral  04b37198')
  console.log('   arc at C: sweep 0→1 (interior angle, 95° arc)')
  console.log('   label: "a°" → "{{a}}°"')
}

main()
