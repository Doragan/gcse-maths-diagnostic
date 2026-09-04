import {
  STRONG_TOPIC_RATIO,
  type SkillEvidence,
  type StudentEvidence,
  type TopicEvidence,
} from './feedbackEvidence'
import {
  STRONG_PHRASES, NEAR_MISS_PHRASES, PARTIAL_PHRASES, STRUGGLING_PHRASES,
  BEST_EFFORT_PHRASES, FOCUS_PHRASES, phraseVars,
  type Phrase,
} from './wwwEbiPhrases'

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
// THE WORDS THEMSELVES LIVE IN wwwEbiPhrases.ts. This file decides which BAND a
// topic falls into; that file decides what a band sounds like, and is meant to
// be edited by whoever knows how a department talks to its students.
//
// FOUR RULES THIS FORMATTER OBEYS, each of which cost something to learn:
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
//   • THE TOPIC SENTENCE AND THE SKILL LIST MUST NOT SAY THE SAME THING. An
//     earlier draft emitted "Revise Algebra" and then "Practise Solving Linear
//     Equations", which is one instruction written twice. The topic sentence now
//     explains, and ONE closing line names the specific skills.
//
// AND ONE THING IT DELIBERATELY WILL NOT DO: invent praise the marks do not
// support. A student who scored nothing gets an empty `www` rather than a
// hollow compliment. A sheet that congratulates a blank paper is worse than one
// that says nothing, and the empty list is a legible signal to the teacher that
// this student needs a conversation rather than a printout.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Band edges, as a share of a topic's marks.
 *
 * At or above STRONG_TOPIC_RATIO (imported, so one number means one thing
 * throughout) a topic is praise. Everything below it produces an action,
 * PHRASED PROPORTIONALLY — which is why a topic at three-quarters no longer
 * lands in "what went well" and then goes unmentioned in "even better if". It
 * gets a sentence that praises and instructs at once, the way a teacher writes
 * it.
 *
 * THESE NUMBERS ARE NOT DERIVED FROM ANYTHING, and that is a settled decision
 * rather than an oversight (user ruling, 2026-09-04): with no sittings on
 * record, no band could be justified better, so a plausible one is as good as
 * this gets. Do not churn them on taste alone.
 *
 * What would actually justify them is the same thing the cohort-relative
 * feature waits on — marked papers on record (docs/audit/16, "Cohort-relative
 * feedback"). Once a paper has been sat enough times, a band stops being a
 * guess and becomes a distribution: "below what most students score on this
 * topic" is defensible in a way "below 60%" never is. Revisit then, with data,
 * not before.
 */
export const NEAR_MISS_RATIO = 0.6
export const STRUGGLING_RATIO = 0.35

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
 * A topic needs at least this many marks before the sheet says anything about
 * it in its own sentence.
 *
 * On a full paper every topic clears this easily. On a PART paper they do not:
 * eight questions can leave a topic carrying a single mark, and "Algebra is
 * clearly a strength, with the mark" is a claim one mark cannot support — it
 * appeared on a real sheet. Marks in a skipped topic are not lost from the
 * sheet; they still count in the score and can still appear in the full-marks
 * line, which needs no claim about the topic to be true.
 */
export const MIN_TOPIC_MARKS = 3

/**
 * Caps. A feedback sheet is read in the thirty seconds before a lesson, and a
 * teacher who wanted twelve bullet points would have written them. Worst- and
 * best-first ordering upstream means a cap keeps the most important lines.
 */
export const MAX_WWW = 4
export const MAX_EBI_TOPICS = 3
export const MAX_FOCUS_SKILLS = 3
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

// ── Phrase selection ─────────────────────────────────────────────────────────

/**
 * A stable hash of a short string (FNV-1a).
 *
 * Not for security — for picking the same sentence for the same student every
 * time. Determinism is the requirement: a teacher who regenerates a sheet after
 * correcting one mark must not receive differently worded feedback for everyone
 * else, and a random choice would do exactly that.
 */
function hashRef(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/**
 * Choose a variant, varied across students AND down the lines of one sheet.
 *
 * Adding `position` is what stops two lines on the same sheet using the same
 * template — with a bank larger than the cap, consecutive lines are guaranteed
 * different, which is the same-y-ness that shows up when a teacher reads all
 * thirty at once.
 */
function pickPhrase<T>(bank: T[], ref: string, position: number): T {
  return bank[(hashRef(ref) + position) % bank.length]
}

const varsFor = (t: TopicEvidence) => phraseVars(t.label, t.earned, t.available)

/** Which bank a topic's sentence comes from. */
function bankFor(ratio: number): Phrase[] {
  if (ratio < STRUGGLING_RATIO) return STRUGGLING_PHRASES
  if (ratio < NEAR_MISS_RATIO) return PARTIAL_PHRASES
  return NEAR_MISS_PHRASES
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

/** A skill's share of its own marks — the bar its focus mention is judged against. */
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

/** "A", "A and B", "A, B and C" — an Oxford-comma-free list, UK style. */
function listOf(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

// ── The formatter ────────────────────────────────────────────────────────────

/**
 * Turn one student's evidence into WWW/EBI prose.
 *
 * Deliberately does NOT carry the paper's title or the date: `StudentEvidence`
 * does not know which paper it came from, and the caller that chose the paper
 * is better placed to head the page than this function is.
 */
export function toWwwEbi(evidence: StudentEvidence): WwwEbiSheet {
  const ref = evidence.studentRef

  // Only topics substantial enough to say something about. Falls back to all of
  // them when nothing clears the bar, so a genuinely short part paper still
  // gets a sheet rather than silence.
  const bigEnough = evidence.topics.filter(t => t.available >= MIN_TOPIC_MARKS)
  const speakable = bigEnough.length ? bigEnough : evidence.topics

  const strong = speakable.filter(t => t.ratio >= STRONG_TOPIC_RATIO).sort(byStrength)

  // ── What went well ────────────────────────────────────────────────────────
  const topicPraise = strong.map((t, i) => pickPhrase(STRONG_PHRASES, ref, i)(varsFor(t)))

  // The one place `fullMarks` earns its keep: a sentence that genuinely is
  // "dropped nothing". Rolled into a single line rather than one per skill,
  // which on a good paper would crowd out everything else.
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

  // No topic reached the bar, but marks were scored: acknowledge the best of
  // them rather than handing back a sheet with nothing good on it. Still no
  // invention — it is the real best topic with its real marks.
  if (!www.length && evidence.earned > 0) {
    const best = [...speakable].sort(byStrength)[0]
    if (best) www.push(pickPhrase(BEST_EFFORT_PHRASES, ref, 0)(varsFor(best)))
  }

  // ── Even better if ────────────────────────────────────────────────────────
  // One sentence per topic, worst first, its wording chosen by how badly it
  // went. The band edges are in this file; the sentences are in wwwEbiPhrases.
  const needsWork = speakable
    .filter(t => t.ratio < STRONG_TOPIC_RATIO)
    .sort(byWeakness)
    .slice(0, MAX_EBI_TOPICS)

  const ebi: string[] = needsWork.map((t, i) =>
    pickPhrase(bankFor(t.ratio), ref, i)(varsFor(t)))

  // ONE closing line naming the specific skills, replacing the old one line per
  // skill. Those restated the topic sentence in fewer words; this adds the
  // detail a topic sentence cannot carry. A skill above the strong bar is left
  // out even though it dropped a mark — naming 6 of 7 buries what matters.
  const focusSkills = evidence.droppedSkills
    .filter(s => skillRatio(s) < STRONG_TOPIC_RATIO)
    .slice(0, MAX_FOCUS_SKILLS)
    .map(s => s.label)
  if (focusSkills.length) {
    ebi.push(pickPhrase(FOCUS_PHRASES, ref, ebi.length)(listOf(focusSkills)))
  }

  return {
    studentRef: ref,
    score: `${evidence.earned} out of ${evidence.available} (${evidence.percentage}%)`,
    coverage: evidence.coverage.fullPaper ? null : coverageLine(evidence),
    www,
    ebi,
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

/** The same, for a whole class — thirty sheets being the actual job. */
export function toWwwEbiSheets(all: StudentEvidence[]): WwwEbiSheet[] {
  return all.map(toWwwEbi)
}
