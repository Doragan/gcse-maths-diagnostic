'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSession, requireTeacher } from '../../../../lib/auth'
import { supabase } from '../../../../lib/supabase'
import {
  getClassMembers, getClassInvitations,
  type ClassMember, type TeacherInvitation,
} from '../../../../lib/classes'
import ClassAnalytics from '../../../../components/ClassAnalytics'
import ClassCoverage from '../../../../components/ClassCoverage'
import {
  colors, font, radius, card,
  secondaryButton, sectionTitle,
} from '../../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// A class, as a teacher looks at it WEEK TO WEEK.
//
// Reorganised on 2026-10-13. This page had grown to six stacked cards and the
// one a tutor actually comes for — class mastery — was last, below three pieces
// of start-of-term setup. The join code, the invitation list and the roster all
// moved to ./people, split by FREQUENCY OF USE rather than by subject: those are
// done once in September, this is read every week for a year.
//
// WHAT STAYS, and why each one earns its place:
//
//   * The people SUMMARY. One line, not a card. It is here because knowing who
//     has NOT joined is the only thing an invitation does that a join code
//     cannot, and that was the entire justification for building invitations
//     (see 20260915_class_invitations.sql). Moving the machinery to a sub-page
//     is fine; losing the signal is not. Do not delete this as clutter.
//
//   * Class mastery FIRST. The reason the page is open.
//
//   * Topics covered, immediately under mastery rather than on ./people, even
//     though it looks like setup. It SCOPES the mastery percentage: put it
//     behind a sub-page and a stale setting silently makes the headline number
//     wrong, with nothing on screen to suggest why. Directly beneath the number
//     it reads as the caveat to it, which is what it is.
//
//   * Record a marked paper, the third source of skill evidence.
// ─────────────────────────────────────────────────────────────────────────────

export default function ClassOverviewPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const classId = params.id

  const [className, setClassName] = useState('')
  const [members, setMembers] = useState<ClassMember[]>([])
  const [invitations, setInvitations] = useState<TeacherInvitation[]>([])
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
        .select('name')
        .eq('id', classId)
        .single()
      if (!cls) { setNotFound(true); setLoading(false); return }
      setClassName(cls.name)
      try {
        setMembers(await getClassMembers(classId))
      } catch {
        // Roster fetch failed (e.g. not the owner) — show empty rather than break.
      }
      // Only for the summary line. Returns an empty result on any failure,
      // including the table not existing yet, so the page works whether or not
      // the invitations migration has been applied.
      setInvitations((await getClassInvitations(classId)).invitations)
      setLoading(false)
    })
  }, [classId])

  // Who the tutor still has to chase. `not_sent` is counted SEPARATELY and
  // never folded into this: an invitation that was never emailed is the
  // system's problem, and reporting it as a slow pupil would send the tutor to
  // nag someone who was never written to.
  const notJoined = invitations.filter(i => i.state === 'waiting' || i.state === 'expired').length
  const notSent = invitations.filter(i => i.state === 'not_sent').length

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
          <h1 style={styles.h1}>Class not found</h1>
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
        <h1 style={styles.h1}>{className}</h1>
        <button
          onClick={() => router.push('/dashboard/classes')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          All classes
        </button>
      </div>

      {/* People — a SUMMARY and a way in, not the machinery. See the header
          note: the straggler count is the one thing a join code cannot give a
          teacher, so it stays on this page even though the controls do not. */}
      <div style={{ ...card, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={sectionTitle}>People</h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '6px 0 0', lineHeight: 1.6 }}>
            <strong>{members.length}</strong> {members.length === 1 ? 'student has' : 'students have'} joined
            {notJoined > 0 && (
              <>
                {' · '}
                <strong>{notJoined}</strong> {notJoined === 1 ? 'invitation' : 'invitations'} not accepted yet
              </>
            )}
            {invitations.length === 0 && members.length === 0 && (
              <> — share the join code or invite your class by email</>
            )}
          </p>
          {/* Called out separately and in red, because the fix is ours, not the
              pupil's: these addresses were never actually written to. */}
          {notSent > 0 && (
            <p style={{ fontSize: font.sm, color: colors.dangerText, margin: '6px 0 0', lineHeight: 1.6 }}>
              <strong>{notSent}</strong> {notSent === 1 ? 'invitation was' : 'invitations were'} never sent —
              they need sending before anyone can accept.
            </p>
          )}
        </div>
        <Link
          href={`/dashboard/classes/${classId}/people`}
          style={{
            ...secondaryButton, width: 'auto', padding: '11px 20px',
            fontSize: font.base, fontWeight: '700',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          Manage people →
        </Link>
      </div>

      {/* Aggregated skill mastery across the class (practice + assignments).
          FIRST, because it is why the page is open. */}
      <ClassAnalytics key={coverageVersion} classId={classId} />

      {/* Teacher-marked coverage — scopes the mastery % above it to what has
          actually been taught. Deliberately adjacent to the number it changes. */}
      <ClassCoverage classId={classId} onChange={() => setCoverageVersion(v => v + 1)} />

      {/* Record a paper you have marked — the third source of skill evidence,
          alongside self-serve practice and assignments. */}
      <div style={{ ...card, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
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
  h1: {
    fontSize: font['2xl'],
    fontWeight: '600',
    margin: 0,
    color: colors.textPrimary,
  },
}
