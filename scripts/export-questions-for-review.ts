import './env'
import { writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { renderQuestion } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'
import { skills } from '../data/skills'

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY review export.
// Pulls every question, renders it through the real paramEngine with several
// random parameter sets, auto-flags likely problems, and writes a human-readable
// dump grouped by topic. Makes NO writes to the database.
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLES = 6 // random parameter sets to render per question

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type QRow = {
  id: string
  skill_ids: string[]
  difficulty: number
  question_type: string
  question_template: string
  parameters: any
  answer_template: string
  answer_type: 'exact' | 'numeric' | 'fraction' | 'expression' | 'set'
  tolerance: number | null
  traps: { answer_template: string; response: string }[] | null
  explanation: string | null
  is_published: boolean
}

const topicOf = (skillId: string) =>
  skills.find(s => s.id === skillId)?.topic ?? 'Unknown'
const skillName = (skillId: string) =>
  skills.find(s => s.id === skillId)?.name ?? skillId

function flagsFor(q: QRow): { flags: string[]; samples: any[] } {
  const flags: string[] = []
  const samples: any[] = []
  const seenAnswers = new Set<string>()

  for (let i = 0; i < SAMPLES; i++) {
    let r
    try {
      r = renderQuestion(
        q.question_template,
        q.answer_template,
        q.traps ?? [],
        q.explanation,
        q.parameters ?? {},
      )
    } catch (e: any) {
      flags.push(`render threw: ${e?.message ?? e}`)
      break
    }
    samples.push(r)
    seenAnswers.add(r.answer)

    // 1. Template render errors
    const blob = [r.question, r.answer, r.explanation, ...r.traps.flatMap(t => [t.answer, t.response])].join(' ')
    if (blob.includes('[error:')) flags.push(`template error in render #${i + 1}`)

    // 2. Answer is not a sane value
    if (r.answer.trim() === '' || /NaN|Infinity|undefined|null/.test(r.answer))
      flags.push(`suspect answer "${r.answer}" in render #${i + 1}`)

    // 3. numeric/fraction answer that isn't actually numeric
    if ((q.answer_type === 'numeric' || q.answer_type === 'fraction') &&
        !/[0-9]/.test(r.answer))
      flags.push(`${q.answer_type} answer has no digits: "${r.answer}"`)

    // 4. Trap collisions — does any trap's answer get marked CORRECT?
    r.traps.forEach((t, ti) => {
      if (t.answer.trim() === '') return
      const res = checkAnswer(t.answer, r.answer, q.answer_type, q.tolerance, [])
      if (res.correct)
        flags.push(`trap #${ti + 1} answer "${t.answer}" is accepted as CORRECT (== "${r.answer}")`)
    })
  }

  // 5. Question never varies (all renders identical) — possibly missing params
  if (seenAnswers.size === 1 && SAMPLES > 1 && Object.keys(q.parameters ?? {}).length > 0)
    flags.push(`answer identical across all ${SAMPLES} renders ("${[...seenAnswers][0]}") — params may not affect answer`)

  // 6. Tolerance sanity
  if (q.answer_type === 'numeric' && (q.tolerance == null))
    flags.push(`numeric answer with no tolerance set`)

  return { flags: [...new Set(flags)], samples }
}

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('skill_ids')

  if (error) { console.error(error.message); process.exit(1) }
  const rows = (data ?? []) as QRow[]

  // Group by topic
  const byTopic: Record<string, QRow[]> = {}
  for (const q of rows) {
    const t = topicOf(q.skill_ids?.[0] ?? '')
    ;(byTopic[t] ??= []).push(q)
  }

  const out: string[] = []
  const allFlags: { id: string; topic: string; skill: string; published: boolean; flags: string[] }[] = []

  for (const topic of Object.keys(byTopic).sort()) {
    out.push(`\n${'='.repeat(78)}\n${topic.toUpperCase()}  (${byTopic[topic].length} questions)\n${'='.repeat(78)}`)
    for (const q of byTopic[topic]) {
      const { flags, samples } = flagsFor(q)
      if (flags.length) allFlags.push({ id: q.id, topic, skill: skillName(q.skill_ids?.[0] ?? ''), published: q.is_published, flags })

      out.push(`\n— ${skillName(q.skill_ids?.[0] ?? '')}  [${q.is_published ? 'LIVE' : 'draft'}]  diff ${q.difficulty}  type:${q.answer_type}  tol:${q.tolerance ?? '—'}`)
      out.push(`  id: ${q.id}`)
      if (flags.length) out.push(`  ⚠ FLAGS: ${flags.join(' | ')}`)
      out.push(`  template: ${q.question_template}`)
      out.push(`  answer_t: ${q.answer_template}`)
      samples.slice(0, 3).forEach((s, i) => {
        out.push(`   · sample ${i + 1}: Q="${s.question.replace(/\s+/g, ' ').trim()}"  → A="${s.answer}"`)
      })
      ;(q.traps ?? []).forEach((t, i) => out.push(`   trap ${i + 1}: ${t.answer_template}`))
      if (q.explanation) out.push(`   expl_t: ${q.explanation}`)
    }
  }

  // Summary of flags at the very top
  const header: string[] = []
  header.push(`QUESTION BANK REVIEW — ${rows.length} questions, ${SAMPLES} renders each`)
  header.push(`Generated ${new Date().toISOString()}\n`)
  header.push(`AUTO-FLAGGED QUESTIONS: ${allFlags.length}`)
  for (const f of allFlags) {
    header.push(`  [${f.published ? 'LIVE ' : 'draft'}] ${f.topic} / ${f.skill}  (${f.id})`)
    for (const fl of f.flags) header.push(`        - ${fl}`)
  }

  const text = header.join('\n') + '\n' + out.join('\n')
  writeFileSync('scripts/_question-review.txt', text)
  console.log(`Wrote scripts/_question-review.txt  (${rows.length} questions, ${allFlags.length} flagged)`)
}

main()
