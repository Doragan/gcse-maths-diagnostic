'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { skills } from '../../data/skills'
import { courses } from '../../data/courses'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, pageContainer,
} from '../../lib/styles'

type Tier = 'foundation' | 'higher' | 'both'

export default function PracticePage() {
  const router = useRouter()
  const [tier, setTier] = useState<Tier>('foundation')
  const [questionCount, setQuestionCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

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
    if (t === 'foundation') return foundation
    if (t === 'higher') return higher
    return [...new Set([...foundation, ...higher])]
  }

  async function startPractice() {
  sessionStorage.setItem('practice_tier', tier)
  const skillIds = getSkillIds(tier)

  const { data } = await supabase
    .from('questions')
    .select('id')
    .eq('is_published', true)
    .overlaps('skill_ids', skillIds)

  if (!data || data.length === 0) return

  const random = data[Math.floor(Math.random() * data.length)]
  router.push(`/practice/question/${random.id}`)
}

  return (
    <main style={pageContainer}>
      <div style={styles.card}>
        <div>
          <h1 style={{ fontSize: font['3xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Mathsense Practice
          </h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            Practise GCSE Maths questions with instant feedback.
          </p>
        </div>

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

        <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, textAlign: 'center' as const }}>
          Questions are selected randomly from all available skills.
        </p>
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