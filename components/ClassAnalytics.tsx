'use client'

import { useEffect, useState } from 'react'
import {
  getClassAnalytics, TOPICS,
  type ClassAnalytics, type Topic,
} from '../lib/teacherAnalytics'
import { colors, font, radius, card, sectionTitle } from '../lib/styles'

const TOPIC_COLOUR: Record<Topic, string> = {
  'Number': '#7c3aed',
  'Algebra': colors.primary,
  'Shape and Space': '#ea580c',
  'Ratio and Proportion': '#0891b2',
  'Probability and Data': colors.success,
}

export default function ClassAnalytics({ classId }: { classId: string }) {
  const [data, setData] = useState<ClassAnalytics | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let live = true
    setState('loading')
    getClassAnalytics(classId)
      .then(d => { if (live) { setData(d); setState('ready') } })
      .catch(() => { if (live) setState('error') })
    return () => { live = false }
  }, [classId])

  if (state === 'loading') {
    return <div style={card}><h2 style={sectionTitle}>Class mastery</h2><p style={hint}>Loading…</p></div>
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

  const liveTopics = TOPICS.filter(t => data.topics[t] !== undefined)
  // most mastered first, then most active
  const ranked = [...data.students].sort(
    (a, b) => (b.mastered - a.mastered) || (b.mastered + b.needsPractice - a.mastered - a.needsPractice),
  )

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h2 style={sectionTitle}>Class mastery</h2>
        <span style={{ fontSize: font.sm, color: colors.textHint }}>
          {data.studentsWithData} of {data.studentCount} active
        </span>
      </div>

      {data.studentsWithData === 0 ? (
        <p style={hint}>
          No skills with evidence yet. Once students practise or complete assignments, the skills they&apos;ve mastered or need practice on will appear here.
        </p>
      ) : (
        <>
          {/* ── Class totals per topic (counts, not %) ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 4px' }}>
            {liveTopics.map(t => {
              const c = data.topics[t]!
              return (
                <div key={t} style={{ flex: '1 1 150px', minWidth: 150, padding: '8px 10px', borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: TOPIC_COLOUR[t], marginBottom: 4 }}>{t}</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ fontSize: font.lg, fontWeight: 700, color: colors.successText }}>{c.mastered}<span style={countLabel}> mastered</span></span>
                    {c.needsPractice > 0 && (
                      <span style={{ fontSize: font.lg, fontWeight: 700, color: colors.warningText }}>{c.needsPractice}<span style={countLabel}> to practise</span></span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

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

          {/* ── Per-student table (counts per topic) ── */}
          <div style={{ marginTop: 18, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.sm }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ ...th, textAlign: 'left' }}>Student</th>
                  {liveTopics.map(t => <th key={t} style={{ ...th, color: TOPIC_COLOUR[t] }}>{t.split(' ')[0]}</th>)}
                  <th style={th}>Mastered</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(s => (
                  <tr key={s.studentId} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 500, color: colors.textPrimary, whiteSpace: 'nowrap' }}>
                      {s.displayName}{s.yearGroup && <span style={{ color: colors.textHint, fontWeight: 400 }}> · {s.yearGroup}</span>}
                      {!s.hasData && <span style={{ color: colors.textHint, fontWeight: 400, fontStyle: 'italic' }}> — no activity yet</span>}
                    </td>
                    {liveTopics.map(t => {
                      const c = s.topics[t]
                      return (
                        <td key={t} style={td}>
                          {c ? (
                            <span>
                              <span style={{ color: colors.successText, fontWeight: 700 }}>{c.mastered}</span>
                              {c.needsPractice > 0 && <span style={{ color: colors.warningText, fontWeight: 600 }}> · {c.needsPractice}</span>}
                            </span>
                          ) : <span style={{ color: colors.textHint }}>—</span>}
                        </td>
                      )
                    })}
                    <td style={{ ...td, fontWeight: 700, color: s.mastered > 0 ? colors.successText : colors.textHint }}>{s.mastered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: '11px', color: colors.textHint, margin: '12px 0 0', lineHeight: 1.5 }}>
            Counts of skills with practice or assignment evidence:{' '}
            <span style={{ color: colors.successText, fontWeight: 600 }}>mastered</span> (4+ correct in the last 5) and{' '}
            <span style={{ color: colors.warningText, fontWeight: 600 }}>needing practice</span>. Topics the class hasn&apos;t worked on don&apos;t appear — there&apos;s no overall score.
          </p>
        </>
      )}
    </div>
  )
}

const hint: React.CSSProperties = { fontSize: font.base, color: colors.textHint, margin: '8px 0 0', lineHeight: 1.6 }
const countLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 400, color: colors.textSecondary }
const th: React.CSSProperties = {
  padding: '8px 8px', textAlign: 'center', fontWeight: 600, color: colors.textSecondary,
  fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
}
const td: React.CSSProperties = { padding: '9px 8px', textAlign: 'center', verticalAlign: 'middle' }
