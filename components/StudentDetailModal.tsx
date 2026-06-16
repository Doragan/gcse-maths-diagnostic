'use client'

import { type StudentAnalytics, type Topic, type SkillStatus, TOPICS } from '../lib/teacherAnalytics'
import ClassMasteryTrend from './ClassMasteryTrend'
import { colors, font, radius } from '../lib/styles'

const TOPIC_COLOUR: Record<Topic, string> = {
  'Number': '#7c3aed',
  'Algebra': colors.primary,
  'Shape and Space': '#ea580c',
  'Ratio and Proportion': '#0891b2',
  'Probability and Data': colors.success,
}
const bCol = (p: number) => (p >= 70 ? colors.success : p >= 40 ? colors.warning : colors.danger)
const bBg  = (p: number) => (p >= 70 ? colors.successLight : p >= 40 ? colors.warningLight : colors.dangerLight)
const bTxt = (p: number) => (p >= 70 ? colors.successText : p >= 40 ? colors.warningText : colors.dangerText)

const STATUS_META: Record<SkillStatus, { bg: string; colour: string }> = {
  mastered:       { bg: colors.successLight, colour: colors.successText },
  needs_practice: { bg: colors.warningLight, colour: colors.warningText },
  in_progress:    { bg: colors.cardAlt,      colour: colors.textSecondary },
}

function ago(iso: string | null): string {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const w = Math.floor(days / 7)
  return w === 1 ? 'last week' : `${w} weeks ago`
}

/** A teacher-facing version of the student dashboard, in a modal. */
export default function StudentDetailModal({ s, onClose }: { s: StudentAnalytics; onClose: () => void }) {
  const topicRows = TOPICS.filter(t => s.topicMastery[t] !== undefined)

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: colors.card, borderRadius: radius.lg, maxWidth: 640, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: `1px solid ${colors.border}`, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}
      >
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: font.xl, fontWeight: 700, margin: 0, color: colors.textPrimary }}>
            {s.displayName}{s.yearGroup && <span style={{ fontSize: font.sm, color: colors.textHint, fontWeight: 400 }}> · {s.yearGroup}</span>}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: font.xl, cursor: 'pointer', color: colors.textSecondary, padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        {/* body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* overall mastery + engagement */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{
              fontSize: font['3xl'], fontWeight: 700, lineHeight: 1.1, padding: '8px 18px', borderRadius: radius.lg,
              color: s.overallMastery !== null ? bCol(s.overallMastery) : colors.textHint,
              background: s.overallMastery !== null ? bBg(s.overallMastery) : colors.cardAlt,
              border: `1px solid ${colors.border}`,
            }}>
              {s.overallMastery !== null ? `${s.overallMastery}%` : '—'}
            </div>
            <div>
              <div style={{ fontSize: font.md, fontWeight: 600, color: colors.textPrimary }}>
                Curriculum mastery · {s.masteredSkills} skill{s.masteredSkills === 1 ? '' : 's'} mastered
              </div>
              <div style={{ fontSize: font.sm, color: colors.textSecondary, marginTop: 2 }}>
                {s.questionsThisWeek} answered this week · {s.totalQuestions} total · last active {ago(s.lastActive)}
              </div>
            </div>
          </div>

          {/* mastery over time (reuses the class trend chart) */}
          <ClassMasteryTrend points={s.timeline} title="Mastery over time" caption="This student's % of the curriculum mastered, by week." />

          {/* topic mastery bars */}
          <div style={{ fontSize: font.md, fontWeight: 700, color: colors.textPrimary, margin: '18px 0 8px' }}>Topic mastery</div>
          {topicRows.length === 0 ? (
            <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>No skills attempted yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8, marginBottom: 18 }}>
              {topicRows.map(t => {
                const p = s.topicMastery[t]!
                return (
                  <div key={t} style={{ padding: '8px 10px', borderRadius: radius.sm, border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: font.sm, fontWeight: 600, color: TOPIC_COLOUR[t] }}>{t}</span>
                      <span style={{ fontSize: font.sm, fontWeight: 700, color: bTxt(p) }}>{p}%</span>
                    </div>
                    <div style={{ height: 5, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: radius.full, width: `${p}%`, background: TOPIC_COLOUR[t] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* skills grouped by topic, tinted by status */}
          {s.skillDetail.length > 0 && (
            <>
              <div style={{ fontSize: font.md, fontWeight: 700, color: colors.textPrimary, margin: '0 0 8px' }}>Skills</div>
              {topicRows.map(t => {
                const inTopic = s.skillDetail.filter(d => d.topic === t)
                if (inTopic.length === 0) return null
                return (
                  <div key={t} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: font.sm, fontWeight: 700, color: TOPIC_COLOUR[t], marginBottom: 4 }}>{t}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {inTopic.map(d => {
                        const m = STATUS_META[d.status]
                        return (
                          <span key={d.skillId} style={{ fontSize: font.sm, padding: '2px 8px', borderRadius: radius.sm, background: m.bg, color: m.colour }}>
                            {d.name}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: '11px', color: colors.textHint }}>
                <span><span style={{ color: colors.successText }}>■</span> mastered</span>
                <span><span style={{ color: colors.warningText }}>■</span> needs practice</span>
                <span><span style={{ color: colors.textSecondary }}>■</span> in progress</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
