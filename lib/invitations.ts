/**
 * Class invitations — the parts that are pure functions.
 *
 * Kept out of the routes so they can be tested without a database: list
 * parsing, the roster state machine, and the wording of the email. The routes
 * hold the authorisation and the queries; everything decidable from values
 * alone lives here.
 *
 * Design: supabase/migrations/20260915_class_invitations.sql, amended by
 * 20261010_class_invitation_tokens.sql. docs/audit/20 §10.
 */

/**
 * localStorage key holding an invitation token the student has opened but not
 * yet accepted.
 *
 * Needed because signing up cannot redirect: the student has to leave for their
 * inbox and confirm their address before they have a session, and by the time
 * they return the token is no longer in the URL. The classes page reads this and
 * offers the invitation again. `?next=` handles the sign-IN trip; this handles
 * sign-UP. Cleared the moment it is accepted or found to be unusable.
 *
 * A token, not a membership: holding it still only identifies an invitation,
 * and accepting is still a button the student presses.
 */
export const PENDING_INVITE_KEY = 'mathsense.pending_invite'

/**
 * Where to send a student after they sign in, when an invitation link sent them
 * to the auth page first.
 *
 * ⚠ ALLOWLISTED TO ONE SHAPE, not merely checked for being relative. A `?next=`
 * parameter is an open-redirect hole by default, and the classic bypass is a
 * PROTOCOL-RELATIVE url: `//evil.example` starts with `/`, so a naive "is it
 * relative" test waves it straight through, and the browser treats it as
 * `https://evil.example`. The page this guards is a SIGN-IN page, which is
 * precisely where landing someone on an attacker's replica pays off.
 *
 * So rather than enumerating what to reject, this accepts exactly one pattern —
 * `/invite/<token>` — because that is the only caller. Backslashes, a second
 * slash, a scheme, a host, a query, a fragment and a path traversal all fail it
 * by simply not matching.
 *
 * Lives here rather than in the page so it can be tested, which for a redirect
 * guard is the difference between "looks right" and "is right".
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null
  return /^\/invite\/[A-Za-z0-9._~%-]+$/.test(raw) ? raw : null
}

/** Pasted lists are messy. Accept commas, semicolons, whitespace and newlines. */
const SPLIT = /[\s,;]+/

/**
 * Deliberately permissive. This catches a mistyped entry before it becomes a
 * roster row; it does not assert the address exists. Nothing security-relevant
 * rests on it — acceptance is gated on a confirmed account, not on this regex.
 */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Guards a paste that was never a list of addresses at all. */
export const MAX_EMAILS = 200

export type ParsedEmailList = {
  /** Lower-cased, de-duplicated, plausible addresses. */
  valid: string[]
  /** Entries that did not look like addresses, echoed back so the teacher can fix them. */
  rejected: string[]
}

/**
 * Normalise a pasted class list.
 *
 * Lower-cases here as well as in the schema's CHECK constraint, because the
 * unique index is on the raw text: without it one pupil could hold two
 * invitations by capitalisation alone.
 */
export function parseEmailList(raw: string): ParsedEmailList {
  const candidates = [...new Set(
    raw.split(SPLIT).map(e => e.trim().toLowerCase()).filter(Boolean),
  )]

  return {
    valid: candidates.filter(e => LOOKS_LIKE_EMAIL.test(e)),
    rejected: candidates.filter(e => !LOOKS_LIKE_EMAIL.test(e)),
  }
}

/**
 * What the teacher needs to see about one invited address.
 *
 * These are the four states that call for four different actions, which is the
 * entire reason invitations exist alongside the join code — a code can only ever
 * tell you who DID join.
 *
 *   joined     — accepted. Nothing to do.
 *   waiting    — emailed, not accepted yet. Chase the pupil.
 *   not_sent   — the row exists but no email ever went. Chase the SYSTEM, not
 *                the pupil. Kept distinct because telling a tutor to nag a
 *                student who was never actually written to is the worst
 *                possible failure for this feature, and delivery really was
 *                silently broken for two days in October.
 *   expired    — past expires_at and never accepted. Re-invite.
 *   withdrawn  — the teacher revoked it.
 */
export type InvitationState = 'joined' | 'waiting' | 'not_sent' | 'expired' | 'withdrawn'

export type InvitationRow = {
  status: 'pending' | 'accepted' | 'revoked'
  expires_at: string
  sent_at: string | null
}

export function invitationState(row: InvitationRow, now: Date = new Date()): InvitationState {
  if (row.status === 'accepted') return 'joined'
  if (row.status === 'revoked') return 'withdrawn'
  // Expiry is checked before delivery: an invitation that is past its date
  // cannot be accepted whether or not it was ever sent, so "re-invite" is the
  // action either way and saying "not sent" would point at the wrong fix.
  if (new Date(row.expires_at) <= now) return 'expired'
  if (!row.sent_at) return 'not_sent'
  return 'waiting'
}

/** Teacher-facing label for each state. UK spelling. */
export const STATE_LABEL: Record<InvitationState, string> = {
  joined:    'Joined',
  waiting:   'Invited, not joined yet',
  not_sent:  'Not sent',
  expired:   'Expired',
  withdrawn: 'Withdrawn',
}

/**
 * Show enough of an address to be recognised by its owner, no more.
 *
 * a.pupil@school.sch.uk -> a•••••l@school.sch.uk
 *
 * The domain is left intact deliberately: it is the part that tells a pupil
 * "this went to your school address, not your personal one", which is the whole
 * confusion the invitation page exists to clear up. A domain is not personal
 * data; the local part is.
 *
 * ⚠ Used on the INVITATION PAGE, where it lets a pupil recognise their own
 * address without handing a harvester a real one.
 *
 * It is deliberately NOT used on the teacher's roster any more. A masked
 * address is still derived personal data, and a teacher may NOT see a pupil's
 * email address at all, which the privacy
 * notice, `docs/legal/dpa-schools.md` §4 and the DPIA all state plainly, and §4
 * goes as far as calling it a property of the design rather than a setting. A
 * masked address still reconciles the roster — the teacher can see that the
 * pupil joined on a different address, and usually recognise which — without
 * disclosing the address itself and falsifying all three documents.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 1) return '•••'
  const local = email.slice(0, at)
  const domain = email.slice(at)
  if (local.length <= 2) return `${local[0]}•${domain}`
  return `${local[0]}${'•'.repeat(Math.min(local.length - 2, 6))}${local[local.length - 1]}${domain}`
}

/**
 * Why `accepted_by` can differ from the address that was invited, and whether
 * that is worth showing.
 *
 * It is expected, not exceptional: a pupil invited on a school address who signs
 * up with a personal one, or a younger pupil invited via a parent's address who
 * signs up as themselves. The teacher sees both sides so the roster reconciles.
 *
 * Compares the REAL addresses — the caller masks only what it returns. Masking
 * first would make `a•••••l@school.uk` and `a•••••a@school.uk` compare unequal
 * on their visible characters while genuinely different addresses with the same
 * first and last letter compared equal, so the decision is made on the truth and
 * only the disclosure is reduced.
 */
export function acceptedElsewhere(invitedEmail: string, acceptedEmail: string | null): boolean {
  if (!acceptedEmail) return false
  return invitedEmail.trim().toLowerCase() !== acceptedEmail.trim().toLowerCase()
}

/**
 * Would accepting this invitation burn somebody else's place?
 *
 * The case this exists for, found in testing on 2026-10-13: a pupil opens their
 * emailed link on a shared school or family computer where a DIFFERENT pupil is
 * still signed in. The signed-in account is already in the class, so joining
 * changes nothing for them — but the invitation is marked accepted, and the
 * pupil it was actually sent to then gets "that invitation has already been
 * used". The teacher's roster shows the row as Joined, so the missing pupil
 * looks present. One account consumed two invitations exactly this way.
 *
 * The rule is narrow on purpose, because the obvious broad version is wrong:
 *
 *   ALREADY A MEMBER, DIFFERENT ADDRESS -> refuse. Nothing is gained by
 *     accepting (the membership exists) and a place is destroyed.
 *
 *   ALREADY A MEMBER, SAME ADDRESS -> allow. This is the pupil who joined by
 *     CODE first and is now opening their own invitation, which the original
 *     code rightly called "a perfectly normal order". Marking it accepted is
 *     what stops the teacher seeing a straggler who is already sitting in the
 *     class.
 *
 *   NOT A MEMBER -> allow, whatever the address. This is the whole point of
 *     matching on the token: a pupil invited at school who signs up with a
 *     personal address, or a younger pupil whose parent forwarded the link.
 *     Refusing here would reinstate the bug that got the feature reverted.
 */
export function wouldTakeSomeoneElsesPlace(
  { isAlreadyMember, invitedEmail, accountEmail }:
  { isAlreadyMember: boolean; invitedEmail: string; accountEmail: string },
): boolean {
  if (!isAlreadyMember) return false
  return acceptedElsewhere(invitedEmail, accountEmail)
}

/**
 * The invitation email.
 *
 * Plain text, addressed to someone who may be a child and may have no account.
 * Three things it must do, in order: say who invited them and to what, give them
 * the link, and say what happens to their data if they accept. No urgency, no
 * deadline language, no "action required" — an invitation is an offer, and the
 * student's decision to accept is the consent the entire teacher-visibility
 * model rests on. Manufacturing pressure around it would undermine the thing it
 * is there to establish.
 *
 * It does NOT say "click to join". Following the link does not join anybody;
 * they still create their own account and press a button. Promising otherwise
 * would misdescribe the one step that matters.
 */
export function invitationEmail(
  { className, teacherName, acceptUrl }:
  { className: string; teacherName: string | null; acceptUrl: string },
): { subject: string; text: string } {
  const inviter = teacherName?.trim() ? teacherName.trim() : 'Your teacher'

  return {
    subject: `${inviter} has invited you to ${className} on Mathsense`,
    text: [
      `${inviter} has invited you to join the class "${className}" on Mathsense,`,
      `a maths practice site.`,
      ``,
      `To accept, open this link:`,
      ``,
      `  ${acceptUrl}`,
      ``,
      `You will need a Mathsense account. If you do not have one yet, the link`,
      `will help you create it — you choose your own password, and the account`,
      `stays yours. You can use any email address you like; it does not have to`,
      `be the one this was sent to.`,
      ``,
      `If you accept, ${inviter} will be able to see how you are getting on with`,
      `the maths topics in this class. They cannot see your password and cannot`,
      `sign in as you. You can leave the class whenever you want, and your`,
      `account and your progress stay with you if you do.`,
      ``,
      `If you were not expecting this, you can ignore this email. Nothing`,
      `happens unless you accept, and no account has been created for you.`,
      ``,
      `— Mathsense`,
    ].join('\n'),
  }
}

/**
 * Where an invitation is accepted. Absolute, because it goes in an email.
 *
 * The token is in the PATH rather than the query string so it survives the
 * copy-paste and link-rewriting that mangles query params in mail clients, and
 * so it is never confused with the join code's `?code=`.
 */
export function acceptUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/invite/${encodeURIComponent(token)}`
}

// ── The teacher's name on an invitation ──────────────────────────────────────

/**
 * Longest name stored. Generous for "Mrs Abena-Fosu (Maths)", short enough that
 * nobody pastes an essay into an email subject line.
 */
export const MAX_DISPLAY_NAME = 60

export type DisplayNameResult =
  /** Store this. */
  | { ok: true; value: string }
  /** Store NULL — the teacher cleared the field, which is allowed. */
  | { ok: true; value: null }
  | { ok: false; error: string }

/**
 * Clean and check a teacher-supplied display name.
 *
 * Free text on purpose: this is what a teacher's pupils actually call them
 * ("Mr Okafor", "Miss R", "Chris"), and that recognisability is the entire
 * point — the sender's name is the main thing that makes an email to a child
 * look legitimate rather than like phishing. So the rules are about safety and
 * storage, not about format.
 *
 * Blank is VALID and means null. Clearing the field is a legitimate choice, and
 * the email falls back to "Your teacher".
 */
export function parseDisplayName(raw: unknown): DisplayNameResult {
  if (raw === null || raw === undefined) return { ok: true, value: null }
  if (typeof raw !== 'string') return { ok: false, error: 'Name must be text' }

  // Collapse internal runs of whitespace as well as trimming the ends: a name
  // pasted out of a spreadsheet often arrives with a tab or a double space in
  // it, and "Mr  Okafor" should not be a different name from "Mr Okafor".
  // \s covers the newlines that would otherwise break an email subject header.
  const value = raw.replace(/\s+/g, ' ').trim()

  if (value === '') return { ok: true, value: null }
  if (value.length > MAX_DISPLAY_NAME) {
    return { ok: false, error: `Please keep it to ${MAX_DISPLAY_NAME} characters or fewer` }
  }
  // Control characters have no business in a name and would land in an email
  // header. Rejected rather than stripped, so the teacher sees what happened
  // instead of silently getting something other than what they typed.
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    return { ok: false, error: 'Name contains characters that are not allowed' }
  }
  return { ok: true, value }
}
