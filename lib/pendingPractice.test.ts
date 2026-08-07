import { describe, it, expect } from 'vitest'
import { pendingPracticeRows, PENDING_CAP, type PendingAttempt } from './pendingPractice'

const NOW = Date.parse('2026-08-07T12:00:00.000Z')
const STUDENT = 'stu-1'

function entry(over: Partial<PendingAttempt> = {}): PendingAttempt {
  return { question_id: 'q1', skill_ids: ['s1'], correct: true, ...over }
}

const times = (rows: { attempted_at: string }[]) => rows.map(r => r.attempted_at)

describe('pendingPracticeRows', () => {
  it('returns nothing for an empty or non-array store', () => {
    expect(pendingPracticeRows([], STUDENT, NOW)).toEqual([])
    expect(pendingPracticeRows(null, STUDENT, NOW)).toEqual([])
    expect(pendingPracticeRows('corrupt', STUDENT, NOW)).toEqual([])
  })

  it('keeps the time the question was actually answered', () => {
    const at = '2026-08-01T09:30:00.000Z'
    const [row] = pendingPracticeRows([entry({ at })], STUDENT, NOW)
    expect(row.attempted_at).toBe(at)
    expect(row.student_id).toBe(STUDENT)
  })

  // The bug this module exists to fix: one multi-row insert takes a single
  // transaction now(), so an unstamped batch landed on one identical instant
  // and calculateMastery's last-five window had nothing to sort by.
  it('gives distinct, ordered timestamps — never a single instant', () => {
    const rows = pendingPracticeRows(
      [
        entry({ question_id: 'a', at: '2026-08-01T09:00:00.000Z' }),
        entry({ question_id: 'b', at: '2026-08-03T09:00:00.000Z' }),
        entry({ question_id: 'c', at: '2026-08-05T09:00:00.000Z' }),
      ],
      STUDENT, NOW,
    )
    expect(new Set(times(rows)).size).toBe(3)
    expect(times(rows)).toEqual([...times(rows)].sort())
  })

  it('spaces legacy entries a second apart, in order, ending at now', () => {
    const rows = pendingPracticeRows([entry(), entry(), entry()], STUDENT, NOW)
    expect(times(rows)).toEqual([
      new Date(NOW - 2000).toISOString(),
      new Date(NOW - 1000).toISOString(),
      new Date(NOW).toISOString(),
    ])
  })

  it('treats an unparseable `at` as legacy rather than dropping the attempt', () => {
    const rows = pendingPracticeRows([entry({ at: 'not-a-date' })], STUDENT, NOW)
    expect(rows).toHaveLength(1)
    expect(Date.parse(rows[0].attempted_at)).toBeLessThanOrEqual(NOW)
  })

  // A device with a fast clock would otherwise pin the attempt at the top of
  // the mastery window until the real clock caught up.
  it('clamps a future timestamp to now', () => {
    const rows = pendingPracticeRows([entry({ at: '2027-01-01T00:00:00.000Z' })], STUDENT, NOW)
    expect(rows[0].attempted_at).toBe(new Date(NOW).toISOString())
  })

  it('handles a batch mixing stamped and legacy entries', () => {
    const rows = pendingPracticeRows(
      [entry({ question_id: 'old' }), entry({ question_id: 'new', at: '2026-08-06T09:00:00.000Z' })],
      STUDENT, NOW,
    )
    expect(rows).toHaveLength(2)
    expect(rows[1].attempted_at).toBe('2026-08-06T09:00:00.000Z')
    expect(new Set(times(rows)).size).toBe(2)
  })

  it('drops malformed entries instead of failing the whole insert', () => {
    const rows = pendingPracticeRows(
      [entry({ question_id: 'good' }), { question_id: 42 }, null, { skill_ids: ['s'] }],
      STUDENT, NOW,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].question_id).toBe('good')
  })

  it('keeps the most recent PENDING_CAP attempts', () => {
    const many = Array.from({ length: PENDING_CAP + 10 }, (_, i) => entry({ question_id: `q${i}` }))
    const rows = pendingPracticeRows(many, STUDENT, NOW)
    expect(rows).toHaveLength(PENDING_CAP)
    expect(rows[rows.length - 1].question_id).toBe(`q${PENDING_CAP + 9}`)
  })

  it("normalises kind, since 'exam' is positive-only in calculateMastery", () => {
    const rows = pendingPracticeRows(
      [entry({ kind: 'exam' }), entry({ kind: 'nonsense' }), entry()],
      STUDENT, NOW,
    )
    expect(rows.map(r => r.kind)).toEqual(['exam', 'mastery', 'mastery'])
  })
})
