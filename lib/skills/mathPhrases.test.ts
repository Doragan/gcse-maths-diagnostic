import { describe, it, expect } from 'vitest'
import { splitExpressions } from './mathPhrases'
import { skillBriefings } from '../../data/skillBriefings'
import { allSteps } from '../../data/skillBriefings/types'

/** The text as the reader sees it — segments joined back together. */
const rebuilt = (s: string) => splitExpressions(s).map(x => x.text).join(' ')
/** Just the runs that will be held on one line. */
const held = (s: string) => splitExpressions(s).filter(x => x.nowrap).map(x => x.text)

describe('splitExpressions', () => {
  it('never changes the text', () => {
    // The only job is marking runs. Losing or reordering a character here would
    // corrupt every briefing on the site.
    const samples = [
      'Add 4 to both sides and keep the sign the same: 5c < 25',
      'Subtract 2 from all THREE parts: −6 ≤ 3x < 9',
      'c < 5 — an inequality, not c = 5',
      'On a number line, fill the circle for ≤ or ≥ and leave it open for < or >.',
      '360 ÷ 8 = 45°',
      'It wants the height, and 8 cm is it',
      '',
    ]
    for (const s of samples) expect(rebuilt(s), s).toBe(s)
  })

  it('holds a short expression together', () => {
    expect(held('Divide by 5: c < 5')).toContain('c < 5')
    expect(held('Subtract 2 from all THREE parts: −6 ≤ 3x < 9')).toContain('−6 ≤ 3x < 9')
    expect(held('so 5c < 25 follows')).toContain('5c < 25')
  })

  it('leaves prose alone', () => {
    expect(held('The circle is the only thing on the page')).toEqual([])
    expect(held('fill the circle for ≤ or ≥ and leave it open')).toEqual([])
    expect(held('an inequality, not an equation')).toEqual([])
  })

  it('keeps punctuation with the run it belongs to', () => {
    const segs = splitExpressions('Divide by 5: c < 5, then check it.')
    const run = segs.find(s => s.nowrap)!
    expect(run.text).toBe('c < 5,')
    expect(rebuilt('Divide by 5: c < 5, then check it.')).toBe('Divide by 5: c < 5, then check it.')
  })

  it('never holds a run long enough to overflow a column', () => {
    // Better to wrap awkwardly than to push the page sideways on a phone. A
    // long expression may still have a shorter part of it held, which is fine
    // — the invariant is that nothing unbreakable exceeds the cap.
    const long = '1234567 + 2345678 + 3456789 + 4567890'
    for (const run of held(long)) expect(run.length).toBeLessThanOrEqual(20)

    for (const g of Object.values(skillBriefings)) {
      for (const s of allSteps(g)) {
        for (const run of held(s.example ?? '')) expect(run.length, run).toBeLessThanOrEqual(20)
      }
    }
  })

  it('round-trips every string a briefing renders', () => {
    // Belt and braces over the real content: whatever the rule does, the text
    // the student reads must come back identical.
    for (const g of Object.values(skillBriefings)) {
      const strings = [
        g.summary,
        ...[...g.recognise, ...(g.higher?.recognise ?? [])].flatMap(c => [c.text, c.example ?? '']),
        ...[...g.examples, ...(g.higher?.examples ?? [])].flatMap(e => [e.stem, e.cue, ...(e.worked ?? [])]),
        ...allSteps(g).flatMap(s => [s.do, s.because, s.watch, s.example ?? '']),
        ...[...g.check, ...(g.higher?.check ?? [])],
      ].filter(Boolean)
      for (const s of strings) expect(rebuilt(s), `${g.skillId}: ${s.slice(0, 40)}`).toBe(s)
    }
  })
})
