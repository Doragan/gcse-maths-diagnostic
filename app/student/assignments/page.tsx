'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStudentProfile } from '../../../lib/auth'
import { getStudentAssignments, type Assignment } from '../../../lib/assignments'
import {
  colors, font, radius, card,
  secondaryButton, sectionTitle,
} from '../../../lib/styles'

const COMPLETION_LABELS: Record<string, string> = {
  attempt_once:   'Attempt once each',
  until_correct:  'Until correct',
  mastery_based:  'Mastery-based',
}

export default function StudentAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    (async () => {
      const profile = await getStudentProfile()
      if (!profile) { router.push('/student'); return }
      try {
        setAssignments(await getStudentAssignments())
      } catch (e: any) {
        setLoadError(e?.message ?? 'Could not load assignments.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          My assignments
        </h1>
        <button
          onClick={() => router.push('/student/dashboard')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          Dashboard
        </button>
      </div>

      {loadError && (
        <p style={{ fontSize: font.base, color: colors.dangerText, margin: 0 }}>{loadError}</p>
      )}

      <div style={card}>
        <h2 style={sectionTitle}>Set for you</h2>
        {assignments.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '8px 0 0', lineHeight: '1.6' }}>
            No assignments yet. Join a class to receive work from your teacher.
          </p>
        ) : (
          <div style={styles.list}>
            {assignments.map(a => {
              const overdue = a.due_at && new Date(a.due_at) < new Date()
              return (
                <div
                  key={a.id}
                  style={styles.row}
                  onClick={() => router.push(`/student/assignments/${a.id}`)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: font.md, fontWeight: '500', margin: 0, color: colors.textPrimary }}>
                      {a.title}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' as const }}>
                      <span style={styles.chip}>{COMPLETION_LABELS[a.completion_mode]}</span>
                      {a.due_at && (
                        <span style={{ fontSize: font.sm, color: overdue ? colors.dangerText : colors.textHint }}>
                          {overdue ? 'Overdue · ' : 'Due '}
                          {new Date(a.due_at).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: font.xl, color: colors.textHint, flexShrink: 0 }}>›</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
    cursor: 'pointer',
  },
  chip: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 7px',
    borderRadius: '4px',
    background: '#e0f2fe',
    color: '#0369a1',
  },
}
