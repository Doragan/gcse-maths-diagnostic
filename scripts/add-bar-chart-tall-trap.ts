import './env'
import { createClient } from '@supabase/supabase-js'
import { generateValues, renderMultiPartQuestion } from '../lib/questions/paramEngine'

// b3020df1 (simple_charts, draw Priya's bar to height h): the bar can only go
// wrong by a gridline-miscount. "One square too short" (h-1) is already
// trapped; add the symmetric "one square too tall" (h+1).
const ID = 'b3020df1-d637-4c38-898a-527feb527769'

const NEW_TRAP = {
  elements: [{ x: 3, y: '{{h + 1}}' }],
  response: '<p>Your bar is one square too tall.</p><p>Count the lines on the vertical axis carefully — the top of the bar must sit on the {{h}} line, not one above it.</p>',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('parameters, parts').eq('id', ID).single()
  if (error) throw error

  const parts = JSON.parse(JSON.stringify(data.parts))
  const grid = parts[0].grid
  const existing: any[] = grid.traps ?? []
  // Idempotent: don't double-add if re-run.
  if (existing.some(t => JSON.stringify(t.elements) === JSON.stringify(NEW_TRAP.elements))) {
    console.log('h+1 trap already present — nothing to do.')
    return
  }
  grid.traps = [...existing, NEW_TRAP]

  // Sanity: over many draws, the h+1 trap must render to a distinct, in-range
  // height that never collides with the canonical (h) or the h-1 trap.
  for (let i = 0; i < 300; i++) {
    const v = generateValues(data.parameters as any)
    const r = renderMultiPartQuestion('', [parts[0]] as any, data.parameters as any, v)
    const g = r.parts[0].grid!
    const canonY = g.elements[0].y as number
    const trapYs = (g.traps ?? []).map(t => t.elements[0].y as number)
    if (new Set([canonY, ...trapYs]).size !== 1 + trapYs.length) {
      throw new Error(`values ${JSON.stringify(v)}: trap/answer height collision (answer ${canonY}, traps ${trapYs})`)
    }
    if (trapYs.some(y => y < g.y.min || y > g.y.max)) {
      throw new Error(`values ${JSON.stringify(v)}: a trap height is off the axis (traps ${trapYs}, y ${g.y.min}..${g.y.max})`)
    }
  }
  console.log('300 draws: h-1 and h+1 traps both distinct, in range, no collision.')

  const { error: upErr } = await supabase.from('questions').update({ parts }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: added "one square too tall" (h+1) trap.`)
}

main().catch(e => { console.error(e); process.exit(1) })
