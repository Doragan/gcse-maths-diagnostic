// ─────────────────────────────────────────────────────────────────────────────
// How precisely a question asks to be answered, read from its own wording.
//
// A tolerance is only meaningful next to the rounding the question demands: 0.5
// is generous slack on "to the nearest whole number" and nonsense on "to 2
// decimal places". Parsing the demand is what lets scripts/audit-bank.ts tell
// those apart instead of guessing at an absolute threshold.
// ─────────────────────────────────────────────────────────────────────────────

export type RoundingDemand = {
  /** Size of one unit in the last place the student is asked to give. */
  unit: (answer: number) => number
  /** How to name it in a report ("2 d.p.", "nearest penny"). */
  phrase: string
}
/**
 * The rounding a question DEMANDS of the student, parsed from its own wording,
 * as the size of one unit in the last place the student is asked to give.
 *
 * Only instructions attached to the ANSWER count. A bounds question says both
 * "measured to the nearest kilometre" (about the DATA) and "give your answer to
 * 1 decimal place" (about the answer); reading the first as the second would
 * pass a 0.5 tolerance on a question that actually wants 0.1. So the match has
 * to sit in the window an answer word opens.
 *
 * Returns null when there is no instruction, or when resolving one would need
 * to know what unit the answer is in ("to the nearest cm" — cm of what?).
 * Silence is right there: a guess would either miss real problems or manufacture
 * false ones, and this check is only worth having if its hits are real.
 */
export function demandedRounding(text: string): RoundingDemand | null {
  const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
  // An instruction runs from the answer word to the end of that sentence.
  // Anything before the answer word is describing the data instead.
  //
  // The sentence end cannot simply be the next full stop, because the two most
  // compact ways of writing the instruction contain full stops themselves —
  // "to 3 d.p.", "to 3 s.f." — and cutting at the first one leaves "answer to
  // 3 d", which matches nothing. So a break is a terminator that actually
  // starts a new sentence, and the window is capped so a stem with no
  // terminator at all cannot swallow the rest of the question.
  const WINDOW_CHARS = 160
  const windows = [...plain.matchAll(/answers?\b/gi)].map(m => {
    const rest = plain.slice(m.index!, m.index! + WINDOW_CHARS)
    const brk = rest.search(/[.?!]\s+[A-Z(]|[?!]/)
    return brk === -1 ? rest : rest.slice(0, brk)
  })

  for (const w of windows) {
    let m: RegExpMatchArray | null

    if ((m = w.match(/(\d+)\s*(?:decimal places?|d\.?\s?p\.?)\b/i))) {
      const n = Number(m[1])
      return { unit: () => 10 ** -n, phrase: `${n} d.p.` }
    }
    if ((m = w.match(/(\d+)\s*(?:significant figures?|sig(?:nificant)? figs?|s\.?\s?f\.?)\b/i))) {
      const n = Number(m[1])
      // The last place of an s.f. answer moves with its magnitude: 3 s.f. is a
      // 0.01 place at 1.23 and a 100 place at 12300, so it resolves per draw.
      return {
        unit: (ans: number) => {
          if (!Number.isFinite(ans) || ans === 0) return 10 ** -(n - 1)
          return 10 ** (Math.floor(Math.log10(Math.abs(ans))) - n + 1)
        },
        phrase: `${n} s.f.`,
      }
    }
    // Fixed-size "nearest" units. Deliberately no bare measurement words
    // (cm, m, kg): the answer's own unit is not knowable from here.
    const NEAREST: [RegExp, number, string][] = [
      [/nearest\s+(?:whole number|whole|integer)\b/i, 1, 'nearest whole number'],
      [/nearest\s+(?:penny|pence|1p)\b/i, 0.01, 'nearest penny'],
      [/nearest\s+(?:pound|£\s?1)\b/i, 1, 'nearest pound'],
      [/nearest\s+degree\b/i, 1, 'nearest degree'],
      [/nearest\s+ten\b/i, 10, 'nearest ten'],
      [/nearest\s+hundred\b/i, 100, 'nearest hundred'],
      [/nearest\s+thousand\b/i, 1000, 'nearest thousand'],
    ]
    for (const [re, unit, phrase] of NEAREST) if (re.test(w)) return { unit: () => unit, phrase }
    // "nearest £100", "nearest 0.1", "nearest 5"
    if ((m = w.match(/nearest\s+£?\s?(\d+(?:\.\d+)?)\b/i))) {
      const unit = Number(m[1])
      if (unit > 0) return { unit: () => unit, phrase: `nearest ${m[1]}` }
    }
  }
  return null
}
