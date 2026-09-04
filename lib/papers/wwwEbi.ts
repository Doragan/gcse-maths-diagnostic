import {
  STRONG_TOPIC_RATIO,
  type SkillEvidence,
  type StudentEvidence,
  type TopicEvidence,
} from './feedbackEvidence'

// ─────────────────────────────────────────────────────────────────────────────
// WWW / EBI — the first formatter over StudentEvidence.
//
// "What went well" and "even better if" is the wording most departments already
// use, so it is the format to ship first. It is NOT the format: a target-setting
// sheet, a RAG grid or a parents' evening summary are others, and the seam that
// lets them exist is the EVIDENCE TYPE, not this file. Nothing here recomputes
// anything — it reads StudentEvidence and writes sentences. A second formatter
// should be a sibling of this file, not a branch inside it.
//
// THREE RULES THIS FORMATTER OBEYS, each of which cost something to learn:
//
//   • SPLIT ON THE MARKS, NOT ON `fullMarks`. A student on 6 of 7 for equations
//     belongs in what-went-well, and the flag excludes them. `fullMarks` is used
//     for exactly one sentence here — the one that really is "dropped nothing".
//
//   • NEVER CLAIM A SKILL IS SECURE OR MASTERED. Those are judgements about a
//     student over time and one sitting cannot support them. Every sentence here
//     is explicitly about this paper. See the header of feedbackEvidence.ts.
//
//   • SAY WHAT WAS NOT ASSESSED. On a part paper, silence about the questions
//     that were not set reads as "no problem there" — which is the one thing a
//     feedback sheet must never accidentally say.
//
// AND ONE THING IT DELIBERATELY WILL NOT DO: invent praise the marks do not
// support. A student who scored nothing gets an empty `www` rather than a
// hollow compliment. A sheet that congratulates a blank paper is worse than one
// that says nothing, and the empty list is a legible signal to the teacher that
// this student needs a conversation rather than a printout.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * At or below this share of a topic's marks, the topic is something to revise
 * rather than something that went well.
 *
 * The upper band reuses STRONG_TOPIC_RATIO so one threshold means one thing
 * throughout: a topic strong enough to earn a challenge question is exactly a
 * topic strong enough to be called strong here.
 */
export const REVISE_TOPIC_RATIO = 0.6

/**
 * Extension questions go only to students at or above this share of the WHOLE
 * paper, however well an individual topic went.
 *
 * Set to match the strong-topic bar so one number means one thing: "doing
 * well". On the Foundation papers in lib/demoPapers that is a comfortable
 * grade 5 and the top of the class, which is who "push yourself" is for.
 */
export const CHALLENGE_OVERALL_RATIO = 0.8

/**
 * Caps. A feedback sheet is read in the thirty seconds before a lesson, and a
 * teacher who wanted twelve bullet points would have written them. Worst- and
 * best-first ordering upstream means a cap keeps the most important lines.
 */
export const MAX_WWW = 4
export const MAX_EBI = 4
export const MAX_PRACTICE = 3
export const MAX_CHALLENGE = 2
/** How many skills the "full marks on every question testing…" line may name. */
export const MAX_FULL_MARK_SKILLS = 3

export type WwwEbiSheet = {
  /** Passed through from the evidence — a student id or a typed name. */
  studentRef: string
  /** "34 out of 42 (81%)". */
  score: string
  /**
   * Present ONLY when part of a paper was set; null for a full paper, so a
   * renderer can omit the line rather than print a reassuring "full paper".
   */
  coverage: string | null
  /** What went well. May be empty — see the header. */
  www: string[]
  /** Even better if. Empty when nothing was dropped, which is correct. */
  ebi: string[]
  /** Questions to practise, worst first. */
  practice: { skill: string; question: string }[]
  /** Harder questions where a topic is already strong. */
  challenge: { skill: string; question: string }[]
}

/** "Number (5/6)" — the shape every topic sentence ends with. */
function topicWithMarks(t: TopicEvidence): string {
  return `${t.label} (${t.earned}/${t.available})`
}

/** Best ratio first, then the topic carrying more marks, then id for stability. */
function byStrength(a: TopicEvidence, b: TopicEvidence): number {
  return b.ratio - a.ratio || b.available - a.available || a.topicId.localeCompare(b.topicId)
}

/**
 * Worst ratio first. Written out rather than negating byStrength, which would
 * also flip the tie-breakers and put the SMALLER topic first among equals —
 * the opposite of what "most important thing to revise" means.
 */
function byWeakness(a: TopicEvidence, b: TopicEvidence): number {
  return a.ratio - b.ratio || b.available - a.available || a.topicId.localeCompare(b.topicId)
}

/** A skill's share of its own marks — the bar its EBI line is judged against. */
function skillRatio(s: SkillEvidence): number {
  return s.available > 0 ? s.earned / s.available : 0
}

/**
 * Whether this student should be offered extension work at all.
 *
 * A STRONG TOPIC IS NOT ENOUGH. Judged on topics alone, a student at 57% who
 * happened to take a small statistics section cleanly was handed challenge
 * questions — which is the wrong instruction for them twice over: their time
 * belongs on the practice list, and a harder question on top of a paper they
 * struggled with reads as the sheet not having looked at their marks.
 *
 * So the gate is the OVERALL paper, and the topic bar applies on top of it:
 * push-yourself work goes to students already doing well, on the parts they
 * are doing best.
 */
function highAchieving(evidence: StudentEvidence): boolean {
  return evidence.available > 0 && evidence.earned / evidence.available >= CHALLENGE_OVERALL_RATIO
}

/**
 * Turn one student's evidence into WWW/EBI prose.
 *
 * Deliberately does NOT carry the paper's title or the date: `StudentEvidence`
 * does not know which paper it came from, and the caller that chose the paper
 * is better placed to head the page than this function is.
 */
export function toWwwEbi(evidence: StudentEvidence): WwwEbiSheet {
  const strong = evidence.topics.filter(t => t.ratio >= STRONG_TOPIC_RATIO).sort(byStrength)
  const middling = evidence.topics
    .filter(t => t.ratio >= REVISE_TOPIC_RATIO && t.ratio < STRONG_TOPIC_RATIO)
    .sort(byStrength)
  const weak = evidence.topics.filter(t => t.ratio < REVISE_TOPIC_RATIO).sort(byWeakness)

  // ── What went well ────────────────────────────────────────────────────────
  // Topics read first (a teacher leads with the broad statement), the specific
  // full-marks line last.
  const topicPraise = [
    ...strong.map(t => `Strong work on ${topicWithMarks(t)}.`),
    ...middling.map(t => `Good attempt at ${topicWithMarks(t)}.`),
  ]

  // The one place `fullMarks` earns its keep: a sentence that genuinely is
  // "dropped nothing". Rolled into a single line rather than one per skill,
  // which on a good paper would crowd out everything else.
  //
  // Capped: on a strong paper this could otherwise list a dozen skills and
  // become the only thing anyone reads. The skills carrying the most marks are
  // the ones worth naming.
  const fullMarksLine = evidence.fullMarkSkills.length
    ? `Full marks on every question testing ${listOf(
        [...evidence.fullMarkSkills]
          .sort((a, b) => b.available - a.available || a.skillId.localeCompare(b.skillId))
          .slice(0, MAX_FULL_MARK_SKILLS)
          .map(s => s.label),
      )}.`
    : null

  // The full-marks line gets a RESERVED SLOT rather than being appended and
  // truncated. Capping by insertion order dropped it exactly when it was most
  // deserved: on a perfect paper every topic is strong, so the topic lines
  // filled the cap and the best sentence on the sheet fell off the end.
  const www: string[] = fullMarksLine
    ? [...topicPraise.slice(0, MAX_WWW - 1), fullMarksLine]
    : topicPraise.slice(0, MAX_WWW)

  // Nothing cleared either bar, but marks were scored: name the best of them
  // rather than staying silent. Still no invention — it is the real best topic
  // with its real marks.
  if (!www.length && evidence.earned > 0) {
    const best = [...evidence.topics].sort(byStrength)[0]
    if (best) www.push(`Best work was on ${topicWithMarks(best)}.`)
  }

  // ── Even better if ────────────────────────────────────────────────────────
  // Marks are written "(earned/available)" on EVERY line, praise and criticism
  // alike. The first draft mixed "(6/8)" with "— 6/13 marks", copying the demo
  // fixture's wording, and on a real sheet the inconsistency reads as two
  // different things being measured.
  const ebi: string[] = [
    ...weak.map(t => `Revise ${topicWithMarks(t)}.`),
    // Skill-level actions, worst first. A skill at or above the strong bar is
    // excluded even though it dropped a mark: nagging about 6 of 7 buries the
    // lines that matter.
    ...evidence.droppedSkills
      .filter(s => skillRatio(s) < STRONG_TOPIC_RATIO)
      .map(s => `Practise ${s.label} (${s.earned}/${s.available}).`),
  ]

  return {
    studentRef: evidence.studentRef,
    score: `${evidence.earned} out of ${evidence.available} (${evidence.percentage}%)`,
    coverage: evidence.coverage.fullPaper ? null : coverageLine(evidence),
    www,
    ebi: ebi.slice(0, MAX_EBI),
    practice: evidence.practice
      .slice(0, MAX_PRACTICE)
      .map(p => ({ skill: p.skill, question: p.question })),
    // Extension work is for students who are actually ahead — see the constant.
    challenge: highAchieving(evidence)
      ? evidence.challenges.slice(0, MAX_CHALLENGE).map(c => ({ skill: c.skill, question: c.question }))
      : [],
  }
}

/**
 * The sentence that stops a part paper reading as a full one.
 *
 * Says what was covered AND that the rest was not assessed, because a reader
 * given only the first half supplies the second half wrongly.
 */
function coverageLine(evidence: StudentEvidence): string {
  const c = evidence.coverage
  return (
    `Based on ${c.itemsAssessed} of ${c.itemsOnPaper} questions ` +
    `(${c.marksAssessed} of ${c.marksOnPaper} marks). ` +
    `Anything not on those questions was not assessed.`
  )
}

/** "A", "A and B", "A, B and C" — an Oxford-comma-free list, UK style. */
function listOf(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** The same, for a whole class — thirty sheets being the actual job. */
export function toWwwEbiSheets(all: StudentEvidence[]): WwwEbiSheet[] {
  return all.map(toWwwEbi)
}
