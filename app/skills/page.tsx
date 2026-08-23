'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { skills } from '../../data/skills'
import { foundationSkillIds, higherOnlySkillIds } from '../../data/courses'
import { hasBriefing, briefedSkillIds } from '../../data/skillBriefings'
import { skillPath } from '../../lib/skills/slug'
import { getTier, setTier as persistTier } from '../../lib/skills/tierPreference'
import { calculateMastery, type MasteryStatus } from '../../lib/skills/masteryEngine'
import { getStudentProfile } from '../../lib/auth'
import { trackEvent } from '../../lib/analytics'
import { colors, font, radius, secondaryButton } from '../../lib/styles'
import type { Tier } from '../../lib/skills/examProfile'

// ─────────────────────────────────────────────────────────────────────────────
// The skill index — the first route that makes the briefing pages reachable.
//
// Until now /skill/[slug] was linked from exactly one place: the prompt shown
// after a wrong answer on a skill that had one. A student who simply wanted to
// revise ratio could not get there, and nothing internal pointed at them at all.

//
// It lists the WHOLE curriculum rather than only the three skills that have one.
// A three-item page is not a map, and the point of this page is to show a
// student the shape of what they are learning and where they stand in it. Only
// briefed skills are links; the rest are listed with their mastery so the page
// is useful now and gets more useful as briefings are written.
// ─────────────────────────────────────────────────────────────────────────────

/** Topic display order — roughly the order they are taught. */
const TOPIC_ORDER = ['Number', 'Algebra', 'Ratio and Proportion', 'Shape and Space', 'Probability and Data']

type Filter = 'all' | 'briefings' | 'weak'

export default function SkillsIndexPage() {
  const router = useRouter()
  const [tier, setTierState] = useState<Tier>('foundation')
  const [filter, setFilter] = useState<Filter>('all')
  const [mastery, setMastery] = useState<Record<string, MasteryStatus>>({})
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => { setTierState(getTier()) }, [])

  useEffect(() => {
    trackEvent('skills_index_view', { tier })
  }, [tier])

  // Mastery, so the map shows where the student stands. Best-effort: signed-out
  // visitors get the same page without the status dots.
  useEffect(() => {
    (async () => {
      const profile = await getStudentProfile()
      if (!profile) return
      setSignedIn(true)
      const { data } = await supabase
        .from('practice_attempts')
        .select('skill_ids, correct, attempted_at, kind')
        .eq('student_id', profile.id)
      if (!data?.length) return
      const m = calculateMastery(data as never)
      setMastery(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.status])))
    })()
  }, [])

  function changeTier(next: Tier) {
    setTierState(next)
    persistTier(next)
    trackEvent('skills_index_tier_change', { tier: next })
  }

  const inTier = useMemo(() => {
    const ids = tier === 'higher'
      ? [...foundationSkillIds, ...higherOnlySkillIds]
      : foundationSkillIds
    return new Set(ids)
  }, [tier])

  const grouped = useMemo(() => {
    const visible = skills
      .filter(s => inTier.has(s.id))
      .filter(s => filter !== 'briefings' || hasBriefing(s.id))
      .filter(s => filter !== 'weak' || mastery[s.id] === 'needs_practice')

    const byTopic: Record<string, typeof skills> = {}
    for (const s of visible) (byTopic[s.topic] ??= []).push(s)
    for (const list of Object.values(byTopic)) list.sort((a, b) => a.name.localeCompare(b.name))

    return TOPIC_ORDER
      .filter(t => byTopic[t]?.length)
      .map(t => ({ topic: t, list: byTopic[t] }))
  }, [inTier, filter, mastery])

  const briefingCount = briefedSkillIds().filter(id => inTier.has(id)).length
  const totalVisible = grouped.reduce((n, g) => n + g.list.length, 0)

  return (
    <main style={styles.page}>

      <header>
        <h1 style={styles.title}>Every skill on the course</h1>
        <p style={styles.sub}>
          {briefingCount > 0
            ? `${briefingCount} ${briefingCount === 1 ? 'skill has' : 'skills have'} an exam briefing so far —
               how to spot the question, what it gets confused with, and how to check yourself.
               We're adding more.`
            : 'Exam briefings are on the way.'}
        </p>
      </header>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <section style={styles.controls}>
        <div style={styles.tierSwitch} role="group" aria-label="Which paper are you sitting?">
          {(['foundation', 'higher'] as Tier[]).map(t => (
            <button
              key={t}
              onClick={() => changeTier(t)}
              aria-pressed={tier === t}
              style={{
                ...styles.tierBtn,
                background: tier === t ? colors.card : 'transparent',
                color: tier === t ? colors.textPrimary : colors.textHint,
                boxShadow: tier === t ? '0 1px 2px rgba(16,24,40,.09)' : 'none',
                fontWeight: tier === t ? '650' : '500',
              }}
            >
              {t === 'foundation' ? 'Foundation' : 'Higher'}
            </button>
          ))}
        </div>

        <div style={styles.filters}>
          {([
            ['all', 'All skills'],
            ['briefings', 'Has a briefing'],
            ...(signedIn ? [['weak', 'Needs practice'] as [Filter, string]] : []),
          ] as [Filter, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setFilter(id); trackEvent('skills_index_filter', { filter: id }) }}
              aria-pressed={filter === id}
              style={{
                ...styles.chip,
                background: filter === id ? colors.primary : colors.card,
                borderColor: filter === id ? colors.primary : colors.borderStrong,
                color: filter === id ? '#ffffff' : colors.textPrimary,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Spells out the colour scheme, so the tint is a shortcut for a reader
          who has learnt it rather than the only way to know. Only shown when
          there is mastery to colour. */}
      {signedIn && Object.keys(mastery).length > 0 && (
        <div style={styles.legend}>
          {(['mastered', 'in_progress', 'needs_practice'] as MasteryStatus[]).map(s => (
            <span key={s} style={styles.legendItem}>
              <span style={{
                ...styles.legendSwatch,
                background: STATUS_TINT[s].bg,
                borderLeft: `3px solid ${STATUS_TINT[s].edge}`,
              }} />
              {LABEL[s]}
            </span>
          ))}
        </div>
      )}

      {/* ── The map ──────────────────────────────────────────────────────── */}
      {totalVisible === 0 ? (
        <section style={styles.card}>
          <p style={{ ...styles.muted, margin: 0 }}>
            {filter === 'weak'
              ? "Nothing needs practice right now — that's a good place to be."
              : 'Nothing to show for this filter yet.'}
          </p>
        </section>
      ) : grouped.map(({ topic, list }) => (
        <section key={topic} style={styles.card}>
          <div style={styles.topicHead}>
            <h2 style={styles.topicTitle}>{topic}</h2>
            <span style={styles.topicCount}>{list.length}</span>
          </div>

          <ul style={styles.grid}>
            {list.map(s => {
              const briefed = hasBriefing(s.id)
              const status = mastery[s.id]
              // The whole row carries the mastery colour rather than a dot at
              // the end of it: across a hundred-odd rows a small dot is far
              // harder to scan than a tinted band, and the eye can pick out a
              // run of weak skills in a topic at a glance.
              const tint = status ? STATUS_TINT[status] : null
              const rowStyle: React.CSSProperties = {
                ...styles.link,
                background: tint?.bg ?? 'transparent',
                borderLeft: `3px solid ${tint?.edge ?? 'transparent'}`,
              }
              const row = (
                <>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: font.base,
                      fontWeight: briefed ? '600' : '500',
                      color: briefed ? colors.primary : colors.textPrimary,
                    }}>
                      {s.name}
                    </span>
                    {briefed && <span style={styles.briefingBadge}>Briefing</span>}
                  </span>
                </>
              )

              // Colour alone must not carry the meaning — the status is named
              // for a screen reader and on hover, and the legend above spells
              // the scheme out.
              const label = status ? `${s.name} — ${LABEL[status]}` : s.name

              return (
                <li key={s.id} style={styles.item}>
                  {briefed ? (
                    <a
                      href={skillPath(s.id)}
                      onClick={() => trackEvent('skills_index_briefing_click', { skill: s.id, tier })}
                      style={rowStyle}
                      title={label}
                      aria-label={label}
                    >
                      {row}
                    </a>
                  ) : (
                    // Not a link: /skill/<id> without a briefing is a dead end, and
                    // 151 of those would be dead ends for search engines too.
                    <span style={{ ...rowStyle, cursor: 'default' }} title={label} aria-label={label}>
                      {row}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <button onClick={() => router.push('/practice')} style={{ ...secondaryButton, width: 'auto' }}>
        ← Back to practice
      </button>
    </main>
  )
}

/**
 * Row tint per mastery status: a pale band with a stronger left edge.
 *
 * The band has to stay light enough that the skill name — and the blue of a
 * briefed skill — reads cleanly on top of it, so the saturation lives in the
 * 3px edge rather than the fill.
 */
const STATUS_TINT: Record<MasteryStatus, { bg: string; edge: string }> = {
  mastered:       { bg: colors.successLight, edge: colors.success },
  in_progress:    { bg: colors.warningLight, edge: colors.warning },
  needs_practice: { bg: colors.dangerLight,  edge: colors.danger },
}
const LABEL: Record<MasteryStatus, string> = {
  mastered: 'Secure',
  in_progress: 'In progress',
  needs_practice: 'Needs practice',
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '28px 20px 64px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minHeight: '100dvh',
  },
  title: {
    fontSize: font['3xl'],
    fontWeight: '700',
    letterSpacing: '-0.02em',
    margin: '0 0 6px',
    color: colors.textPrimary,
  },
  sub: { fontSize: font.md, color: colors.textSecondary, margin: 0, maxWidth: '60ch', lineHeight: 1.55 },
  muted: { fontSize: font.base, color: colors.textSecondary, margin: 0 },

  controls: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
  tierSwitch: {
    display: 'inline-flex',
    gap: '2px',
    padding: '3px',
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
  },
  tierBtn: {
    padding: '5px 11px',
    borderRadius: radius.sm,
    border: 'none',
    fontSize: font.sm,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  filters: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  chip: {
    padding: '5px 12px',
    borderRadius: radius.full,
    border: '1px solid',
    fontSize: font.sm,
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  card: {
    background: colors.card,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    padding: '16px 18px',
  },
  topicHead: { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' },
  topicTitle: {
    fontSize: font.sm,
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.textSecondary,
    margin: 0,
  },
  topicCount: { fontSize: font.sm, color: colors.textHint, fontVariantNumeric: 'tabular-nums' },

  grid: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: '2px 14px',
  },
  item: { margin: 0 },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 8px',
    borderRadius: radius.sm,
    textDecoration: 'none',
    color: 'inherit',
  },
  briefingBadge: {
    marginLeft: '7px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '1px 6px',
    borderRadius: radius.full,
    background: '#eff4ff',
    color: colors.primaryHover,
    border: '1px solid #c3d5fb',
    whiteSpace: 'nowrap',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    fontSize: font.sm,
    color: colors.textSecondary,
    padding: '0 2px',
  },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
  legendSwatch: {
    display: 'inline-block',
    width: '22px',
    height: '13px',
    borderRadius: '0 3px 3px 0',
  },
}
