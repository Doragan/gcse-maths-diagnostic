'use client'

/**
 * A teacher reading one of their students' mini-exam scripts.
 *
 * Deliberately the SAME screen the student sees, from the same rebuild: the
 * stored row holds only the parameter draw and the raw answers, so the paper is
 * re-rendered and re-graded here by the pure functions the live runner used.
 * Teacher and student therefore cannot disagree about what happened.
 *
 * WHY A TEACHER MAY SEE THIS AT ALL. The mastery RPC deliberately withholds the
 * practice transcript — private study is not the teacher's business. An exam is
 * not private study; it is assessment, and reading the script is what marking
 * is (user decision, 2026-08-01). So this route exists, gated on the caller
 * owning the class and the student being an active member of it, enforced in
 * the database by get_class_exam_paper rather than here.
 *
 * The score shown is the STORED one, never the re-graded total, exactly as on
 * the student's own review: a later grader fix changes what the review explains
 * but must never move a recorded mark.
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../../../lib/supabase'
import { getSession, requireTeacher } from '../../../../../../lib/auth'
import { getClassMembers } from '../../../../../../lib/classes'
import { QUESTION_COLUMNS, type QuestionRow, type Tier } from '../../../../../../lib/exam/examPaper'
import { rehydratePaper, parsePaperSnapshot, type RehydratedPaper } from '../../../../../../lib/exam/examSession'
import type { CalculatorMode } from '../../../../../../lib/exam/assembler'
import ExamReview, { BackToDashboard } from '../../../../../../components/exam/ExamReview'
import { colors, font, primaryButton } from '../../../../../../lib/styles'

const pageStyle: React.CSSProperties = {
  maxWidth: 640, margin: '0 auto', padding: '24px 20px 64px',
  display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100dvh',
}

type PaperRow = {
  id: string
  student_id: string
  created_at: string
  tier: Tier
  calculator: CalculatorMode
  marks_earned: number
  marks_total: number
  paper: unknown
}

export default function TeacherExamPaperPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.id as string
  const sessionId = params.sessionId as string

  const [state, setState] = useState<'loading' | 'ready' | 'notfound' | 'unreadable'>('loading')
  const [row, setRow] = useState<PaperRow | null>(null)
  const [paper, setPaper] = useState<RehydratedPaper | null>(null)
  const [studentName, setStudentName] = useState<string | null>(null)

  const backToClass = () => router.push(`/dashboard/classes/${classId}`)

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }

      // The RPC is the gate: it returns nothing unless the caller owns this
      // class AND the paper's student is an active member of it. A wrong or
      // someone else's id simply yields no row, so there is no separate
      // ownership check to keep in step here.
      const { data, error } = await supabase.rpc('get_class_exam_paper', {
        _class_id: classId,
        _session_id: sessionId,
      })
      const found = (data as PaperRow[] | null)?.[0]
      if (error || !found) { setState('notfound'); return }
      setRow(found)

      // A name for the header — the roster already carries it, and the RPC
      // deliberately returns ids only.
      try {
        const members = await getClassMembers(classId)
        setStudentName(members.find(m => m.student_id === found.student_id)?.display_name ?? null)
      } catch { /* a missing name is cosmetic; the paper still renders */ }

      const snapshot = parsePaperSnapshot(found.paper)
      if (!snapshot) { setState('unreadable'); return }

      const { data: qs } = await supabase
        .from('questions')
        .select(QUESTION_COLUMNS)
        .in('id', snapshot.questions.map(q => q.id))

      const byId = new Map<string, QuestionRow>(((qs ?? []) as QuestionRow[]).map(q => [q.id, q]))
      setPaper(rehydratePaper(snapshot, byId))
      setState('ready')
    })()
  }, [classId, sessionId])

  if (state === 'loading') {
    return <main style={pageStyle}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  if (state === 'notfound') {
    return (
      <main style={pageStyle}>
        <BackToDashboard onClick={backToClass} label="← Back to class" />
        <h1 style={{ fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }}>Paper not available</h1>
        <p style={{ color: colors.textSecondary, margin: 0 }}>
          This paper doesn&apos;t exist, or it wasn&apos;t sat by a current member of this class.
        </p>
        <button onClick={backToClass} style={{ ...primaryButton }}>Back to class</button>
      </main>
    )
  }

  // The row exists but its snapshot can't be read — still show the score, which
  // lives in its own columns and does not depend on the snapshot.
  if (state === 'unreadable' || !paper || !row) {
    const pct = row && row.marks_total > 0 ? Math.round((row.marks_earned / row.marks_total) * 100) : 0
    return (
      <main style={pageStyle}>
        <BackToDashboard onClick={backToClass} label="← Back to class" />
        <h1 style={{ fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }}>Exam review</h1>
        <p style={{ color: colors.textSecondary, margin: 0 }}>
          {studentName ?? 'This student'} scored <strong>{row?.marks_earned} / {row?.marks_total}</strong> ({pct}%).
          The questions from this paper can&apos;t be shown.
        </p>
        <button onClick={backToClass} style={{ ...primaryButton }}>Back to class</button>
      </main>
    )
  }

  const missing = paper.missingQuestionIds.length
  const sat = new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main style={pageStyle}>
      <BackToDashboard onClick={backToClass} label="← Back to class" />
      <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
        {studentName ? <><strong style={{ color: colors.textSecondary }}>{studentName}</strong> · </> : null}
        sat on {sat}
      </p>
      <ExamReview
        items={paper.items}
        results={paper.results}
        answers={paper.answers}
        // The STORED score, so a teacher and the student's own history can never
        // disagree. The band around it is re-derived — it estimates marks nobody
        // saw, so it SHOULD improve as the estimate does.
        score={{ earned: row.marks_earned, total: row.marks_total, unknown: paper.unknown }}
        tier={row.tier}
        mode={row.calculator}
        timing={paper.meta}
        heading={studentName ? `${studentName}'s paper` : 'Exam review'}
        // No priorAttempts: the progress card compares a student's map before
        // and after, which is their own history and not what a teacher opened
        // this screen to see. The class view already carries their standing.
        notice={missing > 0
          ? `${missing} question${missing === 1 ? '' : 's'} from this paper ${missing === 1 ? 'is' : 'are'} no longer available, so ${missing === 1 ? 'it is' : 'they are'} not shown below. The score is unchanged.`
          : undefined}
        footer={
          <button onClick={backToClass} style={{ ...primaryButton }}>Back to class</button>
        }
      />
    </main>
  )
}
