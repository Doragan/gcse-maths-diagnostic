'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, requireTeacher } from '../../../lib/auth'
import { createClassSession, getMyClassSessions } from '../../../lib/classSessionsApi'
import { sessionLifecycle, type ClassSession } from '../../../lib/classSessions'
import { courseIdFor, type CourseTier, type Qualification } from '../../../data/courses'
import { usePublishedSkillIds } from '../../../lib/skills/publishedSkills'
import SkillPicker from '../../../components/SkillPicker'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, sectionTitle, inputStyle, labelStyle, errorBox,
} from '../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// Start a class session — the no-login lesson mode (docs/audit/29).
//
// The pitch on this page has to be honest about what a session is NOT, because
// a teacher who expects it to build a record of their class will be
// disappointed in a way that costs trust: it keeps nothing past the day, and
// none of it reaches a pupil's mastery. That is the free tier working as
// designed, not a limitation to bury.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TARGET = 10

const QUALIFICATIONS: { value: Qualification; label: string }[] = [
  { value: 'gcse',  label: 'GCSE' },
  { value: 'igcse', label: 'International GCSE' },
]

const TIERS: { value: CourseTier; label: string }[] = [
  { value: 'foundation', label: 'Foundation' },
  { value: 'higher',     label: 'Higher' },
]

export default function ClassSessionsPage() {
  const router = useRouter()
  const published = usePublishedSkillIds()

  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [loading, setLoading]   = useState(true)

  const [title, setTitle]               = useState('')
  const [qualification, setQualification] = useState<Qualification>('gcse')
  const [tier, setTier]                 = useState<CourseTier>('foundation')
  const [chosen, setChosen]             = useState<string[]>([])
  const [target, setTarget]             = useState(DEFAULT_TARGET)
  const [starting, setStarting]         = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      setSessions(await getMyClassSessions())
      setLoading(false)
    })
  }, [router])

  async function handleStart() {
    setError('')
    if (!title.trim())    { setError('Give the session a name.'); return }
    if (chosen.length === 0) { setError('Choose at least one skill.'); return }

    setStarting(true)
    const result = await createClassSession({
      title:       title.trim(),
      skillIds:    chosen,
      targetCount: target,
      courseId:    courseIdFor(qualification, tier),
    })
    setStarting(false)

    if ('error' in result) { setError(result.error); return }
    // Straight to the session: the code is the only thing the teacher wants now.
    router.push(`/dashboard/sessions/${result.session.id}`)
  }

  if (loading) {
    return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Class session
          </h1>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '4px 0 0', lineHeight: '1.6' }}>
            Pupils join with a code and a first name. No accounts, no email, nothing to set up.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, flexShrink: 0 }}
        >
          Dashboard
        </button>
      </div>

      {/* Said plainly and up front, not in the small print. A teacher who
          expects a lasting record and finds none has been misled by us. */}
      <div style={{ ...card, padding: '12px 16px', background: colors.cardAlt }}>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
          A session lasts the school day and then deletes itself — the names and the answers both.
          Nothing counts towards a pupil&apos;s mastery, because there is no account to count it
          towards. It is for seeing where a class is, live, in the lesson.
        </p>
      </div>

      {/* ── Start one ──────────────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Start a session</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 9C Tuesday — fractions"
              maxLength={120}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>Qualification</label>
              <select
                value={qualification}
                onChange={e => setQualification(e.target.value as Qualification)}
                style={inputStyle}
              >
                {QUALIFICATIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={labelStyle}>Tier</label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value as CourseTier)}
                style={inputStyle}
              >
                {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={labelStyle}>Questions each</label>
              <input
                type="number"
                min={1}
                max={50}
                value={target}
                onChange={e => setTarget(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Skills</label>
            <div style={{ marginTop: '6px' }}>
              <SkillPicker value={chosen} onChange={setChosen} published={published} />
            </div>
          </div>

          {error && <p style={errorBox}>{error}</p>}

          <button
            onClick={handleStart}
            disabled={starting}
            style={{ ...primaryButton, width: 'auto', padding: '10px 18px', opacity: starting ? 0.6 : 1 }}
          >
            {starting ? 'Starting…' : 'Start session'}
          </button>
        </div>
      </div>

      {/* ── Earlier sessions ───────────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <div style={card}>
          <h2 style={sectionTitle}>Recent sessions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
            {sessions.map(s => {
              const state = sessionLifecycle(s)
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/dashboard/sessions/${s.id}`)}
                  style={styles.sessionRow}
                >
                  <span style={{ flex: 1, minWidth: 0, textAlign: 'left' as const }}>
                    <span style={{ fontWeight: '500', color: colors.textPrimary }}>{s.title}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: colors.textHint, marginTop: 2 }}>
                      {new Date(s.created_at).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </span>
                  {state === 'live' ? (
                    <span style={{ ...styles.chip, background: colors.successLight, color: colors.successText }}>
                      {s.code}
                    </span>
                  ) : (
                    <span style={{ ...styles.chip, color: colors.textHint }}>
                      {state === 'closed' ? 'Closed' : 'Finished'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  sessionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
    cursor: 'pointer',
    width: '100%',
  },
  chip: {
    fontSize: font.sm,
    fontWeight: '700',
    letterSpacing: '0.1em',
    padding: '4px 8px',
    borderRadius: radius.sm,
    flexShrink: 0,
  },
}
