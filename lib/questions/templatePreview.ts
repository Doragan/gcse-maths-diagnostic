/**
 * One line of plain text standing in for a question, for a teacher reading a
 * list of them.
 *
 * A `question_template` is not prose. Measured over the 276 published
 * questions: 267 contain HTML, 262 carry `{{ }}` parameters, 134 embed an
 * inline `<svg>` diagram, and the longest is 16,695 characters. Putting one
 * on a screen unprocessed shows markup; putting it through the obvious
 * one-line regex is worse, and two surfaces were already doing exactly that.
 *
 * ── Why single braces are left alone ───────────────────────────────────────
 *
 * The existing previews used `/\{[^}]+\}/g`. No template uses single-brace
 * parameters — the engine's syntax is `{{ }}` (lib/questions/paramEngine.ts) —
 * so on `{{a}}` that pattern matches `{{a}` and leaves a stray `}` behind. It
 * is also unsafe in a maths question, where `{1, 2, 3}` is a set and not a
 * parameter at all.
 *
 * ── Why the SVG goes before the tags do ────────────────────────────────────
 *
 * There are 740 `<text>` elements across the bank. Strip tags first and a
 * diagram's axis numbers and vertex letters fall into the sentence, so the
 * preview reads as nonsense exactly for the questions a teacher most wants to
 * recognise. The diagram is removed whole and named instead.
 */

/** Entities that actually occur in the bank, measured rather than guessed. */
const ENTITIES: [RegExp, string][] = [
  [/&nbsp;/g, ' '],
  [/&#8594;/g, '→'],
  [/&#215;/g, '×'],
  [/&minus;/g, '−'],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&amp;/g, '&'],
]

/** What a stripped-out diagram is called, so its absence is visible. */
export const DIAGRAM_PLACEHOLDER = '[diagram]'

/** What a parameter is called. Every pupil saw a different value for it. */
export const PARAM_PLACEHOLDER = '[…]'

export function templatePreview(template: string | null | undefined): string {
  if (!template) return ''

  let s = template

  // Whole diagrams first, before any tag stripping can spill their labels.
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, ` ${DIAGRAM_PLACEHOLDER} `)
  s = s.replace(/<math[\s\S]*?<\/math>/gi, ' ')

  // Parameters. Non-greedy so two on one line stay two.
  s = s.replace(/\{\{[\s\S]*?\}\}/g, PARAM_PLACEHOLDER)

  // Remaining tags become a space, not nothing: `<p>a</p><p>b</p>` is two
  // sentences and must not come out as "ab".
  s = s.replace(/<[^>]*>/g, ' ')

  for (const [re, char] of ENTITIES) s = s.replace(re, char)

  s = s.replace(/\s+/g, ' ')

  // Turning every tag into a space leaves a gap before punctuation that
  // closed a tag — "<strong>7</strong>." reads as "7 ." Only the marks that
  // can never legitimately follow a space are closed up; a space before an
  // opening bracket or a currency symbol is real.
  s = s.replace(/\s+([.,;:!?%)\]])/g, '$1')
  // And the mirror of it: a tag that opened immediately after a bracket
  // leaves "( 3)". Only brackets, because a space after a full stop is a
  // sentence break and must survive.
  s = s.replace(/([([])\s+/g, '$1')

  return s.trim()
}

/**
 * The same, cut to a length that fits a row.
 *
 * Truncation lives here rather than in CSS because these go into lists that
 * are read, copied and occasionally logged; a line clamp would leave the full
 * 16,695 characters in the DOM for a screen reader to work through.
 */
export function templatePreviewShort(
  template: string | null | undefined,
  max = 120,
): string {
  const full = templatePreview(template)
  if (full.length <= max) return full
  // Cut on a word boundary where there is one close enough, so the tail is
  // not a half-word.
  const cut = full.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max - 20 ? cut.slice(0, space) : cut).trimEnd()}…`
}
