import { describe, it, expect } from 'vitest'
import { computeClassAnalytics, type MasteryAttemptRow } from './teacherAnalytics'

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
    expect(alice.masteredSkills).toBe(1)
    expect(alice.overallMastery).toBe(100)
    expect(alice.topicMastery['Number']).toBe(100)
    expect(bob.masteredSkills).toBe(0)
    expect(bob.overallMastery).toBe(0)
    // no status descriptor exists on the result
    expect((alice as Record<string, unknown>).status).toBeUndefined()
    // Cara has no data
    expect(res.students.find(s => s.studentId === 'c')!.overallMastery).toBeNull()
    // class avg = mean of the two with data (100, 0) = 50
    expect(res.avgMastery).toBe(50)
    expect(res.studentsWithData).toBe(2)
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
