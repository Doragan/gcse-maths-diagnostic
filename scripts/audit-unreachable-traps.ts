import './env'
import { createClient } from '@supabase/supabase-js'
import { renderQuestion, renderMultiPartQuestion, generateValues } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'

// Read-only sweep for UNREACHABLE traps.
//
// Prompted by b18d7b90 part (b), whose trap template rendered to a literal
// expression ("6/9+5/8") instead of a value. The blank is answer_type
// 'fraction' and the grader parses a single a/b, so the trap could only fire
// if a student typed that exact unevaluated string. It sat unnoticed because
// nothing checks that a trap is even EXPRESSIBLE in its declared answer type.
//
// The test generalises without knowing anything about types: feed a trap's own
// rendered value back as the student answer. If the trap doesn't fire, no
// student can ever reach it. Two distinct outcomes are worth separating:
//   DEAD      — grader says "wrong" but matches no trap: unreachable.
//   SHADOWED  — some EARLIER trap catches it first: the later one is dead too.
// (A trap equal to the correct answer grades as CORRECT; the harness already
// gates that case, and it is reported here as MASKS-ANSWER for completeness.)

const DRAWS = 8

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type Finding = { id: string; where: string; trap: string; kind: string }

function probe(
  studentValue: string,
  correct: string,
  type: any,
  tol: number | null,
  traps: { answer: string; response: string }[],
  requiresSimplest: boolean,
  index: number,
): string | null {
  if (!studentValue.trim()) return null
  // A trap that renders to an error/unresolved template is a separate defect
  // the harness already reports; skip rather than double-report.
  if (/\[error|\{\{|NaN/.test(studentValue)) return null
  const res = checkAnswer(studentValue, correct, type, tol, traps, requiresSimplest)
  if (res.correct) return 'MASKS-ANSWER'
  if (!res.trap) return 'DEAD'
  if (res.trap.response !== traps[index].response) return 'SHADOWED'
  return null
}

async function main() {
  const { data, error } = await supabase.from('questions')
    .select('id, question_template, parameters, answer_template, answer_type, tolerance, traps, explanation, requires_simplest, parts, is_published')
  if (error) throw error

  const findings: Finding[] = []
  let scanned = 0, trapsChecked = 0

  for (const q of data ?? []) {
    scanned++
    for (let draw = 0; draw < DRAWS; draw++) {
      let values: Record<string, number>
      try { values = generateValues((q.parameters ?? {}) as any) } catch { break }

      if (Array.isArray(q.parts) && q.parts.length > 0) {
        let r: any
        try { r = renderMultiPartQuestion(q.question_template, q.parts as any, (q.parameters ?? {}) as any, values) } catch { break }
        q.parts.forEach((p: any, pi: number) => {
          const rp = r.parts[pi]
          const letter = 'abcdefgh'[pi] ?? String(pi + 1)
          // Scalar part traps.
          if (p.answer_type !== 'multi_blank' && p.answer_type !== 'grid_draw') {
            (rp.traps ?? []).forEach((t: any, ti: number) => {
              trapsChecked++
              const kind = probe(t.answer, rp.answer, p.answer_type, p.tolerance, rp.traps, p.requires_simplest ?? false, ti)
              if (kind) findings.push({ id: q.id, where: `part (${letter}) trap ${ti + 1}`, trap: t.answer, kind })
            })
          }
          // multi_blank: each blank has its own traps and its own type.
          if (p.answer_type === 'multi_blank') {
            (p.blanks ?? []).forEach((bl: any, bi: number) => {
              const rb = rp.blanks?.[bi]
              if (!rb) return
              ;(rb.traps ?? []).forEach((t: any, ti: number) => {
                trapsChecked++
                const kind = probe(t.answer, rb.answer, bl.answer_type, bl.tolerance, rb.traps, bl.requires_simplest ?? false, ti)
                if (kind) findings.push({ id: q.id, where: `part (${letter}) blank ${bl.label} trap ${ti + 1}`, trap: t.answer, kind })
              })
            })
          }
        })
      } else {
        if (!q.answer_template) continue
        let r: any
        try {
          r = renderQuestion(q.question_template, q.answer_template, (q.traps ?? []) as any,
            q.explanation ?? '', (q.parameters ?? {}) as any, values)
        } catch { break }
        ;(r.traps ?? []).forEach((t: any, ti: number) => {
          trapsChecked++
          const kind = probe(t.answer, r.answer, q.answer_type, q.tolerance, r.traps, q.requires_simplest ?? false, ti)
          if (kind) findings.push({ id: q.id, where: `trap ${ti + 1}`, trap: t.answer, kind })
        })
      }
    }
  }

  // A trap only counts if it fails on EVERY draw — a one-off degenerate draw is
  // a different (already-reported) class of problem.
  const byKey = new Map<string, { f: Finding; hits: number }>()
  for (const f of findings) {
    const key = `${f.id}|${f.where}|${f.kind}`
    const e = byKey.get(key)
    if (e) e.hits++
    else byKey.set(key, { f, hits: 1 })
  }
  const persistent = [...byKey.values()].filter(e => e.hits >= DRAWS)

  console.log(`scanned ${scanned} questions, probed ${trapsChecked} rendered traps over ${DRAWS} draws each\n`)
  if (!persistent.length) {
    console.log('✅ no unreachable traps found.')
  } else {
    console.log(`⚠ ${persistent.length} trap(s) unreachable on EVERY draw:\n`)
    for (const { f } of persistent) {
      const pub = (data ?? []).find(q => q.id === f.id)?.is_published ? 'published' : 'draft'
      console.log(`  ${f.kind.padEnd(13)} ${f.id}  ${f.where}`)
      console.log(`      renders to: "${f.trap}"   (${pub})`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
