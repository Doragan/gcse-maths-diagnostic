'use client'

import { useState, useCallback, useRef } from 'react'
import {
  colors, radius, font,
  card as cardStyle, primaryButton, secondaryButton, inputStyle, errorBox,
  pageTitle, sectionTitle,
} from '@/lib/styles'

// ─── Topics ─────────────────────────────────────────────────────────────────
const TOPICS = [
  { id: 'number',  label: 'Number',                colour: '#7c3aed' },
  { id: 'algebra', label: 'Algebra',               colour: colors.primary },
  { id: 'ratio',   label: 'Ratio & Proportion',    colour: '#0891b2' },
  { id: 'stats',   label: 'Statistics',             colour: colors.success },
] as const

type TopicId = typeof TOPICS[number]['id']
const topicMap = Object.fromEntries(TOPICS.map(t => [t.id, t])) as Record<TopicId, typeof TOPICS[number]>

// ─── Assessment Data (AQA 8300/3F Nov 2024) ─────────────────────────────────
interface Question {
  id: string
  label: string
  marks: number
  topic: TopicId
  skill: string
  desc: string
  visual: boolean
}

const QS: Question[] = [
  { id: '1a', label: '1(a)', marks: 1, topic: 'number',  skill: 'Fractions',          desc: 'Quarter of 780',             visual: false },
  { id: '1b', label: '1(b)', marks: 1, topic: 'number',  skill: 'Powers & Roots',     desc: '19 squared',                 visual: false },
  { id: '2',  label: '2',    marks: 1, topic: 'algebra', skill: 'Simplifying',         desc: 'Simplify y+y+y',            visual: false },
  { id: '3a', label: '3(a)', marks: 2, topic: 'ratio',   skill: 'Proportion',          desc: 'Cost of 12 apples',         visual: false },
  { id: '3b', label: '3(b)', marks: 2, topic: 'ratio',   skill: 'Proportion',          desc: 'Cost of subset of drinks',  visual: false },
  { id: '4a', label: '4(a)', marks: 2, topic: 'number',  skill: 'Ordering Numbers',    desc: 'Order integers & decimals', visual: false },
  { id: '4b', label: '4(b)', marks: 2, topic: 'number',  skill: 'Ordering Fractions',  desc: 'Order fractions',           visual: false },
  { id: '5a', label: '5(a)', marks: 1, topic: 'stats',   skill: 'Reading Charts',      desc: 'Read composite bar chart',  visual: true },
  { id: '5b', label: '5(b)', marks: 1, topic: 'stats',   skill: 'Interpreting Charts', desc: 'Interpret bar chart',       visual: true },
  { id: '5c', label: '5(c)', marks: 2, topic: 'stats',   skill: 'Drawing Charts',      desc: 'Complete bar chart',        visual: true },
  { id: '6',  label: '6',    marks: 1, topic: 'ratio',   skill: 'Time Calculations',   desc: 'Arrival time reasoning',    visual: false },
  { id: '7',  label: '7',    marks: 2, topic: 'number',  skill: 'Division in Context',  desc: 'Greatest number of items', visual: false },
  { id: '8a', label: '8(a)', marks: 1, topic: 'algebra', skill: 'Function Machines',   desc: 'Forward through machine',   visual: false },
  { id: '8b', label: '8(b)', marks: 1, topic: 'algebra', skill: 'Function Machines',   desc: 'Inverse of machine',        visual: false },
  { id: '9',  label: '9',    marks: 3, topic: 'ratio',   skill: 'Unit Conversion',     desc: 'Total length in cm',        visual: false },
  { id: '10a',label: '10(a)',marks: 1, topic: 'algebra', skill: 'Solving Equations',   desc: 'One-step equation',         visual: false },
  { id: '10b',label: '10(b)',marks: 3, topic: 'algebra', skill: 'Solving Equations',   desc: 'Multi-step with brackets',  visual: false },
  { id: '11a',label: '11(a)',marks: 1, topic: 'algebra', skill: 'Number Patterns',     desc: 'Complete number diagram',   visual: true },
  { id: '11b',label: '11(b)',marks: 2, topic: 'algebra', skill: 'Inverse Operations',  desc: 'Complete diagram inverse',  visual: true },
  { id: '11c',label: '11(c)',marks: 3, topic: 'algebra', skill: 'Algebraic Reasoning', desc: 'Find value using algebra',  visual: true },
  { id: '12', label: '12',   marks: 2, topic: 'stats',   skill: 'Averages',            desc: 'Find the median',           visual: false },
]

// ─── B-Set (non-visual retry questions) ─────────────────────────────────────
interface BSetQuestion {
  skill: string
  question: string
}

const B_SET: Record<string, BSetQuestion> = {
  '1a': { skill: 'Fractions',         question: 'Work out 1/3 of 912' },
  '1b': { skill: 'Powers & Roots',    question: 'Work out the value of 23²' },
  '2':  { skill: 'Simplifying',        question: 'Simplify  p + p + p + p + p' },
  '3a': { skill: 'Proportion',         question: '5 oranges cost £1.80. Work out the cost of 15 oranges.' },
  '3b': { skill: 'Proportion',         question: 'The cost of 30 pens and 10 rulers is £16.00. Work out the cost of 3 pens and 1 ruler.' },
  '4a': { skill: 'Ordering Numbers',   question: 'Write in order, smallest first:  3,  −2,  0.5,  −1' },
  '4b': { skill: 'Ordering Fractions', question: 'Write in order, smallest first:  3/5,  1/4,  7/8,  1/2' },
  '6':  { skill: 'Time Calculations',  question: 'Amina leaves home at 8.25 am. She travels for 25 minutes. Does she arrive by 8.45 am? Explain.' },
  '7':  { skill: 'Division in Context', question: 'Priya has £25. A notebook costs £1.60. What is the greatest number she can buy?' },
  '8a': { skill: 'Function Machines',  question: 'Input → ×3 → +5 → Output. Work out the output when the input is 8.' },
  '8b': { skill: 'Function Machines',  question: 'Input → ×3 → +5 → Output. Work out the input when the output is 20.' },
  '9':  { skill: 'Unit Conversion',    question: 'A shelf holds 8 books each 25 mm thick and 2 bookends each 18 mm thick. Total length in cm?' },
  '10a':{ skill: 'Solving Equations',   question: 'Solve  c ÷ 5 = 12' },
  '10b':{ skill: 'Solving Equations',   question: 'Solve  3(4e − 2) = 42' },
  '12': { skill: 'Averages',           question: 'Find the median of: 15, 3, 9, 7, 11, 4, 7, 20, 6' },
}

// ─── Challenge Questions (Higher-tier extensions, per topic) ────────────────
interface ChallengeQuestion { topic: TopicId; skill: string; question: string }

const CHALLENGE_QS: ChallengeQuestion[] = [
  { topic: 'number',  skill: 'Reverse Percentages',   question: 'A laptop costs £612 after a 15% discount. What was the original price?' },
  { topic: 'number',  skill: 'Standard Form',          question: 'Write 0.00047 in standard form.' },
  { topic: 'number',  skill: 'Surds',                  question: 'Simplify √72 + √18. Give your answer in the form a√b.' },
  { topic: 'algebra', skill: 'Simultaneous Equations',  question: '3x + 2y = 16 and 5x − 2y = 24. Find the values of x and y.' },
  { topic: 'algebra', skill: 'Quadratic Factorising',   question: 'Factorise x² + 5x − 14.' },
  { topic: 'algebra', skill: 'Sequences (nth term)',     question: 'Find the nth term of the sequence 7, 11, 15, 19, ...' },
  { topic: 'ratio',   skill: 'Compound Measures',       question: 'A car travels 156 miles in 2 hours 24 minutes. Work out the average speed in mph.' },
  { topic: 'ratio',   skill: 'Direct Proportion',       question: 'y is directly proportional to x. When x = 5, y = 35. Find y when x = 9.' },
  { topic: 'stats',   skill: 'Probability',             question: 'A bag contains 4 red, 3 blue and 5 green counters. Two counters are drawn without replacement. Work out the probability that both are red.' },
  { topic: 'stats',   skill: 'Cumulative Frequency',    question: 'The median of a set of 60 values is estimated from a cumulative frequency graph. Which value on the vertical axis should you read across from?' },
]

function getChallengeQs(sm: StudentMarks, max = 2): ChallengeQuestion[] {
  // Find topics where the student scored ≥ 75%
  const tb = topicBreak(sm)
  const strongTopics = TOPICS
    .filter(tp => {
      const d = tb[tp.id]
      return d.avail > 0 && (d.scored / d.avail * 100) >= 75
    })
    .map(tp => tp.id)

  if (strongTopics.length === 0) return []

  // Pick challenge questions from strong topics, one per topic max
  const result: ChallengeQuestion[] = []
  const usedTopics = new Set<TopicId>()

  for (const cq of CHALLENGE_QS) {
    if (result.length >= max) break
    if (strongTopics.includes(cq.topic) && !usedTopics.has(cq.topic)) {
      result.push(cq)
      usedTopics.add(cq.topic)
    }
  }

  // If still room, allow second from same topic
  if (result.length < max) {
    for (const cq of CHALLENGE_QS) {
      if (result.length >= max) break
      if (strongTopics.includes(cq.topic) && !result.includes(cq)) {
        result.push(cq)
      }
    }
  }

  return result
}
const DEMO_STUDENTS = [
  'Amira Patel', 'Ben Okonkwo', 'Charlotte Evans', 'Daniel Kim',
  'Emily Zhang', 'Finn McCarthy', 'Grace Adeyemi', 'Harry Wilson',
]

// Realistic spread: Amira strong, Ben/Charlotte developing, Daniel/Emily mixed, Finn/Grace weak, Harry very strong
const DEMO_MARKS: Record<string, Record<string, number>> = {
  'Amira Patel':     { '1a':1,'1b':1,'2':1,'3a':2,'3b':2,'4a':2,'4b':2,'5a':1,'5b':1,'5c':2,'6':1,'7':2,'8a':1,'8b':1,'9':3,'10a':1,'10b':3,'11a':1,'11b':2,'11c':3,'12':2 },
  'Ben Okonkwo':     { '1a':1,'1b':1,'2':1,'3a':2,'3b':1,'4a':2,'4b':1,'5a':1,'5b':0,'5c':1,'6':1,'7':2,'8a':1,'8b':0,'9':2,'10a':1,'10b':1,'11a':1,'11b':1,'11c':0,'12':2 },
  'Charlotte Evans': { '1a':1,'1b':1,'2':0,'3a':1,'3b':2,'4a':2,'4b':1,'5a':1,'5b':1,'5c':1,'6':1,'7':2,'8a':1,'8b':1,'9':1,'10a':1,'10b':2,'11a':0,'11b':1,'11c':1,'12':1 },
  'Daniel Kim':      { '1a':1,'1b':0,'2':1,'3a':2,'3b':0,'4a':1,'4b':0,'5a':1,'5b':1,'5c':2,'6':0,'7':1,'8a':1,'8b':1,'9':2,'10a':1,'10b':2,'11a':1,'11b':0,'11c':0,'12':2 },
  'Emily Zhang':     { '1a':1,'1b':1,'2':1,'3a':0,'3b':0,'4a':2,'4b':2,'5a':0,'5b':0,'5c':0,'6':1,'7':2,'8a':1,'8b':1,'9':3,'10a':1,'10b':3,'11a':1,'11b':2,'11c':2,'12':0 },
  'Finn McCarthy':   { '1a':0,'1b':1,'2':0,'3a':1,'3b':0,'4a':1,'4b':0,'5a':1,'5b':0,'5c':0,'6':0,'7':1,'8a':1,'8b':0,'9':1,'10a':1,'10b':0,'11a':0,'11b':0,'11c':0,'12':1 },
  'Grace Adeyemi':   { '1a':1,'1b':0,'2':1,'3a':0,'3b':0,'4a':1,'4b':1,'5a':0,'5b':1,'5c':0,'6':1,'7':0,'8a':0,'8b':0,'9':0,'10a':0,'10b':1,'11a':0,'11b':0,'11c':0,'12':1 },
  'Harry Wilson':    { '1a':1,'1b':1,'2':1,'3a':2,'3b':2,'4a':2,'4b':2,'5a':1,'5b':1,'5c':2,'6':1,'7':2,'8a':1,'8b':1,'9':3,'10a':1,'10b':3,'11a':1,'11b':2,'11c':2,'12':2 },
}

const TITLE = 'AQA GCSE Mathematics 8300/3F'
const SUBTITLE = 'Foundation Tier Paper 3 Calculator — November 2024'
const SUB_TOTAL = QS.reduce((s, q) => s + q.marks, 0)

// ─── Helpers ────────────────────────────────────────────────────────────────
type StudentMarks = Record<string, number | ''>

function bandColour(scored: number, avail: number): string {
  if (!avail) return colors.textHint
  const p = scored / avail * 100
  return p >= 75 ? colors.success : p >= 40 ? colors.warning : colors.danger
}

function bandBg(scored: number, avail: number): string {
  if (!avail) return 'transparent'
  const p = scored / avail * 100
  return p >= 75 ? colors.successLight : p >= 40 ? colors.warningLight : colors.dangerLight
}

function bandBorder(scored: number, avail: number): string {
  if (!avail) return colors.border
  const p = scored / avail * 100
  return p >= 75 ? colors.successBorder : p >= 40 ? colors.warningBorder : colors.dangerBorder
}

interface TopicBreakdown { scored: number; avail: number }

function topicBreak(sm: StudentMarks): Record<TopicId, TopicBreakdown> {
  const t: Record<string, TopicBreakdown> = {}
  TOPICS.forEach(tp => { t[tp.id] = { scored: 0, avail: 0 } })
  QS.forEach(q => {
    const v = sm[q.id]
    t[q.topic].scored += (v === '' ? 0 : (v ?? 0))
    t[q.topic].avail += q.marks
  })
  return t as Record<TopicId, TopicBreakdown>
}

function makeWWWEBI(sm: StudentMarks) {
  const tb = topicBreak(sm)
  const arr = TOPICS.map(tp => ({ ...tp, ...tb[tp.id], pct: tb[tp.id].avail ? tb[tp.id].scored / tb[tp.id].avail * 100 : 0 }))
  const strong = [...arr].sort((a, b) => b.pct - a.pct)
  const weak = [...arr].sort((a, b) => a.pct - b.pct)

  const www: string[] = []
  const ebi: string[] = []

  strong.forEach(t => {
    if (www.length < 3 && t.pct >= 70) {
      www.push(t.pct === 100
        ? `Full marks on ${t.label} — all questions answered correctly.`
        : `Strong performance on ${t.label} (${t.scored}/${t.avail}).`)
    }
  })
  strong.forEach(t => {
    if (www.length < 3 && t.pct >= 40 && t.pct < 70)
      www.push(`Some understanding of ${t.label} (${t.scored}/${t.avail}).`)
  })
  if (!www.length) www.push('Attempted all questions on the paper.')

  weak.forEach(t => {
    if (ebi.length < 3 && t.pct < 70) {
      if (t.pct === 0) ebi.push(`Practise ${t.label} — no marks scored.`)
      else if (t.pct < 40) ebi.push(`Revise ${t.label} — only ${t.scored}/${t.avail} marks.`)
      else ebi.push(`Consolidate ${t.label} to move from ${t.scored}/${t.avail} to full marks.`)
    }
  })
  if (!ebi.length) ebi.push('Keep practising to maintain this standard.')

  return { www, ebi }
}

function classFailCounts(students: string[], marks: Record<string, StudentMarks>): Record<string, number> {
  const c: Record<string, number> = {}
  QS.forEach(q => { c[q.id] = 0 })
  students.forEach(n => QS.forEach(q => {
    const v = marks[n]?.[q.id]
    if ((Number(v) || 0) < q.marks) c[q.id]++
  }))
  return c
}

interface RetryQuestion { skill: string; question: string; topic: string; origLabel: string }

function retryQs(sm: StudentMarks, cfc: Record<string, number>, max = 4): RetryQuestion[] {
  const failed = QS.filter(q => !q.visual && B_SET[q.id] && (Number(sm[q.id]) || 0) < q.marks)
  failed.sort((a, b) => (cfc[b.id] || 0) - (cfc[a.id] || 0) || b.marks - a.marks)
  return failed.slice(0, max).map(q => ({
    ...B_SET[q.id],
    topic: topicMap[q.topic]?.label ?? '',
    origLabel: q.label,
  }))
}

// ─── CSV ────────────────────────────────────────────────────────────────────
function csvTemplate(): string {
  return ['Student Name', ...QS.map(q => `${q.label} (/${q.marks})`)].join(',') + '\n'
}

function parseCSV(text: string): { students: string[]; marks: Record<string, StudentMarks> } | null {
  const lines = text.trim().split('\n').map(l => l.split(',').map(c => c.trim()))
  if (lines.length < 2) return null
  const students: string[] = []
  const marks: Record<string, StudentMarks> = {}
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    const name = row[0]
    if (!name) continue
    students.push(name)
    marks[name] = {}
    QS.forEach((q, qi) => {
      const raw = row[qi + 1]
      if (raw === undefined || raw === '') marks[name][q.id] = ''
      else { const n = parseInt(raw, 10); marks[name][q.id] = isNaN(n) ? '' : Math.min(Math.max(0, n), q.marks) }
    })
  }
  return students.length ? { students, marks } : null
}

// ─── Topic header colours ───────────────────────────────────────────────────
const topicBg: Record<TopicId, string> = { number: '#f5f3ff', algebra: '#eff6ff', ratio: '#ecfeff', stats: colors.successLight }
const topicBorder: Record<TopicId, string> = { number: '#ddd6fe', algebra: '#bfdbfe', ratio: '#a5f3fc', stats: colors.successBorder }

// ─── Modal ──────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: colors.card, borderRadius: radius.lg, maxWidth: 740, width: '100%',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        border: `1px solid ${colors.border}`, boxShadow: '0 20px 60px rgba(0,0,0,.15)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', borderBottom: `1px solid ${colors.border}`,
        }}>
          <h3 style={{ ...sectionTitle }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: font.xl, cursor: 'pointer', color: colors.textSecondary, padding: 4,
          }}>✕</button>
        </div>
        <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Print View ─────────────────────────────────────────────────────────────
function PrintView({ students, marks, onClose }: {
  students: string[]; marks: Record<string, StudentMarks>; onClose: () => void
}) {
  const cfc = classFailCounts(students, marks)
  return (
    <Modal title="Print Preview — Ctrl+P / Cmd+P to print" onClose={onClose}>
      <p style={{ fontSize: font.sm, color: colors.textSecondary, marginBottom: 14 }}>
        Use your browser's print function while this modal is open.
      </p>
      <div style={{ fontFamily: 'inherit', fontSize: font.sm, color: colors.textPrimary, lineHeight: 1.5 }}>
        <div style={{ fontSize: font.xl, fontWeight: '700', marginBottom: 1 }}>{TITLE}</div>
        <div style={{ fontSize: font.sm, color: colors.textSecondary, marginBottom: 16 }}>{SUBTITLE} — Student Feedback</div>
        {students.map(name => {
          const sm: StudentMarks = {}
          QS.forEach(q => { sm[q.id] = marks[name][q.id] === '' ? 0 : marks[name][q.id] ?? 0 })
          const tot = QS.reduce((s, q) => s + (typeof sm[q.id] === 'number' ? sm[q.id] as number : 0), 0)
          const pct = Math.round(tot / SUB_TOTAL * 100)
          const tb = topicBreak(sm)
          const { www, ebi } = makeWWWEBI(sm)
          const retries = retryQs(sm, cfc)
          const challenges = getChallengeQs(sm)
          return (
            <div key={name} style={{
              border: `1.5px solid ${colors.textPrimary}`, borderRadius: radius.md,
              padding: '12px 14px', marginBottom: 14, pageBreakInside: 'avoid',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderBottom: `1px solid ${colors.border}`, paddingBottom: 6, marginBottom: 10,
              }}>
                <span style={{ fontSize: font.md, fontWeight: '700' }}>{name}</span>
                <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textSecondary }}>{tot}/{SUB_TOTAL} ({pct}%)</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {TOPICS.map(tp => {
                  const d = tb[tp.id]; const p = d.avail ? Math.round(d.scored / d.avail * 100) : 0
                  return (
                    <div key={tp.id} style={{ flex: '1 1 100px', fontSize: font.sm }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: '600' }}>{tp.label}</span><span>{d.scored}/{d.avail}</span>
                      </div>
                      <div style={{ height: 5, background: colors.cardAlt, borderRadius: radius.sm }}>
                        <div style={{ height: 5, borderRadius: radius.sm, width: `${p}%`, background: tp.colour }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, background: colors.successLight, borderRadius: radius.sm, padding: '7px 9px' }}>
                  <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.successText, textTransform: 'uppercase', marginBottom: 4 }}>✓ What Went Well</div>
                  <ul style={{ paddingLeft: 16, margin: 0 }}>{www.map((w, i) => <li key={i} style={{ fontSize: font.sm, marginBottom: 2 }}>{w}</li>)}</ul>
                </div>
                <div style={{ flex: 1, background: colors.warningLight, borderRadius: radius.sm, padding: '7px 9px' }}>
                  <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.warningText, textTransform: 'uppercase', marginBottom: 4 }}>△ Even Better If</div>
                  <ul style={{ paddingLeft: 16, margin: 0 }}>{ebi.map((e, i) => <li key={i} style={{ fontSize: font.sm, marginBottom: 2 }}>{e}</li>)}</ul>
                </div>
              </div>
              {retries.length > 0 ? (
                <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
                  <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', marginBottom: 4 }}>↻ Try Again — show your working</div>
                  <ol style={{ paddingLeft: 16, margin: 0 }}>{retries.map((r, i) => <li key={i} style={{ fontSize: font.sm, marginBottom: 3 }}><strong>{r.topic}:</strong> {r.question}</li>)}</ol>
                  <div style={{ height: 50, border: `1px dashed ${colors.borderStrong}`, borderRadius: radius.sm, marginTop: 8 }} />
                </div>
              ) : challenges.length > 0 ? (
                <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
                  <div style={{ fontSize: font.sm, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', marginBottom: 4 }}>⭐ Challenge Questions</div>
                  <ol style={{ paddingLeft: 16, margin: 0 }}>{challenges.map((c, i) => <li key={i} style={{ fontSize: font.sm, marginBottom: 3 }}><strong>{topicMap[c.topic].label}:</strong> {c.question}</li>)}</ol>
                  <div style={{ height: 50, border: `1px dashed ${colors.borderStrong}`, borderRadius: radius.sm, marginTop: 8 }} />
                </div>
              ) : (
                <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
                  <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.successText, textTransform: 'uppercase', marginBottom: 4 }}>⭐ Excellent Work</div>
                  <p style={{ fontSize: font.sm, margin: 0 }}>{name} performed very well with no significant areas of concern.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

// ─── Starter Sheet (class-wide retry) ───────────────────────────────────────
function StarterSheet({ students, marks, onClose }: {
  students: string[]; marks: Record<string, StudentMarks>; onClose: () => void
}) {
  const cfc = classFailCounts(students, marks)

  // Get the most commonly failed non-visual questions with B-set entries
  const topFailed = QS
    .filter(q => !q.visual && B_SET[q.id])
    .map(q => ({
      ...q,
      bset: B_SET[q.id],
      failCount: cfc[q.id] || 0,
      failPct: students.length ? Math.round((cfc[q.id] || 0) / students.length * 100) : 0,
    }))
    .filter(q => q.failCount > 0)
    .sort((a, b) => b.failPct - a.failPct || b.marks - a.marks)
    .slice(0, 5)

  return (
    <Modal title="Class Starter Sheet — print for your next lesson" onClose={onClose}>
      <p style={{ fontSize: font.sm, color: colors.textSecondary, marginBottom: 14 }}>
        Use your browser's print function (Ctrl+P / Cmd+P) while this is open. These are the questions most students in the class need to revisit, with new values.
      </p>
      <div style={{ fontFamily: 'inherit', fontSize: font.sm, color: colors.textPrimary, lineHeight: 1.5 }}>
        <div style={{ fontSize: font.xl, fontWeight: '700', marginBottom: 1 }}>{TITLE}</div>
        <div style={{ fontSize: font.sm, color: colors.textSecondary, marginBottom: 4 }}>{SUBTITLE}</div>
        <div style={{ fontSize: font.md, fontWeight: '700', color: colors.primary, marginBottom: 16 }}>
          Class Starter — Topics to Revisit
        </div>

        {topFailed.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary }}>
            No commonly failed questions found — the class performed well across the board.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16, padding: '10px 12px', background: colors.cardAlt, borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
              <p style={{ fontSize: font.sm, fontWeight: '600', margin: '0 0 2px' }}>Name: _______________________________</p>
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>
                Answer the following questions. Show all your working.
              </p>
            </div>

            {topFailed.map((q, i) => (
              <div key={q.id} style={{
                border: `1px solid ${colors.border}`, borderRadius: radius.md,
                padding: '14px 16px', marginBottom: 14, pageBreakInside: 'avoid',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: radius.full, background: colors.primary, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: font.base, fontWeight: '700', flexShrink: 0,
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: font.sm, fontWeight: '700', color: topicMap[q.topic].colour, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {topicMap[q.topic].label} — {q.bset.skill}
                      </div>
                      <div style={{ fontSize: font.md, color: colors.textPrimary, lineHeight: 1.6, marginTop: 2 }}>
                        {q.bset.question}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: font.sm, color: colors.dangerText, fontWeight: '600', flexShrink: 0,
                    background: colors.dangerLight, padding: '2px 8px', borderRadius: radius.sm,
                  }}>{q.failPct}% need this</span>
                </div>
                {/* Answer space */}
                <div style={{
                  height: 70, border: `1px dashed ${colors.borderStrong}`, borderRadius: radius.sm,
                  marginTop: 4, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 6,
                }}>
                  <span style={{ fontSize: font.sm, color: colors.textHint }}>/{q.marks}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function DemoMarkingPage() {
  const [step, setStep] = useState(0)
  const [studentInput, setStudentInput] = useState('')
  const [students, setStudents] = useState<string[]>([])
  const [marks, setMarks] = useState<Record<string, StudentMarks>>({})
  const [fb, setFb] = useState<Record<string, { www: string[]; ebi: string[]; retries: RetryQuestion[]; challenges: ChallengeQuestion[] }>>({})
  const [active, setActive] = useState<string | null>(null)
  const [importErr, setImportErr] = useState('')
  const [copied, setCopied] = useState('')
  const [showCSV, setShowCSV] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [showStarter, setShowStarter] = useState(false)
  const [viewMode, setViewMode] = useState<'overview' | 'individual'>('overview')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Load demo data ──
  const loadDemo = () => {
    setStudents(DEMO_STUDENTS)
    const m: Record<string, StudentMarks> = {}
    DEMO_STUDENTS.forEach(name => {
      m[name] = {}
      QS.forEach(q => { m[name][q.id] = DEMO_MARKS[name]?.[q.id] ?? '' })
    })
    setMarks(m)
    setStudentInput(DEMO_STUDENTS.join('\n'))
    setStep(1)
  }

  // ── Step 1 ──
  const goStep2 = () => {
    const names = studentInput.split('\n').map(n => n.trim()).filter(Boolean)
    if (!names.length) return
    const u = [...new Set(names)]
    setStudents(u)
    const m: Record<string, StudentMarks> = {}
    u.forEach(n => { m[n] = {}; QS.forEach(q => { m[n][q.id] = '' }) })
    setMarks(m)
    setStep(1)
  }

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImportErr('')
    const reader = new FileReader()
    reader.onload = ev => {
      const r = parseCSV(ev.target?.result as string)
      if (!r) { setImportErr('Could not parse CSV. Check it matches the template.'); return }
      setStudents(r.students); setMarks(r.marks); setStudentInput(r.students.join('\n')); setStep(1)
    }
    reader.readAsText(file); e.target.value = ''
  }

  const copyCSV = () => {
    try { navigator.clipboard.writeText(csvTemplate()); setCopied('csv'); setTimeout(() => setCopied(''), 1500) } catch {}
  }

  // ── Step 2 ──
  const setMark = (student: string, qId: string, val: string) => {
    const q = QS.find(x => x.id === qId)!
    let n: number | '' = val === '' ? '' : parseInt(val, 10)
    if (n !== '' && (isNaN(n) || n < 0)) return
    if (n !== '' && n > q.marks) n = q.marks
    setMarks(p => ({ ...p, [student]: { ...p[student], [qId]: n } }))
  }

  const total = useCallback((name: string) =>
    QS.reduce((s, q) => { const v = marks[name]?.[q.id]; return s + (v === '' || v === undefined ? 0 : v as number) }, 0),
    [marks])

  // ── Step 3 ──
  const generate = () => {
    const cfc = classFailCounts(students, marks)
    const f: typeof fb = {}
    students.forEach(name => {
      const sm: StudentMarks = {}
      QS.forEach(q => { sm[q.id] = marks[name][q.id] === '' ? 0 : marks[name][q.id] })
      f[name] = { ...makeWWWEBI(sm), retries: retryQs(sm, cfc), challenges: getChallengeQs(sm) }
    })
    setFb(f); setActive(students[0]); setViewMode('overview'); setStep(2)
  }

  const updWWW = (n: string, i: number, v: string) => setFb(p => {
    const c = { ...p, [n]: { ...p[n], www: [...p[n].www] } }; c[n].www[i] = v; return c
  })
  const updEBI = (n: string, i: number, v: string) => setFb(p => {
    const c = { ...p, [n]: { ...p[n], ebi: [...p[n].ebi] } }; c[n].ebi[i] = v; return c
  })

  const flash = (k: string) => { setCopied(k); setTimeout(() => setCopied(''), 1500) }

  const copyOne = (name: string) => {
    const d = fb[name]; const t = total(name); const pct = Math.round(t / SUB_TOTAL * 100)
    let txt = `${name} — ${t}/${SUB_TOTAL} (${pct}%)\n\nWWW:\n${d.www.map(w => `• ${w}`).join('\n')}\n\nEBI:\n${d.ebi.map(e => `• ${e}`).join('\n')}`
    if (d.retries.length) txt += `\n\nTry Again:\n${d.retries.map((r, i) => `${i + 1}. [${r.topic}] ${r.question}`).join('\n')}`
    if (d.challenges?.length) txt += `\n\nChallenge:\n${d.challenges.map((c, i) => `${i + 1}. [${topicMap[c.topic].label}] ${c.question}`).join('\n')}`
    try { navigator.clipboard.writeText(txt) } catch {} flash(name)
  }

  const copyAll = () => {
    const all = students.map(name => {
      const d = fb[name]; const t = total(name); const pct = Math.round(t / SUB_TOTAL * 100)
      let txt = `${name} — ${t}/${SUB_TOTAL} (${pct}%)\nWWW:\n${d.www.map(w => `• ${w}`).join('\n')}\nEBI:\n${d.ebi.map(e => `• ${e}`).join('\n')}`
      if (d.retries.length) txt += `\nTry Again:\n${d.retries.map((r, i) => `${i + 1}. [${r.topic}] ${r.question}`).join('\n')}`
      if (d.challenges?.length) txt += `\nChallenge:\n${d.challenges.map((c, i) => `${i + 1}. [${topicMap[c.topic].label}] ${c.question}`).join('\n')}`
      return txt
    }).join('\n\n———\n\n')
    try { navigator.clipboard.writeText(all) } catch {} flash('all')
  }

  const aTb = active ? (() => {
    const sm: StudentMarks = {}
    QS.forEach(q => { sm[q.id] = marks[active]?.[q.id] === '' ? 0 : marks[active]?.[q.id] ?? 0 })
    return topicBreak(sm)
  })() : null

  // ═══════ RENDER ═══════
  return (
    <div style={{ minHeight: '100dvh', background: colors.background }}>
      {/* Header */}
      <header style={{
        background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{
            width: 36, height: 36, borderRadius: radius.md, background: colors.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: font.xl, letterSpacing: -1, textDecoration: 'none', flexShrink: 0,
          }}>M</a>
          <div>
            <h1 style={{ fontSize: font.xl, fontWeight: '700', margin: 0, color: colors.textPrimary }}>
              Assessment Marking Tool
            </h1>
            <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0 }}>{SUBTITLE}</p>
          </div>
        </div>
        <a href="/" style={{
          fontSize: font.base, color: colors.primary, textDecoration: 'none', fontWeight: '600',
        }}>← Back to Mathsense</a>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 64px' }}>
        {/* Stepper */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          {['Students', 'Enter Marks', 'Feedback'].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: radius.full, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: font.sm, flexShrink: 0,
                ...(i === step ? { background: colors.primary, color: '#fff' } :
                    i < step ? { background: colors.success, color: '#fff' } :
                    { background: colors.border, color: colors.textHint }),
              }}>{i < step ? '✓' : i + 1}</div>
              <span style={{
                fontSize: font.sm, fontWeight: i === step ? '700' : '500',
                color: i === step ? colors.textPrimary : colors.textHint, marginRight: 4,
              }}>{l}</span>
              {i < 2 && <div style={{ width: 40, height: 2, background: colors.border, margin: '0 4px', flexShrink: 0 }} />}
            </div>
          ))}
        </nav>

        {/* ──── STEP 1 ──── */}
        {step === 0 && (
          <div style={cardStyle}>
            <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Add Students</h2>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 16px', lineHeight: 1.5 }}>
              Enter student names (one per line), or import a CSV with marks pre-filled.
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <button style={{ ...secondaryButton, width: 'auto' }} onClick={() => setShowCSV(true)}>📋 CSV Template</button>
              <button style={{ ...secondaryButton, width: 'auto' }} onClick={() => fileRef.current?.click()}>⬆ Import CSV</button>
              <button style={{ ...primaryButton, width: 'auto' }} onClick={loadDemo}>▶ Load Demo Data</button>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
            </div>
            {importErr && <div style={errorBox}>{importErr}</div>}
            <textarea
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 200 }}
              placeholder={'Alice Johnson\nBen Smith\nCharlotte Brown\nDaniel Lee\nEmma Wilson'}
              value={studentInput} onChange={e => setStudentInput(e.target.value)}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 16, paddingTop: 14, borderTop: `1px solid ${colors.border}`,
            }}>
              <span style={{ fontSize: font.sm, color: colors.textHint }}>
                {studentInput.split('\n').filter(n => n.trim()).length} student(s)
              </span>
              <button style={{ ...primaryButton, width: 'auto' }} onClick={goStep2}>Continue to Marks →</button>
            </div>
            {showCSV && (
              <Modal title="CSV Template" onClose={() => setShowCSV(false)}>
                <p style={{ fontSize: font.base, color: colors.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>
                  Copy the template below, paste into a spreadsheet, add student names and marks, save as CSV and import.
                </p>
                <textarea readOnly
                  style={{ ...inputStyle, fontSize: font.sm, fontFamily: 'monospace', height: 80, resize: 'none' }}
                  value={csvTemplate()} onClick={e => (e.target as HTMLTextAreaElement).select()}
                />
                <div style={{ marginTop: 12 }}>
                  <button style={{ ...primaryButton, width: 'auto' }} onClick={copyCSV}>
                    {copied === 'csv' ? '✓ Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* ──── STEP 2 ──── */}
        {step === 1 && (
          <div style={cardStyle}>
            <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Enter Marks</h2>
            <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 12px', lineHeight: 1.5 }}>
              Hover column headers for skill info. Columns coloured by topic.
            </p>
            <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
              {TOPICS.map(tp => (
                <div key={tp.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: font.sm }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: tp.colour }} />
                  <span style={{ fontWeight: '600', color: colors.textSecondary }}>{tp.label}</span>
                </div>
              ))}
            </div>
            <div style={{ overflowX: 'auto', borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.sm }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, position: 'sticky', left: 0, zIndex: 2, minWidth: 130, background: colors.cardAlt }}>Student</th>
                    {QS.map(q => (
                      <th key={q.id} style={{ ...thStyle, background: topicBg[q.topic], borderBottomColor: topicBorder[q.topic] }}
                          title={`${q.desc} [${q.skill}] — ${topicMap[q.topic].label}`}>
                        <div style={{ fontWeight: '700', fontSize: font.sm, color: topicMap[q.topic].colour }}>{q.label}</div>
                        <div style={{ fontSize: '9px', color: colors.textHint, fontWeight: '500' }}>/{q.marks}</div>
                      </th>
                    ))}
                    <th style={thStyle}>
                      <div style={{ fontWeight: '700', fontSize: font.sm, color: colors.textPrimary }}>Total</div>
                      <div style={{ fontSize: '9px', color: colors.textHint, fontWeight: '500' }}>/{SUB_TOTAL}</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(name => {
                    const t = total(name)
                    return (
                      <tr key={name}>
                        <td style={{
                          ...tdStyle, position: 'sticky', left: 0, zIndex: 1, background: colors.card,
                          textAlign: 'left', fontWeight: '600', paddingLeft: 10, whiteSpace: 'nowrap', color: colors.textPrimary,
                        }}>{name}</td>
                        {QS.map(q => {
                          const v = marks[name][q.id]; const filled = v !== '' && v !== undefined
                          return (
                            <td key={q.id} style={{ ...tdStyle, background: filled ? bandBg(v as number, q.marks) : 'transparent' }}>
                              <input type="number" min={0} max={q.marks}
                                style={{
                                  width: 34, height: 28, textAlign: 'center',
                                  border: `1.5px solid ${filled ? bandColour(v as number, q.marks) : colors.borderStrong}`,
                                  borderRadius: radius.sm, fontSize: font.base, fontWeight: '600',
                                  fontFamily: 'inherit', outline: 'none', background: 'transparent',
                                }}
                                value={v as any} onChange={e => setMark(name, q.id, e.target.value)}
                              />
                            </td>
                          )
                        })}
                        <td style={{ ...tdStyle, fontWeight: '700', fontSize: font.md }}>
                          <span style={{ color: bandColour(t, SUB_TOTAL) }}>{t}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 16, paddingTop: 14, borderTop: `1px solid ${colors.border}`,
            }}>
              <button style={{ ...secondaryButton, width: 'auto' }} onClick={() => setStep(0)}>← Back</button>
              <button style={{ ...primaryButton, width: 'auto' }} onClick={generate}>Generate Feedback →</button>
            </div>
          </div>
        )}

        {/* ──── STEP 3 ──── */}
        {step === 2 && (() => {
          // ── Class-level stats ──
          const classTotals = students.map(n => total(n))
          const classAvg = classTotals.length ? Math.round(classTotals.reduce((a, b) => a + b, 0) / classTotals.length) : 0
          const classAvgPct = Math.round(classAvg / SUB_TOTAL * 100)
          const classTopicBreakdown = TOPICS.map(tp => {
            let scored = 0, avail = 0
            students.forEach(name => {
              QS.filter(q => q.topic === tp.id).forEach(q => {
                const v = marks[name]?.[q.id]
                scored += (v === '' || v === undefined ? 0 : v as number)
                avail += q.marks
              })
            })
            return { ...tp, scored, avail, pct: avail ? Math.round(scored / avail * 100) : 0 }
          })
          const cfc = classFailCounts(students, marks)
          const mostFailed = QS.filter(q => !q.visual && B_SET[q.id])
            .map(q => ({ ...q, failCount: cfc[q.id] || 0, failPct: students.length ? Math.round((cfc[q.id] || 0) / students.length * 100) : 0 }))
            .filter(q => q.failPct > 30)
            .sort((a, b) => b.failPct - a.failPct)
            .slice(0, 6)

          return (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, gridTemplateRows: '1fr auto' }}>
            {/* Sidebar */}
            <aside style={{ ...cardStyle, alignSelf: 'start', position: 'sticky', top: 12, maxHeight: '85vh', overflowY: 'auto' }}>
              {/* View toggle */}
              <button onClick={() => setViewMode('overview')} style={{
                display: 'block', width: '100%', textAlign: 'left', border: viewMode === 'overview' ? `1px solid ${colors.primary}` : '1px solid transparent',
                background: viewMode === 'overview' ? '#eff6ff' : 'transparent',
                borderRadius: radius.md, padding: '8px 9px', fontSize: font.sm,
                fontWeight: viewMode === 'overview' ? '700' : '600', cursor: 'pointer', fontFamily: 'inherit',
                color: viewMode === 'overview' ? colors.primary : colors.textPrimary, marginBottom: 8,
              }}>📊 Class Overview</button>

              <div style={{ fontSize: font.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.textHint, marginBottom: 8 }}>
                Students
              </div>
              {students.map(name => {
                const t = total(name); const pct = Math.round(t / SUB_TOTAL * 100)
                const isActive = viewMode === 'individual' && active === name
                return (
                  <button key={name} onClick={() => { setActive(name); setViewMode('individual') }} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
                    border: isActive ? `1px solid ${colors.primary}` : '1px solid transparent',
                    background: isActive ? '#eff6ff' : 'transparent',
                    borderRadius: radius.md, padding: '8px 9px', fontSize: font.sm,
                    fontWeight: isActive ? '700' : '500', cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left', marginBottom: 3, color: isActive ? colors.primary : colors.textPrimary,
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span style={{
                      fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '2px 6px', flexShrink: 0, marginLeft: 4,
                      background: bandBg(t, SUB_TOTAL), color: bandColour(t, SUB_TOTAL),
                    }}>{pct}%</span>
                  </button>
                )
              })}
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button style={{ ...secondaryButton }} onClick={copyAll}>{copied === 'all' ? '✓ Copied!' : 'Copy All'}</button>
                <button style={{ ...secondaryButton }} onClick={() => setShowPrint(true)}>⎙ Print Preview</button>
                <button style={{ ...secondaryButton }} onClick={() => setShowStarter(true)}>📝 Starter Sheet</button>
              </div>
            </aside>

            {/* Main content */}
            <main style={cardStyle}>

              {/* ── CLASS OVERVIEW ── */}
              {viewMode === 'overview' && (
                <>
                  <h2 style={{ ...pageTitle, fontSize: font['2xl'], marginBottom: 4 }}>Class Overview</h2>
                  <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 20px' }}>
                    {students.length} students · Average: {classAvg}/{SUB_TOTAL} ({classAvgPct}%)
                  </p>

                  {/* Topic breakdown across whole class */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Performance by Topic</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                      {classTopicBreakdown.map(tp => (
                        <div key={tp.id} style={{ ...cardStyle, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: font.md, fontWeight: '700', color: tp.colour }}>{tp.label}</span>
                            <span style={{
                              fontSize: font.sm, fontWeight: '700', borderRadius: radius.sm, padding: '2px 8px',
                              background: tp.pct >= 70 ? colors.successLight : tp.pct >= 40 ? colors.warningLight : colors.dangerLight,
                              color: tp.pct >= 70 ? colors.successText : tp.pct >= 40 ? colors.warningText : colors.dangerText,
                            }}>{tp.pct}%</span>
                          </div>
                          <div style={{ height: 8, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ height: '100%', borderRadius: radius.full, width: `${tp.pct}%`, background: tp.colour, transition: 'width .3s' }} />
                          </div>
                          <div style={{ fontSize: font.sm, color: colors.textHint }}>
                            {tp.scored}/{tp.avail} marks across all students
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions most students got wrong */}
                  {mostFailed.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ ...sectionTitle, marginBottom: 4 }}>Questions to Revisit</h3>
                      <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 12px' }}>
                        Questions where more than 30% of the class dropped marks.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {mostFailed.map(q => (
                          <div key={q.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                            background: colors.dangerLight, borderRadius: radius.md, border: `1px solid ${colors.dangerBorder}`,
                          }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: radius.md, background: colors.danger, color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: font.sm, fontWeight: '700', flexShrink: 0,
                            }}>{q.failPct}%</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: font.md, fontWeight: '600', color: colors.textPrimary }}>
                                Q{q.label} — {q.skill}
                              </div>
                              <div style={{ fontSize: font.sm, color: colors.textSecondary }}>{q.desc} · {topicMap[q.topic].label}</div>
                            </div>
                            <div style={{ fontSize: font.sm, color: colors.dangerText, fontWeight: '600', flexShrink: 0 }}>
                              {q.failCount}/{students.length} students
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question-by-question breakdown */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ ...sectionTitle, marginBottom: 4 }}>Question-by-Question Breakdown</h3>
                    <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 12px' }}>
                      Class success rate per question. Hover for skill details.
                    </p>
                    <div style={{ overflowX: 'auto', borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.sm }}>
                        <thead>
                          <tr>
                            <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 10 }}>Question</th>
                            <th style={thStyle}>Topic</th>
                            <th style={thStyle}>Skill</th>
                            <th style={thStyle}>Marks</th>
                            <th style={thStyle}>Class Avg</th>
                            <th style={{ ...thStyle, minWidth: 140 }}>Success Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {QS.map(q => {
                            const totalScored = students.reduce((s, n) => {
                              const v = marks[n]?.[q.id]
                              return s + (v === '' || v === undefined ? 0 : v as number)
                            }, 0)
                            const avgMark = students.length ? totalScored / students.length : 0
                            const avgPct = q.marks ? Math.round(avgMark / q.marks * 100) : 0
                            const tp = topicMap[q.topic]
                            return (
                              <tr key={q.id} title={q.desc}>
                                <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: 10, fontWeight: '600' }}>{q.label}</td>
                                <td style={{ ...tdStyle }}>
                                  <span style={{ fontSize: font.sm, fontWeight: '600', color: tp.colour }}>{tp.label}</span>
                                </td>
                                <td style={{ ...tdStyle, color: colors.textSecondary }}>{q.skill}</td>
                                <td style={{ ...tdStyle, fontWeight: '600' }}>/{q.marks}</td>
                                <td style={{ ...tdStyle, fontWeight: '600', color: bandColour(Math.round(avgMark), q.marks) }}>
                                  {avgMark.toFixed(1)}
                                </td>
                                <td style={{ ...tdStyle, padding: '4px 10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ flex: 1, height: 6, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                                      <div style={{
                                        height: '100%', borderRadius: radius.full, width: `${avgPct}%`,
                                        background: avgPct >= 75 ? colors.success : avgPct >= 40 ? colors.warning : colors.danger,
                                      }} />
                                    </div>
                                    <span style={{
                                      fontSize: font.sm, fontWeight: '700', minWidth: 32, textAlign: 'right',
                                      color: avgPct >= 75 ? colors.successText : avgPct >= 40 ? colors.warningText : colors.dangerText,
                                    }}>{avgPct}%</span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Student ranking table */}
                  <div>
                    <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Student Results</h3>
                    <div style={{ overflowX: 'auto', borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: font.sm }}>
                        <thead>
                          <tr>
                            <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 12 }}>Student</th>
                            {TOPICS.map(tp => (
                              <th key={tp.id} style={{ ...thStyle, color: tp.colour }}>{tp.label}</th>
                            ))}
                            <th style={thStyle}>Total</th>
                            <th style={thStyle}>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...students].sort((a, b) => total(b) - total(a)).map((name, rank) => {
                            const t = total(name); const pct = Math.round(t / SUB_TOTAL * 100)
                            const sm: StudentMarks = {}
                            QS.forEach(q => { sm[q.id] = marks[name]?.[q.id] === '' ? 0 : marks[name]?.[q.id] ?? 0 })
                            const tb = topicBreak(sm)
                            return (
                              <tr key={name} style={{ cursor: 'pointer' }}
                                  onClick={() => { setActive(name); setViewMode('individual') }}>
                                <td style={{
                                  ...tdStyle, textAlign: 'left', paddingLeft: 12, fontWeight: '600',
                                  color: colors.textPrimary, whiteSpace: 'nowrap',
                                }}>{name}</td>
                                {TOPICS.map(tp => {
                                  const d = tb[tp.id]; const p = d.avail ? Math.round(d.scored / d.avail * 100) : 0
                                  return (
                                    <td key={tp.id} style={{ ...tdStyle, fontWeight: '600', color: bandColour(d.scored, d.avail) }}>
                                      {d.scored}/{d.avail}
                                    </td>
                                  )
                                })}
                                <td style={{ ...tdStyle, fontWeight: '700' }}>{t}/{SUB_TOTAL}</td>
                                <td style={{
                                  ...tdStyle, fontWeight: '700', color: bandColour(t, SUB_TOTAL),
                                }}>{pct}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ── INDIVIDUAL STUDENT ── */}
              {viewMode === 'individual' && active && fb[active] && (() => {
                const d = fb[active]; const t = total(active); const pct = Math.round(t / SUB_TOTAL * 100)
                return (<>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <h2 style={{ ...pageTitle, fontSize: font['2xl'] }}>{active}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: font.base, fontWeight: '700', borderRadius: radius.md, padding: '4px 12px',
                        background: bandBg(t, SUB_TOTAL), color: bandColour(t, SUB_TOTAL),
                        border: `1px solid ${bandBorder(t, SUB_TOTAL)}`,
                      }}>{t}/{SUB_TOTAL} ({pct}%)</span>
                      <button style={{ ...secondaryButton, width: 'auto', padding: '6px 14px', fontSize: font.sm }} onClick={() => copyOne(active)}>
                        {copied === active ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Topic bars */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 20 }}>
                    {TOPICS.map(tp => {
                      const d2 = aTb![tp.id]; const p2 = d2.avail ? Math.round(d2.scored / d2.avail * 100) : 0
                      return (
                        <div key={tp.id} style={{ ...cardStyle, padding: '10px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: font.base, fontWeight: '700', color: tp.colour }}>{tp.label}</span>
                            <span style={{ fontSize: font.base, fontWeight: '600', color: colors.textSecondary }}>{d2.scored}/{d2.avail}</span>
                          </div>
                          <div style={{ height: 7, background: colors.cardAlt, borderRadius: radius.full, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: radius.full, width: `${p2}%`, background: tp.colour, transition: 'width .3s' }} />
                          </div>
                          <div style={{ fontSize: font.sm, fontWeight: '600', color: colors.textHint, textAlign: 'right', marginTop: 3 }}>{p2}%</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* WWW / EBI */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                    <div style={{ background: colors.successLight, borderRadius: radius.md, padding: '12px 14px', border: `1px solid ${colors.successBorder}` }}>
                      <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.successText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span>✓</span> What Went Well
                      </div>
                      {d.www.map((w, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: radius.full, background: colors.success, flexShrink: 0, marginTop: 6 }} />
                          <input style={{
                            flex: 1, border: 'none', borderBottom: '1px solid transparent', background: 'transparent',
                            fontSize: font.base, fontFamily: 'inherit', outline: 'none', padding: '2px 0', lineHeight: 1.5,
                          }} value={w} onChange={e => updWWW(active, i, e.target.value)} />
                        </div>
                      ))}
                    </div>
                    <div style={{ background: colors.warningLight, borderRadius: radius.md, padding: '12px 14px', border: `1px solid ${colors.warningBorder}` }}>
                      <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.warningText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span>△</span> Even Better If
                      </div>
                      {d.ebi.map((e, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: radius.full, background: colors.warning, flexShrink: 0, marginTop: 6 }} />
                          <input style={{
                            flex: 1, border: 'none', borderBottom: '1px solid transparent', background: 'transparent',
                            fontSize: font.base, fontFamily: 'inherit', outline: 'none', padding: '2px 0', lineHeight: 1.5,
                          }} value={e} onChange={e2 => updEBI(active, i, e2.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Retry or Challenge */}
                  {d.retries.length > 0 ? (
                    <div style={{ background: '#eff6ff', borderRadius: radius.md, padding: '12px 14px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span>↻</span> Try Again
                      </div>
                      <p style={{ fontSize: font.sm, color: colors.textSecondary, marginBottom: 10, fontStyle: 'italic' }}>
                        These questions test topics you need to practise. Show your working!
                      </p>
                      {d.retries.map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: radius.full, background: colors.primary, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: font.sm, fontWeight: '700', flexShrink: 0,
                          }}>{i + 1}</div>
                          <div>
                            <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.topic}</div>
                            <div style={{ fontSize: font.base, color: colors.textPrimary, lineHeight: 1.5 }}>{r.question}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (d.challenges?.length ?? 0) > 0 ? (
                    <div style={{ background: '#faf5ff', borderRadius: radius.md, padding: '12px 14px', border: '1px solid #e9d5ff' }}>
                      <div style={{ fontSize: font.sm, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span>⭐</span> Challenge Questions
                      </div>
                      <p style={{ fontSize: font.sm, color: colors.textSecondary, marginBottom: 10, fontStyle: 'italic' }}>
                        Great work on this paper! Push yourself further with these harder questions.
                      </p>
                      {(d.challenges ?? []).map((c, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: radius.full, background: '#7c3aed', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: font.sm, fontWeight: '700', flexShrink: 0,
                          }}>{i + 1}</div>
                          <div>
                            <div style={{ fontSize: font.sm, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5 }}>{topicMap[c.topic].label} — {c.skill}</div>
                            <div style={{ fontSize: font.base, color: colors.textPrimary, lineHeight: 1.5 }}>{c.question}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: colors.successLight, borderRadius: radius.md, padding: '14px 16px', border: `1px solid ${colors.successBorder}` }}>
                      <div style={{ fontSize: font.sm, fontWeight: '700', color: colors.successText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span>⭐</span> Excellent Work
                      </div>
                      <p style={{ fontSize: font.base, color: colors.textPrimary, lineHeight: 1.6, margin: 0 }}>
                        {active} performed very well on this paper with no significant areas of concern.
                      </p>
                    </div>
                  )}
                </>)
              })()}
            </main>

            <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
              <button style={{ ...secondaryButton, width: 'auto' }} onClick={() => setStep(1)}>← Back to Marks</button>
            </div>
            {showPrint && <PrintView students={students} marks={marks} onClose={() => setShowPrint(false)} />}
            {showStarter && <StarterSheet students={students} marks={marks} onClose={() => setShowStarter(false)} />}
          </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─── Shared table cell styles ───────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '7px 4px', textAlign: 'center', background: colors.cardAlt,
  borderBottom: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`,
  fontWeight: '600', fontSize: font.sm, whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '3px 3px', textAlign: 'center',
  borderBottom: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`,
}
