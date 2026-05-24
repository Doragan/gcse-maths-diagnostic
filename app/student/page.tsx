'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  colors, font,
  pageContainer, narrowCard, pageTitle,
  primaryButton, inputStyle, labelStyle, errorBox,
} from '../../lib/styles'
import { signIn, signUpStudent, signOut, getStudentProfile } from '../../lib/auth'

type Mode = 'login' | 'signup'

export default function StudentAuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmed13, setConfirmed13] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  useEffect(() => {
    getStudentProfile().then(profile => {
      if (profile) router.push('/student/dashboard')
    })
  }, [])

  function reset() {
    setError(null)
    setDisplayName('')
    setPassword('')
    setConfirmPassword('')
    setConfirmed13(false)
  }

  async function handleSubmit() {
    setError(null)

    if (mode === 'signup') {
      if (!displayName.trim()) { setError('Please enter your name.'); return }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
      if (!confirmed13) { setError('You must confirm you are aged 13 or over to create an account.'); return }
    } else {
      if (password.length < 1) { setError('Please enter your password.'); return }
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUpStudent(email, password, displayName.trim())
        setConfirmationSent(true)
      } else {
        await signIn(email, password)
        const profile = await getStudentProfile()
        if (profile) {
          router.push('/student/dashboard')
        } else {
          // Signed in but no student account — likely a teacher using the wrong login
          await signOut()
          setError('No student account found for this email. If you are a teacher, use the teacher login instead.')
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <h1 style={pageTitle}>Check your email</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then come back to log in.
          </p>
          <button
            onClick={() => { setMode('login'); setConfirmationSent(false) }}
            style={primaryButton}
          >
            Back to log in
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={pageContainer}>
      <div style={narrowCard}>
        <div>
          <h1 style={pageTitle}>Mathsense</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            {mode === 'signup' ? 'Create a student account' : 'Log in to your account'}
          </p>
        </div>

        {mode === 'signup' && (
          <div style={styles.field}>
            <label style={labelStyle}>Your name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Jamie Smith"
              autoComplete="name"
            />
          </div>
        )}

        <div style={styles.field}>
          <label style={labelStyle}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="••••••••"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            onKeyDown={e => mode === 'login' && e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {mode === 'signup' && (
          <>
            <div style={styles.field}>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                autoComplete="new-password"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={confirmed13}
                onChange={e => setConfirmed13(e.target.checked)}
                style={{ marginRight: '8px', flexShrink: 0 }}
              />
              <span style={{ fontSize: font.base, color: colors.textSecondary, lineHeight: '1.5' }}>
                I confirm I am aged 13 or over. By creating an account I agree to the{' '}
                <a href="/terms" style={styles.link}>Terms of Service</a> and{' '}
                <a href="/privacy" style={styles.link}>Privacy Notice</a>.
              </span>
            </label>
          </>
        )}

        {error && <p style={errorBox}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password || (mode === 'signup' && (!displayName || !confirmPassword || !confirmed13))}
          style={{
            ...primaryButton,
            opacity: loading || !email || !password || (mode === 'signup' && (!displayName || !confirmPassword || !confirmed13)) ? 0.6 : 1,
          }}
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>

        {mode === 'login' && (
          <button
            onClick={() => router.push('/auth/reset')}
            style={styles.textButton}
          >
            Forgot your password?
          </button>
        )}

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); reset() }}
          style={{ ...styles.textButton, color: colors.primary }}
        >
          {mode === 'signup'
            ? 'Already have an account? Log in'
            : "Don't have an account? Sign up"}
        </button>

        <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' }}>
          Are you a teacher?{' '}
          <a href="/auth" style={styles.link}>Teacher login</a>
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    cursor: 'pointer',
  },
  textButton: {
    background: 'none',
    border: 'none',
    color: colors.textSecondary,
    fontSize: font.base,
    cursor: 'pointer',
    padding: '0',
    textAlign: 'center' as const,
  },
  link: {
    color: colors.primary,
    textDecoration: 'underline',
  },
}
