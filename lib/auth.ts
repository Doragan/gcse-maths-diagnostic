import { supabase } from './supabase'
import { trackEvent } from './analytics'

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

/**
 * Starts the Google OAuth redirect flow.
 *
 * Google carries no notion of teacher-vs-student, so we thread the intended role
 * through the callback URL — /auth/callback reads it to provision the right
 * account row (see app/api/auth/provision). `prompt: select_account` forces the
 * Google account chooser rather than silently reusing a signed-in Google session.
 * The plain browser client (detectSessionInUrl on by default) exchanges the code
 * for a session and stores it in localStorage when Google redirects back.
 */
export async function signInWithGoogle(role: 'teacher' | 'student') {
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://mathsense.net'
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?role=${role}`,
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

/**
 * Migrate anonymous practice attempts (stored in localStorage by the practice
 * page so they survive an email-confirmation / OAuth round-trip) into the newly
 * signed-in account — so the "save your progress" nudge is actually true and the
 * student doesn't land on an empty dashboard. Idempotent: clears the store on
 * success, so it's safe to call from the student login page and the OAuth
 * callback alike.
 */
export async function migratePendingPractice(studentId: string) {
  if (typeof window === 'undefined') return
  let pending: Array<{ question_id: string; skill_ids: string[]; correct: boolean; kind?: string }> = []
  try { pending = JSON.parse(localStorage.getItem('pending_practice') ?? '[]') } catch { pending = [] }
  if (!Array.isArray(pending) || pending.length === 0) return
  const rows = pending.slice(-200).map(a => ({
    student_id:  studentId,
    question_id: a.question_id,
    skill_ids:   a.skill_ids,
    correct:     a.correct,
    kind:        a.kind ?? 'mastery',
  }))
  const { error } = await supabase.from('practice_attempts').insert(rows)
  if (error) { console.error('Failed to migrate pending practice:', error.message); return }
  localStorage.removeItem('pending_practice')
  trackEvent('pending_practice_migrated', { count: rows.length })
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