import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// 4325c702: revert 3de2448's concrete-numbers rework. That rework let k
// cancel reachably (a student could plug x1,x2 into y=x^n directly and get
// the right % change without ever engaging with proportion), which is a
// structural problem with ANY concrete-number version of a pure %-change
// question for y=kx^n — the shortcut is mathematically valid, just not
// reachable without concrete numbers to plug in. Reverting to the abstract
// percentage-for-x framing restores that: there's no x to plug into y=x^n, so
// solving forces genuine multiplier-based proportion reasoning. User wants to
// road-test this original framing with real people before deciding whether
// it's too abstract for GCSE.
const ID = '4325c702-af42-4197-9f65-d58251fbdf00'

const ORIGINAL = {
  question_template: '<p><strong>y</strong> is directly proportional to <strong>x{{[\'²\',\'³\'][sel]}}</strong>.</p><p>The value of x is increased by <strong>{{10 * m}}%</strong>.</p><p>Work out the percentage increase in the value of y.</p>',
  parameters: {
    m: { max: 5, min: 1, type: 'integer' },
    sel: { max: 1, min: 0, type: 'integer' },
  },
  answer_template: '{{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}',
  tolerance: 0.01,
  traps: [
    {
      response: "You multiplied the percentage by the power — percentage changes don't scale like that. Use multipliers: x is multiplied by {{1 + m/10}}, so y is multiplied by {{1 + m/10}}{{['²','³'][sel]}} = {{round(Math.pow(1 + m/10, [2,3][sel]), 3)}}, a {{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}% increase.",
      answer_template: '{{10 * m * [2,3][sel]}}',
    },
    {
      response: 'That is the NEW value of y as a percentage of the old value. The percentage INCREASE is that minus 100: {{round(Math.pow(1 + m/10, [2,3][sel]) * 100, 1)}} − 100 = {{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}%.',
      answer_template: '{{round(Math.pow(1 + m/10, [2,3][sel]) * 100, 1)}}',
    },
    {
      response: "y is not proportional to x itself — it is proportional to x{{['²','³'][sel]}}, so it grows faster than x. Multiply the x multiplier out: {{1 + m/10}}{{['²','³'][sel]}} = {{round(Math.pow(1 + m/10, [2,3][sel]), 3)}}, a {{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}% increase.",
      answer_template: '{{10 * m}}',
    },
  ],
  explanation: 'An increase of {{10 * m}}% means x is multiplied by {{1 + m/10}}.<br>y is proportional to x{{[\'²\',\'³\'][sel]}}, so y is multiplied by {{1 + m/10}}{{[\'²\',\'³\'][sel]}} = {{round(Math.pow(1 + m/10, [2,3][sel]), 3)}}.<br>That is {{round(Math.pow(1 + m/10, [2,3][sel]) * 100, 1)}}% of the original value — a percentage increase of {{round(Math.pow(1 + m/10, [2,3][sel]) * 100, 1)}} − 100 = <strong>{{round((Math.pow(1 + m/10, [2,3][sel]) - 1) * 100, 1)}}%</strong>.',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  // Re-verify the original is still sound (belt and braces — it passed
  // before, this just confirms the revert payload itself is correct).
  let combos = 0
  for (let sel = 0; sel <= 1; sel++) for (let m = 1; m <= 5; m++) {
    const v = { sel, m }
    const stem = evaluateTemplate(ORIGINAL.question_template, v)
    if (/\[error|\{\{/.test(stem)) throw new Error(`${JSON.stringify(v)}: stem render error`)
    const vals = [
      evaluateTemplate(ORIGINAL.answer_template, v),
      ...ORIGINAL.traps.map(t => evaluateTemplate(t.answer_template, v)),
    ]
    if (vals.some(x => /\[error|NaN/.test(x))) throw new Error(`${JSON.stringify(v)}: eval error among [${vals}]`)
    if (new Set(vals).size !== vals.length) throw new Error(`${JSON.stringify(v)}: value collision among [${vals}]`)
    combos++
  }
  console.log(`re-verified across all ${combos} (sel,m) combos: answer and all 3 traps pairwise distinct.`)

  const { error } = await supabase.from('questions').update(ORIGINAL).eq('id', ID)
  if (error) throw error
  console.log(`Reverted ${ID} to the abstract percentage-for-x framing.`)
}

main().catch(e => { console.error(e); process.exit(1) })
