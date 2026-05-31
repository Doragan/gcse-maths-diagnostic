import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const id = 'f6bf5e77-4a02-46cc-986d-f2f17d75ceae'

  const { error } = await supabase
    .from('questions')
    .update({ answer_template: '{{n * 100 / d}}%' })
    .eq('id', id)

  if (error) { console.error(error.message); process.exit(1) }

  const { data } = await supabase
    .from('questions')
    .select('answer_template')
    .eq('id', id)
    .single()

  console.log('answer_template:', data?.answer_template)
}

main()
