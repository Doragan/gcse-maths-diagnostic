'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '../../lib/analytics'
import {
  colors, font, radius,
  pageContainer, primaryButton,
} from '../../lib/styles'

type Props = {
  onStart: (courseId: string) => void
}

export default function DiagnosticStartScreen({ onStart }: Props) {
  const [courseId, setCourseId] = useState<'gcse_foundation' | 'gcse_higher'>('gcse_foundation')

  return (
    <main style={{ ...pageContainer, flexDirection: 'column' as const, gap: '0' }}>
      <div style={styles.card}>

        {/* Header */}
        <div style={{ textAlign: 'center' as const }}>
          <Link href="/" style={{ fontSize: font.xl, fontWeight: '800', color: colors.primary, textDecoration: 'none', letterSpacing: '-0.02em', display: 'block', marginBottom: '24px' }}>
            Mathsense
          </Link>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '800', margin: '0 0 10px', color: colors.textPrimary, letterSpacing: '-0.02em' }}>
            GCSE Maths Diagnostic
          </h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
            Answer 20 questions to see exactly where your strengths and gaps are across GCSE Maths.
          </p>
        </div>

        {/* What to expect */}
        <div style={styles.infoBox}>
          {[
            { icon: '⏱', text: 'Takes 5–10 minutes' },
            { icon: '📊', text: 'Covers all major GCSE topics' },
            { icon: '💡', text: 'No revision needed — just give it a go' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span style={{ fontSize: font.base, color: colors.textSecondary }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Tier selector */}
        <div>
          <p style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary, margin: '0 0 10px' }}>
            Which tier are you studying?
          </p>
          <div style={styles.toggle}>
            {(['gcse_foundation', 'gcse_higher'] as const).map((id) => (
              <button
                key={id}
                onClick={() => setCourseId(id)}
                style={{
                  ...styles.toggleButton,
                  background: courseId === id ? colors.primary : 'transparent',
                  color: courseId === id ? '#ffffff' : colors.textSecondary,
                  fontWeight: courseId === id ? '700' : '500',
                }}
              >
                {id === 'gcse_foundation' ? 'Foundation' : 'Higher'}
              </button>
            ))}
          </div>
        </div>

        {/* Start */}
        <button
          onClick={() => {
            trackEvent('diagnostic_started')
            onStart(courseId)
          }}
          style={{ ...primaryButton, fontWeight: '800', fontSize: font.lg }}
        >
          Start diagnostic →
        </button>

        {/* Auth nudge */}
        <div style={{ textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
            Create a free account to save your results and track progress over time.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/student" style={{ fontSize: font.sm, color: colors.primary, fontWeight: '600', textDecoration: 'underline' }}>
              Sign up free
            </Link>
            <Link href="/student" style={{ fontSize: font.sm, color: colors.textSecondary, textDecoration: 'underline' }}>
              Log in
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: colors.card,
    borderRadius: radius.lg,
    padding: '36px 28px',
    width: '100%',
    maxWidth: '440px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  infoBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    padding: '16px',
    background: colors.cardAlt,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  toggle: {
    display: 'flex',
    borderRadius: radius.md,
    overflow: 'hidden',
    border: `1px solid ${colors.borderStrong}`,
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    padding: '11px',
    border: 'none',
    fontSize: font.md,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
}
