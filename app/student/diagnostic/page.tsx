'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getStudentProfile, PENDING_PLACEMENT_KEY } from '../../../lib/auth'
import { courses } from '../../../data/courses'
import { skillsById, getPrerequisiteTree, getDependentTree } from '../../../lib/skills/skillGraph'
import { studentMastery, placementGapIds, type AttemptKind } from '../../../lib/skills/masteryEngine'
import { renderQuestion, type RenderedQuestion } from '../../../lib/questions/paramEngine'
import { checkAnswer } from '../../../lib/questions/answerChecker'
import { buildOptions, renderMcOptions } from '../../../lib/questions/multipleChoice'
import MathInput from '../../../components/practice/MathInput'
import { trackEvent } from '../../../lib/analytics'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton,
} from '../../../lib/styles'

// ── Constants ────────────────────────────────────────────────────────────────

const QUESTION_COUNT = 10
const MAX_PER_TOPIC  = 2   // ensures spread across topic areas

// ── Types ────────────────────────────────────────────────────────────────────

type Tier = 'foundation' | 'higher'

type Phase = 'setup' | 'loading' | 'running' | 'complete'

type Question = {
  id: string
  skill_ids: string[]
  difficulty: number
  question_type: string
  question_template: string
  parameters: any
  answer_template: string
  answer_type: 'exact' | 'numeric' | 'fraction' | 'expression' | 'ratio' | 'coordinate'
  tolerance: number | null
  requires_simplest?: boolean
  traps: { answer_template: string; response: string }[]
  explanation: string | null
  image_url: string | null
  mc_options?: string[] | null
}

type DiagnosticItem = {
  skillId: string
  question: Question
  rendered: RenderedQuestion
  options: string[]         // non-empty only for multiple_choice questions
}

type FeedbackState = {
  correct: boolean
  message: string
  explanation: string | null
}

/** The mastery-relevant shape of a practice_attempts row. */
type AttemptRow = {
  skill_ids: string[]
  correct: boolean
  attempted_at: string
  kind?: AttemptKind
}

// ── Skill selection ──────────────────────────────────────────────────────────

/**
 * Score a skill by its position in the dependency graph.
 * The greedy diagnostic's impact formula — min(prereqs, dependents) — identifies
 * skills that are informative regardless of which way the student answers.
 * We use this as a sampling score, not for inference propagation.
 */
function impactScore(skillId: string, allIds: Set<string>): number {
  const prereqs    = getPrerequisiteTree(skillId).filter(id => allIds.has(id))
  const dependents = getDependentTree(skillId).filter(id => allIds.has(id))
  return Math.min(prereqs.length + 1, dependents.length + 1)
}

/**
 * Select up to `count` skills that give broad, informative coverage.
 *
 * Strategy:
 *  1. Score every skill by impact (skills in the middle of the graph score highest).
 *  2. Pick the highest-scoring skills first, capped at MAX_PER_TOPIC per topic
 *     so no single area dominates the diagnostic.
 *  3. Fill any remaining slots from the globally highest-scoring unselected skills.
 *
 * This gives curriculum-wide coverage at the most structurally informative points,
 * without running the greedy selection loop or doing any inference.
 */
function selectDiagnosticSkills(tierSkillIds: string[], count: number): string[] {
  const allIds = new Set(tierSkillIds)

  // Score and sort all skills globally, highest impact first
  const scored = tierSkillIds
    .map(skillId => ({
      skillId,
      score: impactScore(skillId, allIds),
      topic: skillsById[skillId]?.topic ?? 'Other',
    }))
    .sort((a, b) => b.score - a.score)

  const selected     = new Set<string>()
  const topicCounts: Record<string, number> = {}

  // Pass 1 — spread across topics (at most MAX_PER_TOPIC each)
  for (const { skillId, topic } of scored) {
    if (selected.size >= count) break
    if ((topicCounts[topic] ?? 0) < MAX_PER_TOPIC) {
      selected.add(skillId)
      topicCounts[topic] = (topicCounts[topic] ?? 0) + 1
    }
  }

  // Pass 2 — fill remaining slots from highest-impact unselected skills
  for (const { skillId } of scored) {
    if (selected.size >= count) break
    selected.add(skillId)
  }

  return Array.from(selected)
}

// ── Results ──────────────────────────────────────────────────────────────────

/**
 * What this sitting did to the student's map — computed with studentMastery,
 * the same function the dashboard uses, so the results screen and the
 * dashboard cannot say different things (docs/audit/17, finding 2).
 *
 * `prior` is everything the student had done before the test (a snapshot taken
 * when it started, so this never races the inserts).
 */
function summarise(prior: AttemptRow[], sitting: AttemptRow[], items: DiagnosticItem[]) {
  const before = studentMastery(prior, getPrerequisiteTree)
  const after  = studentMastery([...prior, ...sitting], getPrerequisiteTree)
  const tested = new Set(items.map(it => it.skillId))

  // Skills the placement answers now decide. A tested skill the student has
  // already practised is decided by that practice instead (the prior only
  // fills in, or agrees with, what practice says) — reported separately.
  const fromPlacement = (id: string) => after[id]?.source === 'placement'

  const gaps      = placementGapIds(after).filter(id => tested.has(id))
  const strengths = items.map(it => it.skillId)
    .filter(id => fromPlacement(id) && after[id].status === 'mastered')
  const credited  = Object.values(after)
    .filter(m => m.source === 'placement' && m.inferred && !tested.has(m.skillId))
    .filter(m => before[m.skillId]?.status !== 'mastered')
    .map(m => m.skillId)
  const tracked   = items.map(it => it.skillId).filter(id => !fromPlacement(id))

  return { gaps, strengths, credited, tracked }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StudentDiagnosticPage() {
  const router = useRouter()

  const [studentId, setStudentId] = useState<string | null>(null)
  const [tier,      setTier]      = useState<Tier>('foundation')
  const [phase,     setPhase]     = useState<Phase>('setup')

  const [items,           setItems]           = useState<DiagnosticItem[]>([])
  const [index,           setIndex]           = useState(0)
  const [correctCount,    setCorrectCount]    = useState(0)
  const [results,         setResults]         = useState<boolean[]>([])
  const [answer,          setAnswer]          = useState('')
  const [feedback,        setFeedback]        = useState<FeedbackState | null>(null)
  const [pendingAttempts, setPendingAttempts] = useState<Array<{question_id: string; skill_ids: string[]; correct: boolean; at: string}>>([])
  // The student's attempts before this sitting, and this sitting's answers as
  // placement attempts — the two inputs to the results summary.
  const [priorAttempts,   setPriorAttempts]   = useState<AttemptRow[]>([])
  const [sitting,         setSitting]         = useState<AttemptRow[]>([])
  // In-flight inserts, awaited before leaving for practice so the practice page
  // reads a map that already includes this sitting.
  const saves = useRef<PromiseLike<unknown>[]>([])


  useEffect(() => {
    getStudentProfile().then(p => {
      if (p) setStudentId(p.id)
      // Anonymous users are allowed — their answers are buffered in state and
      // saved to localStorage at completion, then imported when they sign up.
    })
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getTierSkillIds(t: Tier): string[] {
    const foundation = courses.find(c => c.id === 'gcse_foundation')?.skills ?? []
    if (t === 'foundation') return foundation
    const higher = courses.find(c => c.id === 'gcse_higher')?.skills ?? []
    // Higher diagnostic covers everything — Higher students still need Foundation skills
    return [...new Set([...foundation, ...higher])]
  }

  // ── Begin ──────────────────────────────────────────────────────────────────

  async function beginDiagnostic() {
    trackEvent('diagnostic_start', { tier })
    setPhase('loading')

    const tierSkillIds  = getTierSkillIds(tier)
    const tierSkillSet  = new Set(tierSkillIds)

    // Fetch all published questions for this tier in one query.
    // We do this first so we can see which skills actually have question coverage
    // before running the impact-scored selection. Without this step, the selector
    // picks from the full curriculum and most chosen skills silently have no
    // questions, leaving the diagnostic short.
    //
    // Alongside it, snapshot the student's existing attempts: the results screen
    // compares the map before and after this sitting.
    const [{ data: allQuestionsRaw }, prior] = await Promise.all([
      supabase
        .from('questions')
        .select('*')
        .eq('is_published', true)
        .overlaps('skill_ids', tierSkillIds),
      studentId
        ? supabase
            .from('practice_attempts')
            .select('skill_ids, correct, attempted_at, kind')
            .eq('student_id', studentId)
            .then(({ data }) => (data ?? []) as AttemptRow[])
        : Promise.resolve([] as AttemptRow[]),
    ])
    setPriorAttempts(prior)
    setSitting([])

    // The diagnostic serves ONE question per skill through the single-part
    // renderer (renderQuestion against q.answer_template). A multi-part question
    // (parts jsonb) has an empty top-level answer_template, so it would render
    // with no correct answer and every response would be graded wrong. Exclude
    // them here — the practice flow handles parts properly; the diagnostic does
    // not. (audit L1)
    const allQuestions = (allQuestionsRaw ?? []).filter(
      q => !(Array.isArray(q.parts) && q.parts.length > 0)
    )

    if (allQuestions.length === 0) {
      router.push('/practice')
      return
    }

    // Derive which skills in this tier have at least one question
    const coveredSkillIds = new Set<string>()
    for (const q of allQuestions) {
      for (const id of q.skill_ids) {
        if (tierSkillSet.has(id)) coveredSkillIds.add(id)
      }
    }

    // Select the most informative skills from only those with question coverage
    const selectableSkillIds = tierSkillIds.filter(id => coveredSkillIds.has(id))
    const selectedSkills     = selectDiagnosticSkills(selectableSkillIds, QUESTION_COUNT)

    // Build one diagnostic item per selected skill.
    // Track used question IDs so the same question never appears twice even if
    // it covers multiple selected skills.
    const usedIds = new Set<string>()
    const built: DiagnosticItem[] = []

    for (const skillId of selectedSkills) {
      if (built.length >= QUESTION_COUNT) break

      const candidates = allQuestions.filter(
        q => q.skill_ids.includes(skillId) && !usedIds.has(q.id)
      )
      if (candidates.length === 0) continue

      const q = candidates[Math.floor(Math.random() * candidates.length)] as Question
      usedIds.add(q.id)

      const r = renderQuestion(
        q.question_template,
        q.answer_template,
        q.traps ?? [],
        q.explanation,
        q.parameters ?? {},
      )

      built.push({
        skillId,
        question: q,
        rendered: r,
        options: q.question_type === 'multiple_choice' ? buildOptions(r.answer, r.traps, renderMcOptions(q.mc_options, r.generatedValues)) : [],
      })
    }

    if (built.length === 0) {
      router.push('/practice')
      return
    }

    setItems(built)
    setPhase('running')
  }

  // ── Answer handling ────────────────────────────────────────────────────────

  function handleAnswer(chosen: string) {
    if (feedback) return                        // already answered this question
    const item = items[index]
    if (!item) return

    const result = checkAnswer(
      chosen,
      item.rendered.answer,
      item.question.answer_type,
      item.question.tolerance,
      item.rendered.traps,
      item.question.requires_simplest ?? false,
      item.question.answer_template,
    )

    setAnswer(chosen)
    setFeedback({
      correct: result.correct,
      message: result.message,
      explanation: item.rendered.explanation,
    })
    setResults(r => [...r, result.correct])
    if (result.correct) setCorrectCount(c => c + 1)

    const at = new Date().toISOString()
    setSitting(s => [...s, { skill_ids: [item.skillId], correct: result.correct, attempted_at: at, kind: 'placement' }])

    // Record the answer as a PLACEMENT attempt: a prior on the targeted skill,
    // not practice (lib/skills/masteryEngine.ts → placementPriors). skill_ids
    // holds only the targeted skill so it lands on exactly that skill.
    if (studentId) {
      saves.current.push(
        supabase
          .from('practice_attempts')
          .insert({
            student_id: studentId,
            question_id: item.question.id,
            skill_ids: [item.skillId],
            correct: result.correct,
            kind: 'placement',
          })
          .then(({ error }) => {
            if (error) console.error('Failed to save placement answer:', error)
          })
      )
    } else {
      // Anonymous user — buffer locally; imported to the database at sign-up/login.
      setPendingAttempts(prev => [...prev, {
        question_id: item.question.id,
        skill_ids:   [item.skillId],
        correct:     result.correct,
        at,
      }])
    }
  }

  function handleSubmit() {
    if (!answer.trim() || feedback) return
    handleAnswer(answer)
  }

  function handleNext() {
    if (index + 1 >= items.length) {
      // Persist buffered answers so they survive the sign-up email confirmation
      // flow (user opens a new tab or closes the browser, then logs in later).
      // Every login path imports them (lib/auth → migratePendingPractice).
      if (!studentId && pendingAttempts.length > 0) {
        localStorage.setItem(PENDING_PLACEMENT_KEY, JSON.stringify(pendingAttempts))
      }
      const summary = summarise(priorAttempts, sitting, items)
      trackEvent('diagnostic_complete', {
        correct: correctCount,
        total: items.length,
        gaps: summary.gaps.length,
        credited: summary.credited.length,
      })
      setPhase('complete')
    } else {
      setIndex(i => i + 1)
      setAnswer('')
      setFeedback(null)
    }
  }

  async function practiseGaps(gapCount: number) {
    trackEvent('placement_gaps_practice_clicked', { gaps: gapCount })
    await Promise.all(saves.current)
    router.push('/practice?focus=gaps')
  }

  // ── Render: loading ────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary, margin: 0 }}>Preparing your diagnostic…</p>
      </main>
    )
  }

  // ── Render: setup ──────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <main style={styles.page}>
        <div style={{ textAlign: 'center' as const }}>
          <Link href="/" style={{ fontSize: font.xl, fontWeight: '800', color: colors.primary, textDecoration: 'none', letterSpacing: '-0.02em' }}>
            Mathsense
          </Link>
        </div>

        <div style={card}>
          <div style={{ textAlign: 'center' as const }}>
            <h1 style={{ fontSize: font['2xl'], fontWeight: '800', color: colors.textPrimary, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              GCSE Maths Diagnostic
            </h1>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
              Answer {QUESTION_COUNT} questions across different topic areas. Mathsense will map
              where you&apos;re strong and where to focus. Takes around 5 minutes.
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '10px',
            padding: '16px',
            background: colors.cardAlt,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
          }}>
            {[
              { icon: '⏱', text: 'Takes 5–10 minutes' },
              { icon: '📊', text: 'Covers all major GCSE topics' },
              { icon: '💡', text: 'No revision needed — just give it a go' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span style={{ fontSize: font.base, color: colors.textSecondary }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
              Which tier are you studying?
            </p>
            <div style={styles.toggle}>
              {(['foundation', 'higher'] as Tier[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  style={{
                    ...styles.toggleButton,
                    background: tier === t ? colors.primary : 'transparent',
                    color:      tier === t ? '#ffffff' : colors.textSecondary,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button onClick={beginDiagnostic} style={{ ...primaryButton, fontWeight: '800', fontSize: font.lg }}>
            Start diagnostic →
          </button>

          {!studentId && (
            <div style={{ textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
                Already have an account?{' '}
                <a href="/student" style={{ color: colors.primary, fontWeight: '600', textDecoration: 'underline' }}>
                  Log in
                </a>
                {' '}to save your results automatically.
              </p>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ── Render: complete ───────────────────────────────────────────────────────

  if (phase === 'complete') {
    const total = items.length
    const pct   = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const { gaps, credited, tracked } = summarise(priorAttempts, sitting, items)

    // Group items + results by topic
    const byTopic: Record<string, { item: DiagnosticItem; correct: boolean }[]> = {}
    items.forEach((item, i) => {
      const topic = skillsById[item.skillId]?.topic ?? 'Other'
      if (!byTopic[topic]) byTopic[topic] = []
      byTopic[topic].push({ item, correct: results[i] ?? false })
    })

    // Credited prerequisites, grouped by topic for display.
    const creditedByTopic: Record<string, string[]> = {}
    for (const skillId of credited) {
      const topic = skillsById[skillId]?.topic ?? 'Other'
      if (!creditedByTopic[topic]) creditedByTopic[topic] = []
      creditedByTopic[topic].push(skillId)
    }

    const scoreColor = pct >= 70 ? colors.successText : pct >= 40 ? colors.warningText : colors.dangerText
    const scoreBg    = pct >= 70 ? colors.successLight : pct >= 40 ? colors.warningLight : colors.dangerLight
    const scoreBorder = pct >= 70 ? colors.successBorder : pct >= 40 ? colors.warningBorder : colors.dangerBorder

    return (
      <main style={styles.page}>
        <div style={card}>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', color: colors.textPrimary, margin: '0 0 16px' }}>
            Diagnostic complete
          </h1>

          {/* Score summary */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 16px',
            borderRadius: radius.lg,
            background: scoreBg,
            border: `1px solid ${scoreBorder}`,
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: scoreColor, lineHeight: 1 }}>
              {correctCount}/{total}
            </span>
            <div>
              <p style={{ fontSize: font.md, fontWeight: '600', color: scoreColor, margin: 0 }}>
                {pct >= 70 ? 'Great work!' : pct >= 40 ? 'Good start!' : 'Keep practising!'}
              </p>
              <p style={{ fontSize: font.sm, color: scoreColor, margin: 0 }}>
                {pct}% correct · {studentId ? 'Saved to your dashboard.' : 'Sign up to save your results.'}
              </p>
            </div>
          </div>

          {/* The rule, once — so the dashboard's labels make sense later. */}
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 20px', lineHeight: '1.5' }}>
            These are your starting points. Practise any skill and your own answers take over.
          </p>

          {/* Gaps found — the hand-off this test exists for */}
          {gaps.length > 0 && (
            <div style={{
              marginBottom: '20px',
              padding: '14px 16px',
              borderRadius: radius.lg,
              background: colors.dangerLight,
              border: `1px solid ${colors.dangerBorder}`,
            }}>
              <p style={{ fontSize: font.base, fontWeight: '700', color: colors.dangerText, margin: '0 0 4px' }}>
                {gaps.length} gap{gaps.length !== 1 ? 's' : ''} found
              </p>
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 12px', lineHeight: '1.5' }}>
                {studentId
                  ? 'These are marked Needs practice on your dashboard until you practise them.'
                  : 'Create a free account to save these and practise them.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: studentId ? '14px' : 0 }}>
                {gaps.map(skillId => (
                  <span key={skillId} style={{
                    fontSize: font.sm,
                    padding: '3px 10px',
                    borderRadius: radius.full,
                    background: colors.card,
                    color: colors.dangerText,
                    border: `1px solid ${colors.dangerBorder}`,
                  }}>
                    {skillsById[skillId]?.name ?? skillId}
                  </span>
                ))}
              </div>
              {studentId && (
                <button onClick={() => practiseGaps(gaps.length)} style={primaryButton}>
                  Practise your gaps →
                </button>
              )}
            </div>
          )}

          {/* Per-topic breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            {Object.entries(byTopic).map(([topic, entries]) => {
              const topicCorrect = entries.filter(e => e.correct).length
              const topicTotal   = entries.length
              return (
                <div key={topic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                      {topic}
                    </span>
                    <span style={{ fontSize: font.sm, fontWeight: '600', color: topicCorrect === topicTotal ? colors.successText : colors.textSecondary }}>
                      {topicCorrect}/{topicTotal}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {entries.map(({ item, correct }) => (
                      <div key={item.skillId} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: radius.md,
                        background: correct ? colors.successLight : colors.dangerLight,
                        border: `1px solid ${correct ? colors.successBorder : colors.dangerBorder}`,
                      }}>
                        <span style={{ fontSize: font.base, fontWeight: '700', color: correct ? colors.successText : colors.dangerText, flexShrink: 0 }}>
                          {correct ? '✓' : '✗'}
                        </span>
                        <span style={{ fontSize: font.base, color: correct ? colors.successText : colors.dangerText }}>
                          {skillsById[item.skillId]?.name ?? item.skillId}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Practice already decides these — say so rather than imply the test did. */}
          {tracked.length > 0 && (
            <p style={{ fontSize: font.sm, color: colors.textHint, margin: '0 0 20px', lineHeight: '1.5' }}>
              You&apos;ve already practised {tracked.length === 1 ? 'one of these skills' : `${tracked.length} of these skills`}, so
              your practice answers keep deciding {tracked.length === 1 ? 'it' : 'them'}.
            </p>
          )}

          {/* Credited prerequisite skills */}
          {credited.length > 0 && (
            <div style={{
              marginBottom: '20px',
              padding: '14px 16px',
              borderRadius: radius.lg,
              background: colors.cardAlt,
              border: `1px solid ${colors.border}`,
            }}>
              <p style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary, margin: '0 0 4px' }}>
                +{credited.length} prerequisite skill{credited.length !== 1 ? 's' : ''} also credited
              </p>
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 12px', lineHeight: '1.5' }}>
                Because you answered these questions correctly, Mathsense has marked the
                skills underneath them as mastered to start with.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(creditedByTopic).map(([topic, skillIds]) => (
                  <div key={topic}>
                    <p style={{
                      fontSize: font.sm,
                      fontWeight: '600',
                      color: colors.textSecondary,
                      margin: '0 0 6px',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.05em',
                    }}>
                      {topic}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                      {skillIds.map(skillId => (
                        <span key={skillId} style={{
                          fontSize: font.sm,
                          padding: '3px 10px',
                          borderRadius: radius.full,
                          background: colors.successLight,
                          color: colors.successText,
                          border: `1px solid ${colors.successBorder}`,
                        }}>
                          {skillsById[skillId]?.name ?? skillId}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studentId ? (
            <button
              onClick={() => router.push('/student/dashboard')}
              style={gaps.length > 0 ? secondaryButton : primaryButton}
            >
              View my dashboard →
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                padding: '16px',
                borderRadius: radius.lg,
                background: colors.cardAlt,
                border: `1px solid ${colors.border}`,
              }}>
                <p style={{ fontSize: font.md, fontWeight: '700', color: colors.textPrimary, margin: '0 0 6px' }}>
                  Save your results &amp; track your progress
                </p>
                <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.5' }}>
                  Create a free account to save your skill map, see these results on your dashboard, and practise the gaps this test found.
                </p>
              </div>
              <button
                onClick={() => router.push('/student')}
                style={primaryButton}
              >
                Create free account →
              </button>
              <button
                onClick={() => router.push('/student')}
                style={{ ...secondaryButton, textAlign: 'center' as const }}
              >
                Already have an account? Log in
              </button>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ── Render: running ────────────────────────────────────────────────────────

  const item            = items[index]
  const questionNumber  = index + 1
  const total           = items.length
  const progressPercent = Math.round((index / total) * 100)
  const isLast          = index + 1 >= total

  if (!item) return null

  return (
    <main style={styles.page}>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
            Question {questionNumber} of {total}
          </span>
          <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
            {skillsById[item.skillId]?.topic ?? ''}
          </span>
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Skill label */}
      <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
        {skillsById[item.skillId]?.name ?? ''}
      </p>

      {/* Question */}
      <div style={card}>
        {item.question.image_url && (
          <img
            src={item.question.image_url}
            alt="Question diagram"
            style={{ maxWidth: '100%', borderRadius: radius.md, marginBottom: '12px', display: 'block' }}
          />
        )}
        <div
          style={{ fontSize: font.xl, color: colors.textPrimary, lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: item.rendered.question }}
        />
      </div>

      {/* Answer input — hidden once feedback is shown */}
      {!feedback && (
        item.question.question_type === 'multiple_choice' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {item.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <MathInput
              value={answer}
              onChange={setAnswer}
              onSubmit={handleSubmit}
              placeholder="Type your answer…"
            />
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              style={{ ...primaryButton, opacity: !answer.trim() ? 0.6 : 1 }}
            >
              Submit
            </button>
          </div>
        )
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
              margin: '0 0 4px',
              color: feedback.correct ? colors.successText : colors.dangerText,
            }}>
              {feedback.correct ? 'Correct' : 'Incorrect'}
            </p>
            <div
              style={{ fontSize: font.base, color: feedback.correct ? colors.successText : colors.dangerText }}
              dangerouslySetInnerHTML={{ __html: feedback.message }}
            />

            {/* Show the student's answer; correct answer when wrong */}
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontSize: font.sm, margin: 0, color: feedback.correct ? colors.successText : colors.dangerText }}>
                Your answer:{' '}
                <strong><span dangerouslySetInnerHTML={{ __html: answer }} /></strong>
              </p>
              {!feedback.correct && (
                <p style={{ fontSize: font.sm, margin: 0, color: colors.dangerText }}>
                  Correct answer:{' '}
                  <strong><span dangerouslySetInnerHTML={{ __html: item.rendered.answer }} /></strong>
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
                Explanation
              </p>
              <div
                style={{ fontSize: font.base, color: colors.textPrimary }}
                dangerouslySetInnerHTML={{ __html: feedback.explanation }}
              />
            </div>
          )}

          <button onClick={handleNext} style={primaryButton}>
            {isLast ? 'Finish' : 'Next question →'}
          </button>
        </div>
      )}

    </main>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  toggle: {
    display: 'flex',
    borderRadius: radius.md,
    overflow: 'hidden',
    border: `1px solid ${colors.borderStrong}`,
  },
  toggleButton: {
    flex: 1,
    padding: '10px',
    border: 'none',
    fontSize: font.base,
    fontWeight: '600',
    cursor: 'pointer',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    background: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: colors.primary,
    borderRadius: radius.full,
    transition: 'width 0.3s ease',
  },
}
