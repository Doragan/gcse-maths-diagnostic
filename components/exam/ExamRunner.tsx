'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getSession } from '../../lib/auth'
import { skillsById, getPrerequisiteTree } from '../../lib/skills/skillGraph'
import { calculateMastery, applyPrerequisiteCredit, type MasteryStatus } from '../../lib/skills/masteryEngine'
import { renderQuestion, renderMultiPartQuestion, type Parameters } from '../../lib/questions/paramEngine'
import { checkAnswer } from '../../lib/questions/answerChecker'
import { assembleExam, candidateOf, type CalculatorMode } from '../../lib/exam/assembler'
import { DEFAULT_BLUEPRINT, NOMINAL_MARKS } from '../../lib/exam/blueprint'
import { higherOnlySkillIds } from '../../data/courses'
import type { QuestionPart } from '../../lib/questions/parts'
import type { ScalarAnswerType } from '../../lib/questions/answerTypes'
import {
  checkGridDraw, serialiseGridAnswer, parseGridAnswer, formatGridPoints,
  type RenderedGrid, type GridDrawMode,
} from '../../lib/questions/gridDraw'
import { groupExamAttempts } from '../../lib/exam/recordAttempts'
import GridCanvas from '../practice/GridCanvas'
import MathInput from '../practice/MathInput'
import { colors, font, radius, card, primaryButton, secondaryButton } from '../../lib/styles'

type AnswerType = ScalarAnswerType
type Tier = 'foundation' | 'higher'

// Where the runner is embedded. A teacher previews unlimited papers and nothing
// is recorded; a student spends a monthly allowance and their answers feed the
// skill map. Everything between config and review is identical.
export type ExamVariant = 'teacher-preview' | 'student'

const HIGHER_ONLY = new Set(higherOnlySkillIds)

type Unit = {
  key: string
  label: string | null          // "(a)" etc. for multi-part; null for single-part
  promptHtml: string            // part prompt (multi-part) or '' (single, uses header)
  correctAnswer: string
  answerType: AnswerType
  tolerance: number | null
  requiresSimplest: boolean
  traps: { answer: string; response: string }[]
  explanation: string
  skillIds: string[]
  kind: 'mastery' | 'exam'
  marks: number
  // A grid_draw part's rendered grid — when present the unit is answered on a
  // GridCanvas (answerType is an inert placeholder) and earns FRACTIONAL
  // credit per element.
  grid?: RenderedGrid
}
type Item = {
  questionId: string
  number: number
  headerHtml: string
  imageUrl: string | null
  skillNames: string
  marks: number
  units: Unit[]
}
type UnitResult = {
  correct: boolean // FULLY correct — the projected-mastery panel keys on this
  message: string
  studentAnswer: string
  correctAnswer: string
  explanation: string
  marksEarned: number // fractional credit: grid units earn per-element marks
  // grid units: verdict per student point (drawn order), for the review overlay
  perStudent?: boolean[]
}

type QuestionRow = {
  id: string
  skill_ids: string[]
  difficulty: number
  calculator: string | null
  kind: string | null
  question_type: string
  parts: QuestionPart[] | null
  question_template: string
  answer_template: string
  answer_type: AnswerType
  tolerance: number | null
  requires_simplest: boolean | null
  traps: { answer_template: string; response: string }[] | null
  explanation: string | null
  image_url: string | null
  parameters: Parameters | null
}

const letter = (i: number) => `(${String.fromCharCode(97 + i)})`

function buildItem(q: QuestionRow, number: number): Item {
  const skillNames = q.skill_ids.map(id => skillsById[id]?.name ?? id).join(', ')

  if (q.parts && q.parts.length > 0) {
    const r = renderMultiPartQuestion(q.question_template, q.parts, q.parameters ?? {})
    // A multi_blank part flattens to one Unit PER BLANK (key q.id:i:b) — the
    // flat answers/results records, the submit loop, per-blank marks and the
    // review boxes then all work unchanged. NOTE: the projected-mastery panel
    // therefore counts each answered blank as one attempt on the part's skills.
    // Fine for this teacher-only, write-nothing preview; when the exam becomes
    // student-facing and records attempts, collapse a multi_blank part's blanks
    // into ONE attempt (correct = all blanks right) to match the practice rule.
    const units: Unit[] = q.parts.flatMap((p, i) => {
      if (p.answer_type === 'multi_blank') {
        const rb = r.parts[i].blanks ?? []
        return (p.blanks ?? []).map((blank, b): Unit => ({
          key: `${q.id}:${i}:${b}`,
          label: `${letter(i)} · ${blank.label}`,
          // Part prompt rendered once (first blank); each blank then carries
          // its own short prompt so the units are self-describing.
          promptHtml: [b === 0 ? r.parts[i].prompt : '', rb[b]?.prompt ?? '']
            .filter(Boolean).join(' '),
          correctAnswer: rb[b]?.answer ?? '',
          answerType: blank.answer_type,
          tolerance: blank.tolerance,
          requiresSimplest: blank.requires_simplest ?? false,
          traps: rb[b]?.traps ?? [],
          // Explanation shown once, in the last blank's review box.
          explanation: b === (p.blanks?.length ?? 0) - 1 ? r.parts[i].explanation : '',
          skillIds: p.skill_ids,
          kind: p.kind === 'exam' ? 'exam' : 'mastery',
          marks: blank.marks || 1,
        }))
      }
      if (p.answer_type === 'grid_draw') {
        // ONE unit per grid part (a drawing is one interaction); fractional
        // credit comes from checkGridDraw at submit time. A missing rendered
        // grid (impossible for harness-verified rows) contributes nothing.
        const g = r.parts[i].grid as RenderedGrid | undefined
        if (!g) return []
        return [{
          key: `${q.id}:${i}`,
          label: letter(i),
          promptHtml: r.parts[i].prompt,
          correctAnswer: formatGridPoints(g.elements.map(e => ({ x: e.x, y: e.y }))),
          answerType: 'exact' as AnswerType, // inert — grid units never reach checkAnswer
          tolerance: null,
          requiresSimplest: false,
          traps: [],
          explanation: r.parts[i].explanation,
          skillIds: p.skill_ids,
          kind: p.kind === 'exam' ? 'exam' : 'mastery',
          marks: p.marks || 1,
          grid: g,
        }]
      }
      return [{
        key: `${q.id}:${i}`,
        label: letter(i),
        promptHtml: r.parts[i].prompt,
        correctAnswer: r.parts[i].answer,
        answerType: p.answer_type,
        tolerance: p.tolerance,
        requiresSimplest: p.requires_simplest ?? false,
        traps: r.parts[i].traps,
        explanation: r.parts[i].explanation,
        skillIds: p.skill_ids,
        kind: p.kind === 'exam' ? 'exam' : 'mastery',
        marks: p.marks || 1,
      }]
    })
    return { questionId: q.id, number, headerHtml: r.stem, imageUrl: q.image_url, skillNames, marks: units.reduce((s, u) => s + u.marks, 0), units }
  }

  const r = renderQuestion(q.question_template, q.answer_template, q.traps ?? [], q.explanation, q.parameters ?? {})
  const marks = NOMINAL_MARKS[q.difficulty] ?? 1
  return {
    questionId: q.id,
    number,
    headerHtml: r.question,
    imageUrl: q.image_url,
    skillNames,
    marks,
    units: [{
      key: `${q.id}:0`,
      label: null,
      promptHtml: '',
      correctAnswer: r.answer,
      answerType: q.answer_type,
      tolerance: q.tolerance,
      requiresSimplest: q.requires_simplest ?? false,
      traps: r.traps,
      explanation: r.explanation,
      skillIds: q.skill_ids,
      kind: q.kind === 'exam' ? 'exam' : 'mastery',
      marks,
    }],
  }
}

export default function ExamRunner({ variant }: { variant: ExamVariant }) {
  const router = useRouter()
  const isStudent = variant === 'student'
  const dashboardHref = isStudent ? '/student/dashboard' : '/dashboard'
  const [gate, setGate] = useState<'checking' | 'ok'>('checking')
  const [phase, setPhase] = useState<'config' | 'loading' | 'running' | 'review'>('config')
  const [tier, setTier] = useState<Tier>('foundation')
  const [mode, setMode] = useState<CalculatorMode>('non_calc')
  const [items, setItems] = useState<Item[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, UnitResult>>({})
  const [score, setScore] = useState<{ earned: number; total: number }>({ earned: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  // Student quota: null until fetched. remaining=null means unlimited (paid).
  const [quota, setQuota] = useState<{ remaining: number | null; isPaid: boolean } | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push(isStudent ? '/student' : '/auth'); return }
      if (isStudent) {
        // Must be a student account; a teacher visiting is bounced to their own.
        const { data: student } = await supabase.from('students').select('id').eq('id', session.user.id).single()
        if (!student) { router.push('/dashboard'); return }
        setGate('ok')
        // Peek at the month's allowance for the config screen (display only —
        // the /api/exam/quota POST is the authoritative gate on start).
        try {
          const res = await fetch('/api/exam/quota', { headers: { Authorization: `Bearer ${session.access_token}` } })
          if (res.ok) {
            const q = await res.json()
            setQuota({ remaining: q.remaining, isPaid: q.isPaid })
          }
        } catch { /* display-only; the POST still enforces */ }
      } else {
        const { data: teacher } = await supabase.from('teachers').select('id').eq('id', session.user.id).single()
        if (!teacher) { router.push('/student/dashboard'); return }
        setGate('ok')
      }
    })
  }, [])

  const allUnits = items.flatMap(it => it.units)
  const totalMarks = allUnits.reduce((s, u) => s + u.marks, 0)
  const answeredCount = allUnits.filter(u => (answers[u.key] ?? '').trim() !== '').length

  async function startExam(calcMode: CalculatorMode) {
    setMode(calcMode)
    setPhase('loading')
    setError(null)
    const { data, error: qErr } = await supabase
      .from('questions')
      .select('id, skill_ids, difficulty, calculator, kind, question_type, parts, question_template, answer_template, answer_type, tolerance, requires_simplest, traps, explanation, image_url, parameters')
      .eq('is_published', true)
    if (qErr || !data) { setError('Could not load questions. Please try again.'); setPhase('config'); return }

    const rows = data as QuestionRow[]
    const byId = new Map(rows.map(r => [r.id, r]))
    const candidates = rows.map(candidateOf).filter((c): c is NonNullable<typeof c> => c !== null)
    // Foundation papers exclude questions that touch a Higher-only skill; Higher
    // draws from the whole pool (every Foundation skill is also on Higher).
    const assembled = assembleExam(candidates, DEFAULT_BLUEPRINT, {
      calculatorMode: calcMode,
      blockedSkillIds: tier === 'foundation' ? HIGHER_ONLY : undefined,
    })
    if (assembled.questionIds.length === 0) { setError('No questions available for this paper yet.'); setPhase('config'); return }

    // Student: spend one monthly generation now — AFTER a paper is known to
    // assemble, so a technical failure never burns an allowance. The server is
    // authoritative; the peeked `quota` is only for display.
    if (isStudent) {
      const { data: { session } } = await supabase.auth.getSession()
      try {
        const res = await fetch('/api/exam/quota', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token}` },
        })
        if (res.status === 402) {
          setLimitReached(true)
          setPhase('config')
          return
        }
        if (!res.ok) { setError('Could not start the mini-exam. Please try again.'); setPhase('config'); return }
        const q = await res.json()
        setQuota({ remaining: q.remaining, isPaid: q.isPaid })
      } catch {
        setError('Could not start the mini-exam. Please check your connection and try again.')
        setPhase('config')
        return
      }
    }

    const built = assembled.questionIds
      .map(id => byId.get(id))
      .filter((r): r is QuestionRow => !!r)
      .map((r, i) => buildItem(r, i + 1))

    setItems(built)
    setAnswers({})
    setResults({})
    setPhase('running')
    window.scrollTo(0, 0)
  }

  function submitExam() {
    const res: Record<string, UnitResult> = {}
    let earned = 0

    for (const item of items) {
      for (const u of item.units) {
        const raw = (answers[u.key] ?? '').trim()
        if (raw === '') {
          res[u.key] = { correct: false, message: 'Not answered.', studentAnswer: '', correctAnswer: u.correctAnswer, explanation: u.explanation, marksEarned: 0 }
          continue
        }
        if (u.grid) {
          // Grid units earn fractional per-element credit (the method marks);
          // `correct` stays "fully correct" so projected mastery is unchanged.
          const pts = parseGridAnswer(raw)
          const g = u.grid
          const check = checkGridDraw(
            pts, g.elements, g.mode as GridDrawMode, g.tolerance,
            { xStep: g.x.step, yStep: g.y.step },
            g.traps ?? [],
          )
          earned += check.marksEarned
          const nRight = check.perElement.filter(e => e.correct).length
          const unitNoun = g.mode === 'cells' ? 'squares'
            : g.mode === 'polygon' ? 'corners'
            : g.mode === 'bars' || g.mode === 'bars_free' ? 'bars'
            : 'points'
          res[u.key] = {
            correct: check.correct,
            // The trap response is additive: it explains the score line rather
            // than replacing it (the review markers are keyed to the count).
            message: check.correct
              ? 'Correct!'
              : `${nRight} of ${g.elements.length} ${unitNoun} correct`
                + (check.trap ? `<br/>${check.trap.response}` : ''),
            studentAnswer: formatGridPoints(pts),
            correctAnswer: u.correctAnswer,
            explanation: u.explanation,
            marksEarned: check.marksEarned,
            perStudent: check.perStudent,
          }
          continue
        }
        const check = checkAnswer(raw, u.correctAnswer, u.answerType, u.tolerance, u.traps, u.requiresSimplest)
        if (check.correct) earned += u.marks
        res[u.key] = { correct: check.correct, message: check.message, studentAnswer: raw, correctAnswer: u.correctAnswer, explanation: u.explanation, marksEarned: check.correct ? u.marks : 0 }
      }
    }

    // Teacher preview records nothing (a teacher isn't building skill mastery).
    // A student's paper feeds the skill map: one practice_attempts row per PART
    // (a multi_blank part's blanks collapsed to a single all-right attempt),
    // skipped parts excluded, exam-kind rows positive-only via the mastery
    // engine's existing `kind` handling. Fire-and-forget — the review renders
    // regardless of whether the write lands.
    if (isStudent) recordAttempts(res)

    setResults(res)
    setScore({ earned, total: totalMarks })
    setPhase('review')
    window.scrollTo(0, 0)
  }

  async function recordAttempts(res: Record<string, UnitResult>) {
    const units = items.flatMap(it => it.units)
    const rows = groupExamAttempts(
      units.map(u => ({ key: u.key, skillIds: u.skillIds, kind: u.kind })),
      Object.fromEntries(Object.entries(res).map(([k, v]) => [k, { correct: v.correct, studentAnswer: v.studentAnswer }])),
    )
    if (rows.length === 0) return
    const { data: { session } } = await supabase.auth.getSession()
    const studentId = session?.user.id
    if (!studentId) return
    const { error: paErr } = await supabase.from('practice_attempts').insert(
      rows.map(r => ({ student_id: studentId, question_id: r.questionId, skill_ids: r.skillIds, correct: r.correct, kind: r.kind })),
    )
    if (paErr) console.error('Failed to record mini-exam attempts:', paErr.message)
  }

  if (gate === 'checking') {
    return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  // ── Config ─────────────────────────────────────────────────────────────────
  if (phase === 'config' || phase === 'loading') {
    return (
      <main style={styles.page}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }}>Mini-exam</h1>
          {!isStudent && <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: radius.full, background: colors.cardAlt, color: colors.textHint }}>Preview</span>}
        </div>
        <div style={card}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 4px', lineHeight: 1.6 }}>
            {isStudent
              ? <>A short (~25-mark) mixed paper from across the course, worked through with <strong>no feedback until you submit</strong> — then a score and a full review that shows you where you went wrong.</>
              : <>Preview the mini-exam your students will take: a short (~25-mark) mixed paper from across the course, worked through with <strong> no feedback until submit</strong> — then a score and a full review with the mistake-spotting feedback.</>}
          </p>
          {isStudent ? (
            <QuotaNote quota={quota} limitReached={limitReached} onUpgrade={() => router.push('/student/upgrade')} />
          ) : (
            <p style={{ fontSize: font.sm, color: colors.textHint, margin: '8px 0 16px', lineHeight: 1.6 }}>
              This is a teacher preview — nothing is recorded. Assigning mini-exams to a class is coming next. Choose a paper:
            </p>
          )}
          {error && <p style={{ ...hint, color: colors.dangerText }}>{error}</p>}

          <label style={{ display: 'block', fontSize: font.sm, fontWeight: 700, color: colors.textSecondary, marginBottom: 6 }}>Tier</label>
          <div style={{ display: 'inline-flex', gap: 0, marginBottom: 16, border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: 'hidden' }}>
            {(['foundation', 'higher'] as Tier[]).map(t => (
              <button
                key={t}
                disabled={phase === 'loading'}
                onClick={() => setTier(t)}
                style={{
                  padding: '8px 18px', fontSize: font.base, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: tier === t ? colors.primary : 'transparent',
                  color: tier === t ? '#ffffff' : colors.textSecondary,
                }}
              >
                {t === 'foundation' ? 'Foundation' : 'Higher'}
              </button>
            ))}
          </div>

          {(() => {
            // Free students at zero for the month can't start a paper — the
            // upgrade prompt in QuotaNote is their path forward.
            const outOfExams = isStudent && quota != null && !quota.isPaid && quota.remaining === 0
            const busy = phase === 'loading'
            const disabled = busy || outOfExams
            return (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button disabled={disabled} onClick={() => startExam('non_calc')} style={{ ...primaryButton, width: 'auto', flex: 1, minWidth: 200, opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                  {busy && mode === 'non_calc' ? 'Assembling…' : 'Non-calculator paper'}
                </button>
                <button disabled={disabled} onClick={() => startExam('calc')} style={{ ...secondaryButton, width: 'auto', flex: 1, minWidth: 200, opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                  {busy && mode === 'calc' ? 'Assembling…' : 'Calculator paper'}
                </button>
              </div>
            )
          })()}
        </div>
        <button onClick={() => router.push(dashboardHref)} style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}>← Back to dashboard</button>
      </main>
    )
  }

  // ── Review ─────────────────────────────────────────────────────────────────
  if (phase === 'review') {
    const pct = score.total > 0 ? Math.round((score.earned / score.total) * 100) : 0
    const accent = pct >= 70 ? colors.successText : pct >= 40 ? colors.warning : colors.dangerText
    const bar = pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger

    // A question counts as fully correct only if every one of its units is right.
    const questionsCorrect = items.filter(it => it.units.every(u => results[u.key]?.correct)).length

    // Projected skill mastery — run this paper's answered units through the SAME
    // engine a student's practice attempts use, from a blank slate, to show what
    // completing the mini-exam would do to a student's skill map. One paper gives
    // ≤1 attempt/skill, so direct skills land at "in progress" (the 5-attempt
    // window needs repeated practice to confirm mastery); correct answers also
    // credit prerequisite skills (exam-kind is positive-only, handled by the engine).
    const STATUS_META: Record<MasteryStatus, { label: string; bg: string; color: string; border: string }> = {
      mastered:       { label: 'Mastered',       bg: colors.successLight, color: colors.successText, border: colors.successBorder },
      in_progress:    { label: 'In progress',    bg: colors.warningLight, color: colors.warningText, border: colors.warningBorder },
      needs_practice: { label: 'Needs practice', bg: colors.dangerLight,  color: colors.dangerText,  border: colors.dangerBorder },
    }
    const STATUS_RANK: Record<MasteryStatus, number> = { mastered: 0, in_progress: 1, needs_practice: 2 }

    // Attempts from ANSWERED units only (a blank is never recorded, so it never
    // penalises); increasing timestamps for the engine's recency window.
    const examAttempts = items.flatMap(it => it.units).flatMap((u, i) => {
      const r = results[u.key]
      if (!r || r.studentAnswer.trim() === '') return []
      return [{ skill_ids: u.skillIds, correct: r.correct, attempted_at: new Date(Date.now() + i * 1000).toISOString(), kind: u.kind }]
    })
    const directMastery = calculateMastery(examAttempts)
    const projectedRows = Object.values(directMastery)
      .map(m => ({ ...m, name: skillsById[m.skillId]?.name ?? m.skillId }))
      .sort((a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
        (b.recentCorrect / b.recentAttempts) - (a.recentCorrect / a.recentAttempts) ||
        a.name.localeCompare(b.name))
    // Prerequisite skills a correct answer additionally reinforces (credited but
    // not directly tested) — the inference engine's positive spillover.
    const withCredit = calculateMastery(applyPrerequisiteCredit(examAttempts, getPrerequisiteTree))
    const reinforcedCount = Object.keys(withCredit).filter(id => !directMastery[id]).length

    return (
      <main style={styles.page}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }}>Exam review</h1>
        <div style={{ ...card, textAlign: 'center' }}>
          <p style={{ fontSize: font.sm, fontWeight: 700, color: colors.textHint, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {tier === 'higher' ? 'Higher' : 'Foundation'} · {mode === 'calc' ? 'Calculator' : 'Non-calculator'}
          </p>
          <p style={{ fontSize: 48, fontWeight: 800, margin: '0 0 2px', color: accent, lineHeight: 1 }}>{score.earned} / {score.total}</p>
          <p style={{ fontSize: font.lg, color: colors.textSecondary, margin: '0 0 12px' }}>marks · {pct}%</p>
          <div style={{ background: colors.border, borderRadius: radius.full, height: 8, overflow: 'hidden' }}>
            <div style={{ background: bar, height: 8, borderRadius: radius.full, width: `${pct}%` }} />
          </div>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '12px 0 0' }}>
            {questionsCorrect} of {items.length} question{items.length === 1 ? '' : 's'} fully correct
          </p>
          <p style={{ fontSize: '11px', color: colors.textHint, margin: '4px 0 0' }}>
            A practice score across the paper — not a predicted grade.
          </p>
        </div>

        {projectedRows.length > 0 && (
          <div style={card}>
            <h2 style={{ fontSize: font.lg, fontWeight: 700, margin: '0 0 4px', color: colors.textPrimary }}>Projected skill mastery</h2>
            <p style={{ fontSize: '11px', color: colors.textHint, margin: '0 0 14px', lineHeight: 1.6 }}>
              What completing this paper would do to a student&apos;s skill map, from no prior practice. One paper mostly moves skills to <em>in progress</em> — mastery is confirmed over repeated sessions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projectedRows.map(s => {
                const meta = STATUS_META[s.status]
                return (
                  <div key={s.skillId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: font.sm, color: colors.textPrimary }}>{s.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: colors.textHint }}>{s.recentCorrect}/{s.recentAttempts} correct</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: radius.full, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                    </span>
                  </div>
                )
              })}
            </div>
            {reinforcedCount > 0 && (
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '12px 0 0' }}>
                + {reinforcedCount} prerequisite skill{reinforcedCount === 1 ? '' : 's'} reinforced by correct answers.
              </p>
            )}
          </div>
        )}

        {items.map(item => (
          <div key={item.questionId} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: font.sm, fontWeight: 700, color: colors.textSecondary }}>Question {item.number}</span>
              <span style={{ fontSize: font.sm, color: colors.textHint }}>{item.skillNames}</span>
            </div>
            {item.imageUrl && <img src={item.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: radius.md, marginBottom: 10, display: 'block' }} />}
            <div style={{ fontSize: font.lg, color: colors.textPrimary, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: item.headerHtml }} />
            {item.units.map(u => {
              const r = results[u.key]
              if (!r) return null
              // Three-state credit: full (success) / partial (warning) / zero
              // (danger) — partial only arises on grid units.
              const state = r.marksEarned >= u.marks ? 'full' : r.marksEarned > 0 ? 'partial' : 'zero'
              const bg = state === 'full' ? colors.successLight : state === 'partial' ? colors.warningLight : colors.dangerLight
              const bd = state === 'full' ? colors.successBorder : state === 'partial' ? colors.warningBorder : colors.dangerBorder
              const tx = state === 'full' ? colors.successText : state === 'partial' ? colors.warningText : colors.dangerText
              return (
                <div key={u.key} style={{ marginTop: 12, padding: 12, borderRadius: radius.md, background: bg, border: `1px solid ${bd}` }}>
                  {/* Label shown even with an empty prompt so a multi_blank
                      part's later blanks ("(a) · B") stay identifiable. */}
                  {(u.promptHtml || u.label) && <div style={{ fontSize: font.base, color: colors.textPrimary, marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: `${u.label ?? ''} ${u.promptHtml}` }} />}
                  <p style={{ fontSize: font.sm, fontWeight: 700, margin: '0 0 4px', color: tx }}>
                    {state === 'full' ? `✓ ${u.marks}/${u.marks}` : state === 'partial' ? `~ ${r.marksEarned}/${u.marks}` : `✗ 0/${u.marks}`}
                  </p>
                  <div style={{ fontSize: font.sm, color: tx }} dangerouslySetInnerHTML={{ __html: r.message }} />
                  {u.grid && r.studentAnswer && (
                    <div style={{ margin: '8px 0' }}>
                      <GridCanvas
                        grid={u.grid}
                        value={parseGridAnswer(answers[u.key] ?? '')}
                        readOnly
                        showCanonical
                        perElement={r.perStudent}
                      />
                      <p style={{ fontSize: font.sm, margin: '4px 0 0', color: colors.textHint }}>
                        Your points shown solid · the correct answer is shown dashed
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: font.sm, margin: '6px 0 0', color: colors.textSecondary }}>
                    Your answer: <strong><span dangerouslySetInnerHTML={{ __html: r.studentAnswer || '—' }} /></strong>
                    {!r.correct && <> · Correct: <strong><span dangerouslySetInnerHTML={{ __html: r.correctAnswer }} /></strong></>}
                  </p>
                  {r.explanation && (
                    <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: radius.sm, background: colors.card, border: `1px solid ${colors.border}` }}>
                      <div style={{ fontSize: font.sm, color: colors.textPrimary }} dangerouslySetInnerHTML={{ __html: r.explanation }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { setPhase('config'); setItems([]) }} style={{ ...primaryButton, flex: 1 }}>New mini-exam</button>
          <button onClick={() => router.push(dashboardHref)} style={{ ...secondaryButton, flex: 1 }}>Dashboard</button>
        </div>
      </main>
    )
  }

  // ── Running (exam conditions — no feedback) ──────────────────────────────────
  return (
    <main style={styles.page}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: colors.background, padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1 style={{ fontSize: font.xl, fontWeight: 700, margin: 0, color: colors.textPrimary }}>
            Mini-exam <span style={{ fontSize: font.sm, fontWeight: 400, color: colors.textHint }}>· {tier === 'higher' ? 'Higher' : 'Foundation'} · {mode === 'calc' ? 'Calculator' : 'Non-calculator'}</span>
          </h1>
          <span style={{ fontSize: font.sm, color: colors.textSecondary }}>{answeredCount}/{allUnits.length} answered · {totalMarks} marks</span>
        </div>
      </div>

      <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, lineHeight: 1.6 }}>
        Answer every question. You won&apos;t see if you&apos;re right until you submit the whole paper.
      </p>

      {items.map(item => (
        <div key={item.questionId} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: font.sm, fontWeight: 700, color: colors.textSecondary }}>Question {item.number}</span>
            <span style={{ fontSize: font.sm, color: colors.textHint }}>[{item.marks} mark{item.marks === 1 ? '' : 's'}]</span>
          </div>
          {item.imageUrl && <img src={item.imageUrl} alt="Question diagram" style={{ maxWidth: '100%', borderRadius: radius.md, marginBottom: 10, display: 'block' }} />}
          <div style={{ fontSize: font.lg, color: colors.textPrimary, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: item.headerHtml }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {item.units.map(u => (
              <div key={u.key}>
                {/* Label shown even with an empty prompt so a multi_blank
                    part's later blanks ("(a) · B") stay identifiable. */}
                {(u.promptHtml || u.label) && <div style={{ fontSize: font.base, color: colors.textPrimary, marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: `${u.label ?? ''} ${u.promptHtml}` }} />}
                {u.grid ? (
                  <GridCanvas
                    grid={u.grid}
                    value={parseGridAnswer(answers[u.key] ?? '')}
                    onChange={pts => setAnswers(prev => ({ ...prev, [u.key]: serialiseGridAnswer(pts) }))}
                  />
                ) : (
                <MathInput
                  value={answers[u.key] ?? ''}
                  onChange={(v: string) => setAnswers(prev => ({ ...prev, [u.key]: v }))}
                  onSubmit={() => {}}
                  placeholder="Type your answer…"
                />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={submitExam} style={primaryButton}>Submit paper</button>
      <button onClick={() => { if (confirm('Leave the exam? Your progress will be lost.')) { setPhase('config'); setItems([]) } }} style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}>
        Quit
      </button>
    </main>
  )
}

/** The student's monthly-allowance line on the config screen. */
function QuotaNote({ quota, limitReached, onUpgrade }: {
  quota: { remaining: number | null; isPaid: boolean } | null
  limitReached: boolean
  onUpgrade: () => void
}) {
  // Unlimited (paid).
  if (quota?.isPaid) {
    return (
      <p style={{ fontSize: font.sm, color: colors.textHint, margin: '8px 0 16px', lineHeight: 1.6 }}>
        You have <strong>unlimited</strong> mini-exams. Choose a paper:
      </p>
    )
  }
  const out = limitReached || (quota != null && quota.remaining === 0)
  if (out) {
    return (
      <div style={{ margin: '8px 0 16px' }}>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 8px', lineHeight: 1.6 }}>
          You&apos;ve used your <strong>free mini-exam</strong> for this month. It resets on the 1st — or upgrade for unlimited papers now.
        </p>
        <button onClick={onUpgrade} style={{ ...primaryButton, width: 'auto', padding: '8px 16px', fontSize: font.base }}>
          Upgrade for unlimited
        </button>
      </div>
    )
  }
  // Free, with allowance left. remaining is null only before the peek returns.
  return (
    <p style={{ fontSize: font.sm, color: colors.textHint, margin: '8px 0 16px', lineHeight: 1.6 }}>
      {quota == null
        ? 'Choose a paper:'
        : <>You have <strong>{quota.remaining}</strong> free mini-exam{quota.remaining === 1 ? '' : 's'} this month. Choose a paper:</>}
    </p>
  )
}

const hint: React.CSSProperties = { fontSize: font.base, color: colors.textHint, margin: '4px 0', lineHeight: 1.6 }
const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 640, margin: '0 auto', padding: '24px 20px 64px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100dvh' },
}
