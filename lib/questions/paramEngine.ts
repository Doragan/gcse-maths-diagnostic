export type ConstraintConfig = {
  type: 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'multiple_of' | 'factor_of' | 'not_zero' | 'is_prime' | 'is_even' | 'is_odd'
  target?: string | number
  target_type?: 'parameter' | 'value'
}

export type ParameterConfig = {
  type: 'integer' | 'decimal'
  min: number
  max: number
  decimal_places?: number
  constraint?: ConstraintConfig
  constraints?: ConstraintConfig[]
}

export type Parameters = Record<string, ParameterConfig>

export function isPrime(n: number): boolean {
  if (n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false
  }
  return true
}

function checkConstraint(
  constraint: ConstraintConfig,
  value: number,
  generated: Record<string, number>
): boolean {
  const target = constraint.target_type === 'parameter'
    ? generated[constraint.target as string]
    : constraint.target as number

  switch (constraint.type) {
    case 'neq': return value !== target
    case 'gt': return value > target
    case 'gte': return value >= target
    case 'lt': return value < target
    case 'lte': return value <= target
    case 'multiple_of': return target !== 0 && value % target === 0
    case 'factor_of': return value !== 0 && (target as number) % value === 0
    case 'not_zero': return value !== 0
    case 'is_even': return value % 2 === 0
    case 'is_odd': return value % 2 !== 0
    case 'is_prime': return isPrime(value)
    default: return true
  }
}

const constraintsOf = (config: ParameterConfig): ConstraintConfig[] => [
  ...(config.constraint ? [config.constraint] : []),
  ...(config.constraints ?? []),
]

export function generateValues(parameters: Parameters): Record<string, number> {
  const entries = Object.entries(parameters)

  // OUTER loop: generate the whole set, then validate EVERY constraint against
  // the COMPLETE set, regenerating if any fails. This makes generation
  // order-independent — essential because a parameter's constraint can reference
  // another parameter that is generated later (Postgres jsonb does not preserve
  // object-key insertion order; it sorts keys, so `c`'s `c < n` constraint can
  // run before `n` exists). The per-parameter pass below still satisfies
  // backward references quickly; the outer pass catches forward references.
  let last: Record<string, number> = {}
  for (let pass = 0; pass < 80; pass++) {
    const generated: Record<string, number> = {}

    for (const [key, config] of entries) {
      const constraintList = constraintsOf(config)
      let attempts = 0
      let value = 0
      do {
        if (config.type === 'decimal') {
          const places = config.decimal_places ?? 1
          const factor = Math.pow(10, places)
          const min = Math.round(config.min * factor)
          const max = Math.round(config.max * factor)
          value = Math.floor(Math.random() * (max - min + 1) + min) / factor
        } else {
          value = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min
        }
        attempts++
        if (constraintList.length === 0 || attempts >= 100) break
        if (constraintList.every(c => checkConstraint(c, value, generated))) break
      } while (true)
      generated[key] = value
    }

    last = generated
    const allOk = entries.every(([key, config]) =>
      constraintsOf(config).every(c => checkConstraint(c, generated[key], generated)))
    if (allOk) return generated
  }

  // Couldn't satisfy every constraint (e.g. an unsatisfiable spec) — return the
  // last attempt rather than hanging, matching the old give-up behaviour.
  return last
}

/**
 * True when a COMPLETE value set satisfies every constraint on every parameter.
 * Used by the authoring verification harness (scripts/verify-question.ts) to
 * filter an exhaustive enumeration of the parameter space down to the value
 * sets that generateValues could actually produce.
 */
export function satisfiesAllConstraints(
  parameters: Parameters,
  values: Record<string, number>,
): boolean {
  return Object.entries(parameters).every(([key, config]) =>
    constraintsOf(config).every(c => checkConstraint(c, values[key], values)))
}

/**
 * Robust decimal rounding that avoids IEEE 754 floating point errors.
 *
 * The problem: 4.45 is stored in binary as 4.44999999999..., so
 * Math.round(4.449999... * 10) / 10 = 4.4, not the correct 4.5.
 *
 * The fix: JavaScript's number-to-string conversion (toString) is correct —
 * it knows to print "4.45", not "4.449999...". By building a string like
 * "4.45e+1" from the number, we get 44.5 exactly (which IS representable),
 * and from there Math.round works correctly.
 *
 * Available as `round(n, places)` inside all question and answer templates.
 */
function robustRound(n: number, places: number): number {
  return Number(Math.round(+(n + 'e+' + places)) + 'e-' + places)
}

/**
 * Greatest common divisor (Euclidean algorithm).
 * Used in answer templates to produce fully-simplified fractions,
 * e.g. {{fracStr(a*c, b*d)}}
 */
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b > 0) { [a, b] = [b, a % b] }
  return a
}

/**
 * Return a fraction as plain text, automatically simplifying and collapsing
 * whole numbers: fracStr(6, 1) → "6", fracStr(3, 4) → "3/4".
 *
 * Use in answer_template and trap answer_template so the "correct answer"
 * shown in feedback is always in its cleanest form.
 * For HTML display inside questions/explanations, use frac() instead.
 */
function fracStr(numerator: number, denominator: number): string {
  const g = gcd(numerator, denominator)
  const n = Math.round(numerator / g)
  const d = Math.round(denominator / g)
  return d === 1 ? String(n) : `${n}/${d}`
}

/**
 * Render a fraction as a vertically-stacked HTML fraction with a horizontal
 * bar — identical to how fractions appear in textbooks.
 *
 *   frac(3, 4)   →  ³⁄₄  (displayed as a proper stacked fraction)
 *   frac(x+1, 2) →  works for algebraic expressions too (pass strings)
 *
 * Uses inline-flex so it flows naturally inside a sentence without extra CSS.
 * The result is safe to embed in dangerouslySetInnerHTML question HTML.
 */
function htmlFrac(numerator: number | string, denominator: number | string): string {
  return (
    `<span style="display:inline-flex;flex-direction:column;align-items:center;` +
    `vertical-align:middle;margin:0 3px;font-size:0.9em;line-height:1.3;">` +
    `<span style="border-bottom:1px solid currentColor;padding:0 4px;text-align:center;">${numerator}</span>` +
    `<span style="padding:0 4px;text-align:center;">${denominator}</span>` +
    `</span>`
  )
}

// Helper functions exposed to every template expression.
// Add new helpers here; they will be available by name in {{...}} blocks.
const TEMPLATE_HELPERS: Record<string, unknown> = {
  round: robustRound,
  frac: htmlFrac,
  gcd,
  fracStr,
}

/**
 * Fix two common display problems that arise when negative parameters are
 * substituted into templates:
 *
 *   1. Double-sign collapse
 *      "2n + -5"  →  "2n - 5"     (positive + negative  → subtract)
 *      "2n - -5"  →  "2n + 5"     (negative - negative  → add)
 *
 *   2. Invisible coefficient of 1
 *      "1x"  →  "x"               (leading 1 before a variable)
 *      "-1x" →  "-x"              (leading -1 before a variable)
 *
 *   3. Redundant zero constant term
 *      "5n + 0"  →  "5n"          (additive identity)
 *      "-7n - 0" →  "-7n"
 *
 * Applied only to text nodes (content between HTML tags) so it never
 * mangles CSS property values (e.g. "1px", "1em") or HTML attributes
 * inside tag definitions.
 */
function cleanExpression(s: string): string {
  // Split into alternating HTML-tag and text-node segments.
  // Only the text nodes (group 2) are cleaned; tag markup (group 1) passes through.
  return s.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, text) => {
    if (tag) return tag // HTML tag — pass through completely unchanged
    return text
      // Collapse "+" followed by "-" into a single "-" (with tidy spacing)
      .replace(/\s*\+\s*-\s*/g, ' - ')
      // Collapse "--" (double negative) into "+" (with tidy spacing)
      .replace(/\s*-\s*-\s*/g, ' + ')
      // Remove coefficient of 1 before a letter: "1x" → "x", "-1x" → "-x"
      // Negative lookbehind (?<![0-9.]) prevents "11x" or "0.1x" from matching.
      .replace(/(?<![0-9.])1([a-zA-Z])/g, '$1')
      // Drop a redundant "+ 0" / "- 0" constant term: "5n + 0" → "5n".
      // Requires a leading sign (so "10", "100" never match) and a lookahead
      // (?![0-9.a-zA-Z]) so "+ 05", "+ 0.5" and a "0n" coefficient are left alone.
      .replace(/\s*[+-]\s*0(?![0-9.a-zA-Z])/g, '')
  })
}

export function evaluateTemplate(
  template: string,
  generated: Record<string, number>
): string {
  const evaluated = template.replace(/\{\{([\s\S]+?)\}\}/g, (_, expr) => {
    try {
      const fn = new Function(
        ...Object.keys(generated),
        ...Object.keys(TEMPLATE_HELPERS),
        `return ${expr}`,
      )
      return fn(...Object.values(generated), ...Object.values(TEMPLATE_HELPERS)).toString()
    } catch {
      return `[error: ${expr}]`
    }
  })
  return cleanExpression(evaluated)
}

/** A scalar trap as authored — the shape every trap-bearing level shares. */
export type TrapTemplate = {
  answer_template: string
  response: string
  /** Method marks the trap proves; see PartTrap in lib/questions/parts.ts. */
  method_marks?: number
}

export type RenderedTrap = {
  answer: string
  response: string
  method_marks?: number
}

/**
 * Render one trap against the shared value set.
 *
 * Centralised because traps hang off four levels (question, part, blank, grid)
 * and a field dropped at any one of them fails silently — the trap still
 * matches, it just quietly loses whatever the omitted field controlled. That is
 * exactly how `style`/`dir` were lost on number-line traps.
 *
 * `method_marks` is omitted when unset rather than defaulted to 0: unset means
 * "we don't know what method this proves", which is a different claim from
 * "this proves none", and the exam scorer treats them differently.
 */
export function renderTrap(t: TrapTemplate, generated: Record<string, number>): RenderedTrap {
  return {
    answer: evaluateTemplate(t.answer_template, generated),
    response: evaluateTemplate(t.response, generated),
    ...(typeof t.method_marks === 'number' ? { method_marks: t.method_marks } : {}),
  }
}

export type RenderedQuestion = {
  question: string
  answer: string
  traps: RenderedTrap[]
  explanation: string
  generatedValues: Record<string, number>
}

export function renderQuestion(
  questionTemplate: string,
  answerTemplate: string,
  traps: TrapTemplate[],
  explanation: string | null,
  parameters: Parameters,
  fixedValues?: Record<string, number>
): RenderedQuestion {
  const generated = fixedValues ?? generateValues(parameters)
  return {
    question: evaluateTemplate(questionTemplate, generated),
    answer: evaluateTemplate(answerTemplate, generated),
    traps: traps.map(t => renderTrap(t, generated)),
    explanation: explanation ? evaluateTemplate(explanation, generated) : '',
    generatedValues: generated,
  }
}

export type RenderedPart = {
  prompt: string
  answer: string
  traps: RenderedTrap[]
  explanation: string
  // Only for multi_blank parts: each labelled blank's rendered prompt, answer + traps.
  // `ecf` is the errors-carried-forward formula with parameters already
  // substituted; its [[SIBLING]] refs survive to marking time.
  blanks?: { label: string, prompt: string, answer: string, ecf?: string, traps: RenderedTrap[] }[]
  // Only for grid_draw parts: the grid spec with every template evaluated to a
  // number (a bad template renders to NaN — callers guard on finiteness).
  grid?: {
    mode: string
    x: { min: number, max: number, step: number, label: string }
    y: { min: number, max: number, step: number, label: string }
    background: string
    solution: string
    elements: {
      x: number, y: number, marks: number
      x2?: number
      style?: 'open' | 'closed'
      dir?: 'left' | 'right' | 'none'
    }[]
    tolerance: number
    traps: {
      elements: { x: number, y: number, x2?: number, style?: 'open' | 'closed', dir?: 'left' | 'right' | 'none' }[]
      response: string
      match?: 'exact' | 'translated'
    }[]
  }
}

export type RenderedMultiPartQuestion = {
  stem: string
  parts: RenderedPart[]
  generatedValues: Record<string, number>
}

/**
 * Render a multi-part question: the shared stem plus every part, all against
 * ONE shared generated value set so a later part can reference values (and
 * therefore working) from an earlier part — e.g. part (b)'s template using
 * {{a}}. Pass `fixedValues` to re-render an existing attempt deterministically.
 *
 * `parts` is intentionally loosely typed here (the canonical QuestionPart lives
 * in lib/questions/parts.ts) so this engine module stays free of higher-level
 * type imports; only the template-bearing fields are read.
 */
export function renderMultiPartQuestion(
  stemTemplate: string,
  parts: {
    prompt: string
    answer_template: string
    traps: TrapTemplate[]
    explanation: string | null
    blanks?: {
      label: string
      prompt?: string
      answer_template: string
      ecf_template?: string
      traps: TrapTemplate[]
    }[]
    grid?: {
      mode: string
      x: { min: number | string, max: number | string, step: number, label: string }
      y: { min: number | string, max: number | string, step: number, label: string }
      background: string
      solution?: string
      elements: {
        x: number | string, y: number | string, marks: number
        x2?: number | string
        style?: 'open' | 'closed'
        dir?: 'left' | 'right' | 'none'
      }[]
      tolerance: number
      traps?: {
        elements: {
          x: number | string, y: number | string
          // bars_free traps are wrong WIDTHS, so the edges are part of the
          // trap's geometry, not decoration.
          x2?: number | string
          style?: 'open' | 'closed'
          dir?: 'left' | 'right' | 'none'
        }[]
        response: string
        match?: 'exact' | 'translated'
      }[]
    }
  }[],
  parameters: Parameters,
  fixedValues?: Record<string, number>
): RenderedMultiPartQuestion {
  const generated = fixedValues ?? generateValues(parameters)
  // A grid field may be a plain number or a template; templates evaluate via
  // the engine and parseFloat — a render error ('[error: …]', unresolved
  // '{{') parses to NaN, which is exactly what the harness and the runtime
  // canvas guard key on.
  const evalNum = (v: number | string): number =>
    typeof v === 'number' ? v : parseFloat(evaluateTemplate(v, generated))
  return {
    stem: evaluateTemplate(stemTemplate, generated),
    parts: parts.map(part => ({
      prompt: evaluateTemplate(part.prompt, generated),
      answer: evaluateTemplate(part.answer_template, generated),
      // `?? []` — a part legitimately has no traps (e.g. a multi_blank part
      // carries its traps on the blanks); an absent array must not throw and
      // take the whole question down at render time.
      traps: (part.traps ?? []).map(t => renderTrap(t, generated)),
      explanation: part.explanation ? evaluateTemplate(part.explanation, generated) : '',
      // Blanks render against the SAME shared value set as everything else, so
      // chained blanks (frequency trees: B = {{n - a}}) stay consistent.
      ...(part.blanks?.length ? {
        blanks: part.blanks.map(b => ({
          label: b.label,
          prompt: b.prompt ? evaluateTemplate(b.prompt, generated) : '',
          answer: evaluateTemplate(b.answer_template, generated),
          // Parameters resolve now; [[SIBLING]] refs can't, since they stand
          // for answers the student hasn't given yet, and are left for the
          // grader to substitute.
          ...(b.ecf_template ? { ecf: evaluateTemplate(b.ecf_template, generated) } : {}),
          traps: (b.traps ?? []).map(t => renderTrap(t, generated)),
        })),
      } : {}),
      // Grid axes/elements evaluate against the same shared value set too.
      ...(part.grid ? {
        grid: {
          mode: part.grid.mode,
          x: {
            min: evalNum(part.grid.x.min), max: evalNum(part.grid.x.max),
            step: part.grid.x.step, label: evaluateTemplate(part.grid.x.label ?? '', generated),
          },
          y: {
            min: evalNum(part.grid.y.min), max: evalNum(part.grid.y.max),
            step: part.grid.y.step, label: evaluateTemplate(part.grid.y.label ?? '', generated),
          },
          background: part.grid.background ? evaluateTemplate(part.grid.background, generated) : '',
          solution: part.grid.solution ? evaluateTemplate(part.grid.solution, generated) : '',
          elements: part.grid.elements.map(e => ({
            x: evalNum(e.x), y: evalNum(e.y), marks: e.marks,
            // bars: x2 may be a template (a class boundary); style/dir are
            // number_line enums that pass straight through.
            ...(e.x2 != null ? { x2: evalNum(e.x2) } : {}),
            ...(e.style ? { style: e.style } : {}),
            ...(e.dir ? { dir: e.dir } : {}),
          })),
          tolerance: part.grid.tolerance,
          traps: (part.grid.traps ?? []).map(t => ({
            // x2/style/dir must render here as well as on the canonical
            // elements: a bars_free trap IS a set of wrong WIDTHS, so dropping
            // the edges would leave it unable to fire for its own drawing.
            elements: t.elements.map(e => ({
              x: evalNum(e.x), y: evalNum(e.y),
              ...(e.x2 != null ? { x2: evalNum(e.x2) } : {}),
              ...(e.style ? { style: e.style } : {}),
              ...(e.dir ? { dir: e.dir } : {}),
            })),
            response: evaluateTemplate(t.response, generated),
            ...(t.match ? { match: t.match } : {}),
          })),
        },
      } : {}),
    })),
    generatedValues: generated,
  }
}
