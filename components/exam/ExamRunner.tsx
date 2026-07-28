'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getSession } from '../../lib/auth'
import { assembleExam, candidateOf, type CalculatorMode } from '../../lib/exam/assembler'
import { DEFAULT_BLUEPRINT } from '../../lib/exam/blueprint'
import { higherOnlySkillIds } from '../../data/courses'
import { serialiseGridAnswer, parseGridAnswer } from '../../lib/questions/gridDraw'
import { groupExamAttempts } from '../../lib/exam/recordAttempts'
import {
  buildItem, gradeUnits, QUESTION_COLUMNS,
  type Item, type QuestionRow, type UnitResult, type Tier,
} from '../../lib/exam/examPaper'
import { buildPaperSnapshot } from '../../lib/exam/examSession'
import ExamReview from './ExamReview'
import GridCanvas from '../practice/GridCanvas'
import MathInput from '../practice/MathInput'
import { colors, font, radius, card, primaryButton, secondaryButton } from '../../lib/styles'

// Where the runner is embedded. A teacher previews unlimited papers and nothing
// is recorded; a student spends a monthly allowance and their answers feed the
// skill map. Everything between config and review is identical.
export type ExamVariant = 'teacher-preview' | 'student'

const HIGHER_ONLY = new Set(higherOnlySkillIds)

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
      .select(QUESTION_COLUMNS)
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
    // Graded by the SAME pure function that re-grades a stored paper, so a
    // re-opened review can never disagree with what was seen at submit.
    const { results: res, earned } = gradeUnits(items, answers)

    // Teacher preview records nothing (a teacher isn't building skill mastery).
    // A student's paper feeds the skill map: one practice_attempts row per PART
    // (a multi_blank part's blanks collapsed to a single all-right attempt),
    // skipped parts excluded, exam-kind rows positive-only via the mastery
    // engine's existing `kind` handling. Both writes are fire-and-forget — the
    // review renders regardless of whether either lands.
    if (isStudent) {
      recordAttempts(res)
      saveSession(earned)
    }

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

  /**
   * Persist the sat paper so it can be re-opened and can feed a score trend.
   *
   * Only the parameter draw and the raw answers are stored — the verdicts,
   * marks and feedback are re-derived on open (see lib/exam/examSession.ts).
   * The SCORE, though, is pinned in its own columns: the history list must
   * render without re-grading every past paper, and a later grader fix must not
   * silently move a point on the trend.
   */
  async function saveSession(earned: number) {
    const { data: { session } } = await supabase.auth.getSession()
    const studentId = session?.user.id
    if (!studentId) return
    const { error: esErr } = await supabase.from('exam_sessions').insert({
      student_id: studentId,
      tier,
      calculator: mode,
      marks_earned: earned,
      marks_total: totalMarks,
      paper: buildPaperSnapshot(items, answers),
    })
    if (esErr) console.error('Failed to save mini-exam session:', esErr.message)
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
    return (
      <main style={styles.page}>
        <ExamReview
          items={items}
          results={results}
          answers={answers}
          score={score}
          tier={tier}
          mode={mode}
          projectedCaption={isStudent
            ? 'What this paper did to your skill map, counted from no prior practice. One paper mostly moves skills to in progress — mastery is confirmed over repeated sessions.'
            : undefined}
          footer={
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => { setPhase('config'); setItems([]) }} style={{ ...primaryButton, flex: 1 }}>New mini-exam</button>
              <button onClick={() => router.push(dashboardHref)} style={{ ...secondaryButton, flex: 1 }}>Dashboard</button>
            </div>
          }
        />
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
