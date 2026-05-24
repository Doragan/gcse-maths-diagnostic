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
      },
    },
  })
  if (error) throw error
  return data
}

export async function getStudentProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
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