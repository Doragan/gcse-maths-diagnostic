'use client'

import type { ScoreTrend } from '../../lib/exam/scoreTrend'
import { colors, font } from '../../lib/styles'

/** "5 Feb" — short enough for an axis label. */
function fmt(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`
}

const GRANULARITY_NOUN: Record<string, string> = { day: 'day', week: 'week', month: 'month' }

/**
 * Mini-exam scores over time.
 *
 * The x-axis is REAL TIME: a point sits where its papers actually were, so a
 * month off shows as a wide gap and a burst of practice shows as a cluster.
 * Spacing papers evenly would hide exactly that, implying steady work that never
 * happened.
 *
 * The cost of a time axis is crowding, so papers close together are averaged
 * into one point (see buildScoreTrend); a point's size shows how many it stands
 * for, and the caption says so whenever any averaging happened.
 *
 * Percentage is the comparable unit: papers are assembled to the same ~25-mark
 * budget, but the exact total still moves a mark or two either way.
 */
export default function ScoreTrend({ trend }: { trend: ScoreTrend }) {
  const { buckets, granularity, papers, latest, best, average, change, mixedTiers, averaged } = trend

  const W = 360, H = 110, padL = 30, padR = 12, padT = 12, padB = 20
  const times = buckets.map(b => new Date(b.date).getTime())
  const t0 = times[0]
  // Guard a zero span (every point at the same instant) so x() can't divide by
  // zero — buildScoreTrend makes this near-impossible, but a NaN here would
  // blank the whole chart.
  const span = Math.max(1, times[times.length - 1] - t0)

  const x = (t: number) => padL + ((t - t0) / span) * (W - padL - padR)
  // Always plot the full 0–100 range: a score is meaningful against the whole
  // scale, and auto-scaling would exaggerate small movements.
  const y = (v: number) => padT + (1 - v / 100) * (H - padT - padB)
  const line = buckets.map((b, i) => `${x(times[i]).toFixed(1)},${y(b.pct).toFixed(1)}`).join(' ')

  const changeColour = change > 0 ? colors.successText : change < 0 ? colors.dangerText : colors.textSecondary
  const changeLabel = change > 0 ? `+${change}` : `${change}`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <h3 style={{ fontSize: font.md, fontWeight: 700, margin: 0, color: colors.textPrimary }}>Score over time</h3>
        <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
          latest <strong style={{ color: colors.primary }}>{latest}%</strong>
          {' · '}<strong style={{ color: changeColour }}>{changeLabel} pts</strong>
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
        <polyline points={`${x(t0)},${y(0)} ${line} ${x(times[times.length - 1])},${y(0)}`} fill={colors.primary} fillOpacity="0.07" stroke="none" />
        <polyline points={line} fill="none" stroke={colors.primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Hollow marks a bucket containing a Higher paper, so a tier switch is
            visible on the line itself and not only in the caption. Radius grows
            a little with the number of papers averaged into the point. */}
        {buckets.map((b, i) => (
          <circle
            key={b.key}
            cx={x(times[i])} cy={y(b.pct)}
            r={Math.min(6, 3.5 + (b.count - 1) * 0.7)}
            fill={b.hasHigher ? colors.background : colors.primary}
            stroke={colors.primary} strokeWidth="1.5"
          />
        ))}
        <text x={padL} y={H - 5} textAnchor="start" fontSize="9" fill={colors.textHint}>{fmt(buckets[0].date)}</text>
        <text x={W - padR} y={H - 5} textAnchor="end" fontSize="9" fill={colors.textHint}>{fmt(buckets[buckets.length - 1].date)}</text>
      </svg>

      <p style={{ fontSize: '11px', color: colors.textHint, margin: '2px 0 0', lineHeight: 1.6 }}>
        Best {best}% · average {average}% across {papers} paper{papers === 1 ? '' : 's'}, placed by the date you sat them.
        {averaged && <> Papers in the same {GRANULARITY_NOUN[granularity]} are averaged into one point.</>}
        {' '}Practice scores, not predicted grades.
        {mixedTiers && (
          <> Hollow points include a Higher paper — they are harder, so a dip after switching tier is expected rather than a step backwards.</>
        )}
      </p>
    </div>
  )
}
