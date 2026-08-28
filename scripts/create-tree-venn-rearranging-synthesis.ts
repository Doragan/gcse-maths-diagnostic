import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// Sixth synthesis batch — rearranging_formulae, tree_diagrams and venn_diagrams,
// the next three skills in the Phase 5 queue after pie_charts /
// forming_expressions_and_formulae / simplifying_indices.
//
// ── WHY THE TREE/VENN ITEMS LOOK NOTHING LIKE THE EARLIER BATCHES ────────────
//
// These two were first authored as DECISION-FRAMED items, the pattern batch 1
// established and 00-plan-of-attack.md still describes approvingly: compare two
// options, then compute on the winner. The user rejected that shape on review,
// and the objection is worth recording because it generalises:
//
//   A decision-framed item is SEVERABLE. Tell the student the intermediate
//   ("use School Y") and what remains is a complete, standard, single-skill
//   question. The two halves never touch. Worse, the handoff has to be
//   NARRATED ("a researcher uses whichever school has the greater
//   proportion..."), which reads as a spec of the method rather than as a
//   question — real papers almost never tell you the order of operations.
//
// Both were rebuilt so the two skills are COUPLED instead: no intermediate
// exists that could be handed over, and nothing narrates the method.
//
//   The test to apply when authoring the next one: if I tell the student the
//   intermediate result, is what is left a complete single-skill question? If
//   yes, it is a pipeline, not synthesis. Pipelines are fine occasionally —
//   real papers set them — but they must not be the house style, and they must
//   never be signposted.
//
// The coupling device in both rebuilt items is a CHANGE OF BASE: one quantity
// is a proportion of the whole, the other a percentage of a SUBSET (tree: of an
// unknown total, resolved only by the conditional; Venn: of the football group,
// not the year). Reading the base correctly IS reading the structure, so a base
// error is at once an FDP error and a structural error — no seam to cut along.
//
// The graph position is unchanged and was re-verified this session: every coded
// 2024/25 row pairs tree_diagrams and venn_diagrams only with combined_events /
// calculating_simple_probability, both of which are PREREQUISITES of them
// (calculating_simple_probability -> combined_events -> tree/venn), so those
// pairings are mastery by the project rule. fractions_decimals_and_percentages
// is outside both closures and so is graph-legal, but there is NO coded exam
// precedent for the pairing — it is an invented combination, built on the
// user's explicit call to try it.
//
// rearranging_formulae + algebraic_fractions (unchanged from first authoring)
// does have real coded evidence — JUN24-H-P1 q17, 4 marks, kind=exam, non_calc,
// "M1 M1dep M1dep A1", traps [partial_factorisation, sign_error],
// app_supported: partial only because "multiple equivalent forms" needed the
// equivalence grader, which has shipped. Neither skill is a prerequisite of the
// other (they share grandparents — factorising, simplifying_fractions — not a
// parent-child link). These three were left alone: they are already coupled
// rather than pipelined, since the factorising happens INSIDE the rearrangement
// rather than before it.
//
// Parameter tuples for both rebuilt items were found by exhaustive search, not
// hand-picked, because several constraints have to hold on every draw at once
// (integrality of every displayed and trapped value, no collision between the
// answer and any trap, and — for the tree — that the "kept the original total"
// slip lands on a whole number a student would actually submit).
//
//   npx tsx scripts/create-tree-venn-rearranging-synthesis.ts --json batch.json
//   npx tsx scripts/verify-question.ts --file batch.json --svg
//   npx tsx scripts/create-tree-venn-rearranging-synthesis.ts            # insert drafts
//   npx tsx scripts/create-tree-venn-rearranging-synthesis.ts --update <name>
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * Rows this script owns, keyed by name; `--update <name>` rewrites one.
 *
 * The two probability rows keep the ids they were inserted with even though
 * both were renamed in the rebuild — the row is the same draft, reworked, and
 * re-inserting would orphan the original.
 */
const DRAFT_IDS: Record<string, string> = {
  'formula-single-fraction-in-x': '02e5f64c-0040-4bd5-af58-290293d84c74',
  'formula-shifted-fraction-in-x': 'a75bae58-a41b-4a4d-ad6b-8910968fbbff',
  'formula-x-both-sides-fraction': '61956a8d-cdd4-4f89-85bc-978448311056',
  // was 'proportion-decision-tree-diagram'
  'conditional-percentage-find-total': '83bbf6f5-4ab7-4279-ad49-0bb4db9a850a',
  // sibling of the row above — same shape, given the JOINT probability
  // instead of the conditional so the omitted-first-factor trap is reachable
  'joint-percentage-find-total': '399de9e2-bc69-4be3-864d-c247fe46371f',
  // was 'proportion-decision-venn-neither'
  'venn-subset-percentage-neither': '5d2c02c1-5f3e-46d2-8eb2-9ddf935320e1',
}

// ── TREE (rebuilt): p% of an UNKNOWN total are red; the without-replacement
// conditional is given as a fraction; find the original total.
//
// Coupled, not pipelined: the percentage is of an unknown, so it cannot be
// evaluated at all until the tree constraint pins the total down. There is no
// intermediate to hand over — "p% of n" stays algebraic right up to the last
// line. Nothing in the wording tells the student to form an equation.
//
// Everything is computed from N and p; the conditional is reduced with gcd
// rather than transcribed, so no array can silently disagree with another.
// Draws 5 and 6 were 16/25% and 25/20%; both had N = R^2, which makes the
// mirror trap's magnitude equal the red count, so a student who dropped the
// minus sign would have been told "that's the red count" — the wrong
// diagnosis. Re-searched to exclude N = R^2.
const TR_N = '[8,10,12,15,25,28][sel]'
const TR_P = '[50,40,75,60,40,25][sel]'
/** Red counters = p% of the total. Whole on every draw by construction. */
const TR_R = `(${TR_P}*${TR_N}/100)`
const TR_G = `gcd(${TR_R}-1,${TR_N}-1)`
/** The conditional (R-1)/(N-1) in its lowest terms. */
const TR_NUM = `((${TR_R}-1)/${TR_G})`
const TR_DEN = `((${TR_N}-1)/${TR_G})`
/**
 * The commonest without-replacement slip that still yields a solvable equation:
 * the numerator is reduced but the DENOMINATOR is left as the original total,
 * i.e. (R-1)/n = c instead of (R-1)/(n-1) = c. Solving gives n(n-1)/(n-R),
 * constrained by the search to be a whole number on every draw so the trap is a
 * value a student would actually write down.
 *
 * The mirror slip (numerator not reduced, R/(n-1) = c) is NOT trapped: it
 * solves to a negative n, so no student reaches a submittable answer by it.
 */
const TR_KEPT = `(${TR_N}*(${TR_N}-1)/(${TR_N}-${TR_R}))`
/**
 * Answered the total AFTER the first counter was taken. n − 1 is all over the
 * working, and a student who solves with m = n − 1 as their unknown has to
 * remember to convert back, so this is the likeliest wrong quantity after the
 * red count itself.
 */
const TR_NM1 = `(${TR_N}-1)`
/**
 * The percentage applied to the REDUCED total: red = f(n−1), still minus the
 * one already taken, i.e. (f(n-1) - 1)/(n-1) = c, which solves to
 * 1/(f-c) + 1 = TR_KEPT + 1. A base error, which is thematically the right
 * misconception for an FDP-coupled item — the p% describes the bag BEFORE
 * anything is removed.
 */
const TR_PCT_REDUCED = `(${TR_KEPT}+1)`

/**
 * Reduced the TOTAL but not the reds — the mirror of TR_KEPT:
 *   f*n/(n-1) = c  ->  n(f-c) = -c  ->  n = -c/(f-c) = -N(R-1)/(N-R)
 *
 * This is NEGATIVE on every draw (-6, -5, -32, -20, -15, -8), and that is
 * exactly why it is worth trapping rather than discarding. A student who
 * reaches "-6 counters" still has to write something down: in an exam an
 * answer you know is wrong beats a blank, and it can carry method marks. The
 * response therefore leads with WHY the value is impossible before naming the
 * step that caused it — the impossibility is the most useful thing the student
 * can be told, and noticing it themselves is the skill being taught.
 *
 * (Ruling from the user, 2026-08-20, correcting an earlier call to drop this
 * trap because the number "made no sense". Silly-looking answers are the point;
 * they are also what the mini-exam method-mark model needs to score.)
 */
const TR_MIRROR = `(-(${TR_N}*(${TR_R}-1)/(${TR_N}-${TR_R})))`

// ── ONE MISCONCEPTION STILL NOT TRAPPED HERE (checked, don't retry) ──────────
//
// Neither number reduced (with-replacement all through): f*n/n = c -> f = c,
// a contradiction — the student reaches no value at all, so there is nothing
// to submit and nothing to match.
//
// A SECOND misconception — multiplying the LHS by P(first red), double-
// counting the first pick — is real and worth assessing, but is not trappable
// on THIS question. It solves to n = N/(N + R - R*N), and the blocker is not
// the sign (TR_MIRROR shows a negative trap is fine to keep — see
// feedback_impossible_value_traps in memory). It is the REPRESENTATION: the
// value is a small non-terminating fraction on almost every draw (-2/5, -5/13,
// -4/29, -5/37, ...), so the student's submission could be -0.38, -0.385,
// -5/13 or -0.4 and no single answer_template matches them all under a sane
// tolerance. Capturing it needs a DIFFERENT question — see TJ_* below.
//
// RE-CHECKED on the sibling (2026-08-27), not just assumed to carry over: the
// OPPOSITE direction of TJ_OMITTED — an EXTRA factor of f instead of a missing
// one, f^2*(fn-1)/(n-1)=J instead of f*(fn-1)/(n-1)=J — solves to
// n=(f^2-J)/(f^3-J), which is STILL a small non-terminating fraction on every
// one of the six draws (-0.4, -0.385, -0.098, -0.055, -0.114, -0.043) and
// negative throughout. So the sibling trick (give the joint, not the
// conditional) fixes UNDER-counting but not OVER-counting — the f^3 term in
// the denominator is what breaks termination, and that is present regardless
// of which quantity is given. Nothing left to add here.

/**
 * SIBLING QUESTION: 'joint-percentage-find-total'.
 *
 * Same reverse-constraint shape as the question above, but gives the JOINT
 * probability P(both red) instead of the conditional P(second red | first
 * red). That single change is what makes the double-counting misconception
 * (user request, 2026-08-20) trappable: omitting the first factor now UNDER-
 * counts rather than over-counts, so the error lands on a real, findable
 * quantity instead of the unrepresentable fraction above.
 *
 * P(first red) = f*n/n = f, independent of n — the first pick's probability
 * is always just the stated percentage, however big the bag turns out to be.
 * Only the SECOND factor depends on the unknown n. That is worth noticing:
 * it is exactly why a student might feel they have "already used" the
 * percentage once (to state f) and treat the given joint value as if it were
 * the second (conditional) factor on its own — the omitted-factor error this
 * question exists to trap.
 *
 *   Correct:  f*(f*n - 1)/(n - 1) = J   ->   n = (f-J)/(f^2-J)
 *   Omitted:    (f*n - 1)/(n - 1) = J   ->   n = (1-J)/(f-J)
 *
 * The four traps inherited from the parent question (red count, kept-total,
 * n-1, mirror + its sign-dropped pair) are UNCHANGED in value: each depends
 * only on how the second factor's own denominator/numerator was mis-set-up,
 * which is common to both the conditional and joint phrasing (verified
 * algebraically — none of those five formulas contain c or J at all). The
 * "%-of-reduced-total" trap was dropped here as it was on the parent's review:
 * already flagged as the weakest/most contrived of the set, and six traps is
 * already a lot for one question.
 *
 * omitted = (1-J)/(f-J) is an integer ONLY when N | 100 exactly (proof: write
 * N = Rk+1 from the integrality condition; gcd(N,R) = 1 forces N | 100R, and
 * since N is coprime to R that means N | 100) — i.e. only N in {10,20,25,50,
 * 100,...}, far too restrictive for six varied draws. Relaxed to "terminates
 * within 2 dp" instead (tolerance 0.02): a non-integer bag count is just as
 * legitimately an impossible-value trap as TR_MIRROR's negative one — the
 * absurdity is the tell either way, not the specific FORM the absurdity takes.
 */
const TJ_N = '[8,10,16,25,40,50][sel]'
const TJ_P = '[50,40,75,80,25,50][sel]'
const TJ_R = `(${TJ_P}*${TJ_N}/100)`
/** The given JOINT probability P(both red), reduced with gcd. */
const TJ_G = `gcd(${TJ_R}*(${TJ_R}-1),${TJ_N}*(${TJ_N}-1))`
const TJ_JNUM = `((${TJ_R}*(${TJ_R}-1))/${TJ_G})`
const TJ_JDEN = `((${TJ_N}*(${TJ_N}-1))/${TJ_G})`
const TJ_NM1 = `(${TJ_N}-1)`
const TJ_KEPT = `(${TJ_N}*(${TJ_N}-1)/(${TJ_N}-${TJ_R}))`
const TJ_MIRROR = `(-(${TJ_N}*(${TJ_R}-1)/(${TJ_N}-${TJ_R})))`
/** Rounded to 2 dp; every draw was searched to terminate within that precision. */
const TJ_OMITTED = `round((1-${TJ_JNUM}/${TJ_JDEN})/(${TJ_P}/100-${TJ_JNUM}/${TJ_JDEN}), 2)`

// ── VENN (rebuilt): a/c of ALL students play football; p% of THE FOOTBALLERS
// also play tennis; T play tennis altogether. How many play neither?
//
// Coupled, not pipelined: the percentage is of a subset the student has to
// identify from the set structure, and the overlap it produces feeds the
// inclusion-exclusion step. Taking p% of the year group instead of p% of the
// football group is one error that is at once an FDP base error and a
// misreading of the Venn structure.
//
// Draws re-searched 2026-08-26 to add three more traps (user request, matching
// the treatment given to 83bbf6f5/399de9e2): a "coefficient of B" mirror pair
// around the existing overlap-omission trap, and a genuine "double accounts"
// trap analogous to the tree sibling's omitted-first-factor one. All three
// derive from the SAME closed-form insight used there — solve the plausible
// mis-equation, keep the result even when it is negative or non-integer
// (feedback_impossible_value_traps), only drop it if it is either UNREACHABLE
// (no value at all) or UNREPRESENTABLE (a non-terminating decimal a student
// could type ten different ways).
const VN_A = '[1,1,2,1,1,3][sel]'
const VN_C = '[4,3,5,5,6,20][sel]'
const VN_N = '[16,36,20,25,36,40][sel]'
const VN_P = '[50,25,75,40,50,50][sel]'
const VN_T = '[5,4,8,6,13,15][sel]'
/** Football total = a/c of the whole year group. */
const VN_F = `(${VN_A}*${VN_N}/${VN_C})`
/** Both = p% OF THE FOOTBALLERS — the subset base that does the coupling. */
const VN_B = `(${VN_P}*${VN_F}/100)`
const VN_ANS = `(${VN_N}-${VN_F}-${VN_T}+${VN_B})`
/** Trap: p% taken of the whole year group instead of of the football group. */
const VN_WRONGBASE = `(${VN_N}-${VN_F}-${VN_T}+${VN_P}*${VN_N}/100)`
/** Trap: overlap never added back (or T misread as tennis-ONLY — same value). */
const VN_DOUBLE = `(${VN_N}-${VN_F}-${VN_T})`
/**
 * Trap: overlap added back TWICE (coefficient +2 instead of +1) — a real
 * inclusion-exclusion slip: "at least one sport = football + tennis − both"
 * mis-signed as "football + tennis − 2×both", so neither = N − that count
 * gains an extra +B. The mirror of VN_DOUBLE (coefficient 0) in the other
 * direction; always a whole number since B is.
 */
const VN_DOUBLE2 = `(${VN_N}-${VN_F}-${VN_T}+2*${VN_B})`
/**
 * Trap: overlap SUBTRACTED again instead of added (coefficient −1) — "at
 * least one sport = football + tennis + both" (added where it should be
 * subtracted), so neither = N − that count loses B entirely on top of
 * VN_DOUBLE's loss. Always a whole number; genuinely negative on ONE of the
 * six draws (sel=2, -2), which is kept deliberately rather than searched
 * away — see feedback_impossible_value_traps. No sign-dropped companion
 * trap unlike TR_MIRROR on the tree question: TR_MIRROR was negative on
 * EVERY draw, so a sign-drop trap was meaningful throughout; VN_SUBTRACT is
 * negative on only one of six, so a dedicated "sign dropped" trap would be a
 * real mechanism on that one draw and an unmotivated guess on the other
 * five — worse coverage than just leaving it untrapped there.
 */
const VN_SUBTRACT = `(${VN_N}-${VN_F}-${VN_T}-${VN_B})`
/**
 * Trap: REUSED the fraction a/c a second time instead of reading the given
 * percentage — both' = (a/c) of F, not p% of F. This is the Venn analogue of
 * the tree sibling's "double-counted the first pick": the student applies the
 * FIRST piece of given information twice rather than incorporating the
 * second. (a/c)^2 * N need not be a whole number — the search requires only
 * that it terminate within 2 dp (four of six draws land on an exact integer
 * anyway; the other two are clean 1-dp values, 7.2 and 19.9), matching how
 * the tree sibling's omitted-factor trap was handled. Minimum separation from
 * every other value across all six draws is 0.9, so a tolerance of 0.06 (set
 * on the whole question below) is nowhere near colliding with anything.
 */
const VN_REUSED = `(${VN_N}-${VN_F}-${VN_T}+round((${VN_A}/${VN_C})*(${VN_A}/${VN_C})*${VN_N}, 2))`

type Draft = {
  name: string
  skill_ids: string[]
  difficulty: number
  marks: number
  calculator: 'calc' | 'non_calc' | 'na'
  question_template: string
  parameters?: Record<string, { type: 'integer'; min: number; max: number }>
  answer_template: string
  answer_type: 'numeric' | 'fraction' | 'expression'
  tolerance: number | null
  requires_simplest?: boolean
  traps: { answer_template: string; response: string; method_marks?: number }[]
  explanation: string
}

const drafts: Draft[] = [
  {
    name: 'formula-single-fraction-in-x',
    skill_ids: ['rearranging_formulae', 'algebraic_fractions'],
    difficulty: 4,
    marks: 3,
    calculator: 'na',
    question_template:
      `<p>Rearrange the formula <strong>y = {{frac(a, 'x')}} + {{b}}</strong> to make <strong>x</strong> the subject.</p>`,
    parameters: { a: { type: 'integer', min: 2, max: 9 }, b: { type: 'integer', min: 1, max: 9 } },
    answer_template: `{{a}}/(y-{{b}})`,
    answer_type: 'expression',
    tolerance: null,
    // Display text uses frac() throughout, not raw "a/(y-b)" slash text —
    // answer_template/trap answer_template stay plain (the grader parses
    // them literally); only what the student reads is HTML.
    explanation:
      `Subtract {{b}} from both sides: y − {{b}} = {{frac(a, 'x')}}.<br>`
      + `Multiply both sides by x: x(y − {{b}}) = {{a}}.<br>`
      + `Divide by (y − {{b}}): <strong>x = {{frac(a, 'y - ' + b)}}</strong>.`,
    traps: [
      {
        answer_template: `{{a}}/y`,
        response: `You inverted before subtracting {{b}}. Rearrange one step at a time: first y − {{b}} = {{frac(a, 'x')}}, THEN invert: x = {{frac(a, 'y - ' + b)}}.`,
        method_marks: 1,
      },
      // NOT ADDING a "wrong order" trap here — checked, and genuinely blocked
      // by the grader's representation, not a numbers problem. The natural
      // wrong-order value ("inverted first, tacked b on after" = a/y+b)
      // collides with the EXISTING trap a/(y+b) under fractionPartsMatch in
      // answerChecker.ts: that function splits on the first top-level '/' and
      // treats everything after it as "the denominator", so "a/y+b" -> ["a",
      // "y+b"] and "a/(y+b)" -> ["a", "(y+b)"] -> stripped -> ["a", "y+b"]
      // compare EQUAL even though they are different expressions (a fraction
      // plus a separate term, vs a single fraction with a compound
      // denominator). Recombining as one fraction (a+by)/y dodges that
      // specific collision but creates a worse problem: a real student making
      // this error types "a/y+b", not the combined form, so the trap would
      // just never fire on the input it exists to catch. Two operations is
      // also too few for order to be meaningfully distinct from forgetting —
      // a75bae58 (4 operations) and formula-x-both-sides-fraction (5 steps)
      // both have genuine, safely-representable wrong-order traps; this
      // question's short derivation does not.
      {
        answer_template: `{{a}}*(y-{{b}})`,
        response: `You multiplied instead of dividing. x(y − {{b}}) = {{a}} means x = {{frac(a, 'y - ' + b)}}, not {{a}} × (y − {{b}}).`,
        method_marks: 1,
      },
      {
        answer_template: `{{a}}/(y+{{b}})`,
        response: `Check the sign. The formula ADDS {{b}}, so to isolate the fraction you subtract it: y − {{b}} = {{frac(a, 'x')}}, giving x = {{frac(a, 'y - ' + b)}}.`,
      },
      {
        // A genuinely different misconception from the three above (none of
        // which involve a "law of fractions" error) — splitting a fraction
        // across a subtraction: a/(y-b) treated as a/y - a/b. Very common at
        // GCSE and specific to algebraic fractions, so worth its own trap
        // rather than folding into an existing one.
        //
        // a/b need not be a whole number, so the trap value is ROUNDED rather
        // than left as an unsimplified "a/b" fraction-of-a-fraction — a
        // student making this error computes a/b as a decimal (there is no
        // reason to leave it symbolic; b is just a number here, not an
        // unknown), so the rounded decimal is the natural way they would
        // actually type it, not a compromise for the grader's sake.
        // WARN (not FAIL) on the harness: at a=4,b=2 and a=9,b=3 — the only
        // in-range pairs where a=b^2 — this trap's rendered value ("4/y-2")
        // collides with the correct answer ("4/(y-2)") via the SAME
        // fractionPartsMatch parser quirk documented on the trap above (it
        // splits on the first top-level '/' and cannot tell "fraction plus a
        // separate term" from "one fraction with a compound denominator").
        // Only 2/72 pairs, and the constraint system (paramEngine.ts
        // ConstraintConfig) has no way to express "a != b^2" — target is a
        // raw value or a single other parameter, not a computed expression —
        // so excluding just these two pairs isn't achievable declaratively.
        // Left as-is: low-frequency, and the trap goes silently inapplicable
        // on those two draws rather than misdiagnosing, matching this
        // project's own D2 precedent on low-frequency coincidental collisions.
        //
        // SEPARATE finding, also not fixed here: answer_type 'expression' does
        // not numerically normalise decimals at all — checkAnswer('2.50',
        // '2.5', 'expression', ...) returns false, where the SAME comparison
        // under 'numeric' correctly returns true. So a student typing a
        // trailing zero on this trap's decimal ("5/y-2.50" instead of
        // "5/y-2.5") gets no diagnosis. This is a general limitation of
        // answerChecker.ts's expression path, not specific to this trap — it
        // would equally affect any expression-type CORRECT answer with a
        // decimal component elsewhere in the bank. Worth fixing at the engine
        // level; out of scope for a content-authoring pass.
        answer_template: `{{a}}/y-{{round(a/b, 2)}}`,
        response: `You split the fraction across the subtraction. {{frac(a, 'y - ' + b)}} is NOT the same as {{a}}/y − {{a}}/{{b}} — a fraction does not distribute over a subtraction like that (check with real numbers: 1/(2−1) = 1, but 1/2 − 1/1 = −0.5). You have to divide by the WHOLE bracket (y − {{b}}) as one unit: x = {{frac(a, 'y - ' + b)}}.`,
        method_marks: 1,
      },
      {
        // A different kind of gap from the other four: not a slip within the
        // correct method, but solving a DIFFERENT (wrong) problem — reading
        // "a/x" as "ax" (a product, not a fraction) and rearranging the
        // resulting LINEAR equation instead. The frac() display makes this
        // less likely than it would be from bare "a/x" text, but it is still
        // a real, common misreading for a weaker student, and the resulting
        // value (a in the DENOMINATOR, not the numerator) is structurally
        // unlike anything else trapped here.
        answer_template: `(y-{{b}})/{{a}}`,
        response: `You have read {{frac(a, 'x')}} as {{a}}x (a product), not a fraction. The formula divides {{a}} by x — it is y = {{a}} ÷ x + {{b}}, not y = {{a}} × x + {{b}}. Rearranging what you actually have, {{a}}/x, means inverting it: x = {{frac(a, 'y - ' + b)}}.`,
        method_marks: 1,
      },
    ],
  },
  {
    name: 'formula-shifted-fraction-in-x',
    skill_ids: ['rearranging_formulae', 'algebraic_fractions'],
    difficulty: 5,
    marks: 4,
    calculator: 'na',
    question_template:
      `<p>Rearrange the formula <strong>y = {{frac(a, 'x - ' + b)}} + {{c}}</strong> to make <strong>x</strong> the subject.</p>`,
    parameters: {
      a: { type: 'integer', min: 2, max: 9 },
      b: { type: 'integer', min: 1, max: 6 },
      c: { type: 'integer', min: 1, max: 6 },
    },
    answer_template: `{{a}}/(y-{{c}})+{{b}}`,
    answer_type: 'expression',
    tolerance: null,
    // Every displayed fraction uses frac() now, not raw "a/(y-c)" slash text
    // — the answer_template/trap answer_template strings still have to stay
    // plain (the grader parses them as literal expressions), but everything
    // the student actually READS (explanation, trap responses) is display-
    // only HTML, so there is no reason for it to look worse than the question
    // text above it.
    explanation:
      `Subtract {{c}} from both sides: y − {{c}} = {{frac(a, 'x - ' + b)}}.<br>`
      + `Multiply both sides by (x − {{b}}): (x − {{b}})(y − {{c}}) = {{a}}.<br>`
      + `Divide by (y − {{c}}): x − {{b}} = {{frac(a, 'y - ' + c)}}.<br>`
      + `Add {{b}}: <strong>x = {{frac(a, 'y - ' + c)}} + {{b}}</strong>.`,
    traps: [
      {
        answer_template: `{{a}}/y+{{b}}`,
        response: `You forgot to subtract {{c}} first. Isolate the fraction before inverting: y − {{c}} = {{frac(a, 'x - ' + b)}}, THEN x − {{b}} = {{frac(a, 'y - ' + c)}}, so x = {{frac(a, 'y - ' + c)}} + {{b}}.`,
        method_marks: 2,
      },
      {
        // The opposite-step counterpart to the trap above: instead of
        // FORGETTING to subtract c, this ADDS it. The other two steps
        // (invert, then shift by b) already have their opposite-operation
        // traps below (multiply-not-divide, and sign-on-b) — this was the
        // one step with only a "forgotten" trap and no "did it backwards" one.
        answer_template: `{{a}}/(y+{{c}})+{{b}}`,
        response: `Check the sign on {{c}}. The formula ADDS {{c}}, so to isolate the fraction you must SUBTRACT it: y − {{c}} = {{frac(a, 'x - ' + b)}}, not y + {{c}}. That gives x − {{b}} = {{frac(a, 'y - ' + c)}}, so x = {{frac(a, 'y - ' + c)}} + {{b}}.`,
        method_marks: 2,
      },
      {
        answer_template: `{{a}}/(y-{{c}})-{{b}}`,
        response: `Check the sign on {{b}}. The denominator is (x − {{b}}), so once you have x − {{b}} = {{frac(a, 'y - ' + c)}} you ADD {{b}} to both sides: x = {{frac(a, 'y - ' + c)}} + {{b}}.`,
        method_marks: 2,
      },
      {
        answer_template: `{{a}}*(y-{{c}})+{{b}}`,
        response: `(x − {{b}})(y − {{c}}) = {{a}} means dividing by (y − {{c}}), not multiplying: x − {{b}} = {{frac(a, 'y - ' + c)}}, so x = {{frac(a, 'y - ' + c)}} + {{b}}.`,
        method_marks: 2,
      },
      {
        // Wrong-order trap: {{b}} belongs OUTSIDE the fraction (it undoes the
        // "- b" attached to x in the ORIGINAL formula, not to y), so it can
        // only be applied after inverting. This merges it into the y-side
        // denominator at the isolate-the-fraction stage instead — the two
        // shifts (subtract c from y, add b to x) done in the wrong order/on
        // the wrong variable, rather than a sign or step being dropped.
        answer_template: `{{a}}/(y-{{c}}+{{b}})`,
        response: `{{b}} has ended up in the wrong place. It undoes the "− {{b}}" attached to <strong>x</strong> in the original formula, so it can only be added once x is isolated — not merged into the y-side while you are still isolating the fraction.<br>Do it in order: y − {{c}} = {{frac(a, 'x - ' + b)}}, so x − {{b}} = {{frac(a, 'y - ' + c)}}, and only THEN x = {{frac(a, 'y - ' + c)}} + {{b}}.`,
        method_marks: 1,
      },
      {
        // Same "law of fractions" misconception as 02e5f64c's distribute
        // trap, occurring at the same point in the derivation (a/(y-c)
        // carried forward as one fraction, wrongly split into a/y - a/c).
        // The two constant terms (-a/c and the later +b) are combined into
        // one rounded value here, unlike 02e5f64c: a real student correctly
        // simplifying "a/y - a/c + b" would combine the two plain numbers
        // rather than leave three separate terms in a final answer.
        // Same trailing-zero decimal limitation documented in full on
        // 02e5f64c's equivalent trap applies here too (expression-type
        // answers are not numerically normalised) — checked the full 288-
        // value grid for the a=b^2-style exact collision that trap hit;
        // none found here.
        answer_template: `{{a}}/y+{{round(b - a/c, 2)}}`,
        response: `You split the fraction across the subtraction. {{frac(a, 'y - ' + c)}} is NOT the same as {{a}}/y − {{a}}/{{c}} — a fraction does not distribute over a subtraction like that. You have to divide by the WHOLE bracket (y − {{c}}) as one unit: x − {{b}} = {{frac(a, 'y - ' + c)}}, so x = {{frac(a, 'y - ' + c)}} + {{b}}.`,
        method_marks: 1,
      },
      {
        // Same "misread the fraction as a product" category as 02e5f64c's
        // trap, but applied to THIS formula's fraction a/(x-b): treats it as
        // a(x-b), giving a linear equation whose (correctly-rearranged)
        // solution has a in the DENOMINATOR — structurally unlike every
        // other trap here, all of which keep a in the numerator throughout.
        answer_template: `(y-{{c}})/{{a}}+{{b}}`,
        response: `You have read {{frac(a, 'x - ' + b)}} as {{a}}(x − {{b}}) (a product), not a fraction. The formula divides {{a}} by (x − {{b}}) — it is y − {{c}} = {{a}} ÷ (x − {{b}}), not y − {{c}} = {{a}} × (x − {{b}}). Rearranging what you actually have, y − {{c}} = {{frac(a, 'x - ' + b)}}, means inverting it: x − {{b}} = {{frac(a, 'y - ' + c)}}, so x = {{frac(a, 'y - ' + c)}} + {{b}}.`,
        method_marks: 1,
      },
    ],
  },
  {
    name: 'formula-x-both-sides-fraction',
    skill_ids: ['rearranging_formulae', 'algebraic_fractions'],
    difficulty: 5,
    marks: 5,
    calculator: 'na',
    question_template:
      `<p>Rearrange the formula <strong>y = {{frac('x + ' + a, 'x - ' + b)}}</strong> to make <strong>x</strong> the subject.</p>`,
    parameters: { a: { type: 'integer', min: 2, max: 9 }, b: { type: 'integer', min: 1, max: 6 } },
    answer_template: `({{a}}+{{b}}*y)/(y-1)`,
    answer_type: 'expression',
    tolerance: null,
    // Display text uses frac() for the final fraction throughout — the
    // "a + by" numerator built the same way the question text builds "x + a",
    // "x - b" (string concatenation, since frac() takes number|string).
    // answer_template/trap answer_template stay plain for the grader.
    explanation:
      `Multiply both sides by (x − {{b}}): y(x − {{b}}) = x + {{a}}.<br>`
      + `Expand the bracket: yx − {{b}}y = x + {{a}}.<br>`
      + `Collect the x terms on one side: yx − x = {{a}} + {{b}}y.<br>`
      + `Factorise: x(y − 1) = {{a}} + {{b}}y.<br>`
      + `Divide by (y − 1): <strong>x = {{frac(a + ' + ' + b + 'y', 'y - 1')}}</strong>.`,
    traps: [
      {
        answer_template: `({{a+b}})/(y-1)`,
        response: `You expanded y(x − {{b}}) as yx − {{b}} instead of yx − {{b}}y — the {{b}} is multiplied by y as well. That gives x(y − 1) = {{a}} + {{b}}y, so x = {{frac(a + ' + ' + b + 'y', 'y - 1')}}.`,
        method_marks: 1,
      },
      {
        // The opposite-step counterpart to the trap above: instead of
        // FORGETTING to multiply {{b}} by y, this multiplies it by y with
        // the WRONG SIGN — yx + by instead of yx − by (the minus sign inside
        // the bracket has to distribute onto both terms, not just x).
        answer_template: `({{a}}-{{b}}*y)/(y-1)`,
        response: `Check your signs expanding y(x − {{b}}): the − sign distributes onto BOTH terms, giving yx − {{b}}y — not yx + {{b}}y. With the correct sign: yx − {{b}}y = x + {{a}}, so yx − x = {{a}} + {{b}}y, and x(y − 1) = {{a}} + {{b}}y, giving x = {{frac(a + ' + ' + b + 'y', 'y - 1')}}.`,
        method_marks: 1,
      },
      {
        answer_template: `({{b}}*y-{{a}})/(y-1)`,
        response: `Check the sign on {{a}} when you move it across: yx − {{b}}y = x + {{a}} rearranges to x(y − 1) = {{a}} + {{b}}y, so x = {{frac(a + ' + ' + b + 'y', 'y - 1')}}.`,
        method_marks: 2,
      },
      {
        answer_template: `({{a}}+{{b}}*y)/(1-y)`,
        response: `Collecting the x terms the other way flips the sign of the bracket too. From yx − x = {{a}} + {{b}}y you get x(y − 1) = {{a}} + {{b}}y, so the denominator is (y − 1), not (1 − y): x = {{frac(a + ' + ' + b + 'y', 'y - 1')}}.`,
        method_marks: 3,
      },
      {
        // Wrong-order trap: divides/factorises before the collection step is
        // finished. The by term is still attached to x on the left when this
        // happens, so it gets left behind rather than carried across —
        // distinct from the sign errors above, which all carry the by term
        // through correctly and only get its SIGN or SIDE wrong.
        answer_template: `{{a}}/(y-1)`,
        response: `You divided by (y − 1) before collecting all the x terms. The {{b}}y term is still attached to x on the left of yx − x = {{a}} + {{b}}y — it has to move across BEFORE you factorise and divide, not get left behind: x(y − 1) = {{a}} + {{b}}y, so x = {{frac(a + ' + ' + b + 'y', 'y - 1')}}.`,
        method_marks: 2,
      },
      {
        // Not a slip within the correct method (all five traps above are) —
        // a different kind of error, reading the given fraction upside down:
        // (x-b)/(x+a) instead of (x+a)/(x-b). Checked whether the SAME
        // "distribute the fraction" and "misread as a product" categories
        // added to the other two questions apply here first: distribute
        // does not, since this derivation cross-multiplies immediately and
        // never carries a bare fraction through the working the way
        // a/(y-c) does on formula-shifted-fraction-in-x; misread-as-product
        // does not either, since (x+a)(x-b) is a QUADRATIC in x and does not
        // rearrange to anything in the same linear-in-y family as the other
        // traps, so it would not be a comparable, single-value trap here.
        // Flipping which side is numerator is the one that IS representable:
        //   y = (x-b)/(x+a)  ->  y(x+a) = x-b  ->  yx+ay = x-b
        //   ->  yx-x = -b-ay  ->  x(y-1) = -(ay+b)  ->  x = -(ay+b)/(y-1)
        answer_template: `-({{a}}*y+{{b}})/(y-1)`,
        response: `You have the fraction upside down. The formula is {{frac('x + ' + a, 'x - ' + b)}} — (x + {{a}}) on top, (x − {{b}}) on the bottom — not the other way round. Rearranging what you actually have: x(y − 1) = {{a}} + {{b}}y, so x = {{frac(a + ' + ' + b + 'y', 'y - 1')}}.`,
        method_marks: 1,
      },
    ],
  },
  {
    name: 'conditional-percentage-find-total',
    skill_ids: ['tree_diagrams', 'fractions_decimals_and_percentages'],
    difficulty: 5,
    marks: 4,
    calculator: 'calc',
    question_template:
      `<p>A bag contains red counters and blue counters.</p>`
      + `<p><strong>{{${TR_P}}}%</strong> of the counters are red.</p>`
      + `<p>A counter is taken at random and is <strong>not replaced</strong>. A second counter is then taken.</p>`
      + `<p>Given that the first counter is red, the probability that the second counter is also red is {{frac(${TR_NUM}, ${TR_DEN})}}.</p>`
      + `<p>Work out how many counters were in the bag to begin with.</p>`,
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${TR_N}}}`,
    answer_type: 'numeric',
    tolerance: 0,
    explanation:
      `Let n be the number of counters. {{${TR_P}}}% of them are red, so there are {{${TR_P}/100}}n red counters — you cannot work that out as a number yet, because n is unknown.<br>`
      + `One red counter is taken and not replaced, so {{${TR_P}/100}}n − 1 red counters are left out of n − 1 counters altogether.<br>`
      + `That second probability is given: ({{${TR_P}/100}}n − 1)/(n − 1) = {{frac(${TR_NUM}, ${TR_DEN})}}<br>`
      + `Cross-multiply: {{${TR_DEN}}}({{${TR_P}/100}}n − 1) = {{${TR_NUM}}}(n − 1)<br>`
      + `Expand: {{round(${TR_DEN}*${TR_P}/100, 4)}}n − {{${TR_DEN}}} = {{${TR_NUM}}}n − {{${TR_NUM}}}<br>`
      + `Collect the n terms: n × ({{round(${TR_DEN}*${TR_P}/100, 4)}} − {{${TR_NUM}}}) = {{${TR_DEN}}} − {{${TR_NUM}}}<br>`
      + `So n = {{${TR_DEN}-${TR_NUM}}} ÷ {{round(${TR_DEN}*${TR_P}/100 - ${TR_NUM}, 4)}} = <strong>{{${TR_N}}} counters</strong>`
      // Show the check as "R-1 out of the remaining N-1" rather than as
      // "(R-1)/(N-1) = reduced form": on the draws where the conditional is
      // already in lowest terms that phrasing rendered the same fraction twice
      // ("3/7 = 3/7 ✓"), which reads as a mistake.
      + ` (check: {{${TR_P}}}% of {{${TR_N}}} is {{${TR_R}}} red, and {{${TR_R}-1}} red out of the {{${TR_N}-1}} counters left is {{frac(${TR_NUM}, ${TR_DEN})}} ✓).`,
    traps: [
      {
        answer_template: `{{${TR_R}}}`,
        response: `That is the number of RED counters, not the number of counters altogether. {{${TR_P}}}% of the bag is red, so once n is found there are {{${TR_R}}} red — but the question asks how many were in the bag to begin with: <strong>{{${TR_N}}}</strong>.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${TR_KEPT}}}`,
        response: `You reduced the number of red counters for the second draw but not the total. Taking a counter out and not replacing it reduces BOTH: {{${TR_P}/100}}n − 1 red out of n − 1 altogether, not out of n. Solving ({{${TR_P}/100}}n − 1)/(n − 1) = {{frac(${TR_NUM}, ${TR_DEN})}} gives <strong>{{${TR_N}}}</strong>.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${TR_NM1}}}`,
        response: `That is how many counters are left <em>after</em> the first one has been taken, not how many were there to begin with — put the counter you removed back: {{${TR_N}-1}} + 1 = <strong>{{${TR_N}}}</strong>.<br>If you solved using a letter for the reduced total (say m = n − 1), remember to convert back at the end. It is also worth checking you have not simply lost a counter somewhere in the algebra.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${TR_PCT_REDUCED}}}`,
        response: `You took the {{${TR_P}}}% of the counters that are left after the first pick. The {{${TR_P}}}% describes the bag <strong>before</strong> anything is removed: there are {{${TR_P}/100}}n red out of n, and taking one red out leaves {{${TR_P}/100}}n − 1 red out of n − 1.<br>So the equation is ({{${TR_P}/100}}n − 1)/(n − 1) = {{frac(${TR_NUM}, ${TR_DEN})}}, giving <strong>{{${TR_N}}}</strong>.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${TR_MIRROR}}}`,
        response: `A bag cannot hold {{${TR_MIRROR}}} counters — so the setup, not the arithmetic, is what went wrong. Spotting that a negative answer is impossible is worth doing in the exam: it tells you to go back and check the equation.<br>`
          + `Here you reduced the <strong>total</strong> for the second draw but not the <strong>reds</strong>: you wrote {{${TR_P}/100}}n/(n − 1). But it is the red counter that was taken out, so both numbers drop by one — {{${TR_P}/100}}n − 1 red out of n − 1 altogether.<br>`
          + `Solving ({{${TR_P}/100}}n − 1)/(n − 1) = {{frac(${TR_NUM}, ${TR_DEN})}} gives <strong>{{${TR_N}}}</strong>.`,
        method_marks: 2,
      },
      {
        // The same error as TR_MIRROR, reported by a student who got the
        // negative and assumed they had slipped a sign. Worth its own trap:
        // without it this submission gets no diagnosis at all. The search
        // guarantees |TR_MIRROR| collides with nothing else, and the wording
        // stays conditional ("if you set it up as…") because the value alone
        // cannot prove that is how they got here.
        answer_template: `{{-(${TR_MIRROR})}}`,
        response: `Check the sign in your working. If you set the second draw up as {{${TR_P}/100}}n/(n − 1) — reducing the <strong>total</strong> but not the <strong>reds</strong> — the equation gives {{${TR_MIRROR}}}, and rewriting that as a positive number hides the very thing it was telling you: a negative count means the setup is wrong, not the arithmetic.<br>`
          + `It is a red counter that was removed, so both numbers drop by one: ({{${TR_P}/100}}n − 1)/(n − 1) = {{frac(${TR_NUM}, ${TR_DEN})}}, giving <strong>{{${TR_N}}}</strong>.`,
        method_marks: 2,
      },
    ],
  },
  {
    name: 'joint-percentage-find-total',
    skill_ids: ['tree_diagrams', 'fractions_decimals_and_percentages'],
    difficulty: 5,
    marks: 4,
    calculator: 'calc',
    question_template:
      `<p>A bag contains red counters and blue counters.</p>`
      + `<p><strong>{{${TJ_P}}}%</strong> of the counters are red.</p>`
      + `<p>A counter is taken at random and is <strong>not replaced</strong>. A second counter is then taken.</p>`
      + `<p>The probability that <strong>both</strong> counters are red is {{frac(${TJ_JNUM}, ${TJ_JDEN})}}.</p>`
      + `<p>Work out how many counters were in the bag to begin with.</p>`,
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${TJ_N}}}`,
    answer_type: 'numeric',
    // 0.06, not the usual 0.005: the OMITTED trap's value is what a real bag
    // count is nonsensically NOT a whole number, and the point being trapped
    // is that non-integer-ness, not the exact decimal. A student rounding to
    // 1 dp (2.75 -> "2.8") must still fire it. Every other value on every
    // draw is a whole number at least 0.5 away from the omitted trap (search-
    // enforced), so widening this far is still collision-safe.
    tolerance: 0.06,
    // Every displayed "(...n - 1)/(n - 1)" style fraction now uses frac(), not
    // raw slash text — same pass as the rearranging_formulae family. Two
    // distinct numerators recur throughout: the CORRECT second factor
    // "{{p}}/100 n - 1" over "n - 1", and the WRONG (kept-total) one
    // "{{p}}/100 n" over "n - 1" that trap 2/4/5 describe setting up.
    // answer_template/trap answer_template stay plain for the grader.
    explanation:
      `Let n be the number of counters. {{${TJ_P}}}% of them are red, so P(first red) = {{${TJ_P}}}/100 = {{${TJ_P}/100}} — this is fixed whatever n turns out to be.<br>`
      + `One red counter is taken and not replaced, so {{${TJ_P}/100}}n − 1 red remain out of n − 1 counters altogether: P(second red given first red) = {{frac(${TJ_P}/100 + 'n - 1', 'n - 1')}}.<br>`
      + `Both together: P(both red) = {{${TJ_P}/100}} × {{frac(${TJ_P}/100 + 'n - 1', 'n - 1')}} = {{frac(${TJ_JNUM}, ${TJ_JDEN})}}<br>`
      + `Cross-multiply and expand: {{round(${TJ_JDEN}*${TJ_P}/100*${TJ_P}/100, 4)}}n − {{round(${TJ_JDEN}*${TJ_P}/100, 4)}} = {{${TJ_JNUM}}}n − {{${TJ_JNUM}}}<br>`
      + `Collect the n terms: n × ({{round(${TJ_JDEN}*${TJ_P}/100*${TJ_P}/100, 4)}} − {{${TJ_JNUM}}}) = {{round(${TJ_JDEN}*${TJ_P}/100, 4)}} − {{${TJ_JNUM}}}<br>`
      // Not converted to frac() like the rest: numerator and denominator here
      // are ROUNDED DECIMAL intermediates from the working (e.g. 4 over 0.5),
      // not a genuine fraction — a decimal in the denominator of a stacked
      // fraction bar reads as unusual rather than clearer, unlike the
      // algebraic and numeric fractions above.
      + `So n = {{round(${TJ_JDEN}*${TJ_P}/100 - ${TJ_JNUM}, 4)}} ÷ {{round(${TJ_JDEN}*${TJ_P}/100*${TJ_P}/100 - ${TJ_JNUM}, 4)}} = <strong>{{${TJ_N}}} counters</strong>`
      + ` (check: {{${TJ_P}}}% of {{${TJ_N}}} is {{${TJ_R}}} red. P(first red) = {{${TJ_P}/100}}. P(second red given first red) = {{${TJ_R}-1}} red out of the {{${TJ_N}-1}} left. P(both) = {{${TJ_P}/100}} × that = {{frac(${TJ_JNUM}, ${TJ_JDEN})}} ✓).`,
    traps: [
      {
        answer_template: `{{${TJ_R}}}`,
        response: `That is the number of RED counters, not the number of counters altogether. {{${TJ_P}}}% of the bag is red, so once n is found there are {{${TJ_R}}} red — but the question asks how many were in the bag to begin with: <strong>{{${TJ_N}}}</strong>.`,
        method_marks: 3,
      },
      {
        // The one this sibling exists to add: the parent question's "double-
        // count" request, now trappable because omitting the first factor
        // UNDER-counts a JOINT probability instead of over-counting a
        // conditional one — see the header comment for the algebra.
        answer_template: `{{${TJ_OMITTED}}}`,
        response: `You treated the given probability {{frac(${TJ_JNUM}, ${TJ_JDEN})}} as if it were P(second red given first red) on its own — {{frac(${TJ_P}/100 + 'n - 1', 'n - 1')}} = {{frac(${TJ_JNUM}, ${TJ_JDEN})}}. But that fraction is the probability that <strong>both</strong> counters are red, which also needs the {{${TJ_P}}}% chance of the first one.<br>`
          + `{{${TJ_OMITTED}}} is not even a whole number of counters — a bag cannot hold part of one, which is the sign that a factor is missing from the equation.<br>`
          + `Multiply by P(first red) = {{${TJ_P}/100}} as well: {{${TJ_P}/100}} × {{frac(${TJ_P}/100 + 'n - 1', 'n - 1')}} = {{frac(${TJ_JNUM}, ${TJ_JDEN})}}, giving <strong>{{${TJ_N}}}</strong>.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${TJ_KEPT}}}`,
        response: `Working out P(second red given first red), you reduced the red count for the second draw but not the total. Taking a red counter out and not replacing it reduces BOTH: {{${TJ_P}/100}}n − 1 red out of n − 1 altogether, not out of n. Solving {{${TJ_P}/100}} × {{frac(${TJ_P}/100 + 'n - 1', 'n - 1')}} = {{frac(${TJ_JNUM}, ${TJ_JDEN})}} gives <strong>{{${TJ_N}}}</strong>.`,
        method_marks: 2,
      },
      {
        answer_template: `{{${TJ_NM1}}}`,
        response: `That is how many counters are left <em>after</em> the first one has been taken, not how many were there to begin with — put the counter you removed back: {{${TJ_N}-1}} + 1 = <strong>{{${TJ_N}}}</strong>.<br>If you solved using a letter for the reduced total (say m = n − 1), remember to convert back at the end.`,
        method_marks: 3,
      },
      {
        answer_template: `{{${TJ_MIRROR}}}`,
        response: `A bag cannot hold {{${TJ_MIRROR}}} counters — so the setup, not the arithmetic, is what went wrong. Spotting that a negative answer is impossible is worth doing in the exam: it tells you to go back and check the equation.<br>`
          + `Here, working out P(second red given first red), you reduced the <strong>total</strong> but not the <strong>reds</strong>: you wrote {{frac(${TJ_P}/100 + 'n', 'n - 1')}}. It is a red counter that was taken out, so both numbers drop by one — {{${TJ_P}/100}}n − 1 red out of n − 1.<br>`
          + `Solving {{${TJ_P}/100}} × {{frac(${TJ_P}/100 + 'n - 1', 'n - 1')}} = {{frac(${TJ_JNUM}, ${TJ_JDEN})}} gives <strong>{{${TJ_N}}}</strong>.`,
        method_marks: 2,
      },
      {
        // The sign-dropped companion to TJ_MIRROR — see 83bbf6f5 for why this
        // needs its own trap rather than falling through unmatched.
        answer_template: `{{-(${TJ_MIRROR})}}`,
        response: `Check the sign in your working. If you set the second factor up as {{frac(${TJ_P}/100 + 'n', 'n - 1')}} — reducing the <strong>total</strong> but not the <strong>reds</strong> — the equation gives {{${TJ_MIRROR}}}, and rewriting that as a positive number hides the very thing it was telling you: a negative count means the setup is wrong, not the arithmetic.<br>`
          + `It is a red counter that was removed, so both numbers drop by one: {{${TJ_P}/100}} × {{frac(${TJ_P}/100 + 'n - 1', 'n - 1')}} = {{frac(${TJ_JNUM}, ${TJ_JDEN})}}, giving <strong>{{${TJ_N}}}</strong>.`,
        method_marks: 2,
      },
    ],
  },
  {
    name: 'venn-subset-percentage-neither',
    skill_ids: ['venn_diagrams', 'fractions_decimals_and_percentages'],
    difficulty: 5,
    marks: 4,
    calculator: 'calc',
    question_template:
      `<p><strong>{{${VN_N}}} students</strong> were asked whether they play football and whether they play tennis.</p>`
      + `<p>{{frac(${VN_A}, ${VN_C})}} of the students play football.</p>`
      + `<p><strong>{{${VN_P}}}%</strong> of the students who play football also play tennis.</p>`
      + `<p>Altogether, <strong>{{${VN_T}}} students</strong> play tennis.</p>`
      + `<p>Work out how many students play <strong>neither</strong> football nor tennis.</p>`,
    parameters: { sel: { type: 'integer', min: 0, max: 5 } },
    answer_template: `{{${VN_ANS}}}`,
    answer_type: 'numeric',
    // 0.25, not 0: the REUSED trap (see VN_REUSED above) is a genuine count
    // that happens to land on a non-integer, and a student who notices "a
    // fractional student is impossible" will reasonably round it to the
    // nearest whole (7.2 -> "7", 19.9 -> "20") believing that fixes the
    // problem, rather than fixing the METHOD. Probed directly: at 0.06 that
    // submission got no diagnosis at all — the same gap the tree sibling's
    // sign-dropped trap exists to close. Nearest-whole rounding needs up to
    // ~0.5 tolerance in the worst case; every value on every draw is at least
    // 0.9 from every other, so 0.25 catches the rounding with margin to spare
    // and is nowhere near wide enough to blur two different traps together.
    tolerance: 0.25,
    explanation:
      `Football: {{frac(${VN_A}, ${VN_C})}} of {{${VN_N}}} = {{${VN_F}}} students.<br>`
      + `Both sports: the {{${VN_P}}}% is {{${VN_P}}}% <em>of the footballers</em>, not of all {{${VN_N}}} students — {{${VN_P}}}% of {{${VN_F}}} = <strong>{{${VN_B}}}</strong> students.<br>`
      + `So football only = {{${VN_F}}} − {{${VN_B}}} = {{${VN_F}-${VN_B}}}, and tennis only = {{${VN_T}}} − {{${VN_B}}} = {{${VN_T}-${VN_B}}}.<br>`
      + `Neither = {{${VN_N}}} − {{${VN_F}-${VN_B}}} − {{${VN_B}}} − {{${VN_T}-${VN_B}}} = <strong>{{${VN_ANS}}}</strong> students.`,
    traps: [
      {
        answer_template: `{{${VN_WRONGBASE}}}`,
        response: `You took {{${VN_P}}}% of all {{${VN_N}}} students. Read it again: it is {{${VN_P}}}% of <em>the students who play football</em>. Everyone in the overlap plays football, so the overlap is {{${VN_P}}}% of {{${VN_F}}} = {{${VN_B}}}, not {{${VN_P}}}% of {{${VN_N}}}. That gives <strong>{{${VN_ANS}}}</strong>.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${VN_DOUBLE}}}`,
        response: `You are {{${VN_B}}} short, and there are two common reasons. Either you subtracted football and tennis without adding the overlap back — the {{${VN_B}}} who play both were taken off twice — or you read "{{${VN_T}}} play tennis" as tennis ONLY when it is the tennis total. Either way: neither = {{${VN_N}}} − {{${VN_F}}} − {{${VN_T}}} + {{${VN_B}}} = <strong>{{${VN_ANS}}}</strong>.`,
        method_marks: 2,
      },
      {
        // Mirror of the trap above, in the other direction: instead of never
        // adding the overlap back, this adds it back TWICE.
        answer_template: `{{${VN_DOUBLE2}}}`,
        response: `You have subtracted the overlap twice somewhere in your working. "At least one sport" = football + tennis − both (subtract the {{${VN_B}}} who play both just ONCE, since they were counted in both the football and tennis totals) — not football + tennis − 2×both.<br>That mistake carries through: neither = {{${VN_N}}} − ({{${VN_F}}} + {{${VN_T}}} − 2×{{${VN_B}}}) = {{${VN_DOUBLE2}}}, which is {{${VN_B}}} too many.<br>Subtract the overlap only once: neither = {{${VN_N}}} − {{${VN_F}}} − {{${VN_T}}} + {{${VN_B}}} = <strong>{{${VN_ANS}}}</strong>.`,
        method_marks: 2,
      },
      {
        // The other direction from VN_DOUBLE: the overlap is ADDED instead of
        // subtracted when combining football and tennis, which loses it
        // twice over rather than zero times. Genuinely negative on some
        // draws — kept deliberately, see feedback_impossible_value_traps.
        answer_template: `{{${VN_SUBTRACT}}}`,
        response: `{{${VN_SUBTRACT} < 0 ? "A negative number of students is impossible — that is the sign the METHOD is wrong, not the arithmetic. " : ""}}You added the overlap when working out "at least one sport" instead of subtracting it: football + tennis + both, rather than football + tennis − both. The {{${VN_B}}} who play both are already counted once in football and once in tennis, so adding them again over-counts.<br>Neither = {{${VN_N}}} − ({{${VN_F}}} + {{${VN_T}}} + {{${VN_B}}}) = {{${VN_SUBTRACT}}}. Subtract the overlap instead: neither = {{${VN_N}}} − {{${VN_F}}} − {{${VN_T}}} + {{${VN_B}}} = <strong>{{${VN_ANS}}}</strong>.`,
        method_marks: 2,
      },
      {
        // The Venn analogue of the tree sibling's omitted-first-factor trap
        // (399de9e2): reuses the FIRST given ratio a second time instead of
        // reading the second one. Not always non-integer (4 of 6 draws land
        // on a normal-looking whole number), so the response leads with the
        // mechanism and only mentions the fractional-count tell when it
        // actually applies.
        answer_template: `{{${VN_REUSED}}}`,
        response: `You used {{frac(${VN_A}, ${VN_C})}} again to work out "both", instead of the given {{${VN_P}}}%. That fraction already did its job — converting {{${VN_N}}} students into {{${VN_F}}} footballers. "Both" needs the {{${VN_P}}}% applied to the {{${VN_F}}} footballers, not {{frac(${VN_A}, ${VN_C})}} applied a second time.`
          + `{{(${VN_REUSED})%1!==0 ? " And " + (${VN_REUSED}) + " is not even a whole number of students — a fractional student is a sign the method has gone wrong." : ""}}<br>`
          // The intermediate ({{frac}} × F) is shown as its own step before
          // combining with the other three terms — without it, "1/4 × 4 = 8"
          // sits right next to the total and reads as a direct (wrong)
          // product, when 8 is really 16 − 4 − 5 + 1.
          + `{{frac(${VN_A}, ${VN_C})}} × {{${VN_F}}} = {{round(${VN_A}/${VN_C}*${VN_F}, 2)}}, so neither = {{${VN_N}}} − {{${VN_F}}} − {{${VN_T}}} + {{round(${VN_A}/${VN_C}*${VN_F}, 2)}} = {{${VN_REUSED}}}. Use the {{${VN_P}}}% instead: neither = {{${VN_N}}} − {{${VN_F}}} − {{${VN_T}}} + {{${VN_B}}} = <strong>{{${VN_ANS}}}</strong>.`,
        method_marks: 1,
      },
      {
        answer_template: `{{${VN_B}}}`,
        response: `That is the number who play BOTH sports. The question asks how many play neither: {{${VN_N}}} − {{${VN_F}}} − {{${VN_T}}} + {{${VN_B}}} = <strong>{{${VN_ANS}}}</strong>.`,
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
    parameters: q.parameters ?? { sel: { type: 'integer', min: 0, max: 5 } },
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
