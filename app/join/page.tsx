'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  colors, font, radius,
  pageContainer, narrowCard, pageTitle,
  primaryButton, inputStyle, labelStyle, errorBox,
} from '../../lib/styles'

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

const response = await fetch(`/api/assessment/lookup?code=${trimmedCode}`)
if (!response.ok) {
  setError('Code not found. Please check with your teacher.')
  setLoading(false)
  return
}
const assessment = await response.json()

    const { data: session, error: sessionError } = await supabase
      .from('student_sessions')
      .insert({ assessment_id: assessment.id, student_name: name.trim() })
      .select()
      .single()

    if (sessionError || !session) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    sessionStorage.setItem('student_session_id', session.id)
    sessionStorage.setItem('student_name', name.trim())
    sessionStorage.setItem('assessment_title', assessment.title)
    sessionStorage.setItem('course_id', assessment.course_id)

    router.push('/join/diagnostic')
  }

  return (
    <main style={pageContainer}>
      <div style={narrowCard}>
        <div>
          <h1 style={pageTitle}>Mathsense</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            Enter your class code to begin
          </p>
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Class code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. MX4T"
            maxLength={4}
            style={{
              ...inputStyle,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.25em',
              fontSize: '24px',
              textAlign: 'center' as const,
              fontWeight: '700',
            }}
            autoComplete="off"
            autoCapitalize="characters"
          />
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Jamie Smith"
            style={inputStyle}
            autoComplete="name"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {error && <p style={errorBox}>{error}</p>}

        <button
          onClick={handleJoin}
          disabled={loading || !code || !name}
          style={{
            ...primaryButton,
            opacity: loading || !code || !name ? 0.6 : 1,
          }}
        >
          {loading ? 'Joining...' : 'Start diagnostic'}
        </button>

        <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' as const }}>
          By joining, you confirm you are aged 13 or over and agree to our{' '}
          <a href="/privacy" style={{ color: colors.textSecondary, textDecoration: 'underline' }}>Privacy Notice</a>.
        </p>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
}