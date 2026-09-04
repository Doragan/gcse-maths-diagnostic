// ─────────────────────────────────────────────────────────────────────────────
// The words on a feedback sheet.
//
// Separate from wwwEbi.ts on purpose: this file is COPY, edited by whoever
// knows how a maths department talks to its students, and it should be
// changeable without reading a line of logic. wwwEbi.ts decides WHICH band a
// topic falls into; this decides what that sounds like.
//
// WHY A BANK RATHER THAN ONE SENTENCE PER BAND: a teacher reads thirty of these
// in a sitting, and a student compares theirs with the person next to them. One
// template repeated thirty times reads as generated, and a sheet that reads as
// generated is worth less than one a teacher wrote badly by hand.
//
// SELECTION IS DETERMINISTIC, NOT RANDOM (see pickPhrase in wwwEbi.ts). The same
// marks must always produce the same sheet — a teacher who regenerates after
// fixing a typo cannot be handed different feedback — so the variant is chosen
// from a hash of the student's own reference plus the line's position. That
// varies wording ACROSS students and ACROSS the lines of one sheet, while
// staying stable for any given student.
//
// HOUSE STYLE, worth keeping to when adding more:
//   • Address the student directly ("you"), not the teacher about the student.
//   • Say what the marks were, via `v.marks` — never build the figure by hand,
//     or full marks reads as "8 of the 8" and a blank reads as "0 of the 6".
//   • Never "secure" or "mastered" — one paper cannot support that claim, and
//     a test enforces it.
//   • No exclamation marks, no slang, and nothing that would embarrass a
//     15-year-old reading it next to a friend.
//   • UK spelling: practise (verb), revise, behaviour.
// ─────────────────────────────────────────────────────────────────────────────

/** Everything a sentence may refer to. Bands differ; the inputs do not. */
export type PhraseVars = {
  /** The topic's display label, e.g. "Ratio & Proportion". */
  topic: string
  earned: number
  available: number
  /**
   * The marks as a phrase: "all 8 marks", "none of the 6 marks",
   * "6 of the 13 marks". ALWAYS use this rather than earned/available inline —
   * see the house style note above.
   */
  marks: string
  /** "a mark", "a couple of marks", "7 marks" — see marksLostPhrase. */
  loss: string
  /** The same, capitalised, for the start of a sentence. */
  lossCap: string
  /** "around half", "just under half" — see sharePhrase. */
  share: string
  /** The same, capitalised. */
  shareCap: string
}

export type Phrase = (v: PhraseVars) => string

/**
 * WWW — the topic went well (at or above the strong bar).
 */
export const STRONG_PHRASES: Phrase[] = [
  v => `Strong work on ${v.topic} — you picked up ${v.marks}.`,
  v => `${v.topic} went well, with ${v.marks} to your name.`,
  v => `You handled ${v.topic} confidently, taking ${v.marks}.`,
  v => `${v.topic} is clearly a strength, with ${v.marks}.`,
  v => `Good control of ${v.topic} — ${v.marks}.`,
]

/**
 * EBI — a good attempt that dropped a little.
 *
 * These carry their own praise. A student at three-quarters has done something
 * well and must not be told only what went wrong, which is why this band reads
 * as encouragement with an action rather than as criticism.
 */
export const NEAR_MISS_PHRASES: Phrase[] = [
  v => `You made a good attempt at ${v.topic}, but missed ${v.loss}. Go back over those questions so you pick up full marks next time.`,
  v => `${v.topic} was close, at ${v.marks}, with ${v.loss} slipping away. Another look should be enough to close that gap.`,
  v => `Most of ${v.topic} is there. ${v.lossCap} got away from you, so it is worth reworking those questions carefully.`,
  v => `You clearly know a fair amount about ${v.topic}, taking ${v.marks}. Tightening up the last ${v.loss} is the job here.`,
  v => `Nearly there on ${v.topic}. Losing ${v.loss} usually means a small slip rather than a gap, so check your working on those questions.`,
]

/**
 * EBI — about half the marks. Real revision, but from a foundation that exists.
 */
export const PARTIAL_PHRASES: Phrase[] = [
  v => `It looks like you found ${v.topic} difficult, picking up ${v.share} of the ${v.available} marks. This would be a good place to revise properly.`,
  v => `${v.topic} is worth some real revision — you took ${v.marks}, so there is a fair amount to firm up.`,
  v => `${v.shareCap} of the ${v.topic} marks got away. Going back over the topic itself, rather than just these questions, would pay off.`,
  v => `You have made a start on ${v.topic} with ${v.marks}, but enough is missing to be worth proper revision.`,
  v => `${v.topic} came out at ${v.marks}. You know some of it, and the aim now is to make the rest as reliable.`,
]

/**
 * EBI — very little came through. The tone here matters most: this is read by a
 * student who already knows it went badly, and telling them so adds nothing.
 * Every one of these points at a next action.
 */
export const STRUGGLING_PHRASES: Phrase[] = [
  v => `${v.topic} has not clicked yet — ${v.marks} came through. Ask for help with this one rather than revising it alone.`,
  v => `${v.topic} is the one to prioritise, at ${v.marks}. It is worth starting this topic again from the beginning rather than reviewing it.`,
  v => `Not much of ${v.topic} came through this time. That usually means the ideas underneath need going over, not just more practice questions.`,
  v => `${v.topic} needs proper time — ${v.marks} suggests the basics of the topic are not in place yet.`,
  v => `This paper did not show much ${v.topic} yet, with ${v.marks}. Worth telling your teacher you would like to go over it.`,
]

/**
 * WWW — nothing reached the strong bar, but marks were scored.
 *
 * The sheet still acknowledges the best of them. Not invention: it is the real
 * best topic with its real marks, and the wording is careful not to overstate a
 * result that was only relatively good.
 */
export const BEST_EFFORT_PHRASES: Phrase[] = [
  v => `Your best work was on ${v.topic}, where you took ${v.marks}.`,
  v => `${v.topic} came out strongest for you, at ${v.marks}.`,
  v => `Of everything on this paper, ${v.topic} went best, with ${v.marks}.`,
  v => `You picked up most in ${v.topic} — ${v.marks}.`,
]

/**
 * The single line naming specific skills, which replaces one "Practise X" line
 * per skill. Those repeated the topic sentence in shorter words; this adds the
 * detail the topic sentence cannot carry.
 */
export const FOCUS_PHRASES: ((skills: string) => string)[] = [
  skills => `When you revise, focus especially on ${skills}.`,
  skills => `The specific things to work on are ${skills}.`,
  skills => `If you only have time for a little, start with ${skills}.`,
  skills => `The marks went astray mainly on ${skills}.`,
]

/**
 * The marks as a phrase.
 *
 * The two ends need their own wording. "8 of the 8 marks" is how a spreadsheet
 * describes full marks and "0 of the 6 marks" is a needlessly bleak way to say
 * a topic produced nothing — both appeared on real sheets before this existed.
 */
export function marksPhrase(earned: number, available: number): string {
  if (available <= 0) return 'no marks available'
  // A one-mark topic has no plural form that reads as English: "all 1 marks"
  // appeared on a real part-paper sheet.
  if (available === 1) return earned >= 1 ? 'the mark' : 'no marks'
  if (earned >= available) return `all ${available} marks`
  if (earned <= 0) return `none of the ${available} marks`
  return `${earned} of the ${available} marks`
}

/**
 * How many marks were lost, in words.
 *
 * Numerals for anything a reader would have to count, words for the small
 * numbers — "you missed a couple of marks" is how a teacher says it, "you
 * missed 2 marks" is how a spreadsheet does.
 */
export function marksLostPhrase(lost: number): string {
  if (lost <= 0) return 'no marks'
  if (lost === 1) return 'a mark'
  if (lost === 2) return 'a couple of marks'
  if (lost === 3) return 'a few marks'
  return `${lost} marks`
}

/**
 * A fair description of the share earned, so no sentence claims "around half"
 * of something that was 36%.
 */
export function sharePhrase(ratio: number): string {
  if (ratio >= 0.55) return 'just over half'
  if (ratio >= 0.45) return 'around half'
  if (ratio >= 0.3) return 'just under half'
  if (ratio > 0) return 'only a small share'
  return 'none'
}

/** Sentence-start capitalisation for a phrase built by the helpers above. */
export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Build the full variable set for one topic. */
export function phraseVars(
  topic: string, earned: number, available: number,
): PhraseVars {
  const ratio = available > 0 ? earned / available : 0
  const loss = marksLostPhrase(available - earned)
  const share = sharePhrase(ratio)
  return {
    topic,
    earned,
    available,
    marks: marksPhrase(earned, available),
    loss,
    lossCap: capitalise(loss),
    share,
    shareCap: capitalise(share),
  }
}
