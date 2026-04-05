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

  useEffect(() => {
    getSession().then(session => {
      if (!session) router.push('/auth')
      else loadAssessments()
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
        <button onClick={handleSignOut} style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}>
          Sign out
        </button>
      </div>

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
      </div>

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