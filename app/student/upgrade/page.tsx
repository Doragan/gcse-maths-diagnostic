'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStudentProfile } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import {
  colors, font, radius,
  primaryButton, secondaryButton, pageContainer,
} from '../../../lib/styles'
import { PLANS, FEATURES, planPricing, seatsLeftLabel, type Plan } from '../../../lib/studentPlans'
import { trackEvent } from '../../../lib/analytics'

export default function StudentUpgradePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgraded, setUpgraded] = useState(false)
  // Founder seats remaining for the exam pass (null = still loading / unknown).
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null)

  // "Ask a parent to pay" — a shareable link the student forwards.
  const [parentLink, setParentLink] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getStudentProfile().then(p => {
      if (!p) { router.push('/student'); return }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('upgraded') === 'true') setUpgraded(true)
      }
    })
    // Founder-seat count for the exam-pass sale framing (aggregate, no PII).
    fetch('/api/founder-seats')
      .then(r => r.json())
      .then(d => setSeatsLeft(typeof d.seatsLeft === 'number' ? d.seatsLeft : null))
      .catch(() => {})
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

  async function getParentLink() {
    setLinkLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/parent-pay/link', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      })
      const data = await res.json()
      if (data.url) {
        setParentLink(data.url)
        trackEvent('parent_pay_link_created')
      } else {
        setError(data.error ?? 'Could not create a link. Please try again.')
      }
    } catch {
      setError('Could not create a link. Please try again.')
    } finally {
      setLinkLoading(false)
    }
  }

  async function copyParentLink() {
    if (!parentLink) return
    try {
      await navigator.clipboard.writeText(parentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — select and copy the link manually.')
    }
  }

  function shareParentLink() {
    if (!parentLink) return
    const text = `Please could you help pay for my Mathsense GCSE Maths subscription? You can pay securely here: ${parentLink}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'Mathsense subscription', text, url: parentLink }).catch(() => {})
    } else {
      copyParentLink()
    }
  }

  function emailParentLink() {
    if (!parentLink) return
    const subject = encodeURIComponent('Please help pay for my Mathsense subscription')
    const body = encodeURIComponent(
      `Hi,\n\nPlease could you help pay for my Mathsense GCSE Maths subscription? You can choose a plan and pay securely here:\n\n${parentLink}\n\nThank you!`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
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
            Unlock the full picture
          </h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            Your progress is safe — we keep saving everything. Upgrade to see your
            whole arc: progress trends, targeted practice, and your weak spots —
            kept through your summer 2027 exams.
          </p>
        </div>

        {/* Plan selector */}
        <div style={styles.plans}>
          {PLANS.map(plan => {
            const selected = selectedPlan === plan.id
            const pricing = planPricing(plan, seatsLeft)
            const seatNote = plan.founder ? seatsLeftLabel(seatsLeft) : null
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
                  {pricing.badge && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: radius.full,
                      background: colors.primary,
                      color: '#fff',
                    }}>
                      {pricing.badge}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0 4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '700', color: colors.primary }}>
                    {pricing.price}
                  </span>
                  {pricing.strikePrice && (
                    <span style={{ fontSize: font.base, color: colors.textHint, textDecoration: 'line-through' }}>
                      {pricing.strikePrice}
                    </span>
                  )}
                  <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
                    {plan.period}
                  </span>
                </div>
                <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, textAlign: 'left' as const }}>
                  {plan.description}
                </p>
                {seatNote && (
                  <p style={{ fontSize: font.sm, fontWeight: 600, color: colors.primary, margin: '6px 0 0', textAlign: 'left' as const }}>
                    {seatNote}
                  </p>
                )}
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
            : (() => {
                const p = PLANS.find(p => p.id === selectedPlan)
                const price = p ? planPricing(p, seatsLeft).price : ''
                return `${selectedPlan === 'exam' ? 'Get access' : 'Subscribe'} — ${price}`
              })()}
        </button>

        {/* Ask a parent / guardian to pay */}
        <div style={styles.parentBox}>
          <p style={{ fontSize: font.base, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
            Can&apos;t pay yourself?
          </p>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 12px' }}>
            Send a secure link to a parent or guardian so they can pay for your account. They don&apos;t need a Mathsense login.
          </p>

          {!parentLink ? (
            <button
              onClick={getParentLink}
              disabled={linkLoading}
              style={{ ...secondaryButton, opacity: linkLoading ? 0.6 : 1 }}
            >
              {linkLoading ? 'Creating link…' : 'Get a link to send'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={styles.linkChip}>{parentLink}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={copyParentLink} style={{ ...secondaryButton, flex: 1, minWidth: 90 }}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <button onClick={emailParentLink} style={{ ...secondaryButton, flex: 1, minWidth: 90 }}>Email</button>
                <button onClick={shareParentLink} style={{ ...secondaryButton, flex: 1, minWidth: 90 }}>Share</button>
              </div>
              <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
                The link works for 30 days and stops once your account is paid for.
              </p>
            </div>
          )}
        </div>

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
  parentBox: {
    padding: '16px',
    borderRadius: radius.md,
    border: `1px dashed ${colors.border}`,
    background: colors.background,
  },
  linkChip: {
    fontSize: '13px',
    color: colors.textSecondary,
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: '10px 12px',
    wordBreak: 'break-all' as const,
  },
}
