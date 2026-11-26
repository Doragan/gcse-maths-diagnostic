import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// Two questions for the proportion investigation's sections 3 and 4, which the
// bank has nothing single-part for: a best buy (its one best-buy question is
// multi-part, and the other carries a percentage too), and the greatest number
// of whole batches from two ingredients.
//
// Same rules as the other draft scripts: verify with the harness first, and
// INSERT only — a row that already exists is the reviewer's, edits and all.
//
//   npx tsx scripts/draft-proportion.ts            write + verify only
//   npx tsx scripts/draft-proportion.ts --insert   also insert as drafts
// ─────────────────────────────────────────────────────────────────────────────

const sel = { sel: { type: 'integer', min: 0, max: 5 } }

// ── Section 3: best buy ─────────────────────────────────────────────────────
// [rolls in A, A's price in pence, rolls in B, B's price in pence]. Every
// price for one roll is whole pence, the two never tie, and neither trap — the
// worse pack's roll, the cheaper pack's whole price — renders as the answer.
// None is a scenario from the investigation's own prediction.
const A3 = '[4,5,3,6,8,10][sel]'
const PA3 = '[320,400,270,420,560,650][sel]'
const B3 = '[6,8,4,4,5,6][sel]'
const PB3 = '[450,680,340,300,375,420][sel]'
const ONE_A = `(${PA3}/${A3})`
const ONE_B = `(${PB3}/${B3})`
const BEST = `Math.min(${ONE_A},${ONE_B})`
const WORST = `Math.max(${ONE_A},${ONE_B})`
const WIN = `(${ONE_A}<${ONE_B}?'A':'B')`

// ── Section 4: whole batches ────────────────────────────────────────────────
// [oats per batch, butter per batch, oats in stock, butter in stock], grams.
// The limiting ingredient never makes a whole number of batches (or rounding
// up would be right), and the other one makes at least two more than it (or
// "the other ingredient" and "rounded up" would be the same wrong answer).
const O4 = '[150,250,120,300,200,180][sel]'
const U4 = '[100,80,90,125,175,60][sel]'
const SO4 = '[900,1200,900,1000,1500,700][sel]'
const SU4 = '[350,600,400,800,600,500][sel]'
const BY_O = `(${SO4}/${O4})`
const BY_U = `(${SU4}/${U4})`
const FEWEST = `Math.min(${BY_O},${BY_U})`
const SHORT = `(${BY_O}<${BY_U}?'oats':'butter')`
const OTHER = `(${BY_O}<${BY_U}?'butter':'oats')`

const base = {
  skill_ids: ['proportion'],
  kind: 'mastery',
  is_published: false,
  parameters: sel,
  requires_simplest: false,
}

const QUESTIONS = [
  {
    ...base,
    id: '4dc5016f-c058-4a7e-ba28-020012571dd7',
    difficulty: 2,
    calculator: 'non_calc',
    question_type: 'numeric',
    answer_type: 'numeric',
    tolerance: 0,
    question_template: '<p>A shop sells kitchen rolls in two packs.</p>'
      + `<p><strong>Pack A:</strong> {{${A3}}} rolls for <strong>£{{(${PA3}/100).toFixed(2)}}</strong><br>`
      + `<strong>Pack B:</strong> {{${B3}}} rolls for <strong>£{{(${PB3}/100).toFixed(2)}}</strong></p>`
      + '<p>Which pack is better value? Work out the price of one roll in that pack, in pence.</p>',
    answer_template: `{{${BEST}}}p`,
    explanation: `One roll in pack A: {{${PA3}}}p ÷ {{${A3}}} = {{${ONE_A}}}p.<br>`
      + `One roll in pack B: {{${PB3}}}p ÷ {{${B3}}} = {{${ONE_B}}}p.<br>`
      + `A roll is cheaper in pack {{${WIN}}}, so pack {{${WIN}}} is better value: <strong>{{${BEST}}}p</strong> a roll.`,
    traps: [
      {
        answer_template: `{{${WORST}}}p`,
        misconception: 'answered_a_different_quantity',
        response: `That is one roll in the pack that is WORSE value. One roll costs {{${ONE_A}}}p in A `
          + `and {{${ONE_B}}}p in B, so the better value is the cheaper roll: {{${BEST}}}p, in pack {{${WIN}}}.`,
      },
      {
        answer_template: `{{Math.min(${PA3},${PB3})}}p`,
        misconception: 'compared_unlike_quantities',
        response: `That is the price of the cheaper whole PACK. The packs hold different numbers of rolls, `
          + `so their prices cannot be compared — compare one roll in each: {{${ONE_A}}}p in A and `
          + `{{${ONE_B}}}p in B. The better value is {{${BEST}}}p a roll.`,
      },
    ],
  },
  {
    ...base,
    id: 'b5a1cec5-2d8e-443a-9742-8dab8db7d69e',
    difficulty: 2,
    calculator: 'calc',
    question_type: 'numeric',
    answer_type: 'numeric',
    tolerance: 0,
    question_template: `<p>One batch of flapjacks uses <strong>{{${O4}}} g</strong> of oats and `
      + `<strong>{{${U4}}} g</strong> of butter.</p>`
      + `<p>Priya has <strong>{{${SO4}}} g</strong> of oats and <strong>{{${SU4}}} g</strong> of butter.</p>`
      + '<p>What is the greatest number of whole batches of flapjacks Priya can make?</p>',
    answer_template: `{{Math.floor(${FEWEST})}}`,
    explanation: `Oats: {{${SO4}}} ÷ {{${O4}}} = {{+${BY_O}.toFixed(2)}} batches.<br>`
      + `Butter: {{${SU4}}} ÷ {{${U4}}} = {{+${BY_U}.toFixed(2)}} batches.<br>`
      + `The {{${SHORT}}} runs out first, and only whole batches count, so Priya can make `
      + `<strong>{{Math.floor(${FEWEST})}}</strong> batches.`,
    traps: [
      {
        answer_template: `{{Math.floor(Math.max(${BY_O},${BY_U}))}}`,
        misconception: 'answered_a_different_quantity',
        response: `That is how many batches the {{${OTHER}}} would make on its own. Every batch needs `
          + `both, and the {{${SHORT}}} runs out first, after {{+${FEWEST}.toFixed(2)}} batches — so `
          + `{{Math.floor(${FEWEST})}} whole batches.`,
      },
      {
        answer_template: `{{Math.ceil(${FEWEST})}}`,
        response: `That rounds {{+${FEWEST}.toFixed(2)}} up. The last batch would be short of `
          + `{{${SHORT}}}, so it cannot be made: only {{Math.floor(${FEWEST})}} whole batches.`,
      },
    ],
  },
]

async function main() {
  const out = 'scripts/_draft-proportion.json'
  writeFileSync(out, JSON.stringify(QUESTIONS, null, 2))
  console.log(`wrote ${QUESTIONS.length} questions to ${out}`)
  if (!process.argv.includes('--insert')) {
    console.log('not written — verify with the harness, then pass --insert')
    return
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  for (const q of QUESTIONS) {
    if (q.is_published !== false) throw new Error('refusing to write a published question')
    const { data: existing, error: readErr } = await supabase
      .from('questions').select('id, is_published').eq('id', q.id).maybeSingle()
    if (readErr) throw readErr
    if (existing) {
      console.log(`  SKIPPED ${q.id} — row already exists`
        + `${existing.is_published ? ' and is PUBLISHED' : ''}. Not overwriting it.`)
      continue
    }
    const { error } = await supabase.from('questions').insert(q)
    if (error) throw error
    console.log(`  inserted ${q.id}  d${q.difficulty}  [${q.skill_ids.join(',')}]  DRAFT`)
  }
  console.log('\nUnpublished. Publishing is yours.')
}

main().catch(e => { console.error(e); process.exit(1) })
