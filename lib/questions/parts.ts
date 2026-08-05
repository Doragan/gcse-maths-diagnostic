import type { QuestionKind } from './kind'
import type { PartAnswerType, ScalarAnswerType } from './answerTypes'

/**
 * A single, independently-graded and independently-attributed part of a
 * multi-part question (e.g. part a, part b, ...).
 *
 * Each part is its own unit of attribution: when answered in practice it
 * produces ONE practice_attempts row carrying THIS part's skill_ids and kind.
 * A part with one skill is naturally `mastery` (credit-on-success +
 * penalise-on-failure); a part synthesising several skills is `exam`
 * (positive-only — credit on success, route to revision on failure).
 *
 * Parts render against the SHARED generated value set of their parent
 * question, so part (b)'s prompt/answer can reference {{a}} from part (a).
 */
export type PartTrap = {
  answer_template: string
  response: string
  /**
   * Method marks this trap proves the student earned, for exam scoring.
   *
   * A trap is an anticipated wrong answer, and the two flavours deserve very
   * different credit. "You added the coordinates but didn't halve them" is a
   * sound method with a missed last step — a real scheme pays M1 for it. "That
   * is the area; the question asks for the perimeter" is the wrong method and
   * pays nothing. Only the author can tell them apart, so this is opt-in.
   *
   * UNSET is not the same as 0: unset leaves the marks *unknown* (they widen
   * the honest uncertainty band on the score), while 0 asserts the trap earns
   * nothing. Never more than the part's marks minus one — no scheme pays full
   * marks for method alone. Inert outside exam mode: practice grades binary.
   */
  method_marks?: number
}

/**
 * One labelled blank of a `multi_blank` part ("write down the values of A, B
 * and C"). Each blank is its own scalar mini-answer — template, type,
 * tolerance, traps and marks — graded independently by checkAnswer via
 * checkMultiBlank. The blank COUNT is fixed at authoring time; parameters vary
 * the VALUES only, never how many boxes there are.
 */
export type Blank = {
  label: string // 'A', 'B', ... unique within the part
  // Optional short prompt shown beside the input ("Students who come by bus"),
  // so the student doesn't have to keep glancing between the boxes and the
  // stem/diagram. A template — may reference parameters.
  prompt?: string
  answer_template: string
  answer_type: ScalarAnswerType // never 'multi_blank' — no nesting
  tolerance: number | null // numeric only, like parts
  requires_simplest: boolean
  traps: PartTrap[]
  marks: number // per-blank marks (exam partial credit)
  // Optional errors-carried-forward formula, mirroring the exam convention
  // that a step consistent with the student's OWN earlier wrong answer still
  // earns the method mark. Parameters interpolate as usual ({{n - a}}); a
  // SIBLING BLANK is referenced as [[B]], which survives rendering and is
  // replaced with that blank's student answer at marking time.
  //   ecf_template: '[[F]] - {{d}}'
  // Only meaningful on a blank whose value depends on another blank.
  ecf_template?: string
}

/**
 * The grid specification of a `grid_draw` part: an interactive snap-to-grid
 * canvas the student places points on. Axis min/max and element coordinates
 * may be template expressions ({{...}}) rendered against the question's shared
 * value set; `step` is a plain number so the grid keeps a stable SHAPE across
 * draws (parameters vary values, never the number of cells or elements).
 * Every mode below is markable; the harness gates each one's shape.
 */
export type GridAxis = {
  min: number | string
  max: number | string
  step: number
  label: string
  /** Bar-chart category names, one per bar, left to right. See RenderedAxis. */
  categories?: string[]
}
export type GridElement = {
  x: number | string
  y: number | string
  marks: number
  // bars: the bar's right edge (defaults to one step wide). Lets a histogram
  // declare unequal class widths.
  x2?: number | string
  // number_line: the endpoint's circle style and ray direction.
  style?: 'open' | 'closed'
  dir?: 'left' | 'right' | 'none'
}
export type Grid = {
  mode: 'points' | 'polyline' | 'line' | 'cells' | 'polygon' | 'bars' | 'bars_free' | 'number_line'
  x: GridAxis
  y: GridAxis
  // SVG-fragment template drawn in AXIS coordinates behind the lattice
  // (paths/shapes only in v1 — the coordinate transform flips text).
  background: string
  elements: GridElement[] // the canonical answer, one row per required placement
  tolerance: number // grid units; 0 = exact lattice
  // Optional SVG fragment (axis coords, like background) shown ONLY when the
  // correct answer is revealed — the method/working the student would draw,
  // e.g. ray lines from the centre of enlargement or the perpendiculars of a
  // reflection. Omitted from stored jsonb when empty.
  solution?: string
  // Authored WRONG drawings with targeted feedback — the geometric twin of
  // scalar traps. Matched only when the student is wrong; never scored, so
  // trap elements carry no marks. Omitted from stored jsonb when empty.
  traps?: GridTrap[]
}

/** One wrong drawing plus the feedback it earns. */
export type GridTrap = {
  elements: {
    x: number | string; y: number | string
    // bars_free: the wrong RIGHT edge — this is what makes "every bar drawn
    // the same width" expressible as a trap.
    x2?: number | string
    style?: 'open' | 'closed'
    dir?: 'left' | 'right' | 'none'
  }[]
  response: string
  // 'exact' (default) matches the drawing in `elements`. 'translated' ignores
  // `elements` and fires for the RIGHT shape in the WRONG place — one trap
  // covering every wrong centre of enlargement.
  match?: 'exact' | 'translated'
}

export type QuestionPart = {
  prompt: string
  skill_ids: string[]
  answer_template: string
  answer_type: PartAnswerType
  tolerance: number | null
  // Whether the part demanded simplest form (drives the fraction/ratio nudge).
  requires_simplest: boolean
  traps: PartTrap[]
  marks: number
  kind: QuestionKind
  explanation: string | null
  // Only present when answer_type === 'multi_blank'; scalar parts never carry
  // the key (normalizePart omits it, keeping stored jsonb clean).
  blanks?: Blank[]
  /**
   * Optional BANDED mark scheme for a multi_blank part, awarding marks by HOW
   * MANY blanks are right rather than summing each blank's own marks.
   *
   * Real mark schemes for "complete the table" questions work this way — a
   * six-cell two-way table is typically "B3 all correct, B2 four or five, B1 any
   * one correct (ecf)", not six independent one-mark cells. Summing per-blank
   * marks over-rewards them: it made a d2 table worth 6 marks when comparable
   * questions cap at 3 and real papers of that style average 2.57.
   *
   * Bands are checked highest-first; the first whose `min_correct` is met wins.
   * Absent = sum the blanks' own marks (the original behaviour, unchanged for
   * every existing question).
   */
  mark_bands?: MarkBand[]
  // Only present when answer_type === 'grid_draw' (same omission rule).
  grid?: Grid
}

/** One rung of a banded multi_blank mark scheme. */
export type MarkBand = {
  /** Award these marks once at least this many blanks are correct. */
  min_correct: number
  marks: number
}

/**
 * Marks for a banded scheme: the highest band whose threshold is met, else 0.
 * `correctCount` should already include errors-carried-forward credit, since a
 * follow-through blank earns its method mark in a real mark scheme.
 */
export function bandedMarks(bands: MarkBand[], correctCount: number): number {
  let best = 0
  for (const b of bands) {
    if (correctCount >= b.min_correct && b.marks > best) best = b.marks
  }
  return best
}

/** The most a banded scheme can award — the part's marks for assembly/display. */
export function bandedMax(bands: MarkBand[]): number {
  return bands.reduce((m, b) => Math.max(m, b.marks), 0)
}

/**
 * Coerce authored/stored bands into a clean ascending list, or null when there
 * is no usable scheme (so the caller falls back to summing blank marks).
 */
export function normalizeMarkBands(raw: unknown): MarkBand[] | null {
  if (!Array.isArray(raw)) return null
  const bands: MarkBand[] = []
  for (const b of raw) {
    if (!b || typeof b !== 'object') continue
    const minCorrect = Number((b as MarkBand).min_correct)
    const marks = Number((b as MarkBand).marks)
    if (!Number.isFinite(minCorrect) || !Number.isFinite(marks)) continue
    if (minCorrect < 1 || marks < 1) continue
    bands.push({ min_correct: Math.round(minCorrect), marks: Math.round(marks) })
  }
  if (bands.length === 0) return null
  return bands.sort((a, b) => a.min_correct - b.min_correct)
}

/**
 * The skill_ids a multi-part question covers as a whole: the de-duplicated
 * union of every part's skill_ids, preserving first-seen order. This is what
 * we persist into the question-level `skill_ids` column so existing serving /
 * filtering queries (which use `.overlaps('skill_ids', ...)`) keep working
 * unchanged for multi-part questions.
 */
export function computeSkillUnion(parts: { skill_ids: string[] }[]): string[] {
  const seen = new Set<string>()
  const union: string[] = []
  for (const part of parts) {
    for (const id of part.skill_ids) {
      if (!seen.has(id)) {
        seen.add(id)
        union.push(id)
      }
    }
  }
  return union
}

/**
 * Default kind for a part, derived from how many skills it assesses:
 *   1 skill  → 'mastery'  (single-skill proof; penalises on failure)
 *  >1 skill  → 'exam'     (irreducible synthesis; positive-only)
 *
 * This is only a sensible default for the authoring form — an author can
 * override it (e.g. mark a single-skill part as exam-kind deliberately).
 */
export function defaultKindForSkills(skillIds: string[]): QuestionKind {
  return skillIds.length > 1 ? 'exam' : 'mastery'
}

/** Total marks across all parts. */
export function totalMarks(parts: QuestionPart[]): number {
  return parts.reduce((sum, p) => sum + (p.marks || 0), 0)
}

/** An empty part with sensible defaults, for seeding the authoring form. */
export function emptyPart(): QuestionPart {
  return {
    prompt: '',
    skill_ids: [],
    answer_template: '',
    answer_type: 'numeric',
    tolerance: 0,
    requires_simplest: false,
    traps: [],
    marks: 1,
    kind: 'mastery',
    explanation: null,
  }
}

/** An empty blank with sensible defaults, for seeding the blanks editor. */
export function emptyBlank(label: string): Blank {
  return {
    label,
    answer_template: '',
    answer_type: 'numeric',
    tolerance: 0,
    requires_simplest: false,
    traps: [],
    marks: 1,
  }
}

/** First unused label from 'A'..'Z' (falls back to 'A?' beyond 26 blanks). */
export function nextBlankLabel(blanks: { label: string }[]): string {
  const used = new Set(blanks.map(b => b.label.trim().toUpperCase()))
  for (let i = 0; i < 26; i++) {
    const candidate = String.fromCharCode(65 + i)
    if (!used.has(candidate)) return candidate
  }
  return `A${blanks.length + 1}`
}

/** Total marks across a part's blanks. */
export function blankMarksTotal(blanks: { marks: number }[]): number {
  return blanks.reduce((sum, b) => sum + (b.marks || 0), 0)
}

/** Total marks across a grid's elements. */
export function gridMarksTotal(elements: { marks: number }[]): number {
  return elements.reduce((sum, e) => sum + (e.marks || 0), 0)
}

/** An empty grid with sensible defaults, for seeding the grid editor. */
export function emptyGrid(): GridInput {
  return {
    mode: 'points',
    x: { min: '0', max: '10', step: '1', label: 'x' },
    y: { min: '0', max: '10', step: '1', label: 'y' },
    background: '',
    solution: '',
    elements: [{ x: '', y: '', marks: 1 }],
    tolerance: 0,
  }
}

/**
 * The loose, editable representation of a part as it lives in the authoring
 * form, where numeric fields (tolerance, marks) are held as strings so they
 * can be partially typed / left blank. `normalizePart` cleans this into a
 * canonical QuestionPart ready for persistence.
 */
export type BlankInput = Omit<Blank, 'tolerance' | 'marks'> & {
  tolerance: string | number | null
  marks: string | number
}

/**
 * The loose, editable grid representation in the authoring form. Accepts
 * numbers too so a canonical Grid (e.g. a DB row loaded for editing) is
 * assignable without conversion, mirroring BlankInput.
 */
export type GridInput = {
  mode: Grid['mode']
  x: { min: string | number; max: string | number; step: string | number; label: string }
  y: { min: string | number; max: string | number; step: string | number; label: string }
  background: string
  solution?: string
  elements: {
    x: string | number; y: string | number; marks: string | number
    x2?: string | number
    style?: 'open' | 'closed'
    dir?: 'left' | 'right' | 'none'
  }[]
  tolerance: string | number
  traps?: GridTrapInput[]
}

/** The loose, editable trap representation in the authoring form. */
export type GridTrapInput = {
  elements: {
    x: string | number; y: string | number
    x2?: string | number
    style?: 'open' | 'closed'
    dir?: 'left' | 'right' | 'none'
  }[]
  response: string
  match?: 'exact' | 'translated'
}

export type PartInput = {
  prompt: string
  skill_ids: string[]
  answer_template: string
  answer_type: QuestionPart['answer_type']
  tolerance: string | number | null
  requires_simplest: boolean
  traps: PartTrap[]
  marks: string | number
  kind: QuestionKind
  explanation: string | null
  blanks?: BlankInput[]
  /** Banded mark scheme for a multi_blank part; see QuestionPart.mark_bands. */
  mark_bands?: MarkBand[]
  grid?: GridInput
}

/**
 * A form field that may be a plain number ("7", "3.5") or a template
 * ("{{c}}"). Numeric strings are stored as numbers; anything else is kept as a
 * template string for the param engine to render.
 */
function numberOrTemplate(v: string | number): number | string {
  if (typeof v === 'number') return v
  const t = v.trim()
  const n = Number(t)
  return t !== '' && Number.isFinite(n) ? n : t
}

export function normalizeGrid(g: GridInput): Grid {
  const traps = (g.traps ?? [])
    .map(t => ({
      elements: t.elements
        .filter(e => String(e.x).trim() !== '' || String(e.y).trim() !== '')
        .map(e => ({
          x: numberOrTemplate(String(e.x)),
          y: numberOrTemplate(String(e.y)),
          // A number_line trap IS a wrong circle or arrow, and a bars_free trap
          // IS a set of wrong widths, so these must survive normalisation.
          ...(e.x2 != null && String(e.x2).trim() !== '' ? { x2: numberOrTemplate(String(e.x2)) } : {}),
          ...(e.style ? { style: e.style } : {}),
          ...(e.dir ? { dir: e.dir } : {}),
        })),
      response: t.response ?? '',
      ...(t.match === 'translated' ? { match: 'translated' as const } : {}),
    }))
    // A translated trap is a predicate, so it needs no elements — but every
    // trap needs a response or it would match silently and say nothing.
    .filter(t => (t.match === 'translated' || t.elements.length > 0) && t.response.trim() !== '')
  const axis = (a: GridInput['x']): GridAxis => ({
    min: numberOrTemplate(a.min),
    max: numberOrTemplate(a.max),
    step: a.step === '' || a.step == null ? 1 : Number(a.step),
    label: a.label ?? '',
  })
  return {
    mode: g.mode,
    x: axis(g.x),
    y: axis(g.y),
    background: g.background ?? '',
    // Omitted when empty, keeping stored jsonb clean (mirrors blank.prompt).
    ...(g.solution && g.solution.trim() !== '' ? { solution: g.solution } : {}),
    // Drop wholly-empty element rows (no coordinates at all).
    elements: g.elements
      .filter(e => String(e.x).trim() !== '' || String(e.y).trim() !== '')
      .map(e => ({
        x: numberOrTemplate(String(e.x)),
        y: numberOrTemplate(String(e.y)),
        marks: e.marks === '' || e.marks == null ? 1 : Number(e.marks),
        // Mode-specific extras, omitted when unused so stored jsonb stays clean.
        ...(e.x2 != null && String(e.x2).trim() !== '' ? { x2: numberOrTemplate(String(e.x2)) } : {}),
        ...(e.style ? { style: e.style } : {}),
        ...(e.dir ? { dir: e.dir } : {}),
      })),
    tolerance: g.tolerance === '' || g.tolerance == null ? 0 : Number(g.tolerance),
    // A trap needs BOTH coordinates and a response to do anything, so drop it
    // if either is missing (scalar traps only check the template, but a
    // response-less grid trap would match silently and say nothing).
    ...(traps.length ? { traps } : {}),
  }
}

export function normalizeBlank(b: BlankInput): Blank {
  return {
    label: b.label.trim(),
    // Omitted entirely when empty, keeping stored jsonb clean.
    ...(b.prompt && b.prompt.trim() !== '' ? { prompt: b.prompt } : {}),
    answer_template: b.answer_template,
    answer_type: b.answer_type,
    tolerance: b.answer_type === 'numeric'
      ? (b.tolerance === '' || b.tolerance == null ? 0 : Number(b.tolerance))
      : null,
    requires_simplest: b.requires_simplest ?? false,
    traps: b.traps.filter(t => t.answer_template.trim() !== ''),
    marks: b.marks === '' || b.marks == null ? 1 : Number(b.marks),
    // Omitted when empty, keeping stored jsonb clean — but preserved when set,
    // so editing a question in the admin form never silently drops its ECF.
    ...(b.ecf_template && b.ecf_template.trim() !== '' ? { ecf_template: b.ecf_template.trim() } : {}),
  }
}

export function normalizePart(p: PartInput): QuestionPart {
  if (p.answer_type === 'grid_draw') {
    const grid = normalizeGrid(p.grid ?? emptyGrid())
    return {
      prompt: p.prompt,
      skill_ids: p.skill_ids,
      // The scalar answer fields are unused for grid_draw — the grid carries
      // the canonical answer. Blanked so stale form state never persists.
      // grid_draw parts have NO traps in v1 (trap machinery is scalar-string).
      answer_template: '',
      answer_type: 'grid_draw',
      tolerance: null,
      requires_simplest: false,
      traps: [],
      // Computed, never trusted from the form — the same invariant that keeps
      // totalMarks and the exam assembler correct with no changes there.
      marks: gridMarksTotal(grid.elements),
      kind: p.kind,
      explanation: p.explanation && p.explanation.trim() !== '' ? p.explanation : null,
      grid,
    }
  }
  if (p.answer_type === 'multi_blank') {
    const blanks = (p.blanks ?? []).map(normalizeBlank)
    // A banded scheme prices the PART by how many blanks are right; without one
    // the part is still the sum of its blanks (unchanged for existing questions).
    const bands = normalizeMarkBands(p.mark_bands)
    return {
      prompt: p.prompt,
      skill_ids: p.skill_ids,
      // The part-level answer fields are unused for multi_blank — each blank
      // carries its own. Blanked here so stale form state never persists.
      answer_template: '',
      answer_type: 'multi_blank',
      tolerance: null,
      requires_simplest: false,
      traps: [],
      // Computed, never trusted from the form: this single invariant is what
      // keeps totalMarks and the exam assembler correct with no changes there.
      marks: bands ? bandedMax(bands) : blankMarksTotal(blanks),
      kind: p.kind,
      explanation: p.explanation && p.explanation.trim() !== '' ? p.explanation : null,
      blanks,
      ...(bands ? { mark_bands: bands } : {}),
    }
  }
  return {
    prompt: p.prompt,
    skill_ids: p.skill_ids,
    answer_template: p.answer_template,
    answer_type: p.answer_type,
    tolerance: p.answer_type === 'numeric'
      ? (p.tolerance === '' || p.tolerance == null ? 0 : Number(p.tolerance))
      : null,
    // Default false for legacy parts that predate this field (lenient: a missing
    // flag must never cause a correct answer to be rejected).
    requires_simplest: p.requires_simplest ?? false,
    // Drop wholly-empty trap rows (no wrong-answer template).
    traps: p.traps.filter(t => t.answer_template.trim() !== ''),
    marks: p.marks === '' || p.marks == null ? 1 : Number(p.marks),
    kind: p.kind,
    explanation: p.explanation && p.explanation.trim() !== '' ? p.explanation : null,
  }
}
