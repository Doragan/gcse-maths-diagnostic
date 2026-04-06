'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendPasswordResetEmail } from '../../../lib/auth'
import {
  colors, font,
  pageContainer, narrowCard, pageTitle,
  primaryButton, secondaryButton, inputStyle, labelStyle, errorBox,
} from '../../../lib/styles'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      await sendPasswordResetEmail(email)
      setSent(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <h1 style={pageTitle}>Check your email</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            We've sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
          </p>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            If you don't see it, check your spam folder.
          </p>
          <button onClick={() => router.push('/auth')} style={primaryButton}>
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
          <h1 style={pageTitle}>Reset your password</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            Enter your email address and we'll send you a reset link.
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
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p style={errorBox}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email}
          style={{ ...primaryButton, opacity: loading || !email ? 0.6 : 1 }}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <button onClick={() => router.push('/auth')} style={secondaryButton}>
          Back to log in
        </button>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
}