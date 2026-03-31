'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function JoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setError(null)
    setLoading(true)

    const trimmedCode = code.trim().toUpperCase()

    if (trimmedCode.length !== 4) {
      setError('Please enter a 4-character code.')
      setLoading(false)
      return
    }

    if (!name.trim()) {
      setError('Please enter your name.')
      setLoading(false)
      return
    }

    // Look up the assessment by code
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, title, course_id')
      .eq('code', trimmedCode)
      .single()

    if (assessmentError || !assessment) {
      setError('Code not found. Please check with your teacher.')
      setLoading(false)
      return
    }

    // Create a student session
    const { data: session, error: sessionError } = await supabase
      .from('student_sessions')
      .insert({
        assessment_id: assessment.id,
        student_name: name.trim(),
      })
      .select()
      .single()

    if (sessionError || !session) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    // Store session info in sessionStorage so the diagnostic page can use it
    sessionStorage.setItem('student_session_id', session.id)
    sessionStorage.setItem('student_name', name.trim())
    sessionStorage.setItem('assessment_title', assessment.title)
    sessionStorage.setItem('course_id', assessment.course_id)

    router.push('/join/diagnostic')
  }

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Mathsense</h1>
        <p style={styles.subtitle}>Enter your class code to begin</p>

        <div style={styles.field}>
          <label style={styles.label}>Class code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. MX4T"
            maxLength={4}
            style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '22px', textAlign: 'center' }}
            autoComplete="off"
            autoCapitalize="characters"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Jamie Smith"
            style={styles.input}
            autoComplete="name"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleJoin}
          disabled={loading || !code || !name}
          style={{
            ...styles.primaryButton,
            opacity: loading || !code || !name ? 0.6 : 1,
          }}
        >
          {loading ? 'Joining...' : 'Start diagnostic'}
        </button>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: '#f4f6f8',
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '32px 28px',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
    color: '#111',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  error: {
    fontSize: '14px',
    color: '#e53e3e',
    margin: 0,
    padding: '10px 12px',
    background: '#fff5f5',
    borderRadius: '8px',
    border: '1px solid #fed7d7',
  },
  primaryButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
}