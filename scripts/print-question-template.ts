import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ids = [
  'c0c02057-d8d1-43d1-adf0-4ecc5ee570cf',  // exterior_angles
  '3a59b15a-60c8-466c-af1c-b52d6c86635a',  // same_segment
  '6bc803e1-b16b-40d5-aded-e3cfe6c8e4fa',  // alternate_segment
  '1761d75b-4c11-4604-9850-85918ea17efa',  // corresponding_angles
]

async function main() {
  for (const id of ids) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, question_template')
      .eq('id', id)
      .single()

    if (error || !data) { console.log(id, 'NOT FOUND'); continue }

    // Print just the SVG part
    const svgStart = data.question_template.indexOf('<svg')
    const svgEnd   = data.question_template.indexOf('</svg>') + 6
    if (svgStart >= 0) {
      console.log('\n=== ' + id + ' ===')
      console.log(data.question_template.slice(svgStart, svgEnd))
    } else {
      console.log('\n=== ' + id + ' (no SVG) ===')
      console.log(data.question_template.slice(0, 400))
    }
  }
}

main()
