import { describe, it, expect } from 'vitest'
import { assembleExam, candidateOf, MAX_MULTI_PART, type Candidate } from './assembler'
import { normalizePart, emptyPart, emptyBlank } from '../questions/parts'
import type { ExamSlot } from './blueprint'

// Deterministic rng: always picks the first candidate in a tie group.
const firstRng = () => 0

function cand(id: string, difficulty: number, over: Partial<Candidate> = {}): Candidate {
  return { id, difficulty, calculator: 'na', kind: 'mastery', strand: 'Number', marks: 1, skillIds: [], multiPart: false, ...over }
}

describe('assembleExam — multi-part cap', () => {
  const manySlots: ExamSlot[] = Array.from({ length: 11 }, () => ({ band: 2, kind: 'any' as const }))

  it('caps multi-part questions even when the pool is all multi-part', () => {
    const candidates = Array.from({ length: 20 }, (_, i) => cand(`m${i}`, 2, { multiPart: true }))
    const res = assembleExam(candidates, manySlots, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toHaveLength(MAX_MULTI_PART)
  })

  it('fills the rest of the paper with single-part questions once capped', () => {
    const candidates = [
      ...Array.from({ length: 20 }, (_, i) => cand(`m${i}`, 2, { multiPart: true })),
      ...Array.from({ length: 20 }, (_, i) => cand(`s${i}`, 2)),
    ]
    const res = assembleExam(candidates, manySlots, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toHaveLength(11)
    expect(res.questionIds.filter(id => id.startsWith('m'))).toHaveLength(MAX_MULTI_PART)
  })

  it('holds at every rung of the relaxation ladder, not just the exact-band one', () => {
    // Only multi-part left, and the slot must relax across bands to find them.
    const candidates = [
      ...Array.from({ length: 6 }, (_, i) => cand(`m${i}`, 4, { multiPart: true })),
      cand('s0', 1),
    ]
    const blueprint: ExamSlot[] = Array.from({ length: 6 }, () => ({ band: 1, kind: 'any' as const }))
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds.filter(id => id.startsWith('m')).length).toBeLessThanOrEqual(MAX_MULTI_PART)
  })

  it('leaves papers alone when multi-part questions are scarce (today)', () => {
    const candidates = [
      ...Array.from({ length: 2 }, (_, i) => cand(`m${i}`, 2, { multiPart: true })),
      ...Array.from({ length: 20 }, (_, i) => cand(`s${i}`, 2)),
    ]
    const res = assembleExam(candidates, manySlots, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toHaveLength(11)
    // both multi-part questions are still eligible — the cap never binds
    expect(res.questionIds.filter(id => id.startsWith('m')).length).toBeLessThanOrEqual(2)
  })
})

describe('assembleExam', () => {
  it('never puts a calc question on a non-calc paper', () => {
    const candidates = [
      cand('c1', 2, { calculator: 'calc' }),
      cand('c2', 2, { calculator: 'non_calc' }),
      cand('c3', 2, { calculator: 'na' }),
    ]
    const blueprint: ExamSlot[] = [{ band: 2, kind: 'any' }, { band: 2, kind: 'any' }]
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'non_calc', rng: firstRng })
    expect(res.questionIds).not.toContain('c1')
    expect(res.questionIds).toHaveLength(2)
  })

  it('allows any calculator tag on a calc paper', () => {
    const candidates = [
      cand('c1', 2, { calculator: 'calc', strand: 'A' }),
      cand('c2', 2, { calculator: 'non_calc', strand: 'B' }),
    ]
    const blueprint: ExamSlot[] = [{ band: 2, kind: 'any' }, { band: 2, kind: 'any' }]
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds.sort()).toEqual(['c1', 'c2'])
  })

  it('matches the requested difficulty band when candidates exist', () => {
    const candidates = [cand('easy', 1), cand('hard', 4)]
    const res = assembleExam(candidates, [{ band: 4, kind: 'any' }], { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['hard'])
  })

  it('relaxes an exam-kind slot to mastery when no exam question is available', () => {
    const candidates = [cand('m', 4, { kind: 'mastery' })]
    const res = assembleExam(candidates, [{ band: 4, kind: 'exam' }], { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['m']) // fell back to the mastery question
  })

  it('prefers an exam-kind question for an exam slot when one exists', () => {
    const candidates = [
      cand('m', 4, { kind: 'mastery', strand: 'A' }),
      cand('e', 4, { kind: 'exam', strand: 'B' }),
    ]
    const res = assembleExam(candidates, [{ band: 4, kind: 'exam' }], { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['e'])
  })

  it('relaxes to an adjacent band when the exact band is empty', () => {
    const candidates = [cand('b3', 3)]
    const res = assembleExam(candidates, [{ band: 4, kind: 'any' }], { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['b3'])
  })

  it('never repeats a question and honours the exclude set', () => {
    const candidates = [cand('a', 2, { strand: 'A' }), cand('b', 2, { strand: 'B' }), cand('c', 2, { strand: 'C' })]
    const blueprint: ExamSlot[] = [{ band: 2, kind: 'any' }, { band: 2, kind: 'any' }, { band: 2, kind: 'any' }]
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', exclude: new Set(['a']), rng: firstRng })
    expect(res.questionIds).not.toContain('a')
    expect(new Set(res.questionIds).size).toBe(res.questionIds.length) // no dupes
    expect(res.questionIds).toHaveLength(2) // only b, c eligible
  })

  it('sums marks across the assembled paper', () => {
    const candidates = [cand('a', 1, { marks: 1 }), cand('b', 3, { marks: 2 }), cand('c', 4, { marks: 3 })]
    const blueprint: ExamSlot[] = [{ band: 1, kind: 'any' }, { band: 3, kind: 'any' }, { band: 4, kind: 'any' }]
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', rng: firstRng })
    expect(res.totalMarks).toBe(6)
  })

  it('spreads across strands when possible (cross-section coverage)', () => {
    // Two Number + one Algebra at band 2; a 2-slot paper should take one of each
    // strand rather than both Number, because Algebra is the least-used strand.
    const candidates = [
      cand('n1', 2, { strand: 'Number' }),
      cand('n2', 2, { strand: 'Number' }),
      cand('a1', 2, { strand: 'Algebra' }),
    ]
    const blueprint: ExamSlot[] = [{ band: 2, kind: 'any' }, { band: 2, kind: 'any' }]
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toContain('a1') // the distinct strand is always included
  })

  it('drops candidates touching a blocked (Higher-only) skill from a Foundation paper', () => {
    const candidates = [
      cand('found', 2, { skillIds: ['ratio'], strand: 'A' }),
      cand('mixed', 2, { skillIds: ['ratio', 'surds_simplifying'], strand: 'B' }),
      cand('high', 2, { skillIds: ['surds_simplifying'], strand: 'C' }),
    ]
    const blueprint: ExamSlot[] = [{ band: 2, kind: 'any' }, { band: 2, kind: 'any' }, { band: 2, kind: 'any' }]
    const res = assembleExam(candidates, blueprint, {
      calculatorMode: 'calc',
      blockedSkillIds: new Set(['surds_simplifying']),
      rng: firstRng,
    })
    expect(res.questionIds).toEqual(['found']) // mixed & high both touch a blocked skill
  })

  it('skips a slot (shorter paper) rather than failing when the pool is exhausted', () => {
    const candidates = [cand('only', 2)]
    const blueprint: ExamSlot[] = [{ band: 2, kind: 'any' }, { band: 2, kind: 'any' }]
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['only'])
  })
})

describe('candidateOf', () => {
  const base = { id: 'q', skill_ids: ['simple_arithmetic'], difficulty: 2, calculator: 'na', kind: 'mastery', question_type: 'numeric', parts: null }

  it('excludes multiple-choice questions from exam assembly', () => {
    expect(candidateOf({ ...base, question_type: 'multiple_choice' })).toBeNull()
  })

  it('uses nominal marks for single-part questions by difficulty', () => {
    expect(candidateOf({ ...base, difficulty: 1 })!.marks).toBe(1)
    expect(candidateOf({ ...base, difficulty: 3 })!.marks).toBe(2)
    expect(candidateOf({ ...base, difficulty: 4 })!.marks).toBe(3)
  })

  it('sums part marks for multi-part questions', () => {
    const c = candidateOf({ ...base, parts: [{ marks: 1 }, { marks: 2 }, { marks: 3 }] })
    expect(c!.marks).toBe(6)
  })

  it('counts a grid_draw part at its element-sum marks (normalizePart invariant)', () => {
    const part = normalizePart({
      ...emptyPart(),
      answer_type: 'grid_draw',
      grid: {
        mode: 'line',
        x: { min: '0', max: '4', step: '1', label: 'x' },
        y: { min: '0', max: '12', step: '1', label: 'y' },
        background: '',
        elements: [
          { x: '0', y: '{{c}}', marks: 1 },
          { x: '4', y: '{{4*m+c}}', marks: 2 },
        ],
        tolerance: 0,
      },
    })
    const c = candidateOf({ ...base, parts: [part, { marks: 1 }] })
    expect(part.marks).toBe(3)
    expect(c!.marks).toBe(4)
  })

  it('counts a multi_blank part at its blank-sum marks (normalizePart invariant)', () => {
    // normalizePart pins part.marks = sum of blank marks, so the assembler
    // needs no blank awareness — this pins that contract from the consumer side.
    const part = normalizePart({
      ...emptyPart(),
      answer_type: 'multi_blank',
      blanks: [
        { ...emptyBlank('A'), answer_template: '{{a}}', marks: 1 },
        { ...emptyBlank('B'), answer_template: '{{b}}', marks: 2 },
      ],
    })
    const c = candidateOf({ ...base, parts: [part, { marks: 2 }] })
    expect(part.marks).toBe(3)
    expect(c!.marks).toBe(5)
  })

  it('derives strand from the first skill and defaults unknown calc to na', () => {
    const c = candidateOf({ ...base, calculator: 'bogus', skill_ids: ['simple_arithmetic'] })!
    expect(c.calculator).toBe('na')
    expect(c.strand).toBe('Number') // simple_arithmetic is a Number skill
  })
})
