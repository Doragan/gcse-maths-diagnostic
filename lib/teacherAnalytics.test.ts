import { describe, it, expect } from 'vitest'
import { computeClassAnalytics, computeClassMasteryTimeline, CURRICULUM_TOTAL, TOPIC_TOTAL, type MasteryAttemptRow } from './teacherAnalytics'

// Helper: build N attempts on a skill, `nCorrect` of them correct, recent.
function attempts(studentId: string, skillId: string, n: number, nCorrect: number): MasteryAttemptRow[] {
  return Array.from({ length: n }, (_, i) => ({
    student_id: studentId,
    skill_ids: [skillId],
    correct: i < nCorrect,
    attempted_at: `2026-06-${String(10 + i).padStart(2, '0')}T10:00:00Z`,
    kind: 'mastery' as const,
  }))
}

// Real skills with known topics (from data/skills.ts):
//   simple_arithmetic → Number, solving_linear_equations → Algebra
const members = [
  { student_id: 'a', display_name: 'Alice', year_group: 'Y10' },
  { student_id: 'b', display_name: 'Bob', year_group: null },
  { student_id: 'c', display_name: 'Cara', year_group: 'Y10' },
]

describe('computeClassAnalytics', () => {
  it('marks members with no attempts as no_data and excludes them from averages', () => {
    const res = computeClassAnalytics([], members)
    expect(res.studentCount).toBe(3)
    expect(res.studentsWithData).toBe(0)
    expect(res.avgMastery).toBeNull()
    expect(res.students.every(s => s.overallMastery === null)).toBe(true)
    expect(res.gaps).toEqual([])
  })

  it('computes per-student mastery from the 5-window (4/5 = mastered)', () => {
    // Alice: mastered simple_arithmetic (5/5); Bob: needs_practice (1/5)
    const rows = [
      ...attempts('a', 'simple_arithmetic', 5, 5),
      ...attempts('b', 'simple_arithmetic', 5, 1),
    ]
    const res = computeClassAnalytics(rows, members)
    const alice = res.students.find(s => s.studentId === 'a')!
    const bob = res.students.find(s => s.studentId === 'b')!
    // denominator = whole curriculum / whole topic, not attempted skills
    expect(alice.masteredSkills).toBe(1)
    expect(alice.overallMastery).toBe(Math.round((1 / CURRICULUM_TOTAL) * 100))
    expect(alice.topicMastery['Number']).toBe(Math.round((1 / TOPIC_TOTAL['Number']) * 100))
    expect(alice.topicMastery['Algebra']).toBe(0) // active but nothing mastered in Algebra
    expect(bob.masteredSkills).toBe(0)
    expect(bob.overallMastery).toBe(0)
    // no status descriptor exists on the result
    expect((alice as Record<string, unknown>).status).toBeUndefined()
    // Cara has no data
    expect(res.students.find(s => s.studentId === 'c')!.overallMastery).toBeNull()
    // class avg = mean of the two with data (alice%, 0)
    expect(res.avgMastery).toBe(Math.round((alice.overallMastery! + 0) / 2))
    expect(res.studentsWithData).toBe(2)
  })

  it('exposes per-skill detail and engagement (questions this week, last active)', () => {
    const now = new Date('2026-06-15T12:00:00Z')
    const recent = '2026-06-14T10:00:00Z' // within last 7 days
    const old = '2026-05-01T10:00:00Z'    // older than a week
    const rows: MasteryAttemptRow[] = [
      ...attempts('a', 'simple_arithmetic', 5, 5).map(r => ({ ...r, attempted_at: recent })),
      ...attempts('a', 'solving_linear_equations', 5, 1).map(r => ({ ...r, attempted_at: old })),
    ]
    const res = computeClassAnalytics(rows, members, now)
    const alice = res.students.find(s => s.studentId === 'a')!
    expect(alice.totalQuestions).toBe(10)
    expect(alice.questionsThisWeek).toBe(5)       // only the 5 recent ones
    expect(alice.lastActive).toBe(recent)
    expect(res.questionsThisWeek).toBe(5)          // class-wide
    const sa = alice.skillDetail.find(d => d.skillId === 'simple_arithmetic')!
    expect(sa.status).toBe('mastered')
    expect(sa.topic).toBe('Number')
    expect(alice.skillDetail.find(d => d.skillId === 'solving_linear_equations')!.status).toBe('needs_practice')
    expect(alice.skillDetail[0].status).toBe('mastered') // mastered sorts first
  })

  it('flags a common gap when ≥2 members (and ≥half with data) are weak on a skill', () => {
    // Bob + Cara both needs_practice on solving_linear_equations; Alice mastered it
    const rows = [
      ...attempts('a', 'solving_linear_equations', 5, 5),
      ...attempts('b', 'solving_linear_equations', 5, 1),
      ...attempts('c', 'solving_linear_equations', 5, 2),
    ]
    const res = computeClassAnalytics(rows, members)
    const gap = res.gaps.find(g => g.skillId === 'solving_linear_equations')
    expect(gap).toBeDefined()
    expect(gap!.studentsWeak).toBe(2)
    expect(gap!.studentsWithData).toBe(3)
    expect(gap!.topic).toBe('Algebra')
  })

  it('does not flag a gap when only one member is weak', () => {
    const rows = [
      ...attempts('a', 'simple_arithmetic', 5, 5),
      ...attempts('b', 'simple_arithmetic', 5, 1), // only Bob weak
    ]
    const res = computeClassAnalytics(rows, members)
    expect(res.gaps).toEqual([])
  })

  it('builds a weekly timeline where mastery climbs as skills are mastered over time', () => {
    const now = new Date('2026-06-15T12:00:00Z')
    // Alice masters simple_arithmetic ~5 weeks ago, fractions_of_amounts ~1 week ago.
    const fiveWk = '2026-05-11T10:00:00Z'  // ~5 weeks before now
    const oneWk  = '2026-06-09T10:00:00Z'  // ~1 week before now
    const rows: MasteryAttemptRow[] = [
      ...Array.from({ length: 5 }, () => ({ student_id: 'a', skill_ids: ['simple_arithmetic'], correct: true, attempted_at: fiveWk, kind: 'mastery' as const })),
      ...Array.from({ length: 5 }, () => ({ student_id: 'a', skill_ids: ['fractions_of_amounts'], correct: true, attempted_at: oneWk, kind: 'mastery' as const })),
    ]
    const series = computeClassMasteryTimeline(rows, members, 8, now)
    expect(series).toHaveLength(8)
    // last point = now: 2 skills mastered
    expect(series[7].masteryPct).toBe(Math.round((2 / CURRICULUM_TOTAL) * 100))
    expect(series[7].activeStudents).toBe(1)
    // earliest point (≈7 weeks ago): nothing mastered yet → 0, no active students
    expect(series[0].masteryPct).toBe(0)
    expect(series[0].activeStudents).toBe(0)
    // non-decreasing across the series (this seed never regresses)
    for (let i = 1; i < series.length; i++) {
      expect(series[i].masteryPct).toBeGreaterThanOrEqual(series[i - 1].masteryPct)
    }
  })

  it('treats in_progress (<5 attempts) as neither mastered nor weak', () => {
    const rows = attempts('a', 'simple_arithmetic', 3, 3) // only 3 attempts
    const res = computeClassAnalytics(rows, members)
    const alice = res.students.find(s => s.studentId === 'a')!
    expect(alice.attemptedSkills).toBe(1)
    expect(alice.masteredSkills).toBe(0)        // in_progress, not mastered
    expect(alice.overallMastery).toBe(0)
    expect(res.gaps).toEqual([])                // in_progress is not "weak"
  })
})
