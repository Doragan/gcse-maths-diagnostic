/**
 * Marking for `grid_draw` parts: the student places lattice-snapped points on
 * a grid; we compare them to the canonical elements. Pure module, no DOM —
 * used by the practice flow, the exam runner and the verification harness.
 *
 * Marking philosophy (matches the coded mark schemes in
 * data/exam-audit/ — plotting questions are B2 "fully correct line, B1
 * partial for correctly plotted points" or M1 M1 A1):
 *   - each correctly placed element earns its own marks (the M/B method marks)
 *   - line mode: a drawing that is not the complete correct line is capped at
 *     total − 1, reserving the final mark (the A1) for the correct line.
 * Aggregate `correct` (= every element right) is what feeds the ONE
 * practice_attempts row per part; per-element marks surface only in the exam
 * layer.
 */

export type RenderedAxis = {
  min: number
  max: number
  step: number
  label: string
  /**
   * Category names for a CATEGORICAL x-axis (a bar chart), one per bar, left to
   * right.
   *
   * A bar sits BETWEEN gridlines, so the numeric ticks that suit a coordinate
   * grid land on the bar's edges and name nothing — "0 1 2 3 4" under four bars
   * reads as an off-by-one. When categories are present they are centred under
   * their own bar and the numerals are dropped.
   */
  categories?: string[]
}

/** Hollow or solid endpoint circle on a number line. */
export type EndpointStyle = 'open' | 'closed'
/** Which way the inequality's ray points from the endpoint. */
export type RayDir = 'left' | 'right' | 'none'

export type RenderedGridElement = {
  x: number
  y: number
  marks: number
  // bars: the bar's RIGHT edge. The bar spans [x, x2]; omitted means one step
  // wide, so a uniform bar chart needs no extra authoring and a histogram just
  // sets x2 per class.
  x2?: number
  // number_line: the endpoint's circle style and ray direction. Both must
  // match for the answer to be correct — that is what makes the coded
  // open_vs_closed_circle and arrow_direction misconceptions expressible.
  style?: EndpointStyle
  dir?: RayDir
}
/**
 * A text label placed at AXIS coordinates — a vertex name, a side length, an
 * angle.
 *
 * Needed because `background` cannot carry text: axisCoordGroup flips Y so
 * grids grow upward, and that mirrors any `<text>` inside it. Labels are drawn
 * in plain viewBox space instead, the same way the tick numerals already are,
 * so they come out the right way up.
 *
 * This is what makes a labelled figure possible at all — a triangle with sides
 * marked 8 cm and 11 cm, or points named A, B and C. Without it a diagram can
 * only show shape, and every quantity has to be repeated in the question text.
 */
export type GridLabel = {
  x: number
  y: number
  text: string
  /** Nudge in viewBox units, to keep a label clear of the shape it names. */
  dx?: number
  dy?: number
}

export type RenderedGrid = {
  mode: string
  x: RenderedAxis
  y: RenderedAxis
  background: string
  /** Upright text at axis coordinates. Drawn last, over everything else. */
  labels?: GridLabel[]
  /**
   * Axis lines, tick numerals and axis titles. Default true.
   *
   * False for a figure that is not a coordinate diagram — a grid to shade, or
   * a triangle drawn on squares — where numbering the edges is furniture the
   * exam's own version does not have.
   */
  showAxes?: boolean
  // Rendered method overlay, drawn only on the answer reveal ('' = none).
  solution?: string
  elements: RenderedGridElement[]
  tolerance: number
  // Rendered wrong-drawing traps (never drawn; marking metadata only).
  traps?: RenderedGridTrap[]
}
// axis units, lattice-snapped. style/dir are carried only by number_line
// markers, x2 only by bars_free bars; all three ride through serialisation as
// extra JSON fields.
export type GridPoint = {
  x: number
  y: number
  // bars_free: the bar's RIGHT edge, set by the student's second tap. Absent
  // means the bar is still half-drawn (one corner placed, no width yet).
  x2?: number
  style?: EndpointStyle
  dir?: RayDir
}

/**
 * An authored WRONG drawing plus the feedback it earns — the geometric twin of
 * a scalar trap. Vertices only: a trap is never credited, so it has no marks.
 */
export type RenderedGridTrap = {
  elements: GridPoint[]
  response: string
  /**
   * How the drawing is matched:
   *   'exact'      (default) — must match `elements` exactly.
   *   'translated' — the RIGHT shape and size in the WRONG place; `elements`
   *                  is unused. Catches every wrong centre of enlargement at
   *                  once (see matchesTranslated).
   */
  match?: 'exact' | 'translated'
}

export type GridDrawResult = {
  correct: boolean // every element right — feeds practice_attempts
  perElement: { correct: boolean; marks: number }[] // canonical-element order
  // Verdict per STUDENT point, aligned to the drawn array — this is what
  // review views use to colour the student's markers (canonical order and
  // student order differ in points mode).
  perStudent: boolean[]
  marksEarned: number
  marksTotal: number
  // The matched trap's response, when the drawing is wrong AND matches an
  // authored wrong drawing. Never affects marks.
  trap: { response: string } | null
}

const EPS = 1e-6

/** Distance between two axis-space points, measured in grid units. */
function gridDist(a: { x: number; y: number }, b: { x: number; y: number }, xStep: number, yStep: number): number {
  return Math.hypot((a.x - b.x) / xStep, (a.y - b.y) / yStep)
}

export type GridDrawMode = 'points' | 'polyline' | 'line' | 'cells' | 'polygon' | 'bars' | 'bars_free' | 'number_line'

/**
 * Grade a drawing against a canonical element list. Knows nothing about traps
 * — `checkGridDraw` wraps this and reuses it to test trap drawings too, which
 * is what makes trap matching inherit every per-mode nicety (points order-
 * insensitivity, polyline reversal, polygon rotation/winding, and line mode's
 * "any 2 distinct points on the line").
 */
function gradeCore(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  mode: GridDrawMode,
  tolerance: number,
  steps: { xStep: number; yStep: number } = { xStep: 1, yStep: 1 },
): Omit<GridDrawResult, 'trap'> {
  const marksTotal = canonical.reduce((s, e) => s + (e.marks || 0), 0)
  // Cells are lattice-identified squares — shading is exact by nature, so
  // tolerance is forced to 0 regardless of what the part declares (the
  // harness also gates it).
  const tol = (mode === 'cells' ? 0 : tolerance) + EPS
  const { xStep, yStep } = steps

  if (mode === 'line') {
    return checkLine(drawn, canonical, tolerance, xStep, yStep, marksTotal)
  }

  if (mode === 'bars') {
    return checkBars(drawn, canonical, tolerance, yStep, marksTotal)
  }

  if (mode === 'bars_free') {
    return checkBarsFree(drawn, canonical, tolerance, xStep, yStep, marksTotal)
  }

  if (mode === 'number_line') {
    return checkNumberLine(drawn, canonical, tolerance, xStep, marksTotal)
  }

  if (mode === 'polygon') {
    return checkPolygon(drawn, canonical, tolerance, xStep, yStep, marksTotal)
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
 * Grade a drawing, and — only when it is WRONG — check it against the authored
 * trap drawings, returning the first match's response. A trap never changes
 * marks; it only names the misconception, exactly like a scalar trap.
 */
export function checkGridDraw(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  mode: GridDrawMode,
  tolerance: number,
  steps: { xStep: number; yStep: number } = { xStep: 1, yStep: 1 },
  traps: RenderedGridTrap[] = [],
): GridDrawResult {
  const result = gradeCore(drawn, canonical, mode, tolerance, steps)
  if (result.correct || traps.length === 0) return { ...result, trap: null }

  for (const t of traps) {
    if (t.match === 'translated') {
      if (matchesTranslated(drawn, canonical, mode, tolerance, steps.xStep, steps.yStep)) {
        return { ...result, trap: { response: t.response } }
      }
      continue
    }
    if (t.elements.length === 0) continue
    if (!t.elements.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))) continue
    // marks: 1 is LOAD-BEARING, not cosmetic. gradeCore picks its alignment by
    // comparing earned marks (polyline forward-vs-reversed, polygon best
    // rotation/winding); with all-zero marks every alignment ties, the first
    // candidate wins arbitrarily, and a genuine trap match silently fails to
    // fire. Never "tidy" this to 0.
    // style/dir must survive: a number_line trap IS "right position, wrong
    // circle" or "wrong arrow", so dropping them would make those two coded
    // misconceptions unmatchable.
    // x2 must survive too: a bars_free trap IS "right heights, wrong widths"
    // (the equal-class-widths misconception), so dropping the edges would make
    // it unmatchable — the same bug style/dir hit on number_line.
    const asCanonical = t.elements.map(p => ({
      x: p.x, y: p.y, marks: 1,
      ...(p.x2 != null ? { x2: p.x2 } : {}),
      ...(p.style ? { style: p.style } : {}),
      ...(p.dir ? { dir: p.dir } : {}),
    }))
    // NOTE: gradeCore, never checkGridDraw — traps must not nest.
    if (gradeCore(drawn, asCanonical, mode, tolerance, steps).correct) {
      return { ...result, trap: { response: t.response } }
    }
  }
  return { ...result, trap: null }
}

/**
 * Bars mode: the author declares the bar SLOTS (each element's [x, x2] span);
 * the student only sets heights. So a drawn point identifies a bar by its slot
 * and supplies that bar's height.
 *
 * Matching is slot-then-height, deliberately NOT the Euclidean nearest-point
 * used by points mode: a bar drawn to the wrong height in one column must not
 * be able to satisfy a neighbouring column just because it lands closer to it.
 */
function checkBars(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  tolerance: number,
  yStep: number,
  marksTotal: number,
): Omit<GridDrawResult, 'trap'> {
  const tol = tolerance + EPS
  const sMatched = new Array(drawn.length).fill(false)
  const perElement = canonical.map(c => {
    // Slot identity is exact: the canvas snaps a tap to its slot's left edge.
    const si = drawn.findIndex((p, i) => !sMatched[i] && Math.abs(p.x - c.x) < EPS)
    if (si === -1) return { correct: false, marks: 0 }
    const heightOk = Math.abs((drawn[si].y - c.y) / yStep) <= tol
    if (heightOk) sMatched[si] = true
    return { correct: heightOk, marks: heightOk ? c.marks || 0 : 0 }
  })
  const marksEarned = perElement.reduce((s, e) => s + e.marks, 0)
  return {
    correct: perElement.every(e => e.correct) && drawn.length === canonical.length && canonical.length > 0,
    perElement,
    perStudent: sMatched,
    marksEarned,
    marksTotal,
  }
}

/**
 * bars_free mode: the student draws each bar's WIDTH as well as its height, so
 * a drawn point carries both edges ([x, x2]) and a height (y).
 *
 * This exists because choosing the class widths is part of what a histogram
 * question tests — in `bars` the author declares the slots, which hands the
 * student the very thing being assessed. Here a bar of the right height at the
 * wrong width is simply wrong.
 *
 * Edges must match EXACTLY (class boundaries are lattice values, and "nearly
 * the right interval" is not a thing in a histogram); only the height is
 * allowed the part's tolerance. A half-drawn bar (no x2) can never match.
 */
function checkBarsFree(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  tolerance: number,
  xStep: number,
  yStep: number,
  marksTotal: number,
): Omit<GridDrawResult, 'trap'> {
  const tol = tolerance + EPS
  const sMatched = new Array(drawn.length).fill(false)
  const perElement = canonical.map(c => {
    // The canonical right edge defaults to one step, matching bars mode.
    const cRight = c.x2 ?? c.x + xStep
    const si = drawn.findIndex((p, i) => !sMatched[i]
      && p.x2 != null
      && Math.abs(p.x - c.x) < EPS
      && Math.abs(p.x2 - cRight) < EPS
      && Math.abs((p.y - c.y) / yStep) <= tol)
    if (si === -1) return { correct: false, marks: 0 }
    sMatched[si] = true
    return { correct: true, marks: c.marks || 0 }
  })
  const marksEarned = perElement.reduce((s, e) => s + e.marks, 0)
  return {
    correct: perElement.every(e => e.correct) && drawn.length === canonical.length && canonical.length > 0,
    perElement,
    perStudent: sMatched,
    marksEarned,
    marksTotal,
  }
}

/**
 * Number line: a single marker carrying a position, a hollow/solid circle and
 * a ray direction. All three must match — the coded misconceptions are
 * precisely "right position, wrong circle" (open_vs_closed_circle) and "right
 * circle, wrong arrow" (arrow_direction), so a position-only match would make
 * both untrappable.
 */
function checkNumberLine(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  tolerance: number,
  xStep: number,
  marksTotal: number,
): Omit<GridDrawResult, 'trap'> {
  const tol = tolerance + EPS
  const sMatched = new Array(drawn.length).fill(false)
  const perElement = canonical.map(c => {
    const si = drawn.findIndex((p, i) => !sMatched[i]
      && Math.abs((p.x - c.x) / xStep) <= tol
      && (p.style ?? 'closed') === (c.style ?? 'closed')
      && (p.dir ?? 'none') === (c.dir ?? 'none'))
    if (si === -1) return { correct: false, marks: 0 }
    sMatched[si] = true
    return { correct: true, marks: c.marks || 0 }
  })
  const marksEarned = perElement.reduce((s, e) => s + e.marks, 0)
  return {
    correct: perElement.every(e => e.correct) && drawn.length === canonical.length && canonical.length > 0,
    perElement,
    perStudent: sMatched,
    marksEarned,
    marksTotal,
  }
}

/**
 * Does the drawing have the RIGHT shape and size but sit in the WRONG place —
 * i.e. is it the canonical answer moved by a non-zero offset?
 *
 * This is the general "wrong centre of enlargement" test. Enlarging a vertex v
 * about centre C by factor k gives k·v + C(1−k); that C(1−k) term is the SAME
 * for every vertex, so any wrong centre produces the correct image translated.
 * One predicate therefore catches every wrong centre at once, rather than
 * needing a separate trap per centre. Equally: a reflection or rotation drawn
 * in the wrong position.
 *
 * A zero offset is excluded — that is the correct answer, which never reaches
 * the trap loop anyway.
 */
function matchesTranslated(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  mode: GridDrawMode,
  tolerance: number,
  xStep: number,
  yStep: number,
): boolean {
  const n = canonical.length
  if (n === 0 || drawn.length !== n) return false
  const tol = tolerance + EPS
  const shifted = (a: GridPoint, b: { x: number; y: number }, ox: number, oy: number) =>
    gridDist({ x: a.x - ox, y: a.y - oy }, b, xStep, yStep) <= tol
  const nonZero = (ox: number, oy: number) => Math.abs(ox) > EPS || Math.abs(oy) > EPS

  if (mode === 'line') {
    // A translated line is a PARALLEL, distinct one: same gradient, different
    // intercept.
    if (n !== 2) return false
    const [c1, c2] = canonical
    const [d1, d2] = drawn
    const cVert = Math.abs(c2.x - c1.x) < EPS
    const dVert = Math.abs(d2.x - d1.x) < EPS
    if (cVert !== dVert) return false
    if (cVert) return Math.abs(d1.x - c1.x) > EPS
    const cm = (c2.y - c1.y) / (c2.x - c1.x)
    const dm = (d2.y - d1.y) / (d2.x - d1.x)
    if (Math.abs(cm - dm) > tolerance + EPS) return false
    return Math.abs((d1.y - dm * d1.x) - (c1.y - cm * c1.x)) > EPS
  }

  // For ordered modes, the offset is fixed by the first aligned pair and must
  // then hold for every pair.
  const tryAlignment = (align: (i: number) => number): boolean => {
    const ox = drawn[0].x - canonical[align(0)].x
    const oy = drawn[0].y - canonical[align(0)].y
    if (!nonZero(ox, oy)) return false
    for (let s = 0; s < n; s++) if (!shifted(drawn[s], canonical[align(s)], ox, oy)) return false
    return true
  }

  if (mode === 'polygon') {
    // Same freedom as normal polygon marking: any starting vertex, either winding.
    for (const dir of [1, -1]) {
      for (let o = 0; o < n; o++) {
        if (tryAlignment(s => ((o + dir * s) % n + n) % n)) return true
      }
    }
    return false
  }

  if (mode === 'polyline') {
    return tryAlignment(s => s) || tryAlignment(s => n - 1 - s)
  }

  // points / cells — order-insensitive: anchor each drawn point to canonical[0]
  // in turn, then check the whole set shifts by that same offset.
  for (let a = 0; a < n; a++) {
    const ox = drawn[a].x - canonical[0].x
    const oy = drawn[a].y - canonical[0].y
    if (!nonZero(ox, oy)) continue
    const used = new Array(n).fill(false)
    let all = true
    for (let ci = 0; ci < n; ci++) {
      const hit = drawn.findIndex((p, si) => !used[si] && shifted(p, canonical[ci], ox, oy))
      if (hit === -1) { all = false; break }
      used[hit] = true
    }
    if (all) return true
  }
  return false
}

/**
 * Line mode: the canonical is exactly 2 endpoint elements defining the
 * intended line; the student places exactly 2 DISTINCT points, both of which
 * must lie ON the canonical line. Two distinct on-line lattice points define
 * the line uniquely (e.g. intercept + one gradient step — the standard
 * method); identical points are the only degenerate case.
 */
function checkLine(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  tolerance: number,
  xStep: number,
  yStep: number,
  marksTotal: number,
): Omit<GridDrawResult, 'trap'> {
  const [p1, p2] = canonical
  const fail = (): Omit<GridDrawResult, 'trap'> => ({
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

/**
 * Polygon mode: canonical elements are the shape's vertices IN ORDER; the
 * student may start at any vertex and go in either direction, so we score
 * every cyclic rotation in both windings and keep the alignment that earns
 * the most marks. Per-vertex marks under that alignment (the schemes' "B1 two
 * vertices correct" partial); correct = counts equal + every vertex matched.
 * The matcher compares vertex sequences only — it never interprets edges.
 */
function checkPolygon(
  drawn: GridPoint[],
  canonical: RenderedGridElement[],
  tolerance: number,
  xStep: number,
  yStep: number,
  marksTotal: number,
): Omit<GridDrawResult, 'trap'> {
  const n = canonical.length
  const fail = (): Omit<GridDrawResult, 'trap'> => ({
    correct: false,
    perElement: canonical.map(() => ({ correct: false, marks: 0 })),
    perStudent: drawn.map(() => false),
    marksEarned: 0,
    marksTotal,
  })
  if (n < 3) return fail()

  const tol = tolerance + EPS
  // Best alignment: student[s] ↔ canonical[(o + dir·s) mod n].
  //
  // Ranked by marks earned, then by HOW MANY vertices matched. The second key
  // matters whenever vertices carry uneven marks — e.g. a rectangle that scores
  // only the two corners encoding the computed dimensions, leaving the anchor
  // and the implied corner at 0. There, a partial alignment can earn the same
  // marks as the fully-correct one while matching fewer vertices; ranking on
  // marks alone would keep whichever came first and report `correct: false`
  // alongside full marks. With equal marks per vertex the two keys move
  // together, so this changes nothing for any existing question.
  let best = { earned: -1, hitCount: -1, hits: [] as boolean[], o: 0, dir: 1 }
  for (const dir of [1, -1]) {
    for (let o = 0; o < n; o++) {
      const hits = canonical.map(() => false)
      let earned = 0
      let hitCount = 0
      const count = Math.min(drawn.length, n)
      for (let s = 0; s < count; s++) {
        const c = ((o + dir * s) % n + n) % n
        if (gridDist(drawn[s], canonical[c], xStep, yStep) <= tol) {
          hits[c] = true
          hitCount++
          earned += canonical[c].marks || 0
        }
      }
      if (earned > best.earned || (earned === best.earned && hitCount > best.hitCount)) {
        best = { earned, hitCount, hits, o, dir }
      }
    }
  }

  // ── Order-insensitive fallback ────────────────────────────────────────────
  //
  // The alignment above walks the student's taps as a CYCLE, so it only accepts
  // a drawing whose taps go round the shape. But the prompt these questions use
  // is "place its four corners", which says nothing about order — and a student
  // who taps opposite corners alternately has still placed exactly the right
  // vertices. On a live rectangle question only 8 of the 24 possible tap orders
  // were accepted, so a correct answer was rejected two times in three.
  //
  // So when the cyclic pass has not matched everything, fall back to matching
  // the taps as a SET: each tap claims a distinct canonical vertex at the same
  // position. That is the right reading of "place the corners", and it cannot
  // make a wrong drawing right — every tap must still land on a vertex.
  //
  // Only ever an improvement: it is used when it matches strictly more
  // vertices, so a question whose taps already aligned cyclically is unchanged.
  const setPairing: (number | null)[] = drawn.map(() => null)
  if (!best.hits.every(Boolean)) {
    const claimed = canonical.map(() => false)
    let setHits = 0
    let setEarned = 0
    for (let s = 0; s < drawn.length; s++) {
      const c = canonical.findIndex((el, i) => !claimed[i] && gridDist(drawn[s], el, xStep, yStep) <= tol)
      if (c === -1) continue
      claimed[c] = true
      setPairing[s] = c
      setHits++
      setEarned += canonical[c].marks || 0
    }
    if (setHits > best.hitCount) {
      best = { earned: setEarned, hitCount: setHits, hits: claimed, o: 0, dir: 1 }
    } else {
      setPairing.fill(null)
    }
  }
  const usedSetPairing = setPairing.some(c => c !== null)

  const perElement = canonical.map((c, i) => ({
    correct: best.hits[i],
    marks: best.hits[i] ? c.marks || 0 : 0,
  }))
  // Map back: student s was compared against canonical (o + dir·s) mod n —
  // or, when the set fallback won, against whichever vertex that tap claimed.
  const perStudent = drawn.map((_, s) => {
    if (usedSetPairing) return setPairing[s] !== null
    if (s >= n) return false
    const c = ((best.o + best.dir * s) % n + n) % n
    return best.hits[c] && gridDist(drawn[s], canonical[c], xStep, yStep) <= tol
  })
  const marksEarned = perElement.reduce((s, e) => s + e.marks, 0)
  return {
    correct: drawn.length === n && perElement.every(e => e.correct),
    perElement,
    perStudent,
    marksEarned,
    marksTotal,
  }
}

// ── Exam-record serialisation (the answers record is Record<string,string>) ──

export function serialiseGridAnswer(points: GridPoint[]): string {
  // style/dir are only present on number_line markers, x2 only on bars_free
  // bars; carrying them here is what lets the exam runner rebuild the student's
  // circle and arrow, or the width they chose for each bar.
  return points.length === 0 ? '' : JSON.stringify(points.map(p => ({
    x: p.x,
    y: p.y,
    ...(p.x2 != null ? { x2: p.x2 } : {}),
    ...(p.style ? { style: p.style } : {}),
    ...(p.dir ? { dir: p.dir } : {}),
  })))
}

const STYLES: EndpointStyle[] = ['open', 'closed']
const DIRS: RayDir[] = ['left', 'right', 'none']

export function parseGridAnswer(s: string): GridPoint[] {
  try {
    const v = JSON.parse(s)
    if (!Array.isArray(v)) return []
    const pts: GridPoint[] = v.map(p => ({
      x: Number(p?.x),
      y: Number(p?.y),
      // A non-finite x2 is dropped rather than kept as NaN, which would make
      // the bar unmatchable AND undrawable.
      ...(Number.isFinite(Number(p?.x2)) ? { x2: Number(p.x2) } : {}),
      // Unknown values are dropped rather than trusted — a marker with a bogus
      // style would otherwise never match anything and read as a mystery.
      ...(STYLES.includes(p?.style) ? { style: p.style as EndpointStyle } : {}),
      ...(DIRS.includes(p?.dir) ? { dir: p.dir as RayDir } : {}),
    }))
    return pts.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)) ? pts : []
  } catch {
    return []
  }
}

/**
 * '(1, 3), (2, 5)' for coordinates; free bars read as '20 to 40 at height 1.5'
 * and number-line markers as 'open circle at -1, arrow right', so the review
 * text is meaningful for every mode.
 */
export function formatGridPoints(points: GridPoint[]): string {
  return points.map(p => {
    if (p.x2 != null) return `${p.x} to ${p.x2} at height ${p.y}`
    if (!p.style && !p.dir) return `(${p.x}, ${p.y})`
    const circle = `${p.style ?? 'closed'} circle at ${p.x}`
    return p.dir && p.dir !== 'none' ? `${circle}, arrow ${p.dir}` : circle
  }).join(', ')
}
