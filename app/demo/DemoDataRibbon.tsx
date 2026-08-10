import Link from 'next/link'
import { colors, font, radius } from '../../lib/styles'

/**
 * "This is sample data" banner for the demo dashboards.
 *
 * They are convincing enough — real names, a plausible spread, a term of
 * history — that a teacher can spend a minute wondering whose class they are
 * looking at. Saying so up front costs nothing and buys trust, and the same
 * strip is the tour's way back.
 */
export default function DemoDataRibbon({ note }: { note: string }) {
  return (
    <div style={{
      background: colors.warningLight, borderBottom: `1px solid ${colors.warningBorder}`,
      padding: '9px 24px', display: 'flex', gap: 12, alignItems: 'center',
      justifyContent: 'center', flexWrap: 'wrap', textAlign: 'center',
    }}>
      <span style={{ fontSize: font.base, color: colors.warningText, lineHeight: 1.5 }}>
        <strong>Sample data.</strong> {note}
      </span>
      <Link
        href="/demo"
        style={{
          fontSize: font.sm, fontWeight: '700', color: colors.warningText,
          textDecoration: 'none', border: `1px solid ${colors.warningBorder}`,
          borderRadius: radius.full, padding: '3px 12px', whiteSpace: 'nowrap',
        }}
      >
        ← Back to the tour
      </Link>
    </div>
  )
}
