'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkIsAdmin } from '../../../../lib/admin'
import { supabase } from '../../../../lib/supabase'
import { colors, font, secondaryButton } from '../../../../lib/styles'
import QuestionForm from '../../../../components/admin/QuestionForm'
import { normalizePart, computeSkillUnion } from '../../../../lib/questions/parts'
import { cleanMcOptions } from '../../../../lib/questions/multipleChoice'

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

    // Multi-part: normalise each part and set the question-level skill_ids to
    // the union of part skills (so existing .overlaps() serving queries work).
    const isMulti = data.multiPart && data.parts.length > 0
    const normalizedParts = isMulti ? data.parts.map(normalizePart) : null
    const skillIds = isMulti ? computeSkillUnion(normalizedParts) : data.skill_ids

    const { error } = await supabase.from('questions').insert({
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
      // Single-part only: multi-part questions are priced by summing their
      // parts. Blank means "use the evidence-based estimate", so it stays NULL.
      marks: !isMulti && data.marks.trim() !== '' ? parseInt(data.marks, 10) : null,
      traps: isMulti ? [] : data.traps,
      explanation: isMulti ? null : (data.explanation || null),
      image_url: data.image_url || null,
      is_published: data.is_published,
      parts: normalizedParts,
      // Explicit MC options: persist only for single-question MC, and only when
      // 2+ non-empty are given; otherwise null → derived distractors at render.
      mc_options: cleanMcOptions(isMulti, data),
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