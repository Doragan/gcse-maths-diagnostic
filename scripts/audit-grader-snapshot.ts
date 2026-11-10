import './env'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { evaluateTemplate, generateValues } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'

// ─────────────────────────────────────────────────────────────────────────────
// A before/after snapshot of what the grader SAYS, over the whole questions
// table, so a change to answerChecker can be proved not to move anything it
// did not mean to move.
//
//   npx tsx scripts/audit-grader-snapshot.ts out.json      write a snapshot
//   npx tsx scripts/audit-grader-snapshot.ts a.json b.json compare two
//
// The workflow a grader change wants:
//
//   git stash && npx tsx scripts/audit-grader-snapshot.ts before.json
//   git stash pop && npx tsx scripts/audit-grader-snapshot.ts after.json
//   npx tsx scripts/audit-grader-snapshot.ts before.json after.json
//
// ── WHY A SNAPSHOT AND NOT ASSERTIONS ───────────────────────────────────────
// audit-bank.ts already asserts the properties a question must have (it
// self-grades, its traps do not collide). This asks a different question —
// "did anything CHANGE?" — which no assertion can express, because the point
// is the cases nobody thought to assert. It records the full verdict for every
// question in the table: the boolean, the message, and which trap matched.
// The message is in deliberately: "correct, but simplify" and "correct" are
// both `correct: true`, and the difference between them is the whole of some
// grader changes.
//
// ── WHY THE DRAWS ARE SEEDED ────────────────────────────────────────────────
// generateValues() reads Math.random, so two runs would render different
// numbers and every row would "differ". Math.random is replaced with a fixed
// LCG for the duration, which makes a snapshot reproducible across commits —
// the only way the comparison means anything.
//
// Read-only: no writes to the database, and the output file is the only thing
// it touches.
// ─────────────────────────────────────────────────────────────────────────────

/** Parameter sets per question. 8 is enough to reach every branch of a draw. */
const DRAWS = 8

/**
 * A deterministic stand-in for Math.random (Numerical Recipes LCG). Installed
 * for the whole run, so draw N of question Q renders the same numbers on every
 * commit. Not cryptographic and does not need to be.
 */
function seedRandom(seed: number) {
  let s = seed >>> 0
  Math.random = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

type Row = {
  id: string
  source_paper: string | null
  answer_template: string | null
  answer_type: string | null
  tolerance: number | null
  requires_simplest: boolean | null
  answer_subjects: string[] | null
  traps: { answer_template?: string }[] | null
  parameters: any
  parts: any[] | null
}

type Unit = {
  label: string
  ans: string
  type: string
  tol: number | null
  rs: boolean
  subjects: string[] | undefined
  template: string
  traps: { answer_template?: string }[]
}

/**
 * One graded probe. `key` identifies it across runs; everything else is the
 * verdict being compared. `trap` is the trap's ANSWER rather than its index,
 * because a trap list can be reordered by an authoring script without the
 * grader having changed at all.
 */
type Record_ = {
  key: string
  student: string
  correct: boolean
  trap: string | null
  units: string | null
  message: string
}

/**
 * Expand a question into the units the grader actually sees — the row's own
 * answer, or one per part, or one per blank of a multi_blank part. Mirrors
 * audit-bank.ts and verify-question.ts; grid_draw parts are skipped, since
 * they go through checkGridDraw rather than checkAnswer.
 */
function unitsOf(q: Row): Unit[] {
  const parts = Array.isArray(q.parts) && q.parts.length ? q.parts : []
  if (!parts.length) {
    return [{
      label: 'answer', ans: q.answer_template ?? '', type: q.answer_type ?? 'numeric',
      tol: q.tolerance, rs: q.requires_simplest ?? false,
      subjects: q.answer_subjects ?? undefined,
      template: q.answer_template ?? '', traps: q.traps ?? [],
    }]
  }
  return parts.flatMap((p: any, i: number) => {
    const letter = 'abcdefgh'[i] ?? String(i)
    if (p.answer_type === 'grid_draw') return []
    if (p.answer_type === 'multi_blank') {
      return (Array.isArray(p.blanks) ? p.blanks : []).map((b: any, bi: number) => ({
        label: `part ${letter} blank ${b.label ?? bi + 1}`,
        ans: b.answer_template ?? '', type: b.answer_type ?? 'numeric',
        tol: b.tolerance ?? null, rs: b.requires_simplest ?? false,
        subjects: b.answer_subjects ?? undefined,
        template: b.answer_template ?? '', traps: b.traps ?? [],
      }))
    }
    return [{
      label: `part ${letter}`, ans: p.answer_template ?? '', type: p.answer_type ?? 'numeric',
      tol: p.tolerance ?? null, rs: p.requires_simplest ?? false,
      subjects: p.answer_subjects ?? undefined,
      template: p.answer_template ?? '', traps: p.traps ?? [],
    }]
  })
}

async function fetchAll(): Promise<Row[]> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const out: Row[] = []
  // PostgREST caps a response at 1000 rows, so page explicitly — a silent
  // truncation here would quietly shrink the thing being proved.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('questions')
      .select('id, source_paper, answer_template, answer_type, tolerance, requires_simplest, answer_subjects, traps, parameters, parts')
      .order('id')
      .range(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...(data as Row[]))
    if (!data || data.length < 1000) break
  }
  return out
}

function snapshot(outFile: string) {
  return fetchAll().then(rows => {
    const records: Record_[] = []
    let bank = 0, exam = 0, skipped = 0
    for (const q of rows) {
      if (q.source_paper == null) bank++; else exam++
      const units = unitsOf(q)
      for (let draw = 0; draw < DRAWS; draw++) {
        // Seeded per (question, draw) rather than once for the run, so adding
        // or removing a question cannot shift every later question's numbers.
        seedRandom(hash(`${q.id}#${draw}`))
        let vals: Record<string, number> = {}
        try { vals = generateValues(((q as any).parameters ?? {}) as any) } catch { /* no params */ }
        for (const u of units) {
          let ans = ''
          try { ans = evaluateTemplate(u.ans, vals) } catch { skipped++; continue }
          if (!ans.trim() || /\[error/.test(ans)) { skipped++; continue }

          const probes: { tag: string, student: string }[] = [
            // The claim that matters: every question still grades its own
            // correct answer the same way, message included.
            { tag: 'self', student: ans },
            // The same answer with its whitespace removed. Before a change to
            // normalise() these two were by definition identical; a difference
            // here is exactly the blast radius of such a change.
            { tag: 'nospace', student: ans.replace(/\s+/g, '') },
          ]
          // RENDERED traps, which is what every live caller passes: checkAnswer
          // reads `trap.answer`, a value, not the `answer_template` stored on
          // the row. Passing the unrendered list would compare against "{a}+1".
          const rendered: { answer: string, response: string, method_marks?: number, misconception?: string | null }[] = []
          for (const t of u.traps ?? []) {
            let ta = ''
            try { ta = evaluateTemplate((t as any).answer_template ?? '', vals) } catch { continue }
            if (!ta.trim() || /\[error/.test(ta)) continue
            rendered.push({
              answer: ta,
              response: (t as any).response ?? '',
              ...((t as any).method_marks != null ? { method_marks: (t as any).method_marks } : {}),
              ...((t as any).misconception != null ? { misconception: (t as any).misconception } : {}),
            })
            // Each authored trap's own value: it must keep matching the trap
            // it was written for, and keep its wording.
            probes.push({ tag: `trap:${(t as any).answer_template}`, student: ta })
          }

          for (const p of probes) {
            const r = checkAnswer(
              p.student, ans, u.type as any, u.tol, rendered,
              u.rs, u.template, u.subjects,
            )
            records.push({
              key: `${q.id}|${u.label}|d${draw}|${p.tag}`,
              student: p.student,
              correct: r.correct,
              trap: r.trap ? (r.trap.response ?? '') : null,
              units: r.unitsIssue ?? null,
              message: r.message,
            })
          }
        }
      }
    }
    records.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    writeFileSync(outFile, records.map(r => JSON.stringify(r)).join('\n') + '\n')
    console.log(`rows: ${rows.length} (bank ${bank}, exam ${exam}); ${records.length} graded probes`
      + (skipped ? `; ${skipped} units skipped (empty or unrenderable)` : ''))
    console.log(`→ ${outFile}`)
  })
}

/** FNV-1a, so a question id maps to a stable draw seed. */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h * 0x01000193) >>> 0
  }
  return h
}

function compare(aFile: string, bFile: string) {
  const read = (f: string) => new Map<string, Record_>(
    readFileSync(f, 'utf-8').split('\n').filter(Boolean)
      .map(l => { const r = JSON.parse(l) as Record_; return [r.key, r] })
  )
  const a = read(aFile), b = read(bFile)
  const onlyA: string[] = [], onlyB: string[] = [], changed: string[] = []
  for (const [k, ra] of a) {
    const rb = b.get(k)
    if (!rb) { onlyA.push(k); continue }
    if (ra.correct !== rb.correct || ra.trap !== rb.trap
        || ra.units !== rb.units || ra.message !== rb.message) {
      changed.push(`${k}\n    typed  "${ra.student}"`
        + `\n    before ${ra.correct ? 'ACCEPT' : 'REJECT'}${ra.units ? ` [units:${ra.units}]` : ''} ${ra.trap !== null ? '[trap] ' : ''}${ra.message}`
        + `\n    after  ${rb.correct ? 'ACCEPT' : 'REJECT'}${rb.units ? ` [units:${rb.units}]` : ''} ${rb.trap !== null ? '[trap] ' : ''}${rb.message}`)
    }
  }
  for (const k of b.keys()) if (!a.has(k)) onlyB.push(k)
  console.log(`${a.size} probes before, ${b.size} after`)
  console.log(`\n${changed.length ? '⚠ ' : '✓ '}verdict changed: ${changed.length}`)
  changed.slice(0, 60).forEach(c => console.log('  ' + c))
  if (changed.length > 60) console.log(`  …and ${changed.length - 60} more`)
  // A probe present in only one run is a RENDERING difference, not a grading
  // one — a question added, removed or re-parameterised between the two runs.
  if (onlyA.length || onlyB.length) {
    console.log(`\nnote: ${onlyA.length} probes only in ${aFile}, ${onlyB.length} only in ${bFile}`
      + ' (question added/removed/re-parameterised, not a grader change)')
  }
  process.exit(changed.length ? 1 : 0)
}

const args = process.argv.slice(2)
if (args.length === 1) {
  snapshot(args[0])
} else if (args.length === 2) {
  compare(args[0], args[1])
} else {
  console.log('Usage:')
  console.log('  npx tsx scripts/audit-grader-snapshot.ts <out.json>          write a snapshot')
  console.log('  npx tsx scripts/audit-grader-snapshot.ts <a.json> <b.json>  compare two')
  process.exit(1)
}
