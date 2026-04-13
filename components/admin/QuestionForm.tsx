'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { skillsById } from '../../lib/skills/skillGraph'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, labelStyle, errorBox, sectionTitle,
} from '../../lib/styles'

type Trap = {
  answer_template: string
  response: string
}

type QuestionFormData = {
  skill_ids: string[]
  difficulty: number
  question_type: 'multiple_choice' | 'numeric' | 'exact'
  question_template: string
  parameters: string
  answer_template: string
  answer_type: 'exact' | 'numeric' | 'fraction' | 'expression'
  tolerance: string
  traps: Trap[]
  explanation: string
  image: boolean
  is_published: boolean
}

type Props = {
  initialData?: Partial<QuestionFormData> & { id?: string }
  onSave: (data: QuestionFormData) => Promise<void>
  saving: boolean
  error: string | null
}

const emptyForm: QuestionFormData = {
  skill_ids: [],
  difficulty: 1,
  question_type: 'numeric',
  question_template: '',
  parameters: '{}',
  answer_template: '',
  answer_type: 'numeric',
  tolerance: '0',
  traps: [],
  explanation: '',
  image: false,
  is_published: false,
}

export default function QuestionForm({ initialData, onSave, saving, error }: Props) {
  const [form, setForm] = useState<QuestionFormData>({ ...emptyForm, ...initialData })
  const [preview, setPreview] = useState<{ question: string, answer: string, traps: { answer: string, response: string }[] } | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [skillSearch, setSkillSearch] = useState('')

  function update(field: keyof QuestionFormData, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addTrap() {
    update('traps', [...form.traps, { answer_template: '', response: '' }])
  }

  function updateTrap(index: number, field: keyof Trap, value: string) {
    const updated = form.traps.map((t, i) => i === index ? { ...t, [field]: value } : t)
    update('traps', updated)
  }

  function removeTrap(index: number) {
    update('traps', form.traps.filter((_, i) => i !== index))
  }

  function toggleSkill(skillId: string) {
    if (form.skill_ids.includes(skillId)) {
      update('skill_ids', form.skill_ids.filter(id => id !== skillId))
    } else {
      update('skill_ids', [...form.skill_ids, skillId])
    }
  }

  function generatePreview() {
    setPreviewError(null)
    try {
      const params = JSON.parse(form.parameters)
      const generated: Record<string, number> = {}

      // Generate parameter values
      for (const [key, config] of Object.entries(params) as any) {
        let attempts = 0
        let value: number
        do {
          value = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min
          attempts++
        } while (
          config.not_equal_to &&
          generated[config.not_equal_to] !== undefined &&
          value === generated[config.not_equal_to] &&
          attempts < 100
        )
        generated[key] = value
      }

      // Evaluate a template expression
      function evaluate(template: string): string {
        return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
          try {
            const fn = new Function(...Object.keys(generated), `return ${expr}`)
            return fn(...Object.values(generated)).toString()
          } catch {
            throw new Error(`Could not evaluate: ${expr}`)
          }
        })
      }

      const question = evaluate(form.question_template)
      const answer = evaluate(form.answer_template)
      const traps = form.traps.map(t => ({
        answer: evaluate(t.answer_template),
        response: t.response,
      }))

      setPreview({ question, answer, traps })
    } catch (e: any) {
      setPreviewError(e.message)
    }
  }

  const filteredSkills = Object.entries(skillsById)
    .filter(([id, skill]) =>
      !skillSearch ||
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      skill.topic.toLowerCase().includes(skillSearch.toLowerCase())
    )
    .sort((a, b) => a[1].topic.localeCompare(b[1].topic) || a[1].name.localeCompare(b[1].name))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Skills */}
      <div style={card}>
        <h2 style={sectionTitle}>Skills</h2>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          Select all skills this question tests.
        </p>
        {form.skill_ids.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
            {form.skill_ids.map(id => (
              <span
                key={id}
                onClick={() => toggleSkill(id)}
                style={{
                  fontSize: font.sm,
                  padding: '3px 8px',
                  borderRadius: radius.sm,
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  cursor: 'pointer',
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
        <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${colors.border}`, borderRadius: radius.md }}>
          {filteredSkills.map(([id, skill]) => (
            <div
              key={id}
              onClick={() => toggleSkill(id)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: form.skill_ids.includes(id) ? '#e0f2fe' : 'transparent',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: font.base, color: colors.textPrimary }}>{skill.name}</span>
              <span style={{ fontSize: font.sm, color: colors.textSecondary }}>{skill.topic}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Question details */}
      <div style={card}>
        <h2 style={sectionTitle}>Question details</h2>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={labelStyle}>Question type</label>
            <select
              value={form.question_type}
              onChange={e => update('question_type', e.target.value)}
              style={inputStyle}
            >
              <option value="numeric">Numeric</option>
              <option value="exact">Exact text</option>
              <option value="multiple_choice">Multiple choice</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={labelStyle}>Difficulty</label>
            <select
              value={form.difficulty}
              onChange={e => update('difficulty', parseInt(e.target.value))}
              style={inputStyle}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={labelStyle}>Answer type</label>
            <select
              value={form.answer_type}
              onChange={e => update('answer_type', e.target.value)}
              style={inputStyle}
            >
              <option value="numeric">Numeric</option>
              <option value="exact">Exact</option>
              <option value="fraction">Fraction</option>
              <option value="expression">Expression</option>
            </select>
          </div>
        </div>

        {form.answer_type === 'numeric' && (
          <div style={styles.field}>
            <label style={labelStyle}>Tolerance (±)</label>
            <input
              type="number"
              value={form.tolerance}
              onChange={e => update('tolerance', e.target.value)}
              style={inputStyle}
              placeholder="0.01"
              step="0.01"
            />
          </div>
        )}
      </div>

      {/* Parameters */}
      <div style={card}>
        <h2 style={sectionTitle}>Parameters</h2>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          Define variables used in the question. Leave as {'{}'} for non-parameterised questions.
        </p>
        <div style={styles.field}>
          <label style={labelStyle}>Parameters (JSON)</label>
          <textarea
            value={form.parameters}
            onChange={e => update('parameters', e.target.value)}
            style={{ ...inputStyle, fontFamily: 'monospace', minHeight: '120px', resize: 'vertical' as const }}
            placeholder={`{\n  "a": { "type": "integer", "min": 2, "max": 12 },\n  "b": { "type": "integer", "min": 2, "max": 12, "not_equal_to": "a" }\n}`}
          />
        </div>
      </div>

      {/* Templates */}
      <div style={card}>
        <h2 style={sectionTitle}>Question and answer</h2>

        <div style={styles.field}>
          <label style={labelStyle}>Question template (HTML)</label>
          <textarea
            value={form.question_template}
            onChange={e => update('question_template', e.target.value)}
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' as const }}
            placeholder="<p>Find the area of a rectangle with width <strong>{{a}} cm</strong> and height <strong>{{b}} cm</strong>.</p>"
          />
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Answer template</label>
          <input
            type="text"
            value={form.answer_template}
            onChange={e => update('answer_template', e.target.value)}
            style={inputStyle}
            placeholder="{{a * b}}"
          />
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Explanation (shown after answering)</label>
          <textarea
            value={form.explanation}
            onChange={e => update('explanation', e.target.value)}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
            placeholder="Area = width × height = {{a}} × {{b}} = {{a * b}} cm²"
          />
        </div>
      </div>

      {/* Traps */}
      <div style={card}>
        <h2 style={sectionTitle}>Traps</h2>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          Common wrong answers with targeted feedback.
        </p>
        {form.traps.map((trap, i) => (
          <div key={i} style={{ ...styles.trapBox }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={labelStyle}>Trap {i + 1}</label>
              <button
                onClick={() => removeTrap(i)}
                style={{ ...secondaryButton, width: 'auto', padding: '4px 10px', fontSize: font.sm, color: colors.dangerText, borderColor: colors.dangerBorder }}
              >
                Remove
              </button>
            </div>
            <div style={styles.field}>
              <label style={{ ...labelStyle, fontWeight: '400' }}>Wrong answer template</label>
              <input
                type="text"
                value={trap.answer_template}
                onChange={e => updateTrap(i, 'answer_template', e.target.value)}
                style={inputStyle}
                placeholder="{{a + b}}"
              />
            </div>
            <div style={styles.field}>
              <label style={{ ...labelStyle, fontWeight: '400' }}>Response to student</label>
              <textarea
                value={trap.response}
                onChange={e => updateTrap(i, 'response', e.target.value)}
                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' as const }}
                placeholder="It looks like you added the dimensions rather than multiplied them. Area = width × height."
              />
            </div>
          </div>
        ))}
        <button onClick={addTrap} style={{ ...secondaryButton, width: 'auto', padding: '8px 16px' }}>
          + Add trap
        </button>
      </div>

      {/* Preview */}
      <div style={card}>
        <h2 style={sectionTitle}>Preview</h2>
        <button onClick={generatePreview} style={{ ...secondaryButton, width: 'auto', padding: '8px 16px' }}>
          Generate preview
        </button>
        {previewError && <p style={errorBox}>{previewError}</p>}
        {preview && (
          <div style={styles.previewBox}>
            <p style={{ fontSize: font.base, fontWeight: '600', margin: '0 0 8px', color: colors.textSecondary }}>
              Question:
            </p>
            <div
              style={{ fontSize: font.lg, color: colors.textPrimary, marginBottom: '12px' }}
              dangerouslySetInnerHTML={{ __html: preview.question }}
            />
            <p style={{ fontSize: font.base, fontWeight: '600', margin: '0 0 4px', color: colors.textSecondary }}>
              Correct answer: <span style={{ color: colors.successText }}>{preview.answer}</span>
            </p>
            {preview.traps.length > 0 && (
              <>
                <p style={{ fontSize: font.base, fontWeight: '600', margin: '12px 0 6px', color: colors.textSecondary }}>
                  Traps:
                </p>
                {preview.traps.map((t, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <span style={{ color: colors.dangerText, fontWeight: '600' }}>{t.answer}</span>
                    <span style={{ color: colors.textSecondary, fontSize: font.sm }}> → {t.response}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Publish */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="checkbox"
            id="is_published"
            checked={form.is_published}
            onChange={e => update('is_published', e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="is_published" style={{ ...labelStyle, cursor: 'pointer' }}>
            Publish this question
          </label>
        </div>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
          Unpublished questions are saved as drafts and not shown to students.
        </p>
      </div>

      {error && <p style={errorBox}>{error}</p>}

      <button
        onClick={() => onSave(form)}
        disabled={saving || form.skill_ids.length === 0 || !form.question_template || !form.answer_template}
        style={{
          ...primaryButton,
          opacity: saving || form.skill_ids.length === 0 || !form.question_template || !form.answer_template ? 0.6 : 1,
        }}
      >
        {saving ? 'Saving...' : 'Save question'}
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
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
    minWidth: '180px',
  },
  trapBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    background: colors.background,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  previewBox: {
    padding: '16px',
    background: colors.background,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
}