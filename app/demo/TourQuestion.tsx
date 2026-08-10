'use client'

import { useState } from 'react'
import { trackEvent } from '../../lib/analytics'
import { renderOne, type DemoQ, type Rendered } from '../../lib/demoQuestions'
import { checkAnswer } from '../../lib/questions/answerChecker'
import { skillsById } from '../../lib/skills/skillGraph'
import { colors, font, radius } from '../../lib/styles'

/**
 * The tour's stop-1 question — the same live bank and the same grader as the
 * landing page's demo, with the conversion furniture stripped out.
 *
 * Kept separate from the landing page's version rather than shared: that one is
 * a tuned funnel (progress modal at three answers, sign-up nudge, its own
 * copy), and the tour needs the opposite — a single clean "get it wrong on
 * purpose" moment that then points at stop 2. Both call the same renderOne /
 * checkAnswer, so there is one grader, not two.
 *
 * The first question arrives pre-rendered from the server. Re-rendering it here
 * would draw different random parameters from the ones in the server's HTML and
 * React would report a hydration mismatch; only next() draws fresh values.
 */
export default function TourQuestion({ initialPool, initialQuestion }: {
  initialPool: DemoQ[]
  initialQuestion: Rendered | null
}) {
  const [cursor, setCursor] = useState(0)
  const [current, setCurrent] = useState<Rendered | null>(initialQuestion)
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<{ correct: boolean; trapped: boolean; html: string } | null>(null)
  const [answered, setAnswered] = useState(0)

  function check() {
    if (!current || !raw.trim()) return
    const res = checkAnswer(
      raw, current.answer, current.q.answer_type, current.q.tolerance,
      current.traps, current.q.requires_simplest ?? false,
    )
    setResult({
      correct: res.correct,
      trapped: !res.correct && !!res.trap,
      html: res.correct
        ? (current.explanationHtml || `The answer is <strong>${current.answer}</strong>.`)
        : (res.trap?.response || `Not quite — the correct answer is <strong>${current.answer}</strong>.`),
    })
    const next = answered + 1
    setAnswered(next)
    trackEvent('tour_question_answered', {
      answered: next, correct: res.correct, trapped: !res.correct && !!res.trap,
      skill_id: current.q.skill_ids?.[0] ?? null,
    })
  }

  function next() {
    if (initialPool.length === 0) return
    const nc = (cursor + 1) % initialPool.length
    setCursor(nc)
    setCurrent(renderOne(initialPool[nc]))
    setRaw(''); setResult(null)
  }

  /** Re-rolls the SAME skill with fresh numbers, matching /practice. */
  function retry() {
    if (!current) return
    setCurrent(renderOne(current.q))
    setRaw(''); setResult(null)
  }

  const skill = current ? skillsById[current.q.skill_ids?.[0]] : null

  if (!current) {
    return (
      <div style={{
        background: colors.cardAlt, border: `1px solid ${colors.border}`,
        borderRadius: radius.md, padding: '28px 20px', textAlign: 'center',
      }}>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          The live question could not load. Every question is also playable at{' '}
          <a href="/practice" style={{ color: colors.primary, fontWeight: 700 }}>/practice</a>.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: 'hidden' }}>
      <div style={{
        background: `${colors.primary}0f`, borderBottom: `1px solid ${colors.border}`,
        padding: '9px 16px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Live question from the bank
        </span>
        <span style={{ fontSize: font.sm, color: colors.textHint }}>
          {skill ? `${skill.topic} · ${skill.name}` : 'GCSE Maths'}
        </span>
      </div>

      <div style={{ padding: '20px' }}>
        <div
          style={{ fontSize: font.lg, color: colors.textPrimary, margin: '0 0 18px', lineHeight: 1.65 }}
          dangerouslySetInnerHTML={{ __html: current.questionHtml }}
        />

        {!result && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={raw}
              onChange={e => setRaw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="Type an answer — right or wrong"
              style={{
                flex: '1 1 200px', boxSizing: 'border-box', padding: '11px 14px',
                border: `1.5px solid ${colors.borderStrong}`, borderRadius: radius.md,
                fontSize: font.lg, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={check}
              style={{
                background: colors.primary, color: '#fff', border: 'none', borderRadius: radius.md,
                padding: '0 22px', fontSize: font.lg, fontWeight: '700', cursor: 'pointer',
                fontFamily: 'inherit', minHeight: 44,
              }}
            >
              Check →
            </button>
          </div>
        )}

        {result && (
          <div style={{
            background: result.correct ? colors.successLight : colors.dangerLight,
            border: `1px solid ${result.correct ? colors.successBorder : colors.dangerBorder}`,
            borderRadius: radius.md, padding: '14px 16px',
          }}>
            <p style={{
              fontSize: font.lg, fontWeight: '700', margin: '0 0 6px',
              color: result.correct ? colors.successText : colors.dangerText,
            }}>
              {result.correct ? '✓ Correct' : '✗ Not quite'}
            </p>
            <div
              style={{ fontSize: font.base, color: colors.textPrimary, margin: '0 0 12px', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: result.html }}
            />
            {result.trapped && (
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 12px', fontStyle: 'italic' }}>
                That response was written for that specific mistake — it is not a generic
                &ldquo;wrong, try again&rdquo;.
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={retry}
                style={{
                  background: 'transparent', color: colors.textPrimary,
                  border: `1.5px solid ${colors.borderStrong}`, borderRadius: radius.md,
                  padding: '8px 16px', fontSize: font.base, fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Same skill, new numbers
              </button>
              <button
                onClick={() => { trackEvent('tour_next_question_clicked'); next() }}
                style={{
                  background: colors.primary, color: '#fff', border: 'none', borderRadius: radius.md,
                  padding: '8px 16px', fontSize: font.base, fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Another question →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
