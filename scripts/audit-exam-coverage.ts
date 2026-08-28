import './env'
import { createClient } from '@supabase/supabase-js'
import { skills } from '../data/skills'
import * as fs from 'fs'
import * as path from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// Exam-weighted coverage + quality metrics (re-runnable version of the
// workstream-⑧ cross-reference in docs/audit/05-exam-coverage.md).
//   npx tsx scripts/audit-exam-coverage.ts [--dump <file.json>]
// Marks are involvement-weighted: a 3-mark part listing two skills credits 3
// to each. Foundation and Higher tallied separately. Read-only.
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type ExamRow = {
  q: string; part: string | null; marks: number; skill_ids: string[]
  skill_gap: string | null; answer_form: string; kind: string
  traps: string[]; app_supported: string
}

const byId = Object.fromEntries(skills.map(s => [s.id, s]))

function loadPapers() {
  const dir = path.join(__dirname, '../data/exam-audit')
  const perSkill = new Map<string, {
    fMarks: number; hMarks: number; fParts: number; hParts: number
    trapLabels: Map<string, number>; papers: Set<string>
  }>()
  let rowCount = 0
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const paper = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    const isF = paper.meta.tier === 'Foundation'
    for (const r of paper.rows as ExamRow[]) {
      rowCount++
      for (const sid of r.skill_ids ?? []) {
        if (!perSkill.has(sid)) perSkill.set(sid, { fMarks: 0, hMarks: 0, fParts: 0, hParts: 0, trapLabels: new Map(), papers: new Set() })
        const rec = perSkill.get(sid)!
        if (isF) { rec.fMarks += r.marks; rec.fParts++ } else { rec.hMarks += r.marks; rec.hParts++ }
        rec.papers.add(paper.paper_id)
        for (const t of r.traps ?? []) rec.trapLabels.set(t, (rec.trapLabels.get(t) ?? 0) + 1)
      }
    }
  }
  return { perSkill, rowCount }
}

async function main() {
  const { perSkill, rowCount } = loadPapers()
  const { data: questions, error } = await supabase.from('questions').select('*')
  if (error || !questions) { console.error(error); process.exit(1) }

  const dumpIdx = process.argv.indexOf('--dump')
  if (dumpIdx > -1) fs.writeFileSync(process.argv[dumpIdx + 1], JSON.stringify(questions, null, 1))

  const pub = new Map<string, number>(), draft = new Map<string, number>()
  const pubQs = questions.filter(q => q.is_published)
  for (const q of questions) {
    for (const sid of q.skill_ids ?? []) {
      const m = q.is_published ? pub : draft
      m.set(sid, (m.get(sid) ?? 0) + 1)
    }
  }

  console.log(`exam rows: ${rowCount}; exam-tested skills: ${perSkill.size}`)
  console.log(`questions: ${questions.length} total, ${pubQs.length} published`)

  // ── A. zero-published-coverage exam skills, by total marks ──
  const zero = [...perSkill.entries()]
    .filter(([sid]) => !pub.get(sid))
    .map(([sid, r]) => ({ sid, total: r.fMarks + r.hMarks, ...r, drafts: draft.get(sid) ?? 0 }))
    .sort((a, b) => b.total - a.total)
  console.log(`\n== A. Exam-tested skills with ZERO published questions: ${zero.length} ==`)
  console.log(`   (total exam marks touched: ${zero.reduce((s, z) => s + z.total, 0)})`)
  for (const z of zero) console.log(`  ${String(z.total).padStart(3)} (F${z.fMarks}/H${z.hMarks})  ${z.sid}${z.drafts ? `  [${z.drafts} draft]` : ''}${byId[z.sid] ? '' : '  ⚠ NOT IN GRAPH'}`)

  // ── B. thin coverage: heavy exam skills with 1 published question ──
  const thin = [...perSkill.entries()]
    .filter(([sid]) => pub.get(sid) === 1)
    .map(([sid, r]) => ({ sid, total: r.fMarks + r.hMarks, ...r }))
    .sort((a, b) => b.total - a.total)
  console.log(`\n== B. Exam-tested skills with only ONE published question: ${thin.length} ==`)
  for (const t of thin.slice(0, 30)) console.log(`  ${String(t.total).padStart(3)} (F${t.fMarks}/H${t.hMarks})  ${t.sid}`)

  // ── B2. tier balance of the whole bank vs exam weight ──
  let fCov = 0, fTot = 0, hCov = 0, hTot = 0
  for (const [sid, r] of perSkill) {
    fTot += r.fMarks; hTot += r.hMarks
    if (pub.get(sid)) { fCov += r.fMarks; hCov += r.hMarks }
  }
  console.log(`\n== B2. Mark-weighted coverage (skill has ≥1 published q) ==`)
  console.log(`  Foundation: ${fCov}/${fTot} marks (${Math.round(100 * fCov / fTot)}%)`)
  console.log(`  Higher:     ${hCov}/${hTot} marks (${Math.round(100 * hCov / hTot)}%)`)

  // ── C. bank skills never seen in 2024 exams ──
  const unseen = [...pub.keys()].filter(sid => !perSkill.has(sid))
  console.log(`\n== C. Published-bank skills with no 2024 exam appearance: ${unseen.length} ==`)
  console.log('  ' + unseen.join(', '))

  // ── D. quality metrics over published questions ──
  console.log(`\n== D. Quality metrics (published) ==`)
  type Unit = { label: string; traps: any[]; explanation?: string }
  const noExpl: string[] = [], shortExpl: string[] = [], noTraps: string[] = [], oneTrap: string[] = []
  const badTrapResp: string[] = []
  let unitCount = 0, trapCount = 0
  const trapHisto = new Map<number, number>()
  for (const q of pubQs) {
    const parts: any[] = Array.isArray(q.parts) && q.parts.length ? q.parts : []
    const units: Unit[] = parts.length
      ? parts.map((p, i) => ({ label: `${q.id.slice(0, 8)} part ${'abcdefgh'[i]}`, traps: p.traps ?? [], explanation: p.explanation }))
      : [{ label: q.id.slice(0, 8), traps: q.traps ?? [], explanation: q.explanation }]
    for (const u of units) {
      unitCount++
      trapCount += u.traps.length
      trapHisto.set(u.traps.length, (trapHisto.get(u.traps.length) ?? 0) + 1)
      const skillNames = (q.skill_ids ?? []).join(',')
      if (!u.explanation?.trim()) noExpl.push(`${u.label} [${skillNames}]`)
      else if (u.explanation.trim().length < 60) shortExpl.push(`${u.label} (${u.explanation.trim().length} ch) [${skillNames}]`)
      if (!u.traps.length) noTraps.push(`${u.label} [${skillNames}]`)
      else if (u.traps.length === 1) oneTrap.push(`${u.label} [${skillNames}]`)
      for (const t of u.traps) {
        if (!t.response?.trim() || t.response.trim().length < 20) badTrapResp.push(`${u.label}: trap "${t.answer_template}" response=${JSON.stringify(t.response ?? null)}`)
      }
    }
  }
  console.log(`answer units (question or part): ${unitCount}; traps: ${trapCount} (avg ${(trapCount / unitCount).toFixed(2)}/unit)`)
  console.log(`traps-per-unit histogram: ${[...trapHisto.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v}`).join('  ')}`)
  const show = (label: string, arr: string[], cap = 20) => {
    console.log(`\n${arr.length ? '⚠' : '✓'} ${label}: ${arr.length}`)
    arr.slice(0, cap).forEach(x => console.log('   ' + x))
    if (arr.length > cap) console.log(`   …and ${arr.length - cap} more`)
  }
  show('units with NO explanation', noExpl)
  show('units with short explanation (<60 chars)', shortExpl)
  show('units with ZERO traps', noTraps, 40)
  show('units with only ONE trap', oneTrap, 10)
  show('trap responses missing/short (<20 chars)', badTrapResp)

  // ── D2. kind / calculator distribution ──
  const dist = (field: string) => {
    const m = new Map<string, number>()
    for (const q of pubQs) m.set(q[field] ?? 'null', (m.get(q[field] ?? 'null') ?? 0) + 1)
    return [...m.entries()].map(([k, v]) => `${k}:${v}`).join('  ')
  }
  console.log(`\nkind → ${dist('kind')}`)
  console.log(`calculator → ${dist('calculator')}`)
  console.log(`multi-part questions: ${pubQs.filter(q => Array.isArray(q.parts) && q.parts.length).length}`)

  // ── E. exam trap labels vs bank traps, top exam skills ──
  console.log(`\n== E. Exam-mined trap labels vs bank trap count (top 25 skills by marks) ==`)
  const top = [...perSkill.entries()]
    .map(([sid, r]) => ({ sid, total: r.fMarks + r.hMarks, ...r }))
    .sort((a, b) => b.total - a.total).slice(0, 25)
  for (const t of top) {
    let bankTraps = 0
    for (const q of pubQs) {
      if (!(q.skill_ids ?? []).includes(t.sid)) continue
      const parts: any[] = Array.isArray(q.parts) && q.parts.length ? q.parts : []
      bankTraps += parts.length ? parts.reduce((s, p) => s + (p.traps?.length ?? 0), 0) : (q.traps?.length ?? 0)
    }
    const labels = [...t.trapLabels.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([l, n]) => n > 1 ? `${l}×${n}` : l).join(', ')
    console.log(`  ${t.sid} — ${t.total} marks, bank q:${pub.get(t.sid) ?? 0}, bank traps:${bankTraps}`)
    if (labels) console.log(`      exam traps: ${labels}`)
  }
}

main()
