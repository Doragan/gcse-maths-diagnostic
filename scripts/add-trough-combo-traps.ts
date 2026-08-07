import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// 2e5dd32f (trough volume→litres): the three existing traps are two
// INDEPENDENT mistakes — halving the triangle area (trap 2) and converting to
// litres (traps 1 & 3, two alternative wrong conversions). Add the combos of
// the halving error with EACH conversion error (halving x no-conversion,
// halving x wrong-factor). The two conversion errors are alternative wrong
// values for the SAME step, so they can't combine with each other.
const ID = '2e5dd32f-d701-4e26-ba96-36b4d892a738'

const NEW_TRAPS = [
  {
    answer_template: '{{20000*p*q*r}}',
    response: 'Two mistakes here. First, you treated the cross-section as a rectangle — it is a TRIANGLE, so halve it: ½ × {{20*p}} × {{10*q}} = {{100*p*q}} cm². Second, that value is in cm³ — the question asks for LITRES, so divide by 1000: {{100*p*q}} × {{100*r}} = {{10000*p*q*r}} cm³ = {{10*p*q*r}} litres.',
  },
  {
    answer_template: '{{200*p*q*r}}',
    response: 'Two mistakes here. First, you treated the cross-section as a rectangle — it is a TRIANGLE, so halve it: ½ × {{20*p}} × {{10*q}} = {{100*p*q}} cm². Second, 1 litre = 1000 cm³, not 100 — the correct volume is {{100*p*q}} × {{100*r}} = {{10000*p*q*r}} cm³ = {{10*p*q*r}} litres.',
  },
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('parameters, traps').eq('id', ID).single()
  if (error) throw error
  const traps = JSON.parse(JSON.stringify(data.traps)) as any[]
  for (const t of NEW_TRAPS) {
    if (!traps.some(e => e.answer_template === t.answer_template)) traps.push(t)
  }

  // Every value (answer + all traps) must be pairwise distinct across the
  // whole parameter space — all six are constant multiples of pqr (10, 10000,
  // 20, 100, 20000, 200), so they can only collide if two multipliers were
  // equal, which they aren't. Still verify exhaustively rather than trust the
  // argument.
  const ANSWER_MULT = 10
  const allMults = [ANSWER_MULT, ...traps.map(t => {
    const m = t.answer_template.match(/\{\{(\d+)\*p\*q\*r\}\}/)
    if (!m) throw new Error(`unexpected trap shape: ${t.answer_template}`)
    return Number(m[1])
  })]
  if (new Set(allMults).size !== allMults.length) {
    throw new Error(`multiplier collision among [${allMults}] — a trap is unreachable`)
  }

  let combos = 0
  for (let p = 2; p <= 4; p++) for (let q = 3; q <= 6; q++) for (let r = 1; r <= 3; r++) {
    const v = { p, q, r }
    const vals = allMults.map(m => Number(evaluateTemplate(`{{${m}*p*q*r}}`, v)))
    if (new Set(vals).size !== vals.length) {
      throw new Error(`${JSON.stringify(v)}: value collision among [${vals}]`)
    }
    combos++
  }
  console.log(`multiplier check + ${combos} (p,q,r) combos: answer and all ${traps.length} traps pairwise distinct throughout.`)

  const { error: upErr } = await supabase.from('questions').update({ traps }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: +2 combo traps (halving x no-conversion, halving x wrong-factor).`)
}

main().catch(e => { console.error(e); process.exit(1) })
