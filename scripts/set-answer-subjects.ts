import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'
import { checkAnswer, canonicalSubject } from '../lib/questions/answerChecker'
import type { QuestionPart } from '../lib/questions/parts'

// Declare what quantity each calculus question's answer IS, so a student who
// names a different one is told — while still being marked correct.
//
// Measured against the live grader on 2026-11-02, on both parts of 89c77019:
// "v = …", "a = …", "s = …", "ds/dt = …", "dv/dt = …" and "y = …" are ALL
// accepted, because `assignmentPrefix` strips a prefix from one side when the
// other has none and these answer templates are bare expressions. That stays
// true. The only change is that the wrong ones now come back with a word about
// which quantity was asked for.
//
// The synonyms matter: v and ds/dt are the same quantity written two ways, as
// are a, dv/dt and d²s/dt². Declaring one spelling would nudge students who are
// entirely right.
//
// Both rows are DRAFTS and stay that way — `is_published` is never written
// here, and a published row is refused outright.
//
// Dry run by default; pass --apply to write.
//
//   npx tsx scripts/set-answer-subjects.ts
//   npx tsx scripts/set-answer-subjects.ts --apply
//
// ⚠ 36330aca is a SINGLE-part question, so its declaration goes in the new
// `questions.answer_subjects` column — apply
// supabase/migrations/20261102_question_answer_subject.sql first or that write
// fails. 89c77019 is multi-part and lands in the existing `parts` jsonb, which
// needs no migration.

type Target = {
  id: string
  /** A fragment of the part prompt, so a reordered parts array fails loudly. */
  partPrompt?: string
  partIndex?: number
  subjects: string[]
  /** A wrong subject a student would plausibly reach for, to show the effect. */
  probe: string
}

const TARGETS: Target[] = [
  {
    id: '89c77019-3d31-4627-96da-7874cac6bb13',
    partIndex: 0,
    partPrompt: 'velocity',
    subjects: ['v', 'ds/dt'],
    // s is the DISPLACEMENT — what the question gave them, not what it asked for.
    probe: 's',
  },
  {
    id: '89c77019-3d31-4627-96da-7874cac6bb13',
    partIndex: 1,
    partPrompt: 'acceleration',
    subjects: ['a', 'dv/dt', 'd²s/dt²'],
    // v is the answer to part (a), one differentiation short.
    probe: 'v',
  },
  {
    id: '36330aca-3b9a-438a-bb0d-75a392028c2d',
    subjects: ['dy/dx', "y'"],
    // y is the function itself, not its gradient function.
    probe: 'y',
  },
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const txt = (x: string) => x.replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ').trim()

async function main() {
  const apply = process.argv.includes('--apply')

  // Every declared subject must be something the grader's subject grammar
  // recognises, or it would silently never match a student who typed it.
  for (const t of TARGETS) {
    for (const s of t.subjects) {
      if (canonicalSubject(s) === null) {
        throw new Error(`"${s}" on ${t.id.slice(0, 8)} is not a subject the grader can parse`)
      }
    }
  }

  // The parts jsonb needs no migration; the row-level column does. Probe once,
  // so the multi-part question can be wired before the migration lands and the
  // single-part one is reported as blocked rather than failing the whole run.
  const probe = await supabase.from('questions').select('answer_subjects').limit(1)
  const hasColumn = !probe.error
  if (!hasColumn) {
    console.log('⚠ questions.answer_subjects does not exist yet — apply\n'
      + '  supabase/migrations/20261102_question_answer_subject.sql, then re-run.\n'
      + '  Single-part targets are shown below but will be SKIPPED.')
  }

  // Group by row: part (a) and part (b) of 89c77019 are one UPDATE.
  const byId = new Map<string, Target[]>()
  for (const t of TARGETS) byId.set(t.id, [...(byId.get(t.id) ?? []), t])

  let blocked = 0

  for (const [id, targets] of byId) {
    const { data, error } = await supabase.from('questions')
      .select('id, is_published, parts, answer_template, answer_type'
        + (hasColumn ? ', answer_subjects' : ''))
      .eq('id', id).single<{
        id: string; is_published: boolean; parts: unknown
        answer_template: string; answer_type: string; answer_subjects?: string[] | null
      }>()
    if (error) throw error
    if (data.is_published) throw new Error(`${id} is published — not touching it`)

    const parts = (data.parts ?? null) as QuestionPart[] | null
    console.log(`\n${id.slice(0, 8)}  (${parts ? `${parts.length} parts` : 'single part'})`)

    const update: Record<string, unknown> = {}
    const nextParts = parts ? parts.map(p => ({ ...p })) : null

    for (const t of targets) {
      let answerTemplate: string
      let before: string[] | null

      if (t.partIndex != null) {
        if (!nextParts) throw new Error(`${id} has no parts, but part ${t.partIndex} was expected`)
        const part = nextParts[t.partIndex]
        if (!part) throw new Error(`${id} has no part ${t.partIndex}`)
        if (t.partPrompt && !part.prompt.includes(t.partPrompt)) {
          throw new Error(`${id} part ${t.partIndex} prompt does not mention "${t.partPrompt}" — `
            + `the parts array is not in the order this script assumes`)
        }
        if (part.answer_type !== 'expression') {
          throw new Error(`${id} part ${t.partIndex} is ${part.answer_type}, not expression`)
        }
        answerTemplate = part.answer_template
        before = part.answer_subjects ?? null
        part.answer_subjects = t.subjects
      } else {
        if (data.answer_type !== 'expression') {
          throw new Error(`${id} is ${data.answer_type}, not expression`)
        }
        answerTemplate = data.answer_template
        before = data.answer_subjects ?? null
        if (hasColumn) update.answer_subjects = t.subjects
        else blocked++
      }

      // Assert the before-state: nothing declared yet, or exactly this.
      if (before && JSON.stringify(before) !== JSON.stringify(t.subjects)) {
        throw new Error(`${id}${t.partIndex != null ? ` part ${t.partIndex}` : ''} already declares `
          + `${JSON.stringify(before)} — refusing to overwrite a different declaration`)
      }

      // Show the effect on a real rendered answer, graded by the real grader.
      const answer = txt(evaluateTemplate(answerTemplate, { sel: 0 }))
      const typed = `${t.probe} = ${answer}`
      const was = checkAnswer(typed, answer, 'expression', null, [], false)
      const now = checkAnswer(typed, answer, 'expression', null, [], false, answerTemplate, t.subjects)
      const label = t.partIndex != null ? `part (${'ab'[t.partIndex]})` : 'answer'
      const state = before ? ' (already set)' : (t.partIndex == null && !hasColumn) ? ' — BLOCKED on the migration' : ''
      console.log(`   ${label}  declares ${JSON.stringify(t.subjects)}${state}`)
      console.log(`      typed "${typed}"`)
      console.log(`      was:  ${was.correct ? 'correct' : 'WRONG'} — ${txt(was.message)}`)
      console.log(`      now:  ${now.correct ? 'correct' : 'WRONG'} — ${txt(now.message)}`)
      if (!now.correct) throw new Error('the declaration made a correct answer wrong — stop')
      // The right subject must stay silent.
      const right = checkAnswer(`${t.subjects[0]} = ${answer}`, answer, 'expression',
        null, [], false, answerTemplate, t.subjects)
      if (right.message !== 'Correct!') {
        throw new Error(`"${t.subjects[0]} = …" was nudged, which it must not be: ${right.message}`)
      }
    }

    if (nextParts) update.parts = nextParts

    if (apply && Object.keys(update).length > 0) {
      const { error: upErr } = await supabase.from('questions').update(update).eq('id', id)
      if (upErr) throw upErr
      console.log(`   written: ${Object.keys(update).join(', ')}`)
    }
  }

  console.log(apply ? '\nUpdated. All rows still unpublished.' : '\ndry run — pass --apply to write')
  if (blocked) {
    console.log(`${blocked} single-part target(s) still need the migration applied; re-run after it.`)
  }
}

main().catch(e => { console.error(String(e.message ?? e)); process.exit(1) })
