'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  renderQuestion, type Parameters, type RenderedQuestion, type TrapTemplate,
} from '../../lib/questions/paramEngine'
import { checkAnswer } from '../../lib/questions/answerChecker'
import { isScalarAnswerType, type ScalarAnswerType } from '../../lib/questions/answerTypes'
import { colors, font, radius, primaryButton, secondaryButton } from '../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// One question from the bank, rendered and marked wherever it is needed.
//
// Written for the investigation's section checks, which used to carry their own
// hand-authored questions. Those duplicated the bank and got none of what makes
// a bank question good: parameters, the verification harness, and above all the
// authored TRAPS, which say why a particular wrong answer is wrong and carry
// the misconception id that reaches the teacher's Common mistakes surface.
//
// WHAT THIS DELIBERATELY DOES NOT DO: record an attempt. A question answered
// while the explanation is still on the screen is not evidence of independent
// mastery, which is the whole reason an investigation ends by handing the
// student to the real practice loop instead. Nothing here touches
// practice_attempts; the caller is told the outcome and decides what it means.
//
// It handles SCALAR answer types only. A multi-part or grid_draw question is
// refused rather than half-rendered — see MultiPartQuestion and GridCanvas.
// ─────────────────────────────────────────────────────────────────────────────

type Row = {
  id: string
  question_template: string
  answer_template: string
  answer_type: string
  tolerance: number | null
  requires_simplest: boolean | null
  parameters: Parameters | null
  traps: TrapTemplate[] | null
  explanation: string | null
  answer_subjects: string[] | null
  parts: unknown
}

export type BankQuestionOutcome = {
  questionId: string
  correct: boolean
  /** The misconception the authored trap names, when one matched. */
  misconception: string | null
}

type Props = {
  questionId: string
  /** Called once per submitted answer. The caller decides what it counts for. */
  onAnswered?: (outcome: BankQuestionOutcome) => void
  /** Offered after an answer: the same question on fresh numbers. */
  allowAnother?: boolean
}

export default function BankQuestion({ questionId, onAnswered, allowAnother = true }: Props) {
  const [row, setRow] = useState<Row | null>(null)
  const [failed, setFailed] = useState(false)
  const [rendered, setRendered] = useState<RenderedQuestion | null>(null)
  const [typed, setTyped] = useState('')
  const [verdict, setVerdict] = useState<
    { correct: boolean; answer: string; response: string | null } | null
  >(null)

  /**
   * Draw a fresh set of parameter values and render the question against them.
   *
   * Through the engine's own renderQuestion, which is what the practice page
   * uses. Rendering the prompt and answer by hand is not enough: a trap in the
   * bank carries an answer TEMPLATE, and checkAnswer normalises trap.answer,
   * so handing it unrendered rows throws on undefined — which is exactly what
   * the first version of this component did.
   */
  const roll = useCallback((q: Row) => {
    setRendered(renderQuestion(
      q.question_template,
      q.answer_template,
      q.traps ?? [],
      q.explanation,
      q.parameters ?? {},
    ))
    setTyped('')
    setVerdict(null)
  }, [])

  useEffect(() => {
    let live = true
    ;(async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_template, answer_template, answer_type, tolerance, '
          + 'requires_simplest, parameters, traps, parts, explanation, answer_subjects')
        .eq('id', questionId)
        .eq('is_published', true)
        .maybeSingle()
      if (!live) return
      const q = data as unknown as Row | null
      if (error || !q || q.parts || !isScalarAnswerType(q.answer_type)) {
        setFailed(true)
        return
      }
      setRow(q)
      roll(q)
    })()
    return () => { live = false }
  }, [questionId, roll])

  // A check that cannot load is not worth a broken box on the page: the
  // section simply carries one question fewer.
  if (failed) return null
  if (!row || !rendered) {
    return <p style={styles.loading}>Loading a question…</p>
  }

  function submit() {
    if (!row || !rendered || verdict || !typed.trim()) return
    const result = checkAnswer(
      typed.trim(),
      rendered.answer,
      row.answer_type as ScalarAnswerType,
      row.tolerance,
      // The RENDERED traps, so each one's answer is a value rather than a
      // template — the same thing the practice page passes.
      rendered.traps,
      row.requires_simplest ?? false,
      row.answer_template,
      row.answer_subjects ?? undefined,
    )
    setVerdict({
      correct: result.correct,
      answer: rendered.answer,
      // The authored trap's own words where one matched — the reason to use a
      // bank question here at all.
      response: result.trap?.response ?? null,
    })
    onAnswered?.({
      questionId: row.id,
      correct: result.correct,
      misconception: result.trap?.misconception ?? null,
    })
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.prompt} dangerouslySetInnerHTML={{ __html: rendered.question }} />

      <div style={styles.row}>
        <input
          type="text"
          value={typed}
          disabled={!!verdict}
          onChange={e => setTyped(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          placeholder="Your answer"
          aria-label="Your answer"
          style={styles.input}
        />
        {!verdict && (
          <button style={{ ...primaryButton, width: 'auto' }} onClick={submit}>
            Check
          </button>
        )}
        {verdict && allowAnother && (
          <button
            style={{ ...secondaryButton, width: 'auto' }}
            onClick={() => row && roll(row)}
          >
            Try another
          </button>
        )}
      </div>

      {verdict && (
        <div style={{
          ...styles.verdict,
          color: verdict.correct ? colors.successText : colors.warningText,
          background: verdict.correct ? colors.successLight : colors.warningLight,
          borderColor: verdict.correct ? colors.successBorder : colors.warningBorder,
        }}>
          <strong>{verdict.correct ? 'Correct. ' : 'Not quite. '}</strong>
          {verdict.correct
            ? 'That is the one.'
            // The trap's words when the wrong answer is one the author
            // anticipated; the plain answer when it is not.
            : verdict.response ?? `The answer is ${verdict.answer}.`}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '10px' },
  prompt: { fontSize: font.base, color: colors.textPrimary, lineHeight: 1.5 },
  row: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
  input: {
    minWidth: '9rem', padding: '8px 10px', fontSize: font.base, fontFamily: 'inherit',
    border: `1px solid ${colors.primary}`, borderRadius: radius.sm,
    background: colors.card, color: colors.textPrimary,
  },
  verdict: {
    fontSize: font.base, padding: '11px 13px', borderRadius: radius.sm,
    border: '1px solid', lineHeight: 1.5,
  },
  loading: { fontSize: font.sm, color: colors.textHint, margin: 0 },
}
