'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getStudentProfile } from '../../../lib/auth'
import { courses } from '../../../data/courses'
import { skillsById, getPrerequisiteTree, getDependentTree } from '../../../lib/skills/skillGraph'
import { inferPrerequisiteMastery, type SkillMastery } from '../../../lib/skills/masteryEngine'
import { renderQuestion, type RenderedQuestion } from '../../../lib/questions/paramEngine'
import { checkAnswer } from '../../../lib/questions/answerChecker'
import { buildOptions } from '../../../lib/questions/multipleChoice'
import MathInput from '../../../components/practice/MathInput'
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
  answer_type: 'exact' | 'numeric' | 'fraction' | 'expression'
  tolerance: number | null
  traps: { answer_template: string; response: string }[]
  explanation: string | null
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

// ── Component ────────────────────────────────────────────────────────────────

export default function StudentDiagnosticPage() {
  const router = useRouter()

  const [studentId, setStudentId] = useState<string | null>(null)
  const [tier,      setTier]      = useState<Tier>('foundation')
  const [phase,     setPhase]     = useState<Phase>('setup')

  const [items,        setItems]        = useState<DiagnosticItem[]>([])
  const [index,        setIndex]        = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [results,      setResults]      = useState<boolean[]>([])
  const [answer,       setAnswer]       = useState('')
  const [feedback,     setFeedback]     = useState<FeedbackState | null>(null)

  useEffect(() => {
    getStudentProfile().then(p => {
      if (!p) { router.push('/student'); return }
      setStudentId(p.id)
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
    setPhase('loading')

    const tierSkillIds  = getTierSkillIds(tier)
    const tierSkillSet  = new Set(tierSkillIds)

    // Fetch all published questions for this tier in one query.
    // We do this first so we can see which skills actually have question coverage
    // before running the impact-scored selection. Without this step, the selector
    // picks from the full curriculum and most chosen skills silently have no
    // questions, leaving the diagnostic short.
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('is_published', true)
      .overlaps('skill_ids', tierSkillIds)

    if (!allQuestions || allQuestions.length === 0) {
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
        options: q.question_type === 'multiple_choice' ? buildOptions(r.answer, r.traps) : [],
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
    )

    setAnswer(chosen)
    setFeedback({
      correct: result.correct,
      message: result.message,
      explanation: item.rendered.explanation,
    })
    setResults(r => [...r, result.correct])
    if (result.correct) setCorrectCount(c => c + 1)

    // Record one honest practice_attempt — skill_ids contains only the
    // targeted skill so the mastery engine attributes this to the right skill.
    if (studentId) {
      supabase
        .from('practice_attempts')
        .insert({
          student_id: studentId,
          question_id: item.question.id,
          skill_ids: [item.skillId],
          correct: result.correct,
        })
        .then(({ error }) => {
          if (error) console.error('Failed to save diagnostic attempt:', error)
        })
    }
  }

  function handleSubmit() {
    if (!answer.trim() || feedback) return
    handleAnswer(answer)
  }

  function handleNext() {
    if (index + 1 >= items.length) {
      setPhase('complete')
    } else {
      setIndex(i => i + 1)
      setAnswer('')
      setFeedback(null)
    }
  }

  // ── Render: loading ────────────────────────────────────────────────────────

  if (!studentId || phase === 'loading') {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary, margin: 0 }}>
          {phase === 'loading' ? 'Preparing your diagnostic…' : 'Loading…'}
        </p>
      </main>
    )
  }

  // ── Render: setup ──────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <main style={styles.page}>
        <div style={card}>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', color: colors.textPrimary, margin: '0 0 8px' }}>
            Placement diagnostic
          </h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 20px', lineHeight: '1.6' }}>
            Answer {QUESTION_COUNT} questions across different topic areas and Mathsense
            will identify where you are strong and where to focus your practice.
            Takes around 5 minutes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <p style={{ fontSize: font.base, fontWeight: '500', color: colors.textPrimary, margin: 0 }}>
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

          <button onClick={beginDiagnostic} style={primaryButton}>
            Begin diagnostic
          </button>
          <button
            onClick={() => router.back()}
            style={{ ...secondaryButton, marginTop: '8px' }}
          >
            Go back
          </button>
        </div>
      </main>
    )
  }

  // ── Render: complete ───────────────────────────────────────────────────────

  if (phase === 'complete') {
    const total = items.length
    const pct   = total > 0 ? Math.round((correctCount / total) * 100) : 0

    // Group items + results by topic
    const byTopic: Record<string, { item: DiagnosticItem; correct: boolean }[]> = {}
    items.forEach((item, i) => {
      const topic = skillsById[item.skillId]?.topic ?? 'Other'
      if (!byTopic[topic]) byTopic[topic] = []
      byTopic[topic].push({ item, correct: results[i] ?? false })
    })

    // Compute inferred prerequisite skills from correct diagnostic answers.
    // Build a one-attempt mastery map for each correctly answered skill, then
    // run the same inference the dashboard uses.
    const diagnosticMastery: Record<string, SkillMastery> = {}
    items.forEach((item, i) => {
      if (results[i]) {
        diagnosticMastery[item.skillId] = {
          skillId: item.skillId,
          status: 'in_progress',
          recentAttempts: 1,
          recentCorrect: 1,
        }
      }
    })
    const augmented     = inferPrerequisiteMastery(diagnosticMastery, getPrerequisiteTree)
    const directlyTested = new Set(items.map(it => it.skillId))
    const inferredByTopic: Record<string, string[]> = {}
    for (const [skillId, m] of Object.entries(augmented)) {
      if (!m.inferred || directlyTested.has(skillId)) continue
      const topic = skillsById[skillId]?.topic ?? 'Other'
      if (!inferredByTopic[topic]) inferredByTopic[topic] = []
      inferredByTopic[topic].push(skillId)
    }
    const totalInferred = Object.values(inferredByTopic).flat().length

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
            marginBottom: '20px',
          }}>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: scoreColor, lineHeight: 1 }}>
              {correctCount}/{total}
            </span>
            <div>
              <p style={{ fontSize: font.md, fontWeight: '600', color: scoreColor, margin: 0 }}>
                {pct >= 70 ? 'Great work!' : pct >= 40 ? 'Good start!' : 'Keep practising!'}
              </p>
              <p style={{ fontSize: font.sm, color: scoreColor, margin: 0 }}>
                {pct}% correct · Your dashboard has been updated.
              </p>
            </div>
          </div>

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

          {/* Inferred prerequisite skills */}
          {totalInferred > 0 && (
            <div style={{
              marginBottom: '20px',
              padding: '14px 16px',
              borderRadius: radius.lg,
              background: colors.cardAlt,
              border: `1px solid ${colors.border}`,
            }}>
              <p style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary, margin: '0 0 4px' }}>
                +{totalInferred} prerequisite skill{totalInferred !== 1 ? 's' : ''} also credited
              </p>
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 12px', lineHeight: '1.5' }}>
                Because you answered these questions correctly, Mathsense has credited the
                skills you must already know to get there.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(inferredByTopic).map(([topic, skillIds]) => (
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

          <button
            onClick={() => router.push('/student/dashboard')}
            style={primaryButton}
          >
            View my dashboard
          </button>
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
