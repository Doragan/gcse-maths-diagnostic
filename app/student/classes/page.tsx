'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStudentProfile } from '../../../lib/auth'
import {
  getStudentClasses, lookupClass, joinClass, leaveClass,
  type StudentClass,
} from '../../../lib/classes'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, sectionTitle, errorBox,
} from '../../../lib/styles'

function StudentClassesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [classes, setClasses] = useState<StudentClass[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState((searchParams.get('code') ?? '').toUpperCase().slice(0, 4))
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinedName, setJoinedName] = useState('')

  useEffect(() => {
    (async () => {
      // Must be a signed-in student — joining a class links to the account.
      // (A logged-out visitor following a teacher's share link is sent to sign
      //  in / sign up first; the prefilled code only auto-fills once signed in.)
      const profile = await getStudentProfile()
      if (!profile) {
        router.push('/student')
        return
      }
      await load()
    })()
  }, [])

  async function load() {
    try {
      setClasses(await getStudentClasses())
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase()
    setJoinError('')
    setJoinedName('')
    if (trimmed.length !== 4) { setJoinError('Enter the 4-character class code.'); return }

    setJoining(true)
    try {
      const cls = await lookupClass(trimmed)
      await joinClass(cls.id)
      setJoinedName(cls.name)
      setCode('')
      await load()
    } catch (e: any) {
      setJoinError(e?.message === 'Code not found'
        ? 'Code not found. Check it with your teacher.'
        : (e?.message ?? 'Could not join the class.'))
    } finally {
      setJoining(false)
    }
  }

  async function handleLeave(classId: string, name: string) {
    if (!confirm(`Leave "${name}"? Your teacher will no longer see your data for this class. Your account and progress stay with you.`)) return
    try {
      await leaveClass(classId)
      setClasses(prev => prev.filter(c => c.class_id !== classId))
    } catch {
      alert('Could not leave the class. Please try again.')
    }
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
          My classes
        </h1>
        <button
          onClick={() => router.push('/student/dashboard')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          Dashboard
        </button>
      </div>

      {/* Join */}
      <div style={card}>
        <h2 style={sectionTitle}>Join a class</h2>
        <p style={{ fontSize: font.sm, color: colors.textHint, margin: '4px 0 12px', lineHeight: '1.6' }}>
          Enter the code from your teacher. Joining shares your relevant Mathsense data
          with them. You can leave any time.
        </p>
        <div style={styles.row}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="e.g. MX4T"
            maxLength={4}
            style={{
              ...inputStyle,
              flex: 1,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.25em',
              fontSize: '20px',
              textAlign: 'center' as const,
              fontWeight: '700',
            }}
            autoComplete="off"
            autoCapitalize="characters"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <button
            onClick={handleJoin}
            disabled={joining || code.trim().length !== 4}
            style={{
              ...primaryButton,
              width: 'auto',
              padding: '10px 18px',
              opacity: joining || code.trim().length !== 4 ? 0.6 : 1,
              whiteSpace: 'nowrap' as const,
            }}
          >
            {joining ? 'Joining...' : 'Join'}
          </button>
        </div>
        {joinError && <p style={{ ...errorBox, marginTop: '10px' }}>{joinError}</p>}
        {joinedName && (
          <p style={{
            fontSize: font.base, color: colors.successText, margin: '10px 0 0',
            padding: '10px 12px', background: colors.successLight,
            borderRadius: radius.md, border: `1px solid ${colors.successBorder}`,
          }}>
            ✓ Joined {joinedName}.
          </p>
        )}
      </div>

      {/* My classes */}
      <div style={card}>
        <h2 style={sectionTitle}>You&apos;re in</h2>
        {classes.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '8px 0 0' }}>
            You haven&apos;t joined any classes yet.
          </p>
        ) : (
          <div style={styles.list}>
            {classes.map(c => (
              <div key={c.class_id} style={styles.classRow}>
                <div>
                  <p style={{ fontSize: font.md, fontWeight: '500', margin: 0, color: colors.textPrimary }}>
                    {c.name}
                  </p>
                  <span style={{ fontSize: font.sm, color: colors.textHint }}>
                    Joined {new Date(c.joined_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <button
                  onClick={() => handleLeave(c.class_id, c.name)}
                  style={{
                    ...secondaryButton,
                    width: 'auto',
                    padding: '8px 14px',
                    fontSize: font.base,
                    color: colors.dangerText,
                    borderColor: colors.dangerBorder,
                  }}
                >
                  Leave
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function StudentClassesPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading...</p></main>}>
      <StudentClassesInner />
    </Suspense>
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
  },
}
