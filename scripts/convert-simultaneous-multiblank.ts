import './env'
import { createClient } from '@supabase/supabase-js'
import { renderMultiPartQuestion } from '../lib/questions/paramEngine'
import { checkMultiBlank, type BlankCheck } from '../lib/questions/multiBlank'

// c995ae38 (simultaneous_equations): was a single question-level `coordinate`
// answer ("x = 3, y = 5"). Convert to a one-part multi_blank with a blank per
// unknown — multi_blank is PART-level only, so a partless question has to
// become a one-part question.
//
// Marks: the question is difficulty 4, which the exam assembler scores at 3
// NOMINAL_MARKS while it is partless. Once it has parts the assembler sums the
// part marks instead, so the split is 2 + 1 to preserve that weight — and it
// mirrors the real scheme (M1 eliminate + A1 for x, then A1 for y).
//
// Blank labels are the unknowns themselves, so the UI reads "x = [ ]" /
// "y = [ ]" rather than "A =" / "B =".
const ID = 'c995ae38-fbff-4a07-a4a3-0879ba5b7189'

// The stem keeps the equations; the "give your answer in the form x = …, y = …"
// line goes, since the labelled blanks now say exactly that.
const STEM = '<p>Solve the simultaneous equations:</p>'
  + '<p style="font-size:18px;text-align:center;line-height:1.9"><strong>'
  + '{{a}}x + {{b}}y = {{a*x0 + b*y0}}<br>{{c}}x &minus; {{b}}y = {{c*x0 - b*y0}}'
  + '</strong></p>'

const NEW_PART = {
  kind: 'mastery',
  marks: 3,
  traps: [],
  prompt: '<p>Give the value of each unknown.</p>',
  skill_ids: ['simultaneous_equations'],
  tolerance: null,
  answer_type: 'multi_blank',
  answer_template: '',
  requires_simplest: false,
  explanation: 'The y-terms have opposite signs, so ADD the equations to eliminate y:<br>({{a}}x + {{c}}x) = {{a*x0 + b*y0}} + {{c*x0 - b*y0}}, so {{a+c}}x = {{(a+c)*x0}}, giving x = {{x0}}.<br>Substitute into the first equation: {{a}}&times;{{x0}} + {{b}}y = {{a*x0 + b*y0}}, so {{b}}y = {{b*y0}}, giving y = {{y0}}.<br><strong>x = {{x0}}, y = {{y0}}</strong>',
  blanks: [
    {
      label: 'x',
      marks: 2,
      answer_type: 'numeric',
      tolerance: 0,
      requires_simplest: false,
      answer_template: '{{x0}}',
      traps: [
        {
          answer_template: '{{y0}}',
          response: 'That is the value of y, not x. Check by substituting into the first equation: {{a}}&times;{{x0}} + {{b}}&times;{{y0}} = {{a*x0 + b*y0}} &#10003;, so x = {{x0}}.',
        },
        {
          answer_template: '{{(a+c)*x0}}',
          response: 'You stopped one step early. Adding the equations gives {{a+c}}x = {{(a+c)*x0}} &mdash; now divide by {{a+c}}: x = {{x0}}.',
        },
      ],
    },
    {
      label: 'y',
      marks: 1,
      answer_type: 'numeric',
      tolerance: 0,
      requires_simplest: false,
      answer_template: '{{y0}}',
      // Substituting the student's OWN x back into equation 1 is the textbook
      // ECF: a wrong x with correct substitution still earns the y mark.
      ecf_template: '({{a*x0 + b*y0}} - {{a}} * [[x]]) / {{b}}',
      traps: [
        {
          answer_template: '{{x0}}',
          response: 'That is the value of x, not y. Substituting into the first equation: {{a}}&times;{{x0}} + {{b}}&times;{{y0}} = {{a*x0 + b*y0}} &#10003;, so y = {{y0}}.',
        },
        {
          answer_template: '{{0-y0}}',
          response: 'Check the sign of y by substituting back: {{a}}&times;{{x0}} + {{b}}&times;({{0-y0}}) = {{a*x0 - b*y0}}, not {{a*x0 + b*y0}}. So y = {{y0}}.',
        },
      ],
    },
  ],
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions')
    .select('parameters, parts, difficulty, is_published').eq('id', ID).single()
  if (error) throw error
  if (data.parts) throw new Error('question already has parts — refusing to overwrite')

  const params = data.parameters as any
  const parts = [NEW_PART]

  // part.marks must equal the blank sum (the harness gates this too).
  const blankSum = NEW_PART.blanks.reduce((s, b) => s + b.marks, 0)
  if (blankSum !== NEW_PART.marks) throw new Error(`marks ${NEW_PART.marks} != blank sum ${blankSum}`)

  let combos = 0
  for (let a = 2; a <= 4; a++) for (let b = 2; b <= 5; b++) for (let c = 3; c <= 5; c++) {
    if (c === a) continue
    for (let x0 = 2; x0 <= 7; x0++) for (let y0 = 2; y0 <= 8; y0++) {
      if (y0 === x0) continue
      const v = { a, b, c, x0, y0 }
      const r = renderMultiPartQuestion(STEM, parts as any, params, v)
      if (/\[error|\{\{/.test(r.stem)) throw new Error(`${JSON.stringify(v)}: stem render error`)
      const rb = r.parts[0].blanks!

      // Within each blank: answer distinct from every trap, traps pairwise
      // distinct — otherwise a trap is unreachable and feedback is ambiguous.
      for (const bl of rb) {
        const vals = [bl.answer, ...bl.traps.map(t => t.answer)]
        if (new Set(vals).size !== vals.length) {
          throw new Error(`${JSON.stringify(v)}: blank ${bl.label} value collision [${vals}]`)
        }
      }

      const grade = (xs: string, ys: string) => checkMultiBlank(rb.map((bl, i): BlankCheck => ({
        label: bl.label, student: i === 0 ? xs : ys, answer: bl.answer,
        answer_type: 'numeric', tolerance: 0, requires_simplest: false,
        traps: bl.traps, ecf: bl.ecf,
      })))

      // Correct → both right, full marks.
      const ok = grade(String(x0), String(y0))
      if (!ok.correct || ok.correctCount !== 2) throw new Error(`${JSON.stringify(v)}: correct answer not full marks`)

      // Swapped → x trapped. (y is ALSO legitimate follow-through when a === b:
      // substituting their x = y0 genuinely yields y = x0, which exam ECF
      // credits — so accept either a trap or a follow-through there.)
      const sw = grade(String(y0), String(x0))
      if (sw.blanks[0].correct || !sw.blanks[0].trap) throw new Error(`${JSON.stringify(v)}: swap not trapped on x`)
      if (!sw.blanks[1].trap && !sw.blanks[1].followThrough) throw new Error(`${JSON.stringify(v)}: swapped y neither trapped nor follow-through`)

      // Sign error on y, and the stopped-early slip on x.
      const sg = grade(String(x0), String(-y0))
      if (sg.blanks[1].correct || !sg.blanks[1].trap) throw new Error(`${JSON.stringify(v)}: y sign error not trapped`)
      const se = grade(String((a + c) * x0), String(y0))
      if (se.blanks[0].correct || !se.blanks[0].trap) throw new Error(`${JSON.stringify(v)}: stopped-early x not trapped`)

      // ECF: a wrong x of x0 + b substituted correctly gives y0 - a (integer),
      // which must be credited as follow-through while x stays wrong.
      const ecf = grade(String(x0 + b), String(y0 - a))
      if (ecf.blanks[0].correct) throw new Error(`${JSON.stringify(v)}: wrong x marked correct`)
      if (!ecf.blanks[1].correct || !ecf.blanks[1].followThrough) {
        throw new Error(`${JSON.stringify(v)}: y did not follow through (${ecf.blanks[1].message})`)
      }
      if (ecf.correct) throw new Error(`${JSON.stringify(v)}: part all-correct despite wrong x`)
      combos++
    }
  }
  console.log(`verified across all ${combos} parameter combos:`)
  console.log('  correct → 2/2 · swap → trapped · sign error → trapped · stopped-early → trapped · wrong x + consistent y → follow-through')

  const { error: upErr } = await supabase.from('questions').update({
    question_template: STEM,
    parts,
    // Question-level answer fields are inert once parts exist; clear them so
    // the stale "x = …, y = …" answer and its traps can't mislead a reader.
    answer_template: '',
    answer_type: 'numeric',
    traps: [],
    explanation: null,
  }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: one-part multi_blank with x and y blanks (published=${data.is_published}).`)
}

main().catch(e => { console.error(e); process.exit(1) })
