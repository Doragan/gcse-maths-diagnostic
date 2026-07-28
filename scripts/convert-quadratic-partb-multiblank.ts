import './env'
import { createClient } from '@supabase/supabase-js'
import { renderMultiPartQuestion } from '../lib/questions/paramEngine'
import { checkMultiBlank, type BlankCheck } from '../lib/questions/multiBlank'

// e58728e6 (quadratic): part (b) asks for the TWO roots but took them as one
// expression string ("x = 3 and x = 7"). Convert it to a two-blank multi_blank
// so each root is entered and marked separately. The roots are interchangeable,
// which multi_blank can't grade order-free, so we ask for them in increasing
// order (p is always the smaller since k >= 1). Each blank carries BOTH
// sign-error values as traps, so the (x - p) = 0 -> x = -p slip fires whichever
// box the student drops the negative root into.
const ID = 'e58728e6-94ea-4f3b-83b7-12fb995e569d'

const SIGN_MSG = 'Each bracket equals zero: (x &minus; {{p}}) = 0 gives x = {{p}}, and (x &minus; {{p+2*k}}) = 0 gives x = {{p+2*k}}. A minus sign inside the bracket gives a POSITIVE root.'
const signTraps = [
  { answer_template: '{{0-p}}', response: SIGN_MSG },
  { answer_template: '{{0-(p+2*k)}}', response: SIGN_MSG },
]

const NEW_PART_B = {
  kind: 'mastery',
  marks: 2,
  traps: [],
  prompt: '<p>(b) The curve crosses the <strong>x-axis</strong> at two points. Find the two values of x, giving them in increasing order.</p>',
  skill_ids: ['solving_quadratic_equations_factorising'],
  tolerance: null,
  answer_type: 'multi_blank',
  explanation: 'Factorise: x² &minus; {{2*p+2*k}}x + {{p*(p+2*k)}} = (x &minus; {{p}})(x &minus; {{p+2*k}}).<br>The curve crosses the x-axis where y = 0: <strong>x = {{p}}</strong> and <strong>x = {{p+2*k}}</strong>.',
  answer_template: '',
  requires_simplest: false,
  blanks: [
    {
      label: 'A', marks: 1, prompt: 'The smaller value of x',
      answer_type: 'numeric', tolerance: 0, requires_simplest: false,
      answer_template: '{{p}}', traps: signTraps,
    },
    {
      label: 'B', marks: 1, prompt: 'The larger value of x',
      answer_type: 'numeric', tolerance: 0, requires_simplest: false,
      answer_template: '{{p+2*k}}', traps: signTraps,
    },
  ],
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('parameters, parts').eq('id', ID).single()
  if (error) throw error
  const parts = JSON.parse(JSON.stringify(data.parts))
  if (parts[1]?.skill_ids?.[0] !== 'solving_quadratic_equations_factorising') {
    throw new Error(`part[1] is not the roots part: ${JSON.stringify(parts[1]?.skill_ids)}`)
  }
  parts[1] = NEW_PART_B

  // Verify over every valid (p, k) combo: correct ordered roots score 2/2;
  // both sign-error orderings are caught by a trap; and the two roots are
  // always distinct (so the blanks are never ambiguous).
  let combos = 0
  for (let p = 1; p <= 4; p++) for (let k = 1; k <= 3; k++) {
    const v = { p, k }
    const r = renderMultiPartQuestion('', [NEW_PART_B] as any, data.parameters as any, v)
    const rb = r.parts[0].blanks!
    const [smaller, larger] = [p, p + 2 * k]
    if (smaller === larger) throw new Error(`repeated root at ${JSON.stringify(v)}`)
    const grade = (aStu: string, bStu: string) => checkMultiBlank(rb.map((b, i): BlankCheck => ({
      label: b.label, student: i === 0 ? aStu : bStu, answer: b.answer,
      answer_type: 'numeric', tolerance: 0, requires_simplest: false, traps: b.traps, ecf: b.ecf,
    })))
    // Correct, in order.
    const ok = grade(String(smaller), String(larger))
    if (!ok.correct || ok.correctCount !== 2) throw new Error(`${JSON.stringify(v)}: correct ordered roots not full marks`)
    // Sign error, ordered increasingly: A = -(larger), B = -(smaller); both trap.
    const se = grade(String(-larger), String(-smaller))
    if (se.blanks.some(b => b.correct) || se.blanks.some(b => !b.trap)) {
      throw new Error(`${JSON.stringify(v)}: sign-error roots not both trapped (${JSON.stringify(se.blanks)})`)
    }
    combos++
  }
  console.log(`verified across all ${combos} (p,k) combos: correct→2/2, sign error→both trapped, roots distinct.`)

  const { error: upErr } = await supabase.from('questions').update({ parts }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: part (b) is now a two-blank multi_blank.`)
}

main().catch(e => { console.error(e); process.exit(1) })
