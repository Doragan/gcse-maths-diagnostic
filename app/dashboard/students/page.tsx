'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, requireTeacher } from '../../../lib/auth'
import { getTutorStudents } from '../../../lib/tutorStudents'
import { type StudentAnalytics } from '../../../lib/teacherAnalytics'
import {
  colors, font, radius, card, secondaryButton, pageContainer, pageTitle, sectionTitle,
} from '../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// "My students" — every student this teacher has, across all their classes.
//
// Design: docs/audit/26-one-to-one-tutor-dashboard.md §4.2.
//
// WHY THIS PAGE EXISTS. A tutor's students sit in one class each, because
// coverage is per class and sharing one would make every mastery denominator
// wrong (§1). The cost is that the class list answers "what classes do I have"
// when the daily question is "who do I need to worry about". This answers that
// one, and it is the only screen in the product that crosses classes.
//
// It does NOT replace the class list. Thirty rows is right for a tutor and
// noise for a teacher with a group, so both views coexist (§6).
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = 'attention' | 'name' | 'active'

/** Quietest first: the list exists to surface who has stopped. */
function daysSince(iso: string | null, now: number): number | null {
  if (!iso) return null
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000)
}

export default function TutorStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<StudentAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState<SortKey>('attention')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      try {
        setStudents(await getTutorStudents())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load your students.')
      } finally {
        setLoading(false)
      }
    })
    // `router` is stable in the App Router, so listing it does not re-run the
    // fetch. Listed anyway, rather than following the sibling pages' empty
    // array, because that pattern is what every exhaustive-deps warning in this
    // repo is.
  }, [router])

  const now = Date.now()

  const sorted = [...students].sort((a, b) => {
    if (sort === 'name') return a.displayName.localeCompare(b.displayName)
    if (sort === 'active') {
      // Never-active last, rather than first: a null is "no data", not "most
      // urgent", and burying real inactivity under them would defeat the point.
      const da = daysSince(a.lastActive, now)
      const db = daysSince(b.lastActive, now)
      if (da === null && db === null) return a.displayName.localeCompare(b.displayName)
      if (da === null) return 1
      if (db === null) return -1
      return db - da
    }
    // attention: lowest mastery first, students with no data last
    if (a.overallMastery === null && b.overallMastery === null) {
      return a.displayName.localeCompare(b.displayName)
    }
    if (a.overallMastery === null) return 1
    if (b.overallMastery === null) return -1
    return a.overallMastery - b.overallMastery
  })

  return (
    <div style={pageContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={pageTitle}>My students</h1>
        <Link href="/dashboard/classes" style={{ ...secondaryButton, width: 'auto', textDecoration: 'none' }}>
          Classes
        </Link>
      </div>

      {loading && <p style={{ color: colors.textHint }}>Loading…</p>}
      {error && <p style={{ color: colors.dangerText }}>{error}</p>}

      {!loading && !error && students.length === 0 && (
        <div style={card}>
          <h2 style={sectionTitle}>No students yet</h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, lineHeight: 1.6, margin: '8px 0 0' }}>
            Students appear here once they join one of your classes. Create a class and
            invite them, or share its join code.
          </p>
          <Link
            href="/dashboard/classes"
            style={{ ...secondaryButton, width: 'auto', textDecoration: 'none', display: 'inline-block', marginTop: 12 }}
          >
            Go to classes
          </Link>
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0 12px' }}>
            {([
              ['attention', 'Needs attention'],
              ['active', 'Quietest first'],
              ['name', 'Name'],
            ] as Array<[SortKey, string]>).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                style={{
                  background: sort === key ? colors.primary : 'transparent',
                  color: sort === key ? '#fff' : colors.textSecondary,
                  border: `1px solid ${sort === key ? colors.primary : colors.border}`,
                  borderRadius: radius.full, padding: '5px 12px',
                  fontSize: font.sm, cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map(s => {
              const quiet = daysSince(s.lastActive, now)
              return (
                <Link
                  key={s.studentId}
                  href={`/dashboard/students/${s.studentId}`}
                  style={{
                    ...card, display: 'flex', alignItems: 'center', gap: 14,
                    textDecoration: 'none', flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: font.md, fontWeight: 600, color: colors.textPrimary }}>
                      {s.displayName}
                    </div>
                    <div style={{ fontSize: font.sm, color: colors.textHint, marginTop: 2 }}>
                      {s.yearGroup ? `${s.yearGroup} · ` : ''}
                      {quiet === null
                        ? 'no questions yet'
                        : quiet === 0 ? 'active today'
                        : `last active ${quiet} day${quiet === 1 ? '' : 's'} ago`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' as const, minWidth: 92 }}>
                    <div style={{ fontSize: font.lg, fontWeight: 700, color: colors.textPrimary }}>
                      {s.overallMastery === null ? '—' : `${s.overallMastery}%`}
                    </div>
                    {/* 11px literal, as elsewhere: the shared scale starts at
                        `sm` and these are sub-caption labels under a figure. */}
                    <div style={{ fontSize: '11px', color: colors.textHint }}>
                      of the course
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' as const, minWidth: 74 }}>
                    <div style={{ fontSize: font.md, fontWeight: 600, color: colors.textSecondary }}>
                      {s.questionsThisWeek}
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textHint }}>this week</div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/*
            Load-bearing caption, not boilerplate. These percentages are of the
            WHOLE course, whereas a class page shows "% of what you have taught"
            when coverage is marked — so a tutor who has marked coverage will see
            a lower number here than there. Two different figures under the same
            word, unexplained, would be worse than showing one. See docs/audit/26 §5.
          */}
          <p style={{ fontSize: font.sm, color: colors.textHint, lineHeight: 1.6, marginTop: 14 }}>
            Percentages here are of the whole GCSE course, so they are comparable
            between students. A class page can show progress against just the topics
            you have marked as taught, which gives a higher figure.
          </p>
        </>
      )}
    </div>
  )
}
