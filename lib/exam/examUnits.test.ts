import { describe, it, expect } from 'vitest'
import { buildItem, gradeUnits, type QuestionRow } from './examPaper'

/**
 * Units on a mini-exam: which omissions cost the accuracy mark.
 *
 * A missing unit costs that mark, as on a real scheme. A missing % does NOT:
 * GCSE percentage questions print the % on the answer line, so "20" for "20%"
 * is the whole answer. It used to lose a mark here.
 */
const row = (id: string, answer: string): QuestionRow => ({
  id,
  skill_ids: ['percentage_change'],
  difficulty: 3,
  calculator: 'non_calc',
  kind: 'mastery',
  marks: 2,
  question_type: 'numeric',
  question_template: 'Work it out.',
  answer_template: answer,
  answer_type: 'numeric',
  tolerance: 0.01,
  requires_simplest: false,
  traps: [],
  explanation: '',
  image_url: null,
  parameters: { a: { type: 'integer', min: 20, max: 20 } } as never,
  parts: null,
  mc_options: null,
})

const DRAW = { a: 20 }

describe('units on a mini-exam', () => {
  it('gives full marks to a percentage written without its %', () => {
    const item = buildItem(row('pct', '{{a}}%'), 1, DRAW)
    expect(gradeUnits([item], { 'pct:0': '20' }).earned).toBe(2)
    expect(gradeUnits([item], { 'pct:0': '20%' }).earned).toBe(2)
  })

  it('gives full marks to an amount of money written without its £', () => {
    // Money questions print the £ on the answer line, as percentages print %.
    const item = buildItem(row('gbp', '£{{a}}'), 1, DRAW)
    expect(gradeUnits([item], { 'gbp:0': '20' }).earned).toBe(2)
    expect(gradeUnits([item], { 'gbp:0': '£20' }).earned).toBe(2)
  })

  it('still takes the accuracy mark for a real unit left off', () => {
    const item = buildItem(row('area', '{{a}} cm²'), 1, DRAW)
    expect(gradeUnits([item], { 'area:0': '20 cm²' }).earned).toBe(2)
    expect(gradeUnits([item], { 'area:0': '20' }).earned).toBe(1)
  })
})

/**
 * The same rule on a multi_blank part, which is graded on its own path
 * (gradeBlankGroup) and used to pay a unit slip in full.
 */
describe('units on a multi_blank mini-exam part', () => {
  // A in cm, worth 2; B = A + 10 in cm, worth 2, with follow-through.
  const multi = (bands?: { min_correct: number; marks: number }[]): QuestionRow => ({
    ...row('mb', ''),
    question_type: 'multi_blank',
    answer_type: 'multi_blank' as never,
    parts: [{
      prompt: 'Find both lengths.',
      skill_ids: ['percentage_change'],
      answer_template: '',
      answer_type: 'multi_blank',
      tolerance: null,
      requires_simplest: false,
      traps: [],
      marks: 4,
      kind: 'mastery',
      explanation: '',
      ...(bands ? { mark_bands: bands } : {}),
      blanks: [
        { label: 'A', prompt: 'A', answer_template: '{{a}} cm', answer_type: 'numeric', tolerance: 0.01, requires_simplest: false, traps: [], marks: 2 },
        { label: 'B', prompt: 'B', answer_template: '{{a+10}} cm', answer_type: 'numeric', tolerance: 0.01, requires_simplest: false, traps: [], marks: 2, ecf_template: '[[A]] + 10' },
      ],
    }] as never,
  })
  const grade = (answers: [string, string], q = multi()) => {
    const g = gradeUnits([buildItem(q, 1, DRAW)], { 'mb:0:0': answers[0], 'mb:0:1': answers[1] })
    return { earned: g.earned, a: g.results['mb:0:0'], b: g.results['mb:0:1'] }
  }

  it('pays both blanks in full with their units', () => {
    expect(grade(['20 cm', '30 cm']).earned).toBe(4)
  })

  it('takes only the accuracy mark from a blank with its unit left off', () => {
    const { earned, a, b } = grade(['20', '30 cm'])
    expect(a.correct).toBe(true) // still right for the skill map
    expect(a.marksEarned).toBe(1)
    expect(b.marksEarned).toBe(2)
    expect(earned).toBe(3)
  })

  it('takes only the accuracy mark from a blank in the wrong unit', () => {
    const { a } = grade(['20 mm', '30 cm'])
    expect(a.correct).toBe(true)
    expect(a.marksEarned).toBe(1)
  })

  it('takes the accuracy mark from a follow-through with its unit left off', () => {
    // A is wrong (21, bare), B follows through to 31 — also bare.
    const { earned, b } = grade(['21', '31'])
    expect(b.correct).toBe(true)
    expect(b.message).toMatch(/following through.*write the units/)
    expect(b.marksEarned).toBe(1)
    expect(earned).toBe(1)
  })

  it('pays a follow-through with its unit in full', () => {
    const { b } = grade(['21', '31 cm'])
    expect(b.message).toBe('Correct, following through from your earlier answer.')
    expect(b.marksEarned).toBe(2)
  })

  it('follows through when both blanks carry their units, as a student is told to write them', () => {
    // The common case: A wrong but written properly ("21 cm"). It used to
    // switch follow-through off, so B scored 0 confirmed instead of 2.
    const { earned, b } = grade(['21 cm', '31 cm'])
    expect(b.correct).toBe(true)
    expect(b.followThrough).toBe(true)
    expect(b.marksEarned).toBe(2)
    expect(earned).toBe(2)
  })

  it('leaves a banded part alone — the band prices the count of right blanks', () => {
    const banded = multi([{ min_correct: 1, marks: 1 }, { min_correct: 2, marks: 4 }])
    expect(grade(['20', '30'], banded).earned).toBe(4)
  })
})
