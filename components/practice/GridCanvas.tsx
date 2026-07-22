'use client'

import { useMemo, useRef, useState } from 'react'
import { colors, font, radius, secondaryButton, errorBox } from '../../lib/styles'
import { gridGeometry, buildGridFrame, buildPointsLayer, buildSolutionLayer, CELL } from '../../lib/questions/gridSvg'
import type { RenderedGrid, GridPoint } from '../../lib/questions/gridDraw'

/**
 * The interactive snap-to-grid canvas for `grid_draw` parts.
 *
 * Gesture vocabulary is deliberately tiny (touch-first): tap a gridline
 * intersection to place a point, tap a placed point to remove it, Clear to
 * start over. No dragging. Keyboard: focus the grid, move the cursor with the
 * arrow keys, place/remove with Enter or Space.
 *
 * The static frame and any ghosted canonical overlay come from the shared
 * lib/questions/gridSvg builders, so what the student sees is identical to
 * what the verification harness rasterises and eyeballs.
 */

type Props = {
  grid: RenderedGrid
  value: GridPoint[]
  onChange?: (pts: GridPoint[]) => void
  readOnly?: boolean
  // Ghost the canonical answer (answered/review views).
  showCanonical?: boolean
  // Review: colour the i-th student point by verdict (aligned to value order).
  perElement?: boolean[]
}

export default function GridCanvas({ grid, value, onChange, readOnly, showCanonical, perElement }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  // Where a pointer went down, so we can tell a tap (place a point) from a
  // drag (the browser scrolling the page) — see handlePointerUp.
  const pointerStart = useRef<{ x: number; y: number; id: number } | null>(null)
  const [cursor, setCursor] = useState<GridPoint | null>(null)
  const [announce, setAnnounce] = useState('')

  const finite = [grid.x.min, grid.x.max, grid.x.step, grid.y.min, grid.y.max, grid.y.step]
    .every(Number.isFinite) && grid.x.step > 0 && grid.y.step > 0 && grid.x.max > grid.x.min && grid.y.max > grid.y.min

  const geo = useMemo(
    () => finite ? gridGeometry(grid.x, grid.y) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grid.x.min, grid.x.max, grid.x.step, grid.y.min, grid.y.max, grid.y.step, finite],
  )
  const frame = useMemo(
    () => geo ? buildGridFrame(grid, geo) : '',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [geo, grid.background],
  )

  if (!finite || !geo) {
    // Should be unreachable for harness-verified questions.
    return <div style={errorBox}>This diagram could not be drawn.</div>
  }

  const maxPoints = grid.elements.length

  function togglePoint(p: GridPoint) {
    if (readOnly || !onChange) return
    const isCells = grid.mode === 'cells'
    const at = value.findIndex(v => v.x === p.x && v.y === p.y)
    if (at >= 0) {
      onChange(value.filter((_, i) => i !== at))
      setAnnounce(isCells ? `Square unshaded at (${p.x}, ${p.y})` : `Point removed at (${p.x}, ${p.y})`)
    } else if (value.length < maxPoints) {
      onChange([...value, p])
      setAnnounce(isCells ? `Square shaded at (${p.x}, ${p.y})` : `Point placed at (${p.x}, ${p.y})`)
    } else {
      setAnnounce(isCells
        ? `All ${maxPoints} squares are shaded — unshade one first`
        : `All ${maxPoints} points are placed — remove one first`)
    }
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (readOnly || !onChange) return
    pointerStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }

  // Place on pointer-UP, and only for a tap that barely moved. A finger that
  // dragged more than a few pixels was scrolling the page (touchAction:pan-y),
  // not placing a point — so we ignore it. This lets the page scroll on mobile
  // even when the gesture starts on the grid.
  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (readOnly || !onChange || !svgRef.current || !geo) return
    const start = pointerStart.current
    pointerStart.current = null
    if (!start || start.id !== e.pointerId) return
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) return // a drag, not a tap
    const rect = svgRef.current.getBoundingClientRect()
    // width="100%" with a viewBox preserves aspect, so one linear ratio per
    // axis converts CSS px → viewBox units exactly.
    const vx = (e.clientX - rect.left) * (geo.W / rect.width)
    const vy = (e.clientY - rect.top) * (geo.H / rect.height)
    // Each mode identifies a different thing: cells the containing square,
    // bars the containing slot (setting its height), number_line a position on
    // the 1-D axis, everything else the nearest lattice intersection.
    const hit = grid.mode === 'cells' ? geo.snapCell(vx, vy)
      : grid.mode === 'bars' ? geo.snapBar(vx, vy, grid.elements)
      : grid.mode === 'number_line' ? geo.snapLine(vx)
      : geo.snap(vx, vy)
    if (hit) {
      setCursor(hit)
      if (grid.mode === 'bars') setBarHeight(hit)
      else if (grid.mode === 'number_line') setMarker(hit)
      else togglePoint(hit)
    }
  }

  /**
   * Bars: a tap sets that slot's height, replacing whatever was there. Tapping
   * a bar at its existing height clears it, keeping the tap-to-undo idiom.
   */
  function setBarHeight(p: GridPoint) {
    if (readOnly || !onChange) return
    const at = value.findIndex(v => v.x === p.x)
    if (at >= 0 && value[at].y === p.y) {
      onChange(value.filter((_, i) => i !== at))
      setAnnounce(`Bar cleared`)
    } else if (at >= 0) {
      onChange(value.map((v, i) => i === at ? p : v))
      setAnnounce(`Bar set to ${p.y}`)
    } else {
      onChange([...value, p])
      setAnnounce(`Bar drawn to ${p.y}`)
    }
  }

  /**
   * Number line: one marker. A tap moves it, keeping whichever circle style
   * and arrow direction the student has already chosen.
   */
  function setMarker(p: GridPoint) {
    if (readOnly || !onChange) return
    const current = value[0]
    onChange([{ ...p, style: current?.style ?? 'closed', dir: current?.dir ?? 'none' }])
    setAnnounce(`Marker moved to ${p.x}`)
  }

  function setMarkerStyle(style: 'open' | 'closed') {
    if (readOnly || !onChange || !value[0]) return
    onChange([{ ...value[0], style }])
    setAnnounce(style === 'open' ? 'Hollow circle' : 'Solid circle')
  }

  function setMarkerDir(dir: 'left' | 'right' | 'none') {
    if (readOnly || !onChange || !value[0]) return
    onChange([{ ...value[0], dir }])
    setAnnounce(dir === 'none' ? 'Arrow removed' : `Arrow pointing ${dir}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (readOnly || !onChange || !geo) return
    const { x, y } = grid
    // In cells mode the cursor addresses a CELL (bottom-left corner), so its
    // upper bound is one step short of the axis max.
    const xTop = grid.mode === 'cells' ? x.max - x.step : x.max
    const yTop = grid.mode === 'cells' ? y.max - y.step : y.max
    const cur = cursor ?? { x: x.min, y: y.min }
    const move: Record<string, GridPoint> = {
      ArrowLeft: { x: Math.max(x.min, cur.x - x.step), y: cur.y },
      ArrowRight: { x: Math.min(xTop, cur.x + x.step), y: cur.y },
      ArrowDown: { x: cur.x, y: Math.max(y.min, cur.y - y.step) },
      ArrowUp: { x: cur.x, y: Math.min(yTop, cur.y + y.step) },
    }
    if (e.key in move) {
      e.preventDefault()
      setCursor(move[e.key])
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setCursor(cur)
      // Same routing as a tap — Enter must mean "set this bar's height" or
      // "mark this value", not "toggle a point".
      if (grid.mode === 'bars') {
        // Only act if the cursor is inside a declared slot.
        const slot = grid.elements.find(s => cur.x >= s.x - 1e-9 && cur.x < (s.x2 ?? s.x + x.step) - 1e-9)
        if (slot) setBarHeight({ x: slot.x, y: cur.y })
      } else if (grid.mode === 'number_line') {
        setMarker({ x: cur.x, y: y.min })
      } else {
        togglePoint(cur)
      }
    }
  }

  // bars/number_line need their slot widths and axes to draw.
  const layerExtra = { slots: grid.elements, axes: { x: grid.x, y: grid.y } }

  const ghost = showCanonical
    ? buildPointsLayer(
        grid.elements.map(el => ({ x: el.x, y: el.y, ...(el.style ? { style: el.style } : {}), ...(el.dir ? { dir: el.dir } : {}) })),
        geo, { color: colors.success, ghost: true, mode: grid.mode, ...layerExtra },
      )
    : ''
  // Method overlay (ray lines etc.) — revealed with the correct answer.
  const solution = showCanonical ? buildSolutionLayer(grid, geo) : ''

  // Student joins (polyline/line) rendered via the shared builder WITHOUT
  // markers — the point markers are JSX so review views can colour them per
  // verdict (markers:true here would double-draw them). bars and number_line
  // draw their whole mark here, since a rect or a circle-plus-arrow has no
  // separate "marker" to colour.
  const joins = value.length >= 2 && (grid.mode === 'polyline' || grid.mode === 'line' || grid.mode === 'polygon')
    ? buildPointsLayer(value, geo, { color: colors.primary, mode: grid.mode, markers: false })
    : (value.length >= 1 && (grid.mode === 'bars' || grid.mode === 'number_line'))
    ? buildPointsLayer(value, geo, { color: colors.primary, mode: grid.mode, ...layerExtra })
    : ''

  const marker = value[0]
  const counterText =
    grid.mode === 'line' ? `${value.length} of 2 points placed — place 2 points on the line`
    : grid.mode === 'cells' ? `${value.length} of ${maxPoints} squares shaded`
    : grid.mode === 'polygon' ? `${value.length} of ${maxPoints} corners placed`
    : grid.mode === 'bars' ? `${value.length} of ${maxPoints} bars drawn`
    : grid.mode === 'number_line' ? (marker ? `Marked at ${marker.x}` : 'No value marked yet')
    : `${value.length} of ${maxPoints} points placed`

  const instruction =
    grid.mode === 'line' ? 'Tap the grid to plot 2 points the line passes through, then submit. Tap a point again to remove it.'
    : grid.mode === 'cells' ? 'Tap squares to shade them. Tap a shaded square to unshade it.'
    : grid.mode === 'polygon' ? "Tap the grid to place the shape's corners in order. Tap a corner again to remove it."
    : grid.mode === 'bars' ? 'Tap a column at the height you want to draw its bar. Tap the top of a bar again to clear it.'
    : grid.mode === 'number_line' ? 'Tap the number line to mark the value, then choose the circle and the arrow below.'
    : `Tap the grid to place ${maxPoints === 1 ? 'a point' : `${maxPoints} points`}. Tap a point again to remove it.`

  return (
    <div
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={handleKeyDown}
      style={{ outline: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}
      aria-label={`Grid from ${grid.x.min} to ${grid.x.max} on the x-axis and ${grid.y.min} to ${grid.y.max} on the y-axis. Use the arrow keys to move and Enter to place or remove a point.`}
    >
      {!readOnly && (
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>{instruction}</p>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${geo.W} ${geo.H}`}
        width="100%"
        role="img"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { pointerStart.current = null }}
        style={{
          display: 'block',
          // pan-y keeps vertical page scroll working when a drag starts on the
          // grid; pinch-zoom lets a two-finger gesture zoom in on a grid that's
          // small on mobile. A stationary one-finger tap is neither, so it still
          // places a point (handlePointerUp's tap-vs-drag test).
          touchAction: readOnly ? 'auto' : 'pan-y pinch-zoom',
          cursor: readOnly ? 'default' : 'crosshair',
          background: '#ffffff',
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          maxWidth: `${geo.W * 1.5}px`,
        }}
      >
        <g dangerouslySetInnerHTML={{ __html: frame }} />
        {solution && <g dangerouslySetInnerHTML={{ __html: solution }} />}
        {ghost && <g dangerouslySetInnerHTML={{ __html: ghost }} />}
        {joins && <g dangerouslySetInnerHTML={{ __html: joins }} />}
        {/* bars and number_line draw their whole mark in `joins` above — a bar
            rect or a circle-plus-arrow has no separate marker to overlay. */}
        {grid.mode !== 'bars' && grid.mode !== 'number_line' && value.map((p, i) => {
          const verdict = perElement?.[i]
          const fill = verdict === undefined ? colors.primary : verdict ? colors.success : colors.danger
          if (grid.mode === 'cells') {
            // A shaded cell: the rect spans one grid step up-right from the
            // cell's bottom-left corner (one step = CELL viewBox units).
            return (
              <rect
                key={`${p.x}:${p.y}:${i}`}
                x={geo.px(p.x)}
                y={geo.py(p.y) - CELL}
                width={CELL}
                height={CELL}
                fill={fill}
                fillOpacity={0.45}
                stroke={fill}
                strokeWidth={1.5}
              />
            )
          }
          return (
            <circle
              key={`${p.x}:${p.y}:${i}`}
              cx={geo.px(p.x)}
              cy={geo.py(p.y)}
              r={5}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          )
        })}
        {!readOnly && cursor && (grid.mode === 'cells' ? (
          <rect
            x={geo.px(cursor.x)}
            y={geo.py(cursor.y) - CELL}
            width={CELL}
            height={CELL}
            fill="none"
            stroke={colors.primary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            pointerEvents="none"
          />
        ) : (
          <circle
            cx={geo.px(cursor.x)}
            cy={geo.py(cursor.y)}
            r={8}
            fill="none"
            stroke={colors.primary}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            pointerEvents="none"
          />
        ))}
      </svg>

      {/* Screen-reader announcements for place/remove actions. */}
      <span aria-live="polite" style={{
        position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
        clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
      }}>
        {announce}
      </span>

      {/* Number line: the circle style and arrow direction are part of the
          answer, so they get their own controls. Disabled until a value is
          marked — there is nothing to style otherwise. */}
      {!readOnly && grid.mode === 'number_line' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: font.sm, color: colors.textSecondary }}>Circle:</span>
            {([['open', '○ Hollow'], ['closed', '● Solid']] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setMarkerStyle(v)}
                disabled={!marker}
                style={{
                  ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm,
                  opacity: !marker ? 0.5 : 1,
                  ...((marker?.style ?? 'closed') === v
                    ? { borderColor: colors.primary, color: colors.primary, fontWeight: 700 } : {}),
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: font.sm, color: colors.textSecondary }}>Arrow:</span>
            {([['left', '←'], ['none', 'None'], ['right', '→']] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setMarkerDir(v)}
                disabled={!marker}
                style={{
                  ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm,
                  opacity: !marker ? 0.5 : 1,
                  ...((marker?.dir ?? 'none') === v
                    ? { borderColor: colors.primary, color: colors.primary, fontWeight: 700 } : {}),
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontSize: font.sm, color: colors.textSecondary }}>{counterText}</span>
          <button
            onClick={() => { onChange?.([]); setAnnounce('All points cleared') }}
            disabled={value.length === 0}
            style={{
              ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm,
              opacity: value.length === 0 ? 0.5 : 1,
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

