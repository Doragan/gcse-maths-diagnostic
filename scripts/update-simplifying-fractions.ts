import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Question ID inserted by insert-fraction-questions.ts
const QUESTION_ID = '2cabce82-743e-4011-b677-73ca311aae14'

// Reworked to use k1 × k2 instead of a single k, so a "partial simplification"
// (student divides by k1 but leaves k2 as a remaining common factor) is always
// well-defined and worth trapping.
//
// k1, k2 ∈ {2, 3}  →  HCF = k1*k2 ∈ {4, 6, 9}
// Original fraction : (k1*k2*p) / (k1*k2*q)
// Partial (trap)    : (k2*p) / (k2*q)          ← divided by k1 only
// Fully simplified  : p / q
//
// q is prime (3, 5 or 7) and p < q, so gcd(p, q) = 1 always.

const updated = {
  parameters: {
    q:  { type: 'integer', min: 3, max: 7, constraint: { type: 'is_prime' } },
    p:  { type: 'integer', min: 1, max: 6, constraint: { type: 'lt', target: 'q', target_type: 'parameter' } },
    k1: { type: 'integer', min: 2, max: 3 },
    k2: { type: 'integer', min: 2, max: 3 },
  },

  question_template:
    '<p>Simplify this fraction fully:</p>' +
    '<p style="font-size:1.5em;text-align:center;margin:12px 0;">{{frac(k1*k2*p, k1*k2*q)}}</p>',

  answer_template: '{{p}}/{{q}}',
  answer_type: 'exact',

  traps: [
    {
      // Student simplifies by k1 only — k2 is still a shared factor
      answer_template: '{{k2*p}}/{{k2*q}}',
      response:
        "You've simplified, but not fully — {{k2*p}} and {{k2*q}} still share " +
        "a common factor of {{k2}}. The HCF of {{k1*k2*p}} and {{k1*k2*q}} is " +
        "{{k1*k2}}. Divide both by {{k1*k2}}: {{p}}/{{q}}.",
    },
    {
      // Student returns the original fraction unchanged
      answer_template: '{{k1*k2*p}}/{{k1*k2*q}}',
      response:
        "That's the original fraction — you need to simplify it. " +
        "Both {{k1*k2*p}} and {{k1*k2*q}} share a common factor of {{k1*k2}}. " +
        "Divide both by {{k1*k2}}: {{p}}/{{q}}.",
    },
  ],

  explanation:
    'Find the highest common factor (HCF) of {{k1*k2*p}} and {{k1*k2*q}}.<br>' +
    'HCF = {{k1*k2}}<br>' +
    'Divide both by {{k1*k2}}: {{frac(k1*k2*p, k1*k2*q)}} = {{frac(p, q)}}',
}

async function main() {
  const { error } = await supabase
    .from('questions')
    .update(updated)
    .eq('id', QUESTION_ID)

  if (error) {
    console.error('Update failed:', error.message)
    process.exit(1)
  }
  console.log(`Updated question ${QUESTION_ID}`)

  // Verify the saved traps
  const { data } = await supabase
    .from('questions')
    .select('traps, parameters')
    .eq('id', QUESTION_ID)
    .single()
  console.log('Traps now:', JSON.stringify(data?.traps, null, 2))
  console.log('Parameters now:', JSON.stringify(data?.parameters, null, 2))
}

main()
