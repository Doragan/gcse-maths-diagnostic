import './env'
import { createClient } from '@supabase/supabase-js'
import { misconceptionsById } from '../data/misconceptions'

// ─────────────────────────────────────────────────────────────────────────────
// Coverage and integrity report for misconception tagging.
//
//   npx tsx scripts/audit-misconceptions.ts            whole bank
//   npx tsx scripts/audit-misconceptions.ts --untagged list what is still untagged
//
// Two things it checks, and only one of them is a failure:
//
//   UNRESOLVED  a trap names an id that is not in data/misconceptions.ts. That
//               is a typo or a stale rename, and it degrades silently — the
//               trap still fires and the student still gets their explanation,
//               so nothing surfaces it except a count that never adds up.
//               EXIT 1.
//
//   UNTAGGED    a trap carries no id at all. Entirely normal. The vocabulary is
//               applied incrementally, and a trap that fits nothing existing is
//               meant to stay untagged rather than mint a one-off id.
// ─────────────────────────────────────────────────────────────────────────────

type Trap = { answer_template?: string; answer?: string; response?: string; misconception?: string | null }
type Q = { id: string; skill_ids: string[]; traps: Trap[] | null; parts: { traps?: Trap[] }[] | null; is_published: boolean }

async function main() {
  const showUntagged = process.argv.includes('--untagged')
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.from('questions').select('id, skill_ids, traps, parts, is_published')
  if (error) { console.error('query failed:', error.message); process.exit(1) }

  let total = 0, tagged = 0
  const unresolved: string[] = []
  const untagged: string[] = []
  const bySkill: Record<string, { total: number; tagged: number }> = {}
  const byId: Record<string, number> = {}

  for (const q of (data as Q[])) {
    const skill = q.skill_ids?.[0] ?? '(none)'
    const all: Trap[] = [...(q.traps ?? []), ...((q.parts ?? []).flatMap(p => p.traps ?? []))]
    for (const t of all) {
      total++
      const s = (bySkill[skill] ??= { total: 0, tagged: 0 })
      s.total++
      const id = t.misconception
      if (!id) {
        untagged.push(`${skill}\t${q.id.slice(0, 8)}\t${String(t.answer_template ?? t.answer ?? '').slice(0, 28)}`)
        continue
      }
      tagged++
      s.tagged++
      byId[id] = (byId[id] ?? 0) + 1
      if (!misconceptionsById[id]) {
        unresolved.push(`${q.id.slice(0, 8)} [${skill}] -> "${id}"`)
      }
    }
  }

  console.log(`traps: ${total}   tagged: ${tagged} (${Math.round((100 * tagged) / total)}%)   untagged: ${total - tagged}`)

  console.log('\nby skill (tagged / total), skills with any tagging first:')
  const rows = Object.entries(bySkill).sort((a, b) => (b[1].tagged - a[1].tagged) || (b[1].total - a[1].total))
  for (const [skill, s] of rows.slice(0, 14)) {
    if (s.tagged === 0 && rows.indexOf([skill, s] as never) > 8) continue
    console.log(`  ${skill.padEnd(26)} ${String(s.tagged).padStart(3)} / ${String(s.total).padStart(3)}`)
  }

  console.log('\nmisconceptions in use:')
  for (const [id, n] of Object.entries(byId).sort((a, b) => b[1] - a[1])) {
    const known = misconceptionsById[id] ? '' : '   <-- NOT IN REGISTRY'
    console.log(`  ${String(n).padStart(3)}  ${id}${known}`)
  }
  const unused = Object.keys(misconceptionsById).filter(id => !byId[id])
  if (unused.length) console.log('\nregistry entries not yet used:\n  ' + unused.join('\n  '))

  if (showUntagged) {
    console.log('\nuntagged traps:')
    for (const u of untagged.sort()) console.log('  ' + u)
  }

  if (unresolved.length) {
    console.log(`\n!! ${unresolved.length} trap(s) name an id that is not in the registry:`)
    for (const u of unresolved) console.log('   ' + u)
    process.exitCode = 1
  } else {
    console.log('\nAll tagged traps resolve against data/misconceptions.ts.')
  }
}

main()
