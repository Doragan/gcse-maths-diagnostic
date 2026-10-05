'use client'

import { type TimelinePoint } from '../lib/teacherAnalytics'
import { colors, font } from '../lib/styles'

// dd/mm from an ISO yyyy-mm-dd
function fmt(d: string): string {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

/**
 * A small weekly line chart over `TimelinePoint`s. Extracted from
 * ClassMasteryTrend so the mastery series and the effort series are the same
 * chart with a different accessor — see ClassMasteryTrend / ClassEffortTrend.
 *
 * Hidden until there are ≥2 weeks with active students (a trend needs history).
 */
export default function WeeklySparkline({
  points,
  value,
  title,
  caption,
  nowPrefix,
  format = n => String(n),
  step = 5,
  stroke = colors.primary,
}: {
  points: TimelinePoint[]
  /** Which figure to plot. */
  value: (p: TimelinePoint) => number
  title: string
  caption: string
  /** Label before the latest figure, e.g. "now" or "this week". */
  nowPrefix: string
  /** Formats the y-axis ticks and the latest figure. */
  format?: (n: number) => string
  /** Axis maximum rounds up to a multiple of this. */
  step?: number
  stroke?: string
}) {
  if (points.filter(p => p.activeStudents > 0).length < 2) return null

  const W = 360, H = 96, padL = 30, padR = 10, padT = 10, padB = 18
  const vals = points.map(value)
  const maxV = Math.max(step, Math.ceil(Math.max(...vals) / step) * step)
  const x = (i: number) => padL + (i / (points.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - v / maxV) * (H - padT - padB)
  const line = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = vals[vals.length - 1]

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ fontSize: font.md, fontWeight: 700, margin: 0, color: colors.textPrimary }}>{title}</h3>
        <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
          {nowPrefix} <strong style={{ color: stroke }}>{format(last)}</strong>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 480, display: 'block', marginTop: 4 }} aria-hidden="true">
        {/* baseline + top gridline with y labels */}
        <line x1={padL} y1={y(0)} x2={W - padR} y2={y(0)} stroke={colors.border} />
        <line x1={padL} y1={y(maxV)} x2={W - padR} y2={y(maxV)} stroke={colors.cardAlt} />
        <text x={padL - 5} y={y(maxV) + 3} textAnchor="end" fontSize="9" fill={colors.textHint}>{format(maxV)}</text>
        <text x={padL - 5} y={y(0) + 3} textAnchor="end" fontSize="9" fill={colors.textHint}>{format(0)}</text>
        {/* faint fill + line */}
        <polyline points={`${padL},${y(0)} ${line} ${W - padR},${y(0)}`} fill={stroke} fillOpacity="0.07" stroke="none" />
        <polyline points={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(points.length - 1)} cy={y(last)} r="3" fill={stroke} />
        {/* x range labels */}
        <text x={padL} y={H - 5} textAnchor="start" fontSize="9" fill={colors.textHint}>{fmt(points[0].weekEnding)}</text>
        <text x={W - padR} y={H - 5} textAnchor="end" fontSize="9" fill={colors.textHint}>{fmt(points[points.length - 1].weekEnding)}</text>
      </svg>
      <p style={{ fontSize: '11px', color: colors.textHint, margin: '2px 0 0' }}>{caption}</p>
    </div>
  )
}
