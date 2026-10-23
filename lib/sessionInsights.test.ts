import { describe, it, expect } from 'vitest'
import {
  sessionInsights, questionInsights, skillInsights,
  MIN_ATTEMPTS_TO_RANK,
  type QuestionMeta, type AttemptFact,
} from './sessionInsights'

const q = (id: string, template: string, skill_ids: string[]): QuestionMeta =>
  ({ id, question_template: template, skill_ids })

const metaOf = (...qs: QuestionMeta[]) => new Map(qs.map(x => [x.id, x]))

/** n attempts at `id`, `wrong` of them incorrect. */
function tries(id: string, n: number, wrong: number): AttemptFact[] {
  return Array.from({ length: n }, (_, i) => ({ question_id: id, correct: i >= wrong }))
}

describe('questionInsights', () => {
  // Templates in the shape the bank actually stores them: HTML, {{ }} params.
  const meta = metaOf(
    q('q1', '<p>Simplify {{a}}:{{b}}</p>', ['simplifying_ratio']),
    q('q2', '<p>Work out {{a}}% of {{b}}</p>', ['percentages']),
    q('q3', '<p>Expand {{a}}({{b}}x + {{c}})</p>', ['expanding']),
  )

  it('ranks by how many pupils got it wrong, not by percentage', () => {
    // q1: 6 of 9 wrong (67%). q2: 2 of 2 wrong (100%).
    // The percentage flatters q2, but q1 is six people.
    const out = questionInsights([...tries('q1', 9, 6), ...tries('q2', 2, 2)], meta)
    expect(out.map(r => r.questionId)).toEqual(['q1', 'q2'])
    expect(out[0]).toMatchObject({ attempted: 9, wrong: 6, pctWrong: 67 })
  })

  it('breaks a tie on count with the higher percentage', () => {
    // Both 3 wrong; q2 had fewer pupils reach it, so a larger share failed.
    const out = questionInsights([...tries('q1', 10, 3), ...tries('q2', 4, 3)], meta)
    expect(out.map(r => r.questionId)).toEqual(['q2', 'q1'])
  })

  it('leaves out questions nobody got wrong', () => {
    const out = questionInsights([...tries('q1', 5, 0), ...tries('q2', 5, 2)], meta)
    expect(out.map(r => r.questionId)).toEqual(['q2'])
  })

  it(`needs ${MIN_ATTEMPTS_TO_RANK} attempts before calling a question hard`, () => {
    // One pupil, one wrong answer, is not a class problem.
    expect(questionInsights(tries('q1', 1, 1), meta)).toEqual([])
    expect(questionInsights(tries('q1', 2, 1), meta)).toHaveLength(1)
  })

  it('says so when the question text has gone, rather than printing a uuid', () => {
    const out = questionInsights(tries('deleted-id', 3, 2), meta)
    expect(out[0].prompt).toBe('Question no longer available')
    expect(out[0].wrong).toBe(2)
  })

  it('shows a prompt a teacher can read, not markup', () => {
    const out = questionInsights(tries('q1', 4, 3), meta)
    expect(out[0].prompt).toBe('Simplify […]:[…]')
  })

  it('strips a diagram rather than spilling its labels into the prompt', () => {
    const withSvg = metaOf(q('qd', '<p>Find angle x</p><svg><text>58</text></svg>', ['angles']))
    const out = questionInsights(tries('qd', 3, 2), withSvg)
    expect(out[0].prompt).toBe('Find angle x [diagram]')
  })

  it('is empty for a session where nothing has been answered', () => {
    expect(questionInsights([], meta)).toEqual([])
  })

  it('orders identically for identical input, so a 10s poll does not reshuffle', () => {
    const attempts = [...tries('q1', 4, 2), ...tries('q2', 4, 2), ...tries('q3', 4, 2)]
    const a = questionInsights(attempts, meta).map(r => r.questionId)
    const b = questionInsights([...attempts].reverse(), meta).map(r => r.questionId)
    expect(a).toEqual(b)
  })
})

describe('skillInsights', () => {
  const meta = metaOf(
    q('q1', 'a', ['simplifying_ratio']),
    q('q2', 'b', ['percentages']),
    q('q3', 'c', ['simplifying_ratio', 'percentages']),   // carries both
  )
  const chosen = ['simplifying_ratio', 'percentages']

  it('reports accuracy per chosen skill, weakest first', () => {
    const out = skillInsights(
      [...tries('q1', 4, 3), ...tries('q2', 4, 1)],   // ratio 25%, percentages 75%
      meta, chosen,
    )
    expect(out).toEqual([
      { skillId: 'simplifying_ratio', attempted: 4, correct: 1, pctCorrect: 25 },
      { skillId: 'percentages',       attempted: 4, correct: 3, pctCorrect: 75 },
    ])
  })

  it('counts a two-skill question under both, rather than splitting it', () => {
    const out = skillInsights(tries('q3', 2, 1), meta, chosen)
    expect(out.every(s => s.attempted === 2)).toBe(true)
    // And so the per-skill attempts total MORE than the attempts made. That is
    // the documented consequence, not a bug.
    expect(out.reduce((n, s) => n + s.attempted, 0)).toBe(4)
  })

  it('omits skills nobody has reached yet', () => {
    const out = skillInsights(tries('q1', 2, 1), meta, [...chosen, 'untouched_skill'])
    expect(out.map(s => s.skillId)).toEqual(['simplifying_ratio'])
  })

  it('falls back to a question\'s own skills when it matches none that were chosen', () => {
    // A session whose skill list was edited after questions had been served.
    const out = skillInsights(tries('q2', 2, 1), meta, ['something_else'])
    expect(out.map(s => s.skillId)).toEqual(['percentages'])
  })

  it('ignores an attempt whose question it knows nothing about', () => {
    expect(skillInsights(tries('ghost', 3, 2), meta, chosen)).toEqual([])
  })

  it('puts the skill with more evidence first when the percentages tie', () => {
    const out = skillInsights(
      [...tries('q1', 2, 1), ...tries('q2', 8, 4)],   // both 50%
      meta, chosen,
    )
    expect(out.map(s => s.skillId)).toEqual(['percentages', 'simplifying_ratio'])
  })
})

describe('sessionInsights', () => {
  it('builds both views from one set of attempts', () => {
    const out = sessionInsights(
      [...tries('q1', 6, 4), ...tries('q2', 6, 1)],
      [
        q('q1', '<p>Simplify {{a}}:{{b}}</p>', ['simplifying_ratio']),
        q('q2', '<p>Find {{a}}%</p>', ['percentages']),
      ],
      ['simplifying_ratio', 'percentages'],
    )
    expect(out.questions[0]).toMatchObject({ prompt: 'Simplify […]:[…]', wrong: 4 })
    expect(out.skills[0]).toMatchObject({ skillId: 'simplifying_ratio', pctCorrect: 33 })
  })

  it('is empty all round before anyone answers', () => {
    expect(sessionInsights([], [], ['percentages'])).toEqual({ questions: [], skills: [] })
  })
})
