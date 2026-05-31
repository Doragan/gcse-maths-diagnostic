import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Trapezium diagram — 683e0245
//
// Current: height line at x=112, a/b labels also at x=113 → all aligned
// Fix: shift height line + right-angle marker + h label to x=135
//   so the dashed height is clearly offset from the side labels.
//
// Trapezium polygon: bottom (25,130)→(200,130), top (55,45)→(170,45)
// At x=135 the height line is well inside the shape on both levels.
//
// Changes:
//   line  x1/x2: 112 → 135
//   right-angle path: M112,122 L120,122 L120,130  →  M135,122 L143,122 L143,130
//   h label x: 122 → 145

async function main() {
  const id = '683e0245-2cbf-4b91-900f-a44a39f3bd03'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('question_template')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  let tpl = data.question_template

  // Dashed height line
  tpl = tpl.replace(
    'x1="112" y1="45" x2="112" y2="130"',
    'x1="135" y1="45" x2="135" y2="130"'
  )

  // Right-angle marker (8×8 square at bottom of line, opens to the right)
  tpl = tpl.replace(
    'M112,122 L120,122 L120,130',
    'M135,122 L143,122 L143,130'
  )

  // h label
  tpl = tpl.replace(
    'x="122" y="92"',
    'x="145" y="92"'
  )

  if (tpl === data.question_template) {
    console.error('no changes made — patterns not found')
    process.exit(1)
  }

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ question_template: tpl })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  trapezium  683e0245  — height line shifted right (x=112 → x=135)')
  console.log('   a/b labels stay at x=113 (centred on sides)')
  console.log('   h label shifted x=122 → x=145')
  console.log('   right-angle marker shifted accordingly')
}

main()
