'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStudentProfile, signOut } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import { calculateMastery, inferPrerequisiteMastery, type MasteryStatus, type SkillMastery } from '../../../lib/skills/masteryEngine'
import { skillsById, getPrerequisiteTree } from '../../../lib/skills/skillGraph'
import { skills } from '../../../data/skills'
import { isPaidStudent } from '../../../lib/entitlements'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, sectionTitle,
} from '../../../lib/styles'

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentProfile = {
  id: string
  display_name: string
  subscription_tier: 'free' | 'paid'
  paid_until: string | null
}

type ExtendedStatus = MasteryStatus | 'not_started'
type SkillWithMastery = { skillId: string; mastery: SkillMastery | null }
type TopicGroup = { topic: string; skills: SkillWithMastery[] }

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<ExtendedStatus, { label: string; bg: string; color: string; border: string }> = {
  needs_practice: { label: 'Needs practice', bg: colors.dangerLight,  color: colors.dangerText,  border: colors.dangerBorder },
  in_progress:    { label: 'In progress',    bg: colors.warningLight, color: colors.warningText, border: colors.warningBorder },
  mastered:       { label: 'Mastered',       bg: colors.successLight, color: colors.successText, border: colors.successBorder },
  not_started:    { label: 'Not started',    bg: colors.cardAlt,      color: colors.textHint,    border: colors.border },
}

const TOPIC_COLORS: Record<string, string> = {
  'Number':               '#7c3aed',
  'Algebra':              colors.primary,
  'Shape and Space':      '#ea580c',
  'Ratio and Proportion': '#0891b2',
  'Probability and Data': colors.success,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeStreak(attempts: { attempted_at: string }[]): number {
  if (attempts.length === 0) return 0
  const days = [...new Set(attempts.map(a => a.attempted_at.substring(0, 10)))].sort().reverse()
  const today = new Date().toISOString().substring(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round(
      (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000
    )
    if (diff === 1) streak++
    else break
  }
  return streak
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([])
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [correctAttempts, setCorrectAttempts] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [needsPracticeCount, setNeedsPracticeCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [hideUntested, setHideUntested] = useState(false)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentProfile().then(async p => {
      if (!p) { router.push('/student'); return }
      setProfile(p)

      const { data: attempts } = await supabase
        .from('practice_attempts')
        .select('skill_ids, correct, attempted_at')
        .eq('student_id', p.id)

      if (attempts && attempts.length > 0) {
        setTotalAttempts(attempts.length)
        setCorrectAttempts(attempts.filter((a: any) => a.correct).length)
        setStreak(computeStreak(attempts))

        const masteryMap = calculateMastery(attempts)
        const augmented = inferPrerequisiteMastery(masteryMap, getPrerequisiteTree)

        setMasteredCount(Object.values(augmented).filter(m => m.status === 'mastered').length)
        setNeedsPracticeCount(Object.values(augmented).filter(m => m.status === 'needs_practice').length)

        // Build groups from ALL skills (not just attempted), preserving skills.ts order
        const groupMap: Record<string, SkillWithMastery[]> = {}
        for (const skill of skills) {
          if (!groupMap[skill.topic]) groupMap[skill.topic] = []
          groupMap[skill.topic].push({ skillId: skill.id, mastery: augmented[skill.id] ?? null })
        }
        setTopicGroups(Object.entries(groupMap).map(([topic, skillList]) => ({ topic, skills: skillList })))
      }

      setLoading(false)
    })
  }, [])

  function toggleTopic(topic: string) {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      if (next.has(topic)) next.delete(topic)
      else next.add(topic)
      return next
    })
  }

  async function handleSignOut() {
    await signOut()
    router.push('/student')
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  if (!profile) return null

  const isPaid = isPaidStudent(profile)

  const accuracy = totalAttempts > 0
    ? Math.round((correctAttempts / totalAttempts) * 100)
    : null

  const hasAttempts = totalAttempts > 0

  // ── First-time / empty state ─────────────────────────────────────────────
  if (!hasAttempts) {
    return (
      <main style={styles.page}>

        {/* Minimal header */}
        <div style={styles.header}>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            Mathsense
          </h1>
          <button
            onClick={handleSignOut}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Sign out
          </button>
        </div>

        {/* Welcome + CTA card */}
        <div style={styles.welcomeCard}>
          <div style={styles.welcomeInner}>
            <div>
              <h2 style={{ fontSize: font['2xl'], fontWeight: '600', color: colors.textPrimary, margin: '0 0 8px' }}>
                Welcome, {profile.display_name}
              </h2>
              <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
                Answer practice questions and Mathsense will track which skills you have
                mastered and which ones need more work.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => router.push('/student/diagnostic')}
                style={primaryButton}
              >
                Take a placement test
              </button>
              <button
                onClick={() => router.push('/practice')}
                style={secondaryButton}
              >
                Start practising without a test
              </button>
              <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0, lineHeight: '1.5' }}>
                The placement test takes around 5 minutes and gives Mathsense a
                starting picture of your strengths and gaps. You can also skip it
                and let your profile build up through practice.
              </p>
            </div>
          </div>
        </div>

        {/* What you will see */}
        <div style={card}>
          <h2 style={{ ...sectionTitle, marginBottom: '16px' }}>What you will see here</h2>
          <div style={styles.featureGrid}>
            <Feature
              label="Questions answered"
              description="A running count of every question you have attempted."
            />
            <Feature
              label="Accuracy"
              description="Your percentage of correct answers overall."
            />
            <Feature
              label="Skill mastery"
              description="Each skill marked Needs practice, In progress, or Mastered based on your recent answers."
            />
            <Feature
              label="Targeted practice"
              description="Upgrade to let Mathsense automatically focus on your weakest skills."
            />
          </div>
        </div>

      </main>
    )
  }

  // ── Returning student with data ──────────────────────────────────────────
  return (
    <main style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          Mathsense
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push('/practice')}
            style={{ ...primaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Practice
          </button>
          <button
            onClick={handleSignOut}
            style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
          >
            Sign out
          </button>
        </div>
      </div>

      <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
        Welcome back, <strong>{profile.display_name}</strong>
      </p>

      {/* Upgrade prompt — free users with skills to work on */}
      {!isPaid && needsPracticeCount > 0 && (
        <div style={styles.upgradeBanner}>
          <p style={{ fontSize: font.base, color: colors.textPrimary, margin: 0 }}>
            You have {needsPracticeCount} skill{needsPracticeCount !== 1 ? 's' : ''} to work on.
            Upgrade to practise them automatically.
          </p>
          <button
            onClick={() => router.push('/student/upgrade')}
            style={{ ...primaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, whiteSpace: 'nowrap' as const }}
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={card}>
        <h2 style={sectionTitle}>Overview</h2>
        <div style={styles.statsGrid}>
          <Stat label="Questions" value={totalAttempts.toString()} />
          <Stat label="Accuracy" value={accuracy !== null ? `${accuracy}%` : '—'} />
          <Stat
            label="Mastered"
            value={masteredCount.toString()}
            color={masteredCount > 0 ? colors.successText : undefined}
          />
          <Stat
            label={streak > 1 ? '🔥 Streak' : 'Streak'}
            value={streak > 0 ? `${streak}d` : '—'}
            color={streak > 1 ? colors.warningText : undefined}
          />
        </div>
      </div>

      {/* Skills by topic */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
          <h2 style={{ ...sectionTitle, margin: 0 }}>Skills</h2>
          <button
            onClick={() => setHideUntested(h => !h)}
            style={{
              fontSize: font.sm,
              color: colors.primary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              fontFamily: 'inherit',
              fontWeight: '500',
            }}
          >
            {hideUntested ? 'Show all skills' : 'Hide untested'}
          </button>
        </div>
        <p style={{ fontSize: font.sm, color: colors.textHint, margin: '2px 0 14px' }}>
          Mastered = 4 correct in last 5 attempts. Tap a topic to expand.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topicGroups.map(group => {
            const color = TOPIC_COLORS[group.topic] ?? colors.primary
            const isExpanded = expandedTopics.has(group.topic)
            const masteredInTopic = group.skills.filter(s => s.mastery?.status === 'mastered').length
            const needsWorkInTopic = group.skills.filter(s => s.mastery?.status === 'needs_practice').length
            const attemptedInTopic = group.skills.filter(s => s.mastery !== null).length
            const totalInTopic = group.skills.length

            const visibleSkills = hideUntested
              ? group.skills.filter(s => s.mastery !== null)
              : group.skills

            if (hideUntested && visibleSkills.length === 0) return null

            return (
              <div key={group.topic} style={{
                borderRadius: radius.md,
                border: `1px solid ${isExpanded ? color + '50' : colors.border}`,
                overflow: 'hidden',
              }}>

                {/* Accordion header */}
                <button
                  onClick={() => toggleTopic(group.topic)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: isExpanded ? color + '08' : colors.card,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left' as const,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {/* Colour accent bar */}
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: font.md, fontWeight: '700', color }}>{group.topic}</div>
                    <div style={{ fontSize: font.sm, color: colors.textHint, marginTop: '1px' }}>
                      {attemptedInTopic === 0
                        ? `${totalInTopic} skills — not started`
                        : needsWorkInTopic > 0
                          ? `${masteredInTopic}/${totalInTopic} mastered · ${needsWorkInTopic} need work`
                          : `${masteredInTopic}/${totalInTopic} mastered`
                      }
                    </div>
                  </div>

                  {/* Mini progress bar + chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <div style={{ width: 56, height: 5, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: radius.full,
                        width: `${Math.round(masteredInTopic / totalInTopic * 100)}%`,
                        background: color,
                      }} />
                    </div>
                    <span style={{ fontSize: font.sm, color: colors.textHint, width: '10px' }}>
                      {isExpanded ? '▾' : '▸'}
                    </span>
                  </div>
                </button>

                {/* Expanded skill list */}
                {isExpanded && (
                  <div style={{ padding: '4px 10px 10px', background: color + '04' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {visibleSkills.map(({ skillId, mastery }) => {
                        const skill = skillsById[skillId]
                        if (!skill) return null
                        const status: ExtendedStatus = mastery?.status ?? 'not_started'
                        const s = STATUS_STYLE[status]
                        return (
                          <div key={skillId} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            borderRadius: radius.md,
                            background: colors.card,
                            border: `1px solid ${colors.border}`,
                            gap: '10px',
                          }}>
                            <span style={{ fontSize: font.base, color: colors.textPrimary, flex: 1 }}>
                              {skill.name}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              {mastery && !mastery.inferred && mastery.recentAttempts > 0 && (
                                <ProgressDots
                                  correct={mastery.recentCorrect}
                                  mastered={mastery.status === 'mastered'}
                                />
                              )}
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                padding: '2px 8px',
                                borderRadius: radius.full,
                                background: s.bg,
                                color: s.color,
                                border: `1px solid ${s.border}`,
                                whiteSpace: 'nowrap' as const,
                              }}>
                                {s.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dev-only reset — never visible in production */}
      {process.env.NODE_ENV === 'development' && profile && (
        <div style={{
          marginTop: '8px',
          padding: '12px 16px',
          borderRadius: radius.md,
          border: `1px dashed ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: font.sm, color: colors.textHint }}>
            🛠 Dev only
          </span>
          <button
            onClick={async () => {
              if (!confirm('Delete all practice attempts for this account?')) return
              const res = await fetch('/api/dev/reset-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: profile.id }),
              })
              if (!res.ok) {
                const { error } = await res.json()
                alert(`Reset failed: ${error}`)
                return
              }
              window.location.reload()
            }}
            style={{
              fontSize: font.sm,
              color: colors.dangerText,
              background: colors.dangerLight,
              border: `1px solid ${colors.dangerBorder}`,
              borderRadius: radius.sm,
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: '600',
            }}
          >
            Reset progress
          </button>
        </div>
      )}

    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Five squares showing how many of the last 5 attempts were correct.
 * Green when mastered (≥4/5), blue otherwise.
 */
function ProgressDots({ correct, mastered }: { correct: number; mastered: boolean }) {
  const fill = mastered ? colors.success : colors.primary
  const fillBorder = mastered ? colors.successBorder : colors.primary
  return (
    <div style={{ display: 'flex', gap: '2px' }} title={`${correct}/5 correct`}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{
          width: 7,
          height: 7,
          borderRadius: 1,
          background: i < correct ? fill : colors.cardAlt,
          border: `1px solid ${i < correct ? fillBorder : colors.border}`,
        }} />
      ))}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
      <span style={{ fontSize: font['2xl'], fontWeight: '700', color: color ?? colors.textPrimary }}>
        {value}
      </span>
      <span style={{ fontSize: font.sm, color: colors.textHint }}>
        {label}
      </span>
    </div>
  )
}

function Feature({ label, description }: { label: string; description: string }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: radius.md,
      background: colors.cardAlt,
      border: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>
        {label}
      </span>
      <span style={{ fontSize: font.sm, color: colors.textSecondary, lineHeight: '1.5' }}>
        {description}
      </span>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeCard: {
    background: colors.card,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    padding: '28px',
  },
  welcomeInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  upgradeBanner: {
    padding: '12px 16px',
    borderRadius: radius.md,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '16px',
  },
}
