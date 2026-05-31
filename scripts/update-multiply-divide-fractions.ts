import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Answer templates now use gcd() so the displayed answer is always fully
// simplified. fraction answer_type still accepts any numerically equivalent
// form from the student (e.g. 2/6 accepted when correct answer is 1/3).

const updates = [
  {
    id: '6837c60d-78c4-4362-8395-30cd5d2c6bdb', // multiplying_fractions
    // a/b × c/d = (a*c)/(b*d), simplified
    answer_template: '{{(a*c)/gcd(a*c,b*d)}}/{{(b*d)/gcd(a*c,b*d)}}',
    traps: [
      {
        answer_template: '{{(a*d+b*c)/gcd(a*d+b*c,b*d)}}/{{(b*d)/gcd(a*d+b*c,b*d)}}',
        response:
          "That's adding the fractions. To multiply, multiply numerators together " +
          "and denominators together: {{frac(a,b)}} × {{frac(c,d)}} = {{frac(a*c/gcd(a*c,b*d), b*d/gcd(a*c,b*d))}}.",
      },
      {
        answer_template: '{{(a*d)/gcd(a*d,b*c)}}/{{(b*c)/gcd(a*d,b*c)}}',
        response:
          "That's the result of dividing instead of multiplying. Multiply straight across: " +
          "({{a}} × {{c}}) / ({{b}} × {{d}}) = {{(a*c)/gcd(a*c,b*d)}}/{{(b*d)/gcd(a*c,b*d)}}.",
      },
    ],
    explanation:
      'Multiply numerators together and denominators together:<br>' +
      '{{frac(a, b)}} × {{frac(c, d)}} = {{frac(a*c, b*d)}}' +
      '{{gcd(a*c,b*d) > 1 ? " = " + frac(a*c/gcd(a*c,b*d), b*d/gcd(a*c,b*d)) : ""}}',
  },
  {
    id: '1dbb9708-70f7-41cd-ba33-cfe35b0a2f80', // dividing_fractions
    // a/b ÷ c/d = (a*d)/(b*c), simplified
    answer_template: '{{(a*d)/gcd(a*d,b*c)}}/{{(b*c)/gcd(a*d,b*c)}}',
    traps: [
      {
        answer_template: '{{(a*c)/gcd(a*c,b*d)}}/{{(b*d)/gcd(a*c,b*d)}}',
        response:
          "That's multiplying the fractions, not dividing. To divide, multiply by the " +
          "<strong>reciprocal</strong> (flip the second fraction): " +
          "{{a}}/{{b}} ÷ {{c}}/{{d}} = {{a}}/{{b}} × {{d}}/{{c}} = {{(a*d)/gcd(a*d,b*c)}}/{{(b*c)/gcd(a*d,b*c)}}.",
      },
      {
        answer_template: '{{(b*c)/gcd(a*d,b*c)}}/{{(a*d)/gcd(a*d,b*c)}}',
        response:
          'Flip the <strong>second</strong> fraction (the divisor), not the first: ' +
          '{{a}}/{{b}} ÷ {{c}}/{{d}} = {{a}}/{{b}} × {{d}}/{{c}} = {{(a*d)/gcd(a*d,b*c)}}/{{(b*c)/gcd(a*d,b*c)}}.',
      },
    ],
    explanation:
      'To divide fractions, multiply by the reciprocal of the divisor:<br>' +
      '{{frac(a, b)}} ÷ {{frac(c, d)}} = {{frac(a, b)}} × {{frac(d, c)}} = {{frac(a*d, b*c)}}' +
      '{{gcd(a*d,b*c) > 1 ? " = " + frac(a*d/gcd(a*d,b*c), b*c/gcd(a*d,b*c)) : ""}}',
  },
]

async function main() {
  for (const { id, ...fields } of updates) {
    const { error } = await supabase.from('questions').update(fields).eq('id', id)
    if (error) {
      console.error(`Failed to update ${id}:`, error.message)
      process.exit(1)
    }
    console.log(`Updated ${id}`)

    // Spot-check
    const { data } = await supabase
      .from('questions')
      .select('answer_template')
      .eq('id', id)
      .single()
    console.log('  answer_template:', data?.answer_template)
  }
}

main()
