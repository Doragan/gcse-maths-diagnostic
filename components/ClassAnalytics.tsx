'use client'

import { useEffect, useState } from 'react'
import {
  getClassAnalytics, TOPICS,
  type ClassAnalytics, type Topic, type StudentAnalytics,
} from '../lib/teacherAnalytics'
import ClassMasteryTrend from './ClassMasteryTrend'
import StudentDetailModal from './StudentDetailModal'
import { colors, font, radius, card, sectionTitle } from '../lib/styles'

const TOPIC_COLOUR: Record<Topic, string> = {
  'Number': '#7c3aed',
  'Algebra': colors.primary,
  'Shape and Space': '#ea580c',
  'Ratio and Proportion': '#0891b2',
  'Probability and Data': colors.success,
}

// % → traffic-light colours (≥70 green, ≥40 amber, else red)
const bCol = (p: number) => (p >= 70 ? colors.success : p >= 40 ? colors.warning : colors.danger)
const bBg  = (p: number) => (p >= 70 ? colors.successLight : p >= 40 ? colors.warningLight : colors.dangerLight)
const bTxt = (p: number) => (p >= 70 ? colors.successText : p >= 40 ? colors.warningText : colors.dangerText)

export default function ClassAnalytics({ classId }: { classId: string }) {
  const [data, setData] = useState<ClassAnalytics | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selected, setSelected] = useState<StudentAnalytics | null>(null)

  useEffect(() => {
    let live = true
    setState('loading')
    getClassAnalytics(classId)
      .then(d => { if (live) { setData(d); setState('ready') } })
      .catch(() => { if (live) setState('error') })
    return () => { live = false }
  }, [classId])

  if (state === 'loading') {
    return <div style={card}><h2 style={sectionTitle}>Class mastery</h2><p style={hint}>Loading analytics…</p></div>
  }
  if (state === 'error') {
    return (
      <div style={card}>
        <h2 style={sectionTitle}>Class mastery</h2>
        <p style={hint}>Analytics aren&apos;t available yet. They&apos;ll appear here once class members have practised or completed assignments.</p>
      </div>
    )
  }
  if (!data) return null

  // topics that at least one student has data in (drives table columns)
  const liveTopics = TOPICS.filter(t => data.students.some(s => s.topicMastery[t] !== undefined))
  const ranked = [...data.students].sort((a, b) => (b.overallMastery ?? -1) - (a.overallMastery ?? -1))

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h2 style={sectionTitle}>Class mastery</h2>
        <span style={{ fontSize: font.sm, color: colors.textHint }}>
          {data.studentsWithData} of {data.studentCount} active{data.questionsThisWeek > 0 && ` · ${data.questionsThisWeek} answered this week`}
        </span>
      </div>

      {data.studentsWithData === 0 ? (
        <p style={hint}>
          No mastery data yet. Once students practise or complete assignments, their skill mastery will roll up here.
        </p>
      ) : (
        <>
          {/* ── Summary: average + per-topic bars ── */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', margin: '14px 0 4px' }}>
            <div style={{
              textAlign: 'center', padding: '8px 16px', borderRadius: radius.md,
              background: data.avgMastery !== null ? bBg(data.avgMastery) : colors.cardAlt,
              border: `1px solid ${colors.border}`, minWidth: 92,
            }}>
              <div style={{ fontSize: font['2xl'], fontWeight: 700, color: data.avgMastery !== null ? bTxt(data.avgMastery) : colors.textHint }}>
                {data.avgMastery !== null ? `${data.avgMastery}%` : '—'}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>avg mastery</div>
            </div>
            <div style={{ flex: 1, minWidth: 240, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
              {TOPICS.map(t => {
                const p = data.topicAvgs[t]
                return (
                  <div key={t} style={{ padding: '6px 8px', borderRadius: radius.sm, border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: TOPIC_COLOUR[t] }}>{t}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: p !== undefined ? bTxt(p) : colors.textHint }}>
                        {p !== undefined ? `${p}%` : '—'}
                      </span>
                    </div>
                    <div style={{ height: 4, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: radius.full, width: `${p ?? 0}%`, background: TOPIC_COLOUR[t] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Mastery over time ── */}
          <ClassMasteryTrend points={data.timeline} />

          {/* ── Common gaps ── */}
          {data.gaps.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ fontSize: font.md, fontWeight: 700, margin: '0 0 2px', color: colors.textPrimary }}>Common gaps</h3>
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 8px' }}>
                Skills where several students need practice — worth revisiting in class.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.gaps.map(g => (
                  <div key={g.skillId} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: radius.md,
                    border: `1px solid ${g.priority === 'high' ? colors.dangerBorder : colors.warningBorder}`,
                    background: g.priority === 'high' ? colors.dangerLight : colors.warningLight,
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: font.base, fontWeight: 600, color: colors.textPrimary }}>{g.skillName}</span>
                      {g.topic && <span style={{ fontSize: font.sm, color: TOPIC_COLOUR[g.topic], fontWeight: 600 }}> · {g.topic}</span>}
                    </div>
                    <span style={{ fontSize: font.sm, fontWeight: 600, color: g.priority === 'high' ? colors.dangerText : colors.warningText }}>
                      {g.studentsWeak}/{g.studentsWithData} need practice
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Per-student table (rows expand to a drill-down) ── */}
          <div style={{ marginTop: 18, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.sm, tableLayout: 'fixed', minWidth: 380 }}>
              {/* fixed layout → even, predictable columns (the numeric cols share equally) */}
              <colgroup>
                <col style={{ width: '30%' }} />
                <col />
                {liveTopics.map(t => <col key={t} />)}
                <col style={{ width: '34px' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ ...th, textAlign: 'left' }}>Student</th>
                  <th style={th}>Mastery</th>
                  {liveTopics.map(t => <th key={t} style={{ ...th, color: TOPIC_COLOUR[t] }}>{t.split(' ')[0]}</th>)}
                  <th style={th} aria-label="expand" />
                </tr>
              </thead>
              <tbody>
                {ranked.map(s => (
                  <tr
                    key={s.studentId}
                    onClick={() => setSelected(s)}
                    style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}
                  >
                    <td style={{ ...td, textAlign: 'left', fontWeight: 500, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.displayName}{s.yearGroup && <span style={{ color: colors.textHint, fontWeight: 400 }}> · {s.yearGroup}</span>}
                    </td>
                    <td style={{ ...td, fontWeight: 700, color: s.overallMastery !== null ? bCol(s.overallMastery) : colors.textHint }}>
                      {s.overallMastery !== null ? `${s.overallMastery}%` : '—'}
                    </td>
                    {liveTopics.map(t => {
                      const m = s.topicMastery[t]
                      return (
                        <td key={t} style={{ ...td, fontWeight: 600, color: m !== undefined ? bCol(m) : colors.textHint }}>
                          {m !== undefined ? `${m}%` : '—'}
                        </td>
                      )
                    })}
                    <td style={{ ...td, color: colors.textHint, fontSize: font.lg }}>›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: '11px', color: colors.textHint, margin: '12px 0 0', lineHeight: 1.5 }}>
            {data.scoped ? (
              <>Mastery = % of the {data.coveredCount} skill{data.coveredCount === 1 ? '' : 's'} you&apos;ve marked as covered that are mastered (4+ correct in the last 5 attempts), across practice and assignments. Adjust what counts in <strong>Topics covered</strong> above. Tap a student to open their breakdown.</>
            ) : (
              <>Mastery = % of all skills in the topic / course mastered (4+ correct in the last 5 attempts), across practice and assignments. Low early in the course is expected — it climbs as topics are covered. Mark what you&apos;ve taught in <strong>Topics covered</strong> above to measure against that instead. Tap a student to open their breakdown.</>
            )}
          </p>
        </>
      )}

      {selected && <StudentDetailModal s={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

const hint: React.CSSProperties = { fontSize: font.base, color: colors.textHint, margin: '8px 0 0', lineHeight: 1.6 }
const th: React.CSSProperties = {
  padding: '8px 8px', textAlign: 'center', fontWeight: 600, color: colors.textSecondary,
  fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
}
const td: React.CSSProperties = { padding: '9px 8px', textAlign: 'center', verticalAlign: 'middle' }
