import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// 4c0e94c1 (nth term, find term number): add a trap for a student who writes
// down the GIVEN TERM VALUE as the term number — i.e. sets n = dm+c instead of
// solving dn + c = dm+c for n. A very common "answer the wrong quantity" slip
// distinct from the two existing solving-method traps.
const ID = '4c0e94c1-4bec-4dcb-a7fa-e59c576f22aa'

const NEW_TRAP = {
  answer_template: '{{d*m+c}}',
  response: 'That is the VALUE of the term, not its position in the sequence. You need to solve {{d}}n + {{c}} = {{d*m+c}} for n: subtract {{c}}, then divide by {{d}}, giving n = {{m}}. It is the {{m}}th term.',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('parameters, traps').eq('id', ID).single()
  if (error) throw error
  const traps = JSON.parse(JSON.stringify(data.traps)) as any[]
  if (traps.some(t => t.answer_template === NEW_TRAP.answer_template)) {
    console.log('trap already present — nothing to do.')
    return
  }
  traps.push(NEW_TRAP)

  // Exhaustive: the answer (m) and every trap value (including the existing
  // rounded one) must stay pairwise distinct across the whole parameter space.
  let combos = 0
  for (let c = 1; c <= 5; c++) for (let d = 3; d <= 6; d++) for (let m = 15; m <= 30; m++) {
    const v = { c, d, m }
    const vals = [
      evaluateTemplate('{{m}}', v),
      ...traps.map(t => evaluateTemplate(t.answer_template, v)),
    ]
    if (new Set(vals).size !== vals.length) {
      throw new Error(`${JSON.stringify(v)}: value collision among [${vals}]`)
    }
    combos++
  }
  console.log(`verified across all ${combos} (c,d,m) combos: answer and all ${traps.length} traps pairwise distinct.`)

  const { error: upErr } = await supabase.from('questions').update({ traps }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: +1 trap (gave the term's value instead of its position).`)
}

main().catch(e => { console.error(e); process.exit(1) })
