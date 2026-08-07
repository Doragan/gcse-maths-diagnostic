import './env'
import { createClient } from '@supabase/supabase-js'
import { bandedMarks, bandedMax, normalizeMarkBands, type MarkBand } from '../lib/questions/parts'

// Two published multi_blank "complete the diagram" parts were priced by SUMMING
// per-blank marks (3 blanks x 1 = 3), which over-rewards them — the exact case
// mark_bands exists for:
//
//   8e8c3a24 function machine — 3 marks vs n=10 coded parts at 1-2 (mean 1.2).
//                               The largest evidence sample in the bank.
//   f590056a Venn diagram      — 3 marks vs n=3 coded parts at 1-2.
//
// Band them like the existing precedent (60fd2421, a 6-blank two-way table
// banded to 3): partial credit for getting any blank right, full credit only
// for all of them. Top band 2 puts both inside the evidenced range.
//
// part.marks MUST equal the top band — normalizePart derives it that way and
// the harness fails the question otherwise, since the assembler reads
// part.marks while the runner scores from the blanks.

const BANDS: MarkBand[] = [
  { min_correct: 1, marks: 1 },
  { min_correct: 3, marks: 2 },
]

const TARGETS: [string, number, string][] = [
  ['8e8c3a24-c94f-45d2-85cb-dd425ad0bc6e', 0, 'function machine (A, B, C)'],
  ['f590056a-b4d2-4bfb-a190-98b033828233', 0, 'Venn diagram (A, B, C)'],
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  // The bands must survive the same normaliser the admin form runs, or an edit
  // in the UI would silently rewrite them.
  const norm = normalizeMarkBands(BANDS)
  if (!norm) throw new Error('normalizeMarkBands rejected the bands')
  if (bandedMax(norm) !== 2) throw new Error(`top band is ${bandedMax(norm)}, expected 2`)

  for (const [id, pi, what] of TARGETS) {
    const { data, error } = await supabase.from('questions').select('parts').eq('id', id).single()
    if (error) throw error
    const parts = JSON.parse(JSON.stringify(data.parts))
    const p = parts[pi]
    if (p.answer_type !== 'multi_blank') throw new Error(`${id}: part ${pi} is ${p.answer_type}, not multi_blank`)
    const nBlanks = (p.blanks ?? []).length
    if (nBlanks !== 3) throw new Error(`${id}: expected 3 blanks, found ${nBlanks}`)
    if (p.mark_bands) throw new Error(`${id}: already banded — ${JSON.stringify(p.mark_bands)}`)

    const wasMarks = p.marks
    p.mark_bands = norm
    p.marks = bandedMax(norm)

    // No band may demand more correct blanks than exist, and the scheme must be
    // monotonic — more right answers can never earn fewer marks.
    for (const b of norm) {
      if (b.min_correct > nBlanks) throw new Error(`${id}: band needs ${b.min_correct} of ${nBlanks} blanks`)
    }
    let prev = -1
    for (let k = 0; k <= nBlanks; k++) {
      const m = bandedMarks(norm, k)
      if (m < prev) throw new Error(`${id}: ${k} correct earns ${m}, fewer than ${k - 1} correct`)
      prev = m
    }
    if (bandedMarks(norm, 0) !== 0) throw new Error(`${id}: zero correct must earn 0`)
    if (bandedMarks(norm, nBlanks) !== p.marks) throw new Error(`${id}: all correct must earn the part's marks`)

    const { error: e2 } = await supabase.from('questions').update({ parts }).eq('id', id)
    if (e2) throw e2
    const ladder = Array.from({ length: nBlanks + 1 }, (_, k) => `${k}→${bandedMarks(norm, k)}`).join('  ')
    console.log(`  ${id.slice(0, 8)} ${what}: ${wasMarks} → ${p.marks} marks   [${ladder}]`)
  }
  console.log('\nDone. Re-run: npx tsx scripts/verify-question.ts --published')
}

main().catch(e => { console.error(e); process.exit(1) })
