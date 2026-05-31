import './env'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('explanation, parameters')
    .eq('id', '042fa99f-d9e1-4528-adf6-2f3ca756ac12')
    .single()
  if (error) { console.error(error); process.exit(1) }
  console.log('explanation:', data?.explanation)
  console.log('parameters:', JSON.stringify(data?.parameters, null, 2))
}
main()
