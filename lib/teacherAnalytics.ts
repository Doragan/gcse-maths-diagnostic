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

// Counts, deliberately NOT a percentage or an overall rating: a class is only
// part-way through the curriculum, so a "% mastered" over attempted skills (let
// alone the whole graph) misreads not-yet-covered as failure. We show only the
// skills that have evidence, as plain counts; topics with no evidence don't
// appear. (Scoping the dashboard to teacher-covered material is a future step.)
export type TopicCounts = { mastered: number; needsPractice: number; inProgress: number }

export type StudentAnalytics = {
  studentId: string
  displayName: string
  yearGroup: string | null
  hasData: boolean
  mastered: number
  needsPractice: number
  inProgress: number
  /** Per-topic counts; only topics the student has evidence in. */
  topics: Partial<Record<Topic, TopicCounts>>
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
  /** Class-wide counts per topic (summed across members); only topics with evidence. */
  topics: Partial<Record<Topic, TopicCounts>>
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

/**
 * Pure aggregation: attempt rows (across all members) + the roster → class
 * analytics. Members with no attempts appear with hasData=false and zero counts.
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

    const topics: Partial<Record<Topic, TopicCounts>> = {}
    let mastered = 0, needsPractice = 0, inProgress = 0
    for (const e of entries) {
      if (e.status === 'mastered') mastered++
      else if (e.status === 'needs_practice') needsPractice++
      else inProgress++

      // gaps tally (only needs_practice counts as "weak"; in_progress is neutral)
      const sw = skillWeak.get(e.skillId) ?? { weak: 0, withData: 0 }
      sw.withData++
      if (e.status === 'needs_practice') sw.weak++
      skillWeak.set(e.skillId, sw)

      const topic = topicOf(e.skillId)
      if (topic) {
        const t = topics[topic] ?? { mastered: 0, needsPractice: 0, inProgress: 0 }
        if (e.status === 'mastered') t.mastered++
        else if (e.status === 'needs_practice') t.needsPractice++
        else t.inProgress++
        topics[topic] = t
      }
    }

    return {
      studentId: m.student_id,
      displayName: m.display_name,
      yearGroup: m.year_group,
      hasData: entries.length > 0,
      mastered,
      needsPractice,
      inProgress,
      topics,
    }
  })

  const withData = students.filter(s => s.hasData)

  // class-wide topic counts: sum across members; only topics with evidence
  const topics: Partial<Record<Topic, TopicCounts>> = {}
  for (const s of students) {
    for (const topic of TOPICS) {
      const st = s.topics[topic]
      if (!st) continue
      const t = topics[topic] ?? { mastered: 0, needsPractice: 0, inProgress: 0 }
      t.mastered += st.mastered; t.needsPractice += st.needsPractice; t.inProgress += st.inProgress
      topics[topic] = t
    }
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
    topics,
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
