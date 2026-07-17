// Convert the app's plain math-input notation into a LaTeX string for the
// KaTeX preview shown above the answer box (components/practice/MathInput.tsx).
//
// The previous version was a flat regex chain with two gaps that this fixes:
//   • sqrt(...) used [^)]* so it broke on nested parens — sqrt((y-5)/3) became
//     "\sqrt{(y-5}" (unbalanced).
//   • fractions only matched digit/digit, so (y-5)/3 never stacked.
// Now: roots are matched with balanced parens, and fractions with "unit"
// detection (a parenthesised group or a run of value chars on each side), so
// sqrt((y-5)/3) → \sqrt{\frac{(y-5)}{3}}. Slashes whose operands can't be
// cleanly identified (e.g. next to a LaTeX command) are left as a literal "/",
// exactly as before — no regression on simple inputs.

/** Index of the ')' matching the '(' at `open`, or -1. */
function matchForwardParen(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') { depth--; if (depth === 0) return i }
  }
  return -1
}

/** Index of the '(' matching the ')' at `close`, or -1. */
function matchBackwardParen(s: string, close: number): number {
  let depth = 0
  for (let i = close; i >= 0; i--) {
    if (s[i] === ')') depth++
    else if (s[i] === '(') { depth--; if (depth === 0) return i }
  }
  return -1
}

// Base value characters that make up an un-bracketed operand (a number, a
// variable, a power). Excludes operators, brackets and the '/' itself.
const VALUE_CHAR = /[A-Za-z0-9.^]/

/** Replace sqrt(...) and cbrt(...) (balanced parens) with \sqrt{...} / \sqrt[3]{...}. */
function convertRoots(s: string): string {
  for (const [fn, pre, post] of [['sqrt', '\\sqrt{', '}'], ['cbrt', '\\sqrt[3]{', '}']] as const) {
    let idx = s.indexOf(fn + '(')
    while (idx !== -1) {
      const open = idx + fn.length
      const close = matchForwardParen(s, open)
      if (close === -1) break // unbalanced — leave the rest untouched
      s = s.slice(0, idx) + pre + s.slice(open + 1, close) + post + s.slice(close + 1)
      idx = s.indexOf(fn + '(')
    }
  }
  return s
}

/** Replace A/B with \frac{A}{B} where A and B are cleanly-identifiable operands. */
function convertFractions(s: string): string {
  let from = 0
  for (;;) {
    const i = s.indexOf('/', from)
    if (i === -1) break

    // left operand
    let ls: number
    if (s[i - 1] === ')') ls = matchBackwardParen(s, i - 1)
    else { let j = i - 1; while (j >= 0 && VALUE_CHAR.test(s[j])) j--; ls = j + 1 }

    // right operand
    let re: number
    if (s[i + 1] === '(') re = matchForwardParen(s, i + 1)
    else { let k = i + 1; while (k < s.length && VALUE_CHAR.test(s[k])) k++; re = k - 1 }

    const leftOk = ls >= 0 && ls <= i - 1
    const rightOk = re >= i + 1 && re < s.length
    if (!leftOk || !rightOk) { from = i + 1; continue } // ambiguous — leave literal '/'

    const num = s.slice(ls, i)
    const den = s.slice(i + 1, re + 1)
    s = s.slice(0, ls) + `\\frac{${num}}{${den}}` + s.slice(re + 1)
    from = 0 // indices shifted — rescan from the start
  }
  return s
}

export function toLatex(input: string): string {
  let s = input
  // Unify surd characters to the function form so convertRoots handles them.
  s = s.replace(/√\(/g, 'sqrt(').replace(/∛\(/g, 'cbrt(')
  // Bare "√2" / "sqrt2" (no bracket) → sqrt(2) so it still renders under a root.
  s = s.replace(/√([A-Za-z0-9.]+)/g, 'sqrt($1)').replace(/∛([A-Za-z0-9.]+)/g, 'cbrt($1)')
  s = s.replace(/sqrt(?!\()([A-Za-z0-9.]+)/g, 'sqrt($1)').replace(/cbrt(?!\()([A-Za-z0-9.]+)/g, 'cbrt($1)')

  s = convertRoots(s)
  s = convertFractions(s)

  // Powers, operators and symbols (unchanged from the original chain).
  s = s
    .replace(/\^(\d+)/g, '^{$1}')
    .replace(/\^([a-zA-Z])/g, '^{$1}')
    .replace(/\*/g, '\\times ')
    .replace(/π|pi/g, '\\pi ')
    .replace(/<=/g, '\\leq ')
    .replace(/>=/g, '\\geq ')
    .replace(/!=/g, '\\neq ')
    .replace(/±/g, '\\pm ')
  return s
}
