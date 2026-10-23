'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, signOut } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { getTutorStudents } from '../../lib/tutorStudents'
import { type StudentAnalytics } from '../../lib/teacherAnalytics'
import FeedbackWidget from '../../components/FeedbackWidget'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, sectionTitle, DASHBOARD_MAX_WIDTH,
} from '../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// The teacher's landing page (docs/audit/30, Option A).
//
// It used to be the join-code diagnostic: a "New assessment" form and a list of
// them, nothing else. That was right when it was the only teacher feature, and
// it stayed as five more were built around it — so a teacher's first screen was
// a flow with nothing submitted to it since 4 April, offering GCSE Foundation
// and Higher only. It now lives at /dashboard/assessments, moved rather than
// retired (that page's header says why).
//
// What replaces it is deliberately small: the thing a teacher can do today with
// no setup at all, the other three ways to give pupils work, and their own
// students. No new reads — getTutorStudents already returns this, built for the
// tutor view in docs/audit/26 §4.2.
//
// ⚠ NO VERDICTS, per docs/audit/12 decision 2. The students card is sorted by
// who was active longest ago, which is a SORT; it is not titled "who needs
// chasing", there is no red row and no "inactive" chip. An earlier draft of
// this called it "Who needs a look", which is the same rule broken by a
// heading. A teacher reads the numbers and decides.
// ─────────────────────────────────────────────────────────────────────────────

/** How many students the landing page shows before linking out to all of them. */
const PREVIEW_ROWS = 5

export default function DashboardPage() {
  const router = useRouter()

  const [students, setStudents] = useState<StudentAnalytics[]>([])
  const [assessmentCount, setAssessmentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  // Kept only to acknowledge a returning `?upgraded=true` from a pass bought
  // before checkout closed. Nothing on this page is gated on it any more.
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      setUserEmail(session.user.email ?? '')

      const { data: teacher } = await supabase
        .from('teachers')
        .select('paid_until, is_admin')
        .eq('id', session.user.id)
        .single()

      if (!teacher) {
        // No teachers row. It isn't theirs to see.
        //
        // This used to send them straight to /student/dashboard, assuming that
        // "not a teacher" means "student". It doesn't: a user whose provisioning
        // never finished has NEITHER row, and that redirect bounced them on to
        // /student, a login form which is no use to someone already signed in.
        // Check before routing, and let /auth own the third case — it explains
        // the state and offers a sign-out.
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle()

        router.push(student ? '/student/dashboard' : '/auth')
        return
      }

      setIsPaid(!!(teacher.paid_until && new Date(teacher.paid_until) > new Date()))
      setIsAdmin(teacher.is_admin ?? false)

      // Both are best-effort: a landing page that fails to load one card should
      // still show the actions, which are the part that works with no data.
      const [roster, assessments] = await Promise.all([
        getTutorStudents().catch(() => [] as StudentAnalytics[]),
        supabase.from('assessments').select('id', { count: 'exact', head: true }),
      ])
      setStudents(roster)
      setAssessmentCount(assessments.count ?? 0)
      setLoading(false)
    })
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading…</p>
      </main>
    )
  }

  // Longest-quiet first. Someone who has never been active sorts to the top,
  // because "never" is the longest quiet there is.
  const byQuietest = [...students].sort((a, b) => {
    if (!a.lastActive && !b.lastActive) return a.displayName.localeCompare(b.displayName)
    if (!a.lastActive) return -1
    if (!b.lastActive) return 1
    return a.lastActive.localeCompare(b.lastActive)
  })
  const preview = byQuietest.slice(0, PREVIEW_ROWS)

  const activeThisWeek = students.filter(s => s.questionsThisWeek > 0).length
  const questionsThisWeek = students.reduce((sum, s) => sum + s.questionsThisWeek, 0)

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          Mathsense
        </h1>
        <div className="dash-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const }}>
          {/* Students before Classes: for a tutor it is the screen they want,
              and for a group teacher the class list is one click further on
              rather than gone (docs/audit/26 §6). */}
          <button
            onClick={() => router.push('/dashboard/students')}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Students
          </button>
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
          {/* The no-login lesson mode (docs/audit/29). Sits beside the other
              teacher surfaces rather than being buried: it is the one that needs
              no setup at all, so it is the one a new teacher can use today. */}
          <button
            onClick={() => router.push('/dashboard/sessions')}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Session
          </button>
          <button
            onClick={() => router.push('/dashboard/exam')}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Mini-exam
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

      {/* ── Run a lesson ───────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={styles.cardHead}>
          <div>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Run a lesson</h2>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0', lineHeight: '1.6' }}>
              Pupils join with a code and a first name. No accounts, nothing to set up.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/sessions')}
            style={{ ...primaryButton, width: 'auto', padding: '11px 20px', fontSize: font.md, flexShrink: 0 }}
          >
            Start a class session
          </button>
        </div>

        <div style={styles.divider} />

        <div style={styles.actionGrid}>
          <button onClick={() => router.push('/dashboard/assignments/create')} style={styles.action}>
            <span style={styles.actionTitle}>Set work</span>
            <span style={styles.actionNote}>An assignment, for pupils with accounts</span>
          </button>
          <button onClick={() => router.push('/dashboard/exam')} style={styles.action}>
            <span style={styles.actionTitle}>Set a mini-exam</span>
            <span style={styles.actionNote}>Marks and exam readiness</span>
          </button>
          <button onClick={() => router.push('/mark')} style={styles.action}>
            <span style={styles.actionTitle}>Mark a paper</span>
            <span style={styles.actionNote}>Feedback sheets, no sign-in</span>
          </button>
        </div>
      </div>

      {/* ── Your students ──────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={styles.cardHead}>
          <div>
            <h2 style={{ ...sectionTitle, margin: 0 }}>
              Your students{' '}
              {students.length > 0 && (
                <span style={{ color: colors.textSecondary, fontWeight: '400' }}>({students.length})</span>
              )}
            </h2>
            {students.length > 0 && (
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0' }}>
                {activeThisWeek} active this week · {questionsThisWeek} question{questionsThisWeek === 1 ? '' : 's'} answered
              </p>
            )}
          </div>
          {students.length > PREVIEW_ROWS && (
            <button
              onClick={() => router.push('/dashboard/students')}
              style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, flexShrink: 0 }}
            >
              All students
            </button>
          )}
        </div>

        {students.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '12px 0 0', lineHeight: '1.6' }}>
            Nobody has joined a class yet. A class session needs no accounts at all, so it is the
            quickest way to see a group working.
          </p>
        ) : (
          <>
            <div style={{ marginTop: '12px', overflowX: 'auto' as const }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: font.sm }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th scope="col" style={styles.th}>Student</th>
                    <th scope="col" style={styles.th}>This week</th>
                    <th scope="col" style={styles.th}>Last active</th>
                    <th scope="col" style={styles.th}>Mastery</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(s => (
                    <tr
                      key={s.studentId}
                      onClick={() => router.push(`/dashboard/students/${s.studentId}`)}
                      style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}
                    >
                      <td style={{ ...styles.td, fontWeight: '500', color: colors.textPrimary }}>
                        {s.displayName}
                      </td>
                      {/* Zero is a number, not a warning: textSecondary, never danger. */}
                      <td style={{ ...styles.td, color: colors.textSecondary }}>{s.questionsThisWeek}</td>
                      <td style={{ ...styles.td, color: colors.textSecondary, whiteSpace: 'nowrap' as const }}>
                        {s.lastActive ? new Date(s.lastActive).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td style={styles.td}>
                        {s.overallMastery === null ? '—' : `${Math.round(s.overallMastery)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '10px 0 0' }}>
              Least recently active first. Mastery is of the whole course, so it compares across
              every class.
            </p>
          </>
        )}
      </div>

      {/* ── The older flow, out of the way but not hidden ─────────────────── */}
      {assessmentCount > 0 && (
        <div style={{ ...card, display: 'flex', flexWrap: 'wrap' as const, gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: font.base, fontWeight: '500', margin: 0, color: colors.textPrimary }}>
              Class diagnostic
            </p>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0' }}>
              The older join-code flow. GCSE only — {assessmentCount} saved.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/assessments')}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Open
          </button>
        </div>
      )}

      <FeedbackWidget context="teacher_dashboard" defaultEmail={userEmail} />
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: DASHBOARD_MAX_WIDTH,
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
  cardHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  divider: {
    height: '1px',
    background: colors.border,
    margin: '16px 0',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
  },
  action: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    textAlign: 'left' as const,
    padding: '14px',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
    cursor: 'pointer',
  },
  actionTitle: {
    fontSize: font.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionNote: {
    fontSize: '12px',
    color: colors.textSecondary,
    lineHeight: '1.45',
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 10px',
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '10px',
    fontSize: font.sm,
    verticalAlign: 'middle' as const,
  },
}
