import type { SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// Demo students, and keeping them out of anything that counts.
//
// scripts/seed-demo-class.ts creates realistic-looking students so the teacher
// dashboard has something to show. They are indistinguishable from real rows
// except for a marker in `display_name`, and the seed BACKDATES about forty
// attempts each to fake a weekly trend — so they do not merely add to a total,
// they look like active users in exactly the windows a usage report measures.
//
// This went wrong the day the class-shaped seed landed (2026-10-18). The daily
// digest reported "practised in the last 7 days: 12" when three were real, and
// the inflated figure was read as a healthy number before anyone noticed. A
// seeded row is created on purpose and is easy to forget; the counting query is
// where it has to be remembered, so the exclusion lives here rather than in a
// habit.
//
// `--teardown` removes them, but the seed exists to be re-run for demos, so a
// report that is only correct between demos is not correct.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The marker every seeded student carries in `display_name`.
 *
 * A PREFIX, deliberately. The seed writes 'demo-seed' for the 1:1 shape and
 * 'demo-seed-class' for the class shape, and its own teardown matches on this
 * prefix to catch both. Anything excluding demo rows must do the same, or it
 * will filter one shape and silently keep the other.
 */
export const DEMO_SEED_MARKER = 'demo-seed'

/** The pattern for a PostgREST `ilike` against `display_name`. */
export const DEMO_SEED_PATTERN = `%${DEMO_SEED_MARKER}%`

/** True for a display name belonging to a seeded demo student. */
export function isDemoSeedName(displayName: string | null | undefined): boolean {
  return (displayName ?? '').includes(DEMO_SEED_MARKER)
}

/**
 * The ids of every seeded student, for excluding them from aggregates.
 *
 * Returned as a Set because the callers that need it are counting attempts,
 * and `practice_attempts` has no display_name to filter on — only a
 * student_id. Fetching the ids once and filtering in memory is cheaper than
 * joining, and the list is tiny.
 *
 * Returns an EMPTY set if the lookup fails, which keeps a usage report working
 * at the cost of being briefly inflated — the same trade the report already
 * makes everywhere else, and better than failing the morning email outright.
 */
export async function demoSeedStudentIds(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .ilike('display_name', DEMO_SEED_PATTERN)
  if (error) return new Set()
  return new Set((data ?? []).map(r => r.id as string))
}
