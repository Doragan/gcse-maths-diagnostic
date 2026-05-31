import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ids = [
  { id: 'c0c02057-d8d1-43d1-adf0-4ecc5ee570cf', label: 'exterior_angles' },
  { id: '6bc803e1-b16b-40d5-aded-e3cfe6c8e4fa', label: 'alternate_segment' },
]

async function main() {
  for (const { id, label } of ids) {
    const { data, error } = await supabase
      .from('questions')
      .select('question_template, explanation, parameters')
      .eq('id', id)
      .single()

    if (error || !data) { console.log(id, 'NOT FOUND'); continue }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`${label} (${id})`)
    console.log(`${'='.repeat(60)}`)
    console.log('\n--- question_template ---')
    console.log(data.question_template)
    console.log('\n--- explanation ---')
    console.log(data.explanation)
    console.log('\n--- parameters ---')
    console.log(JSON.stringify(data.parameters, null, 2))
  }
}

main()
