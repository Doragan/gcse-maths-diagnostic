import Link from 'next/link'
import { trackEvent } from '../../lib/analytics'
import {
  colors, font, radius,
  pageContainer, primaryButton, secondaryButton,
} from '../../lib/styles'

type Props = {
  startDiagnostic: () => void
}

export default function StartScreen({ startDiagnostic }: Props) {
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

        <button
          onClick={() => {
            trackEvent('diagnostic_started')
            startDiagnostic()
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
    borderRadius: '12px',
    padding: '32px 28px',
    width: '100%',
    maxWidth: '480px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
}