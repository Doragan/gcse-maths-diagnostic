import { describe, it, expect } from 'vitest'
import { assembleExam, candidateOf, MAX_MULTI_PART, type Candidate } from './assembler'
import { normalizePart, emptyPart, emptyBlank } from '../questions/parts'
import type { ExamBlueprint, DifficultyBand, SlotKind } from './blueprint'

// A blueprint is now a MARK BUDGET. Helper: spend `target` marks, split evenly
// across the given bands (equal shares unless one is given explicitly).
function bp(target: number, bands: { band: DifficultyBand; share?: number; preferKind?: SlotKind }[], tolerance = 0): ExamBlueprint {
  const share = 1 / bands.length;
  return { targetMarks: target, tolerance, bands: bands.map(b => ({ share, ...b })) };
}

// Deterministic rng: always picks the first candidate in a tie group.
const firstRng = () => 0

function cand(id: string, difficulty: number, over: Partial<Candidate> = {}): Candidate {
  return { id, difficulty, calculator: 'na', kind: 'mastery', strand: 'Number', marks: 1, skillIds: [], multiPart: false, ...over }
}

describe('assembleExam — multi-part cap', () => {
  // 11 marks of band-2 budget; every test candidate is worth 1 mark, so this
  // buys 11 questions — the old '11 slots' expressed as a budget.
  const manyMarks = bp(11, [{ band: 2 }])

  it('caps multi-part questions even when the pool is all multi-part', () => {
    const candidates = Array.from({ length: 20 }, (_, i) => cand(`m${i}`, 2, { multiPart: true }))
    const res = assembleExam(candidates, manyMarks, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toHaveLength(MAX_MULTI_PART)
  })

  it('fills the rest of the paper with single-part questions once capped', () => {
    const candidates = [
      ...Array.from({ length: 20 }, (_, i) => cand(`m${i}`, 2, { multiPart: true })),
      ...Array.from({ length: 20 }, (_, i) => cand(`s${i}`, 2)),
    ]
    const res = assembleExam(candidates, manyMarks, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toHaveLength(11)
    expect(res.questionIds.filter(id => id.startsWith('m'))).toHaveLength(MAX_MULTI_PART)
  })

  it('holds at every rung of the relaxation ladder, not just the exact-band one', () => {
    // One band-1 single-part question, then only multi-part left — and those sit
    // in band 2, so the budget must RELAX across bands to reach them. The cap has
    // to survive that widening.
    const candidates = [
      cand('s0', 1),
      ...Array.from({ length: 8 }, (_, i) => cand(`m${i}`, 2, { multiPart: true })),
    ]
    const res = assembleExam(candidates, bp(9, [{ band: 1 }]), { calculatorMode: 'calc', rng: firstRng })
    // It did have to relax (it reached the band-2 questions at all)…
    expect(res.questionIds.filter(id => id.startsWith('m')).length).toBeGreaterThan(0)
    // …and the cap still held.
    expect(res.questionIds.filter(id => id.startsWith('m')).length).toBe(MAX_MULTI_PART)
  })

  it('leaves papers alone when multi-part questions are scarce (today)', () => {
    const candidates = [
      ...Array.from({ length: 2 }, (_, i) => cand(`m${i}`, 2, { multiPart: true })),
      ...Array.from({ length: 20 }, (_, i) => cand(`s${i}`, 2)),
    ]
    const res = assembleExam(candidates, manyMarks, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toHaveLength(11)
    // both multi-part questions are still eligible — the cap never binds
    expect(res.questionIds.filter(id => id.startsWith('m')).length).toBeLessThanOrEqual(2)
  })
})

describe('assembleExam — mark budget', () => {
  it('spends the budget rather than filling a fixed number of slots', () => {
    // 12 marks of budget from 3-mark questions = 4 questions, not "12 slots".
    const candidates = Array.from({ length: 20 }, (_, i) => cand(`q${i}`, 2, { marks: 3, strand: `S${i}` }))
    const res = assembleExam(candidates, bp(12, [{ band: 2 }]), { calculatorMode: 'calc', rng: firstRng })
    expect(res.totalMarks).toBe(12)
    expect(res.questionIds).toHaveLength(4)
  })

  it('lets the question COUNT vary with question weight, holding marks fixed', () => {
    const light = Array.from({ length: 20 }, (_, i) => cand(`l${i}`, 2, { marks: 1, strand: `S${i}` }))
    const heavy = Array.from({ length: 20 }, (_, i) => cand(`h${i}`, 2, { marks: 4, strand: `S${i}` }))
    const lightPaper = assembleExam(light, bp(12, [{ band: 2 }]), { calculatorMode: 'calc', rng: firstRng })
    const heavyPaper = assembleExam(heavy, bp(12, [{ band: 2 }]), { calculatorMode: 'calc', rng: firstRng })
    expect(lightPaper.totalMarks).toBe(heavyPaper.totalMarks) // same assessment…
    expect(lightPaper.questionIds.length).toBeGreaterThan(heavyPaper.questionIds.length) // …different length
  })

  it('never overshoots the target with a question that does not fit', () => {
    // A 5-mark question cannot land in a 3-mark budget.
    const candidates = [cand('big', 2, { marks: 5 }), cand('small', 2, { marks: 1, strand: 'B' })]
    const res = assembleExam(candidates, bp(3, [{ band: 2 }]), { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).not.toContain('big')
    expect(res.totalMarks).toBeLessThanOrEqual(3)
  })

  it('rolls an underspent band forward instead of losing the marks', () => {
    // Band 1 can only spend 1 of its 5; band 4 should then get 5 + the leftover.
    const candidates = [
      cand('e', 1, { marks: 1, strand: 'A' }),
      ...Array.from({ length: 6 }, (_, i) => cand(`h${i}`, 4, { marks: 3, strand: `S${i}` })),
    ]
    const res = assembleExam(candidates, bp(10, [{ band: 1 }, { band: 4 }]), { calculatorMode: 'calc', rng: firstRng })
    // 1 + 3 + 3 + 3 = 10: the unspent easy budget financed an extra hard question.
    expect(res.totalMarks).toBe(10)
  })

  it('reports the shortfall when the pool cannot fill the budget', () => {
    const res = assembleExam([cand('only', 2, { marks: 2 })], bp(20, [{ band: 2 }]), { calculatorMode: 'calc', rng: firstRng })
    expect(res.totalMarks).toBe(2)
    expect(res.shortfall.marks).toBe(18)
    expect(res.shortfall.bands[0]).toMatchObject({ band: 2, got: 2 })
  })

  it('reports a synthesis shortfall separately — the content signal', () => {
    // The blueprint wants exam-kind marks; the pool has none, so it relaxes to
    // mastery and the paper still assembles, but the gap must be visible.
    const candidates = Array.from({ length: 10 }, (_, i) => cand(`m${i}`, 4, { marks: 2, kind: 'mastery', strand: `S${i}` }))
    const res = assembleExam(candidates, bp(10, [{ band: 4, preferKind: 'exam' }]), { calculatorMode: 'calc', rng: firstRng })
    expect(res.totalMarks).toBe(10)      // the paper is full…
    expect(res.shortfall.marks).toBe(0)
    expect(res.shortfall.kind).toBe(10)  // …but none of it is synthesis
  })

  it('reports no shortfall when the blueprint is met', () => {
    const candidates = Array.from({ length: 10 }, (_, i) => cand(`e${i}`, 4, { marks: 2, kind: 'exam', strand: `S${i}` }))
    const res = assembleExam(candidates, bp(10, [{ band: 4, preferKind: 'exam' }]), { calculatorMode: 'calc', rng: firstRng })
    expect(res.shortfall.marks).toBe(0)
    expect(res.shortfall.kind).toBe(0)
  })

  it('produces varied papers, not the same best-fit paper every time', () => {
    // Best-fit selection would hit the target exactly but return one paper
    // forever; structural variation is what a student actually notices.
    const candidates = Array.from({ length: 40 }, (_, i) => cand(`q${i}`, 2, { marks: 2, strand: `S${i % 5}` }))
    const papers = new Set<string>()
    for (let i = 0; i < 20; i++) {
      papers.add(assembleExam(candidates, bp(10, [{ band: 2 }]), { calculatorMode: 'calc' }).questionIds.join(','))
    }
    expect(papers.size).toBeGreaterThan(1)
  })

  it('keeps the difficulty ramp: easy bands buy less of the paper than hard ones', () => {
    const candidates = [1, 2, 3, 4].flatMap(band =>
      Array.from({ length: 10 }, (_, i) => cand(`b${band}q${i}`, band, { marks: 1, strand: `S${band}${i}` })))
    const res = assembleExam(candidates, {
      targetMarks: 20, tolerance: 0,
      bands: [{ band: 1, share: 0.1 }, { band: 2, share: 0.2 }, { band: 3, share: 0.3 }, { band: 4, share: 0.4 }],
    }, { calculatorMode: 'calc', rng: firstRng })
    const perBand = [1, 2, 3, 4].map(b => res.questionIds.filter(id => id.startsWith(`b${b}`)).length)
    expect(perBand).toEqual([2, 4, 6, 8]) // 10/20/30/40% of 20 marks at 1 mark each
  })
})

describe('assembleExam', () => {
  it('never puts a calc question on a non-calc paper', () => {
    const candidates = [
      cand('c1', 2, { calculator: 'calc' }),
      cand('c2', 2, { calculator: 'non_calc' }),
      cand('c3', 2, { calculator: 'na' }),
    ]
    const blueprint = bp(2, [{ band: 2 }])
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'non_calc', rng: firstRng })
    expect(res.questionIds).not.toContain('c1')
    expect(res.questionIds).toHaveLength(2)
  })

  it('allows any calculator tag on a calc paper', () => {
    const candidates = [
      cand('c1', 2, { calculator: 'calc', strand: 'A' }),
      cand('c2', 2, { calculator: 'non_calc', strand: 'B' }),
    ]
    const blueprint = bp(2, [{ band: 2 }])
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds.sort()).toEqual(['c1', 'c2'])
  })

  it('matches the requested difficulty band when candidates exist', () => {
    const candidates = [cand('easy', 1), cand('hard', 4)]
    const res = assembleExam(candidates, bp(1, [{ band: 4 }]), { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['hard'])
  })

  it('relaxes an exam-kind slot to mastery when no exam question is available', () => {
    const candidates = [cand('m', 4, { kind: 'mastery' })]
    const res = assembleExam(candidates, bp(1, [{ band: 4, preferKind: 'exam' }]), { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['m']) // fell back to the mastery question
  })

  it('prefers an exam-kind question for an exam slot when one exists', () => {
    const candidates = [
      cand('m', 4, { kind: 'mastery', strand: 'A' }),
      cand('e', 4, { kind: 'exam', strand: 'B' }),
    ]
    const res = assembleExam(candidates, bp(1, [{ band: 4, preferKind: 'exam' }]), { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['e'])
  })

  it('relaxes to an adjacent band when the exact band is empty', () => {
    const candidates = [cand('b3', 3)]
    const res = assembleExam(candidates, bp(1, [{ band: 4 }]), { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['b3'])
  })

  it('never repeats a question and honours the exclude set', () => {
    const candidates = [cand('a', 2, { strand: 'A' }), cand('b', 2, { strand: 'B' }), cand('c', 2, { strand: 'C' })]
    const blueprint = bp(3, [{ band: 2 }])
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', exclude: new Set(['a']), rng: firstRng })
    expect(res.questionIds).not.toContain('a')
    expect(new Set(res.questionIds).size).toBe(res.questionIds.length) // no dupes
    expect(res.questionIds).toHaveLength(2) // only b, c eligible
  })

  it('sums marks across the assembled paper', () => {
    const candidates = [cand('a', 1, { marks: 1 }), cand('b', 3, { marks: 2 }), cand('c', 4, { marks: 3 })]
    const blueprint = bp(6, [{ band: 1 }, { band: 3 }, { band: 4 }])
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
    const blueprint = bp(2, [{ band: 2 }])
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toContain('a1') // the distinct strand is always included
  })

  it('drops candidates touching a blocked (Higher-only) skill from a Foundation paper', () => {
    const candidates = [
      cand('found', 2, { skillIds: ['ratio'], strand: 'A' }),
      cand('mixed', 2, { skillIds: ['ratio', 'surds_simplifying'], strand: 'B' }),
      cand('high', 2, { skillIds: ['surds_simplifying'], strand: 'C' }),
    ]
    const blueprint = bp(3, [{ band: 2 }])
    const res = assembleExam(candidates, blueprint, {
      calculatorMode: 'calc',
      blockedSkillIds: new Set(['surds_simplifying']),
      rng: firstRng,
    })
    expect(res.questionIds).toEqual(['found']) // mixed & high both touch a blocked skill
  })

  it('skips a slot (shorter paper) rather than failing when the pool is exhausted', () => {
    const candidates = [cand('only', 2)]
    const blueprint = bp(2, [{ band: 2 }])
    const res = assembleExam(candidates, blueprint, { calculatorMode: 'calc', rng: firstRng })
    expect(res.questionIds).toEqual(['only'])
  })
})

describe('candidateOf', () => {
  const base = { id: 'q', skill_ids: ['simple_arithmetic'], difficulty: 2, calculator: 'na', kind: 'mastery', question_type: 'numeric', parts: null }

  it('admits multiple-choice questions, priced at one mark', () => {
    // Real papers carry MC — 22 parts / 30 marks across the coded 2024 series,
    // 17 of them worth exactly 1. Picking from a list shows no working, so
    // there is no method to credit and nothing to build a bigger scheme on.
    const c = candidateOf({ ...base, question_type: 'multiple_choice' })
    expect(c).not.toBeNull()
    expect(c!.marks).toBe(1)
  })

  it('lets an author override the multiple-choice default', () => {
    const c = candidateOf({ ...base, question_type: 'multiple_choice', marks: 2 })
    expect(c!.marks).toBe(2)
  })

  it('uses nominal marks for single-part questions by difficulty', () => {
    // These come from lib/exam/markEvidence.data.ts, so they move when a new
    // series is coded. Coding the 2023 papers lifted the mid-difficulty value
    // from 2 to 3 (mastery mean 1.74 -> 1.87 across 30 papers). What the test
    // pins is the ramp, not the literals: marks must not fall as difficulty rises.
    const seq = [1, 3, 4].map(d => candidateOf({ ...base, difficulty: d })!.marks)
    expect(seq).toEqual([1, 3, 3])
    for (let i = 1; i < seq.length; i++) expect(seq[i]).toBeGreaterThanOrEqual(seq[i - 1])
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
