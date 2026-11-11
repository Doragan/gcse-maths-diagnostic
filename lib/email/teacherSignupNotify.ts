/**
 * Sends the teacher-signup alert exactly once — the I/O half of
 * lib/email/teacherSignupAlert.ts.
 *
 * ⚠ Requires a service-role client (bypasses RLS). Server code only: clients
 * hold no INSERT or UPDATE on `teachers` at all
 * (20260914_close_teachers_self_admin.sql, 20260611_lock_sensitive_columns.sql).
 *
 * ── Why Brevo and not Resend ────────────────────────────────────────────────
 * The daily digest goes through Resend (US), which is fine: it carries counts
 * and id prefixes, no addresses. This alert carries a named adult's email
 * address — the whole point of it — so it goes through Brevo (EU), which is
 * also where every other address-bearing send in this codebase goes. See the
 * header of lib/email/brevo.ts; the split is a published promise, not a
 * preference.
 *
 * ── Why a column and not a time window ─────────────────────────────────────
 * "Any teacher created in the last N minutes" needs a cron that runs every N
 * minutes, and Vercel's Hobby plan fails a deployment for any cron scheduled
 * more than once a day (see app/api/cron/session-sweep). So the alert fires
 * from the signup paths themselves, which means it can fire more than once per
 * teacher — a Google provision retried, a dashboard opened in three tabs. The
 * claim below is what makes that harmless: `teachers.signup_alert_sent_at` is
 * set by a conditional UPDATE that only matches while it is null, so exactly
 * one caller gets the row back and the others do nothing.
 *
 * The timestamp is written BEFORE the send, not after. Both orders can fail;
 * this one fails by losing an alert, the other by sending the same alert on a
 * loop every time a dashboard is opened. A missed alert still shows up in the
 * next morning's digest as a signup, so it is the cheaper failure.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendTransactionalEmail, isEmailConfigured } from './brevo'
import { buildTeacherSignupAlert, type SignupMethod } from './teacherSignupAlert'

/**
 * Where the alert goes. Hardcoded like DIGEST_TO in app/api/cron/ad-digest —
 * this is ops mail to one person, not a configurable recipient list — with an
 * env override so a preview deployment can point it somewhere harmless.
 *
 * Read per call rather than once at import, so the override takes effect
 * wherever the module happens to be loaded before the environment is.
 */
const alertRecipient = () => process.env.FOUNDER_ALERT_EMAIL || 'christopher.reay89@gmail.com'

export type NotifyOutcome =
  /** Sent. */
  | { sent: true }
  /**
   * Not sent. `already_alerted` also covers "there is no teachers row for this
   * id" — the claim cannot tell the two apart, and neither is an error. The
   * others are, and each is logged where it happens.
   */
  | { sent: false; reason: 'already_alerted' | 'not_configured' | 'send_failed' | 'claim_failed' }

/**
 * Claim the alert for this teacher and send it.
 *
 * Never throws. Every caller is on a path that has already succeeded for the
 * user (an account exists, a dashboard is loading), and an ops notice must not
 * turn that into an error they see.
 */
export async function notifyTeacherSignup(
  admin: SupabaseClient,
  teacherId: string,
  method: SignupMethod,
): Promise<NotifyOutcome> {
  try {
    // One statement does the claim: filtering on `is null` and returning the
    // row means a second concurrent call matches nothing and sends nothing.
    // `email` and `created_at` come back from the same statement, so the alert
    // describes the row it just claimed rather than one read separately.
    const { data, error } = await admin
      .from('teachers')
      .update({ signup_alert_sent_at: new Date().toISOString() })
      .eq('id', teacherId)
      .is('signup_alert_sent_at', null)
      .select('email, display_name, created_at')
      .maybeSingle()

    if (error) {
      console.error('[teacher-signup-alert] claim failed:', error.message)
      return { sent: false, reason: 'claim_failed' }
    }
    // No row: either already alerted, or there is no teachers row to alert
    // about. Neither is an error — the common case is simply a returning
    // teacher opening their dashboard.
    if (!data) return { sent: false, reason: 'already_alerted' }

    if (!isEmailConfigured()) {
      // Local and preview deployments. Say so in the log rather than failing:
      // the claim has been made, which is the behaviour the dev wanted to see.
      console.warn('[teacher-signup-alert] BREVO_API_KEY not set — not sending')
      return { sent: false, reason: 'not_configured' }
    }

    const { subject, text } = buildTeacherSignupAlert({
      email: data.email,
      displayName: data.display_name ?? null,
      signedUpAt: data.created_at ?? new Date().toISOString(),
      method,
      totalTeachers: await countTeachers(admin),
    })

    const result = await sendTransactionalEmail({ to: alertRecipient(), subject, text })
    if (!result.ok) {
      console.error('[teacher-signup-alert] send failed:', 'detail' in result ? result.detail : result.reason)
      return { sent: false, reason: result.reason === 'not_configured' ? 'not_configured' : 'send_failed' }
    }

    console.log(`[teacher-signup-alert] sent for teacher ${teacherId.slice(0, 8)} (${method})`)
    return { sent: true }
  } catch (err) {
    console.error('[teacher-signup-alert] error:', err instanceof Error ? err.message : err)
    return { sent: false, reason: 'claim_failed' }
  }
}

/** Total teacher accounts, or null if the count fails — the line is then dropped. */
async function countTeachers(admin: SupabaseClient): Promise<number | null> {
  const { count, error } = await admin
    .from('teachers')
    .select('id', { count: 'exact', head: true })
  return error ? null : count ?? null
}
