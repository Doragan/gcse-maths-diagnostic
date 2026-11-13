import type { FractionForm, ScalarAnswerType } from './answerTypes'
import { detectPiEstimate, usesSubstitutablePi } from './piEstimate'

export type CheckResult = {
  correct: boolean
  /**
   * The authored trap the answer matched, if any. `method_marks` rides along so
   * exam scoring can pay for a sound method behind a wrong answer; it is absent
   * on unmarked traps and ignored entirely in practice, which grades binary.
   */
  trap: {
    response: string
    method_marks?: number
    /**
     * Shared id for WHY this was wrong, from data/misconceptions.ts. Null on
     * an untagged trap, which is normal — the vocabulary is applied
     * incrementally and a trap that fits nothing existing stays untagged
     * rather than minting a one-off id.
     */
    misconception?: string | null
  } | null
  message: string
  /**
   * The value is right but the units are not: either omitted ("400" for
   * "400 litres") or a different unit entirely ("400 cm³").
   *
   * The answer is still `correct`, deliberately. A unit is almost never the
   * skill under test, so neither case may hold a student back — practice and
   * the skill map credit the maths they actually did.
   *
   * EXAM scoring is where it costs: gradeUnits drops the accuracy mark and
   * keeps the method marks. That mirrors real schemes: across the 30 coded
   * papers, every scheme that mentions units attaches the requirement to the
   * final accuracy mark ("units required" on an A1) and not one awards a mark
   * for units alone — they always ride on the final A1/B1, so an answer that
   * does not carry the unit the question asked for cannot have that mark.
   */
  unitsIssue?: 'missing' | 'wrong'
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
 * Split on a character at bracket depth 0 only.
 * "(a+b)/(c-d)" on '/' → ["(a+b)", "(c-d)"]   "a/(b/c)" → ["a", "(b/c)"]
 */
function splitTopLevel(s: string, ch: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const c of s) {
    if (c === '(') { depth++; current += c }
    else if (c === ')') { depth--; current += c }
    else if (c === ch && depth === 0) { parts.push(current); current = '' }
    else current += c
  }
  parts.push(current)
  return parts
}

/**
 * Remove brackets that enclose the WHOLE string, so "(y-1)" and "y-1" compare
 * equal. Leaves "(x+2)(x+3)" alone: its leading '(' closes in the middle, so
 * the outer brackets are not a single wrapper.
 */
function stripOuterBrackets(s: string): string {
  let out = s
  for (let guard = 0; guard < 8; guard++) {
    if (!out.startsWith('(') || !out.endsWith(')')) return out
    let depth = 0
    let wraps = true
    for (let i = 0; i < out.length; i++) {
      if (out[i] === '(') depth++
      else if (out[i] === ')') {
        depth--
        if (depth === 0 && i < out.length - 1) { wraps = false; break }
      }
    }
    if (!wraps || depth !== 0) return out
    out = out.slice(1, -1)
  }
  return out
}

/** Flip the sign of every additive term. "-4-3y" → "4+3y", "1-y" → "-1+y". */
function negateTerms(s: string): string {
  return splitTerms(s)
    .map((t, i) => {
      const flipped = t.startsWith('-') ? '+' + t.slice(1)
        : t.startsWith('+') ? '-' + t.slice(1)
          : '-' + t
      return i === 0 && flipped.startsWith('+') ? flipped.slice(1) : flipped
    })
    .join('')
}

/** Commutativity checks for one side of a fraction (no top-level '/' left). */
function partMatch(a: string, b: string): boolean {
  if (a === b) return true
  if (sortedTerms(a) === sortedTerms(b)) return true
  if (sortedFactors(a) === sortedFactors(b)) return true
  return false
}

/**
 * Compare two fractions part by part.
 *
 * `sortedTerms` splits on +/- at depth 0 only, so when the whole answer is a
 * single fraction it sees one term and no reordering is ever considered:
 * "(3y+4)/(y-1)" was marked wrong against "(4+3y)/(y-1)". Splitting on the
 * top-level '/' first lets the existing sorters do their job on each side.
 *
 * Also tries negating both sides together. That is an identity rather than a
 * heuristic — (-p)/(-q) is p/q for any q ≠ 0 — and it is what makes
 * "(-4-3y)/(1-y)" match "(4+3y)/(y-1)". Nothing else about signs is attempted;
 * a general CAS is deliberately out of scope on this project.
 */
function fractionPartsMatch(a: string, b: string): boolean {
  const pa = splitTopLevel(a, '/').map(stripOuterBrackets)
  const pb = splitTopLevel(b, '/').map(stripOuterBrackets)
  if (pa.length < 2 || pa.length !== pb.length) return false
  if (pa.some(p => p === '') || pb.some(p => p === '')) return false

  if (pa.every((p, i) => partMatch(p, pb[i]))) return true

  // Negate numerator and denominator together — only meaningful for a simple
  // two-part fraction, where it is exactly the (-p)/(-q) = p/q identity.
  if (pa.length === 2) {
    const flipped = [negateTerms(pa[0]), negateTerms(pa[1])]
    if (flipped.every((p, i) => partMatch(p, pb[i]))) return true
  }
  return false
}

/**
 * The subjects an answer may be written against: a single letter ("x="), the
 * Leibniz derivative forms ("dy/dx=", "ds/dt=", and the second derivative
 * "d^2y/dx^2="), and the Lagrange forms ("f'(x)=", "f''(x)=").
 *
 * The derivative forms are here because the questions that ASK for a
 * derivative print the subject in the prompt — "Find dy/dx" — so writing it
 * back is the natural answer and the one the exam papers model. A prefix is
 * notation around the expression, not a different answer, and leaving it off
 * evidences nothing about differentiating. (Contrast the fraction branch in
 * checkAnswer, which REFUSES a decimal written for a fraction: there the form
 * is itself what is being marked.)
 *
 * normalise() has already lower-cased and de-spaced the answer and turned "²"
 * into "^2", so only the caret form of the order needs matching. Both
 * apostrophes are accepted because a phone keyboard offers the curly one.
 */
const ASSIGNMENT_SUBJECT =
  /^(d\^?\d?[a-z]\/d[a-z]\^?\d?|[a-z]['’]{1,2}(?:\([a-z]\))?|[a-z])=(.+)$/

/**
 * A leading subject on an otherwise bare expression, as in "x=(4+3y)/(y-1)"
 * or "dy/dx=12x^2+10x-2".
 * Returns null for anything with a second '=' — a solution list such as
 * "x=-3andx=-2", or simultaneous answers like "x=2,y=3", must be left for
 * `sortedSolutions`.
 */
function assignmentPrefix(s: string): { subject: string; rest: string } | null {
  const m = s.match(ASSIGNMENT_SUBJECT)
  if (!m || m[2].includes('=')) return null
  // The subject is compared verbatim, so "dy/dx" and "ds/dt" stay distinct —
  // see the DIFFERENT-subjects guard in expressionMatch. Only the apostrophe
  // is canonicalised, since "f'(x)" and "f’(x)" are the same subject typed on
  // different keyboards.
  return { subject: m[1].replace(/’/g, "'"), rest: m[2] }
}

/**
 * The canonical form of an AUTHORED subject — "ds/dt", "d²s/dt²", "y'" — in the
 * same space `assignmentPrefix` returns for a student's typed one: lower-cased,
 * superscripts as carets, the curly apostrophe straightened.
 *
 * Built by running the authored string through the REAL pipeline (normalise,
 * then ASSIGNMENT_SUBJECT) rather than re-implementing its rules, so an
 * authored "d²s/dt²" and a typed "d^2s/dt^2" cannot drift apart. The "=0" is
 * only there because the grammar is anchored on a whole assignment.
 *
 * Returns null for anything the grammar does not recognise as a subject, which
 * is how an authoring typo is discarded instead of quietly becoming a subject
 * no student can ever match.
 */
export function canonicalSubject(authored: string): string | null {
  return assignmentPrefix(normalise(`${authored}=0`))?.subject ?? null
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

  // "x = <expression>" is a common way to write a rearrangement, and
  // "dy/dx = <expression>" is how a derivative is written, both marked wrong
  // before. Strip the subject from BOTH sides, so it works whichever side
  // wrote it — but not when the two name DIFFERENT subjects, or "y=5" would be
  // accepted for "x=5" and "ds/dt=2t" for "dv/dt=2t". The stripped remainder
  // contains no '=', so this recurses at most once.
  const pa = assignmentPrefix(a)
  const pb = assignmentPrefix(b)
  if ((pa || pb) && !(pa && pb && pa.subject !== pb.subject)) {
    return expressionMatch(pa ? pa.rest : a, pb ? pb.rest : b)
  }

  if (sortedTerms(a)   === sortedTerms(b))   return true
  if (sortedFactors(a) === sortedFactors(b)) return true
  if (sortedSolutions(a) === sortedSolutions(b)) return true
  if (fractionPartsMatch(a, b)) return true
  return false
}

// ── Exact surd equivalence ───────────────────────────────────────────────────
//
// The 'exact' type was a normalised string comparison, which marked a student
// wrong for writing the same number a different legal way. Measured against the
// live grader on 2026-11-13, every one of these was REJECTED:
//
//   canonical √2/2  typed 1/√2        canonical √3   typed 3/√3
//   canonical 1/√3  typed √3/3        canonical √3/2 typed 3/(2√3)
//   canonical 4+2√5 typed 2√5+4   (the same number, terms the other way round)
//
// The gap cut both ways inside ONE question: exact_trig_values (5c6ddebf) was
// just extended to 14 draws to cover the whole specification list, which put
// both √2/2 and 1/√3 into its answer pool — so a student who rationalises is
// wrong on one draw and a student who does not is wrong on another. Three bank
// questions out of the 33 'exact' ones produce a surd answer at all: 5c6ddebf,
// e9a09aa3 (surds_expanding_and_rationalising) and 75ebebaf (surds_simplifying).
//
// ── WHY A SYMBOLIC NORMAL FORM AND NOT A NUMERIC COMPARISON ─────────────────
// The obvious cheap fix is to compare the two sides as floating-point numbers
// at a tight tolerance. It was rejected: the whole point of the 'exact' type is
// that a decimal is NOT an acceptable answer, and a numeric comparison makes
// that property depend on how many digits the student happened to type. At
// tolerance 1e-9 "0.707" fails but "0.7071067811865476" passes, and which side
// of the line a decimal lands on is then an accident rather than a decision.
//
// So each side is parsed into a canonical map instead — radicand → rational
// coefficient, every radicand reduced to a square-free integer, with 1 as the
// key for the rational part:
//
//   √2/2    → {2: 1/2}        1/√2    → {2: 1/2}      equal
//   1/√3    → {3: 1/3}        √3/3    → {3: 1/3}      equal
//   √3/2    → {3: 1/2}        3/(2√3) → {3: 1/2}      equal
//   4+2√5   → {1: 4, 5: 2}    2√5+4   → {1: 4, 5: 2}  equal
//
// Two properties fall out of that representation rather than being bolted on:
//
//  • A DECIMAL CANNOT ENTER IT. The parser reads integer literals only, so
//    "0.707" fails to parse and the comparison never runs — a structural
//    guarantee, not a tolerance that happens to be tight enough today. All the
//    arithmetic is exact integer rational arithmetic; there is no float in here.
//  • TERM ORDER IS FREE. A map has no order, so "2√5+4" needs no special case.
//    expressionMatch's sortedTerms() was the alternative considered for that
//    one row of the table, but it is a string sort that cannot see that 1/√2
//    and √2/2 are the same number — it would have fixed the easiest case and
//    left the four that actually prompted this.
//
// ── WHY IT IS GATED ON requireSimplest ──────────────────────────────────────
// 75ebebaf asks the student to simplify √(a²b), and its first authored trap is
// √(a²b) itself — the UNSIMPLIFIED form, which is numerically equal to the
// correct answer. Accepting every equivalent form would accept √12 for 2√3 and
// make that trap unreachable on the one question whose assessed skill IS the
// form. `requireSimplest` already carries exactly that meaning elsewhere in
// this file ("the simplification IS the assessed skill, so an unsimplified
// equivalent is NOT accepted"), and 75ebebaf already has requires_simplest set
// while the other two have it clear — so no new column is needed, and that
// question keeps its authored trap, its wording and its method mark untouched.
//
// Deliberately narrow in two more ways, so that what cannot be proved right
// fails closed to the old string comparison rather than guessing:
//  • At least one side must contain a radical. Without that guard 'exact' would
//    also start accepting "6/3" for "2" and "2/4" for "1/2", which is a change
//    to rational answers that nothing here measured and that an exact-value
//    question arguably should refuse anyway.
//  • Anything the grammar does not cover returns null and the caller falls back:
//    letters, π, '=', '^', nested radicals (√(1+√2)), and division by a sum
//    (1/(1+√2) needs conjugate rationalisation, which no bank answer asks for).
// ─────────────────────────────────────────────────────────────────────────────

/** A rational n/d in lowest terms, d > 0. */
type Rat = { n: number; d: number }

/**
 * A surd expression in normal form: square-free radicand → rational
 * coefficient. Key 1 holds the rational part (√1 = 1). A zero coefficient is
 * never stored, so the empty map is the number zero and two equal values always
 * have identical key sets.
 */
type Surd = Map<number, Rat>

/**
 * Radicands above this are refused. The largest the bank can produce is
 * √252 = 6√7 (75ebebaf at a=6, b=7); the cap only exists so that a pathological
 * typed answer cannot push splitSquare into a long trial-division loop.
 */
const RADICAND_LIMIT = 1_000_000


/**
 * Build a reduced rational, or null if the inputs are not safe integers — which
 * is also the overflow guard: every caller computes n and d as integer products
 * and sums, so a value that has drifted past 2^53 arrives here as a non-safe
 * integer and the whole parse fails closed instead of comparing wrong numbers.
 */
function rat(n: number, d: number): Rat | null {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0) return null
  if (d < 0) { n = -n; d = -d }
  const g = gcd(n, d) || 1
  return { n: n / g, d: d / g }
}

const ratAdd = (a: Rat, b: Rat): Rat | null => rat(a.n * b.d + b.n * a.d, a.d * b.d)
const ratMul = (a: Rat, b: Rat): Rat | null => rat(a.n * b.n, a.d * b.d)
const ratDiv = (a: Rat, b: Rat): Rat | null => (b.n === 0 ? null : rat(a.n * b.d, a.d * b.n))

/**
 * Pull the largest square factor out of a positive integer: n = k²m with m
 * square-free. √252 → {k: 6, m: 7}, √12 → {k: 2, m: 3}, √5 → {k: 1, m: 5}.
 * This is what makes the normal form canonical — without it √12 and 2√3 would
 * sit under different keys.
 */
function splitSquare(n: number): { k: number; m: number } | null {
  if (!Number.isSafeInteger(n) || n < 1 || n > RADICAND_LIMIT) return null
  let k = 1, m = n
  for (let p = 2; p * p <= m; p++) {
    while (m % (p * p) === 0) { m /= p * p; k *= p }
  }
  return { k, m }
}

/** Add coeff·√radicand into a Surd, reducing the radicand and dropping zeros. */
function surdAddTerm(s: Surd, radicand: number, coeff: Rat): Surd | null {
  if (coeff.n === 0) return s
  const sq = splitSquare(radicand)
  if (!sq) return null
  const c = ratMul(coeff, { n: sq.k, d: 1 })
  if (!c) return null
  const prev = s.get(sq.m)
  const sum = prev ? ratAdd(prev, c) : c
  if (!sum) return null
  if (sum.n === 0) s.delete(sq.m); else s.set(sq.m, sum)
  return s
}

const surdRat = (r: Rat): Surd => (r.n === 0 ? new Map() : new Map([[1, r]]))

function surdAdd(a: Surd, b: Surd): Surd | null {
  let out: Surd | null = new Map(a)
  for (const [rad, c] of b) {
    out = surdAddTerm(out, rad, c)
    if (!out) return null
  }
  return out
}

const surdNeg = (a: Surd): Surd =>
  new Map([...a].map(([rad, c]) => [rad, { n: -c.n, d: c.d }]))

/** √ra·√rb = √(ra·rb), so a product is a double loop over the terms. */
function surdMul(a: Surd, b: Surd): Surd | null {
  let out: Surd = new Map()
  for (const [ra, ca] of a) {
    for (const [rb, cb] of b) {
      const c = ratMul(ca, cb)
      if (!c || !Number.isSafeInteger(ra * rb)) return null
      const next = surdAddTerm(out, ra * rb, c)
      if (!next) return null
      out = next
    }
  }
  return out
}

/**
 * Division, by rationalising: ca·√ra ÷ (cb·√rb) = (ca / (cb·rb))·√(ra·rb).
 *
 * The divisor must be a SINGLE term, which is what lets this stay exact and
 * short. A sum in the denominator (1/(1+√2)) needs conjugate rationalisation,
 * and no bank answer is written that way — e9a09aa3 asks for "p + q√n where p
 * and q are integers", so an unrationalised quotient is not an answer in the
 * form that question demanded — so it returns null and the caller falls back.
 */
function surdDiv(a: Surd, b: Surd): Surd | null {
  if (b.size !== 1) return null
  const [[rb, cb]] = [...b]
  const denom = ratMul(cb, { n: rb, d: 1 })
  if (!denom || denom.n === 0) return null
  let out: Surd = new Map()
  for (const [ra, ca] of a) {
    const c = ratDiv(ca, denom)
    if (!c || !Number.isSafeInteger(ra * rb)) return null
    const next = surdAddTerm(out, ra * rb, c)
    if (!next) return null
    out = next
  }
  return out
}

/**
 * √ of an already-parsed value. Only a non-negative RATIONAL has a root here:
 * √(n/d) = √(n·d)/d. A radicand that still contains a radical (√(1+√2)) or is
 * negative returns null.
 */
function surdRoot(a: Surd): Surd | null {
  if (a.size === 0) return new Map()
  if (a.size !== 1 || !a.has(1)) return null
  const r = a.get(1)!
  if (r.n < 0) return null
  const coeff = rat(1, r.d)
  if (!coeff || !Number.isSafeInteger(r.n * r.d)) return null
  return surdAddTerm(new Map(), r.n * r.d, coeff)
}

/**
 * Parse a normalised string into a Surd, or null if it is not an exact surd
 * expression. Grammar (integers only — a decimal point cannot be read, which is
 * how "0.707" is kept out):
 *
 *   expr    := term (('+' | '-') term)*
 *   term    := factor (('*' | '/' | <implicit>) factor)*
 *   factor  := ('-' | '+') factor | '√' primary | primary
 *   primary := '(' expr ')' | integer
 *
 * '√' binds to the primary that follows, so "√2/2" is (√2)/2 — the conventional
 * reading — and not √(2/2). Implicit multiplication covers "2√3" and "2(1+√3)",
 * which is the notation normalise() leaves behind after collapsing "2*√3".
 */
function parseSurd(src: string): Surd | null {
  let i = 0
  const startsFactor = (c: string | undefined) =>
    c !== undefined && (c === '(' || c === '√' || (c >= '0' && c <= '9'))

  function primary(): Surd | null {
    if (src[i] === '(') {
      i++
      const e = expr()
      if (!e || src[i] !== ')') return null
      i++
      return e
    }
    const start = i
    while (i < src.length && src[i] >= '0' && src[i] <= '9') i++
    if (i === start) return null
    const r = rat(Number(src.slice(start, i)), 1)
    return r ? surdRat(r) : null
  }

  function factor(): Surd | null {
    if (src[i] === '-') { i++; const f = factor(); return f ? surdNeg(f) : null }
    if (src[i] === '+') { i++; return factor() }
    if (src[i] === '√') { i++; const rad = primary(); return rad ? surdRoot(rad) : null }
    return primary()
  }

  function term(): Surd | null {
    let left = factor()
    while (left) {
      if (src[i] === '*') { i++; const r = factor(); left = r && surdMul(left, r) }
      else if (src[i] === '/') { i++; const r = factor(); left = r && surdDiv(left, r) }
      else if (startsFactor(src[i])) { const r = factor(); left = r && surdMul(left, r) }
      else break
    }
    return left || null
  }

  function expr(): Surd | null {
    let left = term()
    while (left && (src[i] === '+' || src[i] === '-')) {
      const op = src[i++]
      const r = term()
      left = r && surdAdd(left, op === '+' ? r : surdNeg(r))
    }
    return left || null
  }

  const out = expr()
  // Only a parse that consumed the WHOLE string counts: a leftover character
  // means the grammar did not understand the answer, and a partial read would
  // silently compare "√2/2x" against "√2/2".
  return out && i === src.length ? out : null
}

/**
 * Do two normalised strings denote the same exact surd value? False whenever
 * either side is not an exact surd expression, which is the fallback that keeps
 * every other kind of 'exact' answer on the old string comparison.
 */
function surdMatch(a: string, b: string): boolean {
  if (!a.includes('√') && !b.includes('√')) return false
  const sa = parseSurd(a)
  if (!sa) return false
  const sb = parseSurd(b)
  if (!sb) return false
  if (sa.size !== sb.size) return false
  for (const [rad, ca] of sa) {
    const cb = sb.get(rad)
    if (!cb || cb.n !== ca.n || cb.d !== ca.d) return false
  }
  return true
}

/**
 * The 'exact' comparison: the normalised strings, or the same surd written
 * another legal way. Used for the correct answer and for trap answers alike —
 * on 5c6ddebf at tan 60° the canonical answer is √3 and the wrong-trig-ratio
 * trap is 1/√3, so a student who writes √3/3 has made precisely the error that
 * trap was authored for and should get its feedback rather than a bare "wrong".
 */
function exactMatch(a: string, b: string, requireSimplest: boolean): boolean {
  if (a === b) return true
  if (requireSimplest) return false
  return surdMatch(a, b)
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
 * "{4, 6}"      → "4,6"
 * "ℰ = {1, 2}"  → "1,2"
 */
function normalisedSet(s: string): string {
  // Braces are stripped, not refused. The questions print their sets in brace
  // notation — "ℰ = {1, 2, 3, 4, 5}" — so a student who mirrors the stem and answers
  // "{4, 6}" has written the SAME answer as "4, 6", in the notation the exam paper
  // itself uses. A brace is punctuation around a list, not a different kind of
  // answer, and leaving one off evidences nothing about the assessed skill.
  // (Contrast the fraction "right value, wrong form" branch in checkAnswer, which
  // REFUSES a decimal written for a fraction: there the form is itself what is being
  // marked.) The prompts do say "separate them with commas", but that instruction
  // should not be load-bearing — being told you are wrong when you are right
  // teaches the student nothing.
  const unbraced = s.trim().replace(/[{}]/g, ' ')

  // A "set name =" prefix goes the same way, since the stem writes its sets as
  // "ℰ = {…}" and an answer may well come back as "A∩B = {4, 6}". Only a SHORT label
  // is dropped, and only when no second "=" survives, so an answer that is really a
  // list of assignments ("x=2, y=3") is left intact for the types that handle it.
  const named = unbraced.match(/^[^=]{0,6}=([^=]*)$/)

  return (named ? named[1] : unbraced)
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

/**
 * The unit an answer is expressed in, normalised for comparison — "400 cm³" →
 * "cm3", "15 mm" → "mm", "72" → null.
 *
 * Derived by removing the numeric part and tidying what is left, rather than by
 * matching a unit list, so an unusual unit still compares equal to itself.
 * Currency and percent are excluded: `normalise` already strips them, and they
 * behave as notation rather than as a unit that could be got wrong.
 */
function unitToken(text: string): string | null {
  const flat = stripHtmlForUnits(text)
    .toLowerCase()
    .replace(/[²³]/g, m => (m === '²' ? '2' : '3'))
    .replace(/\^/g, '')
  // Match the KNOWN unit vocabulary rather than "whatever letters are left":
  // an answer can legitimately contain letters that are not units — π written
  // as "pi", an algebraic x — and treating those as a unit would report a
  // mismatch between two ways of writing the same correct answer.
  // Compound and squared/cubed forms first, so "cm3" never matches as "cm".
  const matches = flat.match(
    /g\/cm3|g\/ml|km\/h|m\/s|mph|cm[23]|mm[23]|km[23]|m[23]|kg|mg|ml|cm|mm|km|litres?|liters?|metres?|meters?|grams?|miles?|hours?|hrs?|minutes?|mins?|seconds?|secs?|\b[mgs]\b/g,
  )
  // The unit trails the value, so the last token is the one being claimed.
  return matches ? matches[matches.length - 1] : null
}

/** The unit as a comparison key, with spelling variants folded together. */
function unitOf(text: string): string | null {
  const cleaned = unitToken(text)
  if (cleaned === null) return null
  // Spelling variants that mean the same quantity must not read as a mismatch.
  const SYNONYMS: Record<string, string> = {
    metres: 'm', metre: 'm', meters: 'm', meter: 'm',
    litres: 'l', litre: 'l', liters: 'l', liter: 'l',
    grams: 'g', gram: 'g',
    seconds: 's', second: 's', secs: 's', sec: 's',
    minutes: 'min', minute: 'min', mins: 'min',
    hours: 'hr', hour: 'hr', hrs: 'hr',
    miles: 'mile',
  }
  return SYNONYMS[cleaned] ?? cleaned
}

/**
 * Both sides name a unit, and they are different ones.
 *
 * This is a WRONG answer, not a formatting slip: "400 cm³" is not a capacity in
 * litres, and on the question that prompted this the conversion was the assessed
 * skill. Distinct from units merely OMITTED, which stays acceptable — a bare
 * number is incomplete, whereas a wrong unit asserts something untrue.
 */
function unitsMismatch(studentAnswer: string, correctAnswer: string): boolean {
  const s = unitOf(studentAnswer)
  const c = unitOf(correctAnswer)
  return s !== null && c !== null && s !== c
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
    // A MIXED NUMBER keeps its whole part: "2 1/3" → "2_1/3".
    //
    // This HAS to happen before whitespace is stripped, because stripping it
    // is what caused the bug. Measured against the live grader on 2026-11-03:
    // normalise('2 1/3') returned '21/3' — the string for seven — so "21/3"
    // was ACCEPTED as an answer of two and a third on both the fraction and
    // the exact type, while "7/3", the same number, was rejected.
    //
    // The marker is '_' because it appears in no answer anywhere: checked over
    // all 1,847 rows of the questions table (answer templates, trap templates
    // and MC options) — every '_' in that data is a snake_case skill or
    // misconception id, never part of a value. A '+' was the alternative and is
    // worse: it would make the mixed form indistinguishable from a typed sum,
    // and the expression type would then start rearranging it.
    //
    // Deliberately narrow — <whole> <num>/<den>, and the whole part must start
    // at a boundary, so "0.5 1/2" (a decimal next to a fraction) is not read as
    // a mixed number. A negative sign in front belongs to the WHOLE value:
    // "-2 1/3" is -(2 + 1/3), which is how a paper writes it.
    .replace(/(^|[^\d.])(\d+)\s+(\d+)\s*\/\s*(\d+)/g, '$1$2_$3/$4')
    // Remove all whitespace
    .replace(/\s+/g, '')
    // Standard form typed with the LETTER x: "4.15 x 10^5" → "4.15*10^5".
    //
    // '×' is converted above, but a keyboard does not offer it, so students
    // type 'x' — and the answer was then marked wrong. Deliberately narrow: it
    // fires only for <digit>x immediately followed by "10^", which is
    // unambiguously standard form. An algebraic 'x' never has "10^" after it,
    // so "2x", "2x+1" and "3x-4" are untouched.
    .replace(/(\d)x(?=10\^)/g, '$1*')
    // Strip redundant brackets around a numeric surd radicand: √(2) → √2
    .replace(/√\((\d+)\)/g, '√$1')
    // A coefficient of 1 written explicitly: "1*y" → "y".
    //
    // Templates produce this whenever a parameter lands on 1 — "({{a}}+{{b}}*y)"
    // at b=1 renders "(2+1*y)" — and no student writes it, so the canonical
    // answer became unmatchable. Must run BEFORE the '*' collapse below, which
    // would otherwise turn it into "1y" first.
    //
    // Guards: not after a digit or decimal point, so "11*y" and "0.1*y" are
    // untouched; not after '^', so an index of 1 in a prime factorisation
    // ("2^1*x") keeps its exponent. The lookahead is what makes this safe for
    // units — nobody writes "1*cm", so "1cm" is never reached.
    .replace(/(^|[^\d.^])1\*(?=[a-zπ√(])/g, '$1')
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
  // A bare fraction is ONE value, not a number followed by noise. Taking the
  // first number would read "3/15" as 3 — which silently turned a student's
  // fraction into a different answer entirely and then fired the trap written
  // for that other answer, feeding back a mistake they had not made.
  const frac = s.trim().match(/^(-?[\d,]+(?:\.\d+)?)\s*\/\s*(-?[\d,]+(?:\.\d+)?)$/)
  if (frac) {
    const den = parseFloat(frac[2].replace(/,/g, ''))
    if (den !== 0) return parseFloat(frac[1].replace(/,/g, '')) / den
  }
  // A mixed number is ONE value too, for exactly the same reason: taking the
  // first number would read "2_1/3" as 2 and then fire whatever trap was
  // written for 2. Only the NORMALISED form is recognised — the callers that
  // pass a raw string here (the rounding and π-estimate checks) are about
  // decimal answers, where a mixed number does not arise.
  const mixed = parseMixedNumber(s.trim())
  if (mixed !== null) return mixed
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
 * A NORMALISED mixed number: "2_1/3" for two and a third. normalise() leaves
 * the '_' where the space was — see the mixed-number step there for why the
 * whole part cannot simply be glued on.
 *
 * Anchored, so a mixed number is the WHOLE answer; "2_1/3cm" is a value with a
 * unit and is handled by the units-stripping retry, not here.
 */
const MIXED_NUMBER = /^(-?)(\d+)_(\d+)\/(\d+)$/

/**
 * The value of a normalised mixed number, or null if it is not one.
 *
 * The sign goes on the WHOLE value: "-2_1/3" is -(2 + 1/3) = -2.333…, which is
 * what "-2⅓" means on a paper, and not -2 + 1/3.
 */
function parseMixedNumber(s: string): number | null {
  const m = s.match(MIXED_NUMBER)
  if (!m) return null
  const den = parseInt(m[4], 10)
  if (den === 0) return null
  const magnitude = parseInt(m[2], 10) + parseInt(m[3], 10) / den
  return m[1] === '-' ? -magnitude : magnitude
}

/**
 * Parse a string that may be an integer, decimal, fraction (e.g. "3/4", "-1/2")
 * or mixed number ("2_1/3", normalise()'s form for "2 1/3").
 * Returns the numeric value, or NaN if the string is not a recognised number form.
 *
 * normalise() strips whitespace before this is called, so we only need to handle
 * compact forms like "3/4" or "-1/2", not "3 / 4".
 */
function parseFraction(s: string): number {
  const mixed = parseMixedNumber(s)
  if (mixed !== null) return mixed
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
  // A mixed number terminates exactly when its fractional part does — the
  // whole part contributes no digits after the point. Without this branch
  // "2_1/3" fell through as "not a fraction" and counted as terminating, which
  // cost the student the "this decimal can only be an approximation" message.
  const mix = canonical.match(MIXED_NUMBER)
  if (mix) return hasTerminatingDecimal(`${mix[3]}/${mix[4]}`)
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
 *
 * ── WHAT "SIMPLEST" MEANS FOR A MIXED NUMBER ────────────────────────────────
 * Two conditions, and a mixed number must meet both: its fractional part is in
 * lowest terms, and that part is PROPER. "2_2/6" fails the first, "1_4/3"
 * the second — it is really 2⅓, and a paper would not accept it. "2_1/3" meets
 * both, so it is simplest and is not nudged.
 *
 * This matters because the bug made it look otherwise: "2 1/3" normalised to
 * "21/3", gcd(21, 3) = 3, and the student who had written a perfectly simplified
 * mixed number was told to "give your answer in its simplest form" (measured on
 * the live grader, 2026-11-03).
 *
 * An improper fraction in lowest terms ("7/3") is NOT unsimplified — nothing
 * cancels. The mark schemes agree: they credit "7/3 oe". Where a question wants
 * one form rather than the other it says so with requires_fraction_form, which
 * is a separate gate from this one.
 */
function isUnsimplifiedFraction(s: string): boolean {
  const mix = s.match(MIXED_NUMBER)
  if (mix) {
    const num = parseInt(mix[3], 10)
    const den = parseInt(mix[4], 10)
    if (den === 0) return false
    return num >= den || gcd(num, den) > 1
  }
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

/**
 * Parse a BARE scalar — a single value with no comma, so not a coordinate/list.
 * Lets a coordinate question author a trap for "gave just the value, not the
 * point" (e.g. `21` against the answer `(0, 21)`): parseCoordinate rejects a
 * lone number, so without this the slip gets only a generic "not quite". Used
 * for TRAP matching only — the canonical answer stays strictly a coordinate.
 */
function parseScalarOnly(s: string): number | null {
  if (s.includes(',')) return null
  const n = parseFraction(s.replace(/[()]/g, ''))
  return isNaN(n) ? null : n
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
  'Right value — but always write the units. An answer without them costs you the final mark in an exam.'

const SIMPLIFICATION_REMINDER =
  'Correct! Remember to simplify your answer fully — you may lose marks in an exam for leaving it unsimplified.'

/**
 * Right expression, wrong quantity named in front of it: "s = 6t² + 10t - 4"
 * for the VELOCITY, where s is the displacement.
 *
 * Deliberately a message and nothing else — see the `subjectIssue` block in
 * checkAnswer for why the alternative (putting the subject in the answer
 * template) is not available.
 */
const SUBJECT_REMINDER = (wrote: string, expected: string) =>
  `Correct — the expression is right, so the marks are safe. But look at what you have called it: `
  + `you wrote <strong>${wrote} =</strong>, and the quantity this question asks for is `
  + `<strong>${expected}</strong>. Naming the wrong one is how the next step of a longer question `
  + `goes astray.`

const ROUNDING_REMINDER = (dp: number) =>
  `Correct — but remember to round your answer to ${dp} decimal place${dp === 1 ? '' : 's'}.`

const ROUNDING_ERROR =
  'Not quite — your answer is one out in the last decimal place. Check which way you rounded.'

const NOT_SIMPLEST =
  'Almost — that’s the right value, but give your answer in its simplest form.'

/**
 * Anything in a ratio that is not part of a plain number — a π, a unit, an
 * algebraic letter. `normalise` has already stripped whitespace and currency.
 */
const RATIO_NON_NUMERIC = /[^\d:.\-/]/

/**
 * A NORMALISED standard-form string: "4.69*10^6". `normalise` has already
 * turned '×' (and the letter x) into '*', '<sup>n</sup>' and superscripts into
 * '^n', and stripped whitespace, so this only has to match the canonical shape.
 * Anchored, so anything with extra terms or units around it is not a match.
 */
const STANDARD_FORM = /^(-?\d+(?:\.\d+)?)\*10\^(-?\d+)$/

/**
 * Why a right-valued ratio is not yet in its simplest form.
 *
 * The verdict is the same either way — all three are marked wrong when the
 * question demanded simplest form — so this only decides what the student is
 * TOLD. Two of the cases are worth naming because they are different
 * misunderstandings, not different arithmetic:
 *
 *   "24π:36π"     the student never noticed the π is common to both parts and
 *                 cancels. On a volume- or area-ratio question that is the
 *                 whole point of the item.
 *   "75.4:113.1"  the student evaluated both quantities as decimals instead of
 *                 keeping them exact, and does not know a ratio is written with
 *                 whole numbers.
 *
 * Neither can be expressed as a question-level trap: traps are only consulted
 * once an answer is genuinely wrong, and both of these are RIGHT-valued, so
 * they return from the simplest-form branch long before trap matching. That is
 * why this lives in the grader.
 *
 * Every branch keeps the word "simplest" — the rest of the app and the tests
 * key on it.
 */
function unsimplifiedRatioMessage(normStudent: string): string {
  if (RATIO_NON_NUMERIC.test(normStudent)) {
    return 'Almost — the value is right, but a ratio is written with plain numbers. '
      + 'Anything both parts share cancels — a π, a unit, a common factor — so divide it out '
      + 'and give your answer in its simplest form.'
  }
  const parts = parseRatio(normStudent)
  if (parts && parts.some(p => !Number.isInteger(p))) {
    return 'Almost — the value is right, but a ratio is written with whole numbers. '
      + 'Scale both parts up until they are integers, then give your answer in its simplest form.'
  }
  return NOT_SIMPLEST
}

/**
 * Right value, wrong FRACTION FORM — or null when there is nothing to say.
 *
 * Only ever consulted on a question that DECLARED which form it wants. Absent
 * that declaration both forms are accepted, which is the default and what the
 * mark schemes say: "oe" on all but a handful of parts. The handful is real
 * though — JUN23-H-P1 q3's gap note reads "mixed-number answer; improper form
 * not credited" — and for those the conversion IS the assessed skill.
 *
 * Called with the RAW answers and strips units from both, because a unit is not
 * part of the form: "1 1/2 hours" is a mixed number with a word after it, and
 * MIXED_NUMBER is anchored, so the bare values are what can be judged.
 *
 * `hasWholePart` is the counterpart of the `normCorrect.includes('/')` guard in
 * the decimal branch: a question can demand the mixed form only where the
 * answer HAS one. An answer that is a whole number ("2") or a proper fraction
 * ("2/3") has no mixed form at all, and a student who typed it exactly right
 * must not be sent to convert it into something that does not exist.
 *
 * Used by 'fraction' only. 'exact' compares strings, so it already enforces
 * whatever form the author wrote, and no other answer type has two forms to
 * choose between.
 */
function fractionFormIssue(
  studentAnswer: string,
  correctAnswer: string,
  requireFractionForm: FractionForm | null | undefined,
): FractionForm | null {
  if (!requireFractionForm) return null
  const bareStudent = normalise(stripUnits(studentAnswer))
  const bareCorrect = normalise(stripUnits(correctAnswer))
  const correctIsMixed = MIXED_NUMBER.test(bareCorrect)
  const studentIsMixed = MIXED_NUMBER.test(bareStudent)
  const correctValue = parseFraction(bareCorrect)
  const hasWholePart = Number.isFinite(correctValue) && Math.abs(correctValue) > 1
  if (!bareCorrect.includes('/') || !(correctIsMixed || hasWholePart)) return null
  if (requireFractionForm === 'mixed'    && !studentIsMixed) return 'mixed'
  if (requireFractionForm === 'improper' && studentIsMixed)  return 'improper'
  return null
}

/**
 * What to say about a right-valued answer in the wrong fraction form. Names the
 * form and how to get there, without giving the answer away — the same line the
 * simplest-form messages walk.
 */
const WRONG_FRACTION_FORM: Record<FractionForm, string> = {
  mixed: 'Almost — that’s the right value, but the question asks for a <strong>mixed number</strong>: '
    + 'a whole number with a proper fraction beside it, like 1 3/4. Work out how many whole ones '
    + 'your fraction holds, and what is left over.',
  improper: 'Almost — that’s the right value, but the question asks for an <strong>improper fraction</strong>: '
    + 'a single fraction, top heavier than the bottom, like 7/4. Multiply the whole number by the '
    + 'denominator and add the numerator you already have.',
}

export function checkAnswer(
  studentAnswer: string,
  correctAnswer: string,
  answerType: ScalarAnswerType,
  tolerance: number | null,
  traps: { answer: string, response: string, method_marks?: number, misconception?: string | null }[],
  // Whether the question demanded simplest form. Drives the "not simplified"
  // nudge for fraction/ratio answers. Defaults true → current behaviour preserved.
  requireSimplest: boolean = true,
  /**
   * The question's UNRENDERED answer template, when the caller has it.
   *
   * Its only job is to say whether the answer is built from π, which gates the
   * poor-estimate check below. Optional on purpose: a caller that does not pass
   * it gets exactly the previous behaviour, so wiring this through the surfaces
   * one at a time cannot break the ones not yet reached.
   */
  answerTemplate?: string,
  /**
   * The quantity this answer IS, as the question would name it — ['v','ds/dt']
   * for a velocity, ['a','dv/dt','d²s/dt²'] for an acceleration, ['dy/dx',"y'"]
   * for a derivative. Several because they are synonyms: v and ds/dt are the
   * same quantity written two ways and both are right.
   *
   * Optional, and null/empty is the whole bank bar a handful of questions —
   * those keep exactly the previous behaviour, which is why this is a new
   * argument rather than something read out of the answer template.
   */
  answerSubjects?: string[] | null,
  /**
   * The form a fraction answer must be written in, where the question insists
   * on one: 'mixed' for "write 7/3 as a mixed number", 'improper' for the
   * reverse. See FractionForm.
   *
   * Optional, and null/absent — the whole bank — keeps exactly the behaviour
   * described above: both forms accepted, because they are the same number and
   * the schemes mark them "oe".
   */
  requireFractionForm?: FractionForm | null,
): CheckResult {
  const tol         = tolerance ?? 0
  const usesPi      = usesSubstitutablePi(answerTemplate)
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
        // Not a bare string comparison any more: the same surd written another
        // legal way counts. See exactMatch / surdMatch.
        return exactMatch(normStudent, normCorrect, requireSimplest)
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

  // The student named a DIFFERENT quantity in front of a right expression:
  // "s = 6t² + 10t - 4" where s is the displacement and the question asked for
  // the velocity. Measured on 89c77019 against the live grader: s =, ds/dt =,
  // dv/dt = and even y = are all accepted, because `assignmentPrefix` strips a
  // prefix from one side when the other has none, and these answer templates
  // are bare expressions.
  //
  // Accepting them is RIGHT and does not change here — the prefix is notation,
  // not the answer, and the expression is what the skill is. The only thing
  // added is a word about it, on the same `message` channel the units and
  // simplification reminders use.
  //
  // Hence a declaration separate from the answer template. Writing the subject
  // INTO the template is not an option: that makes both sides carry one, which
  // engages the different-subjects guard in expressionMatch and REJECTS the
  // mismatch — the opposite of what is wanted. It is also unreadable as intent,
  // since a template that happens to carry a subject (there are several) cannot
  // be told apart from one declaring the quantity on purpose.
  const subjectIssue = (() => {
    // Only 'expression' strips a prefix at all, so a declaration on any other
    // answer type is inert rather than wrong.
    if (answerType !== 'expression') return null
    const declared = (answerSubjects ?? [])
      .map(s => ({ authored: s.trim(), canonical: canonicalSubject(s) }))
      .filter((d): d is { authored: string; canonical: string } => d.canonical !== null)
    // Nothing the subject grammar recognises — an empty declaration, or one
    // whose every entry is a typo. Behave exactly as before: a broken authored
    // list must not turn every student's prefix into a nudge.
    if (declared.length === 0) return null
    const wrote = assignmentPrefix(normStudent)?.subject
    // No prefix (or a solution list, which assignmentPrefix refuses) — nothing
    // was named, so there is nothing to correct.
    if (!wrote) return null
    if (declared.some(d => d.canonical === wrote)) return null
    // Named back in the AUTHOR's spelling ("d²s/dt²"), not the canonical one.
    return { wrote, expected: declared[0].authored }
  })()

  // Right value, WRONG unit. Checked before every acceptance path below,
  // because for numeric answers the value comparison never sees the unit at all
  // (extractNumber reads the number and stops), so "400 cm³" would otherwise
  // sail through as a correct "400 litres".
  if (isCorrect && correctHasUnits && studentHasUnits && unitsMismatch(studentAnswer, correctAnswer)) {
    // Name the unit as the question writes it ("litres"), not the internal
    // comparison key ("l").
    const want = unitToken(correctAnswer)
    return {
      // Correct: the maths is right, and the unit is not what was being tested.
      // The mini-exam still deducts the accuracy mark — see gradeUnits.
      correct: true,
      unitsIssue: 'wrong',
      trap: null,
      message: `Right value — but check your units: the question asks for the answer in ${want}. In an exam a wrong unit costs you the final mark.`,
    }
  }

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
      // Ratios get a reason; fractions keep the original wording.
      message: answerType === 'ratio' ? unsimplifiedRatioMessage(normStudent) : NOT_SIMPLEST,
    }
  }

  // Right value, WRONG FORM: the student sidestepped the simplifying altogether by
  // converting to an equivalent decimal ("0.75" for 3/4). fractionMatch accepts an
  // exactly-equal terminating decimal on purpose — a decimal is a perfectly good way
  // to write a fraction's VALUE — but when the question demanded simplest form,
  // reducing the fraction IS the assessed skill, and a decimal evidences none of it.
  // Without this gate the student who converted scored the mark while the one who
  // simplified only partway ("6/8") did not, which is backwards.
  //
  // `normCorrect.includes('/')` is load-bearing: a fraction-type question whose
  // canonical answer is a whole number ("2") has no fraction to write, so a bare
  // integer must still be accepted. And the gate is `requireSimplest`-only — where
  // the question never asked for simplest form, a decimal stays a correct answer.
  //
  // Distinct from the non-terminating case further down ("0.3636…" for 4/11), which
  // is wrong for a different reason — approximation, not form — and keeps its own
  // message. Like every simplest-form branch, this one keeps the word "simplest":
  // the rest of the app and the tests key on it.
  const isWrongForm =
    isCorrect && answerType === 'fraction' && requireSimplest &&
    normCorrect.includes('/') && !normStudent.includes('/')

  if (isWrongForm) {
    return {
      correct: false,
      trap:    null,
      message: 'Almost — that’s the right value, but a decimal is not a fraction: converting '
        + 'avoids the simplifying this question is asking for. Give your answer as a fraction '
        + 'in its simplest form.',
    }
  }

  // Right value, wrong FRACTION FORM: "7/3" where the question said "write
  // this as a mixed number", or "2 1/3" where it asked for an improper
  // fraction. See fractionFormIssue.
  //
  // After the simplest-form gate on purpose: a student who wrote "14/6" for
  // 2 1/3 has two things to fix, and reducing the fraction is the one to name
  // first — it is the more basic habit, and the conversion is easier from
  // lowest terms anyway.
  const formIssue = isCorrect && answerType === 'fraction'
    ? fractionFormIssue(studentAnswer, correctAnswer, requireFractionForm)
    : null

  if (formIssue) {
    return {
      correct: false,
      // A named misconception, not a bare message, and the same shape the
      // π-estimate branch uses: the value is right and the method sound, so
      // this is a real diagnostic the teacher's "Common mistakes" panel should
      // be able to count — "4 pupils left it as an improper fraction" — and
      // `answer_not_in_requested_form` already exists for exactly this
      // ("...or a fraction left improper", data/misconceptions.ts).
      //
      // No `method_marks`: how much of the tariff the conversion is worth
      // depends on the question, which the grader does not see. An authored
      // trap can still pay for it.
      trap: { response: '', misconception: 'answer_not_in_requested_form' },
      message: WRONG_FRACTION_FORM[formIssue],
    }
  }

  if (isCorrect) {
    return {
      correct: true,
      trap:    null,
      // Omitted units are flagged the same way a wrong unit is: the maths
      // stands, but the answer as written is not in the unit the question
      // asked for, so the exam's accuracy mark is not there to be given.
      ...(missingUnits ? { unitsIssue: 'missing' as const } : {}),
      // Units before subject: an omitted unit actually costs the accuracy mark
      // (see unitsIssue), while a mis-named quantity costs nothing here — so the
      // one with a mark attached is the one worth the student's attention.
      message: isUnsimplified ? SIMPLIFICATION_REMINDER
              : missingUnits   ? UNITS_REMINDER
              : subjectIssue   ? SUBJECT_REMINDER(subjectIssue.wrote, subjectIssue.expected)
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

  // Which value the student used for π. Only asked on a question whose answer
  // is built from π — the caller supplies the template — because the test is a
  // ratio, and on a question with no π in it a ratio that close to 1 is an
  // arithmetic slip rather than evidence of anything.
  const piEstimate = usesPi && answerType === 'numeric'
    ? detectPiEstimate(extractNumber(studentAnswer), extractNumber(correctAnswer), tol, correctAnswer)
    : null

  // A good estimate is CORRECT. 3.142 is what a non-calculator paper supplies
  // and what a mark scheme accepts, and the accuracy tolerance cannot express
  // that on its own: the gap 3.142 opens grows with the answer, so a tolerance
  // wide enough to accept it on a large draw would accept 3.14 on a small one.
  // Hence the nudge rather than the mark — the π key removes the worry
  // entirely, on a question where it might matter more.
  if (piEstimate?.acceptable) {
    return {
      correct: true,
      trap: null,
      ...(missingUnits ? { unitsIssue: 'missing' as const } : {}),
      message: `Correct — you have used ${piEstimate.label} for π, which is accurate enough here. `
        + 'The π key on your calculator is worth the habit though: it carries the full value, so the accuracy mark is never in question.',
    }
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
          return exactMatch(normStudentStripped, normCorrectStripped, requireSimplest)
        default:
          return false
      }
    })()

    if (matchesWithoutUnits) {
      // The form demand applies here too. This path is how "3/2" is accepted
      // for a canonical of "1 1/2 hours" (the student omitted the unit), and it
      // returns before the form gate above ever runs — so without this the one
      // question shape that carries both a unit and a mixed-number answer would
      // quietly accept either form.
      const strippedFormIssue = answerType === 'fraction'
        ? fractionFormIssue(studentAnswer, correctAnswer, requireFractionForm)
        : null
      if (strippedFormIssue) {
        return {
          correct: false,
          trap: { response: '', misconception: 'answer_not_in_requested_form' },
          message: WRONG_FRACTION_FORM[strippedFormIssue],
        }
      }
      const notSimplifiedStripped =
        answerType === 'fraction' && isUnsimplifiedFraction(normStudentStripped)
      return {
        correct: true,
        trap:    null,
        // Only nudge when expected units were OMITTED. Adding units where none
        // were required is fine and needs no reminder.
        ...(missingUnits ? { unitsIssue: 'missing' as const } : {}),
        message: notSimplifiedStripped ? SIMPLIFICATION_REMINDER
               : missingUnits          ? UNITS_REMINDER
               : subjectIssue          ? SUBJECT_REMINDER(subjectIssue.wrote, subjectIssue.expected)
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
          return exactMatch(normStudent, normTrap, requireSimplest)
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
          if (cs !== null && ct !== null) return coordinatesEqual(cs, ct, Math.max(tol, 1e-9))
          // Bare-scalar trap: the student gave a lone value instead of a
          // coordinate. Matches only when BOTH the trap and the student answer
          // are bare numbers (a real coordinate never reaches here).
          const ss = parseScalarOnly(normStudent)
          const st = parseScalarOnly(normTrap)
          return ss !== null && st !== null && Math.abs(ss - st) <= Math.max(tol, 1e-9)
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
        :                               exactMatch(sStripped, tStripped, requireSimplest)
      if (strippedMatch) {
        return { correct: false, trap, message: trap.response }
      }
    }
  }

  // A poor estimate for π. After the authored traps, so a trap written for this
  // question always wins — and because a trap match is the far more specific
  // claim, that ordering also removes most of what could otherwise be a
  // coincidence: the answers likeliest to sit near a π ratio by accident are
  // exactly the ones a trap has already intercepted.
  //
  // No `method_marks`: the method IS sound and an exam should pay for it, but
  // how many marks that is depends on the question's tariff, which the grader
  // does not see. Better to leave the mark unclaimed than invent a number.
  if (piEstimate && !piEstimate.acceptable) {
    return {
      correct: false,
      trap: {
        response: '',
        misconception: 'used_a_poor_pi_estimate',
      },
      message: `Your method looks right — but ${piEstimate.label} is not an accurate enough value for π, `
        + 'and the answer lands outside what the question accepts. Use the <strong>π</strong> key on your '
        + 'calculator; if you are working without one, 3.142 is the least you should use.',
    }
  }

  // One-place-out rounding miss (authored traps already had their chance above).
  if (rounding.rel === 'off_by_one') {
    return { correct: false, trap: null, message: ROUNDING_ERROR }
  }

  // Power written without its caret — "x5" for "x^5".
  //
  // Stays WRONG, because "x5" genuinely reads as 5 × x and accepting it would
  // train a notation that loses marks in a real exam. But the generic "not
  // quite" hides the fact that the maths may have been perfect, so name the
  // problem instead. Deliberately narrow: it fires only when removing the
  // carets from the EXPECTED answer produces exactly what the student wrote.
  if (normCorrect.includes('^') && normStudent === normCorrect.replace(/\^/g, '')) {
    return {
      correct: false,
      trap:    null,
      // "Caret" is the typographer's word for it, not a student's — name the
      // key and say how to type it.
      message: `Did you mean ${correctAnswer}? Use the <strong>^</strong> symbol for powers — hold Shift and press 6. Without it, “${studentAnswer.trim()}” reads as a multiplication rather than a power.`,
    }
  }

  // Standard form with the first number outside 1–10 — "0.469 × 10⁷" or
  // "46.9 × 10⁵" where the answer is 4.69 × 10⁶.
  //
  // The VALUE is right; only the normalising step is missing, and there are
  // endlessly many such forms (÷10, ×100, ÷100, …) so they cannot each be an
  // authored trap. Stays WRONG — the question asked for standard form — but
  // says which way to move the point instead of a bare "not quite".
  //
  // Runs AFTER trap matching on purpose: a question that authors its own trap
  // for a particular shift keeps its richer, question-specific wording.
  {
    const sfC = normCorrect.match(STANDARD_FORM)
    const sfS = normStudent.match(STANDARD_FORM)
    if (sfC && sfS) {
      const cm = parseFloat(sfC[1]), ce = parseInt(sfC[2], 10)
      const sm = parseFloat(sfS[1]), se = parseInt(sfS[2], 10)
      const cVal = cm * Math.pow(10, ce)
      const sVal = sm * Math.pow(10, se)
      const sameValue = Math.abs(sVal - cVal) <= 1e-9 * Math.max(1, Math.abs(cVal))
      const canonicalNormalised = Math.abs(cm) >= 1 && Math.abs(cm) < 10
      const studentNotNormalised = Math.abs(sm) < 1 || Math.abs(sm) >= 10
      if (sameValue && canonicalNormalised && studentNotNormalised) {
        const tooBig = Math.abs(sm) >= 10
        return {
          correct: false,
          trap: null,
          message: `That is the right value, but it is not in <strong>standard form</strong>: the first number has to be between 1 and 10, and yours is ${sm}.<br>`
            + (tooBig
              ? `Move the decimal point to the <strong>left</strong> and add to the power to balance it`
              : `Move the decimal point to the <strong>right</strong> and take off the power to balance it`)
            + ` — it should be <strong>${correctAnswer}</strong>.`,
        }
      }
    }
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
