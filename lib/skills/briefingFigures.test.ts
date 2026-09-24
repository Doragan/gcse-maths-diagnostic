import { describe, it, expect } from 'vitest'
import {
  numberLine, probabilityTree, anglesAtAPoint, rightTriangle, regularPolygon, type Figure,
} from './briefingFigures'
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
  {
    where: 'anglesAtAPoint (line)',
    figure: anglesAtAPoint({
      mode: 'line', labels: ['2x', '3x', 'x + 40'],
      alt: 'Three angles meeting on a straight line, labelled 2x, 3x and x + 40.',
    }),
  },
  {
    where: 'anglesAtAPoint (point)',
    figure: anglesAtAPoint({
      mode: 'point', labels: ['110°', '95°', 'y', '80°'],
      alt: 'Four angles meeting at a point, three known and one labelled y.',
    }),
  },
  {
    where: 'rightTriangle',
    figure: rightTriangle({
      base: '15 cm', height: 'x', hypotenuse: '17 cm', unknown: 'height',
      alt: 'A right-angled triangle with base 15 cm, hypotenuse 17 cm and the height labelled x.',
    }),
  },
  {
    where: 'regularPolygon',
    figure: regularPolygon({
      sides: 5, mark: 'both',
      alt: 'A regular pentagon with the interior angle marked and the exterior angle outside it.',
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

/** Every <text> in a figure, with its position — for checking what sits where. */
const texts = (svg: string) =>
  [...svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)"[^>]*>([^<]*)<\/text>/g)]
    .map(m => ({ x: Number(m[1]), y: Number(m[2]), text: m[3] }))

describe('anglesAtAPoint', () => {
  it('splits evenly when the labels are algebraic', () => {
    // Regression: the sizing code read a digit out of "2x" and "x + 40" and drew
    // them as a 2-degree and a 40-degree slice. An algebraic label is an
    // unknown, not a size.
    const f = anglesAtAPoint({ mode: 'line', labels: ['2x', '3x', 'x + 40'], alt: 'Three angles on a line.' })
    const ls = texts(f.svg)
    expect(ls.map(l => l.text)).toEqual(['2x', '3x', 'x + 40'])

    // Equal thirds of a half turn put the outer two labels symmetrically about
    // the vertex, which a 2:3:40 split could never do.
    const cx = 160
    expect(Math.abs((cx - ls[0].x) - (ls[2].x - cx))).toBeLessThan(1)
  })

  it('sizes the sectors by the numbers when the labels are numbers', () => {
    // 140 against 40 must not come out as two equal halves: the diagram would
    // contradict its own labels.
    const f = anglesAtAPoint({ mode: 'line', labels: ['140°', 'y'], alt: 'A 140 degree angle and y on a line.' })
    expect(texts(f.svg)[0].text).toBe('140°')

    // The split shows in the DIVIDING RAY, not in where the labels land: an
    // equal split would stand the ray up vertically at the centre, while 140
    // against 40 leans it well over to the right.
    const cx = 160
    const rays = [...f.svg.matchAll(/<line x1="160" y1="92" x2="([-\d.]+)"/g)].map(m => Number(m[1]))
    expect(rays.length).toBe(1)
    expect(rays[0]).toBeGreaterThan(cx + 20)
  })

  it('reads left to right along a line', () => {
    const f = anglesAtAPoint({ mode: 'line', labels: ['a', 'b', 'c'], alt: 'Three angles a, b and c on a line.' })
    const ls = texts(f.svg)
    expect(ls[0].x).toBeLessThan(ls[1].x)
    expect(ls[1].x).toBeLessThan(ls[2].x)
  })

  it('draws the baseline and only the dividing rays on a line', () => {
    const f = anglesAtAPoint({ mode: 'line', labels: ['a', 'b', 'c'], alt: 'Three angles on a straight line.' })
    // One baseline plus two dividers for three angles.
    expect(f.svg.match(/<line /g)?.length).toBe(3)
  })

  it('draws every ray around a point', () => {
    const f = anglesAtAPoint({ mode: 'point', labels: ['a', 'b', 'c', 'd'], alt: 'Four angles around a point.' })
    expect(f.svg.match(/<line /g)?.length).toBe(4)
  })
})

describe('rightTriangle', () => {
  it('marks the right angle and labels all three sides', () => {
    const f = rightTriangle({
      base: '15 cm', height: 'x', hypotenuse: '17 cm', unknown: 'height',
      alt: 'A right-angled triangle with base 15 cm and hypotenuse 17 cm.',
    })
    expect(f.svg).toContain('<polygon points=')
    expect(f.svg).toContain('<polyline points=')   // the right-angle square
    expect(texts(f.svg).map(t => t.text).sort()).toEqual(['15 cm', '17 cm', 'x'])
  })
})

describe('regularPolygon', () => {
  it('draws the right number of vertices', () => {
    const f = regularPolygon({ sides: 6, mark: 'interior', alt: 'A regular hexagon with the interior angle marked.' })
    const points = /<polygon points="([^"]+)"/.exec(f.svg)![1].trim().split(/\s+/)
    expect(points.length).toBe(6)
  })

  it('puts the exterior label inside the angle it names', () => {
    // Regression: the label sat beside the extended side, outside the wedge
    // between that extension and the next side — naming the wrong region
    // entirely. It must lie between the two directions that form the angle.
    const sides = 5
    const f = regularPolygon({ sides, mark: 'exterior', alt: 'A regular pentagon with the exterior angle marked.' })

    const cx = 112, cy = 100, R = 70
    const at = (i: number): [number, number] => {
      const rad = ((360 / sides) * i * Math.PI) / 180
      return [cx + R * Math.cos(rad), cy - R * Math.sin(rad)]
    }
    const unit = ([dx, dy]: [number, number]): [number, number] => {
      const len = Math.hypot(dx, dy) || 1
      return [dx / len, dy / len]
    }
    const [x0, y0] = at(0), [x1, y1] = at(1), [xl, yl] = at(sides - 1)
    const ext = unit([x0 - x1, y0 - y1])          // the extension
    const next = unit([xl - x0, yl - y0])         // the next side

    const label = texts(f.svg).find(t => t.text === 'exterior')!
    const dir = unit([label.x - x0, label.y - 4 - y0])

    // Inside the wedge means pointing the same general way as both edges of it.
    expect(dir[0] * ext[0] + dir[1] * ext[1]).toBeGreaterThan(0)
    expect(dir[0] * next[0] + dir[1] * next[1]).toBeGreaterThan(0)
  })
})
