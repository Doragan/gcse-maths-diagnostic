import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// 61956a8d — the stem already shows the formula as a stacked fraction via
// frac(), but the explanation and all six trap responses wrote the answer in
// inline slash notation, "x = (4 + 3y)/(y − 1)". Render it the same way the
// question does.
//
// The numerator is built by concatenation inside a single {{...}} because
// template blocks cannot nest. At b = 1 it produces "2 + 1y", which
// cleanExpression collapses to "2 + y" — it treats the frac numerator as a
// text node, so the invisible-coefficient rule reaches inside the markup.
const ID = '61956a8d-cdd4-4f89-85bc-978448311056'

const SLASH = '({{a}} + {{b}}y)/(y − 1)'
const FRAC = "{{frac(a + ' + ' + b + 'y', 'y − 1')}}"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase
    .from('questions').select('question_template, explanation, traps, parameters').eq('id', ID).single()
  if (error) throw error

  let hits = 0
  const swap = (s: string) => {
    const n = s.split(SLASH).length - 1
    hits += n
    return s.split(SLASH).join(FRAC)
  }

  const explanation = swap(data.explanation as string)
  const traps = (JSON.parse(JSON.stringify(data.traps)) as any[]).map(t => ({ ...t, response: swap(t.response as string) }))

  // Every one of the seven texts ends on the answer; a miss means the wording
  // drifted and that text would silently keep slash notation.
  const expected = 1 + traps.length
  if (hits !== expected) throw new Error(`replaced ${hits} occurrences, expected ${expected} — check for reworded responses`)
  if (/\)\/\(/.test(explanation + traps.map(t => t.response).join(''))) {
    throw new Error('inline slash notation still present somewhere')
  }
  console.log(`rewrote ${hits} fractions (1 explanation + ${traps.length} trap responses)`)

  // Render at the extremes so the b = 1 coefficient collapse is actually seen,
  // not assumed. Strip the frac markup down to "num / den" for a readable check.
  const show = (html: string) => html
    .replace(/<span[^>]*border-bottom[^>]*>([^<]*)<\/span><span[^>]*>([^<]*)<\/span>/g, '[$1 over $2]')
    .replace(/<[^>]+>/g, '')
  for (const [a, b] of [[2, 1], [4, 3], [9, 6]] as [number, number][]) {
    console.log(`\n  a=${a} b=${b}`)
    console.log(`    explanation ends: …${show(evaluateTemplate(explanation, { a, b })).slice(-58)}`)
    console.log(`    trap5 ends:       …${show(evaluateTemplate(traps[4].response, { a, b })).slice(-58)}`)
  }

  const { error: upErr } = await supabase.from('questions').update({ explanation, traps }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`\nUpdated ${ID}, left unpublished.`)
}

main().catch(e => { console.error(e); process.exit(1) })
