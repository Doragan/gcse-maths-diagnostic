'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession, requireTeacher } from '../../../../lib/auth'
import {
  getAssignment, getAssignmentQuestions, getAssignmentResults, getAssignmentResultsHead,
  type Assignment, type AssignmentQuestion,
} from '../../../../lib/assignments'
import { useLiveProgress } from '../../../../lib/useLiveProgress'
import LiveProgressTable from '../../../../components/LiveProgressTable'
import ClassInsightsPanel from '../../../../components/ClassInsightsPanel'
import type { ProgressInsights } from '../../../../lib/progressInsights'
import { skillsById } from '../../../../lib/skills/skillGraph'
import { skillSetLabel } from '../../../../lib/skillSelection'
import {
  colors, font, radius, card,
  secondaryButton, sectionTitle,
  TEACHER_CONTENT_WIDTH,
} from '../../../../lib/styles'

const COMPLETION_LABELS: Record<string, string> = {
  attempt_once:   'Attempt once each',
  until_correct:  'Until correct',
  mastery_based:  'Mastery-based',
}

export default function AssignmentDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const assignmentId = params.id

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [questions, setQuestions]   = useState<AssignmentQuestion[]>([])
  const [loading, setLoading]       = useState(true)
  const [insights, setInsights]     = useState<ProgressInsights>(
    { questions: [], skills: [], misconceptions: [], untaggedWrong: 0 },
  )
  const [notFound, setNotFound]     = useState(false)

  // ── Live progress ────────────────────────────────────────────────────────
  // The loop lives in lib/useLiveProgress, shared with the class-session view
  // (docs/audit/29 §6). Polling rather than realtime, and why, is documented
  // there; the decisions are from docs/audit/24 Part 3 and unchanged.
  const fetchRows = useCallback(async () => {
    const r = await getAssignmentResults(assignmentId)
    setInsights(r.insights)
    return r.results
  }, [assignmentId])
  const fetchHead = useCallback(() => getAssignmentResultsHead(assignmentId), [assignmentId])
  const progress = useLiveProgress({
    enabled: !loading && !notFound,
    fetchRows,
    fetchHead,
  })

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }

      const [a, q] = await Promise.all([
        getAssignment(assignmentId),
        getAssignmentQuestions(assignmentId),
      ])
      if (!a) { setNotFound(true); setLoading(false); return }
      setAssignment(a)
      setQuestions(q)
      setLoading(false)
    })
  }, [assignmentId, router])

  if (loading) {
    return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  if (notFound || !assignment) {
    return (
      <main style={styles.page}>
        <div style={styles.header}>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Assignment not found
          </h1>
          <button onClick={() => router.push('/dashboard/assignments')} style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}>
            Back
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            {assignment.title}
          </h1>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0' }}>
            {assignment.selection_mode === 'pool'
              ? `Skill pool · ${assignment.target_count} questions · ${skillSetLabel(assignment.skill_ids, id => skillsById[id]?.name)}`
              : `${questions.length} hand-picked question${questions.length !== 1 ? 's' : ''}`}
            {' · '}{COMPLETION_LABELS[assignment.completion_mode]}
            {assignment.due_at && ` · Due ${new Date(assignment.due_at).toLocaleDateString('en-GB')}`}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/assignments')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, flexShrink: 0 }}
        >
          All assignments
        </button>
      </div>

      {assignment.instructions && (
        <div style={{ ...card, padding: '12px 16px' }}>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, whiteSpace: 'pre-wrap' as const, lineHeight: '1.6' }}>
            {assignment.instructions}
          </p>
        </div>
      )}

      {/* Question list (picked mode only) */}
      {assignment.selection_mode === 'picked' && questions.length > 0 && (
        <div style={card}>
          <h2 style={sectionTitle}>Questions ({questions.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
            {questions.map((q, i) => {
              const qData = q.questions as any
              const skillName = qData?.skill_ids?.[0] ? (skillsById[qData.skill_ids[0]]?.name ?? qData.skill_ids[0]) : '—'
              return (
                <div key={q.id} style={styles.questionRow}>
                  <span style={{ fontSize: font.sm, color: colors.textHint, flexShrink: 0 }}>{i + 1}.</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: font.sm,
                      margin: 0,
                      color: colors.textPrimary,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical' as const,
                      lineHeight: '1.45',
                    }}>
                      {qData?.question_template?.replace(/\{[^}]+\}/g, '[…]') ?? '—'}
                    </p>
                    <p style={{ fontSize: '11px', color: colors.textHint, margin: '2px 0 0' }}>
                      {skillName} · {'★'.repeat(qData?.difficulty ?? 1)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <LiveProgressTable
        rows={progress.rows}
        live={progress.live}
        onResume={progress.resume}
        now={progress.now}
        loading={progress.loading}
      />

      {/* Below the names and closed, same as the class-session page: this one
          is less likely to be projected, but a teacher going through homework
          on the board is exactly when "4 of 9 got this wrong" is useful and
          exactly when the names should not be up. */}
      <ClassInsightsPanel insights={insights} />

    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: TEACHER_CONTENT_WIDTH,
    margin: '0 auto',
    padding: '24px 20px',
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
  questionRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    padding: '8px 10px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 10px',
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '10px 10px',
    fontSize: font.sm,
    verticalAlign: 'middle' as const,
  },
}
