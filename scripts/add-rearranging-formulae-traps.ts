import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate } from '../lib/questions/paramEngine'

// 61956a8d — y = (x + a)/(x − b), make x the subject; answer (a + by)/(y − 1).
//
// The three existing traps cover: dropping the y when expanding y(x − b)
// (T1), the sign on a when moving it across (T2), and flipping the
// denominator to (1 − y) (T3). Three more errors are unrepresented.
//
// Marks follow the scheme the existing traps already imply — credit for the
// steps completed BEFORE the error, not follow-through:
//   1 multiply up   2 expand   3 collect x   4 factorise   5 divide (A1)
// so T1 errs at step 2 → 1, T2 at step 3 → 2, T3 at step 4 → 3.
const ID = '61956a8d-cdd4-4f89-85bc-978448311056'

const NEW_TRAPS = [
  {
    // Sign slip distributing the negative: y(x − b) → yx + by. Errs at the
    // expansion, so it earns the same single mark as T1.
    answer_template: '({{a}}-{{b}}*y)/(y-1)',
    method_marks: 1,
    response: 'Watch the sign when you expand the bracket: y(x − {{b}}) is yx − {{b}}y, not yx + {{b}}y. With the correct expansion, yx − {{b}}y = x + {{a}} collects to x(y − 1) = {{a}} + {{b}}y, giving x = ({{a}} + {{b}}y)/(y − 1).',
  },
  {
    // Swapped the letters instead of rearranging — the inverse-function
    // habit. No algebra done at all, so no method marks.
    answer_template: '(y+{{a}})/(y-{{b}})',
    method_marks: 0,
    response: 'Swapping x and y over is not the same as making x the subject — you still have to do the algebra. Multiply both sides by (x − {{b}}): y(x − {{b}}) = x + {{a}}. Expand: yx − {{b}}y = x + {{a}}. Collect the x terms: x(y − 1) = {{a}} + {{b}}y. Divide by (y − 1): x = ({{a}} + {{b}}y)/(y − 1).',
  },
  {
    // T1's expansion slip AND T3's denominator flip. The earliest error is
    // still the expansion, so it cannot earn more than T1's one mark.
    answer_template: '{{a+b}}/(1-y)',
    method_marks: 1,
    response: 'Two things have gone wrong. Expanding y(x − {{b}}) gives yx − {{b}}y, not yx − {{b}} — the {{b}} is multiplied by y too. And collecting the x terms gives x(y − 1), so you divide by (y − 1), not (1 − y). Putting both right: x(y − 1) = {{a}} + {{b}}y, so x = ({{a}} + {{b}}y)/(y − 1).',
  },
]

// T1 is authored as "({{a+b}})/(y-1)", which renders "(7)/(y-1)". The grader
// is string-based, so it only fires on those redundant brackets — a student
// writing the natural "7/(y-1)" misses it entirely. Drop them.
const T1_OLD = '({{a+b}})/(y-1)'
const T1_NEW = '{{a+b}}/(y-1)'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Sample points chosen to avoid the poles at y = 1 and y = b. */
const YS = [2.3, 3.7, 5.1, -2.6, 0.4, 11.9, -0.75, 7.25]

async function main() {
  const { data, error } = await supabase
    .from('questions').select('answer_template, parameters, traps').eq('id', ID).single()
  if (error) throw error

  const traps = JSON.parse(JSON.stringify(data.traps)) as any[]
  const t1 = traps.find(t => t.answer_template === T1_OLD)
  if (t1) { t1.answer_template = T1_NEW; console.log(`T1: "${T1_OLD}" → "${T1_NEW}" (was unreachable without the brackets)`) }
  for (const t of NEW_TRAPS) {
    if (!traps.some(e => e.answer_template === t.answer_template)) traps.push(t)
  }

  // Traps must be algebraically distinct FROM EACH OTHER. Comparing the
  // rendered strings would be worthless: the grader is not a CAS, so it
  // reports two algebraically identical expressions as distinct. (That is
  // exactly how "(a − by)/(1 − y)" nearly went in as a fourth trap — it is
  // the existing T2 with both signs negated.) Evaluate instead.
  //
  // A trap coinciding with the ANSWER is a different matter and is NOT fatal:
  // checkAnswer returns on `isCorrect` before it ever consults the traps, so
  // a correct answer short-circuits the trap. Reported as a warning only.
  const params = data.parameters as Record<string, { min: number, max: number }>
  const { min: aMin, max: aMax } = params.a
  const { min: bMin, max: bMax } = params.b
  const templates = [data.answer_template as string, ...traps.map(t => t.answer_template as string)]

  let combos = 0
  const fatal = new Map<string, string[]>()
  const benign = new Map<string, string[]>()
  for (let a = aMin; a <= aMax; a++) for (let b = bMin; b <= bMax; b++) {
    const rendered = templates.map(t => evaluateTemplate(t, { a, b }))
    const curves = rendered.map(r => YS.map(y => Function('y', `return ${r}`)(y) as number))
    for (let i = 0; i < curves.length; i++) for (let j = i + 1; j < curves.length; j++) {
      if (!curves[i].every((v, k) => Math.abs(v - curves[j][k]) < 1e-9)) continue
      const bucket = i === 0 ? benign : fatal
      const key = `${i === 0 ? 'ANSWER' : 'trap' + i} ≡ trap${j}  (${rendered[i]} = ${rendered[j]})`
      if (!bucket.has(key)) bucket.set(key, [])
      bucket.get(key)!.push(`a=${a},b=${b}`)
    }
    combos++
  }

  if (fatal.size) {
    for (const [k, where] of fatal) console.error(`  ✗ ${k} — in ${where.length} draws: ${where.slice(0, 6).join(' ')}`)
    throw new Error('two traps are algebraically identical — the second is unreachable and would misdiagnose')
  }
  for (const [k, where] of benign) {
    console.warn(`  ⚠ ${k}\n    in ${where.length}/${combos} draws (${where.slice(0, 3).join(' ')}…) — harmless ONLY while`
      + `\n    checkAnswer recognises that form as correct, since it returns on isCorrect before consulting traps.`)
  }
  console.log(`${combos} (a,b) draws × ${YS.length} sample points: all ${traps.length} traps mutually distinct.`)

  const { error: upErr } = await supabase.from('questions').update({ traps }).eq('id', ID)
  if (upErr) throw upErr
  console.log(`Updated ${ID}: ${traps.length} traps (+3 new), left unpublished.`)
}

main().catch(e => { console.error(e); process.exit(1) })
