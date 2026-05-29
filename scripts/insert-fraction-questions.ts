import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Note: {{frac(a, b)}} in question/explanation templates renders as HTML
// <sup>a</sup>&frasl;<sub>b</sub>. Do NOT use frac() in answer_template or
// trap answer_template — those must produce plain "numerator/denominator" text
// so the answer checker can compare them numerically.

const questions = [

  // ── simplifying_fractions ───────────────────────────────────────────────────
  {
    skill_ids: ['simplifying_fractions'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Simplify this fraction fully:</p>' +
      '<p style="font-size:1.5em;text-align:center;margin:12px 0;">{{frac(k*p, k*q)}}</p>',
    parameters: {
      // q is prime (3, 5 or 7) so gcd(p, q) = 1 guaranteed when p < q
      q: { type: 'integer', min: 3, max: 7, constraint: { type: 'is_prime' } },
      // p < q ensures the fraction is proper and already in lowest terms after simplifying
      p: { type: 'integer', min: 1, max: 6, constraint: { type: 'lt', target: 'q', target_type: 'parameter' } },
      k: { type: 'integer', min: 2, max: 6 },
    },
    // Answer is the fully simplified fraction as plain text, e.g. "2/5"
    answer_template: '{{p}}/{{q}}',
    answer_type: 'exact',
    tolerance: null,
    traps: [
      {
        // Student writes the original unsimplified fraction
        answer_template: '{{k*p}}/{{k*q}}',
        response:
          "That's the original fraction — you need to simplify it. Both {{k*p}} and {{k*q}} share a common factor of {{k}}. Divide both by {{k}}: {{k*p}} ÷ {{k}} = {{p}}, and {{k*q}} ÷ {{k}} = {{q}}. Simplified: {{p}}/{{q}}.",
      },
    ],
    explanation:
      'Find the highest common factor (HCF) of {{k*p}} and {{k*q}}.<br>' +
      'HCF = {{k}}<br>' +
      'Divide both by {{k}}: {{frac(k*p, k*q)}} = {{frac(p, q)}}',
    is_published: false,
  },

  // ── irregular_and_improper_fractions ────────────────────────────────────────
  {
    skill_ids: ['irregular_and_improper_fractions'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Write the mixed number <strong>{{w}} {{frac(p, q)}}</strong> as an improper fraction.</p>',
    parameters: {
      // q is prime so gcd(p, q) = 1, keeping the fraction in lowest terms
      q: { type: 'integer', min: 3, max: 7, constraint: { type: 'is_prime' } },
      p: { type: 'integer', min: 1, max: 6, constraint: { type: 'lt', target: 'q', target_type: 'parameter' } },
      w: { type: 'integer', min: 1, max: 4 },
    },
    // w * q + p over q, e.g. 2 and 3/5 → (2×5+3)/5 = 13/5
    answer_template: '{{w*q + p}}/{{q}}',
    answer_type: 'fraction',
    tolerance: null,
    traps: [
      {
        // Common error: add w + p instead of w × q + p
        answer_template: '{{w + p}}/{{q}}',
        response:
          'Multiply the whole number by the denominator, <em>then</em> add the numerator. ' +
          '{{w}} × {{q}} = {{w*q}}, then + {{p}} = {{w*q + p}}. ' +
          'Improper fraction: {{w*q + p}}/{{q}}.',
      },
      {
        // Error: just concatenate w and p without using q at all
        answer_template: '{{w*p}}/{{q}}',
        response:
          'Multiply the whole number by the <strong>denominator</strong> (not the numerator): ' +
          '{{w}} × {{q}} = {{w*q}}, then add {{p}} to get {{w*q + p}}/{{q}}.',
      },
    ],
    explanation:
      'Multiply the whole number by the denominator, then add the numerator:<br>' +
      '{{w}} × {{q}} + {{p}} = {{w*q}} + {{p}} = {{w*q + p}}<br>' +
      'Answer: {{frac(w*q + p, q)}}',
    is_published: false,
  },

  // ── converting_fractions_to_decimals ────────────────────────────────────────
  {
    skill_ids: ['converting_fractions_to_decimals'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Convert this fraction to a decimal:</p>' +
      '<p style="font-size:1.5em;text-align:center;margin:12px 0;">{{frac(n, d)}}</p>',
    parameters: {
      // d divides 100 → gives terminating, "clean" decimals
      // factor_of 100 in range 2–8 → d ∈ {2, 4, 5}
      d: { type: 'integer', min: 2, max: 8, constraint: { type: 'factor_of', target: 100 } },
      n: { type: 'integer', min: 1, max: 7, constraint: { type: 'lt', target: 'd', target_type: 'parameter' } },
    },
    answer_template: '{{round(n / d, 4)}}',
    answer_type: 'numeric',
    tolerance: 0.001,
    traps: [
      {
        // Student swaps numerator and denominator
        answer_template: '{{round(d / n, 4)}}',
        response:
          'Divide the <strong>top</strong> number by the <strong>bottom</strong> number: {{n}} ÷ {{d}} = {{round(n/d, 4)}}.',
      },
      {
        // Student just writes the denominator
        answer_template: '{{d}}',
        response:
          'To convert a fraction to a decimal, divide numerator ÷ denominator: {{n}} ÷ {{d}} = {{round(n/d, 4)}}.',
      },
    ],
    explanation:
      'Divide the numerator by the denominator:<br>{{n}} ÷ {{d}} = {{round(n/d, 4)}}',
    is_published: false,
  },

  // ── converting_decimals_to_fractions ────────────────────────────────────────
  {
    skill_ids: ['converting_decimals_to_fractions'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Convert <strong>{{round(n/10, 1)}}</strong> to a fraction in its simplest form.</p>',
    parameters: {
      // n odd and ≠ 5 → n ∈ {1, 3, 7, 9}
      // gcd(n, 10) = 1 for all these (10 = 2×5; n is odd and not a multiple of 5)
      // so n/10 is already fully simplified
      n: {
        type: 'integer',
        min: 1,
        max: 9,
        constraints: [
          { type: 'is_odd' },
          { type: 'neq', target: 5 },
        ],
      },
    },
    // Answer as plain fraction text
    answer_template: '{{n}}/10',
    answer_type: 'fraction',
    tolerance: null,
    traps: [
      {
        // Wrong denominator — 100 instead of 10
        answer_template: '{{n}}/100',
        response:
          '{{round(n/10, 1)}} has <strong>one</strong> decimal place, so the denominator is 10 (not 100). Answer: {{n}}/10.',
      },
      {
        // Student just writes the numerator digit
        answer_template: '{{n}}/1',
        response:
          'Write the digits after the decimal point over 10 (one decimal place): {{round(n/10, 1)}} = {{n}}/10.',
      },
    ],
    explanation:
      '{{round(n/10, 1)}} has one decimal place → denominator is 10.<br>' +
      '{{round(n/10, 1)}} = {{n}}/10<br>' +
      '{{n}} and 10 share no common factors, so this is already fully simplified.',
    is_published: false,
  },

  // ── adding_and_subtracting_fractions — ADDITION ─────────────────────────────
  {
    skill_ids: ['adding_and_subtracting_fractions'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Calculate, giving your answer as a fraction:</p>' +
      '<p style="font-size:1.3em;text-align:center;margin:12px 0;">{{frac(a, 3)}} + {{frac(b, 7)}}</p>',
    parameters: {
      a: { type: 'integer', min: 1, max: 2 },
      b: { type: 'integer', min: 1, max: 4 },
      // Result = (7a + 3b)/21. Since 3 and 7 are prime:
      // • 7a+3b is never divisible by 3 (≡ 7a ≡ a, never 0 for a=1,2)
      // • 7a+3b is never divisible by 7 (≡ 3b, and b≤4<7 so 3b<21, not div by 7)
      // → result is always irreducible → clean display in "not quite" message
    },
    answer_template: '{{7*a + 3*b}}/21',
    answer_type: 'fraction',
    tolerance: null,
    traps: [
      {
        // Classic error: add numerators AND denominators
        answer_template: '{{a + b}}/{{3 + 7}}',
        response:
          "You can't add fractions by adding the numerators and the denominators separately. " +
          'Find a common denominator first. LCM(3, 7) = 21. ' +
          'Convert: {{a}}/3 = {{7*a}}/21 and {{b}}/7 = {{3*b}}/21. ' +
          'Add: ({{7*a}} + {{3*b}})/21 = {{7*a + 3*b}}/21.',
      },
      {
        // Error: multiply instead of add
        answer_template: '{{a*b}}/{{3*7}}',
        response:
          "That's what you'd get multiplying the fractions. To add, find a common denominator: " +
          'LCM(3, 7) = 21 → {{7*a + 3*b}}/21.',
      },
    ],
    explanation:
      'The lowest common multiple of 3 and 7 is 21.<br>' +
      'Convert each fraction: {{frac(a, 3)}} = {{frac(7*a, 21)}} and {{frac(b, 7)}} = {{frac(3*b, 21)}}<br>' +
      'Add: {{frac(7*a, 21)}} + {{frac(3*b, 21)}} = {{frac(7*a + 3*b, 21)}}',
    is_published: false,
  },

  // ── adding_and_subtracting_fractions — SUBTRACTION ──────────────────────────
  {
    skill_ids: ['adding_and_subtracting_fractions'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Calculate, giving your answer as a fraction:</p>' +
      '<p style="font-size:1.3em;text-align:center;margin:12px 0;">{{frac(a, 4)}} - {{frac(b, 5)}}</p>',
    parameters: {
      // Keep result positive: 5a - 4b > 0 → a ∈ {2,3,4}, b ∈ {1,2,3}, 5a > 4b
      // 5a - 4b is never div by 5 (≡ -4b ≡ b mod 5; b ∈ {1,2,3} → never 0)
      // 5a - 4b is never div by 4 (≡ a mod 4; a ∈ {2,3,4}: a=4 → 5*4-4b=20-4b=4(5-b) → div by 4!)
      // So restrict a ∈ {2,3} to avoid divisibility by 4 (a=2: 5*2-4b=10-4b, 10-4b div by 4 only if 4b≡10 mod 4 → 2b≡2 mod 4 → b odd: b=1→6/20, b=3→-2/20... wait)
      // This is getting complex. Let's just use fraction type and accept any equivalent form.
      a: { type: 'integer', min: 2, max: 4 },
      b: { type: 'integer', min: 1, max: 3 },
    },
    // 5a/20 - 4b/20 = (5a - 4b)/20 — may simplify but fraction type handles it
    answer_template: '{{5*a - 4*b}}/20',
    answer_type: 'fraction',
    tolerance: null,
    traps: [
      {
        // Subtract denominators too
        answer_template: '{{a - b}}/{{4 - 5}}',
        response:
          "You can't subtract fractions by subtracting numerators and denominators separately. " +
          'Find a common denominator: LCM(4, 5) = 20. ' +
          '{{a}}/4 = {{5*a}}/20 and {{b}}/5 = {{4*b}}/20. ' +
          'Subtract: ({{5*a}} - {{4*b}})/20 = {{5*a - 4*b}}/20.',
      },
      {
        // Forget to convert — just subtract numerators over original denominators
        answer_template: '{{a - b}}/4',
        response:
          'You need a common denominator before subtracting. LCM(4, 5) = 20: ' +
          '{{a}}/4 = {{5*a}}/20, {{b}}/5 = {{4*b}}/20, so the answer is {{5*a - 4*b}}/20.',
      },
    ],
    explanation:
      'The lowest common multiple of 4 and 5 is 20.<br>' +
      'Convert: {{frac(a, 4)}} = {{frac(5*a, 20)}} and {{frac(b, 5)}} = {{frac(4*b, 20)}}<br>' +
      'Subtract: {{frac(5*a, 20)}} − {{frac(4*b, 20)}} = {{frac(5*a - 4*b, 20)}}',
    is_published: false,
  },

  // ── multiplying_fractions ────────────────────────────────────────────────────
  {
    skill_ids: ['multiplying_fractions'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Calculate, simplifying your answer fully:</p>' +
      '<p style="font-size:1.3em;text-align:center;margin:12px 0;">{{frac(a, b)}} × {{frac(c, d)}}</p>',
    parameters: {
      b: { type: 'integer', min: 2, max: 7 },
      a: { type: 'integer', min: 1, max: 6, constraint: { type: 'lt', target: 'b', target_type: 'parameter' } },
      d: { type: 'integer', min: 2, max: 7, constraint: { type: 'neq', target: 'b', target_type: 'parameter' } },
      c: { type: 'integer', min: 1, max: 6, constraint: { type: 'lt', target: 'd', target_type: 'parameter' } },
    },
    // a/b × c/d = (a×c)/(b×d) — may not be fully simplified but fraction type accepts equivalents
    answer_template: '{{a*c}}/{{b*d}}',
    answer_type: 'fraction',
    tolerance: null,
    traps: [
      {
        // Error: add instead of multiply
        answer_template: '{{a*d + b*c}}/{{b*d}}',
        response:
          "That's adding the fractions. To multiply, multiply numerators together and denominators together: " +
          '{{frac(a,b)}} × {{frac(c,d)}} = {{frac(a*c, b*d)}}.',
      },
      {
        // Error: multiply one pair but flip the other
        answer_template: '{{a*d}}/{{b*c}}',
        response:
          "That's what you'd get if you divided instead of multiplied. Multiply straight across: " +
          '({{a}} × {{c}}) / ({{b}} × {{d}}) = {{a*c}}/{{b*d}}.',
      },
    ],
    explanation:
      'Multiply numerators together and denominators together:<br>' +
      '{{frac(a, b)}} × {{frac(c, d)}} = {{frac(a*c, b*d)}}',
    is_published: false,
  },

  // ── dividing_fractions ───────────────────────────────────────────────────────
  {
    skill_ids: ['dividing_fractions'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Calculate, simplifying your answer fully:</p>' +
      '<p style="font-size:1.3em;text-align:center;margin:12px 0;">{{frac(a, b)}} ÷ {{frac(c, d)}}</p>',
    parameters: {
      b: { type: 'integer', min: 2, max: 6 },
      a: { type: 'integer', min: 1, max: 5, constraint: { type: 'lt', target: 'b', target_type: 'parameter' } },
      d: { type: 'integer', min: 2, max: 6, constraint: { type: 'neq', target: 'b', target_type: 'parameter' } },
      c: { type: 'integer', min: 1, max: 5, constraint: { type: 'lt', target: 'd', target_type: 'parameter' } },
    },
    // a/b ÷ c/d = (a×d)/(b×c)
    answer_template: '{{a*d}}/{{b*c}}',
    answer_type: 'fraction',
    tolerance: null,
    traps: [
      {
        // Error: multiply instead of dividing (didn't flip the second fraction)
        answer_template: '{{a*c}}/{{b*d}}',
        response:
          "That's what you'd get multiplying the fractions. To divide, multiply by the <strong>reciprocal</strong> (flip the second fraction): " +
          '{{a}}/{{b}} ÷ {{c}}/{{d}} = {{a}}/{{b}} × {{d}}/{{c}} = {{a*d}}/{{b*c}}.',
      },
      {
        // Error: flip the first fraction instead of the second
        answer_template: '{{b*c}}/{{a*d}}',
        response:
          'Flip the <strong>second</strong> fraction (the divisor), not the first: ' +
          '{{a}}/{{b}} ÷ {{c}}/{{d}} = {{a}}/{{b}} × {{d}}/{{c}} = {{a*d}}/{{b*c}}.',
      },
    ],
    explanation:
      'To divide fractions, multiply by the reciprocal of the divisor:<br>' +
      '{{frac(a, b)}} ÷ {{frac(c, d)}} = {{frac(a, b)}} × {{frac(d, c)}} = {{frac(a*d, b*c)}}',
    is_published: false,
  },

  // ── fractions_decimals_and_percentages ───────────────────────────────────────
  {
    skill_ids: ['fractions_decimals_and_percentages'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Convert the fraction {{frac(n, d)}} to a percentage.</p>',
    parameters: {
      // d divides 100 in range 2–25 → d ∈ {2,4,5,10,20,25}
      d: { type: 'integer', min: 2, max: 25, constraint: { type: 'factor_of', target: 100 } },
      n: { type: 'integer', min: 1, max: 24, constraint: { type: 'lt', target: 'd', target_type: 'parameter' } },
    },
    // n/d × 100 — always a whole number because d divides 100
    answer_template: '{{n * 100 / d}}',
    answer_type: 'numeric',
    tolerance: 0.5,
    traps: [
      {
        // Student writes the decimal (0–1) instead of the percentage
        answer_template: '{{round(n/d, 4)}}',
        response:
          'That\'s the decimal form. To convert to a percentage, multiply by 100: {{n}}/{{d}} × 100 = {{n * 100 / d}}%.',
      },
      {
        // Student divides 100 by d instead of n/d × 100
        answer_template: '{{100 / d}}',
        response:
          'Multiply the whole fraction by 100: ({{n}} ÷ {{d}}) × 100 = {{round(n/d, 4)}} × 100 = {{n * 100 / d}}%.',
      },
    ],
    explanation:
      'To convert a fraction to a percentage, multiply by 100:<br>' +
      '{{frac(n, d)}} × 100 = {{round(n/d, 4)}} × 100 = {{n * 100 / d}}%',
    is_published: false,
  },
]

async function main() {
  console.log(`Inserting ${questions.length} fraction questions...`)
  const { data, error } = await supabase.from('questions').insert(questions).select('id, skill_ids')
  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }
  console.log('Inserted successfully:')
  data?.forEach(q => console.log(`  ${q.id}  →  ${q.skill_ids.join(', ')}`))
}

main()
