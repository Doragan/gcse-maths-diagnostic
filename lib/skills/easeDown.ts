// ─────────────────────────────────────────────────────────────────────────────
// "Try one of these instead" — the step DOWN after a losing streak.
//
// The mirror of stepUp.ts. stepUp fires when a skill is mastered and offers
// something harder; this fires when a session is going wrong and offers
// something winnable. Same shape deliberately: detect the moment, OFFER rather
// than force, and track the offer separately from the uptake.
//
// ── Why this exists ─────────────────────────────────────────────────────────
// docs/audit/22-difficulty-spike-plan.md, re-verified 2026-09-22 against the
// live table (scripts/verify-difficulty-spike.ts):
//
//   • 30% of students who never returned ended their first sitting on two wrong
//     answers in a row, against 18% of those who did return. The direction the
//     plan reported holds; its headline "0 of 11 returners" does NOT — it is 2
//     of 11, and at n=11 that gap is not evidence of anything on its own.
//   • What DOES replicate strongly is the shape of those endings: of the losing
//     ends with a usable baseline, 8 of 10 were on a question at least a full
//     difficulty point above what the student had just been getting right,
//     median jump 2.3 points on the 1–5 scale.
//
// So the moment is real and common; the retention claim about it is not yet
// established. That is exactly what an OFFER is for — it is cheap, it is
// declinable, and `easedown_offered` / `easedown_accepted` make it measurable.
// Nothing here should be promoted to an automatic intervention until those
// events say students want it.
//
// ── Why two wrong in a row is the gate, and difficulty is not ───────────────
// The plan leaned toward triggering on EITHER a difficulty spike or two wrong
// in a row. Measured over all 158 sittings in the table, that fires on 57% of
// all wrong answers and in 59% of sittings — the delta alone accounts for 33%
// of wrong answers, most of them single wrong answers in an otherwise fine
// session. An offer that frequent is not a rescue, it is nagging, and it would
// tell a student who is simply learning that the app thinks they are drowning.
//
// The delta also cannot carry the trigger on its own: 60% of losing-streak
// moments are on skills whose bank has nothing easier to compare against, so a
// delta gate silently skips the sparsest skills — which is where students are
// most likely to be stuck.
//
// Two wrong in a row is therefore the gate, and the difficulty delta rides
// along on the event (`difficulty_delta`) so the plan's open question can be
// settled from data later rather than by argument now.
// ─────────────────────────────────────────────────────────────────────────────

/** One answer this session, as much of it as the session log knows. */
export type SessionAnswer = {
  questionId: string
  correct: boolean
  /** Null only if a question row somehow arrived without one. */
  difficulty: number | null
  /** Primary skill, or null for a question with no skills tagged. */
  skillId: string | null
}

export type EaseDownCandidate = {
  id: string
  difficulty: number
  skillIds: string[]
  /** Parts on the stem. A multi-part question is not a step down — see below. */
  partCount: number
  kind: 'mastery' | 'exam'
}

/** Wrong answers in a row that count as a losing streak. */
export const LOSING_STREAK = 2

/**
 * Offers allowed in one session.
 *
 * Measured, not chosen: across the 158 sittings in the table, a sitting that
 * hits a losing streak at all hits one twice at the median — and once, 23
 * times. Without a cap that session gets 23 invitations to take something
 * easier, which is the opposite of encouraging.
 */
export const MAX_OFFERS_PER_SESSION = 2

/** Correct answers needed before their average difficulty means anything. */
const MIN_BASELINE = 2

/**
 * Is this a genuine step down — one question, one go at it?
 *
 * Multi-part questions are excluded even when their difficulty is lower: the
 * step up's own reasoning is that SHAPE matters as much as the number, and a
 * three-part stem is more to hold in your head, not less, whatever it is rated.
 * `exam`-kind questions are excluded for the reason stepUp excludes them — they
 * need 2+ independent skills by authoring rule, which is a cliff in either
 * direction.
 */
export function isEaseDown(c: EaseDownCandidate): boolean {
  return c.partCount < 2 && c.kind !== 'exam'
}

/** Wrong answers at the end of the session log, however far back they run. */
export function losingStreakLength(answers: SessionAnswer[]): number {
  let n = 0
  for (let i = answers.length - 1; i >= 0 && !answers[i].correct; i--) n++
  return n
}

/**
 * The mean difficulty of the correct answers this session, or null when there
 * are too few to compare against.
 *
 * This is the "what they'd just been succeeding at" the plan measures the spike
 * against. Correct answers only — including the failures would drag the
 * baseline toward the very question we are reacting to.
 */
export function correctBaseline(answers: SessionAnswer[]): number | null {
  const ds = answers
    .filter(a => a.correct)
    .map(a => a.difficulty)
    .filter((d): d is number => typeof d === 'number')
  if (ds.length < MIN_BASELINE) return null
  return ds.reduce((a, b) => a + b, 0) / ds.length
}

/**
 * How far above that baseline the question just failed was, or null without a
 * baseline. Recorded on the offer event, never used as the trigger.
 */
export function difficultyDelta(answers: SessionAnswer[]): number | null {
  const last = answers[answers.length - 1]
  if (!last || typeof last.difficulty !== 'number') return null
  const baseline = correctBaseline(answers.slice(0, -1))
  return baseline === null ? null : last.difficulty - baseline
}

/**
 * Should an ease-down be offered on the answer that just landed?
 *
 * Fires on the answer that COMPLETES the streak and not on the ones after it,
 * so a student who declines and gets a third wrong is not asked again about the
 * same wall. The streak — and so the next possible offer — resets the moment
 * they get something right.
 */
export function shouldOfferEaseDown(
  answers: SessionAnswer[],
  offersThisSession: number,
  maxOffers: number = MAX_OFFERS_PER_SESSION,
): boolean {
  if (offersThisSession >= maxOffers) return false
  return losingStreakLength(answers) === LOSING_STREAK
}

/**
 * The best question to offer, or null when the pool has nothing easier.
 *
 * ── How far "easier" reaches ────────────────────────────────────────────────
 * The plan's simplest option — a lower-difficulty question on the SAME skill —
 * turns out to be empty 60% of the time: the bank has a median of 2 questions
 * per skill and only 63 of 140 skills carry more than one difficulty. Built
 * that way the feature would decline to fire in three moments out of five, and
 * the sparse skills it skipped would be the ones students are most stuck on.
 *
 * So the search widens through the pool it is given — which is the session's
 * own pool, so an active focus mode is honoured for free — in tiers:
 *
 *   1. the same skill, which keeps the thread they were on
 *   2. a skill they have already answered CORRECTLY this session — the strongest
 *      evidence available that this particular student can win it
 *   3. anything else easier in the pool
 *
 * It does NOT walk the prerequisite graph to drop to an easier skill. The plan
 * held that open pending a check on whether the cross-skill pattern in its §2
 * was real; it is not distinguishable from coincidence, because question
 * selection here is uniform `Math.random()` at every step (both `pickRandom` in
 * the question page and the entry page's own pick), so there is no shared
 * ordering across sessions for those skill pairs to be an artefact of.
 *
 * ── Which of the easier ones ────────────────────────────────────────────────
 * The hardest question that is still at or below the baseline they were already
 * clearing: as gentle as it needs to be and no gentler. Dropping straight to
 * difficulty 1 after failing a 4 would be its own kind of insult, and it is not
 * what the evidence asks for — the gap to close is the jump, not the level.
 * With no baseline to go on, take the easiest available and let the event's
 * null delta say why.
 */
export function pickEaseDown(
  failed: { id: string; difficulty: number; skillIds: string[] },
  candidates: EaseDownCandidate[],
  answers: SessionAnswer[],
  excludeIds: Iterable<string> = [],
): EaseDownCandidate | null {
  const excluded = new Set(excludeIds)
  excluded.add(failed.id)

  const eligible = candidates.filter(c =>
    isEaseDown(c) &&
    c.difficulty < failed.difficulty &&
    !excluded.has(c.id))
  if (!eligible.length) return null

  const baseline = correctBaseline(answers)
  const wonSkills = new Set(
    answers.filter(a => a.correct && a.skillId).map(a => a.skillId as string))
  const failedSkill = failed.skillIds[0]

  const tier = (c: EaseDownCandidate) =>
    failedSkill && c.skillIds.includes(failedSkill) ? 0
      : c.skillIds.some(s => wonSkills.has(s)) ? 1
      : 2

  const best = Math.min(...eligible.map(tier))
  const inTier = eligible.filter(c => tier(c) === best)

  // Hardest at-or-below the baseline; failing that, the easiest on offer.
  const atOrBelow = baseline === null ? [] : inTier.filter(c => c.difficulty <= baseline)
  const pool = atOrBelow.length ? atOrBelow : inTier
  const want = atOrBelow.length
    ? Math.max(...pool.map(c => c.difficulty))
    : Math.min(...pool.map(c => c.difficulty))

  // id breaks ties so the choice is deterministic rather than incidental.
  return pool
    .filter(c => c.difficulty === want)
    .sort((a, b) => a.id.localeCompare(b.id))[0]
}
