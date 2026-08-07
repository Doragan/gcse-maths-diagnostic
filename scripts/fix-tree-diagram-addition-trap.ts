import './env'
import { createClient } from '@supabase/supabase-js'
import { renderMultiPartQuestion } from '../lib/questions/paramEngine'
import { checkAnswer } from '../lib/questions/answerChecker'

// b18d7b90 (tree_diagrams) part (b), trap 2: the template was
//   {{r}}/{{r+b}}+{{r-1}}/{{r+b-1}}
// which renders to a literal EXPRESSION ("6/9+5/8"), not a value. The blank is
// answer_type 'fraction' and the grader parses a single a/b, so the trap only
// fired if a student typed that exact unevaluated string — which nobody does.
// A student who genuinely added the branch probabilities writes the SUM
// (93/72 for r=6,b=3) and got no targeted feedback at all.
//
// Replace it with the sum evaluated as one fraction:
//   r/(r+b) + (r-1)/(r+b-1) = [r(r+b-1) + (r-1)(r+b)] / [(r+b)(r+b-1)]
const ID = 'b18d7b90-01cf-4c41-9e7a-847ff63e77d9'

const OLD = '{{r}}/{{r+b}}+{{r-1}}/{{r+b-1}}'
const NEW = '{{r*(r+b-1) + (r-1)*(r+b)}}/{{(r+b)*(r+b-1)}}'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase.from('questions')
    .select('parameters, question_template, parts').eq('id', ID).single()
  if (error) throw error

  const parts = JSON.parse(JSON.stringify(data.parts))
  const trap = parts[1].traps.find((t: any) => t.answer_template === OLD)
  if (!trap) throw new Error(`part (b) trap with the broken template not found — already fixed?`)
  trap.answer_template = NEW

  let combos = 0
  for (let r = 3; r <= 6; r++) for (let b = 3; b <= 6; b++) {
    if (r === b) continue // the existing r != b constraint
    const v = { r, b }
    const rendered = renderMultiPartQuestion(data.question_template, parts as any, data.parameters as any, v)
    const pb = rendered.parts[1]
    if (/\[error|\{\{/.test(pb.answer)) throw new Error(`${JSON.stringify(v)}: part (b) answer render error`)
    for (const t of pb.traps) {
      if (/\[error|\{\{/.test(t.answer)) throw new Error(`${JSON.stringify(v)}: trap render error (${t.answer})`)
      // Every trap must now parse as a single fraction — the defect being fixed.
      if (!/^-?\d+\/-?\d+$/.test(t.answer)) {
        throw new Error(`${JSON.stringify(v)}: trap "${t.answer}" is not a single a/b value`)
      }
    }

    // What a student who ADDS the branches actually writes.
    const num = r * (r + b - 1) + (r - 1) * (r + b)
    const den = (r + b) * (r + b - 1)
    const added = `${num}/${den}`

    const res = checkAnswer(added, pb.answer, 'fraction', null, pb.traps, false)
    if (res.correct) throw new Error(`${JSON.stringify(v)}: the added value was marked CORRECT`)
    if (!res.trap) throw new Error(`${JSON.stringify(v)}: adding the branches still gets no trap (${added})`)
    if (!/Multiply the branch probabilities/.test(res.trap.response)) {
      throw new Error(`${JSON.stringify(v)}: adding fired the WRONG trap — ${res.trap.response.slice(0, 60)}`)
    }

    // The with-replacement slip must still fire its own trap, not this one.
    const wr = `${r * r}/${(r + b) * (r + b)}`
    const resWR = checkAnswer(wr, pb.answer, 'fraction', null, pb.traps, false)
    if (!resWR.trap || !/WITH-replacement/.test(resWR.trap.response)) {
      throw new Error(`${JSON.stringify(v)}: with-replacement slip no longer fires its own trap`)
    }

    // The correct answer must still grade correct (traps are checked only when
    // wrong, but a value collision would break that).
    const ok = checkAnswer(pb.answer, pb.answer, 'fraction', null, pb.traps, false)
    if (!ok.correct) throw new Error(`${JSON.stringify(v)}: correct answer rejected`)

    // Fraction grading is by VALUE, so distinctness must be by value too.
    const vals = [pb.answer, ...pb.traps.map(t => t.answer)].map(s => {
      const [n, d] = s.split('/').map(Number)
      return n / d
    })
    for (let i = 0; i < vals.length; i++) for (let j = i + 1; j < vals.length; j++) {
      if (Math.abs(vals[i] - vals[j]) < 1e-9) {
        throw new Error(`${JSON.stringify(v)}: value collision in part (b) [${vals}]`)
      }
    }
    combos++
  }
  console.log(`verified across all ${combos} (r,b) combos: every part (b) trap is a single a/b value,`)
  console.log('  adding the branches now fires the right trap, the with-replacement slip still fires its own,')
  console.log('  the correct answer still grades correct, and no two values collide.')

  const { error: upErr } = await supabase.from('questions').update({ parts }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: part (b) trap 2 is now the evaluated sum, not an expression string.`)
}

main().catch(e => { console.error(e); process.exit(1) })
