'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  colors, font, radius,
  pageContainer, narrowCard, pageTitle,
  primaryButton, secondaryButton, inputStyle, labelStyle, errorBox,
} from '../../lib/styles'
import { signIn, signUp, getSession, getUserRole, signOut } from '../../lib/auth'
import { trackEvent } from '../../lib/analytics'
import { GoogleButton } from '../../components/GoogleButton'

function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // A CTA that promises an account has to land on a SIGNUP form. Every teacher
  // CTA on the site linked to a bare /auth, which renders the login form with
  // the signup toggle below it — under the submit button and under the
  // forgot-password link. That included /mark's "Create a free account", shown
  // straight after a teacher has marked a paper, and the /demo tour's "Create a
  // teacher account".
  //
  // Measured over the 90 days to 2026-09-13: 39 sessions reached /for-teachers,
  // 3 ever fired teacher_signup_start (i.e. found the toggle), and 0 completed.
  // Same defect, same fix as /student in PR #70, where 10 of 10 email signups
  // were lost to it.
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  // "Signed in" and "has an account" are not the same thing. See the redirect
  // effect below.
  const [strandedEmail, setStrandedEmail] = useState<string | null>(null)

  // Track teacher_signup_start once — on the toggle, or immediately on mount
  // when ?mode=signup opened the form directly.
  const signupTracked = useRef(false)
  useEffect(() => {
    if (isSignUp && !signupTracked.current) {
      signupTracked.current = true
      trackEvent('teacher_signup_start')
    }
  }, [isSignUp])

  // Route a signed-in visitor by their ACTUAL role, not by assuming one.
  //
  // This used to be `if (session) router.push('/dashboard')`, which treats any
  // session as a teacher's. /dashboard then made the mirror-image assumption,
  // treating anyone without a teachers row as a student and forwarding them to
  // /student/dashboard, which forwarded them to /student. Each hop guessed, and
  // the guesses chained.
  //
  // A user with a session but NO profile row of either kind falls through all
  // of it and lands on a student login form they cannot use, with no sign-out
  // anywhere on the way. That state is real: it is what an account is left in
  // whenever provisioning fails after the OAuth exchange — a dropped connection
  // between Google and /api/auth/provision is enough, and the teacher signup bug
  // fixed in PR #80 produced several.
  //
  // So: resolve the role, and treat "no account yet" as its own case rather
  // than as somebody else's problem to redirect onward.
  useEffect(() => {
    getSession().then(async session => {
      if (!session) return

      const role = await getUserRole()
      if (role === 'teacher') { router.push('/dashboard'); return }
      if (role === 'student') { router.push('/student/dashboard'); return }

      setStrandedEmail(session.user.email ?? '')
    })
  }, [])

  async function handleStrandedSignOut() {
    await signOut()
    setStrandedEmail(null)
  }

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

  // Signed in, but no account was ever created. Tell them plainly and give them
  // the one action that helps. Rendering the login form here would be worse than
  // useless: they ARE logged in, so logging in again changes nothing.
  if (strandedEmail !== null) {
    return (
      <main style={pageContainer}>
        <div style={narrowCard}>
          <h1 style={pageTitle}>Your account wasn&apos;t finished</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            You&apos;re signed in as <strong>{strandedEmail}</strong>, but setting up the
            account didn&apos;t complete, so there&apos;s nothing to log in to yet.
          </p>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Sign out and sign up again. If you used Google, choose the same Google
            account and it will carry on from where it stopped.
          </p>
          <button onClick={handleStrandedSignOut} style={primaryButton}>
            Sign out
          </button>
        </div>
      </main>
    )
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

        <GoogleButton role="teacher" />

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

/**
 * useSearchParams needs a Suspense boundary in the app router. Same wrapper as
 * app/student/page.tsx.
 */
export default function AuthPageWrapper() {
  return (
    <Suspense fallback={<main style={pageContainer}><div style={narrowCard}><p>Loading…</p></div></main>}>
      <AuthPage />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
}