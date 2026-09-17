'use client'

/**
 * /admin/schools — what each school was granted, and what it is using.
 *
 * Step 5 of docs/audit/20-school-accounts-design.md. Schools are provisioned by
 * hand in SQL, because access is invoice-paced, so until now the seat count was
 * only ever as reliable as the last query pasted into the SQL editor. Two
 * provisioning attempts failed there already, both on the query rather than the
 * mechanism. This is the read-only replacement for that step.
 *
 * Auth and fetching only; the report renders in components/admin/SchoolsView,
 * which takes the data as a prop so the markup can be exercised without an admin
 * session. Same split as /admin/usage.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkIsAdmin } from '../../../lib/admin'
import { supabase } from '../../../lib/supabase'
import SchoolsView from '../../../components/admin/SchoolsView'
import { type SchoolsReport } from '../../../lib/adminSchools'
import { colors, font } from '../../../lib/styles'

export default function AdminSchoolsPage() {
  const router = useRouter()
  const [report, setReport] = useState<SchoolsReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      // Checked here for the redirect, and again server-side in the route —
      // this one is a convenience, not the gate.
      if (!await checkIsAdmin()) { router.push('/dashboard'); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/dashboard'); return }

      const res = await fetch('/api/admin/schools', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setError(`Could not load schools (${res.status})`); return }
      setReport(await res.json())
    })()
  }, [])

  if (error)   return <main style={styles.page}><p style={{ color: colors.dangerText }}>{error}</p></main>
  if (!report) return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>

  return (
    <main style={styles.page}>
      <div>
        <h1 style={styles.title}>Schools</h1>
        <p style={styles.subtitle}>
          Seats granted and seats used. Read-only — a school is created, renewed or
          withdrawn by hand in SQL.
        </p>
      </div>
      <SchoolsView report={report} />
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '860px', margin: '0 auto', padding: '32px 20px 64px',
    display: 'flex', flexDirection: 'column', gap: '20px',
  },
  title: {
    fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary,
  },
  subtitle: {
    fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0', lineHeight: 1.6,
  },
}
