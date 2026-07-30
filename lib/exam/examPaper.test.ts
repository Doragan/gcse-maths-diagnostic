import { describe, it, expect } from 'vitest'
import { buildItem, gradeUnits, type QuestionRow } from './examPaper'

/**
 * A two-blank part where B follows from A: B = A + 10. A student who gets A
 * wrong but adds 10 to their own A has earned the method mark (ecf).
 */
const ecfQuestion: QuestionRow = {
  id: 'q1',
  skill_ids: ['simple_arithmetic'],
  difficulty: 2,
  calculator: 'na',
  kind: 'mastery',
  marks: null,
  question_type: 'numeric',
  question_template: 'Start with {{n}}.',
  answer_template: '',
  answer_type: 'numeric',
  tolerance: null,
  requires_simplest: false,
  traps: [],
  explanation: '',
  image_url: null,
  parameters: { n: { type: 'integer', min: 2, max: 9 } } as any,
  parts: [{
    prompt: 'Fill in A and B.',
    skill_ids: ['simple_arithmetic'],
    answer_template: '',
    answer_type: 'multi_blank',
    tolerance: null,
    requires_simplest: false,
    traps: [],
    marks: 2,
    kind: 'mastery',
    explanation: '',
    blanks: [
      { label: 'A', prompt: 'double it', answer_template: '{{n*2}}', answer_type: 'numeric', tolerance: null, requires_simplest: false, traps: [], marks: 1 },
      { label: 'B', prompt: 'add ten', answer_template: '{{n*2+10}}', answer_type: 'numeric', tolerance: null, requires_simplest: false, traps: [], marks: 1, ecf_template: '[[A]] + 10' },
    ],
  }] as any,
}

/** The same shape, but priced by a banded scheme instead of per blank. */
const bandedQuestion: QuestionRow = {
  ...ecfQuestion,
  id: 'q2',
  parts: [{
    ...(ecfQuestion.parts as any)[0],
    // 3 marks all correct / 2 for all-but-one / 1 for any (ecf counts).
    mark_bands: [
      { min_correct: 1, marks: 1 },
      { min_correct: 2, marks: 3 },
    ],
  }] as any,
}

const keyA = 'q1:0:0'
const keyB = 'q1:0:1'

describe('multi_blank in exam mode — errors carried forward', () => {
  it('credits a blank that follows through from the student\'s own wrong answer', () => {
    const items = [buildItem(ecfQuestion, 1, { n: 5 })] // A = 10, B = 20
    // A is wrong (9), but B = 9 + 10 = 19 follows through correctly.
    const { results, earned } = gradeUnits(items, { [keyA]: '9', [keyB]: '19' })
    expect(results[keyA].correct).toBe(false)
    expect(results[keyB].correct).toBe(true)
    expect(results[keyB].followThrough).toBe(true)
    expect(earned).toBe(1) // the follow-through blank earned its own mark
  })

  it('does not credit a blank that is simply wrong', () => {
    const items = [buildItem(ecfQuestion, 1, { n: 5 })]
    const { results, earned } = gradeUnits(items, { [keyA]: '9', [keyB]: '99' })
    expect(results[keyB].correct).toBe(false)
    expect(earned).toBe(0)
  })

  it('marks both right when both are right, with no follow-through flag', () => {
    const items = [buildItem(ecfQuestion, 1, { n: 5 })]
    const { results, earned } = gradeUnits(items, { [keyA]: '10', [keyB]: '20' })
    expect(results[keyA].correct).toBe(true)
    expect(results[keyB].correct).toBe(true)
    expect(results[keyB].followThrough).toBeUndefined()
    expect(earned).toBe(2)
  })

  it('reports an unanswered blank rather than dropping it', () => {
    const items = [buildItem(ecfQuestion, 1, { n: 5 })]
    const { results, earned } = gradeUnits(items, { [keyA]: '10' })
    expect(results[keyB].message).toBe('Not answered.')
    expect(results[keyB].marksEarned).toBe(0)
    expect(earned).toBe(1)
  })
})

describe('multi_blank in exam mode — banded marks', () => {
  const k = (b: number) => `q2:0:${b}`

  it('prices the part by how many blanks are right, not one mark each', () => {
    const items = [buildItem(bandedQuestion, 1, { n: 5 })]
    expect(items[0].marks).toBe(3) // the band maximum, not the blank sum (2)
    const { earned } = gradeUnits(items, { [k(0)]: '10', [k(1)]: '20' })
    expect(earned).toBe(3)
  })

  it('awards the lower band when only some blanks are right', () => {
    const items = [buildItem(bandedQuestion, 1, { n: 5 })]
    const { earned } = gradeUnits(items, { [k(0)]: '10', [k(1)]: '99' })
    expect(earned).toBe(1)
  })

  it('awards nothing when no blank is right', () => {
    const items = [buildItem(bandedQuestion, 1, { n: 5 })]
    const { earned } = gradeUnits(items, { [k(0)]: '99', [k(1)]: '98' })
    expect(earned).toBe(0)
  })

  it('counts a follow-through blank toward the band — that is what (ecf) means', () => {
    const items = [buildItem(bandedQuestion, 1, { n: 5 })]
    // A wrong, B follows through: 1 of 2 correct → the 1-mark band.
    const { earned, results } = gradeUnits(items, { [k(0)]: '9', [k(1)]: '19' })
    expect(results[k(1)].followThrough).toBe(true)
    expect(earned).toBe(1)
  })

  it('puts the part\'s marks on one unit so the total cannot double-count', () => {
    const items = [buildItem(bandedQuestion, 1, { n: 5 })]
    const { results } = gradeUnits(items, { [k(0)]: '10', [k(1)]: '20' })
    expect(results[k(0)].marksEarned).toBe(3)
    expect(results[k(1)].marksEarned).toBe(0)
    expect(items[0].units[1].marks).toBe(0)
  })
})
