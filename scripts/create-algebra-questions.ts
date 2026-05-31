import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const questions = [

  // ── solving_quadratic_equations_quadratic_equation ───────────────────────────
  // x² − px − q = 0  (p,q > 0 → discriminant p²+4q always positive; one positive root)
  // Positive root = (p + √(p²+4q)) / 2
  {
    skill_ids: ['solving_quadratic_equations_quadratic_equation'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Using the <strong>quadratic formula</strong>, solve:</p>' +
      '<p style="font-size:1.15em;text-align:center;margin:16px 0;">x² − {{p}}x − {{q}} = 0</p>' +
      '<p>Give the <strong>positive root</strong> to <strong>2 decimal places</strong>.</p>',
    parameters: {
      p: { type: 'integer', min: 2, max: 5 },
      q: { type: 'integer', min: 3, max: 7 },
    },
    answer_template: '{{round((p + Math.sqrt(p*p + 4*q)) / 2, 2)}}',
    answer_type: 'numeric',
    tolerance: 0.01,
    traps: [
      {
        // Student finds the negative root instead
        answer_template: '{{round((p - Math.sqrt(p*p + 4*q)) / 2, 2)}}',
        response:
          "That's the negative root. The question asks for the <strong>positive</strong> root: " +
          'x = ({{p}} + √{{p*p + 4*q}}) ÷ 2 ≈ {{round((p + Math.sqrt(p*p + 4*q)) / 2, 2)}}.',
      },
      {
        // Student forgets to divide by 2a: returns p + √discriminant
        answer_template: '{{round(p + Math.sqrt(p*p + 4*q), 2)}}',
        response:
          'Remember the full formula: x = (−b ± √discriminant) ÷ <strong>2a</strong>. ' +
          'Here a = 1, so divide by 2: x = ({{p}} + √{{p*p + 4*q}}) ÷ 2 ≈ {{round((p + Math.sqrt(p*p + 4*q)) / 2, 2)}}.',
      },
    ],
    explanation:
      'Quadratic formula: x = (−b ± √(b²−4ac)) ÷ 2a<br>' +
      'Here a = 1, b = −{{p}}, c = −{{q}}.<br>' +
      'Discriminant = (−{{p}})² − 4(1)(−{{q}}) = {{p*p}} + {{4*q}} = {{p*p + 4*q}}<br>' +
      'x = ({{p}} ± √{{p*p + 4*q}}) ÷ 2<br>' +
      'Positive root: ({{p}} + {{round(Math.sqrt(p*p + 4*q), 4)}}) ÷ 2 ≈ {{round((p + Math.sqrt(p*p + 4*q)) / 2, 2)}}',
    is_published: false,
  },

  // ── inverse_functions ────────────────────────────────────────────────────────
  // f(x) = ax + b;  f⁻¹(x) = (x − b)/a;  f⁻¹(an + b) = n
  {
    skill_ids: ['inverse_functions'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>The function f is defined as f(x) = {{a}}x + {{b}}.</p>' +
      '<p>Find <strong>f⁻¹({{a*n + b}})</strong>.</p>',
    parameters: {
      a: { type: 'integer', min: 2, max: 5 },
      b: { type: 'integer', min: 1, max: 8 },
      n: { type: 'integer', min: 1, max: 6 },
    },
    answer_template: '{{n}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student applies f instead of f⁻¹: f(an+b) = a(an+b)+b
        answer_template: '{{a*(a*n+b) + b}}',
        response:
          'f⁻¹ means the <strong>inverse</strong> function — you need to reverse f, not apply it again. ' +
          'Rearrange y = {{a}}x + {{b}} for x: x = (y − {{b}}) ÷ {{a}}. ' +
          'So f⁻¹({{a*n+b}}) = ({{a*n+b}} − {{b}}) ÷ {{a}} = {{n}}.',
      },
      {
        // Student just divides the input by a, forgetting to subtract b first
        answer_template: '{{round((a*n + b) / a, 4)}}',
        response:
          'Subtract {{b}} <em>before</em> dividing by {{a}}: ' +
          'f⁻¹({{a*n+b}}) = ({{a*n+b}} − {{b}}) ÷ {{a}} = {{a*n}} ÷ {{a}} = {{n}}.',
      },
    ],
    explanation:
      'To find f⁻¹, rearrange y = {{a}}x + {{b}} for x:<br>' +
      'y − {{b}} = {{a}}x<br>' +
      'x = (y − {{b}}) ÷ {{a}}<br>' +
      'So f⁻¹(x) = (x − {{b}}) ÷ {{a}}<br>' +
      'f⁻¹({{a*n+b}}) = ({{a*n+b}} − {{b}}) ÷ {{a}} = {{a*n}} ÷ {{a}} = <strong>{{n}}</strong>',
    is_published: false,
  },

  // ── composite_functions ──────────────────────────────────────────────────────
  // f(x) = ax + b, g(x) = x²
  // fg(n) = f(g(n)) = f(n²) = a·n² + b
  {
    skill_ids: ['composite_functions'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>f(x) = {{a}}x + {{b}} and g(x) = x²</p>' +
      '<p>Find <strong>fg({{n}})</strong>.</p>',
    parameters: {
      a: { type: 'integer', min: 2, max: 4 },
      b: { type: 'integer', min: 1, max: 6 },
      n: { type: 'integer', min: 2, max: 5 },
    },
    // fg(n) = f(n²) = a·n² + b
    answer_template: '{{a*n*n + b}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student computes gf(n) instead: g(f(n)) = (an+b)²
        answer_template: '{{(a*n+b)*(a*n+b)}}',
        response:
          'fg means apply g <em>first</em>, then f — not the other way round. ' +
          'g({{n}}) = {{n}}² = {{n*n}}, then f({{n*n}}) = {{a}}×{{n*n}} + {{b}} = {{a*n*n + b}}.',
      },
      {
        // Student just applies f directly: f(n) = an + b
        answer_template: '{{a*n + b}}',
        response:
          'fg({{n}}) means apply g first: g({{n}}) = {{n*n}}, then apply f to that result: ' +
          'f({{n*n}}) = {{a}}×{{n*n}} + {{b}} = {{a*n*n + b}}.',
      },
    ],
    explanation:
      'fg means "apply g first, then f".<br>' +
      'Step 1: g({{n}}) = {{n}}² = {{n*n}}<br>' +
      'Step 2: f({{n*n}}) = {{a}} × {{n*n}} + {{b}} = <strong>{{a*n*n + b}}</strong>',
    is_published: false,
  },

  // ── equation_of_a_circle ─────────────────────────────────────────────────────
  // x² + y² = r²; find radius r
  {
    skill_ids: ['equation_of_a_circle'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>A circle has equation:</p>' +
      '<p style="font-size:1.15em;text-align:center;margin:16px 0;">x² + y² = {{r*r}}</p>' +
      '<p>Find the <strong>radius</strong> of the circle.</p>',
    parameters: {
      r: { type: 'integer', min: 3, max: 10 },
    },
    answer_template: '{{r}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student gives r² instead of r
        answer_template: '{{r*r}}',
        response:
          'The equation x² + y² = r² tells us r² = {{r*r}}. ' +
          'To find the radius, take the square root: r = √{{r*r}} = {{r}}.',
      },
      {
        // Student gives the diameter
        answer_template: '{{2*r}}',
        response:
          "That's the diameter. The radius is half the diameter, or take the square root of {{r*r}}: r = √{{r*r}} = {{r}}.",
      },
    ],
    explanation:
      'The equation x² + y² = r² represents a circle centred at the origin with radius r.<br>' +
      'Here r² = {{r*r}}, so the radius = √{{r*r}} = <strong>{{r}}</strong>.',
    is_published: false,
  },

  // ── algebraic_fractions ──────────────────────────────────────────────────────
  // Simplify (x² + (p+q)x + pq) / (x + p) = (x+p)(x+q)/(x+p) = x + q
  // p:{1..5}, q:{2..7, neq p}
  {
    skill_ids: ['algebraic_fractions'],
    difficulty: 4,
    question_type: 'numeric',
    question_template:
      '<p>Simplify the following algebraic fraction:</p>' +
      '<p style="font-size:1.15em;text-align:center;margin:16px 0;">' +
      '{{frac("x² + " + (p+q) + "x + " + (p*q), "x + " + p)}}</p>',
    parameters: {
      p: { type: 'integer', min: 1, max: 5 },
      q: {
        type: 'integer', min: 2, max: 7,
        constraint: { type: 'neq', target: 'p', target_type: 'parameter' },
      },
    },
    // Answer is the algebraic expression x + q
    answer_template: 'x + {{q}}',
    answer_type: 'expression',
    tolerance: null,
    traps: [
      {
        // Student cancels the wrong factor, leaving x + p
        answer_template: 'x + {{p}}',
        response:
          'The numerator factorises as (x + {{p}})(x + {{q}}). ' +
          'Cancel (x + {{p}}) with the denominator: the result is x + {{q}}, not x + {{p}}.',
      },
      {
        // Student loses the x term — only keeps the constant
        answer_template: '{{q}}',
        response:
          'After cancelling (x + {{p}}), the full remaining factor is (x + {{q}}) — not just {{q}}. ' +
          'The x term stays: answer is x + {{q}}.',
      },
    ],
    explanation:
      'Factorise the numerator: x² + {{p+q}}x + {{p*q}} = (x + {{p}})(x + {{q}})<br>' +
      'Cancel the common factor (x + {{p}}):<br>' +
      '{{frac("(x + " + p + ")(x + " + q + ")", "x + " + p)}} = <strong>x + {{q}}</strong>',
    is_published: false,
  },

  // ── nth_term_quadratic_sequences ─────────────────────────────────────────────
  // nth term = n² + dn + e
  // Terms: 1+d+e, 4+2d+e, 9+3d+e, 16+4d+e, ...
  // Ask for the 10th term: 100 + 10d + e
  {
    skill_ids: ['nth_term_quadratic_sequences'],
    difficulty: 4,
    question_type: 'numeric',
    question_template:
      '<p>The first four terms of a sequence are:</p>' +
      '<p style="font-size:1.1em;font-weight:bold;text-align:center;margin:12px 0;">' +
      '{{1+d+e}},&nbsp; {{4+2*d+e}},&nbsp; {{9+3*d+e}},&nbsp; {{16+4*d+e}}, ...</p>' +
      '<p>The nth term of this sequence is of the form n² + an + b.</p>' +
      '<p>Find the <strong>10th term</strong>.</p>',
    parameters: {
      d: { type: 'integer', min: 1, max: 4 },
      e: { type: 'integer', min: 1, max: 6 },
    },
    // 10th term = 100 + 10d + e
    answer_template: '{{100 + 10*d + e}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student just substitutes n=10 linearly: 10d + e (forgot the n² term)
        answer_template: '{{10*d + e}}',
        response:
          'The nth term includes n² — with n = 10: n² = 100. ' +
          '10th term = 100 + {{10*d}} + {{e}} = {{100+10*d+e}}.',
      },
      {
        // Student gives the 1st term (confuses finding nth term with listing terms)
        answer_template: '{{1+d+e}}',
        response:
          "That's the 1st term (when n = 1). For the 10th term, substitute n = 10: " +
          '100 + {{10*d}} + {{e}} = {{100+10*d+e}}.',
      },
    ],
    explanation:
      'The second differences are constant (= 2), confirming a quadratic sequence with leading term n².<br>' +
      'Using the first three terms to find the nth term gives: n² + {{d}}n + {{e}}<br>' +
      '10th term = 10² + {{d}}×10 + {{e}} = 100 + {{10*d}} + {{e}} = <strong>{{100+10*d+e}}</strong>',
    is_published: false,
  },

  // ── graph_transformations ────────────────────────────────────────────────────
  // f(n) = v.  g(x) = f(x − h)  →  g(n+h) = f(n) = v
  // Tests understanding of horizontal translation
  {
    skill_ids: ['graph_transformations'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>f({{n}}) = {{v}}</p>' +
      '<p>A new function g is defined as g(x) = f(x − {{h}}).</p>' +
      '<p>Find <strong>g({{n+h}})</strong>.</p>',
    parameters: {
      n: { type: 'integer', min: 2, max: 6 },
      v: { type: 'integer', min: 5, max: 20 },
      h: { type: 'integer', min: 1, max: 4 },
    },
    answer_template: '{{v}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student adds h to v — confuses horizontal with vertical shift
        answer_template: '{{v+h}}',
        response:
          'g(x) = f(x − {{h}}) shifts the graph horizontally, not vertically — the y-values are unchanged. ' +
          'g({{n+h}}) = f({{n+h}} − {{h}}) = f({{n}}) = {{v}}.',
      },
      {
        // Student subtracts h from v
        answer_template: '{{v-h}}',
        response:
          'g(x) = f(x − {{h}}) is a horizontal translation; it does not change y-values. ' +
          'g({{n+h}}) = f({{n+h}} − {{h}}) = f({{n}}) = {{v}}.',
      },
    ],
    explanation:
      'g(x) = f(x − {{h}}) shifts the graph of f by {{h}} units to the right.<br>' +
      'To find g({{n+h}}): substitute x = {{n+h}} into g(x):<br>' +
      'g({{n+h}}) = f({{n+h}} − {{h}}) = f({{n}}) = <strong>{{v}}</strong>',
    is_published: false,
  },

  // ── quadratic_functions ──────────────────────────────────────────────────────
  // y = (x − h)² + k = x² − 2hx + (h²+k)
  // Minimum value = k (occurs at x = h)
  {
    skill_ids: ['quadratic_functions'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Find the <strong>minimum value</strong> of:</p>' +
      '<p style="font-size:1.15em;text-align:center;margin:16px 0;">y = x² − {{2*h}}x + {{h*h + k}}</p>',
    parameters: {
      h: { type: 'integer', min: 1, max: 5 },
      k: { type: 'integer', min: 1, max: 8 },
    },
    answer_template: '{{k}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student gives the x-coordinate of the vertex (h), not the minimum y-value
        answer_template: '{{h}}',
        response:
          '{{h}} is the x-value where the minimum occurs. The minimum <em>value</em> of y is found by ' +
          'completing the square: y = (x − {{h}})² + {{k}}, so the minimum y is <strong>{{k}}</strong>.',
      },
      {
        // Student gives the constant term of the expanded form (h²+k) instead of k
        answer_template: '{{h*h + k}}',
        response:
          'That\'s the constant term when expanded. Complete the square: y = (x − {{h}})² + {{k}}. ' +
          'The minimum y-value is <strong>{{k}}</strong>, which occurs when (x − {{h}})² = 0.',
      },
    ],
    explanation:
      'Complete the square:<br>' +
      'y = x² − {{2*h}}x + {{h*h + k}}<br>' +
      '= (x − {{h}})² − {{h*h}} + {{h*h + k}}<br>' +
      '= (x − {{h}})² + {{k}}<br>' +
      'Since (x − {{h}})² ≥ 0, the minimum value is <strong>{{k}}</strong>, achieved when x = {{h}}.',
    is_published: false,
  },

  // ── quadratic_inequalities ───────────────────────────────────────────────────
  // (x − a)(x − b) < 0 with a:{1..3}, b:{5..9}
  // b always > a (since b ≥ 5 > 3 ≥ a), so solution is a < x < b
  // Largest integer in that range: b − 1
  {
    skill_ids: ['quadratic_inequalities'],
    difficulty: 4,
    question_type: 'numeric',
    question_template:
      '<p>Solve the inequality:</p>' +
      '<p style="font-size:1.15em;text-align:center;margin:16px 0;">x² − {{a+b}}x + {{a*b}} &lt; 0</p>' +
      '<p>Find the <strong>largest integer</strong> that satisfies the inequality.</p>',
    parameters: {
      a: { type: 'integer', min: 1, max: 3 },
      b: { type: 'integer', min: 5, max: 9 },
    },
    // Solution: a < x < b → largest integer = b − 1
    answer_template: '{{b-1}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student uses ≤ instead of <, includes the root b itself
        answer_template: '{{b}}',
        response:
          'The inequality is <strong>strict</strong> (< 0, not ≤ 0). At x = {{b}}, the expression equals zero — ' +
          'that doesn\'t satisfy < 0. The largest integer is {{b}} − 1 = <strong>{{b-1}}</strong>.',
      },
      {
        // Student gives the smallest integer solution (a+1) rather than the largest
        answer_template: '{{a+1}}',
        response:
          "That's the smallest integer satisfying the inequality. The solution set is {{a}} < x < {{b}}, " +
          "so the <strong>largest</strong> integer is {{b-1}}.",
      },
    ],
    explanation:
      'Factorise: x² − {{a+b}}x + {{a*b}} = (x − {{a}})(x − {{b}})<br>' +
      'The parabola crosses the x-axis at x = {{a}} and x = {{b}}.<br>' +
      'Since the x² coefficient is positive (∪-shaped), the expression is negative <em>between</em> the roots:<br>' +
      '{{a}} < x < {{b}}<br>' +
      'Integers in this range: {{a+1}}, {{a+2}}, …, {{b-1}}<br>' +
      'Largest integer: <strong>{{b-1}}</strong>',
    is_published: false,
  },

  // ── simultaneous_equations_quadratic ─────────────────────────────────────────
  // y = x² and y = x + n(n+1)
  // Substituting: x² − x − n(n+1) = 0 → (x − (n+1))(x + n) = 0
  // Roots: x = n+1 (positive) or x = −n (negative)
  {
    skill_ids: ['simultaneous_equations_quadratic'],
    difficulty: 4,
    question_type: 'numeric',
    question_template:
      '<p>Solve these simultaneous equations:</p>' +
      '<p style="font-size:1.1em;text-align:center;margin:8px 0;">y = x²</p>' +
      '<p style="font-size:1.1em;text-align:center;margin:8px 0;">y = x + {{n*(n+1)}}</p>' +
      '<p>Find the <strong>positive value of x</strong>.</p>',
    parameters: {
      // n ∈ {1,2,3} ensures x² − x − n(n+1) = 0 always has integer roots (n+1 and −n)
      n: { type: 'integer', min: 1, max: 3 },
    },
    // Positive root = n + 1
    answer_template: '{{n+1}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student gives the negative root
        answer_template: '{{-n}}',
        response:
          'x = {{-n}} is the negative root. The question asks for the positive value: x = {{n+1}}.',
      },
      {
        // Student returns the constant from the linear equation
        answer_template: '{{n*(n+1)}}',
        response:
          'Substitute y = x² into the linear equation: x² = x + {{n*(n+1)}} → x² − x − {{n*(n+1)}} = 0 → ' +
          '(x − {{n+1}})(x + {{n}}) = 0. The positive root is x = {{n+1}}.',
      },
    ],
    explanation:
      'Substitute y = x² into y = x + {{n*(n+1)}}:<br>' +
      'x² = x + {{n*(n+1)}}<br>' +
      'x² − x − {{n*(n+1)}} = 0<br>' +
      'Factorise: (x − {{n+1}})(x + {{n}}) = 0<br>' +
      'x = {{n+1}} or x = {{-n}}<br>' +
      'Positive value: <strong>x = {{n+1}}</strong>',
    is_published: false,
  },

]

async function main() {
  console.log(`Inserting ${questions.length} Algebra questions...`)
  const { data, error } = await supabase
    .from('questions')
    .insert(questions)
    .select('id, skill_ids')

  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }

  console.log('Inserted successfully:')
  data?.forEach(q => console.log(`  ${q.id}  →  ${q.skill_ids.join(', ')}`))
}

main()
