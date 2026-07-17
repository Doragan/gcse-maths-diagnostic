import type { ScalarAnswerType } from './answerTypes'

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
 * Normalise an unordered list of values (e.g. factors of a number, or letter
 * codes for combinations). Splits on any combination of commas and whitespace,
 * lower-cases tokens (so "SC" and "sc" match), sorts numerically (falling back
 * to alphabetical for non-numbers), and rejoins with ",".
 *
 * "1, 2, 3, 6"  → "1,2,3,6"
 * "6 3 1 2"     → "1,2,3,6"
 * "SC, sf, GC"  → "gc,sc,sf"
 */
function normalisedSet(s: string): string {
  return s
    .trim()
    .split(/[\s,;]+/)
    .map(t => t.trim().toLowerCase())
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

export function normalise(value: string): string {
  return value
    .trim()
    .toLowerCase()
    // Convert <sup> tags to ^ notation before stripping HTML
    .replace(/<sup>([^<]*)<\/sup>/g, '^$1')
    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Currency symbols carry no mathematical value. A question asked "in pounds"
    // (and showing £ in its wording) may lead a student to write "£3+£2m" or
    // "£5"; strip the symbol so the answer is judged on the maths alone.
    .replace(/[£$€¢]/g, '')
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
    // Greek letters — the "pi" word form → π.
    //  • After a digit it is unambiguously π whatever follows, so this also
    //    catches a unit glued straight on: "9pi" → "9π", "9picm" → "9πcm"
    //    (no English word is "<digit>pi…").
    //  • Otherwise (standalone "pi", "2*pi", "(pi)") require a trailing
    //    not-a-letter so it never touches "pi" inside a word (pile, pink).
    .replace(/(\d)\s*pi/g, '$1π')
    .replace(/([^a-z0-9]|^)pi(?![a-z])/g, '$1π')
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

// ── Rounding-mistake detection (audit Bucket B) ───────────────────────────────
// Replaces the fragile per-question `round(x±0.01)` traps with one generic check.

/** Decimal places in a rendered answer's FIRST number ("157.08 cm³" → 2, "157" → 0). */
function decimalPlaces(s: string): number {
  const m = s.match(/-?\d+(?:\.(\d+))?/)
  return m && m[1] ? m[1].length : 0
}

type RoundingRelation = 'unrounded' | 'off_by_one' | 'none'

/**
 * Classify a numeric near-miss against a canonical answer rounded to 1–4 dp.
 * Only meaningful once the value has already FAILED the tolerance check, so it
 * never overrides a correct answer — it only refines the feedback on a value
 * that already missed:
 *   - 'unrounded'  — the student value rounds to the canonical (gave the full /
 *                    over-precise value).
 *   - 'off_by_one' — rounded to the canonical's places, the student value is
 *                    exactly one unit out (rounded the wrong way / truncated).
 * Returns 'none' for integers (dp 0), irrational/over-precise canonicals (dp > 4,
 * e.g. an unrounded π·r²), or misses bigger than one place. The dp gate is what
 * keeps it inert on irrational answers — their last-place unit is microscopic.
 */
function roundingRelation(studentStr: string, correctStr: string): { rel: RoundingRelation; dp: number } {
  const dp = decimalPlaces(correctStr)
  if (dp < 1 || dp > 4) return { rel: 'none', dp }
  const s = extractNumber(studentStr)
  const c = extractNumber(correctStr)
  if (isNaN(s) || isNaN(c)) return { rel: 'none', dp }
  const u = Math.pow(10, -dp)
  const factor = Math.pow(10, dp)
  const roundedS = Math.round(s * factor) / factor
  if (Math.abs(roundedS - c) < u / 2) {
    return { rel: s === c ? 'none' : 'unrounded', dp }
  }
  const k = Math.round((roundedS - c) / u)
  return { rel: Math.abs(k) === 1 ? 'off_by_one' : 'none', dp }
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
 * True when a canonical answer written as "a/b" has an EXACT (terminating)
 * decimal expansion — i.e. after reducing, the denominator has no prime
 * factors other than 2 and 5. Non-fraction canonicals (integers, decimals)
 * count as terminating: they are exactly typeable as decimals.
 *
 * "1/4" → true (0.25)   "3/6" → true (reduces to 1/2)   "4/11" → false
 */
function hasTerminatingDecimal(canonical: string): boolean {
  const m = canonical.match(/^(-?\d+)\/(\d+)$/)
  if (!m) return true
  let den = parseInt(m[2], 10) / gcd(parseInt(m[1], 10), parseInt(m[2], 10))
  while (den % 2 === 0) den /= 2
  while (den % 5 === 0) den /= 5
  return den === 1
}

/**
 * Compare two answers that may be expressed as fractions (e.g. "3/4" vs "0.75").
 * Uses parseFraction so that "3/4" and "6/8" and "0.75" are all equivalent
 * within the given tolerance.
 *
 * Special rule for decimal input: if the student wrote a decimal (e.g. "0.25")
 * rather than a fraction, it is only acceptable when the target value HAS an
 * exact decimal form (terminating), and then it must match exactly:
 *   • "0.25"   for 1/4  → accepted  (0.25 IS 1/4 exactly)
 *   • "0.1667" for 1/6  → rejected  (a rounded guess)
 *   • "0.3636363636364" for 4/11 → rejected — 4/11 has NO exact decimal form,
 *     so no number of typed digits counts as the exact answer (previously a
 *     long-enough truncation crept under the 1e-9 tolerance)
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
  if (isDecimal && !hasTerminatingDecimal(correctAnswer)) return false
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

const ROUNDING_REMINDER = (dp: number) =>
  `Correct — but remember to round your answer to ${dp} decimal place${dp === 1 ? '' : 's'}.`

const ROUNDING_ERROR =
  'Not quite — your answer is one out in the last decimal place. Check which way you rounded.'

export function checkAnswer(
  studentAnswer: string,
  correctAnswer: string,
  answerType: ScalarAnswerType,
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
  const missingUnits    = correctHasUnits && !studentHasUnits   // expected units omitted
  const extraUnits      = !correctHasUnits && studentHasUnits   // units added where the answer carries none

  // Check whether the student's fraction answer is correct but not fully reduced.
  // Only applies to fraction-type questions; decimals and integers are unaffected.
  // Right value but not in lowest terms (only meaningful for fraction/ratio).
  const isUnsimplified =
    isCorrect && (
      (answerType === 'fraction' && isUnsimplifiedFraction(normStudent)) ||
      (answerType === 'ratio'    && isUnsimplifiedRatio(normStudent))
    )

  // When the question demanded simplest form, the simplification IS the assessed
  // skill, so an unsimplified equivalent is NOT accepted. Otherwise accept it but
  // remind the student to simplify (good exam habit).
  if (isUnsimplified && requireSimplest) {
    return {
      correct: false,
      trap:    null,
      message: 'Almost — that’s the right value, but give your answer in its simplest form.',
    }
  }

  if (isCorrect) {
    return {
      correct: true,
      trap:    null,
      message: isUnsimplified ? SIMPLIFICATION_REMINDER
              : missingUnits   ? UNITS_REMINDER
              : 'Correct!',
    }
  }

  // Numeric rounding feedback (audit Bucket B). Computed only now — we're past
  // the `isCorrect` return, so this never marks a correct answer wrong; it only
  // refines the message on a value that already missed the tolerance. A student
  // who gave the full / over-precise value (rounds to the canonical) is accepted
  // with a "round to N dp" nudge; the one-place-out case is handled after traps.
  const rounding = answerType === 'numeric'
    ? roundingRelation(studentAnswer, correctAnswer)
    : { rel: 'none' as RoundingRelation, dp: 0 }

  if (rounding.rel === 'unrounded') {
    return { correct: true, trap: null, message: ROUNDING_REMINDER(rounding.dp) }
  }

  // For non-numeric answer types the main comparison includes units, so any
  // units mismatch fails `isCorrect` — whether the student OMITTED expected
  // units, or ADDED units where the canonical answer carries none (e.g. a
  // unit-less "36π" answer vs a student's correct "36π cm²"). Retry with units
  // stripped from both sides so the value is what's assessed.
  if ((missingUnits || extraUnits) && answerType !== 'numeric') {
    const normStudentStripped = normalise(stripUnits(studentAnswer))
    const normCorrectStripped = normalise(stripUnits(correctAnswer))
    const matchesWithoutUnits = (() => {
      switch (answerType) {
        case 'fraction':
          return fractionMatch(normStudentStripped, normCorrectStripped, 0.001)
        case 'expression':
          return expressionMatch(normStudentStripped, normCorrectStripped)
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
        // Only nudge when expected units were OMITTED. Adding units where none
        // were required is fine and needs no reminder.
        message: notSimplifiedStripped ? SIMPLIFICATION_REMINDER
               : missingUnits          ? UNITS_REMINDER
               : 'Correct!',
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

    // Units-tolerant retry: a student who adds or omits units relative to the
    // trap (e.g. "12π cm²" against a trap written as "12π") should still get
    // the trap's targeted feedback. Only fires for non-numeric types, where
    // units are part of the compared string.
    if (answerType === 'exact' || answerType === 'expression' || answerType === 'fraction') {
      const sStripped = normalise(stripUnits(studentAnswer))
      const tStripped = normalise(stripUnits(trap.answer))
      const strippedMatch =
        answerType === 'fraction'   ? fractionMatch(sStripped, tStripped, 0.001)
        : answerType === 'expression' ? expressionMatch(sStripped, tStripped)
        :                               sStripped === tStripped
      if (strippedMatch) {
        return { correct: false, trap, message: trap.response }
      }
    }
  }

  // One-place-out rounding miss (authored traps already had their chance above).
  if (rounding.rel === 'off_by_one') {
    return { correct: false, trap: null, message: ROUNDING_ERROR }
  }

  // Decimal given for a fraction answer that has no exact decimal form
  // (e.g. "0.3636…" for 4/11). fractionMatch has already rejected it as
  // incorrect; if the VALUE is right, say why the form isn't, rather than
  // the generic miss message.
  if (answerType === 'fraction' && normStudent.includes('.') && !normStudent.includes('/')
      && !hasTerminatingDecimal(normCorrect)) {
    const sVal = parseFraction(normStudent)
    const cVal = parseFraction(normCorrect)
    if (!isNaN(sVal) && !isNaN(cVal) && Math.abs(sVal - cVal) <= 0.001) {
      return {
        correct: false,
        trap:    null,
        message: 'You have the right value, but written as a decimal it can only ever be an approximation — this number does not terminate. Give the EXACT answer as a fraction.',
      }
    }
  }

  return {
    correct: false,
    trap:    null,
    message: `Not quite. The correct answer is ${correctAnswer}.`,
  }
}
