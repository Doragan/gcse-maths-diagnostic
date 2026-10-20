import { describe, it, expect } from 'vitest'
import { sessionLifecycle, parseParticipantName, MAX_PARTICIPANT_NAME } from './classSessions'

const NOW = new Date('2026-10-20T14:30:00Z').getTime()
const inMinutes = (m: number) => new Date(NOW + m * 60_000).toISOString()

describe('sessionLifecycle', () => {
  // This function exists to agree with session_accepts_attempt() in
  // 20261020_class_sessions.sql, which requires status = 'open' AND
  // expires_at > now(). If the UI and that gate ever disagree, a teacher shows
  // a code to thirty pupils whose every answer is then silently rejected.

  it('is live while open and unexpired', () => {
    expect(sessionLifecycle({ status: 'open', expires_at: inMinutes(60) }, NOW)).toBe('live')
  })

  it('is expired once the clock passes expires_at, even though status is still open', () => {
    // The sweep deletes expired sessions eventually, not instantly, so an open
    // row with a past expiry is a normal state and not a bug.
    expect(sessionLifecycle({ status: 'open', expires_at: inMinutes(-1) }, NOW)).toBe('expired')
  })

  it('treats the exact expiry instant as expired, matching the strict > in SQL', () => {
    // The gate is `expires_at > now()`, so equality is NOT live. Off by one
    // here would show a code for a session the database refuses.
    expect(sessionLifecycle({ status: 'open', expires_at: new Date(NOW).toISOString() }, NOW)).toBe('expired')
  })

  it('reports closed in preference to expired when both are true', () => {
    // The teacher's own act is the more useful thing to tell them about.
    expect(sessionLifecycle({ status: 'closed', expires_at: inMinutes(-120) }, NOW)).toBe('closed')
  })

  it('reports closed even while the expiry is still in the future', () => {
    expect(sessionLifecycle({ status: 'closed', expires_at: inMinutes(60) }, NOW)).toBe('closed')
  })
})

describe('parseParticipantName', () => {
  // These rules mirror the CHECKs on session_participants.display_name in
  // 20261020_class_sessions.sql: 1 to 24 characters, and no '@'. If they drift
  // apart a pupil gets a database rejection they cannot read, mid-lesson.

  it('accepts a first name', () => {
    expect(parseParticipantName('Jamie')).toEqual({ ok: true, value: 'Jamie' })
    expect(parseParticipantName('Jamie B')).toEqual({ ok: true, value: 'Jamie B' })
  })

  it('trims and collapses whitespace, so one pupil is not two rows', () => {
    expect(parseParticipantName('  Jamie   B  ')).toEqual({ ok: true, value: 'Jamie B' })
    expect(parseParticipantName('Jamie\tB')).toEqual({ ok: true, value: 'Jamie B' })
  })

  it('rejects blank — the teacher has to tell rows apart', () => {
    for (const blank of ['', '   ', '\n', undefined, null, 42]) {
      expect(parseParticipantName(blank as unknown).ok).toBe(false)
    }
  })

  it('rejects an email address with an explanation, not a silent strip', () => {
    // The commonest way a minimised field stops being minimised.
    const result = parseParticipantName('jamie@example.com')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/not an email/i)
  })

  it('rejects an @ anywhere, not just a whole address', () => {
    expect(parseParticipantName('jamie@').ok).toBe(false)
    expect(parseParticipantName('@jamie').ok).toBe(false)
  })

  it('rejects a name longer than the database allows', () => {
    expect(parseParticipantName('J'.repeat(MAX_PARTICIPANT_NAME)).ok).toBe(true)
    expect(parseParticipantName('J'.repeat(MAX_PARTICIPANT_NAME + 1)).ok).toBe(false)
  })

  it('counts length AFTER collapsing, so padding does not fail a short name', () => {
    expect(parseParticipantName('  ' + 'J'.repeat(MAX_PARTICIPANT_NAME) + '  ').ok).toBe(true)
  })

  it('rejects control characters', () => {
    expect(parseParticipantName('Jamie').ok).toBe(false)
  })

  it('agrees with the database CHECK on everything it accepts', () => {
    // The actual coupling, asserted rather than assumed.
    const dbAccepts = (v: string) => v.length >= 1 && v.length <= 24 && !v.includes('@')
    for (const candidate of ['Jamie', 'Jamie B', 'Zoë', "O'Neill", 'J'.repeat(24)]) {
      const result = parseParticipantName(candidate)
      expect(result.ok).toBe(true)
      if (result.ok) expect(dbAccepts(result.value)).toBe(true)
    }
  })
})
