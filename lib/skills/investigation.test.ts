import { describe, it, expect } from 'vitest'
import {
  allDraws, drawParams, resolveInvestigation, predictionCorrect, concludeGate,
  rejectValue, addValue, sentenceState, checksAttempted, stageComplete, stepNumbers,
} from './investigation'
import { clipLine, lineEquation } from './investigationFigures'
import { investigations, getInvestigation, hasInvestigation } from '../../data/investigations'
import { skillsById } from './skillGraph'
import { misconceptions } from '../../data/misconceptions'
import type { Stage } from '../../data/investigations/types'

const every = () => Object.values(investigations)

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

  it('keeps every expected prediction point inside its own axes', () => {
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const on = stage.predict.on
          if (on.kind !== 'grid') return
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
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const c = stage.control
          if (!c) return
          for (let v = c.domain.min; v <= c.domain.max; v += c.domain.step) {
            const grid = c.render([v], 0)
            expect(grid.background, `${inv.skillId} stage ${i + 1}, ${c.name} = ${v} draws nothing`)
              .toContain('<line')
          }
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

  it('gives a control both an observation table and a coverage rule', () => {
    for (const { skillId, stage, i } of stagesOfEvery()) {
      if (!stage.control) continue
      const where = `${skillId} stage ${i + 1}`
      expect(stage.observe, `${where} varies something but tabulates nothing`).toBeTruthy()
      expect(stage.control.row(stage.control.domain.min), where)
        .toHaveLength(stage.observe!.headers.length)
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
      const all: number[] = []
      for (let v = c.domain.min; v <= c.domain.max; v += c.domain.step) all.push(v)
      expect(concludeGate(stage, all), `${skillId} stage ${i + 1} cannot be satisfied`).toBeNull()
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

describe('the drawn history', () => {
  it('appends a new value and makes it live', () => {
    expect(addValue([3, -2], 5)).toEqual({ drawn: [3, -2, 5], current: 2 })
  })

  it('re-selects a repeat rather than listing it twice', () => {
    // Otherwise the table shows a duplicate row and the coverage rule counts
    // a value it has already seen.
    expect(addValue([3, -2], 3)).toEqual({ drawn: [3, -2], current: 0 })
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
    expect(r.stages).toHaveLength(3)
    expect(r.stages[0].ask).toContain(String(r.params.c1))
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
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          const c = stage.control
          if (!c) return
          for (let v = c.domain.min; v <= c.domain.max; v += c.domain.step) {
            const where = `${inv.skillId} stage ${i + 1}, ${c.name} = ${v}`
            expect(v, where).toBeGreaterThanOrEqual(Math.min(stage.axes.y.min, stage.axes.x.min))
            expect(v, where).toBeLessThanOrEqual(Math.max(stage.axes.y.max, stage.axes.x.max))
          }
        })
      }
    }
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
          if (on.kind !== 'grid' || !stage.predict.reveal) return
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
    const s = stage()
    expect(stageComplete(s, false, { 0: true, 1: true })).toBe(false)
    expect(stageComplete(s, true, {})).toBe(false)
    expect(stageComplete(s, true, { 0: true })).toBe(false)
    expect(stageComplete(s, true, { 0: true, 1: true })).toBe(true)
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

describe('student-facing copy', () => {
  it('states outcomes to the student, not notes about them', () => {
    for (const inv of every()) {
      expect(inv.outcomes, `${inv.skillId} talks about "the student"`)
        .not.toMatch(/\bthe student\b/i)
      expect(inv.outcomes.length).toBeGreaterThan(40)
    }
  })

  it('never tells a student to look for a colour', () => {
    // The reveal marks the right answer with a LABEL. Colour alone is no use
    // to a colourblind student, and little better for anyone on a phone.
    const colours = /\b(green|blue|red|yellow|orange|purple)\b/i
    for (const inv of every()) {
      for (const p of allDraws(inv.parameters)) {
        inv.build(p).forEach((stage, i) => {
          for (const [field, text] of Object.entries({
            right: stage.predict.right,
            wrong: stage.predict.wrong,
            because: stage.conclude.because,
          })) {
            expect(text, `${inv.skillId} stage ${i + 1} ${field} names a colour`)
              .not.toMatch(colours)
          }
        })
      }
    }
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
