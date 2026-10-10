import './env'
import { createClient } from '@supabase/supabase-js'
import { misconceptionsById } from '../data/misconceptions'

// ca17b522 — "Rearrange y = ax² + b to make x the subject", answer √((y − b)/a).
//
//   npx tsx scripts/retag-rearranging-formulae-omission.ts            dry run
//   npx tsx scripts/retag-rearranging-formulae-omission.ts --apply    write
//
// Its first trap, (y − b)/a, is tagged `power_confused_with_multiply`. That
// entry means "treated an index as a multiplier or the reverse — read x² as
// 2x", and a student who did THAT would answer something with a 2 in it. This
// student did no such thing: they subtracted b, divided by a, reached
// x² = (y − b)/a and stopped. The authored response says exactly that ("You
// have found x², not x — take the square root of the whole expression"), and
// the trap carries method_marks: 1, which is the author crediting algebra that
// was right as far as it went.
//
// That is `omitted_a_final_step` — "the working is right, but one required
// operation or component is missing" — whose description already cites the
// square root as its example.
//
// Note what this is NOT: it is not `rooted_instead_of_squared`, the entry this
// branch adds. The discriminator there is whether the student ACTIVELY applied
// the inverse operation. Here nothing was applied; the root was simply never
// taken. Getting this one wrong in the other direction would blur the very
// boundary the new entry depends on, so it is fixed here rather than absorbed.
const ID = 'ca17b522-f6a3-4d99-8f0a-1f3357485f44'
const ANSWER_TEMPLATE = '(y-{{b}})/{{a}}'
const FROM = 'power_confused_with_multiply'
const TO = 'omitted_a_final_step'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const apply = process.argv.includes('--apply')

  if (!misconceptionsById[TO]) throw new Error(`${TO} is not in data/misconceptions.ts`)

  const { data, error } = await supabase
    .from('questions').select('traps, is_published, skill_ids, question_template').eq('id', ID).single()
  if (error) throw error

  const traps = JSON.parse(JSON.stringify(data.traps ?? [])) as any[]
  const matches = traps.filter(t => t.answer_template === ANSWER_TEMPLATE)
  if (matches.length !== 1) {
    throw new Error(`expected exactly 1 trap with answer_template "${ANSWER_TEMPLATE}", found ${matches.length}`)
  }

  const trap = matches[0]
  const current = trap.misconception ?? null
  console.log(`── ${ID}  [${data.skill_ids?.[0]}]  ${data.is_published ? 'published' : 'draft'}`)
  console.log(`   ${String(data.question_template).replace(/<[^>]+>/g, '').trim()}`)

  if (current === TO) {
    console.log(`   = already ${TO} — nothing to do`)
    return
  }
  if (current !== FROM) {
    throw new Error(`expected existing tag ${FROM}, found ${current ?? '(untagged)'} — re-check before writing`)
  }

  trap.misconception = TO
  console.log(`   trap: ${ANSWER_TEMPLATE}   (method_marks: ${trap.method_marks})`)
  console.log(`   ${FROM} → ${TO}`)

  if (!apply) { console.log('\ndry run — pass --apply to write'); return }

  // Only the trap column — is_published is never in the payload.
  const { error: upErr } = await supabase.from('questions').update({ traps }).eq('id', ID)
  if (upErr) throw upErr
  console.log('   written (traps)')
}

main().catch(e => { console.error(e); process.exit(1) })
