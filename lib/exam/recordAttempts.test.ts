import { describe, it, expect } from 'vitest'
import { groupExamAttempts, type ExamUnit, type ExamUnitResult } from './recordAttempts'

const u = (key: string, skillIds: string[], kind: 'mastery' | 'exam' = 'mastery'): ExamUnit => ({ key, skillIds, kind })
const r = (correct: boolean, answer = 'x'): ExamUnitResult => ({ correct, studentAnswer: answer })

describe('groupExamAttempts', () => {
  it('records one attempt per single-part question', () => {
    const units = [u('q1:0', ['a']), u('q2:0', ['b'])]
    const rows = groupExamAttempts(units, { 'q1:0': r(true), 'q2:0': r(false) })
    expect(rows).toEqual([
      { questionId: 'q1', skillIds: ['a'], kind: 'mastery', correct: true },
      { questionId: 'q2', skillIds: ['b'], kind: 'mastery', correct: false },
    ])
  })

  it('records one attempt per part of a multi-part question', () => {
    const units = [u('q1:0', ['a']), u('q1:1', ['b'], 'exam')]
    const rows = groupExamAttempts(units, { 'q1:0': r(true), 'q1:1': r(false) })
    expect(rows).toHaveLength(2)
    expect(rows[1]).toEqual({ questionId: 'q1', skillIds: ['b'], kind: 'exam', correct: false })
  })

  it('collapses a multi_blank part into ONE attempt, correct only if every blank is right', () => {
    // Part (a) is three blanks under one part index; two right, one wrong.
    const units = [u('q1:0:0', ['a']), u('q1:0:1', ['a']), u('q1:0:2', ['a'])]
    const results = { 'q1:0:0': r(true), 'q1:0:1': r(true), 'q1:0:2': r(false) }
    const rows = groupExamAttempts(units, results)
    expect(rows).toEqual([{ questionId: 'q1', skillIds: ['a'], kind: 'mastery', correct: false }])
  })

  it('a multi_blank part with every blank right records one correct attempt', () => {
    const units = [u('q1:0:0', ['a']), u('q1:0:1', ['a'])]
    const rows = groupExamAttempts(units, { 'q1:0:0': r(true), 'q1:0:1': r(true) })
    expect(rows).toEqual([{ questionId: 'q1', skillIds: ['a'], kind: 'mastery', correct: true }])
  })

  it('skips a part with no answered unit (a skip never penalises)', () => {
    const units = [u('q1:0', ['a']), u('q2:0', ['b'])]
    const rows = groupExamAttempts(units, { 'q1:0': r(true), 'q2:0': r(false, '') })
    expect(rows).toEqual([{ questionId: 'q1', skillIds: ['a'], kind: 'mastery', correct: true }])
  })

  it('records a partly-answered multi_blank part (some blanks blank → not correct)', () => {
    const units = [u('q1:0:0', ['a']), u('q1:0:1', ['a'])]
    // one blank answered, one left empty → the part is answered but not all-correct
    const rows = groupExamAttempts(units, { 'q1:0:0': r(true), 'q1:0:1': r(false, '') })
    expect(rows).toEqual([{ questionId: 'q1', skillIds: ['a'], kind: 'mastery', correct: false }])
  })
})
