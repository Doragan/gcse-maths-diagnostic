'use client'

/**
 * What this paper moved on the skill map.
 *
 * Replaces a panel that recomputed mastery from the paper alone and so could
 * only restate its correctness — every skill read "1/1 correct, in progress",
 * which told a student nothing they had not already seen in the score.
 *
 * Summary first, detail on demand: after a long paper the useful sentence is
 * "two skills moved up", not a list of twelve rows. The list is one tap away
 * for anyone who wants it.
 */

import { useState } from 'react'
import { skillsById } from '../../lib/skills/skillGraph'
import type { MasteryProgress, SkillMove } from '../../lib/skills/masteryProgress'
import type { MasteryStatus } from '../../lib/skills/masteryEngine'
import { colors, font, radius, card } from '../../lib/styles'

const STATUS_META: Record<MasteryStatus, { label: string; bg: string; color: string; border: string }> = {
  mastered:       { label: 'Mastered',       bg: colors.successLight, color: colors.successText, border: colors.successBorder },
  in_progress:    { label: 'In progress',    bg: colors.warningLight, color: colors.warningText, border: colors.warningBorder },
  needs_practice: { label: 'Needs practice', bg: colors.dangerLight,  color: colors.dangerText,  border: colors.dangerBorder },
}

const name = (id: string) => skillsById[id]?.name ?? id

function Pill({ status, faded = false }: { status: MasteryStatus; faded?: boolean }) {
  const m = STATUS_META[status]
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: radius.full,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      whiteSpace: 'nowrap', opacity: faded ? 0.55 : 1,
    }}>{m.label}</span>
  )
}

/** One skill: where it was, where it is, and the evidence behind it. */
function MoveRow({ move }: { move: SkillMove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0', borderTop: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: font.sm, color: colors.textPrimary }}>{name(move.skillId)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {/* Show the journey, not just the destination — "in progress →
              mastered" is the thing the student actually did today. */}
          {move.from && move.direction !== 'same' && (
            <>
              <Pill status={move.from} faded />
              <span aria-hidden="true" style={{ color: colors.textHint, fontSize: '11px' }}>→</span>
            </>
          )}
          <Pill status={move.to} />
        </span>
      </div>
      <span style={{ fontSize: '11px', color: colors.textHint }}>
        {move.from === null ? 'First time you have tried this. ' : ''}
        {move.paperCorrect}/{move.paperTotal} right on this paper
        {move.recentAttempts > move.paperTotal &&
          <> · {move.recentCorrect}/{move.recentAttempts} across your recent practice</>}
      </span>
    </div>
  )
}

export default function MasteryProgressCard({
  progress,
  /** Teacher preview: the paper is not anyone's practice, so soften the copy. */
  preview = false,
}: {
  progress: MasteryProgress
  preview?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { moves, movedUp, movedDown, newlyMastered, masteredAfter, reinforced, hasPrior } = progress

  if (moves.length === 0) return null

  // Lead with the truest strong statement available, and never manufacture one:
  // "nothing moved" is a real and common outcome, and saying so plainly beats
  // dressing up the number of questions answered as progress.
  // Which movement the headline claimed, so the breakdown beneath does not
  // simply repeat it back ("1 skill slipped" / "1 slipped").
  const [headline, claimed] = ((): [string, 'mastered' | 'up' | 'down' | null] => {
    if (preview) return [`This paper would touch ${moves.length} skill${moves.length === 1 ? '' : 's'}`, null]
    if (!hasPrior) return [`${moves.length} skill${moves.length === 1 ? '' : 's'} started`, null]
    if (newlyMastered.length > 0) {
      return [`${newlyMastered.length} skill${newlyMastered.length === 1 ? '' : 's'} mastered`, 'mastered']
    }
    if (movedUp.length > 0) return [`${movedUp.length} skill${movedUp.length === 1 ? '' : 's'} moved up`, 'up']
    if (movedDown.length > 0) return [`${movedDown.length} skill${movedDown.length === 1 ? '' : 's'} slipped`, 'down']
    return ['No skills changed level', null]
  })()

  const subtitle = (() => {
    if (preview) return 'Nothing is recorded from a preview.'
    if (!hasPrior) {
      return 'This is your first recorded work, so there is nothing to compare against yet — these are your starting points.'
    }
    if (newlyMastered.length === 0 && movedUp.length === 0 && movedDown.length === 0) {
      // The commonest outcome, and the one most likely to read as failure. Say
      // why it is normal: mastery is built from repeated evidence, not one paper.
      return `You practised ${moves.length} skill${moves.length === 1 ? '' : 's'}. Levels move on repeated evidence rather than a single paper, so holding steady is normal.`
    }
    // Only counts that are non-zero, and never the one the headline just made
    // — "1 skill slipped" followed by "1 slipped" is noise where the standing
    // should be.
    const held = moves.length - movedUp.length - movedDown.length
    const parts: string[] = []
    if (movedUp.length > 0 && claimed !== 'up') parts.push(`${movedUp.length} moved up`)
    if (movedDown.length > 0 && claimed !== 'down') parts.push(`${movedDown.length} slipped`)
    if (held > 0) parts.push(`${held} held steady`)
    const standing = `You now have ${masteredAfter} skill${masteredAfter === 1 ? '' : 's'} mastered overall.`
    return parts.length > 0 ? `${parts.join(' · ')}. ${standing}` : standing
  })()

  return (
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <h2 style={{ fontSize: font.lg, fontWeight: 700, margin: 0, color: colors.textPrimary }}>
          {headline}
        </h2>
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
            fontSize: font.sm, color: colors.primary, fontWeight: 600, flexShrink: 0,
          }}
        >
          {open ? 'Hide skills' : `Show ${moves.length} skill${moves.length === 1 ? '' : 's'}`}
        </button>
      </div>

      <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: '6px 0 0', lineHeight: 1.6 }}>
        {subtitle}
      </p>

      {open && (
        <div style={{ marginTop: 10 }}>
          {moves.map(m => <MoveRow key={m.skillId} move={m} />)}
          {reinforced > 0 && (
            <p style={{ fontSize: '11px', color: colors.textHint, margin: '10px 0 0', lineHeight: 1.6 }}>
              + {reinforced} earlier skill{reinforced === 1 ? '' : 's'} reinforced. Getting a harder question right
              is evidence for the steps underneath it, so those count too.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
