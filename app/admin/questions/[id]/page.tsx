'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { checkIsAdmin } from '../../../../lib/admin'
import { supabase } from '../../../../lib/supabase'
import { colors, font, secondaryButton } from '../../../../lib/styles'
import QuestionForm from '../../../../components/admin/QuestionForm'
import { normalizePart, computeSkillUnion } from '../../../../lib/questions/parts'
import { cleanMcOptions } from '../../../../lib/questions/multipleChoice'

export default function EditQuestionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<any>(null)

  useEffect(() => {
    checkIsAdmin().then(async isAdmin => {
      if (!isAdmin) { router.push('/dashboard'); return }

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        router.push('/admin/questions')
        return
      }

      setInitialData({
        ...data,
        parameters: JSON.stringify(data.parameters, null, 2),
        tolerance: data.tolerance?.toString() ?? '0',
        // NULL marks means "estimate it" — show that as an empty field, not "0".
        marks: data.marks != null ? String(data.marks) : '',
        traps: data.traps ?? [],
        image_url: data.image_url ?? '',
      })
      setLoading(false)
    })
  }, [])

  async function handleSave(data: any) {
    setSaving(true)
    setError(null)

    const isMulti = data.multiPart && data.parts.length > 0
    const normalizedParts = isMulti ? data.parts.map(normalizePart) : null
    const skillIds = isMulti ? computeSkillUnion(normalizedParts) : data.skill_ids

    const { error } = await supabase
      .from('questions')
      .update({
        skill_ids: skillIds,
        difficulty: data.difficulty,
        question_type: data.question_type,
        question_template: data.question_template,
        parameters: JSON.parse(data.parameters),
        answer_template: isMulti ? '' : data.answer_template,
        answer_type: data.answer_type,
        tolerance: !isMulti && data.answer_type === 'numeric' ? parseFloat(data.tolerance) : null,
        requires_simplest: data.requires_simplest,
        calculator: data.calculator,
        kind: data.kind,
        // Single-part only; blank clears back to the estimate.
        marks: !isMulti && data.marks.trim() !== '' ? parseInt(data.marks, 10) : null,
        traps: isMulti ? [] : data.traps,
        explanation: isMulti ? null : (data.explanation || null),
        image_url: data.image_url || null,
        is_published: data.is_published,
        parts: normalizedParts,
        mc_options: cleanMcOptions(isMulti, data),
      })
      .eq('id', id)

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
          Edit question
        </h1>
      </div>
      <QuestionForm initialData={initialData} onSave={handleSave} saving={saving} error={error} />
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