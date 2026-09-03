'use client'

/**
 * The teacher upgrade page — retired.
 *
 * It sold a £10 pass whose only benefit was lifting the one-diagnostic free
 * limit. That limit is gone, so the page had nothing left to offer and its copy
 * ("Upgrade to run unlimited diagnostics") described something now free.
 *
 * Redirected rather than deleted: the route was linked from the dashboard and
 * may sit in a bookmark or a stale bundle, and quietly landing on the dashboard
 * is kinder than a 404 for a page whose feature simply became free.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { colors, font } from '../../../lib/styles'

export default function RetiredUpgradePage() {
  const router = useRouter()

  useEffect(() => { router.replace('/dashboard') }, [router])

  return (
    <main style={{ maxWidth: '480px', margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: font.lg, color: colors.textPrimary, margin: '0 0 8px', fontWeight: '600' }}>
        Class diagnostics are free.
      </p>
      <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
        There&rsquo;s nothing to upgrade — taking you back to your dashboard.
      </p>
    </main>
  )
}
