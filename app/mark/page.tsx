'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { PAPERS, DEFAULT_PAPER_ID } from '../../lib/demoPapers'
import { topicColourFor } from '../../lib/demoTopicColours'
import { marksTotal, selectedItems, type ItemMarks } from '../../lib/papers/sittingMarks'
import { buildClassEvidence } from '../../lib/papers/feedbackEvidence'
import { buildClassSummary } from '../../lib/papers/classSummary'
import ClassView from '../../components/papers/ClassView'
import { toWwwEbiSheets } from '../../lib/papers/wwwEbi'
import { downloadFeedbackPdf } from '../../lib/papers/feedbackPdf'
import { parseMarksCsv, marksCsvTemplate, parsePastedNames } from '../../lib/papers/marksCsv'
import {
  colors, font, radius, card as cardStyle,
  primaryButton, secondaryButton, errorBox, sectionTitle, pageTitle,
} from '../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// Mark a paper and get feedback sheets — the FREE path.
//
// No account, no class, no student records, and NOTHING IS SAVED. That is not a
// crippled version of /dashboard/classes/[id]/papers; it is a different path
// with a different shape (docs/audit/16, Part 7). The chain free = ephemeral =
// no class = no student accounts = nothing an account could hold is what makes
// requiring sign-up here pointless: there would be nothing to put in it.
//
// So the ask lands on the OTHER side of the work. A teacher arrives, marks a
// paper, downloads thirty sheets, and is then offered an account — at the
// moment they are holding the finished thing, which is the strongest position
// that offer will ever be in, and honest besides: the account IS the keeping.
//
// Everything here runs in the browser. There is no API route behind this page
// and there should not be one: the moment marks are posted somewhere, this
// stops being the free tier.
//
// Students are NAMES, typed or pasted — never accounts. buildStudentEvidence
// takes an opaque `studentRef` precisely so this path can hand it a name while
// the paid path hands it a uuid, with one generator serving both.
// ─────────────────────────────────────────────────────────────────────────────

type MarksByStudent = Record<string, ItemMarks>

/** Red/amber/green for a score, matching the marking tool's bands. */
function bandColour(scored: number, avail: number): string {
  if (!avail) return colors.textHint
  const p = (scored / avail) * 100
  return p >= 75 ? colors.success : p >= 40 ? colors.warning : colors.danger
}

export default function FreeMarkingPage() {
  const [paperId, setPaperId] = useState(DEFAULT_PAPER_ID)
  const [fullPaper, setFullPaper] = useState(true)
  const [chosen, setChosen] = useState<string[]>([])
  const [students, setStudents] = useState<string[]>([])
  const [namesDraft, setNamesDraft] = useState('')
  const [marks, setMarks] = useState<MarksByStudent>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<string[]>([])
  const [generated, setGenerated] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)

  const paper = PAPERS[paperId]
  const selection = fullPaper ? null : chosen
  const items = useMemo(() => selectedItems(paper, selection), [paper, selection])
  const total = useMemo(() => marksTotal(paper, selection), [paper, selection])

  // Switching paper invalidates every mark: item ids differ between papers, and
  // silently carrying them over would score marks against the wrong questions.
  function changePaper(id: string) {
    setPaperId(id)
    setMarks({})
    setChosen([])
    setFullPaper(true)
    reset()
  }

  function reset() {
    setError('')
    setNotice([])
    setGenerated(0)
  }

  function toggleItem(id: string) {
    setChosen(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
    reset()
  }

  function addNames() {
    const parsed = parsePastedNames(namesDraft)
    if (!parsed.length) { setError('Add at least one name.'); return }
    const known = new Set(students.map(s => s.toLowerCase()))
    setStudents([...students, ...parsed.filter(n => !known.has(n.toLowerCase()))])
    setNamesDraft('')
    reset()
  }

  function removeStudent(name: string) {
    setStudents(students.filter(s => s !== name))
    setMarks(prev => {
      const next = { ...prev }
      delete next[name]
      return next
    })
    reset()
  }

  function setMark(name: string, itemId: string, raw: string) {
    reset()
    setMarks(prev => {
      const row = { ...(prev[name] ?? {}) }
      if (raw === '') delete row[itemId]
      else {
        const n = Number(raw)
        if (!Number.isFinite(n)) return prev
        row[itemId] = n
      }
      return { ...prev, [name]: row }
    })
  }

  function studentTotal(name: string): number {
    // Sum only the items that were SET, so a mark left over from deselecting a
    // question cannot inflate a total.
    return items.reduce((s, q) => s + (marks[name]?.[q.id] ?? 0), 0)
  }

  function downloadTemplate() {
    const csv = marksCsvTemplate(paper, students, selection)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${paper.id}-marks-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importCsv(file: File) {
    reset()
    const result = parseMarksCsv(await file.text(), paper, selection)
    if (!result.ok) { setError(result.error); return }

    // The file is the source of truth for who sat it — importing a register of
    // thirty should not leave three hand-typed names behind from earlier.
    setStudents(result.rows.map(r => r.studentRef))
    setMarks(Object.fromEntries(result.rows.map(r => [r.studentRef, r.marks])))
    setNotice([
      `Loaded ${result.rows.length} student${result.rows.length === 1 ? '' : 's'}.`,
      ...result.warnings,
    ])
  }

  function generate() {
    reset()
    if (!students.length) { setError('Add some students first.'); return }
    if (!items.length) { setError('Choose at least one question.'); return }

    const sheets = toWwwEbiSheets(buildClassEvidence(
      paper,
      students.map(name => ({ studentRef: name, marks: marks[name] ?? {} })),
      selection,
    ))
    downloadFeedbackPdf(sheets, {
      paperTitle: paper.title,
      paperSubtitle: paper.subtitle,
    })
    setGenerated(sheets.length)
  }

  const marked = students.filter(n => Object.keys(marks[n] ?? {}).length > 0).length

  /**
   * The class view, recomputed as marks are typed.
   *
   * Built from the SAME evidence the sheets are, so the two can never
   * disagree, and shown BEFORE anything is downloaded — the reteaching
   * question is the one a teacher wants answered while the marks are still in
   * front of them, not after they have printed thirty pages.
   *
   * Only students with at least one mark count: a row not yet reached would
   * otherwise read as a class of zeroes and drag every figure down.
   */
  const summary = useMemo(() => {
    const entered = students.filter(n => Object.keys(marks[n] ?? {}).length > 0)
    if (!entered.length || !items.length) return null
    return buildClassSummary(buildClassEvidence(
      paper,
      entered.map(name => ({ studentRef: name, marks: marks[name] ?? {} })),
      selection,
    ))
  }, [paper, students, marks, items, selection])

  return (
    <div style={{ minHeight: '100dvh', background: colors.background, padding: '28px 20px 60px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        <h1 style={{ ...pageTitle, marginBottom: 6 }}>Mark a paper</h1>
        <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 4px', lineHeight: 1.6, maxWidth: 760 }}>
          Enter marks from a paper you have already marked, and get a feedback
          sheet for every student — what went well, what to work on, and questions
          to practise. Free, with no account and no limit on how many papers you do.
        </p>
        <p style={{ fontSize: font.base, color: colors.textHint, margin: '0 0 22px', maxWidth: 760 }}>
          Nothing you type here is saved. It stays in this browser tab and is gone when you close it.
        </p>

        {/* ── Paper and which questions were set ── */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={fullPaper}
                onChange={e => { setFullPaper(e.target.checked); reset() }}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontSize: font.md, fontWeight: '600' }}>They sat the whole paper</span>
            </label>
            <div style={{ fontSize: font.sm, color: colors.textHint, paddingBottom: 10 }}>
              {items.length} question{items.length === 1 ? '' : 's'} · {total} marks
            </div>
          </div>

          {!fullPaper && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
              <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 10px' }}>
                Tick the questions you set. The score is worked out from these only, so a
                student who took eight questions is not marked out of the whole paper.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {paper.questions.map(q => {
                  const on = chosen.includes(q.id)
                  return (
                    <button
                      key={q.id}
                      onClick={() => toggleItem(q.id)}
                      title={`${q.desc} — ${q.skill}`}
                      style={{
                        padding: '5px 10px', borderRadius: radius.sm, cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: font.sm, fontWeight: '600',
                        border: `1.5px solid ${on ? colors.primary : colors.borderStrong}`,
                        background: on ? colors.primary : colors.card,
                        color: on ? '#fff' : colors.textSecondary,
                      }}
                    >
                      {q.label} <span style={{ opacity: 0.75 }}>/{q.marks}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Who sat it ── */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Who sat it</h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 12px' }}>
            Paste a list of names, one per line — a column copied straight from a register works.
            Names stay in this tab; they are not sent anywhere.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <textarea
              value={namesDraft}
              onChange={e => setNamesDraft(e.target.value)}
              placeholder={'Amira Patel\nBen Okonkwo\nCharlotte Evans'}
              rows={4}
              style={{
                flex: 1, minWidth: 260, padding: '10px 12px', borderRadius: radius.md,
                border: `1px solid ${colors.borderStrong}`, fontSize: font.base,
                fontFamily: 'inherit', resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 190 }}>
              <button onClick={addNames} style={{ ...primaryButton, width: 'auto' }}>Add these students</button>
              <button onClick={downloadTemplate} style={{ ...secondaryButton, width: 'auto' }}>
                Download CSV template
              </button>
              <button onClick={() => fileInput.current?.click()} style={{ ...secondaryButton, width: 'auto' }}>
                Import marks from CSV
              </button>
              <input
                ref={fileInput} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) importCsv(f)
                  // Clear, so re-picking the same file after a fix still fires.
                  e.target.value = ''
                }}
              />
            </div>
          </div>
        </div>

        {notice.length > 0 && (
          <div style={{
            background: colors.successLight, border: `1px solid ${colors.successBorder}`,
            color: colors.successText, borderRadius: radius.lg, padding: '12px 16px',
            marginBottom: 16, fontSize: font.base, lineHeight: 1.6,
          }}>
            {notice.map((n, i) => <div key={i}>{n}</div>)}
          </div>
        )}

        {/* ── Marks grid ── */}
        {students.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Enter marks</h2>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 12px' }}>
              Leave a question blank if it was not attempted — that is different from a zero,
              and only a zero counts against the student. Hover a heading for the skill.
            </p>
            <div style={{ overflowX: 'auto', borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.sm }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, position: 'sticky', left: 0, zIndex: 2, minWidth: 150, textAlign: 'left', paddingLeft: 10 }}>Student</th>
                    {items.map(q => {
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
                    <th style={thStyle} />
                  </tr>
                </thead>
                <tbody>
                  {students.map(name => {
                    const t = studentTotal(name)
                    const any = Object.keys(marks[name] ?? {}).length > 0
                    return (
                      <tr key={name}>
                        <td style={{ ...tdStyle, position: 'sticky', left: 0, zIndex: 1, background: colors.card, textAlign: 'left', paddingLeft: 10, fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {name}
                        </td>
                        {items.map(q => {
                          const v = marks[name]?.[q.id]
                          return (
                            <td key={q.id} style={tdStyle}>
                              <input
                                type="number" min={0} max={q.marks}
                                value={v ?? ''}
                                onChange={e => setMark(name, q.id, e.target.value)}
                                aria-label={`${name}, question ${q.label}, out of ${q.marks}`}
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
                        <td style={tdStyle}>
                          <button
                            onClick={() => removeStudent(name)}
                            aria-label={`Remove ${name}`}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: colors.textHint, fontSize: font.md, padding: '0 6px',
                              fontFamily: 'inherit', lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div style={{ ...errorBox, marginBottom: 16 }}>{error}</div>}

        {/* The class view — shared with the class papers page so the two
            screens cannot drift apart. */}
        {summary && <ClassView summary={summary} />}

        {/* ── Generate ── */}
        {students.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={generate} style={{ ...primaryButton, width: 'auto' }}>
              Get feedback sheets
            </button>
            <span style={{ fontSize: font.base, color: colors.textSecondary }}>
              One page per student, {marked} of {students.length} marked so far.
            </span>
          </div>
        )}

        {/* ── The moment to ask. Not before: until now there was nothing to keep. ── */}
        {generated > 0 && (
          <div style={{
            background: colors.card, border: `2px solid ${colors.primary}`,
            borderRadius: radius.lg, padding: '20px 22px',
          }}>
            <h2 style={{ ...sectionTitle, marginBottom: 6 }}>
              {generated} sheet{generated === 1 ? '' : 's'} downloaded
            </h2>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 14px', lineHeight: 1.7, maxWidth: 660 }}>
              These marks are not saved anywhere — close the tab and they are gone. With a free
              account you can keep them against a class, so next term&apos;s paper is compared
              with this one and you can see what has actually improved.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/auth" style={{ ...primaryButton, width: 'auto', textDecoration: 'none', display: 'inline-block' }}>
                Create a free account
              </Link>
              <Link href="/for-teachers" style={{ ...secondaryButton, width: 'auto', textDecoration: 'none', display: 'inline-block' }}>
                What else it does
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
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

