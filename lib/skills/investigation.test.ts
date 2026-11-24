import { describe, it, expect } from 'vitest'
import {
  allDraws, drawParams, resolveInvestigation, resolveAt, predictionCorrect, concludeGate,
  rejectValue, addValue, showTry, sentenceState, checksAttempted, stageComplete, stepNumbers,
  controlValues, joinInputs, splitInputs, triedValue,
} from './investigation'
import { clipLine, lineEquation } from './investigationFigures'
import { BLOOM_VERBS, NOT_MEASURABLE, bloomLevel } from './bloom'
import { investigations, getInvestigation, hasInvestigation } from '../../data/investigations'
import { skillsById } from './skillGraph'
import { misconceptions } from '../../data/misconceptions'
import type { Stage } from '../../data/investigations/types'

const every = () => Object.values(investigations)

/**
 * Assert, ONCE, that an exhaustive walk found nothing wrong.
 *
 * The walks below visit every draw of every investigation (948 at the time of
 * writing) and make tens of thousands of comparisons. An expect() costs ~20µs
 * against ~0.1µs for the comparison itself, so one expect per comparison ran
 * these tests to 1.5–2.5s alone and past vitest's 5s timeout on a loaded
 * machine. Collecting problems and asserting once checks exactly the same
 * things — no draw is skipped — and reports every failure rather than the
 * first. Capped so a systematic break does not print thousands of lines.
 */
const expectNone = (problems: string[]) => {
  const cap = 40
  expect(problems.length > cap
    ? [...problems.slice(0, cap), `…and ${problems.length - cap} more`]
    : problems).toEqual([])
}

/** Every wrong response a predict can show, whichever kind it is. */
const wrongs = (stage: Stage): string[] => {
  const on = stage.predict.on
  return on.kind === 'grid' ? [on.wrong] : on.wrong.filter(w => w !== '')
}

describe('investigation registry', () => {
  it('only registers investigations for real skills', () => {
    for (const inv of every()) {
      expect(skillsById[inv.skillId], `${inv.skillId} is not a skill`).toBeTruthy()
    }
  })

  it('reports an unauthored skill as absent rather than inventing one', () => {
    expect(hasInvestigation('simple_arithmetic')).toBe(false)
    expect(getInvestigation('simple_arithmetic')).toBeNull()
  })
})

describe('parameter draws', () => {
  it('enumerates the whole space and applies the constraint', () => {
    const spec = {
      values: { a: [1, 2], b: [3, 4, 5] },
      valid: (p: Record<string, number>) => p.a !== 2 || p.b !== 5,
    }
    const draws = allDraws(spec)
    expect(draws).toHaveLength(5)                       // 6 combinations, one excluded
    expect(draws.some(d => d.a === 2 && d.b === 5)).toBe(false)
  })

  it('never hands out a draw the constraint excludes', () => {
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        expect(inv.parameters.valid?.(p) ?? true, `${inv.skillId}: ${JSON.stringify(p)}`).toBe(true)
      }
    }
  })

  it('refuses a spec with no legal draw rather than looping', () => {
    expect(() => drawParams({ values: { a: [1] }, valid: () => false })).toThrow()
  })

  it('picks a legal draw for any random value, including the 1.0 edge', () => {
    for (const inv of every()) {
      for (const r of [0, 0.25, 0.5, 0.999999, 1]) {
        const p = drawParams(inv.parameters, () => r)
        expect(inv.parameters.valid?.(p) ?? true).toBe(true)
      }
    }
  })
})

// The point of the parameter work: walk EVERY draw a student could be given
// and assert it is teachable, rather than checking the one we happened to see.
describe('every legal draw builds a usable investigation', () => {
  it('builds stages for all of them', () => {
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        const stages = inv.build(p)
        expect(stages.length, `${inv.skillId} ${JSON.stringify(p)}`).toBeGreaterThan(0)
      }
    }
  })

  it('never offers two identical options in one prediction', () => {
    // A distractor that renders as the right answer hands full marks to a
    // wrong reading. 4 of the pilot's 24 stage-3 combinations did exactly
    // that before the constraint was added.
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const on = stage.predict.on
          if (on.kind !== 'choice') return
          const unique = new Set(on.options)
          expect(unique.size, `${inv.skillId} stage ${i + 1}, ${JSON.stringify(p)}: `
            + on.options.join(' | ')).toBe(on.options.length)
        })
      }
    }
  })

  it('points every choice prediction at a real option', () => {
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const on = stage.predict.on
          if (on.kind !== 'choice') return
          expect(on.correct, `${inv.skillId} stage ${i + 1}`).toBeGreaterThanOrEqual(0)
          expect(on.correct).toBeLessThan(on.options.length)
        })
      }
    }
  })

  it('carries axes on exactly the stages that draw on them', () => {
    // `axes` went optional so a table-native investigation can exist at all.
    // The risk that creates is the opposite one: a stage that DOES draw,
    // silently missing its axes. Nothing else would catch that — the figure
    // would simply not appear.
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const where = `${inv.skillId} stage ${i + 1}`
          const draws = !!stage.figure
            || stage.predict.on.kind === 'grid'
            || !!stage.control?.render
            || !!stage.predict.reveal
          if (draws) expect(stage.axes, `${where} draws but has no axes`).toBeTruthy()
        })
      }
    }
  })

  it('keeps every expected prediction point inside its own axes', () => {
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const on = stage.predict.on
          if (on.kind !== 'grid' || !stage.axes) return
          for (const pt of on.expect) {
            const where = `${inv.skillId} stage ${i + 1}, ${JSON.stringify(p)}`
            expect(pt.x, where).toBeGreaterThanOrEqual(stage.axes.x.min)
            expect(pt.x, where).toBeLessThanOrEqual(stage.axes.x.max)
            expect(pt.y, where).toBeGreaterThanOrEqual(stage.axes.y.min)
            expect(pt.y, where).toBeLessThanOrEqual(stage.axes.y.max)
          }
        })
      }
    }
  })

  it('draws a visible figure for every value the control allows', () => {
    // Asserted on what is actually RENDERED, which is `background`.
    //
    // This test first checked grid.elements, and passed while the page drew
    // nothing: GridCanvas renders elements only with showCanonical, because
    // they are a grid_draw part's answer rather than part of the picture. The
    // ghosts appeared and the live line did not. Checking the field the
    // renderer ignores is worse than not checking at all — it reports success
    // for a blank figure.
    // Once per distinct section: its figure is drawn from the numbers its
    // question and prompt show, and compound units' other draws only built
    // the same figures again — past the suite's timeout.
    const seen = new Set<string>()
    const problems: string[] = []
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const c = stage.control
          if (!c?.render) return
          const key = `${inv.skillId}:${i}:${stage.ask}:${c.prompt}`
          if (seen.has(key)) return
          seen.add(key)
          // Every value of a short domain; for a long one (1–100%, on every
          // draw) the ends, their neighbours, and every tenth — walking all of
          // it ran past the suite's timeout once percentage change drew bars.
          // A ratio control's pairs are walked in full: 81 of them is short.
          const all = controlValues(c)
          const values = c.inputs || all.length <= 25
            ? all
            : all.filter((_, k) => k <= 1 || k >= all.length - 2 || k % 10 === 0)
          for (const v of values) {
            const grid = c.render([v], 0)
            // A line on a graph, or a piece of bar: a one-hour journey bar has
            // no dividers inside it, and is still a picture.
            if (!/<line|<rect/.test(grid.background ?? '')) {
              problems.push(`${inv.skillId} stage ${i + 1}, ${JSON.stringify(p)}, ${c.name} = ${v} draws nothing`)
            }
          }
        })
      }
    }
    expectNone(problems)
  })

  it('shows a tapped control its line before anything is tapped', () => {
    // The canvas a student TAPS now renders control.render(drawn) itself,
    // rather than sitting next to a second read-only copy of the figure — so
    // render is called with an EMPTY list, which it never used to be. Blank
    // here is a section that asks for points on a line it has not drawn.
    // A TYPED control is exempt: its figure is the lines the student draws,
    // so empty is the honest picture until they draw one.
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          if (!stage.control?.pick) return
          expect(stage.control.render, `${inv.skillId} stage ${i + 1} taps on nothing`).toBeTruthy()
          expect(stage.control.render!([], 0).background, `${inv.skillId} stage ${i + 1} opens blank`)
            .toContain('<line')
        })
      }
    }
  })

  it('lets a tapped control take enough points to measure between', () => {
    // GridCanvas caps placement at the number of CANONICAL elements, which a
    // collecting canvas has none of: the cap has to come from the control, and
    // a missing or zero one silently ignores every tap.
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const pick = stage.control?.pick
          if (!pick) return
          expect(pick.maxPoints, `${inv.skillId} stage ${i + 1} accepts too few taps`)
            .toBeGreaterThanOrEqual(2)
        })
      }
    }
  })

  it('draws the fixed figure on a stage that has one', () => {
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          if (!stage.figure) return
          expect(stage.figure.background, `${inv.skillId} stage ${i + 1} draws nothing`)
            .toContain('<line')
        })
      }
    }
  })

  it('gives a stage with no control something to look at', () => {
    // A choice stage that neither varies anything nor carries a figure asks
    // about a graph that is not on the page.
    for (const inv of every()) {
      inv.build(allDraws(inv.parameters)[0]).forEach((stage, i) => {
        if (stage.control || stage.predict.on.kind === 'grid') return
        expect(stage.figure, `${inv.skillId} stage ${i + 1} has nothing to read`).toBeTruthy()
      })
    }
  })
})

describe('authoring rules', () => {
  const stagesOfEvery = (): { skillId: string; stage: Stage; i: number }[] =>
    every().flatMap(inv =>
      inv.build(allDraws(inv.parameters)[0]).map((stage, i) => ({ skillId: inv.skillId, stage, i })))

  it('writes a sentence with exactly one more chunk than it has slots', () => {
    for (const { skillId, stage, i } of stagesOfEvery()) {
      expect(stage.conclude.sentence.length, `${skillId} stage ${i + 1}`)
        .toBe(stage.conclude.slots.length + 1)
    }
  })

  it('gives every slot a diagnosis and a misconception entry per option', () => {
    for (const { skillId, stage, i } of stagesOfEvery()) {
      for (const slot of stage.conclude.slots) {
        const where = `${skillId} stage ${i + 1}`
        expect(slot.diagnosis, where).toHaveLength(slot.options.length)
        expect(slot.misconception, where).toHaveLength(slot.options.length)
        expect(slot.correct, where).toBeLessThan(slot.options.length)
      }
    }
  })

  it('explains every wrong option and leaves the right one unexplained', () => {
    for (const { skillId, stage, i } of stagesOfEvery()) {
      stage.conclude.slots.forEach((slot, s) => {
        slot.options.forEach((_, o) => {
          const where = `${skillId} stage ${i + 1} slot ${s} option ${o}`
          if (o === slot.correct) {
            expect(slot.diagnosis[o], `${where} (correct) carries a diagnosis`).toBe('')
          } else {
            expect(slot.diagnosis[o].length, `${where} has no diagnosis`).toBeGreaterThan(10)
          }
        })
      })
    }
  })

  it('resolves every misconception id it tags against the taxonomy', () => {
    // Null is legal and '' means null here; a typo is not, because a tagged
    // wrong answer reaches the teacher's Common mistakes surface.
    const known = new Set(misconceptions.map(m => m.id))
    for (const { skillId, stage, i } of stagesOfEvery()) {
      for (const slot of stage.conclude.slots) {
        for (const id of slot.misconception) {
          if (id === '') continue
          expect(known.has(id), `${skillId} stage ${i + 1}: unknown misconception "${id}"`).toBe(true)
        }
      }
    }
  })

  it('never tags the correct option as a misconception', () => {
    for (const { skillId, stage, i } of stagesOfEvery()) {
      stage.conclude.slots.forEach((slot, s) => {
        expect(slot.misconception[slot.correct], `${skillId} stage ${i + 1} slot ${s}`).toBe('')
      })
    }
  })

  it('gives a control something to observe, and a table that lines up', () => {
    for (const { skillId, stage, i } of stagesOfEvery()) {
      if (!stage.control) continue
      const where = `${skillId} stage ${i + 1}`
      // A table, a figure, or both. Percentage change dropped its tables once
      // the bar models carried the same numbers in their labels.
      expect(stage.observe || stage.control.render, `${where} varies something unobservably`)
        .toBeTruthy()
      if (!stage.observe) continue
      const width = stage.observe.headers.length
      expect(stage.control.rows || stage.control.row, `${where} has a table and no rows for it`)
        .toBeTruthy()
      if (stage.control.rows) {
        // A table about PAIRS: rows appear only once there are two values, and
        // every one of them still has to line up with the headers.
        const sample = controlValues(stage.control).slice(0, 2)
        expect(stage.control.rows([sample[0]]), `${where} tabulates a lone value`).toHaveLength(0)
        for (const row of stage.control.rows(sample)) expect(row, where).toHaveLength(width)
      } else {
        expect(stage.control.row!(controlValues(stage.control)[0]), where).toHaveLength(width)
      }
    }
  })

  it('never opens the conclusion on one value, however many times it is drawn', () => {
    for (const { skillId, stage, i } of stagesOfEvery()) {
      if (!stage.control) continue
      expect(concludeGate(stage, []), `${skillId} stage ${i + 1} opens on nothing`).toBeTruthy()
      expect(concludeGate(stage, [1]), `${skillId} stage ${i + 1} opens on one value`).toBeTruthy()
    }
  })

  it('can always be satisfied by values the domain actually allows', () => {
    // A coverage rule asking for something the domain cannot provide is a
    // dead end the student can never leave.
    for (const { skillId, stage, i } of stagesOfEvery()) {
      const c = stage.control
      if (!c) continue
      expect(concludeGate(stage, controlValues(c)), `${skillId} stage ${i + 1} cannot be satisfied`).toBeNull()
    }
  })
})

describe('a control that draws nothing', () => {
  it('still gives the student something to observe', () => {
    // The whole case for making `render` optional is that the TABLE is the
    // observation. A control with neither a figure nor a table shows the
    // student a number box and no consequence of using it.
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const c = stage.control
          if (!c || c.render) return
          expect(stage.observe, `${inv.skillId} stage ${i + 1} varies something unobservably`)
            .toBeTruthy()
        })
      }
    }
  })
})

describe('typed values', () => {
  const stage = () => investigations['understanding_straight_line_graphs']
    .build(allDraws(investigations['understanding_straight_line_graphs'].parameters)[0])[0]

  it('accepts a value in the domain', () => {
    expect(rejectValue(stage(), '3')).toBeNull()
    expect(rejectValue(stage(), '-4')).toBeNull()
  })

  it('explains an empty box, a non-number and an out-of-range value', () => {
    expect(rejectValue(stage(), '')).toMatch(/type a number/i)
    expect(rejectValue(stage(), 'seven')).toMatch(/not a number/i)
    expect(rejectValue(stage(), '99')).toMatch(/between/i)
  })

  it('rejects a value off the step', () => {
    expect(rejectValue(stage(), '2.5')).toMatch(/whole numbers/i)
  })

  it('accepts a half where the step is a half', () => {
    const m = investigations['understanding_straight_line_graphs']
      .build(allDraws(investigations['understanding_straight_line_graphs'].parameters)[0])[1]
    expect(rejectValue(m, '2.5')).toBeNull()
    expect(rejectValue(m, '2.25')).toMatch(/steps of/i)
  })
})

describe('a control that takes a ratio', () => {
  // A number in each box, kept as one so the history, table and coverage
  // rules all still work on numbers.
  const two = {
    control: { name: 'ratio', inputs: ['boys', 'girls'], domain: { min: 1, max: 9, step: 1 } },
  } as unknown as Stage
  const three = {
    control: {
      name: 'ratio',
      inputs: ['Amy', 'Ben', 'Cara'],
      domain: { min: 1, max: 7, step: 1 },
      valid: (v: number) => {
        const [a, , c] = splitInputs(v, 3)
        return c > a ? null : 'Give Cara more parts than Amy.'
      },
    },
  } as unknown as Stage

  it('keeps every number in one value, and gets them back', () => {
    expect(joinInputs([3, 5])).toBe(305)
    expect(splitInputs(305, 2)).toEqual([3, 5])
    expect(splitInputs(joinInputs([9, 1]), 2)).toEqual([9, 1])
    expect(joinInputs([2, 3, 5])).toBe(20305)
    expect(splitInputs(20305, 3)).toEqual([2, 3, 5])
    expect(triedValue(two, '3:5')).toBe(305)
    expect(triedValue(two, ' 7 : 2 ')).toBe(702)
    expect(triedValue(three, '2:3:5')).toBe(20305)
  })

  it('walks every set the domain allows, and only the valid ones', () => {
    const all = controlValues(two.control!)
    expect(all).toHaveLength(81)
    expect(all[0]).toBe(101)
    expect(all.at(-1)).toBe(909)
    // Cara above Amy: 21 of the 49 (Amy, Cara) pairs, times 7 for Ben.
    const valid = controlValues(three.control!)
    expect(valid).toHaveLength(21 * 7)
    for (const v of valid) {
      const [a, , c] = splitInputs(v, 3)
      expect(c).toBeGreaterThan(a)
    }
  })

  it('asks for every number, and checks each against the domain by name', () => {
    expect(rejectValue(two, '3:5')).toBeNull()
    expect(rejectValue(two, '3:')).toMatch(/each of boys and girls/)
    expect(rejectValue(two, ':')).toMatch(/each of boys and girls/)
    expect(rejectValue(two, '0:5')).toMatch(/Keep boys between 1 and 9/)
    expect(rejectValue(two, '3:12')).toMatch(/Keep girls between 1 and 9/)
    // No line to keep on any axes here.
    expect(rejectValue(two, '3:12')).not.toMatch(/line/)
    expect(rejectValue(two, '3:2.5')).toMatch(/Whole numbers only for girls/)
    expect(rejectValue(three, '2:3')).toMatch(/each of Amy, Ben and Cara/)
    expect(rejectValue(three, '2:3:8')).toMatch(/Keep Cara between 1 and 7/)
  })

  it('refuses a set that breaks the rule the boxes keep together', () => {
    expect(rejectValue(three, '2:3:5')).toBeNull()
    expect(rejectValue(three, '5:3:2')).toBe('Give Cara more parts than Amy.')
    expect(rejectValue(three, '4:3:4')).toBe('Give Cara more parts than Amy.')
  })
})

describe('the drawn history', () => {
  it('appends a new value and makes it live', () => {
    expect(addValue([3, -2], 5)).toEqual({ drawn: [3, -2, 5], current: 2 })
  })

  it('re-selects a repeat rather than listing it twice', () => {
    // Otherwise the table shows a duplicate row and the coverage rule counts
    // a value it has already seen.
    expect(addValue([3, -2], 3)).toEqual({ drawn: [3, -2], current: 0 })
  })

  it('remembers the try LOOKED AT before this one, not the one typed last', () => {
    // Tried 2, 6 and 4; went back to 2 (index 0), then on to 6 (index 1). The
    // faint lane has to show 2 — reading "last" off the typing order showed 4.
    const back = showTry([2, 6, 4], 2, 1, 0)
    expect(back).toEqual({ current: 0, before: 2 })
    expect(showTry([2, 6, 4], back.current, back.before, 1)).toEqual({ current: 1, before: 0 })
  })

  it('keeps what came before when nothing on screen changes', () => {
    expect(showTry([2, 6], 1, 0, 1)).toEqual({ current: 1, before: 0 })
  })

  it('has nothing before the first try', () => {
    expect(showTry([], 0, undefined, 0)).toEqual({ current: 0, before: undefined })
  })

  it('compares a new try with the one on screen when it was typed', () => {
    // A new value is appended, so its index is past the end of the old history.
    expect(showTry([2, 6, 4], 0, 2, 3)).toEqual({ current: 3, before: 0 })
  })

  it('shows the faint car for the try looked at, in compound units', () => {
    const [p] = allDraws(getInvestigation('compound_units')!.parameters)
    const c = getInvestigation('compound_units')!.build(p)[0].control!
    const words = (before: number) => (c.scene!([2, 6, 4], 1, before).labels ?? []).map(l => l.text).join(' | ')
    expect(words(0)).toMatch(/last try: 2 hours/)
    expect(words(2)).toMatch(/last try: 4 hours/)
  })
})

describe('marking a grid prediction', () => {
  const inv = investigations['understanding_straight_line_graphs']
  const first = () => inv.build(allDraws(inv.parameters)[0])[0]

  it('accepts the expected point', () => {
    const s = first()
    const want = (s.predict.on as { expect: readonly { x: number; y: number }[] }).expect[0]
    expect(predictionCorrect(s, [{ x: want.x, y: want.y }])).toBe(true)
  })

  it('rejects the square next door', () => {
    const s = first()
    const want = (s.predict.on as { expect: readonly { x: number; y: number }[] }).expect[0]
    expect(predictionCorrect(s, [{ x: want.x, y: want.y + 1 }])).toBe(false)
    expect(predictionCorrect(s, [{ x: want.x + 1, y: want.y }])).toBe(false)
  })

  it('rejects an empty grid', () => {
    expect(predictionCorrect(first(), [])).toBe(false)
  })
})

describe('the conclusion sentence', () => {
  const stage = { conclude: { slots: [{ correct: 0 }, { correct: 1 }] } } as unknown as Stage

  it('is incomplete until every slot is answered', () => {
    expect(sentenceState(stage, {})).toMatchObject({ complete: false, correct: false })
    expect(sentenceState(stage, { 0: 0 })).toMatchObject({ complete: false })
  })

  it('names the first wrong slot', () => {
    expect(sentenceState(stage, { 0: 1, 1: 1 })).toMatchObject({ firstWrong: 0, correct: false })
    expect(sentenceState(stage, { 0: 0, 1: 0 })).toMatchObject({ firstWrong: 1, correct: false })
  })

  it('is correct only when every slot is', () => {
    expect(sentenceState(stage, { 0: 0, 1: 1 }))
      .toMatchObject({ complete: true, correct: true, firstWrong: -1 })
  })
})

describe('line geometry', () => {
  const x = { min: -5, max: 5, step: 1, label: 'x' }
  const y = { min: -5, max: 5, step: 1, label: 'y' }

  it('clips a line to the axes box', () => {
    expect(clipLine(1, 0, x, y)).toEqual([[-5, -5], [5, 5]])
  })

  it('clips a steep line at the top and bottom, not the sides', () => {
    const p = clipLine(5, 0, x, y)!
    expect(p.map(q => q[1]).sort((a, b) => a - b)).toEqual([-5, 5])
  })

  it('returns null for a line that misses the box entirely', () => {
    expect(clipLine(0, 99, x, y)).toBeNull()
  })

  it('handles a horizontal line, where there is no x to solve for', () => {
    expect(clipLine(0, 2, x, y)).toEqual([[-5, 2], [5, 2]])
  })

  it('writes an equation the way a paper does', () => {
    expect(lineEquation(1, 0)).toBe('y = x')
    expect(lineEquation(-1, 0)).toBe('y = −x')
    expect(lineEquation(2, -3)).toBe('y = 2x − 3')
    expect(lineEquation(0.5, 4)).toBe('y = 0.5x + 4')
  })
})

describe('resolveInvestigation', () => {
  it('carries the drawn numbers into the stages it builds', () => {
    const inv = investigations['understanding_straight_line_graphs']
    const r = resolveInvestigation(inv, () => 0)
    // what c does, which way m leans, measuring m, reading both back
    expect(r.stages).toHaveLength(4)
    expect(r.stages[0].ask).toContain(String(r.params.c1))
  })

  // Both investigations are authored with the right answer FIRST, and a
  // reviewer noticed every selection's answer was the first option. The shuffle
  // happens here, once per draw.
  //
  // The walks below resolve every draw straight from one allDraws list with
  // resolveAt. Reaching draw k through resolveInvestigation(inv, () => (k + ½)/n)
  // re-enumerates the space on every call, which made each walk quadratic; the
  // first test pins the two routes together so skipping drawParams loses nothing.
  const orders = (r: ReturnType<typeof resolveAt>) => r.stages.map(s => ({
    predict: s.predict.on.kind === 'choice' ? s.predict.on.options : null,
    slots: s.conclude.slots.map(sl => sl.options),
  }))

  it('reaches the same draw, in the same order, through the random number the page uses', () => {
    for (const inv of every()) {
      const draws = allDraws(inv.parameters)
      const n = draws.length
      for (const k of [0, 1, Math.floor(n / 2), n - 1]) {
        const viaRandom = resolveInvestigation(inv, () => (k + 0.5) / n)
        expect(viaRandom.params, `${inv.skillId} draw ${k}`).toEqual(draws[k])
        expect(orders(viaRandom), `${inv.skillId} draw ${k}`).toEqual(orders(resolveAt(inv, draws[k])))
      }
    }
  })

  it('does not put the right answer first every time', () => {
    for (const inv of every()) {
      const firsts: boolean[] = []
      for (const p of allDraws(inv.parameters)) {
        for (const stage of resolveAt(inv, p).stages) {
          if (stage.predict.on.kind === 'choice') firsts.push(stage.predict.on.correct === 0)
          for (const slot of stage.conclude.slots) firsts.push(slot.correct === 0)
        }
      }
      const share = firsts.filter(Boolean).length / firsts.length
      // About a third to a half by chance, with 2- and 3-option sets mixed.
      expect(share, `${inv.skillId}: the answer is first ${Math.round(share * 100)}% of the time`)
        .toBeLessThan(0.65)
    }
  })

  it('moves every response with the option it belongs to', () => {
    // Exhaustive by design: every draw, every option, every slot.
    const problems: string[] = []
    const same = (got: unknown, authored: unknown, where: string) => {
      if (!Object.is(got, authored)) {
        problems.push(`${where}: shows ${JSON.stringify(got)}, authored ${JSON.stringify(authored)}`)
      }
    }
    for (const inv of every()) {
      allDraws(inv.parameters).forEach((params, k) => {
        const r = resolveAt(inv, params)
        const authored = inv.build(params)
        r.stages.forEach((stage, i) => {
          const a = authored[i]
          const where = `${inv.skillId} section ${i + 1}, draw ${k}`
          const on = stage.predict.on
          const ao = a.predict.on
          if (on.kind === 'choice' && ao.kind === 'choice') {
            same(on.options[on.correct], ao.options[ao.correct], `${where} answer`)
            on.options.forEach((opt, j) => {
              same(on.wrong[j], ao.wrong[ao.options.indexOf(opt)], `${where}: "${opt}"`)
            })
          }
          stage.conclude.slots.forEach((slot, s) => {
            const as = a.conclude.slots[s]
            same(slot.options[slot.correct], as.options[as.correct], `${where} slot ${s} answer`)
            slot.options.forEach((opt, j) => {
              const o = as.options.indexOf(opt)
              same(slot.diagnosis[j], as.diagnosis[o], `${where} slot ${s}: "${opt}" diagnosis`)
              same(slot.misconception[j], as.misconception[o], `${where} slot ${s}: "${opt}" misconception`)
            })
          })
        })
      })
    }
    expectNone(problems)
  })

  it('gives the same draw the same order every time, so nothing moves mid-visit', () => {
    for (const inv of every()) {
      const a = resolveInvestigation(inv, () => 0)
      const b = resolveInvestigation(inv, () => 0)
      expect(a.stages.map(s => s.conclude.slots.map(sl => sl.options)))
        .toEqual(b.stages.map(s => s.conclude.slots.map(sl => sl.options)))
    }
  })
})

describe('figures are a shape that fits a screen', () => {
  // A grid renders at its container's width, with its height following the
  // cell ratio — so a grid much taller than it is wide fills a desktop screen
  // and is worse on a phone. Reported from the live site on the pilot's first
  // stage, which was 12 across by 16 up.
  const MAX_RATIO = 1.35

  it('never authors a grid much taller than it is wide', () => {
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          if (!stage.axes) return
          const across = (stage.axes.x.max - stage.axes.x.min) / stage.axes.x.step
          const up = (stage.axes.y.max - stage.axes.y.min) / stage.axes.y.step
          expect(up / across, `${inv.skillId} stage ${i + 1} is ${across} x ${up} cells`)
            .toBeLessThanOrEqual(MAX_RATIO)
        })
      }
    }
  })

  it('keeps every value the control allows inside the axes it draws on', () => {
    // The axes were trimmed to fit the screen; the domain has to be trimmed
    // with them, or a student types a legal value whose crossing point is off
    // the top of the picture.
    const problems: string[] = []
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const c = stage.control
          // A control that draws nothing has no axes to stay inside: a
          // percentage running 5 to 50 is not a coordinate. Nor does one drawn
          // on plain paper — a bar model's value is a speed or a percentage,
          // not a position on the figure.
          if (!c?.render || !stage.axes) return
          if (c.render([controlValues(c)[0]], 0).showAxes === false) return
          const { x, y } = stage.axes
          const lo = Math.min(y.min, x.min)
          const hi = Math.max(y.max, x.max)
          for (let v = c.domain.min; v <= c.domain.max; v += c.domain.step) {
            if (!(v >= lo && v <= hi)) {
              problems.push(`${inv.skillId} stage ${i + 1}, ${JSON.stringify(p)}, ${c.name} = ${v} is outside ${lo}…${hi}`)
            }
          }
        })
      }
    }
    expectNone(problems)
  })
})

describe('a grid prediction settles itself with a picture', () => {
  it('carries a reveal figure', () => {
    // Without it the page takes the student's guess, prints a sentence and
    // moves on — the figure disappears at the moment it becomes useful.
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          if (stage.predict.on.kind !== 'grid') return
          expect(stage.predict.reveal, `${inv.skillId} stage ${i + 1} has no reveal`).toBeTruthy()
        })
      }
    }
  })

  it('reveals the same answer it marks against, on the same axes', () => {
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const on = stage.predict.on
          if (on.kind !== 'grid' || !stage.predict.reveal || !stage.axes) return
          const where = `${inv.skillId} stage ${i + 1}`
          const reveal = stage.predict.reveal
          expect(reveal.elements.map(e => `${e.x},${e.y}`), where)
            .toEqual(on.grid.elements.map(e => `${e.x},${e.y}`))
          expect(reveal.x, where).toEqual(stage.axes.x)
          expect(reveal.y, where).toEqual(stage.axes.y)
        })
      }
    }
  })

  it('draws the line the student was predicting about', () => {
    // The reveal has to show MORE than the question did, or it is the same
    // picture with a ring on it.
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const on = stage.predict.on
          if (on.kind !== 'grid' || !stage.predict.reveal) return
          const before = (on.grid.background.match(/<line/g) || []).length
          const after = (stage.predict.reveal.background.match(/<line/g) || []).length
          expect(after, `${inv.skillId} stage ${i + 1} reveals nothing new`).toBeGreaterThan(before)
        })
      }
    }
  })
})

describe('section checks', () => {
  const allChecks = () => every().flatMap(inv =>
    inv.build(allDraws(inv.parameters)[0]).flatMap((stage, i) =>
      (stage.check ?? []).map((check, c) => ({
        where: `${inv.skillId} stage ${i + 1} check ${c + 1}`,
        check,
      }))))

  it('closes every section with at least one question', () => {
    for (const inv of every()) {
      // Only while it is marked under construction may an investigation leave a
      // section's check to come (compound units' last section once waited on
      // a question being written and published). Taking the notice off makes
      // this bite again.
      if (inv.underConstruction) continue
      inv.build(allDraws(inv.parameters)[0]).forEach((stage, i) => {
        expect(stage.check?.length ?? 0, `${inv.skillId} stage ${i + 1}`).toBeGreaterThan(0)
      })
    }
  })

  it('points at a question id, not a hand-written question', () => {
    // The whole reason these moved to the bank: parameters, the verification
    // harness, and the authored traps that say why a wrong answer is wrong.
    for (const { where, check } of allChecks()) {
      expect(check.questionId, `${where} has no question id`)
        .toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    }
  })

  it('records why each question belongs to its section', () => {
    // One skill covers gradient AND intercept AND reading an equation off a
    // graph, so without this note a plausible-looking swap tests the wrong half.
    for (const { where, check } of allChecks()) {
      expect(check.because.length, `${where} does not say why`).toBeGreaterThan(20)
    }
  })

  it('never asks the same question twice in one section', () => {
    for (const inv of every()) {
      inv.build(allDraws(inv.parameters)[0]).forEach((stage, i) => {
        const ids = (stage.check ?? []).map(c => c.questionId)
        expect(new Set(ids).size, `${inv.skillId} stage ${i + 1} repeats a question`)
          .toBe(ids.length)
      })
    }
  })

  it('never asks the same question twice anywhere in one investigation', () => {
    // Stronger than the per-section rule above, and it is what caught the real
    // bug: the parallel-lines question was section 2's challenge AND section
    // 4's check, so a student who met it early met it again at the end instead
    // of the question that section was actually about.
    for (const inv of every()) {
      const ids = inv.build(allDraws(inv.parameters)[0])
        .flatMap(stage => (stage.check ?? []).map(c => c.questionId))
      const twice = ids.filter((id, i) => ids.indexOf(id) !== i)
      expect(twice, `${inv.skillId} uses a question as a check twice`).toEqual([])
    }
  })

  it('never reuses a question the investigation already hands over at the end', () => {
    // The transfer is what counts towards mastery; a question already seen
    // inside the teaching is not evidence of independent recall.
    for (const inv of every()) {
      const used = new Set(inv.build(allDraws(inv.parameters)[0])
        .flatMap(stage => (stage.check ?? []).map(c => c.questionId)))
      for (const id of inv.transferQuestionIds) {
        expect(used.has(id), `${inv.skillId} transfers a question used as a check`).toBe(false)
      }
    }
  })
})

describe('moving through a section', () => {
  const stage = () => investigations['understanding_straight_line_graphs']
    .build(allDraws(investigations['understanding_straight_line_graphs'].parameters)[0])[0]

  it('is not finished until the rule is right AND every check has had a go', () => {
    const required = { check: [{ questionId: 'a', because: 'x' }, { questionId: 'b', because: 'y' }] } as unknown as Stage
    expect(stageComplete(required, false, { 0: true, 1: true })).toBe(false)
    expect(stageComplete(required, true, {})).toBe(false)
    expect(stageComplete(required, true, { 0: true })).toBe(false)
    expect(stageComplete(required, true, { 0: true, 1: true })).toBe(true)
  })

  it('never makes a challenge a hurdle', () => {
    // It is labelled "harder than this section needs", so holding the section
    // shut until it is answered contradicts what the student is reading.
    const withChallenge = {
      check: [
        { questionId: 'a', because: 'x' },
        { questionId: 'b', because: 'y', challenge: true },
      ],
    } as unknown as Stage
    expect(stageComplete(withChallenge, true, { 0: true })).toBe(true)
    // and the ordinary one is still required
    expect(stageComplete(withChallenge, true, { 1: true })).toBe(false)
  })

  it('lets the pilot past a section whose only outstanding check is a challenge', () => {
    const s = stage()
    const ordinary = (s.check ?? []).findIndex(c => !c.challenge)
    expect(ordinary, 'this stage has no ordinary check').toBeGreaterThanOrEqual(0)
    expect(stageComplete(s, true, { [ordinary]: true })).toBe(true)
  })

  it('counts a WRONG check as having had a go', () => {
    // Getting one wrong must not trap a student on the page.
    const s = stage()
    expect(checksAttempted(s, { 0: true, 1: true })).toBe(true)
  })

  it('treats a stage with no checks as having nothing outstanding', () => {
    expect(checksAttempted({ check: undefined } as unknown as Stage, {})).toBe(true)
  })
})

describe('step numbering', () => {
  const inv = () => investigations['understanding_straight_line_graphs']
  const stages = () => inv().build(allDraws(inv().parameters)[0])

  it('numbers a full stage 1 to 4', () => {
    expect(stepNumbers(stages()[0])).toEqual({ predict: 1, draw: 2, rule: 3, check: 4 })
  })

  it('leaves no gap on a stage with nothing to vary', () => {
    // The reported bug: stage 3 varies nothing, and with the numbers
    // hard-coded it ran 1, 3, 4 — which reads as a step that failed to load.
    const last = stages()[stages().length - 1]
    expect(last.control, 'this stage was expected to have no control').toBeUndefined()
    expect(stepNumbers(last)).toEqual({ predict: 1, draw: 0, rule: 2, check: 3 })
  })

  it('never skips a number on any stage of any draw', () => {
    for (const i of every()) {
      for (const p of allDraws(i.parameters)) {
        i.build(p).forEach((stage, n) => {
          const used = Object.values(stepNumbers(stage)).filter(v => v > 0).sort()
          const expected = used.map((_, k) => k + 1)
          expect(used, `${i.skillId} stage ${n + 1} numbers ${used.join(',')}`).toEqual(expected)
        })
      }
    }
  })
})

describe('the handover', () => {
  it('names real questions rather than falling back to generic practice', () => {
    // An empty list sent the closing button to /practice, which for a signed
    // out or unpaid student is the generic screen rather than a question.
    for (const inv of every()) {
      expect(inv.transferQuestionIds.length, `${inv.skillId} hands over to nothing`)
        .toBeGreaterThan(0)
      for (const id of inv.transferQuestionIds) {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      }
    }
  })
})

describe('the card after a wrong answer', () => {
  it('invites the student in its own words, for every investigation', () => {
    // "There's an investigation for this one — <invite>". It said "you draw
    // the graphs yourself" under all four, and only one draws graphs
    // (docs/audit/32, increment 1).
    const invites = every().map(inv => inv.invite)
    for (const inv of every()) {
      expect(inv.invite, inv.skillId).toMatch(/^you /)
      expect(inv.invite, inv.skillId).toMatch(/\.$/)
      expect(inv.invite.length, inv.skillId).toBeLessThanOrEqual(140)
    }
    expect(new Set(invites).size, 'two investigations share an invite').toBe(invites.length)
  })
})

describe('student-facing copy', () => {
  it('names every stage with a short heading of its own', () => {
    // Shown as "Stage 4 · Up, then down" and on the section buttons, where
    // the number alone said nothing. A heading, so short and no full stop;
    // and distinct, or two buttons would offer the same place.
    for (const inv of every()) {
      const [p] = allDraws(inv.parameters)
      const titles = inv.build(p).map(s => s.title)
      titles.forEach((t, i) => {
        const where = `${inv.skillId} section ${i + 1}`
        expect(t.trim(), `${where} has no title`).not.toBe('')
        expect(t.length, `${where}: "${t}" is too long for a heading`).toBeLessThanOrEqual(32)
        expect(t, `${where}: "${t}" ends like a sentence`).not.toMatch(/[.!?]$/)
      })
      expect(new Set(titles).size, `${inv.skillId} repeats a stage title`).toBe(titles.length)
    }
  })

  it('states outcomes to the student, not notes about them', () => {
    for (const inv of every()) {
      const all = [inv.outcomes.lead, ...inv.outcomes.points].join(' ')
      expect(all, `${inv.skillId} talks about "the student"`).not.toMatch(/\bthe student\b/i)
      expect(inv.outcomes.lead.length, `${inv.skillId} has no opening`).toBeGreaterThan(40)
    }
  })

  it('opens every outcome with a measurable verb from Bloom’s taxonomy', () => {
    // An outcome is something a teacher could watch a student do, or mark.
    // "Look at an equation and say…" and "go the other way" were not; nor is
    // "understand". One bullet is a paragraph wearing a bullet's clothes, so
    // there are at least two.
    for (const inv of every()) {
      expect(inv.outcomes.points.length, `${inv.skillId} lists too few outcomes`)
        .toBeGreaterThanOrEqual(2)
      for (const o of inv.outcomes.points) {
        expect(bloomLevel(o), `${inv.skillId}: "${o}" does not open with a Bloom verb`).not.toBeNull()
      }
    }
  })

  it('gives each outcome one verb, not two outcomes joined by "and"', () => {
    // "find a percentage… and say what percent means" was two outcomes. A
    // student who can do one and not the other has met half a bullet.
    for (const inv of every()) {
      for (const o of inv.outcomes.points) {
        const second = [...BLOOM_VERBS, ...NOT_MEASURABLE]
          .find(v => new RegExp(`\\band ${v}\\b`, 'i').test(o))
        expect(second, `${inv.skillId}: "${o}" joins a second outcome with "and ${second}"`)
          .toBeUndefined()
      }
    }
  })

  it('asks for more than procedure: outcomes on at least two Bloom levels', () => {
    // Every section ends with the student stating a rule and reading why it
    // holds, which is understanding. An outcome list of nothing but "work out"
    // undersells that, and hides it from a teacher reading the page.
    for (const inv of every()) {
      const levels = new Set(inv.outcomes.points.map(bloomLevel))
      expect(levels.size, `${inv.skillId}: every outcome is ${[...levels].join(', ')}`)
        .toBeGreaterThanOrEqual(2)
    }
  })

  // The page renders *word* in italics in prose, and nowhere else. An odd
  // number of asterisks leaves a literal * on screen, and one in a select
  // option or a table cell is always literal, since neither can hold markup.
  const prose = (stage: Stage): Record<string, string> => ({
    ask: stage.ask,
    'predict.prompt': stage.predict.prompt,
    'predict.right': stage.predict.right,
    'predict.wrong': wrongs(stage).join(' '),
    'predict.explain': stage.predict.explain.join(' '),
    'control.prompt': stage.control?.prompt ?? '',
    'control.hint': stage.control?.hint ?? '',
    sentence: stage.conclude.sentence.join(' '),
    diagnosis: stage.conclude.slots.flatMap(s => s.diagnosis).join(' '),
    because: stage.conclude.because,
    algebraLead: stage.conclude.algebraLead ?? '',
    algebra: stage.conclude.algebra ?? '',
    naming: Object.values(stage.naming ?? {}).join(' '),
    aside: Object.values(stage.aside ?? {}).join(' '),
    'check notes': (stage.check ?? []).map(c => c.note ?? '').join(' '),
  })

  it('writes every brace in prose as a fraction the page can draw', () => {
    // {P/100} draws as P over 100. Any other brace — unclosed, nested, or
    // without exactly one slash — would reach the student as a literal brace.
    // The pattern is the page's own: one slash, no braces or slashes inside.
    const fraction = /[{][^{}/]+[/][^{}/]+[}]/g
    const problems: string[] = []
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          for (const [field, text] of Object.entries(prose(stage))) {
            if (/[{}]/.test(text.replace(fraction, ''))) {
              problems.push(`${inv.skillId} section ${i + 1} ${field}: a stray brace in "${text}"`)
            }
          }
        })
      }
    }
    expectNone(problems)
  })

  it('never opens a diagnosis with the word the page already put in front of it', () => {
    // The page prints "Look again." before every diagnosis, so one that starts
    // "Look at…" reads "Look again. Look at…". Three had done it.
    const problems: string[] = []
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          for (const d of stage.conclude.slots.flatMap(sl => sl.diagnosis)) {
            if (/^look\b/i.test(d)) problems.push(`${inv.skillId} section ${i + 1}: "${d}"`)
          }
        })
      }
    }
    expectNone(problems)
  })

  it('balances every *emphasis* marker in prose', () => {
    const problems: string[] = []
    for (const inv of every()) {
      for (const text of [inv.outcomes.lead, ...inv.outcomes.points]) {
        // n markers split into n + 1 parts, so balanced means an ODD count.
        expect(text.split('*').length % 2, `${inv.skillId} outcomes: "${text}"`).toBe(1)
      }
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          for (const [field, text] of Object.entries(prose(stage))) {
            if (text.split('*').length % 2 !== 1) {
              problems.push(`${inv.skillId} section ${i + 1} ${field}: unbalanced * in "${text}"`)
            }
          }
        })
      }
    }
    expectNone(problems)
  })

  it('keeps markup out of the places that cannot render it', () => {
    const problems: string[] = []
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const where = `${inv.skillId} section ${i + 1}`
          const plain: string[] = [
            ...(stage.predict.on.kind === 'choice' ? stage.predict.on.options : []),
            ...stage.conclude.slots.flatMap(s => s.options),
            ...(stage.observe?.headers ?? []),
          ]
          const c = stage.control
          if (c?.domain) {
            // The ends and the middle, not every value: a cell's wording is the
            // same template whatever the value, and walking 1–100 on every draw
            // ran past the suite's timeout.
            const all = controlValues(c)
            for (const v of [all[0], all[Math.floor(all.length / 2)], all[all.length - 1]]) {
              plain.push(...(c.row?.(v) ?? []), c.label?.(v) ?? '')
            }
          }
          // A select option or a table cell is plain text: italics or a fraction
          // there would show the student its raw markup.
          for (const text of plain) {
            if (/[*{}]/.test(text)) problems.push(`${where}: "${text}"`)
          }
        })
      }
    }
    expectNone(problems)
  })

  it('answers each wrong option on its own, and nothing for the right one', () => {
    // One response per option, so the verdict is about the answer the student
    // picked rather than every distractor at once. '' at the correct index,
    // the same convention as a conclusion slot's diagnosis.
    const problems: string[] = []
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const where = `${inv.skillId} section ${i + 1}, ${JSON.stringify(p)}`
          const on = stage.predict.on
          if (on.kind === 'grid') {
            if (on.wrong.trim() === '') problems.push(`${where}: no wrong response`)
            return
          }
          if (on.wrong.length !== on.options.length) {
            problems.push(`${where}: ${on.wrong.length} responses for ${on.options.length} options`)
          }
          on.wrong.forEach((w, k) => {
            if (k === on.correct) {
              if (w !== '') problems.push(`${where}: the right option has a wrong response`)
            } else if (w.trim() === '') problems.push(`${where}: option ${k} has no response`)
          })
        })
      }
    }
    expectNone(problems)
  })

  it('shows the working under every prediction, right or wrong', () => {
    const problems: string[] = []
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const where = `${inv.skillId} section ${i + 1}, ${JSON.stringify(p)}`
          if (stage.predict.explain.length < 2) problems.push(`${where}: working is one line`)
          for (const line of stage.predict.explain) {
            if (line.trim() === '') problems.push(`${where}: an empty line of working`)
          }
        })
      }
    }
    expectNone(problems)
  })

  it('never writes a conclusion blank into the working', () => {
    // The working is an example in this draw's numbers. If it contains the
    // right answer to one of the conclusion's blanks word for word, it has
    // told the student the rule they were about to state themselves.
    const problems: string[] = []
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const working = stage.predict.explain.join(' ').toLowerCase()
          // A blank whose answer is also the prediction's own answer is
          // exempt: the verdict has already said it ("Yes. Steeper…"), and the
          // student generalises from exactly that instance.
          const on = stage.predict.on
          const predicted = on.kind === 'choice' ? on.options[on.correct].toLowerCase() : null
          for (const slot of stage.conclude.slots) {
            const answer = slot.options[slot.correct].toLowerCase()
            if (answer === predicted) continue
            if (working.includes(answer)) {
              problems.push(`${inv.skillId} section ${i + 1}, ${JSON.stringify(p)} gives away "${answer}"`)
            }
          }
        })
      }
    }
    expectNone(problems)
  })

  it('keeps each shuffled response beside the option it is about', () => {
    // The last straight-line section rotates its options by the draw, and its
    // responses are rotated with them. Checked on what each one is ABOUT, so a
    // response that slid onto its neighbour fails here.
    const inv = getInvestigation('understanding_straight_line_graphs')!
    for (const p of allDraws(inv.parameters)) {
      const stage = inv.build(p).at(-1)!
      const on = stage.predict.on
      if (on.kind !== 'choice') throw new Error('expected a choice')
      const at = (eq: string) => on.wrong[on.options.indexOf(eq)]
      expect(at(lineEquation(p.c3, p.m3))).toMatch(/swapped/)
      expect(at(lineEquation(-p.m3, p.c3))).toMatch(/slope has the wrong sign/)
      expect(at(lineEquation(p.m3, -p.c3))).toMatch(/crossing point has the wrong sign/)
      expect(at(lineEquation(p.m3, p.c3))).toBe('')
    }
  })

  it('never tells a student to look for a colour', () => {
    // The reveal marks the right answer with a LABEL. Colour alone is no use
    // to a colourblind student, and little better for anyone on a phone.
    const colours = /\b(green|blue|red|yellow|orange|purple)\b/i
    const problems: string[] = []
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          for (const [field, text] of Object.entries({
            right: stage.predict.right,
            wrong: wrongs(stage).join(' '),
            explain: stage.predict.explain.join(' '),
            because: stage.conclude.because,
          })) {
            if (colours.test(text)) {
              problems.push(`${inv.skillId} stage ${i + 1} ${field} names a colour: "${text}"`)
            }
          }
        })
      }
    }
    expectNone(problems)
  })

  it('labels the reveal so the answer can be read without colour', () => {
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        for (const stage of inv.build(p)) {
          if (stage.predict.on.kind !== 'grid' || !stage.predict.reveal) continue
          expect(stage.predict.reveal.labels?.length, `${inv.skillId} reveal has no label`)
            .toBeGreaterThan(0)
        }
      }
    }
  })
})
