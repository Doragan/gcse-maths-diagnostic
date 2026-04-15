export type ParameterConfig = {
  type: 'integer' | 'decimal'
  min: number
  max: number
  decimal_places?: number
  constraint?: {
    type: 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'multiple_of' | 'factor_of'
    target: string | number
    target_type: 'parameter' | 'value'
  }
}

export type Parameters = Record<string, ParameterConfig>

export function generateValues(parameters: Parameters): Record<string, number> {
  const generated: Record<string, number> = {}

  for (const [key, config] of Object.entries(parameters)) {
    let attempts = 0
    let value: number = 0

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
      if (!config.constraint || attempts >= 100) break

      const target = config.constraint.target_type === 'parameter'
        ? generated[config.constraint.target as string]
        : config.constraint.target as number

      if (target === undefined) break

      const satisfied = (() => {
        switch (config.constraint!.type) {
          case 'neq': return value !== target
          case 'gt': return value > target
          case 'gte': return value >= target
          case 'lt': return value < target
          case 'lte': return value <= target
          case 'multiple_of': return target !== 0 && value % target === 0
          case 'factor_of': return value !== 0 && (target as number) % value === 0
          default: return true
        }
      })()

      if (satisfied) break
    } while (true)

    generated[key] = value
  }

  return generated
}

export function evaluateTemplate(
  template: string,
  generated: Record<string, number>
): string {
  return template.replace(/\{\{([\s\S]+?)\}\}/g, (_, expr) => {
    try {
      const fn = new Function(...Object.keys(generated), `return ${expr}`)
      return fn(...Object.values(generated)).toString()
    } catch (e) {
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