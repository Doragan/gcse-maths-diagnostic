import { describe, it, expect } from 'vitest'
import { buildItem, gradeUnits, type QuestionRow } from './examPaper'
import { buildPaperSnapshot, rehydratePaper, parsePaperSnapshot } from './examSession'

// A single-part parametric question: "Calculate a × b".
const q1: QuestionRow = {
  id: 'q1',
  skill_ids: ['simple_arithmetic'],
  difficulty: 1,
  calculator: 'na',
  kind: 'mastery',
  question_type: 'numeric',
  parts: null,
  question_template: 'Calculate {{a}} × {{b}}',
  answer_template: '{{a*b}}',
  answer_type: 'numeric',
  tolerance: null,
  requires_simplest: false,
  traps: [],
  explanation: 'Multiply them.',
  image_url: null,
  parameters: { a: { type: 'integer', min: 2, max: 9 }, b: { type: 'integer', min: 2, max: 9 } } as any,
}

// A two-part question, to check per-part unit keys survive the round trip.
const q2: QuestionRow = {
  id: 'q2',
  skill_ids: ['simple_arithmetic'],
  difficulty: 2,
  calculator: 'na',
  kind: 'mastery',
  question_type: 'numeric',
  question_template: 'A shop sells {{n}} pens.',
  answer_template: '',
  answer_type: 'numeric',
  tolerance: null,
  requires_simplest: false,
  traps: [],
  explanation: '',
  image_url: null,
  parameters: { n: { type: 'integer', min: 2, max: 9 } } as any,
  parts: [
    { prompt: 'Double it.', skill_ids: ['simple_arithmetic'], answer_template: '{{n*2}}', answer_type: 'numeric', tolerance: null, requires_simplest: false, traps: [], marks: 1, kind: 'mastery', explanation: '' },
    { prompt: 'Add ten.',  skill_ids: ['simple_arithmetic'], answer_template: '{{n+10}}', answer_type: 'numeric', tolerance: null, requires_simplest: false, traps: [], marks: 1, kind: 'mastery', explanation: '' },
  ] as any,
}

const byId = new Map<string, QuestionRow>([['q1', q1], ['q2', q2]])

describe('buildPaperSnapshot + rehydratePaper', () => {
  it('round-trips a sat paper: same questions, answers, results and score', () => {
    const items = [buildItem(q1, 1, { a: 11, b: 3 })]
    const answers = { 'q1:0': '33' }
    const live = gradeUnits(items, answers)

    const snap = buildPaperSnapshot(items, answers)
    const back = rehydratePaper(snap, byId)

    expect(back.items[0].headerHtml).toBe(items[0].headerHtml)
    expect(back.items[0].units[0].correctAnswer).toBe(items[0].units[0].correctAnswer)
    expect(back.earned).toBe(live.earned)
    expect(back.results['q1:0'].correct).toBe(true)
    expect(back.results['q1:0'].studentAnswer).toBe('33')
    expect(back.missingQuestionIds).toEqual([])
  })

  it('THE POINT: the stored params pin the draw, so the same numbers come back', () => {
    const snap = buildPaperSnapshot([buildItem(q1, 1, { a: 11, b: 3 })], { 'q1:0': '33' })
    expect(snap.questions[0].params).toEqual({ a: 11, b: 3 })

    const back = rehydratePaper(snap, byId)
    expect(back.items[0].headerHtml).toContain('11')
    expect(back.items[0].headerHtml).toContain('3')
    expect(back.items[0].units[0].correctAnswer).toBe('33')
    // A different draw would have produced different numbers entirely.
    const other = rehydratePaper({ ...snap, questions: [{ id: 'q1', params: { a: 4, b: 5 } }] }, byId)
    expect(other.items[0].units[0].correctAnswer).toBe('20')
  })

  it('a wrong answer re-grades as wrong, with the marks it earned', () => {
    const items = [buildItem(q1, 1, { a: 11, b: 3 })]
    const snap = buildPaperSnapshot(items, { 'q1:0': '32' })
    const back = rehydratePaper(snap, byId)
    expect(back.results['q1:0'].correct).toBe(false)
    expect(back.results['q1:0'].studentAnswer).toBe('32')
    expect(back.results['q1:0'].correctAnswer).toBe('33')
    expect(back.earned).toBe(0)
  })

  it('blank answers are not stored, and re-hydrate as "Not answered"', () => {
    const items = [buildItem(q1, 1, { a: 11, b: 3 })]
    const snap = buildPaperSnapshot(items, { 'q1:0': '   ' })
    expect(snap.answers).toEqual({})

    const back = rehydratePaper(snap, byId)
    expect(back.results['q1:0'].message).toBe('Not answered.')
    expect(back.results['q1:0'].marksEarned).toBe(0)
  })

  it('multi-part unit keys survive, per part', () => {
    const items = [buildItem(q2, 1, { n: 6 })]
    const answers = { 'q2:0': '12', 'q2:1': '99' }
    const back = rehydratePaper(buildPaperSnapshot(items, answers), byId)
    expect(back.results['q2:0'].correct).toBe(true)   // 6 × 2
    expect(back.results['q2:1'].correct).toBe(false)  // 6 + 10 = 16, not 99
    expect(back.earned).toBe(1)
  })

  it('a question that no longer exists is skipped, and numbering does not shift', () => {
    const items = [buildItem(q1, 1, { a: 11, b: 3 }), buildItem(q2, 2, { n: 6 })]
    const snap = buildPaperSnapshot(items, { 'q1:0': '33', 'q2:0': '12' })
    // q1 has since been deleted/unpublished.
    const back = rehydratePaper(snap, new Map([['q2', q2]]))

    expect(back.missingQuestionIds).toEqual(['q1'])
    expect(back.items).toHaveLength(1)
    // The surviving question keeps the number the student sat it under.
    expect(back.items[0].number).toBe(2)
    expect(back.results['q2:0'].correct).toBe(true)
  })
})

describe('parsePaperSnapshot', () => {
  it('accepts a well-formed snapshot', () => {
    const snap = parsePaperSnapshot({ questions: [{ id: 'q1', params: { a: 2 } }], answers: { 'q1:0': '4' } })
    expect(snap).toEqual({ questions: [{ id: 'q1', params: { a: 2 } }], answers: { 'q1:0': '4' } })
  })

  it('rejects junk rather than crashing the page', () => {
    expect(parsePaperSnapshot(null)).toBeNull()
    expect(parsePaperSnapshot('nope')).toBeNull()
    expect(parsePaperSnapshot({})).toBeNull()
    expect(parsePaperSnapshot({ questions: [{ params: {} }] })).toBeNull() // no id
  })

  it('drops non-finite params and non-string answers', () => {
    const snap = parsePaperSnapshot({
      questions: [{ id: 'q1', params: { a: 2, bad: 'x', worse: null } }],
      answers: { good: '4', bad: 7 },
    })
    expect(snap!.questions[0].params).toEqual({ a: 2 })
    expect(snap!.answers).toEqual({ good: '4' })
  })
})
