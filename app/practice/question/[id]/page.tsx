'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { skillsById } from '../../../../lib/skills/skillGraph'
import { courses } from '../../../../data/courses'
import { renderQuestion, type RenderedQuestion } from '../../../../lib/questions/paramEngine'
import { checkAnswer } from '../../../../lib/questions/answerChecker'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton,
} from '../../../../lib/styles'
import MathInput from '../../../../components/practice/MathInput'
import ReportIssueButton from '../../../../components/practice/ReportIssueButton'
import FeedbackWidget from '../../../../components/FeedbackWidget'
import { buildOptions } from '../../../../lib/questions/multipleChoice'
import { getStudentProfile } from '../../../../lib/auth'

type Question = {
  id: string
  skill_ids: string[]
  difficulty: number
  question_type: string
  question_template: string
  parameters: any
  answer_template: string
  answer_type: 'exact' | 'numeric' | 'fraction' | 'expression'
  tolerance: number | null
  traps: { answer_template: string, response: string }[]
  explanation: string | null
  image_url: string | null
  is_published: boolean
}

type FeedbackState = {
  correct: boolean
  message: string
  explanation: string
}

// Shows a before → after dot row for one skill in the session summary
function ProgressDelta({ data }: {
  data: { beforeCorrect: number; beforeTotal: number; correctInWindow: number; totalInWindow: number }
}) {
  const gained = data.correctInWindow - data.beforeCorrect

  function Dots({ correct, total }: { correct: number; total: number }) {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[0, 1, 2, 3, 4].map(i => {
          const isCorrect = i < correct
          const isWrong   = i >= correct && i < total
          return (
            <div key={i} style={{
              width: 13, height: 13, borderRadius: '50%',
              background: isCorrect ? colors.success : isWrong ? colors.danger : colors.border,
              opacity: i >= total ? 0.25 : 1,
            }} />
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Dots correct={data.beforeCorrect} total={data.beforeTotal} />
      <span style={{ fontSize: '11px', color: colors.textHint }}>→</span>
      <Dots correct={data.correctInWindow} total={data.totalInWindow} />
      {gained !== 0 && (
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          color: gained > 0 ? colors.successText : colors.dangerText,
          marginLeft: '2px',
        }}>
          {gained > 0 ? `+${gained}` : `${gained}`}
        </span>
      )}
    </div>
  )
}

function QuestionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const searchParams = useSearchParams()

  const [question, setQuestion] = useState<Question | null>(null)
  const [rendered, setRendered] = useState<RenderedQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<string>('foundation')
  const [shareLabel, setShareLabel] = useState('Share this question')
  const [options, setOptions] = useState<string[]>([])
  const [studentId, setStudentId] = useState<string | null>(null)
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false)
  const [priorSkillAttempts, setPriorSkillAttempts] = useState<{ correct: boolean }[]>([])
  const [newlyMasteredSkill, setNewlyMasteredSkill] = useState<string | null>(null)
  const [dotsPhase, setDotsPhase] = useState<'before' | 'after'>('before')
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [sessionSkills, setSessionSkills] = useState<Record<string, {
    masteredThisSession: boolean
    beforeCorrect: number   // mastery-window state at session start
    beforeTotal: number
    correctInWindow: number // current mastery-window state
    totalInWindow: number
  }>>({})
  const [showSessionSummary, setShowSessionSummary] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('practice_tier')
    if (stored) setTier(stored)
    loadQuestion()
    getStudentProfile().then(p => {
      if (p) setStudentId(p.id)
    })
  }, [id])

  // Fetch the student's 5 most recent attempts for this question's primary skill,
  // so we can detect the exact moment mastery is reached client-side.
  useEffect(() => {
    if (!studentId || !question || question.skill_ids.length === 0) return
    supabase
      .from('practice_attempts')
      .select('correct')
      .eq('student_id', studentId)
      .contains('skill_ids', [question.skill_ids[0]])
      .order('attempted_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setPriorSkillAttempts(data ?? []))
  }, [studentId, question?.id])

  // Animate dots from "before" → "after" shortly after feedback appears
  useEffect(() => {
    if (!feedback) { setDotsPhase('before'); return }
    const t = setTimeout(() => setDotsPhase('after'), 380)
    return () => clearTimeout(t)
  }, [feedback])

  // Initialise session stats and skill list from sessionStorage (client only)
  useEffect(() => {
    const correct = parseInt(sessionStorage.getItem('session_correct') ?? '0')
    const total   = parseInt(sessionStorage.getItem('session_total')   ?? '0')
    setSessionStats({ correct, total })
    try {
      const skills = JSON.parse(sessionStorage.getItem('session_skills') ?? '{}')
      setSessionSkills(skills)
    } catch { /* ignore malformed storage */ }
  }, [])

  async function loadQuestion() {
    setLoading(true)
    setAnswer('')
    setFeedback(null)
    setNewlyMasteredSkill(null)
    setPriorSkillAttempts([])

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      router.push('/practice')
      return
    }

    setQuestion(data)

    // Read fixed values from URL if present
    const fixedValues: Record<string, number> = {}
    let hasFixedValues = false
    if (data.parameters) {
      for (const key of Object.keys(data.parameters)) {
        const val = searchParams.get(key)
        if (val !== null) {
          fixedValues[key] = parseFloat(val)
          hasFixedValues = true
        }
      }
    }

    const r = renderQuestion(
      data.question_template,
      data.answer_template,
      data.traps ?? [],
      data.explanation,
      data.parameters ?? {},
      hasFixedValues ? fixedValues : undefined
    )
    setRendered(r)
    if (data.question_type === 'multiple_choice') {
      setOptions(buildOptions(r.answer, r.traps))
    }
    setLoading(false)
  }

  async function recordAttempt(correct: boolean) {
    if (!question) return

    // Session stats (read from storage to avoid stale-closure issue)
    const prevTotal   = parseInt(sessionStorage.getItem('session_total')   ?? '0')
    const prevCorrect = parseInt(sessionStorage.getItem('session_correct') ?? '0')
    const newTotal    = prevTotal + 1
    const newCorrect  = prevCorrect + (correct ? 1 : 0)
    sessionStorage.setItem('session_total',   newTotal.toString())
    sessionStorage.setItem('session_correct', newCorrect.toString())
    setSessionStats({ correct: newCorrect, total: newTotal })

    // Track per-skill session progress
    const primarySkillId = question.skill_ids[0]
    if (primarySkillId) {
      const skills = JSON.parse(sessionStorage.getItem('session_skills') ?? '{}') as Record<string, {
        masteredThisSession: boolean
        beforeCorrect: number; beforeTotal: number
        correctInWindow: number; totalInWindow: number
      }>
      // Compute the new mastery window (after this answer)
      const newWindow      = [{ correct }, ...priorSkillAttempts].slice(0, 5)
      const correctInWindow = newWindow.filter(a => a.correct).length
      const totalInWindow   = newWindow.length

      if (!skills[primarySkillId]) {
        // First attempt at this skill this session — snapshot the before-state
        const beforeTotal   = priorSkillAttempts.slice(0, 5).length
        const beforeCorrect = priorSkillAttempts.slice(0, 5).filter(a => a.correct).length
        skills[primarySkillId] = {
          masteredThisSession: false,
          beforeCorrect, beforeTotal,
          correctInWindow, totalInWindow,
        }
      } else {
        // Subsequent attempt — update current window, preserve before + mastered flag
        skills[primarySkillId] = {
          ...skills[primarySkillId],
          correctInWindow, totalInWindow,
        }
      }
      sessionStorage.setItem('session_skills', JSON.stringify(skills))
      setSessionSkills(prev => ({ ...prev, [primarySkillId]: skills[primarySkillId] }))
    }

    const count = parseInt(sessionStorage.getItem('practice_questions_answered') ?? '0') + 1
    sessionStorage.setItem('practice_questions_answered', count.toString())
    if (!studentId && count >= 5) setShowSignUpPrompt(true)
    if (!studentId) return
    await supabase
      .from('practice_attempts')
      .insert({
        student_id: studentId,
        question_id: question.id,
        skill_ids: question.skill_ids,
        correct,
      })
  }

  // Detects whether this correct answer tips the skill into mastered status for
  // the first time.  Uses the 5 prior attempts already fetched on question load —
  // no extra round-trip needed.
  function detectMastery(correct: boolean) {
    if (!correct || !question || question.skill_ids.length === 0) return
    const allAttempts = [{ correct: true }, ...priorSkillAttempts]
    const lastFive    = allAttempts.slice(0, 5)
    const masteredNow = lastFive.length >= 5 && lastFive.filter(a => a.correct).length >= 4
    const prevFive    = priorSkillAttempts.slice(0, 5)
    const wasMastered = prevFive.length >= 5 && prevFive.filter(a => a.correct).length >= 4
    if (masteredNow && !wasMastered) {
      setNewlyMasteredSkill(question.skill_ids[0])
      // Persist mastery flag for the session summary (preserve window counts)
      const skills = JSON.parse(sessionStorage.getItem('session_skills') ?? '{}')
      skills[question.skill_ids[0]] = { ...skills[question.skill_ids[0]], masteredThisSession: true }
      sessionStorage.setItem('session_skills', JSON.stringify(skills))
      setSessionSkills(prev => ({ ...prev, [question.skill_ids[0]]: { ...prev[question.skill_ids[0]], masteredThisSession: true } }))
    }
  }

  function handleSubmit() {
    if (!rendered || !question || !answer.trim()) return

    const result = checkAnswer(
      answer,
      rendered.answer,
      question.answer_type,
      question.tolerance,
      rendered.traps,
    )

    setFeedback({
      correct: result.correct,
      message: result.message,
      explanation: rendered.explanation,
    })
    detectMastery(result.correct)
    recordAttempt(result.correct)
  }

  function handleShare() {
    if (!rendered) return
    const urlParams = new URLSearchParams()
    for (const [key, value] of Object.entries(rendered.generatedValues)) {
      urlParams.set(key, value.toString())
    }
    const url = `${window.location.origin}/practice/question/${id}?${urlParams.toString()}`

    const text = feedback?.correct
      ? 'I just answered this GCSE Maths question correctly on Mathsense — can you?'
      : 'I got stuck on this GCSE Maths question on Mathsense — can you help?'

    const isMobile = navigator.maxTouchPoints > 0

    if (isMobile && navigator.share) {
      navigator.share({
        title: 'GCSE Maths question — Mathsense',
        text,
        url,
      })
    } else {
      const shareText = `${text}\n\n${url}`
      navigator.clipboard.writeText(shareText)
      setShareLabel('Link copied!')
      setTimeout(() => setShareLabel('Share this question'), 2000)
    }
  }

  async function nextQuestion() {
	const storedTier = sessionStorage.getItem('practice_tier') ?? 'foundation'
    const foundation = courses.find(c => c.id === 'gcse_foundation')?.skills ?? []
	const higher = courses.find(c => c.id === 'gcse_higher')?.skills ?? []
	const higherOnly = higher.filter(id => !foundation.includes(id))
	let skillIds = storedTier === 'foundation' ? foundation
	  : storedTier === 'higher' ? higherOnly
	  : [...new Set([...foundation, ...higher])]

    // If a focus mode is active (skill / topic / weak-spot blitz), the practice
    // page persisted the resolved target set. Honour it so the whole session
    // stays on-target instead of reverting to a tier-random question after Q1.
    // Auto mode leaves this key unset → falls through to the tier pool above.
    try {
      const focusRaw = sessionStorage.getItem('practice_focus_skills')
      if (focusRaw) {
        const focusSkills = JSON.parse(focusRaw) as string[]
        if (Array.isArray(focusSkills) && focusSkills.length > 0) {
          skillIds = focusSkills
        }
      }
    } catch { /* malformed storage — ignore and use the tier pool */ }

    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('is_published', true)
      .overlaps('skill_ids', skillIds)

    // Prefer a question other than the current one for variety.
    const others = (data ?? []).filter(q => q.id !== id)
    if (others.length > 0) {
      const random = others[Math.floor(Math.random() * others.length)]
      router.push(`/practice/question/${random.id}`)
      return
    }

    // Only the current question is in scope (common when drilling a skill that
    // has a single question). Rather than dumping the student back to /practice,
    // re-serve it with fresh parameters — questions are parametric, so the same
    // template keeps the drill varied. Falls back to /practice only if the pool
    // is genuinely empty.
    if ((data ?? []).length > 0) {
      reparametriseCurrent()
      return
    }

    router.push('/practice')
  }

  // Re-renders the CURRENT question with new random parameter values, in place.
  // Used when a skill drill has exhausted its distinct questions: the parametric
  // engine produces fresh numbers each call, so the student keeps practising the
  // same skill instead of being bounced out. Mirrors loadQuestion's resets, and
  // refreshes the mastery window (the id-keyed effect won't refire on same id).
  async function reparametriseCurrent() {
    if (!question) { router.push('/practice'); return }
    setAnswer('')
    setFeedback(null)
    setNewlyMasteredSkill(null)
    const r = renderQuestion(
      question.question_template,
      question.answer_template,
      question.traps ?? [],
      question.explanation,
      question.parameters ?? {}
    )
    setRendered(r)
    if (question.question_type === 'multiple_choice') {
      setOptions(buildOptions(r.answer, r.traps))
    }
    if (studentId && question.skill_ids.length > 0) {
      const { data: recent } = await supabase
        .from('practice_attempts')
        .select('correct')
        .eq('student_id', studentId)
        .contains('skill_ids', [question.skill_ids[0]])
        .order('attempted_at', { ascending: false })
        .limit(5)
      setPriorSkillAttempts(recent ?? [])
    }
  }

  function tryAgain() {
    if (!question) return
    setAnswer('')
    setFeedback(null)
    const r = renderQuestion(
      question.question_template,
      question.answer_template,
      question.traps ?? [],
      question.explanation,
      question.parameters ?? {}
    )
    setRendered(r)
    if (question.question_type === 'multiple_choice') {
      setOptions(buildOptions(r.answer, r.traps))
    }
  }

  if (loading || !rendered || !question) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading question...</p>
      </main>
    )
  }

  const skillNames = question.skill_ids
    .map(id => skillsById[id]?.name ?? id)
    .join(', ')

  return (
    <main style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => router.push(studentId ? '/student/dashboard' : '/practice')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
            {skillNames}
          </p>
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: '2px 0 0' }}>
            {'★'.repeat(question.difficulty)}{'☆'.repeat(5 - question.difficulty)}
          </p>
        </div>
        {sessionStats.total > 0 && (
          <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
            <p style={{ fontSize: '10px', color: colors.textHint, margin: '0 0 2px', fontWeight: '500', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
              Session
            </p>
            <p style={{ fontSize: font.base, color: colors.successText, margin: '0 0 4px', fontWeight: '700' }}>
              {sessionStats.correct}/{sessionStats.total} ✓
            </p>
            <button
              onClick={() => setShowSessionSummary(true)}
              style={{ fontSize: '11px', color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600', textDecoration: 'underline' }}
            >
              End session
            </button>
          </div>
        )}
      </div>

      {/* Question */}
      <div style={card}>
        {question.image_url && (
          <img
            src={question.image_url}
            alt="Question diagram"
            style={{ maxWidth: '100%', borderRadius: radius.md, marginBottom: '12px', display: 'block' }}
          />
        )}
        <div
          style={{ fontSize: font.xl, color: colors.textPrimary, lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: rendered.question }}
        />
      </div>

      {/* Answer input */}
      {!feedback && (
		  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
			{question.question_type === 'multiple_choice' ? (
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				{options.map((opt, i) => (
				  <button
					key={i}
					onClick={() => {
					  const result = checkAnswer(
						opt,
						rendered.answer,
						question.answer_type,
						question.tolerance,
						rendered.traps,
					  )
					  setAnswer(opt)
					  setFeedback({
						correct: result.correct,
						message: result.message,
						explanation: rendered.explanation,
					  })
					  detectMastery(result.correct)
					  recordAttempt(result.correct)
					}}
					style={{
					  ...secondaryButton,
					  textAlign: 'left' as const,
					  padding: '14px 16px',
					  fontSize: font.base,
					  lineHeight: '1.5',
					}}
					dangerouslySetInnerHTML={{ __html: opt }}
				  />
				))}
			  </div>
			) : (
			  <>
				<MathInput
				  value={answer}
				  onChange={setAnswer}
				  onSubmit={handleSubmit}
				  placeholder="Type your answer..."
				/>
				<button
				  onClick={handleSubmit}
				  disabled={!answer.trim()}
				  style={{ ...primaryButton, opacity: !answer.trim() ? 0.6 : 1 }}
				>
				  Submit answer
				</button>
			  </>
			)}
		  </div>
		)}

      {/* Feedback */}
      {feedback && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            padding: '16px',
            borderRadius: radius.lg,
            background: feedback.correct ? colors.successLight : colors.dangerLight,
            border: `1px solid ${feedback.correct ? colors.successBorder : colors.dangerBorder}`,
          }}>
            <p style={{
              fontSize: font.lg,
              fontWeight: '600',
              margin: '0 0 6px',
              color: feedback.correct ? colors.successText : colors.dangerText,
            }}>
              {feedback.correct ? '✓ Correct!' : '✗ Not quite'}
            </p>
            <div
              style={{ fontSize: font.base, color: feedback.correct ? colors.successText : colors.dangerText }}
              dangerouslySetInnerHTML={{ __html: feedback.message }}
            />

            {/* Always show the student's answer; show the correct answer when wrong */}
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: font.sm, margin: 0, color: feedback.correct ? colors.successText : colors.dangerText }}>
                Your answer:{' '}
                <strong><span dangerouslySetInnerHTML={{ __html: answer }} /></strong>
              </p>
              {!feedback.correct && rendered && (
                <p style={{ fontSize: font.sm, margin: 0, color: colors.dangerText }}>
                  Correct answer:{' '}
                  <strong><span dangerouslySetInnerHTML={{ __html: rendered.answer }} /></strong>
                </p>
              )}
            </div>
          </div>

          {feedback.explanation && (
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
                dangerouslySetInnerHTML={{ __html: feedback.explanation }}
              />
            </div>
          )}

          {/* Animated skill progress dots */}
          {question.skill_ids.length > 0 && (() => {
            const skillId   = question.skill_ids[0]
            const skillName = skillsById[skillId]?.name ?? 'this skill'
            // Newest = index 0 in priorSkillAttempts (fetched descending)
            // Reverse so oldest is left, newest is right
            const beforeWindow = priorSkillAttempts.slice(0, 5).reverse()
            const afterWindow  = [{ correct: feedback.correct }, ...priorSkillAttempts].slice(0, 5).reverse()
            const correctAfter = afterWindow.filter(a => a.correct).length
            const isMastered   = afterWindow.length >= 5 && correctAfter >= 4
            const gained       = correctAfter - beforeWindow.filter(a => a.correct).length

            return (
              <div style={{
                padding: '12px 16px',
                borderRadius: radius.lg,
                background: colors.cardAlt,
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, margin: 0 }}>
                    {skillName}
                  </p>
                  <span style={{
                    fontSize: font.sm,
                    fontWeight: '600',
                    color: isMastered ? colors.successText : colors.textHint,
                    transition: 'color 0.3s ease',
                  }}>
                    {isMastered ? '✓ Mastered' : `${correctAfter}/${afterWindow.length} correct`}
                  </span>
                </div>

                {/* 5-dot mastery window */}
                <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                  {[0, 1, 2, 3, 4].map(i => {
                    const beforeDot = beforeWindow[i]  // undefined = empty slot
                    const afterDot  = afterWindow[i]   // undefined = empty slot (fewer than 5 attempts)

                    // Which dot to display right now
                    const activeDot = dotsPhase === 'after' ? afterDot : beforeDot

                    // Was this slot empty before, and is now filled? → pop-in animation
                    const isNewSlot = !beforeDot && !!afterDot

                    // Colour the dot
                    const isCorrect  = activeDot?.correct === true
                    const isWrong    = activeDot?.correct === false
                    const bg         = isCorrect ? colors.success : isWrong ? colors.danger : colors.border
                    const borderCol  = isCorrect ? colors.successText : isWrong ? colors.dangerText : colors.borderStrong

                    // Scale: new slots start at 0 in "before" phase, spring to 1 in "after"
                    const scale = isNewSlot && dotsPhase === 'before' ? 0 : 1

                    return (
                      <div
                        key={i}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: bg,
                          border: `2px solid ${borderCol}`,
                          transition: [
                            'background-color 0.35s ease',
                            'border-color 0.35s ease',
                            'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
                            'opacity 0.35s ease',
                          ].join(', '),
                          transform: `scale(${scale})`,
                          opacity: i >= afterWindow.length ? 0.25 : (isNewSlot && dotsPhase === 'before' ? 0 : 1),
                        }}
                      />
                    )
                  })}

                  {/* "Need N more" hint — only when answer was correct and not yet mastered */}
                  {feedback.correct && !isMastered && dotsPhase === 'after' && (
                    <span style={{ fontSize: '11px', color: colors.textHint, marginLeft: '4px' }}>
                      {4 - correctAfter} more to master
                    </span>
                  )}
                  {gained > 0 && isMastered && dotsPhase === 'after' && (
                    <span style={{ fontSize: '11px', color: colors.successText, marginLeft: '4px', fontWeight: '600' }}>
                      🎯
                    </span>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Skill mastery celebration */}
          {newlyMasteredSkill && (
            <div style={{
              padding: '14px 16px',
              borderRadius: radius.lg,
              background: colors.successLight,
              border: `1px solid ${colors.successBorder}`,
              textAlign: 'center' as const,
            }}>
              <p style={{ fontSize: font.lg, fontWeight: '700', color: colors.successText, margin: '0 0 2px' }}>
                🎉 Skill mastered!
              </p>
              <p style={{ fontSize: font.base, color: colors.successText, margin: 0 }}>
                {skillsById[newlyMasteredSkill]?.name ?? newlyMasteredSkill}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
			  {!feedback.correct && (
				<button onClick={tryAgain} style={{ ...secondaryButton, flex: 1 }}>
				  Try again
				</button>
			  )}
			  <button onClick={nextQuestion} style={{ ...primaryButton, flex: 1 }}>
				Next question →
			  </button>
			  <button onClick={handleShare} style={{ ...secondaryButton, flex: 1 }}>
				{shareLabel}
			  </button>
			</div>
        </div>
      )}

      {/* Sign-up prompt for anonymous users */}
      {showSignUpPrompt && !studentId && (
        <div style={{
          padding: '16px',
          borderRadius: radius.lg,
          background: colors.card,
          border: `1px solid ${colors.primary}`,
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '10px',
        }}>
          <p style={{ fontSize: font.md, fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Save your progress
          </p>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
            Create a free account to track your progress and see which skills you&apos;re improving.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href="/student"
              style={{ ...primaryButton, flex: 1, textAlign: 'center' as const, textDecoration: 'none', display: 'block', boxSizing: 'border-box' as const }}
            >
              Create free account
            </a>
            <button
              onClick={() => setShowSignUpPrompt(false)}
              style={{ ...secondaryButton, flex: 1 }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Report an issue */}
      <ReportIssueButton
        questionId={id}
        renderedValues={rendered.generatedValues}
        studentId={studentId}
      />

      {/* General feedback */}
      <FeedbackWidget context="question_page" userId={studentId} />

      {/* Ko-fi */}
      <div style={{ textAlign: 'center' as const, marginTop: '8px' }}>
        <a
          href="https://ko-fi.com/mathsense"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: font.base, color: colors.textHint, textDecoration: 'none' }}
        >
          If you find Mathsense useful, consider supporting us on Ko-fi
        </a>
      </div>

      {/* Session Summary Modal */}
      {showSessionSummary && (() => {
        const accuracy = sessionStats.total > 0
          ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0
        const masteredSkills  = Object.entries(sessionSkills).filter(([, d]) => d.masteredThisSession)
        const practicedSkills = Object.entries(sessionSkills).filter(([, d]) => !d.masteredThisSession)
        const accentColor = accuracy >= 70 ? colors.successText : accuracy >= 40 ? colors.warning : colors.dangerText
        const barColor    = accuracy >= 70 ? colors.success    : accuracy >= 40 ? colors.warning : colors.danger

        return (
          <div
            style={{
              position: 'fixed' as const,
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center' as const,
              justifyContent: 'center' as const,
              padding: '20px',
            }}
            onClick={e => { if (e.target === e.currentTarget) setShowSessionSummary(false) }}
          >
            <div style={{
              background: colors.card,
              borderRadius: radius.lg,
              padding: '28px 24px',
              maxWidth: '440px',
              width: '100%',
              maxHeight: '85dvh',
              overflowY: 'auto' as const,
              display: 'flex',
              flexDirection: 'column' as const,
              gap: '20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}>
              <h2 style={{ fontSize: font['2xl'], fontWeight: '700', margin: 0, color: colors.textPrimary }}>
                Session complete
              </h2>

              {/* Score block */}
              <div style={{
                textAlign: 'center' as const,
                padding: '20px 16px 16px',
                background: colors.cardAlt,
                borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
              }}>
                <p style={{ fontSize: '52px', fontWeight: '800', margin: '0 0 2px', color: accentColor, lineHeight: 1 }}>
                  {sessionStats.correct}/{sessionStats.total}
                </p>
                <p style={{ fontSize: font.lg, color: colors.textSecondary, margin: '0 0 14px' }}>
                  {accuracy}% accuracy
                </p>
                {/* Accuracy bar */}
                <div style={{ background: colors.border, borderRadius: radius.full, height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    background: barColor,
                    height: '8px',
                    borderRadius: radius.full,
                    width: `${accuracy}%`,
                  }} />
                </div>
              </div>

              {/* Skills mastered this session */}
              {masteredSkills.length > 0 && (
                <div>
                  <p style={{ fontSize: font.base, fontWeight: '600', color: colors.textSecondary, margin: '0 0 8px' }}>
                    ✓ Mastered this session
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    {masteredSkills.map(([skillId, data]) => (
                      <div key={skillId} style={{
                        padding: '10px 14px',
                        borderRadius: radius.md,
                        background: colors.successLight,
                        border: `1px solid ${colors.successBorder}`,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: '8px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: font.base, color: colors.textPrimary, fontWeight: '500' }}>
                            {skillsById[skillId]?.name ?? skillId}
                          </span>
                          <span style={{ fontSize: font.sm, fontWeight: '700', color: colors.successText }}>
                            🎉 Mastered
                          </span>
                        </div>
                        <ProgressDelta data={data} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills still in progress */}
              {practicedSkills.length > 0 && (
                <div>
                  <p style={{ fontSize: font.base, fontWeight: '600', color: colors.textSecondary, margin: '0 0 8px' }}>
                    In progress
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
                    {practicedSkills.map(([skillId, data]) => (
                      <div key={skillId} style={{
                        padding: '10px 14px',
                        borderRadius: radius.md,
                        background: colors.cardAlt,
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: '8px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: font.base, color: colors.textPrimary, fontWeight: '500' }}>
                            {skillsById[skillId]?.name ?? skillId}
                          </span>
                          <span style={{ fontSize: '11px', color: colors.textHint }}>
                            {data.totalInWindow >= 5
                              ? `${Math.max(0, 4 - data.correctInWindow)} more to master`
                              : `${data.correctInWindow}/${data.totalInWindow} correct`}
                          </span>
                        </div>
                        <ProgressDelta data={data} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
                <button
                  onClick={() => router.push(studentId ? '/student/dashboard' : '/practice')}
                  style={primaryButton}
                >
                  {studentId ? 'Return to Dashboard' : 'Back to Practice Home'}
                </button>
                <button
                  onClick={() => setShowSessionSummary(false)}
                  style={secondaryButton}
                >
                  Keep practising
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </main>
  )
}

export default function QuestionPageWrapper() {
  return (
    <Suspense fallback={<main style={{ padding: '24px' }}><p>Loading...</p></main>}>
      <QuestionPage />
    </Suspense>
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