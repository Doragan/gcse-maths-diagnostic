'use client'

import { useState } from 'react'
import { skillsById } from '../../lib/skills/skillGraph'
import {
  colors, font, radius, secondaryButton, inputStyle, labelStyle,
} from '../../lib/styles'
import {
  QuestionKind, QUESTION_KINDS, QUESTION_KIND_LABELS,
} from '../../lib/questions/kind'
import { PART_ANSWER_TYPES, ANSWER_TYPE_LABELS } from '../../lib/questions/answerTypes'
import {
  PartInput, BlankInput, defaultKindForSkills, emptyBlank, nextBlankLabel, blankMarksTotal,
} from '../../lib/questions/parts'
import BlankEditor from './BlankEditor'

type Trap = { answer_template: string, response: string }

type Props = {
  index: number
  part: PartInput
  onChange: (part: PartInput) => void
  onRemove: () => void
  autoResize: (el: HTMLTextAreaElement | null) => void
}

const PART_LETTERS = 'abcdefghijklmnopqrstuvwxyz'

export default function PartEditor({ index, part, onChange, onRemove, autoResize }: Props) {
  const [skillSearch, setSkillSearch] = useState('')
  // Has the author manually chosen a kind for this part? If not, the kind
  // tracks the skill-count default (1 skill → mastery, >1 → exam).
  const [kindTouched, setKindTouched] = useState(false)

  function set<K extends keyof PartInput>(field: K, value: PartInput[K]) {
    onChange({ ...part, [field]: value })
  }

  function toggleSkill(skillId: string) {
    const nextSkills = part.skill_ids.includes(skillId)
      ? part.skill_ids.filter(id => id !== skillId)
      : [...part.skill_ids, skillId]
    onChange({
      ...part,
      skill_ids: nextSkills,
      // Auto-track kind from skill count until the author overrides it.
      kind: kindTouched ? part.kind : defaultKindForSkills(nextSkills),
    })
  }

  function addTrap() {
    set('traps', [...part.traps, { answer_template: '', response: '' }])
  }

  function updateTrap(i: number, field: keyof Trap, value: string) {
    set('traps', part.traps.map((t, j) => j === i ? { ...t, [field]: value } : t))
  }

  function removeTrap(i: number) {
    set('traps', part.traps.filter((_, j) => j !== i))
  }

  const blanks = part.blanks ?? []

  function addBlank() {
    set('blanks', [...blanks, emptyBlank(nextBlankLabel(blanks))])
  }

  function updateBlank(i: number, b: BlankInput) {
    set('blanks', blanks.map((old, j) => j === i ? b : old))
  }

  function removeBlank(i: number) {
    set('blanks', blanks.filter((_, j) => j !== i))
  }

  const isMultiBlank = part.answer_type === 'multi_blank'
  // Read-only marks for multi_blank: normalizePart recomputes the sum on save,
  // so the form shows the derived value rather than an editable field.
  const blankMarks = blankMarksTotal(blanks.map(b => ({
    marks: b.marks === '' || b.marks == null ? 1 : Number(b.marks),
  })))

  const filteredSkills = Object.entries(skillsById)
    .filter(([, skill]) =>
      !skillSearch ||
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      skill.topic.toLowerCase().includes(skillSearch.toLowerCase())
    )
    .sort((a, b) => a[1].topic.localeCompare(b[1].topic) || a[1].name.localeCompare(b[1].name))

  const letter = PART_LETTERS[index] ?? String(index + 1)

  return (
    <div style={styles.partCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: font.lg, fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          Part ({letter})
        </h3>
        <button
          onClick={onRemove}
          style={{ ...secondaryButton, width: 'auto', padding: '4px 10px', fontSize: font.sm, color: colors.dangerText, borderColor: colors.dangerBorder }}
        >
          Remove part
        </button>
      </div>

      {/* Prompt */}
      <div style={styles.field}>
        <label style={labelStyle}>Prompt (HTML)</label>
        <textarea
          ref={autoResize}
          value={part.prompt}
          onChange={e => { set('prompt', e.target.value); autoResize(e.target) }}
          style={{ ...inputStyle, minHeight: '70px', resize: 'none' as const, fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
          placeholder="<p>(a) Work out the value of {{a}} + {{b}}.</p>"
        />
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
          Renders against the same parameters as the stem, so you can reference earlier working — e.g. {'{{a}}'}.
        </p>
      </div>

      {/* Skills */}
      <div style={styles.field}>
        <label style={labelStyle}>Skills this part tests</label>
        {part.skill_ids.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
            {part.skill_ids.map(id => (
              <span
                key={id}
                onClick={() => toggleSkill(id)}
                style={{
                  fontSize: font.sm, padding: '3px 8px', borderRadius: radius.sm,
                  background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', cursor: 'pointer',
                }}
              >
                {skillsById[id]?.name ?? id} ✕
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={skillSearch}
          onChange={e => setSkillSearch(e.target.value)}
          placeholder="Search skills..."
          style={inputStyle}
        />
        <div style={{ maxHeight: '160px', overflowY: 'auto', border: `1px solid ${colors.border}`, borderRadius: radius.md }}>
          {filteredSkills.map(([id, skill]) => (
            <div
              key={id}
              onClick={() => toggleSkill(id)}
              style={{
                padding: '8px 12px', cursor: 'pointer',
                background: part.skill_ids.includes(id) ? '#e0f2fe' : 'transparent',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span style={{ fontSize: font.base, color: colors.textPrimary }}>{skill.name}</span>
              <span style={{ fontSize: font.sm, color: colors.textSecondary }}>{skill.topic}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Answer / type / tolerance / marks / kind */}
      <div style={styles.row}>
        {!isMultiBlank && (
          <div style={styles.field}>
            <label style={labelStyle}>Answer template</label>
            <input
              type="text"
              value={part.answer_template}
              onChange={e => set('answer_template', e.target.value)}
              style={inputStyle}
              placeholder="{{a + b}}"
            />
          </div>
        )}
        <div style={styles.field}>
          <label style={labelStyle}>Answer type</label>
          <select
            value={part.answer_type}
            onChange={e => set('answer_type', e.target.value as PartInput['answer_type'])}
            style={inputStyle}
          >
            {PART_ANSWER_TYPES.map(t => (
              <option key={t} value={t}>{ANSWER_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        {part.answer_type === 'numeric' && (
          <div style={styles.field}>
            <label style={labelStyle}>Tolerance (±)</label>
            <input
              type="number"
              value={part.tolerance ?? ''}
              onChange={e => set('tolerance', e.target.value)}
              style={inputStyle}
              placeholder="0"
              step="0.01"
            />
          </div>
        )}
        {isMultiBlank ? (
          <div style={{ ...styles.field, minWidth: '90px' }}>
            <label style={labelStyle}>Marks</label>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, padding: '10px 0' }}>
              {blankMarks} — sum of blanks
            </p>
          </div>
        ) : (
          <div style={{ ...styles.field, minWidth: '90px' }}>
            <label style={labelStyle}>Marks</label>
            <input
              type="number"
              value={part.marks ?? ''}
              onChange={e => set('marks', e.target.value)}
              style={inputStyle}
              placeholder="1"
              min="1"
            />
          </div>
        )}
      </div>

      {(part.answer_type === 'fraction' || part.answer_type === 'ratio') && (
        <div style={styles.field}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={part.requires_simplest ?? false}
              onChange={e => set('requires_simplest', e.target.checked)}
            />
            Requires simplest form
          </label>
        </div>
      )}

      {/* Blanks (multi_blank only) */}
      {isMultiBlank && (
        <div style={styles.field}>
          <label style={labelStyle}>Blanks</label>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
            Each blank is marked on its own — give every blank its own answer, type and marks.
            Label them A, B, C to match the prompt/diagram. The NUMBER of blanks is fixed for
            the question; parameters vary the values only.
          </p>
          {blanks.map((b, i) => (
            <BlankEditor
              key={i}
              blank={b}
              onChange={nb => updateBlank(i, nb)}
              onRemove={() => removeBlank(i)}
              autoResize={autoResize}
            />
          ))}
          <button onClick={addBlank} style={{ ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm }}>
            + Add blank
          </button>
        </div>
      )}

      <div style={styles.field}>
        <label style={labelStyle}>Kind</label>
        <select
          value={part.kind}
          onChange={e => { setKindTouched(true); set('kind', e.target.value as QuestionKind) }}
          style={inputStyle}
        >
          {QUESTION_KINDS.map(k => (
            <option key={k} value={k}>{QUESTION_KIND_LABELS[k]}</option>
          ))}
        </select>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
          Defaults from the skill count (one skill → Mastery, several → Exam). Override if needed.
        </p>
      </div>

      {/* Per-part traps (multi_blank parts carry traps per BLANK instead) */}
      {!isMultiBlank && (
      <div style={styles.field}>
        <label style={labelStyle}>Traps for this part</label>
        {part.traps.map((trap, i) => (
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
              placeholder="Wrong answer template, e.g. {{a * b}}"
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
      )}

      {/* Explanation */}
      <div style={styles.field}>
        <label style={labelStyle}>Explanation (shown after answering this part)</label>
        <textarea
          ref={autoResize}
          value={part.explanation ?? ''}
          onChange={e => { set('explanation', e.target.value); autoResize(e.target) }}
          style={{ ...inputStyle, minHeight: '60px', resize: 'none' as const }}
          placeholder="{{a}} + {{b}} = {{a + b}}"
        />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  partCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    background: colors.background,
    borderRadius: radius.md,
    border: `1px solid ${colors.borderStrong}`,
  },
  row: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: '160px',
  },
  trapBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    background: '#ffffff',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
}
