import { describe, it, expect } from 'vitest'
import { bareClaim, chainClaim, calcClaim, type SkillExamProfile, type BareBand } from './examProfile'

/** A profile with sensible defaults; override only what the test is about. */
function profile(over: Partial<SkillExamProfile> = {}): SkillExamProfile {
  return {
    skillId: 'proportion',
    board: 'AQA',
    tier: 'Foundation',
    parts: 24,
    marks: 65,
    papersSeen: 9,
    papersTotal: 9,
    markRange: [2, 5],
    framing: { real_world: 20, multi_route: 17, bare: 3 },
    barePct: 6,
    bareBand: 'rarely',
    calc: { calc: 18, non_calc: 5, na: 1 },
    markSplits: ['M1 M1dep A1'],
    chainedPct: 36,
    traps: [],
    sufficient: true,
    ...over,
  }
}

const ALL_BANDS: BareBand[] = ['never', 'rarely', 'sometimes', 'usually', 'almost always']

describe('bareClaim', () => {
  it('names the skill in lower case rather than saying "it"', () => {
    const s = bareClaim(profile(), 'Proportion')
    expect(s).toContain("you're doing proportion")
    expect(s).not.toContain('Proportion')
  })

  it('gives every band a distinct sentence', () => {
    // The bug this guards: an edit to the `never` wording introduced "rarely"
    // language, leaving `never` and `rarely` saying nearly the same thing. A
    // skill that is genuinely never asked outright then understated itself.
    const claims = ALL_BANDS.map(bareBand => bareClaim(profile({ bareBand }), 'Proportion'))
    expect(new Set(claims).size).toBe(ALL_BANDS.length)
  })

  it('never makes an absolute claim, even at 0% bare', () => {
    // Absence across a handful of series is not evidence a skill cannot be
    // asked outright. A student who is told "never" and then meets one in the
    // exam has been actively misled, so the strongest wording is "almost never".
    for (const bareBand of ALL_BANDS) {
      const s = bareClaim(profile({ bareBand, barePct: bareBand === 'never' ? 0 : 20 }), 'Proportion')
      // "never" is only ever allowed immediately after "almost".
      expect(s, bareBand).not.toMatch(/(?<!almost )\bnever\b/)
      // No absolute claim about the dressing either ("it's always wrapped…").
      expect(s, bareBand).not.toMatch(/it's always\b/)
    }
    expect(bareClaim(profile({ bareBand: 'never', barePct: 0 }), 'Proportion'))
      .toContain('almost never')
  })

  it('derives the dressing from the dominant framing, not a fixed phrase', () => {
    const realWorld = bareClaim(
      profile({ framing: { real_world: 20, multi_route: 3 } }), 'Proportion')
    expect(realWorld).toContain('real-life situation')

    // Same band, different dominant framing -> a different, still-true claim.
    const multiRoute = bareClaim(
      profile({ framing: { multi_route: 20, real_world: 3 } }), 'Proportion')
    expect(multiRoute).toContain('more than one way through')
    expect(multiRoute).not.toContain('real-life situation')

    const justify = bareClaim(
      profile({ framing: { decision_justify: 9, real_world: 2 } }), 'Proportion')
    expect(justify).toContain('explain why')
    expect(justify).not.toContain('real-life situation')
  })

  it('ignores bare when picking the dressing, even when bare dominates', () => {
    const s = bareClaim(
      profile({ bareBand: 'usually', barePct: 70, framing: { bare: 30, consequence: 4, real_world: 1 } }),
      'Proportion')
    expect(s).toContain('something else changes')
  })

  it('drops the second clause when there is no dressing to describe', () => {
    // All-bare skills have no non-bare framing. The sentence must not trail off
    // into "It will usually be ." with an empty phrase.
    for (const bareBand of ALL_BANDS) {
      const s = bareClaim(profile({ bareBand, framing: { bare: 12 } }), 'Simplifying Indices')
      expect(s).not.toMatch(/\bbe\s*\./)
      expect(s).not.toContain('undefined')
      expect(s.endsWith('.')).toBe(true)
    }
  })

  it('reads grammatically for every framing in every band', () => {
    // The dressing is dropped into three different sentence frames. A phrase
    // carrying a trailing "…, so …" clause parses in "It will usually be X"
    // and falls apart in "though it is sometimes X", which is how the first
    // version of this shipped a sentence that did not parse.
    const FRAMINGS = [
      'real_world', 'multi_route', 'decision_justify',
      'consequence', 'given_formula', 'inverse_operand',
    ]
    // 'almost always' is excluded: it never takes a dressing, and carries its
    // own trailing clause ("…, so spotting it isn't the tricky bit").
    const DRESSED_BANDS = ALL_BANDS.filter(b => b !== 'almost always')

    for (const framing of FRAMINGS) {
      for (const bareBand of DRESSED_BANDS) {
        const s = bareClaim(profile({ bareBand, framing: { [framing]: 12, bare: 1 } }), 'Proportion')
        expect(s, `${framing} / ${bareBand}`).not.toContain(', so ')
        expect(s, `${framing} / ${bareBand}`).not.toContain('  ')
        expect(s, `${framing} / ${bareBand}`).not.toMatch(/\.\./)
        expect(s.endsWith('.'), `${framing} / ${bareBand}`).toBe(true)
      }
    }
  })

  it('degrades gracefully on a framing key with no phrase written for it', () => {
    const s = bareClaim(profile({ framing: { some_future_framing: 9 } }), 'Proportion')
    expect(s).not.toContain('undefined')
    expect(s.endsWith('.')).toBe(true)
  })
})

describe('chainClaim', () => {
  it('says nothing when the marks rarely chain', () => {
    expect(chainClaim(profile({ chainedPct: 10 }))).toBeNull()
  })

  it('scales its wording with how often they chain', () => {
    expect(chainClaim(profile({ chainedPct: 36 }))).toContain('often')
    expect(chainClaim(profile({ chainedPct: 80 }))).toContain('usually')
  })
})

describe('calcClaim', () => {
  it('says nothing when there is too little evidence to lean', () => {
    expect(calcClaim(profile({ calc: { calc: 1, non_calc: 1 } }))).toBeNull()
  })

  it('names the paper when the split is lopsided', () => {
    expect(calcClaim(profile({ calc: { calc: 18, non_calc: 2 } }))).toContain('calculator paper')
    expect(calcClaim(profile({ calc: { calc: 1, non_calc: 19 } }))).toContain('non-calculator')
  })

  it('says both when the split is even', () => {
    expect(calcClaim(profile({ calc: { calc: 10, non_calc: 10 } }))).toContain('both')
  })
})
