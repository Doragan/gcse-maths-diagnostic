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
