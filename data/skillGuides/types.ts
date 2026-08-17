import type { Tier } from '../../lib/skills/examProfile'

// ─────────────────────────────────────────────────────────────────────────────
// Tier 2 — the decision commentary for a skill.
//
// The authored half of a skill page. Structured fields rather than prose,
// because the value is in the fields nobody else writes: how you RECOGNISE the
// question, what it is CONFUSABLE with, and how you CHECK yourself. `steps.do`
// is the commodity part — it is free everywhere. `because` and `watch` are not.
//
// Tier-aware: a guide holds the shared material plus an optional `higher`
// block. Higher candidates see the shared content with the Higher additions
// merged in; Foundation candidates never see the Higher material, because it
// is not on their paper.
// ─────────────────────────────────────────────────────────────────────────────

export type ConfusableWith = {
  /** Skill id from data/skills.ts — the name is resolved for display. */
  skillId: string
  /** How to tell them apart, in the student's own decision language. */
  tell: string
}

export type MethodStep = {
  /** What to write down. */
  do: string
  /** Why this step and not another — the metacognitive content. */
  because: string
  /** Where it goes wrong. */
  watch: string
}

/**
 * A question stem the student judges BEFORE being told what it is — the
 * recognition cues turned into a drill.
 *
 * At least one example in every set is a deliberate near-miss: a question that
 * looks like this skill and isn't. Without that, the set only ever confirms
 * what the student already assumed, and the selection problem is exactly what
 * these pages exist to teach.
 *
 * Stems are ORIGINAL, written in the style of the paper. Nothing is transcribed
 * from a real exam — the coded audit deliberately holds no question text, and
 * these pages must not reintroduce it.
 */
export type SkillExample = {
  stem: string
  /** False for a near-miss — a question that resembles this skill but isn't. */
  isThisSkill: boolean
  /** Which recognition cue fires, or which one fails to. */
  cue: string
  /** For a near-miss: the skill it actually is, so the tell has somewhere to land. */
  actuallySkillId?: string
}

export type SkillGuide = {
  skillId: string
  /** One line under the title: what this skill actually is. */
  summary: string
  recognise: string[]
  confusableWith: ConfusableWith[]
  /** Stems to judge against the cues above, including at least one near-miss. */
  examples: SkillExample[]
  steps: MethodStep[]
  /** Questions to ask before writing the answer down. The 'evaluate' phase. */
  check: string[]
  /**
   * Additional material that applies only on Higher. Merged onto the shared
   * content, never replacing it — the Foundation method is still the method.
   */
  higher?: {
    /** Shown above the Higher additions to explain what changes at this tier. */
    note?: string
    recognise?: string[]
    confusableWith?: ConfusableWith[]
    examples?: SkillExample[]
    steps?: MethodStep[]
    check?: string[]
  }
}

/** A guide flattened for one tier, ready to render. */
export type ResolvedGuide = {
  skillId: string
  summary: string
  recognise: string[]
  confusableWith: ConfusableWith[]
  examples: SkillExample[]
  steps: MethodStep[]
  check: string[]
  higherNote: string | null
  /** How many of the steps came from the Higher block, for labelling. */
  higherStepCount: number
}

export function resolveGuide(guide: SkillGuide, tier: Tier): ResolvedGuide {
  const h = tier === 'higher' ? guide.higher : undefined

  return {
    skillId: guide.skillId,
    summary: guide.summary,
    recognise: [...guide.recognise, ...(h?.recognise ?? [])],
    confusableWith: [...guide.confusableWith, ...(h?.confusableWith ?? [])],
    examples: [...guide.examples, ...(h?.examples ?? [])],
    steps: [...guide.steps, ...(h?.steps ?? [])],
    check: [...guide.check, ...(h?.check ?? [])],
    higherNote: h?.note ?? null,
    higherStepCount: h?.steps?.length ?? 0,
  }
}
