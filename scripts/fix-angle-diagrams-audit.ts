import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── exterior_angles (c0c02057) ──────────────────────────────────────────────
// Label "ext°" (blue) → "?" — the unknown angle isn't named "ext" in parameters;
// answer is {{360/n}}°, so the diagram unknown should just be "?"
// Sweep is already correct (0).

// ─── alternate_segment (6bc803e1) ────────────────────────────────────────────
// Two arcs at P and R both have sweep=0 but need sweep=1.
//
// Why: at P(115,155), the angle arc spans from 180° (left-tangent) to 250°
// (chord toward Q) screen-CW. Going CW (sweep=1) covers the 70° sector through
// the angle interior. With sweep=0+large-arc=0, SVG uses a DIFFERENT centre
// (not P) and the arc curves away from P — not a proper angle mark at P.
// Same reasoning applies at R.
//
// Also fix: static label "a°" → template expression "{{a}}°"

// ─── corresponding_angles (1761d75b) ─────────────────────────────────────────
// Sweep=1 already correct; only fix static label "a°" → "{{a}}°"

async function fix(
  id: string,
  label: string,
  transform: (tpl: string) => string
) {
  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('question_template')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error(`${label}: fetch failed — ${fetchErr?.message}`)
    process.exit(1)
  }

  const updated = transform(data.question_template)

  if (updated === data.question_template) {
    console.log(`${label}: no change (pattern not found)`)
    return
  }

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ question_template: updated })
    .eq('id', id)

  if (updateErr) {
    console.error(`${label}: update failed — ${updateErr.message}`)
    process.exit(1)
  }

  console.log(`✓  ${label}`)
}

async function main() {
  // 1. exterior_angles: "ext°" → "?"
  await fix(
    'c0c02057-d8d1-43d1-adf0-4ecc5ee570cf',
    'exterior_angles   c0c02057  label "ext°" → "?"',
    tpl => tpl.replace('>ext°<', '>?<')
  )

  // 2. alternate_segment: sweep 0→1 for both arcs + "a°" → "{{a}}°"
  await fix(
    '6bc803e1-b16b-40d5-aded-e3cfe6c8e4fa',
    'alternate_segment 6bc803e1  sweep 0→1 + label "a°" → "{{a}}°"',
    tpl => tpl
      // Arc at P: A12,12 0 0 0 → A12,12 0 0 1
      .replace('M103,155 A12,12 0 0 0 111,144', 'M103,155 A12,12 0 0 1 111,144')
      // Arc at R: A12,12 0 0 0 → A12,12 0 0 1
      .replace('M161,129 A12,12 0 0 0 162,115', 'M161,129 A12,12 0 0 1 162,115')
      // Static label
      .replace('>a°<', '>{{a}}°<')
  )

  // 3. corresponding_angles: "a°" → "{{a}}°"
  await fix(
    '1761d75b-4c11-4604-9850-85918ea17efa',
    'corresponding_ang 1761d75b  label "a°" → "{{a}}°"',
    tpl => tpl.replace('>a°<', '>{{a}}°<')
  )
}

main()
