import { supabase } from './supabase'
import { applyAccountCourse } from './skills/accountCourse'
import { trackEvent } from './analytics'
import { PENDING_KEY, pendingPracticeRows } from './pendingPractice'
import { fetchMyClassGrant } from './classGrant'

/**
 * Teacher signup.
 *
 * `displayName` is OPTIONAL and goes into the auth user's metadata, from where
 * handle_new_user copies it onto the teachers row (20261013_teacher_display_name).
 * It is what invitation emails use to say who sent them; blank means they stay
 * "Your teacher" until it is set on /account.
 *
 * No `role` is set, and that is load-bearing: handle_new_user returns early for
 * role = 'student', so a teacher signup must NOT carry one. Only pass metadata
 * when there is something to pass, to keep this identical to the old call
 * otherwise.
 */
export async function signUp(email: string, password: string, displayName?: string) {
  const name = displayName?.trim()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    ...(name ? { options: { data: { display_name: name } } } : {}),
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const OAUTH_ROLE_KEY = 'oauth_intended_role'

/**
 * Starts the Google OAuth redirect flow.
 *
 * Google carries no notion of teacher-vs-student, so we stash the intended role
 * in localStorage and hand Supabase a CLEAN callback URL (no query string). The
 * query string was a liability: Supabase's redirect allow-list matching is picky
 * about it, which silently bounced sign-ins to the Site URL. A bare
 * `/auth/callback` matches an exact allow-list entry on every host. The callback
 * reads the role back from localStorage (see app/auth/callback).
 *
 * `prompt: select_account` forces the Google account chooser rather than silently
 * reusing a signed-in Google session. The plain browser client (detectSessionInUrl
 * on by default) exchanges the code for a session on the way back.
 */
export async function signInWithGoogle(role: 'teacher' | 'student') {
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://mathsense.net'
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(OAUTH_ROLE_KEY, role) } catch { /* storage disabled */ }
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw error
}

export async function signOut() {
  // Clear the per-session student-id cache so a subsequent sign-in (e.g. a
  // different account in the same tab) doesn't read a stale id.
  if (typeof window !== 'undefined') sessionStorage.removeItem(STUDENT_ID_CACHE_KEY)
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function sendPasswordResetEmail(email: string) {
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://mathsense.net'
    
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw error
}

export async function deleteAccount() {
  // This sent NO credentials at all. The route read the session from cookies,
  // and this client keeps it in localStorage, so there was never a cookie to
  // read: every call answered 401 and the generic message below hid it. Account
  // deletion has therefore never worked, for teachers or students.
  //
  // Send the token the way every other authenticated route in this app expects.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('You are not signed in.')

  const response = await fetch('/api/account/delete', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (!response.ok) {
    // Surface what the server actually said. Swallowing it is what made this
    // invisible: a 401 and a foreign-key failure looked identical from here.
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || 'Failed to delete account')
  }
}

export async function signUpStudent(
  email: string,
  password: string,
  displayName: string,
  emailReminders: boolean = false,
  yearGroup?: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'student',
        display_name: displayName,
        year_group: yearGroup ?? '',
        // Opt-in consent for practice-reminder emails. Stored in the auth user's
        // metadata — the lawful basis the re-engagement cron checks
        // (app/api/cron/reengagement). Defaults to false: never email someone who
        // didn't actively tick the box.
        email_reminders: emailReminders,
      },
    },
  })
  if (error) throw error
  return data
}

/**
 * Migrate anonymous practice attempts (stored in localStorage by the practice
 * page so they survive an email-confirmation / OAuth round-trip) into the newly
 * signed-in account — so the "save your progress" nudge is actually true and the
 * student doesn't land on an empty dashboard. Idempotent: clears the store on
 * success, so it's safe to call from the student login page and the OAuth
 * callback alike.
 */
/** A placement test taken signed-out, waiting for an account (app/student/diagnostic). */
export const PENDING_PLACEMENT_KEY = 'pending_diagnostic'

/**
 * Imports everything a student did signed-out: anonymous practice AND an
 * anonymous placement test. Every login path calls this — email login, the
 * confirmation-link auto-login and both Google branches — which is the point:
 * the placement import used to live only in the email handler, so Google
 * sign-ups silently lost their test.
 *
 * Returns how many rows each store contributed, so a caller can route a
 * student who has just taken the test to their dashboard rather than back into
 * the test.
 */
export async function migratePendingPractice(studentId: string): Promise<{ practice: number; placement: number }> {
  if (typeof window === 'undefined') return { practice: 0, placement: 0 }
  const practice = await migrateStore(PENDING_KEY, studentId, null, 'pending_practice_migrated')
  const placement = await migrateStore(PENDING_PLACEMENT_KEY, studentId, 'placement', 'pending_diagnostic_migrated')
  return { practice, placement }
}

async function migrateStore(
  key: string,
  studentId: string,
  forceKind: 'placement' | null,
  event: string,
): Promise<number> {
  let raw: unknown = []
  try { raw = JSON.parse(localStorage.getItem(key) ?? '[]') } catch { raw = [] }
  // Placement stores written before kind existed carry none — stamp it, or the
  // rows would land as ordinary practice.
  if (forceKind && Array.isArray(raw)) {
    raw = raw.map(a => (typeof a === 'object' && a !== null ? { ...a, kind: forceKind } : a))
  }
  const rows = pendingPracticeRows(raw, studentId, Date.now())
  if (rows.length === 0) {
    // Nothing usable — but if the store held something (all malformed), clear it
    // so it isn't re-parsed on every login for the life of the browser.
    localStorage.removeItem(key)
    return 0
  }
  const { error } = await supabase.from('practice_attempts').insert(rows)
  if (error) { console.error(`Failed to migrate ${key}:`, error.message); return 0 }
  localStorage.removeItem(key)
  trackEvent(event, { count: rows.length })
  return rows.length
}

export async function getStudentProfile() {
  // getSession() reads the JWT locally (no network round-trip), unlike getUser()
  // which revalidates against the auth server. The students fetch below is still
  // RLS-protected — the server validates the token regardless — so this just
  // keeps the slow auth call off the critical path on first load (e.g. /practice).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return null
  // The class grant is fetched ALONGSIDE the profile, not after it: the RPC
  // identifies the caller itself, so it depends on nothing here and costs no
  // extra latency.
  //
  // Attaching it to the profile — rather than threading a second boolean
  // through every page — is what lets the existing `isPaidStudent(profile)`
  // call sites in /practice, /skill/[slug] and the student dashboard pick up
  // school-granted access without being touched. One place reads the grant;
  // one function decides what it means.
  const [{ data }, activeClassMembership] = await Promise.all([
    supabase.from('students').select('*').eq('id', user.id).single(),
    fetchMyClassGrant(),
  ])
  if (!data) return data
  // Push the account course into the per-browser qualification and tier.
  //
  // Done HERE because it is the one place every caller already goes through,
  // so no page has to remember to do it, and a student who signs in on a new
  // device is on their own course before the first render that reads it.
  // getQualification() and getTier() stay synchronous and simply find the
  // right answer already in storage. No-ops when course_id is null.
  applyAccountCourse(data)
  return { ...data, activeClassMembership }
}

const STUDENT_ID_CACHE_KEY = 'cached_student_id'

/**
 * Returns the signed-in student's id, cached for the browser session.
 *
 * The practice flow navigates to a fresh `/practice/question/[id]` page per
 * question, and previously re-ran getStudentProfile() (an auth.getUser() + a
 * students-table fetch) on every navigation. The id is stable for the session,
 * so we resolve it once and cache it — empty string is stored to mean
 * "resolved, but anonymous" so anonymous users don't re-hit the network either.
 * Cleared on signOut().
 */
export async function getCachedStudentId(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(STUDENT_ID_CACHE_KEY)
    if (cached !== null) return cached === '' ? null : cached
  }
  const profile = await getStudentProfile()
  const id = profile?.id ?? null
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STUDENT_ID_CACHE_KEY, id ?? '')
  }
  return id
}

/**
 * Seeds the session student-id cache from an already-resolved profile.
 *
 * The /practice page fetches the full student profile on mount; without this,
 * the first question page would hit getCachedStudentId() as a cache miss and
 * repeat the auth.getUser() + students fetch. Calling this once the practice
 * page's profile has loaded lets that first question skip the round trip.
 * Pass null to mean "resolved, but anonymous" (mirrors getCachedStudentId).
 */
export function primeStudentIdCache(id: string | null) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STUDENT_ID_CACHE_KEY, id ?? '')
  }
}

/**
 * What kind of account an id belongs to — and crucially, whether we could tell.
 *
 * ⚠ 'none' AND 'unknown' ARE DIFFERENT, and collapsing them is a bug that has
 * already shipped once. app/invite/[token] used getStudentProfile() and treated
 * a null result as "this is a teacher", when all a null actually means is "no
 * students row came back" — which is also what a failed query looks like. A
 * genuine student whose lookup hiccupped was told they were a teacher and sent
 * to the teacher dashboard. Anything deciding what to SAY to someone needs the
 * distinction; anything deciding what to ALLOW can treat both as a refusal.
 *
 *   teacher  a teachers row exists
 *   student  a students row exists and no teachers row does
 *   none     neither row exists, and both lookups succeeded in saying so
 *   unknown  at least one lookup failed, so the answer is not known
 *
 * maybeSingle(), not single(): zero rows is an ANSWER here, not an error, and
 * single() reports it as one. That conflation is what made the two cases
 * indistinguishable in the first place.
 *
 * Takes an id rather than reading the session, so a caller that already has the
 * user — the invitation page does — pays for no extra auth round trip.
 */
export type AccountRole = 'teacher' | 'student' | 'none' | 'unknown'

export async function accountRoleFor(userId: string): Promise<AccountRole> {
  // Independent lookups, so they go together. Teacher wins if somehow both
  // exist, matching the precedence getUserRole has always had.
  const [teacher, student] = await Promise.all([
    supabase.from('teachers').select('id').eq('id', userId).maybeSingle(),
    supabase.from('students').select('id').eq('id', userId).maybeSingle(),
  ])
  if (teacher.error || student.error) return 'unknown'
  if (teacher.data) return 'teacher'
  if (student.data) return 'student'
  return 'none'
}

/**
 * The role of the signed-in user, or null.
 *
 * Behaviour-preserving wrapper over accountRoleFor: 'none' and 'unknown' both
 * flatten to null, exactly as the old implementation did, so requireTeacher and
 * every other caller are unaffected. Prefer accountRoleFor when the difference
 * matters to what the user is told.
 */
export async function getUserRole(): Promise<'teacher' | 'student' | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const role = await accountRoleFor(user.id)
  return role === 'teacher' || role === 'student' ? role : null
}

/**
 * Client-side route guard: resolves true only if the signed-in user is a
 * teacher (has a `teachers` row). The teacher dashboard pages call this and
 * redirect non-teachers, so a signed-in *student* can't render the teacher UI.
 *
 * This is a UX/navigation guard only — actual data access is still enforced by
 * RLS (assessments/classes are scoped to the owning teacher_id) and by the
 * teachers-row checks in the privileged API routes. The guard just stops the
 * wrong UI from showing.
 */
export async function requireTeacher(): Promise<boolean> {
  return (await getUserRole()) === 'teacher'
}