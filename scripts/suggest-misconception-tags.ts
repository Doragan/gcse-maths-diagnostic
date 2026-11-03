import './env'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { misconceptions, misconceptionsById } from '../data/misconceptions'

// ─────────────────────────────────────────────────────────────────────────────
// Propose a misconception id for traps that have none, for a human to accept.
//
//   npx tsx scripts/suggest-misconception-tags.ts            propose (default)
//   npx tsx scripts/suggest-misconception-tags.ts --drafts   include unpublished
//   npx tsx scripts/suggest-misconception-tags.ts --apply    write accepted rows
//
// ── Why this exists ─────────────────────────────────────────────────────────
//
// A trap's `misconception` id stopped being an analytics nicety when the
// teacher's class-session and assignment panels began rendering it as "3 pupils
// divided the wrong way round". Measured 2026-11-03 over 289 published
// questions: 236 (82%) carry at least one authored trap, but only 150 (52%)
// carry a TAGGED one — 280 of 642 traps have an id. The diagnostic thinking is
// already done; what is missing is the shared label that lets it be counted.
//
// Coverage is also lopsided — Ratio and Proportion 76%, Algebra 39% — so the
// panel is useful in a ratio lesson and mostly empty in an algebra one.
//
// ── Why it does not just write the tags ─────────────────────────────────────
//
// Choosing an id is a judgement about what a student was thinking, and the
// vocabulary's own rules say a trap that fits nothing should stay null rather
// than be forced into the nearest entry. A wrong id is worse than no id: it
// puts a confident, specific, false diagnosis in front of a teacher mid-lesson,
// and it is counted, so it compounds. The matcher below is a filing clerk, not
// a judge.
//
// So this runs in two phases, and the gate between them is yours:
//
//   1. PROPOSE writes a review file. Nothing is written to the database.
//   2. APPLY reads that file back and writes ONLY the rows you marked.
//
// ── How a proposal is made ──────────────────────────────────────────────────
//
// RULE   a curated pattern matched the response text. These are written against
//        phrasing that actually occurs in the bank and are the ones worth
//        skimming rather than studying.
// WEAK   no rule matched; the id is the best lexical overlap with the entry's
//        name and description. Treat as a prompt to think, not a suggestion.
// (none) nothing scored above the floor. Most of these should stay null.
//
// Every row carries the three best alternatives so a reviewer can retag without
// going to look the vocabulary up.
// ─────────────────────────────────────────────────────────────────────────────

const APPLY = process.argv.includes('--apply')
const INCLUDE_DRAFTS = process.argv.includes('--drafts')
const REVIEW_FILE = 'scripts/_misconception-review.tsv'

/** Lexical score floor. Below this a WEAK proposal is not worth printing. */
const WEAK_FLOOR = 2

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

type Trap = { answer?: string; response?: string; misconception?: string | null; [k: string]: unknown }
type Row = { id: string; skill_ids: string[] | null; traps: Trap[] | null; is_published: boolean }

// ── Curated rules ───────────────────────────────────────────────────────────
//
// Ordered: the FIRST match wins, so the specific sits above the general. Each
// is written against response phrasing seen in the bank rather than invented,
// and deliberately errs toward not matching — a blank costs a reviewer a
// moment's thought, a wrong rule costs a teacher's trust in the panel.
const RULES: { id: string; test: RegExp }[] = [
  // Straight-line graphs: the clearest unused entry in the vocabulary.
  { id: 'confused_gradient_with_intercept', test: /gradient is the coefficient|not the y-intercept|y-intercept, not the gradient|swapped the gradient/i },
  { id: 'calculator_in_radians',            test: /radian|degree mode|calculator (is |)in the wrong mode/i },
  { id: 'used_a_poor_pi_estimate',          test: /\b3\.14\b(?!\d)|too rough a value for π|use the π key/i },
  { id: 'diameter_for_radius',              test: /diameter.*(radius|halve)|radius.*not the diameter|halve the diameter/i },
  { id: 'power_confused_with_multiply',     test: /means x × x|not x × 2|² means .* × |squared means multiplying by (two|2)/i },
  { id: 'rooted_instead_of_squared',        test: /square root(ed|) (it |)instead|should have squared, not rooted/i },
  { id: 'wrong_trig_ratio',                 test: /\b(sin|cos|tan)\b.*\b(instead of|rather than)\b.*\b(sin|cos|tan)\b|wrong trig(onometric|) ratio|SOHCAHTOA/i },
  { id: 'wrong_angle_rule',                 test: /angles (on a straight line|in a triangle|around a point)|co-interior|alternate angles|opposite angles|angle fact/i },
  { id: 'wrong_shape_formula',              test: /formula for a (different|)\s*(circle|triangle|rectangle|trapezium|cylinder|cone|sphere)|used the (area|perimeter|volume) formula for/i },
  { id: 'missed_a_dimension',               test: /left out (a|one) dimension|only two of the three|forgot the (height|depth|third)/i },
  { id: 'scale_factor_wrong_power',         test: /scale factor.*(squared|cubed)|k²|k³|area scale factor|volume scale factor/i },
  { id: 'simple_instead_of_compound',       test: /simple interest.*compound|compound.*not simple|each year on the (new|original) amount/i },
  { id: 'percentage_from_the_wrong_base',   test: /percentage of the (original|new).*not|wrong base|of the (increased|decreased) amount/i },
  { id: 'percent_treated_as_absolute',      test: /treated the percentage as|% as an amount|subtracted the percentage itself/i },
  { id: 'change_found_but_not_applied',     test: /found the (change|difference|increase|decrease).*(but|now) (apply|add|subtract)|that is the change, not the/i },
  { id: 'direct_instead_of_inverse',        test: /inverse proportion|as one goes up the other goes down|not directly proportional/i },
  { id: 'ratio_order_reversed',             test: /ratio.*(wrong|other) way round|order of the ratio|reversed the ratio/i },
  { id: 'part_used_as_whole',               test: /one part.*(not the whole|whole)|total number of parts|that is a part, not the total/i },
  { id: 'ratio_left_unsimplified',          test: /simplest form.*ratio|ratio.*simplif/i },
  { id: 'wrong_denominator',                test: /divided by the wrong total|out of the wrong|denominator should be/i },
  { id: 'used_only_one_branch',             test: /only one branch|both branches|other outcome too|add (both|the two) paths/i },
  { id: 'double_counted_the_overlap',       test: /double-?counted|counted .* twice|subtract the overlap|intersection twice/i },
  { id: 'fraction_operation_confused',      test: /invert(ed|) the fraction|reciprocal flips|keep, change, flip|multiply(ing|) when you should (add|divide)/i },
  { id: 'converted_with_the_wrong_factor',  test: /(÷|divide by|multiply by) ?(10|100|1000).*(instead|not)|wrong conversion factor/i },
  { id: 'unit_not_converted',               test: /convert .* (to|into) (the same|cm|m|mm|km|g|kg|ml|litres)|units are not the same|same units/i },
  { id: 'misread_the_scale',                test: /each (square|gridline|interval) (is|represents)|read the scale|axis goes up in/i },
  { id: 'used_the_stated_value_not_the_bound', test: /upper bound|lower bound|stated value, not/i },
  { id: 'bounds_wrong_direction',           test: /bounds? .* wrong (way|direction)|use the (upper|lower) bound (for|when)/i },
  { id: 'subtracted_in_the_wrong_order',    test: /subtract(ed|) .* (wrong|other) way round|take the smaller from the larger/i },
  { id: 'divided_the_wrong_way_round',      test: /divided? .* (wrong|other) way round|÷ .* not .* ÷|should be .* divided by/i },
  { id: 'multiplied_instead_of_divided',    test: /multiplied (it |)(instead of|rather than) dividing|needs ÷, not ×/i },
  { id: 'added_instead_of_operating',       test: /added .* instead of (multiplying|dividing|subtracting)|× sign means multiply/i },
  { id: 'averaged_the_rates',               test: /average of the (two |)(speeds|rates)|total distance ÷ total time|cannot average averages/i },
  { id: 'steps_in_wrong_order',             test: /(undo|inverse) .* (in the )?(reverse|opposite) order|wrong order of operations|BIDMAS|BODMAS/i },
  // `sign_error` was /sign|negative|minus/ and matched 38 of 70 rule hits,
  // swallowing "written it as an EQUATION" (answer_not_in_requested_form) and
  // "perpendicular gradients are the negative reciprocal" (a remembered fact,
  // not a slip). It now needs language about the sign ITSELF being wrong.
  { id: 'sign_error',                       test: /check (your|the) signs?\b|dropped (the|a) (minus|negative)|sign (slip|error)|lost the (minus|negative)/i },
  { id: 'misremembered_the_formula',        test: /misremember|the formula is actually|wrong formula|formula you (have |)used/i },
  { id: 'answer_not_in_requested_form',     test: /in terms of π|give your answer (as|in)|simplest form|to \d+ (decimal places?|significant figures?)|include one decimal place|rounded to the whole number|as an EQUATION|solve an INEQUALITY/i },
  { id: 'compared_unlike_quantities',       test: /compare(d|) (unlike|different)|not comparable|same (basis|units) before comparing/i },
  // The process failures. Last, because their phrasing is broad and they are
  // already the three commonest tags — a greedy rule here would swallow rows
  // that deserve a specific id.
  { id: 'answered_a_different_quantity',    test: /you (found|worked out|gave) the [a-z ]+, not the|that is the [a-z ]+, not the|question asks for the/i },
  { id: 'stopped_at_an_intermediate',       test: /intermediate|that is only (the|part)|you are nearly there|half ?way/i },
  { id: 'omitted_a_final_step',             test: /(now|still need to|don't forget to|remember to) (add|subtract|multiply|divide|round|convert)|last step|final step/i },
  { id: 'stopped_one_step_early',           test: /one (more|further) step|stopped (one step |)early/i },
]

/** Words too common in maths prose to carry signal in the lexical fallback. */
const STOP = new Set(['the','a','an','and','or','not','is','are','was','were','to','of','in','on','for','it','its','that','this','you','your','have','has','with','by','as','be','but','so','if','then','than','from','at','into','out','up','down','one','two','both','each','same','use','used','using','find','found','work','worked','answer','question','number','value','values','instead','rather','when','which','what','their','they','them','there','here','should','would','could','need','needs','needed','give','given','gives','check','remember','looks','like','nearly','only','just','more','less','other','another','first','last','next','step','steps'])

const tokens = (s: string) =>
  s.toLowerCase().replace(/\{\{[\s\S]*?\}\}/g, ' ').replace(/<[^>]*>/g, ' ')
    .split(/[^a-z]+/).filter(w => w.length > 2 && !STOP.has(w))

const VOCAB = misconceptions.map(m => ({ id: m.id, bag: new Set(tokens(`${m.name} ${m.description}`)) }))

function lexical(text: string): { id: string; score: number }[] {
  const bag = tokens(text)
  return VOCAB
    .map(v => ({ id: v.id, score: bag.reduce((n, w) => n + (v.bag.has(w) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
}

function propose(trap: Trap): { id: string; how: 'RULE' | 'WEAK' | ''; alts: string[] } {
  const text = `${trap.response ?? ''} ${trap.answer ?? ''}`
  const ranked = lexical(text)
  const alts = ranked.filter(r => r.score > 0).slice(0, 3).map(r => r.id)
  for (const r of RULES) if (r.test.test(text)) return { id: r.id, how: 'RULE', alts }
  if (ranked[0] && ranked[0].score >= WEAK_FLOOR) return { id: ranked[0].id, how: 'WEAK', alts }
  return { id: '', how: '', alts }
}

/** Tabs and newlines would break the TSV; responses contain both. */
const flat = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim()

async function load(): Promise<Row[]> {
  let q = supabase.from('questions').select('id, skill_ids, traps, is_published')
  if (!INCLUDE_DRAFTS) q = q.eq('is_published', true)
  const { data, error } = await q
  if (error) throw new Error(`load failed: ${error.message}`)
  return (data ?? []) as Row[]
}

// ── Phase 1: propose ────────────────────────────────────────────────────────
async function doPropose() {
  const rows = await load()
  const out: string[] = [
    '# Review file. Edit the DECIDE column, then: npx tsx scripts/suggest-misconception-tags.ts --apply',
    '#   leave blank to SKIP (stays untagged — the right answer when nothing fits)',
    '#   y            accept PROPOSED',
    '#   <id>         use that id instead',
    '#   n            never mind — same as blank, but says you looked',
    '# Lines starting # are ignored. ALT1-3 are the next best lexical matches.',
    ['DECIDE', 'HOW', 'PROPOSED', 'QUESTION', 'TRAP', 'ANSWER', 'RESPONSE', 'ALT1', 'ALT2', 'ALT3'].join('\t'),
  ]

  let untagged = 0, ruled = 0, weak = 0, blank = 0
  for (const r of rows) {
    const traps = r.traps ?? []
    traps.forEach((t, i) => {
      if (!t || t.misconception) return
      untagged++
      const p = propose(t)
      if (p.how === 'RULE') ruled++; else if (p.how === 'WEAK') weak++; else blank++
      out.push([
        '', p.how, p.id, r.id, String(i),
        flat(t.answer).slice(0, 40), flat(t.response).slice(0, 160),
        p.alts[0] ?? '', p.alts[1] ?? '', p.alts[2] ?? '',
      ].join('\t'))
    })
  }

  writeFileSync(REVIEW_FILE, out.join('\n') + '\n', 'utf8')
  console.log(`scanned ${rows.length} questions${INCLUDE_DRAFTS ? ' (incl. drafts)' : ''}`)
  console.log(`untagged traps: ${untagged}`)
  console.log(`  RULE proposals ${ruled}`)
  console.log(`  WEAK proposals ${weak}`)
  console.log(`  no proposal    ${blank}`)
  console.log(`\nwrote ${REVIEW_FILE} — nothing has been written to the database.`)
  console.log('Edit the DECIDE column, then re-run with --apply.')
}

// ── Phase 2: apply ──────────────────────────────────────────────────────────
async function doApply() {
  if (!existsSync(REVIEW_FILE)) {
    console.error(`no ${REVIEW_FILE} — run without --apply first.`); process.exit(1)
  }
  const lines = readFileSync(REVIEW_FILE, 'utf8').split(/\r?\n/)
    .filter(l => l.trim() && !l.startsWith('#'))
  const header = lines.shift()!.split('\t')
  if (header[0] !== 'DECIDE') { console.error('unexpected header — regenerate the review file.'); process.exit(1) }

  // decision -> id, validated against the vocabulary before anything is written
  type Want = { questionId: string; index: number; id: string; answer: string }
  const wants: Want[] = []
  let skipped = 0
  for (const line of lines) {
    const c = line.split('\t')
    const decide = (c[0] ?? '').trim()
    if (!decide || decide.toLowerCase() === 'n') { skipped++; continue }
    const id = decide.toLowerCase() === 'y' ? c[2] : decide
    if (!misconceptionsById[id]) {
      console.error(`unknown misconception id ${JSON.stringify(id)} on question ${c[3]} trap ${c[4]} — fix the review file.`)
      process.exit(1)
    }
    wants.push({ questionId: c[3], index: Number(c[4]), id, answer: c[5] ?? '' })
  }
  if (wants.length === 0) { console.log(`nothing marked (${skipped} skipped) — no writes.`); return }

  // Re-read from the database rather than trusting the file's snapshot: the
  // bank may have moved since the review file was written, and these indexes
  // are positional.
  const rows = await load()
  const byId = new Map(rows.map(r => [r.id, r]))

  const byQuestion = new Map<string, Want[]>()
  for (const w of wants) byQuestion.set(w.questionId, [...(byQuestion.get(w.questionId) ?? []), w])

  let written = 0, stale = 0, already = 0
  for (const [questionId, ws] of byQuestion) {
    const row = byId.get(questionId)
    if (!row) { console.warn(`  SKIP ${questionId}: no longer in scope`); stale += ws.length; continue }
    const traps = (row.traps ?? []).map(t => ({ ...t }))

    let touched = 0
    for (const w of ws) {
      const t = traps[w.index]
      if (!t) { console.warn(`  SKIP ${questionId}[${w.index}]: trap no longer exists`); stale++; continue }
      if (t.misconception) { already++; continue }
      // Positional indexes are only safe if the trap is still the same one.
      if (flat(t.answer).slice(0, 40) !== w.answer) {
        console.warn(`  SKIP ${questionId}[${w.index}]: trap changed since review (answer differs)`); stale++; continue
      }
      t.misconception = w.id
      touched++
    }
    if (touched === 0) continue

    const { error } = await supabase.from('questions').update({ traps }).eq('id', questionId)
    if (error) { console.error(`  FAIL ${questionId}: ${error.message}`); continue }
    written += touched
  }

  console.log(`marked ${wants.length}, written ${written}, already tagged ${already}, stale ${stale}, skipped ${skipped}`)
  if (written !== wants.length - already - stale) console.warn('⚠ count mismatch — check the output above.')
}

async function main() { await (APPLY ? doApply() : doPropose()) }
main()
