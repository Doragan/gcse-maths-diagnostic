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

export function generateValues(parameters: Parameters): Record<string, number> {
  const generated: Record<string, number> = {}

  for (const [key, config] of Object.entries(parameters)) {
    let attempts = 0
    let value: number = 0

    // Build full list of constraints from both single and array forms
    const constraintList: ConstraintConfig[] = [
      ...(config.constraint ? [config.constraint] : []),
      ...(config.constraints ?? []),
    ]

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

      const allSatisfied = constraintList.every(c => checkConstraint(c, value, generated))
      if (allSatisfied) break
    } while (true)

    generated[key] = value
  }

  return generated
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

export type RenderedQuestion = {
  question: string
  answer: string
  traps: { answer: string, response: string }[]
  explanation: string
  generatedValues: Record<string, number>
}

export function renderQuestion(
  questionTemplate: string,
  answerTemplate: string,
  traps: { answer_template: string, response: string }[],
  explanation: string | null,
  parameters: Parameters,
  fixedValues?: Record<string, number>
): RenderedQuestion {
  const generated = fixedValues ?? generateValues(parameters)
  return {
    question: evaluateTemplate(questionTemplate, generated),
    answer: evaluateTemplate(answerTemplate, generated),
    traps: traps.map(t => ({
      answer: evaluateTemplate(t.answer_template, generated),
      response: evaluateTemplate(t.response, generated),
    })),
    explanation: explanation ? evaluateTemplate(explanation, generated) : '',
    generatedValues: generated,
  }
}
