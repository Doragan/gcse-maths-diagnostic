import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Teacher-side class invitations: prepare a roster in advance.
//
// See 20260915_class_invitations.sql for the design. The short version: the
// teacher invites an EMAIL to a CLASS, and the student still creates their own
// account and accepts. No account is created for anybody, and no secret is
// handed out — an invitation is matched by confirmed email, not by a token.
//
// Same shape as app/api/classes/[id]/members: authenticate on the anon client,
// prove the caller owns the class, and only then reach for the service role.
// `class_invitations` denies every client role, so all access is through here.
//
//   GET    — list this class's invitations (teacher's own roster view)
//   POST   — invite a list of emails, idempotently
//   DELETE — revoke one invitation
// ─────────────────────────────────────────────────────────────────────────────

/** Pasted lists are messy. Accept commas, semicolons, whitespace and newlines. */
const SPLIT = /[\s,;]+/

/**
 * Deliberately permissive. This is a usability check to catch a mistyped entry
 * before it becomes a roster row, not an assertion that the address exists —
 * only the confirmed-email check at acceptance decides that, and it is the one
 * that actually carries weight.
 */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Guards a paste that was never a list of addresses. */
const MAX_EMAILS = 200

async function authorisedTeacher(req: Request, classId: string) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Not authenticated' as const, status: 401 }
  }
  const token = authHeader.replace('Bearer ', '')

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: { user }, error: userError } = await authClient.auth.getUser(token)
  if (userError || !user) return { error: 'Not authenticated' as const, status: 401 }

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
    return { error: 'Not found' as const, status: 404 }
  }

  return { user, admin, cls }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: classId } = await params
    const ctx = await authorisedTeacher(req, classId)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { data, error } = await ctx.admin
      .from('class_invitations')
      .select('id, email, status, created_at, expires_at, accepted_at')
      .eq('class_id', classId)
      .order('email')
    if (error) {
      console.error('invitations load failed:', error)
      return NextResponse.json({ error: 'Failed to load invitations' }, { status: 500 })
    }

    return NextResponse.json({ invitations: data ?? [] })
  } catch (err) {
    console.error('invitations GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: classId } = await params
    const ctx = await authorisedTeacher(req, classId)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const body = await req.json().catch(() => null)
    const raw = typeof body?.emails === 'string'
      ? body.emails
      : Array.isArray(body?.emails)
        ? body.emails.join(' ')
        : ''

    // Normalise to lower case here as well as constraining it in the schema:
    // the unique index is on the raw text, so without this one pupil could hold
    // two invitations by capitalisation alone.
    const candidates = [...new Set(
      raw.split(SPLIT).map((e: string) => e.trim().toLowerCase()).filter(Boolean),
    )] as string[]

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'No email addresses given' }, { status: 400 })
    }
    if (candidates.length > MAX_EMAILS) {
      return NextResponse.json(
        { error: `That is more than ${MAX_EMAILS} addresses. Please split the list.` },
        { status: 400 },
      )
    }

    const valid = candidates.filter(e => LOOKS_LIKE_EMAIL.test(e))
    const rejected = candidates.filter(e => !LOOKS_LIKE_EMAIL.test(e))

    if (valid.length === 0) {
      return NextResponse.json(
        { error: 'None of those look like email addresses', rejected },
        { status: 400 },
      )
    }

    // Upsert, so pasting the same list twice is harmless — the common case when
    // a teacher adds three new pupils to a list they already sent. `ignoreDuplicates`
    // leaves an ACCEPTED invitation alone rather than resetting it to pending,
    // which would otherwise un-join a pupil from the teacher's view.
    const { error } = await ctx.admin
      .from('class_invitations')
      .upsert(
        valid.map(email => ({ class_id: classId, email })),
        { onConflict: 'class_id,email', ignoreDuplicates: true },
      )
    if (error) {
      console.error('invitations upsert failed:', error)
      return NextResponse.json({ error: 'Failed to save invitations' }, { status: 500 })
    }

    return NextResponse.json({ invited: valid.length, rejected })
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
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

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
