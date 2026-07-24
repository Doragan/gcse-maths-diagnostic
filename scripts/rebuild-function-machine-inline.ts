import './env'
import { createClient } from '@supabase/supabase-js'
import { renderMultiPartQuestion } from '../lib/questions/paramEngine'

// 8e8c3a24 (function_machines): A, B, C only appeared as a list of inputs below
// an SVG machine that never labelled them — nothing in the picture told the
// student where each letter lived. Rebuild the stem as an HTML machine with
// inline [data-blank] slots, so the student types A/B/C directly into the
// machine (forward: A = middle value, B = output; reverse: C = the input).
const ID = '8e8c3a24-c94f-45d2-85cb-dd425ad0bc6e'

const box = 'border:1px solid #374151;border-radius:6px;padding:8px 12px;background:#f9fafb'
const arrow = '<span aria-hidden="true" style="color:#6b7280">&#8594;</span>'
const slot = (label: string) =>
  `<span style="display:inline-flex;flex-direction:column;align-items:center;gap:2px">`
  + `<span style="font-size:11px;color:#6b7280;line-height:1.2">${label}</span>`
  + `<span data-blank="${label}"></span></span>`
const row = (inner: string) =>
  `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;`
  + `margin:10px 0;font-family:system-ui;font-size:14px">${inner}</div>`

const TEMPLATE =
  `<p>The number machine multiplies the input by {{a}}, then adds {{b}}.</p>`
  + row([
      `<span style="font-weight:600">{{x}}</span>`, arrow,
      `<span style="${box}">&#215; {{a}}</span>`, arrow,
      slot('A'), arrow,
      `<span style="${box}">+ {{b}}</span>`, arrow,
      slot('B'),
    ].join(''))
  + `<p>Now work backwards. Which input gives an output of {{a*y+b}}?</p>`
  + row([
      slot('C'), arrow,
      `<span style="${box}">&#215; {{a}}</span>`, arrow,
      `<span style="${box}">+ {{b}}</span>`, arrow,
      `<span style="font-weight:600">{{a*y+b}}</span>`,
    ].join(''))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions').select('parameters, parts').eq('id', ID).single()
  if (error) throw error

  // Sanity: every blank label must have exactly one [data-blank] host in the
  // new stem, and the stem must render without a template error.
  const labels = (data.parts[0].blanks as any[]).map(b => b.label)
  for (const l of labels) {
    const n = (TEMPLATE.match(new RegExp(`data-blank="${l}"`, 'g')) ?? []).length
    if (n !== 1) throw new Error(`blank ${l}: ${n} hosts in stem (need exactly 1)`)
  }
  const r = renderMultiPartQuestion(TEMPLATE, data.parts as any, data.parameters as any,
    { a: 3, b: 4, x: 5, y: 7 })
  if (/\[error/.test(r.stem) || /\{\{/.test(r.stem)) throw new Error(`stem render error: ${r.stem}`)
  if (!/&#8594;|→/.test(r.stem)) throw new Error('arrows missing after render')
  console.log('stem renders clean; A/B/C each have one host.')

  const { error: upErr } = await supabase.from('questions').update({ question_template: TEMPLATE }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: inline function-machine stem.`)
}

main().catch(e => { console.error(e); process.exit(1) })
