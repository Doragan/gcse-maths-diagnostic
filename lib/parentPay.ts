/**
 * Parent-pay tokens — server-only.
 *
 * A student generates a shareable link so a parent/guardian can pay for the
 * student's subscription. The link carries an HMAC-signed token that encodes the
 * student_id and a 30-day expiry, so the public pay routes can trust which
 * account a payment belongs to WITHOUT the parent being logged in — and without
 * a database table.
 *
 * Format: `base64url(payload) . base64url(hmacSHA256(payloadB64))`
 * Payload: `{ sid: <student uuid>, exp: <unix seconds> }`
 *
 * The token is NOT single-use on its own (it's stateless) — the checkout route
 * enforces "don't charge an already-subscribed student" using live subscription
 * state, so a link stops charging once the first payment lands. See
 * app/api/parent-pay/checkout/route.ts.
 *
 * ⚠ Import from server code only (uses `crypto` + a server secret).
 * ⚠ REQUIRES the PARENT_PAY_SECRET env var — this module throws without it.
 *   Generate one with: openssl rand -base64 32
 */

import { createHmac, timingSafeEqual } from 'crypto'

const TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

/**
 * Signing secret — a DEDICATED key, required (audit F6).
 *
 * This used to be `PARENT_PAY_SECRET || SUPABASE_SERVICE_ROLE_KEY`. The env var
 * was in fact always set in production, so the fallback never actually fired —
 * but it meant a renamed or deleted variable would SILENTLY start signing public,
 * shareable links with the database's master credential (the service role key
 * bypasses all RLS). No error, no log, nothing to notice.
 *
 * Requiring the dedicated key turns "happens to be configured correctly" into
 * "cannot run misconfigured", and keeps the two secrets independently rotatable.
 *
 * Deliberately THROWS rather than degrading: a missing signing secret is a
 * broken deploy, and failing loudly beats silently telling every parent their
 * link is invalid.
 */
function secret(): string {
  const s = process.env.PARENT_PAY_SECRET
  if (!s) throw new Error('parentPay: PARENT_PAY_SECRET is not set')
  return s
}

const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64url')
const sign = (payloadB64: string) =>
  createHmac('sha256', secret()).update(payloadB64).digest('base64url')

/** Constant-time signature comparison. */
function matches(payloadB64: string, sig: string): boolean {
  const a = Buffer.from(sig)
  const b = Buffer.from(sign(payloadB64))
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Sign a parent-pay token for a student (valid for 30 days). */
export function signPayToken(studentId: string): string {
  const payload = JSON.stringify({ sid: studentId, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })
  const payloadB64 = b64url(payload)
  return `${payloadB64}.${sign(payloadB64)}`
}

/**
 * Verify a token. Returns the student id, or null if the token is malformed, has
 * a bad signature, or has expired. Uses a constant-time signature compare.
 */
export function verifyPayToken(token: string): { studentId: string } | null {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null

  if (!matches(payloadB64, sig)) return null

  try {
    const { sid, exp } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    if (typeof sid !== 'string' || typeof exp !== 'number') return null
    if (exp < Math.floor(Date.now() / 1000)) return null
    return { studentId: sid }
  } catch {
    return null
  }
}
