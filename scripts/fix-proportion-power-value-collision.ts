import './env'
import { createClient } from '@supabase/supabase-js'
import { renderMultiPartQuestion } from '../lib/questions/paramEngine'

// 4325c702: with k in [2,5] and x1 in [2,5], the ONLY combo where y1=k*x1^n
// falls inside x2's range [3,9] is (sel=0, x1=2, k=2) -> y1=8, which can then
// numerically coincide with x2=8 — "y = 8 ... x = 8" two sentences apart,
// genuinely confusing even though they're different quantities. Raising k's
// minimum to 3 makes the smallest possible y1 (3*2^2=12) exceed x2's max (9),
// eliminating the whole collision class rather than excluding one instance.
const ID = '4325c702-af42-4197-9f65-d58251fbdf00'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('parameters, parts').eq('id', ID).single()
  if (error) throw error
  const params = JSON.parse(JSON.stringify(data.parameters))
  if (params.k.min !== 2) throw new Error(`expected k.min=2, found ${params.k.min} — question may have changed further`)
  params.k.min = 3

  let combos = 0
  for (let sel = 0; sel <= 1; sel++) {
    for (let x1 = 2; x1 <= 5; x1++) {
      for (let x2 = 3; x2 <= 9; x2++) {
        if (x2 <= x1) continue
        for (let k = 3; k <= 5; k++) {
          const v = { sel, x1, x2, k }
          const r = renderMultiPartQuestion('', data.parts as any, params as any, v)
          const y1 = k * Math.pow(x1, [2, 3][sel])

          // The defect just found: y1 must never visibly coincide with x1 or
          // x2 — those are the three numbers shown in the question text.
          if (y1 === x1 || y1 === x2) {
            throw new Error(`${JSON.stringify(v)}: y1=${y1} collides with a shown x-value`)
          }

          for (const p of r.parts) {
            if (/\[error|\{\{/.test(p.prompt) || /\[error|\{\{/.test(p.explanation ?? '')) {
              throw new Error(`${JSON.stringify(v)}: render error — ${p.prompt}`)
            }
            const vals = [p.answer, ...p.traps.map(t => t.answer)]
            if (vals.some(x => /\[error|NaN/.test(x))) throw new Error(`${JSON.stringify(v)}: eval error [${vals}]`)
            if (new Set(vals).size !== vals.length) throw new Error(`${JSON.stringify(v)}: value collision [${vals}]`)
          }

          // The load-bearing property from the original fix must still hold:
          // the y=x^n shortcut must still be wrong (k>=2 still, now k>=3).
          const shortcut = Math.pow(x2, [2, 3][sel])
          if (shortcut === r.parts[0].answer as any) throw new Error(`${JSON.stringify(v)}: shortcut accidentally correct`)

          combos++
        }
      }
    }
  }
  console.log(`verified across all ${combos} combos: y1 never visibly coincides with x1 or x2, no render/collision issues, shortcut still wrong.`)

  const { error: upErr } = await supabase.from('questions').update({ parameters: params }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: k.min raised from 2 to 3.`)
}

main().catch(e => { console.error(e); process.exit(1) })
