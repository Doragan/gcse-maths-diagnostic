import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Volume of a cone — e6fc8f3f
//
// answer_template rounds to 2 dp ("Give your answer to 2 decimal places") but
// tolerance was 0.5 — fifty times the last-place unit (0.01), so a value off
// by a whole tenth still passed. Found while building the /demo/questions
// showcase: a probe deliberately one-out-in-the-last-place ("4.92" against
// "4.91") was accepted outright instead of triggering the dedicated rounding
// feedback in lib/questions/answerChecker.ts (roundingRelation), which exists
// precisely to give that near-miss its own message rather than needing a loose
// tolerance to paper over it.
//
// 0.001 matches the tolerance used elsewhere in the bank for 1–2 dp numeric
// answers (e.g. fddc36d2, c91852ed, 7a289a0d) — tight enough to enforce the
// rounding, loose enough to absorb floating-point noise from the round().
//
// Already applied (2026-08-10, verified via scripts/verify-question.ts).
// Kept for the record — safe to re-run, it's idempotent.

async function main() {
  const id = 'e6fc8f3f-6c7d-4476-9efa-9dc4c8675e58'

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
