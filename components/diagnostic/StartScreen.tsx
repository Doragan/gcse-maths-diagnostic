import { useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '../../lib/analytics'
import {
  colors, font, radius,
  pageContainer, primaryButton, secondaryButton,
} from '../../lib/styles'


type Props = {
  startDiagnostic: (courseId: string) => void
}

export default function StartScreen({ startDiagnostic }: Props) {
  const [courseId, setCourseId] = useState<'gcse_foundation' | 'gcse_higher'>('gcse_foundation')

  return (
    <main style={pageContainer}>
      <div style={styles.card}>
        <div>
          <h1 style={{ fontSize: font['3xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Mathsense
          </h1>
          <h2 style={{ fontSize: font.xl, fontWeight: '600', margin: '4px 0 0', color: colors.textSecondary }}>
            Know what to learn next.
          </h2>
        </div>

        <p style={{ fontSize: font.md, color: colors.textPrimary, margin: 0, lineHeight: '1.6' }}>
          Identify your strengths and weaknesses across GCSE Maths — and get a clear path to improve.
        </p>

        <p style={{ fontSize: font.base, fontWeight: '600', color: colors.textSecondary, margin: 0 }}>
          ⏱ Takes about 5–10 minutes
        </p>

        <div>
          <p style={{ fontSize: font.base, fontWeight: '500', color: colors.textPrimary, margin: '0 0 8px' }}>
            Which tier are you studying?
          </p>
          <div style={styles.toggle}>
            <button
              onClick={() => setCourseId('gcse_foundation')}
              style={{
                ...styles.toggleButton,
                background: courseId === 'gcse_foundation' ? colors.primary : 'transparent',
                color: courseId === 'gcse_foundation' ? '#ffffff' : colors.textSecondary,
                borderColor: courseId === 'gcse_foundation' ? colors.primary : colors.borderStrong,
              }}
            >
              Foundation
            </button>
            <button
              onClick={() => setCourseId('gcse_higher')}
              style={{
                ...styles.toggleButton,
                background: courseId === 'gcse_higher' ? colors.primary : 'transparent',
                color: courseId === 'gcse_higher' ? '#ffffff' : colors.textSecondary,
                borderColor: courseId === 'gcse_higher' ? colors.primary : colors.borderStrong,
              }}
            >
              Higher
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            trackEvent('diagnostic_started')
            startDiagnostic(courseId)
          }}
          style={primaryButton}
        >
          Start your diagnostic
        </button>

        <Link href="/about" style={{ textDecoration: 'none' }}>
          <button style={secondaryButton}>
            Learn more about Mathsense
          </button>
        </Link>

        <button
          onClick={() => {
            trackEvent('feedback_clicked')
            window.open(
              'https://docs.google.com/forms/d/e/1FAIpQLSfF384C-gVaBWWiv4fItf1XDrP-pbfCteCCL758q5UskBX_NA/viewform?usp=header',
              '_blank'
            )
          }}
          style={secondaryButton}
        >
          Give feedback / get in touch
        </button>
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
    gap: '16px',
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
    padding: '10px',
    border: 'none',
    fontSize: font.md,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
}