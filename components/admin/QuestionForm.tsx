'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { skillsById } from '../../lib/skills/skillGraph'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, labelStyle, errorBox, sectionTitle,
} from '../../lib/styles'
import { buildOptions, renderMcOptions } from '../../lib/questions/multipleChoice'
import { generateValues, evaluateTemplate, renderMultiPartQuestion } from '../../lib/questions/paramEngine'
import {
  CalculatorMode, CALCULATOR_MODES, CALCULATOR_LABELS, DEFAULT_CALCULATOR_MODE,
} from '../../lib/questions/calculator'
import {
  QuestionKind, QUESTION_KINDS, QUESTION_KIND_LABELS, DEFAULT_QUESTION_KIND,
} from '../../lib/questions/kind'
import { PartInput, emptyPart, computeSkillUnion, normalizeGrid } from '../../lib/questions/parts'
import GridCanvas from '../practice/GridCanvas'
import type { RenderedGrid } from '../../lib/questions/gridDraw'
import PartEditor from './PartEditor'
import { supabase } from '../../lib/supabase'
import { checkAnswer, CheckResult } from '../../lib/questions/answerChecker'
import CollapsibleCard from './CollapsibleCard'
import { resolveQuestionMarks, evidenceFor } from '../../lib/exam/markEvidence'

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
  answer_type: 'exact' | 'numeric' | 'fraction' | 'expression' | 'set' | 'ratio' | 'coordinate'
  tolerance: string
  requires_simplest: boolean
  calculator: CalculatorMode
  kind: QuestionKind
  /**
   * Explicit exam marks for a SINGLE-PART question. Empty = use the estimate
   * from the coded papers (lib/exam/markEvidence.ts). Multi-part questions
   * ignore this and sum their parts.
   */
  marks: string
  mc_options: string[]
  traps: Trap[]
  explanation: string
  image_url: string
  is_published: boolean
  multiPart: boolean
  parts: PartInput[]
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
  requires_simplest: false,
  calculator: DEFAULT_CALCULATOR_MODE,
  kind: DEFAULT_QUESTION_KIND,
  marks: '',
  mc_options: [],
  traps: [],
  explanation: '',
  image_url: '',
  is_published: false,
  multiPart: false,
  parts: [],
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
  const [form, setForm] = useState<QuestionFormData>({
    ...emptyForm,
    ...initialData,
    image_url: typeof (initialData as any)?.image_url === 'string'
      ? (initialData as any).image_url
      : '',
    parts: Array.isArray((initialData as any)?.parts) ? (initialData as any).parts : [],
    multiPart: Array.isArray((initialData as any)?.parts) && (initialData as any).parts.length > 0,
    mc_options: Array.isArray((initialData as any)?.mc_options) ? (initialData as any).mc_options : [],
  })
  const [preview, setPreview] = useState<{
    question: string
    answer: string
    traps: { answer: string, response: string }[]
    explanation: string
    mcOptions: string[] | null
  } | null>(null)
  const [partsPreview, setPartsPreview] = useState<{
    stem: string
    parts: {
      prompt: string
      answer: string
      traps: { answer: string, response: string }[]
      explanation: string
      blanks?: { label: string, answer: string, traps: { answer: string, response: string }[] }[]
      grid?: RenderedGrid
    }[]
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
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const [graderTestInput, setGraderTestInput] = useState('')
  const [graderTestResult, setGraderTestResult] = useState<CheckResult | null>(null)
  const [partGraderInputs, setPartGraderInputs] = useState<Record<number, string>>({})
  const [partGraderResults, setPartGraderResults] = useState<Record<number, CheckResult | null>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  function update(field: keyof QuestionFormData, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ─── Save logic ────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setValidationError(null)
    if (form.multiPart) {
      if (form.parts.length === 0) {
        setValidationError('Add at least one part before saving.')
        return
      }
      const unattributed: string[] = []
      for (let i = 0; i < form.parts.length; i++) {
        const p = form.parts[i]
        const letter = 'abcdefghijklmnopqrstuvwxyz'[i] ?? String(i + 1)
        if (!p.prompt.trim()) {
          setValidationError(`Part (${letter}) needs a prompt.`)
          return
        }
        if (p.answer_type === 'grid_draw') {
          const g = p.grid
          if (!g || g.elements.filter(el => String(el.x).trim() !== '' || String(el.y).trim() !== '').length === 0) {
            setValidationError(`Part (${letter}) is a grid drawing but has no correct points — add at least one.`)
            return
          }
          const nEls = g.elements.filter(el => String(el.x).trim() !== '' || String(el.y).trim() !== '').length
          if (g.mode === 'line' && nEls !== 2) {
            setValidationError(`Part (${letter}) is a straight-line drawing — give exactly 2 endpoints (it has ${nEls}).`)
            return
          }
          if (g.mode === 'polygon' && nEls < 3) {
            setValidationError(`Part (${letter}) is a polygon — give at least 3 corners (it has ${nEls}).`)
            return
          }
          if (g.mode === 'cells' && Number(g.tolerance) > 0) {
            setValidationError(`Part (${letter}) shades squares — tolerance must be 0 (shading is exact).`)
            return
          }
          if (g.mode === 'number_line') {
            if (nEls !== 1) {
              setValidationError(`Part (${letter}) is a number line — mark exactly 1 value (it has ${nEls}).`)
              return
            }
            if (String(g.y.min).trim() !== String(g.y.max).trim()) {
              setValidationError(`Part (${letter}) is a number line — set y min and y max the same (it is a 1-D axis).`)
              return
            }
          }
          if (g.mode === 'bars' || g.mode === 'bars_free') {
            for (const [bi, el] of g.elements.entries()) {
              const from = Number(el.x)
              const to = el.x2 == null || String(el.x2).trim() === '' ? from + Number(g.x.step || 1) : Number(el.x2)
              // Templates can't be range-checked here; the harness does that
              // per parameter draw. Only catch plainly-numeric mistakes.
              if (Number.isFinite(from) && Number.isFinite(to) && to <= from) {
                setValidationError(`Part (${letter}) bar ${bi + 1}: x2 (${to}) must be greater than x (${from}).`)
                return
              }
            }
          }
          for (const [ti, t] of (g.traps ?? []).entries()) {
            if (!t.response.trim()) {
              setValidationError(`Part (${letter}) trap ${ti + 1} needs a response — without one it would match silently.`)
              return
            }
            // A 'translated' trap is a predicate — it carries no points.
            if (t.match === 'translated') continue
            const tEls = t.elements.filter(e => String(e.x).trim() !== '' || String(e.y).trim() !== '')
            if (tEls.length === 0) {
              setValidationError(`Part (${letter}) trap ${ti + 1} has no points — give the wrong drawing, or remove the trap.`)
              return
            }
            if (!t.response.trim()) {
              setValidationError(`Part (${letter}) trap ${ti + 1} needs a response — without one it would match silently.`)
              return
            }
            if (g.mode === 'line' && tEls.length !== 2) {
              setValidationError(`Part (${letter}) trap ${ti + 1}: a straight-line trap needs exactly 2 points (it has ${tEls.length}).`)
              return
            }
            if (g.mode === 'polygon' && tEls.length < 3) {
              setValidationError(`Part (${letter}) trap ${ti + 1}: a polygon trap needs at least 3 corners (it has ${tEls.length}).`)
              return
            }
            if (g.mode !== 'line' && g.mode !== 'polygon' && tEls.length !== nEls) {
              setValidationError(`Part (${letter}) trap ${ti + 1} has ${tEls.length} points but the answer has ${nEls} — it could never match.`)
              return
            }
          }
          for (const axis of ['x', 'y'] as const) {
            for (const bound of ['min', 'max'] as const) {
              const v = String(g[axis][bound]).trim()
              if (v === '' || (!Number.isFinite(Number(v)) && !v.includes('{{'))) {
                setValidationError(`Part (${letter}) grid: ${axis} ${bound} must be a number or a {{template}}.`)
                return
              }
            }
            const step = Number(g[axis].step)
            if (!Number.isFinite(step) || step <= 0) {
              setValidationError(`Part (${letter}) grid: ${axis} step must be a positive number.`)
              return
            }
          }
        } else if (p.answer_type === 'multi_blank') {
          // Multi-blank parts carry their answers per BLANK, not on the part.
          const blanks = p.blanks ?? []
          if (blanks.length === 0) {
            setValidationError(`Part (${letter}) is multi-blank but has no blanks — add at least one.`)
            return
          }
          for (const b of blanks) {
            if (!b.label.trim()) {
              setValidationError(`Part (${letter}) has a blank without a label.`)
              return
            }
            if (!b.answer_template.trim()) {
              setValidationError(`Part (${letter}) blank ${b.label.trim()} needs an answer template.`)
              return
            }
          }
          const labels = blanks.map(b => b.label.trim().toUpperCase())
          if (new Set(labels).size !== labels.length) {
            setValidationError(`Part (${letter}) has duplicate blank labels — each blank needs its own.`)
            return
          }
        } else if (!p.answer_template.trim()) {
          setValidationError(`Part (${letter}) needs an answer template.`)
          return
        }
        if (p.skill_ids.length === 0) unattributed.push(letter)
      }
      // A part with no skill records no mastery signal — intended for
      // decision/comparison steps (e.g. "which shop is cheaper?"), but easy to
      // leave off by accident, so confirm rather than silently allow.
      if (unattributed.length > 0) {
        const many = unattributed.length > 1
        const list = unattributed.map(l => `(${l})`).join(', ')
        const ok = window.confirm(
          `Part${many ? 's' : ''} ${list} ${many ? 'have' : 'has'} no skill assigned, so ${many ? 'they' : 'it'} will not affect any student's mastery.\n\n` +
          `This is intended for a decision/comparison step. Save anyway?`,
        )
        if (!ok) return
      }
      onSave(form)
      return
    }
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
  }, [form, onSave])

  // Ctrl+S / Cmd+S shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (!saving) handleSave()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handleSave, saving])

  // ─── Traps ────────────────────────────────────────────────────────────────
  function addTrap() {
    update('traps', [...form.traps, { answer_template: '', response: '' }])
  }
  function updateTrap(index: number, field: keyof Trap, value: string) {
    update('traps', form.traps.map((t, i) => i === index ? { ...t, [field]: value } : t))
  }
  function removeTrap(index: number) {
    update('traps', form.traps.filter((_, i) => i !== index))
  }

  // ─── MC options ───────────────────────────────────────────────────────────
  function addMcOption() {
    update('mc_options', [...form.mc_options, ''])
  }
  function updateMcOption(index: number, value: string) {
    update('mc_options', form.mc_options.map((o, i) => i === index ? value : o))
  }
  function removeMcOption(index: number) {
    update('mc_options', form.mc_options.filter((_, i) => i !== index))
  }

  // ─── Skills ───────────────────────────────────────────────────────────────
  function toggleSkill(skillId: string) {
    if (form.skill_ids.includes(skillId)) {
      update('skill_ids', form.skill_ids.filter(id => id !== skillId))
    } else {
      update('skill_ids', [...form.skill_ids, skillId])
    }
  }

  // ─── Parts ────────────────────────────────────────────────────────────────
  function addPart() {
    update('parts', [...form.parts, emptyPart() as PartInput])
  }
  function updatePart(index: number, next: PartInput) {
    update('parts', form.parts.map((p, i) => i === index ? next : p))
  }
  function removePart(index: number) {
    update('parts', form.parts.filter((_, i) => i !== index))
  }

  // ─── Image upload ─────────────────────────────────────────────────────────
  async function handleImageUpload(file: File) {
    setImageError(null)
    setImageUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('question-images').getPublicUrl(path)
      update('image_url', urlData.publicUrl)
    } catch (e: any) {
      setImageError(e.message ?? 'Upload failed')
    } finally {
      setImageUploading(false)
    }
  }

  // ─── Simple params ────────────────────────────────────────────────────────
  function addSimpleParam() {
    setSimpleParams(prev => [...prev, {
      name: '', type: 'integer', min: '1', max: '10', decimalPlaces: '1',
      constraintType: '', constraintTarget: '', constraintTargetType: 'parameter',
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

  // ─── Grader test ──────────────────────────────────────────────────────────
  function runGraderTest() {
    if (!preview) return
    const result = checkAnswer(
      graderTestInput,
      preview.answer,
      form.answer_type,
      form.answer_type === 'numeric' ? parseFloat(form.tolerance) || 0 : null,
      preview.traps,
      form.requires_simplest,
    )
    setGraderTestResult(result)
  }

  function runPartGraderTest(partIndex: number) {
    if (!partsPreview) return
    const part = form.parts[partIndex]
    const partPrev = partsPreview.parts[partIndex]
    if (!part || !partPrev) return
    const result = checkAnswer(
      partGraderInputs[partIndex] ?? '',
      partPrev.answer,
      (part.answer_type ?? 'numeric') as Parameters<typeof checkAnswer>[2],
      part.answer_type === 'numeric' ? parseFloat(String(part.tolerance ?? '0')) || 0 : null,
      partPrev.traps,
      part.requires_simplest ?? false,
    )
    setPartGraderResults(prev => ({ ...prev, [partIndex]: result }))
  }

  function renderGradeResult(result: CheckResult) {
    const isTrap = !result.correct && result.trap !== null
    return (
      <div style={{
        marginTop: '8px',
        padding: '10px 14px',
        borderRadius: radius.md,
        background: result.correct ? colors.successLight : isTrap ? '#fff7ed' : '#fef2f2',
        border: `1px solid ${result.correct ? colors.successBorder : isTrap ? '#fed7aa' : '#fecaca'}`,
        fontSize: font.base,
        color: result.correct ? colors.successText : isTrap ? '#9a3412' : colors.dangerText,
      }}>
        {result.correct ? '✓ ' : '✗ '}{result.message}
        {isTrap && (
          <span style={{ fontSize: font.sm, opacity: 0.75, marginLeft: '8px' }}>
            (trap matched)
          </span>
        )}
      </div>
    )
  }

  // ─── Preview ──────────────────────────────────────────────────────────────
  function generatePreview() {
    setPreviewError(null)
    setGraderTestInput('')
    setGraderTestResult(null)
    setPartGraderInputs({})
    setPartGraderResults({})
    try {
      const params = JSON.parse(form.parameters)
      const generated: Record<string, number> = useFixedValues
        ? Object.fromEntries(
            Object.keys(params).map(key => [key, parseFloat(fixedValues[key] ?? '0')])
          )
        : generateValues(params)

      if (form.multiPart) {
        const rendered = renderMultiPartQuestion(
          form.question_template,
          form.parts.map(p => ({
            prompt: p.prompt,
            answer_template: p.answer_template,
            traps: p.traps,
            explanation: p.explanation,
            blanks: p.blanks?.map(b => ({
              label: b.label,
              prompt: b.prompt,
              answer_template: b.answer_template,
              traps: b.traps,
            })),
            // normalizeGrid coerces the form's string fields so templates
            // stay templates and plain numbers become numbers.
            grid: p.answer_type === 'grid_draw' && p.grid ? normalizeGrid(p.grid) : undefined,
          })),
          params,
          generated,
        )
        if (!useFixedValues) {
          setFixedValues(Object.fromEntries(
            Object.entries(rendered.generatedValues).map(([k, v]) => [k, v.toString()])
          ))
        }
        setPartsPreview({ stem: rendered.stem, parts: rendered.parts })
        setPreview(null)
        return
      }

      const question = evaluateTemplate(form.question_template, generated)
      const answer = evaluateTemplate(form.answer_template, generated)
      const traps = form.traps.map(t => ({
        answer: evaluateTemplate(t.answer_template, generated),
        response: evaluateTemplate(t.response, generated),
      }))
      const explanation = form.explanation ? evaluateTemplate(form.explanation, generated) : ''
      const mcOptions = renderMcOptions(form.mc_options, generated)

      if (!useFixedValues) {
        setFixedValues(Object.fromEntries(
          Object.entries(generated).map(([k, v]) => [k, v.toString()])
        ))
      }

      setPartsPreview(null)
      setPreview({ question, answer, traps, explanation, mcOptions })
    } catch (e: any) {
      setPreviewError(e.message)
    }
  }

  // ─── Skills filter ────────────────────────────────────────────────────────
  const filteredSkills = Object.entries(skillsById)
    .filter(([, skill]) =>
      !skillSearch ||
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      skill.topic.toLowerCase().includes(skillSearch.toLowerCase())
    )
    .sort((a, b) => a[1].topic.localeCompare(b[1].topic) || a[1].name.localeCompare(b[1].name))

  // ─── Collapsed summaries ──────────────────────────────────────────────────
  const structureSummary = form.multiPart
    ? `Multi-part · ${form.parts.length} part${form.parts.length !== 1 ? 's' : ''}`
    : 'Single question'

  const skillsSummary = (() => {
    if (form.skill_ids.length === 0) return 'No skills selected'
    const names = form.skill_ids.map(id => skillsById[id]?.name ?? id)
    const shown = names.slice(0, 2).join(', ')
    return `${form.skill_ids.length} skill${form.skill_ids.length !== 1 ? 's' : ''} · ${shown}${names.length > 2 ? ', …' : ''}`
  })()

  const skillsAutoSummary = (() => {
    const union = computeSkillUnion(form.parts)
    if (union.length === 0) return 'No skills yet'
    return union.slice(0, 3).map(id => skillsById[id]?.name ?? id).join(', ') + (union.length > 3 ? ', …' : '')
  })()

  const detailsSummary = `${form.difficulty}★ · ${form.answer_type}`

  // What the exam layer would award if the marks field is left blank, plus the
  // evidence behind it — so the author is choosing against real papers rather
  // than guessing. Skills/kind come straight from the form, so this updates live.
  const estimatedMarks = resolveQuestionMarks({
    skill_ids: form.skill_ids, kind: form.kind, difficulty: form.difficulty,
  }).marks
  const markStats = evidenceFor(form.skill_ids, form.kind === 'exam' ? 'exam' : 'mastery')

  const paramSummary = (() => {
    try {
      const keys = Object.keys(JSON.parse(form.parameters || '{}'))
      return keys.length > 0 ? keys.join(', ') : 'No parameters'
    } catch { return '' }
  })()

  const templateSummary = (() => {
    const plain = form.question_template.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    return plain.length > 60 ? plain.slice(0, 60) + '…' : plain || 'No template yet'
  })()

  const partsSummary = `${form.parts.length} part${form.parts.length !== 1 ? 's' : ''}`

  const trapsSummary = form.traps.length === 0
    ? 'No traps'
    : `${form.traps.length} trap${form.traps.length !== 1 ? 's' : ''}`

  const mcOptionsSummary = (() => {
    const count = form.mc_options.filter(o => o.trim()).length
    return count === 0 ? 'Auto-generated distractors' : `${count} explicit option${count !== 1 ? 's' : ''}`
  })()

  const imageSummary = form.image_url ? 'Image attached' : 'No image'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '72px' }}>

      {/* ── Question structure ── */}
      <CollapsibleCard title="Question structure" storageKey="structure" summary={structureSummary}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="checkbox"
            id="multi_part"
            checked={form.multiPart}
            onChange={e => {
              const on = e.target.checked
              if (on && form.parts.length === 0) {
                setForm(prev => ({ ...prev, multiPart: true, parts: [emptyPart() as PartInput] }))
              } else {
                update('multiPart', on)
              }
            }}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="multi_part" style={{ ...labelStyle, cursor: 'pointer' }}>
            Multi-part question (parts a, b, c…)
          </label>
        </div>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
          Each part is graded and attributed independently — its own skills, answer, traps and kind.
          The skills, answer, traps and explanation below move into the parts.
        </p>
      </CollapsibleCard>

      {/* ── Skills (single-question mode) ── */}
      {!form.multiPart && (
        <CollapsibleCard title="Skills" required storageKey="skills" summary={skillsSummary}>
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
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid ${colors.border}`, borderRadius: radius.md }}>
            {filteredSkills.map(([id, skill]) => (
              <div
                key={id}
                onClick={() => toggleSkill(id)}
                style={{
                  padding: '8px 12px', cursor: 'pointer',
                  background: form.skill_ids.includes(id) ? '#e0f2fe' : 'transparent',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span style={{ fontSize: font.base, color: colors.textPrimary }}>{skill.name}</span>
                <span style={{ fontSize: font.sm, color: colors.textSecondary }}>{skill.topic}</span>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}

      {/* ── Skills summary (multi-part mode) ── */}
      {form.multiPart && (
        <CollapsibleCard title="Skills covered (auto)" storageKey="skills-auto" summary={skillsAutoSummary}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Combined from the parts below — set each part's skills in its own card.
          </p>
          {(() => {
            const union = computeSkillUnion(form.parts)
            return union.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                {union.map(id => (
                  <span
                    key={id}
                    style={{
                      fontSize: font.sm, padding: '3px 8px', borderRadius: radius.sm,
                      background: '#f1f5f9', color: '#475569', border: `1px solid ${colors.border}`,
                    }}
                  >
                    {skillsById[id]?.name ?? id}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, fontStyle: 'italic' }}>
                No skills yet — add them inside the parts.
              </p>
            )
          })()}
        </CollapsibleCard>
      )}

      {/* ── Question details ── */}
      <CollapsibleCard title="Question details" storageKey="details" summary={detailsSummary}>
        <div style={styles.row}>
          {!form.multiPart && (
            <div style={styles.field}>
              <label style={labelStyle}>Question type</label>
              <select value={form.question_type} onChange={e => update('question_type', e.target.value as any)} style={inputStyle}>
                <option value="numeric">Numeric</option>
                <option value="exact">Exact text</option>
                <option value="multiple_choice">Multiple choice</option>
              </select>
            </div>
          )}
          <div style={styles.field}>
            <label style={labelStyle}>Difficulty</label>
            <select value={form.difficulty} onChange={e => update('difficulty', parseInt(e.target.value))} style={inputStyle}>
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>
              ))}
            </select>
          </div>
          {/* Multi-part questions are priced by summing their parts, so this is
              a single-part-only override. Left empty, the exam layer estimates
              from the coded papers — see the evidence note below. */}
          {!form.multiPart && (
            <div style={styles.field}>
              <label style={labelStyle}>Exam marks</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.marks}
                onChange={e => update('marks', e.target.value)}
                placeholder={`auto (${estimatedMarks})`}
                style={inputStyle}
              />
            </div>
          )}
          {!form.multiPart && (
            <div style={styles.field}>
              <label style={labelStyle}>Answer type</label>
              <select value={form.answer_type} onChange={e => update('answer_type', e.target.value as any)} style={inputStyle}>
                <option value="numeric">Numeric</option>
                <option value="exact">Exact</option>
                <option value="fraction">Fraction</option>
                <option value="expression">Expression</option>
                <option value="set">Set</option>
                <option value="ratio">Ratio</option>
                <option value="coordinate">Coordinate</option>
              </select>
            </div>
          )}
        </div>
        {/* Evidence for the marks field: what real papers award for this
            material. Guidance, never enforcement — the spread within a skill is
            genuine (marks track solution steps, not topic), so the author's
            judgement wins. Says so plainly when the evidence is too thin. */}
        {!form.multiPart && (
          <p style={{ fontSize: '11px', color: colors.textHint, margin: '-4px 0 0', lineHeight: 1.6 }}>
            {markStats
              ? <>2024 papers, this material · {form.kind === 'exam' ? 'synthesis' : 'single-skill'}:{' '}
                  <strong>n={markStats.n}, mean {markStats.mean}, range {markStats.min}–{markStats.max}</strong>
                  {markStats.splits.length > 0 && <> — usually {markStats.splits.join(' or ')}</>}.{' '}
                  Leave blank to use the estimate ({estimatedMarks}).</>
              : <>No coded evidence for these skills yet — the estimate ({estimatedMarks}) comes from the{' '}
                  {form.kind === 'exam' ? 'synthesis' : 'single-skill'} average across all papers. Set a value if you know better.</>}
          </p>
        )}
        {!form.multiPart && form.answer_type === 'numeric' && (
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
        {!form.multiPart && (form.answer_type === 'fraction' || form.answer_type === 'ratio') && (
          <div style={styles.field}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.requires_simplest}
                onChange={e => update('requires_simplest', e.target.checked)}
              />
              Requires simplest form
            </label>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
              When on, a correct but unsimplified answer is rejected with a "simplify fully" message.
            </p>
          </div>
        )}
        <div style={styles.field}>
          <label style={labelStyle}>Calculator</label>
          <select value={form.calculator} onChange={e => update('calculator', e.target.value as CalculatorMode)} style={inputStyle}>
            {CALCULATOR_MODES.map(mode => (
              <option key={mode} value={mode}>{CALCULATOR_LABELS[mode]}</option>
            ))}
          </select>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
            A "Calculator required" question is only ever served on calculator papers.
          </p>
        </div>
        {!form.multiPart && (
          <div style={styles.field}>
            <label style={labelStyle}>Kind</label>
            <select value={form.kind} onChange={e => update('kind', e.target.value as QuestionKind)} style={inputStyle}>
              {QUESTION_KINDS.map(k => (
                <option key={k} value={k}>{QUESTION_KIND_LABELS[k]}</option>
              ))}
            </select>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
              "Exam" = an irreducible multi-skill question; wrong answers never lower mastery. Use "Mastery" for everything that cleanly tests one skill.
            </p>
          </div>
        )}
      </CollapsibleCard>

      {/* ── Parameters ── */}
      <CollapsibleCard title="Parameters" storageKey="params" summary={paramSummary}>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          Define variables used in the question template.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    <input type="text" value={param.name} onChange={e => updateSimpleParam(i, 'name', e.target.value)} style={inputStyle} placeholder="a" maxLength={10} />
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
                      <select value={param.constraintType} onChange={e => updateSimpleParam(i, 'constraintType', e.target.value)} style={inputStyle}>
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
              ref={autoResize}
              value={form.parameters}
              onChange={e => { update('parameters', e.target.value); autoResize(e.target) }}
              style={{ ...inputStyle, fontFamily: 'monospace', minHeight: '120px', resize: 'none' as const }}
              placeholder={`{\n  "a": { "type": "integer", "min": 2, "max": 12 },\n  "b": { "type": "integer", "min": 2, "max": 12 }\n}`}
            />
          </div>
        )}
      </CollapsibleCard>

      {/* ── Templates ── */}
      <CollapsibleCard
        title={form.multiPart ? 'Shared stem' : 'Question and answer'}
        storageKey="templates"
        summary={templateSummary}
      >
        <div style={styles.field}>
          <label style={labelStyle}>
            {form.multiPart ? 'Shared stem template (HTML) — shown above every part' : 'Question template (HTML)'}
            {!form.multiPart && <span style={{ color: colors.dangerText, marginLeft: '4px', fontWeight: '400' }}>*</span>}
          </label>
          <textarea
            ref={autoResize}
            value={form.question_template}
            onChange={e => { update('question_template', e.target.value); autoResize(e.target) }}
            style={{ ...inputStyle, minHeight: '120px', resize: 'none' as const, fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
            placeholder={form.multiPart
              ? '<p>The table shows... Use it to answer the parts below.</p>'
              : '<p>Find the area of a rectangle with width <strong>{{a}} cm</strong> and height <strong>{{b}} cm</strong>.</p>'}
          />
          {form.multiPart && (
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
              Optional shared context. May be left blank if each part is self-contained.
            </p>
          )}
        </div>
        {!form.multiPart && (
          <div style={styles.field}>
            <label style={labelStyle}>
              Answer template
              <span style={{ color: colors.dangerText, marginLeft: '4px', fontWeight: '400' }}>*</span>
            </label>
            <input
              type="text"
              value={form.answer_template}
              onChange={e => update('answer_template', e.target.value)}
              style={inputStyle}
              placeholder="{{a * b}}"
            />
          </div>
        )}
        {!form.multiPart && (
          <div style={styles.field}>
            <label style={labelStyle}>Explanation (shown after answering)</label>
            <textarea
              ref={autoResize}
              value={form.explanation}
              onChange={e => { update('explanation', e.target.value); autoResize(e.target) }}
              style={{ ...inputStyle, minHeight: '80px', resize: 'none' as const }}
              placeholder="Area = width × height = {{a}} × {{b}} = {{a * b}} cm²"
            />
          </div>
        )}
      </CollapsibleCard>

      {/* ── Parts (multi-part mode) ── */}
      {form.multiPart && (
        <CollapsibleCard title="Parts" storageKey="parts" summary={partsSummary}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Each part is answered, graded and attributed on its own. Parts share the stem's parameters.
          </p>
          {form.parts.map((part, i) => (
            <PartEditor
              key={i}
              index={i}
              part={part}
              onChange={next => updatePart(i, next)}
              onRemove={() => removePart(i)}
              autoResize={autoResize}
            />
          ))}
          <button onClick={addPart} style={{ ...secondaryButton, width: 'auto', padding: '8px 16px' }}>
            + Add part
          </button>
        </CollapsibleCard>
      )}

      {/* ── Preview — sits before Image/Traps so you can preview as you write ── */}
      <CollapsibleCard title="Preview" storageKey="preview">
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

        {/* Multi-part preview */}
        {partsPreview && (
          <div style={styles.previewBox}>
            {partsPreview.stem && (
              <div
                style={{ fontSize: font.lg, color: colors.textPrimary, marginBottom: '16px' }}
                dangerouslySetInnerHTML={{ __html: partsPreview.stem }}
              />
            )}
            {partsPreview.parts.map((p, pi) => (
              <div key={pi} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: pi < partsPreview.parts.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                <p style={{ fontSize: font.base, fontWeight: '600', margin: '0 0 6px', color: colors.textSecondary }}>
                  Part ({'abcdefghijklmnopqrstuvwxyz'[pi] ?? pi + 1})
                </p>
                <div
                  style={{ fontSize: font.lg, color: colors.textPrimary, marginBottom: '8px' }}
                  dangerouslySetInnerHTML={{ __html: p.prompt }}
                />
                {p.grid ? (
                  <>
                    <p style={{ fontSize: font.base, fontWeight: '600', margin: '0 0 4px', color: colors.textSecondary }}>
                      Correct drawing (rendered from the templates):
                    </p>
                    {p.grid.elements.every(el => Number.isFinite(el.x) && Number.isFinite(el.y))
                      && [p.grid.x.min, p.grid.x.max, p.grid.y.min, p.grid.y.max].every(Number.isFinite) ? (
                      <div style={{ maxWidth: '420px' }}>
                        <GridCanvas grid={p.grid} value={[]} readOnly showCanonical />
                      </div>
                    ) : (
                      <p style={{ fontSize: font.sm, color: colors.dangerText, margin: 0 }}>
                        ✗ A grid template did not evaluate to a number at these values — check the axis bounds and point coordinates.
                      </p>
                    )}
                  </>
                ) : p.blanks ? (
                  <>
                    <p style={{ fontSize: font.base, fontWeight: '600', margin: '0 0 4px', color: colors.textSecondary }}>
                      Blanks:
                    </p>
                    {p.blanks.map((b, bi) => {
                      // Canonical self-grade: the rendered answer must grade
                      // correct against itself with this blank's settings —
                      // the same gate the harness applies per blank.
                      const def = form.parts[pi]?.blanks?.[bi]
                      const selfGrade = def ? checkAnswer(
                        b.answer, b.answer, def.answer_type,
                        def.answer_type === 'numeric' ? parseFloat(String(def.tolerance ?? '0')) || 0 : null,
                        [], def.requires_simplest ?? false,
                      ).correct : false
                      return (
                        <div key={bi} style={{ marginBottom: '6px' }}>
                          <span style={{ fontSize: font.base, fontWeight: '600', color: selfGrade ? colors.successText : colors.dangerText }}>
                            {selfGrade ? '✓' : '✗'} {b.label} = <span dangerouslySetInnerHTML={{ __html: b.answer }} />
                          </span>
                          {!selfGrade && (
                            <span style={{ fontSize: font.sm, color: colors.dangerText, marginLeft: '8px' }}>
                              (does not self-grade — check the template/type)
                            </span>
                          )}
                          {b.traps.map((t, ti) => (
                            <div key={ti} style={{ marginLeft: '18px', marginTop: '2px' }}>
                              <span style={{ color: colors.dangerText, fontWeight: '600' }} dangerouslySetInnerHTML={{ __html: t.answer }} />
                              <span style={{ color: colors.textSecondary, fontSize: font.sm }} dangerouslySetInnerHTML={{ __html: ` → ${t.response}` }} />
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: font.base, fontWeight: '600', margin: '0 0 4px', color: colors.textSecondary }}>
                      Correct answer:
                    </p>
                    <div
                      style={{ fontSize: font.base, fontWeight: '600', color: colors.successText, marginBottom: p.traps.length || p.explanation ? '8px' : 0 }}
                      dangerouslySetInnerHTML={{ __html: p.answer }}
                    />
                    {p.traps.length > 0 && p.traps.map((t, ti) => (
                      <div key={ti} style={{ marginBottom: '4px' }}>
                        <span style={{ color: colors.dangerText, fontWeight: '600' }} dangerouslySetInnerHTML={{ __html: t.answer }} />
                        <span style={{ color: colors.textSecondary, fontSize: font.sm }} dangerouslySetInnerHTML={{ __html: ` → ${t.response}` }} />
                      </div>
                    ))}
                  </>
                )}
                {p.explanation && (
                  <div
                    style={{ fontSize: font.base, color: colors.textPrimary, marginTop: '6px' }}
                    dangerouslySetInnerHTML={{ __html: p.explanation }}
                  />
                )}
                {/* Per-part grader test (scalar parts only — multi_blank shows
                    per-blank self-grade ticks, grid_draw shows the rendered
                    drawing above instead) */}
                {!p.blanks && !p.grid && (
                <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: '12px', paddingTop: '10px' }}>
                  <p style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, margin: '0 0 6px' }}>
                    Test the grader
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={partGraderInputs[pi] ?? ''}
                      onChange={e => {
                        setPartGraderInputs(prev => ({ ...prev, [pi]: e.target.value }))
                        setPartGraderResults(prev => ({ ...prev, [pi]: null }))
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') runPartGraderTest(pi) }}
                      placeholder={`Type a student answer (${form.parts[pi]?.answer_type ?? 'numeric'})…`}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={() => runPartGraderTest(pi)}
                      style={{ ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm, flexShrink: 0 }}
                    >
                      Check
                    </button>
                  </div>
                  {partGraderResults[pi] != null && renderGradeResult(partGraderResults[pi]!)}
                </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Single-question preview */}
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
                  {buildOptions(preview.answer, preview.traps, preview.mcOptions).map((opt, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px', borderRadius: radius.md,
                        border: `1px solid ${opt === preview.answer ? colors.successBorder : colors.border}`,
                        background: opt === preview.answer ? colors.successLight : colors.background,
                        fontSize: font.base, color: colors.textPrimary,
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
                    <span style={{ color: colors.dangerText, fontWeight: '600' }} dangerouslySetInnerHTML={{ __html: t.answer }} />
                    <span style={{ color: colors.textSecondary, fontSize: font.sm }} dangerouslySetInnerHTML={{ __html: ` → ${t.response}` }} />
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
            {/* Grader test */}
            <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: '16px', paddingTop: '14px' }}>
              <p style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, margin: '0 0 8px' }}>
                Test the grader
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={graderTestInput}
                  onChange={e => { setGraderTestInput(e.target.value); setGraderTestResult(null) }}
                  onKeyDown={e => { if (e.key === 'Enter') runGraderTest() }}
                  placeholder={`Type a student answer (${form.answer_type})…`}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={runGraderTest}
                  style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', flexShrink: 0 }}
                >
                  Check
                </button>
              </div>
              {graderTestResult && renderGradeResult(graderTestResult)}
            </div>
          </div>
        )}
      </CollapsibleCard>

      {/* ── Image (optional) — starts collapsed ── */}
      <CollapsibleCard title="Image (optional)" storageKey="image" summary={imageSummary} defaultOpen={false}>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          Upload a diagram or image to show above the question. For shapes with parameterised
          dimensions you can embed inline SVG directly in the question template instead.
        </p>
        {form.image_url && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <img
              src={form.image_url}
              alt="Question image"
              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: radius.md, border: `1px solid ${colors.border}` }}
            />
            <button
              onClick={() => update('image_url', '')}
              style={{ ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm, color: colors.dangerText, borderColor: colors.dangerBorder }}
            >
              Remove image
            </button>
          </div>
        )}
        {/* SVG deliberately excluded from `accept` — see
            20260727_storage_question_images.sql: the bucket is public, so an
            uploaded SVG is script on the storage origin. The bucket's MIME
            allowlist rejects it server-side too; this just keeps the picker
            honest. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file)
            e.target.value = ''
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={imageUploading}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 16px', opacity: imageUploading ? 0.6 : 1 }}
        >
          {imageUploading ? 'Uploading…' : form.image_url ? 'Replace image' : 'Upload image'}
        </button>
        {imageError && <p style={errorBox}>{imageError}</p>}
      </CollapsibleCard>

      {/* ── Multiple-choice options (single, MC only) ── */}
      {!form.multiPart && form.question_type === 'multiple_choice' && (
        <CollapsibleCard title="Multiple-choice options" storageKey="mc-options" summary={mcOptionsSummary}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Optional. Supply 2–4 explicit options (templates allowed, e.g. <code>{'{{a+b}}'}</code>)
            to use them verbatim — for sets like <em>all / some / no</em> or fixed expression
            lists. One option must match the correct answer. Leave empty to auto-generate
            distractors from the answer and traps.
          </p>
          {form.mc_options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={opt}
                onChange={e => updateMcOption(i, e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="e.g. Some  or  {{a*b}}"
              />
              <button
                onClick={() => removeMcOption(i)}
                style={{ ...secondaryButton, width: 'auto', padding: '4px 10px', fontSize: font.sm, color: colors.dangerText, borderColor: colors.dangerBorder }}
              >
                Remove
              </button>
            </div>
          ))}
          {form.mc_options.filter(o => o.trim() !== '').length === 1 && (
            <p style={{ fontSize: font.sm, color: colors.dangerText, margin: 0 }}>
              Add at least 2 options, or remove the single one to fall back to auto-generated distractors.
            </p>
          )}
          <button onClick={addMcOption} style={{ ...secondaryButton, width: 'auto', padding: '8px 16px' }}>
            + Add option
          </button>
        </CollapsibleCard>
      )}

      {/* ── Traps (single-question mode) ── */}
      {!form.multiPart && (
        <CollapsibleCard title="Traps" storageKey="traps" summary={trapsSummary}>
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
                  ref={autoResize}
                  value={trap.response}
                  onChange={e => { updateTrap(i, 'response', e.target.value); autoResize(e.target) }}
                  style={{ ...inputStyle, minHeight: '60px', resize: 'none' as const }}
                  placeholder="It looks like you added the dimensions rather than multiplied them. Area = width × height."
                />
              </div>
            </div>
          ))}
          <button onClick={addTrap} style={{ ...secondaryButton, width: 'auto', padding: '8px 16px' }}>
            + Add trap
          </button>
        </CollapsibleCard>
      )}

      {/* ── Sticky footer: publish toggle + save ── */}
      <div style={styles.stickyFooter}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={e => update('is_published', e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: font.base, fontWeight: '500', color: colors.textPrimary, whiteSpace: 'nowrap' as const }}>
            Publish
          </span>
        </label>
        <div style={{ flex: 1, minWidth: 0 }}>
          {(validationError || error) && (
            <p style={{ margin: 0, fontSize: font.sm, color: colors.dangerText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {validationError || error}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ ...primaryButton, width: 'auto', padding: '10px 28px', opacity: saving ? 0.6 : 1, flexShrink: 0 }}
        >
          {saving ? 'Saving…' : 'Save question'}
        </button>
      </div>

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
  stickyFooter: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    background: '#ffffff',
    borderTop: `2px solid ${colors.borderStrong}`,
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
  },
}
