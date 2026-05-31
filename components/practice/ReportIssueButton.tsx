'use client'

import { useState } from 'react'
import { getSessionId } from '../../lib/analytics'
import { colors, font, radius } from '../../lib/styles'

const ISSUE_TYPES = [
  { id: 'wrong_answer',    label: 'Wrong answer' },
  { id: 'unclear_wording', label: 'Confusing wording' },
  { id: 'broken_display',  label: 'Broken display' },
  { id: 'other',           label: 'Other' },
] as const

type Props = {
  questionId: string
  renderedValues: Record<string, number>
  studentId: string | null
}

export default function ReportIssueButton({ questionId, renderedValues, studentId }: Props) {
  const [open, setOpen]             = useState(false)
  const [issueType, setIssueType]   = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted]   = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!issueType || submitting) return
    setSubmitting(true)
    try {
      await fetch('/api/report-question', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          issueType,
          description: description.trim() || null,
          renderedValues,
          studentId,
          sessionId: getSessionId(),
        }),
      })
    } catch {
      // fail silently — the user sees the thank-you message regardless
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <p style={{ fontSize: font.sm, color: colors.textHint, textAlign: 'center', margin: 0 }}>
        ✓ Thanks — we'll take a look at this question.
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
        }}
      >
        🚩 Report an issue with this question
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
          Report an issue
        </p>
        <button
          onClick={() => { setOpen(false); setIssueType(''); setDescription('') }}
          aria-label="Close"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '20px', color: colors.textHint, padding: '0 2px', lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Issue type chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
        {ISSUE_TYPES.map(t => {
          const selected = issueType === t.id
          return (
            <button
              key={t.id}
              onClick={() => setIssueType(t.id)}
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
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Optional detail */}
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="More detail (optional)..."
        rows={2}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: radius.md,
          border: `1px solid ${colors.borderStrong}`,
          fontSize: font.base,
          resize: 'none' as const,
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
          disabled={!issueType || submitting}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: radius.md,
            background: !issueType || submitting ? colors.border : colors.primary,
            color: !issueType || submitting ? colors.textHint : 'white',
            border: 'none',
            cursor: !issueType || submitting ? 'not-allowed' : 'pointer',
            fontSize: font.base,
            fontWeight: '600',
          }}
        >
          {submitting ? 'Sending…' : 'Send report'}
        </button>
        <button
          onClick={() => { setOpen(false); setIssueType(''); setDescription('') }}
          style={{
            padding: '10px 16px',
            borderRadius: radius.md,
            border: `1px solid ${colors.borderStrong}`,
            background: 'none',
            color: colors.textSecondary,
            cursor: 'pointer',
            fontSize: font.base,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
