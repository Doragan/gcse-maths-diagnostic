/**
 * Checks the landing page's factual claims against the live database and the
 * code they're supposed to be derived from. READ-ONLY.
 *
 *   npx tsx scripts/check-landing-copy.ts
 *
 * Run it before pointing ad spend at the homepage. Exits non-zero on a failure
 * so it can gate a deploy.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * The same class of bug has now appeared three times on one page:
 *
 *   • "152 GCSE Maths skills" in four places, against 154 in the graph.
 *   • "practise all 154 skills", when 14 of them have no published question.
 *   • "every skill on the GCSE syllabus", same problem, caught before shipping.
 *
 * Each was a number or an absolute typed into copy, drifting from the thing it
 * described. A wrong figure on a maths product is a bad look, and it is the
 * kind of error nobody notices by re-reading — the copy stays put while the
 * database moves underneath it.
 *
 * So there are two kinds of check here. FACT checks confirm the database still
 * supports what the page says. SOURCE checks confirm the page derives its
 * numbers instead of hardcoding them, which is what stops the next one.
 */
import './env'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { skillsById } from '../lib/skills/skillGraph'
import { courses } from '../data/courses'
import { PLANS } from '../lib/studentPlans'

const LANDING = path.join(process.cwd(), 'app', 'Landing.tsx')
const source = fs.readFileSync(LANDING, 'utf8')

/**
 * Source with comments removed, for the checks that scan COPY.
 *
 * Without this the checker fails on its own documentation: the comment
 * explaining why the price was moved out of the columns contains "£1.49", and
 * was reported as a hardcoded price. A check that cries wolf over comments is
 * a check people stop running, so the distinction matters more than it looks.
 *
 * The claim-extracting checks deliberately keep the raw source, since they look
 * for code (`number: '700+'`) rather than prose.
 */
const copy = source
  .replace(/\/\*[\s\S]*?\*\//g, ' ')   // block and JSX comments
  .replace(/^\s*\/\/.*$/gm, ' ')       // line comments

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}
const sb = createClient(url, key)

type Result = { name: string; ok: boolean; detail: string }
const results: Result[] = []
const check = (name: string, ok: boolean, detail: string) => results.push({ name, ok, detail })

async function main() {
  // ── Facts the copy depends on ─────────────────────────────────────────────
  const { data: published } = await sb
    .from('questions').select('skill_ids, traps, parts, calculator').eq('is_published', true)
  const questions = published ?? []

  const covered = new Set<string>()
  let traps = 0
  for (const q of questions as any[]) {
    for (const s of q.skill_ids ?? []) covered.add(s)
    traps += (q.traps ?? []).length
    for (const p of q.parts ?? []) traps += (p.traps ?? []).length
  }

  check('the bank is not empty', questions.length > 0,
    `${questions.length} published questions`)

  // "700+ mistakes it can name" — the floor is READ FROM the copy, so raising
  // the claim automatically raises the bar this checks against.
  const claimed = source.match(/number:\s*'(\d+)\+'\s*,\s*label:\s*'mistakes it can name'/)
  if (!claimed) {
    check('the trap claim is still on the page', false,
      'could not find the "mistakes it can name" stat — was it renamed?')
  } else {
    const floor = parseInt(claimed[1], 10)
    check(`the bank has the ${floor}+ traps the page claims`, traps >= floor,
      `${traps} traps across published questions (claim: ${floor}+)`)
  }

  // The skill map shows every tracked skill, so "watch N skills" is fine — but
  // anything promising PRACTICE on all of them is not, while any has no question.
  const zero = Object.keys(skillsById).filter(s => !covered.has(s))
  const absolutes = [
    /practise\s+all\s+\$\{?SKILL_COUNT/i,
    /practise\s+all\s+\d+\s+skills/i,
    /every\s+skill\s+on\s+the\s+GCSE/i,
    /all\s+\d+\s+GCSE\s+skills/i,
  ].filter(re => re.test(copy))
  check('no copy promises practice on EVERY skill',
    zero.length === 0 || absolutes.length === 0,
    zero.length === 0
      ? 'every tracked skill has a question, so an absolute claim would be safe'
      : `${zero.length} skills have no published question` +
        (absolutes.length ? ` — and the copy makes an absolute claim: ${absolutes[0]}` : ', and the copy makes no absolute claim'))

  // Both tiers are offered on the page, so both must actually have questions.
  for (const id of ['gcse_foundation', 'gcse_higher']) {
    const tierSkills = courses.find(c => c.id === id)?.skills ?? []
    const withQuestions = tierSkills.filter(s => covered.has(s)).length
    check(`${id} has practisable questions`, withQuestions > 0,
      `${withQuestions} of ${tierSkills.length} skills have a published question`)
  }

  // The hero demo is server-rendered from the bank; an empty pool means the
  // page's main call to action renders its empty state to every visitor.
  const calcModes = new Set((questions as any[]).map(q => q.calculator))
  check('the hero demo has questions to draw from', questions.length >= 10,
    `${questions.length} published, calculator modes present: ${[...calcModes].join(', ')}`)

  // ── The page must DERIVE its numbers, not type them ────────────────────────
  // This is the check that would have caught "152" against 154.
  const skillCount = Object.keys(skillsById).length

  // Structural: the stats strip's skill figure must be the derived constant.
  // Checked by NAME rather than by looking for a number near the word "skills",
  // because the original bug — `number: '152', label: 'GCSE Maths skills'` —
  // puts the two far enough apart that a proximity regex sails straight past it.
  // That first version of this check passed on the very bug it was written for.
  const statsEntry = copy.match(/\{\s*number:\s*([^,]+),\s*label:\s*'GCSE Maths skills'\s*\}/)
  check('the skills stat is derived, not typed',
    Boolean(statsEntry && /SKILL_COUNT/.test(statsEntry[1])),
    statsEntry
      ? `stats strip renders: ${statsEntry[1].trim()}`
      : 'could not find the "GCSE Maths skills" stat — was it renamed?')

  // Sweep: any number literal in the copy CLOSE to the real skill count is
  // almost certainly a stale hand-typed version of it. Deliberately a window
  // rather than an equality test — a hardcoded 154 is correct today and wrong
  // the moment a skill is added, so it should be flagged too. Legitimate
  // unrelated figures (700+ traps, 10 questions a session) sit well outside it.
  const NEAR = 15
  const suspicious = [...copy.matchAll(/\b(\d{2,4})\b/g)]
    .map(m => parseInt(m[1], 10))
    .filter(n => Math.abs(n - skillCount) <= NEAR)
  check('no hand-typed skill count anywhere in the copy', suspicious.length === 0,
    suspicious.length === 0
      ? `nothing within ${NEAR} of the real count (${skillCount})`
      : `found ${[...new Set(suspicious)].join(', ')} — within ${NEAR} of the skill count (${skillCount}). Use SKILL_COUNT.`)

  const priceLiterals = [...copy.matchAll(/£\s?\d+(?:\.\d\d)?/g)].map(m => m[0])
  check('no hardcoded price in the copy', priceLiterals.length === 0,
    priceLiterals.length === 0
      ? 'the price comes from PLANS'
      : `hardcoded: ${priceLiterals.join(', ')} — use PLANS (monthly is ${PLANS.find(p => p.id === 'monthly')?.price})`)

  // ── Report ────────────────────────────────────────────────────────────────
  let failed = 0
  for (const r of results) {
    if (!r.ok) failed++
    console.log(`${r.ok ? '✓' : '✗'} ${r.name}`)
    if (r.detail) console.log(`    ${r.detail}`)
  }
  console.log(`\n${results.length - failed} passed, ${failed} failed`)
  if (failed > 0) {
    console.log('\nThe landing page is making a claim the data no longer supports.')
    // exitCode rather than exit(): process.exit() races the Supabase client's
    // open handles on Windows and prints a libuv assertion after an otherwise
    // clean report, which reads like the checker itself crashed.
    process.exitCode = 1
  }
}

main().catch(err => { console.error(err); process.exit(1) })
