'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, requireTeacher } from '../../../../lib/auth'
import { getTutorStudents } from '../../../../lib/tutorStudents'
import { type StudentAnalytics } from '../../../../lib/teacherAnalytics'
import StudentDetailBody from '../../../../components/StudentDetailBody'
import {
  colors, font, card, secondaryButton, pageContainer, pageTitle,
} from '../../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// One student, as a page rather than a modal (docs/audit/26 §4.3).
//
// Same content as the roster modal, via the shared StudentDetailBody, but
// reachable directly and linkable — which a modal buried behind a class roster
// is not. For a tutor this is the screen they actually live on.
//
// ── Two things are deliberately absent, and both are honest ────────────────
//
// NO READINESS. The mini-exam panel is scoped by class — get_class_exam_paper
// takes a _class_id, because the teacher route is gated by class rather than by
// session alone — and this page is deliberately cross-class. Picking one of the
// student's classes to scope it to would be arbitrary, and would silently show
// a different set of papers depending on which one was chosen. The roster modal
// still shows it, where the class is known.
//
// NO COVERAGE SCOPING. The percentages are of the whole course, matching the
// list this page is reached from; §5 of the design has the reasoning.
// ─────────────────────────────────────────────────────────────────────────────

export default function TutorStudentPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const studentId = params?.id

  const [student, setStudent] = useState<StudentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      try {
        // Fetched through the same teacher-scoped call as the list, so a student
        // this teacher may not see is simply not in the result — the
        // authorisation lives in the RPC and the roster route, not here.
        const all = await getTutorStudents()
        setStudent(all.find(s => s.studentId === studentId) ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load this student.')
      } finally {
        setLoading(false)
      }
    })
    // `router` is stable in the App Router, so this still runs once per
    // studentId. See the note on the list page.
  }, [studentId, router])

  return (
    <div style={pageContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={pageTitle}>
          {student ? student.displayName : 'Student'}
          {student?.yearGroup && (
            <span style={{ fontSize: font.md, color: colors.textHint, fontWeight: 400 }}> · {student.yearGroup}</span>
          )}
        </h1>
        <Link href="/dashboard/students" style={{ ...secondaryButton, width: 'auto', textDecoration: 'none' }}>
          ← All students
        </Link>
      </div>

      {loading && <p style={{ color: colors.textHint }}>Loading…</p>}
      {error && <p style={{ color: colors.dangerText }}>{error}</p>}

      {/* Not found and not permitted are the same answer on purpose: a teacher
          who does not teach this student should not be able to tell whether the
          id exists, the same reasoning as the 404 in the class routes. */}
      {!loading && !error && !student && (
        <div style={card}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
            No such student in your classes.
          </p>
        </div>
      )}

      {!loading && !error && student && (
        <div style={card}>
          <StudentDetailBody s={student} />
        </div>
      )}
    </div>
  )
}
