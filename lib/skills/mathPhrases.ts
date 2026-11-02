// ─────────────────────────────────────────────────────────────────────────────
// Keeping short expressions on one line.
//
// Briefing text is plain strings, so an expression inside a sentence wraps
// wherever the column runs out: "−2 ≤ x <" on one line and "3" on the next,
// which the reader has to reassemble. The fix is to find the expressions and
// let the page mark them unbreakable, rather than scattering non-breaking
// spaces through the content where nobody can see them.
//
// Deliberately conservative. It only joins a run of operands and operators —
// `5c < 25`, `−6 ≤ 3x < 9`, `360 ÷ 8` — and only while the run stays short
// enough that refusing to break it cannot overflow a narrow column. Prose is
// left alone, including the dashes that read as punctuation.
//
// The one rule that matters: the text must come back unchanged. An earlier
// version lifted trailing punctuation out of the run and rejoined it with a
// space, turning "x = 3," into "x = 3 ,". Punctuation now stays inside the run,
// which is both simpler and correct typography.
// ─────────────────────────────────────────────────────────────────────────────

export type Segment = { text: string; nowrap: boolean }

/** Comparisons and arithmetic that bind an expression together. */
const OPERATOR = /^[<>≤≥=+×÷]$/

/**
 * An operand: a number or letter term, optionally signed, optionally carrying a
 * unit, a power or closing punctuation. Anything with no digit or single letter
 * in it is prose.
 */
const OPERAND = /^[−-]?[\d.,]*[a-zA-Z]?[\d.,]*(?:²|³|ᵗ)?[%°)]?[,.;:]?$/

/**
 * Longest run we will refuse to break. A column on a phone fits roughly this
 * much; beyond it an unbreakable run pushes the layout sideways, which is worse
 * than the wrap it was meant to prevent.
 */
const MAX_RUN = 20

const isOperand = (w: string) =>
  w !== undefined && w.length > 0 && OPERAND.test(w) && /[\da-zA-Z]/.test(w)

/**
 * Splits text into runs, marking the ones that form a single expression.
 *
 * A run qualifies when it reads operand, operator, operand — so "5c < 25" and
 * "−6 ≤ 3x < 9" join, while "the sign stays as it is" does not.
 */
export function splitExpressions(text: string): Segment[] {
  if (!text) return []
  const words = text.split(' ')
  const out: Segment[] = []

  const push = (t: string, nowrap: boolean) => {
    const last = out[out.length - 1]
    // Only PROSE merges. Merging two adjacent runs glued "F = k ÷ d²;" to
    // "20 = k ÷ 9" and made one unbreakable 22-character block out of two
    // separate expressions — past the cap, and not what either run meant.
    if (last && !nowrap && !last.nowrap) last.text += ' ' + t
    else out.push({ text: t, nowrap })
  }

  let i = 0
  while (i < words.length) {
    let j = i
    let pairs = 0
    if (isOperand(words[j])) {
      while (OPERATOR.test(words[j + 1] ?? '') && isOperand(words[j + 2] ?? '')) {
        j += 2
        pairs++
        // Punctuation ends the expression. Without this, "F = k ÷ d²; 20 = k ÷ 9"
        // read as ONE run across the semicolon and blew past the length cap.
        if (/[,.;:]$/.test(words[j])) break
      }
    }

    const run = words.slice(i, j + 1).join(' ')
    if (pairs > 0 && run.length <= MAX_RUN) {
      push(run, true)
      i = j + 1
    } else {
      push(words[i], false)
      i++
    }
  }

  return out
}
