import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import {
  evaluateTemplate, satisfiesAllConstraints, type Parameters,
} from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'
import type { ScalarAnswerType } from '../lib/questions/answerTypes'

// ─────────────────────────────────────────────────────────────────────────────
// Collision sweep for the shared answer grader.
//
// Widening equivalence in answerChecker is dangerous in one specific way. The
// grader returns on `isCorrect` before consulting traps, so a trap that starts
// matching the CORRECT answer is harmless — it can never fire. But a trap that
// starts matching ANOTHER trap is not: whichever is checked second becomes
// unreachable, and a student who makes that second mistake is handed the
// diagnosis for the first one.
//
// So: render every published question's answer and traps across its parameter
// space, ask the grader which pairs it considers equal, and write the result to
// a snapshot. Run once before a grader change and once after; the diff is the
// blast radius.
//
//   npx tsx scripts/sweep-grader-collisions.ts --out before.json
//   …make the change…
//   npx tsx scripts/sweep-grader-collisions.ts --out after.json --compare before.json
//
// Only scalar single-part questions whose answer_type the expression path can
// reach are swept (expression / exact / fraction), which is the surface the
// term/factor sorters touch.
// ─────────────────────────────────────────────────────────────────────────────

const SWEPT_TYPES: ScalarAnswerType[] = ['expression', 'exact', 'fraction']
const EXHAUSTIVE_CAP = 400
const SAMPLE_TARGET = 200

type Q = {
  id: string
  skill_ids: string[]
  answer_type: ScalarAnswerType
  answer_template: string
  tolerance: number | null
  requires_simplest: boolean | null
  parameters: Parameters | null
  traps: { answer_template?: string; answer?: string; response?: string }[] | null
  parts: unknown[] | null
  is_published: boolean
}

/**
 * Enumerate the parameter space DETERMINISTICALLY.
 *
 * verify-question.ts falls back to random draws above its cap, which is right
 * for a one-shot check but useless here: a before/after diff needs both runs to
 * look at the same combinations, or sampling noise shows up as phantom "new"
 * collisions. (It did on the first run of this script — a question whose answer
 * and trap render identically at some values appeared 38 times as new, purely
 * because the second run happened to sample those values.)
 *
 * Above the cap we therefore take an evenly strided walk through the index
 * space rather than random draws.
 */
function enumerate(parameters: Parameters | null): Record<string, number>[] {
  const entries = Object.entries(parameters ?? {})
  if (!entries.length) return [{}]

  const axes: { key: string; values: number[] }[] = []
  let total = 1
  for (const [key, cfg] of entries) {
    const values: number[] = []
    if (cfg.type === 'decimal') {
      const factor = Math.pow(10, cfg.decimal_places ?? 1)
      for (let v = Math.round(cfg.min * factor); v <= Math.round(cfg.max * factor); v++) values.push(v / factor)
    } else {
      for (let v = cfg.min; v <= cfg.max; v++) values.push(v)
    }
    axes.push({ key, values })
    total *= values.length
  }

  const at = (index: number): Record<string, number> => {
    const combo: Record<string, number> = {}
    let rest = index
    for (const axis of axes) {
      combo[axis.key] = axis.values[rest % axis.values.length]
      rest = Math.floor(rest / axis.values.length)
    }
    return combo
  }

  const combos: Record<string, number>[] = []
  if (total <= EXHAUSTIVE_CAP) {
    for (let i = 0; i < total; i++) combos.push(at(i))
  } else {
    // Stride chosen coprime-ish to the axis lengths so the walk spreads across
    // every axis rather than marching along the fastest-varying one.
    const stride = Math.max(1, Math.floor(total / SAMPLE_TARGET)) + 1
    for (let i = 0, n = 0; n < SAMPLE_TARGET && i < total; i += stride, n++) combos.push(at(i))
  }
  return combos.filter(c => satisfiesAllConstraints(parameters!, c))
}

/**
 * Does the grader consider `student` correct when the expected answer is
 * `expected`? Traps are passed empty: we are probing pure equivalence, not
 * trap feedback.
 */
function graderSaysEqual(student: string, expected: string, q: Q): boolean {
  try {
    return checkAnswer(
      student, expected, q.answer_type, q.tolerance, [], q.requires_simplest ?? true,
    ).correct
  } catch {
    return false
  }
}

type Collision = { question: string; kind: 'answer~trap' | 'trap~trap'; a: string; b: string; at: string }

async function main() {
  const outArg = process.argv.indexOf('--out')
  const cmpArg = process.argv.indexOf('--compare')
  const outPath = outArg > -1 ? process.argv[outArg + 1] : null
  const cmpPath = cmpArg > -1 ? process.argv[cmpArg + 1] : null
  if (!outPath) { console.error('usage: --out <file.json> [--compare <before.json>]'); process.exit(1) }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  // Drafts are swept too. An earlier version looked only at published rows and
  // missed the very question this grader change was reported against — a draft
  // whose trap starts colliding with the answer at one parameter value. A draft
  // is a question that has not been published YET; finding the problem now is
  // the whole point.
  const { data, error } = await sb
    .from('questions')
    .select('id, skill_ids, answer_type, answer_template, tolerance, requires_simplest, parameters, traps, parts, is_published')
  if (error) { console.error('query failed:', error.message); process.exit(1) }

  const qs = (data as Q[])
    .filter(q => !q.parts?.length)                       // multi-part graded per unit elsewhere
    .filter(q => SWEPT_TYPES.includes(q.answer_type))
    .filter(q => q.answer_template)

  const collisions: Collision[] = []
  let combosChecked = 0

  for (const q of qs) {
    const traps = (q.traps ?? []).filter(t => t.answer_template || t.answer)
    if (!traps.length) continue

    for (const combo of enumerate(q.parameters)) {
      combosChecked++
      let answer: string
      try { answer = evaluateTemplate(q.answer_template, combo) } catch { continue }

      // null = this trap does not render at these values. Deliberately null
      // rather than a sentinel string: an earlier version marked them with a
      // leading space and tested `startsWith(' ')`, which a stray edit turned
      // into `startsWith('')` — true for every string, so the whole sweep
      // silently reported zero collisions.
      const rendered: (string | null)[] = []
      for (const t of traps) {
        try { rendered.push(evaluateTemplate(String(t.answer_template ?? t.answer), combo)) }
        catch { rendered.push(null) }
      }

      const at = JSON.stringify(combo)

      // answer ~ trap: harmless on its own (checkAnswer returns before traps),
      // but recorded so the diff shows the full shape of any widening.
      rendered.forEach((tr, i) => {
        if (tr === null) return
        if (graderSaysEqual(tr, answer, q)) {
          collisions.push({ question: q.id, kind: 'answer~trap', a: 'answer', b: `trap${i}=${tr}`, at })
        }
      })

      // trap ~ trap: the damaging case — the later trap becomes unreachable.
      for (let i = 0; i < rendered.length; i++) {
        for (let j = i + 1; j < rendered.length; j++) {
          if (rendered[i] === null || rendered[j] === null) continue
          if (graderSaysEqual(rendered[j]!, rendered[i]!, q)) {
            collisions.push({
              question: q.id, kind: 'trap~trap',
              a: `trap${i}=${rendered[i]}`, b: `trap${j}=${rendered[j]}`, at,
            })
          }
        }
      }
    }
  }

  // One row per distinct pair — a collision holding across 300 combos is one
  // finding, not 300.
  const uniq = new Map<string, Collision>()
  for (const c of collisions) uniq.set(`${c.question}|${c.kind}|${c.a}|${c.b}`, c)
  const list = [...uniq.values()].sort((x, y) => (x.question + x.a).localeCompare(y.question + y.a))

  writeFileSync(outPath, JSON.stringify({ questions: qs.length, combosChecked, collisions: list }, null, 2) + '\n')
  console.log(`swept ${qs.length} published questions, ${combosChecked} parameter combinations`)
  console.log(`  answer~trap pairs : ${list.filter(c => c.kind === 'answer~trap').length}`)
  console.log(`  trap~trap pairs   : ${list.filter(c => c.kind === 'trap~trap').length}`)
  console.log(`wrote ${outPath}`)

  if (cmpPath && existsSync(cmpPath)) {
    const before = JSON.parse(readFileSync(cmpPath, 'utf8')) as { collisions: Collision[] }
    const key = (c: Collision) => `${c.question}|${c.kind}|${c.a}|${c.b}`
    const had = new Set(before.collisions.map(key))
    const added = list.filter(c => !had.has(key(c)))
    const now = new Set(list.map(key))
    const removed = before.collisions.filter(c => !now.has(key(c)))

    console.log(`\ncompared against ${cmpPath}`)
    console.log(`  NEW collisions     : ${added.length}`)
    for (const c of added) console.log(`    [${c.kind}] ${c.question}  ${c.a}  ==  ${c.b}   at ${c.at}`)
    console.log(`  removed collisions : ${removed.length}`)
    for (const c of removed) console.log(`    [${c.kind}] ${c.question}  ${c.a}  ==  ${c.b}`)

    const newTrapTrap = added.filter(c => c.kind === 'trap~trap')
    if (newTrapTrap.length) {
      console.log(`\n!! ${newTrapTrap.length} NEW trap~trap collision(s) — a trap has become unreachable.`)
      process.exitCode = 1
    } else {
      console.log('\nNo new trap~trap collisions.')
    }
  }
}

main()
