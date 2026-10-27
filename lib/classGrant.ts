import { supabase } from './supabase'

/**
 * The CLASS arm of the entitlement union (docs/audit/20-school-accounts-design.md).
 *
 *   student premium = personal grant OR class grant
 *
 *   class grant : an ACTIVE class_memberships row, then EITHER
 *                 (a) -> classes.school_id  -> schools.granted_until  > now
 *                 (b) -> classes.teacher_id -> teachers.paid_until    > now
 *
 * ── Why there are two arms ─────────────────────────────────────────────────
 * Two kinds of customer, arriving differently. A SCHOOL is provisioned by hand:
 * a `schools` row attached to the teacher's classes. A TUTOR is self-serve and
 * pays for themselves, which the Stripe webhook records on `teachers.paid_until`.
 * Arm (b) is what makes the money they paid reach their students; without it a
 * paying tutor's class stayed on the free tier.
 *
 * Arm (b) also resolves through the class's OWNER rather than an attached
 * school, so a class created after payment is covered the moment it exists.
 * Arm (a) attaches classes as they are at the time, which is why the
 * provisioning runbook has to warn that a class made later gets nothing.
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
 * Deliberately plain queries rather than embedded joins. A join is one round
 * trip and looks neater, but if PostgREST ever failed to resolve the
 * relationship the error would surface as `false` — silently removing premium
 * from every covered student, in a way no test here could catch, since none of
 * this can run against the real database from CI. These filters cannot be
 * misresolved.
 *
 * It still costs one round trip in the common case: a student with no active
 * membership returns immediately, and today almost every student is that case.
 * A covered student costs three, or four if arm (a) is checked and misses —
 * and the arms are ordered so the provisioned-school case, which is the one
 * with a human waiting on a trial, short-circuits first.
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

    // Both owning columns in ONE read, because both arms need this row set and
    // asking twice would be a second round trip for the same answer.
    const { data: classes } = await client
      .from('classes')
      .select('school_id, teacher_id')
      .in('id', classIds)

    const rows = (classes ?? []) as Array<{ school_id: string | null; teacher_id: string | null }>

    // ── Arm (a): an attached school with a live grant ────────────────────────
    const schoolIds = [...new Set(rows.map(c => c.school_id).filter((id): id is string => !!id))]
    if (schoolIds.length > 0) {
      const { data: schools } = await client
        .from('schools')
        .select('id')
        .in('id', schoolIds)
        .gt('granted_until', now.toISOString())
      if ((schools ?? []).length > 0) return true
    }

    // ── Arm (b): the class's OWNER holds a pass ──────────────────────────────
    // ⚠ Reached whether or not arm (a) found a school. The previous version
    // returned false as soon as no class had a school_id, which is precisely
    // the case a self-serve tutor is in: they have never been provisioned a
    // `schools` row, so every one of their classes has a null school_id. An
    // early return there would have made this arm unreachable for exactly the
    // customers it exists for.
    const teacherIds = [...new Set(rows.map(c => c.teacher_id).filter((id): id is string => !!id))]
    if (teacherIds.length === 0) return false

    const { data: teachers } = await client
      .from('teachers')
      .select('id')
      .in('id', teacherIds)
      .gt('paid_until', now.toISOString())

    return (teachers ?? []).length > 0
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
