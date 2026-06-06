'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, requireTeacher } from '../../../lib/auth'
import { getTeacherAssignments, type Assignment } from '../../../lib/assignments'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, sectionTitle,
} from '../../../lib/styles'

const COMPLETION_LABELS: Record<string, string> = {
  attempt_once:   'Attempt once',
  until_correct:  'Until correct',
  mastery_based:  'Mastery-based',
}

const MODE_LABELS: Record<string, string> = {
  picked: 'Hand-picked',
  pool:   'Skill pool',
}

export default function TeacherAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      try {
        setAssignments(await getTeacherAssignments())
      } catch (e: any) {
        setLoadError(e?.message ?? 'Could not load assignments.')
      } finally {
        setLoading(false)
      }
    })
  }, [])

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          Assignments
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push('/dashboard/assignments/create')}
            style={{ ...primaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            + New assignment
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Dashboard
          </button>
        </div>
      </div>

      {loadError && (
        <p style={{ fontSize: font.base, color: colors.dangerText, margin: 0 }}>{loadError}</p>
      )}

      <div style={card}>
        <h2 style={sectionTitle}>Your assignments</h2>
        {assignments.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '8px 0 0', lineHeight: '1.6' }}>
            No assignments yet. Create one above to set work for your classes.
          </p>
        ) : (
          <div style={styles.list}>
            {assignments.map(a => (
              <div
                key={a.id}
                style={styles.row}
                onClick={() => router.push(`/dashboard/assignments/${a.id}`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: font.md, fontWeight: '500', margin: 0, color: colors.textPrimary }}>
                    {a.title}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' as const }}>
                    <span style={styles.chip}>{MODE_LABELS[a.selection_mode] ?? a.selection_mode}</span>
                    <span style={styles.chip}>{COMPLETION_LABELS[a.completion_mode] ?? a.completion_mode}</span>
                    {a.due_at && (
                      <span style={{ fontSize: font.sm, color: new Date(a.due_at) < new Date() ? colors.dangerText : colors.textHint }}>
                        Due {new Date(a.due_at).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: font.sm, color: colors.textHint, flexShrink: 0 }}>
                  {new Date(a.created_at).toLocaleDateString('en-GB')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '640px',
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
    gap: '12px',
    flexWrap: 'wrap' as const,
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
