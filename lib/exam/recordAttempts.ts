/**
 * Collapse a submitted mini-exam into the practice_attempts rows it should
 * record — the bridge between the exam runner's per-UNIT grading and the
 * mastery engine's "one attempt per part" rule.
 *
 * Why grouping is needed: the runner flattens a question into units for
 * answering, and a `multi_blank` part becomes ONE unit per blank. The practice
 * rule is one attempt per PART, correct only if every blank is right — so the
 * blanks of a part must collapse back into a single attempt here, exactly as
 * the standalone practice flow records them. Otherwise a 3-blank part would
 * write three attempts and triple-count on the skill map.
 *
 * A part with no answered unit is a skip and is not recorded at all (a skip
 * must never penalise), matching practice and the projected-mastery panel.
 */

export type ExamUnit = {
  key: string          // `${questionId}:${partIndex}` or `${questionId}:${partIndex}:${blankIndex}`
  skillIds: string[]
  kind: 'mastery' | 'exam'
}

export type ExamUnitResult = {
  correct: boolean
  studentAnswer: string
}

export type ExamAttemptRow = {
  questionId: string
  skillIds: string[]
  kind: 'mastery' | 'exam'
  correct: boolean
}

/** `qid:part:blank` and `qid:part` both group under `qid:part`. */
function partKeyOf(unitKey: string): string {
  const [qid, part] = unitKey.split(':')
  return `${qid}:${part}`
}

export function groupExamAttempts(
  units: ExamUnit[],
  results: Record<string, ExamUnitResult | undefined>,
): ExamAttemptRow[] {
  // Preserve first-seen order so the emitted rows read stem-order.
  const order: string[] = []
  const groups = new Map<string, ExamUnit[]>()
  for (const u of units) {
    const gk = partKeyOf(u.key)
    if (!groups.has(gk)) { groups.set(gk, []); order.push(gk) }
    groups.get(gk)!.push(u)
  }

  const rows: ExamAttemptRow[] = []
  for (const gk of order) {
    const groupUnits = groups.get(gk)!
    const answered = groupUnits.some(u => (results[u.key]?.studentAnswer ?? '').trim() !== '')
    if (!answered) continue // a skipped part is never recorded

    const correct = groupUnits.every(u => results[u.key]?.correct === true)
    rows.push({
      questionId: gk.split(':')[0],
      skillIds: groupUnits[0].skillIds, // every unit of a part shares the part's skills
      kind: groupUnits[0].kind,
      correct,
    })
  }
  return rows
}
