'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, sectionTitle,
  TEACHER_CONTENT_WIDTH,
} from '../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// The join-code diagnostic, moved off the front door (docs/audit/30, Option A).
//
// This page is the whole of what /dashboard used to be: create an assessment,
// get a 4-character code, read the results. It was the teacher's landing page
// while it was the only teacher feature there was, and it stayed there as five
// others were built around it — so a teacher's first screen was a flow with
// nothing submitted to it since 4 April.
//
// MOVED, NOT RETIRED. The capability is real and nothing else replaces it: an
// adaptive placement across the curriculum that needs no pupil accounts. A
// class session is the modern no-accounts flow but it does something different
// (practice on skills the teacher picks, not an adaptive diagnostic), so
// deleting this would remove something rather than tidy it.
//
// ⚠ It can only make gcse_foundation or gcse_higher. The rest of the app has
// served International GCSE since PR #140, so an iGCSE teacher who creates one
// here gets GCSE content. That is the strongest argument for retiring it
// properly rather than relocating it, and it is the user's call, not a tidy-up
// to make quietly. Until then this page is where it lives and the limitation is
// stated on it.
// ─────────────────────────────────────────────────────────────────────────────

type Assessment = {
  id: string
  title: string
  code: string
  course_id: string
  created_at: string
}

export default function LegacyAssessmentsPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newCourseId, setNewCourseId] = useState('gcse_foundation')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) setAssessments(data)
      setLoading(false)
    })
  }, [router])

  async function createAssessment() {
    if (!newTitle.trim()) return

    setCreating(true)
    setCreateError('')
    try {
      const session = await getSession()
      if (!session) { router.push('/auth'); return }

      // Creation runs server-side (app/api/assessments/create) under the service
      // role, so the client never writes teachers.free_assessments_used. There is
      // no longer a limit to enforce — diagnostics are free — but the route stays
      // for that write boundary.
      const res = await fetch('/api/assessments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: newTitle.trim(), courseId: newCourseId }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.assessment) {
        setCreateError(
          json?.error ? `${json.error} (HTTP ${res.status})` : `Couldn't create assessment (HTTP ${res.status})`,
        )
        return
      }

      setAssessments(prev => [json.assessment, ...prev])
      setNewTitle('')
      setNewCourseId('gcse_foundation')
    } catch (e: unknown) {
      setCreateError(`Network error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Class diagnostic
          </h1>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0', lineHeight: '1.6' }}>
            Pupils join with a code and sit an adaptive diagnostic. No accounts needed.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, flexShrink: 0 }}
        >
          Dashboard
        </button>
      </div>

      {/* Said on the page rather than left to be discovered. */}
      <div style={{ ...card, padding: '12px 16px', background: colors.cardAlt }}>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
          This is the oldest part of the teacher side and it only covers <strong>GCSE</strong>
          {' '}Foundation and Higher — not International GCSE. For a lesson on skills you choose,
          a <Link href="/dashboard/sessions" style={{ color: colors.primary }}>class session</Link> is
          the newer way to do it without accounts.
        </p>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>New diagnostic</h2>
        <div style={{ ...styles.row, marginTop: '12px' }}>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="e.g. Year 10 Set 2 — March"
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && createAssessment()}
          />
          <button
            onClick={createAssessment}
            disabled={creating || !newTitle.trim()}
            style={{
              ...primaryButton,
              width: 'auto',
              padding: '10px 18px',
              opacity: creating || !newTitle.trim() ? 0.6 : 1,
              whiteSpace: 'nowrap' as const,
            }}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
        {createError && (
          <p style={{ fontSize: font.sm, color: colors.dangerText, margin: '8px 0 0' }}>
            {createError}
          </p>
        )}
        <div style={{ ...styles.toggle, marginTop: '12px' }}>
          <button
            onClick={() => setNewCourseId('gcse_foundation')}
            style={{
              ...styles.toggleButton,
              background: newCourseId === 'gcse_foundation' ? colors.primary : 'transparent',
              color: newCourseId === 'gcse_foundation' ? '#ffffff' : colors.textSecondary,
            }}
          >
            Foundation
          </button>
          <button
            onClick={() => setNewCourseId('gcse_higher')}
            style={{
              ...styles.toggleButton,
              background: newCourseId === 'gcse_higher' ? colors.primary : 'transparent',
              color: newCourseId === 'gcse_higher' ? '#ffffff' : colors.textSecondary,
            }}
          >
            Higher
          </button>
        </div>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>
          Your diagnostics{' '}
          {assessments.length > 0 && (
            <span style={{ color: colors.textHint, fontWeight: '400' }}>({assessments.length})</span>
          )}
        </h2>
        {assessments.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '12px 0 0' }}>
            None yet — create one above.
          </p>
        ) : (
          <div style={{ ...styles.list, marginTop: '12px' }}>
            {assessments.map(a => (
              <div
                key={a.id}
                style={styles.assessmentRow}
                onClick={() => router.push(`/dashboard/${a.id}`)}
              >
                <div>
                  <p style={{ fontSize: font.md, fontWeight: '500', margin: 0, color: colors.textPrimary }}>
                    {a.title}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
                      {new Date(a.created_at).toLocaleDateString('en-GB')}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: a.course_id === 'gcse_higher' ? '#ede9fe' : '#e0f2fe',
                      color: a.course_id === 'gcse_higher' ? '#5b21b6' : '#0369a1',
                    }}>
                      {a.course_id === 'gcse_higher' ? 'Higher' : 'Foundation'}
                    </span>
                  </div>
                </div>
                <div style={styles.codeBox}>
                  <span style={{ fontSize: '11px', color: colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                    Code
                  </span>
                  <span style={{ fontSize: '22px', fontWeight: '700', color: colors.primary, letterSpacing: '0.1em' }}>
                    {a.code}
                  </span>
                </div>
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
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  row: {
    display: 'flex',
    gap: '10px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  assessmentRow: {
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
  codeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    flexShrink: 0,
  },
  toggle: {
    display: 'flex',
    borderRadius: radius.md,
    overflow: 'hidden',
    border: `1px solid ${colors.borderStrong}`,
  },
  toggleButton: {
    flex: 1,
    padding: '8px',
    border: 'none',
    fontSize: font.base,
    fontWeight: '600',
    cursor: 'pointer',
    background: 'transparent',
  },
}
