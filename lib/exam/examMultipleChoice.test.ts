import { describe, it, expect } from 'vitest'
import { buildItem, gradeUnits, type QuestionRow } from './examPaper'

/**
 * Multiple choice on a mini-exam.
 *
 * The load-bearing property is REPRODUCIBILITY. A stored paper keeps only the
 * question id, the parameter draw and the raw answer; everything else is
 * re-derived on re-open. If the option order were random, the third option in
 * the review would not be the third option that was sat.
 */
const mcQuestion: QuestionRow = {
  id: 'mc1',
  skill_ids: ['exact_trig_values'],
  difficulty: 2,
  calculator: 'non_calc',
  kind: 'mastery',
  marks: null,
  question_type: 'multiple_choice',
  question_template: 'What is {{a}} × 2?',
  answer_template: '{{a*2}}',
  answer_type: 'numeric',
  tolerance: null,
  requires_simplest: false,
  traps: [
    { answer_template: '{{a+2}}', response: 'You added.' },
    { answer_template: '{{a}}', response: 'That is the original.' },
  ],
  explanation: 'Double it.',
  image_url: null,
  parameters: { a: { type: 'integer', min: 3, max: 9 } } as never,
  parts: null,
  mc_options: null,
}

const FIXED = { a: 7 }

describe('multiple choice in a mini-exam', () => {
  it('offers options rather than a typed box', () => {
    const item = buildItem(mcQuestion, 1, FIXED)
    const unit = item.units[0]
    expect(unit.options).toBeDefined()
    expect(unit.options!.length).toBeGreaterThanOrEqual(2)
    expect(unit.options).toContain('14')
  })

  it('presents the SAME order every time the paper is rebuilt', () => {
    // This is what makes a stored paper re-openable. Built twice from the same
    // id and draw — as the live runner and the re-review page each do.
    const a = buildItem(mcQuestion, 1, FIXED).units[0].options
    const b = buildItem(mcQuestion, 1, FIXED).units[0].options
    expect(a).toEqual(b)
  })

  it('varies the order between DIFFERENT draws of the same question', () => {
    // Otherwise the position of the answer becomes learnable across papers.
    // Compared across several draws because two orders can coincide by chance.
    const orders = [3, 4, 5, 6, 8, 9]
      .map(a => buildItem(mcQuestion, 1, { a }).units[0].options!.join('|'))
    expect(new Set(orders).size).toBeGreaterThan(1)
  })

  it('is worth one mark, and can never earn method marks', () => {
    // Ticking a box shows no working, so there is nothing to award method for —
    // and a 1-mark unit is excluded from the three-state model anyway.
    const item = buildItem(mcQuestion, 1, FIXED)
    expect(item.marks).toBe(1)
    const { earned, unknown } = gradeUnits([item], { 'mc1:0': '9' })
    expect(earned).toBe(0)
    expect(unknown).toBe(0)
  })

  it('grades the chosen option text through the normal checker', () => {
    const item = buildItem(mcQuestion, 1, FIXED)
    expect(gradeUnits([item], { 'mc1:0': '14' }).earned).toBe(1)
    expect(gradeUnits([item], { 'mc1:0': '9' }).earned).toBe(0)
  })

  it('still fires trap feedback on a wrong pick', () => {
    const item = buildItem(mcQuestion, 1, FIXED)
    const { results } = gradeUnits([item], { 'mc1:0': '9' }) // a + 2
    expect(results['mc1:0'].message).toContain('added')
  })

  it('leaves a non-MC question with no options at all', () => {
    const typed = buildItem({ ...mcQuestion, question_type: 'numeric' }, 1, FIXED)
    expect(typed.units[0].options).toBeUndefined()
  })

  it('uses the author\'s explicit options when given', () => {
    const explicit = buildItem(
      { ...mcQuestion, mc_options: ['{{a*2}}', 'none of these', 'not enough information'] },
      1, FIXED,
    )
    expect(explicit.units[0].options).toContain('none of these')
    expect(explicit.units[0].options).toContain('14')
  })
})
