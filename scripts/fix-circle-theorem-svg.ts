import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Corrected circle-theorem diagram ──────────────────────────────────────────
//
// Circle: centre O(150,115), radius 85.
//
// Previous error: P was at the top (270° screen = top), but A(200°) and B(340°)
// straddle 270°, so the minor arc ran through P — the angle markers appeared on
// the wrong sides because geometrically they WERE on the wrong arc.
//
// Fix: put A and B in the UPPER half of the circle so the MINOR arc is at the
// top, and put P at the BOTTOM on the MAJOR arc (as the theorem requires).
//
//   A at 150° standard (upper-left):
//     x = 150 + 85·cos(150°) ≈  76,  y = 115 − 85·sin(150°) ≈  73
//   B at  30° standard (upper-right):
//     x = 150 + 85·cos( 30°) ≈ 224,  y = 115 − 85·sin( 30°) ≈  73
//   P at 270° standard (bottom):
//     x = 150,  y = 115 + 85 = 200
//   O = (150, 115)
//
// Angle indicators use quadratic bezier curves (Q command) rather than SVG arc
// paths — far easier to control curvature for small angles.
//
//   Arc at P (angle APB, opens upward toward A and B):
//     endpoints at r=20 on PA and PB: (140, 183) and (160, 183)
//     control point on bisector above endpoints: (150, 158)
//     → M 140 183 Q 150 158 160 183
//
//   Arc at O (angle AOB, opens upward toward A and B):
//     endpoints at r=22 on OA and OB: (131, 104) and (169, 104)
//     control point on bisector above endpoints: (150, 79)
//     → M 131 104 Q 150 79 169 104

const svg = `
<svg viewBox="0 0 300 228" width="280" height="213"
     style="display:block;margin:14px auto"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Circle -->
  <circle cx="150" cy="115" r="85"
          fill="#EEF2FF" stroke="#CBD5E1" stroke-width="1.5"/>

  <!-- Chord AB (dashed) -->
  <line x1="76" y1="73" x2="224" y2="73"
        stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4,3"/>

  <!-- Lines from P (bottom, circumference) to A and B — inscribed angle -->
  <line x1="150" y1="200" x2="76"  y2="73" stroke="#4F46E5" stroke-width="2"/>
  <line x1="150" y1="200" x2="224" y2="73" stroke="#4F46E5" stroke-width="2"/>

  <!-- Lines from O (centre) to A and B — central angle -->
  <line x1="150" y1="115" x2="76"  y2="73" stroke="#334155" stroke-width="2"/>
  <line x1="150" y1="115" x2="224" y2="73" stroke="#334155" stroke-width="2"/>

  <!-- Angle arc at P — quadratic bezier opening upward into angle APB -->
  <path d="M 140 183 Q 150 158 160 183"
        fill="none" stroke="#4F46E5" stroke-width="1.5"/>

  <!-- Angle arc at O — quadratic bezier opening upward into angle AOB -->
  <path d="M 131 104 Q 150 79 169 104"
        fill="none" stroke="#334155" stroke-width="1.5"/>

  <!-- Point markers -->
  <circle cx="150" cy="200" r="3" fill="#4F46E5"/>
  <circle cx="76"  cy="73"  r="3" fill="#334155"/>
  <circle cx="224" cy="73"  r="3" fill="#334155"/>
  <circle cx="150" cy="115" r="3" fill="#334155"/>

  <!-- Point labels -->
  <text x="150" y="218" text-anchor="middle"
        font-family="sans-serif" font-size="13" font-weight="bold" fill="#4F46E5">P</text>
  <text x="62"  y="76"  text-anchor="middle"
        font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">A</text>
  <text x="238" y="76"  text-anchor="middle"
        font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">B</text>
  <text x="158" y="124" text-anchor="start"
        font-family="sans-serif" font-size="13" font-weight="bold" fill="#334155">O</text>

  <!-- Known angle at P (circumference) -->
  <text x="150" y="165" text-anchor="middle"
        font-family="sans-serif" font-size="13" fill="#4F46E5">{{a}}°</text>

  <!-- Unknown angle at O (centre) -->
  <text x="150" y="84" text-anchor="middle"
        font-family="sans-serif" font-size="15" font-weight="bold" fill="#4F46E5">?</text>
</svg>`

async function main() {
  const { error } = await supabase
    .from('questions')
    .update({
      question_template:
        '<p>The diagram shows a circle with centre O. Angle APB = <strong>{{a}}°</strong>.</p>' +
        '<p>Find angle AOB.</p>' +
        svg,
    })
    .eq('id', 'ab2375ae-05e0-4e8e-8601-47152dd02a75')

  console.log(error ? `❌ ${error.message}` : '✅ circle_theorem_angle_at_centre updated')
}

main()
