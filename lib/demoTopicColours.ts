/**
 * The topic palette used across the demo surfaces (marking tool, teacher
 * dashboard, student dashboard).
 *
 * WHY IT IS ITS OWN MODULE, and why these particular hues:
 *
 * Every demo screen shows two colour systems at once — which TOPIC something
 * belongs to, and how WELL the student did. The second is the red/amber/green
 * scale in lib/styles (danger/warning/success). The topic palette used to
 * borrow from that same range: Statistics and Probability were literally
 * `colors.success`, and Shape and Space was orange, a shade off `colors.warning`.
 * So a Statistics column sat in "good" green while the marks beneath it were
 * coloured red for "poor", and the reader has to work out which green means
 * what. A category colour must never be a scale colour.
 *
 * These five are therefore chosen to avoid the red, amber and green bands
 * entirely, and to stay distinguishable from each other: violet 262°, blue
 * 221°, cyan 192°, pink 333°, plus a neutral slate. Adding a sixth topic means
 * finding another hue outside those bands — not reaching for green.
 *
 * The three pages keep their own topic LABELS ("Statistics" vs "Probability and
 * Data") but share the colours, so a topic looks the same at every stop of the
 * tour.
 */

export type DemoTopicColour = {
  /** Text, bars and dots. */
  fg: string
  /** Tinted background for column headers and chips. */
  bg: string
  /** Border to go with `bg`. */
  border: string
}

/**
 * Keyed by topic id. `stats` is the marking tool's name for the same topic the
 * dashboards call `probdata` — same colour, so the tour stays consistent.
 */
export const TOPIC_COLOURS = {
  number:   { fg: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' }, // violet
  algebra:  { fg: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' }, // blue
  ratio:    { fg: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' }, // cyan
  shape:    { fg: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' }, // pink
  probdata: { fg: '#334155', bg: '#e2e8f0', border: '#94a3b8' }, // slate
  stats:    { fg: '#334155', bg: '#e2e8f0', border: '#94a3b8' }, // alias of probdata
} as const satisfies Record<string, DemoTopicColour>

export type DemoTopicId = keyof typeof TOPIC_COLOURS

/**
 * Same palette, looked up by the topic NAME as data/skills.ts writes it.
 *
 * The question showcase gets its topic from the skill graph (a display string)
 * rather than from one of the demo pages' own id lists, and it should still
 * colour a topic the same way the dashboards do. Unknown topics fall back to
 * slate rather than throwing.
 */
const BY_LABEL: Record<string, DemoTopicColour> = {
  'Number': TOPIC_COLOURS.number,
  'Algebra': TOPIC_COLOURS.algebra,
  'Ratio and Proportion': TOPIC_COLOURS.ratio,
  'Ratio & Proportion': TOPIC_COLOURS.ratio,
  'Shape and Space': TOPIC_COLOURS.shape,
  'Geometry and Measures': TOPIC_COLOURS.shape,
  'Probability and Data': TOPIC_COLOURS.probdata,
  'Statistics': TOPIC_COLOURS.probdata,
  'Probability': TOPIC_COLOURS.probdata,
}

export function topicColourFor(label: string): DemoTopicColour {
  return BY_LABEL[label] ?? TOPIC_COLOURS.probdata
}
