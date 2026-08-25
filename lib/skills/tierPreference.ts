import type { Tier } from './examProfile'

// ─────────────────────────────────────────────────────────────────────────────
// Which tier the student is sitting.
//
// Today this is a per-session choice: /practice holds it in component state and
// writes `practice_tier` to sessionStorage, so it resets when the tab closes and
// never reaches the student profile. Content that reads differently by tier —
// the skill guides — needs it to outlive a tab, so this stores it in
// localStorage and seeds from the existing sessionStorage key.
//
// The proper fix is a `tier` column on `students` so it follows the account
// across devices; that needs a migration and is deliberately not part of this
// trial. Until then the two stores are kept in step, so /practice and the skill
// pages never disagree about which tier the student is on.
// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_KEY   = 'mathsense_tier'
const SESSION_KEY = 'practice_tier'   // the key /practice already writes

const isTier = (v: unknown): v is Tier => v === 'foundation' || v === 'higher'

/**
 * Best known tier for this browser. Falls back to Foundation, which is the
 * safer default: a Higher candidate shown Foundation material sees less than
 * they need, but a Foundation candidate shown Higher material sees content
 * that is not on their paper at all.
 */
export function getTier(): Tier {
  if (typeof window === 'undefined') return 'foundation'

  const stored = localStorage.getItem(LOCAL_KEY)
  if (isTier(stored)) return stored

  // Seed from whatever /practice last chose this session. That key can also
  // hold 'both', which is a practice-pool setting rather than a tier — ignore
  // it and fall through to the default.
  const session = sessionStorage.getItem(SESSION_KEY)
  if (isTier(session)) {
    localStorage.setItem(LOCAL_KEY, session)
    return session
  }

  return 'foundation'
}

/** Persist the student's tier and keep the practice-side key in step. */
export function setTier(tier: Tier): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_KEY, tier)
  sessionStorage.setItem(SESSION_KEY, tier)
}
