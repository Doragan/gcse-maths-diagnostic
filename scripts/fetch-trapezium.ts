import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('question_template')
    .eq('id', '683e0245-2cbf-4b91-900f-a44a39f3bd03')
    .single()

  if (error || !data) { console.error(error); process.exit(1) }
  console.log(data.question_template)
}

main()
