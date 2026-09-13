import type { StudentEvidence, ItemEvidence } from './feedbackEvidence'

// ─────────────────────────────────────────────────────────────────────────────
// What a marked paper says about the CLASS, as opposed to about each student.
//
// The sheets answer "what should this child do next". This answers the other
// question a teacher has, and the more urgent one: WHAT DO I RETEACH ON MONDAY.
// Thirty individual sheets do not add up to that on their own — a teacher would
// have to read all thirty and hold the pattern in their head.
//
// BUILT FROM THE PER-STUDENT EVIDENCE, not recomputed from the marks. That is
// deliberate: it makes it impossible for the class view to disagree with the
// sheets handed out from the same screen. If a sheet says a student dropped
// four marks on algebra, those four marks are in this total, by construction
// rather than by both sides doing the same sum correctly.
//
// PURE, like everything else in this pipeline — no auth, no class, no database,
// so it runs on the free path where nothing is stored.
//
// STILL NO MASTERY VERDICTS. Everything here is "on this paper". A class that
// scored well on ratio has not proved it holds ratio; it has answered these
// ratio questions. Same rule as feedbackEvidence.ts, for the same reason.
// ─────────────────────────────────────────────────────────────────────────────

/** How one question went across the whole class. */
export type QuestionOutcome = {
  itemId: string
  /** As printed on the paper: "11(c)". */
  label: string
  /** Marks this question is worth, per student. */
  marksEach: number
  /** Total earned across the class. */
  earned: number
  /** Total available across the class — marksEach × students. */
  possible: number
  /** 0–1 across the class. */
  ratio: number
  /** How much the class lost here. The number that decides what to reteach. */
  marksLost: number
  /** Students who got every mark. */
  fullMarks: number
  /** Students who got none. */
  zero: number
  topicId: string
  /** The item's teacher-facing skill label. */
  skill: string
  skillIds: string[]
  desc: string
}

export type ClassTopicOutcome = {
  topicId: string
  label: string
  earned: number
  possible: number
  ratio: number
}

export type ClassSkillOutcome = {
  skillId: string
  label: string
  earned: number
  possible: number
  ratio: number
  marksLost: number
  /** Students who dropped nothing on every item assessing it. */
  fullMarks: number
  itemIds: string[]
}

export type ClassSummary = {
  students: number
  /** Marks available to each student — the paper, or the part of it that was set. */
  marksAvailable: number
  mean: number
  meanPercentage: number
  median: number
  lowest: number
  highest: number
  /** Present only when part of a paper was set. */
  coverage: StudentEvidence['coverage'] | null
  topics: ClassTopicOutcome[]
  /** Worst first — the reteaching order. */
  questions: QuestionOutcome[]
  /** Worst first. */
  skills: ClassSkillOutcome[]
  /** Every student, lowest score first, so the spread is visible at a glance. */
  students_: { studentRef: string; earned: number; percentage: number }[]
}

function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Aggregate a class's sheets into one view.
 *
 * Every student is assumed to have sat the SAME selection — which is what the
 * marking screen enforces, since the questions set are chosen once for the
 * whole class.
 */
export function buildClassSummary(evidences: StudentEvidence[]): ClassSummary {
  if (!evidences.length) {
    return {
      students: 0, marksAvailable: 0, mean: 0, meanPercentage: 0, median: 0,
      lowest: 0, highest: 0, coverage: null,
      topics: [], questions: [], skills: [], students_: [],
    }
  }

  const students = evidences.length
  const marksAvailable = evidences[0].available
  const totals = evidences.map(e => e.earned)

  // ── Per question ──────────────────────────────────────────────────────────
  // Keyed off the first student's item list: everyone sat the same selection,
  // and taking it from one place keeps the order the paper's own.
  const questions: QuestionOutcome[] = evidences[0].items.map(first => {
    const across: ItemEvidence[] = evidences
      .map(e => e.items.find(i => i.itemId === first.itemId))
      .filter((i): i is ItemEvidence => Boolean(i))

    const earned = across.reduce((a, i) => a + i.earned, 0)
    const possible = first.available * students
    return {
      itemId: first.itemId,
      label: first.label,
      marksEach: first.available,
      earned,
      possible,
      ratio: possible > 0 ? earned / possible : 0,
      marksLost: possible - earned,
      fullMarks: across.filter(i => i.full).length,
      zero: across.filter(i => i.earned === 0).length,
      topicId: first.topicId,
      skill: first.skill,
      skillIds: first.skillIds,
      desc: first.desc,
    }
  })

  // ── Per topic ─────────────────────────────────────────────────────────────
  const topics: ClassTopicOutcome[] = evidences[0].topics.map(t => {
    const earned = evidences.reduce(
      (a, e) => a + (e.topics.find(x => x.topicId === t.topicId)?.earned ?? 0), 0)
    const possible = t.available * students
    return {
      topicId: t.topicId,
      label: t.label,
      earned,
      possible,
      ratio: possible > 0 ? earned / possible : 0,
    }
  })

  // ── Per skill ─────────────────────────────────────────────────────────────
  // A skill's marks are counted once per student per item, exactly as the
  // individual sheets count them — so a multi-skill item still contributes in
  // full to each of its skills, and skill totals do not sum to the paper.
  const bySkill = new Map<string, ClassSkillOutcome>()
  for (const e of evidences) {
    for (const s of e.skills) {
      const acc = bySkill.get(s.skillId) ?? {
        skillId: s.skillId, label: s.label, earned: 0, possible: 0,
        ratio: 0, marksLost: 0, fullMarks: 0, itemIds: s.itemIds,
      }
      acc.earned += s.earned
      acc.possible += s.available
      if (s.fullMarks) acc.fullMarks += 1
      bySkill.set(s.skillId, acc)
    }
  }
  const skills = [...bySkill.values()].map(s => ({
    ...s,
    ratio: s.possible > 0 ? s.earned / s.possible : 0,
    marksLost: s.possible - s.earned,
  }))

  return {
    students,
    marksAvailable,
    mean: round2(totals.reduce((a, b) => a + b, 0) / students),
    meanPercentage: marksAvailable > 0
      ? Math.round((totals.reduce((a, b) => a + b, 0) / students / marksAvailable) * 100)
      : 0,
    median: median(totals),
    lowest: Math.min(...totals),
    highest: Math.max(...totals),
    coverage: evidences[0].coverage.fullPaper ? null : evidences[0].coverage,

    // Paper order — a teacher reads a topic breakdown down the page, not ranked.
    topics,

    // WORST FIRST, and by MARKS LOST rather than by percentage. A one-mark
    // question everybody missed costs the class less than a five-mark question
    // half of them fumbled, and it is the second that is worth a lesson.
    questions: [...questions].sort((a, b) =>
      b.marksLost - a.marksLost || a.ratio - b.ratio || a.itemId.localeCompare(b.itemId)),

    skills: skills.sort((a, b) =>
      b.marksLost - a.marksLost || a.ratio - b.ratio || a.skillId.localeCompare(b.skillId)),

    students_: evidences
      .map(e => ({
        studentRef: e.studentRef,
        earned: e.earned,
        percentage: e.available > 0 ? Math.round((e.earned / e.available) * 100) : 0,
      }))
      .sort((a, b) => a.earned - b.earned || a.studentRef.localeCompare(b.studentRef)),
  }
}
