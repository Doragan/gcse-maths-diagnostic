import { supabase } from './supabase'
import { getSession } from './auth'
import type { ClassSession } from './classSessions'
import type { ProgressRow, ResultsHead } from './liveProgress'
import type { SessionInsights } from './sessionInsights'

// ─────────────────────────────────────────────────────────────────────────────
// Reading and writing class sessions.
//
// Split from lib/classSessions.ts, which holds the types and the lifecycle
// rule: that module is imported by a test, and anything importing ./supabase
// constructs a client at module load, which has no env to read under vitest.
// Same division as lib/invitations.ts — pure logic tested, data access not.
//
// Creating and closing go through API routes because INSERT and UPDATE on
// class_sessions are REVOKE'd from client roles. READING is a direct query:
// cs_teacher_select scopes it to the teacher's own rows, and it is the one
// client SELECT this whole feature allows.
// ─────────────────────────────────────────────────────────────────────────────

/** Sessions this teacher owns, newest first. RLS does the scoping. */
export async function getMyClassSessions(limit = 20): Promise<ClassSession[]> {
  const { data, error } = await supabase
    .from('class_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('Failed to load class sessions:', error.message)
    return []
  }
  return (data ?? []) as ClassSession[]
}

/** One session by id. Returns null when it is not the caller's. */
export async function getClassSession(id: string): Promise<ClassSession | null> {
  const { data, error } = await supabase
    .from('class_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) {
    console.error('Failed to load class session:', error.message)
    return null
  }
  return (data as ClassSession) ?? null
}

/**
 * The live view's rows, and what the class is finding hard.
 *
 * The rows share their type and their aggregation with the assignment view
 * (lib/liveProgress.ts), so one table component renders both. The insights
 * ride on the same response rather than a second endpoint: they are built
 * from the very attempt rows this route already reads, and a separate fetch
 * would double a request the teacher's page makes every time the probe says
 * something changed.
 */
export async function getClassSessionResults(
  id: string,
): Promise<{ rows: ProgressRow[]; insights: SessionInsights }> {
  const empty: SessionInsights = { questions: [], skills: [] }
  const session = await getSession()
  if (!session) return { rows: [], insights: empty }

  const res = await fetch(`/api/class-sessions/${id}/results`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) throw new Error('Could not load session results')
  const body = await res.json()
  return {
    rows:     body.results as ProgressRow[],
    insights: (body.insights as SessionInsights) ?? empty,
  }
}

/** The cheap change probe. Throws, so the polling loop can simply retry. */
export async function getClassSessionResultsHead(id: string): Promise<ResultsHead> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch(`/api/class-sessions/${id}/results/head`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) throw new Error('Could not probe session results')
  return await res.json() as ResultsHead
}

/**
 * What the projector view shows. Deliberately carries NO pupil names — see the
 * route's header for why that is the endpoint's job and not the page's.
 */
export type SessionDisplay = {
  title: string
  code: string
  status: 'open' | 'closed'
  expires_at: string
  joined: number
  answers: number
}

/** Throws, so the display page's poll can simply try again on the next tick. */
export async function getSessionDisplay(id: string): Promise<SessionDisplay> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch(`/api/class-sessions/${id}/display`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) throw new Error('Could not load the session')
  return await res.json() as SessionDisplay
}

type CreateInput = {
  title: string
  skillIds: string[]
  targetCount: number
  courseId: string
}

/** Start a session. The route mints the code. */
export async function createClassSession(
  input: CreateInput,
): Promise<{ session: ClassSession } | { error: string }> {
  const session = await getSession()
  if (!session) return { error: 'Not signed in' }

  const res = await fetch('/api/class-sessions/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      title:        input.title,
      skill_ids:    input.skillIds,
      target_count: input.targetCount,
      course_id:    input.courseId,
    }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) return { error: body?.error ?? 'Could not start the session' }
  return { session: body.session as ClassSession }
}

/**
 * Close a session, so it stops accepting answers.
 *
 * Irreversible by design: there is no reopen. The database gate treats a closed
 * session as immutable (the 20260612 SEC-2b lesson), and a code that can come
 * back to life is a code that can be reused by last lesson's class.
 */
export async function closeClassSession(
  id: string,
): Promise<{ session: ClassSession } | { error: string }> {
  const session = await getSession()
  if (!session) return { error: 'Not signed in' }

  const res = await fetch(`/api/class-sessions/${id}/close`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) return { error: body?.error ?? 'Could not close the session' }
  return { session: body.session as ClassSession }
}
