'use client'

import { useState } from 'react'
import { skillsById } from '../../lib/skills/skillGraph'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, labelStyle, errorBox, sectionTitle,
} from '../../lib/styles'
import { buildOptions } from '../../lib/questions/multipleChoice'
import { generateValues, evaluateTemplate } from '../../lib/questions/paramEngine'

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

type SimpleParam = {
  name: string
  type: 'integer' | 'decimal'
  min: string
  max: string
  decimalPlaces: string
  constraintType: string
  constraintTarget: string
  constraintTargetType: 'parameter' | 'value'
}

function parseSimpleParams(parametersJson: string): SimpleParam[] {
  try {
    const parsed = JSON.parse(parametersJson)
    if (Object.keys(parsed).length === 0) return []
    return Object.entries(parsed).map(([name, config]: any) => ({
      name,
      type: config.type === 'decimal' ? 'decimal' : 'integer',
      min: config.min?.toString() ?? '',
      max: config.max?.toString() ?? '',
      decimalPlaces: config.decimal_places?.toString() ?? '1',
      constraintType: config.constraint?.type ?? '',
      constraintTarget: config.constraint?.target?.toString() ?? '',
      constraintTargetType: config.constraint?.target_type ?? 'parameter',
    }))
  } catch {
    return []
  }
}

export default function QuestionForm({ initialData, onSave, saving, error }: Props) {
  const [form, setForm] = useState<QuestionFormData>({ ...emptyForm, ...initialData })
  const [preview, setPreview] = useState<{ 
  question: string
  answer: string
  traps: { answer: string, response: string }[]
  explanation: string
} | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [skillSearch, setSkillSearch] = useState('')
  const [paramMode, setParamMode] = useState<'simple' | 'advanced'>('simple')
  const [simpleParams, setSimpleParams] = useState<SimpleParam[]>(() =>
    parseSimpleParams(initialData?.parameters ?? '{}')
  )
  const [useFixedValues, setUseFixedValues] = useState(false)
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({})
  const [validationError, setValidationError] = useState<string | null>(null)

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

  function addSimpleParam() {
    setSimpleParams(prev => [...prev, {
      name: '',
      type: 'integer',
      min: '1',
      max: '10',
      decimalPlaces: '1',
      constraintType: '',
      constraintTarget: '',
      constraintTargetType: 'parameter',
    }])
  }

  function removeSimpleParam(index: number) {
    setSimpleParams(prev => {
      const updated = prev.filter((_, i) => i !== index)
      syncParamsToForm(updated)
      return updated
    })
  }

  function updateSimpleParam(index: number, field: keyof SimpleParam, value: string) {
    setSimpleParams(prev => {
      const updated = prev.map((p, i) => i === index ? { ...p, [field]: value } : p)
      syncParamsToForm(updated)
      return updated
    })
  }

  function syncParamsToForm(params: SimpleParam[]) {
    const json: Record<string, any> = {}
    for (const p of params) {
      if (!p.name) continue
      const entry: Record<string, any> = {
        type: p.type,
        min: parseFloat(p.min) || 0,
        max: parseFloat(p.max) || 10,
      }
      if (p.type === 'decimal') {
        entry.decimal_places = parseInt(p.decimalPlaces) || 1
      }
      const noTargetConstraints = ['not_zero', 'is_prime', 'is_even', 'is_odd']

		if (p.constraintType) {
		  if (noTargetConstraints.includes(p.constraintType)) {
			entry.constraint = { type: p.constraintType }
		  } else if (p.constraintTarget) {
			entry.constraint = {
			  type: p.constraintType,
			  target: p.constraintTargetType === 'value'
				? parseFloat(p.constraintTarget)
				: p.constraintTarget,
			  target_type: p.constraintTargetType,
			}
		  }
		}
      json[p.name] = entry
    }
    update('parameters', JSON.stringify(json, null, 2))
  }

  function generatePreview() {
  setPreviewError(null)
  try {
	const params = JSON.parse(form.parameters)
	const generated: Record<string, number> = useFixedValues
	  ? Object.fromEntries(
		  Object.keys(params).map(key => [key, parseFloat(fixedValues[key] ?? '0')])
		)
	  : generateValues(params)

    const question = evaluateTemplate(form.question_template, generated)
	const answer = evaluateTemplate(form.answer_template, generated)
	const traps = form.traps.map(t => ({
	  answer: evaluateTemplate(t.answer_template, generated),
	  response: evaluateTemplate(t.response, generated),
	}))
	const explanation = form.explanation ? evaluateTemplate(form.explanation, generated) : ''

	if (!useFixedValues) {
	  setFixedValues(Object.fromEntries(
		Object.entries(generated).map(([k, v]) => [k, v.toString()])
	  ))
	}

	setPreview({ question, answer, traps, explanation })
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
				onChange={e => update('question_type', e.target.value as any)}
				style={inputStyle}
			  >
				<option value="numeric">Numeric</option>
				<option value="exact">Exact text</option>
				<option value="multiple_choice">Multiple choice</option>
			  </select>
			</div>
          <div style={styles.field}>
            <label style={labelStyle}>Difficulty</label>
            <select value={form.difficulty} onChange={e => update('difficulty', parseInt(e.target.value))} style={inputStyle}>
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={labelStyle}>Answer type</label>
            <select value={form.answer_type} onChange={e => update('answer_type', e.target.value as any)} style={inputStyle}>
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
          Define variables used in the question template.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
  <span style={{ fontSize: font.base, color: colors.textSecondary }}>Input mode:</span>
  <div style={styles.toggle}>
    <button
      onClick={() => setParamMode('simple')}
      style={{
        ...styles.toggleButton,
        background: paramMode === 'simple' ? colors.primary : colors.background,
        color: paramMode === 'simple' ? '#ffffff' : colors.textSecondary,
      }}
    >
      Simple
    </button>
    <button
      onClick={() => setParamMode('advanced')}
      style={{
        ...styles.toggleButton,
        background: paramMode === 'advanced' ? colors.primary : colors.background,
        color: paramMode === 'advanced' ? '#ffffff' : colors.textSecondary,
      }}
    >
      Advanced (JSON)
    </button>
  </div>
</div>

        {paramMode === 'simple' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {simpleParams.map((param, i) => (
              <div key={i} style={styles.trapBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle}>Parameter {i + 1}</label>
                  <button
                    onClick={() => removeSimpleParam(i)}
                    style={{ ...secondaryButton, width: 'auto', padding: '4px 10px', fontSize: font.sm, color: colors.dangerText, borderColor: colors.dangerBorder }}
                  >
                    Remove
                  </button>
                </div>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={{ ...labelStyle, fontWeight: '400' }}>Name</label>
                    <input
                      type="text"
                      value={param.name}
                      onChange={e => updateSimpleParam(i, 'name', e.target.value)}
                      style={inputStyle}
                      placeholder="a"
                      maxLength={10}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={{ ...labelStyle, fontWeight: '400' }}>Type</label>
                    <select value={param.type} onChange={e => updateSimpleParam(i, 'type', e.target.value)} style={inputStyle}>
                      <option value="integer">Integer</option>
                      <option value="decimal">Decimal</option>
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={{ ...labelStyle, fontWeight: '400' }}>Min</label>
                    <input type="number" value={param.min} onChange={e => updateSimpleParam(i, 'min', e.target.value)} style={inputStyle} placeholder="1" />
                  </div>
                  <div style={styles.field}>
                    <label style={{ ...labelStyle, fontWeight: '400' }}>Max</label>
                    <input type="number" value={param.max} onChange={e => updateSimpleParam(i, 'max', e.target.value)} style={inputStyle} placeholder="10" />
                  </div>
                  {param.type === 'decimal' && (
                    <div style={styles.field}>
                      <label style={{ ...labelStyle, fontWeight: '400' }}>Decimal places</label>
                      <input type="number" value={param.decimalPlaces} onChange={e => updateSimpleParam(i, 'decimalPlaces', e.target.value)} style={inputStyle} placeholder="1" min="1" max="4" />
                    </div>
                  )}
                </div>
                <div style={styles.trapBox}>
                  <label style={{ ...labelStyle, fontWeight: '400' }}>Constraint (optional)</label>
                  <div style={styles.row}>
                    <div style={styles.field}>
                      <select
						  value={param.constraintType}
						  onChange={e => updateSimpleParam(i, 'constraintType', e.target.value)}
						  style={inputStyle}
						>
						  <option value="">— none —</option>
						  <option value="neq">Not equal to</option>
						  <option value="gt">Greater than</option>
						  <option value="gte">Greater than or equal to</option>
						  <option value="lt">Less than</option>
						  <option value="lte">Less than or equal to</option>
						  <option value="multiple_of">Multiple of</option>
						  <option value="factor_of">Factor of</option>
						  <option value="not_zero">Not zero</option>
						  <option value="is_prime">Is prime</option>
						  <option value="is_even">Is even</option>
						  <option value="is_odd">Is odd</option>
						</select>
                    </div>
                    {param.constraintType && !['not_zero', 'is_prime', 'is_even', 'is_odd'].includes(param.constraintType) && (
					  <>
						<div style={styles.field}>
						  <select value={param.constraintTargetType} onChange={e => updateSimpleParam(i, 'constraintTargetType', e.target.value as any)} style={inputStyle}>
							<option value="parameter">Another parameter</option>
							<option value="value">Fixed value</option>
						  </select>
						</div>
						<div style={styles.field}>
						  {param.constraintTargetType === 'parameter' ? (
							<select value={param.constraintTarget} onChange={e => updateSimpleParam(i, 'constraintTarget', e.target.value)} style={inputStyle}>
							  <option value="">— select —</option>
							  {simpleParams
								.filter((_, j) => j !== i && simpleParams[j].name)
								.map((p, j) => (
								  <option key={j} value={p.name}>{p.name}</option>
								))}
							</select>
						  ) : (
							<input
							  type="number"
							  value={param.constraintTarget}
							  onChange={e => updateSimpleParam(i, 'constraintTarget', e.target.value)}
							  style={inputStyle}
							  placeholder="Value"
							/>
						  )}
						</div>
					  </>
					)}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addSimpleParam} style={{ ...secondaryButton, width: 'auto', padding: '8px 16px' }}>
              + Add parameter
            </button>
          </div>
        ) : (
          <div style={styles.field}>
            <label style={labelStyle}>Parameters (JSON)</label>
            <textarea
              value={form.parameters}
              onChange={e => update('parameters', e.target.value)}
              style={{ ...inputStyle, fontFamily: 'monospace', minHeight: '120px', resize: 'vertical' as const }}
              placeholder={`{\n  "a": { "type": "integer", "min": 2, "max": 12 },\n  "b": { "type": "integer", "min": 2, "max": 12 }\n}`}
            />
          </div>
        )}
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
          <div key={i} style={styles.trapBox}>
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

	  {Object.keys(JSON.parse(form.parameters || '{}')).length > 0 && (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
			<input
			  type="checkbox"
			  id="use_fixed"
			  checked={useFixedValues}
			  onChange={e => setUseFixedValues(e.target.checked)}
			  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
			/>
			<label htmlFor="use_fixed" style={{ ...labelStyle, cursor: 'pointer', fontWeight: '400' }}>
			  Use fixed parameter values
			</label>
		  </div>

		  {useFixedValues && (
			<div style={styles.row}>
			  {Object.entries(JSON.parse(form.parameters || '{}')).map(([key]) => (
				<div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '80px' }}>
				  <label style={{ ...labelStyle, fontWeight: '400' }}>{key} =</label>
				  <input
					type="number"
					value={fixedValues[key] ?? ''}
					onChange={e => setFixedValues(prev => ({ ...prev, [key]: e.target.value }))}
					style={{ ...inputStyle, padding: '6px 10px' }}
				  />
				</div>
			  ))}
			</div>
		  )}
		</div>
	  )}

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
			Correct answer:
		  </p>
		  <div
			style={{ fontSize: font.lg, fontWeight: '600', color: colors.successText, marginBottom: '12px' }}
			dangerouslySetInnerHTML={{ __html: preview.answer }}
		  />
		  {form.question_type === 'multiple_choice' && (
			  <>
				<p style={{ fontSize: font.base, fontWeight: '600', margin: '12px 0 6px', color: colors.textSecondary }}>
				  Options (shuffled):
				</p>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
				  {buildOptions(preview.answer, preview.traps).map((opt, i) => (
					<div
					  key={i}
					  style={{
						padding: '10px 14px',
						borderRadius: radius.md,
						border: `1px solid ${opt === preview.answer ? colors.successBorder : colors.border}`,
						background: opt === preview.answer ? colors.successLight : colors.background,
						fontSize: font.base,
						color: colors.textPrimary,
					  }}
					  dangerouslySetInnerHTML={{ __html: opt }}
					/>
				  ))}
				</div>
			  </>
			)}
		  {preview.traps.length > 0 && (
			<>
			  <p style={{ fontSize: font.base, fontWeight: '600', margin: '12px 0 6px', color: colors.textSecondary }}>
				Traps:
			  </p>
			  {preview.traps.map((t, i) => (
				<div key={i} style={{ marginBottom: '8px' }}>
				  <span
					style={{ color: colors.dangerText, fontWeight: '600' }}
					dangerouslySetInnerHTML={{ __html: t.answer }}
				  />
				  <span
					style={{ color: colors.textSecondary, fontSize: font.sm }}
					dangerouslySetInnerHTML={{ __html: ` → ${t.response}` }}
				  />
				</div>
			  ))}
			</>
		  )}
		  {preview.explanation && (
			<>
			  <p style={{ fontSize: font.base, fontWeight: '600', margin: '12px 0 4px', color: colors.textSecondary }}>
				Explanation:
			  </p>
			  <div
				style={{ fontSize: font.base, color: colors.textPrimary }}
				dangerouslySetInnerHTML={{ __html: preview.explanation }}
			  />
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

      {validationError && <p style={errorBox}>{validationError}</p>}

{error && <p style={errorBox}>{error}</p>}

<button
  onClick={() => {
    setValidationError(null)
    if (form.skill_ids.length === 0) {
      setValidationError('Please select at least one skill before saving.')
      return
    }
    if (!form.question_template) {
      setValidationError('Please enter a question template before saving.')
      return
    }
    if (!form.answer_template) {
      setValidationError('Please enter an answer template before saving.')
      return
    }
    onSave(form)
  }}
  disabled={saving}
  style={{ ...primaryButton, opacity: saving ? 0.6 : 1 }}
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
  toggle: {
  display: 'flex',
  borderRadius: radius.md,
  overflow: 'hidden',
  border: `1px solid ${colors.borderStrong}`,
  width: 'fit-content',
},
toggleButton: {
  padding: '6px 20px',
  border: 'none',
  fontSize: font.base,
  fontWeight: '600',
  cursor: 'pointer',
  background: 'transparent',
  whiteSpace: 'nowrap' as const,
},
}