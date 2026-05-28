'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  colors, font, radius,
  pageContainer, narrowCard, pageTitle,
  primaryButton, secondaryButton, inputStyle, labelStyle, errorBox,
} from '../../lib/styles'
import { signIn, signUp, getSession } from '../../lib/auth'
import { trackEvent } from '../../lib/analytics'

export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  // Track teacher_signup_start once when they first switch to the signup form
  const signupTracked = useRef(false)
  useEffect(() => {
    if (isSignUp && !signupTracked.current) {
      signupTracked.current = true
      trackEvent('teacher_signup_start')
    }
  }, [isSignUp])

	useEffect(() => {
	  getSession().then(session => {
		if (session) router.push('/dashboard')
	  })
	}, [])

  async function handleSubmit() {
    setError(null)

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        trackEvent('teacher_signup_submit')
        await signUp(email, password)
        trackEvent('teacher_signup_success')
        setConfirmationSent(true)
      } else {
        await signIn(email, password)
        trackEvent('teacher_login_success')
        router.push('/dashboard')
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
            We've sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then come back to log in.
          </p>
          <button
            onClick={() => { setIsSignUp(false); setConfirmationSent(false) }}
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
            {isSignUp ? 'Create a teacher account' : 'Log in to your account'}
          </p>
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@school.ac.uk"
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
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            onKeyDown={e => !isSignUp && e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {isSignUp && (
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
        )}

        {error && <p style={errorBox}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password || (isSignUp && !confirmPassword)}
          style={{
            ...primaryButton,
            opacity: loading || !email || !password || (isSignUp && !confirmPassword) ? 0.6 : 1,
          }}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}
        </button>
		
		{!isSignUp && (
		  <button
			onClick={() => router.push('/auth/reset')}
			style={{
			  background: 'none',
			  border: 'none',
			  color: colors.textSecondary,
			  fontSize: font.sm,
			  cursor: 'pointer',
			  padding: '0',
			  textAlign: 'center' as const,
			}}
		  >
			Forgot your password?
		  </button>
		)}
		
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); setConfirmPassword('') }}
          style={{
            background: 'none',
            border: 'none',
            color: colors.primary,
            fontSize: font.base,
            cursor: 'pointer',
            padding: '4px 0',
            textAlign: 'center' as const,
          }}
        >
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
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