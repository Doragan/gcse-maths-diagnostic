import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Column vector helper — renders  ⎛ top ⎞  inline in HTML.
//
// The bracket spans have no fixed height — the outer flex container uses the
// default align-items:stretch so they grow to exactly match the content height.
// border-radius:50% on the open side creates a proper curved ( ) shape at any size.
function colVec(top: string, bottom: string): string {
  const bracket = `border-top:1.5px solid #374151;border-bottom:1.5px solid #374151;width:7px;flex-shrink:0;box-sizing:border-box`
  return (
    `<span style="display:inline-flex;vertical-align:middle;margin:0 2px">` +
    `<span style="border-left:1.5px solid #374151;${bracket};border-radius:50% 0 0 50%"></span>` +
    `<span style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:3px 5px;line-height:1.3">` +
    `<span>${top}</span>` +
    `<span>${bottom}</span>` +
    `</span>` +
    `<span style="border-right:1.5px solid #374151;${bracket};border-radius:0 50% 50% 0"></span>` +
    `</span>`
  )
}

async function main() {
  const id = '34a7f426-97ba-4654-954c-3e756e56c7b7'

  const { data, error: fetchErr } = await supabase
    .from('questions')
    .select('question_template, explanation')
    .eq('id', id)
    .single()

  if (fetchErr || !data) {
    console.error('fetch failed:', fetchErr?.message)
    process.exit(1)
  }

  // Question template: replace inline (x, y) notation with column vector
  const questionTemplate =
    `<p>Vector <strong>a</strong> = ${colVec('{{3*k}}', '{{4*k}}')}</p>` +
    `<p>Find |<strong>a</strong>|, the magnitude of <strong>a</strong>.</p>`

  // Explanation: show the column vector at the start, then expand
  const explanation =
    `|<strong>a</strong>| = √(x² + y²)<br>` +
    `= √({{3*k}}² + {{4*k}}²)<br>` +
    `= √({{9*k*k}} + {{16*k*k}})<br>` +
    `= √{{25*k*k}}<br>` +
    `= {{5*k}}`

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ question_template: questionTemplate, explanation })
    .eq('id', id)

  if (updateErr) {
    console.error('update failed:', updateErr.message)
    process.exit(1)
  }

  console.log('✓  vectors  34a7f426  — column vector notation added')
  console.log('   a = (3k, 4k) inline → vertical column vector')
}

main()
