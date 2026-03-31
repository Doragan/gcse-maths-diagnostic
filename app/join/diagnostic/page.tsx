'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { useDiagnostic } from '../../../lib/diagnostic/useDiagnostic'

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

    if (!id || !name || !title) {
      router.push('/join')
      return
    }

    setSessionId(id)
    setStudentName(name)
    setAssessmentTitle(title)
  }, [])

  // When the diagnostic finishes, submit results
  useEffect(() => {
    if (!currentSkill && sessionId && !submitting) {
      submitResults()
    }
  }, [currentSkill, sessionId])

  async function submitResults() {
    if (!sessionId) return
    setSubmitting(true)

    // Build skill results rows
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

    // Insert skill results
    const { error: resultsError } = await supabase
      .from('skill_results')
      .insert(rows)

    // Mark session as completed
    await supabase
      .from('student_sessions')
      .update({
        completed_at: new Date().toISOString(),
        questions_asked: questionsAsked,
      })
      .eq('id', sessionId)

    if (resultsError) {
      console.error('Error saving results:', resultsError)
    }

    sessionStorage.removeItem('student_session_id')
    sessionStorage.removeItem('student_name')
    sessionStorage.removeItem('assessment_title')
    sessionStorage.removeItem('course_id')

    router.push('/join/complete')
  }

  if (submitting) {
    return (
      <main style={styles.container}>
        <p style={{ color: '#666' }}>Saving your results...</p>
      </main>
    )
  }

  if (!sessionId) {
    return (
      <main style={styles.container}>
        <p style={{ color: '#666' }}>Loading...</p>
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
        <h1 style={styles.heading}>Mathsense</h1>
        <p style={styles.meta}>
          {assessmentTitle} · {studentName}
        </p>
        <p style={styles.meta}>
          Question {questionsAsked + 1} · Diagnosed: {diagnosedSkills}/{courseSkills.length}
        </p>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${progressPercent}%` }} />
        </div>
        <p style={styles.progressLabel}>{progressPercent}% complete</p>

        {currentSkill && (
          <div style={styles.card}>
            <p style={styles.cardLabel}>Current skill being tested:</p>
            <p style={styles.skillName}>{currentSkill.name}</p>

            {currentSkill.exampleQuestion && (
              <>
                <p style={styles.cardLabel}>Example question:</p>
                <p style={styles.cardText}>{currentSkill.exampleQuestion}</p>
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
                <p style={styles.cardText}>{currentSkill.exampleAnswer}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        {questionsAsked > 10 && (
          <button onClick={finishDiagnostic} style={styles.finishButton}>
            Finish diagnostic
          </button>
        )}

        <p style={styles.footerQuestion}>
          <strong>Do you know how to solve this type of question?</strong>
        </p>

        <div style={styles.buttonRow}>
          <button onClick={() => handleAnswer(true)} style={styles.yesButton}>
            Yes, I know this
          </button>
          <button onClick={() => handleAnswer(false)} style={styles.noButton}>
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
    maxWidth: '420px',
    margin: '0 auto',
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  heading: {
    fontSize: '24px',
    color: '#555',
    margin: 0,
  },
  meta: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    background: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '6px',
  },
  progressBar: {
    height: '100%',
    background: '#4CAF50',
    transition: 'width 0.3s ease',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  card: {
    background: '#ffffff',
    padding: '16px',
    borderRadius: '10px',
    border: '2px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto' as const,
    maxHeight: '50vh',
  },
  cardLabel: {
    fontWeight: 600,
    margin: '0 0 4px',
    fontSize: '14px',
  },
  skillName: {
    fontSize: '16px',
    margin: '0 0 12px',
  },
  cardText: {
    fontSize: '16px',
    lineHeight: '1.4',
    whiteSpace: 'pre-line' as const,
    margin: '0 0 12px',
  },
  footer: {
    position: 'sticky' as const,
    bottom: 0,
    background: '#f4f6f8',
    padding: '12px',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    borderTop: '1px solid #ddd',
  },
  finishButton: {
    marginBottom: '10px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#111827',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 600,
  },
  footerQuestion: {
    margin: '0 0 10px',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
  },
  yesButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '14px 18px',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    flex: 1,
  },
  noButton: {
    background: '#f44336',
    color: 'white',
    border: 'none',
    padding: '14px 18px',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
    flex: 1,
  },
}