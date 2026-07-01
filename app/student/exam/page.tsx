'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getCachedStudentId } from '../../../lib/auth'
import { skillsById } from '../../../lib/skills/skillGraph'
import { renderQuestion, renderMultiPartQuestion, type Parameters } from '../../../lib/questions/paramEngine'
import { checkAnswer } from '../../../lib/questions/answerChecker'
import { assembleExam, candidateOf, type CalculatorMode } from '../../../lib/exam/assembler'
import { DEFAULT_BLUEPRINT, NOMINAL_MARKS } from '../../../lib/exam/blueprint'
import type { QuestionPart } from '../../../lib/questions/parts'
import MathInput from '../../../components/practice/MathInput'
import { colors, font, radius, card, primaryButton, secondaryButton } from '../../../lib/styles'

type AnswerType = 'exact' | 'numeric' | 'fraction' | 'expression' | 'ratio' | 'coordinate'

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
type UnitResult = { correct: boolean; message: string; studentAnswer: string; correctAnswer: string; explanation: string }

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
    const units: Unit[] = q.parts.map((p, i) => ({
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
    }))
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

export default function ExamPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'config' | 'loading' | 'running' | 'review'>('config')
  const [mode, setMode] = useState<CalculatorMode>('non_calc')
  const [items, setItems] = useState<Item[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, UnitResult>>({})
  const [score, setScore] = useState<{ earned: number; total: number }>({ earned: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

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
    const assembled = assembleExam(candidates, DEFAULT_BLUEPRINT, { calculatorMode: calcMode })
    if (assembled.questionIds.length === 0) { setError('No questions available for this paper yet.'); setPhase('config'); return }

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

  async function submitExam() {
    const res: Record<string, UnitResult> = {}
    let earned = 0
    const attempts: { skill_ids: string[]; correct: boolean; kind: string; question_id: string }[] = []

    for (const item of items) {
      for (const u of item.units) {
        const raw = (answers[u.key] ?? '').trim()
        if (raw === '') {
          // Left blank — 0 marks, and not recorded as a mastery attempt (a skip
          // shouldn't penalise the skill).
          res[u.key] = { correct: false, message: 'Not answered.', studentAnswer: '', correctAnswer: u.correctAnswer, explanation: u.explanation }
          continue
        }
        const check = checkAnswer(raw, u.correctAnswer, u.answerType, u.tolerance, u.traps, u.requiresSimplest)
        if (check.correct) earned += u.marks
        res[u.key] = { correct: check.correct, message: check.message, studentAnswer: raw, correctAnswer: u.correctAnswer, explanation: u.explanation }
        attempts.push({ question_id: item.questionId, skill_ids: u.skillIds, correct: check.correct, kind: u.kind })
      }
    }

    // Commit mastery in a batch (exam-conditions semantics). The mastery engine
    // handles kind: `exam`-kind wrong answers are positive-only, so a slip on the
    // synthesis tail never lowers a skill.
    const studentId = await getCachedStudentId()
    if (studentId && attempts.length > 0) {
      const { error: paErr } = await supabase.from('practice_attempts').insert(
        attempts.map(a => ({ student_id: studentId, question_id: a.question_id, skill_ids: a.skill_ids, correct: a.correct, kind: a.kind })),
      )
      if (paErr) console.error('Failed to record exam attempts:', paErr.message)
    } else if (!studentId && attempts.length > 0) {
      // Anonymous — stash for migration into the account on sign-up (mirrors practice).
      try {
        const pending = JSON.parse(localStorage.getItem('pending_practice') ?? '[]')
        for (const a of attempts) pending.push({ question_id: a.question_id, skill_ids: a.skill_ids, correct: a.correct, kind: a.kind })
        localStorage.setItem('pending_practice', JSON.stringify(pending.slice(-200)))
      } catch { /* best-effort */ }
    }

    setResults(res)
    setScore({ earned, total: totalMarks })
    setPhase('review')
    window.scrollTo(0, 0)
  }

  // ── Config ─────────────────────────────────────────────────────────────────
  if (phase === 'config' || phase === 'loading') {
    return (
      <main style={styles.page}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }}>Mini-exam</h1>
        <div style={card}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 4px', lineHeight: 1.6 }}>
            A short (~25-mark) mixed paper drawn from across the course. You&apos;ll work through every question with
            <strong> no feedback until you submit</strong> — then you get your score and a full review with the mistake-spotting feedback.
          </p>
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: '8px 0 16px', lineHeight: 1.6 }}>
            Your answers still update your skill mastery, just like practice. Choose a paper:
          </p>
          {error && <p style={{ ...hint, color: colors.dangerText }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button disabled={phase === 'loading'} onClick={() => startExam('non_calc')} style={{ ...primaryButton, width: 'auto', flex: 1, minWidth: 200, opacity: phase === 'loading' ? 0.6 : 1 }}>
              {phase === 'loading' && mode === 'non_calc' ? 'Assembling…' : 'Non-calculator paper'}
            </button>
            <button disabled={phase === 'loading'} onClick={() => startExam('calc')} style={{ ...secondaryButton, width: 'auto', flex: 1, minWidth: 200, opacity: phase === 'loading' ? 0.6 : 1 }}>
              {phase === 'loading' && mode === 'calc' ? 'Assembling…' : 'Calculator paper'}
            </button>
          </div>
        </div>
        <button onClick={() => router.push('/practice')} style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}>← Back to practice</button>
      </main>
    )
  }

  // ── Review ─────────────────────────────────────────────────────────────────
  if (phase === 'review') {
    const pct = score.total > 0 ? Math.round((score.earned / score.total) * 100) : 0
    const accent = pct >= 70 ? colors.successText : pct >= 40 ? colors.warning : colors.dangerText
    const bar = pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger
    return (
      <main style={styles.page}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }}>Exam review</h1>
        <div style={{ ...card, textAlign: 'center' }}>
          <p style={{ fontSize: 48, fontWeight: 800, margin: '0 0 2px', color: accent, lineHeight: 1 }}>{score.earned} / {score.total}</p>
          <p style={{ fontSize: font.lg, color: colors.textSecondary, margin: '0 0 12px' }}>marks · {pct}%</p>
          <div style={{ background: colors.border, borderRadius: radius.full, height: 8, overflow: 'hidden' }}>
            <div style={{ background: bar, height: 8, borderRadius: radius.full, width: `${pct}%` }} />
          </div>
          <p style={{ fontSize: '11px', color: colors.textHint, margin: '10px 0 0' }}>
            A practice score across the paper — not a predicted grade.
          </p>
        </div>

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
              return (
                <div key={u.key} style={{ marginTop: 12, padding: 12, borderRadius: radius.md, background: r.correct ? colors.successLight : colors.dangerLight, border: `1px solid ${r.correct ? colors.successBorder : colors.dangerBorder}` }}>
                  {u.promptHtml && <div style={{ fontSize: font.base, color: colors.textPrimary, marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: `${u.label} ${u.promptHtml}` }} />}
                  <p style={{ fontSize: font.sm, fontWeight: 700, margin: '0 0 4px', color: r.correct ? colors.successText : colors.dangerText }}>
                    {r.correct ? `✓ ${u.marks}/${u.marks}` : `✗ 0/${u.marks}`}
                  </p>
                  <div style={{ fontSize: font.sm, color: r.correct ? colors.successText : colors.dangerText }} dangerouslySetInnerHTML={{ __html: r.message }} />
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
          <button onClick={() => router.push('/student/dashboard')} style={{ ...secondaryButton, flex: 1 }}>Dashboard</button>
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
            Mini-exam <span style={{ fontSize: font.sm, fontWeight: 400, color: colors.textHint }}>· {mode === 'calc' ? 'Calculator' : 'Non-calculator'}</span>
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
                {u.promptHtml && <div style={{ fontSize: font.base, color: colors.textPrimary, marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: `${u.label} ${u.promptHtml}` }} />}
                <MathInput
                  value={answers[u.key] ?? ''}
                  onChange={(v: string) => setAnswers(prev => ({ ...prev, [u.key]: v }))}
                  onSubmit={() => {}}
                  placeholder="Type your answer…"
                />
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

const hint: React.CSSProperties = { fontSize: font.base, color: colors.textHint, margin: '4px 0', lineHeight: 1.6 }
const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 640, margin: '0 auto', padding: '24px 20px 64px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100dvh' },
}
