import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Math.sin/cos/tan/asin/atan/PI are available inside {{}} because they are
// globals accessible to new Function() without needing to be injected.

const questions = [

  // ── ANGLE SKILLS ────────────────────────────────────────────────────────────

  {
    skill_ids: ['angles_on_lines_and_circles'],
    difficulty: 1,
    question_type: 'numeric',
    question_template:
      '<p>Angles around a point sum to 360°.</p>' +
      '<p>Three angles at a point measure <strong>{{a}}°</strong>, <strong>{{b}}°</strong> and <em>x</em>.</p>' +
      '<p>Find <em>x</em>.</p>',
    parameters: {
      a: { type: 'integer', min: 40, max: 120 },
      b: { type: 'integer', min: 40, max: 120 },
      // Ensure a + b < 320 so x > 40 — enforced by the ranges (max 240 < 320)
    },
    answer_template: '{{360 - a - b}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{180 - a - b}}',
        response:
          'Angles around a <strong>point</strong> sum to 360°, not 180°. ' +
          'x = 360° − {{a}}° − {{b}}° = {{360 - a - b}}°.',
      },
      {
        answer_template: '{{180 - a}}',
        response:
          'You need to subtract <em>both</em> known angles: ' +
          'x = 360° − {{a}}° − {{b}}° = {{360 - a - b}}°.',
      },
    ],
    explanation:
      'Angles around a point sum to 360°.<br>' +
      'x = 360° − {{a}}° − {{b}}° = {{360 - a - b}}°',
    is_published: false,
  },

  {
    skill_ids: ['alternate_and_corresponding_angles'],
    difficulty: 1,
    question_type: 'numeric',
    question_template:
      '<p>Two parallel lines are cut by a transversal.</p>' +
      '<p>An angle on the first parallel line measures <strong>{{a}}°</strong>.</p>' +
      '<p>Find the <strong>corresponding</strong> angle on the second parallel line.</p>',
    parameters: {
      a: { type: 'integer', min: 25, max: 155 },
    },
    answer_template: '{{a}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{180 - a}}',
        response:
          'Co-interior (same-side) angles sum to 180° — but <strong>corresponding</strong> angles ' +
          '(in matching positions on each parallel line) are <em>equal</em>. Answer: {{a}}°.',
      },
      {
        answer_template: '{{360 - a}}',
        response:
          'Corresponding angles are equal when lines are parallel. The answer is simply {{a}}°.',
      },
    ],
    explanation:
      'Corresponding angles are equal when formed by a transversal crossing parallel lines.<br>' +
      'Corresponding angle = {{a}}°.',
    is_published: false,
  },

  {
    skill_ids: ['angles_in_polygons'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Find the <strong>sum of interior angles</strong> of a <strong>{{n}}-sided polygon</strong>.</p>',
    parameters: {
      n: { type: 'integer', min: 5, max: 10 },
    },
    answer_template: '{{(n - 2) * 180}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{n * 180}}',
        response:
          'The formula is <strong>(n − 2) × 180°</strong>, not n × 180°. ' +
          'For {{n}} sides: ({{n}} − 2) × 180° = {{n - 2}} × 180° = {{(n - 2) * 180}}°.',
      },
      {
        answer_template: '{{n * 90}}',
        response:
          'Use (n − 2) × 180°. For a {{n}}-sided polygon: ({{n}} − 2) × 180° = {{(n - 2) * 180}}°.',
      },
    ],
    explanation:
      'Sum of interior angles of an n-sided polygon = (n − 2) × 180°<br>' +
      '= ({{n}} − 2) × 180°<br>' +
      '= {{n - 2}} × 180°<br>' +
      '= {{(n - 2) * 180}}°',
    is_published: false,
  },

  {
    skill_ids: ['exterior_angles'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>A <strong>regular polygon</strong> has <strong>{{n}} sides</strong>.</p>' +
      '<p>Find the size of each exterior angle.</p>',
    parameters: {
      // n divides 360 so exterior angle is a whole number
      // Divisors of 360 in range 3–12: 3,4,5,6,8,9,10,12
      n: { type: 'integer', min: 3, max: 12, constraint: { type: 'factor_of', target: 360 } },
    },
    answer_template: '{{360 / n}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{(n - 2) * 180 / n}}',
        response:
          "That's the <strong>interior</strong> angle. Each <em>exterior</em> angle of a regular polygon = 360° ÷ n = 360° ÷ {{n}} = {{360 / n}}°.",
      },
      {
        answer_template: '{{180 - 360 / n}}',
        response:
          'Exterior angle = 360° ÷ number of sides = 360° ÷ {{n}} = {{360 / n}}°.',
      },
    ],
    explanation:
      'Exterior angle of a regular polygon = 360° ÷ n<br>' +
      '= 360° ÷ {{n}}<br>' +
      '= {{360 / n}}°',
    is_published: false,
  },

  // ── SIMILARITY ────────────────────────────────────────────────────────────

  {
    skill_ids: ['congruence_and_similarity'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Two similar shapes have lengths in the ratio <strong>1 : {{k}}</strong>.</p>' +
      '<p>The smaller shape has area <strong>{{A}} cm²</strong>.</p>' +
      '<p>Find the area of the larger shape.</p>',
    parameters: {
      k: { type: 'integer', min: 2, max: 5 },
      A: { type: 'integer', min: 4, max: 20 },
    },
    answer_template: '{{A * k * k}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{A * k}}',
        response:
          'You multiplied by the <strong>length</strong> ratio, but area scales by the square of the length ratio. ' +
          'Length ratio 1 : {{k}} → area ratio 1 : {{k}}² = 1 : {{k * k}}. ' +
          'Larger area = {{A}} × {{k * k}} = {{A * k * k}} cm².',
      },
      {
        answer_template: '{{A + k}}',
        response:
          'Area ratio = (length ratio)² = {{k}}² = {{k * k}}. ' +
          'Larger area = {{A}} × {{k * k}} = {{A * k * k}} cm².',
      },
    ],
    explanation:
      'When lengths are in ratio 1 : {{k}}, areas are in ratio 1² : {{k}}² = 1 : {{k * k}}.<br>' +
      'Larger area = {{A}} × {{k * k}} = {{A * k * k}} cm²',
    is_published: false,
  },

  // ── 2D AREAS ─────────────────────────────────────────────────────────────

  {
    skill_ids: ['areas_of_squares_and_rectangles'],
    difficulty: 1,
    question_type: 'numeric',
    question_template:
      '<p>Find the area of a rectangle with length <strong>{{l}} cm</strong> and width <strong>{{w}} cm</strong>.</p>',
    parameters: {
      l: { type: 'integer', min: 5, max: 20 },
      w: { type: 'integer', min: 3, max: 12 },
    },
    answer_template: '{{l * w}} cm²',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{2 * (l + w)}}',
        response:
          "That's the <strong>perimeter</strong>. Area = length × width = {{l}} × {{w}} = {{l * w}} cm².",
      },
      {
        answer_template: '{{l + w}}',
        response:
          'Area = length × width = {{l}} × {{w}} = {{l * w}} cm². (Adding gives the semi-perimeter, not the area.)',
      },
    ],
    explanation:
      'Area of a rectangle = length × width<br>= {{l}} × {{w}}<br>= {{l * w}} cm²',
    is_published: false,
  },

  {
    skill_ids: ['area_of_parallelograms'],
    difficulty: 1,
    question_type: 'numeric',
    question_template:
      '<p>Find the area of a parallelogram with base <strong>{{b}} cm</strong> and ' +
      'perpendicular height <strong>{{h}} cm</strong>.</p>',
    parameters: {
      b: { type: 'integer', min: 6, max: 18 },
      h: { type: 'integer', min: 4, max: 12 },
    },
    answer_template: '{{b * h}} cm²',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{b * h / 2}}',
        response:
          'Halving applies to <strong>triangles</strong>, not parallelograms. ' +
          'Area of a parallelogram = base × perpendicular height = {{b}} × {{h}} = {{b * h}} cm².',
      },
      {
        answer_template: '{{2 * (b + h)}}',
        response:
          "That's the perimeter (approximately). Area = base × height = {{b}} × {{h}} = {{b * h}} cm².",
      },
    ],
    explanation:
      'Area of a parallelogram = base × perpendicular height<br>= {{b}} × {{h}}<br>= {{b * h}} cm²',
    is_published: false,
  },

  {
    skill_ids: ['area_of_a_trapezium'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Find the area of a trapezium with parallel sides <strong>{{a}} cm</strong> and ' +
      '<strong>{{b}} cm</strong>, and perpendicular height <strong>{{h}} cm</strong>.</p>',
    parameters: {
      a: { type: 'integer', min: 4, max: 14 },
      b: { type: 'integer', min: 4, max: 14 },
      h: { type: 'integer', min: 3, max: 10 },
    },
    answer_template: '{{(a + b) * h / 2}} cm²',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{(a + b) * h}}',
        response:
          "You forgot to halve. Area of a trapezium = ½(a + b)h = ½ × ({{a}} + {{b}}) × {{h}} = {{(a + b) * h / 2}} cm².",
      },
      {
        answer_template: '{{a * h / 2}}',
        response:
          'Use <strong>both</strong> parallel sides: Area = ½(a + b)h = ½ × ({{a}} + {{b}}) × {{h}} = {{(a + b) * h / 2}} cm².',
      },
    ],
    explanation:
      'Area of a trapezium = ½(a + b)h<br>' +
      '= ½ × ({{a}} + {{b}}) × {{h}}<br>' +
      '= ½ × {{a + b}} × {{h}}<br>' +
      '= {{(a + b) * h / 2}} cm²',
    is_published: false,
  },

  {
    // Note: skill ID has the original typo "circumfrence"
    skill_ids: ['circumfrence_of_a_circle'],
    difficulty: 1,
    question_type: 'numeric',
    question_template:
      '<p>Find the circumference of a circle with radius <strong>{{r}} cm</strong>.</p>' +
      '<p>Give your answer to 2 decimal places.</p>',
    parameters: {
      r: { type: 'integer', min: 2, max: 10 },
    },
    answer_template: '{{round(2 * Math.PI * r, 2)}} cm',
    answer_type: 'numeric',
    tolerance: 0.5,
    traps: [
      {
        answer_template: '{{round(Math.PI * r * r, 2)}}',
        response:
          "That's the <strong>area</strong> formula (πr²). Circumference = 2πr = 2 × π × {{r}} ≈ {{round(2 * Math.PI * r, 2)}} cm.",
      },
      {
        answer_template: '{{round(Math.PI * r, 2)}}',
        response:
          'You used πr, but the formula is <strong>2πr</strong>. Circumference = 2 × π × {{r}} ≈ {{round(2 * Math.PI * r, 2)}} cm.',
      },
      {
        answer_template: '{{round(2 * Math.PI * 2 * r, 2)}}',
        response:
          "You used the diameter formula (πd) with 2r but doubled it again. Circumference = 2πr = 2 × π × {{r}} ≈ {{round(2 * Math.PI * r, 2)}} cm.",
      },
    ],
    explanation:
      'Circumference = 2πr<br>= 2 × π × {{r}}<br>≈ {{round(2 * Math.PI * r, 2)}} cm',
    is_published: false,
  },

  {
    skill_ids: ['sector_calculations'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Find the <strong>area of a sector</strong> with radius <strong>{{r}} cm</strong> ' +
      'and angle <strong>{{theta}}°</strong> at the centre.</p>' +
      '<p>Give your answer to 2 decimal places.</p>',
    parameters: {
      r: { type: 'integer', min: 3, max: 9 },
      // theta is a multiple of 30 so the fraction θ/360 simplifies nicely
      theta: { type: 'integer', min: 30, max: 150, constraint: { type: 'multiple_of', target: 30 } },
    },
    answer_template: '{{round(theta / 360 * Math.PI * r * r, 2)}} cm²',
    answer_type: 'numeric',
    tolerance: 0.5,
    traps: [
      {
        answer_template: '{{round(Math.PI * r * r, 2)}}',
        response:
          "That's the area of the full circle. For a sector, multiply by θ/360: " +
          'Area = ({{theta}}/360) × π × {{r}}² ≈ {{round(theta/360 * Math.PI * r * r, 2)}} cm².',
      },
      {
        answer_template: '{{round(theta / 360 * 2 * Math.PI * r, 2)}}',
        response:
          "That's the arc length. Area of sector = (θ/360) × πr² = ({{theta}}/360) × π × {{r}}² ≈ {{round(theta/360 * Math.PI * r * r, 2)}} cm².",
      },
    ],
    explanation:
      'Area of sector = (θ/360) × πr²<br>' +
      '= ({{theta}}/360) × π × {{r}}²<br>' +
      '≈ {{round(theta/360 * Math.PI * r * r, 2)}} cm²',
    is_published: false,
  },

  // ── 3D VOLUMES & SURFACE AREAS ───────────────────────────────────────────

  {
    skill_ids: ['volume_of_a_prism'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>Find the volume of a cuboid with length <strong>{{l}} cm</strong>, ' +
      'width <strong>{{w}} cm</strong> and height <strong>{{h}} cm</strong>.</p>',
    parameters: {
      l: { type: 'integer', min: 4, max: 15 },
      w: { type: 'integer', min: 3, max: 10 },
      h: { type: 'integer', min: 2, max: 8 },
    },
    answer_template: '{{l * w * h}} cm³',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{2 * (l*w + l*h + w*h)}}',
        response:
          "That's the surface area. Volume of a cuboid = length × width × height = {{l}} × {{w}} × {{h}} = {{l*w*h}} cm³.",
      },
      {
        answer_template: '{{l * w}}',
        response:
          'You only multiplied two dimensions. Volume = length × width × height = {{l}} × {{w}} × {{h}} = {{l*w*h}} cm³.',
      },
    ],
    explanation:
      'Volume of a cuboid = length × width × height<br>= {{l}} × {{w}} × {{h}}<br>= {{l*w*h}} cm³',
    is_published: false,
  },

  {
    skill_ids: ['volume_of_a_pyramid_and_cone'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Find the volume of a cone with radius <strong>{{r}} cm</strong> ' +
      'and perpendicular height <strong>{{h}} cm</strong>.</p>' +
      '<p>Give your answer to 2 decimal places.</p>',
    parameters: {
      r: { type: 'integer', min: 2, max: 7 },
      h: { type: 'integer', min: 3, max: 12 },
    },
    answer_template: '{{round(Math.PI * r * r * h / 3, 2)}} cm³',
    answer_type: 'numeric',
    tolerance: 0.5,
    traps: [
      {
        answer_template: '{{round(Math.PI * r * r * h, 2)}}',
        response:
          "You used the cylinder formula. A cone is ⅓ of the equivalent cylinder: V = ⅓πr²h = ⅓ × π × {{r}}² × {{h}} ≈ {{round(Math.PI*r*r*h/3, 2)}} cm³.",
      },
      {
        answer_template: '{{round(Math.PI * r * h / 3, 2)}}',
        response:
          'You need r² (radius squared): V = ⅓πr²h = ⅓ × π × {{r*r}} × {{h}} ≈ {{round(Math.PI*r*r*h/3, 2)}} cm³.',
      },
    ],
    explanation:
      'Volume of a cone = ⅓πr²h<br>' +
      '= ⅓ × π × {{r}}² × {{h}}<br>' +
      '= ⅓ × π × {{r*r}} × {{h}}<br>' +
      '≈ {{round(Math.PI * r * r * h / 3, 2)}} cm³',
    is_published: false,
  },

  {
    skill_ids: ['volume_of_a_sphere'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Find the volume of a sphere with radius <strong>{{r}} cm</strong>.</p>' +
      '<p>Give your answer to 2 decimal places.</p>',
    parameters: {
      r: { type: 'integer', min: 2, max: 8 },
    },
    answer_template: '{{round(4/3 * Math.PI * r * r * r, 2)}} cm³',
    answer_type: 'numeric',
    tolerance: 0.5,
    traps: [
      {
        answer_template: '{{round(4 * Math.PI * r * r, 2)}}',
        response:
          "That's the surface area (4πr²). Volume of a sphere = (4/3)πr³ = (4/3) × π × {{r}}³ ≈ {{round(4/3*Math.PI*r*r*r, 2)}} cm³.",
      },
      {
        answer_template: '{{round(Math.PI * r * r * r, 2)}}',
        response:
          "You used πr³. The formula is <strong>(4/3)πr³</strong>: V = (4/3) × π × {{r}}³ ≈ {{round(4/3*Math.PI*r*r*r, 2)}} cm³.",
      },
    ],
    explanation:
      'Volume of a sphere = (4/3)πr³<br>' +
      '= (4/3) × π × {{r}}³<br>' +
      '≈ {{round(4/3 * Math.PI * r * r * r, 2)}} cm³',
    is_published: false,
  },

  {
    skill_ids: ['surface_area_of_a_sphere'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Find the <strong>surface area</strong> of a sphere with radius <strong>{{r}} cm</strong>.</p>' +
      '<p>Give your answer to 2 decimal places.</p>',
    parameters: {
      r: { type: 'integer', min: 2, max: 8 },
    },
    answer_template: '{{round(4 * Math.PI * r * r, 2)}} cm²',
    answer_type: 'numeric',
    tolerance: 0.5,
    traps: [
      {
        answer_template: '{{round(4/3 * Math.PI * r * r * r, 2)}}',
        response:
          "That's the volume formula. Surface area = 4πr² = 4 × π × {{r}}² ≈ {{round(4*Math.PI*r*r, 2)}} cm².",
      },
      {
        answer_template: '{{round(2 * Math.PI * r * r, 2)}}',
        response:
          'Surface area = <strong>4</strong>πr², not 2πr². SA = 4 × π × {{r}}² ≈ {{round(4*Math.PI*r*r, 2)}} cm².',
      },
    ],
    explanation:
      'Surface area of a sphere = 4πr²<br>' +
      '= 4 × π × {{r}}²<br>' +
      '≈ {{round(4 * Math.PI * r * r, 2)}} cm²',
    is_published: false,
  },

  {
    skill_ids: ['surface_area_of_a_cylinder'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Find the <strong>total surface area</strong> of a cylinder with radius <strong>{{r}} cm</strong> ' +
      'and height <strong>{{h}} cm</strong>.</p>' +
      '<p>Give your answer to 2 decimal places.</p>',
    parameters: {
      r: { type: 'integer', min: 2, max: 7 },
      h: { type: 'integer', min: 3, max: 12 },
    },
    // SA = 2πr² + 2πrh = 2πr(r + h)
    answer_template: '{{round(2 * Math.PI * r * (r + h), 2)}} cm²',
    answer_type: 'numeric',
    tolerance: 0.5,
    traps: [
      {
        answer_template: '{{round(2 * Math.PI * r * h, 2)}}',
        response:
          "That's only the curved surface area. The total includes the two circular ends: " +
          'SA = 2πr² + 2πrh = 2πr(r + h) = 2π × {{r}} × ({{r}} + {{h}}) ≈ {{round(2*Math.PI*r*(r+h), 2)}} cm².',
      },
      {
        answer_template: '{{round(Math.PI * r * r * h, 2)}}',
        response:
          "That's the volume. Surface area = 2πr(r + h) = 2 × π × {{r}} × {{r + h}} ≈ {{round(2*Math.PI*r*(r+h), 2)}} cm².",
      },
    ],
    explanation:
      'Total surface area of a cylinder = 2πr² + 2πrh = 2πr(r + h)<br>' +
      '= 2 × π × {{r}} × ({{r}} + {{h}})<br>' +
      '= 2 × π × {{r}} × {{r + h}}<br>' +
      '≈ {{round(2 * Math.PI * r * (r + h), 2)}} cm²',
    is_published: false,
  },

  {
    skill_ids: ['surface_area_of_a_cone'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Find the <strong>total surface area</strong> of a cone with radius <strong>{{r}} cm</strong> ' +
      'and slant height <strong>{{l}} cm</strong>.</p>' +
      '<p>Give your answer to 2 decimal places.</p>',
    parameters: {
      r: { type: 'integer', min: 2, max: 7 },
      l: { type: 'integer', min: 4, max: 12 },
    },
    // SA = πrl + πr² = πr(l + r)
    answer_template: '{{round(Math.PI * r * (r + l), 2)}} cm²',
    answer_type: 'numeric',
    tolerance: 0.5,
    traps: [
      {
        answer_template: '{{round(Math.PI * r * l, 2)}}',
        response:
          "That's the curved surface area only. Add the circular base (πr²): " +
          'Total SA = πrl + πr² = π × {{r}} × ({{l}} + {{r}}) ≈ {{round(Math.PI*r*(r+l), 2)}} cm².',
      },
      {
        answer_template: '{{round(Math.PI * r * r, 2)}}',
        response:
          "That's just the base area. Total SA = πr(l + r) = π × {{r}} × ({{l}} + {{r}}) ≈ {{round(Math.PI*r*(r+l), 2)}} cm².",
      },
    ],
    explanation:
      'Total surface area of a cone = πrl + πr² = πr(l + r)<br>' +
      '= π × {{r}} × ({{l}} + {{r}})<br>' +
      '≈ {{round(Math.PI * r * (r + l), 2)}} cm²',
    is_published: false,
  },

  // ── TRIGONOMETRY ─────────────────────────────────────────────────────────

  {
    skill_ids: ['trigonometry_missing_sides'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>In a right-angled triangle, angle <em>θ</em> = <strong>{{theta}}°</strong> ' +
      'and the side <strong>adjacent</strong> to <em>θ</em> is <strong>{{adj}} cm</strong>.</p>' +
      '<p>Find the <strong>hypotenuse</strong>. Give your answer to 2 decimal places.</p>',
    parameters: {
      theta: { type: 'integer', min: 25, max: 65 },
      adj:   { type: 'integer', min: 5,  max: 14 },
    },
    // hyp = adj / cos(theta)
    answer_template: '{{round(adj / Math.cos(theta * Math.PI / 180), 2)}} cm',
    answer_type: 'numeric',
    tolerance: 0.1,
    traps: [
      {
        answer_template: '{{round(adj * Math.cos(theta * Math.PI / 180), 2)}}',
        response:
          'You multiplied by cos instead of dividing. cos(θ) = adjacent/hypotenuse, so ' +
          'hypotenuse = adjacent ÷ cos(θ) = {{adj}} ÷ cos({{theta}}°) ≈ {{round(adj/Math.cos(theta*Math.PI/180), 2)}} cm.',
      },
      {
        answer_template: '{{round(adj / Math.sin(theta * Math.PI / 180), 2)}}',
        response:
          'sin relates opposite and hypotenuse; <strong>cos</strong> relates adjacent and hypotenuse. ' +
          'hyp = adj ÷ cos({{theta}}°) ≈ {{round(adj/Math.cos(theta*Math.PI/180), 2)}} cm.',
      },
    ],
    explanation:
      'cos(θ) = adjacent / hypotenuse<br>' +
      'hypotenuse = adjacent ÷ cos(θ)<br>' +
      '= {{adj}} ÷ cos({{theta}}°)<br>' +
      '≈ {{round(adj / Math.cos(theta * Math.PI / 180), 2)}} cm',
    is_published: false,
  },

  {
    skill_ids: ['trigonometry_missing_angles'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>In a right-angled triangle, the side <strong>opposite</strong> angle <em>θ</em> is ' +
      '<strong>{{opp}} cm</strong> and the <strong>hypotenuse</strong> is <strong>{{hyp}} cm</strong>.</p>' +
      '<p>Find angle <em>θ</em>. Give your answer to 1 decimal place.</p>',
    parameters: {
      hyp: { type: 'integer', min: 8,  max: 20 },
      opp: { type: 'integer', min: 3,  max: 15, constraint: { type: 'lt', target: 'hyp', target_type: 'parameter' } },
    },
    // theta = arcsin(opp/hyp)
    answer_template: '{{round(Math.asin(opp / hyp) * 180 / Math.PI, 1)}}',
    answer_type: 'numeric',
    tolerance: 0.2,
    traps: [
      {
        answer_template: '{{round(Math.acos(opp / hyp) * 180 / Math.PI, 1)}}',
        response:
          'sin(θ) = opposite/hypotenuse, so use <strong>arcsin</strong> (sin⁻¹), not arccos. ' +
          'θ = sin⁻¹({{opp}}/{{hyp}}) ≈ {{round(Math.asin(opp/hyp)*180/Math.PI, 1)}}°.',
      },
      {
        answer_template: '{{round(opp / hyp, 2)}}',
        response:
          'That gives sin(θ), not θ itself. Use the inverse sine function: ' +
          'θ = sin⁻¹({{opp}}/{{hyp}}) = sin⁻¹({{round(opp/hyp, 3)}}) ≈ {{round(Math.asin(opp/hyp)*180/Math.PI, 1)}}°.',
      },
    ],
    explanation:
      'sin(θ) = opposite / hypotenuse = {{opp}} / {{hyp}}<br>' +
      'θ = sin⁻¹({{opp}}/{{hyp}})<br>' +
      '≈ {{round(Math.asin(opp / hyp) * 180 / Math.PI, 1)}}°',
    is_published: false,
  },

  // ── VECTORS ──────────────────────────────────────────────────────────────

  {
    skill_ids: ['vectors'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Vector <strong>a</strong> = ({{3*k}}, {{4*k}}).</p>' +
      '<p>Find |<strong>a</strong>|, the magnitude of <strong>a</strong>.</p>',
    parameters: {
      k: { type: 'integer', min: 1, max: 4 },
    },
    // |a| = sqrt((3k)² + (4k)²) = 5k
    answer_template: '{{5 * k}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{3*k + 4*k}}',
        response:
          'Magnitude uses Pythagoras, not addition. |a| = √({{3*k}}² + {{4*k}}²) = √({{9*k*k}} + {{16*k*k}}) = √{{25*k*k}} = {{5*k}}.',
      },
      {
        answer_template: '{{7 * k}}',
        response:
          'You added the components. Use Pythagoras: |a| = √({{3*k}}² + {{4*k}}²) = √{{25*k*k}} = {{5*k}}.',
      },
    ],
    explanation:
      '|a| = √(x² + y²)<br>' +
      '= √({{3*k}}² + {{4*k}}²)<br>' +
      '= √({{9*k*k}} + {{16*k*k}})<br>' +
      '= √{{25*k*k}}<br>' +
      '= {{5*k}}',
    is_published: false,
  },

  // ── CIRCLE THEOREMS ──────────────────────────────────────────────────────

  {
    skill_ids: ['circle_theorem_same_segment'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>Two angles are inscribed in the same segment of a circle, both subtending the same chord.</p>' +
      '<p>One angle is <strong>{{a}}°</strong>. Find the other angle.</p>',
    parameters: {
      a: { type: 'integer', min: 20, max: 80 },
    },
    answer_template: '{{a}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{180 - a}}',
        response:
          'Opposite angles of a <em>cyclic quadrilateral</em> sum to 180° — but angles in the <strong>same segment</strong> are equal. Answer: {{a}}°.',
      },
      {
        answer_template: '{{2 * a}}',
        response:
          'The angle at the centre is double the angle at the circumference — not applicable here. ' +
          'Angles in the same segment are equal. Answer: {{a}}°.',
      },
    ],
    explanation:
      'Circle theorem: angles in the same segment subtending the same chord are equal.<br>' +
      'The other angle = {{a}}°.',
    is_published: false,
  },

  {
    skill_ids: ['circle_theorem_cyclic_quadrilateral'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>ABCD is a cyclic quadrilateral (all four vertices lie on a circle).</p>' +
      '<p>Angle A = <strong>{{a}}°</strong>. Find angle C.</p>',
    parameters: {
      a: { type: 'integer', min: 55, max: 125 },
    },
    answer_template: '{{180 - a}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{a}}',
        response:
          'Opposite angles of a cyclic quadrilateral are <em>supplementary</em> (not equal). ' +
          'Angle C = 180° − {{a}}° = {{180 - a}}°.',
      },
      {
        answer_template: '{{360 - a}}',
        response:
          'Opposite angles of a cyclic quadrilateral sum to 180°, not 360°. ' +
          'Angle C = 180° − {{a}}° = {{180 - a}}°.',
      },
    ],
    explanation:
      'Opposite angles of a cyclic quadrilateral sum to 180°.<br>' +
      'Angle A + Angle C = 180°<br>' +
      'Angle C = 180° − {{a}}° = {{180 - a}}°',
    is_published: false,
  },

  {
    skill_ids: ['circle_theorem_tangent'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>A circle has centre O and radius <strong>{{3*k}} cm</strong>.</p>' +
      '<p>A tangent from external point T touches the circle at P. The distance OT = <strong>{{5*k}} cm</strong>.</p>' +
      '<p>Find the length of the tangent PT.</p>',
    parameters: {
      k: { type: 'integer', min: 1, max: 4 },
    },
    // Angle OPT = 90° (tangent ⊥ radius), so PT² = OT² − OP² = 25k² − 9k² = 16k²
    answer_template: '{{4 * k}} cm',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{5*k - 3*k}}',
        response:
          'Use Pythagoras, not subtraction. The tangent meets the radius at 90°, so ' +
          'PT² = OT² − OP² = {{5*k}}² − {{3*k}}² = {{25*k*k}} − {{9*k*k}} = {{16*k*k}}. ' +
          'PT = √{{16*k*k}} = {{4*k}} cm.',
      },
      {
        answer_template: '{{round(Math.sqrt((5*k)*(5*k) + (3*k)*(3*k)), 2)}}',
        response:
          'Angle OPT = 90°, so OT is the hypotenuse. Subtract (not add): ' +
          'PT² = OT² − OP² = {{25*k*k}} − {{9*k*k}} = {{16*k*k}}, PT = {{4*k}} cm.',
      },
    ],
    explanation:
      'The tangent is perpendicular to the radius at P, so angle OPT = 90°.<br>' +
      'By Pythagoras: PT² = OT² − OP²<br>' +
      '= {{5*k}}² − {{3*k}}²<br>' +
      '= {{25*k*k}} − {{9*k*k}}<br>' +
      '= {{16*k*k}}<br>' +
      'PT = √{{16*k*k}} = {{4*k}} cm',
    is_published: false,
  },

  {
    skill_ids: ['circle_theorem_alternate_segment'],
    difficulty: 3,
    question_type: 'numeric',
    question_template:
      '<p>A tangent to a circle at point P and a chord PQ from P make an angle of <strong>{{a}}°</strong>.</p>' +
      '<p>R is a point on the major arc PQ. Find angle PRQ.</p>',
    parameters: {
      a: { type: 'integer', min: 25, max: 75 },
    },
    answer_template: '{{a}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{90 - a}}',
        response:
          'The alternate segment theorem states that the angle between a tangent and a chord equals ' +
          'the inscribed angle in the alternate segment. Angle PRQ = {{a}}°.',
      },
      {
        answer_template: '{{180 - a}}',
        response:
          'By the alternate segment theorem, angle PRQ equals the angle between the tangent and the chord. Angle PRQ = {{a}}°.',
      },
    ],
    explanation:
      'Alternate segment theorem: the angle between a tangent and a chord at the point of tangency ' +
      'equals the inscribed angle subtending the same chord in the alternate segment.<br>' +
      'Angle PRQ = {{a}}°.',
    is_published: false,
  },

  // ── HIGHER TRIGONOMETRY ──────────────────────────────────────────────────

  {
    skill_ids: ['sine_rule'],
    difficulty: 4,
    question_type: 'numeric',
    question_template:
      '<p>In triangle ABC, angle A = <strong>{{A}}°</strong>, ' +
      'angle B = <strong>{{B}}°</strong>, ' +
      'and side <em>a</em> (opposite A) = <strong>{{s}} cm</strong>.</p>' +
      '<p>Find side <em>b</em> (opposite B). Give your answer to 2 decimal places.</p>',
    parameters: {
      // A ∈ {30,40,50}, B ∈ {60,70,80} — always different and A+B < 180
      A: { type: 'integer', min: 30, max: 50, constraint: { type: 'multiple_of', target: 10 } },
      B: { type: 'integer', min: 60, max: 80, constraint: { type: 'multiple_of', target: 10 } },
      s: { type: 'integer', min: 6, max: 14 },
    },
    answer_template: '{{round(s * Math.sin(B * Math.PI / 180) / Math.sin(A * Math.PI / 180), 2)}} cm',
    answer_type: 'numeric',
    tolerance: 0.1,
    traps: [
      {
        answer_template: '{{round(s * Math.sin(A * Math.PI / 180) / Math.sin(B * Math.PI / 180), 2)}}',
        response:
          'You divided by sin(B) instead of sin(A). Sine rule: b/sin(B) = a/sin(A), so ' +
          'b = a × sin(B)/sin(A) = {{s}} × sin({{B}}°)/sin({{A}}°) ≈ {{round(s*Math.sin(B*Math.PI/180)/Math.sin(A*Math.PI/180), 2)}} cm.',
      },
      {
        answer_template: '{{round(s * B / A, 2)}}',
        response:
          'Use the sine rule, not a direct ratio of angles. ' +
          'b = a × sin(B)/sin(A) ≈ {{round(s*Math.sin(B*Math.PI/180)/Math.sin(A*Math.PI/180), 2)}} cm.',
      },
    ],
    explanation:
      'Sine rule: a/sin(A) = b/sin(B)<br>' +
      'b = a × sin(B)/sin(A)<br>' +
      '= {{s}} × sin({{B}}°)/sin({{A}}°)<br>' +
      '≈ {{round(s * Math.sin(B * Math.PI / 180) / Math.sin(A * Math.PI / 180), 2)}} cm',
    is_published: false,
  },

  {
    skill_ids: ['cosine_rule'],
    difficulty: 4,
    question_type: 'numeric',
    question_template:
      '<p>In triangle ABC, side <em>a</em> = <strong>{{p}} cm</strong>, ' +
      'side <em>b</em> = <strong>{{q}} cm</strong>, ' +
      'and the included angle C = <strong>{{30 + 30*n}}°</strong>.</p>' +
      '<p>Find side <em>c</em>. Give your answer to 2 decimal places.</p>',
    parameters: {
      p: { type: 'integer', min: 5, max: 10 },
      q: { type: 'integer', min: 5, max: 10 },
      // n=1→60°, n=2→90°, n=3→120°
      n: { type: 'integer', min: 1, max: 3 },
    },
    answer_template: '{{round(Math.sqrt(p*p + q*q - 2*p*q*Math.cos((30+30*n)*Math.PI/180)), 2)}} cm',
    answer_type: 'numeric',
    tolerance: 0.1,
    traps: [
      {
        answer_template: '{{round(Math.sqrt(p*p + q*q + 2*p*q*Math.cos((30+30*n)*Math.PI/180)), 2)}}',
        response:
          'The cosine rule has a minus sign: c² = a² + b² <strong>−</strong> 2ab cos(C). ' +
          'c = √({{p}}² + {{q}}² − 2×{{p}}×{{q}}×cos({{30+30*n}}°)) ≈ {{round(Math.sqrt(p*p+q*q-2*p*q*Math.cos((30+30*n)*Math.PI/180)), 2)}} cm.',
      },
      {
        answer_template: '{{round(Math.sqrt(p*p + q*q), 2)}}',
        response:
          "That's Pythagoras — only valid at 90°. Use the cosine rule: " +
          'c² = a² + b² − 2ab cos(C) ≈ {{round(Math.sqrt(p*p+q*q-2*p*q*Math.cos((30+30*n)*Math.PI/180)), 2)}} cm.',
      },
    ],
    explanation:
      'Cosine rule: c² = a² + b² − 2ab cos(C)<br>' +
      '= {{p}}² + {{q}}² − 2×{{p}}×{{q}}×cos({{30+30*n}}°)<br>' +
      '≈ {{round(Math.sqrt(p*p + q*q - 2*p*q*Math.cos((30+30*n)*Math.PI/180)), 2)}} cm',
    is_published: false,
  },

  {
    skill_ids: ['area_of_triangle_sine'],
    difficulty: 4,
    question_type: 'numeric',
    question_template:
      '<p>Find the area of a triangle with two sides of <strong>{{a}} cm</strong> and ' +
      '<strong>{{b}} cm</strong>, and included angle <strong>{{30*n}}°</strong>.</p>' +
      '<p>Give your answer to 2 decimal places.</p>',
    parameters: {
      a: { type: 'integer', min: 5, max: 12 },
      b: { type: 'integer', min: 5, max: 12 },
      // n=1→30°, n=2→60°, n=3→90°, n=4→120°
      n: { type: 'integer', min: 1, max: 4 },
    },
    answer_template: '{{round(0.5 * a * b * Math.sin(30*n * Math.PI / 180), 2)}} cm²',
    answer_type: 'numeric',
    tolerance: 0.1,
    traps: [
      {
        answer_template: '{{round(0.5 * a * b, 2)}}',
        response:
          'This only works when the angle is 90°. In general: Area = ½ab sin(C) = ½ × {{a}} × {{b}} × sin({{30*n}}°) ≈ {{round(0.5*a*b*Math.sin(30*n*Math.PI/180), 2)}} cm².',
      },
      {
        answer_template: '{{round(a * b * Math.sin(30*n * Math.PI / 180), 2)}}',
        response:
          'You forgot the ½. Area = <strong>½</strong>ab sin(C) = ½ × {{a}} × {{b}} × sin({{30*n}}°) ≈ {{round(0.5*a*b*Math.sin(30*n*Math.PI/180), 2)}} cm².',
      },
    ],
    explanation:
      'Area of a triangle = ½ab sin(C)<br>' +
      '= ½ × {{a}} × {{b}} × sin({{30*n}}°)<br>' +
      '≈ {{round(0.5 * a * b * Math.sin(30*n * Math.PI / 180), 2)}} cm²',
    is_published: false,
  },

  // ── BEARINGS ─────────────────────────────────────────────────────────────

  {
    skill_ids: ['bearings'],
    difficulty: 2,
    question_type: 'numeric',
    question_template:
      '<p>A ship sails on a bearing of <strong>{{a < 100 ? "0" + a : a}}°</strong> from port P to port Q.</p>' +
      '<p>What is the bearing of P from Q (the back bearing)?</p>',
    parameters: {
      // a ∈ {020..160} in steps of 10 so back bearing ∈ {200..340}, always 3 figures
      a: { type: 'integer', min: 20, max: 160, constraint: { type: 'multiple_of', target: 10 } },
    },
    answer_template: '{{a + 180}}',
    answer_type: 'numeric',
    tolerance: 0,
    traps: [
      {
        answer_template: '{{360 - a}}',
        response:
          'To find the back bearing, <strong>add 180°</strong> (not subtract from 360°). ' +
          'Back bearing = {{a}}° + 180° = {{a + 180}}°.',
      },
      {
        answer_template: '{{a - 180}}',
        response:
          'Add 180°, not subtract. Back bearing = {{a}}° + 180° = {{a + 180}}°.',
      },
    ],
    explanation:
      'The back bearing is found by adding 180° to the original bearing.<br>' +
      'Back bearing = {{a}}° + 180° = {{a + 180}}°',
    is_published: false,
  },
]

async function main() {
  console.log(`Inserting ${questions.length} Shape & Space questions...`)
  const { data, error } = await supabase
    .from('questions')
    .insert(questions)
    .select('id, skill_ids')

  if (error) { console.error('Insert failed:', error.message); process.exit(1) }

  console.log('Inserted successfully:')
  data?.forEach(q => console.log(`  ${q.id}  →  ${q.skill_ids.join(', ')}`))
  console.log(`\nTotal: ${data?.length} questions`)
}

main()
