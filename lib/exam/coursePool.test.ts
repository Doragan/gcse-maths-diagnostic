import { describe, it, expect } from 'vitest'
import { coursePoolOptions } from './coursePool'
import { assembleExam, type Candidate } from './assembler'
import { BLUEPRINTS } from './blueprint'
import { courseFor, type Qualification, type CourseTier } from '../../data/courses'

// ─────────────────────────────────────────────────────────────────────────────
// What a mini-exam paper is allowed to contain. Two different mistakes live
// here, and the second is the reason this file exists at all: the rule used to
// be written inline in ExamRunner, a client component wired to Supabase and a
// monthly quota, where no test could reach it.
//
//   1. OFF-COURSE content was served, because the only filter was a tier one.
//   2. ON-COURSE content was withheld, because that tier filter was the GCSE
//      Higher-only list applied to both qualifications.
//
// (2) is the subtler one and cost real questions: venn_diagrams and
// upper_and_lower_bounds are Higher on GCSE and FOUNDATION on 4MA1, so an
// iGCSE Foundation student lost 10 of their 216 eligible questions.
// ─────────────────────────────────────────────────────────────────────────────

function cand(id: string, skillIds: string[], over: Partial<Candidate> = {}): Candidate {
  return {
    id, skillIds,
    difficulty: 2, calculator: 'na', kind: 'mastery', strand: 'Number',
    marks: 1, multiPart: false, ...over,
  }
}

/** Every id a (qualification, tier) paper served from this pool, over N draws. */
function servedOver(
  candidates: Candidate[],
  qualification: Qualification,
  tier: CourseTier,
  draws = 40,
): Set<string> {
  const served = new Set<string>()
  for (let i = 0; i < draws; i++) {
    for (const mode of ['calc', 'non_calc'] as const) {
      const res = assembleExam(candidates, BLUEPRINTS[tier], {
        calculatorMode: mode,
        ...coursePoolOptions(qualification, tier),
      })
      for (const id of res.questionIds) served.add(id)
    }
  }
  return served
}

describe('coursePoolOptions', () => {
  // Named by the SKILL they carry, so a failure reads as the content a student
  // did or did not get. Each is its own strand so nothing is crowded out by the
  // assembler's strand spreading.
  const bank = [
    cand('venn', ['venn_diagrams'], { strand: 'Probability' }),
    cand('bounds', ['upper_and_lower_bounds'], { strand: 'Number' }),
    cand('ratio', ['ratio'], { strand: 'Ratio' }),
    cand('sets', ['counting_elements_in_sets'], { strand: 'Sets' }),
    cand('iteration', ['iteration'], { strand: 'Algebra' }),
  ]

  it('lets an iGCSE Foundation paper draw on its own Foundation content', () => {
    // The regression this file was written for. Both of these are Foundation
    // content on 4MA1 (data/courses.ts, `igcseMovedToFoundation`), and the
    // mini-exam's GCSE-shaped block kept them out of every iGCSE Foundation
    // paper — 10 live questions, never once served.
    const served = servedOver(bank, 'igcse', 'foundation')
    expect(served, 'venn_diagrams is 4MA1 Foundation content').toContain('venn')
    expect(served, 'upper_and_lower_bounds is 4MA1 Foundation content').toContain('bounds')
  })

  it('keeps GCSE Higher-only content off a GCSE Foundation paper', () => {
    // The same two skills, the other way round: a skill's tier is a fact about
    // a COURSE, so what belongs on one Foundation paper is barred from another.
    const served = servedOver(bank, 'gcse', 'foundation')
    expect(served, 'venn_diagrams is Higher on GCSE').not.toContain('venn')
    expect(served, 'upper_and_lower_bounds is Higher on GCSE').not.toContain('bounds')
    expect(served, 'and the Foundation question is still served').toContain('ratio')
  })

  it('keeps each qualification off the other syllabus', () => {
    expect(servedOver(bank, 'gcse', 'higher'), 'set notation is 4MA1-only')
      .not.toContain('sets')
    expect(servedOver(bank, 'igcse', 'higher'), '4MA1 does not examine iteration')
      .not.toContain('iteration')
  })

  it('states the pool as the course, with nothing subtracted', () => {
    // Pins the shape of the options rather than just their effect: a block list
    // creeping back in is how (2) happened, and it would not necessarily show
    // up as a question going missing from the small bank above.
    for (const qualification of ['gcse', 'igcse'] as Qualification[]) {
      for (const tier of ['foundation', 'higher'] as CourseTier[]) {
        const opts = coursePoolOptions(qualification, tier)
        expect([...opts.allowedSkillIds].sort())
          .toEqual([...courseFor(qualification, tier).skills].sort())
        expect(Object.keys(opts), `${qualification} ${tier} options`)
          .toEqual(['allowedSkillIds'])
      }
    }
  })
})
