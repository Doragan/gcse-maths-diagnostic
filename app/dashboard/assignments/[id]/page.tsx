'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession, requireTeacher } from '../../../../lib/auth'
import {
  getAssignment, getAssignmentQuestions, getAssignmentResults,
  type Assignment, type AssignmentQuestion, type AssignmentResult,
} from '../../../../lib/assignments'
import { skillsById } from '../../../../lib/skills/skillGraph'
import {
  colors, font, radius, card,
  secondaryButton, sectionTitle,
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

  const [assignment, setAssignment]         = useState<Assignment | null>(null)
  const [questions, setQuestions]           = useState<AssignmentQuestion[]>([])
  const [results, setResults]               = useState<AssignmentResult[]>([])
  const [assignedCount, setAssignedCount]   = useState(0)
  const [loading, setLoading]               = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)
  const [notFound, setNotFound]             = useState(false)

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

      // Load results in background
      setLoadingResults(true)
      try {
        const res = await getAssignmentResults(assignmentId)
        setResults(res.results)
        setAssignedCount(res.assignedCount)
      } catch { /* results load failed */ }
      finally { setLoadingResults(false) }
    })
  }, [assignmentId])

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

  const completedCount = results.filter(r => r.is_complete).length
  const startedCount   = results.filter(r => r.total_attempts > 0).length

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            {assignment.title}
          </h1>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0' }}>
            {assignment.selection_mode === 'pool'
              ? `Skill pool · ${assignment.target_count} questions · ${skillsById[assignment.skill_ids[0]]?.name ?? assignment.skill_ids[0]}`
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

      {/* Results */}
      <div style={card}>
        <h2 style={{ ...sectionTitle, margin: '0 0 12px' }}>
          Results{' '}
          {results.length > 0 && (
            <span style={{ color: colors.textHint, fontWeight: '400' }}>({results.length} student{results.length !== 1 ? 's' : ''})</span>
          )}
        </h2>

        {/* Summary stats row */}
        {results.length > 0 && (
          <div style={{ display: 'flex', gap: '0', borderRadius: radius.md, overflow: 'hidden', border: `1px solid ${colors.border}`, marginBottom: '16px' }}>
            {[
              { label: 'Assigned', value: String(results.length) },
              { label: 'Started',  value: String(startedCount) },
              { label: 'Complete', value: String(completedCount), highlight: completedCount === results.length },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ flex: 1, padding: '10px 12px', borderRight: `1px solid ${colors.border}`, background: highlight ? colors.successLight : colors.cardAlt, textAlign: 'center' as const }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: colors.textSecondary, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontSize: font.xl, fontWeight: '700', margin: 0, color: highlight ? colors.successText : colors.textPrimary }}>{value}</p>
              </div>
            ))}
            <div style={{ flex: 1, padding: '10px 12px', background: colors.cardAlt, textAlign: 'center' as const }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: colors.textSecondary, margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Avg score</p>
              <p style={{ fontSize: font.xl, fontWeight: '700', margin: 0, color: colors.textPrimary }}>
                {(() => {
                  const scoreable = results.filter(r => r.score !== null)
                  if (scoreable.length === 0) return '—'
                  const avg = scoreable.reduce((sum, r) => {
                    const pct = r.score ? parseInt(r.score) : 0
                    return sum + pct
                  }, 0) / scoreable.length
                  return `${Math.round(avg)}%`
                })()}
              </p>
            </div>
          </div>
        )}

        {loadingResults ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '12px 0 0' }}>Loading results…</p>
        ) : results.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '12px 0 0', lineHeight: '1.6' }}>
            No students have been targeted or none have started yet.
          </p>
        ) : (
          <div style={{ marginTop: '12px', overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: font.sm }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Last attempt</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.student_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '500', color: colors.textPrimary }}>{r.display_name}</span>
                      {r.year_group && <span style={{ color: colors.textHint }}> · {r.year_group}</span>}
                    </td>
                    <td style={{ ...styles.td, fontWeight: '600', color: colors.textPrimary }}>
                      {r.score ?? '—'}
                    </td>
                    <td style={styles.td}>
                      {r.total_attempts === 0 ? (
                        <span style={{ color: colors.textHint }}>Not started</span>
                      ) : r.is_complete ? (
                        <span style={{ color: colors.successText, fontWeight: '600' }}>✓ Complete</span>
                      ) : (
                        <span style={{ color: colors.warning, fontWeight: '500' }}>In progress</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, color: colors.textHint }}>
                      {r.last_attempt_at
                        ? new Date(r.last_attempt_at).toLocaleDateString('en-GB')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '700px',
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
