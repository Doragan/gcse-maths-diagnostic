'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, signOut } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, sectionTitle,
} from '../../lib/styles'

type Assessment = {
  id: string
  title: string
  code: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCourseId, setNewCourseId] = useState('gcse_foundation')

  const [userEmail, setUserEmail] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [freeAssessmentsUsed, setFreeAssessmentsUsed] = useState(0)

useEffect(() => {
  getSession().then(async session => {
    if (!session) { router.push('/auth'); return }
    setUserEmail(session.user.email ?? '')

    // Check payment status
    const { data: teacher } = await supabase
      .from('teachers')
      .select('paid_until, free_assessments_used')
      .eq('id', session.user.id)
      .single()

    if (teacher) {
      const paid = teacher.paid_until && new Date(teacher.paid_until) > new Date()
      setIsPaid(!!paid)
      setFreeAssessmentsUsed(teacher.free_assessments_used ?? 0)
    }

    loadAssessments()
  })
}, [])

  async function loadAssessments() {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setAssessments(data)
    setLoading(false)
  }

  async function createAssessment() {
  if (!newTitle.trim()) return

  // Check if they need to pay
  if (!isPaid && freeAssessmentsUsed >= 1) {
    router.push('/dashboard/upgrade')
    return
  }

  setCreating(true)
  const code = generateCode()
  const session = await getSession()
  if (!session) return

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      title: newTitle.trim(),
      code,
      teacher_id: session.user.id,
      course_id: newCourseId,
    })
    .select()
    .single()

  if (!error && data) {
    setAssessments(prev => [data, ...prev])
    setNewTitle('')
    setNewCourseId('gcse_foundation')

    // Increment free assessments used if not paid
    if (!isPaid) {
      await supabase
        .from('teachers')
        .update({ free_assessments_used: freeAssessmentsUsed + 1 })
        .eq('id', session.user.id)
      setFreeAssessmentsUsed(prev => prev + 1)
    }
  }
  setCreating(false)
}

  async function handleSignOut() {
    await signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={styles.page}>
		<div style={styles.header}>
		  <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
			Mathsense
		  </h1>
		  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
			<button
			  onClick={() => router.push('/account')}
			  style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
			>
			  Account
			</button>
			<button
			  onClick={handleSignOut}
			  style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
			>
			  Sign out
			</button>
		  </div>
		</div>
		
		<p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
		  {userEmail}
		</p>
		
		{!isPaid && (
  <div style={{
    padding: '12px 16px',
    borderRadius: radius.md,
    background: freeAssessmentsUsed >= 1 ? colors.warningLight : colors.background,
    border: `1px solid ${freeAssessmentsUsed >= 1 ? colors.warningBorder : colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  }}>
    <p style={{ fontSize: font.base, color: colors.textPrimary, margin: 0 }}>
      {freeAssessmentsUsed >= 1
        ? 'You have used your free diagnostic. Upgrade to create more.'
        : 'You have 1 free class diagnostic included.'}
    </p>
    {freeAssessmentsUsed >= 1 && (
      <button
        onClick={() => router.push('/dashboard/upgrade')}
        style={{ ...primaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, whiteSpace: 'nowrap' as const }}
      >
        Upgrade — £10
      </button>
    )}
  </div>
)}

{isPaid && new URLSearchParams(window.location.search).get('upgraded') === 'true' && (
  <div style={{
    padding: '12px 16px',
    borderRadius: radius.md,
    background: colors.successLight,
    border: `1px solid ${colors.successBorder}`,
  }}>
    <p style={{ fontSize: font.base, color: colors.successText, margin: 0 }}>
      ✓ Payment successful — you have full access until 31 December 2026.
    </p>
  </div>
)}

      <div style={card}>
		  <h2 style={sectionTitle}>New assessment</h2>
		  <div style={styles.row}>
			<input
			  type="text"
			  value={newTitle}
			  onChange={e => setNewTitle(e.target.value)}
			  placeholder="e.g. Year 10 Set 2 — March"
			  style={{ ...inputStyle, flex: 1 }}
			  onKeyDown={e => e.key === 'Enter' && createAssessment()}
			/>
			<button
			  onClick={createAssessment}
			  disabled={creating || !newTitle.trim()}
			  style={{
				...primaryButton,
				width: 'auto',
				padding: '10px 18px',
				opacity: creating || !newTitle.trim() ? 0.6 : 1,
				whiteSpace: 'nowrap' as const,
			  }}
			>
			  {creating ? 'Creating...' : 'Create'}
			</button>
		  </div>
		  <div style={styles.toggle}>
			<button
			  onClick={() => setNewCourseId('gcse_foundation')}
			  style={{
				...styles.toggleButton,
				background: newCourseId === 'gcse_foundation' ? colors.primary : 'transparent',
				color: newCourseId === 'gcse_foundation' ? '#ffffff' : colors.textSecondary,
			  }}
			>
			  Foundation
			</button>
			<button
			  onClick={() => setNewCourseId('gcse_higher')}
			  style={{
				...styles.toggleButton,
				background: newCourseId === 'gcse_higher' ? colors.primary : 'transparent',
				color: newCourseId === 'gcse_higher' ? '#ffffff' : colors.textSecondary,
			  }}
			>
			  Higher
			</button>
		  </div>
		  
		</div>
		<div style={card}>
        <h2 style={sectionTitle}>Your assessments</h2>
        {assessments.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: 0 }}>
            No assessments yet — create one above.
          </p>
        ) : (
          <div style={styles.list}>
            {assessments.map(a => (
              <div
                key={a.id}
                style={styles.assessmentRow}
                onClick={() => router.push(`/dashboard/${a.id}`)}
              >
                <div>
                  <p style={{ fontSize: font.md, fontWeight: '500', margin: 0, color: colors.textPrimary }}>
                    {a.title}
                  </p>
                  <p style={{ fontSize: font.sm, color: colors.textHint, margin: '2px 0 0' }}>
                    {new Date(a.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div style={styles.codeBox}>
                  <span style={{ fontSize: '11px', color: colors.textHint, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                    Code
                  </span>
                  <span style={{ fontSize: '22px', fontWeight: '700', color: colors.primary, letterSpacing: '0.1em' }}>
                    {a.code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    display: 'flex',
    gap: '10px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  assessmentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
    cursor: 'pointer',
  },
	  codeBox: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		gap: '2px',
	  },
	  toggle: {
	  display: 'flex',
	  borderRadius: radius.md,
	  overflow: 'hidden',
	  border: `1px solid ${colors.borderStrong}`,
	},
	toggleButton: {
	  flex: 1,
	  padding: '8px',
	  border: 'none',
	  fontSize: font.base,
	  fontWeight: '600',
	  cursor: 'pointer',
	  background: 'transparent',
	},
}