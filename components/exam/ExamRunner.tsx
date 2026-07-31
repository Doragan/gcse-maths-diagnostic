'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { getSession } from '../../lib/auth'
import { assembleExam, candidateOf, type CalculatorMode, type AssembledExam } from '../../lib/exam/assembler'
import { BLUEPRINTS } from '../../lib/exam/blueprint'
import { higherOnlySkillIds } from '../../data/courses'
import { serialiseGridAnswer, parseGridAnswer } from '../../lib/questions/gridDraw'
import { groupExamAttempts } from '../../lib/exam/recordAttempts'
import {
  buildItem, gradeUnits, QUESTION_COLUMNS,
  type Item, type QuestionRow, type UnitResult, type Tier,
} from '../../lib/exam/examPaper'
import { buildPaperSnapshot, type PaperMeta } from '../../lib/exam/examSession'
import {
  allowanceSeconds, remainingSeconds, elapsedSeconds, urgencyOf, formatClock,
} from '../../lib/exam/examTiming'
import ExamReview, { BackToDashboard } from './ExamReview'
import MiniExamHistory from './MiniExamHistory'
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
  const [score, setScore] = useState<{ earned: number; total: number; unknown: number }>({ earned: 0, total: 0, unknown: 0 })
  const [error, setError] = useState<string | null>(null)
  // Exam conditions: a real paper's time is not yours to spend. Chosen before
  // the paper starts and fixed for its duration.
  const [timed, setTimed] = useState(true)
  // Wall-clock start. A countdown decremented by an interval would be throttled
  // in a background tab and quietly hand the time back — see examTiming.ts.
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [allowed, setAllowed] = useState(0)
  const [timing, setTiming] = useState<PaperMeta>({})
  // Auto-submit must fire exactly once: the effect that watches the clock can
  // re-run before `phase` has flushed to 'review'.
  const submittedRef = useRef(false)
  // Student quota: null until fetched. remaining=null means unlimited (paid).
  const [quota, setQuota] = useState<{ remaining: number | null; isPaid: boolean } | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  // Set for students only — drives the past-papers list on the config screen.
  const [studentId, setStudentId] = useState<string | null>(null)
  // Teacher preview only: how far the assembled paper fell short of its
  // blueprint, so the content gap is visible rather than silently absorbed.
  const [shortfall, setShortfall] = useState<AssembledExam['shortfall'] | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push(isStudent ? '/student' : '/auth'); return }
      if (isStudent) {
        // Must be a student account; a teacher visiting is bounced to their own.
        const { data: student } = await supabase.from('students').select('id').eq('id', session.user.id).single()
        if (!student) { router.push('/dashboard'); return }
        setStudentId(student.id)
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
  const remaining = startedAt != null ? remainingSeconds(startedAt, allowed, now) : allowed

  // Tick the clock only while a TIMED paper is open. An untimed paper still
  // records how long it took, but that is read once at submit rather than
  // re-rendering the whole paper every second for a number nobody is watching.
  useEffect(() => {
    if (phase !== 'running' || !timed || startedAt == null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [phase, timed, startedAt])

  // Out of time: submit the paper as it stands, which is what happens in the
  // hall. Guarded by a ref because this effect can re-run on the same tick
  // before `phase` has flushed.
  useEffect(() => {
    if (phase !== 'running' || !timed || startedAt == null) return
    // `allowed <= 0` would mean a paper worth no marks — impossible in practice,
    // but it would read as "already out of time" and submit the paper the
    // instant it opened, so refuse to run the clock at all.
    if (allowed <= 0 || remaining > 0 || submittedRef.current) return
    submittedRef.current = true
    submitExam(true)
  }, [phase, timed, startedAt, remaining, allowed])

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
    // Each tier has its OWN blueprint — a real Higher paper is fewer, heavier,
    // synthesis-led questions, not the same paper with harder content. Foundation
    // additionally excludes anything touching a Higher-only skill; Higher draws
    // from the whole pool (every Foundation skill is also on Higher).
    const assembled = assembleExam(candidates, BLUEPRINTS[tier], {
      calculatorMode: calcMode,
      blockedSkillIds: tier === 'foundation' ? HIGHER_ONLY : undefined,
    })
    if (assembled.questionIds.length === 0) { setError('No questions available for this paper yet.'); setPhase('config'); return }
    // The bank cannot yet supply a faithful Higher paper (it holds ~15% synthesis
    // marks against a blueprint asking ~78%), so papers WILL fall short. Log it
    // rather than hide it — it is the signal for where content is needed. Shown
    // only to a teacher previewing; students just see their paper.
    if (!isStudent && (assembled.shortfall.marks > 0 || assembled.shortfall.kind > 0)) {
      console.warn('[mini-exam] blueprint not fully met', assembled.shortfall)
    }
    setShortfall(!isStudent ? assembled.shortfall : null)

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
    // The allowance follows THIS paper's marks at the real rate, so a paper the
    // assembler built a mark or two short does not become the generous one.
    const paperMarks = built.flatMap(it => it.units).reduce((s, u) => s + u.marks, 0)
    setAllowed(allowanceSeconds(paperMarks))
    submittedRef.current = false
    setStartedAt(Date.now())
    setNow(Date.now())
    setPhase('running')
    window.scrollTo(0, 0)
  }

  function submitExam(outOfTime = false) {
    // Graded by the SAME pure function that re-grades a stored paper, so a
    // re-opened review can never disagree with what was seen at submit.
    const { results: res, earned, unknown } = gradeUnits(items, answers)
    const meta: PaperMeta = {
      timed,
      ...(timed ? { allowedSeconds: allowed } : {}),
      ...(startedAt != null ? { elapsedSeconds: elapsedSeconds(startedAt, Date.now()) } : {}),
      ...(outOfTime ? { autoSubmitted: true } : {}),
    }
    setTiming(meta)

    // Teacher preview records nothing (a teacher isn't building skill mastery).
    // A student's paper feeds the skill map: one practice_attempts row per PART
    // (a multi_blank part's blanks collapsed to a single all-right attempt),
    // skipped parts excluded, exam-kind rows positive-only via the mastery
    // engine's existing `kind` handling. Both writes are fire-and-forget — the
    // review renders regardless of whether either lands.
    if (isStudent) {
      recordAttempts(res)
      saveSession(earned, meta)
    }

    setResults(res)
    // `unknown` rides alongside but never into `earned` — the stored score and
    // every point on the trend stay the confirmed floor.
    setScore({ earned, total: totalMarks, unknown })
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
  async function saveSession(earned: number, meta: PaperMeta) {
    const { data: { session } } = await supabase.auth.getSession()
    const studentId = session?.user.id
    if (!studentId) return
    const { error: esErr } = await supabase.from('exam_sessions').insert({
      student_id: studentId,
      tier,
      calculator: mode,
      // The CONFIRMED floor, never the band top: a stored score that moved with
      // an estimate would drag every past point on the trend with it.
      marks_earned: earned,
      marks_total: totalMarks,
      paper: buildPaperSnapshot(items, answers, meta),
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
        <BackToDashboard onClick={() => router.push(dashboardHref)} />
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

          <label style={{ display: 'block', fontSize: font.sm, fontWeight: 700, color: colors.textSecondary, marginBottom: 6 }}>Conditions</label>
          <div style={{ display: 'inline-flex', gap: 0, marginBottom: 6, border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: 'hidden' }}>
            {([true, false] as const).map(t => (
              <button
                key={String(t)}
                disabled={phase === 'loading'}
                onClick={() => setTimed(t)}
                style={{
                  padding: '8px 18px', fontSize: font.base, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: timed === t ? colors.primary : 'transparent',
                  color: timed === t ? '#ffffff' : colors.textSecondary,
                }}
              >
                {t ? 'Timed' : 'Untimed'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: colors.textHint, margin: '0 0 16px', lineHeight: 1.6 }}>
            {timed
              // The allowance is the real rate, so say so — it is the reason to
              // trust that finishing in time means something.
              ? <>Timed at the real exam rate (90 minutes for 80 marks), so a ~25-mark paper gives you about 28 minutes. The paper submits itself when the time is up.</>
              : <>Work at your own pace. Good for building confidence — but pacing is part of the exam, so come back to timed before a real one.</>}
          </p>

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
        {/* Past papers sit under the options card, where a student is already
            deciding what to do next — not on the dashboard. */}
        {isStudent && studentId && <MiniExamHistory studentId={studentId} />}
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
          timing={timing}
          projectedCaption={isStudent
            ? 'What this paper did to your skill map, counted from no prior practice. One paper mostly moves skills to in progress — mastery is confirmed over repeated sessions.'
            : undefined}
          {...(shortfall && (shortfall.marks > 0 || shortfall.kind > 0) ? {
            notice:
              `This paper is ${shortfall.marks} mark${shortfall.marks === 1 ? '' : 's'} short of its `
              + `${BLUEPRINTS[tier].targetMarks}-mark blueprint`
              + (shortfall.kind > 0 ? `, including ${shortfall.kind} synthesis mark${shortfall.kind === 1 ? '' : 's'} the bank could not supply` : '')
              + '. Students do not see this.',
          } : {})}
          onBack={() => router.push(dashboardHref)}
          footer={
            <button onClick={() => { setPhase('config'); setItems([]) }} style={{ ...primaryButton }}>New mini-exam</button>
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
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: font.sm, color: colors.textSecondary }}>{answeredCount}/{allUnits.length} · {totalMarks} marks</span>
            {timed && <ExamClock remaining={remaining} />}
          </span>
        </div>
      </div>

      <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, lineHeight: 1.6 }}>
        Answer every question. You won&apos;t see if you&apos;re right until you submit the whole paper.
        {timed && <> If you get stuck, leave it and come back — the paper submits itself when the time is up.</>}
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
                {u.options ? (
                  /* Answer stored as the option TEXT, not its index, so grading
                     goes through checkAnswer exactly like a typed answer and a
                     stored paper stays readable. */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {u.options.map(opt => {
                      const chosen = (answers[u.key] ?? '') === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers(prev => ({
                            // Tapping the chosen option again clears it — the
                            // same tap-to-undo idiom as the grid canvas, and
                            // without it a mis-tap could not be taken back.
                            ...prev, [u.key]: chosen ? '' : opt,
                          }))}
                          aria-pressed={chosen}
                          style={{
                            textAlign: 'left', cursor: 'pointer', padding: '10px 12px',
                            borderRadius: radius.md, fontSize: font.base,
                            border: `1px solid ${chosen ? colors.primary : colors.border}`,
                            background: chosen ? colors.cardAlt : colors.background,
                            color: colors.textPrimary,
                            fontWeight: chosen ? 700 : 400,
                          }}
                        >
                          <span dangerouslySetInnerHTML={{ __html: opt }} />
                        </button>
                      )
                    })}
                  </div>
                ) : u.grid ? (
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

      {/* Not `onClick={submitExam}` — that hands the click event in as
          `outOfTime`, and a MouseEvent is truthy, so every manual submit would
          be recorded as having run out of time. */}
      <button onClick={() => { submittedRef.current = true; submitExam(false) }} style={primaryButton}>Submit paper</button>
      <button onClick={() => { if (confirm('Leave the exam? Your progress will be lost.')) { setPhase('config'); setItems([]) } }} style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}>
        Quit
      </button>
    </main>
  )
}

/**
 * The countdown in the exam header.
 *
 * Colour is the primary signal (amber at 5 minutes, red in the last), but it
 * cannot be the only one — so the two thresholds are also announced to screen
 * readers, and only the thresholds: a clock politely reading itself aloud every
 * second would make the page unusable.
 */
function ExamClock({ remaining }: { remaining: number }) {
  const urgency = urgencyOf(remaining)
  const colour = urgency === 'urgent' ? colors.dangerText
    : urgency === 'warn' ? colors.warningText
    : colors.textSecondary
  return (
    <>
      <span
        style={{
          fontSize: font.base, fontWeight: 700, color: colour,
          fontVariantNumeric: 'tabular-nums', minWidth: 46, textAlign: 'right',
        }}
        aria-hidden="true"
      >
        {formatClock(remaining)}
      </span>
      <span style={srOnly} role="status" aria-live="polite">
        {urgency === 'urgent' ? 'One minute remaining.'
          : urgency === 'warn' ? 'Five minutes remaining.'
          : ''}
      </span>
    </>
  )
}

/** Visually hidden, still announced. */
const srOnly: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
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
