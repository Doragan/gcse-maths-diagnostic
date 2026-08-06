import './env'
import { createClient } from '@supabase/supabase-js'
import { renderMultiPartQuestion } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'

// 4325c702 (proportion_with_powers + percentage_change): a PURE %-change
// question for y=kx^n is k-independent in ANY framing (abstract or concrete)
// — k always cancels in a ratio, so "assume y=x^n" (pick any convenient base,
// e.g. x=100) always gives the right percentage without ever engaging with
// the constant. The only fix is to make the GRADED ANSWER depend on k, which
// needs an absolute value, not a ratio.
//
// Split into two single-skill parts:
//   (a) proportion_with_powers — concrete (x1, y1) pair with y1 != x1^n (k>=2,
//       so the y=x^n shortcut is provably WRONG), find y at x2. This can only
//       be solved by actually using y1 (i.e. k) to scale.
//   (b) percentage_change — given y1 and (from part a) y2, find the % increase.
//       A clean, independently-testable percentage_change question on two
//       concrete numbers, back-referencing part (a) like a real exam paper.
const ID = '4325c702-af42-4197-9f65-d58251fbdf00'

const STEM = '<p><strong>y</strong> is directly proportional to <strong>x{{[\'²\',\'³\'][sel]}}</strong>.</p>'

const PARAMS = {
  sel: { type: 'integer', min: 0, max: 1 },
  x1: { type: 'integer', min: 2, max: 5 },
  x2: { type: 'integer', min: 3, max: 9, constraint: { type: 'gt', target: 'x1', target_type: 'parameter' } },
  // k >= 2 is load-bearing: it guarantees y1 = k*x1^n != x1^n, so a student
  // who assumes y=x^n (ignores the constant) gets a WRONG value in part (a) —
  // that's what makes this version, unlike the ratio-only ones, actually
  // require the constant.
  k: { type: 'integer', min: 2, max: 5 },
}

const PART_A = {
  kind: 'mastery',
  marks: 2,
  // Deliberately ONE trap: this is the exact "assumed k=1" shortcut this
  // rework exists to close. A second trap built from x1/x2/k risks colliding
  // with it for some combo — small-integer products in a modest grid coincide
  // more often than intuition suggests (verified: k*x1^n, k*x2^(n-1)*x1 etc.
  // all hit exact matches with x2^n somewhere in this range) — so it's left out
  // rather than forced.
  traps: [
    {
      answer_template: '{{Math.pow(x2, [2,3][sel])}}',
      response: 'You used y = x{{[\'²\',\'³\'][sel]}} directly, which assumes the constant of proportionality is 1 — but here it isn&apos;t: {{k*Math.pow(x1,[2,3][sel])}} &ne; {{x1}}{{[\'²\',\'³\'][sel]}}. Find k from the given pair first: k = {{k*Math.pow(x1,[2,3][sel])}} &divide; {{x1}}{{[\'²\',\'³\'][sel]}} = {{k}}. Then y = {{k}} &times; {{x2}}{{[\'²\',\'³\'][sel]}} = {{k*Math.pow(x2,[2,3][sel])}}.',
    },
  ],
  prompt: '<p>(a) When x = <strong>{{x1}}</strong>, y = <strong>{{k*Math.pow(x1,[2,3][sel])}}</strong>. Work out the value of y when x = <strong>{{x2}}</strong>.</p>',
  skill_ids: ['proportion_with_powers'],
  tolerance: 0,
  answer_type: 'numeric',
  answer_template: '{{k * Math.pow(x2, [2,3][sel])}}',
  requires_simplest: false,
  explanation: 'k = {{k*Math.pow(x1,[2,3][sel])}} &divide; {{x1}}{{[\'²\',\'³\'][sel]}} = <strong>{{k}}</strong>.<br>y = k &times; x{{[\'²\',\'³\'][sel]}} = {{k}} &times; {{x2}}{{[\'²\',\'³\'][sel]}} = <strong>{{k*Math.pow(x2,[2,3][sel])}}</strong>.',
}

const PART_B = {
  kind: 'mastery',
  marks: 2,
  traps: [
    {
      answer_template: '{{round(Math.pow(x2/x1, [2,3][sel]) * 100, 1)}}',
      response: 'That is the NEW value of y as a percentage of the old value. The percentage INCREASE is that minus 100: {{round(Math.pow(x2/x1,[2,3][sel])*100,1)}} &minus; 100 = {{round((Math.pow(x2/x1,[2,3][sel])-1)*100,1)}}%.',
    },
    {
      answer_template: '{{round((k*Math.pow(x2,[2,3][sel]) - k*Math.pow(x1,[2,3][sel])) / (k*Math.pow(x2,[2,3][sel])) * 100, 1)}}',
      response: 'A percentage change is always worked out as a fraction of the ORIGINAL value, not the new one. ({{k*Math.pow(x2,[2,3][sel])}} &minus; {{k*Math.pow(x1,[2,3][sel])}}) &divide; {{k*Math.pow(x1,[2,3][sel])}} &times; 100 = {{round((Math.pow(x2/x1,[2,3][sel])-1)*100,1)}}%.',
    },
  ],
  prompt: '<p>(b) Using your answer to part (a), work out the percentage increase in y from x = {{x1}} to x = {{x2}}.</p>',
  skill_ids: ['percentage_change'],
  tolerance: 0.01,
  answer_type: 'numeric',
  answer_template: '{{round((k*Math.pow(x2,[2,3][sel]) - k*Math.pow(x1,[2,3][sel])) / (k*Math.pow(x1,[2,3][sel])) * 100, 1)}}',
  requires_simplest: false,
  explanation: 'y increases from {{k*Math.pow(x1,[2,3][sel])}} to {{k*Math.pow(x2,[2,3][sel])}}.<br>Percentage increase = ({{k*Math.pow(x2,[2,3][sel])}} &minus; {{k*Math.pow(x1,[2,3][sel])}}) &divide; {{k*Math.pow(x1,[2,3][sel])}} &times; 100 = <strong>{{round((k*Math.pow(x2,[2,3][sel]) - k*Math.pow(x1,[2,3][sel])) / (k*Math.pow(x1,[2,3][sel])) * 100, 1)}}%</strong>.',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const parts = [PART_A, PART_B]

  let combos = 0
  for (let sel = 0; sel <= 1; sel++) {
    for (let x1 = 2; x1 <= 5; x1++) {
      for (let x2 = 3; x2 <= 9; x2++) {
        if (x2 <= x1) continue
        for (let k = 2; k <= 5; k++) {
          const v = { sel, x1, x2, k }
          const r = renderMultiPartQuestion(STEM, parts as any, PARAMS as any, v)
          if (/\[error|\{\{/.test(r.stem)) throw new Error(`${JSON.stringify(v)}: stem render error`)

          for (const p of r.parts) {
            if (/\[error|\{\{/.test(p.prompt) || /\[error|\{\{/.test(p.explanation ?? '')) {
              throw new Error(`${JSON.stringify(v)}: part render error — ${p.prompt}`)
            }
            const vals = [p.answer, ...p.traps.map(t => t.answer)]
            if (vals.some(x => /\[error|NaN/.test(x))) throw new Error(`${JSON.stringify(v)}: eval error [${vals}]`)
            if (new Set(vals).size !== vals.length) throw new Error(`${JSON.stringify(v)}: value collision [${vals}] in part`)
          }

          // Prove the shortcut (y = x^n, ignoring k) is WRONG for part (a) —
          // the entire point of this rework — and that it correctly fires the
          // trap rather than silently passing.
          const shortcutVal = String(Math.pow(v.x2, [2, 3][v.sel]))
          const rA = checkAnswer(shortcutVal, r.parts[0].answer, 'numeric', 0, r.parts[0].traps)
          if (rA.correct) throw new Error(`${JSON.stringify(v)}: y=x^n shortcut was marked CORRECT — the whole point of this fix failed`)
          if (!rA.trap) throw new Error(`${JSON.stringify(v)}: y=x^n shortcut not trapped`)

          // Prove the TRUE (correct) answers pass.
          const okA = checkAnswer(r.parts[0].answer, r.parts[0].answer, 'numeric', 0, r.parts[0].traps)
          if (!okA.correct) throw new Error(`${JSON.stringify(v)}: part (a) correct answer rejected`)
          const okB = checkAnswer(r.parts[1].answer, r.parts[1].answer, 'numeric', 0.01, r.parts[1].traps)
          if (!okB.correct) throw new Error(`${JSON.stringify(v)}: part (b) correct answer rejected`)

          combos++
        }
      }
    }
  }
  console.log(`verified across all ${combos} (sel,x1,x2,k) combos: no render errors, no value collisions within a part,`)
  console.log('the y=x^n shortcut is provably wrong and trapped in part (a), and both true answers pass.')

  const marksTotal = parts.reduce((s, p) => s + p.marks, 0)
  const { error } = await supabase.from('questions').update({
    question_template: STEM,
    parameters: PARAMS,
    parts,
    kind: 'mastery',
    marks: marksTotal,
    // Question-level scalar answer fields are inert once parts exist.
    answer_template: '',
    answer_type: 'numeric',
    tolerance: null,
    traps: [],
    explanation: null,
  }).eq('id', ID)
  if (error) throw error
  console.log(`Updated ${ID}: split into a 2-part question (a: proportion_with_powers, b: percentage_change), ${marksTotal} marks.`)
}

main().catch(e => { console.error(e); process.exit(1) })
