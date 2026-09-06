'use client'

import { topicColourFor } from '../../lib/demoTopicColours'
import type { ClassSummary } from '../../lib/papers/classSummary'
import { colors, font, radius, card as cardStyle, sectionTitle } from '../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// The class view, shared by the free marking page and the class papers page.
//
// One component on purpose. These two screens had drifted — the dashboard grew
// its own "where the class struggled" block ranked by how many STUDENTS missed
// each question, while /mark ranked by MARKS the class lost. Both are real
// signals and a teacher moving between the screens should not have to work out
// which one they are looking at, so this shows both and ranks by marks.
//
// WHY MARKS LOST DECIDES THE ORDER: a one-mark question everybody missed costs
// the class less than a five-mark question half of them fumbled, and it is the
// second that is worth a lesson. The student count is shown alongside because
// "3 of 4 dropped a mark" is the more legible fact once you are looking.
//
// Presentation only. Everything here comes from buildClassSummary, which is
// pure and derived from the same evidence as the students' sheets.
// ─────────────────────────────────────────────────────────────────────────────

/** One figure in the header row. */
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div style={{ fontSize: font.sm, color: colors.textSecondary, fontWeight: '600' }}>{label}</div>
      <div style={{ fontSize: font['2xl'], fontWeight: '700', color: colors.textPrimary, lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: font.sm, color: colors.textHint }}>{sub}</div>}
    </div>
  )
}

export default function ClassView({
  summary,
  title = 'The class so far',
  note,
  maxQuestions = 6,
}: {
  summary: ClassSummary
  title?: string
  note?: string
  maxQuestions?: number
}) {
  if (!summary.students) return null

  const worst = summary.questions.filter(q => q.marksLost > 0).slice(0, maxQuestions)

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <h2 style={{ ...sectionTitle, marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 14px' }}>
        {note ?? `From the ${summary.students} student${summary.students === 1 ? '' : 's'} marked so far. This is for you — it is not on the students' sheets.`}
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 18 }}>
        <Stat label="Average" value={`${summary.mean} / ${summary.marksAvailable}`} sub={`${summary.meanPercentage}%`} />
        <Stat label="Median" value={String(summary.median)} />
        <Stat label="Lowest" value={String(summary.lowest)} />
        <Stat label="Highest" value={String(summary.highest)} />
      </div>

      {summary.coverage && (
        <p style={{ fontSize: font.sm, color: colors.textHint, margin: '-8px 0 16px' }}>
          Based on {summary.coverage.itemsAssessed} of {summary.coverage.itemsOnPaper} questions
          ({summary.coverage.marksAssessed} of {summary.coverage.marksOnPaper} marks).
        </p>
      )}

      {/* Topics in PAPER order, not ranked — a teacher reads this down the page. */}
      <h3 style={{ fontSize: font.md, fontWeight: '700', margin: '0 0 8px' }}>By topic</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
        {summary.topics.map(t => {
          const c = topicColourFor(t.label)
          const pct = Math.round(t.ratio * 100)
          return (
            <div key={t.topicId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ minWidth: 150, fontSize: font.base, color: colors.textPrimary }}>{t.label}</span>
              <div style={{ flex: 1, height: 10, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden', minWidth: 80 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: c.fg }} />
              </div>
              <span style={{ minWidth: 100, textAlign: 'right', fontSize: font.sm, color: colors.textSecondary }}>
                {t.earned}/{t.possible} · {pct}%
              </span>
            </div>
          )
        })}
      </div>

      <h3 style={{ fontSize: font.md, fontWeight: '700', margin: '0 0 4px' }}>Questions to revisit</h3>
      <p style={{ fontSize: font.sm, color: colors.textHint, margin: '0 0 8px' }}>
        Ordered by the marks the class lost, so the biggest lesson is first.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {worst.map(q => {
          const droppedSomething = summary.students - q.fullMarks
          return (
            <div key={q.itemId} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
              background: colors.cardAlt, borderRadius: radius.md, border: `1px solid ${colors.border}`,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontWeight: '700', color: colors.dangerText, minWidth: 46 }}>
                −{q.marksLost}
              </span>
              <span style={{ flex: 1, fontSize: font.base, color: colors.textPrimary, minWidth: 180 }}>
                <strong>Q{q.label}</strong> — {q.skill}
                {q.desc && <span style={{ color: colors.textSecondary }}> · {q.desc}</span>}
              </span>
              <span style={{ fontSize: font.sm, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                {q.earned}/{q.possible} · {droppedSomething} of {summary.students} dropped a mark
                {q.zero > 0 && `, ${q.zero} scored 0`}
              </span>
            </div>
          )
        })}
        {!worst.length && (
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Nothing dropped yet — every mark entered so far is a full mark.
          </p>
        )}
      </div>
    </div>
  )
}
