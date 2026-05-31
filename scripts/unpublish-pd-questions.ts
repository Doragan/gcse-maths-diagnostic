import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ids = [
  'b3afc87c-419c-455e-8ccf-f0245778ab4a', // mode
  '8c65d36c-00c3-400a-932c-2cf2e132e273', // expected_outcomes
  '66cdd6fc-c0d2-4f0e-b567-b46e4a440b24', // combined_events
  'cc23a097-d365-47b7-9728-f7686ea67c4a', // venn_diagrams
  '6ed2d883-7e79-4c79-ad35-1a462b4a5ab5', // conditional_probability
  '10db7622-bc1f-4c4f-8f02-f19c90e7ff60', // interquartile_range
  'ccb734f3-9a1b-4444-94df-d9ea18723457', // cumulative_frequency
]

async function main() {
  const { error } = await supabase
    .from('questions')
    .update({ is_published: false })
    .in('id', ids)

  if (error) {
    console.error('Update failed:', error.message)
    process.exit(1)
  }

  // Verify
  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('skill_ids, is_published')
    .in('id', ids)

  if (fetchErr) {
    console.error('Verify failed:', fetchErr.message)
    process.exit(1)
  }

  data?.forEach(q => console.log(`  ${q.skill_ids[0].padEnd(24)}  is_published: ${q.is_published}`))
}

main()
