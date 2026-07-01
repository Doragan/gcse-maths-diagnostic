'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getSession } from '../../../lib/auth'
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

export default function ExamPreviewPage() {
  const router = useRouter()
  // Teacher-only for now: this is a preview surface. Students don't self-serve
  // mini-exams yet — that will arrive via teacher-instigated assignment later.
  const [gate, setGate] = useState<'checking' | 'ok'>('checking')
  const [phase, setPhase] = useState<'config' | 'loading' | 'running' | 'review'>('config')
  const [mode, setMode] = useState<CalculatorMode>('non_calc')
  const [items, setItems] = useState<Item[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, UnitResult>>({})
  const [score, setScore] = useState<{ earned: number; total: number }>({ earned: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      const { data: teacher } = await supabase.from('teachers').select('id').eq('id', session.user.id).single()
      if (!teacher) { router.push('/student/dashboard'); return }
      setGate('ok')
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

  function submitExam() {
    const res: Record<string, UnitResult> = {}
    let earned = 0

    for (const item of items) {
      for (const u of item.units) {
        const raw = (answers[u.key] ?? '').trim()
        if (raw === '') {
          res[u.key] = { correct: false, message: 'Not answered.', studentAnswer: '', correctAnswer: u.correctAnswer, explanation: u.explanation }
          continue
        }
        const check = checkAnswer(raw, u.correctAnswer, u.answerType, u.tolerance, u.traps, u.requiresSimplest)
        if (check.correct) earned += u.marks
        res[u.key] = { correct: check.correct, message: check.message, studentAnswer: raw, correctAnswer: u.correctAnswer, explanation: u.explanation }
      }
    }

    // Teacher preview: nothing is recorded to practice_attempts (a teacher isn't
    // building skill mastery). When this becomes student-facing, the batch
    // mastery commit happens here.
    setResults(res)
    setScore({ earned, total: totalMarks })
    setPhase('review')
    window.scrollTo(0, 0)
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
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: radius.full, background: colors.cardAlt, color: colors.textHint }}>Preview</span>
        </div>
        <div style={card}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 4px', lineHeight: 1.6 }}>
            Preview the mini-exam your students will take: a short (~25-mark) mixed paper from across the course, worked through with
            <strong> no feedback until submit</strong> — then a score and a full review with the mistake-spotting feedback.
          </p>
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: '8px 0 16px', lineHeight: 1.6 }}>
            This is a teacher preview — nothing is recorded. Assigning mini-exams to a class is coming next. Choose a paper:
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
        <button onClick={() => router.push('/dashboard')} style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}>← Back to dashboard</button>
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
          <button onClick={() => router.push('/dashboard')} style={{ ...secondaryButton, flex: 1 }}>Dashboard</button>
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
