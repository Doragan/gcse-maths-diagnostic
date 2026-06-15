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
  it('marks members with no attempts as hasData=false and zero counts', () => {
    const res = computeClassAnalytics([], members)
    expect(res.studentCount).toBe(3)
    expect(res.studentsWithData).toBe(0)
    expect(res.students.every(s => s.hasData === false)).toBe(true)
    expect(res.students.every(s => s.mastered === 0 && s.needsPractice === 0)).toBe(true)
    expect(res.topics).toEqual({})
    expect(res.gaps).toEqual([])
  })

  it('counts mastered / needs-practice per student and per topic (no percentages)', () => {
    // Alice mastered simple_arithmetic (5/5); Bob needs practice (1/5)
    const rows = [
      ...attempts('a', 'simple_arithmetic', 5, 5),
      ...attempts('b', 'simple_arithmetic', 5, 1),
    ]
    const res = computeClassAnalytics(rows, members)
    const alice = res.students.find(s => s.studentId === 'a')!
    const bob = res.students.find(s => s.studentId === 'b')!
    expect(alice.hasData).toBe(true)
    expect(alice.mastered).toBe(1)
    expect(alice.needsPractice).toBe(0)
    expect(alice.topics['Number']).toEqual({ mastered: 1, needsPractice: 0, inProgress: 0 })
    expect(bob.mastered).toBe(0)
    expect(bob.needsPractice).toBe(1)
    expect(bob.topics['Number']).toEqual({ mastered: 0, needsPractice: 1, inProgress: 0 })
    // Cara has no data
    expect(res.students.find(s => s.studentId === 'c')!.hasData).toBe(false)
    expect(res.studentsWithData).toBe(2)
    // class-wide topic counts (summed): 1 mastered + 1 needs-practice in Number
    expect(res.topics['Number']).toEqual({ mastered: 1, needsPractice: 1, inProgress: 0 })
    // no overall percentage or status descriptor exists on the result
    expect((res as Record<string, unknown>).avgMastery).toBeUndefined()
    expect((alice as Record<string, unknown>).status).toBeUndefined()
  })

  it('flags a common gap when ≥2 members (and ≥half with data) are weak on a skill', () => {
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
      ...attempts('b', 'simple_arithmetic', 5, 1),
    ]
    const res = computeClassAnalytics(rows, members)
    expect(res.gaps).toEqual([])
  })

  it('treats in_progress (<5 attempts) as neither mastered nor weak', () => {
    const rows = attempts('a', 'simple_arithmetic', 3, 3)
    const res = computeClassAnalytics(rows, members)
    const alice = res.students.find(s => s.studentId === 'a')!
    expect(alice.hasData).toBe(true)
    expect(alice.mastered).toBe(0)
    expect(alice.inProgress).toBe(1)
    expect(alice.topics['Number']).toEqual({ mastered: 0, needsPractice: 0, inProgress: 1 })
    expect(res.gaps).toEqual([])
  })
})
