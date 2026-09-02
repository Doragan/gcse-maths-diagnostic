'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkIsAdmin } from '../../lib/admin'
import {
  colors, font, card,
  primaryButton, sectionTitle,
} from '../../lib/styles'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkIsAdmin().then(isAdmin => {
      if (!isAdmin) router.push('/dashboard')
      else setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
        Admin
      </h1>

      <div style={card}>
        <h2 style={sectionTitle}>Question bank</h2>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          Create and manage questions for the diagnostic tool.
        </p>
        <button
          onClick={() => router.push('/admin/questions')}
          style={{ ...primaryButton, marginTop: '8px' }}
        >
          Manage questions
        </button>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>Usage</h2>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          Signups, weekly activity, the day-2 return rate and the email funnel.
        </p>
        <button
          onClick={() => router.push('/admin/usage')}
          style={{ ...primaryButton, marginTop: '8px' }}
        >
          View usage
        </button>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
}