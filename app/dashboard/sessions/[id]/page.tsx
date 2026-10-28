'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession, requireTeacher } from '../../../../lib/auth'
import { getClassSession, closeClassSession } from '../../../../lib/classSessionsApi'
import { sessionLifecycle, type ClassSession } from '../../../../lib/classSessions'
import { getClassSessionResults, getClassSessionResultsHead } from '../../../../lib/classSessionsApi'
import { useLiveProgress } from '../../../../lib/useLiveProgress'
import LiveProgressTable from '../../../../components/LiveProgressTable'
import SessionInsightsPanel from '../../../../components/SessionInsightsPanel'
import type { SessionInsights } from '../../../../lib/sessionInsights'
import { skillsById } from '../../../../lib/skills/skillGraph'
import {
  colors, font, card,
  primaryButton, secondaryButton, errorBox,
  TEACHER_CONTENT_WIDTH,
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
  const [insights, setInsights] = useState<SessionInsights>(
    { questions: [], skills: [], misconceptions: [], untaggedWrong: 0 },
  )

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
  // The insights ride on the same response as the rows, so they are caught
  // here on the way past rather than fetched again. useLiveProgress only wants
  // the rows, and it is shared with the assignment view, which has no insights
  // to carry — so the adapting happens on this side of it.
  const fetchRows = useCallback(async () => {
    const { rows, insights: next } = await getClassSessionResults(sessionId)
    setInsights(next)
    return rows
  }, [sessionId])
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

  // The host, minus any leading "www.", because this line gets READ ALOUD
  // across a classroom: "mathsense.net slash s" rather than "w w w dot
  // mathsense dot net slash s". Four fewer syllables, thirty pupils.
  //
  // Safe because the apex redirects to www (verified 2026-10-21:
  // mathsense.net/s answers 307 to www.mathsense.net/s, which answers 200), so
  // what a pupil types still arrives. If that redirect ever goes away this
  // line starts advertising a dead address, which is the one thing to know
  // before changing the domain setup.
  //
  // Hosts with no www are untouched, so localhost and preview deployments
  // still show something a teacher can actually use.
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.host.replace(/^www\./, '')}${JOIN_PATH}`
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
        <div style={{ ...card, textAlign: 'center' as const, padding: '28px 20px' }}>
          {/* The URL is half the instruction and was set in 12px while the code
              beside it ran to 104px — unreadable from the room the code was
              sized for. It gets its own line and a scale of its own now. Still
              smaller than the code, because pupils type the URL once and the
              code is what they squint at. */}
          <p style={styles.joinLabel}>Pupils go to</p>
          <p style={styles.joinUrl}>{joinUrl}</p>
          <p style={styles.joinLabel}>and enter</p>
          <p style={styles.code}>{session.code}</p>
          {/* Opens in a new tab on purpose: the point is TWO windows — this one
              for the teacher, that one facing the room, and on a second screen
              if there is one. The projector page carries no pupil names, which
              is what makes it safe to put on a wall. */}
          <p style={{ margin: '0 0 14px' }}>
            <a
              href={`/dashboard/sessions/${sessionId}/display`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...secondaryButton,
                display: 'inline-block',
                width: 'auto',
                padding: '10px 18px',
                fontSize: font.base,
                textDecoration: 'none',
              }}
            >
              Open projector view ↗
            </a>
          </p>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
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

      {/* Below the names on purpose, and closed on purpose: a teacher with one
          screen is mirroring this page to the projector. */}
      <SessionInsightsPanel insights={insights} />

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
  joinLabel: {
    fontSize: font.base,
    color: colors.textSecondary,
    margin: 0,
  },
  joinUrl: {
    // Big enough to read across a room, and in the same mono stack as the code
    // so a lowercase l and a 1 cannot be confused at distance.
    fontSize: 'clamp(26px, 7vw, 46px)',
    fontWeight: '700',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    color: colors.textPrimary,
    margin: '6px 0 10px',
    lineHeight: '1.15',
    // A long preview-deployment host must wrap rather than overflow the card.
    overflowWrap: 'anywhere' as const,
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
