import './env'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: all, error } = await sb
    .from('questions')
    .select('id,skill_ids,parameters,answer_template,question_template')

  if (error) { console.error(error); process.exit(1) }

  // Dump all fraction-related skills
  const hits = all?.filter(q =>
    JSON.stringify(q.skill_ids).toLowerCase().includes('fraction')
  ) ?? []

  console.log(`Fraction skills (${hits.length}):\n`)
  for (const q of hits) {
    console.log('id:       ', q.id)
    console.log('skills:   ', q.skill_ids)
    console.log('params:   ', JSON.stringify(q.parameters))
    console.log('answer:   ', q.answer_template)
    console.log('template: ', q.question_template.replace(/<[^>]+>/g, '').replace(/\s+/g,' ').trim().slice(0, 150))
    console.log()
  }
}

main()
