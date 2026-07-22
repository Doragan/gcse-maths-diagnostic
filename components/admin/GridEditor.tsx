'use client'

import {
  colors, font, radius, secondaryButton, inputStyle, labelStyle,
} from '../../lib/styles'
import { GridInput, GridTrapInput, normalizeGrid } from '../../lib/questions/parts'
import GridCanvas from '../practice/GridCanvas'

/**
 * Authoring editor for a grid_draw part. Text-first: axis bounds and element
 * coordinates are typed as numbers or {{...}} templates (you cannot click a
 * parametric point); the canonical drawing is RENDERED, not drawn — a static
 * preview appears below whenever every field parses as a plain number, and
 * the parametric case previews through the question form's main Preview flow.
 */

type Props = {
  grid: GridInput
  onChange: (grid: GridInput) => void
  autoResize: (el: HTMLTextAreaElement | null) => void
}

const MODES = [
  ['points', 'Points — place separate points'],
  ['polyline', 'Polyline — points joined in order'],
  ['line', 'Straight line — 2 points defining a line'],
  ['cells', 'Shade squares — tap cells to shade'],
  ['polygon', 'Polygon — place the shape’s corners in order'],
  ['bars', 'Bars, fixed columns — you set each bar’s width; the student sets only its height (bar chart)'],
  ['bars_free', 'Bars, student-drawn — the student chooses each bar’s width AND height (histogram)'],
  ['number_line', 'Number line — mark a value with a circle and arrow'],
] as const

export default function GridEditor({ grid, onChange, autoResize }: Props) {
  function set<K extends keyof GridInput>(field: K, value: GridInput[K]) {
    onChange({ ...grid, [field]: value })
  }

  function setAxis(which: 'x' | 'y', field: keyof GridInput['x'], value: string) {
    onChange({ ...grid, [which]: { ...grid[which], [field]: value } })
  }

  function setElement(i: number, field: 'x' | 'y' | 'marks' | 'x2' | 'style' | 'dir', value: string) {
    set('elements', grid.elements.map((e, j) => j === i ? { ...e, [field]: value } : e))
  }

  const isLine = grid.mode === 'line'
  const isCells = grid.mode === 'cells'
  const isPolygon = grid.mode === 'polygon'
  // Both bar modes author the same way — the author always declares the
  // intended [x, x2] span; they differ only in who draws the width.
  const isBars = grid.mode === 'bars' || grid.mode === 'bars_free'
  const isNumberLine = grid.mode === 'number_line'
  // Line pins exactly 2 elements; polygon needs at least 3; a number line is
  // exactly one marker.
  const removeDisabled = (isLine && grid.elements.length <= 2)
    || (isPolygon && grid.elements.length <= 3)
    || (isNumberLine && grid.elements.length <= 1)
  const addDisabled = (isLine && grid.elements.length >= 2)
    || (isNumberLine && grid.elements.length >= 1)

  function addElement() {
    set('elements', [...grid.elements, { x: '', y: '', marks: 1 }])
  }

  function removeElement(i: number) {
    set('elements', grid.elements.filter((_, j) => j !== i))
  }

  // ── traps: authored WRONG drawings + targeted feedback ──
  const traps = grid.traps ?? []
  // Seed a new trap at the element count this mode will demand, so the author
  // starts from a shape the harness can actually accept.
  const trapSeedCount = isLine ? 2 : isPolygon ? Math.max(3, grid.elements.length) : grid.elements.length

  function addTrap() {
    const elements = Array.from({ length: Math.max(1, trapSeedCount) }, () => ({ x: '', y: '' }))
    set('traps', [...traps, { elements, response: '' }])
  }

  function updateTrap(ti: number, t: GridTrapInput) {
    set('traps', traps.map((old, j) => j === ti ? t : old))
  }

  function removeTrap(ti: number) {
    set('traps', traps.filter((_, j) => j !== ti))
  }

  function setTrapElement(ti: number, ei: number, field: 'x' | 'y', value: string) {
    updateTrap(ti, {
      ...traps[ti],
      elements: traps[ti].elements.map((e, j) => j === ei ? { ...e, [field]: value } : e),
    })
  }

  // Static preview: only when every numeric field is a plain number (no
  // templates) — the parametric preview lives in the form's Preview card.
  const normalized = normalizeGrid(grid)
  const allNumeric = [
    normalized.x.min, normalized.x.max, normalized.y.min, normalized.y.max,
    ...normalized.elements.flatMap(e => [e.x, e.y]),
  ].every(v => typeof v === 'number')
  const previewGrid = allNumeric && normalized.elements.length > 0 ? {
    mode: normalized.mode,
    x: normalized.x as { min: number, max: number, step: number, label: string },
    y: normalized.y as { min: number, max: number, step: number, label: string },
    background: normalized.background,
    solution: normalized.solution,
    elements: normalized.elements as { x: number, y: number, marks: number }[],
    tolerance: normalized.tolerance,
  } : null

  return (
    <div style={styles.gridCard}>
      <div style={styles.field}>
        <label style={labelStyle}>Drawing mode</label>
        <select
          value={grid.mode}
          onChange={e => set('mode', e.target.value as GridInput['mode'])}
          style={inputStyle}
        >
          {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {(['x', 'y'] as const).map(axis => (
        <div key={axis} style={styles.row}>
          <div style={{ ...styles.field, minWidth: '70px', flex: '0 1 90px' }}>
            <label style={labelStyle}>{axis} min</label>
            <input type="text" value={String(grid[axis].min)} onChange={e => setAxis(axis, 'min', e.target.value)} style={inputStyle} placeholder="0" />
          </div>
          <div style={{ ...styles.field, minWidth: '70px', flex: '0 1 110px' }}>
            <label style={labelStyle}>{axis} max</label>
            <input type="text" value={String(grid[axis].max)} onChange={e => setAxis(axis, 'max', e.target.value)} style={inputStyle} placeholder={'10 or {{ymax}}'} />
          </div>
          <div style={{ ...styles.field, minWidth: '60px', flex: '0 1 80px' }}>
            <label style={labelStyle}>step</label>
            <input type="number" value={String(grid[axis].step)} onChange={e => setAxis(axis, 'step', e.target.value)} style={inputStyle} placeholder="1" step="0.5" min="0" />
          </div>
          <div style={styles.field}>
            <label style={labelStyle}>{axis} label</label>
            <input type="text" value={grid[axis].label} onChange={e => setAxis(axis, 'label', e.target.value)} style={inputStyle} placeholder={axis} />
          </div>
        </div>
      ))}
      <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
        Min/max may be templates; the step and the NUMBER of cells must stay the same for every
        draw (parameters vary the values, never the grid shape). Keep grids to 12 columns or
        fewer so they stay usable on a phone.
      </p>

      {/* Canonical elements */}
      <div style={styles.field}>
        <label style={labelStyle}>
          {isLine ? 'Line endpoints (exactly 2 — the intended line)'
            : isCells ? 'Squares to shade (bottom-left corner of each)'
            : isPolygon ? 'Corners in order (at least 3)'
            : isBars ? 'Bars — x is the left edge, x2 the right edge, y the correct height'
            : isNumberLine ? 'The marked value (exactly one)'
            : 'Correct points'}
        </label>
        {isBars && (
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
            Leave x2 blank for a bar one step wide. Set it for unequal class widths (a histogram).
            Slots must not overlap.
          </p>
        )}
        {grid.elements.map((el, i) => (
          <div key={i} style={styles.row}>
            <div style={styles.field}>
              <label style={{ ...labelStyle, fontWeight: '400' }}>{isBars ? 'x (left)' : 'x'}</label>
              <input type="text" value={String(el.x)} onChange={e => setElement(i, 'x', e.target.value)} style={inputStyle} placeholder={'0 or {{a}}'} />
            </div>
            {isBars && (
              <div style={styles.field}>
                <label style={{ ...labelStyle, fontWeight: '400' }}>x2 (right)</label>
                <input type="text" value={String(el.x2 ?? '')} onChange={e => setElement(i, 'x2', e.target.value)} style={inputStyle} placeholder="one step wide" />
              </div>
            )}
            <div style={styles.field}>
              <label style={{ ...labelStyle, fontWeight: '400' }}>{isBars ? 'y (height)' : 'y'}</label>
              <input type="text" value={String(el.y)} onChange={e => setElement(i, 'y', e.target.value)} style={inputStyle} placeholder={'{{c}}'} />
            </div>
            {isNumberLine && (
              <>
                <div style={styles.field}>
                  <label style={{ ...labelStyle, fontWeight: '400' }}>Circle</label>
                  <select value={el.style ?? 'closed'} onChange={e => setElement(i, 'style', e.target.value)} style={inputStyle}>
                    <option value="closed">● Solid (≤ or ≥)</option>
                    <option value="open">○ Hollow (&lt; or &gt;)</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={{ ...labelStyle, fontWeight: '400' }}>Arrow</label>
                  <select value={el.dir ?? 'none'} onChange={e => setElement(i, 'dir', e.target.value)} style={inputStyle}>
                    <option value="none">None</option>
                    <option value="left">← Left</option>
                    <option value="right">→ Right</option>
                  </select>
                </div>
              </>
            )}
            <div style={{ ...styles.field, minWidth: '60px', flex: '0 1 80px' }}>
              <label style={{ ...labelStyle, fontWeight: '400' }}>Marks</label>
              <input type="number" value={String(el.marks)} onChange={e => setElement(i, 'marks', e.target.value)} style={inputStyle} min="1" />
            </div>
            <button
              onClick={() => removeElement(i)}
              disabled={removeDisabled}
              style={{ ...secondaryButton, width: 'auto', alignSelf: 'flex-end', padding: '8px 12px', fontSize: font.sm, color: colors.dangerText, borderColor: colors.dangerBorder, opacity: removeDisabled ? 0.5 : 1 }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addElement}
          disabled={addDisabled}
          style={{ ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm, opacity: addDisabled ? 0.5 : 1 }}
        >
          {isCells ? '+ Add square' : isPolygon ? '+ Add corner' : '+ Add point'}
        </button>
      </div>

      <div style={styles.row}>
        <div style={{ ...styles.field, minWidth: '90px', flex: '0 1 130px' }}>
          <label style={labelStyle}>Tolerance (grid units)</label>
          <input
            type="number"
            value={String(grid.tolerance)}
            onChange={e => set('tolerance', e.target.value)}
            style={inputStyle}
            placeholder="0"
            step="0.5"
            min="0"
          />
        </div>
      </div>

      {/* Background */}
      <div style={styles.field}>
        <label style={labelStyle}>Background SVG fragment (optional)</label>
        <textarea
          ref={autoResize}
          value={grid.background}
          onChange={e => { set('background', e.target.value); autoResize(e.target) }}
          style={{ ...inputStyle, minHeight: '50px', resize: 'none' as const, fontFamily: 'monospace', fontSize: '13px' }}
          placeholder='<path d="..."/> — drawn in AXIS coordinates behind the lattice'
        />
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
          Drawn in axis coordinates (paths and shapes only — text would render mirrored).
        </p>
      </div>

      {/* Solution overlay (shown on the answer reveal) */}
      <div style={styles.field}>
        <label style={labelStyle}>Solution overlay (optional — shown with the answer)</label>
        <textarea
          ref={autoResize}
          value={grid.solution ?? ''}
          onChange={e => { set('solution', e.target.value); autoResize(e.target) }}
          style={{ ...inputStyle, minHeight: '50px', resize: 'none' as const, fontFamily: 'monospace', fontSize: '13px' }}
          placeholder='<line x1="0" y1="0" x2="6" y2="6" stroke="#94a3b8"/> — method/working, revealed after submitting'
        />
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
          Method the student would draw (ray lines, mirror perpendiculars). Axis coordinates,
          shapes/lines only — appears only when the correct answer is revealed.
        </p>
      </div>

      {/* Traps — authored WRONG drawings with targeted feedback */}
      <div style={styles.field}>
        <label style={labelStyle}>Traps (optional)</label>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
          A specific <strong>wrong</strong> drawing and the feedback it earns. The response shows
          only when the student is wrong and their drawing matches this one exactly. Traps never
          change marks.
        </p>
        {traps.map((t, ti) => (
          <div key={ti} style={styles.trapCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ ...labelStyle, fontWeight: '400' }}>Trap {ti + 1}</label>
              <button
                onClick={() => removeTrap(ti)}
                style={{ ...secondaryButton, width: 'auto', padding: '4px 10px', fontSize: font.sm, color: colors.dangerText, borderColor: colors.dangerBorder }}
              >
                Remove trap
              </button>
            </div>
            <select
              value={t.match ?? 'exact'}
              onChange={e => updateTrap(ti, { ...t, match: e.target.value as 'exact' | 'translated' })}
              style={inputStyle}
            >
              <option value="exact">This exact wrong drawing</option>
              <option value="translated">Right shape and size, wrong place (any offset)</option>
            </select>
            {t.match === 'translated' && (
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
                Fires whenever the drawing is the correct answer moved somewhere else — which is
                exactly what using the wrong centre of enlargement produces, for <em>any</em> wrong
                centre. No points needed.
              </p>
            )}
            {t.match !== 'translated' && t.elements.map((el, ei) => (
              <div key={ei} style={styles.row}>
                <div style={styles.field}>
                  <label style={{ ...labelStyle, fontWeight: '400' }}>x</label>
                  <input type="text" value={String(el.x)} onChange={e => setTrapElement(ti, ei, 'x', e.target.value)} style={inputStyle} placeholder={'0 or {{a}}'} />
                </div>
                <div style={styles.field}>
                  <label style={{ ...labelStyle, fontWeight: '400' }}>y</label>
                  <input type="text" value={String(el.y)} onChange={e => setTrapElement(ti, ei, 'y', e.target.value)} style={inputStyle} placeholder={'{{c}}'} />
                </div>
                <button
                  onClick={() => updateTrap(ti, { ...t, elements: t.elements.filter((_, j) => j !== ei) })}
                  style={{ ...secondaryButton, width: 'auto', alignSelf: 'flex-end', padding: '8px 12px', fontSize: font.sm }}
                >
                  −
                </button>
              </div>
            ))}
            {t.match !== 'translated' && (
              <button
                onClick={() => updateTrap(ti, { ...t, elements: [...t.elements, { x: '', y: '' }] })}
                style={{ ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm }}
              >
                + Add point to this trap
              </button>
            )}
            <textarea
              ref={autoResize}
              value={t.response}
              onChange={e => { updateTrap(ti, { ...t, response: e.target.value }); autoResize(e.target) }}
              style={{ ...inputStyle, minHeight: '55px', resize: 'none' as const }}
              placeholder="You've enlarged from the triangle's own corner. Every ray must start at the centre, (0, 0)."
            />
          </div>
        ))}
        <button onClick={addTrap} style={{ ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm }}>
          + Add trap
        </button>
      </div>

      {/* Static-values instant preview */}
      {previewGrid && (
        <div style={styles.field}>
          <label style={labelStyle}>Preview (fixed values — parametric grids preview via the Preview card)</label>
          <div style={{ maxWidth: '420px' }}>
            <GridCanvas grid={previewGrid} value={[]} readOnly showCanonical />
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  gridCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
    background: '#ffffff',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  row: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  trapCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    background: '#fafafa',
    borderRadius: 8,
    border: '1px solid #e5e5e5',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: '120px',
  },
}
