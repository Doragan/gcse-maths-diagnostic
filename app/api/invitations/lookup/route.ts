import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { invitationState, maskEmail } from '../../../../lib/invitations'
import { rateLimitLookup } from '../../../../lib/rateLimit'

// ─────────────────────────────────────────────────────────────────────────────
// Look up one invitation by the token from the emailed link. NO AUTH REQUIRED.
//
// THIS ROUTE EXISTS TO FIX THE BUG THAT GOT THE FEATURE REVERTED. The complaint
// was that an invitation was "matched on an invisible key, so a pupil who signs
// up with a personal address rather than their school one sees an empty page and
// no explanation". A join code at least answers "code not found". This route is
// how the invitation page gets something definite to say — before the pupil has
// an account, which is precisely when they need it most.
//
// ── Why unauthenticated is right, and what it does not give away ────────────
//
// The visitor is holding a token that was emailed to one address and nowhere
// else, and they have no account yet, so there is no session to check. Refusing
// to say anything until they sign up is what produced the empty page.
//
// It returns the CLASS NAME and nothing else about the class: no roster, no
// teacher, no other invitations, no member list. The invited address is returned
// MASKED (a***a@school.uk), which is enough for a pupil to recognise their own
// address and useless for harvesting one.
//
// It is not an existence oracle for accounts or classes either: a token is 122
// bits of random, so it cannot be guessed, and an unknown token answers exactly
// the same way as a revoked or expired one from the caller's point of view —
// `found: false` — with the only distinction being the one we WANT to draw, so
// a pupil whose invitation expired is told that rather than left guessing.
//
// ⚠ It grants NOTHING. Acceptance is POST /api/invitations with a confirmed
// student session; see that route. This only answers "what is this link?".
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    // Unauthenticated, and it runs a service-role query, so it gets the same
    // guard as the other public lookups (audit S3 — see app/api/classes/lookup
    // and app/api/assessment/lookup). A 122-bit token is not enumerable the way
    // a 4-character join code is, so this is throttling the unauthenticated
    // database hit rather than protecting the token space.
    if (!(await rateLimitLookup(req)).ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const token = new URL(req.url).searchParams.get('token')?.trim()
    if (!token) {
      return NextResponse.json({ error: 'No invitation token given' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { data, error } = await admin
      .from('class_invitations')
      .select('id, email, status, expires_at, sent_at, class_id, classes(name)')
      .eq('token', token)
      .maybeSingle()

    if (error) {
      console.error('invitation lookup failed:', error)
      return NextResponse.json({ error: 'Could not check that invitation' }, { status: 500 })
    }

    // Unknown token. Said plainly, with the page offering the recovery path —
    // ask the teacher to re-send, or join with a class code instead.
    if (!data) {
      return NextResponse.json({ found: false, reason: 'unknown' })
    }

    const state = invitationState(data)

    // Expired and withdrawn are reported as themselves rather than folded into
    // "unknown", because the pupil's next step differs: an expired invitation
    // means ask for a new one, a withdrawn one means ask whether they should be
    // in the class at all.
    if (state === 'expired' || state === 'withdrawn') {
      return NextResponse.json({ found: false, reason: state })
    }

    const cls = data.classes as unknown as { name?: string } | null

    return NextResponse.json({
      found: true,
      // Not the invitation id: acceptance is by token, and handing out a second
      // identifier for the same row only widens what has to be kept straight.
      //
      // The CLASS id, though, is needed: the page compares it against the
      // viewer's own classes so it can say "you are already in this class"
      // instead of letting them burn a place that is not theirs. Safe to
      // return — /api/classes/lookup already hands out a class id to anyone
      // holding a join code, and an id alone grants nothing without a
      // membership that only RLS can create.
      class_id: data.class_id,
      class_name: cls?.name ?? 'a class',
      invited_email_masked: maskEmail(data.email),
      // 'joined' here means somebody already accepted this invitation. The page
      // tells the visitor so instead of letting them press a button that will
      // fail — and if it was not them, that is worth their teacher knowing.
      already_accepted: state === 'joined',
    })
  } catch (err) {
    console.error('invitation lookup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
