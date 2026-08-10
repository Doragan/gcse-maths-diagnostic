import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Volume of a sphere — b9051e5b
//
// Same authoring slip as scripts/fix-cone-tolerance.ts: answer_template rounds
// to 2 dp but tolerance was 0.5 — fifty times the last-place unit (0.01), so a
// value off by a whole tenth still passed. Found by auditing the rest of the
// volume_of_a_sphere / volume_of_a_pyramid_and_cone bank for the same pattern
// after the cone fix.
//
// 0.001 matches the tolerance used elsewhere in the bank for 1–2 dp numeric
// answers and is tight enough to enforce the rounding while absorbing
// floating-point noise from the round() call.
//
// Already applied (2026-08-10, verified via scripts/verify-question.ts).
// Kept for the record — safe to re-run, it's idempotent.

async function main() {
  const id = 'b9051e5b-b8a5-4dbe-9f94-f3a20411b7e0'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('tolerance')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  console.log('current tolerance:', data.tolerance)

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ tolerance: 0.001 })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('updated tolerance to 0.001')
}

main()
