import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── 1. MEASURING LINES AND ANGLES ────────────────────────────────────────────
// Straight line with two rays from a single point, creating three labelled angles.
// All three angle-indicator arcs share r=28, centred at the origin point (150,128).
// Verified: each endpoint lies on that circle to within rounding tolerance.
// All arcs sweep clockwise (sweep=1) through their respective angle regions.
//
// Origin: (150,128)
// Left ray to (88,45):   unit ≈ (−0.599, −0.801), pt at r=28 ≈ (133,106)
// Right ray to (222,48): unit ≈ ( 0.669, −0.743), pt at r=28 ≈ (169,107)
// Left horiz at r=28: (122,128)   Right horiz at r=28: (178,128)

const measuringLinesSVG = `
<svg viewBox="0 0 300 158" width="280" height="147"
     style="display:block;margin:14px auto"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Straight line -->
  <line x1="20" y1="128" x2="280" y2="128"
        stroke="#64748B" stroke-width="2.5"/>

  <!-- Left ray -->
  <line x1="150" y1="128" x2="88" y2="45"
        stroke="#334155" stroke-width="2"/>
  <!-- Right ray -->
  <line x1="150" y1="128" x2="222" y2="48"
        stroke="#334155" stroke-width="2"/>

  <!-- Central point -->
  <circle cx="150" cy="128" r="3.5" fill="#334155"/>

  <!-- Angle arcs (all r=28, centred at origin, sweep CW) -->
  <!-- arc a: left horizontal → left ray -->
  <path d="M 122 128 A 28 28 0 0 1 133 106"
        fill="none" stroke="#64748B" stroke-width="1.4"/>
  <!-- arc b: left ray → right ray -->
  <path d="M 133 106 A 28 28 0 0 1 169 107"
        fill="none" stroke="#64748B" stroke-width="1.4"/>
  <!-- arc x: right ray → right horizontal -->
  <path d="M 169 107 A 28 28 0 0 1 178 128"
        fill="none" stroke="#4F46E5" stroke-width="1.4"/>

  <!-- Angle labels -->
  <text x="103" y="114" text-anchor="middle"
        font-family="sans-serif" font-size="14" fill="#1E293B">{{a}}°</text>
  <text x="150" y="81" text-anchor="middle"
        font-family="sans-serif" font-size="14" fill="#1E293B">{{b}}°</text>
  <text x="208" y="111" text-anchor="middle"
        font-family="sans-serif" font-size="15" font-weight="bold"
        fill="#4F46E5">x</text>
</svg>`

// ─── 2. AREAS OF TRIANGLES ────────────────────────────────────────────────────
// Isoceles triangle with the perpendicular height shown as a dashed vertical line.
// The right-angle marker confirms the height is perpendicular to the base.
// Parameters {{b}} and {{h}} appear as labels on the base and the height line.

const areasOfTrianglesSVG = `
<svg viewBox="0 0 300 198" width="280" height="185"
     style="display:block;margin:14px auto"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Triangle fill -->
  <polygon points="45,162 255,162 150,38"
           fill="#EEF2FF" stroke="#4F46E5" stroke-width="2"
           stroke-linejoin="round"/>

  <!-- Perpendicular height (dashed) — foot at (150,162), apex at (150,38) -->
  <line x1="150" y1="38" x2="150" y2="162"
        stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="5,4"/>

  <!-- Right-angle marker at foot of height (150,162) -->
  <!-- Goes: left along base → up → right back to height line -->
  <path d="M 132 162 L 132 144 L 150 144"
        fill="none" stroke="#64748B" stroke-width="1.5"/>

  <!-- Base label -->
  <text x="150" y="184" text-anchor="middle"
        font-family="sans-serif" font-size="14" fill="#1E293B">{{b}} cm</text>

  <!-- Height label (to the right of the dashed line) -->
  <text x="164" y="104" text-anchor="start"
        font-family="sans-serif" font-size="14" fill="#1E293B">{{h}} cm</text>
</svg>`

// ─── 3. AREA OF A CIRCLE ──────────────────────────────────────────────────────
// Circle with a labelled radius line (dashed) from centre to circumference.
// The centre dot and label "r = {{r}} cm" make it unambiguous.

const areaOfACircleSVG = `
<svg viewBox="0 0 300 210" width="280" height="196"
     style="display:block;margin:14px auto"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Circle fill and outline -->
  <circle cx="150" cy="108" r="78"
          fill="#EEF2FF" stroke="#4F46E5" stroke-width="2"/>

  <!-- Centre dot -->
  <circle cx="150" cy="108" r="3.5" fill="#4F46E5"/>

  <!-- Radius line (dashed) from centre to right edge -->
  <line x1="150" y1="108" x2="228" y2="108"
        stroke="#4F46E5" stroke-width="1.8" stroke-dasharray="5,3"/>

  <!-- Radius label, sitting above the line -->
  <text x="189" y="100" text-anchor="middle"
        font-family="sans-serif" font-size="14" fill="#1E293B">{{r}} cm</text>
</svg>`

// ─── 4. CIRCLE THEOREM: ANGLE AT CENTRE ──────────────────────────────────────
// Circle with centre O. A and B are two points on the circle (the ends of the arc).
// P is a third point on the circumference on the major arc.
// Lines PA, PB show the inscribed angle {{a}}°.
// Lines OA, OB show the central angle "?" (the answer).
//
// Circle centre O at (150,118), radius 80.
// A at 200° from O ≈ (75,91).  B at 340° from O ≈ (225,91).  P at 270° = (150,38).
//
// Angle arc at P (r=18 from P, opening downward toward A and B): sweep=1 (CW)
//   pts on PA and PB at r=18: ≈ (135,48) and (165,48)
// Angle arc at O (r=20 from O, opening upward toward A and B): sweep=0 (CCW)
//   pts on OA and OB at r=20: ≈ (131,111) and (169,111)

const circleTheoremSVG = `
<svg viewBox="0 0 300 215" width="280" height="201"
     style="display:block;margin:14px auto"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Circle -->
  <circle cx="150" cy="118" r="80"
          fill="#EEF2FF" stroke="#CBD5E1" stroke-width="1.5"/>

  <!-- Chord AB (dashed) -->
  <line x1="75" y1="91" x2="225" y2="91"
        stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4,3"/>

  <!-- Lines from P (circumference) to A and B -->
  <line x1="150" y1="38" x2="75"  y2="91" stroke="#4F46E5" stroke-width="2"/>
  <line x1="150" y1="38" x2="225" y2="91" stroke="#4F46E5" stroke-width="2"/>

  <!-- Lines from O (centre) to A and B -->
  <line x1="150" y1="118" x2="75"  y2="91" stroke="#334155" stroke-width="2"/>
  <line x1="150" y1="118" x2="225" y2="91" stroke="#334155" stroke-width="2"/>

  <!-- Angle arc at P (opens downward, sweep CW) -->
  <path d="M 135 48 A 18 18 0 0 1 165 48"
        fill="none" stroke="#4F46E5" stroke-width="1.5"/>

  <!-- Angle arc at O (opens upward, sweep CCW) -->
  <path d="M 131 111 A 20 20 0 0 0 169 111"
        fill="none" stroke="#334155" stroke-width="1.5"/>

  <!-- Point markers -->
  <circle cx="150" cy="38"  r="3" fill="#4F46E5"/>
  <circle cx="75"  cy="91"  r="3" fill="#334155"/>
  <circle cx="225" cy="91"  r="3" fill="#334155"/>
  <circle cx="150" cy="118" r="3" fill="#334155"/>

  <!-- Point labels -->
  <text x="150" y="30"  text-anchor="middle"
        font-family="sans-serif" font-size="13" font-weight="bold" fill="#4F46E5">P</text>
  <text x="61"  y="93"  text-anchor="middle"
        font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">A</text>
  <text x="239" y="93"  text-anchor="middle"
        font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">B</text>
  <text x="157" y="130" text-anchor="start"
        font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">O</text>

  <!-- Angle at circumference (known) -->
  <text x="150" y="67" text-anchor="middle"
        font-family="sans-serif" font-size="13" fill="#4F46E5">{{a}}°</text>

  <!-- Angle at centre (unknown) -->
  <text x="150" y="105" text-anchor="middle"
        font-family="sans-serif" font-size="15" font-weight="bold" fill="#4F46E5">?</text>
</svg>`

// ─── Updates ─────────────────────────────────────────────────────────────────

const updates = [
  {
    id: '27b7a061-047d-49f8-b174-220d8bf83b03',
    skill: 'measuring_lines_and_angles',
    question_template:
      '<p>Find the value of <em>x</em>.</p>' + measuringLinesSVG,
  },
  {
    id: '8d72f31a-8615-4c04-ac5f-6a1679d399fd',
    skill: 'areas_of_triangles',
    question_template:
      '<p>Find the area of the triangle.</p>' + areasOfTrianglesSVG,
  },
  {
    id: '73af9feb-7a76-4526-906a-bd7ba5bfec01',
    skill: 'area_of_a_circle',
    question_template:
      '<p>Find the area of the circle. Give your answer to 2 decimal places.</p>' +
      areaOfACircleSVG,
  },
  {
    id: 'ab2375ae-05e0-4e8e-8601-47152dd02a75',
    skill: 'circle_theorem_angle_at_centre',
    question_template:
      '<p>The diagram shows a circle with centre O. Angle APB = <strong>{{a}}°</strong>.</p>' +
      '<p>Find angle AOB.</p>' +
      circleTheoremSVG,
  },
]

async function main() {
  for (const u of updates) {
    const { error } = await supabase
      .from('questions')
      .update({ question_template: u.question_template })
      .eq('id', u.id)

    if (error) {
      console.error(`❌ ${u.skill}: ${error.message}`)
    } else {
      console.log(`✅ ${u.skill}`)
    }
  }
}

main()
