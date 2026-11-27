'use client'

import { useEffect, type ReactNode } from 'react'
import { colors, font, radius } from '../../lib/styles'
import { skillsById } from '../../lib/skills/skillGraph'
import { skillPath, investigatePath } from '../../lib/skills/slug'
import { trackEvent } from '../../lib/analytics'
import { getInvestigation } from '../../data/investigations'
import { sectionTitles } from '../../lib/skills/investigation'
import type { SkillEntry } from '../../lib/skills/skillEntry'

/**
 * The card offered after a wrong answer: the section of an investigation that
 * teaches the mistake (docs/audit/33), the investigation from the start where
 * no section does, a revisit-or-briefing choice once the investigation is
 * finished, or the skill's exam briefing where there is no investigation.
 *
 * Its own component for one reason the page could not give it: it records
 * that it was SHOWN. Clicks were logged from the start, but with no count of
 * how often the card appeared, its click-through could not be read — and it
 * is the widest door into the investigations, since every practice question
 * and every class-session question passes through it
 * (docs/audit/32-investigation-integration-plan.md, increment 1).
 *
 * Once per question shown, not per render: `questionId` keys the effect.
 */
export default function TeachingPrompt({ entry, questionId }: { entry: SkillEntry; questionId: string }) {
  const skillId = entry.skillId
  const investigation = entry.kind === 'briefing' ? null : getInvestigation(skillId)
  const skillName = skillsById[skillId]?.name ?? 'this skill'
  const section = entry.kind === 'briefing' ? null : entry.section
  const sectionTitle = investigation && section !== null ? sectionTitles(investigation)[section] : null
  /** The section's own page, which sends the student back to this question when it is done. */
  const sectionHref = section !== null
    ? `${investigatePath(skillId)}?section=${section + 1}&from=${questionId}`
    : investigatePath(skillId)

  useEffect(() => {
    trackEvent(entry.kind === 'briefing' ? 'skill_briefing_prompt_shown' : 'investigation_prompt_shown', {
      skill: skillId, from: 'question_feedback', question: questionId,
      kind: entry.kind, ...(section !== null ? { section: section + 1 } : {}),
    })
  }, [entry.kind, skillId, questionId, section])

  /** One link on the card, logged with which of the card's offers it was. */
  const link = (href: string, text: string, choice: 'section' | 'investigation' | 'briefing') => (
    <a
      href={href}
      onClick={() => trackEvent(
        choice === 'briefing' ? 'skill_briefing_prompt_click' : 'investigation_prompt_click',
        {
          skill: skillId, from: 'question_feedback', question: questionId, kind: entry.kind, choice,
          ...(section !== null ? { section: section + 1 } : {}),
        },
      )}
      style={{ fontSize: font.base, color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
    >
      {text}
    </a>
  )

  let body: string
  let links: ReactNode
  if (entry.kind === 'revisit' && investigation && sectionTitle) {
    body = `You've done “${investigation.title}”. That mistake is the one in “${sectionTitle}”.`
    links = (
      <>
        {link(sectionHref, 'Revisit that section →', 'section')}
        {entry.briefing && link(skillPath(skillId), 'Read the exam briefing →', 'briefing')}
      </>
    )
  } else if (investigation && sectionTitle) {
    body = `That looks like the mistake in “${sectionTitle}” — one short section of “${investigation.title}” `
      + 'is about exactly this.'
    links = link(sectionHref, 'Open that section →', 'section')
  } else if (investigation) {
    // Each investigation says what the student will do in it. This was one
    // sentence about drawing graphs, written for the first investigation and
    // shown under every one since.
    body = `There's an investigation for this one — ${investigation.invite}`
    // The investigation's own title, not the skill name: skill names are long
    // and read badly lowercased mid-sentence, and the title says what the
    // student will actually do.
    links = link(investigatePath(skillId), `Start “${investigation.title}” →`, 'investigation')
  } else {
    body = `We've written an exam briefing on ${skillName.toLowerCase()} — how to spot the question, `
      + 'what it gets confused with, and how to check yourself.'
    links = link(skillPath(skillId), `Read the ${skillName.toLowerCase()} briefing →`, 'briefing')
  }

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: radius.lg,
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderLeft: `3px solid ${colors.primary}`,
    }}>
      <p style={{ fontSize: font.sm, fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px', color: colors.primaryHover }}>
        New
      </p>
      <p style={{ fontSize: font.base, color: colors.textPrimary, margin: '0 0 10px' }}>{body}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>{links}</div>
    </div>
  )
}
