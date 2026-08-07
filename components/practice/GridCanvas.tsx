'use client'

import { useMemo, useRef, useState } from 'react'
import { colors, font, radius, secondaryButton, errorBox } from '../../lib/styles'
import { gridGeometry, buildGridFrame, buildPointsLayer, buildSolutionLayer, toGhostPoint, CELL, PAD } from '../../lib/questions/gridSvg'
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
  // Where a mouse is hovering, so we can show what a click WOULD do before it
  // is committed. Without this the canvas is silent until you click, which
  // means the only way to find a column is to click and see — the cause of the
  // "I had to click several times until it worked" experience.
  const [hover, setHover] = useState<GridPoint | null>(null)
  // bars_free: the first corner of a bar that is half-drawn (x edge + height,
  // no width yet). Held here rather than in `value` so an incomplete bar can
  // never be submitted or marked.
  const [pending, setPending] = useState<GridPoint | null>(null)
  const [announce, setAnnounce] = useState('')

  // A number line is deliberately 1-D, so its y axis collapses to a point —
  // demanding y.max > y.min would send every number line to the error box.
  const needsYRange = grid.mode !== 'number_line'
  const finite = [grid.x.min, grid.x.max, grid.x.step, grid.y.min, grid.y.max, grid.y.step]
    .every(Number.isFinite) && grid.x.step > 0 && grid.y.step > 0 && grid.x.max > grid.x.min
    && (needsYRange ? grid.y.max > grid.y.min : grid.y.max >= grid.y.min)

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

  /** CSS px → viewBox units. Aspect is preserved, so one ratio per axis is exact. */
  function toViewBox(clientX: number, clientY: number): { vx: number; vy: number } | null {
    if (!svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    return {
      vx: (clientX - rect.left) * (geo!.W / rect.width),
      vy: (clientY - rect.top) * (geo!.H / rect.height),
    }
  }

  /**
   * What a click at this position addresses. The hover preview and the click
   * handler both go through here, so the ghost the student sees can never
   * disagree with the mark they get.
   *
   * Each mode identifies a different thing: cells the containing square, bars
   * the containing slot (setting its height), number_line a position on the
   * 1-D axis, everything else the nearest lattice intersection. bars_free
   * alternates — a free corner, then the far EDGE only (ignoring vy, which is
   * what makes the second tap forgiving).
   */
  function hitFor(vx: number, vy: number): GridPoint | null {
    if (!geo) return null
    return grid.mode === 'cells' ? geo.snapCell(vx, vy)
      : grid.mode === 'bars' ? geo.snapBar(vx, vy, grid.elements)
      : grid.mode === 'bars_free' ? (pending ? geo.snapLine(vx) : geo.snap(vx, vy))
      : grid.mode === 'number_line' ? geo.snapLine(vx)
      : geo.snap(vx, vy)
  }

  // Hover preview is a MOUSE affordance. Touch has no hover state, and firing
  // this from a finger would flash a ghost under the fingertip mid-scroll.
  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (readOnly || !onChange || e.pointerType !== 'mouse') return
    const v = toViewBox(e.clientX, e.clientY)
    setHover(v ? hitFor(v.vx, v.vy) : null)
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
    const v = toViewBox(e.clientX, e.clientY)
    if (!v) return
    const hit = hitFor(v.vx, v.vy)
    if (hit) {
      setCursor(hit)
      if (grid.mode === 'bars') setBarHeight(hit)
      else if (grid.mode === 'bars_free') tapFreeBar(hit)
      else if (grid.mode === 'number_line') setMarker(hit)
      else togglePoint(hit)
    }
  }

  /**
   * bars_free: two taps per bar. The first sets one top corner (an x edge AND
   * the height); the second sets the other edge, with its y ignored.
   *
   * A tap here ONLY ever draws. Tapping a finished bar deliberately does not
   * clear it: histogram classes are contiguous, so one bar's right edge is the
   * next one's left edge, and taps snap to the lattice — on a step-10 axis a
   * 10-wide bar has no interior lattice point at all. Any "tap the bar to
   * remove it" rule therefore destroys the previous bar the moment you start
   * the next one. Removal lives on the explicit Undo and Clear buttons.
   */
  function tapFreeBar(p: GridPoint) {
    if (readOnly || !onChange) return
    if (pending) {
      const left = Math.min(pending.x, p.x)
      const right = Math.max(pending.x, p.x)
      if (left === right) {
        setAnnounce('A bar needs some width — tap a different edge')
        return
      }
      setPending(null)
      onChange([...value, { x: left, y: pending.y, x2: right }])
      setAnnounce(`Bar drawn from ${left} to ${right} at height ${pending.y}`)
      return
    }
    if (value.length >= maxPoints) {
      setAnnounce(`All ${maxPoints} bars are drawn — use Undo to change one`)
      return
    }
    setPending(p)
    setAnnounce(`Corner placed at ${p.x}, height ${p.y}. Now tap the bar's other edge.`)
  }

  /**
   * Bars: a tap sets that slot's height, replacing whatever was there.
   *
   * Re-tapping at the SAME height is deliberately a no-op. It used to clear the
   * bar, which meant the natural "did that land where I meant?" second click
   * destroyed the bar the student had just drawn — the main reason drawing a
   * chart took several attempts. Clearing lives on the Clear button instead.
   */
  function setBarHeight(p: GridPoint) {
    if (readOnly || !onChange) return
    const at = value.findIndex(v => v.x === p.x)
    if (at >= 0 && value[at].y === p.y) {
      setAnnounce(`Bar already at ${p.y}`)
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
      } else if (grid.mode === 'bars_free') {
        // Same two-step vocabulary as tapping: corner, then far edge. The
        // cursor's y is ignored on the second press, matching hitFor.
        tapFreeBar(pending ? { x: cur.x, y: pending.y } : cur)
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
    ? buildPointsLayer(grid.elements.map(toGhostPoint(grid)),
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
    : (value.length >= 1 && (grid.mode === 'bars' || grid.mode === 'bars_free' || grid.mode === 'number_line'))
    ? buildPointsLayer(value, geo, { color: colors.primary, mode: grid.mode, ...layerExtra })
    : ''

  // What the preview follows: the mouse when it is over the grid, otherwise
  // the keyboard cursor, so key users get the same look-before-you-commit.
  const indicator = hover ?? cursor

  const marker = value[0]
  const counterText =
    grid.mode === 'line' ? `${value.length} of 2 points placed — place 2 points on the line`
    : grid.mode === 'cells' ? `${value.length} of ${maxPoints} squares shaded`
    : grid.mode === 'polygon' ? `${value.length} of ${maxPoints} corners placed`
    : grid.mode === 'bars' || grid.mode === 'bars_free' ? `${value.length} of ${maxPoints} bars drawn`
    : grid.mode === 'number_line' ? (marker ? `Marked at ${marker.x}` : 'No value marked yet')
    : `${value.length} of ${maxPoints} points placed`

  // A live readout of the value under the pointer, so the student can confirm
  // what they are about to draw without counting gridlines.
  const readout =
    // Mid-bar: describe the bar the next tap would make. On touch there is no
    // hover, so the indicator is still the corner just tapped — reporting a
    // zero-width "10 to 10" bar would be nonsense, so show the height instead.
    pending ? (indicator && indicator.x !== pending.x
        ? `Bar from ${Math.min(pending.x, indicator.x)} to ${Math.max(pending.x, indicator.x)}, height ${pending.y}`
        : `Height ${pending.y} — now tap the other edge`)
    : !indicator ? ''
    : grid.mode === 'bars' || grid.mode === 'bars_free' ? `Height ${indicator.y}`
    : grid.mode === 'number_line' ? `${indicator.x}`
    : `(${indicator.x}, ${indicator.y})`

  const instruction =
    grid.mode === 'line' ? 'Tap the grid to plot 2 points the line passes through, then submit. Tap a point again to remove it.'
    : grid.mode === 'cells' ? 'Tap squares to shade them. Tap a shaded square to unshade it.'
    : grid.mode === 'polygon' ? "Tap the grid to place the shape's corners in order. Tap a corner again to remove it."
    : grid.mode === 'bars' ? 'Tap a column at the height you want to draw its bar. The dashed lines show where each column starts and ends.'
    : grid.mode === 'bars_free' ? (pending
        ? "Now tap the bar's other edge — only how far across matters, not how high."
        : 'Draw each bar with two taps: first a top corner, then its other edge. Use Undo to change a bar.')
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
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHover(null)}
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
          // Bigger cells are easier to aim at on a desktop; the 560px ceiling
          // stops a small grid being blown up into a wall of empty squares.
          maxWidth: `${Math.min(geo.W * 2.2, 560)}px`,
        }}
      >
        <g dangerouslySetInnerHTML={{ __html: frame }} />
        {solution && <g dangerouslySetInnerHTML={{ __html: solution }} />}
        {ghost && <g dangerouslySetInnerHTML={{ __html: ghost }} />}
        {joins && <g dangerouslySetInnerHTML={{ __html: joins }} />}
        {/* bars and number_line draw their whole mark in `joins` above — a bar
            rect or a circle-plus-arrow has no separate marker to overlay. */}
        {grid.mode !== 'bars' && grid.mode !== 'bars_free' && grid.mode !== 'number_line' && value.map((p, i) => {
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
        {/* bars_free in progress: the corner that has been placed, plus a
            dashed height guide right across the plot, so the student can see
            the level they are about to draw to while choosing the far edge. */}
        {!readOnly && pending && (
          <g pointerEvents="none">
            <line
              x1={PAD.left} y1={geo.py(pending.y)}
              x2={PAD.left + geo.cols * CELL} y2={geo.py(pending.y)}
              stroke={colors.primary} strokeWidth={1.5} strokeDasharray="4 4"
            />
            <line
              x1={geo.px(pending.x)} y1={geo.py(pending.y)}
              x2={geo.px(pending.x)} y2={geo.py(grid.y.min)}
              stroke={colors.primary} strokeWidth={2}
            />
            {/* The bar this tap would complete, if the pointer is over the grid. */}
            {indicator && Math.abs(indicator.x - pending.x) > 1e-9 && (
              <rect
                x={geo.px(Math.min(pending.x, indicator.x))}
                y={geo.py(pending.y)}
                width={Math.abs(geo.px(indicator.x) - geo.px(pending.x))}
                height={geo.py(grid.y.min) - geo.py(pending.y)}
                fill={colors.primary} fillOpacity={0.18}
                stroke={colors.primary} strokeWidth={1.5} strokeDasharray="4 4"
              />
            )}
          </g>
        )}
        {/* Hover/keyboard preview: exactly what a click would create, drawn
            before it is committed. In bars mode that is the whole bar, which is
            what makes the columns discoverable without trial clicking. */}
        {!readOnly && indicator && grid.mode === 'bars' && (
          <rect
            x={geo.px(indicator.x)}
            y={geo.py(indicator.y)}
            width={geo.px(grid.elements.find(s => Math.abs(s.x - indicator.x) < 1e-9)?.x2 ?? indicator.x + grid.x.step) - geo.px(indicator.x)}
            height={geo.py(grid.y.min) - geo.py(indicator.y)}
            fill={colors.primary} fillOpacity={0.18}
            stroke={colors.primary} strokeWidth={1.5} strokeDasharray="4 4"
            pointerEvents="none"
          />
        )}
        {/* Everything else previews as the marker or square it would place.
            Suppressed once a bars_free bar is half-drawn — the rect preview
            above already says what the next tap does. */}
        {!readOnly && indicator && grid.mode !== 'bars' && !pending && (grid.mode === 'cells' ? (
          <rect
            x={geo.px(indicator.x)}
            y={geo.py(indicator.y) - CELL}
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
            cx={geo.px(indicator.x)}
            cy={geo.py(indicator.y)}
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
          <span style={{ fontSize: font.sm, color: colors.textSecondary, flex: 1 }}>
            {counterText}
            {readout && <span style={{ color: colors.primary, fontWeight: 600 }}> · {readout}</span>}
          </span>
          {/* bars_free removes by explicit undo rather than by tapping a bar —
              see tapFreeBar for why tapping cannot be made unambiguous. */}
          {grid.mode === 'bars_free' && (
            <button
              onClick={() => {
                if (pending) { setPending(null); setAnnounce('Bar cancelled') }
                else { onChange?.(value.slice(0, -1)); setAnnounce('Last bar removed') }
              }}
              disabled={value.length === 0 && !pending}
              style={{
                ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm,
                opacity: value.length === 0 && !pending ? 0.5 : 1,
              }}
            >
              Undo
            </button>
          )}
          <button
            onClick={() => { onChange?.([]); setPending(null); setAnnounce('All points cleared') }}
            disabled={value.length === 0 && !pending}
            style={{
              ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm,
              opacity: value.length === 0 && !pending ? 0.5 : 1,
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

