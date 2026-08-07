import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// 8e8c3a24 (function_machines): each blank had one trap. Add the common
// remaining slips —
//   B: gave box A's value (stopped after × a, forgot to add b)  → a*x
//   B: subtracted b instead of adding it                        → a*x - b
//   C: only did the first reverse step (subtracted b, no divide)→ a*y
const ID = '8e8c3a24-c94f-45d2-85cb-dd425ad0bc6e'

const NEW: Record<string, { answer_template: string, response: string }[]> = {
  B: [
    {
      answer_template: '{{a*x}}',
      response: "That's the value after the × {{a}} step (box A). The machine has a second step — add {{b}}: {{a*x}} + {{b}} = {{a*x+b}}.",
    },
    {
      answer_template: '{{a*x-b}}',
      response: 'The second step ADDS {{b}}, it does not subtract it: {{a*x}} + {{b}} = {{a*x+b}}.',
    },
  ],
  C: [
    {
      answer_template: '{{a*y}}',
      response: "That's only the first reverse step. After subtracting {{b}} you must divide by {{a}}: {{a*y}} ÷ {{a}} = {{y}}.",
    },
  ],
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Exhaustive distinctness pre-check across every valid parameter combo: within
// each blank, no two trap values may coincide and none may equal the answer —
// a collision makes the second trap unreachable and the feedback ambiguous.
function assertDistinct(parts: any) {
  const b = parts[0].blanks as any[]
  let combos = 0
  for (let a = 2; a <= 5; a++)
    for (let bb = 2; bb <= 9; bb++)
      for (let x = 3; x <= 9; x++)
        for (let y = 3; y <= 9; y++) {
          if (y === x) continue
          const v = { a, b: bb, x, y }
          for (const blank of b) {
            const answer = evaluateTemplate(`{{${blank.answer_template.replace(/[{}]/g, '')}}}`, v)
            const trapVals = blank.traps.map((t: any) => evaluateTemplate(t.answer_template, v))
            const all = [answer, ...trapVals]
            if (new Set(all).size !== all.length) {
              throw new Error(`collision in ${blank.label} at ${JSON.stringify(v)}: answer=${answer}, traps=[${trapVals}]`)
            }
          }
          combos++
        }
  return combos
}

async function main() {
  const { data, error } = await supabase.from('questions').select('parts').eq('id', ID).single()
  if (error) throw error
  const parts = JSON.parse(JSON.stringify(data.parts))
  const blanks = parts[0].blanks as any[]

  for (const [label, traps] of Object.entries(NEW)) {
    const blank = blanks.find(b => b.label === label)
    if (!blank) throw new Error(`no blank ${label}`)
    for (const t of traps) {
      if (blank.traps.some((e: any) => e.answer_template === t.answer_template)) {
        console.log(`  ${label} already has ${t.answer_template} — skipping`)
        continue
      }
      blank.traps.push(t)
    }
  }

  const combos = assertDistinct(parts)
  console.log(`distinctness holds across all ${combos} valid parameter combos (answer ≠ every trap, traps pairwise distinct).`)

  const { error: upErr } = await supabase.from('questions').update({ parts }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: +2 traps on B, +1 on C.`)
}

main().catch(e => { console.error(e); process.exit(1) })
