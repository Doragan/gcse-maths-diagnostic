import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tangent theorem question: a7cff7db
// The diagram wrapper uses max-width:240px (≈ 1:1 with the 230-wide viewBox),
// making the 11px SVG labels render at ≈11px — too small.
// Fix: increase to max-width:300px so labels render at ≈14px.

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

  const original = data.question_template
  if (!original.includes('max-width:240px')) {
    console.log('max-width:240px not found — already fixed or different template.')
    process.exit(0)
  }

  // Only replace the first occurrence (the SVG wrapper) in case the string
  // appears elsewhere
  const updated = original.replace('max-width:240px', 'max-width:300px')

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ question_template: updated })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log(`✓  tangent theorem  ${id.slice(0, 8)}  — max-width 240px → 300px`)
}

main()
