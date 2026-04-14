'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkIsAdmin } from '../../../lib/admin'
import { supabase } from '../../../lib/supabase'
import { skillsById } from '../../../lib/skills/skillGraph'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, sectionTitle,
} from '../../../lib/styles'

type Question = {
  id: string
  skill_ids: string[]
  difficulty: number
  question_template: string
  question_type: string
  is_published: boolean
  created_at: string
}

export default function QuestionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [filterSkill, setFilterSkill] = useState('')
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    checkIsAdmin().then(isAdmin => {
      if (!isAdmin) router.push('/dashboard')
      else loadQuestions()
    })
  }, [])

  async function loadQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('id, skill_ids, difficulty, question_template, question_type, is_published, created_at')
      .order('created_at', { ascending: false })

    if (!error && data) setQuestions(data)
    setLoading(false)
  }

  async function togglePublished(id: string, current: boolean) {
    const { error } = await supabase
      .from('questions')
      .update({ is_published: !current })
      .eq('id', id)

    if (!error) {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_published: !current } : q))
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Are you sure you want to delete this question?')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const filtered = questions.filter(q => {
    if (filterSkill && !q.skill_ids.includes(filterSkill)) return false
    if (filterPublished === 'published' && !q.is_published) return false
    if (filterPublished === 'draft' && q.is_published) return false
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
      <div style={styles.header}>
        <button
          onClick={() => router.push('/admin')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          Questions
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' as const }}>
        <select
          value={filterSkill}
          onChange={e => setFilterSkill(e.target.value)}
          style={styles.select}
        >
          <option value="">All skills</option>
          {Object.entries(skillsById)
            .sort((a, b) => a[1].name.localeCompare(b[1].name))
            .map(([id, skill]) => (
              <option key={id} value={id}>{skill.name}</option>
            ))}
        </select>

        <select
          value={filterPublished}
          onChange={e => setFilterPublished(e.target.value as any)}
          style={styles.select}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        <span style={{ fontSize: font.base, color: colors.textSecondary, marginLeft: 'auto' }}>
          {filtered.length} question{filtered.length !== 1 ? 's' : ''}
        </span>

        <button
          onClick={() => router.push('/admin/questions/new')}
          style={{ ...primaryButton, width: 'auto', padding: '8px 16px' }}
        >
          + New question
        </button>
		<button
		  onClick={() => router.push('/admin/questions/preview')}
		  style={{ ...secondaryButton, width: 'auto', padding: '8px 16px' }}
		>
		  Preview all
		</button>
      </div>

      {filtered.length === 0 ? (
        <div style={card}>
          <p style={{ fontSize: font.base, color: colors.textHint, margin: 0 }}>
            No questions yet — create your first one above.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map(q => (
            <div key={q.id} style={styles.questionRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' as const }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: q.is_published ? colors.successLight : colors.background,
                    color: q.is_published ? colors.successText : colors.textSecondary,
                    border: `1px solid ${q.is_published ? colors.successBorder : colors.border}`,
                  }}>
                    {q.is_published ? 'Published' : 'Draft'}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.textSecondary,
                    border: `1px solid ${colors.border}`,
                  }}>
                    {q.question_type.replace('_', ' ')}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.textSecondary,
                    border: `1px solid ${colors.border}`,
                  }}>
                    {'★'.repeat(q.difficulty)}{'☆'.repeat(5 - q.difficulty)}
                  </span>
                  {q.skill_ids.map(id => (
                    <span key={id} style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                    }}>
                      {skillsById[id]?.name ?? id}
                    </span>
                  ))}
                </div>
                <p style={{
                  fontSize: font.base,
                  color: colors.textPrimary,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                }}>
                  {q.question_template.replace(/<[^>]+>/g, '').substring(0, 100)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => togglePublished(q.id, q.is_published)}
                  style={{ ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm }}
                >
                  {q.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => router.push(`/admin/questions/${q.id}`)}
                  style={{ ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  style={{
                    ...secondaryButton,
                    width: 'auto',
                    padding: '6px 12px',
                    fontSize: font.sm,
                    color: colors.dangerText,
                    borderColor: colors.dangerBorder,
                  }}
                >
                  Delete
                </button>
				
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${colors.borderStrong}`,
    fontSize: font.base,
    color: colors.textPrimary,
    background: colors.card,
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  questionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 16px',
    background: colors.card,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
  },
}