'use client'

import { colors, font, radius } from '../../lib/styles'

/**
 * Author control: how many METHOD marks this trap proves the student earned.
 *
 * Real mark schemes pay for a sound approach behind a wrong answer — 25% of the
 * marks on the 30 coded papers. Auto-grading cannot read working, but a trap
 * is an anticipated wrong answer, so a trap firing sometimes tells us exactly
 * how far the student got.
 *
 * Only the author can judge which kind of trap this is, because the bank holds
 * both in roughly equal number:
 *   "you added the coordinates but didn't halve them"  → sound method, pay M1
 *   "that is the area; the question asks for perimeter" → wrong method, pay 0
 *
 * Hence three settings, and the distinction between the first two matters:
 *   unset → the marks stay UNKNOWN and widen the score's uncertainty band
 *   0     → the author has ruled that this trap earns nothing; no uncertainty
 *   n     → confirmed method marks, added to the score
 */
export default function TrapMethodMarks({
  value,
  marks,
  onChange,
}: {
  value: number | undefined
  /** The part's total marks — bounds the choices. */
  marks: number
  onChange: (v: number | undefined) => void
}) {
  // At least one mark always needs the right answer, so method can never cover
  // the lot. A 1-mark part has no room for method at all.
  const ceiling = Math.max(0, Math.floor(marks) - 1)

  if (ceiling === 0) {
    return (
      <p style={hint}>
        A 1-mark part has no method marks to award — the mark <em>is</em> the answer.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <label style={{ fontSize: font.sm, color: colors.textSecondary }}>
        Method marks proved
      </label>
      <select
        value={value == null ? '' : String(value)}
        onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        style={{
          padding: '4px 8px', fontSize: font.sm, borderRadius: radius.sm,
          border: `1px solid ${colors.border}`, background: colors.background, color: colors.textPrimary,
        }}
      >
        <option value="">Not sure — leave uncertain</option>
        <option value="0">0 — wrong method, earns nothing</option>
        {Array.from({ length: ceiling }, (_, i) => i + 1).map(n => (
          <option key={n} value={n}>{n} — right method, slipped later</option>
        ))}
      </select>
      <span style={hint}>
        {value == null
          ? 'Counted as unknown: it widens the band around the exam score rather than adding to it.'
          : value === 0
            ? 'Scores zero, with no uncertainty — the approach itself was wrong.'
            : `Adds ${value} mark${value === 1 ? '' : 's'} to the exam score when this trap fires.`}
      </span>
    </div>
  )
}

const hint: React.CSSProperties = {
  fontSize: '11px', color: colors.textHint, margin: 0, lineHeight: 1.5, flex: 1, minWidth: 200,
}
