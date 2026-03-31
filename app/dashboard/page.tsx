'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, signOut } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

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

  useEffect(() => {
    getSession().then(session => {
      if (!session) {
        router.push('/auth')
      } else {
        loadAssessments()
      }
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
  setCreating(false)

  const code = generateCode()
  const session = await getSession()
  if (!session) return

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      title: newTitle.trim(),
      code,
      teacher_id: session.user.id,
      course_id: 'gcse_foundation',
    })
    .select()
    .single()

  console.log('error:', error)
  console.log('data:', data)

  if (!error && data) {
    setAssessments(prev => [data, ...prev])
    setNewTitle('')
  }

  setCreating(false)
}

  async function handleSignOut() {
    await signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <main style={styles.container}>
        <p style={{ color: '#666' }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Mathsense</h1>
        <button onClick={handleSignOut} style={styles.signOutButton}>Sign out</button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>New assessment</h2>
        <div style={styles.row}>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="e.g. Year 10 Set 2 — March"
            style={styles.input}
            onKeyDown={e => e.key === 'Enter' && createAssessment()}
          />
          <button
            onClick={createAssessment}
            disabled={creating || !newTitle.trim()}
            style={{
              ...styles.primaryButton,
              opacity: creating || !newTitle.trim() ? 0.6 : 1,
            }}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Your assessments</h2>
        {assessments.length === 0 ? (
          <p style={styles.empty}>No assessments yet — create one above.</p>
        ) : (
          <div style={styles.list}>
            {assessments.map(a => (
              <div
				  key={a.id}
				  style={{ ...styles.assessmentRow, cursor: 'pointer' }}
				  onClick={() => router.push(`/dashboard/${a.id}`)}
				>
				  <div>
					<p style={styles.assessmentTitle}>{a.title}</p>
					<p style={styles.assessmentDate}>
					  {new Date(a.created_at).toLocaleDateString('en-GB')}
					</p>
				  </div>
				  <div style={styles.codeBox}>
					<span style={styles.codeLabel}>Code</span>
					<span style={styles.code}>{a.code}</span>
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
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const styles: Record<string, React.CSSProperties> = {
  container: {
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
  title: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
    color: '#111',
  },
  signOutButton: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#111',
  },
  row: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  primaryButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  empty: {
    fontSize: '14px',
    color: '#888',
    margin: 0,
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
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    background: '#fafafa',
  },
  assessmentTitle: {
    fontSize: '15px',
    fontWeight: '500',
    margin: 0,
    color: '#111',
  },
  assessmentDate: {
    fontSize: '12px',
    color: '#888',
    margin: '2px 0 0',
  },
  codeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  codeLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  code: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: '0.1em',
  },
}