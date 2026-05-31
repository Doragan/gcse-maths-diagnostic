import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const id = '28f4dd18-0cc0-4598-a8e8-85b8c8def293'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('question_template, explanation, is_published')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  console.log('current is_published:', data.is_published)

  // ── question_template fixes ──────────────────────────────────────────────

  let tpl = data.question_template

  // 1. Fix arc sweep: sweep=0 → sweep=1 at angle vertex (190,132).
  //    trig_missing_angles has identical triangle geometry and uses sweep=1
  //    correctly. With sweep=0 and large-arc=0 in conflict, SVG picks an
  //    off-vertex centre, so the arc is not centred at the angle vertex.
  tpl = tpl.replace(
    'M172,132 A18,18 0 0 0 176,121',
    'M172,132 A18,18 0 0 1 176,121'
  )

  // 2. Parameterise the "adj" label → "{{adj}} cm"
  //    (trig_missing_angles shows {{opp}} cm and {{hyp}} cm — this should match)
  tpl = tpl.replace('>adj<', '>{{adj}} cm<')

  if (tpl === data.question_template) {
    console.error('no template changes made — patterns not found')
    process.exit(1)
  }

  // ── explanation fix ──────────────────────────────────────────────────────
  //
  // Old: cos(θ) = adjacent / hypotenuse<br>
  //      hypotenuse = adjacent ÷ cos(θ)<br>
  //      = {{adj}} ÷ cos({{theta}}°)<br>
  //      ≈ {{round(adj / Math.cos(theta * Math.PI / 180), 2)}} cm
  //
  // New: frac() for the trig ratio and the two rearranged steps.
  //      {{frac('adjacent','hypotenuse')}} — literal strings → conceptual formula
  //      {{frac('adjacent','cos(θ)')}}     — literal strings → rearranged form
  //      {{frac(adj+' cm','cos('+theta+'°)')}} — params evaluated → specific values
  //      (string concatenation inside {{...}} is supported by the template engine)

  const newExplanation =
    `cos(θ) = {{frac('adjacent', 'hypotenuse')}}<br>` +
    `hypotenuse = {{frac('adjacent', 'cos(θ)')}}<br>` +
    `= {{frac(adj + ' cm', 'cos(' + theta + '°)')}}<br>` +
    `≈ {{round(adj / Math.cos(theta * Math.PI / 180), 2)}} cm`

  const { error: updateErr } = await supabase
    .from('questions')
    .update({
      question_template: tpl,
      explanation: newExplanation,
      is_published: false,
    })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  trig_missing_sides  28f4dd18')
  console.log('   arc sweep: 0 → 1 at vertex (190,132)')
  console.log('   label: "adj" → "{{adj}} cm"')
  console.log('   explanation: frac() for cos(θ) = adj/hyp and substituted steps')
  console.log('   is_published: true → false (draft)')
}

main()
