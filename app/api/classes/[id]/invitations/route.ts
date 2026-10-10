import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  parseEmailList, invitationState, acceptedElsewhere, invitationEmail, acceptUrl, MAX_EMAILS,
} from '../../../../../lib/invitations'
import { sendTransactionalEmail, isEmailConfigured } from '../../../../../lib/email/brevo'
import { emailSendBudget } from '../../../../../lib/rateLimit'

// ─────────────────────────────────────────────────────────────────────────────
// Teacher-side class invitations: prepare a roster in advance, and see who has
// not joined.
//
// Design: supabase/migrations/20260915_class_invitations.sql, amended by
// 20261010_class_invitation_tokens.sql. docs/audit/20 §10. The short version:
// the teacher invites an EMAIL to a CLASS, and the student still creates their
// own account and accepts. No account is created for anybody.
//
// Same shape as app/api/classes/[id]/members: authenticate on the anon client,
// prove the caller owns the class, and only then reach for the service role.
// `class_invitations` denies every client role, so all access is through here.
//
// ⚠ THE TOKEN IS NEVER RETURNED TO THE TEACHER. Not in GET, not in POST. The
// email is sent server-side, and re-sending takes an invitation id. A teacher
// who could read the token out of their own dashboard could accept on a pupil's
// behalf, which would hand them exactly the "no student act anywhere" power the
// whole design exists to withhold — see docs/audit/20 §10 cost 2. This is the
// reason the response shapes below look more awkward than they need to.
//
//   GET    — this class's invitations, with their state
//   POST   — invite a list of emails and email each one; or re-send one
//   DELETE — withdraw one pending invitation
// ─────────────────────────────────────────────────────────────────────────────

type TeacherContext = {
  user: { id: string }
  admin: SupabaseClient
  cls: { id: string; name: string; teacher_id: string }
}

type AuthFailure = { error: string; status: number }

async function authorisedTeacher(
  req: Request,
  classId: string,
): Promise<TeacherContext | AuthFailure> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Not authenticated', status: 401 }
  }
  const token = authHeader.replace('Bearer ', '')

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: { user }, error: userError } = await authClient.auth.getUser(token)
  if (userError || !user) return { error: 'Not authenticated', status: 401 }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // 404 rather than 403 for a non-owner, so a stranger cannot confirm that a
  // class id exists. Mirrors the members route.
  const { data: cls } = await admin
    .from('classes')
    .select('id, name, teacher_id')
    .eq('id', classId)
    .single()
  if (!cls || cls.teacher_id !== user.id) {
    return { error: 'Not found', status: 404 }
  }

  return { user, admin, cls }
}

function isFailure(ctx: TeacherContext | AuthFailure): ctx is AuthFailure {
  return 'error' in ctx
}

/**
 * Absolute origin for the link that goes in the email.
 *
 * NEXT_PUBLIC_SITE_URL first, because the request host is whatever the proxy
 * says it is and a wrong value here puts a wrong link in a child's inbox.
 */
function siteOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured
  return new URL(req.url).origin
}

/**
 * Who accepted each invitation, by email address.
 *
 * Looked up through the auth admin API rather than a join, because the address
 * lives in auth.users and `students` does not carry it. Only fetched for
 * invitations that were actually accepted, so a roster of thirty pending
 * invitations makes no extra calls.
 *
 * Used to show the teacher that a pupil joined on a different address from the
 * one invited — the expected case for a personal address or a parent's.
 */
async function acceptedEmails(
  admin: SupabaseClient,
  studentIds: string[],
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>()
  await Promise.all(studentIds.map(async id => {
    const { data, error } = await admin.auth.admin.getUserById(id)
    out.set(id, error ? null : (data.user?.email ?? null))
  }))
  return out
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: classId } = await params
    const ctx = await authorisedTeacher(req, classId)
    if (isFailure(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { data, error } = await ctx.admin
      .from('class_invitations')
      .select('id, email, status, created_at, expires_at, accepted_at, sent_at, accepted_by')
      .eq('class_id', classId)
      .order('email')
    if (error) {
      console.error('invitations load failed:', error)
      return NextResponse.json({ error: 'Failed to load invitations' }, { status: 500 })
    }

    const rows = data ?? []
    const acceptedBy = rows
      .map(r => r.accepted_by)
      .filter((id): id is string => Boolean(id))
    const emails = acceptedBy.length ? await acceptedEmails(ctx.admin, acceptedBy) : new Map()

    const invitations = rows.map(r => {
      const joinedAs = r.accepted_by ? emails.get(r.accepted_by) ?? null : null
      return {
        id: r.id,
        email: r.email,
        state: invitationState(r),
        created_at: r.created_at,
        expires_at: r.expires_at,
        accepted_at: r.accepted_at,
        sent_at: r.sent_at,
        // Shown only when it differs, so the roster reconciles instead of
        // looking like two disagreeing lists.
        joined_as: acceptedElsewhere(r.email, joinedAs) ? joinedAs : null,
      }
    })

    // Surfaced so the teacher's page can say "invitations are not being emailed"
    // up front, rather than after they have invited thirty people.
    return NextResponse.json({ invitations, emailConfigured: isEmailConfigured() })
  } catch (err) {
    console.error('invitations GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * Email one invitation and record whether it went.
 *
 * Reads the token itself and never returns it. `sent_at` is set only on success,
 * so a failed send leaves the row looking exactly like one that was never
 * attempted — which is true, from the pupil's point of view, and is what the
 * teacher needs to act on.
 */
async function deliver(
  ctx: TeacherContext,
  invitation: { id: string; email: string; token: string },
  origin: string,
  teacherName: string | null,
): Promise<boolean> {
  // The global daily cap on outbound email (audit F4). Claimed per message,
  // immediately before sending, and only after the invitation row is already
  // written — so a refusal costs a notification, never the data.
  //
  // This route is the heaviest email caller in the app: one request can ask for
  // 200 sends. It composes exactly with `sent_at` — a suppressed invitation
  // keeps sent_at null, so it shows as "Not sent" on the teacher's roster with
  // a Send button, which is precisely the state they need to see and act on.
  const budget = await emailSendBudget()
  if (!budget.ok) {
    console.error(`invitation ${invitation.id} not emailed: ${budget.reason}`)
    return false
  }

  const { subject, text } = invitationEmail({
    className: ctx.cls.name,
    teacherName,
    acceptUrl: acceptUrl(origin, invitation.token),
  })

  const result = await sendTransactionalEmail({ to: invitation.email, subject, text })
  if (!result.ok) {
    if (result.reason === 'send_failed') {
      // Logged without the address: this line goes to a shared log and the
      // recipients are children. The invitation id is enough to find the row.
      console.error(`invitation ${invitation.id} send failed: ${result.detail}`)
    }
    return false
  }

  await ctx.admin
    .from('class_invitations')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', invitation.id)
  return true
}

/**
 * Who the invitation says it is from.
 *
 * Always null — "Your teacher" — and that is a decision, not a gap.
 *
 * `teachers` carries no display_name (checked against the live schema on
 * 2026-10-10: id, email, created_at, paid_until, free_assessments_used,
 * is_admin), so the only name available is the teacher's EMAIL ADDRESS. Putting
 * that in front of a whole class discloses an adult's personal address — which
 * for a sole tutor is very often their own gmail — to thirty children, on their
 * behalf and without being asked. That is not mine to decide, so it is not sent.
 *
 * The class name does the identifying work instead; the tutor has told the group
 * what the class is called. If a named sender is wanted later, the right fix is
 * a display_name on `teachers` that the teacher fills in themselves, not reusing
 * their login address. `invitationEmail` already takes the name.
 */
function inviterName(): string | null {
  return null
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: classId } = await params
    const ctx = await authorisedTeacher(req, classId)
    if (isFailure(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const body = await req.json().catch(() => null)
    const origin = siteOrigin(req)

    // ── Re-send one existing invitation ──────────────────────────────────────
    // Takes an id, never a token, so the teacher never holds the credential.
    // This is how a tutor recovers the "pupil deleted the email" case, and the
    // "it was never sent" case that sent_at exists to make visible.
    if (typeof body?.resend === 'string' && body.resend) {
      const { data: invitation } = await ctx.admin
        .from('class_invitations')
        .select('id, email, token, status')
        .eq('id', body.resend)
        .eq('class_id', classId)
        .maybeSingle()

      if (!invitation || invitation.status !== 'pending') {
        return NextResponse.json(
          { error: 'That invitation is no longer waiting to be accepted' },
          { status: 404 },
        )
      }

      const sent = await deliver(ctx, invitation, origin, inviterName())
      return NextResponse.json({ sent: sent ? 1 : 0, failed: sent ? 0 : 1 })
    }

    // ── Invite a pasted list ─────────────────────────────────────────────────
    const raw = typeof body?.emails === 'string'
      ? body.emails
      : Array.isArray(body?.emails)
        ? body.emails.join(' ')
        : ''

    const { valid, rejected } = parseEmailList(raw)

    if (valid.length === 0 && rejected.length === 0) {
      return NextResponse.json({ error: 'No email addresses given' }, { status: 400 })
    }
    if (valid.length + rejected.length > MAX_EMAILS) {
      return NextResponse.json(
        { error: `That is more than ${MAX_EMAILS} addresses. Please split the list.` },
        { status: 400 },
      )
    }
    if (valid.length === 0) {
      return NextResponse.json(
        { error: 'None of those look like email addresses', rejected },
        { status: 400 },
      )
    }

    // Upsert, so pasting the same list twice is harmless — the common case when
    // a teacher adds three new pupils to a list they already sent.
    // `ignoreDuplicates` leaves an existing invitation alone rather than
    // resetting it, which would otherwise re-issue a token that is already in
    // somebody's inbox and un-join an accepted pupil from the teacher's view.
    const { error: upsertErr } = await ctx.admin
      .from('class_invitations')
      .upsert(
        valid.map(email => ({ class_id: classId, email })),
        { onConflict: 'class_id,email', ignoreDuplicates: true },
      )
    if (upsertErr) {
      console.error('invitations upsert failed:', upsertErr)
      return NextResponse.json({ error: 'Failed to save invitations' }, { status: 500 })
    }

    // Read back to get the tokens — including for rows that already existed,
    // whose token must NOT be regenerated. Only pending ones are emailed: an
    // accepted invitation needs nothing, and re-mailing it would tell a pupil
    // who already joined to join again.
    const { data: toSend } = await ctx.admin
      .from('class_invitations')
      .select('id, email, token, sent_at')
      .eq('class_id', classId)
      .eq('status', 'pending')
      .in('email', valid)

    const teacherName = inviterName()

    // Only mail the ones that have not been mailed already, so re-pasting a
    // list of thirty to add one pupil sends one email, not thirty.
    const pending = (toSend ?? []).filter(i => !i.sent_at)

    let sent = 0
    for (const invitation of pending) {
      if (await deliver(ctx, invitation, origin, teacherName)) sent++
    }

    return NextResponse.json({
      invited: valid.length,
      rejected,
      sent,
      failed: pending.length - sent,
      emailConfigured: isEmailConfigured(),
    })
  } catch (err) {
    console.error('invitations POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: classId } = await params
    const ctx = await authorisedTeacher(req, classId)
    if (isFailure(ctx)) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const body = await req.json().catch(() => null)
    const invitationId = typeof body?.id === 'string' ? body.id : ''
    if (!invitationId) {
      return NextResponse.json({ error: 'Which invitation?' }, { status: 400 })
    }

    // Revoked, not deleted, and scoped to this class so a teacher cannot revoke
    // an invitation belonging to someone else's class by guessing its id.
    //
    // An ACCEPTED invitation is deliberately left alone: revoking it would say
    // the pupil is no longer invited while their membership continues, which is
    // two sources of truth disagreeing. Removing a pupil who has already joined
    // is a different action on class_memberships, and is not this route's job.
    //
    // Withdrawing is what makes a leaked link safe: the token stays valid
    // looking but `status = 'revoked'` fails the acceptance query.
    const { error } = await ctx.admin
      .from('class_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)
      .eq('class_id', classId)
      .eq('status', 'pending')
    if (error) {
      console.error('invitation revoke failed:', error)
      return NextResponse.json({ error: 'Failed to revoke' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('invitations DELETE error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
