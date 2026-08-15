import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// Fifth synthesis batch — pie_charts, forming_expressions_and_formulae and
// simplifying_indices, the three heaviest skills left at ZERO exam-kind
// coverage that actually have an EVIDENCED independent pairing.
//
// That last clause did the choosing. `tree_diagrams` (9 primary marks) and
// `venn_diagrams` (8) rank above two of these, but every coded row pairs them
// only with a prerequisite — combined_events and calculating_simple_probability
// respectively — so they are mastery by the project's rule, exactly as
// growth_and_decay turned out to be. They are also substantially app-blocked
// (tree-branch entry, Venn region shading). Skipped deliberately, not missed.
//
//   pie_charts + mean            JUN24-F-P3 q25 and JUN24-H-P3 q8, 4 marks
//                                each, both kind=exam, both app_supported: yes
//   forming_expressions + solving_quadratic_equations_factorising
//                                JUN24-H-P1 q24a, 5 marks, "M1 A1 M1 A1ft A1",
//                                traps quadratic_factor_error / wrong_root_choice
//   simplifying_indices + simplifying_expressions
//                                NOV24-H-P2 q11 and JUN24-F-P3 q15, 3 marks,
//                                previously blocked only on "expression answers
//                                need an equivalence checker" — now shipped
//
//   npx tsx scripts/create-data-algebra-synthesis.ts --json batch.json
//   npx tsx scripts/verify-question.ts --file batch.json --svg
//   npx tsx scripts/create-data-algebra-synthesis.ts            # insert drafts
//   npx tsx scripts/create-data-algebra-synthesis.ts --update <name>
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Rows this script owns, keyed by name; `--update <name>` rewrites one. */
const DRAFT_IDS: Record<string, string> = {
  'pie-chart-to-mean': 'd8acb8e5-8a31-4bd9-8b85-518cdf80c14b',
  'rectangle-area-quadratic-perimeter': '10701833-9c55-4965-b521-b59b32155fa3',
  'index-laws-with-coefficients': '312f85ed-65be-470a-b32a-9b66c9649189',
}

// ── P1: pie chart of "children per family", find the MEAN ────────────────────
//
// Angles are stored as TWELFTHS (b, summing to 12) so every sector is a whole
// number of 30° steps and the chart is readable. Frequency = b × N/12, and N is
// always a multiple of 12, so every frequency is a whole number of families.
//
// The mean is Σ(value × b) / 12 — independent of N, which is why a student who
// works from the ANGLES rather than the frequencies still gets it right. That
// is legitimate, so there is deliberately no trap for it.
const P1_B1 = '[3,3,2,4,1,4][sel]'
const P1_B2 = '[4,2,2,3,2,5][sel]'
const P1_B3 = '[1,2,2,3,2,2][sel]'
const P1_B4 = '[4,5,6,2,7,1][sel]'
const P1_N = '[60,48,72,36,24,84][sel]'
/** Σ(value × twelfths) with values 0,1,2,3 — the mean is this over 12. */
const P1_SUM = `(${P1_B2}+2*${P1_B3}+3*${P1_B4})`
const P1_MEAN = `(${P1_SUM}/12)`
/** Total children = mean × N. */
const P1_TOTAL = `(${P1_SUM}*${P1_N}/12)`
const P1_A = [P1_B1, P1_B2, P1_B3, P1_B4].map(b => `(30*${b})`)
/** Cumulative angle at each sector boundary, clockwise from 12 o'clock. */
const P1_C = [
  '0',
  P1_A[0],
  `(${P1_A[0]}+${P1_A[1]})`,
  `(${P1_A[0]}+${P1_A[1]}+${P1_A[2]})`,
  '360',
]
const CX = 150, CY = 130, R = 96
const ptx = (ang: string, r: number) => `{{round(${CX}+${r}*Math.sin((${ang})*Math.PI/180), 2)}}`
const pty = (ang: string, r: number) => `{{round(${CY}-${r}*Math.cos((${ang})*Math.PI/180), 2)}}`
const FILLS = ['#dbeafe', '#bfdbfe', '#93c5fd', '#e0e7ff']
const sector = (i: number) => {
  const from = P1_C[i], to = P1_C[i + 1]
  const mid = `((${from}+${to})/2)`
  return `<path d="M ${CX} ${CY} L ${ptx(from, R)} ${pty(from, R)} `
    + `A ${R} ${R} 0 {{(${to})-(${from})>180?1:0}} 1 ${ptx(to, R)} ${pty(to, R)} Z" `
    + `fill="${FILLS[i]}" stroke="#374151" stroke-width="1.5"/>`
    + `<text x="${ptx(mid, 58)}" y="${pty(mid, 58)}" font-size="13" fill="#1f2937" `
    + `text-anchor="middle" dominant-baseline="middle">{{${P1_A[i]}}}°</text>`
    + `<text x="${ptx(mid, 118)}" y="${pty(mid, 118)}" font-size="12" fill="currentColor" `
    + `text-anchor="middle" dominant-baseline="middle">${i} child${i === 1 ? '' : 'ren'}</text>`
}

// ── P2: rectangle with algebraic sides, area given → find the perimeter ──────
//
// Sides (x + a) and (x − b) with area A, so x² + (a−b)x − (ab+A) = 0. Built
// backwards from the intended root r, which guarantees it factorises over the
// integers: the roots are r and −(r + a − b), the second always negative, so
// "which root?" is a real decision rather than a formality.
const P2_A = '[3,2,5,1,6,3][sel]'
const P2_B = '[1,3,2,4,2,2][sel]'
const P2_R = '[5,7,4,9,5,10][sel]'
const P2_LEN = `(${P2_R}+${P2_A})`
const P2_WID = `(${P2_R}-${P2_B})`
const P2_AREA = `(${P2_LEN}*${P2_WID})`
const P2_PERIM = `(2*(${P2_LEN}+${P2_WID}))`
/** The rejected root, always negative. */
const P2_OTHER = `(-(${P2_R}+${P2_A}-${P2_B}))`
/** Coefficient of x in x² + px + …, which is negative when a < b. */
const P2_P = `(${P2_A}-${P2_B})`
/**
 * That coefficient rendered with its own sign — "+ 2" or "− 3".
 *
 * Written out rather than left to cleanExpression: the surrounding constant
 * term uses a U+2212 minus, and an ASCII hyphen from a bare negative number
 * would sit beside it as "x² - x − 6", two different dashes in one line.
 */
const P2_SIGNED = `{{${P2_P} >= 0 ? '+ ' + (${P2_P}) : '− ' + (-(${P2_P}))}}`

// ── P3: index laws to reach one term, THEN collect it with a given like term.
//
// REVISED after review: the original version was one algebraic fraction with
// no additive structure at all, which meant simplifying_expressions (whose own
// canonical example is "3x + 5 − x + 2y" — collecting like terms) never did
// any real work; simplifying_indices alone accounted for the entire answer.
// Confirmed empirically before rebuilding, not assumed: the grader's
// expressionMatch is a REORDER equivalence only — "5x^6+3x^6" does NOT grade
// as equal to "8x^6" — so appending a like term that must be combined is a
// genuine, separately-gradable second skill, not just decoration.
//
// {{P}}x^I × {{Q}}x^J) ÷ {{R}}x^K  +  {{S}}x^IDX
//                                        ^^^^^^ same power as the correctly
//                                        simplified first part BY CONSTRUCTION
// The two terms are like terms once (and only once) the index-law part is
// done correctly, so the student must actually notice that and add the
// coefficients — the collecting-like-terms step is load-bearing, not
// cosmetic. Both simplifying_indices|exam and simplifying_expressions|exam
// are independently evidenced at exactly 3 marks in the coded series
// (n=3/5, mean=3, min=max=3), which is additional support for this shape.
const P3_P = '[6,10,12,15,8,20][sel]'
const P3_Q = '[4,3,2,4,9,3][sel]'
const P3_R = '[8,5,6,10,12,15][sel]'
const P3_I = '[5,4,7,3,6,5][sel]'
const P3_J = '[3,6,2,5,2,4][sel]'
const P3_K = '[2,3,4,2,3,6][sel]'
/** Coefficient of the given extra term. Chosen (scratchpad search) so the
 * three single-term outcomes below — answer, trap D, trap F — never coincide
 * on any draw, and never equals COEF (which would make trap E's two terms
 * look identical, muddying the "these are different numbers" point). */
const P3_S = '[5,4,7,3,8,6][sel]'
const P3_COEF = `(${P3_P}*${P3_Q}/${P3_R})`
const P3_IDX = `(${P3_I}+${P3_J}-${P3_K})`
const P3_ANSWER_COEF = `(${P3_COEF}+${P3_S})`
/** Undivided coefficient — the value a student gets by never applying ÷R. */
const P3_COEF_UNDIV = `(${P3_P}*${P3_Q})`
/** Bracket combined by multiplying instead of adding: I×J, correctly then −K. */
const P3_IDX_MULT_BRACKET = `(${P3_I}*${P3_J}-${P3_K})`
/** Bracket combined by adding correctly, but the outer ÷R never applied. */
const P3_IDX_NO_DIVIDE = `(${P3_I}+${P3_J})`
/**
 * Multiply the bracket indices (should ADD), then literally DIVIDE the result
 * by the outer index (should SUBTRACT) — "do to the exponent whatever
 * operation joins the terms", rather than apply the index laws.
 *
 * Non-terminating on some draws (20÷6), so rounded to 2 dp for display — a
 * calculator division a student would actually copy down, not a policy this
 * question is trying to teach.
 */
const P3_IDX_LITERAL_DIVIDE = `round(${P3_I}*${P3_J}/${P3_K}, 2)`

type Draft = {
  name: string
  skill_ids: string[]
  difficulty: number
  marks: number
  calculator: 'calc' | 'non_calc' | 'na'
  question_template: string
  answer_template: string
  answer_type: 'numeric' | 'exact' | 'expression'
  tolerance: number | null
  traps: { answer_template: string; response: string; method_marks?: number }[]
  explanation: string
}

const drafts: Draft[] = [
  {
    name: 'pie-chart-to-mean',
    skill_ids: ['pie_charts', 'mean'],
    difficulty: 4,
    marks: 4,
    calculator: 'calc',
    question_template:
      `<p>{{${P1_N}}} families were asked how many children they have.</p>`
      + `<p>The pie chart shows the results.</p>`
      + `<svg viewBox="0 0 300 275" width="100%" style="max-width:300px;height:auto;">`
      + [0, 1, 2, 3].map(sector).join('')
      + `</svg>`
      + `<p>Work out the <strong>mean</strong> number of children per family.</p>`,
    answer_template: `{{${P1_MEAN}}}`,
    answer_type: 'numeric',
    tolerance: 0.001,
    explanation:
      `Each sector's angle is that share of the {{${P1_N}}} families, so divide by 360 and multiply by {{${P1_N}}}:<br>`
      + `0 children: {{${P1_A[0]}}}° → {{${P1_A[0]}}} ÷ 360 × {{${P1_N}}} = <strong>{{${P1_B1}*${P1_N}/12}}</strong> families<br>`
      + `1 child: {{${P1_A[1]}}}° → <strong>{{${P1_B2}*${P1_N}/12}}</strong> families<br>`
      + `2 children: {{${P1_A[2]}}}° → <strong>{{${P1_B3}*${P1_N}/12}}</strong> families<br>`
      + `3 children: {{${P1_A[3]}}}° → <strong>{{${P1_B4}*${P1_N}/12}}</strong> families<br>`
      + `Total children = 0×{{${P1_B1}*${P1_N}/12}} + 1×{{${P1_B2}*${P1_N}/12}} + 2×{{${P1_B3}*${P1_N}/12}} + 3×{{${P1_B4}*${P1_N}/12}} = <strong>{{${P1_TOTAL}}}</strong>.<br>`
      + `Mean = total children ÷ number of families = {{${P1_TOTAL}}} ÷ {{${P1_N}}} = <strong>{{${P1_MEAN}}}</strong>.`,
    traps: [
      {
        answer_template: `{{${P1_TOTAL}}}`,
        response: `That is the total number of children, which is the right first step. The mean shares them out over the families: {{${P1_TOTAL}}} ÷ {{${P1_N}}} = {{${P1_MEAN}}}.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${P1_TOTAL}/4}}`,
        response: `You divided by 4 — the number of <em>sectors</em>. The mean is per <strong>family</strong>, and there are {{${P1_N}}} of them: {{${P1_TOTAL}}} ÷ {{${P1_N}}} = {{${P1_MEAN}}}.`,
        method_marks: 2,
      },
      {
        // Values read as 1,2,3,4 — the empty "0 children" sector still counted
        // as one child each, which shifts the mean by exactly 1.
        answer_template: `{{${P1_MEAN}+1}}`,
        response: `Check the first sector: those {{${P1_B1}*${P1_N}/12}} families have <strong>0</strong> children, not 1, so they contribute nothing to the total. That makes the total {{${P1_TOTAL}}} and the mean {{${P1_MEAN}}}.`,
        method_marks: 2,
      },
    ],
  },
  {
    name: 'rectangle-area-quadratic-perimeter',
    skill_ids: ['forming_expressions_and_formulae', 'solving_quadratic_equations_factorising'],
    difficulty: 5,
    marks: 5,
    calculator: 'non_calc',
    question_template:
      `<p>A rectangle has length <strong>(x + {{${P2_A}}}) cm</strong> and width <strong>(x − {{${P2_B}}}) cm</strong>.</p>`
      + `<p>The area of the rectangle is <strong>{{${P2_AREA}}} cm²</strong>.</p>`
      + `<p>Work out the <strong>perimeter</strong> of the rectangle.</p>`
      + `<p>Give your answer in centimetres.</p>`,
    answer_template: `{{${P2_PERIM}}}`,
    answer_type: 'numeric',
    tolerance: 0,
    explanation:
      `Area = length × width, so (x + {{${P2_A}}})(x − {{${P2_B}}}) = {{${P2_AREA}}}.<br>`
      + `Expanding: x² ${P2_SIGNED}x − {{${P2_A}*${P2_B}}} = {{${P2_AREA}}}, so x² ${P2_SIGNED}x − {{${P2_A}*${P2_B}+${P2_AREA}}} = 0.<br>`
      + `This factorises as (x − {{${P2_R}}})(x + {{${P2_R}+${P2_A}-${P2_B}}}) = 0, so x = {{${P2_R}}} or x = {{${P2_OTHER}}}.<br>`
      + `A width of x − {{${P2_B}}} must be positive, so x = <strong>{{${P2_R}}}</strong>.<br>`
      + `Length = {{${P2_LEN}}} cm, width = {{${P2_WID}}} cm, so the perimeter = 2 × ({{${P2_LEN}}} + {{${P2_WID}}}) = <strong>{{${P2_PERIM}}} cm</strong>.`,
    traps: [
      {
        answer_template: `{{${P2_R}}}`,
        response: `That is x, which is the hard part done. The question asks for the perimeter: the sides are {{${P2_LEN}}} cm and {{${P2_WID}}} cm, so it is 2 × ({{${P2_LEN}}} + {{${P2_WID}}}) = {{${P2_PERIM}}} cm.`,
        method_marks: 4,
      },
      {
        answer_template: `{{${P2_LEN}+${P2_WID}}}`,
        response: `That is length + width — half the way round. A perimeter goes round all four sides: 2 × ({{${P2_LEN}}} + {{${P2_WID}}}) = {{${P2_PERIM}}} cm.`,
        method_marks: 4,
      },
      {
        answer_template: `{{${P2_OTHER}}}`,
        response: `That is the other root of the quadratic. Both roots solve the equation, but a width of x − {{${P2_B}}} would be negative if x = {{${P2_OTHER}}}, so only x = {{${P2_R}}} describes a real rectangle — giving a perimeter of {{${P2_PERIM}}} cm.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${P2_AREA}}}`,
        response: `That is the area you were given. The perimeter is the distance round the outside: with sides {{${P2_LEN}}} cm and {{${P2_WID}}} cm that is 2 × ({{${P2_LEN}}} + {{${P2_WID}}}) = {{${P2_PERIM}}} cm.`,
        method_marks: 0,
      },
    ],
  },
  {
    name: 'index-laws-with-coefficients',
    skill_ids: ['simplifying_indices', 'simplifying_expressions'],
    difficulty: 4,
    marks: 3,
    calculator: 'na',
    question_template:
      `<p>Simplify fully:</p>`
      + `<p style="font-size:1.15em;">`
      + `({{${P3_P}}}x<sup>{{${P3_I}}}</sup> × {{${P3_Q}}}x<sup>{{${P3_J}}}</sup>) ÷ {{${P3_R}}}x<sup>{{${P3_K}}}</sup>  +  {{${P3_S}}}x<sup>{{${P3_IDX}}}</sup>`
      + `</p>`,
    answer_template: `{{${P3_ANSWER_COEF}}}x^{{${P3_IDX}}}`,
    answer_type: 'expression',
    tolerance: null,
    explanation:
      `First simplify the bracket using index laws — deal with the numbers and the powers separately.<br>`
      + `<strong>Numbers:</strong> {{${P3_P}}} × {{${P3_Q}}} ÷ {{${P3_R}}} = {{${P3_P}*${P3_Q}}} ÷ {{${P3_R}}} = <strong>{{${P3_COEF}}}</strong>.<br>`
      + `<strong>Powers:</strong> multiplying <em>adds</em> the indices and dividing <em>subtracts</em> them: {{${P3_I}}} + {{${P3_J}}} − {{${P3_K}}} = <strong>{{${P3_IDX}}}</strong>.<br>`
      + `So the bracket simplifies to {{${P3_COEF}}}x<sup>{{${P3_IDX}}}</sup>.<br>`
      + `That is now <strong>{{${P3_COEF}}}x<sup>{{${P3_IDX}}}</sup> + {{${P3_S}}}x<sup>{{${P3_IDX}}}</sup></strong> — the same power, {{${P3_IDX}}}, on both terms, so they are <strong>like terms</strong> and can be collected by adding the coefficients: {{${P3_COEF}}} + {{${P3_S}}} = <strong>{{${P3_ANSWER_COEF}}}</strong>.<br>`
      + `So the answer is <strong>{{${P3_ANSWER_COEF}}}x<sup>{{${P3_IDX}}}</sup></strong>.`,
    traps: [
      {
        // Index-law error (forgot ÷): the resulting power (I+J) does not
        // match the given term's power (IDX), so — done honestly — they are
        // NOT like terms and stay as two separate terms.
        answer_template: `{{${P3_COEF}}}x^{{${P3_IDX_NO_DIVIDE}}} + {{${P3_S}}}x^{{${P3_IDX}}}`,
        response: `The number is right, but the division has not been applied to the power. Dividing by x<sup>{{${P3_K}}}</sup> <em>subtracts</em> {{${P3_K}}}: {{${P3_I}}} + {{${P3_J}}} − {{${P3_K}}} = {{${P3_IDX}}}, giving {{${P3_COEF}}}x<sup>{{${P3_IDX}}}</sup> — which now matches the given {{${P3_S}}}x<sup>{{${P3_IDX}}}</sup> and can be collected: {{${P3_ANSWER_COEF}}}x<sup>{{${P3_IDX}}}</sup>.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${P3_COEF}}}x^{{${P3_IDX_MULT_BRACKET}}} + {{${P3_S}}}x^{{${P3_IDX}}}`,
        response: `You multiplied the indices. x<sup>{{${P3_I}}}</sup> means {{${P3_I}}} x's multiplied together and x<sup>{{${P3_J}}}</sup> means {{${P3_J}}}, so multiplying them gives {{${P3_I}}} + {{${P3_J}}} = {{${P3_I}+${P3_J}}} x's in total — the indices <strong>add</strong>. Then subtract the {{${P3_K}}} you are dividing by: {{${P3_IDX}}}, giving {{${P3_COEF}}}x<sup>{{${P3_IDX}}}</sup> — the same power as the given term, so collect them: {{${P3_ANSWER_COEF}}}x<sup>{{${P3_IDX}}}</sup>.`,
        method_marks: 1,
      },
      {
        // Coefficient error only: the POWER is still correct (IDX), so the
        // student's (wrong) first term genuinely IS a like term with the
        // given one — done honestly, they combine, just from a wrong start.
        answer_template: `{{${P3_COEF_UNDIV}+${P3_S}}}x^{{${P3_IDX}}}`,
        response: `The power is right, but the number still has to be divided by {{${P3_R}}}: {{${P3_P}}} × {{${P3_Q}}} ÷ {{${P3_R}}} = {{${P3_COEF}}}, not {{${P3_COEF_UNDIV}}}. That makes the bracket {{${P3_COEF}}}x<sup>{{${P3_IDX}}}</sup>, which collects with the given term to {{${P3_ANSWER_COEF}}}x<sup>{{${P3_IDX}}}</sup>.`,
        method_marks: 2,
      },
      {
        // Multiplied the bracket AND applied ÷ literally to the exponent
        // instead of subtracting. Power wrong, so left uncombined.
        answer_template: `{{${P3_COEF}}}x^{{${P3_IDX_LITERAL_DIVIDE}}} + {{${P3_S}}}x^{{${P3_IDX}}}`,
        response: `Two mistakes in the power. First, x<sup>{{${P3_I}}}</sup> × x<sup>{{${P3_J}}}</sup> means the indices <strong>add</strong>, not multiply: {{${P3_I}}} + {{${P3_J}}} = {{${P3_I}+${P3_J}}}. Second, dividing by x<sup>{{${P3_K}}}</sup> means <strong>subtract</strong> {{${P3_K}}} from the index — it does not mean divide the index itself by {{${P3_K}}}. The correct power is {{${P3_IDX}}}, which matches the given term: {{${P3_ANSWER_COEF}}}x<sup>{{${P3_IDX}}}</sup>.`,
        method_marks: 1,
      },
      {
        // The distinctly simplifying_expressions error: the index-law part
        // is entirely correct, but the like terms were never collected.
        answer_template: `{{${P3_COEF}}}x^{{${P3_IDX}}} + {{${P3_S}}}x^{{${P3_IDX}}}`,
        response: `The bracket is simplified correctly — {{${P3_COEF}}}x<sup>{{${P3_IDX}}}</sup> — but that is not fully simplified yet. It has the <strong>same power</strong> as the {{${P3_S}}}x<sup>{{${P3_IDX}}}</sup> you were given, so they are like terms: add the coefficients, {{${P3_COEF}}} + {{${P3_S}}} = {{${P3_ANSWER_COEF}}}, to get one term: {{${P3_ANSWER_COEF}}}x<sup>{{${P3_IDX}}}</sup>.`,
        method_marks: 2,
      },
      {
        // Also distinctly simplifying_expressions: recognised the terms as
        // "the same x thing" but combined them the way you combine POWERS
        // (multiply) rather than the way you combine LIKE TERMS (add) —
        // carrying the multiplicative habit from index laws into the wrong
        // place.
        answer_template: `{{${P3_COEF}*${P3_S}}}x^{{${P3_IDX}}}`,
        response: `The bracket is simplified correctly — {{${P3_COEF}}}x<sup>{{${P3_IDX}}}</sup> — and it does have the same power as {{${P3_S}}}x<sup>{{${P3_IDX}}}</sup>, so they are like terms. But collecting like terms means <strong>adding</strong> the coefficients, not multiplying: {{${P3_COEF}}} + {{${P3_S}}} = {{${P3_ANSWER_COEF}}}, giving {{${P3_ANSWER_COEF}}}x<sup>{{${P3_IDX}}}</sup>. (Multiplying the coefficients is what you'd do for x<sup>{{${P3_IDX}}}</sup> × x<sup>{{${P3_IDX}}}</sup> — a different operation from x<sup>{{${P3_IDX}}}</sup> + x<sup>{{${P3_IDX}}}</sup>.)`,
        method_marks: 2,
      },
    ],
  },
]

function rowOf(q: Draft) {
  return {
    skill_ids: q.skill_ids,
    difficulty: q.difficulty,
    marks: q.marks,
    question_template: q.question_template,
    question_type: 'numeric',
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: q.answer_template,
    answer_type: q.answer_type,
    tolerance: q.tolerance,
    traps: q.traps,
    explanation: q.explanation,
    image: false,
    image_url: null,
    calculator: q.calculator,
    kind: 'exam',
    parts: null,
    mc_options: null,
    requires_simplest: false,
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
  console.log(`\nverify:  npx tsx scripts/verify-question.ts ${data!.map(r => r.id).join(' ')} --svg`)
}

main()
