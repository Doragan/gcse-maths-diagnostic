'use client'

/**
 * Founder-price nudge for RETURNING FREE students on the dashboard.
 *
 * The dashboard only mounts this for `hasAttempts && !isPaid`, so this component
 * owns the rest of the "should it show?" decision:
 *   • snoozed for {@link SNOOZE_DAYS} days after a dismiss (localStorage), and
 *   • only while founder seats remain — once the £4.99 offer is closed there's
 *     no ".99 price" to advertise, so it stays hidden.
 *
 * The typical payer is a parent (the account holder is 13–15), so the primary
 * action forwards the existing signed parent-pay link (/api/parent-pay/link) —
 * the same flow as the upgrade page — rather than asking the student to pay.
 * Gentle by design (easy X, click-outside, Esc): this is a monetisation prompt
 * on a minor-facing product.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/analytics'
import { PLANS, planPricing, seatsLeftLabel } from '../lib/studentPlans'
import { colors, font, radius, primaryButton, secondaryButton } from '../lib/styles'

const SNOOZE_KEY = 'founder_popup_snooze_until'
const SNOOZE_DAYS = 7
const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000

const exam = PLANS.find(p => p.id === 'exam')!

export default function FounderUpgradeModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null)

  const [parentLink, setParentLink] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Decide whether to show: respect the snooze, and only advertise while founder
  // seats remain. A hard fetch failure just skips the prompt (don't advertise a
  // price we couldn't confirm).
  useEffect(() => {
    try {
      const until = localStorage.getItem(SNOOZE_KEY)
      if (until && new Date(until) > new Date()) return
    } catch { /* localStorage unavailable — fall through and show */ }

    let cancelled = false
    fetch('/api/founder-seats')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const left = typeof d.seatsLeft === 'number' ? d.seatsLeft : null
        if (left !== null && left <= 0) return // founder offer closed — nothing to advertise
        setSeatsLeft(left)
        setOpen(true)
        trackEvent('founder_popup_shown', { seats_left: left })
      })
      .catch(() => { /* endpoint unreachable — skip the prompt */ })
    return () => { cancelled = true }
  }, [])

  // Lock body scroll + wire Escape while the modal is open.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function dismiss() {
    try { localStorage.setItem(SNOOZE_KEY, new Date(Date.now() + SNOOZE_MS).toISOString()) } catch { /* ignore */ }
    trackEvent('founder_popup_dismissed')
    setOpen(false)
  }

  async function getParentLink() {
    setLinkLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/parent-pay/link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const data = await res.json()
      if (data.url) {
        setParentLink(data.url)
        trackEvent('parent_pay_link_created', { source: 'founder_popup' })
      } else {
        setError(data.error ?? 'Could not create a link. Please try again.')
      }
    } catch {
      setError('Could not create a link. Please try again.')
    } finally {
      setLinkLoading(false)
    }
  }

  async function copyLink() {
    if (!parentLink) return
    try {
      await navigator.clipboard.writeText(parentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — select and copy the link manually.')
    }
  }

  function shareLink() {
    if (!parentLink) return
    const text = `Please could you help pay for my Mathsense GCSE Maths pass? You can pay securely here: ${parentLink}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'Mathsense 2027 pass', text, url: parentLink }).catch(() => {})
    } else {
      copyLink()
    }
  }

  function emailLink() {
    if (!parentLink) return
    const subject = encodeURIComponent('Please help pay for my Mathsense 2027 pass')
    const body = encodeURIComponent(
      `Hi,\n\nPlease could you help pay for my Mathsense GCSE Maths pass? You can pay securely here:\n\n${parentLink}\n\nThank you!`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  function goToUpgrade() {
    trackEvent('founder_popup_upgrade_clicked')
    router.push('/student/upgrade')
  }

  if (!open) return null

  const pricing = planPricing(exam, seatsLeft)
  const seatNote = seatsLeftLabel(seatsLeft)

  return (
    <div
      role="presentation"
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="founder-popup-title"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: colors.card,
          borderRadius: radius.lg,
          border: `1px solid ${colors.border}`,
          padding: '28px 24px',
          width: '100%', maxWidth: '440px',
          maxHeight: '90vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: 'absolute', top: '12px', right: '12px',
            width: 30, height: 30, borderRadius: radius.full,
            border: 'none', background: colors.cardAlt, color: colors.textSecondary,
            fontSize: '16px', lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ✕
        </button>

        <div>
          <h2 id="founder-popup-title" style={{ fontSize: font['2xl'], fontWeight: 700, margin: '0 8px 0 0', color: colors.textPrimary }}>
            Get set for your 2027 exams
          </h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '6px 0 0', lineHeight: 1.55 }}>
            Your progress is safe either way — we keep saving everything. The pass
            unlocks the full picture and keeps it right through your summer 2027 exams.
          </p>
        </div>

        {/* Founder price */}
        <div style={{
          padding: '14px 16px', borderRadius: radius.md,
          background: colors.background, border: `1px solid ${colors.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, color: colors.primary }}>{pricing.price}</span>
            {pricing.strikePrice && (
              <span style={{ fontSize: font.lg, color: colors.textHint, textDecoration: 'line-through' }}>{pricing.strikePrice}</span>
            )}
            <span style={{ fontSize: font.sm, color: colors.textSecondary }}>one-off · {exam.period}</span>
          </div>
          {seatNote && (
            <p style={{ fontSize: font.sm, fontWeight: 600, color: colors.primary, margin: '6px 0 0' }}>{seatNote}</p>
          )}
        </div>

        {/* Ask a parent to pay — the account holder is usually a minor. */}
        <div style={{ padding: '16px', borderRadius: radius.md, border: `1px dashed ${colors.border}`, background: colors.background }}>
          <p style={{ fontSize: font.base, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
            Most people get a parent to pay
          </p>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 12px' }}>
            Send them a secure link — they don&apos;t need a Mathsense login.
          </p>

          {!parentLink ? (
            <button onClick={getParentLink} disabled={linkLoading} style={{ ...primaryButton, opacity: linkLoading ? 0.6 : 1 }}>
              {linkLoading ? 'Creating link…' : 'Get a link to send to a parent'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                fontSize: '13px', color: colors.textSecondary, background: colors.card,
                border: `1px solid ${colors.border}`, borderRadius: radius.sm,
                padding: '10px 12px', wordBreak: 'break-all',
              }}>{parentLink}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={copyLink} style={{ ...secondaryButton, flex: 1, minWidth: 90 }}>{copied ? '✓ Copied' : 'Copy'}</button>
                <button onClick={emailLink} style={{ ...secondaryButton, flex: 1, minWidth: 90 }}>Email</button>
                <button onClick={shareLink} style={{ ...secondaryButton, flex: 1, minWidth: 90 }}>Share</button>
              </div>
              <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
                The link works for 30 days and stops once your account is paid for.
              </p>
            </div>
          )}
        </div>

        {error && <p style={{ fontSize: font.sm, color: colors.dangerText, margin: 0 }}>{error}</p>}

        <button onClick={goToUpgrade} style={{ ...secondaryButton, width: 'auto' }}>
          See everything included →
        </button>

        <button
          onClick={dismiss}
          style={{
            background: 'none', border: 'none', color: colors.textHint,
            fontSize: font.sm, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
