export type CheckResult = {
  correct: boolean
  trap: { response: string } | null
  message: string
}

// ── Expression equivalence helpers ───────────────────────────────────────────

/**
 * Split a string into additive terms at the TOP LEVEL only (depth=0).
 * Signs are attached to the term that follows them.
 *
 * "x+2y"   → ["x", "+2y"]
 * "3n+5"   → ["3n", "+5"]
 * "-2y+x"  → ["-2y", "+x"]
 * "(x+2)(x+3)" → ["(x+2)(x+3)"]   ← '+' is inside brackets, not split
 */
function splitTerms(s: string): string[] {
  const terms: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(') { depth++; current += c }
    else if (c === ')') { depth--; current += c }
    else if (depth === 0 && (c === '+' || c === '-') && i > 0) {
      terms.push(current)
      current = c
    } else {
      current += c
    }
  }
  if (current) terms.push(current)
  return terms
}

/**
 * Canonical sort key for an algebraic term: the variable part (letters/^)
 * after stripping any leading sign and coefficient.
 * Constants (no letters) sort last via the high-code-point sentinel.
 *
 * "3x"  → "x"     "+2y" → "y"    "-5"  → "￿"
 * "x^2" → "x^2"   "3n"  → "n"
 */
function termKey(t: string): string {
  const vars = t.replace(/^[+-]?\d*\.?\d*/, '').trim()
  return vars || '￿'
}

/**
 * Sort the additive terms of an expression, then rejoin.
 * "2y+x"  → "x+2y"   "5+3n"  → "3n+5"   "-2y+x" → "x-2y"
 */
function sortedTerms(s: string): string {
  const terms = splitTerms(s)
  if (terms.length <= 1) return s
  terms.sort((a, b) => termKey(a).localeCompare(termKey(b)))
  // Rejoin: first term loses leading '+', subsequent negative terms keep '-'
  return terms
    .map((t, i) =>
      i === 0
        ? t.startsWith('+') ? t.slice(1) : t
        : t.startsWith('-') ? t : (t.startsWith('+') ? t : '+' + t)
    )
    .join('')
}

/**
 * Split a product expression into its multiplicative factors.
 *
 * Handles two common GCSE patterns:
 *   "(x+2)(x+3)"  → ["(x+2)", "(x+3)"]  (adjacent brackets)
 *   "2^2*3*5"     → ["2^2", "3", "5"]    (explicit * operator)
 */
function splitFactors(s: string): string[] {
  const factors: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(') {
      depth++
      current += c
    } else if (c === ')') {
      depth--
      current += c
      // Adjacent-bracket boundary: split between ) and (
      if (depth === 0 && i + 1 < s.length && s[i + 1] === '(') {
        factors.push(current)
        current = ''
      }
    } else if (c === '*' && depth === 0) {
      factors.push(current)
      current = ''
    } else {
      current += c
    }
  }
  if (current) factors.push(current)
  return factors.filter(f => f.length > 0)
}

/**
 * Sort the multiplicative factors of an expression.
 * "(x+3)(x+2)" → "(x+2)(x+3)"   "3*2^2" → "2^2*3"
 */
function sortedFactors(s: string): string {
  const factors = splitFactors(s)
  if (factors.length <= 1) return s
  factors.sort((a, b) => a.localeCompare(b))
  // Adjacent-bracket products rejoin without separator;
  // explicit-* products rejoin with *
  const sep = s.includes('*') && !s.startsWith('(') ? '*' : ''
  return factors.join(sep)
}

/**
 * Sort a list of solutions separated by "and", "or", or "," so that
 * "x=-3andx=-2" and "x=-2andx=-3" both normalise to the same string.
 * Also handles simultaneous-equations answers: "y=3,x=2" → "x=2,y=3".
 */
function sortedSolutions(s: string): string {
  for (const sep of ['and', 'or', ',']) {
    if (s.includes(sep)) {
      const parts = s.split(sep)
      if (parts.length > 1) {
        parts.sort()
        return parts.join(sep)
      }
    }
  }
  return s
}

/**
 * Try all commutativity-aware equivalence checks in turn.
 * Used for answer_type === 'expression'.
 */
function expressionMatch(a: string, b: string): boolean {
  if (a === b) return true
  // Inequalities have their own equivalence (operand-flip, fraction/decimal bound).
  // Don't run the term/factor sorters on them — the leading '-' of a bound would be
  // mis-split as an additive term.
  if (INEQUALITY_OP.test(a) || INEQUALITY_OP.test(b)) return inequalityMatch(a, b)
  if (sortedTerms(a)   === sortedTerms(b))   return true
  if (sortedFactors(a) === sortedFactors(b)) return true
  if (sortedSolutions(a) === sortedSolutions(b)) return true
  return false
}

/**
 * Normalise an unordered list of values (e.g. factors of a number).
 * Splits on any combination of commas and whitespace, sorts numerically
 * (falling back to alphabetical for non-numbers), and rejoins with ",".
 *
 * "1, 2, 3, 6"  → "1,2,3,6"
 * "6 3 1 2"     → "1,2,3,6"
 * "1,2,3,6"     → "1,2,3,6"
 */
function normalisedSet(s: string): string {
  return s
    .trim()
    .split(/[\s,;]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .sort((a, b) => {
      const na = parseFloat(a)
      const nb = parseFloat(b)
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b)
    })
    .join(',')
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
    // Unicode minus (U+2212) → ASCII hyphen. Must come before superscript-minus
    // so that "x − 3" and "x - 3" are treated identically.
    .replace(/−/g, '-')
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
    // Strip redundant brackets around a numeric surd radicand: √(2) → √2
    .replace(/√\((\d+)\)/g, '√$1')
    // Collapse explicit multiplication that GCSE notation writes implicitly:
    //   135*π → 135π   3*√2 → 3√2   3*x → 3x   2*(x+3) → 2(x+3)   (x+2)*(x+3) → (x+2)(x+3)
    // Only fires when the right side begins a letter / π / √ / '(' so that
    // numeric products like 2^2*3*5 keep their '*' (needed for factor splitting).
    .replace(/([\d)πa-z])\*(?=[a-zπ√(])/g, '$1')
}

// ── Numeric comparison ────────────────────────────────────────────────────────

/**
 * Extract the numeric value from an answer that may carry a unit.
 *
 * Takes the FIRST number (optionally signed, with comma thousands separators
 * and a decimal part) and ignores everything after it. This is unit-safe:
 * "33cm^2" → 33, not 332 — critical because normalise() turns area/volume
 * units like "cm²"/"cm³" into "cm^2"/"cm^3", whose trailing digit would
 * otherwise be glued onto the number. Thousands separators are preserved:
 * "1,000" → 1000.
 */
function extractNumber(s: string): number {
  const m = s.match(/-?[\d,]+(?:\.\d+)?/)
  return m ? parseFloat(m[0].replace(/,/g, '')) : NaN
}

function numericMatch(
  studentAnswer: string,
  correctAnswer: string,
  tolerance: number
): boolean {
  const student = extractNumber(studentAnswer)
  const correct  = extractNumber(correctAnswer)
  if (isNaN(student) || isNaN(correct)) return false
  return Math.abs(student - correct) <= tolerance
}

// ── Fraction parsing ──────────────────────────────────────────────────────────

/**
 * Parse a string that may be an integer, decimal, or fraction (e.g. "3/4", "-1/2").
 * Returns the numeric value, or NaN if the string is not a recognised number form.
 *
 * normalise() strips whitespace before this is called, so we only need to handle
 * compact forms like "3/4" or "-1/2", not "3 / 4".
 */
function parseFraction(s: string): number {
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/)
  if (m) {
    const num = parseFloat(m[1])
    const den = parseFloat(m[2])
    return den === 0 ? NaN : num / den
  }
  return parseFloat(s)
}

/**
 * Compare two answers that may be expressed as fractions (e.g. "3/4" vs "0.75").
 * Uses parseFraction so that "3/4" and "6/8" and "0.75" are all equivalent
 * within the given tolerance.
 *
 * Special rule for decimal input: if the student wrote a decimal (e.g. "0.25")
 * rather than a fraction, we require an exact IEEE 754 match (tolerance 1e-9)
 * instead of the normal 0.001 tolerance. This means:
 *   • "0.25"   for 1/4  → accepted  (0.25 IS 1/4 exactly in float arithmetic)
 *   • "0.1667" for 1/6  → rejected  (differs from 1/6 by ~3×10⁻⁵, a rounded guess)
 *   • "1/4"    for 1/4  → accepted  (fraction notation always uses normal tolerance)
 */
function fractionMatch(
  studentAnswer: string,
  correctAnswer: string,
  tolerance: number
): boolean {
  const student = parseFraction(studentAnswer)
  const correct  = parseFraction(correctAnswer)
  if (isNaN(student) || isNaN(correct)) return false
  // Detect a decimal answer: has a "." and no "/" (after normalise has run)
  const isDecimal = studentAnswer.includes('.') && !studentAnswer.includes('/')
  const effectiveTolerance = isDecimal ? 1e-9 : tolerance
  return Math.abs(student - correct) <= effectiveTolerance
}

/**
 * Return true if the student wrote a fraction that hasn't been fully simplified,
 * e.g. "6/12" or "-4/8". Returns false for decimals, integers, and fractions
 * already in lowest terms.
 *
 * Only called after the answer has been confirmed numerically correct, so this
 * is purely a "could be tidier" check rather than a correctness gate.
 */
function isUnsimplifiedFraction(s: string): boolean {
  const m = s.match(/^-?(\d+)\/(\d+)$/)
  if (!m) return false
  let a = parseInt(m[1], 10)
  let b = parseInt(m[2], 10)
  if (b === 0) return false
  // Euclidean GCD
  while (b > 0) { [a, b] = [b, a % b] }
  return a > 1 // GCD > 1 → common factor remains
}

// ── Ratio, coordinate & inequality equivalence ────────────────────────────────

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { [a, b] = [b, a % b] }
  return a
}

/** Parse "a:b[:c...]" into numeric parts (each an integer, decimal or fraction). */
function parseRatio(s: string): number[] | null {
  if (!s.includes(':')) return null
  const parts = s.split(':').map(p => parseFraction(p))
  if (parts.length < 2 || parts.some(isNaN)) return null
  return parts
}

/** Two ratios are equal iff their parts are proportional (adjacent cross-products match). */
function ratiosEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 1; i < a.length; i++) {
    const lhs = a[i - 1] * b[i]
    const rhs = a[i] * b[i - 1]
    if (Math.abs(lhs - rhs) > 1e-9 * Math.max(1, Math.abs(lhs), Math.abs(rhs))) return false
  }
  return true
}

/** A ratio is unsimplified if any part is non-integer or the integer parts share a factor. */
function isUnsimplifiedRatio(s: string): boolean {
  const parts = parseRatio(s)
  if (!parts) return false
  if (parts.some(p => !Number.isInteger(p))) return true
  return parts.map(p => Math.abs(p)).reduce((g, n) => gcd(g, n)) > 1
}

/** Parse a coordinate like "(2,1)", "2,1" or "x=2,y=1" into ordered numeric components. */
function parseCoordinate(s: string): number[] | null {
  const cleaned = s.replace(/[()]/g, '').replace(/[a-z]=/g, '')
  const parts = cleaned.split(',').map(p => parseFraction(p))
  if (parts.length < 2 || parts.some(isNaN)) return null
  return parts
}

function coordinatesEqual(a: number[], b: number[], tol: number): boolean {
  if (a.length !== b.length) return false
  return a.every((v, i) => Math.abs(v - b[i]) <= tol)
}

const INEQUALITY_OP = /[≤≥<>]/

function flipInequality(op: string): string {
  return op === '<' ? '>' : op === '>' ? '<' : op === '≤' ? '≥' : '≤'
}

/** Parse a single-operator inequality, canonicalised to "variable OP value". */
function parseInequality(s: string): { varName: string, op: string, value: number } | null {
  const ops = s.match(/[≤≥<>]/g)
  if (!ops || ops.length !== 1) return null
  const op = ops[0]
  const [lhs, rhs] = s.split(op)
  const lhsNum = parseFraction(lhs)
  const rhsNum = parseFraction(rhs)
  const lhsHasVar = /[a-z]/.test(lhs)
  const rhsHasVar = /[a-z]/.test(rhs)
  if (lhsHasVar && !isNaN(rhsNum)) return { varName: lhs, op, value: rhsNum }
  if (rhsHasVar && !isNaN(lhsNum)) return { varName: rhs, op: flipInequality(op), value: lhsNum }
  return null
}

/** Accept inequalities that are equal up to operand-flip and fraction/decimal bound form. */
function inequalityMatch(a: string, b: string): boolean {
  const pa = parseInequality(a)
  const pb = parseInequality(b)
  if (!pa || !pb) return false
  return pa.varName === pb.varName && pa.op === pb.op && Math.abs(pa.value - pb.value) <= 1e-9
}

// ── Main checker ──────────────────────────────────────────────────────────────

const UNITS_REMINDER =
  'Correct! Remember to include units in your answer — you can lose marks in exams for missing units.'

const SIMPLIFICATION_REMINDER =
  'Correct! Remember to simplify your answer fully — you may lose marks in an exam for leaving it unsimplified.'

export function checkAnswer(
  studentAnswer: string,
  correctAnswer: string,
  answerType: 'exact' | 'numeric' | 'fraction' | 'expression' | 'set' | 'ratio' | 'coordinate',
  tolerance: number | null,
  traps: { answer: string, response: string }[],
  // Whether the question demanded simplest form. Drives the "not simplified"
  // nudge for fraction/ratio answers. Defaults true → current behaviour preserved.
  requireSimplest: boolean = true
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
        return fractionMatch(normStudent, normCorrect, 0.001)
      case 'exact':
        return normStudent === normCorrect
      case 'expression':
        // Like 'exact' but also accepts commutatively-equivalent forms:
        // sorted additive terms, sorted multiplicative factors, sorted solutions.
        return expressionMatch(normStudent, normCorrect)
      case 'set':
        // Unordered list of values — order and whitespace/comma style ignored.
        return normalisedSet(studentAnswer) === normalisedSet(correctAnswer)
      case 'ratio': {
        const rs = parseRatio(normStudent)
        const rc = parseRatio(normCorrect)
        return rs !== null && rc !== null && ratiosEqual(rs, rc)
      }
      case 'coordinate': {
        const cs = parseCoordinate(normStudent)
        const cc = parseCoordinate(normCorrect)
        return cs !== null && cc !== null && coordinatesEqual(cs, cc, Math.max(tol, 1e-9))
      }
    }
  })()

  // Determine whether units were expected but omitted by the student.
  // We compute this unconditionally because for numeric answers the main
  // comparison above strips units (via parseFloat), so a bare number like "25"
  // would pass isCorrect against "25 cm²" without ever hitting the reminder.
  const correctHasUnits = containsUnits(correctAnswer)
  const studentHasUnits = containsUnits(studentAnswer)
  const missingUnits    = correctHasUnits && !studentHasUnits

  // Check whether the student's fraction answer is correct but not fully reduced.
  // Only applies to fraction-type questions; decimals and integers are unaffected.
  const notSimplified =
    isCorrect && requireSimplest && (
      (answerType === 'fraction' && isUnsimplifiedFraction(normStudent)) ||
      (answerType === 'ratio'    && isUnsimplifiedRatio(normStudent))
    )

  if (isCorrect) {
    return {
      correct: true,
      trap:    null,
      message: notSimplified ? SIMPLIFICATION_REMINDER
              : missingUnits  ? UNITS_REMINDER
              : 'Correct!',
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
          return fractionMatch(normStudentStripped, normCorrectStripped, 0.001)
        case 'expression':
        case 'exact':
          return normStudentStripped === normCorrectStripped
        default:
          return false
      }
    })()

    if (matchesWithoutUnits) {
      const notSimplifiedStripped =
        answerType === 'fraction' && isUnsimplifiedFraction(normStudentStripped)
      return {
        correct: true,
        trap:    null,
        message: notSimplifiedStripped ? SIMPLIFICATION_REMINDER : UNITS_REMINDER,
      }
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
          return fractionMatch(normStudent, normTrap, 0.001)
        case 'exact':
          return normStudent === normTrap
        case 'expression':
          return expressionMatch(normStudent, normTrap)
        case 'set':
          return normalisedSet(studentAnswer) === normalisedSet(trap.answer)
        case 'ratio': {
          const rs = parseRatio(normStudent)
          const rt = parseRatio(normTrap)
          return rs !== null && rt !== null && ratiosEqual(rs, rt)
        }
        case 'coordinate': {
          const cs = parseCoordinate(normStudent)
          const ct = parseCoordinate(normTrap)
          return cs !== null && ct !== null && coordinatesEqual(cs, ct, Math.max(tol, 1e-9))
        }
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
