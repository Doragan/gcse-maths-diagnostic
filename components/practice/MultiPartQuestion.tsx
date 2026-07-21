'use client'

import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { skillsById } from '../../lib/skills/skillGraph'
import { renderMultiPartQuestion } from '../../lib/questions/paramEngine'
import { checkAnswer } from '../../lib/questions/answerChecker'
import { checkMultiBlank, type BlankCheck } from '../../lib/questions/multiBlank'
import { checkGridDraw, formatGridPoints, type GridPoint, type GridDrawMode } from '../../lib/questions/gridDraw'
import GridCanvas from './GridCanvas'
import type { QuestionPart } from '../../lib/questions/parts'
import {
  colors, font, radius, card, primaryButton, secondaryButton,
} from '../../lib/styles'
import MathInput from './MathInput'
import ReportIssueButton from './ReportIssueButton'
import FeedbackWidget from '../FeedbackWidget'
import SignUpPrompt, { registerQuestionForNudge } from './SignUpPrompt'

type MultiPartQuestionData = {
  id: string
  skill_ids: string[]
  difficulty: number
  question_template: string
  parameters: any
  image_url: string | null
  parts: QuestionPart[]
}

type PartOutcome = {
  answer: string
  correct: boolean
  message: string
  // Only for multi_blank parts: the per-blank verdicts shown in the summary box.
  // `followThrough`: correct only as a consequence of the student's own earlier
  // wrong answer (exam ECF). Shown amber — credited, but not the right value.
  blanks?: { label: string, answer: string, correct: boolean, followThrough: boolean, message: string, correctAnswer: string }[]
  // Only for grid_draw parts: the student's drawing + per-point verdicts for
  // the review overlay.
  grid?: { points: GridPoint[], perStudent: boolean[] }
  // Targeted feedback when the drawing matched an authored wrong drawing.
  // Additive — it explains the score line rather than replacing it.
  trapResponse?: string
}

type Props = {
  question: MultiPartQuestionData
  studentId: string | null
  assignmentId: string | null
  /** Bumps the parent page's live session counter + sessionStorage. */
  onSessionAttempt: (correct: boolean) => void
  /** Advance to the next question (free practice) or assignment flow. */
  onNextQuestion: () => void
  /** Remount with a fresh parameter draw (the parent bumps its reparam nonce). */
  onTryAgain: () => void
  /** Reproduce a specific draw (shared links); only applied on first mount. */
  fixedValues?: Record<string, number>
}

const PART_LETTERS = 'abcdefghijklmnopqrstuvwxyz'

export default function MultiPartQuestion({
  question, studentId, assignmentId, onSessionAttempt, onNextQuestion, onTryAgain, fixedValues,
}: Props) {
  const router = useRouter()

  // Render the stem + every part ONCE against a single shared value set, so a
  // later part can reference earlier working (e.g. {{a}}). Recomputed only when
  // the question id changes.
  const rendered = useMemo(
    () => renderMultiPartQuestion(
      question.question_template,
      question.parts.map(p => ({
        prompt: p.prompt,
        answer_template: p.answer_template,
        traps: p.traps,
        explanation: p.explanation,
        blanks: p.blanks,
        grid: p.grid,
      })),
      question.parameters ?? {},
      fixedValues,
    ),
    [question.id], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const blankCountOf = (i: number) =>
    question.parts[i]?.answer_type === 'multi_blank' ? (question.parts[i].blanks?.length ?? 0) : 0

  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  // One slot per blank of the CURRENT part (empty array for scalar parts).
  const [blankAnswers, setBlankAnswers] = useState<string[]>(
    () => Array(blankCountOf(0)).fill(''),
  )
  // Placed points for the CURRENT part when it is grid_draw.
  const [gridPoints, setGridPoints] = useState<GridPoint[]>([])
  // Wrapper divs around each blank's MathInput so Enter can hop A → B → C
  // (MathInput doesn't forward refs; degrades gracefully to the button).
  const blankRowRefs = useRef<(HTMLDivElement | null)[]>([])
  // ── Inline blanks ──────────────────────────────────────────────────────────
  // Authored HTML (stem or part prompt) can mark WHERE a blank's input belongs
  // with <span data-blank="A"></span>. We portal the input into that node, so
  // the student types straight into the table/diagram as they would on paper.
  // Portaling (rather than splitting the HTML string) keeps arbitrary nesting —
  // table rows, SVG-adjacent layout — intact. Any blank without a placeholder
  // still renders in the labelled list below, so existing questions are
  // unaffected.
  // The stem is written into the DOM by US (ref + innerHTML) rather than by
  // React via dangerouslySetInnerHTML. React re-writes a dangerouslySetInnerHTML
  // subtree on commit, which detaches any portal host inside it — the portal
  // then renders into an orphaned node and the inputs never appear. Owning the
  // subtree keeps the hosts stable. (Nothing is lost: the question is fetched
  // client-side, so this HTML was never part of the server-rendered output.)
  const stemRef = useRef<HTMLDivElement | null>(null)
  const [inlineHosts, setInlineHosts] = useState<Record<string, HTMLElement>>({})
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false)
  const [shareLabel, setShareLabel] = useState('Share this question')
  // One slot per part; null until that part is answered. Keeps each part's
  // submitted answer on screen so later parts can refer back to it.
  const [outcomes, setOutcomes] = useState<(PartOutcome | null)[]>(
    () => question.parts.map(() => null),
  )

  // Re-scan for placeholders whenever the rendered HTML or the active part
  // changes: dangerouslySetInnerHTML replaces those nodes wholesale, so any
  // previously-found host would be detached.
  useLayoutEffect(() => {
    const el = stemRef.current
    if (!el) return
    if (el.innerHTML !== rendered.stem) el.innerHTML = rendered.stem
    // Only the stem can host inline blanks — everything else stays
    // React-managed, so a placeholder there would be wiped on re-render.
    const found: Record<string, HTMLElement> = {}
    el.querySelectorAll<HTMLElement>('[data-blank]').forEach(node => {
      const label = node.getAttribute('data-blank')
      if (label) found[label] = node
    })
    setInlineHosts(prev => {
      const same = Object.keys(found).length === Object.keys(prev).length
        && Object.keys(found).every(k => prev[k] === found[k])
      return same ? prev : found
    })
  }, [rendered.stem])

  const isLastPart = current === question.parts.length - 1
  const currentAnswered = outcomes[current] !== null
  const correctCount = outcomes.filter(o => o?.correct).length
  const allAnswered = outcomes.every(o => o !== null)

  async function recordPartAttempt(part: QuestionPart, correct: boolean) {
    onSessionAttempt(correct)
    if (!studentId) return

    // One practice_attempts row per PART, carrying that part's own skill_ids
    // and kind — this is the unit of attribution the mastery engine consumes.
    const { error } = await supabase.from('practice_attempts').insert({
      student_id: studentId,
      question_id: question.id,
      skill_ids: part.skill_ids,
      correct,
      kind: part.kind ?? 'mastery',
    })
    if (error) console.error('Failed to record part attempt:', error.message) // audit L5
  }

  async function recordAssignmentRollup(allCorrect: boolean) {
    // Assignment attempts are keyed by question_id, so a multi-part question
    // contributes one row recorded when the final part is answered.
    if (!assignmentId || !studentId) return
    const { error } = await supabase.from('assignment_attempts').insert({
      assignment_id: assignmentId,
      student_id: studentId,
      question_id: question.id,
      correct: allCorrect,
    })
    if (error) console.error('Failed to record assignment rollup:', error.message) // audit L5
  }

  function submit() {
    const part = question.parts[current]
    const renderedPart = rendered.parts[current]
    if (outcomes[current]) return

    let outcome: PartOutcome
    if (part.answer_type === 'grid_draw') {
      const grid = renderedPart.grid
      if (!grid) return
      // One submit for the whole drawing — gated until every point is placed.
      if (gridPoints.length !== grid.elements.length) return
      const result = checkGridDraw(
        gridPoints,
        grid.elements,
        grid.mode as GridDrawMode,
        grid.tolerance,
        { xStep: grid.x.step, yStep: grid.y.step },
        grid.traps ?? [],
      )
      const n = grid.elements.length
      const nRight = result.perElement.filter(e => e.correct).length
      outcome = {
        answer: formatGridPoints(gridPoints),
        correct: result.correct,
        message: result.correct
          ? 'Correct!'
          : grid.mode === 'line'
            ? (nRight === n
                ? 'Plot two different points that the line passes through.'
                : `That doesn't match the line — ${nRight} of ${n} points are on it.`)
            : grid.mode === 'cells'
            ? `${nRight} of ${n} squares correct`
            : grid.mode === 'polygon'
            ? `${nRight} of ${n} corners correct`
            : `${nRight} of ${n} points correct`,
        grid: { points: gridPoints, perStudent: result.perStudent },
        ...(result.trap ? { trapResponse: result.trap.response } : {}),
      }
    } else if (part.answer_type === 'multi_blank') {
      const blanks = part.blanks ?? []
      const renderedBlanks = renderedPart.blanks ?? []
      // One submit for the whole part — gated until every blank is filled.
      if (blankAnswers.some(a => !a.trim())) return
      const result = checkMultiBlank(blanks.map((b, i): BlankCheck => ({
        label: b.label,
        student: blankAnswers[i] ?? '',
        answer: renderedBlanks[i]?.answer ?? '',
        answer_type: b.answer_type,
        tolerance: b.tolerance,
        requires_simplest: b.requires_simplest ?? false,
        traps: renderedBlanks[i]?.traps ?? [],
        ecf: renderedBlanks[i]?.ecf,
      })))
      outcome = {
        answer: result.blanks.map(b => `${b.label} = ${b.student}`).join(', '),
        correct: result.correct,
        message: result.correct
          ? 'Correct!'
          : `${result.correctCount} of ${result.blanks.length} blanks correct`,
        blanks: result.blanks.map((b, i) => ({
          label: b.label,
          answer: b.student,
          correct: b.correct,
          followThrough: b.followThrough ?? false,
          message: b.message,
          correctAnswer: renderedBlanks[i]?.answer ?? '',
        })),
      }
    } else {
      if (!answer.trim()) return
      const result = checkAnswer(
        answer,
        renderedPart.answer,
        part.answer_type,
        part.tolerance,
        renderedPart.traps,
        part.requires_simplest ?? false,
      )
      outcome = { answer, correct: result.correct, message: result.message }
    }

    const next = [...outcomes]
    next[current] = outcome
    setOutcomes(next)
    // ONE practice_attempts row per part regardless of blank count — for a
    // multi_blank part, correct = every blank correct (partial credit lives in
    // the exam-marks layer, not the mastery substrate).
    recordPartAttempt(part, outcome.correct)
    if (isLastPart) {
      recordAssignmentRollup(next.every(o => o?.correct === true))
      // The whole multi-part question counts as ONE toward the anonymous sign-up
      // nudge (not one per part) — fire it when the final part is answered.
      if (!studentId && registerQuestionForNudge()) setShowSignUpPrompt(true)
    }
  }

  function nextPart() {
    setAnswer('')
    setBlankAnswers(Array(blankCountOf(current + 1)).fill(''))
    setGridPoints([])
    setCurrent(c => c + 1)
  }

  // Same share behaviour as the single-part page: the URL pins this exact
  // parameter draw so the recipient sees the same numbers.
  function handleShare() {
    const urlParams = new URLSearchParams()
    for (const [key, value] of Object.entries(rendered.generatedValues)) {
      urlParams.set(key, value.toString())
    }
    const url = `${window.location.origin}/practice/question/${question.id}?${urlParams.toString()}`
    const allCorrect = outcomes.every(o => o?.correct === true)
    const text = allCorrect
      ? 'I just answered this GCSE Maths question correctly on Mathsense — can you?'
      : 'I got stuck on this GCSE Maths question on Mathsense — can you help?'
    const isMobile = navigator.maxTouchPoints > 0
    if (isMobile && navigator.share) {
      navigator.share({ title: 'GCSE Maths question — Mathsense', text, url })
    } else {
      navigator.clipboard.writeText(`${text}\n\n${url}`)
      setShareLabel('Link copied!')
      setTimeout(() => setShareLabel('Share this question'), 2000)
    }
  }

  const stemSkillNames = question.skill_ids
    .map(id => skillsById[id]?.name ?? id)
    .join(', ')

  return (
    <main style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => router.push(assignmentId ? `/student/assignments/${assignmentId}` : studentId ? '/student/dashboard' : '/practice')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>{stemSkillNames}</p>
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: '2px 0 0' }}>
            {'★'.repeat(question.difficulty)}{'☆'.repeat(5 - question.difficulty)}
            {' · '}{question.parts.length}-part question
          </p>
        </div>
      </div>

      {/* Part progress */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {question.parts.map((_, i) => {
          const o = outcomes[i]
          const isCurrent = i === current
          return (
            <div
              key={i}
              title={`Part (${PART_LETTERS[i] ?? i + 1})`}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: radius.full,
                background: o
                  ? (o.correct ? colors.success : colors.danger)
                  : isCurrent ? colors.primary : colors.border,
                opacity: o || isCurrent ? 1 : 0.5,
                transition: 'background-color 0.3s ease',
              }}
            />
          )
        })}
      </div>

      {/* Shared stem */}
      {(question.image_url || rendered.stem) && (
        <div style={card}>
          {question.image_url && (
            <img
              src={question.image_url}
              alt="Question diagram"
              style={{ maxWidth: '100%', borderRadius: radius.md, marginBottom: '12px', display: 'block' }}
            />
          )}
          {rendered.stem && (
            <div
              ref={stemRef}
              style={{ fontSize: font.lg, color: colors.textPrimary, lineHeight: '1.6' }}
            />
          )}
        </div>
      )}

      {/* All parts — prompts always visible so you can read ahead; only the
          current part is answerable, and answered parts keep your answer. */}
      {question.parts.map((part, i) => {
        const renderedPart = rendered.parts[i]
        const o = outcomes[i]
        const isCurrent = i === current
        const isFuture = i > current
        const letter = PART_LETTERS[i] ?? String(i + 1)
        const partSkillNames = part.skill_ids
          .map(id => skillsById[id]?.name ?? id)
          .join(', ')

        return (
          <div key={i} style={{ ...card, opacity: isFuture ? 0.6 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <p style={{ fontSize: font.sm, fontWeight: '700', color: isCurrent ? colors.primary : colors.textSecondary, margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                Part ({letter}) · {partSkillNames}
              </p>
              <span style={{ fontSize: font.sm, color: colors.textHint, whiteSpace: 'nowrap' as const }}>
                {part.marks} {part.marks === 1 ? 'mark' : 'marks'}
              </span>
            </div>

            <div
              style={{ fontSize: font.lg, color: colors.textPrimary, lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: renderedPart.prompt }}
            />

            {/* Answered: keep the student's answer (and the right one, if wrong)
                plus any reminder/trap feedback on screen for every part. */}
            {o && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: radius.md,
                background: o.correct ? colors.successLight : colors.dangerLight,
                border: `1px solid ${o.correct ? colors.successBorder : colors.dangerBorder}`,
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '6px',
              }}>
                <p style={{ fontSize: font.sm, margin: 0, color: o.correct ? colors.successText : colors.dangerText, fontWeight: '600' }}>
                  {o.correct ? '✓ Correct' : (o.blanks || o.grid) ? `✗ ${o.message}` : '✗ Not quite'}
                </p>
                {/* Grid review: the student's drawing with the correct answer
                    ghosted over it, points coloured by verdict. */}
                {o.grid && renderedPart.grid && (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
                    <GridCanvas
                      grid={renderedPart.grid}
                      value={o.grid.points}
                      readOnly
                      showCanonical
                      perElement={o.grid.perStudent}
                    />
                    <p style={{ fontSize: font.sm, margin: 0, color: colors.textHint }}>
                      Your points shown solid · the correct answer is shown dashed
                    </p>
                    {/* Targeted misconception feedback, when the drawing matched
                        an authored wrong drawing. */}
                    {o.trapResponse && (
                      <div
                        style={{ fontSize: font.sm, color: colors.dangerText }}
                        dangerouslySetInnerHTML={{ __html: o.trapResponse }}
                      />
                    )}
                  </div>
                )}
                {/* Per-blank verdicts for multi_blank parts: each blank's answer,
                    its trap/reminder message, and the right answer where wrong. */}
                {o.grid ? null : o.blanks ? o.blanks.map(b => {
                  // Three states, not two: right, wrong, and right-given-your-
                  // own-earlier-error (amber ✓, still shows the true answer so
                  // the student can see where the chain went off).
                  const blankColor = b.followThrough ? colors.warningText
                    : b.correct ? colors.successText : colors.dangerText
                  return (
                  <div key={b.label} style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
                    <p style={{ fontSize: font.sm, margin: 0, color: blankColor }}>
                      {b.correct ? '✓' : '✗'} {b.label} ={' '}
                      <strong><span dangerouslySetInnerHTML={{ __html: b.answer }} /></strong>
                      {(!b.correct || b.followThrough) && (
                        <>
                          {' — correct answer: '}
                          <strong><span dangerouslySetInnerHTML={{ __html: b.correctAnswer }} /></strong>
                        </>
                      )}
                    </p>
                    {/* Suppress the bare "Correct!" (the ✓ says it) and the generic
                        wrong-answer default (the row already shows the right answer);
                        trap responses, reminders and "Not answered." still show. */}
                    {b.message && b.message !== 'Correct!' && !b.message.startsWith('Not quite. The correct answer is') && (
                      <div
                        style={{ fontSize: font.sm, color: blankColor, paddingLeft: '18px' }}
                        dangerouslySetInnerHTML={{ __html: b.message }}
                      />
                    )}
                  </div>
                  )
                }) : (
                  <>
                    {/* Reminder / trap feedback (units, simplification, etc.) — suppress
                        the bare "Correct!" since the ✓ header already says it. */}
                    {o.message && o.message !== 'Correct!' && (
                      <div
                        style={{ fontSize: font.sm, color: o.correct ? colors.successText : colors.dangerText }}
                        dangerouslySetInnerHTML={{ __html: o.message }}
                      />
                    )}
                    <p style={{ fontSize: font.sm, margin: 0, color: o.correct ? colors.successText : colors.dangerText }}>
                      Your answer:{' '}
                      <strong><span dangerouslySetInnerHTML={{ __html: o.answer }} /></strong>
                    </p>
                    {!o.correct && (
                      <p style={{ fontSize: font.sm, margin: 0, color: colors.dangerText }}>
                        Correct answer:{' '}
                        <strong><span dangerouslySetInnerHTML={{ __html: renderedPart.answer }} /></strong>
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Current grid_draw part → interactive canvas, one submit. */}
            {isCurrent && !o && part.answer_type === 'grid_draw' && renderedPart.grid && (() => {
              const grid = renderedPart.grid
              const ready = gridPoints.length === grid.elements.length
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <GridCanvas
                    grid={grid}
                    value={gridPoints}
                    onChange={setGridPoints}
                  />
                  <button
                    onClick={submit}
                    disabled={!ready}
                    style={{ ...primaryButton, opacity: !ready ? 0.6 : 1 }}
                  >
                    Submit answer
                  </button>
                </div>
              )
            })()}

            {/* Current part, not yet answered → active input */}
            {isCurrent && !o && part.answer_type !== 'multi_blank' && part.answer_type !== 'grid_draw' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <MathInput
                  value={answer}
                  onChange={setAnswer}
                  onSubmit={submit}
                  placeholder="Type your answer..."
                />
                <button
                  onClick={submit}
                  disabled={!answer.trim()}
                  style={{ ...primaryButton, opacity: !answer.trim() ? 0.6 : 1 }}
                >
                  Submit answer
                </button>
              </div>
            )}

            {/* Current multi_blank part → one labelled input per blank, a single
                submit for the whole part. Enter hops to the next blank and
                submits from the last one once everything is filled. */}
            {isCurrent && !o && part.answer_type === 'multi_blank' && (() => {
              const blanks = part.blanks ?? []
              const allFilled = blankAnswers.length === blanks.length
                && blankAnswers.every(a => a.trim() !== '')
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  {/* Every blank is answered inline in the diagram/table above,
                      so the list here is empty — say so rather than showing a
                      bare Submit button. */}
                  {blanks.every(b => inlineHosts[b.label]) && (
                    <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
                      Type each answer directly into the table above.
                    </p>
                  )}
                  {/* A blank with an inline placeholder is rendered there, not
                      here — but keep the index aligned with blankAnswers. */}
                  {blanks.map((b, bi) => inlineHosts[b.label] ? null : (
                    <div
                      key={b.label}
                      ref={el => { blankRowRefs.current[bi] = el }}
                      style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}
                    >
                      {/* Per-blank prompt so the student isn't glancing back at
                          the stem/diagram to remember what each letter means. */}
                      {rendered.parts[current].blanks?.[bi]?.prompt && (
                        <span
                          style={{ fontSize: font.sm, color: colors.textSecondary, paddingLeft: '54px' }}
                          dangerouslySetInnerHTML={{ __html: rendered.parts[current].blanks![bi].prompt }}
                        />
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{
                        fontSize: font.lg, fontWeight: '700', color: colors.textPrimary,
                        minWidth: '44px', paddingTop: '10px', textAlign: 'right' as const,
                      }}>
                        {b.label} =
                      </span>
                      <div style={{ flex: 1 }}>
                        <MathInput
                          value={blankAnswers[bi] ?? ''}
                          onChange={v => {
                            const next = [...blankAnswers]
                            next[bi] = v
                            setBlankAnswers(next)
                          }}
                          onSubmit={() => {
                            if (bi < blanks.length - 1) {
                              blankRowRefs.current[bi + 1]?.querySelector('input')?.focus()
                            } else {
                              submit()
                            }
                          }}
                          placeholder="Type your answer..."
                        />
                      </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={submit}
                    disabled={!allFilled}
                    style={{ ...primaryButton, opacity: !allFilled ? 0.6 : 1 }}
                  >
                    Submit answers
                  </button>
                </div>
              )
            })()}

            {/* Current part, just answered → explanation + advance.
                The feedback message (including the units reminder) lives in the
                answered-summary box above, so it isn't repeated here. */}
            {isCurrent && o && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {renderedPart.explanation && (
                  <div style={{
                    padding: '14px 16px',
                    borderRadius: radius.lg,
                    background: colors.warningLight,
                    border: `1px solid ${colors.warningBorder}`,
                  }}>
                    <p style={{ fontSize: font.sm, fontWeight: '600', margin: '0 0 4px', color: colors.warningText }}>
                      Explanation:
                    </p>
                    <div
                      style={{ fontSize: font.base, color: colors.textPrimary }}
                      dangerouslySetInnerHTML={{ __html: renderedPart.explanation }}
                    />
                  </div>
                )}
                {!isLastPart && (
                  <button onClick={nextPart} style={primaryButton}>
                    Next part →
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Whole-question wrap-up, once every part is answered */}
      {allAnswered && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, textAlign: 'center' as const }}>
            You got <strong>{correctCount} of {question.parts.length}</strong> parts correct.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onTryAgain} style={{ ...secondaryButton, flex: 1 }}>
              Try again
            </button>
            <button onClick={onNextQuestion} style={{ ...primaryButton, flex: 1 }}>
              Next question →
            </button>
          </div>
          <button onClick={handleShare} style={{ ...secondaryButton, fontSize: font.base }}>
            {shareLabel}
          </button>
        </div>
      )}

      {/* Inline blank inputs, portalled into the [data-blank] placeholders in
          the authored HTML. Before submitting these are the answer boxes; after
          submitting they show what the student entered, so the table/diagram is
          left visibly completed rather than full of gaps. */}
      {question.parts.flatMap((p, pi) => (p.blanks ?? []).map((b, bi) => {
        const host = inlineHosts[b.label]
        // Render inputs for the ACTIVE part, and keep every already-answered
        // part's values in place — so a table shared across parts stays filled
        // as the student advances rather than emptying out.
        const o = outcomes[pi]
        if (!host || (pi !== current && !o)) return null
        const verdict = o?.blanks?.[bi]
        return createPortal(
          verdict ? (
            <span
              title={verdict.followThrough ? 'Follow-through: consistent with your earlier answer' : undefined}
              style={{
                fontWeight: 700,
                color: verdict.followThrough ? colors.warningText
                  : verdict.correct ? colors.successText : colors.dangerText,
              }}
            >
              {verdict.answer || '—'}
            </span>
          ) : (
            <input
              value={blankAnswers[bi] ?? ''}
              onChange={e => {
                const next = [...blankAnswers]
                next[bi] = e.target.value
                setBlankAnswers(next)
              }}
              onKeyDown={e => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                const nextHost = inlineHosts[question.parts[current].blanks?.[bi + 1]?.label ?? '']
                const nextInput = nextHost?.querySelector('input')
                  ?? blankRowRefs.current[bi + 1]?.querySelector('input')
                if (nextInput) nextInput.focus(); else submit()
              }}
              aria-label={`Answer for ${b.label}`}
              autoComplete="off"
              style={{
                width: '58px', padding: '5px 4px', textAlign: 'center' as const,
                fontSize: font.base, color: colors.textPrimary,
                border: `1.5px solid ${colors.primary}`, borderRadius: radius.sm,
                background: colors.card,
              }}
            />
          ),
          host,
          b.label,
        )
      }))}

      {/* Sign-up prompt for anonymous users, surfaced once the whole question is done */}
      {showSignUpPrompt && !studentId && (
        <SignUpPrompt onDismiss={() => setShowSignUpPrompt(false)} />
      )}

      {/* Report an issue */}
      <ReportIssueButton
        questionId={question.id}
        renderedValues={rendered.generatedValues}
        studentId={studentId}
      />

      {/* General feedback */}
      <FeedbackWidget context="question_page" userId={studentId} />
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '24px 20px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '100dvh',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
}
