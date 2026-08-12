/**
 * The question showcase behind /demo/questions — a curated tour of what the
 * bank can actually ask, drawn LIVE from published questions.
 *
 * Why a hand-picked list rather than a query: /practice serves questions at
 * random, so a prospective teacher clicking "Start" three times can easily get
 * three plain type-a-number questions and conclude the bank is a worksheet
 * generator. The capabilities that take real work — diagrams, multi-part stems,
 * drawing on a grid, filling in a frequency tree, multi-skill synthesis — are
 * exactly the ones random sampling hides. This module names two questions per
 * capability so the range is visible in one screen.
 *
 * Every id below has been through scripts/verify-question.ts. If one is later
 * unpublished or deleted the fetch simply skips it — a missing exemplar must
 * never 500 the page a prospect was sent.
 */

import { createClient } from '@supabase/supabase-js'
import {
  renderQuestion,
  renderMultiPartQuestion,
  type Parameters,
} from './questions/paramEngine'
import { checkAnswer } from './questions/answerChecker'
import { buildGridSvg } from './questions/gridSvg'
import type { RenderedGrid } from './questions/gridDraw'
import type { QuestionPart } from './questions/parts'
import { isScalarAnswerType, type ScalarAnswerType } from './questions/answerTypes'
import { skillsById } from './skills/skillGraph'

// ─── Groups ─────────────────────────────────────────────────────────────────

export type ShowcaseGroupId =
  | 'traps' | 'answer_types' | 'diagrams' | 'multipart'
  | 'drawing' | 'diagram_blanks' | 'synthesis'

export type ShowcaseGroup = {
  id: ShowcaseGroupId
  title: string
  /** What a teacher should take from this group — the reason it is here. */
  blurb: string
}

export const SHOWCASE_GROUPS: ShowcaseGroup[] = [
  {
    id: 'traps',
    title: 'Targeted misconception feedback',
    blurb: 'Wrong answers are anticipated at authoring time, one written response each, so a student is told which mistake they made rather than just that they were wrong. These are per-question — 650+ of them coded across the bank.',
  },
  {
    id: 'answer_types',
    title: 'Answers that are not just a number',
    blurb: 'Expressions, fractions, ratios, coordinates, sets and index notation are each graded on their own terms. This half is NOT authored per question: accepting an uncancelled fraction, or the brackets of a factorisation in either order, is the grader\'s job and applies to every question of that type. The strips below are live verdicts from it, not claims.',
  },
  {
    id: 'diagrams',
    title: 'Diagram questions',
    blurb: 'Geometry is drawn, not described. The diagram is generated from the same parameters as the question, so every re-roll produces a correctly labelled figure.',
  },
  {
    id: 'multipart',
    title: 'Multi-part questions with a shared stem',
    blurb: 'Exam-style (a)/(b)/(c) built on one piece of information, each part carrying its own marks and its own skill — so a student who reads the graph correctly but slips on the final total is credited for what they got right.',
  },
  {
    id: 'drawing',
    title: 'Drawing on a grid',
    blurb: 'Reflections, enlargements, plotting lines, completing histograms — marked on the placement, not on a typed answer. This is the part of the paper most online practice quietly skips.',
  },
  {
    id: 'diagram_blanks',
    title: 'Filling in a diagram or table',
    blurb: 'Frequency trees, Venn diagrams and two-way tables with several labelled blanks, graded independently and banded the way a real mark scheme bands them.',
  },
  {
    id: 'synthesis',
    title: 'Multi-skill synthesis',
    blurb: 'Questions that need two independent skills in one answer. These are marked positive-only: getting one right proves synthesis, getting it wrong routes to revision rather than penalising either underlying skill.',
  },
]

// ─── The curated set ────────────────────────────────────────────────────────

type Curated = {
  id: string
  group: ShowcaseGroupId
  note: string
  /**
   * Show the grader-equivalence strip on this card (see deriveProbes).
   * Opt-in rather than automatic: on a card whose point is the diagram or the
   * mark split, a list of alternative typings is noise.
   */
  probe?: boolean
}

/**
 * Two exemplars per group. `note` is the one-line "what to look at" shown on
 * the card — written for someone evaluating the product, not for a student.
 */
const CURATED: Curated[] = [
  { id: 'dfa2e8a0-67e7-4847-b686-7cd008a1c778', group: 'traps', probe: true,
    note: 'Four coded wrong answers. Drop the sign on the second bracket and it says so; forget the middle terms entirely and it says that instead.' },
  { id: '36697be7-944c-49a2-bab3-28d0acf9fb19', group: 'traps',
    note: 'Adding the two shorter sides instead of squaring them is the classic Pythagoras error — and it gets its own response.' },

  { id: 'e291d373-5e2b-4bfd-be16-7d5efec5e849', group: 'answer_types', probe: true,
    note: 'Graded as an expression, not as a string — so the order the student writes the brackets in is their business, not the marker’s.' },
  { id: '8466102b-84a5-45de-b4dd-951d620be1f1', group: 'answer_types', probe: true,
    note: 'Index notation. Superscripts and carets are the same answer; writing the multiplication out longhand is not, because that is not what was asked for.' },

  // Chosen over the (equally good-looking) cone question because its tolerance
  // is 0, so the rounding probes below actually have something to show — the
  // cone allows ±0.5 despite asking for 2 dp, which swallows them.
  { id: 'c143a0a6-dea6-41d1-b79b-e6405ae319fc', group: 'diagrams', probe: true,
    note: 'The triangle is redrawn for whichever angle and side are generated — and the answer is marked to the accuracy the question asked for.' },
  { id: '29c84c18-d130-4f62-a657-b83cefb67a0a', group: 'diagrams',
    note: 'A cyclic quadrilateral with the angles marked algebraically — the figure carries the information the question needs.' },

  { id: '0b7c11be-ec6e-4330-a587-e871c396fde4', group: 'multipart',
    note: 'One velocity–time graph, three parts, 2 + 2 + 3 marks. Part (c) depends on (a) and (b) but is graded on its own.' },
  { id: 'b18d7b90-01cf-4c41-9e7a-847ff63e77d9', group: 'multipart', probe: true,
    note: 'Without replacement, three fraction answers — each part attributed to tree diagrams separately.' },

  { id: '724fac52-7787-45b9-8ef1-2c57e5f23e79', group: 'drawing',
    note: 'Tap the grid to place the reflected triangle. Marked per vertex, with feedback for reflecting in the wrong line. The mirror line moves with the parameters.' },
  { id: '5cd8a43d-a9f4-4eb7-a8a8-a7c6cba52f55', group: 'drawing',
    note: 'A histogram with unequal class widths — the student draws the bars and the widths are part of the mark.' },

  { id: '46fca112-f71c-4d25-b6c2-a8a2cad4cef5', group: 'diagram_blanks',
    note: 'A frequency tree with several blanks. Each is graded independently, and later branches follow through from earlier ones.' },
  { id: 'f590056a-b4d2-4bfb-a190-98b033828233', group: 'diagram_blanks',
    note: 'Venn diagram regions, filled in against the SVG rather than typed as a list.' },

  { id: '9657a229-39b6-4e14-8141-dbf358cfcb10', group: 'synthesis', probe: true,
    note: 'Ratio and coordinates in one answer — neither is a prerequisite of the other, so the question genuinely tests putting them together.' },
  { id: 'e9a09aa3-9589-4ebe-b1a6-5988571eada3', group: 'synthesis',
    note: 'Rationalising a surd inside an area problem. Higher tier, five stars.' },
]

// ─── Grader equivalence probes ──────────────────────────────────────────────

/**
 * One alternative way of writing the answer, put through the REAL grader.
 *
 * Traps are authored one question at a time; equivalence is not. Accepting
 * 6/8 for 3/4, accepting the two brackets of a factorisation in either order,
 * telling a student their value is right but a place out in the rounding —
 * none of that is written per question, it is what lib/questions/answerChecker
 * does for every question of that answer type. Which means none of it is
 * visible from looking at a question, and a teacher evaluating the bank would
 * reasonably assume the marking is string equality.
 *
 * So: derive alternative answers from whatever the canonical answer rendered to
 * this hour, run `checkAnswer` over them at build time, and print what actually
 * came back. Nothing here is claimed — it is the grader's own verdict and the
 * grader's own words.
 */
export type Probe = {
  /** The alternative answer, as a student would type it. */
  input: string
  /** The grader's verdict. */
  accepted: boolean
  /** What is being demonstrated, in the page's voice. */
  label: string
  /** The grader's own message, with markup stripped for a plain-text chip. */
  note: string
}

/** A candidate probe before it is graded: the input plus what it demonstrates. */
type Candidate = {
  input: string
  label: string
  /**
   * Keep this probe even if the grader answers with its generic "Not quite. The
   * correct answer is …". Normally that is filtered out as uninformative, but
   * for a form we are deliberately showing to be WRONG (longhand where index
   * notation was asked for) the plain refusal is the point.
   */
  keepGeneric?: boolean
  /**
   * Drop this probe unless the grader says something beyond a bare "Correct!".
   *
   * The rounding probes exist to show the rounding MESSAGE. Whether they get
   * one depends on the question's tolerance: the cone question renders to 2 dp
   * but carries a tolerance of 0.5, so a value "one out in the last decimal
   * place" sails through as simply correct — and a row labelled "one out in the
   * last decimal place ✓ Correct!" claims the opposite of what it shows.
   */
  requiresNote?: boolean
}

const asFraction = (s: string) => s.trim().match(/^(-?\d+)\s*\/\s*(\d+)$/)

/** Euclid, for reducing a fraction before testing whether it terminates. */
function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { [a, b] = [b, a % b] }
  return a || 1
}

/** Decimal places in the first number of a rendered answer ("3.29 cm" → 2). */
function dpOf(s: string): number {
  const m = s.match(/-?\d+(?:\.(\d+))?/)
  return m && m[1] ? m[1].length : 0
}

/**
 * Rewrite the FIRST number in an answer, leaving any unit in place.
 *
 * "16.76 cm³" must become "16.7612 cm³", not "16.76 cm³12" — the naive
 * string-append produced the latter, which is not something a student could
 * ever type.
 */
function mapFirstNumber(s: string, fn: (n: string) => string): string | null {
  const m = s.match(/-?\d+(?:\.\d+)?/)
  if (!m || m.index === undefined) return null
  return s.slice(0, m.index) + fn(m[0]) + s.slice(m.index + m[0].length)
}

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/** "3² × 5" → "3^2 × 5". Answers are authored with real superscripts. */
function caretForm(s: string): string {
  return s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, run =>
    '^' + [...run].map(ch => SUPERSCRIPTS.indexOf(ch)).join(''))
}

/**
 * Split an expression into its top-level additive terms, signs attached.
 * "x^2+2x-3" → ["x^2", "+2x", "-3"]. Mirrors the grader's own splitter, which
 * is what makes the reordered probe a fair test of it.
 */
function topLevelTerms(s: string): string[] {
  const terms: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') { depth++; current += ch }
    else if (ch === ')') { depth--; current += ch }
    else if (depth === 0 && (ch === '+' || ch === '-') && i > 0) { terms.push(current); current = ch }
    else current += ch
  }
  if (current) terms.push(current)
  return terms
}

/** Rejoin terms in reverse, fixing up the leading and joining signs. */
function reversedTerms(s: string): string | null {
  const terms = topLevelTerms(s.trim())
  if (terms.length < 2) return null
  return terms
    .reverse()
    .map((t, i) => {
      if (i === 0) return t.startsWith('+') ? t.slice(1) : t
      return t.startsWith('+') || t.startsWith('-') ? t : '+' + t
    })
    .join('')
}

/**
 * Alternative forms worth trying for this answer type.
 *
 * Every generator returns null when it does not apply, so a question simply
 * gets fewer probes rather than a contrived one. They are ordered most- to
 * least-interesting; the card shows the first few that survive grading.
 */
function candidates(answer: string, type: ScalarAnswerType): Candidate[] {
  const out: Candidate[] = []
  const a = answer.trim()

  if (type === 'fraction') {
    const f = asFraction(a)
    if (f) {
      const [, n, d] = f
      out.push({
        input: `${Number(n) * 2}/${Number(d) * 2}`,
        label: 'the same fraction, not cancelled down',
      })
      const value = Number(n) / Number(d)
      // Which branch applies turns on whether the fraction TERMINATES, so test
      // that directly — reduce, then strip 2s and 5s, exactly as the grader's
      // own hasTerminatingDecimal does. An earlier version guessed from the
      // length of String(value), which quietly mislabelled the likes of 1/64
      // (= 0.015625, terminating, but 7 digits) as recurring.
      let den = Number(d) / gcd(Number(n), Number(d))
      while (den % 2 === 0) den /= 2
      while (den % 5 === 0) den /= 5
      if (den === 1) {
        out.push({ input: String(value), label: 'written as a decimal' })
      } else {
        out.push({ input: value.toFixed(4), label: 'a rounded decimal — this fraction never terminates' })
      }
    }
  }

  if (type === 'expression' || type === 'exact') {
    // (x+7)(x−7) → (x−7)(x+7)
    const brackets = a.match(/^(\([^()]+\))\s*(\([^()]+\))$/)
    if (brackets) out.push({ input: brackets[2] + brackets[1], label: 'the two brackets the other way round' })
    // x^2+2x-3 → -3+2x+x^2
    if (!brackets) {
      const reordered = reversedTerms(a)
      if (reordered) out.push({ input: reordered, label: 'the terms written in a different order' })
    }
    // Powers are authored as real superscripts ("3² × 5"), so work off the
    // caret form — the grader normalises both to the same thing.
    const caret = caretForm(a)
    if (caret.includes('^')) {
      out.push({ input: caret, label: 'the power typed with a ^ instead of a superscript' })
      // Longhand: 3^2 × 5 → 3 × 3 × 5. Deliberately NOT accepted when the
      // question asked for index notation, which is the whole claim.
      const longhand = caret.replace(/(\d)\^(\d)/g, (_, base: string, exp: string) =>
        Array(Number(exp)).fill(base).join(' × '))
      if (longhand !== caret) {
        out.push({ input: longhand, label: 'the multiplication written out longhand', keepGeneric: true })
      }
      out.push({ input: caret.replace(/\^/g, ''), label: 'the power typed without a ^ at all' })
    }
  }

  if (type === 'ratio' && a.includes(':')) {
    const parts = a.split(':').map(p => p.trim())
    if (parts.every(p => /^\d+$/.test(p))) {
      out.push({ input: parts.map(p => Number(p) * 3).join(' : '), label: 'an equivalent ratio, not simplified' })
    }
  }

  if (type === 'coordinate') {
    const bare = a.replace(/[()]/g, '').trim()
    if (bare !== a) out.push({ input: bare, label: 'typed without the brackets' })
    const xy = bare.split(',').map(p => p.trim())
    if (xy.length === 2) out.push({ input: `x = ${xy[0]}, y = ${xy[1]}`, label: 'written as x = …, y = …' })
  }

  if (type === 'numeric') {
    const dp = dpOf(a)
    if (dp >= 1 && dp <= 4) {
      // Extra digits that do not change how the value rounds — the full
      // calculator display, which is what the student has in front of them.
      const unrounded = mapFirstNumber(a, n => `${n}12`)
      if (unrounded) out.push({ input: unrounded, label: 'the full calculator value, not rounded', requiresNote: true })
      const oneOut = mapFirstNumber(a, n => {
        const v = Number(n)
        return Number.isFinite(v) ? (v + Math.pow(10, -dp)).toFixed(dp) : n
      })
      if (oneOut && oneOut !== a) {
        out.push({ input: oneOut, label: 'one out in the last decimal place', requiresNote: true })
      }
    }
  }

  return out
}

/** Markup out, whitespace tidied — the grader's messages carry <strong> tags. */
function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Grade every candidate and keep the ones that say something.
 *
 * A candidate that lands on a generic "Not quite. The correct answer is …" is
 * dropped: it demonstrates nothing beyond the answer being wrong, and printing
 * it would just give away the answer.
 */
function deriveProbes(
  answer: string,
  type: ScalarAnswerType,
  tolerance: number | null,
  traps: { answer: string; response: string }[],
  requiresSimplest: boolean,
  limit = 3,
): Probe[] {
  const probes: Probe[] = []
  for (const c of candidates(answer, type)) {
    let result
    try {
      result = checkAnswer(c.input, answer, type, tolerance, traps, requiresSimplest)
    } catch {
      continue
    }
    const note = plainText(result.message)
    if (!result.correct && !c.keepGeneric && note.startsWith('Not quite. The correct answer is')) continue
    // A bare "Correct!" does not demonstrate what this candidate promised.
    if (c.requiresNote && result.correct && note === 'Correct!') continue
    probes.push({ input: c.input, accepted: result.correct, label: c.label, note })
    if (probes.length >= limit) break
  }
  return probes
}

// ─── Fetch & render ─────────────────────────────────────────────────────────

const SHOWCASE_COLUMNS =
  'id, question_template, answer_template, answer_type, tolerance, requires_simplest, traps, ' +
  'parameters, explanation, skill_ids, difficulty, kind, parts, calculator'

type Row = {
  id: string
  question_template: string
  answer_template: string
  answer_type: string
  tolerance: number | null
  requires_simplest: boolean | null
  traps: { answer_template: string; response: string }[] | null
  parameters: Parameters | null
  explanation: string | null
  skill_ids: string[] | null
  difficulty: number
  kind: 'mastery' | 'exam' | null
  parts: QuestionPart[] | null
  calculator: string | null
}

export type ShowcasePart = {
  label: string
  promptHtml: string
  marks: number
  answerType: string
  /** Static picture of an empty grid, for grid_draw parts. */
  gridSvg?: string
  /** Labels of a multi_blank part's boxes ('A', 'B', …). */
  blankLabels?: string[]
}

export type ShowcaseQ = {
  id: string
  group: ShowcaseGroupId
  note: string
  skillNames: string[]
  topic: string
  difficulty: number
  kind: 'mastery' | 'exam'
  calculator: string | null
  marks: number | null
  trapCount: number
  hasExplanation: boolean
  stemHtml: string
  parts: ShowcasePart[]
  /** Real grader verdicts on alternative ways of writing the answer. */
  probes: Probe[]
}

const PART_LABELS = 'abcdefgh'

/**
 * Make a grid SVG fluid.
 *
 * buildGridSvg emits fixed `width`/`height` attributes because its usual
 * consumers are the interactive canvas and the harness's rasteriser, both of
 * which want real pixels. On a phone a fixed 336px grid overflows the card, so
 * drop the attributes and let the viewBox scale it.
 */
function fluidSvg(svg: string): string {
  return svg.replace(/^<svg /, '<svg style="width:100%;height:auto" ')
    .replace(/ width="\d+(?:\.\d+)?" height="\d+(?:\.\d+)?"/, '')
}

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Render one row into a preview. Deliberately renders the QUESTION only — no
 * answer, no trap responses cross the wire, since the card is a shop window and
 * "Try it live" hands the visitor to the real /practice page for the graded
 * version.
 */
function toShowcase(row: Row, c: Curated): ShowcaseQ {
  const skillIds = row.skill_ids ?? []
  const skillNames = skillIds.map(id => skillsById[id]?.name ?? id)
  const parts = row.parts ?? []

  let stemHtml: string
  const rendered: ShowcasePart[] = []
  let probes: Probe[] = []

  if (parts.length > 0) {
    const r = renderMultiPartQuestion(row.question_template, parts, row.parameters ?? {})
    stemHtml = r.stem
    // Probe the first scalar part: a multi-part question has no single
    // canonical answer, and part (a) is the one a reader has just looked at.
    if (c.probe) {
      const i = parts.findIndex((p, n) => isScalarAnswerType(p.answer_type) && !!r.parts[n]?.answer)
      if (i >= 0) {
        probes = deriveProbes(
          r.parts[i].answer, parts[i].answer_type as ScalarAnswerType,
          parts[i].tolerance, r.parts[i].traps, parts[i].requires_simplest ?? false,
        )
      }
    }
    r.parts.forEach((p, i) => {
      const part = parts[i]
      rendered.push({
        label: `(${PART_LABELS[i] ?? i + 1})`,
        promptHtml: p.prompt,
        marks: part.marks,
        answerType: part.answer_type,
        // An empty grid with no student points and no answer revealed: the
        // visitor sees the axes and the shape they'd be transforming, which is
        // the whole point of showing a drawing question at all.
        ...(p.grid ? { gridSvg: fluidSvg(buildGridSvg(p.grid as RenderedGrid)) } : {}),
        ...(part.blanks?.length ? { blankLabels: part.blanks.map(b => b.label) } : {}),
      })
    })
  } else {
    const r = renderQuestion(
      row.question_template, row.answer_template, row.traps ?? [],
      row.explanation, row.parameters ?? {},
    )
    stemHtml = r.question
    if (c.probe && isScalarAnswerType(row.answer_type)) {
      probes = deriveProbes(
        r.answer, row.answer_type, row.tolerance, r.traps, row.requires_simplest ?? false,
      )
    }
  }

  const trapCount = parts.length > 0
    ? parts.reduce((n, p) =>
        n + (p.traps?.length ?? 0) + (p.blanks ?? []).reduce((m, b) => m + (b.traps?.length ?? 0), 0), 0)
    : (row.traps?.length ?? 0)

  return {
    id: row.id,
    group: c.group,
    note: c.note,
    skillNames,
    topic: skillsById[skillIds[0]]?.topic ?? 'GCSE Maths',
    difficulty: row.difficulty,
    kind: row.kind ?? 'mastery',
    calculator: row.calculator,
    marks: parts.length > 0 ? parts.reduce((n, p) => n + (p.marks || 0), 0) : null,
    trapCount,
    hasExplanation: parts.length > 0
      ? parts.some(p => !!p.explanation)
      : !!row.explanation,
    stemHtml,
    parts: rendered,
    probes,
  }
}

/**
 * The curated questions, rendered and in CURATED order.
 *
 * Returns whatever it can: a question that has since been unpublished is
 * dropped rather than throwing, and a total failure yields [] so the page can
 * fall back to its own empty state.
 */
export async function fetchShowcase(): Promise<ShowcaseQ[]> {
  const { data, error } = await client()
    .from('questions')
    .select(SHOWCASE_COLUMNS)
    .eq('is_published', true)
    .in('id', CURATED.map(c => c.id))
  if (error || !data) return []

  const byId = new Map((data as unknown as Row[]).map(r => [r.id, r]))
  const out: ShowcaseQ[] = []
  for (const c of CURATED) {
    const row = byId.get(c.id)
    if (!row) continue
    try {
      out.push(toShowcase(row, c))
    } catch {
      // A render failure on one exemplar must not take the tour down.
    }
  }
  return out
}

// ─── Bank-wide headline numbers ─────────────────────────────────────────────

export type BankStats = {
  questions: number
  skills: number
  traps: number
  diagrams: number
  multipart: number
  synthesis: number
  explanations: number
}

/**
 * The claims made at the top of the showcase, counted from the live bank rather
 * than typed into the copy — a marketing page that quietly goes out of date is
 * worse than no number at all.
 *
 * Templates are excluded from the select (they carry the SVGs and would be
 * megabytes); the diagram count comes from a separate head-count instead.
 */
export async function fetchBankStats(): Promise<BankStats | null> {
  const supabase = client()
  const [rows, diagrams] = await Promise.all([
    supabase.from('questions')
      .select('skill_ids, traps, parts, kind, explanation')
      .eq('is_published', true),
    supabase.from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .ilike('question_template', '%<svg%'),
  ])
  if (rows.error || !rows.data) return null

  const skills = new Set<string>()
  let traps = 0, multipart = 0, synthesis = 0, explanations = 0
  for (const q of rows.data as unknown as Row[]) {
    for (const s of q.skill_ids ?? []) skills.add(s)
    const parts = q.parts ?? []
    traps += (q.traps?.length ?? 0)
    for (const p of parts) {
      traps += (p.traps?.length ?? 0)
      for (const b of p.blanks ?? []) traps += (b.traps?.length ?? 0)
    }
    if (parts.length > 0) multipart++
    if (q.kind === 'exam') synthesis++
    if (q.explanation || parts.some(p => p.explanation)) explanations++
  }

  return {
    questions: rows.data.length,
    skills: skills.size,
    traps,
    diagrams: diagrams.count ?? 0,
    multipart,
    synthesis,
    explanations,
  }
}
