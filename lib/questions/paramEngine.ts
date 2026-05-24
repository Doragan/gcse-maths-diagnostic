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

// Helper functions exposed to every template expression.
// Add new helpers here; they will be available by name in {{...}} blocks.
const TEMPLATE_HELPERS: Record<string, unknown> = {
  round: robustRound,
}

export function evaluateTemplate(
  template: string,
  generated: Record<string, number>
): string {
  return template.replace(/\{\{([\s\S]+?)\}\}/g, (_, expr) => {
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
      response: t.response,
    })),
    explanation: explanation ? evaluateTemplate(explanation, generated) : '',
    generatedValues: generated,
  }
}
