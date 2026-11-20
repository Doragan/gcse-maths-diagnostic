// ─────────────────────────────────────────────────────────────────────────────
// Bloom's taxonomy (the revised version: Anderson & Krathwohl, 2001), as the
// verbs an investigation's learning outcomes may open with.
//
// An outcome is what a student will be able to DO by the end of the page, so
// it has to be something a teacher could watch them do, or mark. That rules
// out the verbs that name a state of mind rather than an action — understand,
// know, learn, appreciate, see — and the conversational ones the first outcomes
// used, which said nothing a teacher could check: look, say, go, turn.
//
// GCSE command words sit at the level of the thinking they ask for: "work out"
// is Apply, "write down" is Remember, "explain" is Understand, "deduce" is
// Analyse.
// ─────────────────────────────────────────────────────────────────────────────

export const BLOOM = {
  remember: ['identify', 'state', 'recall', 'name', 'list', 'define', 'recognise', 'write'],
  understand: ['explain', 'describe', 'interpret', 'classify', 'summarise', 'predict', 'estimate'],
  apply: [
    'calculate', 'use', 'apply', 'solve', 'convert', 'find', 'work', 'rearrange', 'plot', 'draw',
    'substitute',
  ],
  analyse: ['deduce', 'compare', 'distinguish', 'analyse', 'infer', 'examine'],
  evaluate: ['justify', 'evaluate', 'judge', 'check', 'verify', 'assess'],
  create: ['design', 'create', 'devise', 'formulate', 'generalise'],
} as const

export type BloomLevel = keyof typeof BLOOM

/** Every Bloom verb, whatever its level. */
export const BLOOM_VERBS: readonly string[] = Object.values(BLOOM).flat()

/**
 * Verbs that sound like outcomes and are not: a state of mind (understand,
 * know, learn, appreciate, see) or conversation (look, say, go, turn, tell).
 * Named so a check can catch them anywhere in an outcome — "find a percentage…
 * and say what percent means" hid its second, unmeasurable outcome behind a
 * first verb that was fine.
 */
export const NOT_MEASURABLE: readonly string[] = [
  'understand', 'know', 'learn', 'appreciate', 'see', 'look', 'say', 'go', 'turn', 'tell',
]

/** The level of an outcome, from the verb it opens with — or null if it opens with none. */
export function bloomLevel(outcome: string): BloomLevel | null {
  const first = outcome.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  for (const [level, verbs] of Object.entries(BLOOM) as [BloomLevel, readonly string[]][]) {
    if (verbs.includes(first)) return level
  }
  return null
}
