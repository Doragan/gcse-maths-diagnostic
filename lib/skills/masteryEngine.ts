export type MasteryStatus = 'mastered' | 'needs_practice' | 'in_progress'

export type SkillMastery = {
  skillId: string
  status: MasteryStatus
  recentAttempts: number
  recentCorrect: number
  /** True when mastery was inferred from a dependent skill, not earned directly */
  inferred?: boolean
}

type Attempt = {
  skill_ids: string[]
  correct: boolean
  attempted_at: string
  /**
   * Two-kind model. 'exam' answers are positive-only: a wrong one is a no-op
   * (it never lowers mastery), while a correct one credits normally. Absent or
   * 'mastery' → today's behaviour (credit on success, penalise on failure).
   */
  kind?: 'mastery' | 'exam'
}

/**
 * Calculates skill mastery from a student's practice attempts.
 *
 * Rules:
 * - Once a skill has 5+ attempts: the rolling window governs — 4 or more correct
 *   out of the most recent 5 → mastered, else needs_practice.
 * - Before 5 attempts (the fast-track / "catch up quickly" phase): nailing the
 *   FIRST three attempts on a skill marks it mastered early, so a capable student
 *   isn't held at in_progress waiting for a full window. Otherwise in_progress.
 *   A fast-tracked skill stays mastered through a single later slip (the first
 *   three don't change); the rolling rule takes over at the 5th attempt, so a
 *   SECOND slip — 4/5 failed — is what demotes it.
 */
/**
 * THE mastery rule, for one skill, over its attempts MOST RECENT FIRST.
 *
 * Extracted so there is exactly one definition. The practice question page used
 * to re-implement it inline — three times — and only ever had the 5-window half,
 * so the fast-track never lit the "Skill mastered!" celebration: 19 of 76 real
 * mastery events passed silently, and they are the capable students the
 * fast-track was added for in the first place.
 *
 * TRUNCATION IS SAFE, and deliberately so: callers may pass only the most recent
 * 5. `firstThree` is consulted ONLY when total < 5, and a caller holding fewer
 * than 5 is necessarily holding all of them. Above that the rolling window
 * governs and the earliest attempts are irrelevant.
 *
 * Callers must apply the exam-kind filter themselves (a wrong `exam` attempt is
 * a no-op and must not enter the sequence) — see calculateMastery below.
 */
export function masteryStatusFor(mostRecentFirst: { correct: boolean }[]): MasteryStatus {
  const total = mostRecentFirst.length
  if (total >= 5) {
    // Rolling window: 4 of the last 5 → mastered, else needs_practice.
    return mostRecentFirst.slice(0, 5).filter(a => a.correct).length >= 4
      ? 'mastered'
      : 'needs_practice'
  }
  // Fast-track: the first three attempts all correct → mastered early. The
  // array is most-recent-first, so its LAST three are the earliest three.
  const firstThree = mostRecentFirst.slice(-3)
  return total >= 3 && firstThree.every(a => a.correct) ? 'mastered' : 'in_progress'
}

/**
 * How many more consecutive correct answers would reach `mastered`, or 0 if it
 * already is. Capped at 5 (nothing needs more than a fresh window).
 *
 * Simulated against masteryStatusFor rather than reasoned about, so it cannot
 * drift from the rule it is describing. The naive "4 − correct" was wrong for a
 * student on the fast-track path: one correct answer in, it promised three more
 * when two would do.
 */
export function attemptsToMastery(mostRecentFirst: { correct: boolean }[]): number {
  if (masteryStatusFor(mostRecentFirst) === 'mastered') return 0
  for (let n = 1; n <= 5; n++) {
    const withMore = [...Array(n).fill({ correct: true }), ...mostRecentFirst]
    if (masteryStatusFor(withMore) === 'mastered') return n
  }
  return 5
}

export function calculateMastery(attempts: Attempt[]): Record<string, SkillMastery> {
  const bySkill: Record<string, { correct: boolean; attempted_at: string }[]> = {}

  for (const attempt of attempts) {
    // Positive-only attribution for exam-kind synthesis questions: a wrong
    // answer never enters the window (so it can't lower any skill); a correct
    // answer is recorded normally and credits every constituent skill.
    if (attempt.kind === 'exam' && !attempt.correct) continue

    for (const skillId of attempt.skill_ids) {
      if (!bySkill[skillId]) bySkill[skillId] = []
      bySkill[skillId].push({ correct: attempt.correct, attempted_at: attempt.attempted_at })
    }
  }

  const mastery: Record<string, SkillMastery> = {}

  for (const [skillId, skillAttempts] of Object.entries(bySkill)) {
    const sorted = [...skillAttempts].sort(
      (a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime()
    )

    const total = sorted.length
    const lastFive = sorted.slice(0, 5)
    const recentCorrect = lastFive.filter(a => a.correct).length
    const recentAttempts = lastFive.length

    const status = masteryStatusFor(sorted)

    mastery[skillId] = { skillId, status, recentAttempts, recentCorrect }
  }

  return mastery
}

/**
 * Propagates mastery backwards through the prerequisite tree.
 *
 * Rule: if a student has at least 1 correct answer on a skill, they demonstrably
 * know its prerequisites — so every transitive prerequisite that isn't already
 * mastered is credited as mastered (inferred).
 *
 * Already-mastered skills are left untouched. Skills that are in_progress or
 * needs_practice can be overridden: answering a harder skill correctly is
 * stronger evidence than a small number of direct attempts.
 *
 * @param mastery                  Real mastery map from calculateMastery
 * @param getTransitivePrerequisites  Function returning full prerequisite tree for a skill
 */
export function inferPrerequisiteMastery(
  mastery: Record<string, SkillMastery>,
  getTransitivePrerequisites: (skillId: string) => string[],
): Record<string, SkillMastery> {
  const result: Record<string, SkillMastery> = { ...mastery }

  for (const [skillId, m] of Object.entries(mastery)) {
    if (m.recentCorrect < 1) continue  // need at least one correct answer to infer

    for (const prereqId of getTransitivePrerequisites(skillId)) {
      // Skip only if already mastered from real data — in_progress/needs_practice
      // can be overridden: if a student answers harder skills correctly, they
      // demonstrably know the foundations even if the diagnostic was brief.
      if (mastery[prereqId]?.status === 'mastered') continue

      result[prereqId] = {
        skillId: prereqId,
        status: 'mastered',
        recentAttempts: result[prereqId]?.recentAttempts ?? 0,
        recentCorrect: result[prereqId]?.recentCorrect ?? 0,
        inferred: true,
      }
    }
  }

  return result
}

/**
 * Practice-context prerequisite inference (audit L2 — the user's ruling).
 *
 * When a student answers a skill correctly, each of its transitive prerequisites
 * is credited with `creditPerPrerequisite` synthetic correct attempts ("2 answers
 * worth of mastery"), timestamped after every real attempt so they occupy the
 * most-recent slots of the window. Feed the result through calculateMastery.
 *
 * Unlike the DIAGNOSTIC's binary `inferPrerequisiteMastery` (which marks every
 * prerequisite mastered outright), this BLENDS with the prerequisite's real
 * history rather than overriding it:
 *   - a prerequisite the student has directly struggled with is not instantly
 *     mastered — the 2 credits combine with its real recent attempts;
 *   - an UNTESTED prerequisite gets only 2 credits — below both the fast-track's
 *     first-three bar and the window's 5 — so it reaches only `in_progress`,
 *     never `mastered`, from inference alone. A prerequisite with ≥1 real correct,
 *     though, is topped past three by the credit and CAN fast-track to mastered
 *     (the deliberate "answered it once, plus a downstream skill → mastered"
 *     path — hence 2, not 3: a single downstream answer must not be enough on
 *     its own).
 * The diagnostic keeps the stronger binary inference; ongoing practice uses this.
 */
export function applyPrerequisiteCredit(
  attempts: Attempt[],
  getTransitivePrerequisites: (skillId: string) => string[],
  creditPerPrerequisite = 2,
): Attempt[] {
  const demonstrated = new Set<string>()
  let latestMs = 0
  for (const a of attempts) {
    const t = new Date(a.attempted_at).getTime()
    if (Number.isFinite(t) && t > latestMs) latestMs = t
    // A correct answer (any kind) demonstrates each tagged skill.
    if (a.correct) for (const s of a.skill_ids) demonstrated.add(s)
  }
  if (demonstrated.size === 0) return attempts

  // Each transitive prerequisite of a demonstrated skill is credited once.
  const credited = new Set<string>()
  for (const skillId of demonstrated) {
    for (const prereq of getTransitivePrerequisites(skillId)) credited.add(prereq)
  }
  if (credited.size === 0) return attempts

  const synthetic: Attempt[] = []
  let ts = latestMs
  for (const prereqId of credited) {
    for (let i = 0; i < creditPerPrerequisite; i++) {
      ts += 1000
      synthetic.push({
        skill_ids: [prereqId],
        correct: true,
        attempted_at: new Date(ts).toISOString(),
        kind: 'mastery',
      })
    }
  }
  return [...attempts, ...synthetic]
}

/**
 * Filters a list of skill IDs to those whose full prerequisite tree is either
 * mastered or in_progress (i.e. the student has engaged with them without being
 * blocked). Skills whose prerequisites are untested or needs_practice are
 * excluded — asking questions above a student's demonstrated level just adds
 * noise and frustration.
 *
 * Uses the full transitive prerequisite tree (not just direct prerequisites),
 * so if C→B→A and A is needs_practice, C is excluded even if B looks fine.
 *
 * @param mastery          Current mastery map, keyed by skill ID
 * @param allSkillIds      Candidate skill IDs (e.g. all skills in the chosen tier)
 * @param getPrerequisites Function returning ALL transitive prerequisites for a skill
 */
export function getAccessibleSkillIds(
  mastery: Record<string, SkillMastery>,
  allSkillIds: string[],
  getPrerequisites: (skillId: string) => string[],
): string[] {
  return allSkillIds.filter(skillId => {
    const prereqs = getPrerequisites(skillId)
    // A skill with no prerequisites is always accessible.
    // Otherwise every prerequisite must have been attempted and not be needs_practice.
    return prereqs.every(prereqId => {
      const m = mastery[prereqId]
      return m !== undefined && m.status !== 'needs_practice'
    })
  })
}

/**
 * Returns only the skills currently marked needs_practice, for the paid
 * "weak-spot blitz" focus mode (a session built entirely from weak skills,
 * rather than the gentle 3× weighting getWeightedSkillPool applies).
 *
 * These skills have all been attempted (needs_practice requires ≥5 attempts),
 * so their prerequisites are inherently satisfied — no accessible-pool filtering
 * is needed.
 */
export function getNeedsPracticeSkillIds(
  mastery: Record<string, SkillMastery>,
  allSkillIds: string[],
): string[] {
  return allSkillIds.filter(id => mastery[id]?.status === 'needs_practice')
}

/**
 * Returns skill IDs weighted towards needs_practice, for use in targeted practice.
 * Skills needing practice appear proportionally more often than in_progress,
 * which appear more often than mastered.
 */
export function getWeightedSkillPool(
  mastery: Record<string, SkillMastery>,
  allSkillIds: string[],
): string[] {
  const pool: string[] = []
  const masteredIds: string[] = []

  for (const skillId of allSkillIds) {
    const m = mastery[skillId]
    if (!m || m.status === 'in_progress') {
      pool.push(skillId)           // weight: 1
    } else if (m.status === 'needs_practice') {
      pool.push(skillId, skillId, skillId)  // weight: 3
    } else {
      masteredIds.push(skillId)    // mastered → occasional spaced review, below
    }
  }

  // Spaced review: mastered skills reappear as ~10% of the pool. This refreshes
  // retention AND lets a fast-tracked skill (mastered from just its first three
  // attempts) reach a 5th attempt, where the rolling rule can demote it if the
  // student has since slipped — without it, mastered skills leave the rotation
  // and that demotion could never fire. At least one slot whenever any skill is
  // mastered, so the review never silently vanishes for a small active pool.
  if (pool.length > 0 && masteredIds.length > 0) {
    const slots = Math.max(1, Math.round(pool.length / 9))
    for (let i = 0; i < slots; i++) pool.push(masteredIds[i % masteredIds.length])
  }

  // If everything is mastered, fall back to full pool
  return pool.length > 0 ? pool : allSkillIds
}
