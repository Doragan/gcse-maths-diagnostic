/**
 * Student subscription plans — display data shared by the student upgrade page
 * (app/student/upgrade) and the public parent-pay page (app/pay/[token]).
 * Client-safe: no secrets, no price IDs. The Stripe price-id mapping lives
 * server-side in lib/stripePlans.ts.
 */

export type Plan = 'monthly' | 'annual' | 'exam'

export const PLANS: {
  id: Plan
  label: string
  price: string
  period: string
  badge: string | null
  description: string
}[] = [
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
    price: '£9.99',
    period: 'until 31 July 2027',
    badge: 'Early access',
    description: 'One payment covering now until after the summer 2027 exams.',
  },
]

export const FEATURES = [
  'Drill any single skill or whole topic on demand',
  'One-tap "weak spots" sessions built from the skills you keep missing',
  'Smart practice that automatically targets your weakest skills first',
  'Priority access to new premium features as they launch',
]
