'use client'

import { colors, font, radius, primaryButton, secondaryButton } from '../../lib/styles'
import { trackEvent } from '../../lib/analytics'
import { signInWithGoogle } from '../../lib/auth'

/**
 * Bumps the per-tab "questions answered" counter and decides whether the anonymous
 * sign-up nudge should surface now. Call ONCE per completed question — a multi-part
 * question counts as one, not one per part.
 *
 * The nudge re-surfaces at escalating milestones (3, 15, then every 15 from 30) with
 * copy that escalates alongside it (see SignUpPrompt). We match on the highest
 * milestone REACHED (>=) and remember the last one shown in `practice_signup_prompt_at`,
 * rather than an exact `count === 3`: the counter lives in sessionStorage and is never
 * reset — it survives reloads for the whole tab — so an exact match would silently skip
 * the first prompt for anyone whose counter had already drifted past 3 (a returning
 * anonymous visitor, or us testing repeatedly). For a fresh counter this fires at
 * exactly the same points as before. Fires the `_shown` analytics event as a side effect.
 *
 * Returns true if the caller should now show <SignUpPrompt/>.
 */
export function registerQuestionForNudge(): boolean {
  if (typeof window === 'undefined') return false
  const count = parseInt(sessionStorage.getItem('practice_questions_answered') ?? '0') + 1
  sessionStorage.setItem('practice_questions_answered', count.toString())

  const milestoneFor = (n: number) =>
    n >= 30 ? Math.floor(n / 15) * 15 : n >= 15 ? 15 : n >= 3 ? 3 : 0
  const milestone = milestoneFor(count)
  const lastShown = parseInt(sessionStorage.getItem('practice_signup_prompt_at') ?? '0')
  if (milestone > lastShown) {
    sessionStorage.setItem('practice_signup_prompt_at', milestone.toString())
    trackEvent('practice_signup_prompt_shown', { questions: count })
    return true
  }
  return false
}

/**
 * The anonymous sign-up nudge. Copy escalates with how much the visitor has done
 * (read live from sessionStorage so it works from any practice flow). Offers Google
 * as the primary path and the email flow as a secondary option.
 */
export default function SignUpPrompt({ onDismiss }: { onDismiss: () => void }) {
  const total   = parseInt(sessionStorage.getItem('session_total')   ?? '0')
  const correct = parseInt(sessionStorage.getItem('session_correct') ?? '0')
  let skillCount = 0
  try {
    skillCount = Object.keys(JSON.parse(sessionStorage.getItem('session_skills') ?? '{}')).length
  } catch { /* malformed storage — treat as zero skills */ }

  const acrossSkills = skillCount > 1 ? ` across ${skillCount} skills` : ''
  const correctBit   = correct > 0 ? `, ${correct} correct` : ''

  const heading =
    total >= 30 ? "You've done some serious work today" :
    total >= 15 ? `${total} questions in — nice going` :
                  'Save your progress'

  const body =
    total >= 30
      ? `That's ${total} questions${acrossSkills}${correctBit} — but it's only saved on this device and disappears when you close the tab. Create a free account to keep it and see your weak spots and progress over time.`
    : total >= 15
      ? `You've answered ${total} questions${acrossSkills}${correctBit}. Create a free account to save it and track which skills you've mastered.`
      : 'Create a free account to save your progress and see your weak spots and progress over time.'

  return (
    <div style={{
      padding: '16px',
      borderRadius: radius.lg,
      background: colors.card,
      border: `1px solid ${colors.primary}`,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
    }}>
      <p style={{ fontSize: font.md, fontWeight: '600', margin: 0, color: colors.textPrimary }}>
        {heading}
      </p>
      <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0 }}>
        {body}
      </p>
      {/* Google is the primary path: it skips the email → password → confirm →
          13+ check → email-verification round-trip (a notorious drop-off). The
          callback (app/auth/callback) still collects the 13+ consent for new
          Google students and migrates the questions they just answered. New
          students land on /student/diagnostic; routing nudge-originated signups
          back into practice instead is a possible future refinement. */}
      <button
        onClick={() => {
          trackEvent('practice_signup_prompt_clicked', { questions: total, method: 'google' })
          signInWithGoogle('student')
        }}
        style={{ ...primaryButton, width: '100%' }}
      >
        Continue with Google
      </button>
      <div style={{ display: 'flex', gap: '8px' }}>
        <a
          href="/student"
          onClick={() => trackEvent('practice_signup_prompt_clicked', { questions: total, method: 'email' })}
          style={{ ...secondaryButton, flex: 1, textAlign: 'center' as const, textDecoration: 'none', display: 'block', boxSizing: 'border-box' as const }}
        >
          Sign up with email
        </a>
        <button
          onClick={onDismiss}
          style={{ ...secondaryButton, flex: 1 }}
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
