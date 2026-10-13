import { supabase } from './supabase'
import { getSession } from './auth'
import {
  computeClassAnalytics, type StudentAnalytics, type MasteryAttemptRow,
} from './teacherAnalytics'
import type { TutorStudentRow } from '../app/api/students/route'

/**
 * The tutor's students, across every class they own.
 *
 * Design: docs/audit/26-one-to-one-tutor-dashboard.md §4.2.
 *
 * ── Why this reuses computeClassAnalytics rather than summarising itself ────
 *
 * Mastery has ONE definition (masteryStatusFor, via calculateMastery) and this
 * list must not become a second one. A tutor who sees 62% here and 71% on the
 * class page would be right to distrust both, and the bug would be invisible
 * until someone compared them. So the same function that builds the class page
 * builds this, and the only difference is what is passed in.
 *
 * ── Why the coverage argument is deliberately EMPTY ────────────────────────
 *
 * This is the decision in §5 of the design, and it is load-bearing rather than
 * an omission.
 *
 * Coverage is keyed (class_id, skill_id) and sets the mastery denominator. A
 * student can belong to more than one of a teacher's classes, so there can be
 * two different taught-lists for one person and therefore two different
 * percentages — and a flat list showing one number per student has no
 * principled way to choose between them.
 *
 * Passing no coverage makes every percentage here "% of the whole GCSE", which
 * needs no choice, is comparable across every student whatever classes they are
 * in, and means the same thing for all of them. The scoped figure — "% of what
 * I have taught you" — stays on the class page, where the class is known and
 * the number is well defined.
 *
 * The alternative considered and rejected was moving coverage onto the student,
 * which breaks four things for real multi-student classes; §5 has the detail.
 *
 * ⚠ So THE PERCENTAGES HERE ARE NOT THE ONES ON THE CLASS PAGE, by design, and
 * the UI has to say so. A tutor who has marked coverage will see a lower number
 * here than there, and silently showing two different figures under the same
 * word would be worse than showing one.
 */
export async function getTutorStudents(): Promise<StudentAnalytics[]> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const [rosterRes, rpc] = await Promise.all([
    fetch('/api/students', { headers: { Authorization: `Bearer ${session.access_token}` } }),
    supabase.rpc('get_teacher_student_mastery'),
  ])

  const json = await rosterRes.json().catch(() => null)
  if (!rosterRes.ok) {
    throw new Error(json?.error ?? `Failed to load students (HTTP ${rosterRes.status})`)
  }
  if (rpc.error) throw rpc.error

  const roster = (json?.students ?? []) as TutorStudentRow[]
  const rows = (rpc.data ?? []) as MasteryAttemptRow[]

  // `members` is what computeClassAnalytics keys on, so a student missing from
  // the roster is simply absent from the result — which is correct: the roster
  // is the authorisation boundary, and an attempt row without a matching member
  // belongs to somebody this teacher may not see.
  const analytics = computeClassAnalytics(
    rows,
    roster.map(r => ({
      student_id: r.student_id,
      display_name: r.display_name,
      year_group: r.year_group,
    })),
    new Date(),
    [], // see above — unscoped, deliberately
  )

  return analytics.students
}

/** Roster-only, for the parts of the page that do not need the mastery maths. */
export async function getTutorRoster(): Promise<TutorStudentRow[]> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch('/api/students', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error ?? `Failed to load students (HTTP ${res.status})`)
  return (json?.students ?? []) as TutorStudentRow[]
}
