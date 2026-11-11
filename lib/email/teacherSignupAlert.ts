/**
 * "A teacher signed up" alert — a pure builder, the same split as
 * lib/email/dailyDigest.ts. lib/email/teacherSignupNotify.ts does the claiming
 * and the sending; this file only formats, so it is unit-tested with no
 * database and no network.
 *
 * ── Why this exists when the daily digest already counts signups ────────────
 * The digest answers "what happened yesterday" at 06:00 and reports signups as
 * a NUMBER, with no addresses — deliberately, because it is an aggregate report
 * (see the no-PII-in-analytics rule). A teacher signing up is not a statistic
 * to read tomorrow: teachers are the thing being chased by hand right now, one
 * at a time, and the useful response to one appearing is to look at who they
 * are the same day. So this is a single-event notice that names them.
 *
 * It goes to the founder's own inbox and nowhere else. It is not a user-facing
 * email: no unsubscribe link, no tracking, no CTA — the same shape as the
 * digest, and for the same reason (there is no third party to give a choice
 * to; the recipient is the data controller).
 *
 * Plain text only, which is all `sendTransactionalEmail` accepts. Nothing here
 * needs HTML and plain text cannot render wrong on a phone.
 */

/** How the account was created. Decides one line of the email, nothing else. */
export type SignupMethod = 'google' | 'email'

export type TeacherSignupAlertInput = {
  /** The teacher's login address. The one thing that makes the alert actionable. */
  email: string
  /** Optional at signup (20261013_teacher_display_name.sql), so usually null. */
  displayName: string | null
  /** `teachers.created_at`, as an ISO timestamp. */
  signedUpAt: string
  method: SignupMethod
  /**
   * Teacher accounts in total, this one included — the figure that says whether
   * this is the 3rd or the 30th. null when the count could not be read; the
   * line is then omitted rather than guessed at.
   */
  totalTeachers: number | null
}

export type BuiltAlert = { subject: string; text: string }

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * "11 Nov 2026, 14:32 UTC". Formatted here, in UTC, rather than through
 * toLocaleDateString: this runs on a serverless box whose locale and zone are
 * not ours to assume, and every other time in this project's ops mail is UTC.
 *
 * An unparseable timestamp returns the raw string instead of "Invalid Date" —
 * the alert still has to be sendable, and the address is the part that matters.
 */
export function formatSignupTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

const METHOD_LABEL: Record<SignupMethod, string> = {
  google: 'Google sign-in',
  email: 'Email and password',
}

/**
 * The subject names WHO, because that is what gets read on a lock screen. The
 * display name if there is one, otherwise the address — never "a new teacher",
 * which says nothing a count in the digest does not already say.
 */
export function buildTeacherSignupAlert(input: TeacherSignupAlertInput): BuiltAlert {
  const name = input.displayName?.trim() || ''
  const who = name || input.email

  const lines = [
    'A teacher account was created on Mathsense.',
    '',
    `  Email      ${input.email}`,
    `  Name       ${name || '(not given — optional at signup)'}`,
    `  Signed up  ${formatSignupTime(input.signedUpAt)}`,
    `  Method     ${METHOD_LABEL[input.method]}`,
  ]

  if (input.totalTeachers !== null) {
    const n = input.totalTeachers
    lines.push(`  Teachers   ${n} ${n === 1 ? 'account' : 'accounts'} in total, including this one`)
  }

  lines.push(
    '',
    'One of these is sent per teacher account, never twice — so no reply, no',
    'action and no unsubscribe is needed to stop it.',
  )

  return { subject: `New teacher signup: ${who}`, text: lines.join('\n') }
}
