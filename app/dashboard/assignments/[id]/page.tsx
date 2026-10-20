'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession, requireTeacher } from '../../../../lib/auth'
import {
  getAssignment, getAssignmentQuestions, getAssignmentResults, getAssignmentResultsHead,
  type Assignment, type AssignmentQuestion, type AssignmentResult,
} from '../../../../lib/assignments'
import {
  headChanged, shouldPause,
  POLL_MS, type ResultsHead,
} from '../../../../lib/liveProgress'
import LiveProgressTable from '../../../../components/LiveProgressTable'
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
  const [loading, setLoading]               = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)
  const [notFound, setNotFound]             = useState(false)

  // ── Live progress (docs/audit/24, Part 3) ────────────────────────────────
  // Polling, not realtime: a change event carries a student_id and nothing
  // nameable, so it could only ever supplement this payload rather than
  // replace it. The cheap head probe keeps the cost down — see the head route.
  const [live, setLive] = useState(true)
  // Advanced on each probe so "answering now" and the clock times decay.
  const [now, setNow] = useState(() => Date.now())
  const headRef = useRef<ResultsHead | null>(null)
  const lastChangeRef = useRef<number>(Date.now())

  const loadResults = useCallback(async () => {
    const res = await getAssignmentResults(assignmentId)
    setResults(res.results)
  }, [assignmentId])

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
        await loadResults()
        // Seed the probe baseline from the server rather than deriving it from
        // the rows: an attempt by a student who has since left the class counts
        // in the head but has no row, which would read as a change for ever.
        headRef.current = await getAssignmentResultsHead(assignmentId)
      } catch { /* results load failed */ }
      finally { setLoadingResults(false) }
    })
  }, [assignmentId, loadResults])

  // Poll while the tab is visible; stand down after a long quiet spell.
  useEffect(() => {
    if (!live || loading || notFound) return
    let cancelled = false

    async function probe() {
      if (cancelled || document.visibilityState === 'hidden') return
      try {
        const head = await getAssignmentResultsHead(assignmentId)
        if (cancelled) return
        if (headChanged(headRef.current, head)) {
          headRef.current = head
          lastChangeRef.current = Date.now()
          await loadResults()
        } else if (shouldPause(lastChangeRef.current)) {
          // A teacher leaves tabs open for days; a lesson lasts an hour.
          setLive(false)
        }
        if (!cancelled) setNow(Date.now())
      } catch {
        // A failed probe isn't worth interrupting a lesson for — the next one
        // retries, and the rows on screen are still the last good ones.
      }
    }

    const timer = setInterval(probe, POLL_MS)
    // Catch up at once when the teacher comes back to the tab.
    const onVisibility = () => { if (document.visibilityState === 'visible') probe() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [assignmentId, live, loading, notFound, loadResults])

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

      <LiveProgressTable
        rows={results}
        live={live}
        onResume={() => { lastChangeRef.current = Date.now(); setLive(true) }}
        now={now}
        loading={loadingResults}
      />

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
