import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// x² − px − q = 0 (a=1, b=−p, c=−q)
// Positive root = (p + √(p²+4q)) / 2

async function main() {
  const id = '41cbcb3d-301a-4fda-b9f3-fd5f11000a00'

  // Verify we have the right row
  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('skill_ids, explanation, traps')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('Fetch failed:', fetchErr?.message)
    process.exit(1)
  }
  console.log('skill:', data.skill_ids[0])
  console.log('current explanation:', data.explanation)

  // ── New explanation ─────────────────────────────────────────────────────────
  //
  //  Line 1: Conceptual formula as a proper stacked fraction
  //  Line 2: Identify a, b, c
  //  Line 3: Discriminant calculation
  //  Line 4: Substituted fraction — numerator uses string concat: p + ' ± √' + disc
  //  Line 5: Positive root as fraction then ≈ decimal
  //
  const newExplanation =
    `Quadratic formula: x = {{frac('-b ± √(b²−4ac)', '2a')}}<br>` +
    `Here a = 1, b = −{{p}}, c = −{{q}}.<br>` +
    `Discriminant = (−{{p}})² − 4(1)(−{{q}}) = {{p*p}} + {{4*q}} = {{p*p + 4*q}}<br>` +
    `x = {{frac(p + ' ± √' + (p*p + 4*q), 2)}}<br>` +
    `Positive root: {{frac(p + ' + ' + round(Math.sqrt(p*p + 4*q), 4), 2)}} ≈ <strong>{{round((p + Math.sqrt(p*p + 4*q)) / 2, 2)}}</strong>`

  // ── New traps ───────────────────────────────────────────────────────────────
  const newTraps = [
    {
      // Student finds the negative root
      answer_template: '{{round((p - Math.sqrt(p*p + 4*q)) / 2, 2)}}',
      response:
        `That's the negative root. The question asks for the <strong>positive</strong> root: ` +
        `x = {{frac(p + ' + √' + (p*p + 4*q), 2)}} ≈ {{round((p + Math.sqrt(p*p + 4*q)) / 2, 2)}}.`,
    },
    {
      // Student forgets to divide by 2a: returns p + √discriminant
      answer_template: '{{round(p + Math.sqrt(p*p + 4*q), 2)}}',
      response:
        `Remember the full formula: x = {{frac('-b ± √discriminant', '2a')}}. ` +
        `Here a = 1, so divide by 2: x = {{frac(p + ' + √' + (p*p + 4*q), 2)}} ≈ {{round((p + Math.sqrt(p*p + 4*q)) / 2, 2)}}.`,
    },
  ]

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ explanation: newExplanation, traps: newTraps })
    .eq('id', id)

  if (updateErr) {
    console.error('Update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  solving_quadratic_equations_quadratic_equation  41cbcb3d')
  console.log('   explanation: plain text → frac() for formula and substituted steps')
  console.log('   traps: plain ÷ notation → frac() for both responses')
}

main()
