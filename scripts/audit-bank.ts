import './env'
import { createClient } from '@supabase/supabase-js'
import { skills } from '../data/skills'
import { evaluateTemplate, generateValues } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'
import { SCALAR_ANSWER_TYPES } from '../lib/questions/answerTypes'
import { checkGridDraw } from '../lib/questions/gridDraw'

// ─────────────────────────────────────────────────────────────────────────────
// Bank health check (audit ②/Phase 4). Re-run after any authoring batch:
//   npx tsx scripts/audit-bank.ts
//
// Renders every published question across DRAWS parameter sets and reports:
//   • render errors, invalid answer types, missing skills, empty answers
//   • trap collisions classified ALWAYS-broken vs SOMETIMES-coincidental
//   • numeric answers that render unrounded (dp > 4) with a tight tolerance —
//     likely unmatchable (the "irrational answer" worry)
//   • skill-graph integrity (cycles / dupes / missing prereqs / dangling ids)
//   • coverage: skills with no published question
// Read-only — no writes.
// ─────────────────────────────────────────────────────────────────────────────

const DRAWS = 25
const VALID_ANSWER_TYPES: readonly string[] = SCALAR_ANSWER_TYPES
const ids = new Set(skills.map(s => s.id))
const byId = Object.fromEntries(skills.map(s => [s.id, s]))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function section(t: string) { console.log(`\n${'─'.repeat(70)}\n${t}\n${'─'.repeat(70)}`) }
function report(label: string, arr: string[], cap = 25) {
  const u = [...new Set(arr)]
  console.log(`\n${u.length ? '⚠ ' : '✓ '}${label}: ${u.length}`)
  u.slice(0, cap).forEach(x => console.log('   ' + x))
  if (u.length > cap) console.log(`   …and ${u.length - cap} more`)
}
function decimalPlaces(s: string): number {
  const m = s.match(/-?\d+(?:\.(\d+))?/)
  return m && m[1] ? m[1].length : 0
}

function auditGraph() {
  section('① SKILL GRAPH')
  const seen = new Set<string>(); const dupes: string[] = []
  for (const s of skills) { if (seen.has(s.id)) dupes.push(s.id); seen.add(s.id) }
  const missing: string[] = []; const selfRef: string[] = []
  for (const s of skills) for (const p of s.prerequisites ?? []) {
    if (!ids.has(p)) missing.push(`${s.id} → ${p}`)
    if (p === s.id) selfRef.push(s.id)
  }
  const cycles: string[] = []; const colour: Record<string, number> = {}
  function dfs(id: string, stack: string[]) {
    colour[id] = 1; stack.push(id)
    for (const p of byId[id]?.prerequisites ?? []) {
      if (!byId[p]) continue
      if (colour[p] === 1) cycles.push([...stack.slice(stack.indexOf(p)), p].join(' → '))
      else if (!colour[p]) dfs(p, stack)
    }
    stack.pop(); colour[id] = 2
  }
  for (const s of skills) if (!colour[s.id]) dfs(s.id, [])
  console.log(`nodes: ${skills.length}`)
  report('duplicate ids', dupes); report('missing prerequisites', missing)
  report('self-referential prereqs', selfRef); report('cycles', cycles)
}

async function auditBank() {
  section(`② QUESTION BANK (published, ${DRAWS} draws)`)
  const { data, error } = await supabase
    .from('questions')
    .select('id, skill_ids, parameters, question_template, answer_template, answer_type, tolerance, traps, parts, is_published')
    .eq('is_published', true)
  if (error || !data) { console.error(error); process.exit(1) }

  const renderErrors: string[] = [], badType: string[] = [], dangling: string[] = []
  const noSkills: string[] = [], emptyAns: string[] = [], unrounded: string[] = []
  const usedSkills = new Set<string>()
  const trapHits = new Map<string, { hits: number; total: number; desc: string }>()

  for (const q of data) {
    if (!q.skill_ids?.length) noSkills.push(q.id)
    for (const sid of q.skill_ids ?? []) { usedSkills.add(sid); if (!ids.has(sid)) dangling.push(`${q.id} → ${sid}`) }

    const parts: any[] = Array.isArray(q.parts) && q.parts.length ? q.parts : []
    // Multi_blank parts expand to one unit per blank; grid_draw parts get a
    // lighter dedicated check below (mirrors verify-question).
    const units = parts.length
      ? parts.flatMap((p, i) => p.answer_type === 'grid_draw'
          ? []
          : p.answer_type === 'multi_blank'
          ? (Array.isArray(p.blanks) ? p.blanks : []).map((b: any, bi: number) => ({
              ans: b.answer_template, type: b.answer_type ?? 'numeric', tol: b.tolerance ?? null,
              traps: b.traps ?? [], label: `part ${'abcdefgh'[i]} blank ${b.label ?? bi + 1}`,
            }))
          : [{ ans: p.answer_template, type: p.answer_type ?? 'numeric', tol: p.tolerance ?? null, traps: p.traps ?? [], label: `part ${'abcdefgh'[i]}` }])
      : [{ ans: q.answer_template, type: q.answer_type, tol: q.tolerance, traps: q.traps ?? [], label: 'answer' }]

    // Grid parts: per draw, every axis/element must evaluate finite + on-grid
    // + on-lattice (tolerance 0), and the canonical must self-grade.
    const gridParts = parts.map((p, i) => ({ p, i })).filter(({ p }) => p.answer_type === 'grid_draw')

    for (const u of units) if (!VALID_ANSWER_TYPES.includes(u.type)) badType.push(`${q.id} ${u.label}: "${u.type}"`)

    for (let i = 0; i < DRAWS; i++) {
      let vals: Record<string, number> = {}
      try { vals = generateValues((q.parameters ?? {}) as any) } catch {}
      const stem = (() => { try { return evaluateTemplate(q.question_template ?? '', vals) } catch { return '[error]' } })()
      if (/\[error/.test(stem)) { renderErrors.push(`${q.id} stem`); break }

      for (const u of units) {
        let ans = ''
        try { ans = evaluateTemplate(u.ans ?? '', vals) } catch { renderErrors.push(`${q.id} ${u.label} threw`); continue }
        if (/\[error/.test(ans)) { renderErrors.push(`${q.id} ${u.label}`); continue }
        if (!ans.trim()) { emptyAns.push(`${q.id} ${u.label}`); continue }

        // Irrational/over-precise numeric answer with a tight tolerance → likely unmatchable.
        if (u.type === 'numeric' && decimalPlaces(ans) > 4 && (u.tol == null || u.tol < 0.001)) {
          unrounded.push(`${q.id} ${u.label}: renders "${ans}" (${decimalPlaces(ans)} dp), tol=${u.tol ?? 'null'} — no round()?`)
        }

        for (const t of u.traps) {
          const key = `${q.id}|${u.label}|${t.answer_template}`
          if (!trapHits.has(key)) trapHits.set(key, { hits: 0, total: 0, desc: `${q.id} ${u.label}: trap "${t.answer_template}"` })
          const rec = trapHits.get(key)!
          let ta = ''
          try { ta = evaluateTemplate(t.answer_template ?? '', vals) } catch { continue }
          if (!ta.trim()) continue
          rec.total++
          if (checkAnswer(ta, ans, u.type as any, u.tol, [], false).correct) rec.hits++
        }
      }

      for (const { p, i: pi } of gridParts) {
        const label = `${q.id} part ${'abcdefgh'[pi]} grid`
        const num = (v: any): number => {
          if (typeof v === 'number') return v
          try { return parseFloat(evaluateTemplate(String(v), vals)) } catch { return NaN }
        }
        const g = p.grid ?? {}
        const ax = { min: num(g.x?.min), max: num(g.x?.max), step: Number(g.x?.step) || 1 }
        const ay = { min: num(g.y?.min), max: num(g.y?.max), step: Number(g.y?.step) || 1 }
        const els = (Array.isArray(g.elements) ? g.elements : []).map((e: any) => ({
          x: num(e.x), y: num(e.y), marks: Number(e.marks) || 0,
        }))
        const nums = [ax.min, ax.max, ay.min, ay.max, ...els.flatMap((e: any) => [e.x, e.y])]
        if (!nums.every(Number.isFinite)) { renderErrors.push(label); continue }
        // Cells span one step up-right from their corner, so must FIT inside.
        const xHi = g.mode === 'cells' ? ax.max - ax.step : ax.max
        const yHi = g.mode === 'cells' ? ay.max - ay.step : ay.max
        const offGrid = els.some((e: any) =>
          e.x < ax.min - 1e-9 || e.x > xHi + 1e-9 || e.y < ay.min - 1e-9 || e.y > yHi + 1e-9)
        if (offGrid) { renderErrors.push(`${label} (element off-grid)`); continue }
        const mode = ['points', 'polyline', 'line', 'cells', 'polygon'].includes(g.mode) ? g.mode : null
        if (!mode) { badType.push(`${q.id} part ${'abcdefgh'[pi]}: grid mode "${g.mode}"`); continue }
        const graded = checkGridDraw(
          els.map((e: any) => ({ x: e.x, y: e.y })), els, mode,
          Number(g.tolerance) || 0, { xStep: ax.step, yStep: ay.step },
        )
        if (!graded.correct) emptyAns.push(`${label} (canonical fails self-grade)`)
      }
    }
  }

  console.log(`published questions: ${data.length}`)
  report('render errors', renderErrors); report('invalid answer_type', badType)
  report('dangling skill_ids', dangling); report('questions with no skills', noSkills)
  report('empty rendered answers', emptyAns)
  report('🔶 unrounded numeric answers (tight tolerance — may be unmatchable)', unrounded)

  const always: string[] = [], sometimes: string[] = []
  for (const { hits, total, desc } of trapHits.values()) {
    if (!total || !hits) continue
    if (hits === total) always.push(desc)
    else sometimes.push(`${desc}  [${hits}/${total}]`)
  }
  report('🔴 BROKEN traps (collide every draw)', always)
  report('coincidental trap collisions (some draws)', sometimes)

  section('③ COVERAGE')
  const orphans = skills.filter(s => !usedSkills.has(s.id))
  console.log(`skills with NO published question: ${orphans.length} / ${skills.length}`)
  orphans.slice(0, 40).forEach(s => console.log('   ' + s.id))
  if (orphans.length > 40) console.log(`   …and ${orphans.length - 40} more`)
}

async function main() { auditGraph(); await auditBank() }
main()
