import './env'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const K = '#374151'

// Inline fraction helper — renders  num  over a horizontal bar over denom.
// Uses flex-column so the bar always fills the widest element.
// vertical-align:middle sits it neatly on the text baseline.
function frac(num: string, denom: string): string {
  const wrap  = `display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 3px`
  const top   = `border-bottom:1.5px solid ${K};padding:0 3px 2px;line-height:1.3;white-space:nowrap`
  const bot   = `padding:2px 3px 0;line-height:1.3;white-space:nowrap`
  return (
    `<span style="${wrap}">` +
    `<span style="${top}">${num}</span>` +
    `<span style="${bot}">${denom}</span>` +
    `</span>`
  )
}

async function main() {
  const id = '042fa99f-d9e1-4528-adf6-2f3ca756ac12'

  const explanation =
    // General form of the sine rule — static symbols, both sides as fractions
    `Sine rule: ${frac('a', 'sin(A)')} = ${frac('b', 'sin(B)')}<br>` +
    // Rearranged for b — trig ratio as fraction
    `b = a × ${frac('sin(B)', 'sin(A)')}<br>` +
    // Substituted values — parameterised trig ratio as fraction
    `= {{s}} × ${frac('sin({{B}}°)', 'sin({{A}}°)')}<br>` +
    // Computed answer
    `≈ {{round(s * Math.sin(B * Math.PI / 180) / Math.sin(A * Math.PI / 180), 2)}} cm`

  const { error } = await supabase
    .from('questions')
    .update({ explanation })
    .eq('id', id)

  if (error) {
    console.error('update failed:', error.message)
    process.exit(1)
  }

  console.log('✓  sine_rule  042fa99f  — explanation updated with inline fractions')
  console.log('   a/sin(A) = b/sin(B), sin(B)/sin(A), sin({{B}}°)/sin({{A}}°) all use frac()')
}

main()
