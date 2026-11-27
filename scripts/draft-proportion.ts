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
// Rewritten at review (2026-11-27). It used to say "work out the price of one
// roll in that pack", which named the method the section is checking. Now Sam
// needs a number of rolls and buys only the better-value pack: the answer is
// what Sam pays, which any method of comparing reaches — price per roll, or
// pricing the same number of rolls both ways — and saying the pack is not
// enough to score.
//
// [rolls in A, A's price in pence, rolls in B, B's price in pence, rolls
// needed]. The rolls needed is a whole number of packs of EITHER, so both
// totals exist; the packs never tie; three sets favour A and three B; and no
// trap renders as the answer. None is a scenario from the investigation.
const A3 = '[4,3,6,5,8,10][sel]'
const PA3 = '[320,270,420,400,560,700][sel]'
const B3 = '[6,4,4,2,6,4][sel]'
const PB3 = '[450,340,300,170,450,260][sel]'
const N3 = '[12,12,12,10,24,20][sel]'
/** What N rolls cost bought as packs of A, and as packs of B, in pence. */
const TOTAL_A = `(${N3}/${A3}*${PA3})`
const TOTAL_B = `(${N3}/${B3}*${PB3})`
const A_WINS = `(${TOTAL_A}<${TOTAL_B})`
const WIN = `(${A_WINS}?'A':'B')`
const pounds = (pence: string) => `£{{(${pence}/100).toFixed(2)}}`
const BEST = `Math.min(${TOTAL_A},${TOTAL_B})`
const WORST = `Math.max(${TOTAL_A},${TOTAL_B})`
/** The better pack's own price, size and how many of it Sam buys. */
const WIN_PRICE = `(${A_WINS}?${PA3}:${PB3})`
const WIN_SIZE = `(${A_WINS}?${A3}:${B3})`
const LOSE_SIZE = `(${A_WINS}?${B3}:${A3})`
/** The worse pack: its letter and its own price. */
const LOSE = `(${A_WINS}?'B':'A')`
const LOSE_PRICE = `(${A_WINS}?${PB3}:${PA3})`

// ── Section 4: whole batches ────────────────────────────────────────────────
// [oats per batch, butter per batch, oats in stock, butter in stock], grams.
// The limiting ingredient never makes a whole number of batches (or rounding
// up would be right), and the other one makes at least two more than it (or
// "the other ingredient" and "rounded up" would be the same wrong answer).
//
// Re-chosen at review (2026-11-27), when traps were added for the other
// ingredient rounded up and for both left unrounded: BOTH ingredients' batches
// now recur, so neither is whole and each reads differently to 1 dp and to
// 2 dp (3.89 and 3.9) — a value that stops, like 3.5 or 7.5, makes those two
// traps the same answer, and the harness refuses one as unreachable. Found by
// search; the limiting ingredient alternates, and the answers run 3 to 5.
const O4 = '[150,240,180,150,120,180][sel]'
const U4 = '[90,90,70,60,175,60][sel]'
const SO4 = '[950,1100,1300,800,650,700][sel]'
const SU4 = '[350,800,300,500,550,500][sel]'
const BY_O = `(${SO4}/${O4})`
const BY_U = `(${SU4}/${U4})`
const FEWEST = `Math.min(${BY_O},${BY_U})`
const MOST = `Math.max(${BY_O},${BY_U})`
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
    difficulty: 3,
    calculator: 'non_calc',
    question_type: 'numeric',
    answer_type: 'numeric',
    tolerance: 0,
    question_template: `<p>Sam needs exactly <strong>{{${N3}}}</strong> kitchen rolls. A shop sells them `
      + 'in two packs.</p>'
      + `<p><strong>Pack A:</strong> {{${A3}}} rolls for <strong>${pounds(PA3)}</strong><br>`
      + `<strong>Pack B:</strong> {{${B3}}} rolls for <strong>${pounds(PB3)}</strong></p>`
      + '<p>Sam buys only the pack that is better value. How much does Sam pay?</p>',
    answer_template: pounds(BEST),
    explanation: `{{${N3}}} rolls as pack A: {{${N3}/${A3}}} packs × ${pounds(PA3)} = ${pounds(TOTAL_A)}.<br>`
      + `{{${N3}}} rolls as pack B: {{${N3}/${B3}}} packs × ${pounds(PB3)} = ${pounds(TOTAL_B)}.<br>`
      + `The same number of rolls costs less in pack {{${WIN}}}, so pack {{${WIN}}} is better value, and `
      + `Sam pays <strong>${pounds(BEST)}</strong>.`,
    traps: [
      {
        answer_template: pounds(WORST),
        misconception: 'answered_a_different_quantity',
        response: `${pounds(WORST)} is what {{${N3}}} rolls cost in the pack that is WORSE value. Bought as pack A they `
          + `cost ${pounds(TOTAL_A)}, and as pack B ${pounds(TOTAL_B)} — so pack {{${WIN}}} is better `
          + `value, and Sam pays ${pounds(BEST)}.`,
      },
      {
        answer_template: pounds(WIN_PRICE),
        misconception: 'stopped_one_step_early',
        response: `${pounds(WIN_PRICE)} is ONE pack {{${WIN}}} — the right pack, but it holds only {{${WIN_SIZE}}} rolls. `
          + `Sam needs {{${N3}}}, which is {{${N3}/${WIN_SIZE}}} packs: ${pounds(BEST)}.`,
      },
      {
        answer_template: pounds(`${N3}/${LOSE_SIZE}*${WIN_PRICE}`),
        response: `${pounds(`${N3}/${LOSE_SIZE}*${WIN_PRICE}`)} is {{${N3}/${LOSE_SIZE}}} packs of {{${WIN}}} — as many as Sam would need of pack `
          + `{{${LOSE}}}. Pack {{${WIN}}} holds {{${WIN_SIZE}}} rolls, so {{${N3}}} rolls is `
          + `{{${N3}/${WIN_SIZE}}} packs: ${pounds(BEST)}.`,
      },
      // Added at review (2026-11-27): one pack of the WRONG pack, and more
      // wrong numbers of packs — the worse pack bought as many times as the
      // better one would need, and a pack bought for every roll, of either.
      {
        answer_template: pounds(LOSE_PRICE),
        misconception: 'answered_a_different_quantity',
        response: `${pounds(LOSE_PRICE)} is ONE pack {{${LOSE}}} — and pack {{${LOSE}}} is the worse value. {{${N3}}} rolls `
          + `cost ${pounds(TOTAL_A)} as pack A and ${pounds(TOTAL_B)} as pack B, so Sam buys pack `
          + `{{${WIN}}}: {{${N3}/${WIN_SIZE}}} packs, ${pounds(BEST)}.`,
      },
      {
        answer_template: pounds(`${N3}/${WIN_SIZE}*${LOSE_PRICE}`),
        misconception: 'answered_a_different_quantity',
        response: `${pounds(`${N3}/${WIN_SIZE}*${LOSE_PRICE}`)} is {{${N3}/${WIN_SIZE}}} packs of {{${LOSE}}}, the worse value — and {{${N3}/${WIN_SIZE}}} `
          // "hold N rolls, not 12" rather than "only": the worse pack can be
          // the bigger one, and then the count overshoots (set 5: 50, not 20).
          + `packs of {{${LOSE}}} hold {{${N3}/${WIN_SIZE}*${LOSE_SIZE}}} rolls, not {{${N3}}}. Sam buys pack {{${WIN}}}, `
          + `{{${WIN_SIZE}}} rolls a pack: {{${N3}/${WIN_SIZE}}} packs, ${pounds(BEST)}.`,
      },
      {
        answer_template: pounds(`${N3}*${WIN_PRICE}`),
        response: `${pounds(`${N3}*${WIN_PRICE}`)} is {{${N3}}} packs of {{${WIN}}} — a pack for every roll. But each pack holds `
          + `{{${WIN_SIZE}}} rolls, so {{${N3}}} rolls is {{${N3}/${WIN_SIZE}}} packs: ${pounds(BEST)}.`,
      },
      {
        answer_template: pounds(`${N3}*${LOSE_PRICE}`),
        misconception: 'answered_a_different_quantity',
        response: `${pounds(`${N3}*${LOSE_PRICE}`)} is {{${N3}}} packs of {{${LOSE}}} — a pack for every roll, of the worse-value pack. `
          + `Pack {{${WIN}}} is better value, and holds {{${WIN_SIZE}}} rolls, so Sam needs `
          + `{{${N3}/${WIN_SIZE}}} packs: ${pounds(BEST)}.`,
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
      + `Priya runs out of {{${SHORT}}} first, and only whole batches count, so she can make `
      + `<strong>{{Math.floor(${FEWEST})}}</strong> batches.`,
    // Every response names an ingredient only after "of" or as "enough …", so
    // it reads right whether it is the oats (plural) or the butter: "the oats
    // runs out" did not (review, 2026-11-27).
    traps: [
      {
        answer_template: `{{Math.floor(Math.max(${BY_O},${BY_U}))}}`,
        misconception: 'answered_a_different_quantity',
        response: `That is how many batches there is enough {{${OTHER}}} for. Every batch needs both, `
          + `and Priya runs out of {{${SHORT}}} first, after {{+${FEWEST}.toFixed(2)}} batches — so `
          + `{{Math.floor(${FEWEST})}} whole batches.`,
      },
      {
        answer_template: `{{Math.ceil(${FEWEST})}}`,
        response: `That rounds {{+${FEWEST}.toFixed(2)}} up. The last batch would be short of `
          + `{{${SHORT}}}, so it cannot be made: only {{Math.floor(${FEWEST})}} whole batches.`,
      },
      // Added at review (2026-11-27): the other ingredient rounded UP, and both
      // ingredients' batches left unrounded. The grader matches a trap only
      // within the question's tolerance, which is 0 for a whole-number answer,
      // so each unrounded value is caught as a student writes it — to 2 dp and
      // to 1 dp. The value sets above keep those two apart.
      {
        answer_template: `{{Math.ceil(${MOST})}}`,
        misconception: 'answered_a_different_quantity',
        response: `That rounds up {{+${MOST}.toFixed(2)}}, the batches there is enough {{${OTHER}}} for. `
          + `But Priya runs out of {{${SHORT}}} first, after {{+${FEWEST}.toFixed(2)}} batches, and only `
          + `whole batches count: {{Math.floor(${FEWEST})}}.`,
      },
      // Each response quotes its numbers to the SAME places as its trap, so a
      // student who typed 4.3 reads 4.3 back, not 4.29 (review, 2026-11-27).
      ...[2, 1].map(dp => ({
        answer_template: `{{+${FEWEST}.toFixed(${dp})}}`,
        response: `{{+${FEWEST}.toFixed(${dp})}} is how many batches there is enough {{${SHORT}}} for — `
          + 'the right ingredient. But the question asks for WHOLE batches, and a batch Priya cannot '
          + `finish is not a batch, so round down: {{Math.floor(${FEWEST})}}.`,
      })),
      ...[2, 1].map(dp => ({
        answer_template: `{{+${MOST}.toFixed(${dp})}}`,
        misconception: 'answered_a_different_quantity',
        response: `{{+${MOST}.toFixed(${dp})}} is how many batches there is enough {{${OTHER}}} for. But `
          + `Priya runs out of {{${SHORT}}} first, after {{+${FEWEST}.toFixed(${dp})}} batches, and only `
          + `whole batches count: {{Math.floor(${FEWEST})}}.`,
      })),
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
