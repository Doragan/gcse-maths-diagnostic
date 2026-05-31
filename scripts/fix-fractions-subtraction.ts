import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Question: a1e9b976  adding_and_subtracting_fractions
// Template:  a/4 − b/5   answer: {{5*a - 4*b}}/20
//
// Bug: a∈[2,4], b∈[1,3] → a=2, b=3 gives 5×2 − 4×3 = −2  (negative answer)
//
// Fix: set b max from 3 → 2.
//   All six remaining pairs (a∈{2,3,4} × b∈{1,2}) satisfy 5a > 4b:
//   (2,1)=6  (2,2)=2  (3,1)=11  (3,2)=7  (4,1)=16  (4,2)=12  — all positive ✓

async function main() {
  const id = 'a1e9b976-d0ed-47c4-8efd-d8cb8667216b'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('parameters')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  const params = data.parameters as Record<string, unknown>
  console.log('Before:', JSON.stringify(params, null, 2))

  // Update b.max from 3 to 2
  const updatedParams = {
    ...params,
    b: { ...(params.b as object), max: 2 },
  }

  console.log('After: ', JSON.stringify(updatedParams, null, 2))

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ parameters: updatedParams })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('\n✓ Fixed — b.max is now 2 (was 3).')
}

main()
