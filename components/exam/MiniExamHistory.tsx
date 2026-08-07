'use client'

/**
 * Past mini-exams: the score-over-time trend, then each paper with its date,
 * type and score, linking to the full re-review.
 *
 * Renders from the pinned summary columns ONLY — never re-grading a stored
 * paper — so a long history stays cheap and the listed score always matches the
 * score that was recorded on the day. The trend shares this one fetch.
 *
 * Self-fetching, and renders nothing at all when the student has sat no papers
 * (or when the table is missing, so it is safe to deploy before the migration).
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { buildScoreTrend } from '../../lib/exam/scoreTrend'
import ScoreTrend from './ScoreTrend'
import { colors, font, radius, card, sectionTitle } from '../../lib/styles'

type Row = {
  id: string
  created_at: string
  tier: 'foundation' | 'higher'
  calculator: 'calc' | 'non_calc'
  marks_earned: number
  marks_total: number
}

export default function MiniExamHistory({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [rows, setRows] = useState<Row[] | null>(null)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('id, created_at, tier, calculator, marks_earned, marks_total')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20)
      // An error here (most likely: migration not yet applied) degrades to
      // "no history" rather than breaking the dashboard.
      setRows(error ? [] : (data as Row[]))
    })()
  }, [studentId])

  if (!rows || rows.length === 0) return null

  // Null until a second paper exists — one paper is a score, not a trend.
  const trend = buildScoreTrend(rows)

  return (
    <section style={card}>
      <h2 style={{ ...sectionTitle, margin: '0 0 4px' }}>Your past papers</h2>
      <p style={{ fontSize: '11px', color: colors.textHint, margin: '0 0 14px' }}>
        {trend
          ? 'Tap a paper to see your answers again.'
          : 'Practice scores across a whole paper — not predicted grades. Tap one to see your answers again. Sit another paper to start seeing your score over time.'}
      </p>
      {trend && (
        <div style={{ marginBottom: 18 }}>
          <ScoreTrend trend={trend} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => {
          const pct = r.marks_total > 0 ? Math.round((r.marks_earned / r.marks_total) * 100) : 0
          const accent = pct >= 70 ? colors.successText : pct >= 40 ? colors.warning : colors.dangerText
          const sat = new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          return (
            <button
              key={r.id}
              onClick={() => router.push(`/student/exam/${r.id}`)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                width: '100%', textAlign: 'left', cursor: 'pointer',
                padding: '10px 12px', borderRadius: radius.md,
                border: `1px solid ${colors.border}`, background: colors.background,
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: font.base, color: colors.textPrimary, fontWeight: 600 }}>{sat}</span>
                <span style={{ fontSize: '11px', color: colors.textHint }}>
                  {r.tier === 'higher' ? 'Higher' : 'Foundation'} · {r.calculator === 'calc' ? 'Calculator' : 'Non-calculator'}
                </span>
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: font.lg, fontWeight: 800, color: accent }}>{pct}%</span>
                <span style={{ fontSize: '11px', color: colors.textHint }}>{r.marks_earned}/{r.marks_total}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
