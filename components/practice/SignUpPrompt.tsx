'use client'

import { colors, font, radius, secondaryButton } from '../../lib/styles'
import { trackEvent } from '../../lib/analytics'
import { PLANS } from '../../lib/studentPlans'
import { FIRST_NUDGE_MILESTONE, isEarlyAnonymousAnswer } from '../../lib/practice/session'
import { GoogleButton } from '../GoogleButton'

/**
 * Derived from PLANS rather than typed into the copy, for the same reason the
 * landing page derives its price (scripts/check-landing-copy.ts enforces it
 * there): a price hardcoded into prose drifts the moment the plan changes, and
 * a wrong number is a bad look on a maths product.
 */
const ANNUAL_PRICE = PLANS.find(p => p.id === 'annual')?.price ?? null

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
 * Also fires `practice_question_answered` for the answers BELOW the first
 * milestone — the only ones that would otherwise leave no trace at all. See
 * isEarlyAnonymousAnswer for why that gap mattered.
 *
 * Returns true if the caller should now show <SignUpPrompt/>.
 */
export function registerQuestionForNudge(): boolean {
  if (typeof window === 'undefined') return false
  const count = parseInt(sessionStorage.getItem('practice_questions_answered') ?? '0') + 1
  sessionStorage.setItem('practice_questions_answered', count.toString())

  // Only the answers before the first milestone: from there the `_shown` event
  // below already marks the session, and two events for one answer double-count.
  if (isEarlyAnonymousAnswer(count)) trackEvent('practice_question_answered', { questions: count })

  const milestoneFor = (n: number) =>
    n >= 30 ? Math.floor(n / 15) * 15 : n >= 15 ? 15 : n >= FIRST_NUDGE_MILESTONE ? FIRST_NUDGE_MILESTONE : 0
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
 *
 * Rendered as a fixed-overlay MODAL, not an inline card. As an inline card it sat
 * below the feedback box, the mastery dots and the Next-question button — ~822px
 * down a 720px viewport — so it fired but was never actually seen, which is the
 * whole reason the practice→signup step was leaking. The homepage demo's prompt
 * (app/page.tsx) is a modal for the same reason.
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
    <div
      style={{
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div style={{
        background: colors.card,
        borderRadius: radius.lg,
        padding: '28px 24px',
        maxWidth: '440px',
        width: '100%',
        maxHeight: '85dvh',
        overflowY: 'auto' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <p style={{ fontSize: font.xl, fontWeight: '700', margin: 0, color: colors.textPrimary }}>
          {heading}
        </p>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 4px' }}>
          {body}
        </p>
        {/* Google is the primary path: it skips the email → password → confirm →
            13+ check → email-verification round-trip (a notorious drop-off). The
            callback (app/auth/callback) still collects the 13+ consent for new
            Google students and migrates the questions they just answered. New
            students land on /student/diagnostic; routing nudge-originated signups
            back into practice instead is a possible future refinement.

            Uses the shared GoogleButton (official "G" mark, Google's own button
            styling) so the nudge matches /auth and /student — a hand-rolled plain
            button is off-brand and less recognisable. It brings its own "or" divider. */}
        <GoogleButton
          role="student"
          onBeforeSignIn={() => trackEvent('practice_signup_prompt_clicked', { questions: total, method: 'google' })}
        />
        <a
          href="/student?mode=signup"
          onClick={() => trackEvent('practice_signup_prompt_clicked', { questions: total, method: 'email' })}
          style={{ ...secondaryButton, textAlign: 'center' as const, textDecoration: 'none', display: 'block', boxSizing: 'border-box' as const }}
        >
          Sign up with email
        </a>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: colors.textSecondary,
            fontSize: font.sm,
            fontWeight: '600',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          Maybe later
        </button>
        {/*
          The cost answer, once, quietly, AFTER the ask — the same stance the
          landing page takes. The account itself is free, so leading with a
          price would invent an objection that isn't there; but "will this end
          up costing me?" is the unasked question behind a sign-up wall, and
          leaving it unanswered is what makes a free offer feel like a trap.
          The calculator comparison gives the yearly figure a size a student
          already knows — every one of them has bought one.
        */}
        {ANNUAL_PRICE && (
          <p style={{ fontSize: font.sm, color: colors.textHint, margin: '2px 0 0', textAlign: 'center' as const, lineHeight: 1.5 }}>
            Free, and no card needed. There&rsquo;s an optional upgrade later at{' '}
            {ANNUAL_PRICE} for a whole year — less than a new scientific calculator.
          </p>
        )}
      </div>
    </div>
  )
}
