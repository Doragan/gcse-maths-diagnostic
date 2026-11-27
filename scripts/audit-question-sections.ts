import './env'
import { createClient } from '@supabase/supabase-js'
import { investigations } from '../data/investigations'
import { allDraws } from '../lib/skills/investigation'

// ─────────────────────────────────────────────────────────────────────────────
// Does every published question on an investigated skill have a section?
//
// A wrong answer opens the section that teaches it (docs/audit/33): the
// section's own checks map themselves, and the rest come from each
// investigation's `questionSections`. A question published after the map was
// written is in neither, so a wrong answer on it quietly offers the whole
// investigation from the start. This lists those — and map entries that no
// longer match a published question on the skill — so neither goes unnoticed.
//
// It reads the database, so it is a script beside verify-question.ts, not a
// vitest test. Run it after publishing a question on an investigated skill:
//
//   npx tsx scripts/audit-question-sections.ts
//
// Exits 1 when anything needs mapping, so it can gate a pipeline later.
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  // Original questions only: rows with source_paper set are past-paper drafts.
  const { data, error } = await supabase
    .from('questions')
    .select('id, skill_ids, question_template')
    .eq('is_published', true)
    .is('source_paper', null)
  if (error) throw error
  const questions = data ?? []

  let problems = 0
  for (const inv of Object.values(investigations)) {
    const checks = new Set<string>()
    for (const p of allDraws(inv.parameters)) {
      for (const stage of inv.build(p)) for (const c of stage.check ?? []) checks.add(c.questionId)
    }
    const authored = inv.questionSections ?? {}
    const onSkill = questions.filter(q => (q.skill_ids ?? []).includes(inv.skillId))
    const unmapped = onSkill.filter(q => !checks.has(q.id) && !(q.id in authored))
    const stale = Object.keys(authored).filter(id => !onSkill.some(q => q.id === id))
    const mapped = onSkill.length - unmapped.length
    console.log(`${inv.skillId.padEnd(36)} ${mapped}/${onSkill.length} mapped`)
    for (const q of unmapped) {
      const text = q.question_template.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
      console.log(`   UNMAPPED ${q.id}  ${JSON.stringify(q.skill_ids)}  ${text}`)
    }
    for (const id of stale) console.log(`   STALE    ${id}  in questionSections, but not a published question on this skill`)
    problems += unmapped.length + stale.length
  }
  if (problems) {
    console.log(`\n${problems} to fix: add each UNMAPPED id to its investigation's questionSections `
      + '(a section number, or null for none), and remove each STALE one.')
    process.exit(1)
  }
  console.log('\nevery published question on an investigated skill has a section, or is deliberately null')
}

main().catch(e => { console.error(e); process.exit(1) })
