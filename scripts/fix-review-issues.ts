import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Fix 1: a7cff7db — tangent diagram labels ──────────────────────────────────
// SVG text labels show literal "3k" / "5k" (or the user's interim "{{3k}} cm")
// instead of the correct template expressions {{3*k}} cm / {{5*k}} cm.
// A regex handles all variants: bare "3k", "3k cm", "{{3k}}", "{{3k}} cm".

async function fixTangentLabels() {
  const id = 'a7cff7db-2c25-4628-9877-75b966d5dcaa'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('question_template')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  let tpl = data.question_template

  // Replace any existing variant of the OP (radius) label → {{3*k}} cm
  tpl = tpl.replace(/>(\{\{3k\}\} cm|3k cm|3k)</g, '>{{3*k}} cm<')

  // Replace any existing variant of the OT label → {{5*k}} cm
  tpl = tpl.replace(/>(\{\{5k\}\} cm|5k cm|5k)</g, '>{{5*k}} cm<')

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ question_template: tpl })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  circle_theorem_tangent  a7cff7db  — labels → {{3*k}} cm / {{5*k}} cm')
}

// ── Fix 2: 0799c17c — cone SA, add l > r constraint ──────────────────────────
// l ∈ [4,12] and r ∈ [2,7] can produce l < r (geometrically impossible cone).
// Adding constraint { type: "gt", target: "r", target_type: "parameter" } on l
// ensures l > r for every generated set of values.

async function fixConeConstraint() {
  const id = '0799c17c-b016-4728-ba84-91e1239244f7'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('parameters')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  const params = data.parameters as Record<string, any>
  console.log('Before:', JSON.stringify(params))

  const updated = {
    ...params,
    l: {
      ...params.l,
      constraint: { type: 'gt', target: 'r', target_type: 'parameter' },
    },
  }

  console.log('After: ', JSON.stringify(updated))

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ parameters: updated })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  surface_area_of_a_cone  0799c17c  — added l > r constraint\n')
}

async function main() {
  console.log('Fixing review issues...\n')
  await fixTangentLabels()
  console.log()
  await fixConeConstraint()
  console.log('Done.')
}

main()
