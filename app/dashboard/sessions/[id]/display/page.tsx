'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession, requireTeacher } from '../../../../../lib/auth'
import { getSessionDisplay, type SessionDisplay } from '../../../../../lib/classSessionsApi'
import { sessionLifecycle } from '../../../../../lib/classSessions'
import { POLL_MS } from '../../../../../lib/liveProgress'
import { colors, font } from '../../../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// The projector view: the join URL and the code, as large as the screen allows,
// and nothing a class should not see.
//
// This is the answer to "the URL is too small", which a bigger font on the
// teacher's own page only half solves — that page also carries pupil names, so
// it cannot go on a classroom wall. Two screens, two jobs: this one faces the
// room, the session page faces the teacher.
//
// ⚠ NO NAMES REACH THIS PAGE AT ALL. Not rendered, not fetched — it calls
// /api/class-sessions/[id]/display, which returns counts and a code. A page
// that merely declines to render names still has them in the browser and in
// the network tab, and nobody audits that before plugging in a projector.
//
// It polls, and that is for CORRECTNESS rather than liveness: when the session
// closes or expires the code must come off the wall, because a code the
// database will refuse is the worst thing this feature can put in front of a
// class. Same rule as the session page, same reason.
//
// Auth is the ordinary teacher login. For a second device, the teacher signs in
// there too. A link that needs no sign-in would make this projectable from a
// classroom PC, but it would also be a bearer token for the session, so it is
// a deliberate decision to take rather than a default to drift into.
// ─────────────────────────────────────────────────────────────────────────────

/** Where pupils go. Short because a teacher reads it out loud. */
const JOIN_PATH = '/s'

export default function SessionDisplayPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const sessionId = params.id

  const [display, setDisplay] = useState<SessionDisplay | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    const next = await getSessionDisplay(sessionId)
    setDisplay(next)
  }, [sessionId])

  useEffect(() => {
    getSession().then(async auth => {
      if (!auth) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      try { await load() } catch { setNotFound(true) }
      finally { setLoading(false) }
    })
  }, [router, load])

  // No visibility gating and no idle stand-down, unlike the teacher's live
  // table: a projector screen is by definition one nobody is interacting with,
  // and standing the poll down would leave a stale code on the wall — the one
  // outcome this page exists to prevent.
  useEffect(() => {
    if (loading || notFound) return
    const timer = setInterval(() => { load().catch(() => {}) }, POLL_MS)
    return () => clearInterval(timer)
  }, [loading, notFound, load])

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.host.replace(/^www\./, '')}${JOIN_PATH}`
    : JOIN_PATH

  if (loading) {
    return <main style={styles.screen}><p style={styles.quiet}>Loading…</p></main>
  }

  if (notFound || !display) {
    return (
      <main style={styles.screen}>
        <p style={styles.ended}>Session not found</p>
        <button onClick={() => router.push('/dashboard/sessions')} style={styles.exit}>
          All sessions
        </button>
      </main>
    )
  }

  const state = sessionLifecycle(display)

  if (state !== 'live') {
    return (
      <main style={styles.screen}>
        <p style={styles.ended}>
          {state === 'closed' ? 'Session closed' : 'Session finished'}
        </p>
        <p style={styles.quiet}>
          {display.joined} joined · {display.answers} answer{display.answers === 1 ? '' : 's'}
        </p>
        <button onClick={() => router.push(`/dashboard/sessions/${sessionId}`)} style={styles.exit}>
          Back to the session
        </button>
      </main>
    )
  }

  return (
    <main style={styles.screen}>
      <p style={styles.label}>Go to</p>
      <p style={styles.url}>{joinUrl}</p>
      <p style={styles.label}>and enter the code</p>
      <p style={styles.code}>{display.code}</p>

      {/* The only live figure, and it is the reassuring one: a teacher at the
          front wants to know everyone is in, not how anyone is doing. Counts
          only — who they are is on the teacher's own screen, not this one. */}
      <p style={styles.joined}>
        {display.joined === 0
          ? 'Waiting for the first pupil to join'
          : `${display.joined} joined`}
      </p>

      <button onClick={() => router.push(`/dashboard/sessions/${sessionId}`)} style={styles.exit}>
        Exit
      </button>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    // Fills whatever it is projected on, with nothing to scroll past.
    minHeight: '100dvh',
    boxSizing: 'border-box',
    padding: 'clamp(20px, 4vh, 56px) 24px',
    background: colors.card,
    color: colors.textPrimary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0',
    textAlign: 'center' as const,
  },
  label: {
    fontSize: 'clamp(18px, 3.2vw, 40px)',
    color: colors.textSecondary,
    margin: 0,
    lineHeight: '1.2',
  },
  url: {
    fontSize: 'clamp(34px, 8vw, 104px)',
    fontWeight: '700',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    margin: 'clamp(6px, 1.5vh, 18px) 0',
    lineHeight: '1.05',
    overflowWrap: 'anywhere' as const,
  },
  code: {
    // The biggest thing on the wall. 0.22em of tracking because four
    // characters read one at a time at distance, not as a word.
    fontSize: 'clamp(90px, 26vw, 300px)',
    fontWeight: '700',
    letterSpacing: '0.22em',
    // Tracking adds space after the last character too, which throws the
    // whole line off centre at this size.
    textIndent: '0.22em',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    margin: 'clamp(4px, 1vh, 16px) 0',
    lineHeight: '1',
  },
  joined: {
    fontSize: 'clamp(18px, 3vw, 38px)',
    color: colors.textSecondary,
    margin: 'clamp(10px, 2vh, 28px) 0 0',
  },
  ended: {
    fontSize: 'clamp(32px, 6vw, 72px)',
    fontWeight: '700',
    margin: 0,
  },
  quiet: {
    fontSize: 'clamp(16px, 2.4vw, 28px)',
    color: colors.textSecondary,
    margin: '12px 0 0',
  },
  exit: {
    // Present but unobtrusive: the teacher needs a way out, the room does not
    // need to read it.
    marginTop: 'clamp(16px, 4vh, 48px)',
    background: 'transparent',
    color: colors.textSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: font.base,
    cursor: 'pointer',
  },
}
