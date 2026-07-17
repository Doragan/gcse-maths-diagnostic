'use client'

import {
  colors, font, radius, secondaryButton, inputStyle, labelStyle,
} from '../../lib/styles'
import { SCALAR_ANSWER_TYPES, ANSWER_TYPE_LABELS, type ScalarAnswerType } from '../../lib/questions/answerTypes'
import { BlankInput } from '../../lib/questions/parts'

type Trap = { answer_template: string, response: string }

type Props = {
  blank: BlankInput
  onChange: (blank: BlankInput) => void
  onRemove: () => void
  autoResize: (el: HTMLTextAreaElement | null) => void
}

export default function BlankEditor({ blank, onChange, onRemove, autoResize }: Props) {
  function set<K extends keyof BlankInput>(field: K, value: BlankInput[K]) {
    onChange({ ...blank, [field]: value })
  }

  function addTrap() {
    set('traps', [...blank.traps, { answer_template: '', response: '' }])
  }

  function updateTrap(i: number, field: keyof Trap, value: string) {
    set('traps', blank.traps.map((t, j) => j === i ? { ...t, [field]: value } : t))
  }

  function removeTrap(i: number) {
    set('traps', blank.traps.filter((_, j) => j !== i))
  }

  return (
    <div style={styles.blankCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: font.base, fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          Blank {blank.label || '?'}
        </h4>
        <button
          onClick={onRemove}
          style={{ ...secondaryButton, width: 'auto', padding: '4px 10px', fontSize: font.sm, color: colors.dangerText, borderColor: colors.dangerBorder }}
        >
          Remove blank
        </button>
      </div>

      {/* Prompt shown beside the input in practice/exam — saves the student
          glancing back at the diagram to remember what the letter means. */}
      <div style={styles.field}>
        <label style={labelStyle}>Prompt (optional, shown beside the blank)</label>
        <input
          type="text"
          value={blank.prompt ?? ''}
          onChange={e => set('prompt', e.target.value)}
          style={inputStyle}
          placeholder="Students who come by bus"
        />
      </div>

      {/* Label / answer / type / tolerance / marks */}
      <div style={styles.row}>
        <div style={{ ...styles.field, minWidth: '70px', flex: '0 1 90px' }}>
          <label style={labelStyle}>Label</label>
          <input
            type="text"
            value={blank.label}
            onChange={e => set('label', e.target.value)}
            style={inputStyle}
            placeholder="A"
            maxLength={3}
          />
        </div>
        <div style={styles.field}>
          <label style={labelStyle}>Answer template</label>
          <input
            type="text"
            value={blank.answer_template}
            onChange={e => set('answer_template', e.target.value)}
            style={inputStyle}
            placeholder="{{n - w}}"
          />
        </div>
        <div style={styles.field}>
          <label style={labelStyle}>Answer type</label>
          <select
            value={blank.answer_type}
            onChange={e => set('answer_type', e.target.value as ScalarAnswerType)}
            style={inputStyle}
          >
            {SCALAR_ANSWER_TYPES.map(t => (
              <option key={t} value={t}>{ANSWER_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        {blank.answer_type === 'numeric' && (
          <div style={{ ...styles.field, minWidth: '90px' }}>
            <label style={labelStyle}>Tolerance (±)</label>
            <input
              type="number"
              value={blank.tolerance ?? ''}
              onChange={e => set('tolerance', e.target.value)}
              style={inputStyle}
              placeholder="0"
              step="0.01"
            />
          </div>
        )}
        <div style={{ ...styles.field, minWidth: '70px', flex: '0 1 90px' }}>
          <label style={labelStyle}>Marks</label>
          <input
            type="number"
            value={blank.marks ?? ''}
            onChange={e => set('marks', e.target.value)}
            style={inputStyle}
            placeholder="1"
            min="1"
          />
        </div>
      </div>

      {(blank.answer_type === 'fraction' || blank.answer_type === 'ratio') && (
        <div style={styles.field}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={blank.requires_simplest ?? false}
              onChange={e => set('requires_simplest', e.target.checked)}
            />
            Requires simplest form
          </label>
        </div>
      )}

      {/* Per-blank traps */}
      <div style={styles.field}>
        <label style={labelStyle}>Traps for this blank</label>
        {blank.traps.map((trap, i) => (
          <div key={i} style={styles.trapBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ ...labelStyle, fontWeight: '400' }}>Trap {i + 1}</label>
              <button
                onClick={() => removeTrap(i)}
                style={{ ...secondaryButton, width: 'auto', padding: '4px 10px', fontSize: font.sm, color: colors.dangerText, borderColor: colors.dangerBorder }}
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={trap.answer_template}
              onChange={e => updateTrap(i, 'answer_template', e.target.value)}
              style={inputStyle}
              placeholder="Wrong answer template, e.g. {{w + l}}"
            />
            <textarea
              ref={autoResize}
              value={trap.response}
              onChange={e => { updateTrap(i, 'response', e.target.value); autoResize(e.target) }}
              style={{ ...inputStyle, minHeight: '55px', resize: 'none' as const }}
              placeholder="Targeted feedback for this wrong answer."
            />
          </div>
        ))}
        <button onClick={addTrap} style={{ ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm }}>
          + Add trap
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  blankCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
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
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: '140px',
  },
  trapBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    background: colors.background,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
}
