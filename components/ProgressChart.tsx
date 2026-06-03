'use client'

import { colors, font } from '../lib/styles'
import type { ProgressSeries } from '../lib/skills/progressSeries'

// Lightweight hand-rolled SVG chart (no charting dependency). Always draws the
// "skills mastered" line; premium accounts additionally get a cumulative
// accuracy line and faint per-period activity bars.

type Props = {
  series: ProgressSeries
  showAccuracy?: boolean
  showActivity?: boolean
}

// Fixed coordinate space — the SVG scales responsively via viewBox.
const W = 600
const H = 220
const PAD = { top: 14, right: 16, bottom: 26, left: 30 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

const MASTERED_COLOR = colors.primary
const ACCURACY_COLOR = colors.success
const ACTIVITY_COLOR = colors.primary

/** Round a max value up to a "nice" axis ceiling (1,2,5 × 10ⁿ-ish). */
function niceCeil(value: number): number {
  if (value <= 1) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const frac = value / pow
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10
  return niceFrac * pow
}

export default function ProgressChart({ series, showAccuracy, showActivity }: Props) {
  const { points } = series
  const n = points.length
  const yMax = niceCeil(Math.max(1, series.maxMastered))

  const x = (i: number) => (n <= 1 ? PAD.left + PLOT_W / 2 : PAD.left + (i / (n - 1)) * PLOT_W)
  const yMastered = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H
  const yAccuracy = (v: number) => PAD.top + PLOT_H - (v / 100) * PLOT_H

  const masteredPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yMastered(p.mastered).toFixed(1)}`)
    .join(' ')

  // Accuracy line only across points that actually have an accuracy value.
  const accuracyPath = points
    .map((p, i) => (p.accuracy === null ? null : `${x(i).toFixed(1)} ${yAccuracy(p.accuracy).toFixed(1)}`))
    .filter(Boolean)
    .map((coord, i) => `${i === 0 ? 'M' : 'L'} ${coord}`)
    .join(' ')

  const activityMax = Math.max(1, series.maxActivity)
  const barW = n > 0 ? Math.min(18, (PLOT_W / n) * 0.5) : 0

  // X labels: show first, last, and a sparse middle subset to avoid crowding.
  const labelEvery = Math.max(1, Math.ceil(n / 5))
  const showLabel = (i: number) => i === 0 || i === n - 1 || i % labelEvery === 0

  // Y gridlines for the mastered scale.
  const gridLines = [0, 0.5, 1].map(f => Math.round(yMax * f))

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Progress over time chart"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Gridlines + y labels */}
        {gridLines.map((g, i) => {
          const gy = yMastered(g)
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={gy} x2={W - PAD.right} y2={gy}
                stroke={colors.border} strokeWidth={1}
              />
              <text
                x={PAD.left - 6} y={gy + 3}
                textAnchor="end" fontSize={10} fill={colors.textHint}
              >
                {g}
              </text>
            </g>
          )
        })}

        {/* Activity bars (premium) */}
        {showActivity && points.map((p, i) => {
          if (p.activity === 0) return null
          const barH = (p.activity / activityMax) * PLOT_H
          return (
            <rect
              key={`bar-${i}`}
              x={x(i) - barW / 2}
              y={PAD.top + PLOT_H - barH}
              width={barW}
              height={barH}
              rx={2}
              fill={ACTIVITY_COLOR}
              opacity={0.1}
            />
          )
        })}

        {/* Accuracy line (premium) */}
        {showAccuracy && accuracyPath && (
          <path
            d={accuracyPath}
            fill="none"
            stroke={ACCURACY_COLOR}
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Mastered line */}
        <path
          d={masteredPath}
          fill="none"
          stroke={MASTERED_COLOR}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={x(i)} cy={yMastered(p.mastered)} r={3}
            fill="#fff" stroke={MASTERED_COLOR} strokeWidth={2}
          />
        ))}

        {/* X labels */}
        {points.map((p, i) => (
          showLabel(i) ? (
            <text
              key={`xl-${i}`}
              x={x(i)} y={H - 8}
              textAnchor="middle" fontSize={10} fill={colors.textHint}
            >
              {p.label}
            </text>
          ) : null
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '10px', justifyContent: 'center' }}>
        <LegendItem color={MASTERED_COLOR} label="Skills mastered" />
        {showAccuracy && <LegendItem color={ACCURACY_COLOR} label="Accuracy" dashed />}
        {showActivity && <LegendItem color={ACTIVITY_COLOR} label="Questions answered" faint />}
      </div>
    </div>
  )
}

function LegendItem({ color, label, dashed, faint }: { color: string; label: string; dashed?: boolean; faint?: boolean }) {
  const swatch: React.CSSProperties = faint
    ? { width: 12, height: 12, borderRadius: 2, background: color, opacity: 0.18 }
    : dashed
      ? { width: 16, height: 3, borderRadius: 2, background: `repeating-linear-gradient(90deg, ${color} 0 5px, transparent 5px 9px)` }
      : { width: 16, height: 3, borderRadius: 2, background: color }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ display: 'inline-block', ...swatch }} />
      <span style={{ fontSize: font.sm, color: colors.textHint }}>{label}</span>
    </div>
  )
}
