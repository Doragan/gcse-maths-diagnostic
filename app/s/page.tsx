'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  parseParticipantName, readJoinedSession, writeJoinedSession, clearJoinedSession,
  MAX_PARTICIPANT_NAME, SESSION_KEYS, type JoinedSession,
} from '../../lib/classSessions'
import { CLASS_CODE_LENGTH } from '../../lib/classCode'
import {
  colors, font, radius,
  pageContainer, narrowCard, pageTitle,
  primaryButton, secondaryButton, inputStyle, labelStyle, errorBox,
} from '../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// Join a class session (docs/audit/29, increment 4).
//
// The shortest route in the app, because a teacher reads it out loud.
//
// NO ACCOUNT, NO EMAIL, NO AGE GATE. The 13+ gate on the account path exists
// because we become the controller of a child's record; here the school is the
// controller, the pupil is in a lesson they were told to join, and there is no
// record to speak of — a first name and some right-or-wrong marks, gone the
// same day. A Year 7 class is eleven, so an age question would be both wrong
// and unanswerable. See docs/audit/29 §4.3; the copy below is the pupil-facing
// half of that position and should not be trimmed for tidiness.
// ─────────────────────────────────────────────────────────────────────────────

export default function JoinSessionPage() {
  const router = useRouter()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [existing, setExisting] = useState<JoinedSession | null>(null)

  // Already joined in this tab? Offer to carry on rather than letting them
  // join twice and show up as two rows on the teacher's screen.
  //
  // In an effect, and lint objects to the synchronous setState. It has to be:
  // readJoinedSession() touches sessionStorage, so as a lazy useState
  // initialiser it would return null on the server and the stored session on
  // the client, which is a hydration mismatch. Setting it after mount is the
  // fix for that, not a shortcut around it.
  useEffect(() => { setExisting(readJoinedSession()) }, [])

  /** Picks a first question from the session's skills. */
  async function firstQuestionId(skillIds: string[]): Promise<string | null> {
    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('is_published', true)
      .overlaps('skill_ids', skillIds)
    if (!data || data.length === 0) return null
    return data[Math.floor(Math.random() * data.length)].id as string
  }

  async function handleJoin() {
    setError('')

    const trimmedCode = code.trim().toUpperCase()
    if (trimmedCode.length !== CLASS_CODE_LENGTH) {
      setError(`Your code is ${CLASS_CODE_LENGTH} characters.`)
      return
    }
    // Checked here as well as on the server so the pupil gets the message
    // without a round trip. The server is what actually enforces it.
    const parsed = parseParticipantName(name)
    if (!parsed.ok) { setError(parsed.error); return }

    setJoining(true)
    const res = await fetch('/api/class-sessions/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmedCode, name: parsed.value }),
    })
    const body = await res.json().catch(() => null)

    if (!res.ok) {
      setError(body?.error ?? 'Could not join. Try again.')
      setJoining(false)
      return
    }

    // The session's skills drive question selection through the same
    // sessionStorage key the focus modes already use, so nothing new is needed
    // on the serving side (see resolveSkillIds in the question page).
    try {
      sessionStorage.setItem('practice_focus_skills', JSON.stringify(body.session.skill_ids))

      // A lesson starts a fresh count. The question page's counters live in
      // sessionStorage and are shared with free practice, so a pupil who had
      // answered a few questions before joining would open their first
      // session question already reading "3 of 5 answered" — a number that
      // matches nothing the teacher can see.
      for (const key of ['session_total', 'session_correct', 'session_skills']) {
        sessionStorage.removeItem(key)
      }
      sessionStorage.removeItem(SESSION_KEYS.answered)
    } catch { /* storage disabled — questions fall back to the tier pool */ }

    writeJoinedSession({
      sessionId:     body.session.id,
      participantId: body.participant_id,
      name:          body.display_name,
      title:         body.session.title,
      target:        body.session.target_count ?? null,
    })

    const questionId = await firstQuestionId(body.session.skill_ids)
    if (!questionId) {
      setError('There are no questions ready for this session. Tell your teacher.')
      setJoining(false)
      return
    }

    router.push(`/practice/question/${questionId}?session=${body.session.id}`)
  }

  async function handleContinue() {
    if (!existing) return
    setError('')
    setJoining(true)

    // The skills were stored at join time under the same key the focus modes
    // use. If storage has been cleared since, there is nothing to resolve a
    // question from, so the honest move is to send them round again rather
    // than guess at a pool.
    let skillIds: string[] = []
    try {
      const raw = JSON.parse(sessionStorage.getItem('practice_focus_skills') ?? '[]')
      if (Array.isArray(raw)) skillIds = raw.filter((s: unknown): s is string => typeof s === 'string')
    } catch { /* fall through to the re-join path below */ }

    const questionId = skillIds.length > 0 ? await firstQuestionId(skillIds) : null
    if (!questionId) {
      clearJoinedSession()
      setExisting(null)
      setError('Enter the code again to carry on.')
      setJoining(false)
      return
    }

    router.push(`/practice/question/${questionId}?session=${existing.sessionId}`)
  }

  if (existing) {
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <h1 style={pageTitle}>Welcome back{existing.name ? `, ${existing.name}` : ''}</h1>
          {existing.title && (
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
              {existing.title}
            </p>
          )}
          <button onClick={handleContinue} style={primaryButton}>
            Carry on
          </button>
          <button
            onClick={() => { clearJoinedSession(); setExisting(null) }}
            style={secondaryButton}
          >
            I&apos;m someone else
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={pageContainer}>
      <div style={narrowCard}>
        <div>
          <h1 style={pageTitle}>Join your class</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            Enter the code your teacher has on the board
          </p>
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Class code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. MX4T"
            maxLength={CLASS_CODE_LENGTH}
            style={{
              ...inputStyle,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.25em',
              fontSize: '24px',
              textAlign: 'center' as const,
              fontWeight: '700',
            }}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div style={styles.field}>
          {/* "First name" in the label, in the placeholder, and capped in the
              input: three places, because this is the only personal data the
              whole feature collects and the ask has to be unmistakable. */}
          <label style={labelStyle}>Your first name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Jamie B"
            maxLength={MAX_PARTICIPANT_NAME}
            style={inputStyle}
            autoComplete="off"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <p style={{ fontSize: '12px', color: colors.textHint, margin: '6px 0 0', lineHeight: '1.5' }}>
            Just a first name, so your teacher can see how you are getting on. No email, no
            password, nothing to sign up for — and it is all deleted at the end of the day.
          </p>
        </div>

        {error && <p style={errorBox}>{error}</p>}

        <button
          onClick={handleJoin}
          disabled={joining || !code || !name}
          style={{ ...primaryButton, opacity: joining || !code || !name ? 0.6 : 1 }}
        >
          {joining ? 'Joining…' : 'Start'}
        </button>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderRadius: radius.sm,
  },
}
