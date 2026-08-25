/**
 * Student subscription plans — display data shared by the student upgrade page
 * (app/student/upgrade) and the public parent-pay page (app/pay/[token]).
 * Client-safe: no secrets, no price IDs. The Stripe price-id mapping lives
 * server-side in lib/stripePlans.ts.
 */

export type Plan = 'monthly' | 'annual' | 'exam'

/** Founder-price seat limit for the 2027 exam pass. Shared client + server. */
export const FOUNDER_SEAT_CAP = 100

export type PlanDef = {
  id: Plan
  label: string
  price: string
  period: string
  badge: string | null
  description: string
  /**
   * Founder plans only: the standard (non-sale) price. Shown struck-through while
   * founder seats remain, and charged in full once the founder offer is closed.
   */
  regularPrice?: string
  /** True for the limited founder-price pass (seat-capped, reverts to regularPrice). */
  founder?: boolean
}

export const PLANS: PlanDef[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '£1.49',
    period: 'per month',
    badge: null,
    description: 'Renews monthly. Cancel any time.',
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '£11.99',
    period: 'per year',
    badge: 'Best value',
    description: 'Renews yearly — cancel any time. Saves £5.89 vs monthly.',
  },
  {
    id: 'exam',
    label: 'Exam Season 2027',
    price: '£4.99',
    regularPrice: '£9.99',
    founder: true,
    period: 'until 31 July 2027',
    badge: 'Founder price',
    description: 'One payment covering now through the summer 2027 exams — no renewal. Founder price for the first 100.',
  },
]

export const FEATURES = [
  'Full progress trends — accuracy and activity over time, kept through your 2027 exams',
  'One-tap "weak spots" sessions built from the skills you keep missing',
  'Drill any single skill or whole topic on demand',
  'Smart practice that automatically targets your weakest skills first',
]

/**
 * Resolve what to DISPLAY for a plan given the live founder-seat count.
 * Client-safe (pure display). `seatsLeft === null` means "unknown" (still
 * loading, or the seats endpoint failed) — we optimistically treat the founder
 * offer as open, matching the server's fail-open pricing, so we never flash the
 * higher price. The Stripe Checkout page is always the source of truth for the
 * amount actually charged.
 */
export function planPricing(plan: PlanDef, seatsLeft: number | null): {
  founderOpen: boolean
  price: string
  strikePrice: string | null
  badge: string | null
} {
  const founderOpen = Boolean(plan.founder) && (seatsLeft === null || seatsLeft > 0)
  return {
    founderOpen,
    price: founderOpen ? plan.price : (plan.regularPrice ?? plan.price),
    strikePrice: founderOpen ? (plan.regularPrice ?? null) : null,
    badge: plan.founder ? (founderOpen ? plan.badge : null) : plan.badge,
  }
}

/** "N of 100 founder seats left" — or null while unknown or once the offer is closed. */
export function seatsLeftLabel(seatsLeft: number | null): string | null {
  if (seatsLeft === null || seatsLeft <= 0) return null
  return `${seatsLeft} of ${FOUNDER_SEAT_CAP} founder seats left`
}

/**
 * Turns the `?want=` on /student/upgrade into the sentence the student needs
 * to see first.
 *
 * Every locked feature that routes to the upgrade page should say which
 * feature it was. Landing on a generic pricing page with no acknowledgement
 * reads as a dead end: the student asked for one specific thing and got a
 * sales pitch.
 *
 * Unknown or absent values return null so the banner is skipped — a bad or
 * hand-edited link degrades to the plain pricing page rather than asserting
 * something wrong.
 */
export function wantedFeatureLabel(
  want: string | null | undefined,
  skillName: string | null | undefined,
): string | null {
  switch (want) {
    case 'skill':
      return skillName
        ? `You wanted to drill ${skillName.toLowerCase()} on its own.`
        : 'You wanted to drill one skill on its own.'
    case 'topic':
      return 'You wanted to drill a whole topic.'
    case 'weakspots':
      return 'You wanted a session built from your weak spots.'
    default:
      return null
  }
}
