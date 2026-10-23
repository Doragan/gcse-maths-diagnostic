import { describe, it, expect } from 'vitest'
import {
  headChanged, isAnsweringNow, shouldPause, formatLastAttempt, averageScorePct,
  aggregateProgress,
  ANSWERING_NOW_MS, IDLE_PAUSE_MS,
} from './liveProgress'

const NOW = new Date('2026-10-16T14:30:00Z').getTime()
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString()

describe('headChanged', () => {
  it('treats the first probe as a change, so the baseline gets set', () => {
    expect(headChanged(null, { attemptCount: 0, lastAttemptAt: null })).toBe(true)
  })

  it('is false when nothing has moved — the case that must stay cheap', () => {
    const h = { attemptCount: 12, lastAttemptAt: iso(60_000) }
    expect(headChanged(h, { ...h })).toBe(false)
  })

  it('catches a new attempt by either figure', () => {
    const h = { attemptCount: 12, lastAttemptAt: iso(60_000) }
    expect(headChanged(h, { ...h, attemptCount: 13 })).toBe(true)
    expect(headChanged(h, { ...h, lastAttemptAt: iso(0) })).toBe(true)
  })

  it('notices a deletion that leaves the timestamp alone', () => {
    // Count falling is still a change worth refetching for.
    const h = { attemptCount: 12, lastAttemptAt: iso(60_000) }
    expect(headChanged(h, { ...h, attemptCount: 11 })).toBe(true)
  })
})

describe('isAnsweringNow', () => {
  it('is true inside the window and false outside it', () => {
    expect(isAnsweringNow(iso(30_000), NOW)).toBe(true)
    expect(isAnsweringNow(iso(ANSWERING_NOW_MS + 1_000), NOW)).toBe(false)
  })

  it('tolerates a student clock slightly ahead of ours', () => {
    // A timestamp a few seconds in the future must not read as "not here".
    expect(isAnsweringNow(new Date(NOW + 5_000).toISOString(), NOW)).toBe(true)
  })

  it('is false when the student has never attempted', () => {
    expect(isAnsweringNow(null, NOW)).toBe(false)
  })
})

describe('shouldPause', () => {
  it('holds on through a quiet stretch of a lesson', () => {
    expect(shouldPause(NOW - 20 * 60 * 1000, NOW)).toBe(false)
  })

  it('stands down once nothing has changed for the idle window', () => {
    expect(shouldPause(NOW - IDLE_PAUSE_MS, NOW)).toBe(true)
  })
})

describe('formatLastAttempt', () => {
  it('says so while they are still answering', () => {
    expect(formatLastAttempt(iso(30_000), NOW)).toBe('answering now')
  })

  it('gives a clock time later the same day, not just "today"', () => {
    // During a lesson every row is today, so a date alone says nothing.
    const out = formatLastAttempt(iso(3 * 60 * 60 * 1000), NOW)
    expect(out).toMatch(/^\d{2}:\d{2}$/)
  })

  it('falls back to a date on an earlier day', () => {
    expect(formatLastAttempt(iso(3 * 24 * 60 * 60 * 1000), NOW)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('shows a dash when there is nothing to report', () => {
    expect(formatLastAttempt(null, NOW)).toBe('—')
  })
})

describe('averageScorePct', () => {
  const row = (score: string | null, total_attempts = 1) => ({ score, total_attempts })

  it('reads the fraction, not the numerator', () => {
    // The bug this replaces: parseInt('3/10') is 3, rendered as "3%".
    expect(averageScorePct([row('3/10')])).toBe(30)
  })

  it('averages across students', () => {
    expect(averageScorePct([row('10/10'), row('5/10')])).toBe(75)
  })

  it('ignores students who have not started', () => {
    // A class who have not opened it yet must not drag a real average to zero —
    // the tile sits beside "Started" and is not a second progress meter.
    expect(averageScorePct([row('8/10'), row('0/10', 0), row('0/10', 0)])).toBe(80)
  })

  it('ignores a zero denominator rather than dividing by it', () => {
    // mastery_based scores as correct/attempts, which is "0/0" before the first
    // answer lands even once total_attempts has moved.
    expect(averageScorePct([row('0/0'), row('4/8')])).toBe(50)
  })

  it('drops a malformed score instead of averaging in NaN', () => {
    expect(averageScorePct([row('not a score'), row('1/4')])).toBe(25)
    expect(averageScorePct([row(null), row('1/4')])).toBe(25)
  })

  it('is null when nobody has a usable score, so the caller can show a dash', () => {
    expect(averageScorePct([])).toBeNull()
    expect(averageScorePct([row('0/10', 0)])).toBeNull()
    expect(averageScorePct([row('0/0')])).toBeNull()
  })
})

describe('aggregateProgress', () => {
  const who = (id: string, name = id) => ({ id, display_name: name })
  const at = (subject_id: string, question_id: string, correct: boolean, attempted_at: string) =>
    ({ subject_id, question_id, correct, attempted_at })

  const PICKED_ONCE = { selectionMode: 'picked' as const, completionMode: 'attempt_once', assignedCount: 3 }

  it('counts unique questions, not attempts, in picked/attempt_once', () => {
    // Two goes at the same question is one question started, and the score is
    // out of what was assigned rather than what was tried.
    const [row] = aggregateProgress([who('a')], [
      at('a', 'q1', false, '2026-10-20T10:00:00Z'),
      at('a', 'q1', true,  '2026-10-20T10:01:00Z'),
    ], PICKED_ONCE)
    expect(row.questions_started).toBe(1)
    expect(row.total_attempts).toBe(2)
    expect(row.correct_count).toBe(1)
    expect(row.score).toBe('1/3')
    expect(row.is_complete).toBe(false)
  })

  it('completes picked/attempt_once once every question has been tried, right or wrong', () => {
    const [row] = aggregateProgress([who('a')], [
      at('a', 'q1', false, '2026-10-20T10:00:00Z'),
      at('a', 'q2', false, '2026-10-20T10:01:00Z'),
      at('a', 'q3', false, '2026-10-20T10:02:00Z'),
    ], PICKED_ONCE)
    expect(row.is_complete).toBe(true)
    expect(row.score).toBe('0/3')
  })

  it('completes picked/until_correct only on correct answers', () => {
    const opts = { selectionMode: 'picked' as const, completionMode: 'until_correct', assignedCount: 2 }
    const attempts = [
      at('a', 'q1', true,  '2026-10-20T10:00:00Z'),
      at('a', 'q2', false, '2026-10-20T10:01:00Z'),
    ]
    expect(aggregateProgress([who('a')], attempts, opts)[0].is_complete).toBe(false)
    expect(aggregateProgress([who('a')], [
      ...attempts, at('a', 'q2', true, '2026-10-20T10:02:00Z'),
    ], opts)[0].is_complete).toBe(true)
  })

  it('scores pool/attempt_once out of what was actually attempted', () => {
    // Pool mode has no fixed question list, so the denominator is the work done.
    const [row] = aggregateProgress([who('a')], [
      at('a', 'q1', true,  '2026-10-20T10:00:00Z'),
      at('a', 'q2', false, '2026-10-20T10:01:00Z'),
    ], { selectionMode: 'pool', completionMode: 'attempt_once', assignedCount: 5 })
    expect(row.score).toBe('1/2')
    expect(row.is_complete).toBe(false)
  })

  it('leaves mastery_based open-ended — a score but never complete', () => {
    const [row] = aggregateProgress([who('a')], [
      at('a', 'q1', true, '2026-10-20T10:00:00Z'),
    ], { selectionMode: 'pool', completionMode: 'mastery_based', assignedCount: 5 })
    expect(row.score).toBe('1/1')
    expect(row.is_complete).toBe(false)
  })

  it('includes people with no attempts at all', () => {
    // The roster is the row set: someone who has not started still has a row,
    // which is most of the point of the view during a lesson.
    const rows = aggregateProgress([who('a'), who('b')], [
      at('a', 'q1', true, '2026-10-20T10:00:00Z'),
    ], PICKED_ONCE)
    expect(rows).toHaveLength(2)
    const b = rows.find(r => r.subject_id === 'b')!
    expect(b.total_attempts).toBe(0)
    expect(b.last_attempt_at).toBeNull()
  })

  it('ignores attempts from someone not on the roster', () => {
    const rows = aggregateProgress([who('a')], [
      at('a', 'q1', true, '2026-10-20T10:00:00Z'),
      at('ghost', 'q1', true, '2026-10-20T10:05:00Z'),
    ], PICKED_ONCE)
    expect(rows).toHaveLength(1)
    expect(rows[0].total_attempts).toBe(1)
  })

  it('takes the latest attempt without trusting the input order', () => {
    const [row] = aggregateProgress([who('a')], [
      at('a', 'q2', true, '2026-10-20T10:05:00Z'),
      at('a', 'q1', true, '2026-10-20T10:00:00Z'),
    ], PICKED_ONCE)
    expect(row.last_attempt_at).toBe('2026-10-20T10:05:00Z')
  })

  it('sorts complete first, then most recent, then by name', () => {
    const rows = aggregateProgress(
      [who('a', 'Avery'), who('b', 'Blake'), who('c', 'Casey'), who('d', 'Drew')],
      [
        // c is complete
        at('c', 'q1', true, '2026-10-20T09:00:00Z'),
        at('c', 'q2', true, '2026-10-20T09:01:00Z'),
        at('c', 'q3', true, '2026-10-20T09:02:00Z'),
        // b answered most recently among the incomplete
        at('b', 'q1', true, '2026-10-20T10:30:00Z'),
        at('a', 'q1', true, '2026-10-20T10:00:00Z'),
        // d has not started
      ],
      PICKED_ONCE,
    )
    expect(rows.map(r => r.display_name)).toEqual(['Casey', 'Blake', 'Avery', 'Drew'])
  })

  it('reports year_group as null when the roster has none', () => {
    // A class session has no year group to report; the table renders it only
    // when present, so null must come through rather than undefined.
    const [row] = aggregateProgress([who('a')], [], PICKED_ONCE)
    expect(row.year_group).toBeNull()
  })

  describe('progress', () => {
    // Added after watching a live session: the table showed a score and no
    // sense of how far through anyone was, so "1/10" covered both one question
    // answered correctly and ten answered with nine wrong.

    it('counts attempts toward the target in pool/attempt_once', () => {
      const [row] = aggregateProgress([who('a')], [
        at('a', 'q1', true,  '2026-10-22T10:00:00Z'),
        at('a', 'q2', false, '2026-10-22T10:01:00Z'),
        at('a', 'q3', false, '2026-10-22T10:02:00Z'),
      ], { selectionMode: 'pool', completionMode: 'attempt_once', assignedCount: 10, scoreAgainst: 'target' })
      expect(row.progress).toEqual({ done: 3, target: 10 })
      expect(row.score).toBe('1/10')
      expect(row.is_complete).toBe(false)
    })

    it('distinguishes the two situations that used to look identical', () => {
      const opts = { selectionMode: 'pool' as const, completionMode: 'attempt_once', assignedCount: 10, scoreAgainst: 'target' as const }
      // One answered, right.
      const [keen] = aggregateProgress([who('a')], [
        at('a', 'q1', true, '2026-10-22T10:00:00Z'),
      ], opts)
      // Ten answered, one right.
      const [struggling] = aggregateProgress([who('a')], Array.from({ length: 10 }, (_, i) =>
        at('a', `q${i}`, i === 0, `2026-10-22T10:${String(i).padStart(2, '0')}:00Z`),
      ), opts)

      expect(keen.score).toBe(struggling.score)          // both '1/10'
      expect(keen.progress).toEqual({ done: 1, target: 10 })
      expect(struggling.progress).toEqual({ done: 10, target: 10 })
    })

    it('counts unique questions in picked/attempt_once, not retries', () => {
      const [row] = aggregateProgress([who('a')], [
        at('a', 'q1', false, '2026-10-22T10:00:00Z'),
        at('a', 'q1', true,  '2026-10-22T10:01:00Z'),
      ], { selectionMode: 'picked', completionMode: 'attempt_once', assignedCount: 3 })
      expect(row.progress).toEqual({ done: 1, target: 3 })
      expect(row.total_attempts).toBe(2)
    })

    it('counts correct answers when that is what completion needs', () => {
      const [row] = aggregateProgress([who('a')], [
        at('a', 'q1', true,  '2026-10-22T10:00:00Z'),
        at('a', 'q2', false, '2026-10-22T10:01:00Z'),
      ], { selectionMode: 'pool', completionMode: 'until_correct', assignedCount: 4 })
      expect(row.progress).toEqual({ done: 1, target: 4 })
    })

    it('is null on an open-ended task and when nothing is assigned', () => {
      const one = [at('a', 'q1', true, '2026-10-22T10:00:00Z')]
      for (const selectionMode of ['picked', 'pool'] as const) {
        expect(aggregateProgress([who('a')], one, {
          selectionMode, completionMode: 'mastery_based', assignedCount: 5,
        })[0].progress).toBeNull()
        expect(aggregateProgress([who('a')], one, {
          selectionMode, completionMode: 'attempt_once', assignedCount: 0,
        })[0].progress).toBeNull()
      }
    })

    it('AGREES with is_complete in every mode — the point of deriving it', () => {
      // A row reading "2 of 10" and "Complete" at once is the failure this
      // guards: progress is now the thing completion is decided on.
      const attempts = Array.from({ length: 6 }, (_, i) =>
        at('a', `q${i}`, i % 2 === 0, `2026-10-22T10:0${i}:00Z`))
      for (const selectionMode of ['picked', 'pool'] as const) {
        for (const completionMode of ['attempt_once', 'until_correct', 'mastery_based']) {
          for (const assignedCount of [0, 1, 3, 6, 10]) {
            const [row] = aggregateProgress([who('a')], attempts, { selectionMode, completionMode, assignedCount })
            const expected = row.progress !== null && row.progress.done >= row.progress.target
            expect(row.is_complete, `${selectionMode}/${completionMode}/${assignedCount}`).toBe(expected)
          }
        }
      }
    })
  })

  describe('scoreAgainst', () => {
    const POOL = { selectionMode: 'pool' as const, completionMode: 'attempt_once', assignedCount: 3 }

    it("defaults to 'attempted', preserving what every caller had before", () => {
      const [row] = aggregateProgress([who('a')], [
        at('a', 'q1', true, '2026-10-21T10:00:00Z'),
      ], POOL)
      expect(row.score).toBe('1/1')
    })

    it('scores out of the target when asked, so a class compares by eye', () => {
      // The bug this fixes: one question in, right, used to read 1/1 — full
      // marks — next to someone who had finished three and read 2/3.
      const [row] = aggregateProgress([who('a')], [
        at('a', 'q1', true, '2026-10-21T10:00:00Z'),
      ], { ...POOL, scoreAgainst: 'target' })
      expect(row.score).toBe('1/3')
    })

    it('puts a whole class on one denominator', () => {
      const rows = aggregateProgress([who('a', 'Ada'), who('b', 'Blake'), who('c', 'Cleo')], [
        at('a', 'q1', true,  '2026-10-21T10:00:00Z'),
        at('a', 'q2', false, '2026-10-21T10:01:00Z'),
        at('a', 'q3', true,  '2026-10-21T10:02:00Z'),
        at('b', 'q1', true,  '2026-10-21T10:03:00Z'),
      ], { ...POOL, scoreAgainst: 'target' })
      expect(rows.map(r => `${r.display_name} ${r.score}`)).toEqual([
        'Ada 2/3', 'Blake 1/3', 'Cleo 0/3',
      ])
    })

    it('does not change whether anyone is complete', () => {
      // Completion is still attempts >= target; only the denominator moved.
      const attempts = [
        at('a', 'q1', false, '2026-10-21T10:00:00Z'),
        at('a', 'q2', false, '2026-10-21T10:01:00Z'),
        at('a', 'q3', false, '2026-10-21T10:02:00Z'),
      ]
      for (const scoreAgainst of ['attempted', 'target'] as const) {
        const [row] = aggregateProgress([who('a')], attempts, { ...POOL, scoreAgainst })
        expect(row.is_complete).toBe(true)
        expect(row.correct_count).toBe(0)
      }
    })

    it('leaves the modes it does not apply to alone', () => {
      // Picked already scores out of the assigned count; pool/until_correct
      // already scores out of the target; mastery_based has no target at all.
      const one = [at('a', 'q1', true, '2026-10-21T10:00:00Z')]
      const score = (o: Parameters<typeof aggregateProgress>[2]) =>
        aggregateProgress([who('a')], one, o)[0].score

      for (const scoreAgainst of ['attempted', 'target'] as const) {
        expect(score({ selectionMode: 'picked', completionMode: 'attempt_once', assignedCount: 3, scoreAgainst })).toBe('1/3')
        expect(score({ selectionMode: 'pool', completionMode: 'until_correct', assignedCount: 3, scoreAgainst })).toBe('1/3')
        expect(score({ selectionMode: 'pool', completionMode: 'mastery_based', assignedCount: 3, scoreAgainst })).toBe('1/1')
      }
    })

    it('falls back to attempted when there is no target to score against', () => {
      // pool mode derives assignedCount from target_count, which is NULLABLE,
      // so a pool assignment saved without one arrives as 0. The "nothing
      // assigned" branch handles it now; asserted here too, because this is
      // the option whose whole job is choosing a denominator.
      const [row] = aggregateProgress([who('a')], [
        at('a', 'q1', true,  '2026-10-21T10:00:00Z'),
        at('a', 'q2', false, '2026-10-21T10:01:00Z'),
      ], { selectionMode: 'pool', completionMode: 'attempt_once', assignedCount: 0, scoreAgainst: 'target' })
      expect(row.score).toBe('1/2')
    })

    it('feeds a sensible class average', () => {
      // averageScorePct parses the fraction, so the tile moves with this.
      const rows = aggregateProgress([who('a'), who('b')], [
        at('a', 'q1', true, '2026-10-21T10:00:00Z'),
        at('a', 'q2', true, '2026-10-21T10:01:00Z'),
        at('a', 'q3', true, '2026-10-21T10:02:00Z'),
        at('b', 'q1', true, '2026-10-21T10:03:00Z'),
      ], { ...POOL, scoreAgainst: 'target' })
      // 3/3 and 1/3 -> 100% and 33% -> 67%
      expect(averageScorePct(rows)).toBe(67)
    })
  })

  describe('nothing assigned (assignedCount 0)', () => {
    // Until 2026-10-21 every comparison in here was `>= assignedCount`, so a
    // target of zero satisfied all of them and the whole roster read
    // "Complete" — on an assignment with nothing in it. Reachable two ways: a
    // picked assignment with no questions, and a pool one whose target_count
    // is null.

    const noTarget = { completionMode: 'attempt_once', assignedCount: 0 }

    it('completes nobody, in either selection mode', () => {
      for (const selectionMode of ['picked', 'pool'] as const) {
        const [row] = aggregateProgress([who('a')], [], { ...noTarget, selectionMode })
        expect(row.is_complete, selectionMode).toBe(false)
      }
    })

    it('completes nobody even for someone who has answered', () => {
      // The harder case: attempts >= 0 is still true, so only the guard stops
      // this reading as complete.
      const [row] = aggregateProgress([who('a')], [
        at('a', 'q1', true, '2026-10-21T10:00:00Z'),
      ], { ...noTarget, selectionMode: 'pool' })
      expect(row.is_complete).toBe(false)
    })

    it('shows a dash rather than 0/0 when nothing has been done either', () => {
      const [row] = aggregateProgress([who('a')], [], { ...noTarget, selectionMode: 'picked' })
      expect(row.score).toBeNull()
    })

    it('still reports work done, out of what was attempted', () => {
      const [row] = aggregateProgress([who('a')], [
        at('a', 'q1', true,  '2026-10-21T10:00:00Z'),
        at('a', 'q2', false, '2026-10-21T10:01:00Z'),
      ], { ...noTarget, selectionMode: 'pool' })
      expect(row.score).toBe('1/2')
      expect(row.total_attempts).toBe(2)
    })

    it('never renders a zero denominator, whatever else is asked for', () => {
      // "2/0" in front of a teacher would be worse than the bug being fixed.
      for (const selectionMode of ['picked', 'pool'] as const) {
        for (const completionMode of ['attempt_once', 'until_correct', 'mastery_based']) {
          for (const scoreAgainst of ['attempted', 'target'] as const) {
            const [row] = aggregateProgress([who('a')], [
              at('a', 'q1', true, '2026-10-21T10:00:00Z'),
            ], { selectionMode, completionMode, assignedCount: 0, scoreAgainst })
            expect(row.score, `${selectionMode}/${completionMode}/${scoreAgainst}`).not.toContain('/0')
          }
        }
      }
    })
  })
})
