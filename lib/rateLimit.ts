import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Public-endpoint rate limiting (audit S3) ─────────────────────────────────
// Backed by Upstash Redis so limits hold across Vercel's serverless instances
// (in-memory counters don't). DEGRADES GRACEFULLY: if the Upstash env vars are
// not set, every check returns ok=true (a one-time warning is logged), so the
// routes keep working before/without provisioning.
//
// Setup to activate: provision an Upstash Redis database (free tier). The Vercel
// Marketplace integration injects KV_REST_API_URL + KV_REST_API_TOKEN; a manual
// Upstash setup gives UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN. We read
// either pair. NB: use the read-WRITE token (KV_REST_API_TOKEN) — the limiter
// increments counters — NOT KV_REST_API_READ_ONLY_TOKEN.

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

type Window = `${number} s` | `${number} m` | `${number} h`

function makeLimiter(limit: number, window: Window): Ratelimit | null {
  if (!url || !token) return null
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: 'rl',
    analytics: false,
  })
}

// Email-sending endpoints (feedback, report-question): stricter — each request
// can fire an email. 5 per minute per IP.
const emailLimiter = makeLimiter(5, '1 m')
// Code-lookup endpoints (assessment/class join codes): enumeration guard on the
// 4-char space. 20 per minute per IP.
const lookupLimiter = makeLimiter(20, '1 m')

let warned = false
function warnOnce() {
  if (!warned) {
    console.warn('[rateLimit] KV_REST_API_* / UPSTASH_REDIS_REST_* not set — rate limiting disabled')
    warned = true
  }
}

/** Best-effort client IP from the Vercel-set forwarding header. */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  return xff ? xff.split(',')[0].trim() : (req.headers.get('x-real-ip') ?? 'unknown')
}

async function check(limiter: Ratelimit | null, identifier: string): Promise<{ ok: boolean }> {
  if (!limiter) { warnOnce(); return { ok: true } }
  try {
    const { success } = await limiter.limit(identifier)
    return { ok: success }
  } catch (e) {
    // Never let a limiter outage take down the endpoint — fail open, but log.
    console.error('[rateLimit] limiter error — failing open:', e)
    return { ok: true }
  }
}

export const rateLimitEmail  = (req: Request) => check(emailLimiter, clientIp(req))
export const rateLimitLookup = (req: Request) => check(lookupLimiter, clientIp(req))
