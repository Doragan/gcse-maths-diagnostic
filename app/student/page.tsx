'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  colors, font,
  pageContainer, narrowCard, pageTitle,
  primaryButton, inputStyle, labelStyle, errorBox,
} from '../../lib/styles'
import { signIn, signUpStudent, signOut, getStudentProfile } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'

type Mode = 'login' | 'signup'

// Migrate anonymous practice attempts (stored in localStorage by the practice page
// so they survive the email-confirmation round-trip) into the new account — so the
// "save your progress" nudge is actually true and the student doesn't sign up to an
// empty dashboard. Mirrors the diagnostic's pending_diagnostic import. Idempotent:
// clears the store on success, so it's safe to call from both the login handler and
// the on-load redirect.
async function migratePendingPractice(studentId: string) {
  if (typeof window === 'undefined') return
  let pending: Array<{ question_id: string; skill_ids: string[]; correct: boolean; kind?: string }> = []
  try { pending = JSON.parse(localStorage.getItem('pending_practice') ?? '[]') } catch { pending = [] }
  if (!Array.isArray(pending) || pending.length === 0) return
  const rows = pending.slice(-200).map(a => ({
    student_id:  studentId,
    question_id: a.question_id,
    skill_ids:   a.skill_ids,
    correct:     a.correct,
    kind:        a.kind ?? 'mastery',
  }))
  const { error } = await supabase.from('practice_attempts').insert(rows)
  if (error) { console.error('Failed to migrate pending practice:', error.message); return }
  localStorage.removeItem('pending_practice')
  trackEvent('pending_practice_migrated', { count: rows.length })
}

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

  // Track signup_start once — fires when the user first switches to signup mode,
  // whether manually or automatically (post-diagnostic nudge).
  const signupTracked = useRef(false)
  useEffect(() => {
    if (mode === 'signup' && !signupTracked.current) {
      signupTracked.current = true
      trackEvent('signup_start')
    }
  }, [mode])

  useEffect(() => {
    getStudentProfile().then(async profile => {
      if (profile) {
        await migratePendingPractice(profile.id)
        router.push('/student/dashboard')
      }
    })
    // If the student came here after completing an anonymous diagnostic,
    // nudge them toward creating an account rather than logging in.
    if (typeof window !== 'undefined' && localStorage.getItem('pending_diagnostic')) {
      setMode('signup')
    }
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
        trackEvent('signup_submit')
        await signUpStudent(email, password, displayName.trim())
        trackEvent('signup_success')
        setConfirmationSent(true)
      } else {
        await signIn(email, password)
        const profile = await getStudentProfile()
        if (profile) {
          // Carry over anything they practised anonymously before signing up.
          await migratePendingPractice(profile.id)
          // Import any diagnostic answers the student completed anonymously.
          // These are stored in localStorage so they survive the email-confirmation
          // flow (user closes the tab, confirms, then comes back later).
          const pendingStr = typeof window !== 'undefined' ? localStorage.getItem('pending_diagnostic') : null
          const pendingAttempts: Array<{question_id: string; skill_ids: string[]; correct: boolean}> =
            pendingStr ? JSON.parse(pendingStr) : []

          if (pendingAttempts.length > 0) {
            trackEvent('login_success', { had_pending_diagnostic: true })
            const rows = pendingAttempts.map(a => ({
              student_id:  profile.id,
              question_id: a.question_id,
              skill_ids:   a.skill_ids,
              correct:     a.correct,
            }))
            const { error: insertErr } = await supabase.from('practice_attempts').insert(rows)
            if (!insertErr) localStorage.removeItem('pending_diagnostic')
            // Go straight to dashboard — they just did the diagnostic
            router.push('/student/dashboard')
          } else {
            // Send first-time users to the diagnostic so their profile is built immediately
            const { data: attempts } = await supabase
              .from('practice_attempts')
              .select('id')
              .eq('student_id', profile.id)
              .limit(1)
            const isNewUser = !attempts || attempts.length === 0
            trackEvent('login_success', { new_user: isNewUser })
            router.push(isNewUser ? '/student/diagnostic' : '/student/dashboard')
          }
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
    const hasPendingDiagnostic = typeof window !== 'undefined' && !!localStorage.getItem('pending_diagnostic')
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <h1 style={pageTitle}>Check your email</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then log in here —{' '}
            {hasPendingDiagnostic
              ? 'your diagnostic results will be saved to your account automatically.'
              : 'you\'ll go straight to your diagnostic.'}
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
