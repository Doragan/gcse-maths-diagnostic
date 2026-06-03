'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStudentProfile } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import {
  colors, font, radius,
  primaryButton, secondaryButton, pageContainer,
} from '../../../lib/styles'

type Plan = 'monthly' | 'annual' | 'exam'

const PLANS: {
  id: Plan
  label: string
  price: string
  period: string
  badge: string | null
  description: string
}[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '£1.49',
    period: 'per month',
    badge: null,
    description: 'Renews monthly. Cancel any time.',
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '£11.99',
    period: 'per year',
    badge: 'Best value',
    description: 'Renews yearly — cancel any time. Saves £5.89 vs monthly.',
  },
  {
    id: 'exam',
    label: 'Exam Season 2027',
    price: '£9.99',
    period: 'until 31 July 2027',
    badge: 'Early access',
    description: 'One payment covering now until after your summer 2027 exams.',
  },
]

const FEATURES = [
  'Drill any single skill or whole topic on demand',
  'One-tap "weak spots" sessions built from the skills you keep missing',
  'Smart practice that automatically targets your weakest skills first',
  'Priority access to new premium features as they launch',
]

export default function StudentUpgradePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgraded, setUpgraded] = useState(false)

  useEffect(() => {
    getStudentProfile().then(p => {
      if (!p) { router.push('/student'); return }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('upgraded') === 'true') setUpgraded(true)
      }
    })
  }, [])

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/stripe/student-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (upgraded) {
    return (
      <main style={pageContainer}>
        <div style={styles.card}>
          <div style={{
            padding: '16px',
            borderRadius: radius.md,
            background: colors.successLight,
            border: `1px solid ${colors.successBorder}`,
          }}>
            <p style={{ fontSize: font.lg, fontWeight: '600', margin: '0 0 4px', color: colors.successText }}>
              ✓ Payment successful
            </p>
            <p style={{ fontSize: font.base, color: colors.successText, margin: 0 }}>
              Your account has been upgraded. Enjoy targeted practice!
            </p>
          </div>
          <button onClick={() => router.push('/student/dashboard')} style={primaryButton}>
            Go to dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={pageContainer}>
      <div style={styles.card}>

        <div>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '700', margin: 0, color: colors.textPrimary }}>
            Upgrade Mathsense
          </h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            Unlock targeted practice — drill the exact skills you need to improve.
          </p>
        </div>

        {/* Plan selector */}
        <div style={styles.plans}>
          {PLANS.map(plan => {
            const selected = selectedPlan === plan.id
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  ...styles.planCard,
                  border: `2px solid ${selected ? colors.primary : colors.border}`,
                  background: selected ? '#eff6ff' : colors.card,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>
                    {plan.label}
                  </span>
                  {plan.badge && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: radius.full,
                      background: colors.primary,
                      color: '#fff',
                    }}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0 4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '700', color: colors.primary }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
                    {plan.period}
                  </span>
                </div>
                <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, textAlign: 'left' as const }}>
                  {plan.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Features */}
        <div style={styles.features}>
          {FEATURES.map(f => (
            <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: colors.success, fontWeight: '700', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: font.base, color: colors.textPrimary }}>{f}</span>
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
          {loading
            ? 'Redirecting to payment...'
            : `${selectedPlan === 'exam' ? 'Get access' : 'Subscribe'} — ${PLANS.find(p => p.id === selectedPlan)?.price}`}
        </button>

        <button
          onClick={() => router.push('/student/dashboard')}
          style={secondaryButton}
        >
          Back to dashboard
        </button>

        <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' as const }}>
          Secure payment via Stripe. No hidden fees.
        </p>

      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: colors.card,
    borderRadius: radius.lg,
    padding: '32px 28px',
    width: '100%',
    maxWidth: '480px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  plans: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  planCard: {
    borderRadius: radius.md,
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    transition: 'border-color 0.15s ease',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    background: colors.background,
    borderRadius: radius.md,
  },
}
