'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { courses } from '../../data/courses'
import { getStudentProfile } from '../../lib/auth'
import { calculateMastery, getWeightedSkillPool, getAccessibleSkillIds, getNeedsPracticeSkillIds } from '../../lib/skills/masteryEngine'
import { getPrerequisiteTree } from '../../lib/skills/skillGraph'
import { isPaidStudent } from '../../lib/entitlements'
import { skills } from '../../data/skills'

import {
  colors, font, radius,
  primaryButton, secondaryButton, pageContainer,
} from '../../lib/styles'

type Tier = 'foundation' | 'higher' | 'both'

/**
 * Practice targeting mode.
 *  - auto      → algorithm chooses (free: full pool; paid: weighted to weak skills)
 *  - skill     → drill one chosen skill                    (paid only)
 *  - topic     → drill one chosen topic                    (paid only)
 *  - weakspots → session built only from needs_practice    (paid only)
 */
type FocusMode = 'auto' | 'skill' | 'topic' | 'weakspots'

const FOCUS_OPTIONS: { id: FocusMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'skill', label: 'This skill' },
  { id: 'topic', label: 'This topic' },
  { id: 'weakspots', label: 'Weak spots' },
]

type StudentProfile = {
  id: string
  display_name: string
  subscription_tier: 'free' | 'paid'
  paid_until: string | null
}

export default function PracticePage() {
  const router = useRouter()
  const [tier, setTier] = useState<Tier>('foundation')
  const [questionCount, setQuestionCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [focusMode, setFocusMode] = useState<FocusMode>('auto')
  const [focusSkillId, setFocusSkillId] = useState<string>('')
  const [focusTopic, setFocusTopic] = useState<string>('')

  useEffect(() => {
    getStudentProfile().then(p => {
      setStudent(p)
      setProfileLoading(false)

      // Deep links from the dashboard (paid only): pre-select a focus target.
      //   /practice?skillId=<id>   → drill that skill
      //   /practice?focus=weakspots → weak-spot blitz
      // Tier is forced to 'both' so the target is guaranteed to be in the pool
      // regardless of which tier it belongs to.
      if (p && isPaidStudent(p) && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const skillId = params.get('skillId')
        const focus = params.get('focus')
        if (skillId) {
          setTier('both')
          setFocusMode('skill')
          setFocusSkillId(skillId)
        } else if (focus === 'weakspots') {
          setTier('both')
          setFocusMode('weakspots')
        }
      }
    })
  }, [])

  useEffect(() => {
    loadQuestionCount()
  }, [tier])

  async function loadQuestionCount() {
    setLoading(true)
    const skillIds = getSkillIds(tier)
    const { count } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .overlaps('skill_ids', skillIds)
    setQuestionCount(count ?? 0)
    setLoading(false)
  }

	function getSkillIds(t: Tier): string[] {
	  const foundation = courses.find(c => c.id === 'gcse_foundation')?.skills ?? []
	  const higher = courses.find(c => c.id === 'gcse_higher')?.skills ?? []
	  const higherOnly = higher.filter(id => !foundation.includes(id))
	  if (t === 'foundation') return foundation
	  if (t === 'higher') return higherOnly
	  return [...new Set([...foundation, ...higher])]
	}

  async function startPractice() {
    sessionStorage.setItem('practice_tier', tier)
    // Clear any focus from a previous session; re-set below only if a focus
    // mode actually resolves a target. This is what keeps "Next question"
    // on-target for the whole session (read in the question page).
    sessionStorage.removeItem('practice_focus_skills')
    const allSkillIds = getSkillIds(tier)

    const isPaid = student ? isPaidStudent(student) : false

    let targetSkillIds = allSkillIds

    if (student) {
      // Fetch attempts for all logged-in students (free and paid).
      // Prerequisite filtering requires knowing what the student has and hasn't mastered,
      // so we need this data even for free users.
      const { data: attempts } = await supabase
        .from('practice_attempts')
        .select('skill_ids, correct, attempted_at')
        .eq('student_id', student.id)

      const mastery = attempts && attempts.length > 0
        ? calculateMastery(attempts)
        : {}

      // Filter to skills where the full prerequisite chain is either mastered or
      // in_progress. This prevents students being shown questions well above their
      // current level (e.g. quadratic equations before basic algebra).
      const accessible = getAccessibleSkillIds(mastery, allSkillIds, getPrerequisiteTree)

      // Safety fallback: if all skills have unmet prerequisites (shouldn't happen
      // with a well-formed curriculum that has root skills), use the full tier pool.
      const pool = accessible.length > 0 ? accessible : allSkillIds

      // Paid focus override (skill / topic / weak-spot blitz). Only paid users
      // can steer targeting; the UI locks these for free users, and this guard
      // enforces it server-of-record-side too. An invalid/empty selection leaves
      // focusApplied false and we fall through to the default behaviour below.
      let focusApplied = false
      if (isPaid) {
        if (focusMode === 'skill' && focusSkillId && allSkillIds.includes(focusSkillId)) {
          targetSkillIds = [focusSkillId]
          focusApplied = true
        } else if (focusMode === 'topic' && focusTopic) {
          const topicSkills = skills
            .filter(s => s.topic === focusTopic && allSkillIds.includes(s.id))
            .map(s => s.id)
          if (topicSkills.length > 0) {
            // Deliberate choice: if prereqs aren't met (intersection with pool is
            // empty) we still honour the topic rather than silently overriding it.
            const inPool = topicSkills.filter(id => pool.includes(id))
            targetSkillIds = inPool.length > 0 ? inPool : topicSkills
            focusApplied = true
          }
        } else if (focusMode === 'weakspots') {
          const weak = getNeedsPracticeSkillIds(mastery, allSkillIds)
          if (weak.length > 0) {
            targetSkillIds = weak
            focusApplied = true
          }
          // No weak spots yet → fall through to weighted auto below.
        }
      }

      if (!focusApplied) {
        if (isPaid && attempts && attempts.length > 0) {
          // Paid auto: weighted selection — needs_practice skills appear 3× more
          // often than in_progress/untested, mastered skills are excluded until
          // everything else is done. Targeting stays within the accessible pool.
          const weightedPool = getWeightedSkillPool(mastery, pool)
          const pickedSkill = weightedPool[Math.floor(Math.random() * weightedPool.length)]
          targetSkillIds = [pickedSkill]
        } else {
          // Free: random question from the accessible pool
          targetSkillIds = pool
        }
      } else {
        // A focus mode resolved a concrete target set. Persist it so that
        // "Next question" on the question page stays on-target for the whole
        // session (skill → same skill, topic/weakspots → varies within the set).
        // Auto mode deliberately leaves this unset, so it falls back to the
        // tier-random behaviour on the question page.
        sessionStorage.setItem('practice_focus_skills', JSON.stringify(targetSkillIds))
      }
    }
    // Anonymous users: targetSkillIds remains allSkillIds — no attempt data,
    // so prerequisite filtering is not possible.

    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('is_published', true)
      .overlaps('skill_ids', targetSkillIds)

    if (!data || data.length === 0) {
      // Fallback: if the accessible pool has no questions yet, use the full tier pool
      const { data: fallback } = await supabase
        .from('questions')
        .select('id')
        .eq('is_published', true)
        .overlaps('skill_ids', allSkillIds)
      if (!fallback || fallback.length === 0) return
      const random = fallback[Math.floor(Math.random() * fallback.length)]
      router.push(`/practice/question/${random.id}`)
      return
    }

    const random = data[Math.floor(Math.random() * data.length)]
    router.push(`/practice/question/${random.id}`)
  }

  function selectFocus(mode: FocusMode) {
    if (mode === 'auto') { setFocusMode('auto'); return }
    if (!isPaid) {
      // Show-but-locked: send free users to upgrade, anonymous users to login.
      router.push(student ? '/student/upgrade' : '/student')
      return
    }
    setFocusMode(mode)
  }

  if (profileLoading) {
    return (
      <main style={pageContainer}>
        <div style={styles.card}>
          <p style={{ color: colors.textSecondary, margin: 0 }}>Loading...</p>
        </div>
      </main>
    )
  }

  const isPaid = student ? isPaidStudent(student) : false

  // Skills/topics available in the chosen tier, for the focus pickers.
  const tierSkillIds = getSkillIds(tier)
  const tierSkills = skills.filter(s => tierSkillIds.includes(s.id))
  const tierTopics = [...new Set(tierSkills.map(s => s.topic))]

  // Block Start when a focus mode is selected but its target isn't chosen yet.
  const focusIncomplete =
    (focusMode === 'skill' && !focusSkillId) ||
    (focusMode === 'topic' && !focusTopic)

  return (
    <main style={pageContainer}>
      <div style={styles.card}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: font['3xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
              Mathsense Practice
            </h1>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
              {student
                ? `Welcome back, ${student.display_name}`
                : 'Practise GCSE Maths questions with instant feedback.'}
            </p>
          </div>
          {student && (
            <button
              onClick={() => router.push('/student/dashboard')}
              style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, flexShrink: 0 }}
            >
              Dashboard
            </button>
          )}
        </div>

        {/* Tier selector */}
        <div>
          <p style={{ fontSize: font.base, fontWeight: '500', color: colors.textPrimary, margin: '0 0 8px' }}>
            Which tier are you studying?
          </p>
          <div style={styles.toggle}>
            {(['foundation', 'higher', 'both'] as Tier[]).map(t => (
              <button
                key={t}
                onClick={() => {
                  setTier(t)
                  // Clear focus targets that may no longer exist in the new tier.
                  setFocusSkillId('')
                  setFocusTopic('')
                }}
                style={{
                  ...styles.toggleButton,
                  background: tier === t ? colors.primary : 'transparent',
                  color: tier === t ? '#ffffff' : colors.textSecondary,
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Focus selector — premium. Shown to everyone (locked for free users). */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 0 8px' }}>
            <p style={{ fontSize: font.base, fontWeight: '500', color: colors.textPrimary, margin: 0 }}>
              What do you want to focus on?
            </p>
            {!isPaid && (
              <span style={{
                fontSize: '11px', fontWeight: '700', padding: '2px 8px',
                borderRadius: radius.full, background: colors.cardAlt, color: colors.textHint,
              }}>
                Premium
              </span>
            )}
          </div>

          <div style={styles.focusGrid}>
            {FOCUS_OPTIONS.map(opt => {
              // Free users are always on 'auto' (they can't change focusMode),
              // so this naturally highlights only Auto for them.
              const selected = focusMode === opt.id
              const locked = !isPaid && opt.id !== 'auto'
              return (
                <button
                  key={opt.id}
                  onClick={() => selectFocus(opt.id)}
                  style={{
                    ...styles.focusButton,
                    border: `1px solid ${selected ? colors.primary : colors.border}`,
                    background: selected ? '#eff6ff' : colors.card,
                    color: locked ? colors.textHint : colors.textPrimary,
                  }}
                >
                  {locked && <span aria-hidden="true" style={{ marginRight: 5 }}>🔒</span>}
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Skill picker */}
          {isPaid && focusMode === 'skill' && (
            <select
              value={focusSkillId}
              onChange={e => setFocusSkillId(e.target.value)}
              style={styles.select}
            >
              <option value="">Choose a skill…</option>
              {tierTopics.map(topic => (
                <optgroup key={topic} label={topic}>
                  {tierSkills.filter(s => s.topic === topic).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}

          {/* Topic picker */}
          {isPaid && focusMode === 'topic' && (
            <select
              value={focusTopic}
              onChange={e => setFocusTopic(e.target.value)}
              style={styles.select}
            >
              <option value="">Choose a topic…</option>
              {tierTopics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          )}
        </div>

        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          {loading ? 'Loading...' : `${questionCount} questions available`}
        </p>

        <button
          onClick={startPractice}
          disabled={loading || !questionCount || focusIncomplete}
          style={{
            ...primaryButton,
            opacity: loading || !questionCount || focusIncomplete ? 0.6 : 1,
          }}
        >
          Start practising
        </button>

        {/* Context note */}
        {isPaid ? (
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' as const }}>
            On Auto, questions target your weakest skills first — or use the focus options above to drill a specific skill, topic, or your weak spots.
          </p>
        ) : student ? (
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' as const }}>
            Questions follow your learning path.{' '}
            <button
              onClick={() => router.push('/student/upgrade')}
              style={{ background: 'none', border: 'none', color: colors.primary, fontSize: font.sm, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              Upgrade
            </button>
            {' '}to target your weak spots automatically.
          </p>
        ) : (
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' as const }}>
            Questions are selected randomly.{' '}
            <a href="/student" style={{ color: colors.primary, textDecoration: 'underline' }}>
              Log in
            </a>
            {' '}to follow your learning path and save your progress.
          </p>
        )}

      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: colors.card,
    borderRadius: radius.lg,
    padding: '32px 28px',
    width: '100%',
    maxWidth: '480px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
    whiteSpace: 'nowrap' as const,
  },
  focusGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  focusButton: {
    padding: '10px',
    borderRadius: radius.md,
    fontSize: font.sm,
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    marginTop: '10px',
    padding: '10px',
    borderRadius: radius.md,
    border: `1px solid ${colors.borderStrong}`,
    fontSize: font.base,
    fontFamily: 'inherit',
    background: colors.card,
    color: colors.textPrimary,
  },
}