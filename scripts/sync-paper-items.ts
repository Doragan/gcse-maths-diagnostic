import './env'
import { createClient } from '@supabase/supabase-js'
import { PAPERS } from '../lib/demoPapers'
import { skills } from '../data/skills'

// ─────────────────────────────────────────────────────────────────────────────
// Create/refresh the `questions` rows that real-exam paper items need.
//
//   npx tsx scripts/sync-paper-items.ts                  # dry run (default)
//   npx tsx scripts/sync-paper-items.ts --apply          # write
//   npx tsx scripts/sync-paper-items.ts --paper <slug>   # limit to one paper
//
// WHY THESE ROWS EXIST — `practice_attempts.question_id` is NOT NULL and a hard
// FK to `questions.id`, so a teacher's marks can only become attempts if every
// markable item has a row to point at. These rows are never served: they are
// permanently unpublished (a CHECK constraint enforces it) and hidden from the
// admin list by `source_paper`.
//
// IDEMPOTENT — matches on (source_paper, question_template's leading label) via
// a stored `paper_item_key`, so re-running after editing a PaperConfig updates
// in place rather than duplicating. It NEVER deletes: an item removed from a
// config is reported, not dropped, because attempts may already reference it.
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const APPLY = process.argv.includes('--apply')
const paperArg = process.argv.indexOf('--paper')
const ONLY = paperArg > -1 ? process.argv[paperArg + 1] : null

const knownSkills = new Set(skills.map(s => s.id))

/**
 * Stable identity for an item within a paper. The row is found again by
 * (source_paper, this), so it must never change for a given item — it is the
 * paper's own question id, which is the label printed on the exam.
 */
function itemKey(paperId: string, questionId: string) {
  return `${paperId}#${questionId}`
}

type Row = {
  skill_ids: string[]
  difficulty: number
  question_template: string
  question_type: string
  parameters: Record<string, never>
  answer_template: string
  answer_type: string
  tolerance: null
  traps: never[]
  explanation: null
  is_published: false
  calculator: string
  parts: null
  kind: string
  marks: number
  source_paper: string
}

function rowFor(paperId: string, calc: string, q: (typeof PAPERS)[string]['questions'][number]): Row {
  return {
    skill_ids: q.skillIds,
    // Paper items are never assembled into anything (they are unpublished), so
    // difficulty is inert. 3 keeps it mid-range rather than skewing any future
    // aggregate that happens to average it.
    difficulty: 3,
    // Human-readable only — shown if anyone inspects the row directly. Prefixed
    // with the exam label so a row is identifiable at a glance in the table.
    question_template: `[${itemKey(paperId, q.id)}] ${q.label} — ${q.desc}`,
    question_type: 'numeric',
    parameters: {},
    // Never graded: the mark comes from the teacher, not from an answer check.
    answer_template: '',
    answer_type: 'numeric',
    tolerance: null,
    traps: [],
    explanation: null,
    is_published: false,
    calculator: calc,
    parts: null,
    kind: q.kind,
    marks: q.marks,
    source_paper: paperId,
  }
}

/** Non-calc for Paper 1, calculator for Papers 2 and 3 — from the subtitle. */
function calcModeOf(subtitle: string): string {
  return /non-calculator/i.test(subtitle) ? 'non_calc' : 'calc'
}

async function main() {
  const papers = Object.values(PAPERS).filter(p => !ONLY || p.id === ONLY)
  if (!papers.length) {
    console.error(`no paper matched --paper ${ONLY}. Known: ${Object.keys(PAPERS).join(', ')}`)
    process.exit(1)
  }

  // Fail before touching anything if a skill id is bogus — a wrong id would
  // silently credit a skill that does not exist.
  let bad = 0
  for (const p of papers) {
    for (const q of p.questions) {
      for (const id of q.skillIds) {
        if (!knownSkills.has(id)) { console.error(`✗ ${p.id} ${q.id}: unknown skill "${id}"`); bad++ }
      }
    }
  }
  if (bad) { console.error(`\n${bad} unknown skill id(s) — aborting.`); process.exit(1) }

  console.log(APPLY ? 'APPLYING\n' : 'DRY RUN — pass --apply to write\n')

  for (const paper of papers) {
    const calc = calcModeOf(paper.subtitle)
    const { data: existing, error } = await supabase
      .from('questions')
      .select('id, question_template, skill_ids, kind, marks')
      .eq('source_paper', paper.id)
    if (error) {
      console.error(`  fetch failed for ${paper.id}: ${error.message}`)
      console.error('  (has the 20260812_questions_source_paper migration been applied?)')
      process.exit(1)
    }

    // Existing rows keyed by the [paper#id] prefix stamped into the template.
    const byKey = new Map<string, { id: string; skill_ids: string[]; kind: string; marks: number }>()
    for (const r of existing ?? []) {
      const m = r.question_template?.match(/^\[([^\]]+)\]/)
      if (m) byKey.set(m[1], r)
    }

    const toInsert: Row[] = []
    const toUpdate: { id: string; row: Row; why: string[] }[] = []
    let unchanged = 0

    for (const q of paper.questions) {
      const key = itemKey(paper.id, q.id)
      const row = rowFor(paper.id, calc, q)
      const found = byKey.get(key)
      if (!found) { toInsert.push(row); continue }
      const why: string[] = []
      if (found.skill_ids.join() !== row.skill_ids.join()) why.push(`skills ${found.skill_ids.join('+')} → ${row.skill_ids.join('+')}`)
      if (found.kind !== row.kind) why.push(`kind ${found.kind} → ${row.kind}`)
      if (found.marks !== row.marks) why.push(`marks ${found.marks} → ${row.marks}`)
      if (why.length) toUpdate.push({ id: found.id, row, why })
      else unchanged++
      byKey.delete(key)
    }

    console.log(`${paper.id} (${calc})`)
    console.log(`  insert ${toInsert.length}, update ${toUpdate.length}, unchanged ${unchanged}`)
    for (const u of toUpdate) console.log(`    ~ ${u.row.question_template.slice(0, 60)}… (${u.why.join('; ')})`)
    // Anything left in byKey is an orphan — in the DB but no longer in the
    // config. Never auto-deleted: attempts may point at it.
    for (const [key, r] of byKey) console.log(`    ! orphan (left alone): ${key} → ${r.id}`)

    if (!APPLY) continue

    if (toInsert.length) {
      const { error: insErr } = await supabase.from('questions').insert(toInsert)
      if (insErr) { console.error(`  insert failed: ${insErr.message}`); process.exit(1) }
      console.log(`  inserted ${toInsert.length}`)
    }
    for (const u of toUpdate) {
      const { error: upErr } = await supabase.from('questions').update(u.row).eq('id', u.id)
      if (upErr) { console.error(`  update failed for ${u.id}: ${upErr.message}`); process.exit(1) }
    }
    if (toUpdate.length) console.log(`  updated ${toUpdate.length}`)
  }

  console.log(APPLY ? '\nDone.' : '\nNothing written.')
}

main()
