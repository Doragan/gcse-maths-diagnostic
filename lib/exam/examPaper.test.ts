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

/**
 * Right value, not in simplest form, on a question that demanded it.
 *
 * 54ab9bbb (4 marks, P(exactly two red) without replacement): 180/504 for 5/14
 * proves the whole method — only the cancelling is missing — so an examiner
 * pays M3 and withholds the A1. It used to score like a blind wrong answer:
 * 0 confirmed, plus only the unknown share.
 */
describe('exam mode — right value left unsimplified', () => {
  const fractionQ = (over: Partial<QuestionRow> = {}): QuestionRow => ({
    id: 'qs',
    skill_ids: ['probability_without_replacement'],
    difficulty: 3,
    calculator: 'na',
    kind: 'mastery',
    marks: 4,
    question_type: 'fraction',
    question_template: 'Find P(exactly two red).',
    answer_template: '5/14',
    answer_type: 'fraction',
    tolerance: null,
    requires_simplest: true,
    // With replacement instead of without: a real slip, one method mark.
    traps: [{ answer_template: '25/98', response: 'You replaced the counter.', method_marks: 1 }],
    explanation: '',
    image_url: null,
    parameters: {} as never,
    parts: null,
    ...over,
  })
  const grade = (row: QuestionRow, answer: string) => {
    const g = gradeUnits([buildItem(row, 1)], { [`${row.id}:0`]: answer })
    return { ...g, r: g.results[`${row.id}:0`] }
  }

  it('pays every method mark and withholds only the accuracy mark', () => {
    const { earned, unknown, r } = grade(fractionQ(), '180/504')
    expect(r.correct).toBe(false) // still wrong for practice and the skill map
    expect(r.message).toMatch(/simplest form/i)
    expect(earned).toBe(3)
    expect(r.marksEarned).toBe(3)
    expect(r.methodAwarded).toBe(3)
    // Confirmed, not a guess: nothing is left uncertain.
    expect(unknown).toBe(0)
    expect(r.marksUnknown).toBeUndefined()
  })

  it('still pays full marks for the simplified answer', () => {
    const { earned, unknown, r } = grade(fractionQ(), '5/14')
    expect(r.correct).toBe(true)
    expect(earned).toBe(4)
    expect(unknown).toBe(0)
  })

  it('pays nothing on a 1-mark part — the only mark is the simplified answer', () => {
    const { earned, unknown, r } = grade(fractionQ({ marks: 1 }), '180/504')
    expect(earned).toBe(0)
    expect(unknown).toBe(0)
    expect(r.methodAwarded).toBeUndefined()
  })

  it('pays full marks, with the reminder, where simplest form was not demanded', () => {
    const { earned, unknown, r } = grade(fractionQ({ requires_simplest: false }), '180/504')
    expect(r.correct).toBe(true)
    expect(r.message).toMatch(/simplif/i)
    expect(earned).toBe(4)
    expect(unknown).toBe(0)
  })

  it('pays a trap value given unsimplified its own method marks, not marks − 1', () => {
    // 50/196 is the with-replacement trap 25/98, uncancelled. The value is the
    // trap's, not the answer's, so the trap's verdict on the method stands.
    const { earned, unknown, r } = grade(fractionQ(), '50/196')
    expect(r.message).toBe('You replaced the counter.')
    expect(earned).toBe(1)
    expect(r.methodAwarded).toBe(1)
    expect(unknown).toBe(0)
  })

  it('treats an unsimplified ratio the same way', () => {
    const ratioQ = fractionQ({
      question_type: 'ratio', answer_type: 'ratio', answer_template: '2:3', marks: 3, traps: [],
    })
    const { earned, unknown, r } = grade(ratioQ, '24:36')
    expect(r.correct).toBe(false)
    expect(earned).toBe(2)
    expect(unknown).toBe(0)
  })

  it('applies to a multi_blank blank too', () => {
    const multi: QuestionRow = fractionQ({
      id: 'qm',
      question_type: 'multi_blank',
      answer_template: '',
      answer_type: 'multi_blank' as never,
      traps: [],
      parts: [{
        prompt: 'Fill in both.',
        skill_ids: ['probability_without_replacement'],
        answer_template: '',
        answer_type: 'multi_blank',
        tolerance: null,
        requires_simplest: true,
        traps: [],
        marks: 3,
        kind: 'mastery',
        explanation: '',
        blanks: [
          { label: 'A', prompt: 'P(two red)', answer_template: '5/14', answer_type: 'fraction', tolerance: null, requires_simplest: true, traps: [], marks: 2 },
          { label: 'B', prompt: 'P(none red)', answer_template: '1/14', answer_type: 'fraction', tolerance: null, requires_simplest: true, traps: [], marks: 1 },
        ],
      }] as never,
    })
    const { results, earned, unknown } = gradeUnits([buildItem(multi, 1)], { 'qm:0:0': '180/504', 'qm:0:1': '1/14' })
    expect(results['qm:0:0'].correct).toBe(false)
    expect(results['qm:0:0'].marksEarned).toBe(1) // 2-mark blank, accuracy withheld
    expect(results['qm:0:0'].methodAwarded).toBe(1)
    expect(earned).toBe(2)
    expect(unknown).toBe(0)
  })
})
