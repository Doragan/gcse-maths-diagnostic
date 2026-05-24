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
