import { getSession } from '../auth'
import type { ItemMarks } from './sittingMarks'

// Client helper for POST /api/papers/sittings, mirroring getClassMembers in
// lib/classes.ts: the write is a cross-account one (a teacher creating rows
// attributed to students), so it goes through the server route under the
// service role rather than direct from the browser — practice_attempts has no
// teacher INSERT policy and deliberately should not gain one.

export type SittingSubmission = {
  studentId: string
  /** Set to correct an existing sitting in place; omit to create a new one. */
  sittingId?: string
  marks: ItemMarks
}

export type RecordedSitting = {
  studentId: string
  sittingId: string
  marksEarned: number
}

/** An already-recorded sitting, as GET returns it. */
export type ExistingSitting = {
  id: string
  student_id: string
  source_paper: string
  sat_on: string | null
  created_at: string
  updated_at: string
  marks: ItemMarks
  marks_earned: number
  marks_total: number
}

/**
 * What has already been recorded for this class and paper.
 *
 * Called before the teacher can submit, so an existing sitting becomes a choice
 * — correct it, or deliberately add a resit — rather than a silent duplicate.
 * Duplicates are not merely untidy: the mastery engine's fast-track marks a
 * skill secure at three correct attempts, so the same right answer submitted
 * three times reads as mastery.
 */
export async function listSittings(
  classId: string,
  sourcePaper?: string,
): Promise<ExistingSitting[]> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const qs = new URLSearchParams({ classId })
  if (sourcePaper) qs.set('sourcePaper', sourcePaper)

  const res = await fetch(`/api/papers/sittings?${qs}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error ?? `Failed to load sittings (HTTP ${res.status})`)
  return (json?.sittings ?? []) as ExistingSitting[]
}

/**
 * Remove a sitting recorded by mistake. Its derived attempts cascade away with
 * it, so the student's skill map returns to exactly what it was before.
 */
export async function deleteSitting(classId: string, sittingId: string): Promise<void> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const qs = new URLSearchParams({ id: sittingId, classId })
  const res = await fetch(`/api/papers/sittings?${qs}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.error ?? `Failed to delete sitting (HTTP ${res.status})`)
  }
}

export async function recordSitting(input: {
  sourcePaper: string
  classId: string
  /** YYYY-MM-DD, when the class actually sat it — not when it was typed in. */
  satOn?: string | null
  students: SittingSubmission[]
}): Promise<{ sittings: RecordedSitting[]; marksTotal: number }> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch('/api/papers/sittings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(input),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error ?? `Failed to record marks (HTTP ${res.status})`)
  }
  return json as { sittings: RecordedSitting[]; marksTotal: number }
}
