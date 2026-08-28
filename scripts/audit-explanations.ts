import './env'
import { createClient } from '@supabase/supabase-js'
import { evaluateTemplate, generateValues } from '../lib/questions/paramEngine'

// ─────────────────────────────────────────────────────────────────────────────
// Render-check the fields audit-bank.ts does NOT cover: explanations and trap
// responses (question-level and per-part), across DRAWS parameter sets.
//   npx tsx scripts/audit-explanations.ts
// Read-only.
// ─────────────────────────────────────────────────────────────────────────────

const DRAWS = 25

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, skill_ids, parameters, explanation, traps, parts, is_published')
    .eq('is_published', true)
  if (error || !data) { console.error(error); process.exit(1) }

  const bad: string[] = []
  for (const q of data) {
    const parts: any[] = Array.isArray(q.parts) && q.parts.length ? q.parts : []
    const units = parts.length
      ? parts.map((p, i) => ({ expl: p.explanation, traps: p.traps ?? [], label: `part ${'abcdefgh'[i]}` }))
      : [{ expl: q.explanation, traps: q.traps ?? [], label: '' }]

    for (let i = 0; i < DRAWS; i++) {
      let vals: Record<string, number> = {}
      try { vals = generateValues((q.parameters ?? {}) as any) } catch {}
      for (const u of units) {
        const check = (tpl: string, what: string) => {
          let out = ''
          try { out = evaluateTemplate(tpl ?? '', vals) } catch { out = '[error threw]' }
          if (/\[error|undefined|NaN/.test(out)) {
            bad.push(`${q.id.slice(0, 8)} ${u.label} ${what} [${(q.skill_ids ?? []).join(',')}] → ${out.replace(/<[^>]+>/g, '').slice(0, 160)}`)
            return true
          }
          return false
        }
        if (check(u.expl, 'EXPLANATION')) { }
        for (const [ti, t] of (u.traps as any[]).entries()) check(t.response, `trap#${ti} response`)
      }
    }
  }
  const uniq = [...new Set(bad)]
  console.log(`${uniq.length ? '⚠' : '✓'} explanation/trap-response render failures: ${uniq.length}`)
  uniq.slice(0, 60).forEach(x => console.log('  ' + x))
}

main()
