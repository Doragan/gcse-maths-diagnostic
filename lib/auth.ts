import { supabase } from './supabase'

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
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
  const response = await fetch('/api/account/delete', { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete account')
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

export async function getStudentProfile() {
  // getSession() reads the JWT locally (no network round-trip), unlike getUser()
  // which revalidates against the auth server. The students fetch below is still
  // RLS-protected — the server validates the token regardless — so this just
  // keeps the slow auth call off the critical path on first load (e.g. /practice).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return null
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
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

export async function getUserRole(): Promise<'teacher' | 'student' | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', user.id)
    .single()
  if (teacher) return 'teacher'

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', user.id)
    .single()
  if (student) return 'student'

  return null
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