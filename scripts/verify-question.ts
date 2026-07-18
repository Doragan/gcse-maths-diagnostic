import './env'
import { createClient } from '@supabase/supabase-js'
import { skills } from '../data/skills'
import { evaluateTemplate, generateValues, satisfiesAllConstraints, type Parameters } from '../lib/questions/paramEngine'
import { checkAnswer, normalise } from '../lib/questions/answerChecker'
import { SCALAR_ANSWER_TYPES } from '../lib/questions/answerTypes'
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// ─────────────────────────────────────────────────────────────────────────────
// Authoring verification harness — the pre-publish gate for a question.
// Deep single-question checks (vs audit-bank.ts, which is a wide shallow sweep
// of the whole published bank). Run BEFORE inserting or publishing:
//
//   npx tsx scripts/verify-question.ts <question-id> [<id> ...]  verify DB rows
//   npx tsx scripts/verify-question.ts --drafts                  all unpublished rows
//   npx tsx scripts/verify-question.ts --file batch.json         pre-insert JSON
//                                                                (one object or an array)
//   flags:  --svg       rasterise each question's SVGs to PNG for eyeballing
//           --draws N   sample size when the parameter space is too big to
//                       enumerate (default 400; spaces ≤20k are exhaustive)
//
// Per parameter set, per answer unit (top-level answer or each part):
//   FAIL  render artefact ([error / undefined / NaN / unresolved {{) anywhere
//   FAIL  empty rendered answer
//   FAIL  canonical answer not accepted by the real grader (checkAnswer)
//   FAIL  a trap value the grader ACCEPTS as correct (answer⇄trap collision)
//   FAIL  a trap value that falls through silently (no trap fires)
//   FAIL/WARN  two traps on one unit rendering the same value (2nd is dead) —
//              FAIL when systematic (>half the value sets), WARN if occasional
//   FAIL  numeric answer rendering >4 dp with a tight tolerance (unmatchable)
//   FAIL  MC: explicit options that normalise-collide, or fewer than 2
//   WARN  MC: correct answer missing from the explicit option list
//   WARN  kind 'exam' with fewer than 2 skills / single-part 'mastery' with ≠1
//   FAIL  dangling skill_ids / invalid answer_type
//
// Exit code 0 = everything passed (warnings allowed), 1 = any failure.
// Read-only against the DB — never writes.
// ─────────────────────────────────────────────────────────────────────────────

const EXHAUSTIVE_CAP = 20000
const VALID_ANSWER_TYPES: readonly string[] = SCALAR_ANSWER_TYPES
const BAD_RENDER = /\[error|undefined|NaN|\{\{/
const skillIds = new Set(skills.map(s => s.id))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type Trap = { answer_template: string; response: string }
type Unit = {
  label: string
  prompt: string            // '' for the single top-level unit
  answer_template: string
  answer_type: string
  tolerance: number | null
  requires_simplest: boolean
  traps: Trap[]
  explanation: string
  // Set for the blank-units of one multi_blank part ("part-2"), so the
  // cross-blank ambiguity check knows which units belong together.
  group?: string
}
type Q = Record<string, any>

function decimalPlaces(s: string): number {
  const m = s.match(/-?\d+(?:\.(\d+))?/)
  return m && m[1] ? m[1].length : 0
}

function unitsOf(q: Q): Unit[] {
  const parts: any[] = Array.isArray(q.parts) && q.parts.length ? q.parts : []
  if (parts.length) {
    return parts.flatMap((p, i): Unit[] => {
      // A multi_blank part contributes one unit PER BLANK, so every existing
      // per-unit check (render sweep, self-grade, trap collisions, dp gate)
      // applies to each blank for free. Prompt/explanation render-checked once,
      // on the first blank's unit.
      if (p.answer_type === 'multi_blank') {
        const blanks: any[] = Array.isArray(p.blanks) ? p.blanks : []
        return blanks.map((b, bi): Unit => ({
          label: `part (${'abcdefgh'[i]}) blank ${b.label ?? bi + 1}`,
          // Part prompt (once) + this blank's own prompt — both render-checked.
          prompt: [bi === 0 ? (p.prompt ?? '') : '', b.prompt ?? ''].filter(Boolean).join(' '),
          answer_template: b.answer_template ?? '',
          answer_type: b.answer_type ?? 'numeric',
          tolerance: b.tolerance ?? null,
          requires_simplest: b.requires_simplest ?? false,
          traps: b.traps ?? [],
          explanation: bi === 0 ? (p.explanation ?? '') : '',
          group: `part-${i}`,
        }))
      }
      return [{
        label: `part (${'abcdefgh'[i]})`,
        prompt: p.prompt ?? '',
        answer_template: p.answer_template ?? '',
        answer_type: p.answer_type ?? 'numeric',
        tolerance: p.tolerance ?? null,
        requires_simplest: p.requires_simplest ?? false,
        traps: p.traps ?? [],
        explanation: p.explanation ?? '',
      }]
    })
  }
  return [{
    label: 'answer',
    prompt: '',
    answer_template: q.answer_template ?? '',
    answer_type: q.answer_type ?? 'numeric',
    tolerance: q.tolerance ?? null,
    requires_simplest: q.requires_simplest ?? false,
    traps: q.traps ?? [],
    explanation: q.explanation ?? '',
  }]
}

/**
 * Enumerate the parameter space. Exhaustive (constraint-filtered) when the raw
 * cross product is ≤ EXHAUSTIVE_CAP; otherwise `draws` random constraint-aware
 * samples via the engine's own generateValues.
 */
function enumerate(parameters: Parameters, draws: number): { combos: Record<string, number>[]; exhaustive: boolean } {
  const entries = Object.entries(parameters ?? {})
  if (!entries.length) return { combos: [{}], exhaustive: true }

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
    if (total > EXHAUSTIVE_CAP) break
  }

  if (total <= EXHAUSTIVE_CAP) {
    let combos: Record<string, number>[] = [{}]
    for (const axis of axes) {
      const next: Record<string, number>[] = []
      for (const c of combos) for (const v of axis.values) next.push({ ...c, [axis.key]: v })
      combos = next
    }
    combos = combos.filter(c => satisfiesAllConstraints(parameters, c))
    return { combos, exhaustive: true }
  }

  const combos: Record<string, number>[] = []
  for (let i = 0; i < draws; i++) {
    const v = generateValues(parameters)
    if (satisfiesAllConstraints(parameters, v)) combos.push(v)
  }
  return { combos, exhaustive: false }
}

function verifyQuestion(q: Q, label: string, draws: number): { fails: string[]; warns: string[]; combosChecked: number } {
  const fails: string[] = []
  const warns: string[] = []

  // ── metadata gates ──
  for (const sid of q.skill_ids ?? []) if (!skillIds.has(sid)) fails.push(`dangling skill id "${sid}"`)
  if (!(q.skill_ids ?? []).length) fails.push('no skill_ids')
  const units = unitsOf(q)
  const isMulti = Array.isArray(q.parts) && q.parts.length > 0

  // ── multi_blank structural gates ──
  // Part-level only: the question-level answer_type column carries a CHECK
  // constraint that deliberately excludes multi_blank.
  if (q.answer_type === 'multi_blank') fails.push(`question-level answer_type 'multi_blank' — multi_blank is PART-level only (author as a one-part question)`)
  if (isMulti) {
    for (let i = 0; i < q.parts.length; i++) {
      const p = q.parts[i]
      if (p.answer_type !== 'multi_blank') continue
      const pl = `part (${'abcdefgh'[i]})`
      const blanks: any[] = Array.isArray(p.blanks) ? p.blanks : []
      if (!blanks.length) { fails.push(`${pl}: multi_blank with no blanks`); continue }
      if (blanks.length === 1) warns.push(`${pl}: multi_blank with exactly 1 blank — use a normal part instead`)
      const labels = blanks.map(b => String(b.label ?? '').trim().toUpperCase())
      if (labels.some(l => !l)) fails.push(`${pl}: a blank has an empty label`)
      if (new Set(labels).size !== labels.length) fails.push(`${pl}: duplicate blank labels [${labels.join(', ')}]`)
      for (const b of blanks) {
        if (!String(b.answer_template ?? '').trim()) fails.push(`${pl} blank ${b.label}: empty answer template`)
        if (b.answer_type === 'multi_blank') fails.push(`${pl} blank ${b.label}: blanks cannot nest multi_blank`)
      }
      // part.marks must equal the blank sum (normalizePart computes it, but
      // hand-written --file JSON and direct DB writes can drift, and the exam
      // runner scores from the blanks while the assembler reads part.marks).
      const blankSum = blanks.reduce((s, b) => s + (Number(b.marks) || 0), 0)
      if (p.marks != null && Number(p.marks) !== blankSum) {
        fails.push(`${pl}: marks ${p.marks} ≠ sum of blank marks ${blankSum}`)
      }
    }
  }

  for (const u of units) if (!VALID_ANSWER_TYPES.includes(u.answer_type)) fails.push(`${u.label}: invalid answer_type "${u.answer_type}"`)
  if (q.kind === 'exam' && (q.skill_ids ?? []).length < 2) warns.push(`kind 'exam' but only ${(q.skill_ids ?? []).length} skill(s) — synthesis needs 2+ independent skills`)
  if (q.kind === 'mastery' && !isMulti && (q.skill_ids ?? []).length !== 1) warns.push(`single-part 'mastery' with ${(q.skill_ids ?? []).length} skills — mastery attribution wants exactly 1`)

  const isMC = q.question_type === 'multiple_choice'
  const mcTemplates: string[] | null = isMC && Array.isArray(q.mc_options) && q.mc_options.length >= 2 ? q.mc_options : null
  if (isMC && isMulti) warns.push('multiple_choice with parts — MC is question-level only; parts will ignore it')

  const { combos, exhaustive } = enumerate((q.parameters ?? {}) as Parameters, draws)
  if (!combos.length) { fails.push('parameter constraints unsatisfiable — no valid value sets exist'); return { fails, warns, combosChecked: 0 } }

  // Collision bookkeeping so a message names the trap and how often it hit.
  const trapCollisions = new Map<string, number>()
  const trapSilent = new Map<string, number>()
  // Cross-blank ambiguity: within one multi_blank part, how often two blanks
  // render the SAME answer (a transposing student is then indistinguishable
  // from a correct one).
  const blankPairSame = new Map<string, number>()
  // Two traps on the SAME unit that render an identical value on a combo: the
  // second is unreachable (the first fires), and a student who made the second
  // mistake gets the wrong feedback.
  const trapPairSame = new Map<string, number>()
  const seenFail = new Set<string>()
  const fail = (key: string, msg: string) => { if (!seenFail.has(key)) { seenFail.add(key); fails.push(msg) } }

  for (const c of combos) {
    const stem = (() => { try { return evaluateTemplate(q.question_template ?? '', c) } catch { return '[error]' } })()
    if (BAD_RENDER.test(stem)) fail('stem', `stem renders badly, e.g. at ${JSON.stringify(c)}`)

    const groupAns = new Map<string, { label: string, ans: string }[]>()

    for (const u of units) {
      const k = u.label
      let ans = ''
      try { ans = evaluateTemplate(u.answer_template, c) } catch { fail(`${k}:throw`, `${k}: answer template throws at ${JSON.stringify(c)}`); continue }
      if (BAD_RENDER.test(ans)) { fail(`${k}:bad`, `${k}: answer renders badly ("${ans}") at ${JSON.stringify(c)}`); continue }
      if (!ans.trim()) { fail(`${k}:empty`, `${k}: empty rendered answer at ${JSON.stringify(c)}`); continue }

      for (const strTpl of [u.prompt, u.explanation]) {
        if (!strTpl) continue
        try { if (BAD_RENDER.test(evaluateTemplate(strTpl, c))) fail(`${k}:text`, `${k}: prompt/explanation renders badly at ${JSON.stringify(c)}`) }
        catch { fail(`${k}:text`, `${k}: prompt/explanation throws at ${JSON.stringify(c)}`) }
      }

      if (u.answer_type === 'numeric' && decimalPlaces(ans) > 4 && (u.tolerance == null || u.tolerance < 0.001)) {
        fail(`${k}:dp`, `${k}: numeric answer "${ans}" has ${decimalPlaces(ans)} dp with tight tolerance — likely unmatchable (missing round()?)`)
      }

      const rt = u.traps.map(t => {
        try { return { answer: evaluateTemplate(t.answer_template, c), response: evaluateTemplate(t.response, c), tpl: t.answer_template } }
        catch { return { answer: '[error]', response: '', tpl: t.answer_template } }
      })
      for (const t of rt) if (BAD_RENDER.test(t.answer) || BAD_RENDER.test(t.response)) fail(`${k}:trap-render:${t.tpl}`, `${k}: trap "${t.tpl}" renders badly at ${JSON.stringify(c)}`)

      const graded = checkAnswer(ans, ans, u.answer_type as any, u.tolerance, rt, u.requires_simplest)
      if (!graded.correct) fail(`${k}:self`, `${k}: canonical answer "${ans}" NOT accepted by grader at ${JSON.stringify(c)}`)

      if (u.group) {
        const list = groupAns.get(u.group) ?? []
        list.push({ label: u.label, ans: normalise(ans) })
        groupAns.set(u.group, list)
      }

      for (const t of rt) {
        if (!t.answer.trim() || BAD_RENDER.test(t.answer)) continue
        const res = checkAnswer(t.answer, ans, u.answer_type as any, u.tolerance, rt, u.requires_simplest)
        const key = `${k}|${t.tpl}`
        if (res.correct) trapCollisions.set(key, (trapCollisions.get(key) ?? 0) + 1)
        else if (res.trap === null) trapSilent.set(key, (trapSilent.get(key) ?? 0) + 1)
      }

      // Two distinct traps rendering the same value → the second is dead.
      for (let a = 0; a < rt.length; a++) {
        for (let b = a + 1; b < rt.length; b++) {
          if (!rt[a].answer.trim() || !rt[b].answer.trim()) continue
          if (BAD_RENDER.test(rt[a].answer) || BAD_RENDER.test(rt[b].answer)) continue
          if (normalise(rt[a].answer) === normalise(rt[b].answer)) {
            const key = `${k}: two traps render the SAME value ("${rt[a].tpl}" ≡ "${rt[b].tpl}")`
            trapPairSame.set(key, (trapPairSame.get(key) ?? 0) + 1)
          }
        }
      }

      // MC gates (question-level, single-part only)
      if (mcTemplates && !isMulti) {
        const opts = mcTemplates.map(t => { try { return evaluateTemplate(t, c) } catch { return '[error]' } })
        if (opts.some(o => BAD_RENDER.test(o))) fail('mc:render', `MC option renders badly at ${JSON.stringify(c)}`)
        const norm = opts.map(normalise)
        if (new Set(norm).size !== norm.length) fail('mc:dupe', `MC options normalise-collide at ${JSON.stringify(c)}: [${opts.join(' | ')}]`)
        if (!norm.includes(normalise(ans))) warns.push(`MC options missing the correct answer at ${JSON.stringify(c)} (buildOptions will prepend it)`)
      }
    }

    // Cross-blank identical answers within each multi_blank part, this combo.
    for (const list of groupAns.values()) {
      for (let a = 0; a < list.length; a++) {
        for (let b = a + 1; b < list.length; b++) {
          if (list[a].ans === list[b].ans) {
            const key = `${list[a].label} ↔ ${list[b].label}`
            blankPairSame.set(key, (blankPairSame.get(key) ?? 0) + 1)
          }
        }
      }
    }
  }

  for (const [key, hits] of trapCollisions) {
    const [ulabel, tpl] = key.split('|')
    fails.push(`${ulabel}: trap "${tpl}" COLLIDES with the answer on ${hits}/${combos.length} value sets`)
  }
  for (const [key, hits] of trapSilent) {
    const [ulabel, tpl] = key.split('|')
    fails.push(`${ulabel}: trap "${tpl}" falls through silently (no trap fires) on ${hits}/${combos.length} value sets`)
  }
  for (const [pair, hits] of blankPairSame) {
    if (hits > combos.length / 2) {
      warns.push(`${pair}: identical rendered answers on ${hits}/${combos.length} value sets — a transposing student is indistinguishable from a correct one`)
    }
  }
  for (const [key, hits] of trapPairSame) {
    const msg = `${key} on ${hits}/${combos.length} value sets — the second trap is unreachable and the feedback is ambiguous`
    if (hits > combos.length / 2) fails.push(msg); else warns.push(msg)
  }

  if (!exhaustive) warns.push(`parameter space too large to enumerate — sampled ${combos.length} constraint-valid draws`)
  return { fails, warns, combosChecked: combos.length }
}

async function rasteriseSvgs(q: Q, label: string) {
  const sharp = (await import('sharp')).default
  const outDir = join(process.env.TEMP ?? tmpdir(), 'claude', 'verify-question')
  mkdirSync(outDir, { recursive: true })

  const sources: { name: string; tpl: string }[] = []
  const collect = (name: string, html: string) => {
    for (const [i, m] of [...(html ?? '').matchAll(/<svg[\s\S]*?<\/svg>/g)].entries()) sources.push({ name: `${name}${i ? `-${i}` : ''}`, tpl: m[0] })
  }
  collect('stem', q.question_template)
  for (const [i, p] of (Array.isArray(q.parts) ? q.parts : []).entries()) collect(`part${'abcdefgh'[i]}`, p.prompt)
  if (!sources.length) { console.log('   --svg: no SVGs found'); return }

  const { combos } = enumerate((q.parameters ?? {}) as Parameters, 50)
  const picks = [combos[0], combos[Math.floor(combos.length / 2)], combos[combos.length - 1]]
    .filter((c, i, a) => a.findIndex(x => JSON.stringify(x) === JSON.stringify(c)) === i)

  for (const src of sources) {
    for (const [i, c] of picks.entries()) {
      const svg = evaluateTemplate(src.tpl, c).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      const file = join(outDir, `${label.slice(0, 8)}-${src.name}-v${i}.png`)
      try {
        await sharp(Buffer.from(svg)).resize({ width: 620 }).flatten({ background: '#ffffff' }).png().toFile(file)
        console.log(`   svg → ${file}  ${JSON.stringify(c)}`)
      } catch (e: any) {
        console.log(`   svg ✗ ${src.name} failed to rasterise: ${e.message}`)
      }
    }
  }
}

async function loadQuestions(args: string[]): Promise<{ q: Q; label: string }[]> {
  const fileIdx = args.indexOf('--file')
  if (fileIdx !== -1) {
    const raw = JSON.parse(readFileSync(args[fileIdx + 1], 'utf8'))
    const arr = Array.isArray(raw) ? raw : [raw]
    return arr.map((q: Q, i: number) => ({ q, label: q.id ?? `${(q.skill_ids ?? ['?']).join('+')}#${i}` }))
  }
  if (args.includes('--drafts')) {
    const { data, error } = await supabase.from('questions').select('*').eq('is_published', false)
    if (error) { console.error(error.message); process.exit(1) }
    return (data ?? []).map((q: Q) => ({ q, label: q.id }))
  }
  const ids = args.filter(a => !a.startsWith('--') && !/^\d+$/.test(a))
  if (!ids.length) {
    console.log('usage: npx tsx scripts/verify-question.ts <question-id> [...] | --drafts | --file batch.json   [--svg] [--draws N]')
    process.exit(1)
  }
  const { data, error } = await supabase.from('questions').select('*').in('id', ids)
  if (error) { console.error(error.message); process.exit(1) }
  const found = new Set((data ?? []).map((q: Q) => q.id))
  for (const id of ids) if (!found.has(id)) { console.error(`✗ not found in DB: ${id}`); process.exit(1) }
  return (data ?? []).map((q: Q) => ({ q, label: q.id }))
}

async function main() {
  const args = process.argv.slice(2)
  const drawsIdx = args.indexOf('--draws')
  const draws = drawsIdx !== -1 ? parseInt(args[drawsIdx + 1], 10) : 400
  const wantSvg = args.includes('--svg')

  const questions = await loadQuestions(args)
  console.log(`verifying ${questions.length} question(s)\n`)

  let anyFail = false
  for (const { q, label } of questions) {
    const { fails, warns, combosChecked } = verifyQuestion(q, label, draws)
    const status = fails.length ? '❌ FAIL' : '✅ PASS'
    if (fails.length) anyFail = true
    console.log(`${status}  ${label}  [${(q.skill_ids ?? []).join(', ')}]  kind=${q.kind ?? '?'} d${q.difficulty ?? '?'} ${q.calculator ?? ''}  — ${combosChecked} value sets`)
    for (const f of fails) console.log(`   ✗ ${f}`)
    for (const w of [...new Set(warns)]) console.log(`   ⚠ ${w}`)
    if (wantSvg) await rasteriseSvgs(q, label)
  }

  console.log(`\n${anyFail ? '❌ at least one question failed — do not insert/publish' : '✅ all questions passed'}`)
  process.exit(anyFail ? 1 : 0)
}
main()
