import type { ExamSlot } from './blueprint'
import { NOMINAL_MARKS } from './blueprint'
import { skillsById } from '../skills/skillGraph'

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
}

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
 * The calculator constraint is NEVER relaxed. A slot that still can't be filled
 * (pool exhausted) is skipped, yielding a slightly shorter paper.
 *
 * `rng` is injectable for deterministic tests.
 */
export function assembleExam(
  candidates: Candidate[],
  blueprint: ExamSlot[],
  opts: { calculatorMode: CalculatorMode; exclude?: Set<string>; rng?: () => number },
): AssembledExam {
  const rng = opts.rng ?? Math.random
  const exclude = opts.exclude ?? new Set<string>()
  const pool = candidates.filter(c => calcEligible(c, opts.calculatorMode) && !exclude.has(c.id))

  const used = new Set<string>()
  const strandCount = new Map<string, number>()
  const picked: string[] = []
  let totalMarks = 0

  function tryPick(pred: (c: Candidate) => boolean): Candidate | null {
    const cands = pool.filter(c => !used.has(c.id) && pred(c))
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
  const marks = q.parts && q.parts.length > 0
    ? q.parts.reduce((s, p) => s + (p.marks || 0), 0)
    : (NOMINAL_MARKS[q.difficulty] ?? 1)
  return {
    id: q.id,
    difficulty: q.difficulty,
    calculator: q.calculator === 'calc' || q.calculator === 'non_calc' ? q.calculator : 'na',
    kind: q.kind === 'exam' ? 'exam' : 'mastery',
    strand: skillsById[q.skill_ids?.[0]]?.topic ?? 'Other',
    marks,
  }
}
