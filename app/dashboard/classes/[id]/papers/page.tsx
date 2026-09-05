'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getSession, requireTeacher } from '../../../../../lib/auth'
import { supabase } from '../../../../../lib/supabase'
import { getClassMembers, type ClassMember } from '../../../../../lib/classes'
import { PAPERS, DEFAULT_PAPER_ID } from '../../../../../lib/demoPapers'
import { topicColourFor } from '../../../../../lib/demoTopicColours'
import { marksTotal, type ItemMarks } from '../../../../../lib/papers/sittingMarks'
import { buildClassEvidence } from '../../../../../lib/papers/feedbackEvidence'
import { buildClassSummary } from '../../../../../lib/papers/classSummary'
import { toWwwEbiSheets } from '../../../../../lib/papers/wwwEbi'
import { downloadFeedbackPdf } from '../../../../../lib/papers/feedbackPdf'
import ClassView from '../../../../../components/papers/ClassView'
import {
  recordSitting, listSittings, deleteSitting, type ExistingSitting,
} from '../../../../../lib/papers/recordSitting'
import {
  colors, font, radius, card as cardStyle,
  primaryButton, secondaryButton, errorBox, sectionTitle, pageTitle,
} from '../../../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// Enter a marked paper's marks for a REAL class.
//
// The sibling of /demo/marking, which does the same thing on invented students
// and keeps everything in the browser. This one loads the actual roster, and
// submitting writes a paper_sittings row per student plus the practice_attempts
// rows that move each student's skill map.
//
// Deliberately does NOT reuse the demo page: that is a 1,100-line client
// component with its paper fixed at module scope, and it is about to be sent to
// prospective customers — refactoring it to be parameterised is a change worth
// making on its own, not as a side effect of shipping this.
// ─────────────────────────────────────────────────────────────────────────────

type MarksByStudent = Record<string, ItemMarks>

/** Red/amber/green for a score, matching the demo tool's bands. */
function bandColour(scored: number, avail: number): string {
  if (!avail) return colors.textHint
  const p = (scored / avail) * 100
  return p >= 75 ? colors.success : p >= 40 ? colors.warning : colors.danger
}

export default function ClassPapersPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const classId = params.id

  const [className, setClassName] = useState('')
  const [members, setMembers] = useState<ClassMember[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [paperId, setPaperId] = useState(DEFAULT_PAPER_ID)
  const [satOn, setSatOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [marks, setMarks] = useState<MarksByStudent>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<{ count: number; total: number; corrected: boolean } | null>(null)

  // Already recorded for this class + paper. Surfaced BEFORE submitting,
  // because "a resit" and "submitted twice by accident" produce identical data
  // and only the teacher knows which it is — and a duplicate is not merely
  // untidy: the mastery fast-track marks a skill secure at three correct
  // attempts, so one right answer submitted three times reads as mastery.
  const [existing, setExisting] = useState<ExistingSitting[]>([])
  // studentId -> sittingId being corrected, when marks were loaded from one.
  const [correcting, setCorrecting] = useState<Record<string, string>>({})

  const paper = PAPERS[paperId]
  const total = useMemo(() => marksTotal(paper), [paper])

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/auth'); return }
      if (!(await requireTeacher())) { router.push('/student/dashboard'); return }
      // Readable via RLS only if this teacher owns the class.
      const { data: cls } = await supabase
        .from('classes').select('name').eq('id', classId).single()
      if (!cls) { setNotFound(true); setLoading(false); return }
      setClassName(cls.name)
      try {
        setMembers(await getClassMembers(classId))
      } catch {
        // Roster fetch failed — show the empty state rather than break.
      }
      setLoading(false)
    })
  }, [classId])

  // Refresh "what's already recorded" whenever the paper changes or a write
  // lands, so the warning can never be stale at the moment it matters.
  async function refreshExisting(forPaper: string) {
    try {
      setExisting(await listSittings(classId, forPaper))
    } catch {
      // Non-fatal: worst case the teacher doesn't see the duplicate warning.
      setExisting([])
    }
  }
  useEffect(() => {
    if (!loading && !notFound) refreshExisting(paperId)
  }, [classId, paperId, loading, notFound])

  // Switching paper invalidates every mark: item ids differ between papers, and
  // silently carrying them over would submit marks against the wrong questions.
  function changePaper(id: string) {
    setPaperId(id)
    setMarks({})
    setCorrecting({})
    setSaved(null)
    setError('')
  }

  /** Pull an existing sitting's marks into the grid to edit and re-save. */
  function loadForCorrection() {
    const next: MarksByStudent = {}
    const ids: Record<string, string> = {}
    for (const s of existing) {
      // Newest-first from the API, so the first per student is the latest.
      if (next[s.student_id]) continue
      next[s.student_id] = { ...s.marks }
      ids[s.student_id] = s.id
    }
    setMarks(next)
    setCorrecting(ids)
    setSaved(null)
    setError('')
  }

  async function removeSitting(sittingId: string) {
    if (!confirm('Delete this recorded sitting? The marks and the skill credit from it are removed.')) return
    setError('')
    try {
      await deleteSitting(classId, sittingId)
      // Stop correcting a sitting that no longer exists.
      setCorrecting(prev => Object.fromEntries(Object.entries(prev).filter(([, v]) => v !== sittingId)))
      await refreshExisting(paperId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete sitting')
    }
  }

  function setMark(studentId: string, itemId: string, raw: string) {
    const item = paper.questions.find(q => q.id === itemId)
    if (!item) return
    setMarks(prev => {
      const row = { ...(prev[studentId] ?? {}) }
      if (raw === '') delete row[itemId]
      else {
        const n = parseInt(raw, 10)
        if (isNaN(n) || n < 0) return prev
        row[itemId] = Math.min(n, item.marks) // clamp, so a typo can't exceed the max
      }
      return { ...prev, [studentId]: row }
    })
    setSaved(null)
  }

  const studentTotal = (studentId: string) =>
    Object.values(marks[studentId] ?? {}).reduce((s, m) => s + m, 0)

  /** Only students with at least one mark entered are submitted. */
  const entered = members.filter(m => Object.keys(marks[m.student_id] ?? {}).length > 0)

  async function submit() {
    setSaving(true); setError(''); setSaved(null)
    const isCorrection = entered.some(m => correcting[m.student_id])
    try {
      const res = await recordSitting({
        sourcePaper: paperId,
        classId,
        satOn,
        students: entered.map(m => ({
          studentId: m.student_id,
          // Present only for students whose marks came from an existing
          // sitting: the API then corrects that row and rebuilds just its
          // attempts, instead of adding a second set.
          sittingId: correcting[m.student_id],
          marks: marks[m.student_id],
        })),
      })
      setSaved({ count: res.sittings.length, total: res.marksTotal, corrected: isCorrection })
      // Newly created sittings become correctable, so an immediate second click
      // edits them rather than duplicating.
      setCorrecting(Object.fromEntries(res.sittings.map(s => [s.studentId, s.sittingId])))
      await refreshExisting(paperId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record marks')
    } finally {
      setSaving(false)
    }
  }

  /**
   * The class view and the sheets, from the SAME evidence the free tool uses.
   *
   * A student is identified here by DISPLAY NAME rather than by id, because
   * the name is what goes at the top of the sheet a child is handed.
   * buildStudentEvidence takes an opaque studentRef for exactly this reason.
   *
   * Both are computed from what is on screen, so they work BEFORE the sitting
   * is saved. Downloading writes nothing; saving is a separate, explicit act.
   */
  const sheetEntries = useMemo(() => entered.map(m => ({
    studentRef: m.display_name,
    marks: marks[m.student_id] ?? {},
  })), [entered, marks])

  const summary = useMemo(
    () => (sheetEntries.length ? buildClassSummary(buildClassEvidence(paper, sheetEntries)) : null),
    [paper, sheetEntries],
  )

  function downloadSheets() {
    downloadFeedbackPdf(
      toWwwEbiSheets(buildClassEvidence(paper, sheetEntries)),
      { paperTitle: paper.title, paperSubtitle: paper.subtitle, className, satOn },
    )
  }

  if (loading) {
    return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading…</p></main>
  }
  if (notFound) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Class not found.</p>
        <Link href="/dashboard/classes" style={{ color: colors.primary }}>← Back to classes</Link>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <Link href={`/dashboard/classes/${classId}`} style={{ fontSize: font.base, color: colors.primary, textDecoration: 'none', fontWeight: '600' }}>
          ← {className}
        </Link>
        <h1 style={{ ...pageTitle, margin: '10px 0 4px' }}>Record a marked paper</h1>
        <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 20px', lineHeight: 1.6, maxWidth: 680 }}>
          You have marked the scripts; entering the marks here turns them into each
          student&apos;s skill map. Full marks on a question counts as secure; anything less is
          simply not counted, so a dropped mark never pulls a skill down.
        </p>

        {members.length === 0 ? (
          <div style={{ ...cardStyle }}>
            <p style={{ fontSize: font.md, color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
              No students have joined this class yet. Share the join code from the{' '}
              <Link href={`/dashboard/classes/${classId}`} style={{ color: colors.primary }}>class page</Link>{' '}
              first — marks can only be recorded against a student&apos;s own account.
            </p>
          </div>
        ) : (
          <>
            {/* ── Paper + date ── */}
            <div style={{ ...cardStyle, marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: font.sm, fontWeight: '700', color: colors.textSecondary }}>Paper</span>
                <select
                  value={paperId}
                  onChange={e => changePaper(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: radius.md, border: `1px solid ${colors.borderStrong}`, fontSize: font.md, fontFamily: 'inherit', minWidth: 320 }}
                >
                  {Object.values(PAPERS).map(p => (
                    <option key={p.id} value={p.id}>{p.title} — {p.subtitle}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: font.sm, fontWeight: '700', color: colors.textSecondary }}>Date sat</span>
                <input
                  type="date" value={satOn} onChange={e => setSatOn(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: radius.md, border: `1px solid ${colors.borderStrong}`, fontSize: font.md, fontFamily: 'inherit' }}
                />
              </label>
              <div style={{ fontSize: font.sm, color: colors.textHint, paddingBottom: 10 }}>
                {paper.questions.length} questions · {total} marks
              </div>
            </div>

            {/* ── Already recorded ── */}
            {existing.length > 0 && (
              <div style={{
                background: colors.warningLight, border: `1px solid ${colors.warningBorder}`,
                borderRadius: radius.lg, padding: '16px 18px', marginBottom: 16,
              }}>
                <h2 style={{ ...sectionTitle, color: colors.warningText, marginBottom: 4 }}>
                  This paper is already recorded for this class
                </h2>
                <p style={{ fontSize: font.base, color: colors.warningText, margin: '0 0 12px', lineHeight: 1.6 }}>
                  Submitting again adds a <strong>second sitting</strong> — right for a resit, but if
                  you are fixing a mistake, correct the existing one instead. Two sittings of the same
                  paper count twice towards mastery.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {existing.map(s => {
                    const who = members.find(m => m.student_id === s.student_id)?.display_name ?? 'Unknown'
                    return (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                        background: colors.card, border: `1px solid ${colors.border}`,
                        borderRadius: radius.md, padding: '7px 12px', fontSize: font.base,
                      }}>
                        <span style={{ fontWeight: '600', flex: 1, minWidth: 140 }}>{who}</span>
                        <span style={{ color: colors.textSecondary }}>
                          {s.marks_earned}/{s.marks_total}
                        </span>
                        <span style={{ color: colors.textHint, fontSize: font.sm }}>
                          {s.sat_on ? `sat ${new Date(s.sat_on).toLocaleDateString('en-GB')}` : 'no date'}
                          {s.updated_at !== s.created_at ? ' · corrected' : ''}
                        </span>
                        <button
                          onClick={() => removeSitting(s.id)}
                          style={{
                            background: 'none', border: `1px solid ${colors.dangerBorder}`,
                            color: colors.dangerText, borderRadius: radius.sm, padding: '3px 10px',
                            fontSize: font.sm, fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={loadForCorrection}
                  style={{ ...secondaryButton, width: 'auto' }}
                >
                  Load these marks to correct them
                </button>
              </div>
            )}

            {/* ── Marks grid ── */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Enter marks</h2>
              <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 12px' }}>
                Leave a question blank to skip it. Columns are coloured by topic; hover a heading for the skill.
              </p>
              <div style={{ overflowX: 'auto', borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.sm }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, position: 'sticky', left: 0, zIndex: 2, minWidth: 150, textAlign: 'left', paddingLeft: 10 }}>Student</th>
                      {paper.questions.map(q => {
                        const c = topicColourFor(paper.topics.find(t => t.id === q.topic)?.label ?? '')
                        return (
                          <th key={q.id} style={{ ...thStyle, background: c.bg, borderBottomColor: c.border }}
                              title={`${q.desc} — ${q.skill}`}>
                            <div style={{ fontWeight: '700', color: c.fg }}>{q.label}</div>
                            <div style={{ fontSize: '9px', color: colors.textHint }}>/{q.marks}</div>
                          </th>
                        )
                      })}
                      <th style={thStyle}>
                        <div style={{ fontWeight: '700' }}>Total</div>
                        <div style={{ fontSize: '9px', color: colors.textHint }}>/{total}</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => {
                      const t = studentTotal(m.student_id)
                      const any = Object.keys(marks[m.student_id] ?? {}).length > 0
                      return (
                        <tr key={m.student_id}>
                          <td style={{ ...tdStyle, position: 'sticky', left: 0, zIndex: 1, background: colors.card, textAlign: 'left', paddingLeft: 10, fontWeight: '600', whiteSpace: 'nowrap' }}>
                            {m.display_name}
                          </td>
                          {paper.questions.map(q => {
                            const v = marks[m.student_id]?.[q.id]
                            return (
                              <td key={q.id} style={tdStyle}>
                                <input
                                  type="number" min={0} max={q.marks}
                                  value={v ?? ''}
                                  onChange={e => setMark(m.student_id, q.id, e.target.value)}
                                  aria-label={`${m.display_name}, question ${q.label}, out of ${q.marks}`}
                                  style={{
                                    width: 36, height: 28, textAlign: 'center', fontFamily: 'inherit',
                                    fontSize: font.base, fontWeight: '600', borderRadius: radius.sm,
                                    outline: 'none', background: 'transparent',
                                    border: `1.5px solid ${v === undefined ? colors.borderStrong : bandColour(v, q.marks)}`,
                                  }}
                                />
                              </td>
                            )
                          })}
                          <td style={{ ...tdStyle, fontWeight: '700', fontSize: font.md, color: any ? bandColour(t, total) : colors.textHint }}>
                            {any ? t : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── The class view, and the sheets ──────────────────────────────
                Both shared with /mark. Until now this page recorded a sitting
                and produced nothing a teacher could hand out, which made the
                PAID path strictly worse than the free one. ──────────────── */}
            {summary && <ClassView summary={summary} title="The class so far" />}

            {entered.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={downloadSheets} style={{ ...secondaryButton, width: 'auto' }}>
                  Download feedback sheets
                </button>
                <span style={{ fontSize: font.base, color: colors.textSecondary }}>
                  One page per student, from the marks above. Downloading does not record anything —
                  use Save below for that.
                </span>
              </div>
            )}

            {error && <div style={{ ...errorBox, marginBottom: 12 }}>{error}</div>}

            {saved && (
              <div style={{
                background: colors.successLight, border: `1px solid ${colors.successBorder}`,
                borderRadius: radius.md, padding: '12px 16px', marginBottom: 12,
              }}>
                <p style={{ fontSize: font.md, color: colors.successText, margin: 0, lineHeight: 1.6 }}>
                  <strong>
                    {saved.corrected ? 'Corrected' : 'Recorded'} for {saved.count} student{saved.count === 1 ? '' : 's'}.
                  </strong>{' '}
                  Their skill maps now include this paper —{' '}
                  <Link href={`/dashboard/classes/${classId}`} style={{ color: colors.successText, fontWeight: 700 }}>
                    see the class view
                  </Link>. Editing and submitting again now <strong>corrects</strong> this sitting rather
                  than adding another, so a second click cannot double-count.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={submit}
                disabled={saving || entered.length === 0}
                style={{
                  ...primaryButton, width: 'auto',
                  opacity: saving || entered.length === 0 ? 0.5 : 1,
                  cursor: saving || entered.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {saving
                  ? 'Saving…'
                  : entered.some(m => correcting[m.student_id])
                    ? `Correct marks for ${entered.length} student${entered.length === 1 ? '' : 's'}`
                    : `Record marks for ${entered.length} student${entered.length === 1 ? '' : 's'}`}
              </button>
              {entered.some(m => correcting[m.student_id]) && (
                <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
                  Updating the existing sitting — no second set of marks is created.
                </span>
              )}
              <Link href={`/dashboard/classes/${classId}`} style={{ ...secondaryButton, width: 'auto', textDecoration: 'none', display: 'inline-block' }}>
                Cancel
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

const styles = {
  page: { minHeight: '100dvh', background: colors.background, padding: '28px 20px 64px' } as React.CSSProperties,
}

const thStyle: React.CSSProperties = {
  padding: '7px 4px', textAlign: 'center', background: colors.cardAlt,
  borderBottom: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`,
  fontWeight: '600', fontSize: font.sm, whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '3px', textAlign: 'center',
  borderBottom: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`,
}
