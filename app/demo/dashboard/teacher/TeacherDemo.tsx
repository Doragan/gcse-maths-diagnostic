'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  colors, radius, font,
  card as cardStyle, primaryButton,
  pageTitle, sectionTitle,
} from '@/lib/styles'
import { demoDate, demoDateIso, demoMonthLabel } from '@/lib/demoDates'
import { TOPIC_COLOURS } from '@/lib/demoTopicColours'
import DemoDataRibbon from '../../DemoDataRibbon'

// ─── Types ──────────────────────────────────────────────────────────────────
// Shared palette, kept clear of the red/amber/green mastery scale this page
// uses everywhere — see lib/demoTopicColours.ts for why.
const TOPICS = [
  { id: 'number',   label: 'Number',               colour: TOPIC_COLOURS.number.fg },
  { id: 'algebra',  label: 'Algebra',              colour: TOPIC_COLOURS.algebra.fg },
  { id: 'shape',    label: 'Shape and Space',      colour: TOPIC_COLOURS.shape.fg },
  { id: 'ratio',    label: 'Ratio and Proportion', colour: TOPIC_COLOURS.ratio.fg },
  { id: 'probdata', label: 'Probability and Data', colour: TOPIC_COLOURS.probdata.fg },
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
  mastery: number       // current overall mastery %
  prevMastery: number   // previous overall mastery %
  topicMastery: Partial<Record<TopicId, number>>  // current mastery per topic
}

type StudentStatus = 'strong' | 'improving' | 'developing' | 'concern'

function getStatus(s: StudentSummary): StudentStatus {
  if (s.mastery >= 70) return 'strong'
  if (s.mastery < 30) return 'concern'
  if (s.mastery - s.prevMastery >= 8) return 'improving'
  return 'developing'
}

function statusLabel(status: StudentStatus) {
  switch (status) {
    case 'strong': return { text: 'Strong', desc: '≥ 70% mastery', bg: colors.successLight, colour: colors.successText, border: colors.successBorder }
    case 'improving': return { text: 'Improving', desc: '≥ 8% gain', bg: '#eff6ff', colour: colors.primary, border: '#bfdbfe' }
    case 'developing': return { text: 'Developing', desc: '30–69% mastery', bg: colors.warningLight, colour: colors.warningText, border: colors.warningBorder }
    case 'concern': return { text: 'Needs support', desc: '< 30% mastery', bg: colors.dangerLight, colour: colors.dangerText, border: colors.dangerBorder }
  }
}

interface MasteryPoint {
  label: string
  pct: number
}

interface ClassGap {
  topic: string
  topicColour: string
  skill: string
  classMastery: number    // % of class at or above 50% mastery in this skill
  studentsBelow: number   // count of students below 50%
  totalStudents: number
  priority: 'high' | 'medium'
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
  avgMastery: number
  prevAvgMastery: number
  topicAvgs: Record<TopicId, number>
  masteryHistory: MasteryPoint[]
  gaps: ClassGap[]
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
  /** Sortable twin of dueDate — what "is this still active?" compares. */
  dueIso: string
  setDate: string
  submitted: number
  total: number
  questionId: string
}

// ─── Mock Data ──────────────────────────────────────────────────────────────
//
// Every date is an OFFSET IN DAYS from the anchor the server passed in, not a
// literal. A demo sent to a prospective customer in November must not still be
// showing homework that was due last May — see lib/demoDates.ts.
const TEACHER = { name: 'Mr Thompson', firstName: 'James', school: 'Greenfield Academy' }

const buildClasses = (a: string): ClassData[] => [
  {
    id: 'y10-set2', name: 'Set 2', yearGroup: 'Year 10', studentCount: 8,
    recentAssessment: 'Paper 3 Calculator (Nov 2024)', recentAssessmentDate: demoDate(a, -18), recentAssessmentType: 'exam',
    avgMastery: 52, prevAvgMastery: 42,
    topicAvgs: { number: 72, algebra: 38, shape: 50, ratio: 68, probdata: 62 },
    masteryHistory: [
      { label: demoMonthLabel(a, -300), pct: 28 },
      { label: demoMonthLabel(a, -240), pct: 35 },
      { label: demoMonthLabel(a, -120), pct: 42 },
      { label: demoMonthLabel(a, -18),  pct: 52 },
    ],
    students: [
      { name: 'Harry Wilson',     mastery: 88, prevMastery: 80, topicMastery: { number: 92, algebra: 82, ratio: 90, probdata: 88 } },
      { name: 'Amira Patel',      mastery: 85, prevMastery: 74, topicMastery: { number: 90, algebra: 78, ratio: 85, probdata: 88 } },
      { name: 'Ben Okonkwo',      mastery: 57, prevMastery: 41, topicMastery: { number: 72, algebra: 38, ratio: 68, probdata: 62 } },
      { name: 'Charlotte Evans',  mastery: 54, prevMastery: 48, topicMastery: { number: 68, algebra: 42, ratio: 55, probdata: 58 } },
      { name: 'Daniel Kim',       mastery: 48, prevMastery: 40, topicMastery: { number: 55, algebra: 35, ratio: 52, probdata: 60 } },
      { name: 'Emily Zhang',      mastery: 42, prevMastery: 38, topicMastery: { number: 65, algebra: 45, ratio: 22, probdata: 15 } },
      { name: 'Finn McCarthy',    mastery: 25, prevMastery: 22, topicMastery: { number: 35, algebra: 18, ratio: 20, probdata: 28 } },
      { name: 'Grace Adeyemi',    mastery: 18, prevMastery: 20, topicMastery: { number: 28, algebra: 8, ratio: 12, probdata: 22 } },
    ],
    gaps: [
      { topic: 'Algebra', topicColour: TOPIC_COLOURS.algebra.fg, skill: 'Solving Linear Equations', classMastery: 25, studentsBelow: 6, totalStudents: 8, priority: 'high' },
      { topic: 'Algebra', topicColour: TOPIC_COLOURS.algebra.fg, skill: 'Factorising', classMastery: 18, studentsBelow: 7, totalStudents: 8, priority: 'high' },
      { topic: 'Algebra', topicColour: TOPIC_COLOURS.algebra.fg, skill: 'Expanding Brackets', classMastery: 32, studentsBelow: 5, totalStudents: 8, priority: 'high' },
      { topic: 'Shape and Space', topicColour: TOPIC_COLOURS.shape.fg, skill: 'Angles in Polygons', classMastery: 40, studentsBelow: 5, totalStudents: 8, priority: 'medium' },
      { topic: 'Ratio and Proportion', topicColour: TOPIC_COLOURS.ratio.fg, skill: 'Compound Units', classMastery: 35, studentsBelow: 5, totalStudents: 8, priority: 'medium' },
      { topic: 'Probability and Data', topicColour: TOPIC_COLOURS.probdata.fg, skill: 'Pie Charts', classMastery: 42, studentsBelow: 4, totalStudents: 8, priority: 'medium' },
    ],
  },
  {
    id: 'y11-set3', name: 'Set 3', yearGroup: 'Year 11', studentCount: 6,
    recentAssessment: 'Paper 1 Non-Calculator (Jun 2024)', recentAssessmentDate: demoDate(a, -40), recentAssessmentType: 'exam',
    avgMastery: 40, prevAvgMastery: 34,
    topicAvgs: { number: 48, algebra: 30, shape: 38, ratio: 45, probdata: 50 },
    masteryHistory: [
      { label: demoMonthLabel(a, -300), pct: 22 },
      { label: demoMonthLabel(a, -240), pct: 28 },
      { label: demoMonthLabel(a, -120), pct: 34 },
      { label: demoMonthLabel(a, -40),  pct: 40 },
    ],
    students: [
      { name: 'Sophie Turner',    mastery: 58, prevMastery: 50, topicMastery: { number: 60, algebra: 45, shape: 50, ratio: 64, probdata: 70 } },
      { name: 'Jake Robinson',    mastery: 46, prevMastery: 35, topicMastery: { number: 50, algebra: 36, shape: 38, ratio: 50, probdata: 50 } },
      { name: 'Lily Chen',        mastery: 42, prevMastery: 38, topicMastery: { number: 45, algebra: 32, shape: 38, ratio: 43, probdata: 50 } },
      { name: 'Oscar Williams',   mastery: 36, prevMastery: 32, topicMastery: { number: 40, algebra: 23, shape: 31, ratio: 36, probdata: 50 } },
      { name: 'Ruby Ahmed',       mastery: 30, prevMastery: 28, topicMastery: { number: 35, algebra: 18, shape: 25, ratio: 36, probdata: 40 } },
      { name: 'Noah Kowalski',    mastery: 26, prevMastery: 22, topicMastery: { number: 30, algebra: 14, shape: 19, ratio: 29, probdata: 40 } },
    ],
    gaps: [
      { topic: 'Algebra', topicColour: TOPIC_COLOURS.algebra.fg, skill: 'Factorising', classMastery: 12, studentsBelow: 6, totalStudents: 6, priority: 'high' },
      { topic: 'Algebra', topicColour: TOPIC_COLOURS.algebra.fg, skill: 'Inequalities', classMastery: 15, studentsBelow: 6, totalStudents: 6, priority: 'high' },
      { topic: 'Shape and Space', topicColour: TOPIC_COLOURS.shape.fg, skill: 'Congruence and Similarity', classMastery: 20, studentsBelow: 5, totalStudents: 6, priority: 'high' },
      { topic: 'Shape and Space', topicColour: TOPIC_COLOURS.shape.fg, skill: 'Angles in Polygons', classMastery: 28, studentsBelow: 5, totalStudents: 6, priority: 'high' },
      { topic: 'Algebra', topicColour: TOPIC_COLOURS.algebra.fg, skill: 'Solving Linear Equations', classMastery: 30, studentsBelow: 4, totalStudents: 6, priority: 'medium' },
      { topic: 'Ratio and Proportion', topicColour: TOPIC_COLOURS.ratio.fg, skill: 'Compound Units', classMastery: 32, studentsBelow: 4, totalStudents: 6, priority: 'medium' },
    ],
  },
]

const buildAssessments = (a: string): AssessmentRecord[] => [
  { id: 'a1', title: 'Paper 3 Calculator (Nov 2024)', date: demoDate(a, -18), type: 'exam', className: 'Year 10 Set 2', studentCount: 8, avgScore: 21, totalMarks: 35, feedbackGenerated: true },
  { id: 'a2', title: 'Algebra End of Topic Test', date: demoDate(a, -31), type: 'topic-test', className: 'Year 10 Set 2', studentCount: 8, avgScore: 11, totalMarks: 20, feedbackGenerated: true },
  { id: 'a3', title: 'Paper 1 Non-Calculator (Jun 2024)', date: demoDate(a, -40), type: 'exam', className: 'Year 11 Set 3', studentCount: 6, avgScore: 33, totalMarks: 80, feedbackGenerated: true },
  { id: 'a4', title: 'Ratio and Proportion Topic Test', date: demoDate(a, -54), type: 'topic-test', className: 'Year 11 Set 3', studentCount: 6, avgScore: 8, totalMarks: 15, feedbackGenerated: false },
  { id: 'a5', title: 'Paper 2 Calculator (Jun 2024)', date: demoDate(a, -126), type: 'exam', className: 'Year 10 Set 2', studentCount: 8, avgScore: 19, totalMarks: 80, feedbackGenerated: true },
]

const buildHomework = (a: string): HomeworkRecord[] => [
  { id: 'h1', title: 'Sequences Homework', className: 'Year 10 Set 2', dueDate: demoDate(a, 9), dueIso: demoDateIso(a, 9), setDate: demoDate(a, -5), submitted: 3, total: 8, questionId: '321580e4-cb6d-4f9e-a3c6-d558ae8ba553' },
  { id: 'h2', title: 'Ratio and Proportion Homework', className: 'Year 10 Set 2', dueDate: demoDate(a, 16), dueIso: demoDateIso(a, 16), setDate: demoDate(a, -1), submitted: 0, total: 8, questionId: 'a653ffa7-038e-434e-90a5-d692e9fa8675' },
  { id: 'h3', title: 'Algebra Revision Homework', className: 'Year 11 Set 3', dueDate: demoDate(a, 5), dueIso: demoDateIso(a, 5), setDate: demoDate(a, -9), submitted: 4, total: 6, questionId: '66a8b913-93d4-491c-8710-fe6466fdeab1' },
  { id: 'h4', title: 'Fractions and Decimals Homework', className: 'Year 10 Set 2', dueDate: demoDate(a, -24), dueIso: demoDateIso(a, -24), setDate: demoDate(a, -31), submitted: 8, total: 8, questionId: '463e9833-bc0a-40d9-bc40-941de561a0cc' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────
function pc(s: number, a: number) { return a > 0 ? Math.round(s / a * 100) : 0 }
function bCol(p: number) { return p >= 70 ? colors.success : p >= 40 ? colors.warning : colors.danger }
function bBg(p: number) { return p >= 70 ? colors.successLight : p >= 40 ? colors.warningLight : colors.dangerLight }
function bTxt(p: number) { return p >= 70 ? colors.successText : p >= 40 ? colors.warningText : colors.dangerText }
function bBrd(p: number) { return p >= 70 ? colors.successBorder : p >= 40 ? colors.warningBorder : colors.dangerBorder }

// ─── Class Mastery Chart ─────────────────────────────────────────────────────
function ClassMasteryChart({ points, width = 500, height = 180 }: { points: MasteryPoint[]; width?: number; height?: number }) {
  if (points.length < 2) return null
  const padL = 38; const padR = 20; const padT = 20; const padB = 34
  const innerW = width - padL - padR; const innerH = height - padT - padB

  const yTicks = [0, 25, 50, 75, 100]
  const coords = points.map((p, i) => ({
    x: padL + (i / (points.length - 1)) * innerW,
    y: padT + innerH - (p.pct / 100) * innerH,
  }))
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padT + innerH} L ${coords[0].x} ${padT + innerH} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="class-mastery-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.15" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map(tick => (
        <g key={tick}>
          <line x1={padL} y1={padT + innerH - (tick / 100) * innerH} x2={width - padR} y2={padT + innerH - (tick / 100) * innerH} stroke={colors.border} strokeWidth="1" strokeDasharray={tick === 0 ? '' : '4 3'} />
          <text x={padL - 6} y={padT + innerH - (tick / 100) * innerH + 4} textAnchor="end" fontSize="10" fill={colors.textHint} fontFamily="inherit">{tick}%</text>
        </g>
      ))}
      {points.map((p, i) => (
        <g key={i}>
          <line x1={coords[i].x} y1={padT + innerH} x2={coords[i].x} y2={padT + innerH + 4} stroke={colors.border} strokeWidth="1" />
          <text x={coords[i].x} y={height - 6} textAnchor="middle" fontSize="10" fill={colors.textSecondary} fontFamily="inherit">{p.label}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#class-mastery-grad)" />
      <path d={linePath} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={i === coords.length - 1 ? 5 : 3.5} fill={i === coords.length - 1 ? colors.primary : '#fff'} stroke={colors.primary} strokeWidth="2" />
          <text x={c.x} y={c.y - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill={colors.primary} fontFamily="inherit">{points[i].pct}%</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Ben's detailed profile data (teacher's view) ───────────────────────────
interface MasteryTimePoint { label: string; pct: number }
interface AssessmentResult { title: string; date: string; type: AssessmentType; score: number; total: number; www: string[]; ebi: string[] }
interface TaskItem { skill: string; topic: string; question: string; fromAssessment: string }

const BEN_MASTERY: MasteryTimePoint[] = [
  { label: 'Oct 25', pct: 30 },
  { label: 'Dec 25', pct: 37 },
  { label: 'Feb 26', pct: 41 },
  { label: 'Mar 26', pct: 57 },
]

const BEN_TOPIC_MASTERY: Record<TopicId, { current: number; prev: number }> = {
  number:   { current: 72, prev: 56 },
  algebra:  { current: 38, prev: 32 },
  shape:    { current: 45, prev: 42 },
  ratio:    { current: 68, prev: 43 },
  probdata: { current: 62, prev: 40 },
}

const buildBenAssessments = (a: string): AssessmentResult[] => [
  {
    title: 'Paper 3 Calculator (Nov 2024)', date: demoDate(a, -18), type: 'exam', score: 24, total: 35,
    www: ['Strong performance on Number (5/6).', 'Strong on Ratio and Proportion (7/8).', 'Good attempt at Probability and Data (4/5).'],
    ebi: ['Revise Algebra — only 6/16 marks.', 'Practise solving multi-step equations.', 'Consolidate substitution and expanding brackets.'],
  },
  {
    title: 'Algebra End of Topic Test', date: demoDate(a, -31), type: 'topic-test', score: 9, total: 20,
    www: ['Correctly expanded single brackets.', 'Good understanding of substitution.'],
    ebi: ['Practise solving equations with brackets.', 'Revise factorising expressions.'],
  },
  {
    title: 'Paper 1 Non-Calculator (Nov 2024)', date: demoDate(a, -61), type: 'exam', score: 31, total: 80,
    www: ['Some understanding of Number (10/18).', 'Showed working clearly.'],
    ebi: ['Revise Algebra — only 7/22 marks.', 'Practise Shape and Space topics.'],
  },
]

const BEN_TASKS: TaskItem[] = [
  { skill: 'Substitution', topic: 'Algebra', question: 'Input → ×3 → +5 → Output. Work out the input when the output is 20.', fromAssessment: 'Paper 3 Calculator' },
  { skill: 'Solving Linear Equations', topic: 'Algebra', question: 'Solve  3(4e − 2) = 42', fromAssessment: 'Paper 3 Calculator' },
  { skill: 'Simplifying Expressions', topic: 'Algebra', question: 'Simplify  p + p + p + p + p', fromAssessment: 'Paper 3 Calculator' },
  { skill: 'Proportion', topic: 'Ratio and Proportion', question: 'The cost of 30 pens and 10 rulers is £16.00. Work out the cost of 3 pens and 1 ruler.', fromAssessment: 'Paper 3 Calculator' },
]

// ─── Student Profile Mastery Chart ──────────────────────────────────────────
function ProfileMasteryChart({ points, width = 460, height = 160 }: { points: MasteryTimePoint[]; width?: number; height?: number }) {
  if (points.length < 2) return null
  const padL = 36; const padR = 16; const padT = 18; const padB = 30
  const innerW = width - padL - padR; const innerH = height - padT - padB
  const yTicks = [0, 25, 50, 75, 100]
  const coords = points.map((p, i) => ({
    x: padL + (i / (points.length - 1)) * innerW,
    y: padT + innerH - (p.pct / 100) * innerH,
  }))
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padT + innerH} L ${coords[0].x} ${padT + innerH} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="profile-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.15" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map(tick => (
        <g key={tick}>
          <line x1={padL} y1={padT + innerH - (tick / 100) * innerH} x2={width - padR} y2={padT + innerH - (tick / 100) * innerH} stroke={colors.border} strokeWidth="1" strokeDasharray={tick === 0 ? '' : '4 3'} />
          <text x={padL - 5} y={padT + innerH - (tick / 100) * innerH + 3.5} textAnchor="end" fontSize="9" fill={colors.textHint} fontFamily="inherit">{tick}%</text>
        </g>
      ))}
      {points.map((p, i) => (
        <text key={i} x={coords[i].x} y={height - 6} textAnchor="middle" fontSize="9" fill={colors.textSecondary} fontFamily="inherit">{p.label}</text>
      ))}
      <path d={areaPath} fill="url(#profile-grad)" />
      <path d={linePath} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={i === coords.length - 1 ? 4.5 : 3} fill={i === coords.length - 1 ? colors.primary : '#fff'} stroke={colors.primary} strokeWidth="2" />
          <text x={c.x} y={c.y - 8} textAnchor="middle" fontSize="10" fontWeight="600" fill={colors.primary} fontFamily="inherit">{points[i].pct}%</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Student Profile Modal ──────────────────────────────────────────────────
function StudentProfileModal({ student, anchor, onClose }: { student: StudentSummary; anchor: string; onClose: () => void }) {
  const status = getStatus(student)
  const sl = statusLabel(status)
  const change = student.mastery - student.prevMastery
  const isBen = student.name === 'Ben Okonkwo'
  const benAssessments = useMemo(() => buildBenAssessments(anchor), [anchor])

  // Find weakest topic
  const topicScores = TOPICS.map(tp => {
    const m = student.topicMastery[tp.id]
    return m !== undefined ? { ...tp, pct: m } : null
  }).filter(Boolean) as (typeof TOPICS[number] & { pct: number })[]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: colors.card, borderRadius: radius.lg, maxWidth: 680, width: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        border: `1px solid ${colors.border}`, boxShadow: '0 20px 60px rgba(0,0,0,.15)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: font.xl, fontWeight: '700', margin: 0, color: colors.textPrimary }}>{student.name}</h3>
            <span style={{
              fontSize: font.sm, fontWeight: '600', borderRadius: radius.sm, padding: '2px 8px',
              background: sl.bg, color: sl.colour,
            }}>{sl.text}</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: font.xl, cursor: 'pointer', color: colors.textSecondary, padding: 4,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* Mastery summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              fontSize: font['3xl'], fontWeight: '700', color: bCol(student.mastery),
              background: bBg(student.mastery), borderRadius: radius.lg, padding: '10px 20px',
              border: `1px solid ${bBrd(student.mastery)}`, textAlign: 'center', lineHeight: 1.2,
            }}>
              {student.mastery}%
              {change !== 0 && (
                <div style={{ fontSize: font.sm, fontWeight: '600', color: change > 0 ? colors.success : colors.danger, marginTop: 2 }}>
                  {change > 0 ? '↑' : '↓'}{Math.abs(change)}%
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: font.md, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 }}>Overall Mastery</div>
              <div style={{ fontSize: font.sm, color: colors.textSecondary }}>
                {change > 0 ? `Up from ${student.prevMastery}%` : change < 0 ? `Down from ${student.prevMastery}%` : `Unchanged at ${student.mastery}%`}
              </div>
            </div>
          </div>

          {/* Mastery chart (Ben only has detailed history) */}
          {isBen && (
            <div style={{ borderRadius: radius.md, border: `1px solid ${colors.border}`, padding: '10px 6px 2px', background: colors.cardAlt, marginBottom: 16 }}>
              <div style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 2, paddingLeft: 6 }}>Mastery Over Time</div>
              <ProfileMasteryChart points={BEN_MASTERY} />
            </div>
          )}

          {/* Topic mastery */}
          <div style={{ fontSize: font.md, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Topic Mastery</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 20 }}>
            {topicScores.map(tp => {
              const topicChange = isBen ? tp.pct - (BEN_TOPIC_MASTERY[tp.id]?.prev ?? tp.pct) : null
              return (
                <div key={tp.id} style={{ padding: '8px 10px', borderRadius: radius.sm, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: font.sm, fontWeight: '600', color: tp.colour }}>{tp.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: font.sm, fontWeight: '700', color: bTxt(tp.pct) }}>{tp.pct}%</span>
                      {topicChange !== null && topicChange !== 0 && (
                        <span style={{ fontSize: '10px', fontWeight: '600', color: topicChange > 0 ? colors.success : colors.danger }}>
                          {topicChange > 0 ? '↑' : '↓'}{Math.abs(topicChange)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ height: 5, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: radius.full, width: `${tp.pct}%`, background: tp.colour }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Ben-specific: recent assessments, WWW/EBI, tasks */}
          {isBen && (
            <>
              {/* Recent assessments */}
              <div style={{ fontSize: font.md, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Recent Assessments</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {benAssessments.map((a, i) => {
                  const p = pc(a.score, a.total)
                  const tl = TYPE_LABELS[a.type]
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', borderRadius: radius.sm, border: `1px solid ${colors.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: '9px', fontWeight: '700', borderRadius: radius.sm, padding: '1px 5px',
                          background: tl.bg, color: tl.colour, textTransform: 'uppercase',
                        }}>{tl.label}</span>
                        <div>
                          <div style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{a.title}</div>
                          <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{a.date}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '2px 6px',
                        background: bBg(p), color: bTxt(p),
                      }}>{a.score}/{a.total} ({p}%)</span>
                    </div>
                  )
                })}
              </div>

              {/* Latest WWW/EBI */}
              <div style={{ fontSize: font.md, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Latest Feedback</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <div style={{ background: colors.successLight, borderRadius: radius.md, padding: '10px 12px', border: `1px solid ${colors.successBorder}` }}>
                  <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.successText, textTransform: 'uppercase', marginBottom: 5 }}>✓ What Went Well</div>
                  {benAssessments[0].www.map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: radius.full, background: colors.success, flexShrink: 0, marginTop: 5 }} />
                      <span style={{ fontSize: font.sm, color: colors.textPrimary, lineHeight: 1.4 }}>{w}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: colors.warningLight, borderRadius: radius.md, padding: '10px 12px', border: `1px solid ${colors.warningBorder}` }}>
                  <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.warningText, textTransform: 'uppercase', marginBottom: 5 }}>△ Even Better If</div>
                  {benAssessments[0].ebi.map((e, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: radius.full, background: colors.warning, flexShrink: 0, marginTop: 5 }} />
                      <span style={{ fontSize: font.sm, color: colors.textPrimary, lineHeight: 1.4 }}>{e}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outstanding tasks */}
              <div style={{ fontSize: font.md, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Outstanding Tasks ({BEN_TASKS.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {BEN_TASKS.map((task, i) => (
                  <div key={i} style={{
                    padding: '8px 10px', borderRadius: radius.sm, border: `1px solid ${colors.border}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{task.skill}</span>
                      <span style={{ fontSize: font.sm, fontWeight: '600', color: colors.primary }}>{task.topic}</span>
                    </div>
                    <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{task.question}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Non-Ben students: simpler view */}
          {!isBen && (
            <div style={{ padding: 16, textAlign: 'center', color: colors.textHint, fontSize: font.base }}>
              Detailed assessment history and tasks will be available once this student's assessments have been processed through the marking tool.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export default function TeacherDashboard({ anchor }: { anchor: string }) {
  // `anchor` is today, computed on the SERVER (see ./page.tsx). Deriving the
  // dates here from a client-side `new Date()` would disagree with the
  // prerendered HTML and trip a hydration mismatch.
  const CLASSES = useMemo(() => buildClasses(anchor), [anchor])
  const ASSESSMENTS = useMemo(() => buildAssessments(anchor), [anchor])
  const HOMEWORK_RECORDS = useMemo(() => buildHomework(anchor), [anchor])

  const [selectedClassId, setSelectedClassId] = useState<string>(CLASSES[0].id)
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)
  const selectedClass = CLASSES.find(c => c.id === selectedClassId) ?? CLASSES[0]

  const totalStudents = CLASSES.reduce((s, c) => s + c.studentCount, 0)
  const concernStudents = CLASSES.flatMap(c => c.students).filter(s => getStatus(s) === 'concern')
  const pendingFeedback = ASSESSMENTS.filter(a => !a.feedbackGenerated)
  const activeHomework = HOMEWORK_RECORDS.filter(h => h.dueIso >= anchor)
  const completedHomework = HOMEWORK_RECORDS.filter(h => h.dueIso < anchor)

  return (
    <div style={{ minHeight: '100dvh', background: colors.background }}>
      <DemoDataRibbon note="Greenfield Academy is invented — these are illustrative classes, not a real school." />

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
                    <button key={cls.id} onClick={() => setSelectedClassId(cls.id)} style={{
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
                        <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textSecondary }}>Class mastery:</span>
                        <span style={{
                          fontSize: font.base, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                          background: bBg(cls.avgMastery), color: bTxt(cls.avgMastery),
                        }}>{cls.avgMastery}%</span>
                        {cls.avgMastery !== cls.prevAvgMastery && (
                          <span style={{ fontSize: font.sm, fontWeight: '600', color: cls.avgMastery > cls.prevAvgMastery ? colors.success : colors.danger }}>
                            {cls.avgMastery > cls.prevAvgMastery ? '↑' : '↓'}{Math.abs(cls.avgMastery - cls.prevAvgMastery)}%
                          </span>
                        )}
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

                {/* Class mastery over time */}
                <div style={{ borderRadius: radius.md, border: `1px solid ${colors.border}`, padding: '12px 8px 4px', background: colors.cardAlt, marginBottom: 16 }}>
                  <div style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, paddingLeft: 8 }}>Class Average Mastery</div>
                  <ClassMasteryChart points={selectedClass.masteryHistory} />
                </div>

                {/* Class gaps — skills to target */}
                {(selectedClass.gaps?.length ?? 0) > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <h4 style={{ fontSize: font.md, fontWeight: '700', margin: 0, color: colors.textPrimary }}>
                        Common Gaps
                      </h4>
                      <span style={{ fontSize: font.sm, color: colors.textHint }}>Based on assessed topics only</span>
                    </div>
                    <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '0 0 10px' }}>
                      Skills where most students are below 50% mastery. Consider revisiting these in upcoming lessons.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedClass.gaps.map((gap, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: radius.md,
                          border: `1px solid ${gap.priority === 'high' ? colors.dangerBorder : colors.warningBorder}`,
                          background: gap.priority === 'high' ? colors.dangerLight : colors.warningLight,
                        }}>
                          {/* Mastery bar */}
                          <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
                            <div style={{
                              fontSize: font.md, fontWeight: '700',
                              color: gap.priority === 'high' ? colors.dangerText : colors.warningText,
                            }}>{gap.classMastery}%</div>
                            <div style={{ fontSize: '9px', color: colors.textHint }}>class avg</div>
                          </div>
                          {/* Skill info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{gap.skill}</span>
                              {gap.priority === 'high' && (
                                <span style={{
                                  fontSize: '9px', fontWeight: '700', borderRadius: radius.sm, padding: '1px 5px',
                                  background: colors.danger, color: '#fff', textTransform: 'uppercase',
                                }}>Priority</span>
                              )}
                            </div>
                            <div style={{ fontSize: font.sm, color: colors.textSecondary }}>
                              <span style={{ color: gap.topicColour, fontWeight: '600' }}>{gap.topic}</span> · {gap.studentsBelow}/{gap.totalStudents} students below 50%
                            </div>
                          </div>
                          {/* Visual bar */}
                          <div style={{ width: 80, flexShrink: 0 }}>
                            <div style={{ height: 6, background: gap.priority === 'high' ? colors.dangerBorder : colors.warningBorder, borderRadius: radius.full, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: radius.full, width: `${gap.classMastery}%`, background: gap.priority === 'high' ? colors.danger : colors.warning }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Student table — mastery based */}
                <div style={{ overflowX: 'auto', borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.sm }}>
                    <thead>
                      <tr>
                        <th style={{ ...thS, textAlign: 'left', paddingLeft: 12 }}>Student</th>
                        <th style={thS}>Mastery</th>
                        <th style={thS}>Change</th>
                        {TOPICS.map(tp => {
                          const hasData = selectedClass.students.some(s => s.topicMastery[tp.id] !== undefined)
                          if (!hasData) return null
                          return <th key={tp.id} style={{ ...thS, color: tp.colour }}>{tp.label}</th>
                        })}
                        <th style={{ ...thS, textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selectedClass.students].sort((a, b) => b.mastery - a.mastery).map((student, i) => {
                        const change = student.mastery - student.prevMastery
                        const status = getStatus(student)
                        const sl = statusLabel(status)
                        return (
                          <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                            <td style={{ ...tdS, textAlign: 'left', paddingLeft: 12, fontWeight: '600', color: colors.primary, whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: `${colors.primary}40` }}>
                              {student.name}
                            </td>
                            <td style={{ ...tdS, fontWeight: '700', color: bCol(student.mastery) }}>{student.mastery}%</td>
                            <td style={{ ...tdS }}>
                              {change !== 0 && (
                                <span style={{ fontWeight: '600', color: change > 0 ? colors.success : colors.danger }}>
                                  {change > 0 ? '↑' : '↓'}{Math.abs(change)}%
                                </span>
                              )}
                              {change === 0 && <span style={{ color: colors.textHint }}>—</span>}
                            </td>
                            {TOPICS.map(tp => {
                              const m = student.topicMastery[tp.id]
                              if (m === undefined) {
                                const hasCol = selectedClass.students.some(s => s.topicMastery[tp.id] !== undefined)
                                if (!hasCol) return null
                                return <td key={tp.id} style={{ ...tdS, color: colors.textHint }}>—</td>
                              }
                              return (
                                <td key={tp.id} style={{ ...tdS, fontWeight: '600', color: bCol(m) }}>
                                  {m}%
                                </td>
                              )
                            })}
                            <td style={{ ...tdS, textAlign: 'left' }}>
                              <span style={{
                                fontSize: font.sm, fontWeight: '600', borderRadius: radius.sm, padding: '2px 8px',
                                background: sl.bg, color: sl.colour,
                              }}>{sl.text}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Status legend */}
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  {(['strong', 'improving', 'developing', 'concern'] as StudentStatus[]).map(status => {
                    const sl = statusLabel(status)
                    return (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: font.sm }}>
                        <span style={{
                          fontWeight: '600', borderRadius: radius.sm, padding: '1px 6px',
                          background: sl.bg, color: sl.colour, fontSize: font.sm,
                        }}>{sl.text}</span>
                        <span style={{ color: colors.textHint }}>{sl.desc}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Recent Assessments ── */}
            <div style={cardStyle}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={sectionTitle}>Recent Assessments</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ASSESSMENTS.map(a => {
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
                    .filter(s => getStatus(s) === 'concern')
                    .map(s => ({ ...s, className: `${cls.yearGroup} ${cls.name}` }))
                ).map((student, i) => {
                  const change = student.mastery - student.prevMastery
                  // Find weakest topic
                  const topicScores = TOPICS.map(tp => {
                    const m = student.topicMastery[tp.id]
                    return m !== undefined ? { label: tp.label, pct: m } : null
                  }).filter(Boolean) as { label: string; pct: number }[]
                  const weakest = [...topicScores].sort((a, b) => a.pct - b.pct)[0]

                  return (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: radius.md,
                      border: `1px solid ${colors.dangerBorder}`, background: colors.dangerLight,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: font.base, fontWeight: '700', color: colors.textPrimary }}>{student.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                            background: bBg(student.mastery), color: bTxt(student.mastery),
                          }}>{student.mastery}%</span>
                          {change !== 0 && (
                            <span style={{ fontSize: font.sm, fontWeight: '600', color: change > 0 ? colors.success : colors.danger }}>
                              {change > 0 ? '↑' : '↓'}{Math.abs(change)}%
                            </span>
                          )}
                        </div>
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

        {/* Student profile modal */}
        {selectedStudent && (
          <StudentProfileModal student={selectedStudent} anchor={anchor} onClose={() => setSelectedStudent(null)} />
        )}
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
