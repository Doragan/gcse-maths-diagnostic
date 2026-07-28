import './env'
import { createClient } from '@supabase/supabase-js'
import { renderMultiPartQuestion } from '../lib/questions/paramEngine'
import { checkMultiBlank, type BlankCheck } from '../lib/questions/multiBlank'
import { checkAnswer } from '../lib/questions/answerChecker'

// e58728e6 (quadratic): two requested changes —
//  (a) trap a student who writes just the y-value instead of the coordinate.
//  (b) rewrite to ask for the two x-axis CROSSING POINTS as coordinates
//      (x, 0), matching part (a)'s coordinate style.
const ID = 'e58728e6-94ea-4f3b-83b7-12fb995e569d'

// Shared feedback for the two coordinate blanks (generic across both roots).
const SIGN_MSG = 'Each bracket equals zero: (x &minus; {{p}}) = 0 gives x = {{p}}, and (x &minus; {{p+2*k}}) = 0 gives x = {{p+2*k}}. A minus sign inside the bracket gives a POSITIVE root, so the points are ({{p}}, 0) and ({{p+2*k}}, 0).'
const VALUE_ONLY_MSG = 'Give the full coordinate, not just the value. The curve meets the x-axis where y = 0, so each crossing point is written (x, 0).'

// Both roots as coordinate sign-error traps AND as bare-value traps, on BOTH
// blanks, so the slip is caught whichever box the student uses.
const blankTraps = [
  { answer_template: '({{0-p}}, 0)', response: SIGN_MSG },
  { answer_template: '({{0-(p+2*k)}}, 0)', response: SIGN_MSG },
  { answer_template: '{{p}}', response: VALUE_ONLY_MSG },
  { answer_template: '{{p+2*k}}', response: VALUE_ONLY_MSG },
]

const NEW_PART_B = {
  kind: 'mastery',
  marks: 2,
  traps: [],
  prompt: '<p>(b) Write down the <strong>coordinates</strong> of the two points where the curve crosses the <strong>x-axis</strong>. Give the point with the smaller x-value first.</p>',
  skill_ids: ['solving_quadratic_equations_factorising'],
  tolerance: null,
  answer_type: 'multi_blank',
  explanation: 'Factorise: x² &minus; {{2*p+2*k}}x + {{p*(p+2*k)}} = (x &minus; {{p}})(x &minus; {{p+2*k}}).<br>The curve crosses the x-axis where y = 0, at <strong>({{p}}, 0)</strong> and <strong>({{p+2*k}}, 0)</strong>.',
  answer_template: '',
  requires_simplest: false,
  blanks: [
    {
      label: 'A', marks: 1, prompt: 'The crossing point with the smaller x-value',
      answer_type: 'coordinate', tolerance: 0, requires_simplest: false,
      answer_template: '({{p}}, 0)', traps: blankTraps,
    },
    {
      label: 'B', marks: 1, prompt: 'The crossing point with the larger x-value',
      answer_type: 'coordinate', tolerance: 0, requires_simplest: false,
      answer_template: '({{p+2*k}}, 0)', traps: blankTraps,
    },
  ],
}

// Part (a): keep the axes-swapped trap, add the "gave just the y-value" trap.
const PART_A_VALUE_TRAP = {
  answer_template: '{{p*(p+2*k)}}',
  response: 'That is the y-value, not the coordinate. The point where the curve crosses the y-axis is (0, {{p*(p+2*k)}}).',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('parameters, parts').eq('id', ID).single()
  if (error) throw error
  const parts = JSON.parse(JSON.stringify(data.parts))

  // (a) append the value-only trap if not already there.
  const aTraps = parts[0].traps as any[]
  if (!aTraps.some(t => t.answer_template === PART_A_VALUE_TRAP.answer_template)) {
    aTraps.push(PART_A_VALUE_TRAP)
  }
  // (b) replace with the coordinate version.
  if (parts[1]?.skill_ids?.[0] !== 'solving_quadratic_equations_factorising') {
    throw new Error(`part[1] is not the roots part: ${JSON.stringify(parts[1]?.skill_ids)}`)
  }
  parts[1] = NEW_PART_B

  // Verify across every valid (p, k) combo.
  let combos = 0
  for (let p = 1; p <= 4; p++) for (let k = 1; k <= 3; k++) {
    const v = { p, k }
    const r = renderMultiPartQuestion('', parts as any, data.parameters as any, v)

    // (a) coordinate correct; bare y-value trapped; axes-swap trapped.
    const ra = r.parts[0]
    const y = p * (p + 2 * k)
    const aOK = checkAnswer(`(0, ${y})`, ra.answer, 'coordinate', 0, ra.traps)
    if (!aOK.correct) throw new Error(`${JSON.stringify(v)}: correct (a) rejected`)
    const aValue = checkAnswer(String(y), ra.answer, 'coordinate', 0, ra.traps)
    if (aValue.correct || !aValue.trap) throw new Error(`${JSON.stringify(v)}: bare y-value not trapped in (a)`)
    const aSwap = checkAnswer(`(${y}, 0)`, ra.answer, 'coordinate', 0, ra.traps)
    if (aSwap.correct || !aSwap.trap) throw new Error(`${JSON.stringify(v)}: axes-swap not trapped in (a)`)

    // (b) ordered coordinates correct; sign error & value-only both trapped.
    const rb = r.parts[1].blanks!
    const [sm, lg] = [p, p + 2 * k]
    const grade = (a: string, b: string) => checkMultiBlank(rb.map((bl, i): BlankCheck => ({
      label: bl.label, student: i === 0 ? a : b, answer: bl.answer,
      answer_type: 'coordinate', tolerance: 0, requires_simplest: false, traps: bl.traps, ecf: bl.ecf,
    })))
    const bOK = grade(`(${sm}, 0)`, `(${lg}, 0)`)
    if (!bOK.correct || bOK.correctCount !== 2) throw new Error(`${JSON.stringify(v)}: correct (b) not full marks`)
    const bSign = grade(`(${-lg}, 0)`, `(${-sm}, 0)`)
    if (bSign.blanks.some(x => x.correct) || bSign.blanks.some(x => !x.trap)) throw new Error(`${JSON.stringify(v)}: (b) sign error not both trapped`)
    const bValue = grade(String(sm), String(lg))
    if (bValue.blanks.some(x => x.correct) || bValue.blanks.some(x => !x.trap)) throw new Error(`${JSON.stringify(v)}: (b) value-only not both trapped`)
    combos++
  }
  console.log(`verified across all ${combos} (p,k) combos: (a) coord/value/swap, (b) coords correct + sign & value-only trapped.`)

  const { error: upErr } = await supabase.from('questions').update({ parts }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: (a) value trap added, (b) now coordinate blanks.`)
}

main().catch(e => { console.error(e); process.exit(1) })
