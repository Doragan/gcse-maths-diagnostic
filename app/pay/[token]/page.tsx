'use client'

/**
 * Public parent-pay page. A parent/guardian opens this from a link the student
 * forwarded — NO login required. The student behind the link is resolved
 * server-side from the signed token (see /api/parent-pay/*); this page only ever
 * sees the student's first name.
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PLANS, FEATURES, planPricing, seatsLeftLabel, type Plan } from '../../../lib/studentPlans'
import { trackEvent } from '../../../lib/analytics'
import {
  colors, font, radius,
  primaryButton, pageContainer,
} from '../../../lib/styles'

type Status = 'loading' | 'ok' | 'already_paid' | 'invalid' | 'paid'

export default function ParentPayPage() {
  const params = useParams()
  const token = String(params.token ?? '')

  const [status, setStatus] = useState<Status>('loading')
  const [firstName, setFirstName] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Founder seats remaining for the exam pass (null = still loading / unknown).
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null)

  useEffect(() => {
    // Returned from a successful Stripe checkout.
    const paid = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('paid') === 'true'
    if (paid) { setStatus('paid'); return }

    // Founder-seat count for the exam-pass sale framing (aggregate, no PII).
    fetch('/api/founder-seats')
      .then(r => r.json())
      .then(d => setSeatsLeft(typeof d.seatsLeft === 'number' ? d.seatsLeft : null))
      .catch(() => {})

    fetch(`/api/parent-pay/info?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        setFirstName(data.firstName ?? null)
        setStatus(data.status === 'ok' ? 'ok' : data.status === 'already_paid' ? 'already_paid' : 'invalid')
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      trackEvent('parent_pay_checkout_started', { plan: selectedPlan })
      const res = await fetch('/api/parent-pay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, plan: selectedPlan }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      if (data.alreadyPaid) { setStatus('already_paid'); return }
      setError(data.error ?? 'Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const who = firstName ? `${firstName}'s` : 'your child’s'

  // ── Terminal states ────────────────────────────────────────────────────────
  if (status === 'loading') {
    return <main style={pageContainer}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  if (status === 'paid') {
    return (
      <main style={pageContainer}>
        <div style={card}>
          <div style={notice(colors.successLight, colors.successBorder)}>
            <p style={{ fontSize: font.lg, fontWeight: 600, margin: '0 0 4px', color: colors.successText }}>✓ Payment successful</p>
            <p style={{ fontSize: font.base, color: colors.successText, margin: 0 }}>
              Thank you — {who}{' '}Mathsense account is now upgraded. They can keep practising straight away. A receipt has been emailed to you by Stripe.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (status === 'invalid') {
    return (
      <main style={pageContainer}>
        <div style={card}>
          <h1 style={heading}>Link not valid</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            This payment link has expired or isn&apos;t valid. Please ask your child to open Mathsense and send you a fresh link.
          </p>
        </div>
      </main>
    )
  }

  if (status === 'already_paid') {
    return (
      <main style={pageContainer}>
        <div style={card}>
          <div style={notice(colors.successLight, colors.successBorder)}>
            <p style={{ fontSize: font.lg, fontWeight: 600, margin: '0 0 4px', color: colors.successText }}>Already subscribed</p>
            <p style={{ fontSize: font.base, color: colors.successText, margin: 0 }}>
              Good news — {who}{' '}Mathsense account already has full access, so there&apos;s nothing to pay. No charge has been made.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // ── Payable ────────────────────────────────────────────────────────────────
  return (
    <main style={pageContainer}>
      <div style={card}>
        <div>
          <h1 style={heading}>Pay for {who}{' '}Mathsense</h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            {firstName ? `${firstName} asked you to help` : 'Your child asked you to help'}{' '}unlock targeted GCSE Maths practice. Choose a plan below — secure payment is handled by Stripe.
          </p>
        </div>

        <div style={styles.plans}>
          {PLANS.map(plan => {
            const selected = selectedPlan === plan.id
            const pricing = planPricing(plan, seatsLeft)
            const seatNote = plan.founder ? seatsLeftLabel(seatsLeft) : null
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{ ...styles.planCard, border: `2px solid ${selected ? colors.primary : colors.border}`, background: selected ? '#eff6ff' : colors.card }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: font.base, fontWeight: 600, color: colors.textPrimary }}>{plan.label}</span>
                  {pricing.badge && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: radius.full, background: colors.primary, color: '#fff' }}>{pricing.badge}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '6px 0 4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: colors.primary }}>{pricing.price}</span>
                  {pricing.strikePrice && (
                    <span style={{ fontSize: font.base, color: colors.textHint, textDecoration: 'line-through' }}>{pricing.strikePrice}</span>
                  )}
                  <span style={{ fontSize: font.sm, color: colors.textSecondary }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, textAlign: 'left' }}>{plan.description}</p>
                {seatNote && (
                  <p style={{ fontSize: font.sm, fontWeight: 600, color: colors.primary, margin: '6px 0 0', textAlign: 'left' }}>{seatNote}</p>
                )}
              </button>
            )
          })}
        </div>

        <div style={styles.features}>
          {FEATURES.map(f => (
            <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: colors.success, fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: font.base, color: colors.textPrimary }}>{f}</span>
            </div>
          ))}
        </div>

        {error && <p style={{ fontSize: font.base, color: colors.dangerText, margin: 0 }}>{error}</p>}

        <button onClick={handlePay} disabled={loading} style={{ ...primaryButton, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Redirecting to payment…' : (() => {
            const p = PLANS.find(p => p.id === selectedPlan)
            const price = p ? planPricing(p, seatsLeft).price : ''
            return `${selectedPlan === 'exam' ? 'Pay' : 'Subscribe'} — ${price}`
          })()}
        </button>

        <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' }}>
          Secure payment via Stripe. No hidden fees. You can cancel a subscription any time.
        </p>
      </div>
    </main>
  )
}

const heading: React.CSSProperties = { fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }
const notice = (bg: string, border: string): React.CSSProperties => ({ padding: '16px', borderRadius: radius.md, background: bg, border: `1px solid ${border}` })

const card: React.CSSProperties = {
  background: colors.card, borderRadius: radius.lg, padding: '32px 28px', width: '100%', maxWidth: '480px',
  border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '20px',
}
const styles: Record<string, React.CSSProperties> = {
  plans: { display: 'flex', flexDirection: 'column', gap: '10px' },
  planCard: { borderRadius: radius.md, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s ease' },
  features: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', background: colors.background, borderRadius: radius.md },
}
