'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSession, requireTeacher } from '../../../../lib/auth'
import { supabase } from '../../../../lib/supabase'
import { getClassMembers, type ClassMember } from '../../../../lib/classes'
import ClassAnalytics from '../../../../components/ClassAnalytics'
import ClassCoverage from '../../../../components/ClassCoverage'
import {
  colors, font, radius, card,
  secondaryButton, sectionTitle,
} from '../../../../lib/styles'

export default function ClassRosterPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const classId = params.id

  const [className, setClassName] = useState('')
  const [code, setCode] = useState('')
  const [members, setMembers] = useState<ClassMember[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  // Bumped when coverage edits are committed → remounts ClassAnalytics to refetch.
  const [coverageVersion, setCoverageVersion] = useState(0)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      // The class row is readable via RLS only if the teacher owns it.
      const { data: cls } = await supabase
        .from('classes')
        .select('name, code')
        .eq('id', classId)
        .single()
      if (!cls) { setNotFound(true); setLoading(false); return }
      setClassName(cls.name)
      setCode(cls.code)
      try {
        setMembers(await getClassMembers(classId))
      } catch {
        // Roster fetch failed (e.g. not the owner) — show empty rather than break.
      }
      setLoading(false)
    })
  }, [classId])

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/student/classes?code=${code}`
    : ''

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  if (notFound) {
    return (
      <main style={styles.page}>
        <div style={styles.header}>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Class not found
          </h1>
          <button
            onClick={() => router.push('/dashboard/classes')}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Back
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          {className}
        </h1>
        <button
          onClick={() => router.push('/dashboard/classes')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          All classes
        </button>
      </div>

      {/* Join code — the thing teachers share with the class */}
      <div style={card}>
        <h2 style={sectionTitle}>Join code</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
          <span style={{ fontSize: '40px', fontWeight: '700', color: colors.primary, letterSpacing: '0.15em' }}>
            {code}
          </span>
        </div>
        <p style={{ fontSize: font.sm, color: colors.textHint, margin: '10px 0 0', lineHeight: '1.6' }}>
          Students sign in at <strong>{typeof window !== 'undefined' ? window.location.host : 'mathsense.net'}/student</strong>,
          open <strong>My classes</strong>, and enter this code. Or share this link:
        </p>
        <div style={styles.linkRow}>
          <span style={styles.link}>{joinUrl}</span>
          <button
            onClick={() => navigator.clipboard?.writeText(joinUrl)}
            style={{ ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: font.sm }}
          >
            Copy
          </button>
        </div>
      </div>

      {/* Roster */}
      <div style={card}>
        <h2 style={sectionTitle}>
          Students {members.length > 0 && <span style={{ color: colors.textHint, fontWeight: '400' }}>({members.length})</span>}
        </h2>
        {members.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '8px 0 0', lineHeight: '1.6' }}>
            No students have joined yet. Share the code above to get started.
          </p>
        ) : (
          <div style={styles.list}>
            {members.map(m => (
              <div key={m.student_id} style={styles.memberRow}>
                <span style={{ fontSize: font.md, color: colors.textPrimary }}>
                  {m.display_name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {m.year_group && (
                    <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
                      {m.year_group}
                    </span>
                  )}
                  <span style={{ fontSize: font.sm, color: colors.textHint }}>
                    Joined {new Date(m.joined_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record a paper you have marked — the third source of skill evidence,
          alongside self-serve practice and assignments. */}
      <div style={{ ...styles.card, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={sectionTitle}>Marked a paper?</h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '6px 0 0', lineHeight: 1.6 }}>
            Enter the marks and they become part of each student&apos;s skill map — full marks
            counts as secure, and a dropped mark never pulls a skill down.
          </p>
        </div>
        <Link
          href={`/dashboard/classes/${classId}/papers`}
          style={{
            background: colors.primary, color: '#fff', padding: '11px 20px',
            borderRadius: radius.md, fontSize: font.base, fontWeight: '700',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          Record marks →
        </Link>
      </div>

      {/* Teacher-marked coverage — scopes the mastery % to what's been taught */}
      <ClassCoverage classId={classId} onChange={() => setCoverageVersion(v => v + 1)} />

      {/* Aggregated skill mastery across the class (practice + assignments) */}
      <ClassAnalytics key={coverageVersion} classId={classId} />
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '780px',
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
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  link: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    background: colors.cardAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: '8px 10px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  memberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
  },
}
