import type { ExamSlot } from './blueprint'
import { skillsById } from '../skills/skillGraph'
import { resolveQuestionMarks } from './markEvidence'

// ── Mini-exam assembler ──────────────────────────────────────────────────────
// Pure selection: given a pool of candidate questions and a blueprint, pick one
// question per slot, respecting the calculator constraint and a relaxation
// ladder so a paper always assembles even from a thin cell. Selection metadata
// is deliberately separated from rendering — `assembleExam` takes lightweight
// Candidates and returns ids; the caller renders the chosen full rows.

export type CalculatorMode = 'calc' | 'non_calc'

export type Candidate = {
  id: string
  difficulty: number
  calculator: 'calc' | 'non_calc' | 'na'
  kind: 'mastery' | 'exam'
  strand: string
  marks: number
  skillIds: string[]
  /** Several sub-questions on one stem — see MAX_MULTI_PART. */
  multiPart: boolean
}

/**
 * How many multi-part questions one paper may contain.
 *
 * Multi-part questions are the mark-heavy ones by construction (mean 3.56 marks
 * against 1.72 for single-part), and nothing else in the assembler notices a
 * question's SHAPE — it picks on difficulty, kind and strand. Today the pool is
 * only ~16% multi-part, so papers naturally land at 1-3 of 11 and this cap
 * rarely binds. It exists for when that changes: decomposing into parts is how
 * most real exam questions get captured, so the share will grow, and without a
 * brake papers would drift long (a 50% multi-part pool would routinely give 5-6
 * per paper and totals near 40 — a third over the ~30-minute target).
 *
 * There is a second reason beyond length: a multi-part question asks several
 * short questions about ONE stem, so a paper heavy in them covers fewer distinct
 * contexts than its question count suggests.
 *
 * 4 of 11 leaves the observed distribution almost untouched while capping the
 * tail that produced the heaviest papers.
 */
export const MAX_MULTI_PART = 4

export type AssembledExam = {
  questionIds: string[]
  totalMarks: number
}

/**
 * Calculator eligibility. The ONE hard rule: a `calc` question must never appear
 * on a non-calculator paper (the student couldn't compute it). A calculator
 * paper may include easier non-calc-style questions, so everything is eligible
 * there — matching real papers, and keeping the calc pool deep.
 */
function calcEligible(c: Candidate, mode: CalculatorMode): boolean {
  return mode === 'non_calc' ? c.calculator !== 'calc' : true
}

/**
 * Fill each blueprint slot from the candidate pool. Relaxation ladder per slot:
 *   1. exact band + preferred kind
 *   2. exact band, any kind
 *   3. adjacent band (±1), any kind
 *   4. any band
 * The calculator constraint is NEVER relaxed, and neither is MAX_MULTI_PART —
 * both hold at every rung. A slot that still can't be filled (pool exhausted) is
 * skipped, yielding a slightly shorter paper.
 *
 * `rng` is injectable for deterministic tests.
 */
export function assembleExam(
  candidates: Candidate[],
  blueprint: ExamSlot[],
  opts: {
    calculatorMode: CalculatorMode
    exclude?: Set<string>
    /**
     * Skills that disqualify a candidate from this paper. For a Foundation
     * paper this is the Higher-only skill set: any question touching one of
     * these is dropped, so Foundation stays within its curriculum. A Higher
     * paper passes nothing here (every Foundation question is also Higher).
     */
    blockedSkillIds?: Set<string>
    rng?: () => number
  },
): AssembledExam {
  const rng = opts.rng ?? Math.random
  const exclude = opts.exclude ?? new Set<string>()
  const blocked = opts.blockedSkillIds
  const pool = candidates.filter(c =>
    calcEligible(c, opts.calculatorMode) &&
    !exclude.has(c.id) &&
    (!blocked || c.skillIds.every(id => !blocked.has(id))),
  )

  const used = new Set<string>()
  const strandCount = new Map<string, number>()
  const picked: string[] = []
  let totalMarks = 0
  let multiPartCount = 0

  function tryPick(pred: (c: Candidate) => boolean): Candidate | null {
    // Once the paper holds its share of multi-part questions, they drop out of
    // every subsequent pick — including the relaxed ones, so the cap can't be
    // sidestepped by a slot that had to widen its search.
    const capped = multiPartCount >= MAX_MULTI_PART
    const cands = pool.filter(c => !used.has(c.id) && !(capped && c.multiPart) && pred(c))
    if (cands.length === 0) return null
    // Prefer the least-represented strand so far (cross-section coverage);
    // random tiebreak within the least-used strand.
    const minUsed = Math.min(...cands.map(c => strandCount.get(c.strand) ?? 0))
    const best = cands.filter(c => (strandCount.get(c.strand) ?? 0) === minUsed)
    return best[Math.floor(rng() * best.length)]
  }

  for (const slot of blueprint) {
    const { band } = slot
    let pick: Candidate | null = null
    if (slot.kind !== 'any') pick = tryPick(c => c.difficulty === band && c.kind === slot.kind)
    if (!pick) pick = tryPick(c => c.difficulty === band)
    if (!pick) pick = tryPick(c => Math.abs(c.difficulty - band) === 1)
    if (!pick) pick = tryPick(() => true)
    if (!pick) continue // pool exhausted — shorter paper

    used.add(pick.id)
    picked.push(pick.id)
    strandCount.set(pick.strand, (strandCount.get(pick.strand) ?? 0) + 1)
    if (pick.multiPart) multiPartCount++
    totalMarks += pick.marks
  }

  return { questionIds: picked, totalMarks }
}

/** The minimal shape of a question row the candidate builder reads. */
export type CandidateSource = {
  id: string
  skill_ids: string[]
  difficulty: number
  calculator: string | null
  kind: string | null
  /** Author's explicit exam marks; null = estimate from the coded papers. */
  marks?: number | null
  question_type: string
  parts: { marks: number }[] | null
}

/**
 * Build an assembler Candidate from a raw published-question row. Returns null
 * for questions the MVP exam runner can't present — currently multiple-choice
 * (the runner is typed-answer only).
 */
export function candidateOf(q: CandidateSource): Candidate | null {
  if (q.question_type === 'multiple_choice') return null
  // Multi-part questions are priced by their authored parts; everything else
  // goes through the evidence-based resolver (see lib/exam/markEvidence.ts).
  const multiPart = !!q.parts && q.parts.length > 0
  const marks = multiPart
    ? q.parts!.reduce((s, p) => s + (p.marks || 0), 0)
    : resolveQuestionMarks(q).marks
  return {
    id: q.id,
    multiPart,
    difficulty: q.difficulty,
    calculator: q.calculator === 'calc' || q.calculator === 'non_calc' ? q.calculator : 'na',
    kind: q.kind === 'exam' ? 'exam' : 'mastery',
    strand: skillsById[q.skill_ids?.[0]]?.topic ?? 'Other',
    marks,
    skillIds: q.skill_ids ?? [],
  }
}
