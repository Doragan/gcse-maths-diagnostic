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

/**
 * Mint a new join code for a class, invalidating the old one immediately.
 *
 * Existing members are unaffected — membership is by class_id, not by code — so
 * this revokes a leaked code without disrupting anyone already in the class.
 * Returns the new code.
 */
export async function rotateClassCode(classId: string): Promise<string> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch(`/api/classes/${classId}/rotate-code`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.code) {
    throw new Error(json?.error ?? `Could not generate a new code (HTTP ${res.status})`)
  }
  return json.code as string
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

/**
 * Join a class by its 4-character code.
 *
 * Goes through the server (service role) rather than inserting client-side:
 * INSERT on class_memberships is REVOKE'd, and the route resolves the CODE
 * itself, so knowing the code is genuinely required to join. The old
 * `joinClass(classId)` took a class uuid, which RLS alone could not gate —
 * see 20260727_class_membership_scope.sql. Idempotent: rejoining a class you
 * previously left reactivates the existing membership.
 *
 * Returns the joined class's name, for the confirmation message.
 */
export async function joinClass(code: string): Promise<{ id: string; name: string }> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch('/api/classes/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.class) {
    if (res.status === 404) throw new Error('Code not found')
    throw new Error(json?.error ?? `Could not join the class (HTTP ${res.status})`)
  }
  return json.class as { id: string; name: string }
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

// ── Coverage (teacher-marked: which skills a class has been taught) ───────────
// Drives the dashboard's "of covered material" denominator. RLS scopes every
// read/write to classes the signed-in teacher owns (csc_teacher_* policies).

/**
 * Skill ids the teacher has marked as taught for this class. Returns [] (→ the
 * analytics falls back to the whole-curriculum denominator) if the table isn't
 * there yet — so deploying the code before applying the migration is safe.
 */
export async function getClassCoverage(classId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('class_skill_coverage')
    .select('skill_id')
    .eq('class_id', classId)
  if (error) return [] // migration not applied yet, or not the owner — no scope
  return (data ?? []).map((r: { skill_id: string }) => r.skill_id)
}

/** Marks (covered=true) or unmarks (covered=false) a set of skills for a class. */
export async function setClassCoverage(
  classId: string,
  skillIds: string[],
  covered: boolean,
): Promise<void> {
  if (skillIds.length === 0) return
  if (covered) {
    const { error } = await supabase
      .from('class_skill_coverage')
      .upsert(
        skillIds.map(skill_id => ({ class_id: classId, skill_id })),
        { onConflict: 'class_id,skill_id', ignoreDuplicates: true },
      )
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('class_skill_coverage')
      .delete()
      .eq('class_id', classId)
      .in('skill_id', skillIds)
    if (error) throw error
  }
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
// ── Invitations ───────────────────────────────────────────────────────────────
// A teacher prepares a roster by inviting EMAIL addresses to a class; the
// student still creates their own account and accepts. See
// supabase/migrations/20260915_class_invitations.sql for why it works this way
// rather than the teacher creating accounts directly, and
// 20261010_class_invitation_tokens.sql for why the emailed link carries a key.
//
// `class_invitations` denies every client role, so every call here goes through
// a service-role route — there is no direct-from-browser variant to add later.
//
// The join code is untouched. Invitations sit beside it: a pupil can still join
// by code, and a pupil who was invited can ignore the email and use the code
// instead. Neither path knows about the other.

export type StudentInvitation = {
  id: string
  class_id: string
  class_name: string
  created_at: string
}

/** What the teacher needs to act on. Mirrors lib/invitations.ts InvitationState. */
export type TeacherInvitation = {
  id: string
  email: string
  state: 'joined' | 'waiting' | 'not_sent' | 'expired' | 'withdrawn'
  created_at: string
  expires_at: string
  accepted_at: string | null
  sent_at: string | null
  /**
   * The address the pupil actually signed up with, when it differs from the one
   * invited. Null when it matches, or when nobody has accepted yet.
   *
   * Expected rather than exceptional: a school address invited and a personal
   * one used, or a younger pupil invited via a parent's address. Shown so the
   * roster reconciles instead of reading as two lists that disagree.
   */
  joined_as: string | null
}

export type ClassInvitations = {
  invitations: TeacherInvitation[]
  /**
   * False when no BREVO_API_KEY is configured, so nothing is actually emailed.
   * The teacher is told up front rather than after inviting thirty people.
   */
  emailConfigured: boolean
}

export type MyInvitations = {
  invitations: StudentInvitation[]
  /**
   * The account exists but its email is not confirmed, so the server refused to
   * look for invitations at all.
   *
   * Reported rather than swallowed because the two cases are indistinguishable
   * to a student otherwise: "your teacher has not invited you" and "we will not
   * tell you until you confirm your address" both render as an empty page. A
   * pupil told to expect an invitation, seeing nothing and given no reason,
   * concludes the product is broken — and they would be right to.
   */
  needsEmailConfirmation: boolean
}

/** What an emailed invitation link turns out to be. */
export type InvitationLookup =
  | {
      found: true
      class_name: string
      /** Masked — enough to recognise, useless for harvesting. */
      invited_email_masked: string
      already_accepted: boolean
    }
  | { found: false; reason: 'unknown' | 'expired' | 'withdrawn' | 'error' }

/**
 * What is behind an invitation link. Works with no account and no session.
 *
 * This is the call that stops the page being blank. The reverted build had
 * nothing like it, which is why a pupil holding an invitation they could not
 * match saw an empty page: there was no way to ask "what is this link?" before
 * signing up, and signing up was the step that needed explaining.
 */
export async function lookupInvitation(token: string): Promise<InvitationLookup> {
  try {
    const res = await fetch(`/api/invitations/lookup?token=${encodeURIComponent(token)}`)
    const json = await res.json().catch(() => null)
    if (!res.ok || !json) return { found: false, reason: 'error' }
    return json as InvitationLookup
  } catch {
    // Offline or a server fault. Distinguished from 'unknown' so the page can
    // say "we could not check" rather than telling a pupil with a perfectly
    // good invitation that it does not exist.
    return { found: false, reason: 'error' }
  }
}

/**
 * Pending invitations matched to the signed-in student's confirmed address.
 *
 * The fallback path, not the mechanism — the link is the mechanism. Useful when
 * the email went to spam and the pupil happens to have signed up with the
 * address their teacher typed.
 *
 * Never throws for an absent table: returns an empty result so the code can be
 * deployed before the migration is applied without breaking the classes page.
 */
export async function getMyInvitations(): Promise<MyInvitations> {
  const empty: MyInvitations = { invitations: [], needsEmailConfirmation: false }

  const session = await getSession()
  if (!session) return empty

  const res = await fetch('/api/invitations', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  // Two conditions answer 403, so match on the machine-readable code rather than
  // the status: only the unconfirmed one is worth telling a student about. A
  // teacher who somehow reached this gets nothing, which is right.
  if (res.status === 403) {
    const json = await res.json().catch(() => null)
    return { invitations: [], needsEmailConfirmation: json?.code === 'email_unconfirmed' }
  }

  // Table absent, or a server fault. Neither is the student's problem and
  // neither should take the page down.
  if (res.status === 404 || res.status === 500) return empty
  if (!res.ok) throw new Error('Could not load your invitations')

  const json = await res.json().catch(() => null)
  return {
    invitations: (json?.invitations ?? []) as StudentInvitation[],
    needsEmailConfirmation: false,
  }
}

/**
 * Accept an invitation. The student's own act — nothing joins them automatically.
 *
 * Pass `{ token }` for a link from the email, or `{ id }` for one the classes
 * page matched to their address. A token does NOT require the account's address
 * to match the invited one; an id does, and the route enforces both.
 */
export async function acceptInvitation(
  ref: { token: string } | { id: string },
): Promise<{ id: string; name: string }> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch('/api/invitations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(ref),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.class) {
    throw new Error(json?.error ?? 'Could not join the class')
  }
  return json.class as { id: string; name: string }
}

/** Teacher: every invitation on a class they own. Never includes the tokens. */
export async function getClassInvitations(classId: string): Promise<ClassInvitations> {
  const empty: ClassInvitations = { invitations: [], emailConfigured: true }

  const session = await getSession()
  if (!session) return empty

  const res = await fetch(`/api/classes/${classId}/invitations`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) return empty

  const json = await res.json().catch(() => null)
  return {
    invitations: (json?.invitations ?? []) as TeacherInvitation[],
    emailConfigured: json?.emailConfigured !== false,
  }
}

export type InviteResult = {
  invited: number
  rejected: string[]
  /** How many invitation emails Brevo accepted. */
  sent: number
  /** How many could not be emailed — a wrong address, or no key configured. */
  failed: number
  emailConfigured: boolean
}

/** Teacher: invite a pasted list, and email each new invitation. */
export async function inviteToClass(classId: string, emails: string): Promise<InviteResult> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch(`/api/classes/${classId}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ emails }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error ?? 'Could not send the invitations')
  return {
    invited: json?.invited ?? 0,
    rejected: json?.rejected ?? [],
    sent: json?.sent ?? 0,
    failed: json?.failed ?? 0,
    emailConfigured: json?.emailConfigured !== false,
  }
}

/**
 * Teacher: send one invitation's email again.
 *
 * Takes the invitation id, never the token — the teacher never holds the token,
 * so they cannot accept on a pupil's behalf. This is the recovery path for
 * "the pupil deleted the email" and for an invitation that shows as not sent.
 */
export async function resendInvitation(classId: string, id: string): Promise<boolean> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch(`/api/classes/${classId}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ resend: id }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.error ?? 'Could not send it again')
  return (json?.sent ?? 0) > 0
}

/** Teacher: withdraw a PENDING invitation. Accepted ones are left alone. */
export async function revokeInvitation(classId: string, id: string): Promise<void> {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch(`/api/classes/${classId}/invitations`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error('Could not withdraw the invitation')
}
