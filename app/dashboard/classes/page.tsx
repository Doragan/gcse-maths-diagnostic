'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, signOut, requireTeacher } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import {
  createClass, getTeacherClasses, type TeacherClass,
} from '../../../lib/classes'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, sectionTitle,
} from '../../../lib/styles'

export default function TeacherClassesPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      await load()
    })
  }, [])

  async function load() {
    try {
      const list = await getTeacherClasses()
      setClasses(list)
      // Active-member counts for the whole set in one round trip (RLS scopes
      // these rows to the teacher's own classes).
      if (list.length > 0) {
        const { data } = await supabase
          .from('class_memberships')
          .select('class_id')
          .eq('status', 'active')
          .in('class_id', list.map(c => c.id))
        const tally: Record<string, number> = {}
        for (const row of data ?? []) {
          const cid = (row as { class_id: string }).class_id
          tally[cid] = (tally[cid] ?? 0) + 1
        }
        setCounts(tally)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const created = await createClass(newName.trim())
      setClasses(prev => [created, ...prev])
      setNewName('')
    } catch (e: any) {
      setCreateError(e?.message ?? 'Could not create class')
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
          Classes
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Dashboard
          </button>
          <button
            onClick={handleSignOut}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Sign out
          </button>
        </div>
      </div>

      <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
        A class is a persistent group your students join with a code. Students keep their
        own account — joining shares their relevant data with you, and they can leave at any time.
      </p>

      {/* Create */}
      <div style={card}>
        <h2 style={sectionTitle}>New class</h2>
        <div style={styles.row}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Year 10 Set 2"
            style={{ ...inputStyle, flex: 1 }}
            maxLength={80}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            style={{
              ...primaryButton,
              width: 'auto',
              padding: '10px 18px',
              opacity: creating || !newName.trim() ? 0.6 : 1,
              whiteSpace: 'nowrap' as const,
            }}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
        {createError && (
          <p style={{ fontSize: font.sm, color: colors.dangerText, margin: '8px 0 0' }}>
            {createError}
          </p>
        )}
      </div>

      {/* List */}
      <div style={card}>
        <h2 style={sectionTitle}>Your classes</h2>
        {classes.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '8px 0 0' }}>
            No classes yet — create one above.
          </p>
        ) : (
          <div style={styles.list}>
            {classes.map(c => {
              const count = counts[c.id] ?? 0
              return (
                <div
                  key={c.id}
                  style={styles.classRow}
                  onClick={() => router.push(`/dashboard/classes/${c.id}`)}
                >
                  <div>
                    <p style={{ fontSize: font.md, fontWeight: '500', margin: 0, color: colors.textPrimary }}>
                      {c.name}
                    </p>
                    <span style={{ fontSize: font.sm, color: colors.textHint }}>
                      {count} student{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={styles.codeBox}>
                    <span style={{ fontSize: '11px', color: colors.textHint, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                      Code
                    </span>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: colors.primary, letterSpacing: '0.1em' }}>
                      {c.code}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
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
  },
  row: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px',
  },
  classRow: {
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
}
