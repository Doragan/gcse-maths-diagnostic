'use client'

import type { ScoreTrend } from '../../lib/exam/scoreTrend'
import { colors, font } from '../../lib/styles'

/** "5 Feb" — short enough for an axis label. */
function fmt(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`
}

/**
 * Mini-exam scores over time: one point per paper sat, in the order they were
 * sat, as a percentage.
 *
 * The x-axis is paper SEQUENCE, not calendar time. Free students get one paper a
 * month, so real dates would either bunch into a cluster or stretch a two-paper
 * history across a year of empty axis; "your papers in order" is what a student
 * actually wants to read. The end labels carry the dates.
 *
 * Percentage is the comparable unit: papers are assembled to the same ~25-mark
 * budget, but the exact total still moves a mark or two either way.
 */
export default function ScoreTrend({ trend }: { trend: ScoreTrend }) {
  const { points, latest, best, average, change, mixedTiers } = trend

  const W = 360, H = 110, padL = 30, padR = 12, padT = 12, padB = 20
  // Always plot the full 0–100 range: a student's score is meaningful against
  // the whole scale, and auto-scaling would exaggerate small movements.
  const x = (i: number) => padL + (i / (points.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - v / 100) * (H - padT - padB)
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(' ')

  const changeColour = change > 0 ? colors.successText : change < 0 ? colors.dangerText : colors.textSecondary
  const changeLabel = change > 0 ? `+${change}` : `${change}`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <h3 style={{ fontSize: font.md, fontWeight: 700, margin: 0, color: colors.textPrimary }}>Score over time</h3>
        <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
          latest <strong style={{ color: colors.primary }}>{latest}%</strong>
          {points.length > 1 && <> · <strong style={{ color: changeColour }}>{changeLabel} pts</strong></>}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 480, display: 'block', marginTop: 4 }} aria-hidden="true">
        {/* 0 / 50 / 100 gridlines — a fixed scale, so movement is honest */}
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke={v === 0 ? colors.border : colors.cardAlt} />
            <text x={padL - 5} y={y(v) + 3} textAnchor="end" fontSize="9" fill={colors.textHint}>{v}%</text>
          </g>
        ))}
        <polyline points={`${padL},${y(0)} ${line} ${W - padR},${y(0)}`} fill={colors.primary} fillOpacity="0.07" stroke="none" />
        <polyline points={line} fill="none" stroke={colors.primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Higher papers are drawn hollow so a tier switch is visible on the line
            itself, not just in the caption below. */}
        {points.map((p, i) => (
          <circle
            key={p.id}
            cx={x(i)} cy={y(p.pct)} r="3.5"
            fill={p.tier === 'higher' ? colors.background : colors.primary}
            stroke={colors.primary} strokeWidth="1.5"
          />
        ))}
        <text x={padL} y={H - 5} textAnchor="start" fontSize="9" fill={colors.textHint}>{fmt(points[0].date)}</text>
        <text x={W - padR} y={H - 5} textAnchor="end" fontSize="9" fill={colors.textHint}>{fmt(points[points.length - 1].date)}</text>
      </svg>

      <p style={{ fontSize: '11px', color: colors.textHint, margin: '2px 0 0', lineHeight: 1.6 }}>
        Best {best}% · average {average}% across {points.length} papers, in the order you sat them.
        {' '}Practice scores, not predicted grades.
        {mixedTiers && (
          <> Hollow points are Higher papers — they are harder, so a dip after switching tier is expected rather than a step backwards.</>
        )}
      </p>
    </div>
  )
}
