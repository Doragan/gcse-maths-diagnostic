import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const id = 'b5edccf8-9acb-4bd7-b45d-ff94000329f1'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('question_template')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  const original = data.question_template
  console.log('current start:', JSON.stringify(original.slice(0, 60)))

  if (!original.startsWith('</div>')) {
    console.error('no leading </div> found — already fixed or wrong question')
    process.exit(1)
  }

  const fixed = original.replace(/^<\/div>/, '')

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ question_template: fixed })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  angles_in_polygons  b5edccf8  — leading </div> removed')
  console.log('   new start:', JSON.stringify(fixed.slice(0, 60)))
}

main()
