import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// 4c0e94c1 (nth term, find term number): the trap I added last time ("wrote
// down the term's value as the answer", dm+c) was the wrong reading. The
// intended misconception is SUBSTITUTING the given term's value in for n in
// the nth-term formula itself — i.e. evaluating d*(dm+c)+c instead of solving
// dn+c = dm+c for n. Replace the previous trap with this one.
const ID = '4c0e94c1-4bec-4dcb-a7fa-e59c576f22aa'

const OLD_TRAP_TEMPLATE = '{{d*m+c}}'
const NEW_TRAP = {
  answer_template: '{{d*(d*m+c)+c}}',
  response: 'You substituted the given term&apos;s VALUE in for n. n is what you are solving for — set {{d}}n + {{c}} = {{d*m+c}} and solve: subtract {{c}}, then divide by {{d}}, giving n = {{m}}. It is the {{m}}th term.',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('parameters, traps').eq('id', ID).single()
  if (error) throw error
  const traps = (data.traps as any[]).filter(t => t.answer_template !== OLD_TRAP_TEMPLATE)
  if (traps.length !== (data.traps as any[]).length - 1) {
    throw new Error('expected to remove exactly one trap (the old one) — traps array did not match')
  }
  traps.push(NEW_TRAP)

  // Exhaustive: answer (m) and all trap values pairwise distinct throughout.
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
  console.log(`Updated ${ID}: replaced the value-only trap with "substituted the term's value in for n".`)
}

main().catch(e => { console.error(e); process.exit(1) })
