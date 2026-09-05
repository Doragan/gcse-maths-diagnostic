/**
 * The shape a real past paper needs to slot into the marking tool
 * (app/demo/marking/page.tsx).
 *
 * Before this existed, one paper's data (question list, retry set, challenge
 * questions, sample class) was ~150 lines of module-scope constants threaded
 * directly through the page component. Adding a second paper meant editing
 * that page. This type is the seam: the page is now generic over a
 * `PaperConfig`, so a new paper is a new file matching this shape (see
 * aqa-8300-3f-nov24.ts for the reference example), registered in ./index.ts —
 * no change to the page itself.
 *
 * This does NOT add a paper-picker UI or persistence — see
 * [[project_paper_marking_pipeline]] in memory for that (separately scoped,
 * bigger, not started). This only removes the "have to edit the page" cost.
 */

/** One topic column the paper's questions are grouped under. */
export type PaperTopic = {
  /** Short, stable key — used as a Record key and React list key, never shown. */
  id: string
  /**
   * Display label — also the lookup key into the shared demo topic palette
   * (lib/demoTopicColours.ts `topicColourFor`), so a paper's topic MUST use a
   * label that palette recognises (or it silently falls back to slate).
   */
  label: string
}

export type PaperQuestion = {
  id: string
  /** How the question is labelled on the real paper: "3(a)", "11(c)". */
  label: string
  marks: number
  topic: string // a PaperTopic['id']
  /** Display label for the marking UI, eg "Frequency Trees + Probability". */
  skill: string
  /**
   * The REAL skill ids this item assesses, from data/skills.ts — as opposed to
   * `skill` above, which is only ever shown to a human.
   *
   * This is what makes an item trackable: a `practice_attempts` row carries
   * `skill_ids`, and the mastery engine reads nothing else to decide which
   * skills an answer moves. Sourced from data/exam-audit/ (ids map 1:1 onto
   * this file's question ids), with any tagging corrections applied here and
   * noted in the file header.
   */
  skillIds: string[]
  /**
   * How a wrong answer attributes, exactly as lib/questions/kind.ts defines it:
   * `mastery` penalises on failure, `exam` is positive-only (credit on success,
   * never a penalty). Multi-skill items are `exam`, so a dropped mark on a
   * synthesis question routes to revision instead of knocking down every skill
   * it touched.
   */
  kind: 'mastery' | 'exam'
  /** One-line description shown as a tooltip and in the CSV template. */
  desc: string
  /**
   * True for a question the marking tool cannot generate a retry/starter-sheet
   * version of (it depends on a diagram in the original paper — a chart to
   * read, a number pattern to complete). Excluded from `retrySet` lookups.
   */
  visual: boolean
}

/** A same-skill retry question for one paper question, non-visual only. */
export type PaperRetryQuestion = {
  skill: string
  question: string
  /**
   * The answer, for the teacher. Optional here only because the three
   * hand-authored papers predate it; new authoring should always carry one.
   * See PaperChallengeQuestion['answer'] for why it exists at all.
   */
  answer?: string
  /** One line of method, where the answer alone would not show the route. */
  working?: string
}

/** A harder extension question offered when a student is strong in a topic. */
export type PaperChallengeQuestion = {
  topic: string // a PaperTopic['id']
  skill: string
  question: string
  /**
   * The answer — for the TEACHER, and never printed beside the question on a
   * student's sheet. It exists for two reasons:
   *
   *   1. It is the only quality gate available. These questions carry no
   *      parameters, no answer_template and no grader, so `verify-question`
   *      and `audit-bank` cannot see them at all. An answer written alongside
   *      can at least be checked by solving the question independently and
   *      comparing; without one there is nothing to check against.
   *   2. A teacher handing out thirty practice questions should not have to
   *      sit and solve them first. That is the difference between a sheet
   *      used and a sheet filed.
   */
  answer: string
  /**
   * A line or two of method. Not a full worked solution — enough that a
   * teacher can see the route and mark a student's working, which the bare
   * answer does not give them. Omitted where the answer IS the method.
   */
  working?: string
}

export type PaperConfig = {
  /** Slug — the registry key in ./index.ts, e.g. "aqa-8300-3f-nov24". */
  id: string
  title: string
  subtitle: string
  topics: PaperTopic[]
  questions: PaperQuestion[]
  /** Keyed by PaperQuestion['id']; only non-visual questions need an entry. */
  retrySet: Record<string, PaperRetryQuestion>
  challengeQuestions: PaperChallengeQuestion[]
  /** Names for the "Load Demo Data" button. */
  sampleStudents: string[]
  /** sampleMarks[studentName][questionId] = marks scored. */
  sampleMarks: Record<string, Record<string, number>>
}
