import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { evaluateTemplate } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'

// ─────────────────────────────────────────────────────────────────────────────
// "Write this improper fraction as a mixed number" — three questions, plus one
// column set on the live question that runs the other way.
//
// ── WHY THIS SHAPE, AND WHY ONLY NOW ───────────────────────────────────────
// `irregular_and_improper_fractions` has 30 coded parts worth 64 marks across
// the 86 papers in data/exam-audit/. SIX of those 30 are the same one-mark
// shape — "write this improper fraction as a mixed number" — which makes it the
// skill's most frequent single item:
//
//   IGCSE-JUN25-F-P2 q6a, IGCSE-NOV23-F-P1 q5d, IGCSE-NOV24-F-P2 q4c,
//   OCR-JUN24-F-P2 q7b, OCR-JUN25-F-P2 q7c, NOV24-F-P1 q3a
//
// and NOV23-H-P2 q2a is the same conversion with a simplifying step on top (it
// is the one part also tagged `simplifying_fractions`).
//
// It was the one shape the skill's own batch could not author. The header of
// scripts/create-improper-fractions-batch.ts records why: normalise() stripped
// whitespace, so "2 1/3" became "21/3" and every mixed number was read as an
// improper fraction with the space deleted. A question whose ANSWER is a mixed
// number could not be marked at all, so five questions went in around this gap.
//
// PR #228 fixed the grader and added `questions.requires_fraction_form`. These
// are the first rows in the table to use it — measured before this batch, 0 of
// 1,000 rows had it set.
//
// ── requires_fraction_form: 'mixed' IS THE WHOLE POINT ──────────────────────
// The grader's default treats mixed and improper as the same answer, because
// the mark schemes do ("90/552 oe", NOV24-H-P3 q21). On THIS shape that default
// would accept the improper fraction printed in the question, which assesses
// nothing — so each question declares 'mixed', and a right-valued improper
// answer comes back as the misconception `answer_not_in_requested_form` for the
// teacher's Common mistakes panel. A paper is explicit about the same thing:
// JUN23-H-P1 q3's mark scheme reads "B1 (mixed number required)", with the gap
// note "improper form not credited".
//
// ── CALIBRATION, PER QUESTION ───────────────────────────────────────────────
//   Q1  d1  denominators 3–5, one division fact            — the plain shape
//   Q2  d2  denominators to 9, wholes to 6                 — OCR / iGCSE size
//   Q3  d3  the leftover needs simplifying too             — NOV23-H-P2 q2a,
//           requires_simplest on                             the only such part
//
// Q1 sits BELOW the skill's existing scaffolded question (3478c34e, d2), which
// prints the whole-number part and asks only for the missing numerator. Doing
// the whole conversion with small numbers is the next rung up from that, not
// the same rung.
//
// ── THE OTHER DIRECTION IS ALREADY IN THE BANK ──────────────────────────────
// Exactly one coded part runs mixed → improper (OCR-JUN23-F-P2 q4b), and the
// bank's one PUBLISHED question on this skill (0d0af2a3) is already that shape.
// Authoring a second would duplicate it, so this script instead sets
// requires_fraction_form: 'improper' on that row — because today, with the
// column null, a student can retype the mixed number out of the stem and be
// marked correct. The same bug as above, mirrored. Nothing else about that row
// is touched and its publish state is left exactly as it is.
//
// ── THE SHAPES STILL NOT AUTHORED ───────────────────────────────────────────
// EDEXCEL-JUN24-F-P1 q21b and -H-P1 q2b ("identify that a correct
// improper-fraction result was converted to a mixed number wrongly") are C1
// marks on a free-text explanation, which the app cannot mark at all.
// JUN23-H-P1 q3 wants a mixed-number answer out of an INDICES calculation —
// authorable now that the column exists, but it belongs to that skill's batch.
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** The live mixed → improper question whose form requirement is being set. */
const PUBLISHED_IMPROPER_ID = '0d0af2a3-c4ec-4b2d-8877-80daa7dec768'

const PARAMS = { sel: { min: 0, max: 5, type: 'integer' } }

const A = (xs: number[]) => `[${xs.join(',')}][sel]`

// Typing format, not method: a student who knows the maths should not lose the
// mark to the input box. normalise() needs the space — "2 1/3" parses, "21/3"
// is seven — and 3 1/8 is asserted below never to be an answer or a trap here.
const HINT = '<p style="font-size:0.9em;color:#555">Leave a space between the whole number '
  + 'and the fraction, for example 3 1/8.</p>'

const SIMPLEST = '<p>Give the fraction part in its simplest form.</p>'

/**
 * The denominator spoken as a word — "thirds", "a quarter", "eighths".
 *
 * Written inline because paramEngine's helper table (round, frac, gcd, fracStr)
 * has no name for this and adding one is not this batch's business. The naive
 * "{{d}}ths" that the sibling batch uses reads as "3ths" and "5ths" to a
 * student, which is not what the pieces are called on any paper.
 *
 * Denominators here run 3–12, so the numeric fallback never fires; it is there
 * so a later draw outside that range degrades to something readable instead of
 * throwing.
 */
const ORD = (d: string, plural: boolean) =>
  `{{(function(){const w={2:'half',3:'third',4:'quarter',5:'fifth',6:'sixth',7:'seventh',`
  + `8:'eighth',9:'ninth',10:'tenth',11:'eleventh',12:'twelfth'}[${d}]||(${d}+'th');`
  + `return ${plural ? 'true' : 'false'} ? (w==='half'?'halves':w+'s') : w})()}}`

/** 's', unless there is only one of the thing. */
const S = (n: string) => `{{${n}===1?'':'s'}}`

type Draws = { w: number[], r: number[], d: number[] }

/**
 * One question of the shape, built from six draws of (whole, leftover, denom).
 *
 * The draws are enumerated rather than constrained because the traps need
 * guarantees the constraint engine cannot express (r must not divide d, for
 * one). check() asserts every one of them.
 */
function conversion(draws: Draws, simplify: boolean) {
  const W = A(draws.w), R = A(draws.r), D = A(draws.d)
  const N = `(${W}*${D}+${R})`                      // the improper numerator
  const ANS = `{{${W}}} {{fracStr(${R}, ${D})}}`    // "2 3/4" — fracStr reduces, which Q3 needs
  const bold = (s: string) => `<strong>${s}</strong>`

  return {
    draws, improperNumerator: N,
    question_template:
      `<p>Write ${bold(`{{frac(${N}, ${D})}}`)} as a mixed number.</p>`
      + (simplify ? SIMPLEST : '') + HINT,
    answer_template: ANS,
    explanation:
      // The REASON, not the rule restated: the denominator names the size of
      // the pieces, which is why it survives the conversion untouched.
      `The bottom number says how big the pieces are, so {{${N}}}/{{${D}}} means {{${N}}} `
      + `${ORD(D, true)}. It takes {{${D}}} of them to make one whole, so the question is really `
      + `how many complete wholes {{${N}}} of them come to.<br>`
      + `{{${W}}} × {{${D}}} = {{${W}*${D}}}, which uses up {{${W}*${D}}} of the {{${N}}} pieces and `
      + `leaves {{${R}}} over. So {{${N}}}/{{${D}}} is {{${W}}} whole one${S(W)} and {{${R}}} `
      + `${ORD(D, true)}.<br>`
      + (simplify
        ? `{{${R}}} and {{${D}}} share a factor of {{gcd(${R}, ${D})}}, so those leftover pieces can `
          + `be written as fewer, bigger ones: {{${R}}}/{{${D}}} = {{fracStr(${R}, ${D})}}. That `
          + `changes how the leftover is written, not how much it is, and it leaves the `
          + `whole-number part alone.<br>`
        : `The bottom number does not change along the way — the pieces are still `
          + `${ORD(D, true)}, only their count is different.<br>`)
      + `So {{${N}}}/{{${D}}} = ${bold(ANS)}.`,
    traps: [
      {
        // The division is done, then read the wrong way round: the remainder is
        // taken as the number of whole ones. Kept clear of the answer by the
        // w ≠ r assertion.
        answer_template: `{{${R}}} {{fracStr(${W}, ${D})}}`,
        method_marks: 0,
        misconception: 'divided_the_wrong_way_round',
        response:
          `The division itself is right: {{${N}}} &#247; {{${D}}} = {{${W}}} remainder {{${R}}}. `
          + `But its two answers have swapped places. The {{${W}}} counts the WHOLE `
          + `ones, so it belongs in front; the {{${R}}} is what was left over, so it is how many `
          + `${ORD(D, true)} come after it.<br>`
          + `Checking the size catches this: {{${N}}}/{{${D}}} lies between {{${W}}} and `
          + `{{${W}+1}}, not between {{${R}}} and {{${R}+1}}.<br>`
          + `${bold(ANS)}.`,
      },
      {
        // The leftover written upside down — "2 4/3" for 2 3/4.
        //
        // Tagged `fraction_operation_confused`, whose description already covers
        // "flipped the wrong fraction when dividing": it is the nearest existing
        // id for a fraction written the wrong way up, and it fires in the right
        // family of skills. A dedicated id would read better on the teacher's
        // Common mistakes panel if the next misconception sweep adds one.
        answer_template: `{{${W}}} {{fracStr(${D}, ${R})}}`,
        method_marks: 0,
        misconception: 'fraction_operation_confused',
        response:
          `The leftover fraction is upside down. The bottom number is not something the conversion `
          + `works out — it is fixed by the fraction you started with. The pieces are `
          + `${ORD(D, true)}, so the {{${D}}} stays underneath and the {{${R}}} left-over pieces go `
          + `on top.<br>`
          + `Written this way round the fraction part is bigger than a whole one, which cannot be `
          + `right: whatever is left after taking out every complete whole is always less than `
          + `one.<br>`
          + `${bold(ANS)}.`,
      },
      {
        // The gap UP to the next whole instead of the leftover — the same error
        // the skill's scaffolded question (3478c34e) already traps, which is
        // why it is worth trapping on the unscaffolded shape too.
        answer_template: `{{${W}}} {{fracStr(${D}-${R}, ${D})}}`,
        method_marks: 0,
        misconception: 'subtracted_in_the_wrong_order',
        response:
          `That is the gap UP to the next whole one, not what is left over. The subtraction runs the `
          + `other way: count down from what you have, {{${N}}} &#8722; {{${W}}} × {{${D}}} = `
          + `{{${R}}}, rather than up from {{${W}}} to the next whole one at {{${W}+1}}.<br>`
          + `${bold(ANS)}.`,
      },
    ],
  }
}

// ── The draws ───────────────────────────────────────────────────────────────
// Every draw satisfies, and check() asserts: 2 ≤ r < d, w < d, w ≠ r, r does
// not divide d, and r ≠ d − r. Each condition keeps one trap honest — see the
// assertion block for which.
const Q1 = conversion({ w: [1, 2, 1, 2, 1, 3], r: [2, 3, 3, 3, 4, 2], d: [3, 4, 4, 5, 5, 5] }, false)
const Q2 = conversion({ w: [4, 3, 5, 4, 6, 4], r: [3, 5, 4, 7, 4, 2], d: [5, 7, 9, 8, 9, 7] }, false)
const Q3 = conversion({ w: [2, 5, 1, 4, 3, 3], r: [6, 4, 4, 6, 8, 9], d: [8, 6, 10, 9, 10, 12] }, true)

const questions = [
  {
    skill_ids: ['irregular_and_improper_fractions'],
    kind: 'mastery', difficulty: 1, marks: 1, calculator: 'na',
    question_type: 'numeric', answer_type: 'fraction',
    // The wording does not ask for simplest form, and with gcd(r, d) = 1 on
    // every draw there is nothing to reduce. Leaving it false keeps the
    // grader's strictness level with what the question actually says — the
    // second direction audit-bank.ts sweeps.
    requires_simplest: false,
    requires_fraction_form: 'mixed',
    parameters: PARAMS,
    ...Q1,
  },
  {
    skill_ids: ['irregular_and_improper_fractions'],
    kind: 'mastery', difficulty: 2, marks: 1, calculator: 'na',
    question_type: 'numeric', answer_type: 'fraction',
    requires_simplest: false,
    requires_fraction_form: 'mixed',
    parameters: PARAMS,
    ...Q2,
  },
  {
    skill_ids: ['irregular_and_improper_fractions', 'simplifying_fractions'],
    // Mastery, not exam: simplifying_fractions is this skill's own prerequisite
    // in skills.ts, so the two are not independent and the synthesis bar is not
    // met. Both are tagged because both are genuinely exercised.
    kind: 'mastery', difficulty: 3, marks: 1, calculator: 'na',
    question_type: 'numeric', answer_type: 'fraction',
    // Here the wording DOES ask for it, and reducing the leftover is half the
    // question. A student who answers "2 6/8" is nudged rather than marked.
    requires_simplest: true,
    requires_fraction_form: 'mixed',
    parameters: PARAMS,
    ...Q3,
  },
]

// ─────────────────────────────────────────────────────────────────────────────

const txt = (x: string) => x.replace(/<\/p>\s*<p[^>]*>/g, '\n      ').replace(/<br\s*\/?>/g, '\n      ')
  // frac() renders a STACKED fraction — two spans, one above the other. Stripping
  // the tags naively glued them into "228" for 22/8, which made the dry run
  // unreadable exactly where it needed checking.
  .replace(/<span[^>]*>\s*<span[^>]*>([^<]*)<\/span>\s*<span[^>]*>([^<]*)<\/span>\s*<\/span>/g, '$1/$2')
  .replace(/<[^>]+>/g, '').replace(/&#8722;/g, '−').replace(/&#247;/g, '÷').replace(/&nbsp;/g, ' ')
  .replace(/[ \t]+/g, ' ').trim()

/** The numeric value of a rendered answer: "2 3/4", "7/4" or "2". */
function val(s: string): number {
  const mix = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mix) return Number(mix[1]) + Number(mix[2]) / Number(mix[3])
  const f = s.match(/^(-?\d+)\/(-?\d+)$/)
  return f ? Number(f[1]) / Number(f[2]) : Number(s)
}

const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a

/** The improper form of a rendered mixed number: "2 3/4" → "11/4". */
function improperOf(mixedStr: string): string {
  const m = mixedStr.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (!m) throw new Error(`"${mixedStr}" is not a mixed number`)
  const [w, n, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  return `${w * d + n}/${d}`
}

function check() {
  for (const [qi, qq] of questions.entries()) {
    console.log(`\n${'='.repeat(78)}\nQ${qi + 1}  ${JSON.stringify(qq.skill_ids)}  ${qq.kind} `
      + `d${qq.difficulty} ${qq.marks}m  ${qq.answer_type} simplest=${qq.requires_simplest} `
      + `form=${qq.requires_fraction_form}`)

    for (let sel = 0; sel <= 5; sel++) {
      const v = { sel }
      const w = qq.draws.w[sel], r = qq.draws.r[sel], d = qq.draws.d[sel]
      const where = `Q${qi + 1} sel=${sel} (${w}, ${r}, ${d})`

      // ── The draw conditions, each one holding up a trap ──────────────────
      if (!(r >= 2)) throw new Error(`${where}: r < 2 — the "remainder underneath" trap renders "${d}/1"`)
      if (!(r < d)) throw new Error(`${where}: the leftover is not less than the denominator`)
      if (!(w < d)) throw new Error(`${where}: w >= d — the swapped trap's fraction part is not proper`)
      if (w === r) throw new Error(`${where}: w = r — the swapped trap IS the answer`)
      if (d % r === 0) throw new Error(`${where}: r divides d — the upside-down trap collapses to a whole`)
      if (r === d - r) throw new Error(`${where}: r = d - r — the gap trap IS the answer`)

      const ans = evaluateTemplate(qq.answer_template, v)
      const traps = qq.traps.map(t => evaluateTemplate(t.answer_template, v))

      for (const [name, str] of ([['answer', ans], ...traps.map((t, i) => [`trap ${i + 1}`, t])] as [string, string][])) {
        if (/undefined|NaN|\{\{|\}\}|Infinity/.test(str)) throw new Error(`${where} ${name} renders "${str}"`)
        // Every one of these is a MIXED NUMBER by construction. A trap that
        // collapsed to "3 2" (fracStr returning a whole) would still grade by
        // value, so no test would fail — the student would simply be shown
        // nonsense. Hence the shape check rather than a render check.
        if (!/^\d+ \d+\/\d+$/.test(str)) throw new Error(`${where} ${name} is not a mixed number: "${str}"`)
      }

      const answerVal = val(ans)
      const vals = [answerVal, ...traps.map(val)]
      const dupe = vals.filter((x, i) => vals.findIndex(y => Math.abs(y - x) < 1e-9) !== i)
      if (dupe.length) throw new Error(`${where}: a trap collides by value (${[ans, ...traps].join(' | ')})`)

      // The canonical answer must be a PROPER mixed number in lowest terms —
      // the grader's own definition of a simplest-form mixed number, and what
      // makes requires_simplest safe to turn on (Q3).
      const m = ans.match(/^(\d+) (\d+)\/(\d+)$/)!
      if (Number(m[2]) >= Number(m[3])) throw new Error(`${where}: "${ans}" has an improper fraction part`)
      if (gcd(Number(m[2]), Number(m[3])) !== 1) throw new Error(`${where}: "${ans}" is not in lowest terms`)

      // The typing example in the stem must never BE the answer or a trap.
      if ([ans, ...traps].includes('3 1/8')) throw new Error(`${where}: collides with the "3 1/8" typing example`)

      for (const t of qq.traps) {
        if (t.method_marks >= qq.marks) throw new Error(`${where}: method_marks ${t.method_marks} on a ${qq.marks}-mark question`)
      }
      if (!evaluateTemplate(qq.explanation, v).includes(`<strong>${ans}</strong>`)) {
        throw new Error(`${where}: the explanation does not end on "${ans}"`)
      }

      // ── The grader, called exactly as the live surface calls it ──────────
      const grade = (student: string) => checkAnswer(
        student, ans, qq.answer_type as 'fraction', null,
        qq.traps.map(t => ({
          answer: evaluateTemplate(t.answer_template, v),
          response: evaluateTemplate(t.response, v),
          method_marks: t.method_marks,
          misconception: t.misconception,
        })),
        qq.requires_simplest, qq.answer_template, undefined,
        qq.requires_fraction_form as 'mixed')

      const self = grade(ans)
      if (!self.correct) throw new Error(`${where}: canonical "${ans}" not accepted — ${txt(self.message)}`)

      // The improper fraction the question HANDED the student must not score.
      const imp = improperOf(ans)
      const impRes = grade(imp)
      if (impRes.correct) throw new Error(`${where}: the improper fraction "${imp}" was accepted`)
      if (impRes.trap?.misconception !== 'answer_not_in_requested_form') {
        throw new Error(`${where}: "${imp}" did not give the wrong-form misconception (${JSON.stringify(impRes.trap)})`)
      }

      // The decimal route out is closed too — same value, no conversion shown.
      if (grade(String(Math.round(answerVal * 1e6) / 1e6)).correct) {
        throw new Error(`${where}: the decimal form was accepted`)
      }

      // Each trap fires, and fires as ITSELF rather than being shadowed.
      for (const [ti, t] of traps.entries()) {
        const res = grade(t)
        if (res.correct) throw new Error(`${where}: trap ${ti + 1} "${t}" was marked correct`)
        if (!res.trap?.response) throw new Error(`${where}: trap ${ti + 1} "${t}" gave no trap feedback`)
        if (res.trap.response !== evaluateTemplate(qq.traps[ti].response, v)) {
          throw new Error(`${where}: trap ${ti + 1} "${t}" fired a DIFFERENT trap`)
        }
      }

      const stemFrac = `${w * d + r}/${d}`
      console.log(`  sel=${sel}  ${stemFrac.padEnd(7)} answer ${ans.padEnd(8)} `
        + `improper(rejected) ${imp.padEnd(7)} traps ${traps.join('   ')}`)
    }

    console.log(`\n  -- sel=0\n      ${txt(evaluateTemplate(qq.question_template, { sel: 0 }))}`)
    console.log(`      answer: ${evaluateTemplate(qq.answer_template, { sel: 0 })}`)
    for (const t of qq.traps) {
      console.log(`      trap "${evaluateTemplate(t.answer_template, { sel: 0 })}" `
        + `(${t.method_marks} of ${qq.marks}) [${t.misconception}]`)
      console.log(`         ${txt(evaluateTemplate(t.response, { sel: 0 }))}`)
    }
    console.log(`\n      explanation\n      ${txt(evaluateTemplate(qq.explanation, { sel: 0 }))}`)
  }
}

/**
 * The mirror probe, on the live mixed → improper question: its canonical answer
 * IS an improper fraction, so once the column says 'improper' the mixed form of
 * the same value must be refused. Reads the row so it reports the column as the
 * database actually has it, before and after --apply.
 */
async function probePublished() {
  const { data, error } = await supabase.from('questions')
    .select('id, answer_template, answer_type, requires_simplest, requires_fraction_form, is_published')
    .eq('id', PUBLISHED_IMPROPER_ID).single()
  if (error) throw error

  const v = { w: 2, p: 1, q: 3 }                          // the stem reads "2 1/3"
  const ans = evaluateTemplate(data.answer_template, v)   // "7/3"
  const grade = (student: string, form: string | null) => checkAnswer(
    student, ans, data.answer_type as 'fraction', null, [], data.requires_simplest,
    data.answer_template, undefined, form as 'improper' | null)

  console.log(`\n${'='.repeat(78)}\nPublished mixed -> improper question ${data.id}`)
  console.log(`  in the database: requires_fraction_form = ${JSON.stringify(data.requires_fraction_form)}`
    + `  (is_published=${data.is_published})`)
  console.log(`  stem "2 1/3" as an improper fraction; canonical answer "${ans}"`)
  for (const form of [null, 'improper'] as const) {
    for (const student of [ans, '2 1/3']) {
      const res = grade(student, form)
      console.log(`    form=${String(form).padEnd(8)} student "${student}"${' '.repeat(7 - student.length)}`
        + ` -> ${res.correct ? 'CORRECT' : 'WRONG  '}  ${(res.trap?.misconception ?? '').padEnd(28)}`
        + `${txt(res.message).slice(0, 60)}`)
    }
  }
}

/** The rows exactly as they would be inserted. */
function rows() {
  return questions.map(q => {
    // `draws` and `improperNumerator` exist for the assertions in check(); they
    // are not columns.
    const { draws, improperNumerator, ...row } = q
    void draws; void improperNumerator
    return { ...row, is_published: false }
  })
}

async function main() {
  const apply = process.argv.includes('--apply')

  // --json writes the pre-insert rows for the real verifier to chew on:
  //   npx tsx scripts/create-improper-to-mixed-batch.ts --json batch.json
  //   npx tsx scripts/verify-question.ts --file batch.json
  // which is the same gate as --drafts, one step earlier.
  const jsonAt = process.argv.indexOf('--json')
  if (jsonAt !== -1) {
    const path = process.argv[jsonAt + 1]
    if (!path) throw new Error('--json needs a path')
    writeFileSync(path, JSON.stringify(rows(), null, 2))
    console.log(`wrote ${questions.length} pre-insert rows to ${path}`)
    return
  }

  check()
  await probePublished()

  if (!apply) { console.log(`\n\ndry run — pass --apply to insert ${questions.length} questions`); return }

  const { data, error } = await supabase.from('questions')
    .insert(rows())
    .select('id, skill_ids, kind, difficulty, requires_fraction_form, is_published')
  if (error) throw error
  console.log(`\n\nInserted ${data?.length} questions, all unpublished:`)
  for (const x of data ?? []) {
    console.log(`  ${x.id}  ${(x.skill_ids as string[]).join('+')}  ${x.kind} d${x.difficulty}  `
      + `form=${x.requires_fraction_form}  is_published=${x.is_published}`)
  }

  // The mirrored fix on the live question. One column; publish state untouched.
  const { data: upd, error: uErr } = await supabase.from('questions')
    .update({ requires_fraction_form: 'improper' })
    .eq('id', PUBLISHED_IMPROPER_ID)
    .select('id, requires_fraction_form, is_published')
    .single()
  if (uErr) throw uErr
  console.log(`\n  ${upd.id}  form=${upd.requires_fraction_form}  is_published=${upd.is_published}`
    + `  (mixed -> improper, unchanged otherwise)`)

  await probePublished()
}

main().catch(e => { console.error(e); process.exit(1) })
