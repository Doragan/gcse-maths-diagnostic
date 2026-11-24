'use client'

import { useEffect } from 'react'
import { colors, font, radius } from '../../lib/styles'
import { skillsById } from '../../lib/skills/skillGraph'
import { skillPath, investigatePath } from '../../lib/skills/slug'
import { trackEvent } from '../../lib/analytics'
import { getInvestigation } from '../../data/investigations'
import type { SkillEntry } from '../../lib/skills/skillEntry'

/**
 * The card offered after a wrong answer: the investigation for the question's
 * skill, or its exam briefing where there is no investigation.
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
  const isInvestigation = entry.kind === 'investigation'
  const investigation = isInvestigation ? getInvestigation(skillId) : null
  const skillName = skillsById[skillId]?.name ?? 'this skill'

  useEffect(() => {
    trackEvent(isInvestigation ? 'investigation_prompt_shown' : 'skill_briefing_prompt_shown', {
      skill: skillId, from: 'question_feedback', question: questionId,
    })
  }, [isInvestigation, skillId, questionId])

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
      <p style={{ fontSize: font.base, color: colors.textPrimary, margin: '0 0 10px' }}>
        {/* Each investigation says what the student will do in it. This was one
            sentence about drawing graphs, written for the first investigation
            and shown under every one since. */}
        {investigation
          ? `There's an investigation for this one — ${investigation.invite}`
          : `We've written an exam briefing on ${skillName.toLowerCase()} — how to spot
             the question, what it gets confused with, and how to check yourself.`}
      </p>
      <a
        href={isInvestigation ? investigatePath(skillId) : skillPath(skillId)}
        onClick={() => trackEvent(
          isInvestigation ? 'investigation_prompt_click' : 'skill_briefing_prompt_click',
          { skill: skillId, from: 'question_feedback', question: questionId },
        )}
        style={{ fontSize: font.base, color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
      >
        {/* The investigation's own title, not the skill name: skill names are
            long and read badly lowercased mid-sentence, and the title says
            what the student will actually do. */}
        {investigation
          ? `Start “${investigation.title}” →`
          : `Read the ${skillName.toLowerCase()} briefing →`}
      </a>
    </div>
  )
}
