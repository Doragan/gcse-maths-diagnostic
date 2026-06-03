'use client'

import { useState } from 'react'
import { getSessionId } from '../lib/analytics'
import { colors, font, radius } from '../lib/styles'

const CATEGORIES = [
  { id: 'idea',    label: 'Idea' },
  { id: 'problem', label: 'Something broke' },
  { id: 'praise',  label: 'Praise' },
  { id: 'other',   label: 'Other' },
] as const

type Props = {
  /** Where the feedback came from, e.g. 'student_dashboard' — shown in the email. */
  context: string
  /** Logged-in user's id, if any. */
  userId?: string | null
  /** Pre-fill the reply-email field when we already know it (e.g. teachers). */
  defaultEmail?: string | null
}

/**
 * General product-feedback link, reused on the dashboards and question page.
 * Mirrors ReportIssueButton: an unobtrusive underline link that expands into a
 * small panel (category + message + optional reply email) and POSTs to
 * /api/feedback. Best-effort — the user sees the thank-you regardless.
 */
export default function FeedbackWidget({ context, userId, defaultEmail }: Props) {
  const [open, setOpen]           = useState(false)
  const [category, setCategory]   = useState('')
  const [message, setMessage]     = useState('')
  const [email, setEmail]         = useState(defaultEmail ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!message.trim() || submitting) return
    setSubmitting(true)
    try {
      await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:   message.trim(),
          category:  category || null,
          context,
          email:     email.trim() || null,
          userId:    userId ?? null,
          sessionId: getSessionId(),
        }),
      })
    } catch {
      // fail silently — the user sees the thank-you message regardless
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  function reset() {
    setOpen(false)
    setCategory('')
    setMessage('')
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <p style={{ fontSize: font.sm, color: colors.textHint, textAlign: 'center', margin: 0 }}>
        ✓ Thanks for the feedback — it really helps.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: font.sm,
          color: colors.textHint,
          padding: '2px 0',
          textDecoration: 'underline',
          display: 'block',
          margin: '0 auto',
          fontFamily: 'inherit',
        }}
      >
        💬 Send feedback
      </button>
    )
  }

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: radius.lg,
      background: colors.card,
      border: `1px solid ${colors.borderStrong}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: font.base, fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          Send feedback
        </p>
        <button
          onClick={reset}
          aria-label="Close"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '20px', color: colors.textHint, padding: '0 2px', lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Category chips (optional) */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
        {CATEGORIES.map(c => {
          const selected = category === c.id
          return (
            <button
              key={c.id}
              onClick={() => setCategory(selected ? '' : c.id)}
              style={{
                padding: '6px 14px',
                borderRadius: radius.full,
                border: `1.5px solid ${selected ? colors.primary : colors.border}`,
                background: selected ? '#eff6ff' : colors.card,
                color: selected ? colors.primary : colors.textSecondary,
                fontSize: font.sm,
                fontWeight: selected ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Message */}
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="What's on your mind? Ideas, bugs, anything…"
        rows={3}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: radius.md,
          border: `1px solid ${colors.borderStrong}`,
          fontSize: font.base,
          resize: 'vertical' as const,
          fontFamily: 'inherit',
          color: colors.textPrimary,
          background: colors.background,
          boxSizing: 'border-box' as const,
          outline: 'none',
        }}
      />

      {/* Optional reply email */}
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email (optional, if you'd like a reply)"
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: radius.md,
          border: `1px solid ${colors.borderStrong}`,
          fontSize: font.base,
          fontFamily: 'inherit',
          color: colors.textPrimary,
          background: colors.background,
          boxSizing: 'border-box' as const,
          outline: 'none',
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || submitting}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: radius.md,
            background: !message.trim() || submitting ? colors.border : colors.primary,
            color: !message.trim() || submitting ? colors.textHint : 'white',
            border: 'none',
            cursor: !message.trim() || submitting ? 'not-allowed' : 'pointer',
            fontSize: font.base,
            fontWeight: '600',
            fontFamily: 'inherit',
          }}
        >
          {submitting ? 'Sending…' : 'Send feedback'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '10px 16px',
            borderRadius: radius.md,
            border: `1px solid ${colors.borderStrong}`,
            background: 'none',
            color: colors.textSecondary,
            cursor: 'pointer',
            fontSize: font.base,
            fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
