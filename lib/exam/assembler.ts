import type { ExamBlueprint, DifficultyBand } from './blueprint'
import { skillsById } from '../skills/skillGraph'
import { resolveQuestionMarks } from './markEvidence'

// ── Mini-exam assembler ──────────────────────────────────────────────────────
// Pure selection: given a pool of candidate questions and a per-tier MARK
// BUDGET, spend that budget band by band. The question count is the free
// variable — as in real papers, which are a fixed 80 marks over however many
// questions that takes. Selection metadata is deliberately separated from
// rendering: `assembleExam` takes lightweight Candidates and returns ids; the
// caller renders the chosen full rows.

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
 * 4 leaves the observed distribution almost untouched while capping the tail
 * that produced the heaviest papers.
 */
export const MAX_MULTI_PART = 4

export type AssembledExam = {
  questionIds: string[]
  totalMarks: number
  /**
   * How far the paper fell short of its blueprint. Reported rather than hidden:
   * a relaxed pick used to be invisible, and with the Higher blueprint asking
   * for ~78% synthesis marks against a bank supplying ~15%, we need to SEE that
   * a paper missed its target rather than assume it was met. Drives content
   * priorities; surfaced in the teacher preview, never to students.
   */
  shortfall: {
    /** targetMarks − totalMarks (0 when the budget was met). */
    marks: number
    /** Per band, what its budget asked for and what it actually got. */
    bands: { band: DifficultyBand; wanted: number; got: number }[]
    /** Synthesis marks the blueprint preferred, minus what the pool supplied. */
    kind: number
  }
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
 * Spend the blueprint's mark budget, band by band in ascending difficulty (which
 * is what carries the ramp — real papers ramp difficulty, not marks-per-
 * question).
 *
 * Per band: budget = targetMarks × share, plus anything the previous bands left
 * unspent, so an under-filled easy band is made up later instead of silently
 * shortening the paper. Candidates are eligible only if they FIT the remaining
 * budget (within tolerance), which is what stops a 5-mark question landing in a
 * band with 1 mark left.
 *
 * Relaxation, per pick: preferred kind → any kind → adjacent band (±1). The
 * calculator constraint and MAX_MULTI_PART are NEVER relaxed — both hold at
 * every rung, so a widened search cannot sidestep them.
 *
 * Choice among eligible candidates stays RANDOM within the least-used strand,
 * deliberately not best-fit: best-fit would hit the target exactly and make
 * every paper nearly identical, destroying the structural variation a student
 * actually notices (parametric variation is already unlimited).
 *
 * `rng` is injectable for deterministic tests.
 */
export function assembleExam(
  candidates: Candidate[],
  blueprint: ExamBlueprint,
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
  const bandReport: { band: DifficultyBand; wanted: number; got: number }[] = []
  let kindWanted = 0
  let kindGot = 0

  function tryPick(pred: (c: Candidate) => boolean, remaining: number): Candidate | null {
    // Once the paper holds its share of multi-part questions they drop out of
    // every subsequent pick, including relaxed ones.
    const capped = multiPartCount >= MAX_MULTI_PART
    const cands = pool.filter(c =>
      !used.has(c.id) &&
      !(capped && c.multiPart) &&
      // Must fit what's left of the budget, or the paper overshoots its target.
      c.marks <= remaining + blueprint.tolerance &&
      pred(c),
    )
    if (cands.length === 0) return null
    // Prefer the least-represented strand so far (cross-section coverage);
    // random tiebreak within it.
    const minUsed = Math.min(...cands.map(c => strandCount.get(c.strand) ?? 0))
    const best = cands.filter(c => (strandCount.get(c.strand) ?? 0) === minUsed)
    return best[Math.floor(rng() * best.length)]
  }

  let carry = 0
  for (const bandSpec of blueprint.bands) {
    const { band, preferKind } = bandSpec
    const wanted = blueprint.targetMarks * bandSpec.share
    let budget = wanted + carry
    let spent = 0
    if (preferKind && preferKind !== 'any') kindWanted += wanted

    // Keep buying from this band until the budget is (near enough) spent or
    // nothing affordable is left.
    for (;;) {
      const remaining = budget - spent
      if (remaining <= blueprint.tolerance) break

      let pick: Candidate | null = null
      if (preferKind && preferKind !== 'any') {
        pick = tryPick(c => c.difficulty === band && c.kind === preferKind, remaining)
      }
      if (!pick) pick = tryPick(c => c.difficulty === band, remaining)
      if (!pick) pick = tryPick(c => Math.abs(c.difficulty - band) === 1, remaining)
      if (!pick) break // nothing affordable — carry the shortfall onward

      used.add(pick.id)
      picked.push(pick.id)
      strandCount.set(pick.strand, (strandCount.get(pick.strand) ?? 0) + 1)
      if (pick.multiPart) multiPartCount++
      if (pick.kind === 'exam') kindGot += pick.marks
      spent += pick.marks
      totalMarks += pick.marks
    }

    bandReport.push({ band, wanted: Math.round(wanted * 10) / 10, got: spent })
    // Unspent budget rolls forward; overspend (a pick inside tolerance) is
    // deducted from the next band so the paper still lands on target.
    carry = budget - spent
  }

  return {
    questionIds: picked,
    totalMarks,
    shortfall: {
      marks: Math.max(0, Math.round((blueprint.targetMarks - totalMarks) * 10) / 10),
      bands: bandReport,
      kind: Math.max(0, Math.round((kindWanted - kindGot) * 10) / 10),
    },
  }
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
