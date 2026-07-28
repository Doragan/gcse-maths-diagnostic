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

// ── Hard daily spend cap on outbound email (audit F4) ────────────────────────
// The per-IP limiter above is a THROTTLE, not a cap: it fails open (see check())
// and an attacker can rotate IPs, so on its own nothing bounds total Resend
// spend or protects the sending domain's reputation. This is the actual ceiling
// — one global counter across every email-sending route, in a fixed 24h window.
//
// Deliberately NOT per-user: the routes that send are unauthenticated, and the
// `userId` they receive is attacker-supplied body data. Keying a limit on a
// spoofable value would WEAKEN it (rotate the id, get fresh quota), so the cap
// is global and the throttle stays on IP. See the note on identifier() below.
// Override with EMAIL_DAILY_CAP. Parsed defensively: a typo'd value must not
// silently become NaN and hand fixedWindow() a meaningless ceiling.
const parsedCap = Number(process.env.EMAIL_DAILY_CAP)
const EMAIL_DAILY_CAP = Number.isFinite(parsedCap) && parsedCap > 0 ? Math.floor(parsedCap) : 200

const emailBudget: Ratelimit | null = (!url || !token) ? null : new Ratelimit({
  redis: new Redis({ url, token }),
  // Fixed (not sliding) window: this is a budget that resets, not a smoothed rate.
  limiter: Ratelimit.fixedWindow(EMAIL_DAILY_CAP, '24 h'),
  prefix: 'budget',
  analytics: false,
})

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

/**
 * Claim one unit of the global daily email budget. Call IMMEDIATELY BEFORE an
 * outbound send, and only once the request's durable work (the analytics_events
 * row) is already written — so a refusal costs a notification, never the data.
 *
 * FAILS CLOSED, unlike the throttles above, and the distinction is deliberate:
 *
 *   • not configured (no Upstash env vars) → ALLOW. Matches the module's
 *     degrade-gracefully contract so local/preview envs keep working.
 *   • configured but erroring → DENY. A limiter we cannot read is an outage,
 *     and the whole point of a spend cap is that it holds when we're blind.
 *     The alternative (fail open) means the ceiling evaporates exactly when
 *     something is already wrong.
 *
 * Callers should treat a refusal as "skip the email, return success" — the
 * feedback/report is already recorded either way.
 */
export async function emailSendBudget(): Promise<{ ok: boolean; reason?: string }> {
  if (!emailBudget) { warnOnce(); return { ok: true } }
  try {
    const { success } = await emailBudget.limit('global')
    if (!success) {
      console.error(`[rateLimit] daily email cap (${EMAIL_DAILY_CAP}) reached — suppressing send`)
      return { ok: false, reason: 'daily_cap' }
    }
    return { ok: true }
  } catch (e) {
    console.error('[rateLimit] budget check failed — failing CLOSED:', e)
    return { ok: false, reason: 'budget_unavailable' }
  }
}
