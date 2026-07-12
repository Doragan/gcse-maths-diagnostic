'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  colors, font,
  pageContainer, narrowCard, pageTitle,
  primaryButton, inputStyle, labelStyle, errorBox,
} from '../../../lib/styles'
import { supabase } from '../../../lib/supabase'
import { getUserRole, migratePendingPractice } from '../../../lib/auth'
import { trackEvent } from '../../../lib/analytics'

type Phase = 'resolving' | 'student_consent' | 'provisioning' | 'error'

/**
 * Google OAuth landing page. Google → Supabase → here (with ?role=teacher|student
 * threaded through by signInWithGoogle). The plain browser client exchanges the
 * code for a session in localStorage automatically (detectSessionInUrl), so we
 * wait for that, then route by role:
 *   • existing account → straight to the right dashboard
 *   • new teacher      → provision + /dashboard
 *   • new student      → collect the 13+ consent (Google can't), provision,
 *                        then /student/diagnostic
 * Account rows are created server-side by /api/auth/provision (client-role writes
 * to teachers/students are locked).
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('resolving')
  const [error, setError] = useState<string | null>(null)

  // Student-consent form state (only used when phase === 'student_consent').
  const [displayName, setDisplayName] = useState('')
  const [confirmed13, setConfirmed13] = useState(false)
  const [emailReminders, setEmailReminders] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Guard against React StrictMode / re-renders running the resolver twice.
  const started = useRef(false)

  function intendedRole(): 'teacher' | 'student' {
    if (typeof window === 'undefined') return 'teacher'
    return new URLSearchParams(window.location.search).get('role') === 'student'
      ? 'student'
      : 'teacher'
  }

  async function provision(role: 'teacher' | 'student', extra: Record<string, unknown> = {}) {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Your sign-in session was lost. Please try again.')
    const res = await fetch('/api/auth/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role, ...extra }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      throw new Error(j?.error ?? 'Could not finish setting up your account.')
    }
  }

  // Resolve the OAuth session and decide where to go.
  useEffect(() => {
    if (started.current) return
    started.current = true

    // Surface an OAuth error passed back in the URL (e.g. user cancelled).
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) {
      setError(params.get('error_description') || 'Google sign-in was cancelled or failed.')
      setPhase('error')
      return
    }

    let cancelled = false

    async function resolve() {
      // Wait for the client to establish the session from the URL. It's usually
      // ready within a tick, but poll briefly to cover the code-exchange latency.
      let session = (await supabase.auth.getSession()).data.session
      for (let i = 0; i < 20 && !session && !cancelled; i++) {
        await new Promise(r => setTimeout(r, 150))
        session = (await supabase.auth.getSession()).data.session
      }
      if (cancelled) return
      if (!session) {
        setError('We could not complete your Google sign-in. Please try again.')
        setPhase('error')
        return
      }

      const role = await getUserRole()
      const wanted = intendedRole()

      // Returning user — an account row already exists. Route by their actual role.
      if (role === 'teacher') {
        trackEvent('teacher_login_success', { method: 'google' })
        router.replace('/dashboard')
        return
      }
      if (role === 'student') {
        trackEvent('login_success', { method: 'google' })
        const uid = session.user.id
        await migratePendingPractice(uid)
        router.replace('/student/dashboard')
        return
      }

      // New OAuth user — no account row yet. Provision per the intended role.
      if (wanted === 'student') {
        // Pre-fill the name from Google; the student can edit it. Consent still
        // has to be collected here (Google never asked the 13+ question).
        const meta = session.user.user_metadata || {}
        setDisplayName((meta.full_name || meta.name || '') as string)
        setPhase('student_consent')
        return
      }

      // New teacher — no extra consent needed.
      setPhase('provisioning')
      try {
        await provision('teacher')
        trackEvent('teacher_signup_success', { method: 'google' })
        router.replace('/dashboard')
      } catch (e: any) {
        setError(e?.message ?? 'Something went wrong.')
        setPhase('error')
      }
    }

    resolve()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleStudentSubmit() {
    setError(null)
    if (!displayName.trim()) { setError('Please enter your name.'); return }
    if (!confirmed13) { setError('You must confirm you are aged 13 or over to create an account.'); return }
    setSubmitting(true)
    try {
      trackEvent('signup_submit', { method: 'google', email_reminders: emailReminders })
      await provision('student', {
        displayName: displayName.trim(),
        emailReminders,
        confirmed13: true,
      })
      trackEvent('signup_success', { method: 'google' })
      const { data: { session } } = await supabase.auth.getSession()
      if (session) await migratePendingPractice(session.user.id)
      router.replace('/student/diagnostic')
    } catch (e: any) {
      setError(e?.message ?? 'Could not create your account.')
      setSubmitting(false)
    }
  }

  // ── Student consent gate ─────────────────────────────────────────────────────
  if (phase === 'student_consent') {
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <div>
            <h1 style={pageTitle}>Almost there</h1>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
              Just confirm a couple of things to finish creating your account.
            </p>
          </div>

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

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={emailReminders}
              onChange={e => setEmailReminders(e.target.checked)}
              style={{ marginRight: '8px', flexShrink: 0 }}
            />
            <span style={{ fontSize: font.base, color: colors.textSecondary, lineHeight: '1.5' }}>
              Email me occasional reminders to keep practising. You can turn these
              off any time.
            </span>
          </label>

          {error && <p style={errorBox}>{error}</p>}

          <button
            onClick={handleStudentSubmit}
            disabled={submitting || !displayName.trim() || !confirmed13}
            style={{
              ...primaryButton,
              opacity: submitting || !displayName.trim() || !confirmed13 ? 0.6 : 1,
            }}
          >
            {submitting ? 'Please wait...' : 'Create account'}
          </button>
        </div>
      </main>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <h1 style={pageTitle}>Sign-in failed</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            {error}
          </p>
          <button
            onClick={() => router.replace(intendedRole() === 'student' ? '/student' : '/auth')}
            style={primaryButton}
          >
            Back to log in
          </button>
        </div>
      </main>
    )
  }

  // ── Resolving / provisioning ─────────────────────────────────────────────────
  return (
    <main style={pageContainer}>
      <div style={narrowCard}>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, textAlign: 'center' }}>
          Signing you in…
        </p>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  checkboxLabel: { display: 'flex', alignItems: 'flex-start', cursor: 'pointer' },
  link: { color: colors.primary, textDecoration: 'underline' },
}
