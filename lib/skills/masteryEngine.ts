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
 * - For each skill, consider only the most recent 5 attempts
 * - 4 or more correct out of 5 → mastered
 * - Fewer than 4 correct out of 5 (with at least 5 attempts) → needs_practice
 * - Fewer than 5 attempts → in_progress
 */
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

    const lastFive = sorted.slice(0, 5)
    const recentCorrect = lastFive.filter(a => a.correct).length
    const recentAttempts = lastFive.length

    let status: MasteryStatus
    if (recentAttempts >= 5 && recentCorrect >= 4) {
      status = 'mastered'
    } else if (recentAttempts >= 5) {
      status = 'needs_practice'
    } else {
      status = 'in_progress'
    }

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
 * is credited with `creditPerPrerequisite` synthetic correct attempts ("3 answers
 * worth of mastery"), timestamped after every real attempt so they occupy the
 * most-recent slots of the 5-attempt window. Feed the result through
 * calculateMastery.
 *
 * Unlike the DIAGNOSTIC's binary `inferPrerequisiteMastery` (which marks every
 * prerequisite mastered outright), this BLENDS with the prerequisite's real
 * history rather than overriding it:
 *   - a prerequisite the student has directly struggled with is not instantly
 *     mastered — the 3 credits combine with its real recent attempts;
 *   - an untested prerequisite reaches only `in_progress` (3 of the 5 needed),
 *     never `mastered`, from inference alone.
 * The diagnostic keeps the stronger binary inference; ongoing practice uses this.
 */
export function applyPrerequisiteCredit(
  attempts: Attempt[],
  getTransitivePrerequisites: (skillId: string) => string[],
  creditPerPrerequisite = 3,
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

  for (const skillId of allSkillIds) {
    const m = mastery[skillId]
    if (!m || m.status === 'in_progress') {
      pool.push(skillId)           // weight: 1
    } else if (m.status === 'needs_practice') {
      pool.push(skillId, skillId, skillId)  // weight: 3
    }
    // mastered: weight 0 — excluded until everything else is done
  }

  // If everything is mastered, fall back to full pool
  return pool.length > 0 ? pool : allSkillIds
}
