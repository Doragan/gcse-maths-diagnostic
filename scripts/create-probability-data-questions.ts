import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Note: {{frac(...)}} in question_template and explanation renders as HTML.
// answer_template and trap answer_template must produce plain text that the
// answer checker can parse. For fraction answers use fracStr() or literal "n/d".

const questions = [

  // ── mode ────────────────────────────────────────────────────────────────────
  // Five values: m+8, m, m+3, m, m+6  (sorted: m, m, m+3, m+6, m+8)
  // Mode = m (appears twice); median = m+3; mean = (5m+17)/5
  {
    skill_ids: ['mode'],
    difficulty: 1,
    question_type: 'numeric',
    question_template:
      '<p>Find the <strong>mode</strong> of the following data set:</p>' +
      '<p style="font-size:1.2em;font-weight:bold;text-align:center;margin:16px 0;">' +
      '{{m+8}},&nbsp; {{m}},&nbsp; {{m+3}},&nbsp; {{m}},&nbsp; {{m+6}}</p>',
    parameters: {
      m: { type: 'integer', min: 2, max: 9 },
    },
    answer_template: '{{m}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student finds the median (middle value of sorted list: m, m, m+3, m+6, m+8)
        answer_template: '{{m+3}}',
        response:
          "That's the median, not the mode. The <strong>mode</strong> is the value that appears most often. " +
          "In this list, <strong>{{m}}</strong> appears twice — more than any other value.",
      },
      {
        // Student finds the mean = (5m + 17)/5
        answer_template: '{{round((5*m+17)/5, 1)}}',
        response:
          "That's the mean (average), not the mode. The <strong>mode</strong> is the value that appears most often. " +
          "Look for repeats: <strong>{{m}}</strong> appears twice.",
      },
    ],
    explanation:
      'The mode is the value that appears most often.<br>' +
      'List sorted: {{m}}, {{m}}, {{m+3}}, {{m+6}}, {{m+8}}<br>' +
      '<strong>{{m}}</strong> appears twice — more than any other value — so the mode is <strong>{{m}}</strong>.',
    is_published: true,
  },

  // ── expected_outcomes ────────────────────────────────────────────────────────
  // Bag: p red, (10-p) blue; draw with replacement; n×10 trials.
  // Expected reds = (p/10) × (n×10) = p×n
  {
    skill_ids: ['expected_outcomes'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>A bag contains <strong>{{p}} red</strong> counters and <strong>{{10-p}} blue</strong> counters.</p>' +
      '<p>A counter is chosen at random, its colour is recorded, and it is <strong>replaced</strong>.</p>' +
      '<p>This is repeated <strong>{{n*10}} times</strong> in total.</p>' +
      '<p>How many times would you <strong>expect</strong> to pick a red counter?</p>',
    parameters: {
      p: { type: 'integer', min: 1, max: 4 },
      n: { type: 'integer', min: 1, max: 5 },
    },
    answer_template: '{{p*n}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student uses p directly as probability instead of p/10, so p × (n×10) = p*n*10
        answer_template: '{{p*n*10}}',
        response:
          'The probability of picking red is {{frac(p, 10)}} (not {{p}} itself). ' +
          'Expected outcomes = probability × number of trials = {{frac(p, 10)}} × {{n*10}} = <strong>{{p*n}}</strong>.',
      },
      {
        // Student writes the total number of trials
        answer_template: '{{n*10}}',
        response:
          "That's the total number of trials, not the expected number of red outcomes. " +
          'Expected outcomes = P(red) × trials = {{frac(p, 10)}} × {{n*10}} = <strong>{{p*n}}</strong>.',
      },
    ],
    explanation:
      'P(red) = {{frac(p, 10)}}<br>' +
      'Expected outcomes = P(red) × number of trials<br>' +
      '= {{frac(p, 10)}} × {{n*10}} = <strong>{{p*n}}</strong>',
    is_published: true,
  },

  // ── combined_events ──────────────────────────────────────────────────────────
  // Two independent spinners: a sections and b sections.
  // P(1 on both) = 1/a × 1/b = 1/(a×b)
  {
    skill_ids: ['combined_events'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>A fair spinner has <strong>{{a}} equal sections</strong> numbered 1 to {{a}}.</p>' +
      '<p>A second fair spinner has <strong>{{b}} equal sections</strong> numbered 1 to {{b}}.</p>' +
      '<p>Both spinners are spun once.</p>' +
      '<p>Find the probability of getting a <strong>1 on both spinners</strong>. Give your answer as a fraction.</p>',
    parameters: {
      a: { type: 'integer', min: 4, max: 8 },
      b: {
        type: 'integer', min: 3, max: 6,
        constraint: { type: 'neq', target: 'a', target_type: 'parameter' },
      },
    },
    answer_template: '1/{{a*b}}',
    answer_type: 'fraction',
    tolerance: null,
    traps: [
      {
        // Student adds probabilities instead of multiplying: 1/a + 1/b = (a+b)/(a*b)
        answer_template: '{{a+b}}/{{a*b}}',
        response:
          'For independent events, <strong>multiply</strong> the probabilities — do not add them. ' +
          'P(1 on first) = {{frac(1, a)}}, P(1 on second) = {{frac(1, b)}}. ' +
          'P(1 on both) = {{frac(1, a)}} × {{frac(1, b)}} = {{frac(1, a*b)}}.',
      },
      {
        // Student only considers the first spinner
        answer_template: '1/{{a}}',
        response:
          'You need to account for both spinners. ' +
          'P(1 on first) = {{frac(1, a)}} and P(1 on second) = {{frac(1, b)}}. ' +
          'Combined: {{frac(1, a)}} × {{frac(1, b)}} = {{frac(1, a*b)}}.',
      },
      {
        // Student only considers the second spinner
        answer_template: '1/{{b}}',
        response:
          'You need to account for both spinners. ' +
          'P(1 on first) = {{frac(1, a)}} and P(1 on second) = {{frac(1, b)}}. ' +
          'Combined: {{frac(1, a)}} × {{frac(1, b)}} = {{frac(1, a*b)}}.',
      },
    ],
    explanation:
      'The two spinners are independent, so multiply their probabilities:<br>' +
      'P(1 on first spinner) = {{frac(1, a)}}<br>' +
      'P(1 on second spinner) = {{frac(1, b)}}<br>' +
      'P(1 on both) = {{frac(1, a)}} × {{frac(1, b)}} = {{frac(1, a*b)}}',
    is_published: true,
  },

  // ── venn_diagrams ────────────────────────────────────────────────────────────
  // Layout: a = football only, b = tennis only, c = both, d = neither
  // Total = a+b+c+d; football = a+c; tennis = b+c
  // Answer = d (neither)
  {
    skill_ids: ['venn_diagrams'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>In a survey of <strong>{{a+b+c+d}} students</strong>:</p>' +
      '<ul style="margin:8px 0;padding-left:24px;">' +
      '<li><strong>{{a+c}}</strong> play football</li>' +
      '<li><strong>{{b+c}}</strong> play tennis</li>' +
      '<li><strong>{{c}}</strong> play both football and tennis</li>' +
      '</ul>' +
      '<p>How many students play <strong>neither</strong> football nor tennis?</p>',
    parameters: {
      a: { type: 'integer', min: 4, max: 9 },
      b: { type: 'integer', min: 3, max: 8 },
      c: { type: 'integer', min: 2, max: 5 },
      d: {
        type: 'integer', min: 3, max: 8,
        constraint: { type: 'gt', target: 'c', target_type: 'parameter' },
      },
    },
    answer_template: '{{d}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student gives the "both" count, confusing it with "neither"
        answer_template: '{{c}}',
        response:
          '{{c}} is the number who play <strong>both</strong> sports, not neither. ' +
          'Use: neither = total − football only − both − tennis only = ' +
          '{{a+b+c+d}} − {{a}} − {{b}} − {{c}} = <strong>{{d}}</strong>.',
      },
      {
        // Student sums everyone who plays at least one sport
        answer_template: '{{a+b+c}}',
        response:
          "That's how many play at least one sport. The question asks for <strong>neither</strong>. " +
          'Neither = total − (at least one) = {{a+b+c+d}} − {{a+b+c}} = <strong>{{d}}</strong>.',
      },
      {
        // Student subtracts both sport groups without adding back the intersection:
        // Total − football − tennis = (a+b+c+d) − (a+c) − (b+c) = d − c
        answer_template: '{{d-c}}',
        response:
          'When subtracting both sport groups, you double-subtract students who play both. ' +
          'Add back the overlap: {{a+b+c+d}} − {{a+c}} − {{b+c}} + {{c}} = {{a+b+c+d}} − {{a+b+c}} = <strong>{{d}}</strong>.',
      },
    ],
    explanation:
      'Football only = {{a+c}} − {{c}} = {{a}}<br>' +
      'Tennis only = {{b+c}} − {{c}} = {{b}}<br>' +
      'Students accounted for: football only + both + tennis only = {{a}} + {{c}} + {{b}} = {{a+b+c}}<br>' +
      'Neither = {{a+b+c+d}} − {{a+b+c}} = <strong>{{d}}</strong>',
    is_published: true,
  },

  // ── conditional_probability ──────────────────────────────────────────────────
  // Bag: r red, b blue. Draw 2 without replacement.
  // P(both red) = r/(r+b) × (r−1)/(r+b−1) = r(r−1) / [(r+b)(r+b−1)]
  {
    skill_ids: ['conditional_probability'],
    difficulty: 4,
    question_type: 'numeric',
    question_template:
      '<p>A bag contains <strong>{{r}} red</strong> balls and <strong>{{b}} blue</strong> balls.</p>' +
      '<p>Two balls are drawn at random <strong>without replacement</strong>.</p>' +
      '<p>Find the probability that <strong>both balls are red</strong>. Give your answer as a fraction.</p>',
    parameters: {
      r: { type: 'integer', min: 2, max: 5 },
      b: {
        type: 'integer', min: 3, max: 7,
        constraint: { type: 'neq', target: 'r', target_type: 'parameter' },
      },
    },
    answer_template: '{{fracStr(r*(r-1),(r+b)*(r+b-1))}}',
    answer_type: 'fraction',
    tolerance: null,
    traps: [
      {
        // Student treats it as with-replacement: (r/(r+b))²
        answer_template: '{{fracStr(r*r,(r+b)*(r+b))}}',
        response:
          'This assumes the balls are replaced between draws — but they are not. ' +
          'After drawing one red ball, there are {{r-1}} red balls left out of {{r+b-1}} total. ' +
          'P(both red) = {{frac(r, r+b)}} × {{frac(r-1, r+b-1)}} = {{fracStr(r*(r-1),(r+b)*(r+b-1))}}.',
      },
      {
        // Student calculates only P(first ball red)
        answer_template: '{{fracStr(r,r+b)}}',
        response:
          "That's the probability the first ball is red. For <em>both</em> to be red, also multiply by " +
          'the probability the second is red (given the first was): ' +
          '{{frac(r, r+b)}} × {{frac(r-1, r+b-1)}} = {{fracStr(r*(r-1),(r+b)*(r+b-1))}}.',
      },
    ],
    explanation:
      'P(1st ball red) = {{frac(r, r+b)}}<br>' +
      'After removing one red ball: {{r-1}} red balls remain out of {{r+b-1}} total.<br>' +
      'P(2nd ball red | 1st was red) = {{frac(r-1, r+b-1)}}<br>' +
      'P(both red) = {{frac(r, r+b)}} × {{frac(r-1, r+b-1)}} = {{frac(r*(r-1), (r+b)*(r+b-1))}}',
    is_published: true,
  },

  // ── interquartile_range ──────────────────────────────────────────────────────
  // Given Q1 and Q3; find IQR = Q3 − Q1
  {
    skill_ids: ['interquartile_range'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>A data set has:</p>' +
      '<ul style="margin:8px 0;padding-left:24px;">' +
      '<li>Lower quartile (Q1) = <strong>{{q1}}</strong></li>' +
      '<li>Upper quartile (Q3) = <strong>{{q3}}</strong></li>' +
      '</ul>' +
      '<p>Calculate the <strong>interquartile range (IQR)</strong>.</p>',
    parameters: {
      q1: { type: 'integer', min: 5, max: 25 },
      q3: {
        type: 'integer', min: 10, max: 50,
        constraint: { type: 'gt', target: 'q1', target_type: 'parameter' },
      },
    },
    answer_template: '{{q3-q1}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student adds Q1 and Q3 instead of subtracting
        answer_template: '{{q1+q3}}',
        response:
          'The IQR is Q3 <strong>minus</strong> Q1, not Q1 plus Q3. ' +
          'IQR = {{q3}} − {{q1}} = <strong>{{q3-q1}}</strong>.',
      },
      {
        // Student finds the midpoint of Q1 and Q3
        answer_template: '{{(q1+q3)/2}}',
        response:
          "That's the midpoint between Q1 and Q3. The IQR is the <strong>difference</strong>: " +
          'IQR = Q3 − Q1 = {{q3}} − {{q1}} = <strong>{{q3-q1}}</strong>.',
      },
    ],
    explanation:
      'Interquartile Range (IQR) = Q3 − Q1<br>' +
      '= {{q3}} − {{q1}}<br>' +
      '= <strong>{{q3-q1}}</strong>',
    is_published: true,
  },

  // ── cumulative_frequency ─────────────────────────────────────────────────────
  // Table: ≤ x1 → cf1; ≤ x1+10 → cf1+f2
  // Frequency between x1 and x1+10 = (cf1+f2) − cf1 = f2
  {
    skill_ids: ['cumulative_frequency'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>The cumulative frequency table shows the time taken by students to complete a puzzle.</p>' +
      '<table style="border-collapse:collapse;margin:16px auto;">' +
      '<thead><tr>' +
      '<th style="border:1px solid #d1d5db;padding:8px 16px;background:#f3f4f6;text-align:center;">Time (minutes)</th>' +
      '<th style="border:1px solid #d1d5db;padding:8px 16px;background:#f3f4f6;text-align:center;">Cumulative Frequency</th>' +
      '</tr></thead>' +
      '<tbody>' +
      '<tr>' +
      '<td style="border:1px solid #d1d5db;padding:8px 16px;text-align:center;">≤ {{x1}}</td>' +
      '<td style="border:1px solid #d1d5db;padding:8px 16px;text-align:center;">{{cf1}}</td>' +
      '</tr>' +
      '<tr>' +
      '<td style="border:1px solid #d1d5db;padding:8px 16px;text-align:center;">≤ {{x1+10}}</td>' +
      '<td style="border:1px solid #d1d5db;padding:8px 16px;text-align:center;">{{cf1+f2}}</td>' +
      '</tr>' +
      '</tbody></table>' +
      '<p>How many students took between <strong>{{x1}} and {{x1+10}} minutes</strong>?</p>',
    parameters: {
      cf1: { type: 'integer', min: 5, max: 25 },
      f2:  { type: 'integer', min: 3, max: 15 },
      x1:  { type: 'integer', min: 20, max: 50, constraint: { type: 'multiple_of', target: 10 } },
    },
    answer_template: '{{f2}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        // Student reads the upper cumulative frequency directly
        answer_template: '{{cf1+f2}}',
        response:
          '{{cf1+f2}} is the cumulative frequency <em>up to {{x1+10}} minutes</em> — it includes everyone ' +
          'who finished in {{x1}} minutes or less as well. ' +
          'Subtract the lower row: {{cf1+f2}} − {{cf1}} = <strong>{{f2}}</strong>.',
      },
      {
        // Student reads the lower cumulative frequency directly
        answer_template: '{{cf1}}',
        response:
          '{{cf1}} is the cumulative frequency <em>up to {{x1}} minutes</em>. ' +
          'To find those between {{x1}} and {{x1+10}}: upper CF − lower CF = {{cf1+f2}} − {{cf1}} = <strong>{{f2}}</strong>.',
      },
    ],
    explanation:
      'Cumulative frequency up to {{x1}} min = {{cf1}}<br>' +
      'Cumulative frequency up to {{x1+10}} min = {{cf1+f2}}<br>' +
      'Students who took between {{x1}} and {{x1+10}} min = {{cf1+f2}} − {{cf1}} = <strong>{{f2}}</strong>',
    is_published: true,
  },

]

async function main() {
  console.log(`Inserting ${questions.length} Probability & Data questions...`)
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
