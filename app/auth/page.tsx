'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '../../lib/auth'

export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setConfirmationSent(true)
      } else {
        await signIn(email, password)
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
      <main style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Check your email</h1>
          <p style={styles.subtitle}>
            We've sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then come back to log in.
          </p>
          <button
            onClick={() => { setIsSignUp(false); setConfirmationSent(false) }}
            style={styles.primaryButton}
          >
            Back to log in
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Mathsense</h1>
        <p style={styles.subtitle}>{isSignUp ? 'Create a teacher account' : 'Log in to your account'}</p>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            placeholder="you@school.ac.uk"
            autoComplete="email"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          style={{
            ...styles.primaryButton,
            opacity: loading || !email || !password ? 0.6 : 1,
          }}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}
        </button>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
          style={styles.secondaryButton}
        >
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
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
  secondaryButton: {
    background: 'none',
    border: 'none',
    color: '#4CAF50',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px 0',
    textAlign: 'center' as const,
  },
}