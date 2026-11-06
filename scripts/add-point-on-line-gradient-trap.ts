import './env'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// "The line y = ax + b passes through the point (c, y). Find the value of y."
//
// Adds the trap for a student who writes down the GRADIENT instead of working
// out y — the error the first section of the straight-line investigation exists
// to prevent, and the one answer this question could not previously explain.
//
// It also narrows b so it can never equal a. Without that, the new trap and the
// existing "{{b}}" trap render the SAME value whenever a === b, and which
// explanation a student gets would depend on trap order rather than on what
// they did. b keeps nine of its ten values; the question is unchanged
// otherwise.
//
// Published row, edited on the user's explicit instruction (2026-11-06).
// ─────────────────────────────────────────────────────────────────────────────

const ID = 'ccc88b02-19fb-48cd-8e78-382bf3258c8b'

const GRADIENT_TRAP = {
  answer_template: '{{a}}',
  response: 'That is the gradient — the number in front of x. It tells you how steep the line '
    + 'is, not how high it is at a particular point. Substitute x = {{c}}: '
    + 'y = {{a}} × {{c}} + {{b}} = {{a * c + b}}.',
  misconception: 'answered_a_different_quantity',
}

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await db.from('questions').select('*').eq('id', ID).single()
  if (error) { console.error(error.message); process.exit(1) }

  const traps = (data.traps ?? []) as { answer_template: string }[]
  if (traps.some(t => t.answer_template === GRADIENT_TRAP.answer_template)) {
    console.log('already present — nothing to do'); return
  }

  const parameters = structuredClone(data.parameters)
  const bConstraints = parameters.b.constraints ?? []
  if (!bConstraints.some((c: { target?: string }) => c.target === 'a')) {
    bConstraints.push({ type: 'neq', target: 'a', target_type: 'parameter' })
  }
  parameters.b.constraints = bConstraints

  const { error: upErr } = await db.from('questions')
    .update({ traps: [...traps, GRADIENT_TRAP], parameters })
    .eq('id', ID)
  if (upErr) { console.error(upErr.message); process.exit(1) }

  console.log(`added the gradient trap and the b ≠ a constraint to ${ID}`)
}
main()
