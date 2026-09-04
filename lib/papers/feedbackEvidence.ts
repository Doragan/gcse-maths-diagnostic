import type { PaperConfig, PaperQuestion } from '../demoPapers'
import { skillsById } from '../skills/skillGraph'
import { marksEarned, selectedItems, type ItemMarks, type ItemSelection } from './sittingMarks'

// ─────────────────────────────────────────────────────────────────────────────
// What a marked paper says about one student, before anyone decides how to say
// it.
//
// This is the FORMAT-AGNOSTIC half of feedback. WWW/EBI is one way to present
// what is computed here; a target-setting sheet, a RAG grid, or a parents'
// evening summary are others, and none of them should have to recompute which
// skills lost marks. Formatters read `StudentEvidence` and write prose.
//
// It is also the half that is PURE. Nothing here touches auth, a class, or the
// database — the same reason lib/papers/sittingMarks.ts exists. That matters
// commercially as well as for testing: under "free to use, paid to keep" the
// free path generates sheets and writes nothing, so the generator cannot be
// allowed to depend on a persisted sitting.
//
// NOTHING HERE IS A MASTERY VERDICT, and the wording is chosen to keep it that
// way. One paper is one observation. "Secure", "mastered" and "still shaky" are
// judgements about a student over TIME — the mastery engine wants repeated
// correct attempts before it will say a skill is held — and a single sitting
// cannot support them however well it went. So this layer reports only what the
// paper shows: `fullMarks` means full marks on every item assessing that skill
// ON THIS PAPER, and claims nothing beyond it.
//
// This function sees one sitting ON BOTH TIERS — that is its signature, not a
// restriction the free path is under. What paid adds is not a richer call here
// but something ABOVE here: stored attempts from earlier sittings, which the
// mastery engine can combine into a judgement. Free marking is unlimited —
// as many papers, classes and sheets as a teacher likes — and still cannot
// produce that judgement, because nothing it generates is ever linked to
// anything else. The limit is memory, not volume.
//
// So a verdict is never this layer's to make on either tier. Ask the engine
// over stored attempts.
//
// TWO RULES INHERITED FROM MARKING, deliberately not re-litigated here:
//
//   • FULL MARKS ONLY counts as evidence for a skill. Three out of four earns
//     nothing, because deriveAttempts() collapses marks that way when it feeds
//     the mastery engine — `correct: mark === item.marks`. Using a softer bar
//     here would put the sheet and the student's skill map into disagreement
//     over the very same marks.
//
//   • A MULTI-SKILL ITEM COUNTS IN FULL TOWARD EVERY SKILL IT ASSESSES, exactly
//     as deriveAttempts stamps the item's result onto each of its skill ids.
//     Splitting 2 marks between two skills would invent a precision the mark
//     scheme does not have. The consequence is that SKILL MARKS DO NOT SUM TO
//     THE PAPER TOTAL and must never be presented as if they did — use the
//     topic or paper totals for "how did they do", and skills for "on what".
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A topic counts as strong enough to be offered a challenge question at or
 * above this share of its marks.
 *
 * A presentation threshold, not a fact about the student — it is exported, and
 * every topic carries its own `ratio`, so a formatter that wants a different
 * bar can ignore `challenges` and re-derive from `topics`.
 */
export const STRONG_TOPIC_RATIO = 0.8

export type ItemEvidence = {
  itemId: string
  /** How the question is labelled on the paper: "3(a)". */
  label: string
  earned: number
  available: number
  /** Full marks — the same bar the mastery engine applies. */
  full: boolean
  topicId: string
  /** The item's teacher-facing skill label, e.g. "Frequency Trees". */
  skill: string
  skillIds: string[]
  desc: string
}

export type TopicEvidence = {
  topicId: string
  label: string
  earned: number
  available: number
  /** 0–1. Zero when the topic carried no marks in the selection. */
  ratio: number
  itemIds: string[]
}

export type SkillEvidence = {
  skillId: string
  /** Canonical skill name, falling back to the paper's own item label. */
  label: string
  earned: number
  available: number
  marksLost: number
  /**
   * Full marks on EVERY item assessing this skill, on this paper.
   *
   * Descriptive, not a verdict: it is emphatically NOT "the student has this
   * skill". That claim needs history (see the file header). Named for what it
   * measures so a formatter cannot borrow authority the single paper lacks.
   */
  fullMarks: boolean
  itemIds: string[]
}

/** A same-skill question to practise, taken from the paper's `retrySet`. */
export type PracticeSuggestion = {
  itemId: string
  itemLabel: string
  skill: string
  question: string
  marksLost: number
}

/** A harder question offered where a topic is already strong. */
export type ChallengeSuggestion = {
  topicId: string
  skill: string
  question: string
}

export type Coverage = {
  /** False when only part of the paper was set. */
  fullPaper: boolean
  itemsAssessed: number
  itemsOnPaper: number
  marksAssessed: number
  marksOnPaper: number
}

export type StudentEvidence = {
  /**
   * Whatever the caller uses to identify this student — a student id on the
   * paid path, a typed name on the free one. Opaque here on purpose: the
   * generator never needs to know which, and keeping it opaque is what lets
   * the free path run with no accounts at all.
   */
  studentRef: string
  earned: number
  available: number
  /** Rounded to the nearest whole percent. */
  percentage: number
  coverage: Coverage
  /** Every set item, in paper order. */
  items: ItemEvidence[]
  /** Topics carrying marks in the selection, in the paper's topic order. */
  topics: TopicEvidence[]
  /** Every skill assessed, worst first. */
  skills: SkillEvidence[]
  /**
   * Full marks everywhere they appeared on this paper.
   *
   * NOT simply "the WWW list". A student on 6 of 7 for equations belongs in
   * what-went-well too, and this boolean excludes them. A formatter writing
   * praise should split on the marks — `earned`/`available` are right here —
   * and use this flag only where the sentence really is "dropped nothing".
   */
  fullMarkSkills: SkillEvidence[]
  /** Lost at least one mark, worst first. */
  droppedSkills: SkillEvidence[]
  /**
   * Skills the paper assesses that this selection did NOT.
   *
   * Carried so a sheet can say "not assessed" rather than staying silent,
   * which a parent reads as "no problem there".
   */
  unassessedSkillIds: string[]
  /** What to practise, worst first. */
  practice: PracticeSuggestion[]
  /** Where to push on, for topics at or above STRONG_TOPIC_RATIO. */
  challenges: ChallengeSuggestion[]
}

/** Canonical name for a skill id, falling back to the paper's own wording. */
function skillLabel(skillId: string, items: PaperQuestion[]): string {
  const canonical = skillsById[skillId]?.name
  if (canonical) return canonical
  // The graph does not know this id — a paper tagged against a skill that has
  // since been renamed or removed. The item's own label is still meaningful to
  // a teacher, so prefer it over showing a raw id.
  return items.find(i => i.skillIds.includes(skillId))?.skill ?? skillId
}

/**
 * Everything a feedback sheet needs about one student's marked paper.
 *
 * `marks` may omit items — an unmarked question simply scores nothing. What it
 * may NOT do is carry an item outside `selection`; validateEntries rejects that
 * upstream, and it is ignored here rather than inflating the score.
 */
export function buildStudentEvidence(
  paper: PaperConfig,
  marks: ItemMarks,
  studentRef: string,
  selection?: ItemSelection,
): StudentEvidence {
  const set = selectedItems(paper, selection)
  const setIds = new Set(set.map(q => q.id))

  const items: ItemEvidence[] = set.map(q => {
    const earned = marks[q.id] ?? 0
    return {
      itemId: q.id,
      label: q.label,
      earned,
      available: q.marks,
      full: earned === q.marks,
      topicId: q.topic,
      skill: q.skill,
      skillIds: q.skillIds,
      desc: q.desc,
    }
  })

  const available = set.reduce((s, q) => s + q.marks, 0)
  // Sum the ITEMS, not the raw marks object: a mark for an unset question would
  // otherwise be counted into a total it contributes nothing to.
  const earned = items.reduce((s, i) => s + i.earned, 0)

  // ── Topics, in the paper's own order ──────────────────────────────────────
  const topics: TopicEvidence[] = paper.topics
    .map(t => {
      const mine = items.filter(i => i.topicId === t.id)
      const tAvailable = mine.reduce((s, i) => s + i.available, 0)
      const tEarned = mine.reduce((s, i) => s + i.earned, 0)
      return {
        topicId: t.id,
        label: t.label,
        earned: tEarned,
        available: tAvailable,
        ratio: tAvailable > 0 ? tEarned / tAvailable : 0,
        itemIds: mine.map(i => i.itemId),
      }
    })
    .filter(t => t.available > 0)

  // ── Skills: an item's marks count in full toward each of its skills ───────
  const bySkill = new Map<string, { earned: number; available: number; itemIds: string[]; allFull: boolean }>()
  for (const i of items) {
    for (const skillId of i.skillIds) {
      const acc = bySkill.get(skillId) ?? { earned: 0, available: 0, itemIds: [], allFull: true }
      acc.earned += i.earned
      acc.available += i.available
      acc.itemIds.push(i.itemId)
      acc.allFull = acc.allFull && i.full
      bySkill.set(skillId, acc)
    }
  }

  const skills: SkillEvidence[] = [...bySkill.entries()]
    .map(([skillId, acc]) => ({
      skillId,
      label: skillLabel(skillId, set),
      earned: acc.earned,
      available: acc.available,
      marksLost: acc.available - acc.earned,
      fullMarks: acc.allFull,
      itemIds: acc.itemIds,
    }))
    // Worst first, then by how much the paper weighted it, then by id so the
    // order is stable — a sheet regenerated from the same marks must not
    // reshuffle.
    .sort((a, b) =>
      b.marksLost - a.marksLost ||
      b.available - a.available ||
      a.skillId.localeCompare(b.skillId))

  const assessed = new Set(bySkill.keys())
  const unassessedSkillIds = [...new Set(
    paper.questions
      .filter(q => !setIds.has(q.id))
      .flatMap(q => q.skillIds)
      .filter(id => !assessed.has(id)),
  )].sort()

  // ── What to practise: dropped items that have a retry question ───────────
  // retrySet only holds non-visual items — a question that depends on a diagram
  // in the original paper cannot be reissued as text — so a visual item simply
  // has no entry and contributes no suggestion.
  const practice: PracticeSuggestion[] = items
    .filter(i => !i.full && paper.retrySet[i.itemId])
    .map(i => ({
      itemId: i.itemId,
      itemLabel: i.label,
      skill: paper.retrySet[i.itemId].skill,
      question: paper.retrySet[i.itemId].question,
      marksLost: i.available - i.earned,
    }))
    .sort((a, b) => b.marksLost - a.marksLost || a.itemId.localeCompare(b.itemId))

  const strongTopics = new Set(
    topics.filter(t => t.ratio >= STRONG_TOPIC_RATIO).map(t => t.topicId),
  )
  const challenges: ChallengeSuggestion[] = paper.challengeQuestions
    .filter(c => strongTopics.has(c.topic))
    .map(c => ({ topicId: c.topic, skill: c.skill, question: c.question }))

  return {
    studentRef,
    earned,
    available,
    percentage: available > 0 ? Math.round((earned / available) * 100) : 0,
    coverage: {
      fullPaper: set.length === paper.questions.length,
      itemsAssessed: set.length,
      itemsOnPaper: paper.questions.length,
      marksAssessed: available,
      marksOnPaper: paper.questions.reduce((s, q) => s + q.marks, 0),
    },
    items,
    topics,
    skills,
    fullMarkSkills: skills.filter(s => s.fullMarks),
    droppedSkills: skills.filter(s => !s.fullMarks),
    unassessedSkillIds,
    practice,
    challenges,
  }
}

/**
 * The same, for a whole class in one call — the actual shape of the job, since
 * a teacher marks thirty papers and wants thirty sheets.
 *
 * Deliberately NOT a class analytics roll-up: common gaps across a class are a
 * different question with a different audience, and computeClassAnalytics
 * already answers it.
 */
export function buildClassEvidence(
  paper: PaperConfig,
  entries: { studentRef: string; marks: ItemMarks }[],
  selection?: ItemSelection,
): StudentEvidence[] {
  return entries.map(e => buildStudentEvidence(paper, e.marks, e.studentRef, selection))
}

/** Re-exported so a formatter can total a raw marks object without a second import. */
export { marksEarned }
