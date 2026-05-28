import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const questions = [
  // ───────────────────────────────────────────────
  // PROBABILITY & DATA
  // ───────────────────────────────────────────────
  {
    skill_ids: ['calculating_simple_probability'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>A bag contains <strong>{{a}} red</strong> counters and <strong>{{10 - a}} blue</strong> counters.</p>' +
      '<p>A counter is chosen at random.</p>' +
      '<p>Find the probability of choosing a red counter. Give your answer as a decimal.</p>',
    parameters: {
      a: { type: 'integer', min: 2, max: 8 },
    },
    answer_template: '{{a / 10}}',
    answer_type: 'numeric',
    tolerance: 0.005,
    traps: [
      {
        answer_template: '{{(10 - a) / 10}}',
        response:
          "That's the probability of picking <strong>blue</strong>. You need red: P(red) = {{a}} ÷ 10 = {{a / 10}}.",
      },
      {
        answer_template: '{{a}}',
        response:
          'Probability = favourable outcomes ÷ total outcomes. There are 10 counters in total, so P(red) = {{a}} ÷ 10 = {{a / 10}}.',
      },
    ],
    explanation:
      'Total counters = {{a}} + {{10 - a}} = 10.<br>P(red) = {{a}} ÷ 10 = {{a / 10}}.',
    is_published: false, // draft
  },

  {
    skill_ids: ['mutually_exclusive_events'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>P(A) = <strong>{{a / 10}}</strong> and P(B) = <strong>{{b / 10}}</strong>.</p>' +
      '<p>Events A and B are mutually exclusive.</p>' +
      '<p>Find P(A or B).</p>',
    parameters: {
      a: { type: 'integer', min: 1, max: 4 },
      b: { type: 'integer', min: 1, max: 4 },
    },
    answer_template: '{{(a + b) / 10}}',
    answer_type: 'numeric',
    tolerance: 0.005,
    traps: [
      {
        answer_template: '{{round((a / 10) * (b / 10), 4)}}',
        response:
          'You multiplied the probabilities — that applies to independent events. For mutually exclusive events: P(A or B) = P(A) + P(B) = {{a / 10}} + {{b / 10}} = {{(a + b) / 10}}.',
      },
      {
        answer_template: '{{round((a + b) / 10 - (a / 10) * (b / 10), 4)}}',
        response:
          'A and B are mutually exclusive — they cannot both occur, so P(A and B) = 0. P(A or B) = P(A) + P(B) = {{(a + b) / 10}}.',
      },
    ],
    explanation:
      'Mutually exclusive events cannot both occur, so P(A and B) = 0.<br>P(A or B) = P(A) + P(B) = {{a / 10}} + {{b / 10}} = {{(a + b) / 10}}.',
    is_published: false, // draft
  },

  {
    skill_ids: ['mean'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Find the mean of these five numbers:</p>' +
      '<p><strong>{{a}}, {{b}}, {{c}}, {{d}}, {{e}}</strong></p>' +
      '<p>Give your answer to 1 decimal place if needed.</p>',
    parameters: {
      a: { type: 'integer', min: 2, max: 14 },
      b: { type: 'integer', min: 2, max: 14 },
      c: { type: 'integer', min: 2, max: 14 },
      d: { type: 'integer', min: 2, max: 14 },
      e: { type: 'integer', min: 2, max: 14 },
    },
    answer_template: '{{round((a + b + c + d + e) / 5, 1)}}',
    answer_type: 'numeric',
    tolerance: 0.1,
    traps: [
      {
        answer_template: '{{a + b + c + d + e}}',
        response:
          "That's the total, not the mean. Divide the total by the number of values: {{a + b + c + d + e}} ÷ 5 = {{round((a + b + c + d + e) / 5, 1)}}.",
      },
      {
        answer_template: '{{5}}',
        response:
          'The mean = sum ÷ count. Add the values: {{a + b + c + d + e}}, then divide by 5 to get {{round((a + b + c + d + e) / 5, 1)}}.',
      },
    ],
    explanation:
      'Mean = sum of values ÷ number of values<br>' +
      '= ({{a}} + {{b}} + {{c}} + {{d}} + {{e}}) ÷ 5<br>' +
      '= {{a + b + c + d + e}} ÷ 5<br>' +
      '= {{round((a + b + c + d + e) / 5, 1)}}',
    is_published: false, // draft
  },

  {
    // Median — parameters engineered so a < b < c < d < e always,
    // guaranteeing c is the middle value. Displayed scrambled.
    skill_ids: ['median'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Find the median of these five numbers:</p>' +
      '<p><strong>{{c}}, {{a}}, {{e}}, {{b}}, {{d}}</strong></p>',
    parameters: {
      a: { type: 'integer', min: 2, max: 8 },
      b: { type: 'integer', min: 9, max: 14 },
      c: { type: 'integer', min: 15, max: 20 },
      d: { type: 'integer', min: 21, max: 26 },
      e: { type: 'integer', min: 27, max: 35 },
    },
    answer_template: '{{c}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{round((a + b + c + d + e) / 5, 1)}}',
        response:
          "That's the mean. The median is the middle value when sorted. Sorted: {{a}}, {{b}}, {{c}}, {{d}}, {{e}} — the middle (3rd) value is {{c}}.",
      },
      {
        answer_template: '{{e - a}}',
        response:
          "That's the range. Sort the values first: {{a}}, {{b}}, {{c}}, {{d}}, {{e}} — the middle value is {{c}}.",
      },
    ],
    explanation:
      'Sort the values: {{a}}, {{b}}, {{c}}, {{d}}, {{e}}.<br>' +
      'There are 5 values, so the median is the 3rd value = <strong>{{c}}</strong>.',
    is_published: false, // draft
  },

  {
    // Range — parameters engineered so a < b < c < d < e always.
    // Displayed scrambled. Range = e − a.
    skill_ids: ['range'],
    difficulty: 1,
    question_type: 'numeric',
    question_template:
      '<p>Find the range of these numbers:</p>' +
      '<p><strong>{{d}}, {{a}}, {{e}}, {{b}}, {{c}}</strong></p>',
    parameters: {
      a: { type: 'integer', min: 2, max: 8 },
      b: { type: 'integer', min: 9, max: 15 },
      c: { type: 'integer', min: 16, max: 22 },
      d: { type: 'integer', min: 23, max: 29 },
      e: { type: 'integer', min: 30, max: 40 },
    },
    answer_template: '{{e - a}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{e}}',
        response:
          "The range is highest − lowest, not just the highest value. Range = {{e}} − {{a}} = {{e - a}}.",
      },
      {
        answer_template: '{{round((a + b + c + d + e) / 5, 1)}}',
        response:
          "That's the mean. Range = highest value − lowest value = {{e}} − {{a}} = {{e - a}}.",
      },
    ],
    explanation:
      'Range = highest value − lowest value = {{e}} − {{a}} = {{e - a}}.',
    is_published: false, // draft
  },

  // ───────────────────────────────────────────────
  // SHAPE & SPACE
  // ───────────────────────────────────────────────
  {
    skill_ids: ['measuring_lines_and_angles'],
    difficulty: 1,
    question_type: 'numeric',
    question_template:
      '<p>Angles on a straight line add up to 180°.</p>' +
      '<p>Three angles on a straight line measure <strong>{{a}}°</strong>, <strong>{{b}}°</strong> and <em>x</em>.</p>' +
      '<p>Find <em>x</em>.</p>',
    parameters: {
      a: { type: 'integer', min: 20, max: 60 },
      b: { type: 'integer', min: 20, max: 60 },
    },
    answer_template: '{{180 - a - b}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{360 - a - b}}',
        response:
          'Angles on a <strong>straight line</strong> add up to 180°, not 360°. x = 180° − {{a}}° − {{b}}° = {{180 - a - b}}°.',
      },
      {
        answer_template: '{{180 - a}}',
        response:
          'Subtract <strong>both</strong> known angles: x = 180° − {{a}}° − {{b}}° = {{180 - a - b}}°.',
      },
    ],
    explanation:
      'Angles on a straight line sum to 180°.<br>x = 180° − {{a}}° − {{b}}° = {{180 - a - b}}°.',
    is_published: false, // draft
  },

  {
    skill_ids: ['areas_of_triangles'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>A triangle has a base of <strong>{{b}} cm</strong> and a perpendicular height of <strong>{{h}} cm</strong>.</p>' +
      '<p>Find the area of the triangle.</p>',
    parameters: {
      b: { type: 'integer', min: 4, max: 16, constraint: { type: 'is_even' } },
      h: { type: 'integer', min: 3, max: 12 },
    },
    answer_template: '{{b * h / 2}} cm²',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{b * h}}',
        response:
          'You forgot to halve the area. Triangle area = ½ × base × height = ½ × {{b}} × {{h}} = {{b * h / 2}} cm².',
      },
      {
        answer_template: '{{b + h}}',
        response:
          'Area of a triangle = ½ × base × height — not base + height. Area = ½ × {{b}} × {{h}} = {{b * h / 2}} cm².',
      },
    ],
    explanation:
      'Area of a triangle = ½ × base × height<br>= ½ × {{b}} × {{h}}<br>= {{b * h / 2}} cm²',
    is_published: false, // draft
  },

  {
    skill_ids: ['area_of_a_circle'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Find the area of a circle with radius <strong>{{r}} cm</strong>.</p>' +
      '<p>Give your answer to 2 decimal places.</p>',
    parameters: {
      r: { type: 'integer', min: 2, max: 9 },
    },
    answer_template: '{{round(Math.PI * r * r, 2)}} cm²',
    answer_type: 'numeric',
    tolerance: 0.5,
    traps: [
      {
        answer_template: '{{round(2 * Math.PI * r, 2)}}',
        response:
          "That's the circumference formula (2πr). Area of a circle = π × r² = π × {{r}}² ≈ {{round(Math.PI * r * r, 2)}} cm².",
      },
      {
        answer_template: '{{round(Math.PI * r, 2)}}',
        response:
          'You used π × r, but the formula is π × r². Area = π × {{r}}² = π × {{r * r}} ≈ {{round(Math.PI * r * r, 2)}} cm².',
      },
      {
        answer_template: '{{round(Math.PI * (2 * r) * (2 * r), 2)}}',
        response:
          'You used the diameter ({{2 * r}}) instead of the radius ({{r}}). Area = π × r² = π × {{r}}² ≈ {{round(Math.PI * r * r, 2)}} cm².',
      },
    ],
    explanation:
      'Area of a circle = π × r²<br>= π × {{r}}²<br>= π × {{r * r}}<br>≈ {{round(Math.PI * r * r, 2)}} cm²',
    is_published: false, // draft
  },

  {
    skill_ids: ['circle_theorem_angle_at_centre'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>The angle subtended at the <strong>circumference</strong> of a circle is <strong>{{a}}°</strong>.</p>' +
      '<p>Find the angle subtended at the <strong>centre</strong> of the circle by the same arc.</p>',
    parameters: {
      a: { type: 'integer', min: 20, max: 70 },
    },
    answer_template: '{{2 * a}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{a / 2}}',
        response:
          'The angle at the <strong>centre</strong> is <em>twice</em> the angle at the circumference — not half. Angle at centre = 2 × {{a}}° = {{2 * a}}°.',
      },
      {
        answer_template: '{{180 - a}}',
        response:
          "That calculation doesn't apply here. The circle theorem states: angle at centre = 2 × angle at circumference = 2 × {{a}}° = {{2 * a}}°.",
      },
    ],
    explanation:
      'Circle theorem: the angle at the centre is twice the angle at the circumference.<br>Angle at centre = 2 × {{a}}° = {{2 * a}}°.',
    is_published: false, // draft
  },

  {
    // Uses the 3k–4k–5k Pythagorean triple so the answer is always a whole number.
    skill_ids: ['pythagoras_theorem'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>A right-angled triangle has legs of length <strong>{{3 * k}} cm</strong> and <strong>{{4 * k}} cm</strong>.</p>' +
      '<p>Calculate the length of the hypotenuse. Give your answer in cm.</p>',
    parameters: {
      k: { type: 'integer', min: 1, max: 5 },
    },
    answer_template: '{{5 * k}} cm',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{3 * k + 4 * k}}',
        response:
          'You added the side lengths instead of using Pythagoras. Hypotenuse² = {{3*k}}² + {{4*k}}² = {{9*k*k}} + {{16*k*k}} = {{25*k*k}}, so hypotenuse = √{{25*k*k}} = {{5*k}} cm.',
      },
      {
        answer_template: '{{25 * k * k}}',
        response:
          "You found hypotenuse² = {{25*k*k}} correctly, but forgot to take the square root. Hypotenuse = √{{25*k*k}} = {{5*k}} cm.",
      },
    ],
    explanation:
      "Pythagoras' theorem: hypotenuse² = a² + b²<br>" +
      '= {{3*k}}² + {{4*k}}²<br>' +
      '= {{9*k*k}} + {{16*k*k}}<br>' +
      '= {{25*k*k}}<br>' +
      'Hypotenuse = √{{25*k*k}} = {{5*k}} cm',
    is_published: false, // draft
  },
]

async function main() {
  console.log(`Inserting ${questions.length} questions...`)
  const { data, error } = await supabase.from('questions').insert(questions).select('id, skill_ids')
  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }
  console.log('Inserted successfully:')
  data?.forEach(q => console.log(`  ${q.id}  →  ${q.skill_ids.join(', ')}`))
}

main()
