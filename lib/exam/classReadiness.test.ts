import { describe, it, expect } from 'vitest'
import { computeClassReadiness, type ClassExamSession } from './classReadiness'

let n = 0
const paper = (
  studentId: string,
  earned: number,
  at: string,
  over: Partial<ClassExamSession> = {},
): ClassExamSession => ({
  id: `s${n++}`,
  student_id: studentId,
  created_at: new Date(at).toISOString(),
  tier: 'foundation',
  calculator: 'non_calc',
  marks_earned: earned,
  marks_total: 25,
  ...over,
})

describe('a roster, not a list of the active', () => {
  it('includes members who have sat nothing', () => {
    // The teacher's roster must stay whole: a student with no papers needs a
    // row saying so, not to vanish from the class.
    const r = computeClassReadiness([], ['alice', 'bob'])
    expect(Object.keys(r.byStudent).sort()).toEqual(['alice', 'bob'])
    expect(r.byStudent.alice.papersSat).toBe(0)
    expect(r.byStudent.alice.latest).toBeNull()
    expect(r.byStudent.alice.trend).toBeNull()
    expect(r.studentsWithPapers).toBe(0)
  })

  it('ignores sessions for anyone not on the roster', () => {
    // The RPC filters to active members, but a stale roster in the caller must
    // never invent a student who has left.
    const r = computeClassReadiness([paper('ghost', 20, '2026-05-01')], ['alice'])
    expect(Object.keys(r.byStudent)).toEqual(['alice'])
    expect(r.papersTotal).toBe(0)
  })
})

describe('per-student figures', () => {
  const sessions = [
    paper('alice', 10, '2026-05-01'),  // 40%
    paper('alice', 20, '2026-06-01'),  // 80%
    paper('alice', 15, '2026-07-01'),  // 60%
  ]

  it('reads latest from the most RECENT paper, whatever order rows arrive in', () => {
    const shuffled = [sessions[2], sessions[0], sessions[1]]
    const r = computeClassReadiness(shuffled, ['alice'])
    expect(r.byStudent.alice.latest).toBe(60)
    expect(r.byStudent.alice.lastSat).toBe(sessions[2].created_at)
  })

  it('reports best and average across every paper', () => {
    const r = computeClassReadiness(sessions, ['alice'])
    expect(r.byStudent.alice.best).toBe(80)
    expect(r.byStudent.alice.average).toBe(60) // (40+80+60)/3
    expect(r.byStudent.alice.papersSat).toBe(3)
  })

  it('lists papers newest first', () => {
    const r = computeClassReadiness(sessions, ['alice'])
    const dates = r.byStudent.alice.papers.map(p => p.created_at)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('builds the SAME trend the student sees', () => {
    const r = computeClassReadiness(sessions, ['alice'])
    expect(r.byStudent.alice.trend).not.toBeNull()
    expect(r.byStudent.alice.trend!.papers).toBe(3)
  })

  it('has no trend from a single paper — one point has no direction', () => {
    const r = computeClassReadiness([sessions[0]], ['alice'])
    expect(r.byStudent.alice.trend).toBeNull()
    expect(r.byStudent.alice.latest).toBe(40)
  })
})

describe('the class figure', () => {
  it('averages STUDENTS, not papers', () => {
    // Averaging papers would let one keen student carry the class. Alice sits
    // four weak papers, Bob one strong one; they count equally.
    const sessions = [
      paper('alice', 10, '2026-05-01'), paper('alice', 10, '2026-05-02'),
      paper('alice', 10, '2026-05-03'), paper('alice', 10, '2026-05-04'),
      paper('bob', 20, '2026-05-01'),
    ]
    const r = computeClassReadiness(sessions, ['alice', 'bob'])
    expect(r.byStudent.alice.average).toBe(40)
    expect(r.byStudent.bob.average).toBe(80)
    expect(r.classAverage).toBe(60)        // (40 + 80) / 2, not weighted 4:1
    expect(r.papersTotal).toBe(5)
    expect(r.studentsWithPapers).toBe(2)
  })

  it('excludes students with no papers from the class average', () => {
    const r = computeClassReadiness([paper('alice', 20, '2026-05-01')], ['alice', 'bob'])
    expect(r.classAverage).toBe(80)        // bob does not drag it to 40
    expect(r.studentsWithPapers).toBe(1)
  })

  it('is null for a class that has sat nothing', () => {
    expect(computeClassReadiness([], ['alice']).classAverage).toBeNull()
  })
})

describe('bad rows never poison a figure', () => {
  it('skips a zero-total paper rather than dividing by zero', () => {
    const r = computeClassReadiness([
      paper('alice', 20, '2026-05-01'),
      paper('alice', 5, '2026-06-01', { marks_total: 0 }),
    ], ['alice'])
    expect(r.byStudent.alice.average).toBe(80)
    // The paper still counts as sat — it happened, we just cannot score it.
    expect(r.byStudent.alice.papersSat).toBe(2)
  })

  it('handles fractional marks from grid questions', () => {
    const r = computeClassReadiness([paper('alice', 12.5, '2026-05-01')], ['alice'])
    expect(r.byStudent.alice.latest).toBe(50)
  })

  it('carries mixed tiers through to the trend rather than averaging them away', () => {
    const r = computeClassReadiness([
      paper('alice', 20, '2026-05-01', { tier: 'foundation' }),
      paper('alice', 10, '2026-06-01', { tier: 'higher' }),
    ], ['alice'])
    expect(r.byStudent.alice.trend!.mixedTiers).toBe(true)
  })
})
