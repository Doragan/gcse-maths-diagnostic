import { describe, it, expect } from 'vitest'
import { validateEntries, deriveAttempts, marksEarned, marksTotal, selectedItems } from './sittingMarks'
import type { PaperConfig } from '../demoPapers'

// A tiny stand-in paper: one 1-mark item, one 3-mark item, one multi-skill item.
// Using a fixture rather than a real paper keeps the boundary cases explicit
// and stops these tests failing if a real paper's marks are ever corrected.
const paper = {
  id: 'test-paper',
  title: 'Test',
  subtitle: 'Test',
  topics: [{ id: 'number', label: 'Number' }],
  questions: [
    { id: '1', label: '1', marks: 1, topic: 'number', skill: 'A', skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
    { id: '2', label: '2', marks: 3, topic: 'number', skill: 'B', skillIds: ['ratio'], kind: 'mastery', desc: '', visual: false },
    { id: '3', label: '3', marks: 2, topic: 'number', skill: 'C', skillIds: ['ratio', 'proportion'], kind: 'exam', desc: '', visual: false },
  ],
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
} as unknown as PaperConfig

const anchors = new Map([['1', 'q-1'], ['2', 'q-2'], ['3', 'q-3']])

describe('validateEntries', () => {
  it('accepts marks at both boundaries', () => {
    expect(validateEntries(paper, [{ studentId: 's', marks: { '1': 0, '2': 3 } }])).toEqual({ ok: true })
  })

  it('rejects a mark above the item maximum', () => {
    const r = validateEntries(paper, [{ studentId: 's', marks: { '2': 4 } }])
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toContain('between 0 and 3')
  })

  it('rejects a negative mark', () => {
    expect(validateEntries(paper, [{ studentId: 's', marks: { '1': -1 } }]).ok).toBe(false)
  })

  it('rejects a fractional mark', () => {
    expect(validateEntries(paper, [{ studentId: 's', marks: { '2': 1.5 } }]).ok).toBe(false)
  })

  it('rejects an item that is not on the paper', () => {
    const r = validateEntries(paper, [{ studentId: 's', marks: { '99': 1 } }])
    expect(!r.ok && r.error).toContain('Unknown item "99"')
  })

  it('rejects an entry with no studentId', () => {
    expect(validateEntries(paper, [{ studentId: '', marks: {} }]).ok).toBe(false)
  })

  it('rejects an empty submission', () => {
    expect(validateEntries(paper, []).ok).toBe(false)
  })

  // The whole point of validating up front: one bad mark must stop the entire
  // submission, not leave earlier students written and later ones not.
  it('fails the whole batch when any student has a bad mark', () => {
    const r = validateEntries(paper, [
      { studentId: 'good', marks: { '1': 1 } },
      { studentId: 'bad', marks: { '1': 9 } },
    ])
    expect(r.ok).toBe(false)
  })
})

describe('deriveAttempts', () => {
  it('counts ONLY full marks as correct', () => {
    const rows = deriveAttempts(paper, { '1': 1, '2': 2, '3': 0 }, anchors, 'stu', 'sit')
    expect(rows.map(r => [r.question_id, r.correct])).toEqual([
      ['q-1', true],   // 1/1 — full
      ['q-2', false],  // 2/3 — near miss is still not correct
      ['q-3', false],  // 0/2
    ])
  })

  it('marks every row positive-only, whatever the item kind', () => {
    const rows = deriveAttempts(paper, { '1': 1, '2': 0 }, anchors, 'stu', 'sit')
    // Item 1 is a mastery item, yet its attempt is exam-kind: a dropped mark
    // must never penalise, so the item's own kind is deliberately not used.
    expect(rows.every(r => r.kind === 'exam')).toBe(true)
  })

  it('carries the item skill ids through, including multi-skill', () => {
    const rows = deriveAttempts(paper, { '3': 2 }, anchors, 'stu', 'sit')
    expect(rows[0].skill_ids).toEqual(['ratio', 'proportion'])
    expect(rows[0].correct).toBe(true)
  })

  it('stamps the sitting id so a correction can rebuild just this sitting', () => {
    const rows = deriveAttempts(paper, { '1': 1 }, anchors, 'stu', 'sit-abc')
    expect(rows[0].sitting_id).toBe('sit-abc')
    expect(rows[0].student_id).toBe('stu')
  })

  it('skips an item with no anchor row rather than emitting a broken FK', () => {
    const rows = deriveAttempts(paper, { '1': 1, '2': 3 }, new Map([['1', 'q-1']]), 'stu', 'sit')
    expect(rows).toHaveLength(1)
    expect(rows[0].question_id).toBe('q-1')
  })

  it('writes a row for dropped marks too, so the sitting is fully represented', () => {
    const rows = deriveAttempts(paper, { '1': 0, '2': 0, '3': 0 }, anchors, 'stu', 'sit')
    expect(rows).toHaveLength(3)
    expect(rows.every(r => !r.correct)).toBe(true)
  })
})

describe('mark totals', () => {
  it('sums a student\'s awarded marks', () => {
    expect(marksEarned({ '1': 1, '2': 2 })).toBe(3)
    expect(marksEarned({})).toBe(0)
  })

  it('sums the paper\'s available marks', () => {
    expect(marksTotal(paper)).toBe(6)
  })

  // The bug this guards: with part of a paper set, a student scoring 4 of an
  // available 4 read as 4/6 — not a worse mark, the wrong mark.
  it('sums only the selection when part of the paper was set', () => {
    expect(marksTotal(paper, ['1', '2'])).toBe(4)
    expect(marksTotal(paper, ['3'])).toBe(2)
    expect(marksTotal(paper, [])).toBe(0)
  })

  it('treats null and undefined as the whole paper', () => {
    expect(marksTotal(paper, null)).toBe(6)
    expect(marksTotal(paper, undefined)).toBe(6)
  })

  it('ignores a selected id the paper does not have', () => {
    // validateEntries rejects this; marksTotal must not invent marks for it.
    expect(marksTotal(paper, ['1', '99'])).toBe(1)
  })
})

describe('selectedItems', () => {
  it('returns every question when there is no selection', () => {
    expect(selectedItems(paper, null).map(q => q.id)).toEqual(['1', '2', '3'])
  })

  it('narrows to the selection in PAPER order, not selection order', () => {
    // A teacher ticking questions out of order did not mean to reorder them —
    // a feedback sheet reads down the paper.
    expect(selectedItems(paper, ['3', '1']).map(q => q.id)).toEqual(['1', '3'])
  })
})

describe('validateEntries with a selection', () => {
  it('accepts marks confined to the selection', () => {
    expect(validateEntries(paper, [{ studentId: 's', marks: { '1': 1 } }], ['1', '2']))
      .toEqual({ ok: true })
  })

  it('rejects a mark for a question that was not set', () => {
    // Otherwise it counts into marksEarned while adding nothing to marksTotal,
    // producing a score over 100%.
    const r = validateEntries(paper, [{ studentId: 's', marks: { '3': 2 } }], ['1'])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('not set')
  })

  it('rejects an empty selection before the database check constraint does', () => {
    const r = validateEntries(paper, [{ studentId: 's', marks: {} }], [])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('at least one')
  })

  it('rejects a selection naming a question the paper does not have', () => {
    expect(validateEntries(paper, [{ studentId: 's', marks: {} }], ['99']).ok).toBe(false)
  })

  it('still enforces the mark range inside a selection', () => {
    expect(validateEntries(paper, [{ studentId: 's', marks: { '2': 4 } }], ['2']).ok).toBe(false)
  })

  it('is unchanged when no selection is passed', () => {
    expect(validateEntries(paper, [{ studentId: 's', marks: { '1': 1, '3': 2 } }]))
      .toEqual({ ok: true })
  })
})
