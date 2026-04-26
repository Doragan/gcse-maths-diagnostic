'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  colors, radius, font,
  card as cardStyle, primaryButton, secondaryButton,
  pageTitle, sectionTitle,
} from '@/lib/styles'

// ─── Types ──────────────────────────────────────────────────────────────────
const TOPICS = [
  { id: 'number',   label: 'Number',              colour: '#7c3aed' },
  { id: 'algebra',  label: 'Algebra',             colour: colors.primary },
  { id: 'shape',    label: 'Shape and Space',      colour: '#ea580c' },
  { id: 'ratio',    label: 'Ratio and Proportion', colour: '#0891b2' },
  { id: 'probdata', label: 'Probability and Data', colour: colors.success },
] as const

type TopicId = typeof TOPICS[number]['id']

type AssessmentType = 'exam' | 'topic-test' | 'homework'
const TYPE_LABELS: Record<AssessmentType, { label: string; colour: string; bg: string }> = {
  'exam':       { label: 'Exam',       colour: '#7c3aed', bg: '#f5f3ff' },
  'topic-test': { label: 'Topic Test', colour: '#0891b2', bg: '#ecfeff' },
  'homework':   { label: 'Homework',   colour: '#ea580c', bg: '#fff7ed' },
}

interface StudentSummary {
  name: string
  score: number
  total: number
  topics: Partial<Record<TopicId, { scored: number; avail: number }>>
  flag?: 'concern' | 'improving' | 'strong'
}

interface ClassData {
  id: string
  name: string
  yearGroup: string
  studentCount: number
  students: StudentSummary[]
  recentAssessment: string
  recentAssessmentDate: string
  recentAssessmentType: AssessmentType
  avgPct: number
  topicAvgs: Record<TopicId, number>
}

interface AssessmentRecord {
  id: string
  title: string
  date: string
  type: AssessmentType
  className: string
  studentCount: number
  avgScore: number
  totalMarks: number
  feedbackGenerated: boolean
}

interface HomeworkRecord {
  id: string
  title: string
  className: string
  dueDate: string
  setDate: string
  submitted: number
  total: number
  questionId: string
}

// ─── Mock Data ──────────────────────────────────────────────────────────────
const TEACHER = { name: 'Mr Thompson', firstName: 'James', school: 'Greenfield Academy' }

const CLASSES: ClassData[] = [
  {
    id: 'y10-set2', name: 'Set 2', yearGroup: 'Year 10', studentCount: 8,
    recentAssessment: 'Paper 3 Calculator (Nov 2024)', recentAssessmentDate: '20 Mar 2026', recentAssessmentType: 'exam',
    avgPct: 58,
    topicAvgs: { number: 72, algebra: 38, shape: 50, ratio: 68, probdata: 62 },
    students: [
      { name: 'Harry Wilson',     score: 33, total: 35, topics: { number: { scored: 6, avail: 6 }, algebra: { scored: 14, avail: 16 }, ratio: { scored: 8, avail: 8 }, probdata: { scored: 5, avail: 5 } }, flag: 'strong' },
      { name: 'Amira Patel',      score: 32, total: 35, topics: { number: { scored: 6, avail: 6 }, algebra: { scored: 14, avail: 16 }, ratio: { scored: 7, avail: 8 }, probdata: { scored: 5, avail: 5 } }, flag: 'strong' },
      { name: 'Ben Okonkwo',      score: 24, total: 35, topics: { number: { scored: 5, avail: 6 }, algebra: { scored: 6, avail: 16 }, ratio: { scored: 7, avail: 8 }, probdata: { scored: 4, avail: 5 } }, flag: 'improving' },
      { name: 'Charlotte Evans',  score: 23, total: 35, topics: { number: { scored: 5, avail: 6 }, algebra: { scored: 7, avail: 16 }, ratio: { scored: 6, avail: 8 }, probdata: { scored: 4, avail: 5 } } },
      { name: 'Daniel Kim',       score: 20, total: 35, topics: { number: { scored: 4, avail: 6 }, algebra: { scored: 6, avail: 16 }, ratio: { scored: 5, avail: 8 }, probdata: { scored: 5, avail: 5 } } },
      { name: 'Emily Zhang',      score: 19, total: 35, topics: { number: { scored: 5, avail: 6 }, algebra: { scored: 8, avail: 16 }, ratio: { scored: 2, avail: 8 }, probdata: { scored: 0, avail: 5 } }, flag: 'concern' },
      { name: 'Finn McCarthy',    score: 10, total: 35, topics: { number: { scored: 3, avail: 6 }, algebra: { scored: 3, avail: 16 }, ratio: { scored: 2, avail: 8 }, probdata: { scored: 2, avail: 5 } }, flag: 'concern' },
      { name: 'Grace Adeyemi',    score: 8,  total: 35, topics: { number: { scored: 3, avail: 6 }, algebra: { scored: 1, avail: 16 }, ratio: { scored: 1, avail: 8 }, probdata: { scored: 2, avail: 5 } }, flag: 'concern' },
    ],
  },
  {
    id: 'y11-set3', name: 'Set 3', yearGroup: 'Year 11', studentCount: 6,
    recentAssessment: 'Paper 1 Non-Calculator (Jun 2024)', recentAssessmentDate: '28 Feb 2026', recentAssessmentType: 'exam',
    avgPct: 42,
    topicAvgs: { number: 48, algebra: 30, shape: 38, ratio: 45, probdata: 50 },
    students: [
      { name: 'Sophie Turner',    score: 48, total: 80, topics: { number: { scored: 12, avail: 20 }, algebra: { scored: 10, avail: 22 }, shape: { scored: 8, avail: 16 }, ratio: { scored: 9, avail: 14 }, probdata: { scored: 7, avail: 10 } }, flag: 'strong' },
      { name: 'Jake Robinson',    score: 38, total: 80, topics: { number: { scored: 10, avail: 20 }, algebra: { scored: 8, avail: 22 }, shape: { scored: 6, avail: 16 }, ratio: { scored: 7, avail: 14 }, probdata: { scored: 5, avail: 10 } }, flag: 'improving' },
      { name: 'Lily Chen',        score: 35, total: 80, topics: { number: { scored: 9, avail: 20 }, algebra: { scored: 7, avail: 22 }, shape: { scored: 6, avail: 16 }, ratio: { scored: 6, avail: 14 }, probdata: { scored: 5, avail: 10 } } },
      { name: 'Oscar Williams',   score: 30, total: 80, topics: { number: { scored: 8, avail: 20 }, algebra: { scored: 5, avail: 22 }, shape: { scored: 5, avail: 16 }, ratio: { scored: 5, avail: 14 }, probdata: { scored: 5, avail: 10 } } },
      { name: 'Ruby Ahmed',       score: 26, total: 80, topics: { number: { scored: 7, avail: 20 }, algebra: { scored: 4, avail: 22 }, shape: { scored: 4, avail: 16 }, ratio: { scored: 5, avail: 14 }, probdata: { scored: 4, avail: 10 } }, flag: 'concern' },
      { name: 'Noah Kowalski',    score: 22, total: 80, topics: { number: { scored: 6, avail: 20 }, algebra: { scored: 3, avail: 22 }, shape: { scored: 3, avail: 16 }, ratio: { scored: 4, avail: 14 }, probdata: { scored: 4, avail: 10 } }, flag: 'concern' },
    ],
  },
]

const ASSESSMENTS: AssessmentRecord[] = [
  { id: 'a1', title: 'Paper 3 Calculator (Nov 2024)', date: '20 Mar 2026', type: 'exam', className: 'Year 10 Set 2', studentCount: 8, avgScore: 21, totalMarks: 35, feedbackGenerated: true },
  { id: 'a2', title: 'Algebra End of Topic Test', date: '7 Mar 2026', type: 'topic-test', className: 'Year 10 Set 2', studentCount: 8, avgScore: 11, totalMarks: 20, feedbackGenerated: true },
  { id: 'a3', title: 'Paper 1 Non-Calculator (Jun 2024)', date: '28 Feb 2026', type: 'exam', className: 'Year 11 Set 3', studentCount: 6, avgScore: 33, totalMarks: 80, feedbackGenerated: true },
  { id: 'a4', title: 'Ratio and Proportion Topic Test', date: '14 Feb 2026', type: 'topic-test', className: 'Year 11 Set 3', studentCount: 6, avgScore: 8, totalMarks: 15, feedbackGenerated: false },
  { id: 'a5', title: 'Paper 2 Calculator (Jun 2024)', date: '12 Dec 2025', type: 'exam', className: 'Year 10 Set 2', studentCount: 8, avgScore: 19, totalMarks: 80, feedbackGenerated: true },
]

const HOMEWORK_RECORDS: HomeworkRecord[] = [
  { id: 'h1', title: 'Sequences Homework', className: 'Year 10 Set 2', dueDate: '2 May 2026', setDate: '18 Apr 2026', submitted: 3, total: 8, questionId: '321580e4-cb6d-4f9e-a3c6-d558ae8ba553' },
  { id: 'h2', title: 'Ratio and Proportion Homework', className: 'Year 10 Set 2', dueDate: '9 May 2026', setDate: '25 Apr 2026', submitted: 0, total: 8, questionId: 'a653ffa7-038e-434e-90a5-d692e9fa8675' },
  { id: 'h3', title: 'Algebra Revision Homework', className: 'Year 11 Set 3', dueDate: '28 Apr 2026', setDate: '14 Apr 2026', submitted: 4, total: 6, questionId: '66a8b913-93d4-491c-8710-fe6466fdeab1' },
  { id: 'h4', title: 'Fractions and Decimals Homework', className: 'Year 10 Set 2', dueDate: '14 Mar 2026', setDate: '7 Mar 2026', submitted: 8, total: 8, questionId: '463e9833-bc0a-40d9-bc40-941de561a0cc' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────
function pc(s: number, a: number) { return a > 0 ? Math.round(s / a * 100) : 0 }
function bCol(p: number) { return p >= 70 ? colors.success : p >= 40 ? colors.warning : colors.danger }
function bBg(p: number) { return p >= 70 ? colors.successLight : p >= 40 ? colors.warningLight : colors.dangerLight }
function bTxt(p: number) { return p >= 70 ? colors.successText : p >= 40 ? colors.warningText : colors.dangerText }
function bBrd(p: number) { return p >= 70 ? colors.successBorder : p >= 40 ? colors.warningBorder : colors.dangerBorder }

function flagLabel(flag?: string) {
  switch (flag) {
    case 'concern': return { text: 'Needs support', bg: colors.dangerLight, colour: colors.dangerText, border: colors.dangerBorder }
    case 'improving': return { text: 'Improving', bg: colors.warningLight, colour: colors.warningText, border: colors.warningBorder }
    case 'strong': return { text: 'Strong', bg: colors.successLight, colour: colors.successText, border: colors.successBorder }
    default: return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════
export default function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = useState<ClassData>(CLASSES[0])
  const [assessmentFilter, setAssessmentFilter] = useState<'all' | string>('all')

  const totalStudents = CLASSES.reduce((s, c) => s + c.studentCount, 0)
  const concernStudents = CLASSES.flatMap(c => c.students).filter(s => s.flag === 'concern')
  const pendingFeedback = ASSESSMENTS.filter(a => !a.feedbackGenerated)
  const activeHomework = HOMEWORK_RECORDS.filter(h => new Date(h.dueDate) >= new Date('2026-04-26'))
  const completedHomework = HOMEWORK_RECORDS.filter(h => new Date(h.dueDate) < new Date('2026-04-26'))

  const filteredAssessments = assessmentFilter === 'all'
    ? ASSESSMENTS
    : ASSESSMENTS.filter(a => a.className === assessmentFilter)

  return (
    <div style={{ minHeight: '100dvh', background: colors.background }}>
      {/* Header */}
      <header style={{
        background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{
            width: 36, height: 36, borderRadius: radius.md, background: colors.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: font.xl, letterSpacing: -1, textDecoration: 'none', flexShrink: 0,
          }}>M</Link>
          <div>
            <h1 style={{ fontSize: font.xl, fontWeight: '700', margin: 0, color: colors.textPrimary }}>Mathsense</h1>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>Teacher Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: font.base, color: colors.textSecondary }}>{TEACHER.school}</span>
          <Link href="/" style={{ fontSize: font.base, color: colors.primary, textDecoration: 'none', fontWeight: '600' }}>← Back to Mathsense</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 64px' }}>

        {/* ── Welcome Banner ── */}
        <div style={{
          ...cardStyle, marginBottom: 20, padding: '24px 28px',
          background: `linear-gradient(135deg, ${colors.primary}08, ${colors.primary}03)`,
          borderColor: `${colors.primary}30`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ ...pageTitle, fontSize: font['2xl'], marginBottom: 6 }}>
                Welcome back, {TEACHER.name} 👋
              </h2>
              <p style={{ fontSize: font.md, color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                You have {CLASSES.length} classes with {totalStudents} students.
                {concernStudents.length > 0 && ` ${concernStudents.length} student${concernStudents.length > 1 ? 's' : ''} flagged as needing support.`}
                {pendingFeedback.length > 0 && ` ${pendingFeedback.length} assessment${pendingFeedback.length > 1 ? 's' : ''} awaiting feedback.`}
              </p>
            </div>
            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Classes', value: String(CLASSES.length), colour: colors.primary },
                { label: 'Students', value: String(totalStudents), colour: colors.textPrimary },
                { label: 'Need support', value: String(concernStudents.length), colour: concernStudents.length > 0 ? colors.dangerText : colors.successText },
              ].map((stat, i) => (
                <div key={i} style={{
                  textAlign: 'center', padding: '8px 16px', borderRadius: radius.md,
                  border: `1px solid ${colors.border}`, background: colors.card,
                }}>
                  <div style={{ fontSize: font['2xl'], fontWeight: '700', color: stat.colour }}>{stat.value}</div>
                  <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <Link href="/demo/marking" style={{ ...primaryButton, width: 'auto', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
            📝 Marking Tool
          </Link>
          <button style={{ ...secondaryButton, width: 'auto' }}>➕ Set Homework</button>
          <button style={{ ...secondaryButton, width: 'auto' }}>📊 New Assessment</button>
          <button style={{ ...secondaryButton, width: 'auto' }}>👥 Manage Classes</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
          {/* ── Left Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── My Classes ── */}
            <div style={cardStyle}>
              <h3 style={{ ...sectionTitle, marginBottom: 14 }}>My Classes</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {CLASSES.map(cls => {
                  const isSelected = selectedClass.id === cls.id
                  return (
                    <button key={cls.id} onClick={() => setSelectedClass(cls)} style={{
                      flex: 1, padding: '14px 16px', borderRadius: radius.md, cursor: 'pointer', fontFamily: 'inherit',
                      border: isSelected ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                      background: isSelected ? '#eff6ff' : colors.card, textAlign: 'left',
                    }}>
                      <div style={{ fontSize: font.lg, fontWeight: '700', color: isSelected ? colors.primary : colors.textPrimary, marginBottom: 4 }}>
                        {cls.yearGroup} {cls.name}
                      </div>
                      <div style={{ fontSize: font.sm, color: colors.textSecondary, marginBottom: 8 }}>
                        {cls.studentCount} students · Last: {cls.recentAssessmentDate}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textSecondary }}>Class avg:</span>
                        <span style={{
                          fontSize: font.base, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                          background: bBg(cls.avgPct), color: bTxt(cls.avgPct),
                        }}>{cls.avgPct}%</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* ── Selected Class Detail ── */}
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ fontSize: font.lg, fontWeight: '700', margin: 0, color: colors.textPrimary }}>
                    {selectedClass.yearGroup} {selectedClass.name}
                  </h4>
                  <span style={{ fontSize: font.sm, color: colors.textSecondary }}>
                    Last assessment: {selectedClass.recentAssessment}
                  </span>
                </div>

                {/* Topic breakdown for class */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
                  {TOPICS.map(tp => {
                    const p = selectedClass.topicAvgs[tp.id]
                    return (
                      <div key={tp.id} style={{ padding: '8px 10px', borderRadius: radius.sm, border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: font.sm, fontWeight: '600', color: tp.colour }}>{tp.label}</span>
                          <span style={{
                            fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '1px 6px',
                            background: bBg(p), color: bTxt(p),
                          }}>{p}%</span>
                        </div>
                        <div style={{ height: 5, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: radius.full, width: `${p}%`, background: tp.colour }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Student table */}
                <div style={{ overflowX: 'auto', borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.sm }}>
                    <thead>
                      <tr>
                        <th style={{ ...thS, textAlign: 'left', paddingLeft: 12 }}>Student</th>
                        {TOPICS.map(tp => {
                          const hasData = selectedClass.students.some(s => s.topics[tp.id])
                          if (!hasData) return null
                          return <th key={tp.id} style={{ ...thS, color: tp.colour }}>{tp.label}</th>
                        })}
                        <th style={thS}>Total</th>
                        <th style={thS}>%</th>
                        <th style={{ ...thS, textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selectedClass.students].sort((a, b) => b.score - a.score).map((student, i) => {
                        const p = pc(student.score, student.total)
                        const fl = flagLabel(student.flag)
                        return (
                          <tr key={i}>
                            <td style={{ ...tdS, textAlign: 'left', paddingLeft: 12, fontWeight: '600', color: colors.textPrimary, whiteSpace: 'nowrap' }}>
                              {student.name}
                            </td>
                            {TOPICS.map(tp => {
                              const d = student.topics[tp.id]
                              if (!d) {
                                const hasCol = selectedClass.students.some(s => s.topics[tp.id])
                                if (!hasCol) return null
                                return <td key={tp.id} style={{ ...tdS, color: colors.textHint }}>—</td>
                              }
                              const sp = pc(d.scored, d.avail)
                              return (
                                <td key={tp.id} style={{ ...tdS, fontWeight: '600', color: bCol(sp) }}>
                                  {d.scored}/{d.avail}
                                </td>
                              )
                            })}
                            <td style={{ ...tdS, fontWeight: '700' }}>{student.score}/{student.total}</td>
                            <td style={{ ...tdS, fontWeight: '700', color: bCol(p) }}>{p}%</td>
                            <td style={{ ...tdS, textAlign: 'left' }}>
                              {fl && (
                                <span style={{
                                  fontSize: font.sm, fontWeight: '600', borderRadius: radius.sm, padding: '2px 8px',
                                  background: fl.bg, color: fl.colour,
                                }}>{fl.text}</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Recent Assessments ── */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={sectionTitle}>Recent Assessments</h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[['all', 'All'], ...CLASSES.map(c => [c.id, `${c.yearGroup} ${c.name}`])].map(([key, label]) => (
                    <button key={key} onClick={() => setAssessmentFilter(key === 'all' ? 'all' : CLASSES.find(c => c.id === key)?.yearGroup + ' ' + CLASSES.find(c => c.id === key)?.name || '')} style={{
                      padding: '4px 10px', borderRadius: radius.sm, fontSize: font.sm, fontWeight: '600',
                      cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                      background: (assessmentFilter === 'all' && key === 'all') || assessmentFilter === label ? colors.primary : colors.cardAlt,
                      color: (assessmentFilter === 'all' && key === 'all') || assessmentFilter === label ? '#fff' : colors.textSecondary,
                    }}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredAssessments.map(a => {
                  const avgPct = pc(a.avgScore, a.totalMarks)
                  const tl = TYPE_LABELS[a.type]
                  return (
                    <div key={a.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', borderRadius: radius.md, border: `1px solid ${colors.border}`,
                      background: colors.card,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '700', borderRadius: radius.sm, padding: '2px 6px',
                          background: tl.bg, color: tl.colour, textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>{tl.label}</span>
                        <div>
                          <div style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{a.title}</div>
                          <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{a.className} · {a.date} · {a.studentCount} students</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: font.base, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                          background: bBg(avgPct), color: bTxt(avgPct),
                        }}>Avg {avgPct}%</span>
                        {!a.feedbackGenerated && (
                          <span style={{
                            fontSize: font.sm, fontWeight: '600', borderRadius: radius.sm, padding: '2px 8px',
                            background: colors.warningLight, color: colors.warningText, border: `1px solid ${colors.warningBorder}`,
                          }}>Feedback pending</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Students Needing Support ── */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={sectionTitle}>Needs Support</h3>
                <span style={{
                  fontSize: font.sm, fontWeight: '700', borderRadius: radius.full, padding: '2px 10px',
                  background: concernStudents.length > 0 ? colors.dangerLight : colors.successLight,
                  color: concernStudents.length > 0 ? colors.dangerText : colors.successText,
                  border: `1px solid ${concernStudents.length > 0 ? colors.dangerBorder : colors.successBorder}`,
                }}>{concernStudents.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CLASSES.flatMap(cls =>
                  cls.students
                    .filter(s => s.flag === 'concern')
                    .map(s => ({ ...s, className: `${cls.yearGroup} ${cls.name}` }))
                ).map((student, i) => {
                  const p = pc(student.score, student.total)
                  // Find weakest topic
                  const topicScores = TOPICS.map(tp => {
                    const d = student.topics[tp.id]
                    return d ? { label: tp.label, pct: pc(d.scored, d.avail) } : null
                  }).filter(Boolean) as { label: string; pct: number }[]
                  const weakest = [...topicScores].sort((a, b) => a.pct - b.pct)[0]

                  return (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: radius.md,
                      border: `1px solid ${colors.dangerBorder}`, background: colors.dangerLight,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: font.base, fontWeight: '700', color: colors.textPrimary }}>{student.name}</span>
                        <span style={{
                          fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                          background: bBg(p), color: bTxt(p),
                        }}>{p}%</span>
                      </div>
                      <div style={{ fontSize: font.sm, color: colors.textSecondary }}>
                        {student.className} · Weakest: {weakest?.label ?? '—'} ({weakest?.pct ?? 0}%)
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Homework Tracker ── */}
            <div style={cardStyle}>
              <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Homework</h3>

              {activeHomework.length > 0 && (
                <>
                  <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Active</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {activeHomework.map(hw => (
                      <div key={hw.id} style={{
                        padding: '10px 12px', borderRadius: radius.md, border: `1px solid ${colors.border}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div>
                            <div style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{hw.title}</div>
                            <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{hw.className} · Due: {hw.dueDate}</div>
                          </div>
                          <span style={{
                            fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                            background: hw.submitted === hw.total ? colors.successLight : colors.warningLight,
                            color: hw.submitted === hw.total ? colors.successText : colors.warningText,
                          }}>{hw.submitted}/{hw.total}</span>
                        </div>
                        {/* Submission progress bar */}
                        <div style={{ height: 4, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: radius.full, width: `${pc(hw.submitted, hw.total)}%`, background: hw.submitted === hw.total ? colors.success : colors.warning }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {completedHomework.length > 0 && (
                <>
                  <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.textHint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Completed</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {completedHomework.map(hw => (
                      <div key={hw.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', borderRadius: radius.md, border: `1px solid ${colors.border}`,
                        background: colors.cardAlt,
                      }}>
                        <div>
                          <div style={{ fontSize: font.base, fontWeight: '500', color: colors.textPrimary }}>{hw.title}</div>
                          <div style={{ fontSize: font.sm, color: colors.textHint }}>{hw.className} · {hw.dueDate}</div>
                        </div>
                        <span style={{
                          fontSize: font.sm, fontWeight: '600', color: colors.successText,
                        }}>✓ {hw.submitted}/{hw.total}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Pending Actions ── */}
            <div style={cardStyle}>
              <h3 style={{ ...sectionTitle, marginBottom: 12 }}>To Do</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingFeedback.map(a => (
                  <Link key={a.id} href="/demo/marking" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: radius.md, textDecoration: 'none',
                    border: `1px solid ${colors.warningBorder}`, background: colors.warningLight,
                  }}>
                    <div>
                      <div style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>Generate feedback</div>
                      <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{a.title} · {a.className}</div>
                    </div>
                    <span style={{ color: colors.primary, fontWeight: '700', fontSize: font.base }}>→</span>
                  </Link>
                ))}
                {activeHomework.filter(hw => hw.submitted < hw.total).map(hw => (
                  <div key={hw.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: radius.md,
                    border: `1px solid ${colors.border}`, background: colors.card,
                  }}>
                    <div>
                      <div style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>Chase submissions</div>
                      <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{hw.title} · {hw.submitted}/{hw.total} submitted</div>
                    </div>
                    <span style={{
                      fontSize: font.sm, fontWeight: '600', color: colors.warningText,
                    }}>{hw.total - hw.submitted} outstanding</span>
                  </div>
                ))}
                {pendingFeedback.length === 0 && activeHomework.filter(hw => hw.submitted < hw.total).length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', color: colors.textHint, fontSize: font.base }}>
                    All caught up — nothing to do right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Table styles ───────────────────────────────────────────────────────────
const thS: React.CSSProperties = {
  padding: '8px 6px', textAlign: 'center', background: colors.cardAlt,
  borderBottom: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`,
  fontWeight: '600', fontSize: font.sm, whiteSpace: 'nowrap',
}

const tdS: React.CSSProperties = {
  padding: '6px 6px', textAlign: 'center',
  borderBottom: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`,
}
