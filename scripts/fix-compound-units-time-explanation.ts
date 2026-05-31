import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const id = '1785da89-1ef2-4b5d-99b8-3a688b566a3e'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('explanation')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  console.log('current explanation:', JSON.stringify(data.explanation))

  // The bug: divisor shows {{b}} but should show {{5*b}}
  // (speed is b*5 km/h, not just b)
  const fixed = data.explanation.replace('÷ {{b}}', '÷ {{5*b}}')

  if (fixed === data.explanation) {
    console.error('pattern "÷ {{b}}" not found — already fixed or wrong question')
    console.error('current explanation:', data.explanation)
    process.exit(1)
  }

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ explanation: fixed })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  compound_units_time  1785da89  — divisor fixed: ÷ {{b}} → ÷ {{5*b}}')
  console.log('   updated explanation:', JSON.stringify(fixed))
}

main()
