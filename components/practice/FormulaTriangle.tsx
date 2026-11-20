import { colors, font } from '../../lib/styles'

/**
 * A formula triangle — `top` over `left` and `right` — drawn out, with the
 * three ways of covering one letter beside it and the formula each one gives.
 *
 * Static on purpose: it is a thing to remember, so it should look the same in
 * a print, a screenshot and a student's notes. Side by side means multiply,
 * one over the other means divide, and the three covered copies say so
 * without a rule to learn.
 */

type Part = 'top' | 'left' | 'right'

// One triangle in a 120 × 104 box: apex at the top, a line across half way up,
// and a line down from the middle of that to the base.
const REGIONS: Record<Part, string> = {
  top: '60,6 33,52 87,52',
  left: '33,52 60,52 60,98 6,98',
  right: '60,52 87,52 114,98 60,98',
}
const SPOT: Record<Part, [number, number]> = { top: [60, 42], left: [43, 86], right: [77, 86] }

function Triangle({ letters, cover, size }: {
  letters: Record<Part, string>
  cover?: Part
  size: number
}) {
  return (
    <svg viewBox="0 0 120 104" width={size} height={(size * 104) / 120} aria-hidden="true">
      {cover && <polygon points={REGIONS[cover]} fill={colors.primary} fillOpacity={0.18} />}
      <polygon points="60,6 6,98 114,98" fill="none" stroke="currentColor" strokeWidth={2.5}
        strokeLinejoin="round" />
      <line x1={33} y1={52} x2={87} y2={52} stroke="currentColor" strokeWidth={2} />
      <line x1={60} y1={52} x2={60} y2={98} stroke="currentColor" strokeWidth={2} />
      {(Object.keys(SPOT) as Part[]).map(p => (
        <text key={p} x={SPOT[p][0]} y={SPOT[p][1]} textAnchor="middle" fontSize={22}
          fontWeight={700} fill={p === cover ? colors.primary : 'currentColor'}>
          {letters[p]}
        </text>
      ))}
    </svg>
  )
}

export default function FormulaTriangle({ top, left, right }: { top: string; left: string; right: string }) {
  const letters = { top, left, right }
  const covers: { part: Part; formula: string }[] = [
    { part: 'top', formula: `${top} = ${left} × ${right}` },
    { part: 'left', formula: `${left} = ${top} ÷ ${right}` },
    { part: 'right', formula: `${right} = ${top} ÷ ${left}` },
  ]
  return (
    <figure
      role="img"
      aria-label={`A formula triangle: ${top} on top, ${left} and ${right} underneath. `
        + covers.map(c => c.formula).join(', ') + '.'}
      style={{ margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16, color: colors.textPrimary }}
    >
      <Triangle letters={letters} size={132} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {covers.map(c => (
          <div key={c.part} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Triangle letters={letters} cover={c.part} size={84} />
            <span style={{ fontSize: font.sm, color: colors.textSecondary }}>cover {letters[c.part]}</span>
            <span style={{ fontSize: font.base, fontWeight: 600 }}>{c.formula}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}
