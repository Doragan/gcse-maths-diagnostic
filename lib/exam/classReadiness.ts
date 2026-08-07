/**
 * Exam readiness for a class — the marks currency, per student.
 *
 * The teacher dashboard has only ever shown MASTERY ("which topics has this
 * class built"). This is the other half: "how would they score on a paper".
 * The two answer different questions and neither substitutes for the other —
 * mastery says what a student can do, marks say how they would perform under
 * exam conditions on a representative paper.
 *
 * Three rules inherited from decisions already taken elsewhere, recorded here
 * because they are easy to undo by accident:
 *
 *  1. NO qualitative descriptor. The class dashboard shows percentages and no
 *     status word, because a low figure usually means "not taught yet" and a
 *     label brands a student who is doing fine. The temptation is stronger for
 *     a mark, which feels like a grade — so the rule matters more here, not
 *     less. Numbers only.
 *  2. NOT scoped to covered material, unlike mastery. A mini-exam is a
 *     deliberately representative whole-curriculum paper; scoping the score
 *     would make it incomparable between students AND between papers.
 *  3. The PINNED score, never the re-derived method-mark band. Re-deriving a
 *     band needs every question rehydrated and re-graded — far too heavy for a
 *     class list — and the pinned figure has the further virtue of being
 *     exactly the number the student sees.
 *
 * Pure: rows in, summary out. No React, no Supabase.
 */

import { buildScoreTrend, type ExamSessionSummary, type ScoreTrend } from './scoreTrend'

/** One stored paper, as the teacher-facing RPC returns it. */
export type ClassExamSession = ExamSessionSummary & { student_id: string }

export type StudentReadiness = {
  studentId: string
  papersSat: number
  /** Most recent paper's score as a percentage; null until they sit one. */
  latest: number | null
  best: number | null
  /** Mean across every paper this student has sat. */
  average: number | null
  /** ISO timestamp of the most recent paper. */
  lastSat: string | null
  /** Null until there are two distinct points — see buildScoreTrend. */
  trend: ScoreTrend | null
  /** Newest first, for the per-student paper list. */
  papers: ClassExamSession[]
}

export type ClassReadiness = {
  byStudent: Record<string, StudentReadiness>
  /** How many members have sat at least one paper. */
  studentsWithPapers: number
  papersTotal: number
  /**
   * Mean of each student's OWN average, not of all papers.
   *
   * Averaging papers would weight whoever sits the most, so one keen student
   * could carry the class figure. Every student counts once.
   */
  classAverage: number | null
}

const pct = (s: ExamSessionSummary): number | null => {
  const total = Number(s.marks_total)
  const earned = Number(s.marks_earned)
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(earned)) return null
  return Math.round((earned / total) * 100)
}

const mean = (xs: number[]): number | null =>
  xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null

/**
 * Summarise every class member's exam history.
 *
 * `memberIds` drives the output rather than the sessions do, so a student who
 * has sat nothing still appears — with zeroes and nulls, which the UI needs in
 * order to say "not yet" rather than silently omitting them from the roster.
 */
export function computeClassReadiness(
  sessions: ClassExamSession[],
  memberIds: string[],
): ClassReadiness {
  const byMember = new Map<string, ClassExamSession[]>()
  for (const id of memberIds) byMember.set(id, [])
  for (const s of sessions) {
    // Ignore rows for anyone not currently an active member — the RPC already
    // filters, but a stale roster in the caller must not invent a student.
    const list = byMember.get(s.student_id)
    if (list) list.push(s)
  }

  const byStudent: Record<string, StudentReadiness> = {}
  const perStudentAverages: number[] = []
  let papersTotal = 0
  let studentsWithPapers = 0

  for (const [studentId, raw] of byMember) {
    // Newest first — the order the paper list renders in and `latest` reads from.
    const papers = [...raw].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    const scores = papers.map(pct).filter((p): p is number => p !== null)
    papersTotal += papers.length
    if (papers.length > 0) studentsWithPapers++

    const average = mean(scores)
    if (average !== null) perStudentAverages.push(average)

    byStudent[studentId] = {
      studentId,
      papersSat: papers.length,
      latest: scores.length ? scores[0] : null,
      best: scores.length ? Math.max(...scores) : null,
      average,
      lastSat: papers.length ? papers[0].created_at : null,
      // The SAME builder the student's own trend uses, so the teacher and the
      // student are looking at one chart, not two implementations of one.
      trend: buildScoreTrend(papers),
      papers,
    }
  }

  return {
    byStudent,
    studentsWithPapers,
    papersTotal,
    classAverage: mean(perStudentAverages),
  }
}

/**
 * Fetch and summarise a class's exam readiness.
 *
 * Degrades to "nobody has sat anything" when the RPC is missing or refuses —
 * the same graceful pattern getClassCoverage uses — so the teacher dashboard
 * renders normally BEFORE the migration is applied, and for a caller who does
 * not own the class. An empty readiness panel is a fine outcome; a dashboard
 * that throws is not.
 */
export async function getClassReadiness(
  classId: string,
  memberIds: string[],
): Promise<ClassReadiness> {
  const { supabase } = await import('../supabase')
  const { data, error } = await supabase.rpc('get_class_exam_sessions', { _class_id: classId })
  if (error) return computeClassReadiness([], memberIds)
  return computeClassReadiness((data ?? []) as ClassExamSession[], memberIds)
}
