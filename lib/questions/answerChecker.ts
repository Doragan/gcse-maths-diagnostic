export type CheckResult = {
  correct: boolean
  trap: { response: string } | null
  message: string
}

function stripUnits(text: string): string {
  return text
    .replace(/\bg\/cm[³3]\b/gi, '')
    .replace(/\b(mph|km\/h|m\/s|g\/ml|kg|km|cm|mm|ml|mg|hr|hrs|min|mins|sec|secs|hours|minutes|seconds|miles|mile|metres|metre|meters|meter|grams|gram|litres|litre|liters|liter)\b/gi, '')
    .replace(/£/g, '')
    .replace(/\$/g, '')
    .replace(/€/g, '')
    .replace(/%/g, '')
    .replace(/(\d+(\.\d+)?)\s*(m|g|s)\b/gi, '$1')
}

const UNIT_PATTERN = /\b(mph|km\/h|m\/s|kg|km|cm|mm|ml|mg|hr|hrs|min|mins|sec|secs|hours|minutes|seconds|miles|mile|metres|metre|meters|meter|grams|gram|litres|litre|liters|liter)\b|g\/cm[³3]|g\/ml|£|\$|€|%|(\d+(\.\d+)?)\s*(m|g|s)\b/gi

function containsUnits(text: string): boolean {
  const stripped = text.replace(/<[^>]+>/g, '').trim()
  return UNIT_PATTERN.test(stripped)
}

function normalise(value: string): string {
  return value
    .trim()
    .toLowerCase()
    // Convert <sup> tags to ^ notation before stripping HTML
    .replace(/<sup>([^<]*)<\/sup>/g, '^$1')
    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Superscript digits to caret notation
    .replace(/⁰/g, '^0').replace(/¹/g, '^1').replace(/²/g, '^2')
    .replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/⁵/g, '^5')
    .replace(/⁶/g, '^6').replace(/⁷/g, '^7').replace(/⁸/g, '^8')
    .replace(/⁹/g, '^9')
    // Superscript minus
    .replace(/⁻/g, '-')
    // Multiplication symbols
    .replace(/×/g, '*')
    // Powers
    .replace(/\^{(\d+)}/g, '^$1')
    // Common word forms
    .replace(/sqrt\(/g, '√(')
    .replace(/cbrt\(/g, '∛(')
    // Greek letters
    .replace(/\bpi\b/g, 'π')
    // Inequality operators
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥')
    .replace(/!=/g, '≠')
    // Remove all whitespace
    .replace(/\s+/g, '')
}

function numericMatch(
  studentAnswer: string,
  correctAnswer: string,
  tolerance: number
): boolean {
  const student = parseFloat(studentAnswer.replace(/[^0-9.\-]/g, ''))
  const correct = parseFloat(correctAnswer.replace(/[^0-9.\-]/g, ''))
  if (isNaN(student) || isNaN(correct)) return false
  return Math.abs(student - correct) <= tolerance
}

export function checkAnswer(
  studentAnswer: string,
  correctAnswer: string,
  answerType: 'exact' | 'numeric' | 'fraction' | 'expression',
  tolerance: number | null,
  traps: { answer: string, response: string }[]
): CheckResult {
  const tol = tolerance ?? 0
  const normStudent = normalise(studentAnswer)
  const normCorrect = normalise(correctAnswer)

  const isCorrect = (() => {
    switch (answerType) {
      case 'numeric':
        return numericMatch(normStudent, normCorrect, tol)
      case 'fraction':
        return numericMatch(normStudent, normCorrect, 0.001)
      case 'expression':
      case 'exact':
        return normStudent === normCorrect
    }
  })()

  if (isCorrect) {
    return { correct: true, trap: null, message: 'Correct!' }
  }

  // Check if student answer is correct except for missing units
  const correctHasUnits = containsUnits(correctAnswer)
  const studentHasUnits = containsUnits(studentAnswer)

  if (correctHasUnits && !studentHasUnits) {
    const normStudentStripped = normalise(stripUnits(studentAnswer))
    const normCorrectStripped = normalise(stripUnits(correctAnswer))
    const matchesWithoutUnits = (() => {
      switch (answerType) {
        case 'numeric':
          return numericMatch(normStudentStripped, normCorrectStripped, tol)
        case 'fraction':
          return numericMatch(normStudentStripped, normCorrectStripped, 0.001)
        case 'expression':
        case 'exact':
          return normStudentStripped === normCorrectStripped
      }
    })()

    if (matchesWithoutUnits) {
      return {
        correct: true,
        trap: null,
        message: 'Correct! Remember to include units in your answer — you can lose marks in exams for missing units.',
      }
    }
  }

  for (const trap of traps) {
    const normTrap = normalise(trap.answer)
    const trapMatch = (() => {
      switch (answerType) {
        case 'numeric':
          return numericMatch(normStudent, normTrap, tol)
        case 'fraction':
          return numericMatch(normStudent, normTrap, 0.001)
        case 'expression':
        case 'exact':
          return normStudent === normTrap
      }
    })()

    if (trapMatch) {
      return { correct: false, trap, message: trap.response }
    }
  }

  return {
    correct: false,
    trap: null,
    message: `Not quite. The correct answer is ${correctAnswer}.`,
  }
}