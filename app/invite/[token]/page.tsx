'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getStudentProfile } from '../../../lib/auth'
import { supabase } from '../../../lib/supabase'
import {
  lookupInvitation, acceptInvitation, type InvitationLookup,
} from '../../../lib/classes'
import { PENDING_INVITE_KEY } from '../../../lib/invitations'
import {
  colors, font, card, pageContainer, pageTitle,
  primaryButton, secondaryButton, sectionTitle,
} from '../../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// Where an emailed class invitation lands.
//
// THIS PAGE IS THE FIX FOR WHAT GOT THE FEATURE REVERTED. The reverted build
// had no page of its own: an invitation was matched on the student's email
// address behind the scenes, so a pupil who signed up with a personal address
// rather than the school one their teacher typed landed on their classes page
// and saw NOTHING — indistinguishable from never having been invited. The
// revert note put it exactly right: a join code is explicit and self-checking,
// because typing it wrong says "code not found".
//
// So the rule for this page is that it always says something definite. Every
// state below has words and a way forward:
//
//   loading            — "checking"
//   not found          — the link is wrong or withdrawn, with two recoveries
//   expired            — ask for a new one
//   needs an account   — what this is, and sign up / sign in from here
//   unconfirmed email  — why we will not act yet, and where the email is
//   ready              — the class, who it was sent to, and what accepting means
//   address mismatch   — shown plainly, and allowed anyway
//   already accepted   — somebody took this one; here is what to do
//   not a student      — a teacher account cannot join a class
//
// The one thing it never does is render an empty box.
//
// ⚠ Opening this page joins NOBODY. The token identifies an invitation; the
// button is the student's act, and that act is the consent the whole
// teacher-visibility model rests on. See app/api/invitations/route.ts (2).
// ─────────────────────────────────────────────────────────────────────────────

/** Who is looking at the page, which decides what it can offer them. */
type Viewer =
  | { kind: 'loading' }
  | { kind: 'anonymous' }
  | { kind: 'student'; email: string; confirmed: boolean }
  | { kind: 'not_student' }

export default function AcceptInvitationPage() {
  const router = useRouter()
  const params = useParams<{ token: string }>()
  const token = typeof params?.token === 'string' ? params.token : ''

  const [lookup, setLookup] = useState<InvitationLookup | null>(null)
  const [viewer, setViewer] = useState<Viewer>({ kind: 'loading' })
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinedName, setJoinedName] = useState('')

  useEffect(() => {
    (async () => {
      // Both are independent of each other: what the link is, and who is
      // holding it. Fetched together so the page settles in one step rather
      // than flashing through states.
      const [invitation, { data: { user } }] = await Promise.all([
        lookupInvitation(token),
        supabase.auth.getUser(),
      ])
      setLookup(invitation)

      // Remember a usable invitation, so it survives the email round trip.
      //
      // Signing up does NOT redirect — it cannot, because the student has to go
      // to their inbox and confirm before they have a session. By the time they
      // come back they are on whatever page the confirmation link lands on, and
      // the token is gone from the URL. Without this, the pupil who most needed
      // the invitation (no account, just signed up) is the one who loses it,
      // and we are back to an unexplained empty page.
      //
      // `?next=` covers the sign-IN trip; this covers the sign-UP one. Belt and
      // braces on purpose: between them the link cannot be dropped.
      try {
        if (invitation.found && !invitation.already_accepted) {
          localStorage.setItem(PENDING_INVITE_KEY, token)
        } else if (invitation.found || invitation.reason !== 'error') {
          // Expired, withdrawn, unknown or already used: stop offering it. Only
          // 'error' is left alone, because a server fault says nothing about
          // whether the invitation is good and discarding it on a blip would
          // throw away a perfectly valid one.
          localStorage.removeItem(PENDING_INVITE_KEY)
        }
      } catch {
        // Private browsing, or storage disabled. The emailed link still works;
        // the student just will not get the reminder on their classes page.
        // Not worth failing anything over.
      }

      if (!user) { setViewer({ kind: 'anonymous' }); return }

      // A teacher account cannot accept — class_memberships.student_id
      // references students(id). Told plainly rather than failing at the button.
      const profile = await getStudentProfile()
      if (!profile) { setViewer({ kind: 'not_student' }); return }

      setViewer({
        kind: 'student',
        email: user.email ?? '',
        confirmed: Boolean(user.email_confirmed_at),
      })
    })()
  }, [token])

  async function handleAccept() {
    setJoining(true)
    setJoinError('')
    try {
      const cls = await acceptInvitation({ token })
      setJoinedName(cls.name)
      // Done with it. Leaving it set would keep nagging a student who has
      // already joined, from a page that would then refuse the token.
      try { localStorage.removeItem(PENDING_INVITE_KEY) } catch { /* see above */ }
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Could not join the class.')
    } finally {
      setJoining(false)
    }
  }

  const heading = { ...pageTitle, marginBottom: '8px' }
  const prose: React.CSSProperties = {
    fontSize: font.base, color: colors.textSecondary, lineHeight: '1.6', margin: '0 0 12px',
  }
  const row: React.CSSProperties = {
    display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px',
  }

  /** Offered wherever an invitation cannot be used. Both recoveries, every time. */
  function Recovery() {
    return (
      <>
        <p style={prose}>
          Two things you can do:
        </p>
        <ul style={{ ...prose, paddingLeft: '20px' }}>
          <li>Ask your teacher to send the invitation again.</li>
          <li>
            Or join the class with a <strong>class code</strong> instead — your teacher can
            give you a 4-character code, which works just as well.
          </li>
        </ul>
        <div style={row}>
          <Link href="/student/classes" style={{ ...secondaryButton, width: 'auto', textDecoration: 'none' }}>
            Join with a class code
          </Link>
        </div>
      </>
    )
  }

  if (lookup === null || viewer.kind === 'loading') {
    return (
      <div style={pageContainer}>
        <div style={card}>
          <p style={{ ...prose, margin: 0 }}>Checking your invitation…</p>
        </div>
      </div>
    )
  }

  // ── Joined. Shown in place of everything else. ─────────────────────────────
  if (joinedName) {
    return (
      <div style={pageContainer}>
        <div style={{ ...card, border: `1px solid ${colors.successBorder}` }}>
          <h1 style={heading}>You have joined {joinedName}</h1>
          <p style={prose}>
            Your teacher can now see how you are getting on with this class&apos;s topics. You
            can leave the class at any time from My classes.
          </p>
          <div style={row}>
            <button onClick={() => router.push('/student/classes')} style={{ ...primaryButton, width: 'auto' }}>
              My classes
            </button>
            <button onClick={() => router.push('/practice')} style={{ ...secondaryButton, width: 'auto' }}>
              Start practising
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── The link does not resolve to a usable invitation. ──────────────────────
  if (!lookup.found) {
    const { reason } = lookup

    const title = reason === 'expired'
      ? 'That invitation has expired'
      : reason === 'withdrawn'
        ? 'That invitation has been withdrawn'
        : reason === 'error'
          ? 'We could not check that invitation'
          : 'We could not find that invitation'

    // Each reason gets its own sentence, because the pupil's next step differs
    // and "something went wrong" would send them all to the same dead end.
    const explanation = reason === 'expired'
      ? 'Invitations stop working after a while, so this link is too old to use. Nothing is wrong with your account.'
      : reason === 'withdrawn'
        ? 'Your teacher has withdrawn this invitation. If you think you should still be in the class, ask them about it.'
        : reason === 'error'
          ? 'Something went wrong at our end, not yours. Your invitation may well be fine — please try the link again in a minute.'
          : 'The link may have been cut short when it was copied, or it may have already been used. Links from emails sometimes break across two lines — check you have the whole thing.'

    return (
      <div style={pageContainer}>
        <div style={{ ...card, border: `1px solid ${colors.warningBorder}` }}>
          <h1 style={heading}>{title}</h1>
          <p style={prose}>{explanation}</p>
          {reason === 'error'
            ? (
              <div style={row}>
                <button onClick={() => window.location.reload()} style={{ ...primaryButton, width: 'auto' }}>
                  Try again
                </button>
                <Link href="/student/classes" style={{ ...secondaryButton, width: 'auto', textDecoration: 'none' }}>
                  Join with a class code
                </Link>
              </div>
            )
            : <Recovery />}
        </div>
      </div>
    )
  }

  // ── A real, usable invitation. ─────────────────────────────────────────────
  const { class_name, invited_email_masked, already_accepted } = lookup

  if (already_accepted) {
    return (
      <div style={pageContainer}>
        <div style={{ ...card, border: `1px solid ${colors.warningBorder}` }}>
          <h1 style={heading}>That invitation has already been used</h1>
          <p style={prose}>
            Somebody has already joined <strong>{class_name}</strong> with this invitation. If
            that was you, you are already in the class — have a look at My classes.
          </p>
          <p style={prose}>
            If it was not you, tell your teacher: they can see who joined and can withdraw it.
          </p>
          <div style={row}>
            <Link href="/student/classes" style={{ ...primaryButton, width: 'auto', textDecoration: 'none' }}>
              My classes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (viewer.kind === 'not_student') {
    return (
      <div style={pageContainer}>
        <div style={{ ...card, border: `1px solid ${colors.warningBorder}` }}>
          <h1 style={heading}>You are signed in as a teacher</h1>
          <p style={prose}>
            This invitation to <strong>{class_name}</strong> is for a student account, and a
            teacher account cannot join a class. If you are testing the invitation, sign out
            and open the link again with the student account you want to use.
          </p>
          <div style={row}>
            <Link href="/dashboard" style={{ ...secondaryButton, width: 'auto', textDecoration: 'none' }}>
              Back to my dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Not signed in. The common case for a real class: the invitation arrives
  // before the account exists, which is the entire point of inviting.
  //
  // The link is NOT dropped on the way to signing up — it is handed back as the
  // return path, because losing it here is how the pupil ends up on a page with
  // no explanation, which is the bug this page exists to prevent. (The join-code
  // flow genuinely does drop ?code= when it bounces a logged-out visitor; worth
  // knowing if that is ever fixed, but it is a separate path.)
  if (viewer.kind === 'anonymous') {
    const back = `/invite/${encodeURIComponent(token)}`
    return (
      <div style={pageContainer}>
        <div style={{ ...card, border: `2px solid ${colors.primary}` }}>
          <h1 style={heading}>You have been invited to {class_name}</h1>
          <p style={prose}>
            Your teacher has invited <strong>{invited_email_masked}</strong> to join{' '}
            <strong>{class_name}</strong> on Mathsense.
          </p>
          <p style={prose}>
            You need a Mathsense account to accept. Nobody has made one for you — you create
            it yourself, choose your own password, and the account stays yours even if you
            leave the class or the school. <strong>You can sign up with any email address</strong>;
            it does not have to be the one this was sent to.
          </p>
          <div style={row}>
            <button
              onClick={() => router.push(`/student?mode=signup&next=${encodeURIComponent(back)}`)}
              style={{ ...primaryButton, width: 'auto' }}
            >
              Create an account
            </button>
            <button
              onClick={() => router.push(`/student?next=${encodeURIComponent(back)}`)}
              style={{ ...secondaryButton, width: 'auto' }}
            >
              I already have one
            </button>
          </div>
          <p style={{ ...prose, margin: '14px 0 0', fontSize: font.sm, color: colors.textHint }}>
            Keep this email. Once you have signed up, open the link again to join the class —
            or use a class code from your teacher instead.
          </p>
        </div>
      </div>
    )
  }

  // Signed in as a student, but the address is not confirmed. We deliberately
  // will not let an unconfirmed account take a place in a class — see
  // app/api/invitations/route.ts (1) — so say so rather than failing the button.
  if (!viewer.confirmed) {
    return (
      <div style={pageContainer}>
        <div style={{ ...card, border: `1px solid ${colors.warningBorder}` }}>
          <h1 style={heading}>Confirm your email first</h1>
          <p style={prose}>
            Your invitation to <strong>{class_name}</strong> is here and waiting — this is not a
            problem with the invitation.
          </p>
          <p style={prose}>
            Before you can join a class we need to know your email address is really yours.
            We sent a confirmation link to <strong>{viewer.email}</strong> when you signed up.
            Open that link, then come back to this page.
          </p>
          <div style={row}>
            <button onClick={() => window.location.reload()} style={{ ...primaryButton, width: 'auto' }}>
              I have confirmed it
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Ready to accept. ───────────────────────────────────────────────────────
  //
  // The mismatch note is the heart of the fix. In the reverted build this
  // situation was simply unacceptable-and-unexplained; here it is expected,
  // stated, and allowed. It is also the ONLY way an under-16 invited through a
  // parent's address can ever join, since the child signs up as themselves.
  const mismatch = !masksSameAddress(invited_email_masked, viewer.email)

  return (
    <div style={pageContainer}>
      <div style={{ ...card, border: `2px solid ${colors.primary}` }}>
        <h1 style={heading}>Join {class_name}?</h1>
        <p style={prose}>
          Your teacher has invited <strong>{invited_email_masked}</strong> to join{' '}
          <strong>{class_name}</strong>.
        </p>

        {mismatch && (
          <div style={{
            background: colors.warningLight,
            border: `1px solid ${colors.warningBorder}`,
            borderRadius: '6px',
            padding: '10px 12px',
            margin: '0 0 12px',
          }}>
            <p style={{ ...prose, margin: 0, color: colors.warningText, fontSize: font.sm }}>
              You are signed in as <strong>{viewer.email}</strong>, which is not the address
              this invitation was sent to. That is usually fine — plenty of people sign up
              with a different address, and your teacher will see which account joined. Only
              join if this invitation was meant for you.
            </p>
          </div>
        )}

        <h2 style={{ ...sectionTitle, fontSize: font.base, marginTop: '4px' }}>
          What joining means
        </h2>
        <ul style={{ ...prose, paddingLeft: '20px' }}>
          <li>Your teacher can see how you are getting on with this class&apos;s maths topics.</li>
          <li>They cannot see your password and cannot sign in as you.</li>
          <li>You can leave the class whenever you want, from My classes.</li>
          <li>Your account and all your progress stay with you if you leave.</li>
        </ul>

        {joinError && (
          <p style={{ fontSize: font.sm, color: colors.dangerText, margin: '0 0 10px' }}>{joinError}</p>
        )}

        <div style={row}>
          <button
            onClick={handleAccept}
            disabled={joining}
            style={{ ...primaryButton, width: 'auto', opacity: joining ? 0.6 : 1 }}
          >
            {joining ? 'Joining…' : `Join ${class_name}`}
          </button>
          {/* No "decline". An invitation a student ignores stays an offer; only
              the teacher can withdraw it. Making refusal permanent on the
              student's behalf is not this page's business. */}
          <Link href="/student/classes" style={{ ...secondaryButton, width: 'auto', textDecoration: 'none' }}>
            Not now
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Could the masked invited address be the one signed in?
 *
 * The server masks the local part (a•••••l@school.uk), so an exact comparison
 * is impossible by design — the page must not be able to read out a child's
 * address. This compares what is actually visible: the domain, and the first
 * and last characters of the local part.
 *
 * Deliberately errs towards NOT warning. A false "these differ" on what is
 * really the same address would be a confusing scold; a missed warning just
 * means the student reads one less paragraph before pressing a button they
 * meant to press anyway.
 */
function masksSameAddress(masked: string, actual: string): boolean {
  const at = masked.lastIndexOf('@')
  const actualAt = actual.lastIndexOf('@')
  if (at < 1 || actualAt < 1) return true

  if (masked.slice(at).toLowerCase() !== actual.slice(actualAt).toLowerCase()) return false

  const maskedLocal = masked.slice(0, at).toLowerCase()
  const actualLocal = actual.slice(0, actualAt).toLowerCase()
  const bullets = maskedLocal.indexOf('•')
  if (bullets === -1) return maskedLocal === actualLocal

  return actualLocal.startsWith(maskedLocal.slice(0, bullets))
    && actualLocal.endsWith(maskedLocal.slice(maskedLocal.lastIndexOf('•') + 1))
}
