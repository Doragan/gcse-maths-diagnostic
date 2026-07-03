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
 */

import { createHmac, timingSafeEqual } from 'crypto'

const TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

/**
 * Signing secret. Prefer a dedicated PARENT_PAY_SECRET; fall back to the service
 * role key so the feature works in environments where the dedicated var isn't
 * set yet. Either way the secret never leaves the server.
 */
function secret(): string {
  const s = process.env.PARENT_PAY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('parentPay: no signing secret (set PARENT_PAY_SECRET)')
  return s
}

const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64url')
const sign = (payloadB64: string) =>
  createHmac('sha256', secret()).update(payloadB64).digest('base64url')

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

  const expected = sign(payloadB64)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const { sid, exp } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    if (typeof sid !== 'string' || typeof exp !== 'number') return null
    if (exp < Math.floor(Date.now() / 1000)) return null
    return { studentId: sid }
  } catch {
    return null
  }
}
