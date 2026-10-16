import type { CourseTier } from '../../data/courses'

// ─────────────────────────────────────────────────────────────────────────────
// Asking a student which course they are sitting.
//
// The account can hold a course (students.course_id), but nothing asks for one,
// so every existing account is NULL and falls back to the per-browser default.
// This is the asking.
//
// ── WHY TARGET GRADE RATHER THAN "FOUNDATION OR HIGHER" ─────────────────────
// Tier is the fact we need and the worst question to ask. Schools often decide
// it late, plenty of students genuinely do not know, and the ones who guess
// wrong land on a pool that is either missing content or full of content that
// is not on their paper.
//
// A target grade is a question a student can answer about themselves, and it
// ALREADY CONTAINS the tier: Foundation awards grades 1-5 and nothing above,
// so anyone aiming for 6 or more has to be sitting Higher. One question, two
// answers, and the one we ask for is the one they can actually give.
// ─────────────────────────────────────────────────────────────────────────────

/** Offered highest-first, the way a student thinks about a target. */
export const TARGET_GRADES = [9, 8, 7, 6, 5, 4, 3, 2, 1] as const

/** The lowest target that forces Higher, because Foundation cannot award it. */
export const LOWEST_HIGHER_ONLY_GRADE = 6

/**
 * The tier a target grade implies.
 *
 * Foundation tops out at grade 5 on both GCSE and 4MA1, so 6+ can only be sat
 * on Higher. Below that the tiers OVERLAP — Higher also awards 4 and 5 — and
 * the overlap resolves to Foundation deliberately, for the reason tierPreference
 * already defaults there: a Higher candidate shown Foundation material sees less
 * than they need, while a Foundation candidate shown Higher material sees
 * content that is not on their paper at all. The first is a gap, the second is
 * wasted effort and a knock to confidence.
 */
export function tierForTargetGrade(grade: number): CourseTier {
  return grade >= LOWEST_HIGHER_ONLY_GRADE ? 'higher' : 'foundation'
}

// ── Not nagging ──────────────────────────────────────────────────────────────
// A student who declines must not be asked again every time they open the
// dashboard. Stored per browser rather than on the account: declining is not a
// fact about the student worth persisting server-side, and a column for it
// would need its own migration and grant.
//
// The asymmetry is deliberate. Dismissal is cheap to lose — at worst the card
// reappears once on a new device, where it is a reasonable thing to see — while
// the ANSWER is valuable and goes on the account, where it follows them.

const DISMISSED_KEY = 'mathsense_course_prompt_dismissed'

export function isCoursePromptDismissed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    // Private browsing. Showing the card is the safe failure: it is dismissible.
    return false
  }
}

export function dismissCoursePrompt(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // Nothing to do — the card simply reappears next visit.
  }
}

/**
 * Whether to ask this student at all.
 *
 * Only when the ACCOUNT has no course. A student who has set one — here or in
 * account settings — is never asked again on any device, because the answer
 * lives on the row rather than in this browser.
 */
export function shouldAskForCourse(courseId: string | null | undefined): boolean {
  return !courseId && !isCoursePromptDismissed()
}
