'use client'

import { type TimelinePoint } from '../lib/teacherAnalytics'
import { colors, font } from '../lib/styles'

// dd/mm from an ISO yyyy-mm-dd
function fmt(d: string): string {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

/**
 * Class mastery-over-time: a small line chart of the weekly average
 * curriculum-mastery %. Hidden until there are ≥2 weeks with active students
 * (a trend needs history).
 */
export default function ClassMasteryTrend({
  points,
  title = 'Mastery over time',
  caption = 'Class average % of the curriculum mastered, by week. Fills out as the class builds up history.',
}: {
  points: TimelinePoint[]
  title?: string
  caption?: string
}) {
  if (points.filter(p => p.activeStudents > 0).length < 2) return null

  const W = 360, H = 96, padL = 30, padR = 10, padT = 10, padB = 18
  const maxV = Math.max(5, Math.ceil(Math.max(...points.map(p => p.masteryPct)) / 5) * 5)
  const x = (i: number) => padL + (i / (points.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - v / maxV) * (H - padT - padB)
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.masteryPct).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ fontSize: font.md, fontWeight: 700, margin: 0, color: colors.textPrimary }}>{title}</h3>
        <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
          now <strong style={{ color: colors.primary }}>{last.masteryPct}%</strong>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 480, display: 'block', marginTop: 4 }} aria-hidden="true">
        {/* baseline + top gridline with y labels */}
        <line x1={padL} y1={y(0)} x2={W - padR} y2={y(0)} stroke={colors.border} />
        <line x1={padL} y1={y(maxV)} x2={W - padR} y2={y(maxV)} stroke={colors.cardAlt} />
        <text x={padL - 5} y={y(maxV) + 3} textAnchor="end" fontSize="9" fill={colors.textHint}>{maxV}%</text>
        <text x={padL - 5} y={y(0) + 3} textAnchor="end" fontSize="9" fill={colors.textHint}>0%</text>
        {/* faint fill + line */}
        <polyline points={`${padL},${y(0)} ${line} ${W - padR},${y(0)}`} fill={colors.primary} fillOpacity="0.07" stroke="none" />
        <polyline points={line} fill="none" stroke={colors.primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(points.length - 1)} cy={y(last.masteryPct)} r="3" fill={colors.primary} />
        {/* x range labels */}
        <text x={padL} y={H - 5} textAnchor="start" fontSize="9" fill={colors.textHint}>{fmt(points[0].weekEnding)}</text>
        <text x={W - padR} y={H - 5} textAnchor="end" fontSize="9" fill={colors.textHint}>{fmt(last.weekEnding)}</text>
      </svg>
      <p style={{ fontSize: '11px', color: colors.textHint, margin: '2px 0 0' }}>{caption}</p>
    </div>
  )
}
