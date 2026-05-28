import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Questions that need answer_type changed from 'exact' to 'expression':
// These have answers where term/factor/solution order can legitimately vary.
const toExpression = [
  { id: 'e535a144-0b5b-4ae2-b80c-3701eae9f595', skill: 'expanding_brackets',
    why: '"6x + 4" ≡ "4 + 6x"' },
  { id: 'e291d373-5e2b-4bfd-be16-7d5efec5e849', skill: 'difference_of_two_squares',
    why: '"(x+5)(x−5)" ≡ "(x−5)(x+5)"' },
  { id: '7ed30148-8cbf-449f-b6a8-e38ef82e482f', skill: 'simultaneous_equations',
    why: '"x=2,y=3" ≡ "y=3,x=2"' },
  { id: '810b6017-5bb0-46c9-80bf-99f739c6252a', skill: 'simplifying_expressions',
    why: '"x+2y" ≡ "2y+x"' },
  { id: '5582125e-cfaa-4e4b-8dd9-421c735700c3', skill: 'factorising_quadratics',
    why: '"(x+2)(x+3)" ≡ "(x+3)(x+2)"' },
  { id: '26e0949b-c952-4e9e-9134-db6a6cb6a99e', skill: 'finding_the_nth_term',
    why: '"3n+5" ≡ "5+3n"' },
  { id: 'ad6d1301-1071-4f4c-bffa-9e1fcf2f9221', skill: 'solving_quadratic_equations_factorising (and)',
    why: '"x=−2 and x=−3" ≡ "x=−3 and x=−2"' },
  { id: '919a43f5-cf3f-4efc-8568-603eba1b6cf7', skill: 'solving_quadratic_equations_factorising (or)',
    why: '"x=−2 or x=−3" ≡ "x=−3 or x=−2"' },
  { id: '8466102b-84a5-45de-b4dd-951d620be1f1', skill: 'prime_factor_decomposition',
    why: '"2²×3" ≡ "3×2²"' },
]

// Questions that need answer_type changed to 'set':
// Answers are unordered lists where any order and spacing should be accepted.
const toSet = [
  { id: '5786f2b0-770c-4da4-a382-0b0c9a0fa169', skill: 'factors_and_multiples',
    why: '"1, 2, 3, 6" ≡ "1,2,3,6" ≡ "6 3 2 1"' },
]

async function main() {
  console.log('Updating to expression type:')
  for (const q of toExpression) {
    const { error } = await supabase
      .from('questions')
      .update({ answer_type: 'expression', is_published: false })
      .eq('id', q.id)
    console.log(error ? `  ❌ ${q.skill}: ${error.message}` : `  ✅ ${q.skill} — ${q.why}`)
  }

  console.log('\nUpdating to set type:')
  for (const q of toSet) {
    const { error } = await supabase
      .from('questions')
      .update({ answer_type: 'set', is_published: false })
      .eq('id', q.id)
    console.log(error ? `  ❌ ${q.skill}: ${error.message}` : `  ✅ ${q.skill} — ${q.why}`)
  }
}

main()
