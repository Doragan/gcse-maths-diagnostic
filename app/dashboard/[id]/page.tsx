'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSession } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import { skillsById } from '../../../lib/skills/skillGraph'

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
      if (!session) {
        router.push('/auth')
      } else {
        loadData()
      }
    })
  }, [])

  async function loadData() {
    // Load assessment
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessmentData) {
      router.push('/dashboard')
      return
    }

    setAssessment(assessmentData)

    // Load student sessions with their skill results
    const { data: sessions, error: sessionsError } = await supabase
      .from('student_sessions')
      .select(`
        id,
        student_name,
        completed_at,
        questions_asked,
        skill_results (
          skill_id,
          status,
          source
        )
      `)
      .eq('assessment_id', assessmentId)
      .order('student_name', { ascending: true })

    if (!sessionsError && sessions) {
      setStudents(sessions as Student[])
    }

    setLoading(false)
  }

  function toggleStudent(id: string) {
    setExpandedStudent(prev => prev === id ? null : id)
  }

  if (loading) {
    return (
      <main style={styles.container}>
        <p style={{ color: '#666' }}>Loading...</p>
      </main>
    )
  }

  if (!assessment) return null

  const completedStudents = students.filter(s => s.completed_at)

  // Build a class-level skill summary across all completed students
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

  // Sort skills by needs_practice count descending (most problematic first)
  const sortedSkills = Object.entries(skillSummary)
    .sort((a, b) => b[1].needsPractice - a[1].needsPractice)

  return (
    <main style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => router.push('/dashboard')} style={styles.backButton}>
          ← Back
        </button>
        <div>
          <h1 style={styles.title}>{assessment.title}</h1>
          <p style={styles.subtitle}>Code: <strong>{assessment.code}</strong> · {completedStudents.length} of {students.length} completed</p>
        </div>
      </div>

      {/* Class overview */}
      {completedStudents.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Class skill overview</h2>
          <p style={styles.hint}>Sorted by most students needing practice</p>
          <div style={styles.skillList}>
            {sortedSkills.map(([skillId, summary]) => {
              const skill = skillsById[skillId]
              if (!skill) return null
              const pct = Math.round((summary.mastered / summary.total) * 100)
              return (
                <div key={skillId} style={styles.skillRow}>
                  <div style={styles.skillInfo}>
                    <span style={styles.skillName}>{skill.name}</span>
                    <span style={styles.skillTopic}>{skill.topic}</span>
                  </div>
                  <div style={styles.skillBar}>
                    <div style={{
                      ...styles.skillBarFill,
                      width: `${pct}%`,
                      background: pct >= 70 ? '#4CAF50' : pct >= 40 ? '#FF9800' : '#f44336',
                    }} />
                  </div>
                  <span style={styles.skillPct}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Student list */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Students</h2>
        {students.length === 0 ? (
          <p style={styles.hint}>No students have joined yet.</p>
        ) : (
          <div style={styles.studentList}>
            {students.map(student => {
              const mastered = student.skill_results.filter(r => r.status === 'mastered').length
              const needsPractice = student.skill_results.filter(r => r.status === 'needs_practice').length
              const total = mastered + needsPractice
              const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
              const isExpanded = expandedStudent === student.id

              return (
                <div key={student.id} style={styles.studentCard}>
                  <div
                    style={styles.studentHeader}
                    onClick={() => student.completed_at && toggleStudent(student.id)}
                  >
                    <div>
                      <p style={styles.studentName}>{student.student_name}</p>
                      {student.completed_at ? (
                        <p style={styles.studentMeta}>
                          {mastered} mastered · {needsPractice} need practice · {student.questions_asked} questions
                        </p>
                      ) : (
                        <p style={{ ...styles.studentMeta, color: '#f59e0b' }}>In progress...</p>
                      )}
                    </div>
                    {student.completed_at && (
                      <div style={styles.studentRight}>
                        <span style={{
                          ...styles.pctBadge,
                          background: pct >= 70 ? '#e8f5e9' : pct >= 40 ? '#fff3e0' : '#ffebee',
                          color: pct >= 70 ? '#2e7d32' : pct >= 40 ? '#e65100' : '#c62828',
                        }}>
                          {pct}%
                        </span>
                        <span style={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div style={styles.studentDetails}>
                      {['mastered', 'needs_practice'].map(status => {
                        const skillsInStatus = student.skill_results.filter(r => r.status === status)
                        if (skillsInStatus.length === 0) return null
                        return (
                          <div key={status} style={styles.statusGroup}>
                            <p style={{
                              ...styles.statusLabel,
                              color: status === 'mastered' ? '#2e7d32' : '#c62828',
                            }}>
                              {status === 'mastered' ? '✓ Mastered' : '✗ Needs practice'}
                            </p>
                            <div style={styles.skillTags}>
                              {skillsInStatus.map(r => (
                                <span key={r.skill_id} style={{
                                  ...styles.skillTag,
                                  background: status === 'mastered' ? '#e8f5e9' : '#ffebee',
                                  color: status === 'mastered' ? '#2e7d32' : '#c62828',
                                  border: `1px solid ${status === 'mastered' ? '#a5d6a7' : '#ef9a9a'}`,
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
                      <p style={styles.inferredNote}>* inferred from other answers</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
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
  backButton: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
    whiteSpace: 'nowrap' as const,
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    margin: 0,
    color: '#111',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0',
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#111',
  },
  hint: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
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
  skillName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#111',
  },
  skillTopic: {
    fontSize: '11px',
    color: '#888',
  },
  skillBar: {
    flex: 1,
    height: '8px',
    background: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  skillBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  skillPct: {
    fontSize: '13px',
    color: '#555',
    width: '36px',
    textAlign: 'right' as const,
  },
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  studentCard: {
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  studentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#fafafa',
    cursor: 'pointer',
  },
  studentName: {
    fontSize: '15px',
    fontWeight: '500',
    margin: 0,
    color: '#111',
  },
  studentMeta: {
    fontSize: '12px',
    color: '#888',
    margin: '2px 0 0',
  },
  studentRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pctBadge: {
    fontSize: '14px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  chevron: {
    fontSize: '12px',
    color: '#888',
  },
  studentDetails: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: '1px solid #e5e5e5',
  },
  statusGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  statusLabel: {
    fontSize: '13px',
    fontWeight: '600',
    margin: 0,
  },
  skillTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  skillTag: {
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  inferredNote: {
    fontSize: '11px',
    color: '#aaa',
    margin: 0,
  },
}