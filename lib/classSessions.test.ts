import { describe, it, expect } from 'vitest'
import { sessionLifecycle } from './classSessions'

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
