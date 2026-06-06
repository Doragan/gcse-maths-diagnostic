'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getStudentProfile } from '../../../../lib/auth'
import { supabase } from '../../../../lib/supabase'
import {
  getAssignment, getAssignmentQuestions, getMyAttempts,
  type Assignment, type AssignmentQuestion, type AssignmentAttempt,
} from '../../../../lib/assignments'
import { skillsById } from '../../../../lib/skills/skillGraph'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, sectionTitle,
} from '../../../../lib/styles'

type QuestionStatus = 'not_started' | 'attempted' | 'correct'

// Derive per-question status from attempt history.
function questionStatus(
  questionId: string,
  attempts: AssignmentAttempt[],
  completionMode: string,
): QuestionStatus {
  const qAttempts = attempts.filter(a => a.question_id === questionId)
  if (qAttempts.length === 0) return 'not_started'
  if (qAttempts.some(a => a.correct)) return 'correct'
  return 'attempted'
}

// Derive overall completion from attempts.
function isAssignmentComplete(
  assignment: Assignment,
  questions: AssignmentQuestion[],
  attempts: AssignmentAttempt[],
): boolean {
  if (assignment.selection_mode === 'picked') {
    if (assignment.completion_mode === 'attempt_once') {
      const attemptedIds = new Set(attempts.map(a => a.question_id))
      return questions.every(q => attemptedIds.has(q.question_id))
    }
    if (assignment.completion_mode === 'until_correct') {
      const correctIds = new Set(attempts.filter(a => a.correct).map(a => a.question_id))
      return questions.every(q => correctIds.has(q.question_id))
    }
    return false // mastery_based: open-ended
  } else {
    // pool mode
    const count = assignment.target_count ?? 0
    if (assignment.completion_mode === 'attempt_once') return attempts.length >= count
    if (assignment.completion_mode === 'until_correct') return attempts.filter(a => a.correct).length >= count
    return false
  }
}

export default function StudentAssignmentPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const assignmentId = params.id

  const [assignment, setAssignment]   = useState<Assignment | null>(null)
  const [questions, setQuestions]     = useState<AssignmentQuestion[]>([])
  const [attempts, setAttempts]       = useState<AssignmentAttempt[]>([])
  const [studentId, setStudentId]     = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [loadingNext, setLoadingNext] = useState(false)

  useEffect(() => {
    (async () => {
      const profile = await getStudentProfile()
      if (!profile) { router.push('/student'); return }
      setStudentId(profile.id)

      const [a, q, att] = await Promise.all([
        getAssignment(assignmentId),
        getAssignmentQuestions(assignmentId),
        getMyAttempts(assignmentId),
      ])
      if (!a) { setNotFound(true); setLoading(false); return }
      setAssignment(a)
      setQuestions(q)
      setAttempts(att)
      setLoading(false)
    })()
  }, [assignmentId])

  // Navigate to a question in assignment context.
  function goToQuestion(questionId: string) {
    router.push(`/practice/question/${questionId}?assignment_id=${assignmentId}`)
  }

  // For pool mode: pick a random unpractised question from the skill pool.
  async function continuePool() {
    if (!assignment) return
    setLoadingNext(true)
    const attemptedIds = new Set(attempts.map(a => a.question_id))

    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('is_published', true)
      .overlaps('skill_ids', assignment.skill_ids)

    const pool = (data ?? []).map((q: any) => q.id as string).filter(id => !attemptedIds.has(id))

    if (pool.length === 0) {
      // Pool exhausted — allow reattempt by ignoring filter
      const { data: all } = await supabase
        .from('questions')
        .select('id')
        .eq('is_published', true)
        .overlaps('skill_ids', assignment.skill_ids)
      const allIds = (all ?? []).map((q: any) => q.id as string)
      if (allIds.length === 0) { setLoadingNext(false); return }
      const pick = allIds[Math.floor(Math.random() * allIds.length)]
      setLoadingNext(false)
      goToQuestion(pick)
      return
    }

    const pick = pool[Math.floor(Math.random() * pool.length)]
    setLoadingNext(false)
    goToQuestion(pick)
  }

  if (loading) {
    return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  if (notFound || !assignment) {
    return (
      <main style={styles.page}>
        <div style={styles.header}>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>Assignment not found</h1>
          <button onClick={() => router.push('/student/assignments')} style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}>Back</button>
        </div>
      </main>
    )
  }

  const complete = isAssignmentComplete(assignment, questions, attempts)
  const correctCount = attempts.filter(a => a.correct).length

  // Pool mode progress
  const poolTotal     = assignment.target_count ?? 0
  const poolAttempted = attempts.length
  const poolCorrect   = correctCount
  const poolDone      = assignment.completion_mode === 'until_correct'
    ? poolCorrect >= poolTotal
    : poolAttempted >= poolTotal

  // Can a student retry a picked question?
  function canRetry(questionId: string): boolean {
    if (assignment!.completion_mode === 'attempt_once') {
      // Already attempted → locked (can click to review, but attempt won't be re-recorded)
      return false
    }
    if (assignment!.completion_mode === 'until_correct') {
      return !attempts.some(a => a.question_id === questionId && a.correct)
    }
    return true
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            {assignment.title}
          </h1>
          {assignment.due_at && (
            <p style={{ fontSize: font.sm, margin: '4px 0 0', color: new Date(assignment.due_at) < new Date() ? colors.dangerText : colors.textSecondary }}>
              Due {new Date(assignment.due_at).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/student/assignments')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, flexShrink: 0 }}
        >
          My assignments
        </button>
      </div>

      {assignment.instructions && (
        <div style={{ ...card, padding: '12px 16px' }}>
          <p style={{ fontSize: font.base, color: colors.textPrimary, margin: 0, whiteSpace: 'pre-wrap' as const, lineHeight: '1.6' }}>
            {assignment.instructions}
          </p>
        </div>
      )}

      {/* Completion banner */}
      {complete && (
        <div style={{
          padding: '14px 16px',
          borderRadius: radius.lg,
          background: colors.successLight,
          border: `1px solid ${colors.successBorder}`,
        }}>
          <p style={{ fontSize: font.md, fontWeight: '700', color: colors.successText, margin: '0 0 2px' }}>
            ✓ Assignment complete
          </p>
          <p style={{ fontSize: font.sm, color: colors.successText, margin: 0 }}>
            {correctCount} correct out of {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* ── Picked mode ──────────────────────────────────────────────────── */}
      {assignment.selection_mode === 'picked' && (
        <div style={card}>
          <h2 style={sectionTitle}>Questions ({questions.length})</h2>
          {questions.length === 0 ? (
            <p style={{ fontSize: font.base, color: colors.textHint, margin: '8px 0 0' }}>No questions loaded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {questions.map((q, i) => {
                const qData  = q.questions as any
                const status = questionStatus(q.question_id, attempts, assignment.completion_mode)
                const locked = assignment.completion_mode === 'attempt_once' && status !== 'not_started'
                const retry  = !locked && canRetry(q.question_id)
                const skillName = qData?.skill_ids?.[0] ? (skillsById[qData.skill_ids[0]]?.name ?? '') : ''

                return (
                  <div
                    key={q.id}
                    style={{
                      ...styles.questionCard,
                      borderColor: status === 'correct'
                        ? colors.successBorder
                        : status === 'attempted'
                        ? colors.warningBorder
                        : colors.border,
                      opacity: locked ? 0.75 : 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => goToQuestion(q.question_id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: font.base,
                        margin: 0,
                        color: colors.textPrimary,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical' as const,
                        lineHeight: '1.45',
                      }}>
                        {i + 1}. {qData?.question_template?.replace(/\{[^}]+\}/g, '[…]') ?? '—'}
                      </p>
                      {skillName && (
                        <p style={{ fontSize: '11px', color: colors.textHint, margin: '3px 0 0' }}>
                          {skillName} · {'★'.repeat(qData?.difficulty ?? 1)}
                        </p>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
                      {status === 'correct' && (
                        <span style={{ fontSize: font.sm, fontWeight: '700', color: colors.successText }}>✓ Correct</span>
                      )}
                      {status === 'attempted' && !retry && (
                        <span style={{ fontSize: font.sm, color: colors.warning }}>Attempted</span>
                      )}
                      {status === 'attempted' && retry && (
                        <span style={{ fontSize: font.sm, color: colors.primary, fontWeight: '600' }}>Retry →</span>
                      )}
                      {status === 'not_started' && (
                        <span style={{ fontSize: font.sm, color: colors.primary, fontWeight: '600' }}>Start →</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Pool mode ─────────────────────────────────────────────────────── */}
      {assignment.selection_mode === 'pool' && (
        <div style={card}>
          <h2 style={sectionTitle}>
            {skillsById[assignment.skill_ids[0]]?.name ?? 'Skill'} · {poolTotal} questions
          </h2>

          {/* Progress */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: font.sm, color: colors.textSecondary, marginBottom: '6px' }}>
              <span>Progress</span>
              <span>
                {assignment.completion_mode === 'until_correct'
                  ? `${poolCorrect} correct of ${poolTotal}`
                  : `${poolAttempted} of ${poolTotal} attempted`}
              </span>
            </div>
            <div style={{ background: colors.border, borderRadius: radius.full, height: '8px', overflow: 'hidden' }}>
              <div style={{
                background: poolDone ? colors.success : colors.primary,
                height: '8px',
                borderRadius: radius.full,
                width: `${Math.min(100, Math.round(
                  (assignment.completion_mode === 'until_correct' ? poolCorrect : poolAttempted)
                  / Math.max(poolTotal, 1) * 100
                ))}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            {poolDone ? (
              <p style={{ fontSize: font.base, color: colors.successText, fontWeight: '600', margin: 0 }}>
                ✓ All done! {poolCorrect}/{poolAttempted} correct.
              </p>
            ) : (
              <button
                onClick={continuePool}
                disabled={loadingNext}
                style={{ ...primaryButton, opacity: loadingNext ? 0.6 : 1 }}
              >
                {loadingNext ? 'Loading question…' : attempts.length === 0 ? 'Start assignment →' : 'Continue →'}
              </button>
            )}
          </div>

          {/* Attempt history */}
          {attempts.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, margin: '0 0 8px' }}>
                Your attempts
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[...attempts].reverse().map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.cardAlt }}>
                    <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
                      {new Date(a.attempted_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {new Date(a.attempted_at).toLocaleDateString('en-GB')}
                    </span>
                    <span style={{ fontSize: font.sm, fontWeight: '700', color: a.correct ? colors.successText : colors.dangerText }}>
                      {a.correct ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px 20px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  questionCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: radius.md,
    border: '1px solid',
    background: colors.cardAlt,
  },
}
