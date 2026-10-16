import { courseParts, courseIdFor, type Qualification, type CourseTier } from '../../data/courses'
import { setQualification } from './qualificationPreference'
import { setTier } from './tierPreference'

// ─────────────────────────────────────────────────────────────────────────────
// The course on a signed-in account, and how it meets the per-browser ones.
//
// Qualification and tier are stored per browser (localStorage), which is right
// for a signed-out visitor and wrong for an account: a student who sets up
// iGCSE Higher on a laptop should not be shown GCSE Foundation on a phone.
//
// RESOLUTION ORDER is account, then browser, then default. Rather than thread
// that through every caller of getQualification()/getTier() — both synchronous,
// while the account needs a round trip — the account WRITES THROUGH to the
// browser stores when a profile is fetched. The sync getters keep working
// unchanged and simply find the right answer already there.
//
// This is the same bridge tierPreference already uses to seed itself from the
// sessionStorage key /practice writes; it is one more level of the same idea.
//
// NULL course_id means not stated, and leaves the browser preference alone. An
// account that has never been asked must not overwrite a choice the student
// already made in this browser.
// ─────────────────────────────────────────────────────────────────────────────

/** Just the course-bearing part of a student profile. */
export type WithCourse = { course_id?: string | null } | null | undefined

/**
 * Push an account course into the per-browser preferences.
 *
 * Returns what it applied, or null when there was nothing to apply — no
 * profile, no course set, or a course id this build does not know (written by
 * another deploy). An unknown id falls back rather than throwing: the student
 * keeps a working session on their browser preference.
 */
export function applyAccountCourse(
  profile: WithCourse,
): { qualification: Qualification; tier: CourseTier } | null {
  const parts = courseParts(profile?.course_id)
  if (!parts) return null
  setQualification(parts.qualification)
  setTier(parts.tier)
  return parts
}

/**
 * The course id to store for a (qualification, tier). Re-exported here so the
 * account form has one import for this concern rather than reaching into the
 * course data directly.
 */
export { courseIdFor, courseParts }
