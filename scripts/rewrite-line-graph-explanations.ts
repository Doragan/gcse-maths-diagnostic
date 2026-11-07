import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate, generateValues } from '../lib/questions/paramEngine'

// ─────────────────────────────────────────────────────────────────────────────
// Three questions on understanding_straight_line_graphs explained themselves by
// restating the rule they were testing:
//
//   "Using the equation y = mx + c, c is the y-intercept.
//    So the y-intercept of y = 4x + 7 is 7."
//
// A student who did not already know that learns nothing from reading it. In
// two of the three the real reason was sitting in a TRAP response — so getting
// the question wrong taught more than getting it right.
//
// The four harder questions on the same skill do not have this problem: they
// open with the reason ("Parallel lines have the SAME gradient, so...", "The
// gradient is only visible once the equation is in the form y = mx + c"). The
// split is by difficulty, not by author intent.
//
// All three are PUBLISHED and the user asked for these rewrites specifically.
// Nothing else about the questions changes — not the prompt, the answer, the
// traps or the published flag.
//
//   npx tsx scripts/rewrite-line-graph-explanations.ts            (dry run)
//   npx tsx scripts/rewrite-line-graph-explanations.ts --apply
// ─────────────────────────────────────────────────────────────────────────────

const EDITS = [
  {
    id: '507b069f-6a05-4eff-9259-0de1acee1f20',
    label: 'y-intercept of y = ax + b',
    // Why x = 0 is the question being asked, and why the ax term cannot
    // survive it. Its own trap#1 already said this; the explanation did not.
    explanation:
      'The y-intercept is where the line crosses the y-axis, and every point on the y-axis '
      + 'has x = 0. So the question is really: what is y when x = 0?<br>'
      + 'y = {{a}} × 0 + {{b}} = 0 + {{b}} = {{b}}<br>'
      + 'The {{a}}x term disappears, because anything multiplied by 0 is 0. That is why the '
      + 'y-intercept is always the number on its own — the c in y = mx + c — whatever the '
      + 'gradient happens to be.<br><strong>{{b}}</strong>',
  },
  {
    id: 'd2f9449a-d88e-407d-b4a9-05eda7e954d3',
    label: 'gradient of y = ax + b',
    // The old version named m without ever saying what a gradient measures,
    // which is the one thing the investigation's section 3 is built to teach.
    explanation:
      'The gradient measures how much y changes for each 1 that x goes across.<br>'
      + 'Increase x by 1 and the {{a}}x term grows by {{a}}, while the {{b}} stays exactly '
      + 'where it is — a constant cannot change. So y goes up by {{a}} for every 1 across.<br>'
      + 'That is why the gradient is the number multiplying x — the m in y = mx + c. The '
      + '{{b}} only decides how high the line sits, not how steep it is.<br>'
      + '<strong>{{a}}</strong>',
  },
  {
    id: 'ccc88b02-19fb-48cd-8e78-382bf3258c8b',
    label: 'y at a given x on y = ax + b',
    // This one did show working, but only the procedure. It never said why
    // substituting is allowed, which is the whole idea being tested.
    explanation:
      'The equation of a line is a rule obeyed by every point on it: feed in a point’s '
      + 'x and it gives you that point’s y.<br>'
      + 'This point is on the line and its x is {{c}}, so its y has to be whatever the rule '
      + 'gives for {{c}}:<br>'
      + 'y = ({{a}} × {{c}}) + {{b}} = {{a * c}} + {{b}} = <strong>{{a * c + b}}</strong><br>'
      + 'The same substitution is how you test whether any point lies on a line at all — put '
      + 'its coordinates in and see whether the equation holds.',
  },
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const txt = (x: string) => x.replace(/<br\s*\/?>/g, '\n     ').replace(/<[^>]+>/g, '')
  .replace(/[ \t]+/g, ' ').trim()

async function main() {
  const apply = process.argv.includes('--apply')

  for (const e of EDITS) {
    const { data, error } = await supabase.from('questions')
      .select('id, explanation, parameters').eq('id', e.id).single()
    if (error) throw error

    // Render across the parameter space before writing: an explanation that
    // throws or prints "undefined" is worse than the one being replaced.
    for (let i = 0; i < 40; i++) {
      const vals = generateValues((data.parameters ?? {}) as never)
      const out = evaluateTemplate(e.explanation, vals)
      if (/\[error|undefined|NaN/.test(out)) {
        throw new Error(`${e.id.slice(0, 8)} renders badly: ${txt(out).slice(0, 200)}`)
      }
    }

    const vals = generateValues((data.parameters ?? {}) as never)
    console.log(`\n${'─'.repeat(70)}\n${e.id.slice(0, 8)}  ${e.label}`)
    console.log(`  WAS: ${txt(evaluateTemplate(data.explanation ?? '', vals))}`)
    console.log(`  NOW: ${txt(evaluateTemplate(e.explanation, vals))}`)

    if (apply) {
      const { error: upErr } = await supabase.from('questions')
        .update({ explanation: e.explanation }).eq('id', e.id)
      if (upErr) throw upErr
    }
  }

  console.log(apply
    ? `\nUpdated ${EDITS.length} explanations. Nothing else on the questions changed.`
    : '\ndry run — pass --apply to write')
}

main().catch(e => { console.error(e); process.exit(1) })
