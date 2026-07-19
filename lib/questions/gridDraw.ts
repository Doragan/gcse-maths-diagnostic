/**
 * Marking for `grid_draw` parts: the student places lattice-snapped points on
 * a grid; we compare them to the canonical elements. Pure module, no DOM —
 * used by the practice flow, the exam runner and the verification harness.
 *
 * Marking philosophy (matches the coded 2024 mark schemes in
 * data/exam-audit/ — plotting questions are B2 "fully correct line, B1
 * partial for correctly plotted points" or M1 M1 A1):
 *   - each correctly placed element earns its own marks (the M/B method marks)
 *   - line mode: a drawing that is not the complete correct line is capped at
 *     total − 1, reserving the final mark (the A1) for the correct line.
 * Aggregate `correct` (= every element right) is what feeds the ONE
 * practice_attempts row per part; per-element marks surface only in the exam
 * layer.
 */

export type RenderedAxis = { min: number; max: number; step: number; label: string }
export type RenderedGridElement = { x: number; y: number; marks: number }
export type RenderedGrid = {
  mode: string
  x: RenderedAxis
  y: RenderedAxis
  background: string
  elements: RenderedGridElement[]
  tolerance: number
}
export type GridPoint = { x: number; y: number } // axis units, lattice-snapped

export type GridDrawResult = {
  correct: boolean // every element right — feeds practice_attempts
  perElement: { correct: boolean; marks: number }[] // canonical-element order
  // Verdict per STUDENT point, aligned to the drawn array — this is what
  // review views use to colour the student's markers (canonical order and
  // student order differ in points mode).
  perStudent: boolean[]
  marksEarned: number
  marksTotal: number
}

const EPS = 1e-6

/** Distance between two axis-space points, measured in grid units. */
function gridDist(a: { x: number; y: number }, b: { x: number; y: number }, xStep: number, yStep: number): number {
  return Math.hypot((a.x - b.x) / xStep, (a.y - b.y) / yStep)
}

export function checkGridDraw(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  mode: 'points' | 'polyline' | 'line',
  tolerance: number,
  steps: { xStep: number; yStep: number } = { xStep: 1, yStep: 1 },
): GridDrawResult {
  const marksTotal = canonical.reduce((s, e) => s + (e.marks || 0), 0)
  const tol = tolerance + EPS
  const { xStep, yStep } = steps

  if (mode === 'line') {
    return checkLine(drawn, canonical, tolerance, xStep, yStep, marksTotal)
  }

  if (mode === 'polyline') {
    // Ordered match — but a student tracing the same polyline right-to-left
    // drew the same thing, so score forward AND reversed, keep the better.
    const score = (pts: GridPoint[]) => canonical.map((c, i) => {
      const s = pts[i]
      return s != null && gridDist(s, c, xStep, yStep) <= tol
    })
    const fwd = score(drawn)
    const rev = score([...drawn].reverse())
    const earn = (hits: boolean[]) => hits.reduce((s, h, i) => s + (h ? canonical[i].marks || 0 : 0), 0)
    const useRev = earn(rev) > earn(fwd)
    const hits = useRev ? rev : fwd
    const perElement = canonical.map((c, i) => ({ correct: hits[i], marks: hits[i] ? c.marks || 0 : 0 }))
    // Map canonical verdicts back onto the student's drawn order.
    const perStudent = drawn.map((_, s) => {
      const i = useRev ? drawn.length - 1 - s : s
      return hits[i] === true
    })
    const marksEarned = perElement.reduce((s, e) => s + e.marks, 0)
    return {
      correct: hits.every(Boolean) && drawn.length === canonical.length && canonical.length > 0,
      perElement,
      perStudent,
      marksEarned,
      marksTotal,
    }
  }

  // points — order-insensitive greedy nearest-match with a deterministic
  // tie-break, so duplicate student points can never double-match.
  const pairs: { d: number; c: number; s: number }[] = []
  for (let c = 0; c < canonical.length; c++) {
    for (let s = 0; s < drawn.length; s++) {
      const d = gridDist(drawn[s], canonical[c], xStep, yStep)
      if (d <= tol) pairs.push({ d, c, s })
    }
  }
  pairs.sort((a, b) => a.d - b.d || a.c - b.c || a.s - b.s)
  const cMatched = new Array(canonical.length).fill(false)
  const sMatched = new Array(drawn.length).fill(false)
  for (const p of pairs) {
    if (!cMatched[p.c] && !sMatched[p.s]) { cMatched[p.c] = true; sMatched[p.s] = true }
  }
  const perElement = canonical.map((c, i) => ({
    correct: cMatched[i],
    marks: cMatched[i] ? c.marks || 0 : 0,
  }))
  const marksEarned = perElement.reduce((s, e) => s + e.marks, 0)
  return {
    correct: cMatched.every(Boolean) && drawn.length === canonical.length && canonical.length > 0,
    perElement,
    perStudent: sMatched,
    marksEarned,
    marksTotal,
  }
}

/**
 * Line mode: the canonical is exactly 2 endpoint elements defining the
 * intended line; the student places exactly 2 points. Both must lie ON the
 * canonical line, be distinct, and span enough of it that two adjacent dots
 * can't "define" the line trivially.
 */
function checkLine(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  tolerance: number,
  xStep: number,
  yStep: number,
  marksTotal: number,
): GridDrawResult {
  const [p1, p2] = canonical
  const fail = (): GridDrawResult => ({
    correct: false,
    perElement: canonical.map(() => ({ correct: false, marks: 0 })),
    perStudent: drawn.map(() => false),
    marksEarned: 0,
    marksTotal,
  })
  if (!p1 || !p2 || canonical.length !== 2) return fail()
  // An incomplete drawing (not exactly 2 points) earns nothing: real plotting
  // schemes award the partial mark for "at least 2 correct points", never one.
  if (drawn.length !== 2) return fail()

  const vertical = Math.abs(p2.x - p1.x) < EPS
  const onLine = (s: GridPoint): boolean => {
    if (vertical) return Math.abs(s.x - p1.x) <= tolerance * xStep + EPS
    const m = (p2.y - p1.y) / (p2.x - p1.x)
    const c = p1.y - m * p1.x
    return Math.abs(s.y - (m * s.x + c)) <= tolerance * yStep + EPS
  }

  // Assign each student point to the canonical endpoint it is nearest along
  // the line's dominant axis, so perElement verdicts read sensibly.
  const axis = vertical ? 'y' as const : 'x' as const
  const step = vertical ? yStep : xStep
  const sorted = [...drawn].sort((a, b) => a[axis] - b[axis])
  const cSorted = [...canonical].sort((a, b) => a[axis] - b[axis])
  const hits = cSorted.map((_, i) => sorted[i] != null && onLine(sorted[i]))

  // Two DISTINCT points that both lie on the lattice and on the line define
  // that line uniquely and correctly — including adjacent points like the
  // intercept + one gradient step, which is the standard plotting method. The
  // only degenerate case is identical points (no line drawn at all).
  const distinct = sorted.length === 2 &&
    (Math.abs(sorted[0].x - sorted[1].x) > EPS || Math.abs(sorted[0].y - sorted[1].y) > EPS)

  const fullyCorrect = drawn.length === 2 && hits.every(Boolean) && distinct
  const perElement = cSorted.map((c, i) => ({
    correct: hits[i] === true,
    marks: hits[i] === true ? c.marks || 0 : 0,
  }))
  // Method-mark cap: on-line points earn their marks, but only the complete
  // correct line earns full marks (the A1).
  const rawEarned = perElement.reduce((s, e) => s + e.marks, 0)
  const marksEarned = fullyCorrect ? marksTotal : Math.min(rawEarned, Math.max(0, marksTotal - 1))
  // A student point's own verdict is simply whether IT lies on the line.
  const perStudent = drawn.map(p => onLine(p))
  return { correct: fullyCorrect, perElement, perStudent, marksEarned, marksTotal }
}

// ── Exam-record serialisation (the answers record is Record<string,string>) ──

export function serialiseGridAnswer(points: GridPoint[]): string {
  return points.length === 0 ? '' : JSON.stringify(points.map(p => ({ x: p.x, y: p.y })))
}

export function parseGridAnswer(s: string): GridPoint[] {
  try {
    const v = JSON.parse(s)
    if (!Array.isArray(v)) return []
    const pts = v.map(p => ({ x: Number(p?.x), y: Number(p?.y) }))
    return pts.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)) ? pts : []
  } catch {
    return []
  }
}

/** '(1, 3), (2, 5)' — for review text and outcome summaries. */
export function formatGridPoints(points: GridPoint[]): string {
  return points.map(p => `(${p.x}, ${p.y})`).join(', ')
}
