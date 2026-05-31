import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// fracStr(n, d) automatically simplifies and collapses "6/1" → "6".
// Trap responses now also use {{...}} since renderQuestion evaluates them.

const updates = [
  {
    id: '6837c60d-78c4-4362-8395-30cd5d2c6bdb', // multiplying_fractions
    answer_template: '{{fracStr(a*c, b*d)}}',
    traps: [
      {
        answer_template: '{{fracStr(a*d + b*c, b*d)}}',
        response:
          "That's adding the fractions. To multiply, multiply numerators together " +
          "and denominators together: {{frac(a,b)}} × {{frac(c,d)}} = {{frac(a*c, b*d)}}{{gcd(a*c,b*d)>1 ? ' = ' + fracStr(a*c,b*d) : ''}}.",
      },
      {
        answer_template: '{{fracStr(a*d, b*c)}}',
        response:
          "That's the result of dividing instead of multiplying. Multiply straight across: " +
          "({{a}} × {{c}}) / ({{b}} × {{d}}) = {{fracStr(a*c, b*d)}}.",
      },
    ],
    explanation:
      'Multiply numerators together and denominators together:<br>' +
      '{{frac(a, b)}} × {{frac(c, d)}} = {{frac(a*c, b*d)}}' +
      '{{gcd(a*c,b*d) > 1 ? " = " + fracStr(a*c, b*d) : ""}}',
  },
  {
    id: '1dbb9708-70f7-41cd-ba33-cfe35b0a2f80', // dividing_fractions
    answer_template: '{{fracStr(a*d, b*c)}}',
    traps: [
      {
        answer_template: '{{fracStr(a*c, b*d)}}',
        response:
          "That's multiplying the fractions, not dividing. To divide, multiply by the " +
          "<strong>reciprocal</strong> (flip the second fraction): " +
          "{{frac(a,b)}} ÷ {{frac(c,d)}} = {{frac(a,b)}} × {{frac(d,c)}} = {{fracStr(a*d, b*c)}}.",
      },
      {
        answer_template: '{{fracStr(b*c, a*d)}}',
        response:
          'Flip the <strong>second</strong> fraction (the divisor), not the first: ' +
          '{{frac(a,b)}} ÷ {{frac(c,d)}} = {{frac(a,b)}} × {{frac(d,c)}} = {{fracStr(a*d, b*c)}}.',
      },
    ],
    explanation:
      'To divide fractions, multiply by the reciprocal of the divisor:<br>' +
      '{{frac(a, b)}} ÷ {{frac(c, d)}} = {{frac(a, b)}} × {{frac(d, c)}} = {{frac(a*d, b*c)}}' +
      '{{gcd(a*d,b*c) > 1 ? " = " + fracStr(a*d, b*c) : ""}}',
  },
]

async function main() {
  for (const { id, ...fields } of updates) {
    const { error } = await supabase.from('questions').update(fields).eq('id', id)
    if (error) { console.error(`Failed ${id}:`, error.message); process.exit(1) }

    const { data } = await supabase
      .from('questions')
      .select('answer_template')
      .eq('id', id)
      .single()
    console.log(`${id}  answer_template: ${data?.answer_template}`)
  }
}

main()
