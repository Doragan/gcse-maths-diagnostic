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
  skill: string
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
}

/** A harder extension question offered when a student is strong in a topic. */
export type PaperChallengeQuestion = {
  topic: string // a PaperTopic['id']
  skill: string
  question: string
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
