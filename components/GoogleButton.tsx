'use client'

import { useState } from 'react'
import { colors, font, secondaryButton } from '../lib/styles'
import { signInWithGoogle } from '../lib/auth'

/**
 * "Continue with Google" button + an "or" divider, shared by the teacher (/auth)
 * and student (/student) login pages and the anonymous practice sign-up nudge.
 * The Google "G" is inlined as SVG so there's no external asset to load (keeps it
 * CSP/offline-safe and avoids a network hop).
 *
 * `role` decides which account the OAuth callback provisions — see
 * signInWithGoogle in lib/auth.ts. `onBeforeSignIn` fires just before the redirect,
 * for callers that need to attribute the click (e.g. the practice nudge's CTA event).
 */
export function GoogleButton({ role, onBeforeSignIn }: {
  role: 'teacher' | 'student'
  onBeforeSignIn?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setBusy(true)
    try {
      onBeforeSignIn?.()
      await signInWithGoogle(role)
      // On success the browser redirects to Google, so we never fall through.
    } catch (e: any) {
      setError(e?.message ?? 'Could not start Google sign-in. Please try again.')
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={busy}
        style={{
          ...secondaryButton,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          opacity: busy ? 0.6 : 1,
        }}
      >
        <GoogleLogo />
        {busy ? 'Redirecting…' : 'Continue with Google'}
      </button>

      {error && (
        <p style={{ fontSize: font.sm, color: colors.dangerText, margin: 0, textAlign: 'center' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: colors.border }} />
        <span style={{ fontSize: font.sm, color: colors.textHint }}>or</span>
        <div style={{ flex: 1, height: '1px', background: colors.border }} />
      </div>
    </>
  )
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}
