'use client'

/**
 * /admin/usage — what the product is actually doing.
 *
 * Exists because every one of these numbers was previously obtainable only by
 * writing a throwaway script, and each time one was run during the 2026-09-01
 * analysis it changed a decision. With an ad campaign restarting they need to
 * be readable in ten seconds, not reconstructed.
 *
 * This file does auth and fetching only; the report renders in
 * components/admin/UsageReportView, which takes the data as a prop so the
 * markup can be exercised without an admin session.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkIsAdmin } from '../../../lib/admin'
import { supabase } from '../../../lib/supabase'
import UsageReportView from '../../../components/admin/UsageReportView'
import { type UsageReport } from '../../../lib/adminUsage'
import { colors } from '../../../lib/styles'

export default function AdminUsagePage() {
  const router = useRouter()
  const [report, setReport] = useState<UsageReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      // Checked here for the redirect, and again server-side in the route —
      // this one is a convenience, not the gate.
      if (!await checkIsAdmin()) { router.push('/dashboard'); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/dashboard'); return }

      const res = await fetch('/api/admin/usage', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setError(`Could not load usage (${res.status})`); return }
      setReport(await res.json())
    })()
  }, [])

  if (error)   return <main style={styles.page}><p style={{ color: colors.dangerText }}>{error}</p></main>
  if (!report) return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>

  return <main style={styles.page}><UsageReportView report={report} /></main>
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '860px', margin: '0 auto', padding: '32px 20px 64px',
    display: 'flex', flexDirection: 'column', gap: '20px',
  },
}
