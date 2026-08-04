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

import { getPrerequisiteTree } from '../../lib/skills/skillGraph'
import { computeMasteryProgress, type Attempt } from '../../lib/skills/masteryProgress'
import { parseGridAnswer } from '../../lib/questions/gridDraw'
import type { Item, UnitResult, Tier } from '../../lib/exam/examPaper'
import { formatDuration } from '../../lib/exam/examTiming'
import type { CalculatorMode } from '../../lib/exam/assembler'
import GridCanvas from '../practice/GridCanvas'
import MasteryProgressCard from './MasteryProgressCard'
import { colors, font, radius, card } from '../../lib/styles'

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
  /**
   * `unknown` is the three-state band: method marks a real examiner might have
   * awarded behind a wrong answer, which we cannot see. Never folded into
   * `earned` — that stays the confirmed floor, and the recorded score with it.
   */
  score: { earned: number; total: number; unknown?: number }
  tier: Tier
  mode: CalculatorMode
  /** How the paper was sat — drives the "finished in 21 minutes" line. */
  timing?: { elapsedSeconds?: number; allowedSeconds?: number; timed?: boolean; autoSubmitted?: boolean }
  heading?: string
  /**
   * Everything the student had answered BEFORE this paper.
   *
   * The skill-progress card is a comparison, so without this there is nothing
   * to compare against and it can only report where the paper leaves them.
   * Omitted for a teacher preview, where no map is being built at all.
   */
  priorAttempts?: Attempt[]
  /** Teacher preview: nothing here is recorded, and the copy should say so. */
  preview?: boolean
  /** Shown above the score card (e.g. "2 questions are no longer available"). */
  notice?: string
  /** Renders the back link at the very top of the review. */
  onBack?: () => void
  /** Action buttons — differ per surface, so the caller supplies them. */
  footer?: React.ReactNode
}

export default function ExamReview({
  items, results, answers, score, tier, mode, timing,
  heading = 'Exam review',
  priorAttempts,
  preview = false,
  notice,
  onBack,
  footer,
}: ExamReviewProps) {
  const pct = score.total > 0 ? Math.round((score.earned / score.total) * 100) : 0
  const accent = pct >= 70 ? colors.successText : pct >= 40 ? colors.warning : colors.dangerText
  const bar = pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger

  // The three-state band. `earned` is what we can prove; `unknown` is the method
  // credit a real examiner would weigh that auto-grading cannot see. Shown as a
  // ceiling BENEATH the headline, never added to it: overstating a score is the
  // one failure that would make the number untrustworthy.
  const unknown = score.unknown ?? 0
  // Rounded to a whole mark only for display — a band reading "up to 17.8" would
  // imply a precision this estimate does not have.
  const ceiling = Math.round(score.earned + unknown)
  const showBand = unknown > 0 && ceiling > Math.round(score.earned) && score.total > 0
  const ceilingPct = Math.round((ceiling / score.total) * 100)
  // How many questions the uncertainty is spread across — "on 3 questions" is
  // concrete in a way "3.4 marks" is not.
  const uncertainUnits = items
    .flatMap(it => it.units)
    .filter(u => (results[u.key]?.marksUnknown ?? 0) > 0).length

  // A question counts as fully correct only if every one of its units is right.
  const questionsCorrect = items.filter(it => it.units.every(u => results[u.key]?.correct)).length

  // This paper's answered units, as attempts. ANSWERED only — a blank is never
  // recorded, so it must never count against a skill. Increasing timestamps
  // give the engine's recency window a stable order.
  const examAttempts = items.flatMap(it => it.units).flatMap((u, i) => {
    const r = results[u.key]
    if (!r || r.studentAnswer.trim() === '') return []
    return [{ skill_ids: u.skillIds, correct: r.correct, attempted_at: new Date(Date.now() + i * 1000).toISOString(), kind: u.kind }]
  })
  // Progress is the DIFFERENCE between the student's map before this paper and
  // after it. Without `priorAttempts` there is nothing to compare against, so
  // we fall back to measuring the paper against an empty history — honest for a
  // teacher preview or a first-ever paper, and the card says which it is.
  const progress = computeMasteryProgress(priorAttempts ?? [], examAttempts, getPrerequisiteTree)

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
        {/* Two-segment bar: solid to the confirmed score, then a hatched
            extension to the top of the band, so the uncertainty is visible as
            width rather than only as a sentence. */}
        <div style={{ background: colors.border, borderRadius: radius.full, height: 8, overflow: 'hidden', display: 'flex' }}>
          <div style={{ background: bar, height: 8, width: `${pct}%` }} />
          {showBand && (
            <div
              style={{
                height: 8, width: `${Math.max(0, ceilingPct - pct)}%`,
                backgroundImage: `repeating-linear-gradient(45deg, ${bar} 0 3px, transparent 3px 6px)`,
                opacity: 0.55,
              }}
            />
          )}
        </div>
        {showBand && (
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '10px 0 0', lineHeight: 1.6 }}>
            Likely <strong style={{ color: colors.textPrimary }}>{Math.round(score.earned)}–{ceiling}</strong> with method marks
            {uncertainUnits > 0 && <> — {uncertainUnits} answer{uncertainUnits === 1 ? '' : 's'} may have earned credit for the working</>}.
          </p>
        )}
        <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: showBand ? '6px 0 0' : '12px 0 0' }}>
          {questionsCorrect} of {items.length} question{items.length === 1 ? '' : 's'} fully correct
          {timing?.elapsedSeconds != null && <> · finished in {formatDuration(timing.elapsedSeconds)}</>}
        </p>
        <p style={{ fontSize: '11px', color: colors.textHint, margin: '4px 0 0', lineHeight: 1.6 }}>
          {showBand
            ? <>Your score counts only the marks we can confirm. A real examiner also pays for correct working behind a wrong answer — about a quarter of the marks on a real paper — so your true mark is likely a little higher.</>
            : <>A practice score across the paper — not a predicted grade.</>}
        </p>
        {timing?.autoSubmitted && (
          <p style={{ fontSize: '11px', color: colors.warningText, margin: '6px 0 0', lineHeight: 1.6 }}>
            Time ran out, so the paper was submitted as it stood. Pacing is part of the exam — try leaving the questions you get stuck on and coming back.
          </p>
        )}
      </div>

      <MasteryProgressCard progress={progress} preview={preview} />

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
                {/* The third state, in words. A student who reads "0" concludes
                    they got nothing; on a real paper they may well not have. */}
                {r.methodAwarded ? (
                  <p style={{ fontSize: font.sm, margin: '6px 0 0', color: colors.textSecondary }}>
                    Your method was right as far as it went, so this keeps {r.methodAwarded} method mark{r.methodAwarded === 1 ? '' : 's'}.
                  </p>
                ) : r.marksUnknown ? (
                  <p style={{ fontSize: font.sm, margin: '6px 0 0', color: colors.textSecondary }}>
                    We can only mark your final answer. If your working was on the right lines, a real examiner would give you method marks here.
                  </p>
                ) : null}
                {/* Multiple choice: show the list as it was sat, with the pick
                    and the right answer both marked. Reading "your answer: 12"
                    against "correct: 15" loses the fact that these were four
                    options side by side, which is what the student saw. */}
                {u.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, margin: '8px 0 2px' }}>
                    {u.options.map(opt => {
                      const picked = r.studentAnswer === opt
                      const isRight = u.correctAnswer === opt
                      return (
                        <div
                          key={opt}
                          style={{
                            display: 'flex', alignItems: 'baseline', gap: 8,
                            padding: '6px 10px', borderRadius: radius.sm, fontSize: font.sm,
                            background: colors.card,
                            border: `1px solid ${isRight ? colors.successBorder : picked ? colors.dangerBorder : colors.border}`,
                            color: colors.textPrimary,
                            fontWeight: isRight || picked ? 700 : 400,
                          }}
                        >
                          <span aria-hidden="true" style={{ color: isRight ? colors.successText : picked ? colors.dangerText : colors.textHint }}>
                            {isRight ? '✓' : picked ? '✗' : '·'}
                          </span>
                          <span dangerouslySetInnerHTML={{ __html: opt }} />
                          {picked && <span style={{ fontSize: '11px', color: colors.textHint }}>your answer</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
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
                {/* Redundant under an options list, which already marks both. */}
                {!u.options && (
                  <p style={{ fontSize: font.sm, margin: '6px 0 0', color: colors.textSecondary }}>
                    Your answer: <strong><span dangerouslySetInnerHTML={{ __html: r.studentAnswer || '—' }} /></strong>
                    {!r.correct && <> · Correct: <strong><span dangerouslySetInnerHTML={{ __html: r.correctAnswer }} /></strong></>}
                  </p>
                )}
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
