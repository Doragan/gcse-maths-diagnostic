import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const id = '463e9833-bc0a-40d9-bc40-941de561a0cc'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('question_template, is_published')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  console.log('current is_published:', data.is_published)

  // Replace plain-text fraction with template-engine frac() call.
  // Original: <strong>{{a}}/{{b}}</strong>
  // Fixed:    {{frac(a, b)}}
  const fixed = data.question_template.replace(
    '<strong>{{a}}/{{b}}</strong>',
    '{{frac(a, b)}}'
  )

  if (fixed === data.question_template) {
    console.error('pattern not found — already fixed or template differs')
    console.error('current template:', data.question_template)
    process.exit(1)
  }

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ question_template: fixed, is_published: false })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  fractions_of_amounts  463e9833')
  console.log('   {{a}}/{{b}} → {{frac(a, b)}}')
  console.log('   is_published: true → false (draft)')
}

main()
