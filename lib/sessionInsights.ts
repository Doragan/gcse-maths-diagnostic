/**
 * What the class is finding hard, while the lesson is still running.
 *
 * The teacher's live table answers "how is each pupil doing". It cannot answer
 * the question a teacher actually acts on mid-lesson — "what do I put on the
 * board right now" — because it collapses every attempt into one score per
 * pupil. The attempt rows already carry `question_id`, so the answer was
 * always in the payload; it was just aggregated away.
 *
 * Two views, from one pass over the same rows:
 *
 *   - BY QUESTION, so the teacher can pull up the one six people got wrong.
 *   - BY SKILL, so they know which of the skills they chose for the session
 *     landed and which needs reteaching. Skills are the currency the rest of
 *     the app already speaks, so this carries past the lesson.
 *
 * None of this belongs on the projector view, and none of it needs to: that
 * page has its own route, which fetches counts with `head: true` and never
 * learns a question id.
 */

import { templatePreviewShort } from './questions/templatePreview'

export type AttemptFact = {
  question_id: string
  correct: boolean
  /**
   * Who answered. Used ONLY to count distinct pupils per misconception, and
   * never sent to the browser — the route aggregates server-side precisely so
   * it does not have to ship a per-pupil answer log. One pupil meeting the
   * same trap on four questions is one pupil, not four.
   */
  participant_id?: string
  /**
   * Id from data/misconceptions.ts for the trap this answer matched. Null on
   * a right answer, when no trap matched, and when the matching trap is
   * untagged — see 20261023c_session_attempt_misconception.sql.
   */
  misconception?: string | null
}

export type QuestionMeta = {
  id: string
  question_template: string
  skill_ids: string[]
}

export type QuestionInsight = {
  questionId: string
  /**
   * One line of plain text standing in for the question — markup and diagram
   * removed, parameters blanked, since every pupil saw different numbers.
   * See lib/questions/templatePreview.ts.
   */
  prompt: string
  attempted: number
  wrong: number
  /** 0–100, rounded. */
  pctWrong: number
}

export type SkillInsight = {
  skillId: string
  attempted: number
  correct: number
  /** 0–100, rounded. */
  pctCorrect: number
}

export type MisconceptionInsight = {
  misconceptionId: string
  /** How many wrong answers matched a trap carrying this id. */
  count: number
  /** How many pupils that was, which is the number a teacher acts on. */
  pupils: number
}

export type SessionInsights = {
  questions: QuestionInsight[]
  skills: SkillInsight[]
  misconceptions: MisconceptionInsight[]
  /**
   * Wrong answers with no misconception against them — right answers are not
   * counted here. The panel shows this so a short list of named mistakes is
   * never mistaken for the whole picture: most of the bank's traps are
   * untagged, so "3 dropped the minus sign" out of 20 wrong answers is a
   * sample, not a diagnosis of the class.
   */
  untaggedWrong: number
}

/**
 * How many pupils must have tried a question before it can be called hard.
 *
 * One pupil getting one question wrong is not a class problem, and on a screen
 * read during a lesson it would push a real one off the top. Two is low enough
 * to be useful in the first minutes of a session, when there is hardly any
 * data and the teacher is watching most closely.
 */
export const MIN_ATTEMPTS_TO_RANK = 2

/**
 * Ranked hardest first.
 *
 * Sorted by HOW MANY pupils got it wrong, not by percentage. "6 of 9 wrong"
 * and "1 of 1 wrong" are both 100%, and only one of them is worth stopping the
 * lesson for — the count is the number of people the teacher would be helping.
 * Percentage breaks ties, so of two questions six pupils missed, the one fewer
 * pupils reached ranks higher.
 *
 * Questions nobody got wrong are left out entirely. This is a list of what to
 * reteach, and a correct question on it is a line the teacher has to read past.
 */
export function questionInsights(
  attempts: AttemptFact[],
  meta: Map<string, QuestionMeta>,
): QuestionInsight[] {
  const tally = new Map<string, { attempted: number; wrong: number }>()

  for (const a of attempts) {
    const t = tally.get(a.question_id) ?? { attempted: 0, wrong: 0 }
    t.attempted += 1
    if (!a.correct) t.wrong += 1
    tally.set(a.question_id, t)
  }

  const out: QuestionInsight[] = []
  for (const [questionId, t] of tally) {
    if (t.wrong === 0) continue
    if (t.attempted < MIN_ATTEMPTS_TO_RANK) continue
    out.push({
      questionId,
      // A question that has since been unpublished or deleted still has
      // attempts against it. Showing the id is useless to a teacher, so say
      // plainly that the text is gone rather than printing a uuid.
      prompt: meta.has(questionId)
        ? templatePreviewShort(meta.get(questionId)!.question_template)
        : 'Question no longer available',
      attempted: t.attempted,
      wrong: t.wrong,
      pctWrong: Math.round((t.wrong / t.attempted) * 100),
    })
  }

  return out.sort((a, b) =>
    b.wrong - a.wrong ||
    b.pctWrong - a.pctWrong ||
    a.questionId.localeCompare(b.questionId))
}

/**
 * Accuracy per skill, scoped to the skills the teacher chose for the session.
 *
 * A question can carry several skills, and it is counted under EVERY chosen
 * skill it carries. That is deliberate: the teacher picked those skills and
 * wants to know how each went, and splitting one attempt across two of them
 * would make both numbers wrong. It does mean the per-skill counts can add up
 * to more than the number of attempts, so they are never presented as a
 * breakdown of a total.
 *
 * A question carrying none of the chosen skills falls back to its own skills
 * rather than vanishing — the pool only serves overlapping questions, so this
 * is a safety net for a session whose skill list was edited, not a normal path.
 *
 * Skills with no attempts are omitted: in the first minute of a session most
 * of them have none, and a wall of "0%" reads as failure rather than silence.
 */
export function skillInsights(
  attempts: AttemptFact[],
  meta: Map<string, QuestionMeta>,
  chosenSkillIds: string[],
): SkillInsight[] {
  const chosen = new Set(chosenSkillIds)
  const tally = new Map<string, { attempted: number; correct: number }>()

  for (const a of attempts) {
    const q = meta.get(a.question_id)
    if (!q) continue
    const hits = q.skill_ids.filter(id => chosen.has(id))
    for (const skillId of hits.length > 0 ? hits : q.skill_ids) {
      const t = tally.get(skillId) ?? { attempted: 0, correct: 0 }
      t.attempted += 1
      if (a.correct) t.correct += 1
      tally.set(skillId, t)
    }
  }

  return [...tally.entries()]
    .map(([skillId, t]) => ({
      skillId,
      attempted: t.attempted,
      correct: t.correct,
      pctCorrect: Math.round((t.correct / t.attempted) * 100),
    }))
    // Weakest first: the point of the list is what needs reteaching. Ties go
    // to the skill with more attempts behind it, which is the firmer evidence.
    .sort((a, b) =>
      a.pctCorrect - b.pctCorrect ||
      b.attempted - a.attempted ||
      a.skillId.localeCompare(b.skillId))
}

/**
 * Named mistakes, commonest first.
 *
 * Ranked by PUPILS rather than by occurrences: one pupil who drops the minus
 * sign four times in a row is one pupil to go and talk to, and ranking by
 * occurrences would put them above a misconception four different pupils
 * each made once. Occurrences break the tie, since a mistake repeated is a
 * firmer signal than one made in passing.
 *
 * Only wrong answers carry a misconception, so no filtering on `correct` is
 * needed here — but a tagged trap on a right answer would be a bug upstream,
 * and counting it would tell a teacher a pupil holds a misconception they
 * just disproved. So it is excluded explicitly rather than assumed away.
 */
export function misconceptionInsights(attempts: AttemptFact[]): {
  misconceptions: MisconceptionInsight[]
  untaggedWrong: number
} {
  const tally = new Map<string, { count: number; pupils: Set<string> }>()
  let untaggedWrong = 0

  for (const a of attempts) {
    if (a.correct) continue
    if (!a.misconception) { untaggedWrong += 1; continue }
    const t = tally.get(a.misconception) ?? { count: 0, pupils: new Set<string>() }
    t.count += 1
    // An attempt with no participant_id still counts as an occurrence; it
    // just cannot be attributed, so it must not silently become "0 pupils".
    t.pupils.add(a.participant_id ?? `anon:${t.count}`)
    tally.set(a.misconception, t)
  }

  const misconceptions = [...tally.entries()]
    .map(([misconceptionId, t]) => ({
      misconceptionId,
      count: t.count,
      pupils: t.pupils.size,
    }))
    .sort((a, b) =>
      b.pupils - a.pupils ||
      b.count - a.count ||
      a.misconceptionId.localeCompare(b.misconceptionId))

  return { misconceptions, untaggedWrong }
}

export function sessionInsights(
  attempts: AttemptFact[],
  questions: QuestionMeta[],
  chosenSkillIds: string[],
): SessionInsights {
  const meta = new Map(questions.map(q => [q.id, q]))
  return {
    questions: questionInsights(attempts, meta),
    skills:    skillInsights(attempts, meta, chosenSkillIds),
    ...misconceptionInsights(attempts),
  }
}
