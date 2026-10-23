'use client'

import { useMemo, useState } from 'react'
import { skills } from '../data/skills'
import { isPractisable } from '../lib/skills/publishedSkills'
import { addAll, removeAll, toggleOne, allChosen } from '../lib/skillSelection'
import { colors, font, radius } from '../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// Choosing skills, for a teacher setting up a lesson.
//
// It replaced a single topic <select> that swapped out a row of chips. Three
// things were wrong with that, and they compound:
//
//   * ONE TOPIC AT A TIME. Picking across topics meant switching the select,
//     which replaced everything on screen.
//   * NOTHING SHOWED WHAT WAS CHOSEN except a count — and the skills behind
//     that count were on topics no longer displayed, so "(7 chosen)" was
//     unauditable. A teacher could not answer "did I remember ratio?".
//   * NO BULK ACTION. "Everything in Number" was 33 clicks.
//
// So: a disclosure per topic, all of them reachable without losing state; a
// summary of what is chosen that is always visible; and select/clear per topic.
//
// ── Why <details>/<summary> rather than a div with onClick ─────────────────
//
// It is keyboard-operable, screen-reader-announced and focusable for free, and
// the house rule (docs/audit — "accessible as drawn") is that a thing you click
// is a real control. The select-all button lives in the BODY rather than the
// summary: a button inside a summary both activates and toggles the
// disclosure, and the usual fix is stopPropagation, which leaves a control
// that behaves differently from every other button on the page.
//
// ── Only practisable skills are offered ────────────────────────────────────
//
// The curriculum has 164 skills; not all have a published question. Offering
// one that has none produces a lesson where a pupil is served nothing, in
// front of a class. The counts shown are of what is actually offerable, so
// "Algebra 40" is not a promise about the other two.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  /** Chosen skill ids. */
  value: string[]
  onChange: (next: string[]) => void
  /**
   * The published-skill set from usePublishedSkillIds. Null means the lookup
   * failed, and isPractisable then treats everything as offerable — failing
   * open, which that module documents as the deliberate choice.
   */
  published: Set<string> | null
}

const TOPICS = [...new Set(skills.map(s => s.topic))].sort()

export default function SkillPicker({ value, onChange, published }: Props) {
  const chosen = useMemo(() => new Set(value), [value])

  // Which topics are open, tracked only to point the chevron. The default
  // marker is hidden (see styles.summaryRow), so without this a topic row has
  // no affordance saying it opens at all — the count on the right reads as a
  // label, not a control.
  //
  // <details> stays in charge: this follows its onToggle rather than driving
  // the open state, so keyboard, find-in-page and the browser's own expansion
  // all keep working.
  const [open, setOpen] = useState<Set<string>>(new Set())

  const byTopic = useMemo(
    () => TOPICS.map(topic => ({
      topic,
      items: skills.filter(s => s.topic === topic && isPractisable(s.id, published)),
    })).filter(t => t.items.length > 0),
    [published],
  )

  // Chosen skills in the order the topics appear, not the order they were
  // clicked: the summary is something to READ DOWN against a lesson plan, and
  // click order is noise for that.
  const chosenSkills = useMemo(
    () => byTopic.flatMap(({ items }) => items.filter(s => chosen.has(s.id))),
    [byTopic, chosen],
  )

  function toggle(id: string) {
    onChange(toggleOne(value, id))
  }

  function setTopicAll(ids: string[], on: boolean) {
    onChange(on ? addAll(value, ids) : removeAll(value, ids))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* What is chosen, always visible — the thing the old count could not
          tell you. Removable here so a mistake is fixable without hunting for
          the topic it came from. */}
      <div style={styles.summary}>
        <div style={styles.summaryHead}>
          <span style={{ fontSize: font.sm, fontWeight: '600', color: colors.textPrimary }}>
            {chosenSkills.length === 0
              ? 'No skills chosen yet'
              : `${chosenSkills.length} skill${chosenSkills.length === 1 ? '' : 's'} chosen`}
          </span>
          {chosenSkills.length > 0 && (
            <button type="button" onClick={() => onChange([])} style={styles.linkButton}>
              Clear all
            </button>
          )}
        </div>

        {chosenSkills.length === 0 ? (
          <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, lineHeight: '1.5' }}>
            Open a topic below to choose skills.
          </p>
        ) : (
          <div style={styles.chipRow}>
            {chosenSkills.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                aria-label={`Remove ${s.name}`}
                style={styles.chosenChip}
              >
                {s.name}
                <span aria-hidden="true" style={{ fontWeight: '700' }}>×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* One disclosure per topic. All of them stay reachable, so choosing
          across topics never hides what was picked elsewhere. */}
      {byTopic.map(({ topic, items }) => {
        const ids = items.map(s => s.id)
        const picked = ids.filter(id => chosen.has(id)).length
        const allPicked = allChosen(value, ids)

        return (
          <details
            key={topic}
            style={styles.topic}
            onToggle={e => {
              // Read it HERE, not inside the updater: the updater runs after
              // React has finished with the event, and currentTarget is null
              // by then.
              const isOpen = e.currentTarget.open
              setOpen(prev => {
                const next = new Set(prev)
                if (isOpen) next.add(topic); else next.delete(topic)
                return next
              })
            }}
          >
            <summary style={styles.summaryRow}>
              <span style={styles.summaryLabel}>
                <span aria-hidden="true" style={{
                  ...styles.chevron,
                  transform: open.has(topic) ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>
                  ▸
                </span>
                <span style={{ fontWeight: '600', color: colors.textPrimary }}>{topic}</span>
              </span>
              <span style={{ fontSize: font.sm, color: picked > 0 ? colors.successText : colors.textSecondary }}>
                {picked > 0 ? `${picked} of ${items.length}` : `${items.length} skills`}
              </span>
            </summary>

            <div style={styles.topicBody}>
              <button
                type="button"
                onClick={() => setTopicAll(ids, !allPicked)}
                style={styles.linkButton}
              >
                {allPicked ? `Deselect all ${items.length}` : `Select all ${items.length}`}
              </button>

              <div style={styles.chipRow}>
                {items.map(s => {
                  const on = chosen.has(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      aria-pressed={on}
                      style={{
                        ...styles.chip,
                        background:  on ? colors.successLight : colors.card,
                        borderColor: on ? colors.success      : colors.borderStrong,
                        color:       on ? colors.successText  : colors.textPrimary,
                      }}
                    >
                      {on ? '✓ ' : ''}{s.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </details>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  summary: {
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    background: colors.cardAlt,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  summaryHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  topic: {
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    background: colors.card,
    overflow: 'hidden',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    cursor: 'pointer',
    fontSize: font.base,
    // The default triangle sits oddly against a space-between row; the count
    // on the right already signals state, and <details> keeps its keyboard
    // behaviour either way.
    listStyle: 'none',
  },
  summaryLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  chevron: {
    display: 'inline-block',
    color: colors.textSecondary,
    fontSize: font.sm,
    lineHeight: 1,
    // No transition. It snaps, which is what a disclosure arrow does anyway,
    // and animating it would be one more thing that only shows up wrong on
    // someone else's machine.
  },
  topicBody: {
    padding: '0 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderTop: `1px solid ${colors.border}`,
    paddingTop: '12px',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
  },
  chip: {
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: radius.sm,
    padding: '6px 10px',
    fontSize: font.sm,
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  chosenChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: colors.successLight,
    border: `1px solid ${colors.success}`,
    color: colors.successText,
    borderRadius: radius.full,
    padding: '5px 10px',
    fontSize: font.sm,
    fontWeight: '500',
    cursor: 'pointer',
  },
  linkButton: {
    alignSelf: 'flex-start',
    background: 'transparent',
    border: 'none',
    padding: 0,
    color: colors.primary,
    fontSize: font.sm,
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}
