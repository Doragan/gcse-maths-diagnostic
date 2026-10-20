// ─────────────────────────────────────────────────────────────────────────────
// No-login class sessions — the shape of one, and when it is live.
//
// A session is a lesson: the teacher starts one, reads the code out, and pupils
// join with a first name and nothing else. See
// docs/audit/29-no-login-class-session-plan.md for why it exists (a trust that
// takes two months to approve pupil logins) and
// supabase/migrations/20261020_class_sessions.sql for the security posture.
//
// IMPORTS NOTHING, deliberately. Reading and writing live in
// lib/classSessionsApi.ts, because ./supabase constructs a client at module
// load and a module that imports it cannot be unit-tested. Same division as
// lib/invitations.ts.
// ─────────────────────────────────────────────────────────────────────────────

export type ClassSession = {
  id: string
  teacher_id: string
  title: string
  code: string
  skill_ids: string[]
  target_count: number | null
  course_id: string
  status: 'open' | 'closed'
  expires_at: string
  created_at: string
  closed_at: string | null
}

/**
 * Whether a session can still take answers, and if not, why not.
 *
 * ⚠ THIS MUST AGREE WITH THE DATABASE. The attempt insert is gated by
 * session_accepts_attempt(), which requires `status = 'open' AND expires_at >
 * now()`. A UI that showed a code for a session the database will refuse is the
 * worst failure this feature has: thirty pupils type a code, answer questions,
 * and every insert is rejected while the teacher's screen says it is live.
 *
 * So expiry is checked here as well as status, and both surfaces read this one
 * function. Pure and clock-injected so it can be tested at the boundary.
 */
export type SessionLifecycle = 'live' | 'expired' | 'closed'

export function sessionLifecycle(
  session: Pick<ClassSession, 'status' | 'expires_at'>,
  now: number = Date.now(),
): SessionLifecycle {
  if (session.status === 'closed') return 'closed'
  // Closed wins over expired when both are true: the teacher's own act is the
  // more informative thing to report back to them.
  return new Date(session.expires_at).getTime() > now ? 'live' : 'expired'
}
