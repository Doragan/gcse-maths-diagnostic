'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import {
  colors, font,
  pageContainer, narrowCard, pageTitle,
  primaryButton, inputStyle, labelStyle, errorBox,
} from '../../../lib/styles'

export default function ConfirmPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)

useEffect(() => {
  // Handle hash-based token (Supabase legacy flow)
  const hash = window.location.hash
  if (hash && hash.includes('type=recovery')) {
    setReady(true)
    return
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      setReady(true)
    }
  })
  return () => subscription.unsubscribe()
}, [])

  async function handleSubmit() {
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <h1 style={pageTitle}>Password updated</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Your password has been changed. Redirecting you to your dashboard...
          </p>
        </div>
      </main>
    )
  }

  if (!ready) {
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Verifying your reset link...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={pageContainer}>
      <div style={narrowCard}>
        <div>
          <h1 style={pageTitle}>Set a new password</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            Choose a strong password for your account.
          </p>
        </div>

        <div style={styles.field}>
          <label style={labelStyle}>New password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>

        {password && (
          <div>
            <div style={styles.strengthTrack}>
              <div style={{
                ...styles.strengthFill,
                width: password.length >= 12 ? '100%' : password.length >= 8 ? '60%' : '30%',
                background: password.length >= 12 ? colors.success : password.length >= 8 ? colors.warning : colors.danger,
              }} />
            </div>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0' }}>
              {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Acceptable' : 'Too short'}
            </p>
          </div>
        )}

        <div style={styles.field}>
          <label style={labelStyle}>Confirm new password</label>
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

        {error && <p style={errorBox}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !password || !confirmPassword}
          style={{ ...primaryButton, opacity: loading || !password || !confirmPassword ? 0.6 : 1 }}
        >
          {loading ? 'Updating...' : 'Set new password'}
        </button>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  strengthTrack: {
    width: '100%',
    height: '4px',
    background: colors.border,
    borderRadius: '2px',
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease, background 0.3s ease',
  },
}