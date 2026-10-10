/**
 * Transactional email through Brevo.
 *
 * ── Why Brevo and not Resend ────────────────────────────────────────────────
 * This is NOT a second email mechanism; it is the one the service already uses
 * for mail that everybody gets. Brevo has sent password resets and sign-up
 * confirmations since 2026-10-01, as Supabase's SMTP sender, and stores in the
 * EU (France). Resend — `lib/email/reengagement.ts`, `weeklyNudge.ts` — stores
 * in the United States and is reserved for OPTED-IN practice reminders only.
 *
 * That split is a published promise, not an implementation detail: the privacy
 * notice (v1.4), `docs/legal/dpa-schools.md` §7 and `docs/audit/21` §5 all say a
 * learner who never ticked the reminders box has never had their address sent to
 * the US at all. A class invitation is a service notice that the recipient never
 * opted into, and most of these addresses belong to children, so routing it
 * through Resend would quietly falsify all three documents. It goes via Brevo.
 *
 * Brevo's transactional sending was activated for "confirmations, password
 * resets and service notices" (docs/runbooks/custom-smtp.md §1), which is what
 * this is.
 *
 * ── Why the HTTP API and not the SMTP relay ─────────────────────────────────
 * The SMTP credentials belong to Supabase, which owns the auth email path. An
 * app-level send needs its own credential anyway, and the API returns a message
 * id and a status synchronously — so a caller can record whether the thing
 * actually went, instead of discovering weeks later that it never did. Delivery
 * was silently broken for the first two days after Brevo was configured (Gmail
 * greylisting — see the runbook), which is exactly why callers get told.
 *
 * ⚠ BREVO_API_KEY is the API key, NOT the SMTP key. They are different strings
 * in the same console and the SMTP one fails with a 401.
 */

/** Brevo's transactional endpoint. Same call `scripts/send-privacy-notice.ts` makes. */
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

const FROM_NAME = 'Mathsense'

export type SendResult =
  /** Brevo accepted it. `messageId` is what their transactional log is keyed on. */
  | { ok: true; messageId: string | null }
  /**
   * Not sent, and not an error worth failing a request over: no API key is
   * configured. This is the normal state in local development and on any
   * preview deployment, and a caller should carry on and report "saved but not
   * sent" rather than pretending the invitation went out.
   */
  | { ok: false; reason: 'not_configured' }
  /** Brevo refused it, or the network did. */
  | { ok: false; reason: 'send_failed'; detail: string }

export type TransactionalEmail = {
  to: string
  subject: string
  /** Plain text. No HTML: nothing here needs it, and it cannot render wrong. */
  text: string
}

/** True when a send would actually be attempted. Lets a route tell a user up front. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY)
}

/**
 * Send one message to one recipient.
 *
 * One recipient per call, never a BCC list: one mis-set field puts every
 * recipient's address in front of every other recipient, and most of these
 * belong to children. That is a reportable breach caused by a typo, so the
 * possibility is removed rather than managed — the same reasoning as
 * `scripts/send-privacy-notice.ts`.
 *
 * Never throws. Every caller here is sending email as a side effect of a user
 * action that has already succeeded (an invitation row exists), and a mail
 * failure must not roll that back or surface as a 500.
 */
export async function sendTransactionalEmail(
  { to, subject, text }: TransactionalEmail,
): Promise<SendResult> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) return { ok: false, reason: 'not_configured' }

  const from = process.env.BREVO_FROM_EMAIL || 'accounts@mathsense.net'

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: from, name: FROM_NAME },
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
    })

    if (!res.ok) {
      // Brevo's body carries the actual reason (unverified sender, inactive
      // account, bad key). Truncated: it is logged, and it can echo the request.
      const detail = `${res.status} ${(await res.text().catch(() => '')).slice(0, 300)}`
      return { ok: false, reason: 'send_failed', detail }
    }

    const json = await res.json().catch(() => null) as { messageId?: string } | null
    return { ok: true, messageId: json?.messageId ?? null }
  } catch (err) {
    return {
      ok: false,
      reason: 'send_failed',
      detail: err instanceof Error ? err.message : 'network error',
    }
  }
}
