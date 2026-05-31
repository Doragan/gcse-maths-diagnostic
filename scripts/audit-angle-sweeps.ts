import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Partial IDs to match — fetch all questions with arc paths, filter client-side
const partials: Record<string, string> = {
  '1761d75b': 'corresponding_angles',
  'c0c02057': 'exterior_angles',
  '6bc803e1': 'alternate_segment',
  '3a59b15a': 'same_segment',
}

async function main() {
  const { data: allRows, error: fetchErr } = await supabase
    .from('questions')
    .select('id, question_template')

  if (fetchErr || !allRows) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  // Filter to rows whose ID starts with one of our partials
  const matches = allRows.filter(row =>
    Object.keys(partials).some(p => row.id.startsWith(p))
  )

  if (matches.length === 0) {
    console.log('No matching rows found. IDs in DB (first 10):')
    allRows.slice(0, 10).forEach(r => console.log(' ', r.id))
    return
  }

  for (const data of matches) {
    const label = Object.entries(partials).find(([p]) => data.id.startsWith(p))?.[1] ?? '?'
    console.log(`\n=== ${label} (${data.id}) ===`)

    // Extract all arc paths
    const paths = [...data.question_template.matchAll(/<path[^>]*d="([^"]+)"[^>]*>/g)]
    if (paths.length === 0) {
      console.log('  (no <path> elements)')
    }
    for (const p of paths) {
      const d = p[1]
      const hasArc = /[Aa]/.test(d)
      // Parse sweep flag from arc commands: A rx ry x-rot large-arc sweep ex ey
      const sweeps = [...d.matchAll(/[Aa][^Aa]*/g)].map(m => {
        const nums = m[0].match(/[\d.eE+-]+/g) ?? []
        // Arc params: rx, ry, x-rotation, large-arc-flag, sweep-flag, x, y
        return { arc: m[0].trim().slice(0, 40), sweepFlag: nums[4] ?? '?' }
      })
      if (hasArc) {
        for (const s of sweeps) {
          console.log(`  sweep=${s.sweepFlag}  arc: ${s.arc}`)
        }
      } else {
        console.log('  (non-arc path):', d.slice(0, 60))
      }
    }

    // Also print text elements to check for literal labels vs {{expr}}
    const texts = [...data.question_template.matchAll(/<text[^>]*>([^<]+)<\/text>/g)]
    const labelTexts = texts.filter(t => /[a-zαβθ°]/.test(t[1]))
    if (labelTexts.length) {
      console.log('  labels:', labelTexts.map(t => JSON.stringify(t[1])).join(', '))
    }
  }
}

main()
