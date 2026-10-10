'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStudentProfile } from '../../../lib/auth'
import Link from 'next/link'
import {
  getStudentClasses, joinClass, leaveClass,
  getMyInvitations, acceptInvitation,
  type StudentClass, type StudentInvitation,
} from '../../../lib/classes'
import { PENDING_INVITE_KEY } from '../../../lib/invitations'
import {
  colors, font, radius, card,
  primaryButton, secondaryButton, inputStyle, sectionTitle, errorBox,
} from '../../../lib/styles'

function StudentClassesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [classes, setClasses] = useState<StudentClass[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState((searchParams.get('code') ?? '').toUpperCase().slice(0, 4))
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinedName, setJoinedName] = useState('')
  const [invitations, setInvitations] = useState<StudentInvitation[]>([])
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)
  // An invitation link this student opened but has not accepted. Survives the
  // sign-up email round trip, which no redirect can. See PENDING_INVITE_KEY.
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      // Must be a signed-in student — joining a class links to the account.
      // (A logged-out visitor following a teacher's share link is sent to sign
      //  in / sign up first; the prefilled code only auto-fills once signed in.)
      const profile = await getStudentProfile()
      if (!profile) {
        router.push('/student')
        return
      }
      await load()
    })()
  }, [])

  async function load() {
    try {
      // Independent of each other, so fetched together. Invitations never block
      // the page: getMyInvitations returns an empty result rather than throwing
      // if the table is not there yet, so the code deploys safely before the
      // migration.
      const [cls, invites] = await Promise.all([getStudentClasses(), getMyInvitations()])
      setClasses(cls)

      // An invitation to a class they are already in is noise — it means they
      // joined by code before accepting, which is a perfectly normal order.
      const joined = new Set(cls.map(c => c.class_id))
      setInvitations(invites.invitations.filter(i => !joined.has(i.class_id)))
      setNeedsEmailConfirmation(invites.needsEmailConfirmation)

      // A link they opened before signing up. Shown only when nothing else
      // already covers it: if the address-matched list found the same
      // invitation, the card below is the better offer and this would duplicate
      // it.
      try {
        const stored = localStorage.getItem(PENDING_INVITE_KEY)
        setPendingInviteToken(
          stored && invites.invitations.length === 0 && cls.length === 0 ? stored : null,
        )
      } catch {
        // Storage unavailable. The emailed link still works.
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(invitation: StudentInvitation) {
    setAcceptingId(invitation.id)
    setJoinError('')
    setJoinedName('')
    try {
      // By id, not by token: this one came from the address-matched list, so the
      // server re-checks that it really belongs to this student's confirmed
      // address. See app/api/invitations/route.ts.
      const cls = await acceptInvitation({ id: invitation.id })
      setJoinedName(cls.name)
      await load()
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Could not join the class.')
    } finally {
      setAcceptingId(null)
    }
  }

  /**
   * Dismissing hides the invitation for this visit only; it is not revoked.
   * A student who says "not now" should not have the decision made permanent on
   * their behalf, and only their teacher can actually withdraw it.
   */
  function handleDismiss(id: string) {
    setInvitations(prev => prev.filter(i => i.id !== id))
  }

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase()
    setJoinError('')
    setJoinedName('')
    if (trimmed.length !== 4) { setJoinError('Enter the 4-character class code.'); return }

    setJoining(true)
    try {
      const cls = await joinClass(trimmed)
      setJoinedName(cls.name)
      setCode('')
      await load()
    } catch (e: any) {
      setJoinError(e?.message === 'Code not found'
        ? 'Code not found. Check it with your teacher.'
        : (e?.message ?? 'Could not join the class.'))
    } finally {
      setJoining(false)
    }
  }

  async function handleLeave(classId: string, name: string) {
    // States what actually stops, and what does not. "Your data for this class"
    // was wrong in both directions: the teacher sees the student's whole
    // practice record, not a class-shaped subset of it, and leaving stops future
    // access rather than unmaking what they have already seen.
    if (!confirm(
      `Leave "${name}"?\n\n`
      + `Your teacher will no longer see your practice record.\n\n`
      + `Your account, your progress and everything you have done stay with you.`
    )) return
    try {
      await leaveClass(classId)
      setClasses(prev => prev.filter(c => c.class_id !== classId))
    } catch {
      alert('Could not leave the class. Please try again.')
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>
          My classes
        </h1>
        <button
          onClick={() => router.push('/student/dashboard')}
          style={{ ...secondaryButton, width: 'auto', padding: '8px 14px', fontSize: font.base }}
        >
          Dashboard
        </button>
      </div>

      {/* Without this, an unconfirmed student sees an empty page and no reason.
          "Your teacher has not invited you" and "we will not tell you until you
          confirm" look identical from here, and a pupil told to expect an
          invitation would reasonably conclude the product is broken. Worded
          without promising an invitation exists, because at this point we have
          deliberately not looked. */}
      {needsEmailConfirmation && (
        <div style={{ ...card, border: `1px solid ${colors.warningBorder}` }}>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
            Confirm your email address to see any class invitations from your teacher.
            Check your inbox for the link we sent when you signed up.
          </p>
        </div>
      )}

      {/* An invitation they opened before they had an account. The link is the
          only thing that can still resolve it — their address may not match the
          one their teacher typed, which is the whole reason the link carries a
          key. Pointing them back at it beats leaving them on a page that cannot
          explain why nothing is here. */}
      {pendingInviteToken && invitations.length === 0 && (
        <div style={{ ...card, border: `2px solid ${colors.primary}` }}>
          <h2 style={sectionTitle}>You have an invitation waiting</h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 12px', lineHeight: '1.6' }}>
            You opened a class invitation before creating your account. Open it again to
            join — nothing has happened yet.
          </p>
          <Link
            href={`/invite/${encodeURIComponent(pendingInviteToken)}`}
            style={{ ...primaryButton, width: 'auto', textDecoration: 'none', display: 'inline-block' }}
          >
            Open my invitation
          </Link>
        </div>
      )}

      {/* Invitations — shown first, because this is the one thing on the page
          that is waiting on the student rather than the other way round.
          Nothing here is automatic: an invitation is an offer, and joining is
          the student's own act. That is the property the whole invitation
          design exists to protect. No timer, no urgency, and "Not now" simply
          hides it for this visit rather than refusing it for good. */}
      {invitations.map(invitation => (
        <div key={invitation.id} style={{ ...card, border: `2px solid ${colors.primary}` }}>
          <h2 style={sectionTitle}>You have been invited to a class</h2>
          <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '4px 0 12px', lineHeight: '1.6' }}>
            Your teacher has invited you to join <strong>{invitation.class_name}</strong>.
            Joining lets them see your practice record. You can leave any time,
            and your account and progress always stay with you.
          </p>
          <div style={styles.row}>
            <button
              onClick={() => handleAccept(invitation)}
              disabled={acceptingId === invitation.id}
              style={{
                ...primaryButton,
                width: 'auto',
                opacity: acceptingId === invitation.id ? 0.6 : 1,
              }}
            >
              {acceptingId === invitation.id ? 'Joining…' : `Join ${invitation.class_name}`}
            </button>
            <button
              onClick={() => handleDismiss(invitation.id)}
              style={{ ...secondaryButton, width: 'auto' }}
            >
              Not now
            </button>
          </div>
        </div>
      ))}

      {/* Join */}
      <div style={card}>
        <h2 style={sectionTitle}>Join a class</h2>
        <p style={{ fontSize: font.sm, color: colors.textHint, margin: '4px 0 12px', lineHeight: '1.6' }}>
          Enter the code from your teacher. Joining lets them see your practice record —
          which skills you have tried, how you did, and when — including practice you do
          on your own, not just work they set, and practice from before you joined. If
          you sit a mini-exam, they can open it and read your answers, because that is
          what marking is. They never see your email address, and they never see the
          answers you type in ordinary practice. You can leave any time.
        </p>
        <div style={styles.row}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="e.g. MX4T"
            maxLength={4}
            style={{
              ...inputStyle,
              flex: 1,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.25em',
              fontSize: '20px',
              textAlign: 'center' as const,
              fontWeight: '700',
            }}
            autoComplete="off"
            autoCapitalize="characters"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <button
            onClick={handleJoin}
            disabled={joining || code.trim().length !== 4}
            style={{
              ...primaryButton,
              width: 'auto',
              padding: '10px 18px',
              opacity: joining || code.trim().length !== 4 ? 0.6 : 1,
              whiteSpace: 'nowrap' as const,
            }}
          >
            {joining ? 'Joining...' : 'Join'}
          </button>
        </div>
        {joinError && <p style={{ ...errorBox, marginTop: '10px' }}>{joinError}</p>}
        {joinedName && (
          <p style={{
            fontSize: font.base, color: colors.successText, margin: '10px 0 0',
            padding: '10px 12px', background: colors.successLight,
            borderRadius: radius.md, border: `1px solid ${colors.successBorder}`,
          }}>
            ✓ Joined {joinedName}.
          </p>
        )}
      </div>

      {/* My classes */}
      <div style={card}>
        <h2 style={sectionTitle}>You&apos;re in</h2>
        {classes.length === 0 ? (
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '8px 0 0' }}>
            You haven&apos;t joined any classes yet.
          </p>
        ) : (
          <div style={styles.list}>
            {classes.map(c => (
              <div key={c.class_id} style={styles.classRow}>
                <div>
                  <p style={{ fontSize: font.md, fontWeight: '500', margin: 0, color: colors.textPrimary }}>
                    {c.name}
                  </p>
                  <span style={{ fontSize: font.sm, color: colors.textHint }}>
                    Joined {new Date(c.joined_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <button
                  onClick={() => handleLeave(c.class_id, c.name)}
                  style={{
                    ...secondaryButton,
                    width: 'auto',
                    padding: '8px 14px',
                    fontSize: font.base,
                    color: colors.dangerText,
                    borderColor: colors.dangerBorder,
                  }}
                >
                  Leave
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function StudentClassesPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<main style={styles.page}><p style={{ color: colors.textSecondary }}>Loading...</p></main>}>
      <StudentClassesInner />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    display: 'flex',
    gap: '10px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px',
  },
  classRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
  },
}
