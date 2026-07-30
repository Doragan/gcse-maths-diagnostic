'use client'

/**
 * The post-paper review: score card, projected skill mastery, and a per-unit
 * breakdown with marks, trap feedback, grid overlays and explanations.
 *
 * Shared deliberately by TWO surfaces so they can never drift: the live runner
 * renders it straight after submit from in-memory state, and the re-review page
 * renders it from a stored paper rebuilt by lib/exam/examSession.ts. Both hand
 * it the same shape, so "what I saw when I submitted" and "what I see when I
 * re-open it" are the same screen.
 */

import { skillsById, getPrerequisiteTree } from '../../lib/skills/skillGraph'
import { calculateMastery, applyPrerequisiteCredit, type MasteryStatus } from '../../lib/skills/masteryEngine'
import { parseGridAnswer } from '../../lib/questions/gridDraw'
import type { Item, UnitResult, Tier } from '../../lib/exam/examPaper'
import type { CalculatorMode } from '../../lib/exam/assembler'
import GridCanvas from '../practice/GridCanvas'
import { colors, font, radius, card } from '../../lib/styles'

const STATUS_META: Record<MasteryStatus, { label: string; bg: string; color: string; border: string }> = {
  mastered:       { label: 'Mastered',       bg: colors.successLight, color: colors.successText, border: colors.successBorder },
  in_progress:    { label: 'In progress',    bg: colors.warningLight, color: colors.warningText, border: colors.warningBorder },
  needs_practice: { label: 'Needs practice', bg: colors.dangerLight,  color: colors.dangerText,  border: colors.dangerBorder },
}
const STATUS_RANK: Record<MasteryStatus, number> = { mastered: 0, in_progress: 1, needs_practice: 2 }

/**
 * The way OUT of any exam screen, always the first thing on the page.
 *
 * Exported so every exam surface uses the same control in the same place — it
 * used to sit at the bottom on some screens and the top on others, which meant
 * hunting for it after a long paper.
 */
export function BackToDashboard({ onClick, label = '← Back to dashboard' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer',
        padding: '2px 0', fontSize: font.base, color: colors.textSecondary,
      }}
    >
      {label}
    </button>
  )
}

export type ExamReviewProps = {
  items: Item[]
  results: Record<string, UnitResult>
  /** Raw answers by unit key — the grid canvas re-draws the student's points. */
  answers: Record<string, string>
  score: { earned: number; total: number }
  tier: Tier
  mode: CalculatorMode
  heading?: string
  /** Caption under "Projected skill mastery" — tense differs live vs re-opened. */
  projectedCaption?: string
  /** Shown above the score card (e.g. "2 questions are no longer available"). */
  notice?: string
  /** Renders the back link at the very top of the review. */
  onBack?: () => void
  /** Action buttons — differ per surface, so the caller supplies them. */
  footer?: React.ReactNode
}

export default function ExamReview({
  items, results, answers, score, tier, mode,
  heading = 'Exam review',
  projectedCaption = 'What completing this paper would do to a student’s skill map, from no prior practice. One paper mostly moves skills to in progress — mastery is confirmed over repeated sessions.',
  notice,
  onBack,
  footer,
}: ExamReviewProps) {
  const pct = score.total > 0 ? Math.round((score.earned / score.total) * 100) : 0
  const accent = pct >= 70 ? colors.successText : pct >= 40 ? colors.warning : colors.dangerText
  const bar = pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger

  // A question counts as fully correct only if every one of its units is right.
  const questionsCorrect = items.filter(it => it.units.every(u => results[u.key]?.correct)).length

  // Projected skill mastery — run this paper's answered units through the SAME
  // engine a student's practice attempts use, from a blank slate, to show what
  // completing the mini-exam does to a skill map. Correct answers also credit
  // prerequisite skills (exam-kind is positive-only, handled by the engine).
  // Attempts from ANSWERED units only (a blank is never recorded, so it never
  // penalises); increasing timestamps for the engine's recency window.
  const examAttempts = items.flatMap(it => it.units).flatMap((u, i) => {
    const r = results[u.key]
    if (!r || r.studentAnswer.trim() === '') return []
    return [{ skill_ids: u.skillIds, correct: r.correct, attempted_at: new Date(Date.now() + i * 1000).toISOString(), kind: u.kind }]
  })
  const directMastery = calculateMastery(examAttempts)
  const projectedRows = Object.values(directMastery)
    .map(m => ({ ...m, name: skillsById[m.skillId]?.name ?? m.skillId }))
    .sort((a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      (b.recentCorrect / b.recentAttempts) - (a.recentCorrect / a.recentAttempts) ||
      a.name.localeCompare(b.name))
  // Prerequisite skills a correct answer additionally reinforces (credited but
  // not directly tested) — the inference engine's positive spillover.
  const withCredit = calculateMastery(applyPrerequisiteCredit(examAttempts, getPrerequisiteTree))
  const reinforcedCount = Object.keys(withCredit).filter(id => !directMastery[id]).length

  return (
    <>
      {onBack && <BackToDashboard onClick={onBack} />}
      <h1 style={{ fontSize: font['2xl'], fontWeight: 700, margin: 0, color: colors.textPrimary }}>{heading}</h1>

      {notice && (
        <div style={{ ...card, background: colors.warningLight, border: `1px solid ${colors.warningBorder}` }}>
          <p style={{ fontSize: font.sm, color: colors.warningText, margin: 0 }}>{notice}</p>
        </div>
      )}

      <div style={{ ...card, textAlign: 'center' }}>
        <p style={{ fontSize: font.sm, fontWeight: 700, color: colors.textHint, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {tier === 'higher' ? 'Higher' : 'Foundation'} · {mode === 'calc' ? 'Calculator' : 'Non-calculator'}
        </p>
        <p style={{ fontSize: 48, fontWeight: 800, margin: '0 0 2px', color: accent, lineHeight: 1 }}>{score.earned} / {score.total}</p>
        <p style={{ fontSize: font.lg, color: colors.textSecondary, margin: '0 0 12px' }}>marks · {pct}%</p>
        <div style={{ background: colors.border, borderRadius: radius.full, height: 8, overflow: 'hidden' }}>
          <div style={{ background: bar, height: 8, borderRadius: radius.full, width: `${pct}%` }} />
        </div>
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '12px 0 0' }}>
          {questionsCorrect} of {items.length} question{items.length === 1 ? '' : 's'} fully correct
        </p>
        <p style={{ fontSize: '11px', color: colors.textHint, margin: '4px 0 0' }}>
          A practice score across the paper — not a predicted grade.
        </p>
      </div>

      {projectedRows.length > 0 && (
        <div style={card}>
          <h2 style={{ fontSize: font.lg, fontWeight: 700, margin: '0 0 4px', color: colors.textPrimary }}>Projected skill mastery</h2>
          <p style={{ fontSize: '11px', color: colors.textHint, margin: '0 0 14px', lineHeight: 1.6 }}>{projectedCaption}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projectedRows.map(s => {
              const meta = STATUS_META[s.status]
              return (
                <div key={s.skillId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: font.sm, color: colors.textPrimary }}>{s.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: colors.textHint }}>{s.recentCorrect}/{s.recentAttempts} correct</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: radius.full, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                  </span>
                </div>
              )
            })}
          </div>
          {reinforcedCount > 0 && (
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '12px 0 0' }}>
              + {reinforcedCount} prerequisite skill{reinforcedCount === 1 ? '' : 's'} reinforced by correct answers.
            </p>
          )}
        </div>
      )}

      {items.map(item => (
        <div key={item.questionId} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: font.sm, fontWeight: 700, color: colors.textSecondary }}>Question {item.number}</span>
            <span style={{ fontSize: font.sm, color: colors.textHint }}>{item.skillNames}</span>
          </div>
          {item.imageUrl && <img src={item.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: radius.md, marginBottom: 10, display: 'block' }} />}
          <div style={{ fontSize: font.lg, color: colors.textPrimary, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: item.headerHtml }} />
          {item.units.map(u => {
            const r = results[u.key]
            if (!r) return null
            // Three-state credit: full (success) / partial (warning) / zero
            // (danger) — partial only arises on grid units.
            // Three-state credit: full / partial (grid part-marks, or a banded
            // multi_blank part scoring below its top band) / zero. A
            // follow-through blank is deliberately AMBER rather than green: it
            // earned its method mark, but the value itself is not the right one,
            // and showing it green would teach the wrong answer.
            const state = r.followThrough ? 'partial'
              : r.marksEarned >= u.marks ? 'full'
              : r.marksEarned > 0 ? 'partial'
              : 'zero'
            const bg = state === 'full' ? colors.successLight : state === 'partial' ? colors.warningLight : colors.dangerLight
            const bd = state === 'full' ? colors.successBorder : state === 'partial' ? colors.warningBorder : colors.dangerBorder
            const tx = state === 'full' ? colors.successText : state === 'partial' ? colors.warningText : colors.dangerText
            return (
              <div key={u.key} style={{ marginTop: 12, padding: 12, borderRadius: radius.md, background: bg, border: `1px solid ${bd}` }}>
                {/* Label shown even with an empty prompt so a multi_blank
                    part's later blanks ("(a) · B") stay identifiable. */}
                {(u.promptHtml || u.label) && <div style={{ fontSize: font.base, color: colors.textPrimary, marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: `${u.label ?? ''} ${u.promptHtml}` }} />}
                <p style={{ fontSize: font.sm, fontWeight: 700, margin: '0 0 4px', color: tx }}>
                  {/* A banded multi_blank part carries all its marks on its
                      FIRST blank, so the others would read a meaningless "0/0".
                      They show a bare tick or cross; the part's marks appear
                      once, against the first blank. */}
                  {u.marks === 0
                    ? (r.correct ? (r.followThrough ? '~ correct (followed through)' : '✓ correct') : '✗')
                    : state === 'full' ? `✓ ${u.marks}/${u.marks}`
                    : state === 'partial' ? `~ ${r.marksEarned}/${u.marks}`
                    : `✗ 0/${u.marks}`}
                </p>
                <div style={{ fontSize: font.sm, color: tx }} dangerouslySetInnerHTML={{ __html: r.message }} />
                {u.grid && r.studentAnswer && (
                  <div style={{ margin: '8px 0' }}>
                    <GridCanvas
                      grid={u.grid}
                      value={parseGridAnswer(answers[u.key] ?? '')}
                      readOnly
                      showCanonical
                      perElement={r.perStudent}
                    />
                    <p style={{ fontSize: font.sm, margin: '4px 0 0', color: colors.textHint }}>
                      Your points shown solid · the correct answer is shown dashed
                    </p>
                  </div>
                )}
                <p style={{ fontSize: font.sm, margin: '6px 0 0', color: colors.textSecondary }}>
                  Your answer: <strong><span dangerouslySetInnerHTML={{ __html: r.studentAnswer || '—' }} /></strong>
                  {!r.correct && <> · Correct: <strong><span dangerouslySetInnerHTML={{ __html: r.correctAnswer }} /></strong></>}
                </p>
                {r.explanation && (
                  <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: radius.sm, background: colors.card, border: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: font.sm, color: colors.textPrimary }} dangerouslySetInnerHTML={{ __html: r.explanation }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {footer}
    </>
  )
}
