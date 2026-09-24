import { describe, it, expect } from 'vitest'
import { numberLine, probabilityTree, type Figure } from './briefingFigures'
import { skillBriefings } from '../../data/skillBriefings'

// ─────────────────────────────────────────────────────────────────────────────
// Briefing figures are rendered as RAW MARKUP by the skill page, because they
// are authored SVG rather than data. These tests are what makes that defensible:
// they hold every figure — from the builders and from every authored briefing —
// to drawing shapes and text, and nothing else.
//
// If a figure ever needs something these rules forbid, the rule is the thing to
// argue with. Do not loosen it quietly to let one diagram through.
// ─────────────────────────────────────────────────────────────────────────────

/** Every figure reachable from an authored briefing, with a label for failures. */
const authoredFigures = (): { where: string; figure: Figure }[] => {
  const out: { where: string; figure: Figure }[] = []
  for (const g of Object.values(skillBriefings)) {
    const cues = [...g.recognise, ...(g.higher?.recognise ?? []), ...(g.higher?.note ? [g.higher.note] : [])]
    cues.forEach((c, i) => c.figure && out.push({ where: `${g.skillId} cue ${i}`, figure: c.figure }))
    const examples = [...g.examples, ...(g.higher?.examples ?? [])]
    examples.forEach((e, i) => e.figure && out.push({ where: `${g.skillId} example ${i}`, figure: e.figure }))
  }
  return out
}

const samples = (): { where: string; figure: Figure }[] => [
  {
    where: 'numberLine (open, right)',
    figure: numberLine({
      from: -3, to: 3, boundary: 1, closed: false, direction: 'right',
      alt: 'A number line with an open circle at 1 and an arrow to the right, showing x > 1.',
    }),
  },
  {
    where: 'numberLine (closed, left)',
    figure: numberLine({
      from: 0, to: 6, boundary: 4, closed: true, direction: 'left',
      alt: 'A number line with a filled circle at 4 and an arrow to the left, showing x ≤ 4.',
    }),
  },
  {
    where: 'probabilityTree',
    figure: probabilityTree({
      first: [{ label: 'Red', prob: '5/8' }, { label: 'Blue', prob: '3/8' }],
      second: ['4/7', '3/7', '5/7', '2/7'],
      alt: 'Tree with second-stage denominators of 7',
    }),
  },
  ...authoredFigures(),
]

describe('figure safety', () => {
  // The page renders these with dangerouslySetInnerHTML. Everything below is a
  // way of drawing something other than a shape, so none of it may appear.
  const forbidden: [string, RegExp][] = [
    ['a script tag', /<script/i],
    ['an event handler', /\son[a-z]+\s*=/i],
    ['a foreignObject', /<foreignObject/i],
    ['an embedded image', /<image/i],
    ['a use/external reference', /<use\b/i],
    ['a url() reference', /url\s*\(/i],
    ['an external href', /href\s*=\s*"(?!#)/i],
    ['a javascript: URL', /javascript:/i],
    ['a style block', /<style/i],
  ]

  it('draws shapes and text, and nothing else', () => {
    for (const { where, figure } of samples()) {
      for (const [what, pattern] of forbidden) {
        expect(pattern.test(figure.svg), `${where} contains ${what}`).toBe(false)
      }
    }
  })

  it('is a single well-formed svg element', () => {
    for (const { where, figure } of samples()) {
      expect(figure.svg.startsWith('<svg '), `${where} does not start with <svg`).toBe(true)
      expect(figure.svg.trimEnd().endsWith('</svg>'), `${where} does not end with </svg>`).toBe(true)
      expect(figure.svg.match(/<svg\b/g)?.length, `${where} has more than one <svg>`).toBe(1)
    }
  })
})

describe('figure presentation', () => {
  it('scales to its column rather than fixing a pixel size', () => {
    // A viewBox with no width/height is what lets the CSS cap decide the size.
    // A fixed width is how a diagram ends up clipped on a phone.
    for (const { where, figure } of samples()) {
      expect(figure.svg, `${where} has no viewBox`).toMatch(/viewBox="[-\d. ]+"/)
      expect(/<svg[^>]*\swidth=/.test(figure.svg), `${where} fixes a width`).toBe(false)
      expect(/<svg[^>]*\sheight=/.test(figure.svg), `${where} fixes a height`).toBe(false)
    }
  })

  it('inherits the text colour instead of hard-coding one', () => {
    // The page is light-only today. A figure that hard-codes a colour is a
    // landmine for whoever changes that.
    for (const { where, figure } of samples()) {
      expect(/#[0-9a-f]{3,8}\b/i.test(figure.svg), `${where} hard-codes a hex colour`).toBe(false)
      expect(/\b(rgb|hsl)a?\s*\(/i.test(figure.svg), `${where} hard-codes a colour function`).toBe(false)
    }
  })

  it('always carries alt text, because the diagram is teaching something', () => {
    for (const { where, figure } of samples()) {
      expect(figure.alt?.trim(), `${where} has no alt text`).toBeTruthy()
      expect(figure.alt.length, `${where} alt text is too short to be useful`).toBeGreaterThan(8)
    }
  })
})

describe('numberLine', () => {
  it('fills the circle for an inclusive boundary and leaves it open otherwise', () => {
    // The circle IS the mark on these questions, and open-vs-closed is a coded
    // trap on both tiers, so it gets its own test rather than riding on a render.
    const closed = numberLine({ from: 0, to: 4, boundary: 2, closed: true, direction: 'right', alt: 'x ≥ 2' })
    const open = numberLine({ from: 0, to: 4, boundary: 2, closed: false, direction: 'right', alt: 'x > 2' })

    expect(closed.svg).toMatch(/<circle[^>]*fill="currentColor"/)
    expect(open.svg).toMatch(/<circle[^>]*fill="none"/)
  })

  it('starts the ray clear of the circle, so an open circle stays open', () => {
    // Regression: the ray was drawn from the circle's centre, and at 3px wide it
    // filled an open circle in — making the diagram say the boundary IS included,
    // which is the exact trap the figure is there to teach against.
    const open = numberLine({ from: -2, to: 4, boundary: 1, closed: false, direction: 'right', alt: 'Shows x > 1 on a line.' })
    const cx = Number(open.svg.match(/<circle cx="([\d.]+)"/)![1])
    const rayStart = Number(open.svg.match(/<line x1="([\d.]+)" y1="24"[^>]*stroke-width="3"/)![1])

    expect(rayStart).toBeGreaterThan(cx + 4.5)
  })

  it('starts the ray on the correct side when it runs left', () => {
    const left = numberLine({ from: -2, to: 4, boundary: 1, closed: false, direction: 'left', alt: 'Shows x < 1 on a line.' })
    const cx = Number(left.svg.match(/<circle cx="([\d.]+)"/)![1])
    const rayStart = Number(left.svg.match(/<line x1="([\d.]+)" y1="24"[^>]*stroke-width="3"/)![1])

    expect(rayStart).toBeLessThan(cx - 4.5)
  })

  it('labels every integer on the line', () => {
    const f = numberLine({ from: -2, to: 2, boundary: 0, closed: true, direction: 'left', alt: 'x ≤ 0' })
    for (const n of ['-2', '-1', '0', '1', '2']) {
      expect(f.svg, `missing the label ${n}`).toContain(`>${n}</text>`)
    }
  })

  it('points the ray the way the inequality runs', () => {
    const right = numberLine({ from: 0, to: 4, boundary: 2, closed: false, direction: 'right', alt: 'x > 2' })
    const left = numberLine({ from: 0, to: 4, boundary: 2, closed: false, direction: 'left', alt: 'x < 2' })
    // The arrowhead sits at the end the ray travels towards.
    expect(right.svg).toContain('<polyline points="297,19 304,24 297,29"')
    expect(left.svg).toContain('<polyline points="23,19 16,24 23,29"')
  })
})

describe('probabilityTree', () => {
  it('shows all four second-stage probabilities', () => {
    const f = probabilityTree({
      first: [{ label: 'Red', prob: '5/8' }, { label: 'Blue', prob: '3/8' }],
      second: ['4/7', '3/7', '5/7', '2/7'],
      alt: 'Two-stage tree without replacement',
    })
    for (const p of ['5/8', '3/8', '4/7', '3/7', '5/7', '2/7']) {
      expect(f.svg, `missing the probability ${p}`).toContain(`>${p}</text>`)
    }
  })

  it('repeats the outcome labels on the second stage', () => {
    const f = probabilityTree({
      first: [{ label: 'Red', prob: '1/2' }, { label: 'Blue', prob: '1/2' }],
      second: ['1/2', '1/2', '1/2', '1/2'],
      alt: 'Two-stage tree with replacement',
    })
    // Once on each first branch, twice more on the second stage.
    expect(f.svg.match(/>Red<\/text>/g)?.length).toBe(3)
    expect(f.svg.match(/>Blue<\/text>/g)?.length).toBe(3)
  })
})
