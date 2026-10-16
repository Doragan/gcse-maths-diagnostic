'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStudentProfile } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import {
  colors, font, radius,
  primaryButton, secondaryButton, pageContainer,
} from '../../../lib/styles'
import {
  PLANS, FEATURES, planPricing, seatsLeftLabel, wantedFeatureLabel, type Plan,
} from '../../../lib/studentPlans'
import { skillsById } from '../../../lib/skills/skillGraph'
import { trackEvent } from '../../../lib/analytics'
import { copyParentLink, emailParentLink, shareParentLink } from '../../../lib/parentPayShare'

export default function StudentUpgradePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgraded, setUpgraded] = useState(false)
  // Founder seats remaining for the exam pass (null = still loading / unknown).
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null)

  /**
   * What the student was trying to do when they were sent here, from
   * `?want=` (+ `?skill=` where it names one). Every locked feature that
   * routes to this page should say which feature it was.
   */
  const [wantedLabel, setWantedLabel] = useState<string | null>(null)

  // "Ask a parent to pay" — a shareable link the student forwards.
  const [parentLink, setParentLink] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  /**
   * Which door the student came through. Almost everyone on this page is 13–16
   * and has no card of their own, yet the page is shaped around one: plans
   * first, "ask a parent" last. The two doors sit together at the top instead.
   *
   * 'self' is the default only because it preserves today's page for whoever
   * CAN pay; nothing infers which door fits this student. There is no age
   * signal to read, and asserting the wrong one here is expensive.
   */
  const [payer, setPayer] = useState<'self' | 'parent'>('self')

  useEffect(() => {
    getStudentProfile().then(p => {
      if (!p) { router.push('/student'); return }
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('upgraded') === 'true') setUpgraded(true)
        const skillId = params.get('skill')
        setWantedLabel(wantedFeatureLabel(
          params.get('want'),
          skillId ? skillsById[skillId]?.name ?? null : null,
        ))
        // `?ask=parent` — sent here by a wall that already knows the student
        // can't pay (the mini-exam quota wall). Open the parent door and have
        // the link ready, rather than making them find it and tap again.
        if (params.get('ask') === 'parent') {
          setPayer('parent')
          getParentLink()
        }
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

  // Wording, the copy fallback and the `parent_pay_link_shared` event all live
  // in lib/parentPayShare so this page and FounderUpgradeModal cannot drift.
  async function handleCopy() {
    if (!parentLink) return
    if (await copyParentLink(parentLink, 'upgrade_page')) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setError('Could not copy — select and copy the link manually.')
    }
  }

  async function handleShare() {
    if (!parentLink) return
    // The share sheet gives its own feedback; where there isn't one this falls
    // back to a silent copy. No tick here — that belongs to the Copy button.
    await shareParentLink(parentLink, 'upgrade_page')
  }

  function handleEmail() {
    if (!parentLink) return
    emailParentLink(parentLink, 'upgrade_page')
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

        {/* What the student was trying to do when they hit the paywall.
            Landing on a generic pricing page with no acknowledgement reads as
            a dead end — they asked for one specific thing and got a sales
            pitch. Driven by query params so every entry point can say its
            own piece. */}
        {wantedLabel && (
          <div style={styles.wanted}>
            <p style={{ margin: 0, fontSize: font.base, color: colors.primaryHover, fontWeight: '600' }}>
              {wantedLabel}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: font.sm, color: colors.textSecondary }}>
              It&apos;s part of Premium, along with everything below.
            </p>
          </div>
        )}

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

        {/* ── Two doors ──────────────────────────────────────────────────
            Nearly everyone here is 13–16 with no card of their own, and the
            parent link used to be the last thing on the page, below two blocks
            of pricing. Both ways of paying now sit together, above the fold.
            Neither is inferred — see the `payer` state. */}
        <div style={styles.doors}>
          {([
            { id: 'self' as const,   label: 'Pay yourself',          sub: 'Card or Apple Pay' },
            { id: 'parent' as const, label: 'Ask a parent or carer', sub: 'Send them a secure link' },
          ]).map(d => {
            const on = payer === d.id
            return (
              <button
                key={d.id}
                onClick={() => {
                  setPayer(d.id)
                  // Have the link ready the moment the door opens: one tap
                  // fewer, and nothing is shared until they choose to.
                  if (d.id === 'parent' && !parentLink && !linkLoading) getParentLink()
                }}
                style={{
                  ...styles.door,
                  border: `2px solid ${on ? colors.primary : colors.border}`,
                  background: on ? '#eff6ff' : colors.card,
                }}
              >
                <span style={{ fontSize: font.base, fontWeight: 600, color: colors.textPrimary }}>{d.label}</span>
                <span style={{ fontSize: font.sm, color: colors.textSecondary }}>{d.sub}</span>
              </button>
            )
          })}
        </div>

        {/* ── Ask a parent / carer to pay ── */}
        {payer === 'parent' && (
          <div style={styles.parentBox}>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 12px' }}>
              Send this link to a parent or carer so they can pay for your account. They don&apos;t need a Mathsense login, and they choose the plan.
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
                  <button onClick={handleCopy} style={{ ...secondaryButton, flex: 1, minWidth: 90 }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <button onClick={handleEmail} style={{ ...secondaryButton, flex: 1, minWidth: 90 }}>Email</button>
                  <button onClick={handleShare} style={{ ...secondaryButton, flex: 1, minWidth: 90 }}>Share</button>
                </div>
                <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
                  The link works for 30 days and stops once your account is paid for.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <p style={{ fontSize: font.base, color: colors.dangerText, margin: 0 }}>{error}</p>
        )}

        {payer === 'self' && (
        <>
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
                {/* Size cue, quieter than the terms above it — see PlanDef.comparison. */}
                {plan.comparison && (
                  <p style={{ fontSize: font.sm, color: colors.textHint, margin: '6px 0 0', textAlign: 'left' as const }}>
                    {plan.comparison}
                  </p>
                )}
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
        </>
        )}

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
  wanted: {
    background: '#eff6ff',
    border: `1px solid #c3d5fb`,
    borderRadius: radius.md,
    padding: '12px 14px',
  },
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
  doors: {
    display: 'flex',
    gap: '10px',
    // Side by side where there is room, stacked on a narrow phone — neither
    // door should read as the secondary one.
    flexWrap: 'wrap' as const,
  },
  door: {
    flex: '1 1 180px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderRadius: radius.md,
    padding: '12px 14px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'border-color 0.15s ease',
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
