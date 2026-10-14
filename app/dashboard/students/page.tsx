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

/**
 * Skills currently sitting at `needs_practice` — the number a tutor plans
 * around.
 *
 * ⚠ A COUNT, DELIBERATELY, AND NOT A PERCENTAGE. Two ratios were tried and both
 * are recorded as rejected in docs/audit/26 §5:
 *
 *   mastered / whole curriculum — correct, but the curriculum is ~170 skills, so
 *     every real tutee sits at 0–3% forever and the column cannot rank anybody.
 *
 *   mastered / attempted — ranks fine, and INVERTS THE INCENTIVE. The denominator
 *     grows every time a student meets something new, so 5-of-12 (42%) becomes
 *     5-of-15 (33%) after three fresh attempts. The student did more work and
 *     the number went down, which is exactly backwards for a product whose
 *     problem is getting students to come back at all.
 *
 * Counts have no denominator to grow. "To work on" rising is informative rather
 * than punitive: it means new material has been met, which is what a tutor wants
 * to see.
 */
function toWorkOn(s: StudentAnalytics): number {
  return s.skillDetail.filter(d => d.status === 'needs_practice').length
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
    // attention: most skills needing practice first. A count, so a student who
    // has simply done more does not sink to the bottom the way a ratio would
    // push them.
    const wa = toWorkOn(a)
    const wb = toWorkOn(b)
    if (wa !== wb) return wb - wa
    return a.displayName.localeCompare(b.displayName)
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
              ['attention', 'Most to work on'],
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

                  {/* COUNTS, NOT A PERCENTAGE — see the note above the component. */}
                  <div style={{ textAlign: 'right' as const, minWidth: 86 }}>
                    <div style={{ fontSize: font.lg, fontWeight: 700, color: colors.successText }}>
                      {s.masteredSkills}
                    </div>
                    {/* 11px literal, as elsewhere: the shared scale starts at
                        `sm` and these are sub-caption labels under a figure. */}
                    <div style={{ fontSize: '11px', color: colors.textHint }}>mastered</div>
                  </div>

                  <div style={{ textAlign: 'right' as const, minWidth: 86 }}>
                    <div style={{ fontSize: font.lg, fontWeight: 700, color: toWorkOn(s) > 0 ? colors.warningText : colors.textHint }}>
                      {toWorkOn(s)}
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textHint }}>to work on</div>
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
            Counts across every topic, not just the ones marked as taught — this
            view crosses classes and coverage belongs to a class, so there is no
            single taught-list to scope to (docs/audit/26 §5). A class page can
            narrow the same figures to what you have covered.
          */}
          <p style={{ fontSize: font.sm, color: colors.textHint, lineHeight: 1.6, marginTop: 14 }}>
            Counts cover every topic a student has attempted. A class page can narrow
            them to just the topics you have marked as taught.
          </p>
        </>
      )}
    </div>
  )
}
