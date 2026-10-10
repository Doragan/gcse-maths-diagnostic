import './env'
import { createClient } from '@supabase/supabase-js'
import { misconceptionsById } from '../data/misconceptions'

// Applies the new registry entry `rooted_instead_of_squared` to the traps in
// the bank that are genuinely it.
//
//   npx tsx scripts/tag-rooted-instead-of-squared.ts            dry run
//   npx tsx scripts/tag-rooted-instead-of-squared.ts --apply    write
//
// ── What counts, and what does not ───────────────────────────────────────────
//
// The discriminator is whether the student ACTIVELY performed the inverse
// operation, or merely failed to perform the required one. If the trap value
// is reachable by doing nothing, it is an omission and belongs to
// `omitted_a_final_step`, which is why the whole Pythagoras family stays where
// it is: "found c² and forgot to root" is a student who stopped, not one who
// has the relationship backwards.
//
// A sweep of all 765 traps (rendering every answer and trap over sampled draws
// and testing for a consistent power relationship, plus a text pass over the
// responses) found exactly three that survive that test. They are listed
// below with the reasoning, because two of them are judgement calls.
const MISCONCEPTION = 'rooted_instead_of_squared'

type Target = {
  id: string
  /** null for the top-level `traps` column, else the 0-based index into `parts`. */
  part: number | null
  answer_template: string
  /** What the trap is tagged as NOW — asserted, so a re-run cannot drift. */
  was: string | null
  why: string
}

const TARGETS: Target[] = [
  {
    // The trap this entry was created for. Given the radius, the student
    // rooted it. "Doing nothing" would give the radius itself — which is the
    // SIBLING trap, correctly tagged `omitted_a_final_step` — so reaching
    // √9 = 3 takes an active root in the wrong direction.
    id: '7d2e2920-f656-471e-af56-379adfdf8bcf',
    part: 0,
    answer_template: '{{Math.sqrt([9,16,25,4,16,9][sel])}}',
    was: null,
    why: 'rooted the given radius where k = r² had to be squared',
  },
  {
    // Re-tag, not a first tag. Part (b) computes k = x² + y²; this student
    // went on and rooted it, landing on the radius. `omitted_a_final_step` is
    // wrong for it in the plainest way — nothing was omitted, an extra inverse
    // was applied — and it is the same error as part (a)'s trap above, so
    // leaving the two differently tagged inside one question would make the
    // registry's first use inconsistent with itself.
    id: '7d2e2920-f656-471e-af56-379adfdf8bcf',
    part: 1,
    answer_template: '{{Math.sqrt(([3,6,5,8,9,7][sel]*[3,6,5,8,9,7][sel]+[4,8,12,15,12,24][sel]*[4,8,12,15,12,24][sel]))}}',
    was: 'omitted_a_final_step',
    why: 'rooted the correct k where the method only squares and adds',
  },
  {
    // The other direction, and the reason the entry is two-directional rather
    // than a note about circles: evaluate (a²)^½, and the student squared.
    // The authored response already names the error exactly — "a power of ½
    // means square root, not squaring".
    id: '27a0fc43-b290-409e-826a-c4866292cf02',
    part: null,
    answer_template: '{{a * a * a * a}}',
    was: null,
    why: 'squared where a power of ½ called for a root',
  },
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const apply = process.argv.includes('--apply')

  if (!misconceptionsById[MISCONCEPTION]) {
    throw new Error(`${MISCONCEPTION} is not in data/misconceptions.ts — add the entry first`)
  }

  // Group by question, since two targets share a row and must be written once.
  const byQuestion = new Map<string, Target[]>()
  for (const t of TARGETS) {
    if (!byQuestion.has(t.id)) byQuestion.set(t.id, [])
    byQuestion.get(t.id)!.push(t)
  }

  for (const [id, targets] of byQuestion) {
    const { data, error } = await supabase
      .from('questions').select('traps, parts, is_published, skill_ids').eq('id', id).single()
    if (error) throw error

    const traps = JSON.parse(JSON.stringify(data.traps ?? [])) as any[]
    const parts = JSON.parse(JSON.stringify(data.parts ?? [])) as any[]

    console.log(`\n── ${id}  [${data.skill_ids?.[0]}]  ${data.is_published ? 'published' : 'draft'}`)

    for (const t of targets) {
      const pool: any[] = t.part === null ? traps : (parts[t.part]?.traps ?? [])
      const matches = pool.filter(x => x.answer_template === t.answer_template)
      if (matches.length !== 1) {
        throw new Error(
          `${id} ${t.part === null ? '(top)' : `part ${t.part + 1}`}: expected exactly 1 trap with `
          + `answer_template "${t.answer_template}", found ${matches.length}`,
        )
      }
      const trap = matches[0]
      const current = trap.misconception ?? null
      if (current === MISCONCEPTION) {
        console.log(`   = ${t.part === null ? '(top)' : `part ${t.part + 1}`} already tagged — nothing to do`)
        continue
      }
      if (current !== t.was) {
        throw new Error(
          `${id} ${t.part === null ? '(top)' : `part ${t.part + 1}`}: expected existing tag `
          + `${t.was ?? '(untagged)'}, found ${current ?? '(untagged)'} — the bank has moved, re-check before writing`,
        )
      }
      trap.misconception = MISCONCEPTION
      console.log(`   ${t.part === null ? '(top)' : `part ${t.part + 1}`}  ${t.was ?? '(untagged)'} → ${MISCONCEPTION}`)
      console.log(`      trap: ${t.answer_template}`)
      console.log(`      why:  ${t.why}`)
    }

    if (!apply) continue

    // Only ever the trap column(s) — is_published is never in the payload, so
    // a draft cannot be published by running this.
    const payload: Record<string, unknown> = {}
    if (targets.some(t => t.part === null)) payload.traps = traps
    if (targets.some(t => t.part !== null)) payload.parts = parts
    const { error: upErr } = await supabase.from('questions').update(payload).eq('id', id)
    if (upErr) throw upErr
    console.log(`   written (${Object.keys(payload).join(', ')})`)
  }

  if (!apply) console.log('\ndry run — pass --apply to write')
}

main().catch(e => { console.error(e); process.exit(1) })
