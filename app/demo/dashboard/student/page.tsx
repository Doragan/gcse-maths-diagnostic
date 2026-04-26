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
  { id: 'number',    label: 'Number',                colour: '#7c3aed' },
  { id: 'algebra',   label: 'Algebra',               colour: colors.primary },
  { id: 'shape',     label: 'Shape and Space',        colour: '#ea580c' },
  { id: 'ratio',     label: 'Ratio and Proportion',   colour: '#0891b2' },
  { id: 'probdata',  label: 'Probability and Data',   colour: colors.success },
] as const

type TopicId = typeof TOPICS[number]['id']

type AssessmentType = 'exam' | 'topic-test' | 'homework'

const TYPE_LABELS: Record<AssessmentType, { label: string; colour: string; bg: string }> = {
  'exam':       { label: 'Exam',       colour: '#7c3aed', bg: '#f5f3ff' },
  'topic-test': { label: 'Topic Test', colour: '#0891b2', bg: '#ecfeff' },
  'homework':   { label: 'Homework',   colour: '#ea580c', bg: '#fff7ed' },
}

interface Assessment {
  id: string
  type: AssessmentType
  title: string
  date: string
  score: number
  total: number
  topics: Partial<Record<TopicId, { scored: number; avail: number }>>
  www: string[]
  ebi: string[]
}

interface ActionItem {
  type: 'retry' | 'challenge'
  topic: string
  skill: string
  question: string
  fromAssessment: string
  practiceUrl: string
}

interface HomeworkItem {
  title: string
  topic: string
  topicColour: string
  dueDate: string
  status: 'due' | 'overdue' | 'completed'
  score?: number
  total?: number
  url: string
}

// ─── Skill-level data per topic (using question IDs for practice links) ───────
interface SkillData {
  skill: string
  scored: number
  avail: number
  questionId: string // maps to /practice/[id]
}

const TOPIC_SKILLS: Record<TopicId, SkillData[]> = {
  number: [
    { skill: 'Fractions of Amounts', scored: 1, avail: 1, questionId: '463e9833-bc0a-40d9-bc40-941de561a0cc' },
    { skill: 'Indices', scored: 1, avail: 1, questionId: '5636b618-8d6a-4e5b-9e3c-1c3f7d8a9b0e' },
    { skill: 'Decimals', scored: 2, avail: 2, questionId: '62ee516f-ad70-4fac-90b4-e25f02aa335e' },
    { skill: 'Simplifying Fractions', scored: 1, avail: 2, questionId: '463e9833-bc0a-40d9-bc40-941de561a0cc' },
    { skill: 'Estimating', scored: 2, avail: 2, questionId: 'f4a765cc-7c61-4e40-aaeb-b5854db77b00' },
    { skill: 'Percentage Change', scored: 0, avail: 3, questionId: '3a2a4da5-2798-45a2-9386-7449f4f7139a' },
  ],
  algebra: [
    { skill: 'Simplifying Expressions', scored: 1, avail: 1, questionId: '810b6017-5bb0-46c9-80bf-99f739c6252a' },
    { skill: 'Substitution', scored: 1, avail: 2, questionId: 'd29cb0d6-fc9e-41df-ba40-3807b8a310d2' },
    { skill: 'Solving Linear Equations', scored: 2, avail: 4, questionId: '66a8b913-93d4-491c-8710-fe6466fdeab1' },
    { skill: 'Expanding Brackets', scored: 1, avail: 2, questionId: 'e535a144-0b5b-4ae2-b80c-3701eae9f595' },
    { skill: 'Sequences', scored: 1, avail: 1, questionId: '321580e4-cb6d-4f9e-a3c6-d558ae8ba553' },
    { skill: 'Finding the nth Term', scored: 0, avail: 2, questionId: '26e0949b-c952-4e9e-9134-db6a6cb6a99e' },
    { skill: 'Factorising', scored: 0, avail: 3, questionId: '7ac8474b-3108-436a-a995-2668482ff8b8' },
    { skill: 'Inequalities', scored: 0, avail: 1, questionId: '8ed8991a-47c6-42ff-9f8e-0de815015f8a' },
  ],
  shape: [
    { skill: 'Angles on Lines and Circles', scored: 1, avail: 1, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
    { skill: 'Angles in Polygons', scored: 4, avail: 8, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
    { skill: 'Areas of Squares and Rectangles', scored: 2, avail: 2, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
    { skill: 'Symmetry and Transformations', scored: 1, avail: 3, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
    { skill: 'Congruence and Similarity', scored: 0, avail: 2, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
  ],
  ratio: [
    { skill: 'Proportion', scored: 3, avail: 4, questionId: 'a653ffa7-038e-434e-90a5-d692e9fa8675' },
    { skill: 'Ratio', scored: 2, avail: 3, questionId: '2471f835-e678-4793-9f29-bcd3d94724a8' },
    { skill: 'Converting Measurements', scored: 2, avail: 3, questionId: 'a4bd3d9f-2d44-4ce6-8d93-7c03231ff86f' },
    { skill: 'Compound Units', scored: 0, avail: 2, questionId: '1785da89-1ef2-4b5d-99b8-3a688b566a3e' },
  ],
  probdata: [
    { skill: 'Simple Charts', scored: 1, avail: 1, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
    { skill: 'Pie Charts', scored: 0, avail: 1, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
    { skill: 'Mean', scored: 1, avail: 1, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
    { skill: 'Median', scored: 1, avail: 1, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
    { skill: 'Calculating Simple Probability', scored: 1, avail: 2, questionId: '441e242a-e795-4aad-bf96-05a1a275c2cf' },
  ],
}

// ─── Mock Data ──────────────────────────────────────────────────────────────
const STUDENT = { name: 'Ben', fullName: 'Ben Okonkwo', yearGroup: 'Year 10', teacher: 'Mr Thompson' }

const ASSESSMENTS: Assessment[] = [
  {
    id: 'paper3-nov24', type: 'exam',
    title: 'Paper 3 Calculator (Nov 2024)', date: '20 Mar 2026',
    score: 24, total: 35,
    topics: {
      number:   { scored: 5, avail: 6 },
      algebra:  { scored: 6, avail: 16 },
      ratio:    { scored: 7, avail: 8 },
      probdata: { scored: 4, avail: 5 },
    },
    www: ['Strong performance on Number (5/6).', 'Strong on Ratio and Proportion (7/8).', 'Good attempt at Probability and Data (4/5).'],
    ebi: ['Revise Algebra — only 6/16 marks.', 'Practise solving multi-step equations.', 'Consolidate substitution and expanding brackets.'],
  },
  {
    id: 'hw-fractions-mar26', type: 'homework',
    title: 'Fractions and Decimals Homework', date: '14 Mar 2026',
    score: 7, total: 10,
    topics: { number: { scored: 7, avail: 10 } },
    www: ['Correctly converted between fractions and decimals.', 'Good work on fractions of amounts.'],
    ebi: ['Practise simplifying fractions with different denominators.'],
  },
  {
    id: 'algebra-topic-mar26', type: 'topic-test',
    title: 'Algebra End of Topic Test', date: '7 Mar 2026',
    score: 9, total: 20,
    topics: { algebra: { scored: 9, avail: 20 } },
    www: ['Correctly expanded single brackets.', 'Good understanding of substitution.'],
    ebi: ['Practise solving equations with brackets.', 'Revise factorising expressions.', 'Work on forming equations from word problems.'],
  },
  {
    id: 'paper1-nov24', type: 'exam',
    title: 'Paper 1 Non-Calculator (Nov 2024)', date: '6 Feb 2026',
    score: 31, total: 80,
    topics: {
      number:   { scored: 10, avail: 18 },
      algebra:  { scored: 7, avail: 22 },
      ratio:    { scored: 6, avail: 14 },
      shape:    { scored: 4, avail: 16 },
      probdata: { scored: 4, avail: 10 },
    },
    www: ['Some understanding of Number (10/18).', 'Showed working clearly on most questions.', 'Good attempt at ratio questions.'],
    ebi: ['Revise Algebra — only 7/22 marks.', 'Practise Shape and Space topics.', 'Consolidate Probability and Data (4/10).'],
  },
  {
    id: 'hw-angles-jan26', type: 'homework',
    title: 'Angles in Polygons Homework', date: '23 Jan 2026',
    score: 4, total: 8,
    topics: { shape: { scored: 4, avail: 8 } },
    www: ['Correctly identified interior angles of a triangle.'],
    ebi: ['Revise exterior angles.', 'Practise angles in regular polygons.'],
  },
  {
    id: 'paper2-jun24', type: 'exam',
    title: 'Paper 2 Calculator (Jun 2024)', date: '12 Dec 2025',
    score: 25, total: 80,
    topics: {
      number:   { scored: 7, avail: 20 },
      algebra:  { scored: 5, avail: 20 },
      ratio:    { scored: 5, avail: 16 },
      shape:    { scored: 4, avail: 14 },
      probdata: { scored: 4, avail: 10 },
    },
    www: ['Attempted all questions on the paper.', 'Some understanding of Number (7/20).'],
    ebi: ['Revise Algebra — only 5/20 marks.', 'Practise Ratio and Proportion.', 'Revise Shape and Space (4/14).'],
  },
]

const ACTIONS: ActionItem[] = [
  { type: 'retry', topic: 'Algebra', skill: 'Substitution', question: 'Input → ×3 → +5 → Output. Work out the input when the output is 20.', fromAssessment: 'Paper 3 Calculator', practiceUrl: '/practice/question/d29cb0d6-fc9e-41df-ba40-3807b8a310d2' },
  { type: 'retry', topic: 'Algebra', skill: 'Solving Linear Equations', question: 'Solve  3(4e − 2) = 42', fromAssessment: 'Paper 3 Calculator', practiceUrl: '/practice/question/66a8b913-93d4-491c-8710-fe6466fdeab1' },
  { type: 'retry', topic: 'Algebra', skill: 'Simplifying Expressions', question: 'Simplify  p + p + p + p + p', fromAssessment: 'Paper 3 Calculator', practiceUrl: '/practice/question/810b6017-5bb0-46c9-80bf-99f739c6252a' },
  { type: 'retry', topic: 'Ratio and Proportion', skill: 'Proportion', question: 'The cost of 30 pens and 10 rulers is £16.00. Work out the cost of 3 pens and 1 ruler.', fromAssessment: 'Paper 3 Calculator', practiceUrl: '/practice/question/a653ffa7-038e-434e-90a5-d692e9fa8675' },
]

const HOMEWORK: HomeworkItem[] = [
  { title: 'Sequences Homework', topic: 'Algebra', topicColour: colors.primary, dueDate: '2 May 2026', status: 'due', url: '/practice/question/321580e4-cb6d-4f9e-a3c6-d558ae8ba553' },
  { title: 'Ratio and Proportion Homework', topic: 'Ratio and Proportion', topicColour: '#0891b2', dueDate: '9 May 2026', status: 'due', url: '/practice/question/a653ffa7-038e-434e-90a5-d692e9fa8675' },
  { title: 'Fractions and Decimals Homework', topic: 'Number', topicColour: '#7c3aed', dueDate: '14 Mar 2026', status: 'completed', score: 7, total: 10, url: '/practice/question/463e9833-bc0a-40d9-bc40-941de561a0cc' },
  { title: 'Angles in Polygons Homework', topic: 'Shape and Space', topicColour: '#ea580c', dueDate: '23 Jan 2026', status: 'completed', score: 4, total: 8, url: '/practice/question/441e242a-e795-4aad-bf96-05a1a275c2cf' },
]

const RECENT_ACTIVITY = [
  { date: 'Today', desc: 'Practised 8 Algebra questions', detail: 'Solving Equations — scored 5/8' },
  { date: 'Yesterday', desc: 'Completed Fractions homework', detail: '7/10 marks' },
  { date: '2 days ago', desc: 'Practised 12 Number questions', detail: 'Ordering & Comparing — scored 10/12' },
  { date: 'Last week', desc: 'Completed Algebra topic test', detail: '9/20 marks (45%)' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────
function pc(s: number, a: number) { return a > 0 ? Math.round(s / a * 100) : 0 }
function bCol(p: number) { return p >= 75 ? colors.success : p >= 40 ? colors.warning : colors.danger }
function bBg(p: number) { return p >= 75 ? colors.successLight : p >= 40 ? colors.warningLight : colors.dangerLight }
function bTxt(p: number) { return p >= 75 ? colors.successText : p >= 40 ? colors.warningText : colors.dangerText }
function bBrd(p: number) { return p >= 75 ? colors.successBorder : p >= 40 ? colors.warningBorder : colors.dangerBorder }

// Get latest % for a topic across all assessments
function latestTopicPct(topicId: TopicId): number | null {
  for (const a of ASSESSMENTS) {
    const d = a.topics[topicId]
    if (d && d.avail > 0) return pc(d.scored, d.avail)
  }
  return null
}

// Get history of a topic (oldest first)
function topicHistory(topicId: TopicId): { date: string; pct: number }[] {
  return ASSESSMENTS
    .filter(a => { const d = a.topics[topicId]; return d && d.avail > 0 })
    .map(a => { const d = a.topics[topicId]!; return { date: a.date, pct: pc(d.scored, d.avail) } })
    .reverse()
}

function topicTrend(topicId: TopicId): 'up' | 'down' | 'same' | 'new' {
  const hist = topicHistory(topicId)
  if (hist.length < 2) return 'new'
  const latest = hist[hist.length - 1].pct
  const prev = hist[hist.length - 2].pct
  if (latest > prev + 5) return 'up'
  if (latest < prev - 5) return 'down'
  return 'same'
}

function trendIcon(t: 'up' | 'down' | 'same' | 'new') { return t === 'up' ? '↑' : t === 'down' ? '↓' : t === 'same' ? '→' : '•' }
function trendCol(t: 'up' | 'down' | 'same' | 'new') { return t === 'up' ? colors.success : t === 'down' ? colors.danger : colors.textHint }

// ═══════════════════════════════════════════════════════════════════════════
export default function StudentDashboard() {
  const [selectedAssessment, setSelectedAssessment] = useState(ASSESSMENTS[0])
  const [expandedAction, setExpandedAction] = useState<number | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<TopicId | null>(null)
  const [assessmentFilter, setAssessmentFilter] = useState<'all' | AssessmentType>('all')

  const latestExam = ASSESSMENTS.find(a => a.type === 'exam')!
  const latestPct = pc(latestExam.score, latestExam.total)
  const prevExam = ASSESSMENTS.filter(a => a.type === 'exam')[1]
  const prevPct = prevExam ? pc(prevExam.score, prevExam.total) : null
  const improving = prevPct !== null && latestPct > prevPct

  const topicScores = TOPICS.map(tp => ({ ...tp, pct: latestTopicPct(tp.id) })).filter(t => t.pct !== null) as (typeof TOPICS[number] & { pct: number })[]
  const strongestTopic = [...topicScores].sort((a, b) => b.pct - a.pct)[0]
  const weakestTopic = [...topicScores].sort((a, b) => a.pct - b.pct)[0]

  const filteredAssessments = assessmentFilter === 'all'
    ? ASSESSMENTS
    : ASSESSMENTS.filter(a => a.type === assessmentFilter)

  const pendingHomework = HOMEWORK.filter(h => h.status === 'due' || h.status === 'overdue')
  const totalTasks = ACTIONS.length + pendingHomework.length

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
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>Student Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: font.base, color: colors.textSecondary }}>{STUDENT.yearGroup} · {STUDENT.teacher}</span>
          <Link href="/" style={{ fontSize: font.base, color: colors.primary, textDecoration: 'none', fontWeight: '600' }}>← Back to Mathsense</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 64px' }}>

        {/* ── Welcome Banner ── */}
        <div style={{
          ...cardStyle, marginBottom: 20, padding: '24px 28px',
          background: `linear-gradient(135deg, ${colors.primary}08, ${colors.primary}03)`,
          borderColor: `${colors.primary}30`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ ...pageTitle, fontSize: font['2xl'], marginBottom: 6 }}>
                Welcome back, {STUDENT.name} 👋
              </h2>
              <p style={{ fontSize: font.md, color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                {improving
                  ? `Your exam score improved from ${prevPct}% to ${latestPct}% — great progress! `
                  : `You scored ${latestPct}% on your latest exam. `}
                {strongestTopic && `You're strongest in ${strongestTopic.label}. `}
                {weakestTopic && weakestTopic.pct < 50 && `Focus your revision on ${weakestTopic.label} to improve.`}
              </p>
              {pendingHomework.length > 0 && (
                <p style={{ fontSize: font.base, color: colors.warningText, margin: '8px 0 0', fontWeight: '600' }}>
                  📝 You have {pendingHomework.length} homework{pendingHomework.length > 1 ? 's' : ''} to complete.
                </p>
              )}
            </div>
            <div style={{
              fontSize: font['2xl'], fontWeight: '700', borderRadius: radius.lg, padding: '8px 20px',
              background: bBg(latestPct), color: bTxt(latestPct), border: `1px solid ${bBrd(latestPct)}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 }}>Latest Exam</div>
              {latestPct}%
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          {/* ── Left Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Topic Progress ── */}
            <div style={cardStyle}>
              <h3 style={{ ...sectionTitle, marginBottom: 14 }}>My Progress by Topic</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TOPICS.map(tp => {
                  const p = latestTopicPct(tp.id)
                  if (p === null) return null
                  const trend = topicTrend(tp.id)
                  const hist = topicHistory(tp.id)
                  const isExpanded = expandedTopic === tp.id
                  const skills = TOPIC_SKILLS[tp.id] ?? []
                  return (
                    <div key={tp.id} style={{
                      borderRadius: radius.md, border: `1px solid ${isExpanded ? tp.colour + '60' : colors.border}`,
                      overflow: 'hidden', transition: 'border-color .15s',
                    }}>
                      {/* Topic header — clickable */}
                      <button onClick={() => setExpandedTopic(isExpanded ? null : tp.id)} style={{
                        padding: '12px 14px', width: '100%', border: 'none', cursor: 'pointer',
                        fontFamily: 'inherit', textAlign: 'left',
                        background: isExpanded ? tp.colour + '08' : colors.card,
                        display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: font.md, fontWeight: '700', color: tp.colour }}>{tp.label}</span>
                            <span style={{ fontSize: font.sm, fontWeight: '700', color: trendCol(trend) }}>{trendIcon(trend)}</span>
                            <span style={{ fontSize: font.sm, color: colors.textHint, marginLeft: 'auto' }}>
                              {isExpanded ? '▾' : '▸'} {skills.length} skills
                            </span>
                          </div>
                          <div style={{ height: 7, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ height: '100%', borderRadius: radius.full, width: `${p}%`, background: tp.colour, transition: 'width .3s' }} />
                          </div>
                          {hist.length > 1 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                              {hist.map((h, i) => (
                                <div key={i} style={{
                                  fontSize: '10px', color: i === hist.length - 1 ? colors.textPrimary : colors.textHint,
                                  fontWeight: i === hist.length - 1 ? '700' : '500',
                                }}>{h.pct}%{i < hist.length - 1 ? ' →' : ''}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{
                          fontSize: font.lg, fontWeight: '700', minWidth: 48, textAlign: 'center',
                          color: bTxt(p), background: bBg(p), borderRadius: radius.md, padding: '4px 8px',
                          border: `1px solid ${bBrd(p)}`,
                        }}>{p}%</div>
                      </button>

                      {/* Expanded skill breakdown */}
                      {isExpanded && (
                        <div style={{ padding: '0 14px 14px', background: tp.colour + '04' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                            {skills.map((sk, si) => {
                              const sp = pc(sk.scored, sk.avail)
                              return (
                                <div key={si} style={{
                                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                                  background: colors.card, borderRadius: radius.sm, border: `1px solid ${colors.border}`,
                                }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                      <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{sk.skill}</span>
                                      <span style={{ fontSize: font.sm, fontWeight: '600', color: colors.textSecondary }}>{sk.scored}/{sk.avail}</span>
                                    </div>
                                    <div style={{ height: 5, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                                      <div style={{ height: '100%', borderRadius: radius.full, width: `${sp}%`, background: sp >= 75 ? colors.success : sp >= 40 ? colors.warning : colors.danger }} />
                                    </div>
                                  </div>
                                  <Link href={`/practice/question/${sk.questionId}`} style={{
                                    fontSize: font.sm, fontWeight: '600', color: colors.primary,
                                    textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                                    padding: '4px 10px', borderRadius: radius.sm, border: `1px solid ${colors.primary}30`,
                                    background: `${colors.primary}08`,
                                  }}>Try a question →</Link>
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

            {/* ── Assessment History ── */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={sectionTitle}>Results</h3>
                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {([['all', 'All'], ['exam', 'Exams'], ['topic-test', 'Topic Tests'], ['homework', 'Homework']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setAssessmentFilter(key)} style={{
                      padding: '4px 10px', borderRadius: radius.sm, fontSize: font.sm, fontWeight: '600',
                      cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                      background: assessmentFilter === key ? colors.primary : colors.cardAlt,
                      color: assessmentFilter === key ? '#fff' : colors.textSecondary,
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredAssessments.map(a => {
                  const p = pc(a.score, a.total)
                  const isSelected = selectedAssessment.id === a.id
                  const tl = TYPE_LABELS[a.type]
                  return (
                    <button key={a.id} onClick={() => setSelectedAssessment(a)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', borderRadius: radius.md, cursor: 'pointer', fontFamily: 'inherit',
                      border: isSelected ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                      background: isSelected ? '#eff6ff' : colors.card, textAlign: 'left', width: '100%',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '700', borderRadius: radius.sm, padding: '2px 6px',
                          background: tl.bg, color: tl.colour, textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>{tl.label}</span>
                        <div>
                          <div style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{a.title}</div>
                          <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{a.date}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textSecondary }}>{a.score}/{a.total}</span>
                        <span style={{
                          fontSize: font.base, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                          background: bBg(p), color: bTxt(p),
                        }}>{p}%</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Selected assessment detail */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', borderRadius: radius.sm, padding: '2px 6px',
                    background: TYPE_LABELS[selectedAssessment.type].bg,
                    color: TYPE_LABELS[selectedAssessment.type].colour,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{TYPE_LABELS[selectedAssessment.type].label}</span>
                  <h4 style={{ fontSize: font.md, fontWeight: '700', margin: 0, color: colors.textPrimary }}>
                    {selectedAssessment.title}
                  </h4>
                </div>

                {/* Topic breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6, marginBottom: 14 }}>
                  {TOPICS.map(tp => {
                    const d = selectedAssessment.topics[tp.id]
                    if (!d || !d.avail) return null
                    const p2 = pc(d.scored, d.avail)
                    return (
                      <div key={tp.id} style={{ padding: '6px 8px', borderRadius: radius.sm, border: `1px solid ${colors.border}`, fontSize: font.sm }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontWeight: '600', color: tp.colour }}>{tp.label}</span>
                          <span style={{ fontWeight: '600' }}>{d.scored}/{d.avail}</span>
                        </div>
                        <div style={{ height: 4, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: radius.full, width: `${p2}%`, background: tp.colour }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* WWW / EBI */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: colors.successLight, borderRadius: radius.md, padding: '10px 12px', border: `1px solid ${colors.successBorder}` }}>
                    <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.successText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      ✓ What Went Well
                    </div>
                    {selectedAssessment.www.map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: radius.full, background: colors.success, flexShrink: 0, marginTop: 5 }} />
                        <span style={{ fontSize: font.base, color: colors.textPrimary, lineHeight: 1.5 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: colors.warningLight, borderRadius: radius.md, padding: '10px 12px', border: `1px solid ${colors.warningBorder}` }}>
                    <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.warningText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                      △ Even Better If
                    </div>
                    {selectedAssessment.ebi.map((e, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: radius.full, background: colors.warning, flexShrink: 0, marginTop: 5 }} />
                        <span style={{ fontSize: font.base, color: colors.textPrimary, lineHeight: 1.5 }}>{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Homework ── */}
            <div style={cardStyle}>
              <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Homework</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {HOMEWORK.map((hw, i) => (
                  <Link key={i} href={hw.url} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: radius.md, textDecoration: 'none',
                    border: `1px solid ${hw.status === 'overdue' ? colors.dangerBorder : colors.border}`,
                    background: hw.status === 'overdue' ? colors.dangerLight : colors.card,
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: hw.topicColour }} />
                        <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{hw.title}</span>
                      </div>
                      <div style={{ fontSize: font.sm, color: colors.textSecondary }}>
                        {hw.status === 'completed' ? `Completed · ${hw.score}/${hw.total}` : `Due: ${hw.dueDate}`}
                      </div>
                    </div>
                    <span style={{
                      fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                      ...(hw.status === 'completed'
                        ? { background: colors.successLight, color: colors.successText }
                        : hw.status === 'overdue'
                        ? { background: colors.dangerLight, color: colors.dangerText }
                        : { background: colors.warningLight, color: colors.warningText }),
                    }}>{hw.status === 'completed' ? '✓ Done' : hw.status === 'overdue' ? 'Overdue' : 'Due'}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Tasks (retry questions + outstanding homework) ── */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={sectionTitle}>Your Tasks</h3>
                <span style={{
                  fontSize: font.sm, fontWeight: '700', borderRadius: radius.full, padding: '2px 10px',
                  background: totalTasks > 0 ? colors.dangerLight : colors.successLight,
                  color: totalTasks > 0 ? colors.dangerText : colors.successText,
                  border: `1px solid ${totalTasks > 0 ? colors.dangerBorder : colors.successBorder}`,
                }}>{totalTasks}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Outstanding homework */}
                {pendingHomework.map((hw, i) => (
                  <Link key={`hw-${i}`} href={hw.url} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: radius.md, textDecoration: 'none',
                    border: `1px solid ${hw.status === 'overdue' ? colors.dangerBorder : colors.warningBorder}`,
                    background: hw.status === 'overdue' ? colors.dangerLight : colors.warningLight,
                  }}>
                    <div>
                      <div style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{hw.title}</div>
                      <div style={{ fontSize: font.sm, color: colors.textSecondary }}>Due: {hw.dueDate}</div>
                    </div>
                    <span style={{
                      fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                      background: hw.status === 'overdue' ? colors.dangerLight : colors.warningLight,
                      color: hw.status === 'overdue' ? colors.dangerText : colors.warningText,
                    }}>📝 {hw.status === 'overdue' ? 'Overdue' : 'Homework'}</span>
                  </Link>
                ))}
                {/* Retry / challenge questions */}
                {ACTIONS.map((action, i) => {
                  const isExpanded = expandedAction === i
                  return (
                    <div key={i} style={{ borderRadius: radius.md, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                      <button onClick={() => setExpandedAction(isExpanded ? null : i)} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
                        padding: '10px 12px', border: 'none', background: isExpanded ? '#eff6ff' : colors.card,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      }}>
                        <div>
                          <div style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{action.skill}</div>
                          <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{action.topic}</div>
                        </div>
                        <span style={{
                          fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                          background: action.type === 'retry' ? '#eff6ff' : '#faf5ff',
                          color: action.type === 'retry' ? colors.primary : '#7c3aed',
                        }}>{action.type === 'retry' ? '↻ Retry' : '⭐ Challenge'}</span>
                      </button>
                      {isExpanded && (
                        <div style={{ padding: '10px 12px', borderTop: `1px solid ${colors.border}`, background: colors.cardAlt }}>
                          <p style={{ fontSize: font.base, color: colors.textPrimary, lineHeight: 1.6, margin: '0 0 8px' }}>{action.question}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: font.sm, color: colors.textHint }}>From: {action.fromAssessment}</span>
                            <Link href={action.practiceUrl} style={{
                              ...primaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm, textDecoration: 'none', display: 'inline-block',
                            }}>Try a question →</Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Recent Activity ── */}
            <div style={cardStyle}>
              <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {RECENT_ACTIVITY.map((act, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, padding: '8px 0',
                    borderBottom: i < RECENT_ACTIVITY.length - 1 ? `1px solid ${colors.border}` : 'none',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: radius.full, background: colors.primary,
                      flexShrink: 0, marginTop: 6, opacity: 1 - i * 0.2,
                    }} />
                    <div>
                      <div style={{ fontSize: font.base, fontWeight: '600', color: colors.textPrimary }}>{act.desc}</div>
                      <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{act.date} · {act.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Quick Stats ── */}
            <div style={cardStyle}>
              <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Quick Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Exams taken', String(ASSESSMENTS.filter(a => a.type === 'exam').length), colors.textPrimary],
                  ['Latest exam', `${latestPct}%`, bCol(latestPct)],
                  ['Topic tests', String(ASSESSMENTS.filter(a => a.type === 'topic-test').length), colors.textPrimary],
                  ['Homework completed', `${HOMEWORK.filter(h => h.status === 'completed').length}/${HOMEWORK.length}`, colors.textPrimary],
                  ['Strongest topic', strongestTopic?.label ?? '—', strongestTopic?.colour ?? colors.textPrimary],
                  ['Tasks remaining', String(totalTasks), totalTasks > 0 ? colors.dangerText : colors.successText],
                ].map(([label, value, colour], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: font.base, color: colors.textSecondary }}>{label}</span>
                    <span style={{ fontSize: font.md, fontWeight: '700', color: colour as string }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
