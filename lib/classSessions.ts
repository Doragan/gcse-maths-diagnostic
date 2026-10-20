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

// ── What the pupil's browser remembers ───────────────────────────────────────
//
// sessionStorage, not localStorage: a session is one lesson, and on a shared
// classroom machine the next pupil to open the browser must not inherit the
// last one's identity. Closing the tab ends it, which is the right lifetime.
//
// The participant id is held here because it is the only thing identifying the
// pupil — there is no account to look it up from. Keeping it also stops a pupil
// who reloads mid-lesson from joining twice and appearing as two rows on the
// teacher's screen, which is the main way this roster gets messy.

export const SESSION_KEYS = {
  sessionId:     'class_session_id',
  participantId: 'class_session_participant',
  name:          'class_session_name',
  title:         'class_session_title',
  target:        'class_session_target',
  /**
   * Questions answered IN THIS SESSION — one per question, never per part.
   *
   * Its own key rather than reusing the practice counter (`session_total`),
   * which counts every part separately: a pupil working through three-part
   * questions would read "5 of 5 answered" while the teacher's screen showed
   * two. The number a pupil sees has to be the number the teacher sees, so
   * this is bumped in exactly the places a session_attempts row is written.
   */
  answered:      'class_session_answered',
} as const

export type JoinedSession = {
  sessionId: string
  participantId: string
  name: string
  title: string
  target: number | null
}

/** What this browser has joined, or null. Safe to call during SSR. */
export function readJoinedSession(): JoinedSession | null {
  if (typeof window === 'undefined') return null
  try {
    const sessionId     = sessionStorage.getItem(SESSION_KEYS.sessionId)
    const participantId = sessionStorage.getItem(SESSION_KEYS.participantId)
    if (!sessionId || !participantId) return null
    const rawTarget = sessionStorage.getItem(SESSION_KEYS.target)
    const target    = rawTarget === null ? null : Number(rawTarget)
    return {
      sessionId,
      participantId,
      name:   sessionStorage.getItem(SESSION_KEYS.name)  ?? '',
      title:  sessionStorage.getItem(SESSION_KEYS.title) ?? '',
      target: Number.isFinite(target) ? target : null,
    }
  } catch {
    // Private browsing, or storage disabled. Treated as "not joined": the
    // pupil can still join again, which is better than a blank screen.
    return null
  }
}

export function writeJoinedSession(joined: JoinedSession): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEYS.sessionId,     joined.sessionId)
    sessionStorage.setItem(SESSION_KEYS.participantId, joined.participantId)
    sessionStorage.setItem(SESSION_KEYS.name,          joined.name)
    sessionStorage.setItem(SESSION_KEYS.title,         joined.title)
    if (joined.target !== null) {
      sessionStorage.setItem(SESSION_KEYS.target, String(joined.target))
    }
  } catch { /* best-effort — losing this costs a re-join, not the work */ }
}

/** How many questions this pupil has answered in the session. */
export function readSessionAnswered(): number {
  if (typeof window === 'undefined') return 0
  try {
    const n = Number(sessionStorage.getItem(SESSION_KEYS.answered))
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

/** Counts one more answered question. Call it where an attempt row is written. */
export function bumpSessionAnswered(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_KEYS.answered, String(readSessionAnswered() + 1))
  } catch { /* best-effort: the count is a display, the row is the record */ }
}

export function clearJoinedSession(): void {
  if (typeof window === 'undefined') return
  try {
    for (const key of Object.values(SESSION_KEYS)) sessionStorage.removeItem(key)
  } catch { /* nothing to do */ }
}

// ── The pupil's name ─────────────────────────────────────────────────────────

/**
 * Longest a participant name may be. Mirrors the CHECK on
 * session_participants.display_name.
 */
export const MAX_PARTICIPANT_NAME = 24

export type ParticipantNameResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

/**
 * Clean and check the name a pupil types to join a session.
 *
 * Shaped after parseDisplayName in lib/invitations.ts, but the rules are
 * deliberately different: that one is a teacher naming themselves for an email,
 * where blank is a legitimate choice and 60 characters is reasonable. This is a
 * child typing in a lesson, so:
 *
 * - **Blank is invalid.** The teacher has to be able to tell rows apart.
 * - **24 characters.** Enough for "Jamie B", not enough for a full name plus a
 *   school. The field asks for a first name and says so; this is what stops it
 *   quietly becoming a full-name field.
 * - **No `@`.** A child typing their email address into a name box is the
 *   commonest way a minimised field stops being minimised, and the point of
 *   this design is that we never hold a pupil's email. Rejected with an
 *   explanation rather than stripped, so they can see what to type instead.
 *
 * ⚠ These limits MATCH THE DATABASE (20261020_class_sessions.sql): length
 * between 1 and 24, and `display_name not like '%@%'`. Loosen one without the
 * other and a pupil gets a rejection they cannot read, mid-lesson.
 */
export function parseParticipantName(raw: unknown): ParticipantNameResult {
  if (typeof raw !== 'string') return { ok: false, error: 'Enter your first name' }

  // Collapse internal runs of whitespace as well as trimming: a double space
  // should not make one pupil look like two on the teacher's screen. \s also
  // covers the newlines a paste can carry in.
  const value = raw.replace(/\s+/g, ' ').trim()

  if (value === '') return { ok: false, error: 'Enter your first name' }
  if (value.includes('@')) {
    return { ok: false, error: 'Just your first name — not an email address' }
  }
  if (value.length > MAX_PARTICIPANT_NAME) {
    return { ok: false, error: `Please use ${MAX_PARTICIPANT_NAME} characters or fewer — a first name is enough` }
  }
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    return { ok: false, error: 'That name contains characters that are not allowed' }
  }
  return { ok: true, value }
}
