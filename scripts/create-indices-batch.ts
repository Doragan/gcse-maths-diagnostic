import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// Seventh content batch — `indices`, the heaviest skill left on the Phase 5
// thin list: 77 involvement marks across the 30 coded papers against TWO
// published questions (a bare a^b evaluation and a shared substitution item),
// and ZERO exam-kind coverage. Its best evidenced partner,
// `factors_and_multiples`, sits at 31 marks / one question, so one batch
// thickens two thin skills at once.
//
// ── CLOSURE CHECK, DONE BEFORE SCOPING (the batch-6 lesson) ──────────────────
//
//   indices                    <- simple_arithmetic
//   factors_and_multiples      <- simple_arithmetic
//   prime_factor_decomposition <- factors_and_multiples
//
// Neither partner is in `indices`'s ancestor closure and `indices` is in
// neither of theirs, so both pairings are graph-legal as `exam`. The obvious
// third candidate is BARRED: simplifying_indices lists `indices` as a direct
// prerequisite, so every "index laws" pairing would be mastery by the project
// rule. That is why neither exam-kind item below touches index laws.
//
// ── SEVERABILITY OF THE TWO EXAM ITEMS ──────────────────────────────────────
//
// Both use the REVERSE / CONSTRAINT shape (00-plan-of-attack.md Phase 5 step 1,
// the more reliable of the two working generators): the OUTPUT is given and an
// INPUT is asked for, so no intermediate exists that could be handed over.
//
//   square-multiplier — n is given ALREADY in index form, which is deliberate.
//   Handing the student a plain number to factorise first would make the item
//   severable in exactly the rejected way: reveal "360 = 2^3 x 3^2 x 5" and a
//   complete, standard single-skill indices question remains. Given the index
//   form there is nothing to reveal — reading the indices and knowing what an
//   even index means are the same act.
//
//   prime-cube-pair — reveal the factorisation and the question is not
//   simplified, it is over. What is left is not a single-skill question but no
//   question at all, which is the passing outcome of the test.
//
// ── EXAM EVIDENCE (data/exam-audit, 30 papers) ──────────────────────────────
//
//   powers-and-roots   JUN23-F-P1 q1b/q3c/q3d, JUN24-F-P1 q6a/b/c,
//                      JUN25-F-P1 q2d, NOV23-F-P1 q1a, NOV24-F-P1 q1a/b/c
//                      — 1 mark each, non-calc, app_supported: yes.
//                      Traps square_vs_double, root_vs_half, cube_vs_times3,
//                      multiply_base_by_index, negative_base_squared_kept_negative
//                      recur across four sittings and NONE is in the bank.
//   root-of-difference NOV23-F-P1 q18, 3 marks, non-calc, app: yes,
//                      traps [order_of_operations,
//                      root_of_a_difference_split_termwise].
//   square-multiplier  JUN23-F-P1 q21 and JUN23-H-P1 q7 (same item, both
//                      tiers), 3 marks, traps [give_the_power_not_the_index];
//                      JUN24-H-P3 q17a, 3 marks, kind=exam, app: yes,
//                      trap [prime_assignment_swap].
//   prime-cube-pair    NOV23-F-P3 q22 and NOV23-H-P3 q7, 3 marks each, calc,
//                      traps [reuse_the_same_prime, non_prime_used,
//                      cube_vs_multiply_by_three]. Both rows carry the coded
//                      skill_gap "no node for constrained construction with
//                      number properties", which is why the pairing is coded
//                      indices + factors_and_multiples rather than as pfd.
//
// ── MISCONCEPTIONS CHECKED AND NOT TRAPPED (do not retry) ───────────────────
//
//   reuse_the_same_prime on prime-cube-pair. Setting p = q gives p^4 = N, which
//   has no whole-number solution for any N in the draw set, so the student
//   never reaches a value they could submit. Blocker type 1 (no value at all),
//   not type 2 (unrepresentable) — there is nothing to widen a tolerance for.
//
//   cube_vs_multiply_by_three on prime-cube-pair. Reading p^3 as 3p turns the
//   equation into 3pq = N, so q = N/(3p) — non-integer on every draw. Same
//   blocker. The nearest reachable slip IS trapped: answering p^3 itself.
//
//   The second trap on the square-root part is the NEGATIVE root, not
//   "gave the square instead of the root". The evidenced give_the_square trap
//   (JUN25-F-P3 q9a) belongs to a "n^2 lies between X and Y" stem; here the
//   square is the number printed in the question, so copying it back is not a
//   slip a student actually makes. -sqrt(S) is evidenced separately
//   (JUN24-H-P1 q1, sign_error_negative_root) and is reachable here.
//
//   npx tsx scripts/create-indices-batch.ts --json batch.json
//   npx tsx scripts/verify-question.ts --file batch.json
//   npx tsx scripts/create-indices-batch.ts            # insert drafts
//   npx tsx scripts/create-indices-batch.ts --update <name>
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Rows this script owns, keyed by name; `--update <name>` rewrites one. */
const DRAFT_IDS: Record<string, string> = {
  'powers-and-roots-misconceptions': 'e5a4987d-4435-4070-b31d-60386f834b50',
  'root-of-a-difference-of-squares': 'c3c59e29-b5ca-41f6-805a-5469fa6ad2f8',
  'square-multiplier-from-index-form': '5bedc561-259d-4d22-a443-4ab78b0e4aa9',
  'prime-cube-factor-pair': '034f3789-97cb-4e41-8411-2da35525f352',
}

/**
 * A radical with a proper overline over its argument, the way a paper prints it.
 *
 * inline-block + a tight line-height is what makes the bar sit ON the digits: as
 * a plain inline span the border-top lands at the top of the inherited (1.6) line
 * box, floating clear of the glyphs. The negative left margin closes the gap the
 * √ glyph's own right side-bearing leaves between its arm and the bar.
 */
const rad = (inner: string) =>
  `√<span style="display:inline-block;border-top:1px solid currentColor;`
  + `line-height:1.15;padding:2px 3px 0 2px;margin-left:-2px">${inner}</span>`

// ── Q1: powers and roots, the recurring 1-mark misconception cluster ─────────
// Part (a) uses an index of 3 or more on every draw so that "multiplied the
// base by the index" and "used one index too few" are distinct values — at
// index 2 they collapse onto each other and one trap would be dead.
const IX_B = '[3,2,5,4,2,2][sel]'
const IX_I = '[4,5,3,3,6,7][sel]'
/** Perfect squares whose HALF is also whole, so the root_vs_half trap is a
 *  value a student would actually write rather than a stray decimal. */
const IX_S = '[64,144,196,256,324,400][sel]'
const IX_R = `Math.sqrt(${IX_S})`
/** Base of the (−n)² part; kept away from IX_B so the parts read as separate. */
const IX_N = '[6,9,7,11,8,12][sel]'

// ── Q2: root of a difference of two squares ─────────────────────────────────
// Pairs chosen so a² − b² is a perfect square AND even, which keeps the
// "halved instead of rooted" trap whole on every draw. All squares stay under
// 300 so the item is honestly non-calculator.
const RD_A = '[5,10,10,13,15,17][sel]'
const RD_B = '[3,8,6,5,9,15][sel]'
const RD_D = `(${RD_A}*${RD_A}-${RD_B}*${RD_B})`
const RD_ANS = `Math.sqrt(${RD_D})`

// ── Q3: smallest multiplier that makes an index-form number square ──────────
// Exactly TWO of the three indices are odd on every draw. That is a hard
// constraint, not a convenience:
//   - three odd indices would make the answer 2 x 3 x 5 = 30, colliding with
//     the "multiplied by every prime" trap, so a wrong method would score;
//   - one odd index would make the answer a single prime, colliding with
//     whichever "only fixed one of them" trap names that prime.
// With exactly two, the answer is always a product of two distinct primes and
// every partial-fix trap is guaranteed distinct from it.
const SQ_A = '[3,2,1,4,3,1][sel]'
const SQ_B = '[2,3,1,1,2,3][sel]'
const SQ_C = '[1,1,4,1,3,2][sel]'
/** Smallest prime carrying an odd index. If 2's index is odd it is 2; if not,
 *  the two odd indices must be 3's and 5's, so it is 3. */
const SQ_LO = `(${SQ_A}%2?2:3)`
/** Largest prime carrying an odd index, by the mirror argument. */
const SQ_HI = `(${SQ_C}%2?5:3)`
const SQ_K = `(${SQ_LO}*${SQ_HI})`
/** The one prime whose index is already even — the "fixed the wrong one" trap. */
const SQ_EVEN = `(${SQ_A}%2?(${SQ_B}%2?5:3):2)`
const SQ_N = `((2**${SQ_A})*(3**${SQ_B})*(5**${SQ_C}))`
const SQ_NK = `(${SQ_N}*${SQ_K})`
const SQ_ROOT = `Math.sqrt(${SQ_NK})`
/** Renders p^i the way a paper would — bare when the index is 1. */
const pw = (p: number, i: string) => `{{${i}>1?'${p}<sup>'+${i}+'</sup>':'${p}'}}`

// ── Q4: recover the un-cubed prime from p³ × q ──────────────────────────────
// No draw uses p = 3 or q = 3, so the "answered the index instead of the
// prime" trap (value 3) can never collide with the answer or with the
// "answered the cubed prime" trap.
const PC_P = '[2,2,2,2,5,7][sel]'
const PC_Q = '[7,5,11,13,2,2][sel]'
const PC_N = `((${PC_P}**3)*${PC_Q})`

type Trap = { answer_template: string; response: string; method_marks?: number }

type Part = {
  prompt: string
  skill_ids: string[]
  answer_template: string
  answer_type: 'numeric'
  tolerance: number | null
  marks: number
  kind: 'mastery' | 'exam'
  explanation: string
  traps: Trap[]
}

type Draft = {
  name: string
  skill_ids: string[]
  difficulty: number
  marks: number | null
  kind: 'mastery' | 'exam'
  calculator: 'calc' | 'non_calc' | 'na'
  question_template: string
  parameters?: Record<string, { type: 'integer'; min: number; max: number }>
  answer_template: string
  answer_type: 'numeric' | 'fraction' | 'expression'
  tolerance: number | null
  requires_simplest?: boolean
  traps: Trap[]
  explanation: string | null
  parts?: Part[]
}

const drafts: Draft[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: 'powers-and-roots-misconceptions',
    skill_ids: ['indices'],
    difficulty: 2,
    marks: null,
    kind: 'mastery',
    calculator: 'non_calc',
    question_template: `<p>Work out each of the following.</p>`,
    answer_template: '',
    answer_type: 'numeric',
    tolerance: null,
    traps: [],
    explanation: null,
    parts: [
      {
        prompt: `<p>(a) {{${IX_B}}}<sup>{{${IX_I}}}</sup></p>`,
        skill_ids: ['indices'],
        answer_type: 'numeric',
        tolerance: 0,
        marks: 1,
        kind: 'mastery',
        answer_template: `{{${IX_B}**${IX_I}}}`,
        explanation:
          `The index tells you how many times to MULTIPLY the base by itself, not what to multiply the base by.<br>`
          + `{{${IX_B}}}<sup>{{${IX_I}}}</sup> means {{${IX_B}}} multiplied by itself {{${IX_I}}} times = <strong>{{${IX_B}**${IX_I}}}</strong>.`,
        traps: [
          {
            answer_template: `{{${IX_B}*${IX_I}}}`,
            response:
              `That is {{${IX_B}}} × {{${IX_I}}}. The {{${IX_I}}} is an index, not something to multiply by: `
              + `{{${IX_B}}}<sup>{{${IX_I}}}</sup> = {{${IX_B}}} × {{${IX_B}}} × … , {{${IX_I}}} times over = <strong>{{${IX_B}**${IX_I}}}</strong>.`,
            // Every trap on a 1-mark part is necessarily worth 0 — the rule caps
            // method marks at (part marks − 1). Stated explicitly rather than
            // left unset, so exam scoring treats it as a known zero instead of
            // widening the uncertainty band.
            method_marks: 0,
          },
          {
            answer_template: `{{${IX_B}**(${IX_I}-1)}}`,
            response:
              `You stopped one {{${IX_B}}} short — that is {{${IX_B}}}<sup>{{${IX_I}-1}}</sup>. `
              + `Count the factors: {{${IX_I}}} of them, giving <strong>{{${IX_B}**${IX_I}}}</strong>.`,
            method_marks: 0,
          },
        ],
      },
      {
        prompt: `<p>(b) ${rad(`{{${IX_S}}}`)}</p>`,
        skill_ids: ['indices'],
        answer_type: 'numeric',
        tolerance: 0,
        marks: 1,
        kind: 'mastery',
        answer_template: `{{${IX_R}}}`,
        explanation:
          `A square root asks which number multiplied BY ITSELF gives {{${IX_S}}}.<br>`
          + `{{${IX_R}}} × {{${IX_R}}} = {{${IX_S}}}, so ${rad(`{{${IX_S}}}`)} = <strong>{{${IX_R}}}</strong>.`,
        traps: [
          {
            answer_template: `{{${IX_S}/2}}`,
            response:
              `You halved {{${IX_S}}}. Rooting is not halving — halving undoes doubling, rooting undoes squaring. `
              + `Look for the number that multiplies by itself to give {{${IX_S}}}: <strong>{{${IX_R}}}</strong>.`,
            method_marks: 0,
          },
          {
            answer_template: `{{-${IX_R}}}`,
            response:
              `(−{{${IX_R}}}) × (−{{${IX_R}}}) does give {{${IX_S}}}, so your reasoning is sound — but the √ sign means the POSITIVE `
              + `square root only. The answer here is <strong>{{${IX_R}}}</strong>. (Both signs are wanted only when you are solving x² = {{${IX_S}}}.)`,
            method_marks: 0,
          },
        ],
      },
      {
        prompt: `<p>(c) (−{{${IX_N}}})<sup>2</sup></p>`,
        skill_ids: ['indices'],
        answer_type: 'numeric',
        tolerance: 0,
        marks: 1,
        kind: 'mastery',
        answer_template: `{{${IX_N}*${IX_N}}}`,
        explanation:
          `The bracket means the whole of −{{${IX_N}}} is squared: (−{{${IX_N}}}) × (−{{${IX_N}}}).<br>`
          + `A negative times a negative is positive, so the answer is <strong>{{${IX_N}*${IX_N}}}</strong>.`,
        traps: [
          {
            answer_template: `{{-(${IX_N}*${IX_N})}}`,
            response:
              `A squared number can never be negative — anything multiplied by itself is positive, `
              + `because the two signs are always the same. (−{{${IX_N}}}) × (−{{${IX_N}}}) = <strong>{{${IX_N}*${IX_N}}}</strong>. `
              + `You would only get −{{${IX_N}*${IX_N}}} from −{{${IX_N}}}<sup>2</sup>, where the bracket is missing and only the {{${IX_N}}} is squared.`,
            method_marks: 0,
          },
          {
            answer_template: `{{2*${IX_N}}}`,
            response:
              `That is {{${IX_N}}} doubled. Squaring is multiplying by itself, not by 2: `
              + `(−{{${IX_N}}}) × (−{{${IX_N}}}) = <strong>{{${IX_N}*${IX_N}}}</strong>.`,
            method_marks: 0,
          },
          {
            answer_template: `{{-2*${IX_N}}}`,
            response:
              `Two slips at once: you doubled instead of squaring, and kept the minus sign. `
              + `Squaring means multiplying by itself, and two negatives give a positive: <strong>{{${IX_N}*${IX_N}}}</strong>.`,
            method_marks: 0,
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    name: 'root-of-a-difference-of-squares',
    skill_ids: ['indices'],
    difficulty: 3,
    marks: 3,
    kind: 'mastery',
    calculator: 'non_calc',
    question_template:
      `<p>Work out ${rad(`{{${RD_A}}}<sup>2</sup> − {{${RD_B}}}<sup>2</sup>`)}</p>`,
    answer_template: `{{${RD_ANS}}}`,
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // The evidenced star trap (root_of_a_difference_split_termwise): a root
        // does NOT distribute over a subtraction.
        answer_template: `{{${RD_A}-${RD_B}}}`,
        response:
          `You rooted each square separately: {{${RD_A}}} − {{${RD_B}}} = {{${RD_A}-${RD_B}}}. `
          + `A root cannot be split across a subtraction like that — check it: {{${RD_A}-${RD_B}}} × {{${RD_A}-${RD_B}}} = {{(${RD_A}-${RD_B})*(${RD_A}-${RD_B})}}, not {{${RD_D}}}.<br>`
          + `Work out the inside FIRST: {{${RD_A}*${RD_A}}} − {{${RD_B}*${RD_B}}} = {{${RD_D}}}, then ${rad(`{{${RD_D}}}`)} = <strong>{{${RD_ANS}}}</strong>.`,
        method_marks: 0,
      },
      {
        answer_template: `{{${RD_D}}}`,
        response:
          `That is the value INSIDE the root — you stopped one step early. `
          + `Now take the square root: ${rad(`{{${RD_D}}}`)} = <strong>{{${RD_ANS}}}</strong>.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${RD_D}/2}}`,
        response:
          `The subtraction is right ({{${RD_A}*${RD_A}}} − {{${RD_B}*${RD_B}}} = {{${RD_D}}}), but you then halved instead of rooting. `
          + `Rooting undoes squaring, not doubling: ${rad(`{{${RD_D}}}`)} = <strong>{{${RD_ANS}}}</strong>, because {{${RD_ANS}}} × {{${RD_ANS}}} = {{${RD_D}}}.`,
        method_marks: 2,
      },
    ],
    explanation:
      `Everything under the root is worked out first.<br>`
      + `{{${RD_A}}}<sup>2</sup> = {{${RD_A}*${RD_A}}} and {{${RD_B}}}<sup>2</sup> = {{${RD_B}*${RD_B}}}, so the inside is {{${RD_A}*${RD_A}}} − {{${RD_B}*${RD_B}}} = {{${RD_D}}}.<br>`
      + `Then ${rad(`{{${RD_D}}}`)} = <strong>{{${RD_ANS}}}</strong>, since {{${RD_ANS}}} × {{${RD_ANS}}} = {{${RD_D}}}.`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    name: 'square-multiplier-from-index-form',
    skill_ids: ['indices', 'prime_factor_decomposition'],
    difficulty: 5,
    marks: 3,
    kind: 'exam',
    calculator: 'non_calc',
    question_template:
      `<p><strong>n = ${pw(2, SQ_A)} × ${pw(3, SQ_B)} × ${pw(5, SQ_C)}</strong></p>`
      // "positive" is load-bearing, not padding: 0 is a square number (0 = 0²),
      // so "k is a whole number" would make k = 0 the honest smallest answer.
      + `<p>k is a positive whole number, and n × k is a square number.</p>`
      + `<p>Work out the smallest possible value of k.</p>`,
    answer_template: `{{${SQ_K}}}`,
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: `{{2*3*5}}`,
        response:
          `You gave every prime a partner. {{${SQ_EVEN}}} does not need one — its index is already even, `
          + `so multiplying by it would make that index ODD and break the square.<br>`
          + `Only {{${SQ_LO}}} and {{${SQ_HI}}} have odd indices, so k = {{${SQ_LO}}} × {{${SQ_HI}}} = <strong>{{${SQ_K}}}</strong>.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${SQ_LO}}}`,
        response:
          `You fixed the {{${SQ_LO}}} but left {{${SQ_HI}}} with an odd index, so n × {{${SQ_LO}}} is still not square. `
          + `Both odd indices have to be raised: k = {{${SQ_LO}}} × {{${SQ_HI}}} = <strong>{{${SQ_K}}}</strong>.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${SQ_HI}}}`,
        response:
          `You fixed the {{${SQ_HI}}} but left {{${SQ_LO}}} with an odd index, so n × {{${SQ_HI}}} is still not square. `
          + `Both odd indices have to be raised: k = {{${SQ_LO}}} × {{${SQ_HI}}} = <strong>{{${SQ_K}}}</strong>.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${SQ_EVEN}}}`,
        response:
          `{{${SQ_EVEN}}} is the one prime you should leave alone — its index is already even. `
          + `Multiplying by it makes that index odd. The odd indices belong to {{${SQ_LO}}} and {{${SQ_HI}}}, `
          + `so k = <strong>{{${SQ_K}}}</strong>.`,
        method_marks: 0,
      },
      {
        answer_template: `{{${SQ_NK}}}`,
        response:
          `That is n × k, the square number itself — the question asks for the multiplier k. `
          + `n × <strong>{{${SQ_K}}}</strong> = {{${SQ_NK}}} = {{${SQ_ROOT}}}<sup>2</sup>, so k = <strong>{{${SQ_K}}}</strong>.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${SQ_ROOT}}}`,
        response:
          `That is the number being squared: {{${SQ_ROOT}}}<sup>2</sup> = {{${SQ_NK}}} = n × k. `
          + `The question asks for k, the multiplier: <strong>{{${SQ_K}}}</strong>.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${SQ_K}*${SQ_K}}}`,
        response:
          `You squared each prime you needed. An odd index only has to go UP BY ONE to become even, `
          + `so one of each is enough: k = {{${SQ_LO}}} × {{${SQ_HI}}} = <strong>{{${SQ_K}}}</strong>. `
          + `Using {{${SQ_K}*${SQ_K}}} does give a square, but it is not the smallest.`,
        method_marks: 1,
      },
    ],
    explanation:
      `A number is a square exactly when every index in its prime factorisation is even.<br>`
      + `n = ${pw(2, SQ_A)} × ${pw(3, SQ_B)} × ${pw(5, SQ_C)}, so the odd indices belong to {{${SQ_LO}}} and {{${SQ_HI}}}; `
      + `{{${SQ_EVEN}}} is already even and must be left alone.<br>`
      + `Raising each odd index by one needs one more {{${SQ_LO}}} and one more {{${SQ_HI}}}, so k = {{${SQ_LO}}} × {{${SQ_HI}}} = <strong>{{${SQ_K}}}</strong>.<br>`
      + `Check: n × {{${SQ_K}}} = {{${SQ_NK}}} = {{${SQ_ROOT}}}<sup>2</sup>.`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    name: 'prime-cube-factor-pair',
    skill_ids: ['indices', 'factors_and_multiples'],
    difficulty: 4,
    marks: 3,
    kind: 'exam',
    calculator: 'calc',
    question_template:
      `<p>p and q are different prime numbers.</p>`
      + `<p><strong>p<sup>3</sup> × q = {{${PC_N}}}</strong></p>`
      + `<p>Work out the value of q.</p>`,
    answer_template: `{{${PC_Q}}}`,
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: `{{${PC_P}}}`,
        response:
          `You have the right pair of primes but the wrong way round. {{${PC_P}}} is the one that is CUBED: `
          + `{{${PC_P}}}<sup>3</sup> = {{${PC_P}**3}}, and {{${PC_P}**3}} × {{${PC_Q}}} = {{${PC_N}}}. So p = {{${PC_P}}} and q = <strong>{{${PC_Q}}}</strong>.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${PC_P}**3}}`,
        response:
          `{{${PC_P}**3}} is p<sup>3</sup>, not q — and it is not prime, so it cannot be q at all. `
          + `Split {{${PC_N}}} as {{${PC_P}**3}} × {{${PC_Q}}}; the part left over is q = <strong>{{${PC_Q}}}</strong>.`,
        method_marks: 2,
      },
      {
        answer_template: `{{3}}`,
        response:
          `3 is the INDEX, not a value. It tells you p appears three times; it is not one of the primes. `
          + `{{${PC_N}}} = {{${PC_P}}} × {{${PC_P}}} × {{${PC_P}}} × {{${PC_Q}}}, so q = <strong>{{${PC_Q}}}</strong>.`,
        method_marks: 0,
      },
      {
        answer_template: `{{${PC_N}/${PC_P}}}`,
        response:
          `You divided by {{${PC_P}}} once instead of three times. p<sup>3</sup> means THREE factors of {{${PC_P}}}: `
          + `{{${PC_N}}} ÷ {{${PC_P}}} ÷ {{${PC_P}}} ÷ {{${PC_P}}} = <strong>{{${PC_Q}}}</strong>. `
          + `({{${PC_N}/${PC_P}}} is not prime either, which is the giveaway.)`,
        method_marks: 1,
      },
      {
        answer_template: `{{${PC_P}*${PC_Q}}}`,
        response:
          `That is p × q. The question asks for q on its own, and {{${PC_P}*${PC_Q}}} is not prime. `
          + `Take out all three factors of {{${PC_P}}}: {{${PC_N}}} = {{${PC_P}**3}} × <strong>{{${PC_Q}}}</strong>.`,
        method_marks: 1,
      },
    ],
    explanation:
      `Break {{${PC_N}}} into prime factors: {{${PC_N}}} = {{${PC_P}}} × {{${PC_P}}} × {{${PC_P}}} × {{${PC_Q}}}.<br>`
      + `One prime appears three times — that is p<sup>3</sup>, so p = {{${PC_P}}} and {{${PC_P}}}<sup>3</sup> = {{${PC_P}**3}}.<br>`
      + `The prime left over is q: {{${PC_N}}} ÷ {{${PC_P}**3}} = <strong>{{${PC_Q}}}</strong>.`,
  },
]

function rowOf(q: Draft) {
  return {
    skill_ids: q.skill_ids,
    difficulty: q.difficulty,
    marks: q.marks,
    question_template: q.question_template,
    question_type: 'numeric',
    parameters: q.parameters ?? { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: q.answer_template,
    answer_type: q.answer_type,
    tolerance: q.tolerance,
    traps: q.traps,
    explanation: q.explanation,
    image: false,
    image_url: null,
    calculator: q.calculator,
    kind: q.kind,
    parts: q.parts
      ? q.parts.map(p => ({ ...p, requires_simplest: false }))
      : null,
    mc_options: null,
    requires_simplest: q.requires_simplest ?? false,
    is_published: false, // drafts — the user reviews and publishes
  }
}

/** `--update` must never flip a published question back to draft. */
function updateOf(q: Draft) {
  const { is_published: _ignored, ...rest } = rowOf(q)
  return rest
}

async function main() {
  const jsonIdx = process.argv.indexOf('--json')
  if (jsonIdx !== -1) {
    writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(drafts.map(rowOf), null, 1))
    console.log(`wrote ${drafts.length} question(s) to ${process.argv[jsonIdx + 1]}`)
    return
  }
  if (process.argv.includes('--dry-run')) { console.log(JSON.stringify(drafts.map(rowOf), null, 1)); return }

  if (process.argv.includes('--update')) {
    const only = process.argv[process.argv.indexOf('--update') + 1]
    const targets = only && !only.startsWith('--') ? drafts.filter(q => q.name === only) : drafts
    if (!targets.length) { console.error(`no question named "${only}" in this script`); process.exit(1) }
    if (targets.length > 1) console.log(`rewriting all ${targets.length} rows — pass --update <name> to target just one`)
    for (const q of targets) {
      const id = DRAFT_IDS[q.name]
      if (!id) { console.error(`no id recorded for "${q.name}" — insert it first`); process.exit(1) }
      const { error } = await supabase.from('questions').update(updateOf(q)).eq('id', id)
      if (error) { console.error(`update failed for ${q.name}:`, error); process.exit(1) }
      console.log(`  updated ${q.name}: ${id}`)
    }
    return
  }

  const fresh = drafts.filter(d => !DRAFT_IDS[d.name])
  if (!fresh.length) { console.log('all questions already exist — use --update <name>'); return }
  const { data, error } = await supabase.from('questions').insert(fresh.map(rowOf)).select('id')
  if (error) { console.error('insert failed:', error); process.exit(1) }
  console.log('Inserted as DRAFTS (is_published=false):')
  data!.forEach((r, i) => console.log(`  ${fresh[i].name}: ${r.id}`))
  console.log(`\nverify:  npx tsx scripts/verify-question.ts ${data!.map(r => r.id).join(' ')}`)
}

main()
