import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// `plans_and_elevations` — the bank's first question for this skill, and a
// deliberate PROBE of the grid_draw authoring path.
//
// Why this skill: 12 primary marks across the coded 2024 series and ZERO bank
// questions — the largest single zero-coverage skill left (05-exam-coverage
// §E1). `grid_draw` shipped with eight modes and carries six parts in the whole
// bank (§E6), so the drawing surface is the least-exercised capability we have.
//
// Why this SHAPE of question: four of the six coded plans_and_elevations rows
// ask for the plan view of a CYLINDER — a circle, which a lattice cannot
// represent at all. The authorable subset is the rectangular elevations. This
// one models JUN24-H-P3 q5 (2 marks, kind=exam, "deduce depth from volume then
// draw elevation on grid"), which is also the only coded row of the six that
// pairs plans_and_elevations with a second INDEPENDENT skill — so it doubles as
// a synthesis item rather than only closing a coverage hole.
//
// Cuboid of width w, height h, depth d. The sketch gives w and h; the stem
// gives the volume. The student deduces d = V / (w·h), then draws the SIDE
// elevation, which is d wide and h tall.
//
//   plan view       = w × d
//   front elevation = w × h
//   side elevation  = d × h   ← the answer, and the only one needing d
//
// POSITION IS ANCHORED, and that is a real compromise. checkPolygon compares
// absolute vertex positions: the starting vertex and winding direction are
// free, but a correct rectangle drawn elsewhere on the grid is marked WRONG.
// A real paper lets you draw it anywhere. The prompt therefore states the
// bottom-left corner explicitly. See the report accompanying this script.
//
// The sketch is a FIXED cabinet-projection cuboid with parametric LABELS and
// "Not drawn accurately", exactly as the papers present it — scaling the
// drawing to w/h would buy nothing and would go ugly at the extremes.
//
//   npx tsx scripts/create-plans-elevations-question.ts --json batch.json
//   npx tsx scripts/verify-question.ts --file batch.json --svg
//   npx tsx scripts/create-plans-elevations-question.ts          # insert draft
//   npx tsx scripts/create-plans-elevations-question.ts --update # revise
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/** Draft row this script owns; `--update` rewrites it in place. */
const DRAFT_ID = '02b92abe-c5bd-4bad-8dbc-2fb5e04d2e0b'

// Six cuboids. Every dimension is a whole number of centimetres, and the three
// candidate rectangles (side, front, plan) are distinct on every draw, so the
// two wrong-view traps can never collide with the answer.
//   grid is 10 wide x 8 tall, so: d ≤ 10 (side/plan width), h ≤ 8, and d ≤ 8
//   because the PLAN trap is w wide by d TALL.
const W = '[5,4,6,3,8,5][sel]'   // width  (given on the sketch)
const H = '[4,3,2,6,3,6][sel]'   // height (given on the sketch)
const D = '[6,7,5,8,4,3][sel]'   // depth  (deduced from the volume)
const VOL = `(${W}*${H}*${D})`

/** A rectangle anchored at the origin, w across and h up, as polygon vertices. */
const rect = (w: string, h: string, marks: [number, number, number, number]) => [
  { x: 0, y: 0, marks: marks[0] },
  { x: `{{${w}}}`, y: 0, marks: marks[1] },
  { x: `{{${w}}}`, y: `{{${h}}}`, marks: marks[2] },
  { x: 0, y: `{{${h}}}`, marks: marks[3] },
]
/** Trap geometry carries no marks, so the same helper without them. */
const rectT = (w: string, h: string) => rect(w, h, [0, 0, 0, 0]).map(({ x, y }) => ({ x, y }))

// The two marks sit on the corners that CARRY the two dimensions: (d,0) fixes
// the deduced depth, (0,h) fixes the height read off the sketch. (0,0) is given
// by the prompt and (d,h) is implied by the other two, so neither is scored —
// that keeps the part at the 2 marks the real paper awards instead of
// inflating it to 4 for a rectangle.
const ELEMENTS = rect(D, H, [0, 1, 0, 1])

const question_template =
  `<p>The diagram shows a solid cuboid.</p>`
  + `<svg viewBox="0 0 320 210" width="100%" style="max-width:320px;height:auto;">`
  + `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">`
  // front face
  + `<rect x="40" y="70" width="150" height="100"/>`
  // top and right faces via the cabinet offset
  + `<path d="M 40 70 L 90 30 L 240 30 L 190 70"/>`
  + `<path d="M 190 170 L 240 130 L 240 30"/>`
  + `</g>`
  // hidden edges
  + `<g fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4 3" opacity="0.5">`
  + `<path d="M 40 170 L 90 130 L 240 130"/><path d="M 90 130 L 90 30"/>`
  + `</g>`
  + `<g fill="currentColor" font-size="14" text-anchor="middle">`
  + `<text x="115" y="192">{{${W}}} cm</text>`
  + `<text x="22" y="125">{{${H}}} cm</text>`
  // The depth label sits just OUTSIDE the solid, against the visible
  // bottom-right receding edge. Placed inside the right-hand face it reads as
  // a label for the face (which is the very elevation being asked for) rather
  // than for the edge.
  + `<text x="232" y="168">?</text>`
  + `</g>`
  + `<g fill="currentColor" font-size="12" text-anchor="middle" opacity="0.75">`
  + `<text x="160" y="16">Not drawn accurately</text></g>`
  + `</svg>`
  + `<p>The volume of the cuboid is <strong>{{${VOL}}} cm³</strong>.</p>`

const drafts = [{
  name: 'cuboid-side-elevation-from-volume',
  skill_ids: ['plans_and_elevations', 'volume_of_a_prism'],
  difficulty: 4,
  calculator: 'calc' as const,
  question_template,
  parameters: { sel: { type: 'integer' as const, min: 0, max: 5 } },
  part: {
    prompt:
      `<p>On the grid, draw the <strong>side elevation</strong> of the cuboid.</p>`
      + `<p>Each square is 1 cm. Start your rectangle at the corner <strong>(0, 0)</strong> and place its four corners.</p>`,
    skill_ids: ['plans_and_elevations', 'volume_of_a_prism'],
    answer_type: 'grid_draw' as const,
    answer_template: '',
    tolerance: null,
    requires_simplest: false,
    traps: [],
    marks: 2,
    kind: 'exam' as const,
    explanation:
      `The volume of a cuboid is width × height × depth, so the missing depth is `
      + `{{${VOL}}} ÷ ({{${W}}} × {{${H}}}) = {{${VOL}}} ÷ {{${W}*${H}}} = <strong>{{${D}}} cm</strong>.<br>`
      + `The <strong>side</strong> elevation is the view from the side, so it shows the <em>depth</em> and the <em>height</em> — not the width.<br>`
      + `That makes it a rectangle <strong>{{${D}}} cm wide and {{${H}}} cm tall</strong>: corners (0, 0), ({{${D}}}, 0), ({{${D}}}, {{${H}}}) and (0, {{${H}}}).`,
    grid: {
      mode: 'polygon' as const,
      x: { min: 0, max: 10, step: 1, label: 'cm' },
      y: { min: 0, max: 8, step: 1, label: 'cm' },
      background: '',
      elements: ELEMENTS,
      tolerance: 0,
      traps: [
        {
          // The coded plan_vs_elevation_confusion / wrong_view: the FRONT
          // elevation uses the width, which is the dimension already on the
          // sketch — so this is what a student who never used the volume draws.
          elements: rectT(W, H),
          response: `<p>That is the <strong>front</strong> elevation — {{${W}}} cm wide, using the width from the diagram.</p><p>The <em>side</em> elevation is the view from the side, so its width is the cuboid's <strong>depth</strong>. Work the depth out from the volume: {{${VOL}}} ÷ ({{${W}}} × {{${H}}}) = {{${D}}} cm, giving a rectangle {{${D}}} cm by {{${H}}} cm.</p>`,
        },
        {
          elements: rectT(W, D),
          response: `<p>That is the <strong>plan</strong> — the view from directly above, which shows the width and the depth.</p><p>The side elevation is the view from the side: it shows the <strong>depth</strong> and the <strong>height</strong>, so it is {{${D}}} cm by {{${H}}} cm.</p>`,
        },
        {
          // Right rectangle, wrong place — the anchor the prompt asked for was
          // ignored. Scored wrong by the marker, so it needs to say why.
          match: 'translated' as const,
          elements: [],
          response: `<p>The rectangle is exactly the right size — {{${D}}} cm by {{${H}}} cm — but it is not where the question asked for it.</p><p>Start it at the corner <strong>(0, 0)</strong> of the grid, so its corners are (0, 0), ({{${D}}}, 0), ({{${D}}}, {{${H}}}) and (0, {{${H}}}).</p>`,
        },
      ],
    },
  },
}]

function rowOf(q: typeof drafts[0]) {
  return {
    skill_ids: q.skill_ids,
    difficulty: q.difficulty,
    marks: null,
    question_template: q.question_template,
    question_type: 'numeric',
    parameters: q.parameters,
    answer_template: '',
    answer_type: 'numeric',
    tolerance: null,
    traps: [],
    explanation: null,
    image: false,
    image_url: null,
    calculator: q.calculator,
    kind: 'exam',
    parts: [q.part],
    mc_options: null,
    requires_simplest: false,
    is_published: false, // draft — the user reviews and publishes
  }
}

async function main() {
  const jsonIdx = process.argv.indexOf('--json')
  if (jsonIdx !== -1) {
    writeFileSync(process.argv[jsonIdx + 1], JSON.stringify(drafts.map(rowOf), null, 1))
    console.log(`wrote ${drafts.length} question(s) to ${process.argv[jsonIdx + 1]}`)
    return
  }
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(drafts.map(rowOf), null, 1)); return
  }
  if (process.argv.includes('--update')) {
    if (!DRAFT_ID) { console.error('no draft id recorded — insert it first'); process.exit(1) }
    const { is_published: _ignored, ...payload } = rowOf(drafts[0])
    const { error } = await supabase.from('questions').update(payload).eq('id', DRAFT_ID)
    if (error) { console.error('update failed:', error); process.exit(1) }
    console.log(`  updated ${drafts[0].name}: ${DRAFT_ID}`)
    return
  }
  const { data, error } = await supabase.from('questions').insert(drafts.map(rowOf)).select('id')
  if (error) { console.error('insert failed:', error); process.exit(1) }
  console.log('Inserted as DRAFT (is_published=false):')
  data!.forEach((r, i) => console.log(`  ${drafts[i].name}: ${r.id}`))
  console.log(`\nverify:  npx tsx scripts/verify-question.ts ${data![0].id} --svg`)
}

main()
