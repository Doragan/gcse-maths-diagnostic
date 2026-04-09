'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  colors, font, radius,
  pageContainer, narrowCard, pageTitle,
  primaryButton, secondaryButton,
} from '../../../lib/styles'

export default function UpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
  setLoading(true)
  setError(null)
  try {
    const { data: { session } } = await import('../../../lib/supabase').then(m => m.supabase.auth.getSession())
    
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
    })
    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error ?? 'Something went wrong. Please try again.')
    }
  } catch (e) {
    setError('Something went wrong. Please try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <main style={pageContainer}>
      <div style={{ ...narrowCard, maxWidth: '480px' }}>
        <div>
          <h1 style={pageTitle}>Unlock Mathsense</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            You've used your free class diagnostic. Upgrade to run unlimited diagnostics until 31st December 2026.
          </p>
        </div>

        <div style={styles.priceBox}>
          <span style={{ fontSize: '42px', fontWeight: '700', color: colors.primary }}>£10</span>
          <span style={{ fontSize: font.base, color: colors.textSecondary }}>one-off · access until 31 Dec 2026</span>
        </div>

        <div style={styles.features}>
          {[
            'Unlimited class diagnostics',
            'Foundation and Higher tier',
            'Full student results breakdown',
            'PDF and CSV downloads',
            'All future updates included',
          ].map(feature => (
            <div key={feature} style={styles.feature}>
              <span style={{ color: colors.success, fontWeight: '600' }}>✓</span>
              <span style={{ fontSize: font.base, color: colors.textPrimary }}>{feature}</span>
            </div>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: font.base, color: colors.dangerText, margin: 0 }}>{error}</p>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{ ...primaryButton, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Redirecting to payment...' : 'Upgrade for £10'}
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          style={secondaryButton}
        >
          Back to dashboard
        </button>

        <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' as const }}>
          Secure payment via Stripe. No subscription — pay once, access all year.
        </p>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  priceBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    padding: '16px',
    background: colors.background,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  feature: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
}