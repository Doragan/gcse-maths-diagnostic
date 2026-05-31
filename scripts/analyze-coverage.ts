import './env'
import { createClient } from '@supabase/supabase-js'
import { skills } from '../data/skills'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Include all questions (published + draft) so we see the full picture
  const { data: questions, error } = await supabase
    .from('questions')
    .select('skill_ids, is_published')

  if (error) { console.error(error.message); process.exit(1) }

  const skillMap = new Map(skills.map(s => [s.id, s]))

  // Track which skills have any question, and which have a published question
  const anyQ = new Map<string, number>()   // skill → total q count
  const pubQ = new Map<string, number>()   // skill → published q count

  for (const q of questions ?? []) {
    for (const sid of (q.skill_ids as string[])) {
      anyQ.set(sid, (anyQ.get(sid) ?? 0) + 1)
      if (q.is_published) pubQ.set(sid, (pubQ.get(sid) ?? 0) + 1)
    }
  }

  const allTopics = [...new Set(skills.map(s => s.topic))]

  console.log('\n=== MISSING QUESTIONS BY TOPIC ===')
  for (const topic of allTopics) {
    const topicSkills = skills.filter(s => s.topic === topic)
    const noQ       = topicSkills.filter(s => !anyQ.has(s.id))
    const draftOnly = topicSkills.filter(s => anyQ.has(s.id) && !pubQ.has(s.id))
    const live      = topicSkills.filter(s => pubQ.has(s.id))

    const lines: string[] = []
    if (noQ.length)       lines.push(`  NO QUESTIONS (${noQ.length}):`)
    noQ.forEach(s        => lines.push(`    ✗ ${s.name}${s.image ? '  [image-dependent]' : ''}`))
    if (draftOnly.length) lines.push(`  DRAFT ONLY (${draftOnly.length}):`)
    draftOnly.forEach(s  => lines.push(`    ~ ${s.name}  (${anyQ.get(s.id)} q)`))

    const header = `\n── ${topic}  ${live.length}/${topicSkills.length} live ──`
    console.log(header)
    if (lines.length) lines.forEach(l => console.log(l))
    else console.log('  ✓ all skills covered')
  }

  console.log('\n=== SUMMARY ===')
  for (const topic of allTopics) {
    const topicSkills = skills.filter(s => s.topic === topic)
    const live = topicSkills.filter(s => pubQ.has(s.id)).length
    const pct  = Math.round(100 * live / topicSkills.length)
    const filled = Math.round(pct / 5)
    const bar  = '█'.repeat(filled) + '░'.repeat(20 - filled)
    console.log(`${topic.padEnd(26)} ${bar} ${live}/${topicSkills.length} (${pct}%)`)
  }
}

main()
