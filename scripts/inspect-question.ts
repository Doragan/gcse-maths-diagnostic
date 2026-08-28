import './env'
import { createClient } from '@supabase/supabase-js'
const ID = process.argv[2] ?? 'badfd8eb-5fe8-43d3-af66-3b652c21d82c'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { data, error } = await supabase.from('questions').select('*').eq('id', ID).single()
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))
}
main().catch(e => { console.error(e); process.exit(1) })
