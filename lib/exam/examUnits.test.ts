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

  it('still takes the accuracy mark for a real unit left off', () => {
    const item = buildItem(row('area', '{{a}} cm²'), 1, DRAW)
    expect(gradeUnits([item], { 'area:0': '20 cm²' }).earned).toBe(2)
    expect(gradeUnits([item], { 'area:0': '20' }).earned).toBe(1)
  })
})
