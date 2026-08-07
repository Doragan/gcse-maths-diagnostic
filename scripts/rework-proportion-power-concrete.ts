import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate, generateValues } from '../lib/questions/paramEngine'

// 4325c702 (proportion_with_powers + percentage_change): the original framing
// gave the change in x as an abstract PERCENTAGE and asked for the resulting
// percentage change in y — never any concrete x/y values, so solving meant
// substituting a percentage-derived multiplier in for x with nothing concrete
// to anchor it. Flagged as more abstract than GCSE would realistically ask.
//
// Rework: x changes between two CONCRETE values; only the percentage change
// in y is asked for (the answer, not an input). This matches the audited real
// papers (JUN24-H-P3 Q20, trap "proportion_power_error_Q_not_Q2") more
// closely — a concrete before/after x, not a symbolic percentage substituted
// in for it.
const ID = '4325c702-af42-4197-9f65-d58251fbdf00'

const NEW_TEMPLATE = '<p><strong>y</strong> is directly proportional to <strong>x{{[\'²\',\'³\'][sel]}}</strong>.</p>'
  + '<p>The value of x increases from <strong>{{x1}}</strong> to <strong>{{x2}}</strong>.</p>'
  + '<p>Work out the percentage increase in the value of y.</p>'

const NEW_PARAMS = {
  sel: { type: 'integer', min: 0, max: 1 },
  x1: { type: 'integer', min: 2, max: 6 },
  x2: { type: 'integer', min: 3, max: 10, constraint: { type: 'gt', target: 'x1', target_type: 'parameter' } },
}

const NEW_ANSWER = '{{round((Math.pow(x2/x1, [2,3][sel]) - 1) * 100, 1)}}'

const NEW_TRAPS = [
  {
    // Linear-scaling error: works out the % increase in x, then scales that
    // BY the power rather than applying the power to the ratio itself.
    answer_template: '{{round(((x2/x1 - 1) * 100) * [2,3][sel], 1)}}',
    response: "You worked out the percentage increase in x, then multiplied it by the power — percentages don't scale like that. Use the RATIO: x is multiplied by {{round(x2/x1,3)}}, so y is multiplied by {{round(x2/x1,3)}}{{['²','³'][sel]}} = {{round(Math.pow(x2/x1,[2,3][sel]),3)}}, a {{round((Math.pow(x2/x1,[2,3][sel]) - 1) * 100, 1)}}% increase.",
  },
  {
    // Forgot to subtract 100 — gave the new value as a % of the old.
    answer_template: '{{round(Math.pow(x2/x1, [2,3][sel]) * 100, 1)}}',
    response: 'That is the NEW value of y as a percentage of the old value. The percentage INCREASE is that minus 100: {{round(Math.pow(x2/x1,[2,3][sel]) * 100, 1)}} − 100 = {{round((Math.pow(x2/x1,[2,3][sel]) - 1) * 100, 1)}}%.',
  },
  {
    // Treated y as directly proportional to x (power 1) instead of x²/x³.
    answer_template: '{{round((x2/x1 - 1) * 100, 1)}}',
    response: "y is not proportional to x itself — it is proportional to x{{['²','³'][sel]}}, so it grows faster than x. Raise the RATIO to the power: {{round(x2/x1,3)}}{{['²','³'][sel]}} = {{round(Math.pow(x2/x1,[2,3][sel]),3)}}, a {{round((Math.pow(x2/x1,[2,3][sel]) - 1) * 100, 1)}}% increase.",
  },
]

const NEW_EXPLANATION = 'x is multiplied by {{round(x2/x1,3)}} ({{x1}} → {{x2}}).<br>'
  + 'y is proportional to x{{[\'²\',\'³\'][sel]}}, so y is multiplied by {{round(x2/x1,3)}}{{[\'²\',\'³\'][sel]}} = {{round(Math.pow(x2/x1,[2,3][sel]),3)}}.<br>'
  + 'That is {{round(Math.pow(x2/x1,[2,3][sel]) * 100, 1)}}% of the original value — a percentage increase of '
  + '{{round(Math.pow(x2/x1,[2,3][sel]) * 100, 1)}} − 100 = <strong>{{round((Math.pow(x2/x1,[2,3][sel]) - 1) * 100, 1)}}%</strong>.'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  // Exhaustive: every valid (sel, x1, x2) combo — answer and all 3 traps must
  // stay pairwise distinct, and the stem must render clean.
  let combos = 0
  for (let sel = 0; sel <= 1; sel++) {
    for (let x1 = 2; x1 <= 6; x1++) {
      for (let x2 = 3; x2 <= 10; x2++) {
        if (x2 <= x1) continue
        const v = { sel, x1, x2 }
        const stem = evaluateTemplate(NEW_TEMPLATE, v)
        if (/\[error|\{\{/.test(stem)) throw new Error(`${JSON.stringify(v)}: stem render error: ${stem}`)
        const vals = [
          evaluateTemplate(NEW_ANSWER, v),
          ...NEW_TRAPS.map(t => evaluateTemplate(t.answer_template, v)),
        ]
        if (vals.some(x => /\[error|NaN/.test(x))) throw new Error(`${JSON.stringify(v)}: eval error among [${vals}]`)
        if (new Set(vals).size !== vals.length) {
          throw new Error(`${JSON.stringify(v)}: value collision among [${vals}]`)
        }
        combos++
      }
    }
  }
  console.log(`verified across all ${combos} (sel,x1,x2) combos: answer and all 3 traps pairwise distinct, stem renders clean.`)

  // Sanity: generateValues respects the new constraint (x2 > x1) over many draws.
  for (let i = 0; i < 200; i++) {
    const v = generateValues(NEW_PARAMS as any)
    if (v.x2 <= v.x1) throw new Error(`generateValues produced x2 <= x1: ${JSON.stringify(v)}`)
  }
  console.log('200 draws: generateValues always respects x2 > x1.')

  const { error } = await supabase.from('questions').update({
    question_template: NEW_TEMPLATE,
    parameters: NEW_PARAMS,
    answer_template: NEW_ANSWER,
    traps: NEW_TRAPS,
    explanation: NEW_EXPLANATION,
  }).eq('id', ID)
  if (error) throw error
  console.log(`Updated ${ID}: reworked to concrete before/after x values (no percentage in the given data).`)
}

main().catch(e => { console.error(e); process.exit(1) })
