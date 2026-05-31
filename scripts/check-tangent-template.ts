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
    .eq('id', 'a7cff7db-2c25-4628-9877-75b966d5dcaa')
    .single()

  if (error || !data) { console.error(error); process.exit(1) }

  // Print just the opening SVG/div tag so we can see the max-width
  const svgTagMatch = data.question_template.match(/<svg[^>]+>/)
  const divTagMatch = data.question_template.match(/<div[^>]+>/)
  console.log('div tag:', divTagMatch?.[0])
  console.log('svg tag:', svgTagMatch?.[0])
  console.log()
  // Print all text elements
  const texts = [...data.question_template.matchAll(/<text[^>]+>([^<]+)<\/text>/g)]
  for (const t of texts) {
    console.log('text content:', JSON.stringify(t[1]))
  }
}

main()
