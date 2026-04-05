'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { useDiagnostic } from '../../../lib/diagnostic/useDiagnostic'
import { colors, font, radius, primaryButton } from '../../../lib/styles'

export default function StudentDiagnosticPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [studentName, setStudentName] = useState('')
  const [assessmentTitle, setAssessmentTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    diagnostic,
    currentSkill,
    questionsAsked,
    diagnosedSkills,
    courseSkills,
    mastered,
    needsPractice,
    handleAnswer,
    finishDiagnostic,
  } = useDiagnostic()

  useEffect(() => {
    const id = sessionStorage.getItem('student_session_id')
    const name = sessionStorage.getItem('student_name')
    const title = sessionStorage.getItem('assessment_title')
    if (!id || !name || !title) { router.push('/join'); return }
    setSessionId(id)
    setStudentName(name)
    setAssessmentTitle(title)
  }, [])

  useEffect(() => {
    if (!currentSkill && sessionId && !submitting) submitResults()
  }, [currentSkill, sessionId])

  async function submitResults() {
    if (!sessionId) return
    setSubmitting(true)

    const rows = [
      ...Array.from(mastered).map(skillId => ({
        session_id: sessionId,
        skill_id: skillId,
        status: 'mastered',
        source: diagnostic.testedMastered.includes(skillId) ? 'tested' : 'inferred',
      })),
      ...Array.from(needsPractice).map(skillId => ({
        session_id: sessionId,
        skill_id: skillId,
        status: 'needs_practice',
        source: diagnostic.testedNotMastered.includes(skillId) ? 'tested' : 'inferred',
      })),
    ]

    const { error: resultsError } = await supabase.from('skill_results').insert(rows)
    await supabase
      .from('student_sessions')
      .update({ completed_at: new Date().toISOString(), questions_asked: questionsAsked })
      .eq('id', sessionId)

    if (resultsError) console.error('Error saving results:', resultsError)

    sessionStorage.setItem('student_mastered', JSON.stringify(Array.from(mastered)))
    sessionStorage.setItem('student_needs_practice', JSON.stringify(Array.from(needsPractice)))
	sessionStorage.setItem('student_name_display', studentName)
    sessionStorage.removeItem('student_session_id')
    sessionStorage.removeItem('student_name')
    sessionStorage.removeItem('assessment_title')
    sessionStorage.removeItem('course_id')

    router.push('/join/complete')
  }

  if (submitting) {
    return (
      <main style={styles.container}>
        <p style={{ color: colors.textSecondary }}>Saving your results...</p>
      </main>
    )
  }

  if (!sessionId) {
    return (
      <main style={styles.container}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  const progressPercent = Math.round((diagnosedSkills / courseSkills.length) * 100)

  function toSlug(text: string) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
  }

  return (
    <main style={styles.container}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: font.xl, fontWeight: '600', color: colors.textSecondary, margin: 0 }}>
          Mathsense
        </h1>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '2px 0 0' }}>
          {assessmentTitle} · {studentName}
        </p>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '2px 0 0' }}>
          Question {questionsAsked + 1} · Diagnosed: {diagnosedSkills}/{courseSkills.length}
        </p>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${progressPercent}%` }} />
        </div>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0' }}>
          {progressPercent}% complete
        </p>

        {currentSkill && (
          <div style={styles.card}>
            <p style={styles.cardLabel}>Current skill being tested:</p>
            <p style={{ fontSize: font.lg, margin: '0 0 12px', color: colors.textPrimary, fontWeight: '600' }}>
              {currentSkill.name}
            </p>

            {currentSkill.exampleQuestion && (
              <>
                <p style={styles.cardLabel}>Example question:</p>
                <p style={{ fontSize: font.lg, lineHeight: '1.5', whiteSpace: 'pre-line' as const, margin: '0 0 12px', color: colors.textPrimary }}>
                  {currentSkill.exampleQuestion}
                </p>
              </>
            )}

            {currentSkill.image && (
              <img
                src={`/questions/${toSlug(currentSkill.topic)}/${currentSkill.id}.png`}
                alt="Example diagram"
                style={{ maxWidth: '100%', maxHeight: '200px', margin: '10px 0', objectFit: 'contain' }}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}

            {currentSkill.exampleAnswer && (
              <>
                <p style={styles.cardLabel}>Example answer:</p>
                <p style={{ fontSize: font.lg, lineHeight: '1.5', whiteSpace: 'pre-line' as const, margin: 0, color: colors.textPrimary }}>
                  {currentSkill.exampleAnswer}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        {diagnosedSkills > Math.floor(courseSkillsLength / 2) && (
          <button
            onClick={finishDiagnostic}
            style={{
              marginBottom: '10px',
              padding: '10px',
              borderRadius: radius.md,
              border: `1px solid ${colors.borderStrong}`,
              background: colors.card,
              color: colors.textPrimary,
              cursor: 'pointer',
              width: '100%',
              fontWeight: '600',
              fontSize: font.md,
            }}
          >
            Finish diagnostic
          </button>
        )}

        <p style={{ margin: '0 0 10px', fontWeight: '600', fontSize: font.md, color: colors.textPrimary }}>
          Do you know how to solve this type of question?
        </p>

        <div style={styles.buttonRow}>
          <button
            onClick={() => handleAnswer(true)}
            style={{ ...styles.answerButton, background: colors.success }}
          >
            Yes, I know this
          </button>
          <button
            onClick={() => handleAnswer(false)}
            style={{ ...styles.answerButton, background: colors.danger }}
          >
            No, I need practice
          </button>
        </div>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    maxWidth: '480px',
    margin: '0 auto',
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    background: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: '8px',
  },
  progressBar: {
    height: '100%',
    background: colors.primary,
    borderRadius: radius.full,
    transition: 'width 0.3s ease',
  },
  card: {
    background: colors.card,
    padding: '16px',
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto' as const,
    maxHeight: '50vh',
    marginTop: '8px',
  },
  cardLabel: {
    fontWeight: 600,
    margin: '0 0 4px',
    fontSize: font.base,
    color: colors.textSecondary,
  },
  footer: {
    position: 'sticky' as const,
    bottom: 0,
    background: colors.background,
    padding: '12px',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    borderTop: `1px solid ${colors.border}`,
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
  },
  answerButton: {
    color: 'white',
    border: 'none',
    padding: '14px 18px',
    borderRadius: radius.md,
    fontSize: font.lg,
    cursor: 'pointer',
    flex: 1,
    fontWeight: '600',
  },
}