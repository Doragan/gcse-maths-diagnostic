'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { skillsById } from '../../../../lib/skills/skillGraph'
import { courses } from '../../../../data/courses'
import { renderQuestion, type RenderedQuestion } from '../../../../lib/questions/paramEngine'
import { checkAnswer } from '../../../../lib/questions/answerChecker'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle,
} from '../../../../lib/styles'
import MathInput from '../../../../components/practice/MathInput'

type Question = {
  id: string
  skill_ids: string[]
  difficulty: number
  question_type: string
  question_template: string
  parameters: any
  answer_template: string
  answer_type: 'exact' | 'numeric' | 'fraction' | 'expression'
  tolerance: number | null
  traps: { answer_template: string, response: string }[]
  explanation: string | null
  is_published: boolean
}

type FeedbackState = {
  correct: boolean
  message: string
  explanation: string
}

export default function QuestionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [question, setQuestion] = useState<Question | null>(null)
  const [rendered, setRendered] = useState<RenderedQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<string>('foundation')

  useEffect(() => {
    const stored = sessionStorage.getItem('practice_tier')
    if (stored) setTier(stored)
    loadQuestion()
  }, [id])

  async function loadQuestion() {
    setLoading(true)
    setAnswer('')
    setFeedback(null)

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      router.push('/practice')
      return
    }

    setQuestion(data)
    setRendered(renderQuestion(
      data.question_template,
      data.answer_template,
      data.traps ?? [],
      data.explanation,
      data.parameters ?? {}
    ))
    setLoading(false)
  }

  function handleSubmit() {
    if (!rendered || !question || !answer.trim()) return

    const result = checkAnswer(
      answer,
      rendered.answer,
      question.answer_type,
      question.tolerance,
      rendered.traps,
    )

    setFeedback({
      correct: result.correct,
      message: result.message,
      explanation: rendered.explanation,
    })
  }

  async function nextQuestion() {
    const storedTier = sessionStorage.getItem('practice_tier') ?? 'foundation'
    const foundation = courses.find(c => c.id === 'gcse_foundation')?.skills ?? []
    const higher = courses.find(c => c.id === 'gcse_higher')?.skills ?? []
    const skillIds = storedTier === 'foundation' ? foundation
      : storedTier === 'higher' ? higher
      : [...new Set([...foundation, ...higher])]

    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('is_published', true)
      .overlaps('skill_ids', skillIds)
      .neq('id', id)

    if (!data || data.length === 0) {
      router.push('/practice')
      return
    }

    const random = data[Math.floor(Math.random() * data.length)]
    router.push(`/practice/question/${random.id}`)
  }

  function tryAgain() {
    if (!question) return
    setAnswer('')
    setFeedback(null)
    setRendered(renderQuestion(
      question.question_template,
      question.answer_template,
      question.traps ?? [],
      question.explanation,
      question.parameters ?? {}
    ))
  }

  if (loading || !rendered || !question) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading question...</p>
      </main>
    )
  }

  const skillNames = question.skill_ids
    .map(id => skillsById[id]?.name ?? id)
    .join(', ')

  return (
    <main style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => router.push('/practice')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          ← Back
        </button>
        <div>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
            {skillNames}
          </p>
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: '2px 0 0' }}>
            {'★'.repeat(question.difficulty)}{'☆'.repeat(5 - question.difficulty)}
          </p>
        </div>
      </div>

      {/* Question */}
      <div style={card}>
        <div
          style={{ fontSize: font.xl, color: colors.textPrimary, lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: rendered.question }}
        />
      </div>

      {/* Answer input */}
      {!feedback && (
		  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
			<MathInput
			  value={answer}
			  onChange={setAnswer}
			  onSubmit={handleSubmit}
			  placeholder="Type your answer..."
			/>
			<button
			  onClick={handleSubmit}
			  disabled={!answer.trim()}
			  style={{ ...primaryButton, opacity: !answer.trim() ? 0.6 : 1 }}
			>
			  Submit answer
			</button>
		  </div>
		)}

      {/* Feedback */}
      {feedback && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            padding: '16px',
            borderRadius: radius.lg,
            background: feedback.correct ? colors.successLight : colors.dangerLight,
            border: `1px solid ${feedback.correct ? colors.successBorder : colors.dangerBorder}`,
          }}>
            <p style={{
              fontSize: font.lg,
              fontWeight: '600',
              margin: '0 0 6px',
              color: feedback.correct ? colors.successText : colors.dangerText,
            }}>
              {feedback.correct ? '✓ Correct!' : '✗ Not quite'}
            </p>
            <div
              style={{ fontSize: font.base, color: feedback.correct ? colors.successText : colors.dangerText }}
              dangerouslySetInnerHTML={{ __html: feedback.message }}
            />
          </div>

          {feedback.explanation && (
            <div style={{
              padding: '14px 16px',
              borderRadius: radius.lg,
              background: colors.warningLight,
              border: `1px solid ${colors.warningBorder}`,
            }}>
              <p style={{ fontSize: font.sm, fontWeight: '600', margin: '0 0 4px', color: colors.warningText }}>
                Explanation:
              </p>
              <div
                style={{ fontSize: font.base, color: colors.textPrimary }}
                dangerouslySetInnerHTML={{ __html: feedback.explanation }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            {!feedback.correct && (
              <button onClick={tryAgain} style={{ ...secondaryButton, flex: 1 }}>
                Try again
              </button>
            )}
            <button onClick={nextQuestion} style={{ ...primaryButton, flex: 1 }}>
              Next question →
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '24px 20px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '100dvh',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
}