'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import { skillsById } from '../../../lib/skills/skillGraph'
import FeedbackWidget from '../../../components/FeedbackWidget'
import {
  colors, font, radius, card,
  secondaryButton, sectionTitle,
} from '../../../lib/styles'

type Student = {
  id: string
  student_name: string
  completed_at: string | null
  questions_asked: number
  skill_results: {
    skill_id: string
    status: 'mastered' | 'needs_practice'
    source: 'tested' | 'inferred'
  }[]
}

type Assessment = {
  id: string
  title: string
  code: string
  course_id: string
}

export default function AssessmentResultsPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  useEffect(() => {
    getSession().then(session => {
      if (!session) router.push('/auth')
      else loadData()
    })
  }, [])

  async function loadData() {
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessmentData) { router.push('/dashboard'); return }
    setAssessment(assessmentData)

    const { data: sessions, error: sessionsError } = await supabase
      .from('student_sessions')
      .select(`id, student_name, completed_at, questions_asked, skill_results (skill_id, status, source)`)
      .eq('assessment_id', assessmentId)
      .order('student_name', { ascending: true })

    if (!sessionsError && sessions) setStudents(sessions as Student[])
    setLoading(false)
  }

  function toggleStudent(id: string) {
    setExpandedStudent(prev => prev === id ? null : id)
  }

  if (loading) {
    return <main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading...</p></main>
  }

  if (!assessment) return null

  const completedStudents = students.filter(s => s.completed_at)

  const skillSummary: Record<string, { mastered: number, needsPractice: number, total: number }> = {}
  for (const student of completedStudents) {
    for (const result of student.skill_results) {
      if (!skillSummary[result.skill_id]) {
        skillSummary[result.skill_id] = { mastered: 0, needsPractice: 0, total: 0 }
      }
      skillSummary[result.skill_id].total++
      if (result.status === 'mastered') skillSummary[result.skill_id].mastered++
      if (result.status === 'needs_practice') skillSummary[result.skill_id].needsPractice++
    }
  }

  const sortedSkills = Object.entries(skillSummary)
    .sort((a, b) => b[1].needsPractice - a[1].needsPractice)

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
            {assessment.title}
          </h1>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 0' }}>
            Code: <strong style={{ color: colors.primary }}>{assessment.code}</strong> · {completedStudents.length} of {students.length} completed
          </p>
        </div>
      </div>

      {completedStudents.length > 0 && (
        <div style={card}>
          <h2 style={sectionTitle}>Class skill overview</h2>
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>
            Sorted by most students needing practice
          </p>
          <div style={styles.skillList}>
            {sortedSkills.map(([skillId, summary]) => {
              const skill = skillsById[skillId]
              if (!skill) return null
              const pct = Math.round((summary.mastered / summary.total) * 100)
              const barColor = pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger
              return (
                <div key={skillId} style={styles.skillRow}>
                  <div style={styles.skillInfo}>
                    <span style={{ fontSize: font.base, fontWeight: '500', color: colors.textPrimary }}>
                      {skill.name}
                    </span>
                    <span style={{ fontSize: '11px', color: colors.textHint }}>
                      {skill.topic}
                    </span>
                  </div>
                  <div style={styles.skillBarTrack}>
                    <div style={{ ...styles.skillBarFill, width: `${pct}%`, background: barColor }} />
                  </div>
                  <span style={{ fontSize: font.base, color: colors.textSecondary, width: '36px', textAlign: 'right' as const }}>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={card}>
        <h2 style={sectionTitle}>Students</h2>
        {students.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: 0 }}>
            No students have joined yet.
          </p>
        ) : (
          <div style={styles.studentList}>
            {students.map(student => {
              const masteredCount = student.skill_results.filter(r => r.status === 'mastered').length
              const needsCount = student.skill_results.filter(r => r.status === 'needs_practice').length
              const total = masteredCount + needsCount
              const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0
              const isExpanded = expandedStudent === student.id
              const badgeBg = pct >= 70 ? colors.successLight : pct >= 40 ? '#fff3e0' : colors.dangerLight
              const badgeColor = pct >= 70 ? colors.successText : pct >= 40 ? '#e65100' : colors.dangerText

              return (
                <div key={student.id} style={styles.studentCard}>
                  <div
                    style={styles.studentHeader}
                    onClick={() => student.completed_at && toggleStudent(student.id)}
                  >
                    <div>
                      <p style={{ fontSize: font.md, fontWeight: '500', margin: 0, color: colors.textPrimary }}>
                        {student.student_name}
                      </p>
                      {student.completed_at ? (
                        <p style={{ fontSize: font.sm, color: colors.textHint, margin: '2px 0 0' }}>
                          {masteredCount} mastered · {needsCount} need practice · {student.questions_asked} questions
                        </p>
                      ) : (
                        <p style={{ fontSize: font.sm, color: colors.warning, margin: '2px 0 0' }}>
                          In progress...
                        </p>
                      )}
                    </div>
                    {student.completed_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: font.base, fontWeight: '600', padding: '4px 10px', borderRadius: radius.full, background: badgeBg, color: badgeColor }}>
                          {pct}%
                        </span>
                        <span style={{ fontSize: font.sm, color: colors.textHint }}>
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div style={styles.studentDetails}>
                      {(['needs_practice', 'mastered'] as const).map(status => {
                        const skillsInStatus = student.skill_results.filter(r => r.status === status)
                        if (skillsInStatus.length === 0) return null
                        const isNeeds = status === 'needs_practice'
                        return (
                          <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <p style={{ fontSize: font.base, fontWeight: '600', margin: 0, color: isNeeds ? colors.dangerText : colors.successText }}>
                              {isNeeds ? '✗ Needs practice' : '✓ Mastered'}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                              {skillsInStatus.map(r => (
                                <span key={r.skill_id} style={{
                                  fontSize: font.sm,
                                  padding: '3px 8px',
                                  borderRadius: radius.sm,
                                  background: isNeeds ? colors.dangerLight : colors.successLight,
                                  color: isNeeds ? colors.dangerText : colors.successText,
                                  border: `1px solid ${isNeeds ? colors.dangerBorder : colors.successBorder}`,
                                }}>
                                  {skillsById[r.skill_id]?.name ?? r.skill_id}
                                  {r.source === 'inferred' && (
                                    <span style={{ opacity: 0.6, fontSize: '11px' }}> *</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                      <p style={{ fontSize: '11px', color: colors.textHint, margin: 0 }}>
                        * inferred from other answers
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* General feedback */}
      <FeedbackWidget context="teacher_assessment" />
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  skillList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  skillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  skillInfo: {
    display: 'flex',
    flexDirection: 'column',
    width: '180px',
    flexShrink: 0,
  },
  skillBarTrack: {
    flex: 1,
    height: '8px',
    background: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  skillBarFill: {
    height: '100%',
    borderRadius: radius.full,
    transition: 'width 0.3s ease',
  },
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  studentCard: {
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  studentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: colors.cardAlt,
    cursor: 'pointer',
  },
  studentDetails: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: `1px solid ${colors.border}`,
  },
}