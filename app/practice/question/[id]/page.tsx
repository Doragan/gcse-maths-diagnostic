'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
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
import { buildOptions, renderMcOptions } from '../../../../lib/questions/multipleChoice'
import { getCachedStudentId } from '../../../../lib/auth'
import { hasBriefing } from '../../../../data/skillBriefings'
import { skillPath } from '../../../../lib/skills/slug'
import { trackEvent } from '../../../../lib/analytics'
import { appendPendingAttempt } from '../../../../lib/pendingPractice'
import { calculatorValuesFor, type CalculatorFilter } from '../../../../lib/questions/calculator'
import { getCalculatorFilter } from '../../../../lib/questions/calculatorPreference'
import { isCheckpoint, closestToMastery, SESSION_LENGTH } from '../../../../lib/practice/session'
import { computeWeeklyGoal } from '../../../../lib/skills/weeklyGoal'
import { pickStepUp, type StepUpCandidate } from '../../../../lib/skills/stepUp'
import { masteryStatusFor, attemptsToMastery } from '../../../../lib/skills/masteryEngine'
import type { QuestionPart } from '../../../../lib/questions/parts'
import type { ScalarAnswerType } from '../../../../lib/questions/answerTypes'
import MultiPartQuestion from '../../../../components/practice/MultiPartQuestion'
import SignUpPrompt, { registerQuestionForNudge } from '../../../../components/practice/SignUpPrompt'

type Question = {
  id: string
  skill_ids: string[]
  difficulty: number
  question_type: string
  question_template: string
  parameters: any
  answer_template: string
  answer_type: ScalarAnswerType
  tolerance: number | null
  requires_simplest?: boolean
  traps: { answer_template: string, response: string, misconception?: string | null }[]
  explanation: string | null
  image_url: string | null
  is_published: boolean
  kind?: 'mastery' | 'exam'
  parts?: QuestionPart[] | null
  mc_options?: string[] | null
}

type FeedbackState = {
  correct: boolean
  message: string
  explanation: string
}

// ── Session-lived caches (module scope survives client-side navigations) ──────
// The practice flow loads a fresh page per question. These caches stop us from
// re-querying things that don't change between questions:
//   • questionCache — full question rows by id (warmed by prefetch on load)
//   • poolCache     — the set of published question ids for a given skill set + calculator filter
const questionCache = new Map<string, Question>()
const poolCache = new Map<string, string[]>()

/** Random element of a non-empty array. */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Resolves the active skill pool from the stored tier + any focus override. */
function resolveSkillIds(): string[] {
  const storedTier = sessionStorage.getItem('practice_tier') ?? 'foundation'
  const foundation = courses.find(c => c.id === 'gcse_foundation')?.skills ?? []
  const higher = courses.find(c => c.id === 'gcse_higher')?.skills ?? []
  const higherOnly = higher.filter(hid => !foundation.includes(hid))
  let skillIds = storedTier === 'foundation' ? foundation
    : storedTier === 'higher' ? higherOnly
    : [...new Set([...foundation, ...higher])]

  // Honour an active focus mode (skill / topic / weak-spot blitz) so the whole
  // session stays on-target. Auto mode leaves this key unset.
  try {
    const focusRaw = sessionStorage.getItem('practice_focus_skills')
    if (focusRaw) {
      const focusSkills = JSON.parse(focusRaw) as string[]
      if (Array.isArray(focusSkills) && focusSkills.length > 0) skillIds = focusSkills
    }
  } catch { /* malformed storage — fall back to the tier pool */ }

  return skillIds
}

/** Fetches (and caches for the session) the published question-id pool. */
async function fetchQuestionPool(skillIds: string[], calcFilter: CalculatorFilter): Promise<string[]> {
  // Calculator mode is part of the cache key — without it, switching the
  // filter mid-session (the toggle lives on /practice, but sessionStorage
  // persists across the question-page navigations this cache spans) would
  // silently keep serving the pool cached under whichever mode was active
  // when this skill set was first fetched.
  const key = `${[...skillIds].sort().join(',')}|${calcFilter}`
  const cached = poolCache.get(key)
  if (cached) return cached

  const calcValues = calculatorValuesFor(calcFilter)
  let query = supabase
    .from('questions')
    .select('id')
    .eq('is_published', true)
    .overlaps('skill_ids', skillIds)
  if (calcValues) query = query.in('calculator', calcValues)
  const { data } = await query

  const ids = (data ?? []).map(q => q.id as string)
  poolCache.set(key, ids)
  return ids
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

  // When ?assignment_id= is present this question is part of an assignment.
  // Back and Next navigate to the assignment page rather than free practice.
  const assignmentId = searchParams.get('assignment_id')

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
  // A multi-part question using the skill just mastered — the "step up" offered
  // alongside the celebration. Null until one is found, and stays null when the
  // bank has none for that skill (roughly a third of the time), in which case
  // the celebration renders exactly as it did before.
  const [stepUp, setStepUp] = useState<{ id: string; parts: number } | null>(null)
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
  // Questions answered as of the answer currently on screen. Distinct from
  // sessionStats.total, which keeps climbing — this is pinned when the answer is
  // recorded, so the checkpoint banner belongs to THIS question and doesn't
  // reappear on the next one.
  const [answeredAtFeedback, setAnsweredAtFeedback] = useState(0)
  // This week's progress, fetched only when the summary opens. Null while
  // loading or for an anonymous student, in which case the line is omitted
  // rather than guessed at.
  const [weekly, setWeekly] = useState<{ answered: number; goal: number } | null>(null)
  // How the summary was opened, which decides what "Keep practising" means:
  // continue to the next question (the checkpoint interrupted that), or simply
  // close (they opened it themselves mid-question).
  const [summarySource, setSummarySource] = useState<'checkpoint' | 'manual'>('manual')
  // Bumped when re-serving the CURRENT question with fresh params. The MultiPart
  // component is keyed on it so it remounts (its render useMemo keys on the
  // question id, which doesn't change on a reparametrise). Without this, "Next
  // question" on a sole multi-part drill question silently does nothing. (audit L4)
  const [reparamNonce, setReparamNonce] = useState(0)

  // The question we've already prefetched (route + data warmed) for instant Next.
  const nextPick = useRef<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('practice_tier')
    if (stored) setTier(stored)
    loadQuestion()
    // Resolve studentId once per session (cached) instead of re-running an
    // auth.getUser() + students fetch on every question navigation.
    getCachedStudentId().then(id => setStudentId(id))
  }, [id])

  // Fetch the student's 5 most recent attempts for this question's primary skill,
  // so we can detect the exact moment mastery is reached client-side.
  //
  // `kind` is selected because a WRONG exam-kind attempt is positive-only — the
  // engine drops it entirely — so counting it here would put this page's window
  // out of step with the mastery it is trying to report. Five is enough for both
  // halves of the rule: see masteryStatusFor on why truncation is safe.
  useEffect(() => {
    if (!studentId || !question || question.skill_ids.length === 0) return
    supabase
      .from('practice_attempts')
      .select('correct, kind')
      .eq('student_id', studentId)
      .contains('skill_ids', [question.skill_ids[0]])
      .order('attempted_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setPriorSkillAttempts(
        (data ?? []).filter(a => !(a.kind === 'exam' && !a.correct))
      ))
  }, [studentId, question?.id])

  // Look for a step up once a skill is mastered. Deliberately AFTER the fact
  // rather than prefetched with the question: mastery is rare (57 events across
  // the whole user base to date), so speculatively querying on every question
  // would be one wasted round-trip per question to save a wait that almost never
  // happens. The celebration is already on screen while this resolves.
  useEffect(() => {
    if (!newlyMasteredSkill) { setStepUp(null); return }
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('questions')
        .select('id, difficulty, skill_ids, parts')
        .eq('is_published', true)
        .overlaps('skill_ids', [newlyMasteredSkill])
      if (cancelled || !data) return

      const candidates: StepUpCandidate[] = data.map(row => {
        const parts = Array.isArray(row.parts) ? row.parts : []
        return {
          id: row.id as string,
          difficulty: row.difficulty as number,
          skillIds: (row.skill_ids ?? []) as string[],
          partKinds: parts.map((p: { kind?: 'mastery' | 'exam' }) => p.kind ?? 'mastery'),
          partCount: parts.length,
        }
      })
      // Skills the student has actually met, so the pick avoids dragging in an
      // untouched one. sessionSkills is what this session has covered; it is a
      // floor, not the full history, which only makes the choice more cautious.
      const pick = pickStepUp(
        newlyMasteredSkill,
        candidates,
        Object.keys(sessionSkills),
        [id],                      // never re-offer the question just answered
      )
      // Track the OFFER, not just the click. Uptake is only meaningful as a
      // rate — "3 students tried it" says nothing without the denominator, and
      // whether this moment is one students want is exactly the open question.
      // `found: false` is recorded too, so a low take-up can be told apart from
      // a bank that had nothing to offer.
      trackEvent('stepup_offered', {
        skill_id: newlyMasteredSkill,
        found: !!pick,
        ...(pick ? { question_id: pick.id, parts: pick.partCount } : {}),
      })
      if (pick) setStepUp({ id: pick.id, parts: pick.partCount })
    })()
    return () => { cancelled = true }
  }, [newlyMasteredSkill, id])

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

    // Use the prefetched/cached row when available (instant); otherwise fetch it.
    let data = questionCache.get(id) ?? null
    if (!data) {
      const res = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single()
      if (res.error || !res.data) {
        router.push('/practice')
        return
      }
      data = res.data as Question
      questionCache.set(id, data)
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
      setOptions(buildOptions(r.answer, r.traps, renderMcOptions(data.mc_options, r.generatedValues)))
    }
    setLoading(false)

    // Warm the next question in the background while the student answers this one.
    prepareNext(id)
  }

  // Picks the next question now and warms it (route + full row) so that pressing
  // "Next question" navigates instantly. Stored in nextPick so nextQuestion()
  // uses the exact question we prefetched. Fire-and-forget; failures are silent.
  async function prepareNext(currentId: string) {
    try {
      const pool = await fetchQuestionPool(resolveSkillIds(), getCalculatorFilter())
      const others = pool.filter(qid => qid !== currentId)
      if (others.length === 0) { nextPick.current = null; return }

      const pick = pickRandom(others)
      nextPick.current = pick
      router.prefetch(`/practice/question/${pick}`)

      if (!questionCache.has(pick)) {
        const { data } = await supabase
          .from('questions')
          .select('*')
          .eq('id', pick)
          .single()
        if (data) questionCache.set(pick, data as Question)
      }
    } catch { /* prefetch is best-effort */ }
  }

  /**
   * @param misconception  Shared id for WHY the answer was wrong, from the
   *   trap that fired. Null when correct, when no trap matched, or when the
   *   matching trap is not tagged. Stored so a mistake can be counted ACROSS
   *   sessions and skills — the attempt row previously recorded only that an
   *   answer was wrong, never how, so that history did not exist.
   */
  async function recordAttempt(correct: boolean, misconception: string | null = null) {
    if (!question) return

    // Session stats (read from storage to avoid stale-closure issue)
    const prevTotal   = parseInt(sessionStorage.getItem('session_total')   ?? '0')
    const prevCorrect = parseInt(sessionStorage.getItem('session_correct') ?? '0')
    const newTotal    = prevTotal + 1
    const newCorrect  = prevCorrect + (correct ? 1 : 0)
    sessionStorage.setItem('session_total',   newTotal.toString())
    sessionStorage.setItem('session_correct', newCorrect.toString())
    setSessionStats({ correct: newCorrect, total: newTotal })
    setAnsweredAtFeedback(newTotal)

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

    // Count this answer toward the escalating anonymous sign-up nudge (a single-part
    // question = one answer = one question). See registerQuestionForNudge for the
    // milestone logic and why we lowered the first tier to 3.
    if (!studentId && registerQuestionForNudge()) setShowSignUpPrompt(true)
    if (!studentId) {
      // Anonymous: park the attempt in localStorage so it migrates into the
      // account on signup/login. appendPendingAttempt stamps it with the time it
      // was actually answered — see lib/pendingPractice.ts for why that matters.
      appendPendingAttempt({
        question_id: question.id,
        skill_ids: question.skill_ids,
        correct,
        kind: question.kind ?? 'mastery',
      })
      return
    }

    // Always record to practice_attempts for mastery / skill tracking.
    const { error: paError } = await supabase
      .from('practice_attempts')
      .insert({
        student_id: studentId,
        question_id: question.id,
        skill_ids: question.skill_ids,
        correct,
        kind: question.kind ?? 'mastery',
        misconception,
      })
    if (paError) console.error('Failed to record practice attempt:', paError.message) // audit L5

    // If this question is part of an assignment, also record it there.
    // The teacher can read assignment_attempts (class-context work); they cannot
    // read private practice_attempts (engagement-vs-detail boundary).
    if (assignmentId) {
      const { error: aaError } = await supabase
        .from('assignment_attempts')
        .insert({
          assignment_id: assignmentId,
          student_id:    studentId,
          question_id:   question.id,
          correct,
        })
      if (aaError) console.error('Failed to record assignment attempt:', aaError.message) // audit L5
    }
  }

  // Detects whether this correct answer tips the skill into mastered status for
  // the first time.  Uses the 5 prior attempts already fetched on question load —
  // no extra round-trip needed.
  function detectMastery(correct: boolean) {
    if (!correct || !question || question.skill_ids.length === 0) return
    // masteryStatusFor is the engine's own rule, so this fires on the fast-track
    // (first three correct) as well as the rolling window. It previously only
    // knew the window, and silently skipped a quarter of real mastery events.
    const masteredNow = masteryStatusFor([{ correct: true }, ...priorSkillAttempts]) === 'mastered'
    const wasMastered = masteryStatusFor(priorSkillAttempts) === 'mastered'
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
      question.requires_simplest ?? false,
      question.answer_template,
    )

    setFeedback({
      correct: result.correct,
      message: result.message,
      explanation: rendered.explanation,
    })
    detectMastery(result.correct)
    recordAttempt(result.correct, result.trap?.misconception ?? null)
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

  // In assignment (picked) mode: find the next question that still needs attention
  // and navigate to it directly, skipping the list page entirely.
  async function nextAssignmentQuestion() {
    if (!assignmentId || !studentId) {
      router.push(`/student/assignments/${assignmentId}`)
      return
    }

    const [aqRes, aaRes, aRes] = await Promise.all([
      supabase
        .from('assignment_questions')
        .select('question_id, position')
        .eq('assignment_id', assignmentId)
        .order('position', { ascending: true }),
      supabase
        .from('assignment_attempts')
        .select('question_id, correct')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId),
      supabase
        .from('assignments')
        .select('completion_mode, selection_mode')
        .eq('id', assignmentId)
        .single(),
    ])

    // Pool mode or fetch problem → fall back to assignment page
    if (!aRes.data || aRes.data.selection_mode !== 'picked') {
      router.push(`/student/assignments/${assignmentId}`)
      return
    }

    const questions  = (aqRes.data ?? []).map(q => q.question_id as string)
    const attempts   = aaRes.data ?? []
    const mode       = aRes.data.completion_mode as string

    const attemptedIds = new Set(attempts.map((a: any) => a.question_id as string))
    const correctIds   = new Set(attempts.filter((a: any) => a.correct).map((a: any) => a.question_id as string))

    // Rotate so we start searching after the current question
    const currentIdx = questions.indexOf(id)
    const rotated = currentIdx >= 0
      ? [...questions.slice(currentIdx + 1), ...questions.slice(0, currentIdx + 1)]
      : questions

    const isDone = (qId: string) =>
      mode === 'until_correct' ? correctIds.has(qId) : attemptedIds.has(qId)

    const next = rotated.find(qId => !isDone(qId))

    if (next) {
      router.push(`/practice/question/${next}?assignment_id=${assignmentId}`)
    } else {
      // All questions done — back to the assignment summary
      router.push(`/student/assignments/${assignmentId}`)
    }
  }

  /**
   * What "Next question →" does. At a checkpoint it opens the summary instead of
   * advancing — the one moment a session has a shape, and the student is already
   * signalling they're moving on, so nothing is interrupted.
   *
   * Shown once per checkpoint: "Keep practising" must not bounce straight back
   * into it, and neither should a student who reaches 20 after dismissing 10.
   * Assignments are excluded — those have their own defined end.
   */
  const checkpointShownFor = useRef(0)

  async function handleNextQuestion() {
    if (
      !assignmentId &&
      isCheckpoint(answeredAtFeedback) &&
      checkpointShownFor.current !== answeredAtFeedback
    ) {
      checkpointShownFor.current = answeredAtFeedback
      openSummary('checkpoint')
      return
    }
    await nextQuestion()
  }

  function openSummary(source: 'checkpoint' | 'manual') {
    setSummarySource(source)
    setShowSessionSummary(true)
    trackEvent('session_summary_opened', { source, answered: sessionStats.total })

    // This week's progress against the goal — the summary's "where you are"
    // line. One query, only when the summary actually opens, and only for a
    // signed-in student (an anonymous one has no history to count).
    if (!studentId) return
    supabase
      .from('practice_attempts')
      .select('attempted_at')
      .eq('student_id', studentId)
      .then(({ data }) => {
        if (!data) return
        const w = computeWeeklyGoal(data as { attempted_at: string }[])
        setWeekly({ answered: w.answered, goal: w.goal })
      })
  }

  async function nextQuestion() {
    // In assignment context, navigate directly to the next unanswered question.
    if (assignmentId) { await nextAssignmentQuestion(); return }

    // The pool is cached for the session, so this is usually instant.
    const pool = await fetchQuestionPool(resolveSkillIds(), getCalculatorFilter())

    // Prefer a question other than the current one for variety. Use the
    // already-prefetched pick when it's still valid so navigation is instant.
    const others = pool.filter(qid => qid !== id)
    if (others.length > 0) {
      const pick = nextPick.current && others.includes(nextPick.current)
        ? nextPick.current
        : pickRandom(others)
      router.push(`/practice/question/${pick}`)
      return
    }

    // Only the current question is in scope (common when drilling a skill that
    // has a single question). Rather than dumping the student back to /practice,
    // re-serve it with fresh parameters — questions are parametric, so the same
    // template keeps the drill varied. Falls back to /practice only if the pool
    // is genuinely empty.
    if (pool.length > 0) {
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
    // Remount a multi-part question (keyed on this nonce) so it re-renders with
    // fresh params; harmless no-op for the single-part path below. (audit L4)
    setReparamNonce(n => n + 1)
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
      setOptions(buildOptions(r.answer, r.traps, renderMcOptions(question.mc_options, r.generatedValues)))
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
    // Fold the attempt the student just made into the prior-attempts window
    // before clearing feedback. recordAttempt() already wrote it to the DB;
    // without this, tryAgain leaves priorSkillAttempts stale (it's only
    // refetched on a question-id change), so the mastery dots and detectMastery
    // recompute over a window missing that attempt → wrong dots and a possible
    // false "Skill mastered!" celebration on the next answer. (audit L3)
    if (feedback && question.skill_ids.length > 0) {
      setPriorSkillAttempts(prev => [{ correct: feedback.correct }, ...prev].slice(0, 5))
    }
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
      setOptions(buildOptions(r.answer, r.traps, renderMcOptions(question.mc_options, r.generatedValues)))
    }
  }

  // Bumps only the session correct/total counters (used by the multi-part flow,
  // which records its own per-part practice_attempts and skips the single-skill
  // mastery-dot machinery).
  function bumpSessionCounter(correct: boolean) {
    const prevTotal   = parseInt(sessionStorage.getItem('session_total')   ?? '0')
    const prevCorrect = parseInt(sessionStorage.getItem('session_correct') ?? '0')
    const newTotal    = prevTotal + 1
    const newCorrect  = prevCorrect + (correct ? 1 : 0)
    sessionStorage.setItem('session_total',   newTotal.toString())
    sessionStorage.setItem('session_correct', newCorrect.toString())
    setSessionStats({ correct: newCorrect, total: newTotal })
  }

  if (loading || !rendered || !question) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading question...</p>
      </main>
    )
  }

  // Multi-part questions get a dedicated sequential per-part flow.
  if (question.parts && question.parts.length > 0) {
    // Shared-link fixed values, applied to the FIRST draw only — "Try again"
    // remounts with a fresh random draw (mirrors the single-part behaviour).
    const multiFixed: Record<string, number> = {}
    let hasMultiFixed = false
    for (const key of Object.keys(question.parameters ?? {})) {
      const val = searchParams.get(key)
      if (val !== null && Number.isFinite(parseFloat(val))) {
        multiFixed[key] = parseFloat(val)
        hasMultiFixed = true
      }
    }
    return (
      <MultiPartQuestion
        key={`${question.id}-${reparamNonce}`}
        question={{
          id: question.id,
          skill_ids: question.skill_ids,
          difficulty: question.difficulty,
          question_template: question.question_template,
          parameters: question.parameters,
          image_url: question.image_url,
          parts: question.parts,
        }}
        studentId={studentId}
        assignmentId={assignmentId}
        onSessionAttempt={bumpSessionCounter}
        onNextQuestion={nextQuestion}
        onTryAgain={() => setReparamNonce(n => n + 1)}
        fixedValues={hasMultiFixed && reparamNonce === 0 ? multiFixed : undefined}
      />
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
          onClick={() => router.push(assignmentId ? `/student/assignments/${assignmentId}` : studentId ? '/student/dashboard' : '/practice')}
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
              onClick={() => openSummary('manual')}
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
						question.requires_simplest ?? false,
						question.answer_template,
					  )
					  setAnswer(opt)
					  setFeedback({
						correct: result.correct,
						message: result.message,
						explanation: rendered.explanation,
					  })
					  detectMastery(result.correct)
					  recordAttempt(result.correct, result.trap?.misconception ?? null)
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

          {/* Exam-briefing prompt. Shown only when this question's skill has an
              authored briefing, and only after a wrong answer — the briefing is
              a response to getting stuck, not a thing to browse. */}
          {!feedback.correct && question.skill_ids.some(hasBriefing) && (() => {
            const briefedId = question.skill_ids.find(hasBriefing)!
            const briefedName = skillsById[briefedId]?.name ?? 'this skill'
            return (
              <div style={{
                padding: '14px 16px',
                borderRadius: radius.lg,
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderLeft: `3px solid ${colors.primary}`,
              }}>
                <p style={{ fontSize: font.sm, fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px', color: colors.primaryHover }}>
                  New
                </p>
                <p style={{ fontSize: font.base, color: colors.textPrimary, margin: '0 0 10px' }}>
                  We&apos;ve written an exam briefing on {briefedName.toLowerCase()} — how to spot
                  the question, what it gets confused with, and how to check yourself.
                </p>
                <a
                  href={skillPath(briefedId)}
                  onClick={() => trackEvent('skill_briefing_prompt_click', { skill: briefedId, from: 'question_feedback' })}
                  style={{ fontSize: font.base, color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
                >
                  Read the {briefedName.toLowerCase()} briefing →
                </a>
              </div>
            )
          })()}

          {/* Animated skill progress dots */}
          {question.skill_ids.length > 0 && (() => {
            const skillId   = question.skill_ids[0]
            const skillName = skillsById[skillId]?.name ?? 'this skill'
            // Newest = index 0 in priorSkillAttempts (fetched descending)
            // Reverse so oldest is left, newest is right
            const beforeWindow = priorSkillAttempts.slice(0, 5).reverse()
            const afterWindow  = [{ correct: feedback.correct }, ...priorSkillAttempts].slice(0, 5).reverse()
            const correctAfter = afterWindow.filter(a => a.correct).length
            // Same rule as the celebration and the engine — otherwise the badge
            // could read "3/4 correct" beside a "Skill mastered!" banner.
            const isMastered   = masteryStatusFor([{ correct: feedback.correct }, ...priorSkillAttempts]) === 'mastered'
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
                  {feedback.correct && !isMastered && dotsPhase === 'after' && (() => {
                    const needed = attemptsToMastery([{ correct: feedback.correct }, ...priorSkillAttempts])
                    return (
                      <span style={{ fontSize: '11px', color: colors.textHint, marginLeft: '4px' }}>
                        {needed} more to master
                      </span>
                    )
                  })()}
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

              {/* The step up. Offered, never forced — "Next question" stays the
                  primary action, so a student who just wants to keep going is
                  not made to decide anything. */}
              {stepUp && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.successBorder}` }}>
                  <p style={{ fontSize: font.sm, color: colors.successText, margin: '0 0 8px', lineHeight: 1.5 }}>
                    Ready for a longer one? This {stepUp.parts}-part question uses it the way an exam would.
                  </p>
                  <button
                    onClick={() => {
                      trackEvent('stepup_accepted', {
                        skill_id: newlyMasteredSkill,
                        question_id: stepUp.id,
                        parts: stepUp.parts,
                      })
                      router.push(`/practice/question/${stepUp.id}`)
                    }}
                    style={{
                      ...secondaryButton,
                      width: 'auto', padding: '8px 16px', fontSize: font.base,
                      background: colors.card,
                    }}
                  >
                    Try the longer question →
                  </button>
                </div>
              )}
            </div>
          )}

          {/*
            The checkpoint. Deliberately an inline banner rather than a modal
            that fires on answering: a pop-up would cover the explanation for the
            question they just did, and a student who got it wrong needs to read
            that more than they need a scoreboard. This sits where their eyes
            already are, and only invites.
          */}
          {!assignmentId && isCheckpoint(answeredAtFeedback) && !showSessionSummary && (
            <div style={{
              margin: '0 0 12px', padding: '12px 14px',
              background: colors.successLight,
              border: `1px solid ${colors.successBorder}`,
              borderRadius: radius.md,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '10px', flexWrap: 'wrap' as const,
            }}>
              <span style={{ fontSize: font.base, color: colors.textPrimary, fontWeight: '500' }}>
                That&rsquo;s {answeredAtFeedback} questions{answeredAtFeedback === SESSION_LENGTH ? ' — a full session' : ''}.
              </span>
              <button
                onClick={() => { checkpointShownFor.current = answeredAtFeedback; openSummary('checkpoint') }}
                style={{
                  fontSize: font.sm, fontWeight: '600', color: colors.successText,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  textDecoration: 'underline',
                }}
              >
                See how you did →
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
			  {!feedback.correct && (
				<button onClick={tryAgain} style={{ ...secondaryButton, flex: 1 }}>
				  Try again
				</button>
			  )}
			  <button onClick={handleNextQuestion} style={{ ...primaryButton, flex: 1 }}>
				Next question →
			  </button>
			  <button onClick={handleShare} style={{ ...secondaryButton, flex: 1 }}>
				{shareLabel}
			  </button>
			</div>
        </div>
      )}

      {/* Sign-up prompt for anonymous users — copy escalates with how much they've done */}
      {showSignUpPrompt && !studentId && (
        <SignUpPrompt onDismiss={() => setShowSignUpPrompt(false)} />
      )}

      {/* Report an issue */}
      <ReportIssueButton
        questionId={id}
        renderedValues={rendered.generatedValues}
        studentId={studentId}
        answerContext={{
          answered: feedback !== null,
          answerType: question.answer_type,
          // The raw input, even if unsubmitted — useful on a "before I submit
          // this looks wrong" report.
          studentAnswer: answer.trim() || undefined,
          ...(feedback !== null
            ? { correct: feedback.correct, expectedAnswer: rendered.answer }
            : {}),
        }}
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
        const nextUp = closestToMastery(sessionSkills)
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

              {/*
                Where this week stands, and the one thing worth coming back for.
                The forward-looking line is deliberately specific: a named skill
                one answer from mastery is an open loop, where "see you soon" is
                nothing. Both are omitted rather than padded when there's no
                honest number — an anonymous student has no week, and not every
                session leaves a skill close enough to promise.
              */}
              {(weekly || nextUp) && (
                <div style={{
                  padding: '14px 16px',
                  background: colors.cardAlt,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.md,
                  display: 'flex', flexDirection: 'column' as const, gap: '6px',
                }}>
                  {weekly && (
                    <p style={{ fontSize: font.base, color: colors.textPrimary, margin: 0 }}>
                      <strong>{weekly.answered}/{weekly.goal}</strong> this week
                      {weekly.answered >= weekly.goal
                        ? ' — goal reached 🎉'
                        : ` — ${weekly.goal - weekly.answered} to go`}
                    </p>
                  )}
                  {nextUp && (
                    <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
                      Next time: {nextUp.remaining} more on{' '}
                      <strong>{skillsById[nextUp.skillId]?.name ?? nextUp.skillId}</strong> to master it.
                    </p>
                  )}
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
                  onClick={() => {
                    setShowSessionSummary(false)
                    // A checkpoint interrupted "Next question", so continuing
                    // means actually going there. Opened by hand, it just closes.
                    if (summarySource === 'checkpoint') void nextQuestion()
                  }}
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