import './env'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// ─────────────────────────────────────────────────────────────────────────────
// Three questions for the ratio investigation's sections 2–4, which the bank
// has nothing single-part for: one share known (not the total), a ratio as a
// fraction of the whole, and three people with a difference between two
// shares.
//
// Same rules as the other draft scripts: verify with the harness first, and
// INSERT only — a row that already exists is the reviewer's, edits and all.
//
//   npx tsx scripts/draft-ratio.ts            write + verify only
//   npx tsx scripts/draft-ratio.ts --insert   also insert as drafts
// ─────────────────────────────────────────────────────────────────────────────

const sel = { sel: { type: 'integer', min: 0, max: 5 } }

// ── Section 2: one share known ──────────────────────────────────────────────
// Six scenarios by index: [Amy's number, Ben's number, Ben's share]. Ben's
// share always divides by his number, and no trap renders as the answer.
const A2 = '[3,2,4,5,3,7][sel]'
const B2 = '[5,7,5,3,4,2][sel]'
const X2 = '[25,28,30,24,36,18][sel]'
const PART2 = `(${X2}/${B2})`

// ── Section 3: a ratio as a fraction ────────────────────────────────────────
// [red, blue]: every pair has no common factor, so every answer is already in
// its simplest form, and red/blue never equals red/(red + blue).
const A3 = '[2,3,4,3,5,2][sel]'
const B3 = '[7,5,5,4,3,3][sel]'

// ── Section 4: three people and a difference ────────────────────────────────
// [Amy, Ben, Cara, how much more Cara gets]. Cara always has more parts than
// Amy, and the difference divides by the gap.
const A4 = '[2,1,3,2,1,4][sel]'
const B4 = '[3,3,2,5,3,3][sel]'
const C4 = '[5,4,6,4,6,7][sel]'
const D4 = '[12,9,15,8,20,9][sel]'
const GAP4 = `(${C4}-${A4})`
const PART4 = `(${D4}/${GAP4})`

const base = {
  skill_ids: ['ratio'],
  kind: 'mastery',
  calculator: 'non_calc',
  is_published: false,
  parameters: sel,
}

const QUESTIONS = [
  {
    ...base,
    id: '1af11a98-9049-4937-b626-e1c01d18609f',
    difficulty: 2,
    question_type: 'numeric',
    answer_type: 'numeric',
    tolerance: 0.01,
    requires_simplest: false,
    question_template: `<p>Amy and Ben share some money in the ratio <strong>{{${A2}}} : {{${B2}}}</strong>.</p>`
      + `<p>Ben gets <strong>£{{${X2}}}</strong>.</p>`
      + '<p>How much does Amy get?</p>',
    answer_template: `£{{${A2}*${PART2}}}`,
    explanation: `Ben's £{{${X2}}} is his {{${B2}}} parts, so one part is £{{${X2}}} ÷ {{${B2}}} = £{{${PART2}}}.<br>`
      + `Amy has {{${A2}}} parts: {{${A2}}} × £{{${PART2}}} = <strong>£{{${A2}*${PART2}}}</strong>.`,
    traps: [
      {
        answer_template: `£{{${X2}+${A2}-${B2}}}`,
        misconception: 'added_instead_of_operating',
        response: `That keeps the gap between them at {{Math.abs(${A2}-${B2})}}, as if the ratio were `
          + `in pounds. It is in PARTS: Ben's £{{${X2}}} is {{${B2}}} parts, so one part is `
          + `£{{${PART2}}}, and Amy's {{${A2}}} parts are £{{${A2}*${PART2}}}.`,
      },
      {
        answer_template: `£{{(${A2}+${B2})*${PART2}}}`,
        misconception: 'answered_a_different_quantity',
        response: `That is the whole amount, Amy's share and Ben's together. Amy gets only her own `
          + `{{${A2}}} parts: {{${A2}}} × £{{${PART2}}} = £{{${A2}*${PART2}}}.`,
      },
      {
        answer_template: `£{{${PART2}}}`,
        misconception: 'stopped_at_an_intermediate',
        response: `That is one part — the right thing to find first. Amy has {{${A2}}} of them: `
          + `{{${A2}}} × £{{${PART2}}} = £{{${A2}*${PART2}}}.`,
      },
      {
        answer_template: `£{{${X2}/${A2}*${B2}}}`,
        misconception: 'ratio_order_reversed',
        response: `That divides Ben's share by Amy's number. Ben's £{{${X2}}} is HIS {{${B2}}} parts, `
          + `so divide by {{${B2}}}: one part is £{{${PART2}}}, and Amy gets £{{${A2}*${PART2}}}.`,
      },
    ],
  },
  {
    ...base,
    id: 'a99e08d4-0f23-49af-8c90-6ae67f2764b7',
    difficulty: 2,
    // question_type is the input style, not the answer form: fraction answers
    // are 'numeric' questions in the bank (16 of them), and 'fraction' is refused.
    question_type: 'numeric',
    answer_type: 'fraction',
    tolerance: null,
    requires_simplest: false,
    question_template: `<p>A bag holds red and blue counters in the ratio <strong>{{${A3}}} : {{${B3}}}</strong>.</p>`
      + '<p>What fraction of the counters are red?</p>',
    answer_template: `{{${A3}}}/{{${A3}+${B3}}}`,
    explanation: `{{${A3}}} : {{${B3}}} means {{${A3}}} red for every {{${B3}}} blue, so every group `
      + `of {{${A3}+${B3}}} counters has {{${A3}}} red ones.<br>`
      + `The red counters are <strong>{{${A3}}}/{{${A3}+${B3}}}</strong> of all the counters.`,
    traps: [
      {
        answer_template: `{{${A3}}}/{{${B3}}}`,
        misconception: 'part_used_as_whole',
        response: `{{${A3}}}/{{${B3}}} compares the red counters with the BLUE ones — it is the ratio `
          + `written as a fraction. A fraction of the counters is out of all of them: `
          + `{{${A3}}} + {{${B3}}} = {{${A3}+${B3}}}, so {{${A3}}}/{{${A3}+${B3}}}.`,
      },
      {
        answer_template: `{{${B3}}}/{{${A3}+${B3}}}`,
        misconception: 'answered_a_different_quantity',
        response: `That is the fraction that are blue. The red ones are the other {{${A3}}} of every `
          + `{{${A3}+${B3}}}: {{${A3}}}/{{${A3}+${B3}}}.`,
      },
      {
        answer_template: `{{${B3}}}/{{${A3}}}`,
        misconception: 'ratio_order_reversed',
        response: `That is blue compared with red, upside down. A fraction of the counters has all `
          + `of them on the bottom: {{${A3}}}/{{${A3}+${B3}}}.`,
      },
    ],
  },
  {
    ...base,
    id: '2755b440-c12c-4922-ae48-4b39c118f8eb',
    difficulty: 3,
    question_type: 'numeric',
    answer_type: 'numeric',
    tolerance: 0.01,
    requires_simplest: false,
    question_template: '<p>Amy, Ben and Cara share some money in the ratio '
      + `<strong>{{${A4}}} : {{${B4}}} : {{${C4}}}</strong>.</p>`
      + `<p>Cara gets <strong>£{{${D4}}}</strong> more than Amy.</p>`
      + '<p>How much does Ben get?</p>',
    answer_template: `£{{${B4}*${PART4}}}`,
    explanation: `Cara has {{${C4}}} parts and Amy {{${A4}}}, so Cara's extra is {{${C4}}} − {{${A4}}} `
      + `= {{${GAP4}}} parts.<br>`
      + `{{${GAP4}}} parts are £{{${D4}}}, so one part is £{{${D4}}} ÷ {{${GAP4}}} = £{{${PART4}}}.<br>`
      + `Ben has {{${B4}}} parts: {{${B4}}} × £{{${PART4}}} = <strong>£{{${B4}*${PART4}}}</strong>.`,
    traps: [
      {
        answer_template: `£{{${B4}*${D4}/(${A4}+${B4}+${C4})}}`,
        misconception: 'part_used_as_whole',
        response: `That shares the £{{${D4}}} out as if it were all the money. It is only the `
          + `difference — Cara's extra {{${GAP4}}} parts — so one part is £{{${D4}}} ÷ {{${GAP4}}} `
          + `= £{{${PART4}}}, and Ben gets £{{${B4}*${PART4}}}.`,
      },
      {
        answer_template: `£{{${B4}*${D4}}}`,
        response: `That makes the £{{${D4}}} one part. But Cara has {{${C4}}} parts and Amy `
          + `{{${A4}}}, so the difference is {{${GAP4}}} parts: one part is £{{${PART4}}}, and Ben `
          + `gets £{{${B4}*${PART4}}}.`,
      },
      {
        answer_template: `£{{${PART4}}}`,
        misconception: 'stopped_at_an_intermediate',
        response: `That is one part — the right thing to find first. Ben has {{${B4}}} of them: `
          + `{{${B4}}} × £{{${PART4}}} = £{{${B4}*${PART4}}}.`,
      },
      {
        answer_template: `£{{(${A4}+${B4}+${C4})*${PART4}}}`,
        misconception: 'answered_a_different_quantity',
        response: `That is all the money shared out. Ben gets only his own {{${B4}}} parts: `
          + `{{${B4}}} × £{{${PART4}}} = £{{${B4}*${PART4}}}.`,
      },
    ],
  },
]

async function main() {
  const out = 'scripts/_draft-ratio.json'
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
