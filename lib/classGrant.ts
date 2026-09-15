import { supabase } from './supabase'

/**
 * The CLASS arm of the entitlement union (docs/audit/20-school-accounts-design.md).
 *
 *   student premium = personal grant OR class grant
 *
 *   class grant : an ACTIVE class_memberships row
 *                 -> classes.school_id
 *                 -> schools.granted_until > now
 *
 * Read it here, then hand it to `isPaidStudent` as `activeClassMembership`.
 * Nothing should re-implement the rule: that is the whole reason every premium
 * check was routed through one function.
 *
 * ── Why there are two code paths ────────────────────────────────────────────
 * The browser CANNOT compute this. `schools` denies every client role — no
 * policy and no grant — because seat counts and grant dates are commercial data.
 * So the browser asks the SECURITY DEFINER function, which sees `schools` and
 * returns only the boolean. That is the function's whole purpose: expose the
 * answer, not the data behind it.
 *
 * The server holds the service role, which bypasses RLS, so it reads the tables
 * directly. It cannot use the RPC: that function reads `auth.uid()`, which is
 * null under the service role, so it would answer false for everyone.
 */

/** Minimal shape of a supabase-js client, so callers can pass either one. */
type QueryClient = {
  from: (table: string) => any
}

/**
 * Browser: does the signed-in student currently have a class grant?
 *
 * Takes no argument, because the function it calls takes no argument — it reads
 * `auth.uid()` itself. A `_uid` parameter would have made it an oracle over
 * student ids and over which schools have paid.
 *
 * Never throws. A student whose grant lookup fails falls back to their personal
 * grant rather than seeing the page break, which is the right way round: the
 * failure costs a school-covered student their premium features for a page load,
 * where throwing would cost every student the page. It is logged, because a
 * silent false here would look exactly like "this student has no grant".
 */
export async function fetchMyClassGrant(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('student_has_class_grant')
    if (error) {
      console.error('class grant lookup failed:', error)
      return false
    }
    return data === true
  } catch (err) {
    console.error('class grant lookup threw:', err)
    return false
  }
}

/**
 * Server (service role): does this one student have a class grant?
 *
 * Deliberately three plain queries rather than one embedded join. The join is
 * one round trip and looks neater, but if PostgREST ever failed to resolve the
 * relationship the error would surface as `false` — silently removing premium
 * from every school-covered student, in a way no test here could catch, since
 * none of this can run against the real database from CI. These filters cannot
 * be misresolved.
 *
 * It costs one round trip in the common case: a student with no active
 * membership returns immediately, and today almost every student is that case.
 */
export async function fetchClassGrant(
  client: QueryClient,
  studentId: string,
  now: Date = new Date(),
): Promise<boolean> {
  try {
    const { data: memberships } = await client
      .from('class_memberships')
      .select('class_id')
      .eq('student_id', studentId)
      .eq('status', 'active')

    const classIds = (memberships ?? []).map((m: { class_id: string }) => m.class_id)
    if (classIds.length === 0) return false

    const { data: classes } = await client
      .from('classes')
      .select('school_id')
      .in('id', classIds)
      .not('school_id', 'is', null)

    const schoolIds = [...new Set((classes ?? []).map((c: { school_id: string }) => c.school_id))]
    if (schoolIds.length === 0) return false

    const { data: schools } = await client
      .from('schools')
      .select('id')
      .in('id', schoolIds)
      .gt('granted_until', now.toISOString())

    return (schools ?? []).length > 0
  } catch (err) {
    console.error('class grant lookup threw:', err)
    return false
  }
}

/**
 * Server (service role): every student id that currently has a class grant.
 *
 * For reports that classify many students at once. Reading it per student would
 * be one query each; this is three for the whole set, and it walks the
 * relationship from the other end — start from schools that are actually in
 * date, which is normally a handful of rows or none at all.
 */
export async function fetchClassGrantedStudentIds(
  client: QueryClient,
  now: Date = new Date(),
): Promise<Set<string>> {
  const granted = new Set<string>()
  try {
    const { data: schools } = await client
      .from('schools')
      .select('id')
      .gt('granted_until', now.toISOString())

    const schoolIds = (schools ?? []).map((s: { id: string }) => s.id)
    if (schoolIds.length === 0) return granted

    const { data: classes } = await client
      .from('classes')
      .select('id')
      .in('school_id', schoolIds)

    const classIds = (classes ?? []).map((c: { id: string }) => c.id)
    if (classIds.length === 0) return granted

    const { data: memberships } = await client
      .from('class_memberships')
      .select('student_id')
      .in('class_id', classIds)
      .eq('status', 'active')

    for (const m of (memberships ?? []) as { student_id: string }[]) {
      granted.add(m.student_id)
    }
    return granted
  } catch (err) {
    console.error('class grant bulk lookup threw:', err)
    return granted
  }
}
