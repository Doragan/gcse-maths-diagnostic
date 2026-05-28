import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// The SVG is an inline right-angled triangle.
// Vertices: right-angle at bottom-left (75,170), base end at (235,170), apex at (75,40).
// Template variables {{3*k}} and {{4*k}} are rendered inside SVG <text> elements —
// evaluateTemplate() replaces every {{...}} block in the whole string, including SVG.

const svgDiagram = `
<svg viewBox="0 0 290 215" width="270" height="200"
     style="display:block;margin:14px auto"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Triangle body -->
  <polygon
    points="75,170 235,170 75,40"
    fill="#EEF2FF"
    stroke="#4F46E5"
    stroke-width="2"
    stroke-linejoin="round"/>

  <!-- Right-angle marker (small square at bottom-left corner) -->
  <path d="M 75 156 L 89 156 L 89 170"
        fill="none" stroke="#4F46E5" stroke-width="1.5"/>

  <!-- Vertical leg label — centred to the left of the line -->
  <text x="50" y="112"
        text-anchor="middle"
        font-family="sans-serif" font-size="13" fill="#1E293B">{{3*k}} cm</text>

  <!-- Horizontal leg label — centred below the line -->
  <text x="155" y="193"
        text-anchor="middle"
        font-family="sans-serif" font-size="13" fill="#1E293B">{{4*k}} cm</text>

  <!-- Hypotenuse unknown label -->
  <text x="175" y="98"
        text-anchor="start"
        font-family="sans-serif" font-size="15" font-weight="bold" fill="#4F46E5">?</text>
</svg>`

const question = {
  skill_ids: ['pythagoras_theorem'],
  difficulty: 3,
  question_type: 'numeric',
  question_template:
    '<p>Find the length of the side marked <strong>?</strong>. Give your answer in cm.</p>' +
    svgDiagram,
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
        'You added the two sides instead of using Pythagoras. ' +
        'Hypotenuse² = {{3*k}}² + {{4*k}}² = {{9*k*k}} + {{16*k*k}} = {{25*k*k}}, ' +
        'so hypotenuse = √{{25*k*k}} = {{5*k}} cm.',
    },
    {
      answer_template: '{{25 * k * k}}',
      response:
        "You found hypotenuse² = {{25*k*k}} correctly but forgot to take the square root. " +
        "Hypotenuse = √{{25*k*k}} = {{5*k}} cm.",
    },
  ],
  explanation:
    "Pythagoras' theorem: hypotenuse² = a² + b²<br>" +
    '= {{3*k}}² + {{4*k}}²<br>' +
    '= {{9*k*k}} + {{16*k*k}}<br>' +
    '= {{25*k*k}}<br>' +
    'Hypotenuse = √{{25*k*k}} = {{5*k}} cm',
  is_published: false, // draft
}

async function main() {
  const { data, error } = await supabase.from('questions').insert(question).select('id, skill_ids')
  if (error) { console.error('Insert failed:', error.message); process.exit(1) }
  console.log('Inserted:', data?.[0]?.id, '→', data?.[0]?.skill_ids.join(', '))
}

main()
