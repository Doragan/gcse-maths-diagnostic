import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { invitationState } from '../../../../lib/invitations'
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

/**
 * Show enough of an address to be recognised by its owner, no more.
 *
 * a.pupil@school.sch.uk -> a******l@school.sch.uk
 *
 * The domain is left intact deliberately: it is the part that tells a pupil
 * "this went to your school address, not your personal one", which is the whole
 * confusion this page exists to clear up. A domain is not personal data; the
 * local part is.
 */
function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 1) return '•••'
  const local = email.slice(0, at)
  const domain = email.slice(at)
  if (local.length <= 2) return `${local[0]}•${domain}`
  return `${local[0]}${'•'.repeat(Math.min(local.length - 2, 6))}${local[local.length - 1]}${domain}`
}

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
