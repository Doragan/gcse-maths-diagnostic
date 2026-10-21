'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession, requireTeacher } from '../../../../lib/auth'
import { getClassSession, closeClassSession } from '../../../../lib/classSessionsApi'
import { sessionLifecycle, type ClassSession } from '../../../../lib/classSessions'
import { getClassSessionResults, getClassSessionResultsHead } from '../../../../lib/classSessionsApi'
import { useLiveProgress } from '../../../../lib/useLiveProgress'
import LiveProgressTable from '../../../../components/LiveProgressTable'
import { skillsById } from '../../../../lib/skills/skillGraph'
import {
  colors, font, card,
  primaryButton, secondaryButton, errorBox,
} from '../../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// A running class session: the code, big enough to read from the back, and a
// way to stop it (docs/audit/29, increment 3).
//
// The live progress table goes in here at increment 5, via the
// LiveProgressTable component already extracted for it.
// ─────────────────────────────────────────────────────────────────────────────

/** Where pupils go. Short because a teacher reads it out loud. */
const JOIN_PATH = '/s'

export default function ClassSessionPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const sessionId = params.id

  const [session, setSession] = useState<ClassSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [closing, setClosing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSession().then(async auth => {
      if (!auth) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      const found = await getClassSession(sessionId)
      if (!found) { setNotFound(true); setLoading(false); return }
      setSession(found)
      setLoading(false)
    })
  }, [router, sessionId])

  // The same loop and the same table as the assignment view. Polling stops
  // once the session is no longer live: nothing can change after that, so a
  // closed session must not keep a tab probing every ten seconds all evening.
  const fetchRows = useCallback(() => getClassSessionResults(sessionId), [sessionId])
  const fetchHead = useCallback(() => getClassSessionResultsHead(sessionId), [sessionId])
  const progress = useLiveProgress({
    enabled:   !loading && !notFound,
    fetchRows,
    fetchHead,
  })

  async function handleClose() {
    setError('')
    setClosing(true)
    const result = await closeClassSession(sessionId)
    setClosing(false)
    if ('error' in result) { setError(result.error); return }
    setSession(result.session)
    setConfirmClose(false)
  }

  if (loading) {
    return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  if (notFound || !session) {
    return (
      <main style={styles.page}>
        <div style={styles.header}>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Session not found
          </h1>
          <button
            onClick={() => router.push('/dashboard/sessions')}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Back
          </button>
        </div>
      </main>
    )
  }

  const state = sessionLifecycle(session)
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.host}${JOIN_PATH}`
    : JOIN_PATH

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            {session.title}
          </h1>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0' }}>
            {session.target_count} question{session.target_count === 1 ? '' : 's'} each ·{' '}
            {session.skill_ids.map(id => skillsById[id]?.name ?? id).join(', ')}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/sessions')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, flexShrink: 0 }}
        >
          All sessions
        </button>
      </div>

      {/* ── The code ───────────────────────────────────────────────────────────
          The whole point of the screen while a lesson is starting, so it gets
          the whole card and a size that survives being read from the back row.
          Once the session is over it is not shown at all: a code on screen that
          the database will refuse is the worst thing this feature can do. */}
      {state === 'live' ? (
        <div style={{ ...card, textAlign: 'center' as const, padding: '24px 20px' }}>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
            Pupils go to <strong style={{ color: colors.textPrimary }}>{joinUrl}</strong> and enter
          </p>
          <p style={styles.code}>{session.code}</p>
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
            They type a first name — no account, no email. Open until{' '}
            {new Date(session.expires_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.
          </p>
        </div>
      ) : (
        <div style={{ ...card, padding: '16px 20px', background: colors.cardAlt }}>
          <p style={{ fontSize: font.base, color: colors.textPrimary, margin: 0, fontWeight: '500' }}>
            {state === 'closed' ? 'This session is closed.' : 'This session has finished.'}
          </p>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '6px 0 0', lineHeight: '1.6' }}>
            {state === 'closed'
              ? 'It is no longer accepting answers, and the code has been released for reuse.'
              : 'Sessions run for the school day and then stop accepting answers.'}{' '}
            Start a new one when you need it — it takes a few seconds.
          </p>
        </div>
      )}

      <LiveProgressTable
        rows={progress.rows}
        live={progress.live && state === 'live'}
        onResume={progress.resume}
        now={progress.now}
        loading={progress.loading}
        title="Progress"
        noun={{ one: 'pupil', many: 'pupils' }}
        rosterLabel="Joined"
        emptyMessage="Nobody has joined yet. Read the code out and they will appear here."
      />

      {error && <p style={errorBox}>{error}</p>}

      {/* ── Close ──────────────────────────────────────────────────────────────
          Two taps, because there is no reopen and the teacher may be holding a
          phone in a busy room. */}
      {state === 'live' && (
        confirmClose ? (
          <div style={{ ...card, padding: '14px 16px' }}>
            <p style={{ fontSize: font.sm, color: colors.textPrimary, margin: '0 0 10px', lineHeight: '1.6' }}>
              Close the session? Pupils still answering will be stopped, and the code cannot be
              reopened.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleClose}
                disabled={closing}
                style={{ ...primaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, opacity: closing ? 0.6 : 1 }}
              >
                {closing ? 'Closing…' : 'Yes, close it'}
              </button>
              <button
                onClick={() => setConfirmClose(false)}
                style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
              >
                Keep it open
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClose(true)}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, alignSelf: 'flex-start' as const }}
          >
            Close session
          </button>
        )
      )}
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
  code: {
    // Read from the back of a classroom, so this is deliberately enormous.
    // clamp() rather than a fixed size: the same screen gets projected and
    // looked at on a phone.
    fontSize: 'clamp(56px, 18vw, 104px)',
    fontWeight: '700',
    letterSpacing: '0.12em',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    color: colors.textPrimary,
    margin: '8px 0 10px',
    lineHeight: '1.05',
  },
}
