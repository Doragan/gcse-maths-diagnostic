'use client'

import Link from 'next/link'
import { colors, font, radius } from '../../lib/styles'
import { dashboardPath, useAccountNav } from '../../lib/useAccountNav'

/**
 * The header shared by the /demo tour pages.
 *
 * The existing demo dashboards each grew their own copy of this bar; new tour
 * pages use this one so the four stops read as one journey rather than four
 * unrelated pages, and so "back to the tour" is always one click away.
 *
 * It is NOT SiteNav, and should not become it. The tour is one journey with
 * its own back-link and per-stop subtitle, and stacking the site bar on top
 * would give every stop two headers. What it was missing is only the half
 * SiteNav exists for: a signed-in visitor could not see that they were signed
 * in, or get to their own dashboard, from any of the four stops.
 *
 * So the dashboard link appears ONLY when signed in. Signed out, this bar is
 * exactly what it was — a prospect following a link we sent them is being
 * shown the product, and does not need a login button in the way.
 */
export default function DemoNav({ subtitle, showTourLink = true }: {
  subtitle: string
  /** Off on the hub itself, where "back to the tour" would point at this page. */
  showTourLink?: boolean
}) {
  const account = useAccountNav()

  return (
    <header style={{
      background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: '14px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{
          width: 36, height: 36, borderRadius: radius.md, background: colors.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: font.xl, letterSpacing: -1, textDecoration: 'none', flexShrink: 0,
        }}>M</Link>
        <div>
          <h1 style={{ fontSize: font.xl, fontWeight: '700', margin: 0, color: colors.textPrimary }}>Mathsense</h1>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {showTourLink && (
          <Link href="/demo" style={{ fontSize: font.base, color: colors.primary, textDecoration: 'none', fontWeight: '600' }}>
            ← Back to the tour
          </Link>
        )}
        <Link href="/" style={{ fontSize: font.base, color: colors.textSecondary, textDecoration: 'none', fontWeight: '600' }}>
          Mathsense home
        </Link>
        {account.state === 'signedIn' && (
          <Link
            href={dashboardPath(account.role)}
            style={{
              background: colors.primary, color: '#fff', borderRadius: radius.md,
              padding: '8px 16px', fontSize: font.base, fontWeight: '700', textDecoration: 'none',
            }}
          >
            {account.role === 'unknown' ? 'My account' : 'My dashboard'}
          </Link>
        )}
      </div>
    </header>
  )
}
