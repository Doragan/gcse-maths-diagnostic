import { supabase } from './supabase'
import { getSession } from './auth'

// Client helpers for the Phase 0 class identity layer.
//
// Split of responsibility:
//   * Teacher writes (create) + the cross-account roster read go through server
//     API routes (service role).
//   * Student membership writes (join / leave) and the student's own "my classes"
//     read happen client-side, gated by RLS (auth.uid() = student_id).

export type TeacherClass = {
  id: string
  name: string
  code: string
  created_at: string
}

export type ClassMember = {
  student_id: string
  display_name: string
  year_group: string | null
  joined_at: string
}

export type StudentClass = {
  class_id: string
  name: string
  code: string
  joined_at: string
}

// ── Teacher ──────────────────────────────────────────────────────────────────

export async function createClass(name: string): Promise<TeacherClass> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch('/api/classes/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ name }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.class) {
    throw new Error(json?.error ?? `Failed to create class (HTTP ${res.status})`)
  }
  return json.class as TeacherClass
}

export async function getTeacherClasses(): Promise<TeacherClass[]> {
  // RLS (classes_teacher_select) scopes this to the signed-in teacher's classes.
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, code, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as TeacherClass[]
}

export async function getClassMembers(classId: string): Promise<ClassMember[]> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch(`/api/classes/${classId}/members`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error ?? `Failed to load members (HTTP ${res.status})`)
  }
  return (json?.members ?? []) as ClassMember[]
}

// ── Student ──────────────────────────────────────────────────────────────────

export async function lookupClass(code: string): Promise<{ id: string; name: string }> {
  const res = await fetch(`/api/classes/lookup?code=${encodeURIComponent(code.trim().toUpperCase())}`)
  if (!res.ok) throw new Error('Code not found')
  return res.json()
}

export async function joinClass(classId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { error } = await supabase
    .from('class_memberships')
    .insert({ class_id: classId, student_id: user.id })

  if (error) {
    // 23505 = already a member (the (class_id, student_id) unique row exists,
    // possibly with status 'left'). Reactivate it instead. We update only
    // status/left_at — the identity columns are REVOKE'd from the client.
    if ((error as { code?: string }).code === '23505') {
      const { error: upErr } = await supabase
        .from('class_memberships')
        .update({ status: 'active', left_at: null })
        .eq('class_id', classId)
        .eq('student_id', user.id)
      if (upErr) throw upErr
      return
    }
    throw error
  }
}

export async function leaveClass(classId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { error } = await supabase
    .from('class_memberships')
    .update({ status: 'left', left_at: new Date().toISOString() })
    .eq('class_id', classId)
    .eq('student_id', user.id)
  if (error) throw error
}

export async function getStudentClasses(): Promise<StudentClass[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // The embedded `classes` row is readable via the classes_member_select policy.
  const { data, error } = await supabase
    .from('class_memberships')
    .select('class_id, joined_at, classes(name, code)')
    .eq('student_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
  if (error) throw error

  return (data ?? []).map((m: any) => ({
    class_id: m.class_id,
    name: m.classes?.name ?? 'Class',
    code: m.classes?.code ?? '',
    joined_at: m.joined_at,
  }))
}
