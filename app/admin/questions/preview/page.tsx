'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkIsAdmin } from '../../../../lib/admin'
import { supabase } from '../../../../lib/supabase'
import { skillsById } from '../../../../lib/skills/skillGraph'
import { courses } from '../../../../data/courses'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, sectionTitle, errorBox,
} from '../../../../lib/styles'
import { buildOptions } from '../../../../lib/questions/multipleChoice'

type Question = {
  id: string
  skill_ids: string[]
  difficulty: number
  question_type: string
  question_template: string
  parameters: any
  answer_template: string
  answer_type: string
  tolerance: number | null
  traps: { answer_template: string, response: string }[]
  explanation: string | null
  is_published: boolean
}

type Rendered = {
  question: string
  answer: string
  traps: { answer: string, response: string }[]
  explanation: string
}

const TOPICS = ['Number', 'Algebra', 'Shape and Space', 'Probability and Data', 'Ratio and Proportion']

const foundationIds = new Set(courses.find(c => c.id === 'gcse_foundation')?.skills ?? [])
const higherOnlyIds = new Set(
  (courses.find(c => c.id === 'gcse_higher')?.skills ?? [])
    .filter(id => !foundationIds.has(id))
)

function generateValues(parameters: any): Record<string, number> | null {
  try {
    const generated: Record<string, number> = {}
    for (const [key, config] of Object.entries(parameters) as any) {
      let attempts = 0
      let value: number = 0
      do {
        if (config.type === 'decimal') {
          const places = config.decimal_places ?? 1
          const factor = Math.pow(10, places)
          const min = Math.round(config.min * factor)
          const max = Math.round(config.max * factor)
          value = Math.floor(Math.random() * (max - min + 1) + min) / factor
        } else {
          value = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min
        }
        attempts++
        if (!config.constraint || attempts >= 100) break
        const target = config.constraint.target_type === 'parameter'
          ? generated[config.constraint.target]
          : config.constraint.target
        if (target === undefined) break
        const satisfied = (() => {
          switch (config.constraint.type) {
            case 'neq': return value !== target
            case 'gt': return value > target
            case 'gte': return value >= target
            case 'lt': return value < target
            case 'lte': return value <= target
            case 'multiple_of': return target !== 0 && value % target === 0
            case 'factor_of': return value !== 0 && target % value === 0
            default: return true
          }
        })()
        if (satisfied) break
      } while (true)
      generated[key] = value
    }
    return generated
  } catch {
    return null
  }
}

function evaluate(template: string, generated: Record<string, number>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    try {
      const fn = new Function(...Object.keys(generated), `return ${expr}`)
      return fn(...Object.values(generated)).toString()
    } catch {
      return `[error: ${expr}]`
    }
  })
}

function renderQuestion(q: Question): Rendered | null {
  try {
    const generated = generateValues(q.parameters) ?? {}
    return {
      question: evaluate(q.question_template, generated),
      answer: evaluate(q.answer_template, generated),
      traps: q.traps.map(t => ({
        answer: evaluate(t.answer_template, generated),
        response: t.response,
      })),
      explanation: q.explanation ? evaluate(q.explanation, generated) : '',
    }
  } catch {
    return null
  }
}

function getTier(skillIds: string[]): 'foundation' | 'higher' | 'both' {
  const hasFoundation = skillIds.some(id => foundationIds.has(id))
  const hasHigher = skillIds.some(id => higherOnlyIds.has(id))
  if (hasFoundation && hasHigher) return 'both'
  if (hasHigher) return 'higher'
  return 'foundation'
}

export default function PreviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [rendered, setRendered] = useState<Record<string, Rendered | null>>({})
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all')
  const [filterTopic, setFilterTopic] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [filterTier, setFilterTier] = useState<'all' | 'foundation' | 'higher'>('all')

  useEffect(() => {
    checkIsAdmin().then(isAdmin => {
      if (!isAdmin) router.push('/dashboard')
      else loadQuestions()
    })
  }, [])

  async function loadQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) {
      setQuestions(data)
      const renderedMap: Record<string, Rendered | null> = {}
      data.forEach(q => { renderedMap[q.id] = renderQuestion(q) })
      setRendered(renderedMap)
    }
    setLoading(false)
  }

  function regenerate(q: Question) {
    setRendered(prev => ({ ...prev, [q.id]: renderQuestion(q) }))
  }

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function collapseAll() {
    setCollapsed(new Set(filtered.map(q => q.id)))
  }

  function expandAll() {
    setCollapsed(new Set())
  }

  async function togglePublish(q: Question) {
    setPublishing(q.id)
    const { error } = await supabase
      .from('questions')
      .update({ is_published: !q.is_published })
      .eq('id', q.id)

    if (!error) {
      setQuestions(prev => prev.map(p =>
        p.id === q.id ? { ...p, is_published: !p.is_published } : p
      ))
    }
    setPublishing(null)
  }

  // Skills filtered by selected topic
  const skillsForTopic = Object.entries(skillsById)
    .filter(([_, skill]) => !filterTopic || skill.topic === filterTopic)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))

  const filtered = questions.filter(q => {
    if (filterStatus === 'published' && !q.is_published) return false
    if (filterStatus === 'draft' && q.is_published) return false
    if (filterSkill && !q.skill_ids.includes(filterSkill)) return false
    if (filterTopic && !q.skill_ids.some(id => skillsById[id]?.topic === filterTopic)) return false
    if (filterTier !== 'all') {
      const tier = getTier(q.skill_ids)
      if (filterTier === 'foundation' && tier === 'higher') return false
      if (filterTier === 'higher' && tier === 'foundation') return false
    }
    return true
  })

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => router.push('/admin/questions')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          Preview questions
        </h1>
      </div>

      {/* Filters */}
      <div style={card}>
        <h2 style={sectionTitle}>Filters</h2>
        <div style={styles.filterGrid}>
  <div style={styles.filterRow}>
    <div style={styles.filterField}>
      <label style={styles.filterLabel}>Status</label>
      <div style={styles.toggle}>
        {(['all', 'published', 'draft'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            style={{
              ...styles.toggleButton,
              background: filterStatus === f ? colors.primary : 'transparent',
              color: filterStatus === f ? '#ffffff' : colors.textSecondary,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
    </div>

    <div style={styles.filterField}>
      <label style={styles.filterLabel}>Tier</label>
      <div style={styles.toggle}>
        {(['all', 'foundation', 'higher'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilterTier(t)}
            style={{
              ...styles.toggleButton,
              background: filterTier === t ? colors.primary : 'transparent',
              color: filterTier === t ? '#ffffff' : colors.textSecondary,
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  </div>

  <div style={styles.filterRow}>
    <div style={{ ...styles.filterField, flex: 1 }}>
      <label style={styles.filterLabel}>Topic</label>
      <select
        value={filterTopic}
        onChange={e => { setFilterTopic(e.target.value); setFilterSkill('') }}
        style={{ ...styles.select, maxWidth: '100%' }}
      >
        <option value="">All topics</option>
        {TOPICS.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>

    <div style={{ ...styles.filterField, flex: 1 }}>
      <label style={styles.filterLabel}>Skill</label>
      <select
        value={filterSkill}
        onChange={e => setFilterSkill(e.target.value)}
        style={{ ...styles.select, maxWidth: '100%' }}
      >
        <option value="">All skills</option>
        {skillsForTopic.map(([id, skill]) => (
          <option key={id} value={id}>{skill.name}</option>
        ))}
      </select>
    </div>
  </div>
</div>

        {/* Summary + collapse controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px' }}>
          <span style={{ fontSize: font.base, color: colors.textSecondary }}>
            {filtered.length} question{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={expandAll}
              style={{ ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm }}
            >
              Expand all
            </button>
            <button
              onClick={collapseAll}
              style={{ ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm }}
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      {/* Questions */}
      {filtered.map(q => {
        const r = rendered[q.id]
        const skills = q.skill_ids.map(id => skillsById[id]?.name ?? id).join(', ')
        const topic = q.skill_ids.map(id => skillsById[id]?.topic).find(Boolean) ?? ''
        const tier = getTier(q.skill_ids)
        const isCollapsed = collapsed.has(q.id)

        return (
          <div key={q.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Header row */}
            <div
			  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '8px', cursor: 'pointer' }}
			  onClick={() => toggleCollapse(q.id)}
			>
			  {/* Left: badges and info */}
			  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', alignItems: 'center', flex: 1 }}>
				<span style={{
				  fontSize: '11px', fontWeight: '600', padding: '2px 8px',
				  borderRadius: radius.full,
				  background: q.is_published ? colors.successLight : colors.background,
				  color: q.is_published ? colors.successText : colors.textSecondary,
				  border: `1px solid ${q.is_published ? colors.successBorder : colors.border}`,
				}}>
				  {q.is_published ? 'Published' : 'Draft'}
				</span>
				<span style={{
				  fontSize: '11px', fontWeight: '600', padding: '2px 8px',
				  borderRadius: radius.full,
				  background: tier === 'higher' ? '#ede9fe' : '#e0f2fe',
				  color: tier === 'higher' ? '#5b21b6' : '#0369a1',
				  border: `1px solid ${tier === 'higher' ? '#c4b5fd' : '#bae6fd'}`,
				}}>
				  {tier === 'higher' ? 'Higher' : 'Foundation'}
				</span>
				<span style={{
				  fontSize: '11px', color: colors.textSecondary, padding: '2px 8px',
				  borderRadius: radius.full, background: colors.background,
				  border: `1px solid ${colors.border}`,
				}}>
				  {q.question_type.replace('_', ' ')}
				</span>
				<span style={{ fontSize: '11px', color: colors.textSecondary }}>
				  {'★'.repeat(q.difficulty)}{'☆'.repeat(5 - q.difficulty)}
				</span>
				<span style={{ fontSize: font.sm, color: colors.textSecondary }}>{topic}</span>
				<span style={{ fontSize: font.sm, color: colors.primary }}>{skills}</span>
			  </div>

			  {/* Right: action buttons + chevron */}
			  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
				<div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
				  <button
					onClick={() => regenerate(q)}
					style={{ ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm }}
				  >
					🔄
				  </button>
				  <button
					onClick={() => router.push(`/admin/questions/${q.id}`)}
					style={{ ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm }}
				  >
					Edit
				  </button>
				  <button
					onClick={() => togglePublish(q)}
					disabled={publishing === q.id}
					style={{
					  ...primaryButton,
					  width: 'auto',
					  padding: '6px 12px',
					  fontSize: font.sm,
					  background: q.is_published ? colors.textSecondary : colors.primary,
					  opacity: publishing === q.id ? 0.6 : 1,
					}}
				  >
					{publishing === q.id ? '...' : q.is_published ? 'Unpublish' : 'Publish'}
				  </button>
				</div>
				<span style={{ fontSize: font.base, color: colors.textHint }}>
				  {isCollapsed ? '▼' : '▲'}
				</span>
			  </div>
			</div>

            {/* Collapsed summary */}
            {isCollapsed && r && (
              <div
                style={{ fontSize: font.base, color: colors.textSecondary, cursor: 'pointer' }}
                onClick={() => toggleCollapse(q.id)}
                dangerouslySetInnerHTML={{ __html: r.question }}
              />
            )}

            {/* Expanded content */}
            {!isCollapsed && (
              <>
                {r ? (
                  <>
                    <div style={styles.questionBox}>
                      <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 8px', fontWeight: '600' }}>Question:</p>
                      <div
                        style={{ fontSize: font.lg, color: colors.textPrimary }}
                        dangerouslySetInnerHTML={{ __html: r.question }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const }}>
                      <div style={styles.answerBox}>
                        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 4px', fontWeight: '600' }}>Correct answer:</p>
                        <div
                          style={{ fontSize: font.lg, fontWeight: '600', color: colors.successText }}
                          dangerouslySetInnerHTML={{ __html: r.answer }}
                        />
                      </div>
					  {q.question_type === 'multiple_choice' && r && (
						  <div>
							<p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 8px', fontWeight: '600' }}>
							  Options:
							</p>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
							  {buildOptions(r.answer, r.traps).map((opt, i) => (
								<div
								  key={i}
								  style={{
									padding: '10px 14px',
									borderRadius: radius.md,
									border: `1px solid ${opt === r.answer ? colors.successBorder : colors.border}`,
									background: opt === r.answer ? colors.successLight : colors.background,
									fontSize: font.base,
									color: colors.textPrimary,
								  }}
								  dangerouslySetInnerHTML={{ __html: opt }}
								/>
							  ))}
							</div>
						  </div>
						)}
                      {q.tolerance !== null && q.tolerance > 0 && (
                        <div style={styles.answerBox}>
                          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 4px', fontWeight: '600' }}>Tolerance:</p>
                          <p style={{ fontSize: font.lg, color: colors.textSecondary, margin: 0 }}>±{q.tolerance}</p>
                        </div>
                      )}
                    </div>

                    {r.traps.length > 0 && (
                      <div>
                        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 8px', fontWeight: '600' }}>Traps:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {r.traps.map((t, i) => (
                            <div key={i} style={styles.trapBox}>
                              <span
                                style={{ fontWeight: '600', color: colors.dangerText, fontSize: font.base }}
                                dangerouslySetInnerHTML={{ __html: t.answer }}
                              />
                              <span
                                style={{ color: colors.textSecondary, fontSize: font.sm }}
                                dangerouslySetInnerHTML={{ __html: ` → ${t.response}` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.explanation && (
                      <div style={styles.explanationBox}>
                        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 4px', fontWeight: '600' }}>Explanation:</p>
                        <div
                          style={{ fontSize: font.base, color: colors.textPrimary }}
                          dangerouslySetInnerHTML={{ __html: r.explanation }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <p style={errorBox}>Could not render this question — check the templates and parameters.</p>
                )}
              </>
            )}
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div style={card}>
          <p style={{ fontSize: font.base, color: colors.textHint, margin: 0 }}>No questions match the current filters.</p>
        </div>
      )}
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px 20px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterGrid: {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
},
filterRow: {
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-end',
  flexWrap: 'wrap' as const,
},
  filterField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggle: {
    display: 'flex',
    borderRadius: radius.md,
    overflow: 'hidden',
    border: `1px solid ${colors.borderStrong}`,
    width: 'fit-content',
  },
  toggleButton: {
    padding: '6px 14px',
    border: 'none',
    fontSize: font.base,
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    background: 'transparent',
  },
  select: {
    padding: '8px 12px',
    borderRadius: radius.md,
    border: `1px solid ${colors.borderStrong}`,
    fontSize: font.base,
    color: colors.textPrimary,
    background: colors.card,
    cursor: 'pointer',
    width: '100%',
    maxWidth: '300px',
  },
  questionBox: {
    padding: '14px',
    background: colors.background,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  answerBox: {
    padding: '10px 14px',
    background: colors.successLight,
    borderRadius: radius.md,
    border: `1px solid ${colors.successBorder}`,
  },
  trapBox: {
    padding: '8px 12px',
    background: colors.dangerLight,
    borderRadius: radius.md,
    border: `1px solid ${colors.dangerBorder}`,
  },
  explanationBox: {
    padding: '10px 14px',
    background: colors.warningLight,
    borderRadius: radius.md,
    border: `1px solid ${colors.warningBorder}`,
  },
}