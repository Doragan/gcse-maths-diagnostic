import { calculateMastery } from './skills/masteryEngine'
import { skillsById } from './skills/skillGraph'
// NOTE: supabase + classes are imported dynamically inside getClassAnalytics so
// this module (and its pure computeClassAnalytics) stays free of the top-level
// SDK-client instantiation — keeps it unit-testable without env vars.

// ── Class skill analytics (teacher dashboard) ────────────────────────────────
// Aggregates each active member's DERIVED skill mastery (from the membership-
// gated get_class_skill_mastery RPC — which already includes private /practice
// AND assignment work, via the practice_attempts dual-write) into a class-level
// picture: per-topic mastery, a per-student table, and common gaps.
//
// The teacher never sees the raw practice transcript — the RPC returns only the
// mastery-relevant fields, and we reuse the SAME calculateMastery the students
// see, so the figures match.

export const TOPICS = ['Number', 'Algebra', 'Shape and Space', 'Ratio and Proportion', 'Probability and Data'] as const
export type Topic = (typeof TOPICS)[number]
const TOPIC_SET = new Set<string>(TOPICS)

// Denominator = the WHOLE curriculum (user decision 2026-06-15): mastery % is
// "of all skills in the topic/course", not just attempted skills — so it shows
// progress through the whole course (low early on, growing over time), giving
// the full picture rather than flattering a student who's only tried a few.
export const TOPIC_TOTAL: Record<Topic, number> = (() => {
  const counts = Object.fromEntries(TOPICS.map(t => [t, 0])) as Record<Topic, number>
  for (const s of Object.values(skillsById)) {
    const topic = s?.topic
    if (topic && TOPIC_SET.has(topic)) counts[topic as Topic]++
  }
  return counts
})()
export const CURRICULUM_TOTAL = Object.values(TOPIC_TOTAL).reduce((a, b) => a + b, 0)

export type StudentAnalytics = {
  studentId: string
  displayName: string
  yearGroup: string | null
  attemptedSkills: number
  masteredSkills: number
  /** % of the WHOLE curriculum mastered; null when nothing attempted yet. */
  overallMastery: number | null
  /** Per-topic % mastered (of ALL skills in the topic); all 5 topics once active. */
  topicMastery: Partial<Record<Topic, number>>
}

export type SkillGap = {
  skillId: string
  skillName: string
  topic: Topic | null
  studentsWeak: number      // members flagged needs_practice on this skill
  studentsWithData: number  // members who have attempted this skill
  priority: 'high' | 'medium'
}

export type ClassAnalytics = {
  studentCount: number       // total active members
  studentsWithData: number   // members with ≥1 attempt
  avgMastery: number | null  // mean overallMastery across members with data
  topicAvgs: Partial<Record<Topic, number>>
  students: StudentAnalytics[]
  gaps: SkillGap[]
}

export type MasteryAttemptRow = {
  student_id: string
  skill_ids: string[]
  correct: boolean
  attempted_at: string
  kind: string | null
}
type MemberLite = { student_id: string; display_name: string; year_group: string | null }

function topicOf(skillId: string): Topic | null {
  const t = skillsById[skillId]?.topic
  return t && TOPIC_SET.has(t) ? (t as Topic) : null
}

function round(n: number): number { return Math.round(n) }

/**
 * Pure aggregation: attempt rows (across all members) + the roster → class
 * analytics. Members with no attempts appear with overallMastery null.
 */
export function computeClassAnalytics(rows: MasteryAttemptRow[], members: MemberLite[]): ClassAnalytics {
  const byStudent = new Map<string, MasteryAttemptRow[]>()
  for (const r of rows) {
    if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, [])
    byStudent.get(r.student_id)!.push(r)
  }

  // Per-skill weakness tally across members, for the gaps section.
  const skillWeak = new Map<string, { weak: number; withData: number }>()

  const students: StudentAnalytics[] = members.map(m => {
    const attempts = byStudent.get(m.student_id) ?? []
    const mastery = calculateMastery(
      attempts.map(a => ({ skill_ids: a.skill_ids, correct: a.correct, attempted_at: a.attempted_at, kind: a.kind === 'exam' ? 'exam' : 'mastery' }))
    )
    const entries = Object.values(mastery)

    // per-topic tallies
    const topicTally: Partial<Record<Topic, { mastered: number; total: number }>> = {}
    let mastered = 0
    for (const e of entries) {
      if (e.status === 'mastered') mastered++
      // gaps tally (only needs_practice counts as "weak"; in_progress is neutral)
      const sw = skillWeak.get(e.skillId) ?? { weak: 0, withData: 0 }
      sw.withData++
      if (e.status === 'needs_practice') sw.weak++
      skillWeak.set(e.skillId, sw)

      const topic = topicOf(e.skillId)
      if (topic) {
        const t = topicTally[topic] ?? { mastered: 0, total: 0 }
        t.total++
        if (e.status === 'mastered') t.mastered++
        topicTally[topic] = t
      }
    }

    const attemptedSkills = entries.length
    // Denominator is the whole curriculum / whole topic, not just attempted skills.
    const overallMastery = attemptedSkills > 0 ? round((mastered / CURRICULUM_TOTAL) * 100) : null
    const topicMastery: Partial<Record<Topic, number>> = {}
    if (attemptedSkills > 0) {
      for (const topic of TOPICS) {
        topicMastery[topic] = round(((topicTally[topic]?.mastered ?? 0) / TOPIC_TOTAL[topic]) * 100)
      }
    }

    return {
      studentId: m.student_id,
      displayName: m.display_name,
      yearGroup: m.year_group,
      attemptedSkills,
      masteredSkills: mastered,
      overallMastery,
      topicMastery,
    }
  })

  const withData = students.filter(s => s.overallMastery !== null)
  const avgMastery = withData.length > 0
    ? round(withData.reduce((sum, s) => sum + (s.overallMastery ?? 0), 0) / withData.length)
    : null

  // class topic averages: mean of student topic %s among students who have that topic
  const topicAvgs: Partial<Record<Topic, number>> = {}
  for (const topic of TOPICS) {
    const vals = students.map(s => s.topicMastery[topic]).filter((v): v is number => v !== undefined)
    if (vals.length > 0) topicAvgs[topic] = round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  // common gaps: skills where a meaningful share of those who tried it are weak
  const gaps: SkillGap[] = [...skillWeak.entries()]
    .map(([skillId, { weak, withData }]) => {
      const frac = withData > 0 ? weak / withData : 0
      return {
        skillId,
        skillName: skillsById[skillId]?.name ?? skillId,
        topic: topicOf(skillId),
        studentsWeak: weak,
        studentsWithData: withData,
        priority: (frac >= 0.6 ? 'high' : 'medium') as 'high' | 'medium',
      }
    })
    .filter(g => g.studentsWeak >= 2 && g.studentsWeak / g.studentsWithData >= 0.5)
    .sort((a, b) => b.studentsWeak - a.studentsWeak || b.studentsWithData - a.studentsWithData)
    .slice(0, 8)

  return {
    studentCount: members.length,
    studentsWithData: withData.length,
    avgMastery,
    topicAvgs,
    students,
    gaps,
  }
}

/**
 * Fetch + aggregate class analytics. Calls the membership-gated RPC (returns
 * mastery-relevant fields only, for classes the caller owns) and the roster.
 * Throws if the RPC is unavailable (e.g. migration not yet applied) so the UI
 * can show a graceful fallback.
 */
export async function getClassAnalytics(classId: string): Promise<ClassAnalytics> {
  const [{ supabase }, { getClassMembers }] = await Promise.all([
    import('./supabase'),
    import('./classes'),
  ])
  const [members, rpc] = await Promise.all([
    getClassMembers(classId),
    supabase.rpc('get_class_skill_mastery', { _class_id: classId }),
  ])
  if (rpc.error) throw rpc.error
  const rows = (rpc.data ?? []) as MasteryAttemptRow[]
  return computeClassAnalytics(
    rows,
    members.map(m => ({ student_id: m.student_id, display_name: m.display_name, year_group: m.year_group })),
  )
}
