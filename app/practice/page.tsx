'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { courses } from '../../data/courses'
import { getStudentProfile } from '../../lib/auth'
import { calculateMastery, getWeightedSkillPool, getAccessibleSkillIds } from '../../lib/skills/masteryEngine'
import { getPrerequisiteTree } from '../../lib/skills/skillGraph'

import {
  colors, font, radius,
  primaryButton, secondaryButton, pageContainer,
} from '../../lib/styles'

type Tier = 'foundation' | 'higher' | 'both'

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

  useEffect(() => {
    getStudentProfile().then(p => {
      setStudent(p)
      setProfileLoading(false)
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
    const allSkillIds = getSkillIds(tier)

    const isPaid = student?.subscription_tier === 'paid' &&
      student?.paid_until != null &&
      new Date(student.paid_until) > new Date()

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

      if (isPaid && attempts && attempts.length > 0) {
        // Paid: weighted selection — needs_practice skills appear 3× more often
        // than in_progress/untested, mastered skills are excluded until everything
        // else is done. This targeting only applies within the accessible pool.
        const weightedPool = getWeightedSkillPool(mastery, pool)
        const pickedSkill = weightedPool[Math.floor(Math.random() * weightedPool.length)]
        targetSkillIds = [pickedSkill]
      } else {
        // Free: random question from the accessible pool
        targetSkillIds = pool
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

  if (profileLoading) {
    return (
      <main style={pageContainer}>
        <div style={styles.card}>
          <p style={{ color: colors.textSecondary, margin: 0 }}>Loading...</p>
        </div>
      </main>
    )
  }

  const isPaid = student?.subscription_tier === 'paid' &&
    student?.paid_until != null &&
    new Date(student.paid_until) > new Date()

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
                onClick={() => setTier(t)}
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

        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
          {loading ? 'Loading...' : `${questionCount} questions available`}
        </p>

        <button
          onClick={startPractice}
          disabled={loading || !questionCount}
          style={{
            ...primaryButton,
            opacity: loading || !questionCount ? 0.6 : 1,
          }}
        >
          Start practising
        </button>

        {/* Context note */}
        {isPaid ? (
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' as const }}>
            Questions follow your learning path and target your weakest skills first.
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
}