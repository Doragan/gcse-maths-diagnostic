// ─────────────────────────────────────────────────────────────────────────────
// Keeping a section's check off the numbers the section just worked.
//
// A check is a bank question drawn on fresh random values, under a section
// whose own question was worked through on screen moments before. Now and then
// the draw lands on the SAME numbers — "3 : 5, Ben gets £25" at the top of the
// section and again in the check — and the check stops being a check: the
// answer is in the working above it (reported 2026-11-27).
//
// So a draw is refused when every number in it already appears in the
// section's question. Every, not any: a check that shares one number with the
// section is still a fresh question, and refusing those would refuse most of a
// small parameter space.
// ─────────────────────────────────────────────────────────────────────────────

/** The numbers written in some text or HTML, in order: "£4.20 for 1,500 g" → [4.2, 1500]. */
export function numbersIn(text: string): number[] {
  const plain = text
    .replace(/<[^>]*>/g, ' ')
    // A thousands comma joins one number, not two.
    .replace(/(\d),(?=\d{3}(?!\d))/g, '$1')
  return (plain.match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
}

/**
 * True when every number in `question` is one `shown` has already shown — so
 * the question is, in effect, the one just worked. A question with no numbers
 * repeats nothing.
 */
export function repeatsNumbers(question: string, shown: string): boolean {
  const asked = numbersIn(question)
  if (asked.length === 0) return false
  const seen = new Set(numbersIn(shown))
  return asked.every(n => seen.has(n))
}

/**
 * How many times to redraw before settling for a repeat. Generous: the worst
 * space a check has is a handful of scenarios, and a repeat that survives this
 * many draws is one the question cannot avoid.
 */
export const REDRAWS = 40
