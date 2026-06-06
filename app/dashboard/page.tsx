'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, signOut } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import FeedbackWidget from '../../components/FeedbackWidget'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, sectionTitle,
} from '../../lib/styles'

type Assessment = {
  id: string
  title: string
  code: string
  course_id: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newCourseId, setNewCourseId] = useState('gcse_foundation')

  const [userEmail, setUserEmail] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const [freeAssessmentsUsed, setFreeAssessmentsUsed] = useState(0)
  
  const [isAdmin, setIsAdmin] = useState(false)

useEffect(() => {
  getSession().then(async session => {
    if (!session) { router.push('/auth'); return }
    setUserEmail(session.user.email ?? '')

    const { data: teacher } = await supabase
      .from('teachers')
      .select('paid_until, free_assessments_used, is_admin')
      .eq('id', session.user.id)
      .single()

    if (!teacher) {
      // No teachers row — a signed-in student (or non-teacher) landed on the
      // teacher dashboard. It isn't theirs to see; send them to their own
      // dashboard. (Data was never exposed: the assessments list is RLS-scoped
      // to the owning teacher_id, and creation is blocked server-side.)
      router.push('/student/dashboard')
      return
    }

    const paid = teacher.paid_until && new Date(teacher.paid_until) > new Date()
    setIsPaid(!!paid)
    setFreeAssessmentsUsed(teacher.free_assessments_used ?? 0)
    setIsAdmin(teacher.is_admin ?? false)

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
  setCreateError('')
  try {
    const session = await getSession()
    if (!session) { router.push('/auth'); return }

    // Creation, the free-limit check, and the usage counter are all enforced
    // server-side (app/api/assessments/create). The client no longer writes
    // teachers.free_assessments_used directly.
    const res = await fetch('/api/assessments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ title: newTitle.trim(), courseId: newCourseId }),
    })

    if (res.status === 402) {
      // Free limit reached (enforced by the server).
      router.push('/dashboard/upgrade')
      return
    }

    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.assessment) {
      setCreateError(
        json?.error ? `${json.error} (HTTP ${res.status})` : `Couldn't create assessment (HTTP ${res.status})`,
      )
      return
    }

    setAssessments(prev => [json.assessment, ...prev])
    setNewTitle('')
    setNewCourseId('gcse_foundation')
    if (typeof json.freeAssessmentsUsed === 'number') {
      setFreeAssessmentsUsed(json.freeAssessmentsUsed)
    }
  } catch (e: any) {
    setCreateError(`Network error: ${e?.message ?? e}`)
  } finally {
    setCreating(false)
  }
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
		  <div className="dash-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
			<button
			  onClick={() => router.push('/dashboard/classes')}
			  style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
			>
			  Classes
			</button>
			<button
			  onClick={() => router.push('/dashboard/assignments')}
			  style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
			>
			  Assignments
			</button>
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
			{isAdmin && (
  <button
    onClick={() => router.push('/admin')}
    style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
  >
    Admin
  </button>
)}
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
		  {createError && (
			<p style={{ fontSize: font.sm, color: colors.dangerText ?? '#b91c1c', margin: '8px 0 0' }}>
			  {createError}
			</p>
		  )}
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
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
    <span style={{
      fontSize: font.sm,
      color: colors.textHint,
    }}>
      {new Date(a.created_at).toLocaleDateString('en-GB')}
    </span>
    <span style={{
      fontSize: '11px',
      fontWeight: '600',
      padding: '1px 6px',
      borderRadius: '4px',
      background: a.course_id === 'gcse_higher' ? '#ede9fe' : '#e0f2fe',
      color: a.course_id === 'gcse_higher' ? '#5b21b6' : '#0369a1',
    }}>
      {a.course_id === 'gcse_higher' ? 'Higher' : 'Foundation'}
    </span>
  </div>
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

      {/* General feedback */}
      <FeedbackWidget context="teacher_dashboard" defaultEmail={userEmail} />
    </main>
  )
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
    flexWrap: 'wrap' as const,
    gap: '10px',
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