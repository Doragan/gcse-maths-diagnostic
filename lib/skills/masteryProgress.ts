/**
 * What a set of answers actually MOVED on the skill map.
 *
 * The mini-exam review used to compute mastery from the paper alone, "as if
 * from no prior practice". That could only ever restate the paper's own
 * correctness — with roughly one question per skill it read "1/1 correct, in
 * progress" for everything, which is not mastery and not progress. A student
 * who had just confirmed a skill they had been building for weeks saw the same
 * row as one meeting it for the first time.
 *
 * So progress is a DIFFERENCE: the student's real map before these answers
 * against the same map after them. That makes "you moved two skills up" a true
 * statement rather than a restatement of the score.
 *
 * Prerequisite credit is applied on both sides, because that is how the
 * student's dashboard computes their map — a card that disagreed with the
 * dashboard would be worse than no card.
 *
 * Pure: attempts in, summary out. No React, no Supabase.
 */

import {
  calculateMastery, applyPrerequisiteCredit,
  type MasteryStatus, type SkillMastery,
} from './masteryEngine'

export type Attempt = {
  skill_ids: string[]
  correct: boolean
  attempted_at: string
  kind?: 'mastery' | 'exam'
}

/** Worst to best. A "move up" is an increase along this ordering. */
const RANK: Record<MasteryStatus, number> = {
  needs_practice: 0,
  in_progress: 1,
  mastered: 2,
}

export type SkillMove = {
  skillId: string
  /** null when the student had never attempted this skill before. */
  from: MasteryStatus | null
  to: MasteryStatus
  /** Direction of travel: 'up', 'down', or 'same'. New skills count as 'up'. */
  direction: 'up' | 'down' | 'same'
  /** This paper alone — how many of its units on this skill were right. */
  paperCorrect: number
  paperTotal: number
  /** The real window behind `to`, across everything the student has done. */
  recentCorrect: number
  recentAttempts: number
}

export type MasteryProgress = {
  /** Every skill these answers directly tested, best movement first. */
  moves: SkillMove[]
  movedUp: SkillMove[]
  movedDown: SkillMove[]
  /** Reached `mastered` for the first time. */
  newlyMastered: SkillMove[]
  /** Skills the student had never attempted before this paper. */
  firstTime: SkillMove[]
  /** Skills mastered in total, before and after — the headline standing. */
  masteredBefore: number
  masteredAfter: number
  /** Prerequisites credited by a correct answer without being tested directly. */
  reinforced: number
  /**
   * False when there is no history to compare against — a student's very first
   * paper, or a teacher preview. The card must then say "where you're starting
   * from" rather than claim movement.
   */
  hasPrior: boolean
}

/**
 * Compare the skill map before and after a set of answers.
 *
 * `prior` is everything the student had done BEFORE these answers. For a live
 * paper that is a snapshot taken when the paper started, which is what keeps
 * this free of any race with writing the new attempts; for a stored paper it is
 * everything older than the session.
 */
export function computeMasteryProgress(
  prior: Attempt[],
  fromPaper: Attempt[],
  getPrerequisiteTree: (skillId: string) => string[],
): MasteryProgress {
  const mapOf = (attempts: Attempt[]) =>
    calculateMastery(applyPrerequisiteCredit(attempts, getPrerequisiteTree))

  const before = mapOf(prior)
  const after = mapOf([...prior, ...fromPaper])

  // Per-skill tallies for THIS paper, so a row can show both what just happened
  // and the standing it produced.
  const paperTally = new Map<string, { correct: number; total: number }>()
  for (const a of fromPaper) {
    for (const s of a.skill_ids ?? []) {
      const t = paperTally.get(s) ?? { correct: 0, total: 0 }
      t.total++
      if (a.correct) t.correct++
      paperTally.set(s, t)
    }
  }

  const moves: SkillMove[] = []
  for (const [skillId, tally] of paperTally) {
    const to = after[skillId]
    if (!to) continue // impossible in practice; skip rather than invent a status
    const fromStatus = before[skillId]?.status ?? null
    moves.push({
      skillId,
      from: fromStatus,
      to: to.status,
      direction: fromStatus === null
        // Never attempted before: any standing at all is forward movement.
        ? 'up'
        : RANK[to.status] > RANK[fromStatus] ? 'up'
        : RANK[to.status] < RANK[fromStatus] ? 'down'
        : 'same',
      paperCorrect: tally.correct,
      paperTotal: tally.total,
      recentCorrect: to.recentCorrect,
      recentAttempts: to.recentAttempts,
    })
  }

  // Movement first, then the skills with most evidence behind them — a student
  // scanning this should meet what changed before what stayed put.
  const order = { up: 0, same: 1, down: 2 } as const
  moves.sort((a, b) =>
    order[a.direction] - order[b.direction] ||
    b.recentAttempts - a.recentAttempts ||
    a.skillId.localeCompare(b.skillId))

  const countMastered = (m: Record<string, SkillMastery>) =>
    Object.values(m).filter(s => s.status === 'mastered').length

  return {
    moves,
    movedUp: moves.filter(m => m.direction === 'up'),
    movedDown: moves.filter(m => m.direction === 'down'),
    newlyMastered: moves.filter(m => m.to === 'mastered' && m.from !== 'mastered'),
    firstTime: moves.filter(m => m.from === null),
    masteredBefore: countMastered(before),
    masteredAfter: countMastered(after),
    // Skills that appear only because a correct answer credited them as a
    // prerequisite — real reinforcement, but not directly tested here.
    reinforced: Object.keys(after).filter(id => !paperTally.has(id) && !before[id]).length,
    hasPrior: prior.length > 0,
  }
}
