export type CheckResult = {
  correct: boolean
  trap: { response: string } | null
  message: string
}

// ── Unit detection ────────────────────────────────────────────────────────────

/**
 * Normalise HTML in an answer before unit-checking.
 *
 * <sup>2</sup> and <sup>3</sup> are converted to unicode superscripts so that
 * "cm<sup>2</sup>" becomes "cm²" and the UNIT_PATTERN can match it.
 * Remaining HTML tags are then stripped.
 */
function stripHtmlForUnits(text: string): string {
  return text
    .replace(/<sup>2<\/sup>/gi, '²')
    .replace(/<sup>3<\/sup>/gi, '³')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Strip units from a raw answer string so the bare number can be compared.
 * Order matters: longer / more specific patterns must come before shorter ones
 * (e.g. "g/cm³" before plain "cm").
 */
function stripUnits(text: string): string {
  return text
    // HTML superscript area/volume units first (must match before plain "cm" etc.)
    .replace(/\b(cm|m|mm|km)<sup>2<\/sup>/gi, '')
    .replace(/\b(cm|m|mm|km)<sup>3<\/sup>/gi, '')
    // Unicode superscript area/volume units
    .replace(/\b(cm|m|mm|km)[²³]/gi, '')
    // Compound units
    .replace(/\bg\/cm[³3]\b/gi, '')
    .replace(/\bg\/ml\b/gi, '')
    .replace(/\bkm\/h\b/gi, '')
    .replace(/\bm\/s\b/gi, '')
    .replace(/\bmph\b/gi, '')
    // Standard word units (order: longer words first to avoid partial matches)
    .replace(/\b(minutes|seconds|hours|metres|meters|meter|metre|litres|liters|liter|litre|grams|gram|miles|mile|kg|km|cm|mm|ml|mg|hrs|hr|mins|min|secs|sec)\b/gi, '')
    // Currency and percentage
    .replace(/£/g, '')
    .replace(/\$/g, '')
    .replace(/€/g, '')
    .replace(/%/g, '')
    // Single-letter units after numbers (m, g, s) — must be last to avoid
    // eating parts of longer units already stripped above
    .replace(/(\d+(\.\d+)?)\s*m\b/gi, '$1')
    .replace(/(\d+(\.\d+)?)\s*g\b/gi, '$1')
    .replace(/(\d+(\.\d+)?)\s*s\b/gi, '$1')
}

// Pattern for detecting the presence of any unit.
// NOTE: do NOT use the `g` flag here — a module-level regex with `g` advances
// lastIndex on each `.test()` call, making every other call return the wrong result.
const UNIT_PATTERN =
  /(mph|km\/h|m\/s|kg|km|cm|mm|ml|mg|hrs|hr|mins|min|secs|sec|hours|minutes|seconds|miles|mile|metres|metre|meters|meter|grams|gram|litres|litre|liters|liter)|g\/cm[³3]|g\/ml|cm[²³]|m[²³]|mm[²³]|km[²³]|£|\$|€|%|(\d+(\.\d+)?)\s*(m|g|s)\b/i

function containsUnits(text: string): boolean {
  return UNIT_PATTERN.test(stripHtmlForUnits(text))
}

// ── Answer normalisation ──────────────────────────────────────────────────────

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

// ── Numeric comparison ────────────────────────────────────────────────────────

function numericMatch(
  studentAnswer: string,
  correctAnswer: string,
  tolerance: number
): boolean {
  const student = parseFloat(studentAnswer.replace(/[^0-9.\-]/g, ''))
  const correct  = parseFloat(correctAnswer.replace(/[^0-9.\-]/g, ''))
  if (isNaN(student) || isNaN(correct)) return false
  return Math.abs(student - correct) <= tolerance
}

// ── Main checker ──────────────────────────────────────────────────────────────

const UNITS_REMINDER =
  'Correct! Remember to include units in your answer — you can lose marks in exams for missing units.'

export function checkAnswer(
  studentAnswer: string,
  correctAnswer: string,
  answerType: 'exact' | 'numeric' | 'fraction' | 'expression',
  tolerance: number | null,
  traps: { answer: string, response: string }[]
): CheckResult {
  const tol         = tolerance ?? 0
  const normStudent = normalise(studentAnswer)
  const normCorrect = normalise(correctAnswer)

  const isCorrect = (() => {
    switch (answerType) {
      case 'numeric':
        // parseFloat strips non-numeric characters, so units are ignored here.
        // We handle the units-reminder separately below.
        return numericMatch(normStudent, normCorrect, tol)
      case 'fraction':
        return numericMatch(normStudent, normCorrect, 0.001)
      case 'expression':
      case 'exact':
        return normStudent === normCorrect
    }
  })()

  // Determine whether units were expected but omitted by the student.
  // We compute this unconditionally because for numeric answers the main
  // comparison above strips units (via parseFloat), so a bare number like "25"
  // would pass isCorrect against "25 cm²" without ever hitting the reminder.
  const correctHasUnits = containsUnits(correctAnswer)
  const studentHasUnits = containsUnits(studentAnswer)
  const missingUnits    = correctHasUnits && !studentHasUnits

  if (isCorrect) {
    return {
      correct: true,
      trap:    null,
      message: missingUnits ? UNITS_REMINDER : 'Correct!',
    }
  }

  // For non-numeric answer types the main comparison includes units, so a
  // missing-units answer fails `isCorrect`. Check here whether the answer is
  // correct when units are stripped from both sides.
  if (missingUnits && answerType !== 'numeric') {
    const normStudentStripped = normalise(stripUnits(studentAnswer))
    const normCorrectStripped = normalise(stripUnits(correctAnswer))
    const matchesWithoutUnits = (() => {
      switch (answerType) {
        case 'fraction':
          return numericMatch(normStudentStripped, normCorrectStripped, 0.001)
        case 'expression':
        case 'exact':
          return normStudentStripped === normCorrectStripped
        default:
          return false
      }
    })()

    if (matchesWithoutUnits) {
      return { correct: true, trap: null, message: UNITS_REMINDER }
    }
  }

  // Trap matching — runs only when the answer is genuinely wrong.
  // Any trap written to catch a missing-units answer (e.g. "Don't forget
  // units!") is now unreachable for the case where the value was correct,
  // because we return above before reaching this point.
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
    trap:    null,
    message: `Not quite. The correct answer is ${correctAnswer}.`,
  }
}
