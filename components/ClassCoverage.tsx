'use client'

import { useEffect, useMemo, useState } from 'react'
import { skills } from '../data/skills'
import { getClassCoverage, setClassCoverage } from '../lib/classes'
import { TOPICS, type Topic } from '../lib/teacherAnalytics'
import { colors, font, radius, card, sectionTitle, secondaryButton } from '../lib/styles'

const TOPIC_COLOUR: Record<Topic, string> = {
  'Number': '#7c3aed',
  'Algebra': colors.primary,
  'Shape and Space': '#ea580c',
  'Ratio and Proportion': '#0891b2',
  'Probability and Data': colors.success,
}

// Skills grouped by topic (computed once — the curriculum is static).
const SKILLS_BY_TOPIC: Record<Topic, { id: string; name: string }[]> = (() => {
  const grouped = {} as Record<Topic, { id: string; name: string }[]>
  for (const t of TOPICS) grouped[t] = []
  for (const s of skills) {
    if ((TOPICS as readonly string[]).includes(s.topic)) {
      grouped[s.topic as Topic].push({ id: s.id, name: s.name })
    }
  }
  for (const t of TOPICS) grouped[t].sort((a, b) => a.name.localeCompare(b.name))
  return grouped
})()
const TOTAL_SKILLS = TOPICS.reduce((n, t) => n + SKILLS_BY_TOPIC[t].length, 0)

/**
 * Teacher-marked curriculum coverage. Lets the teacher tick which skills the
 * class has been taught; the dashboard's mastery % is then measured against that
 * set instead of the whole syllabus. Calls `onChange` once edits are committed
 * so the analytics panel can recompute.
 */
export default function ClassCoverage({ classId, onChange }: { classId: string; onChange: () => void }) {
  const [covered, setCovered] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    getClassCoverage(classId)
      .then(ids => { if (live) { setCovered(new Set(ids)); setLoaded(true) } })
      .catch(() => { if (live) setLoaded(true) })
    return () => { live = false }
  }, [classId])

  // Optimistic local update + persist; roll back on failure.
  async function persist(ids: string[], next: boolean) {
    const before = new Set(covered)
    const after = new Set(covered)
    for (const id of ids) { if (next) after.add(id); else after.delete(id) }
    setCovered(after)
    setDirty(true)
    setError(null)
    try {
      await setClassCoverage(classId, ids, next)
    } catch {
      setCovered(before) // revert
      setError('Couldn’t save — check your connection and try again.')
    }
  }

  function done() {
    setOpen(false)
    if (dirty) { onChange(); setDirty(false) }
  }

  const count = covered.size
  const summary = useMemo(() => TOPICS.map(t => {
    const inTopic = SKILLS_BY_TOPIC[t]
    const n = inTopic.reduce((acc, s) => acc + (covered.has(s.id) ? 1 : 0), 0)
    return { topic: t, n, total: inTopic.length }
  }), [covered])

  if (!loaded) {
    return <div style={card}><h2 style={sectionTitle}>Topics covered</h2><p style={hint}>Loading…</p></div>
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <h2 style={sectionTitle}>Topics covered</h2>
        <span style={{ fontSize: font.sm, color: colors.textHint }}>{count} of {TOTAL_SKILLS} skills marked</span>
      </div>

      {!open ? (
        <>
          <p style={hint}>
            {count === 0
              ? 'Mark the skills your class has been taught, and mastery will be measured against that — so topics you haven’t reached yet don’t count as gaps.'
              : 'Mastery below is measured against the skills you’ve marked as covered.'}
          </p>
          {count > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {summary.filter(s => s.n > 0).map(s => (
                <span key={s.topic} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: radius.sm, background: colors.cardAlt, color: TOPIC_COLOUR[s.topic] }}>
                  {s.topic} {s.n}/{s.total}
                </span>
              ))}
            </div>
          )}
          <button onClick={() => setOpen(true)} style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base, marginTop: 12 }}>
            {count === 0 ? 'Mark coverage' : 'Edit coverage'}
          </button>
        </>
      ) : (
        <>
          {error && <p style={{ ...hint, color: colors.dangerText }}>{error}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {TOPICS.map(t => {
              const inTopic = SKILLS_BY_TOPIC[t]
              const n = summary.find(s => s.topic === t)!.n
              const allOn = n === inTopic.length
              return (
                <div key={t}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: font.md, fontWeight: 700, color: TOPIC_COLOUR[t] }}>
                      {t} <span style={{ color: colors.textHint, fontWeight: 400, fontSize: font.sm }}>({n}/{inTopic.length})</span>
                    </span>
                    <button
                      onClick={() => persist(inTopic.map(s => s.id), !allOn)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.primary, fontSize: font.sm, fontWeight: 600, padding: 2 }}
                    >
                      {allOn ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {inTopic.map(s => {
                      const on = covered.has(s.id)
                      return (
                        <button
                          key={s.id}
                          onClick={() => persist([s.id], !on)}
                          style={{
                            fontSize: font.sm, padding: '3px 10px', borderRadius: radius.full, cursor: 'pointer',
                            border: `1px solid ${on ? TOPIC_COLOUR[t] : colors.border}`,
                            background: on ? TOPIC_COLOUR[t] : colors.card,
                            color: on ? '#fff' : colors.textSecondary,
                            fontWeight: on ? 600 : 400,
                          }}
                        >
                          {on ? '✓ ' : ''}{s.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={done} style={{ ...secondaryButton, width: 'auto', padding: '8px 16px', fontSize: font.base, marginTop: 16 }}>
            Done
          </button>
        </>
      )}
    </div>
  )
}

const hint: React.CSSProperties = { fontSize: font.base, color: colors.textHint, margin: '8px 0 0', lineHeight: 1.6 }
