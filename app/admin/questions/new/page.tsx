'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkIsAdmin } from '../../../../lib/admin'
import { supabase } from '../../../../lib/supabase'
import { colors, font, secondaryButton } from '../../../../lib/styles'
import QuestionForm from '../../../../components/admin/QuestionForm'

export default function NewQuestionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkIsAdmin().then(isAdmin => {
      if (!isAdmin) router.push('/dashboard')
      else setLoading(false)
    })
  }, [])

  async function handleSave(data: any) {
    setSaving(true)
    setError(null)

    const { error } = await supabase.from('questions').insert({
      skill_ids: data.skill_ids,
      difficulty: data.difficulty,
      question_type: data.question_type,
      question_template: data.question_template,
      parameters: JSON.parse(data.parameters),
      answer_template: data.answer_template,
      answer_type: data.answer_type,
      tolerance: data.answer_type === 'numeric' ? parseFloat(data.tolerance) : null,
      calculator: data.calculator,
      kind: data.kind,
      traps: data.traps,
      explanation: data.explanation || null,
      image_url: data.image_url || null,
      is_published: data.is_published,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      router.push('/admin/questions')
    }
  }

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
          onClick={() => router.push('/admin/questions')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          New question
        </h1>
      </div>
      <QuestionForm onSave={handleSave} saving={saving} error={error} />
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '800px',
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
}