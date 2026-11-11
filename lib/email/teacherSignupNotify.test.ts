import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { notifyTeacherSignup } from './teacherSignupNotify'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The claim is the whole safety property of this feature — fire the alert from
 * two signup paths and several tabs, send one email — and it lives in an I/O
 * module, so it is tested against a stub client rather than a database. What is
 * being pinned down is the SHAPE of the statement (a conditional update that
 * only matches while the column is null, returning the row it claimed) and the
 * rule that nothing is sent when it matches nothing.
 */

type ClaimRow = { email: string; display_name: string | null; created_at: string }

const ROW: ClaimRow = {
  email: 'r.okafor@northgate.sch.uk',
  display_name: 'Mr Okafor',
  created_at: '2026-11-11T14:32:09.000Z',
}

function stubAdmin(opts: {
  claim: { data: ClaimRow | null; error?: { message: string } }
  count?: number | null
}) {
  const seen = {
    patches: [] as Record<string, unknown>[],
    filters: [] as [string, unknown][],
  }

  const from = () => ({
    update(patch: Record<string, unknown>) {
      seen.patches.push(patch)
      const chain = {
        eq: (col: string, val: unknown) => { seen.filters.push([`eq:${col}`, val]); return chain },
        is: (col: string, val: unknown) => { seen.filters.push([`is:${col}`, val]); return chain },
        select: () => chain,
        maybeSingle: async () => ({ data: opts.claim.data, error: opts.claim.error ?? null }),
      }
      return chain
    },
    // The teacher count: awaited directly, no maybeSingle().
    select: async () => ({ count: opts.count ?? null, error: null }),
  })

  return { admin: { from } as unknown as SupabaseClient, seen }
}

/** Accepts the send the way Brevo's API does. */
function stubBrevoOk() {
  const fetchMock = vi.fn(async () => new Response(
    JSON.stringify({ messageId: '<abc@brevo>' }),
    { status: 201, headers: { 'content-type': 'application/json' } },
  ))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The JSON Brevo was handed, so the assertions read like the email. */
function sentBody(fetchMock: ReturnType<typeof stubBrevoOk>) {
  // The stub takes no declared arguments, so its call tuple is typed empty —
  // the arguments are still recorded, which is what this reads.
  const calls = fetchMock.mock.calls as unknown as unknown[][]
  const init = calls[0][1] as RequestInit
  return JSON.parse(init.body as string)
}

beforeEach(() => {
  process.env.BREVO_API_KEY = 'test-key'
  process.env.FOUNDER_ALERT_EMAIL = 'founder@example.com'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.BREVO_API_KEY
  delete process.env.FOUNDER_ALERT_EMAIL
})

describe('notifyTeacherSignup', () => {
  it('claims with a conditional update and sends the alert', async () => {
    const fetchMock = stubBrevoOk()
    const { admin, seen } = stubAdmin({ claim: { data: ROW }, count: 7 })

    expect(await notifyTeacherSignup(admin, 'teacher-uuid', 'email')).toEqual({ sent: true })

    // The claim: this teacher, and only while no alert has been sent.
    expect(seen.filters).toEqual([['eq:id', 'teacher-uuid'], ['is:signup_alert_sent_at', null]])
    expect(Object.keys(seen.patches[0])).toEqual(['signup_alert_sent_at'])
    expect(typeof seen.patches[0].signup_alert_sent_at).toBe('string')

    const body = sentBody(fetchMock)
    expect(body.to).toEqual([{ email: 'founder@example.com' }])
    expect(body.subject).toBe('New teacher signup: Mr Okafor')
    expect(body.textContent).toContain('r.okafor@northgate.sch.uk')
    expect(body.textContent).toContain('7 accounts in total')
  })

  it('sends NOTHING when the claim matches no row — the second tab, and every later login', async () => {
    const fetchMock = stubBrevoOk()
    const { admin } = stubAdmin({ claim: { data: null } })

    expect(await notifyTeacherSignup(admin, 'teacher-uuid', 'email'))
      .toEqual({ sent: false, reason: 'already_alerted' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends nothing for a user with no teachers row (a student calling the route)', async () => {
    // Indistinguishable from "already alerted" at the database, and the
    // outcome that matters is the same: no email.
    const fetchMock = stubBrevoOk()
    const { admin } = stubAdmin({ claim: { data: null } })

    await notifyTeacherSignup(admin, 'student-uuid', 'email')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports a failed claim instead of throwing into the signup path', async () => {
    // What happens if the migration has not been applied yet: the column is
    // missing, the update errors, and the account creation around it must not
    // notice.
    const fetchMock = stubBrevoOk()
    const { admin } = stubAdmin({
      claim: { data: null, error: { message: 'column "signup_alert_sent_at" does not exist' } },
    })

    expect(await notifyTeacherSignup(admin, 'teacher-uuid', 'google'))
      .toEqual({ sent: false, reason: 'claim_failed' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('claims anyway with no API key, so local development is not a stream of retries', async () => {
    delete process.env.BREVO_API_KEY
    const fetchMock = stubBrevoOk()
    const { admin, seen } = stubAdmin({ claim: { data: ROW } })

    expect(await notifyTeacherSignup(admin, 'teacher-uuid', 'email'))
      .toEqual({ sent: false, reason: 'not_configured' })
    expect(seen.patches).toHaveLength(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports a refused send, and does not un-claim it', async () => {
    // Deliberate: the timestamp is written before the send, so a Brevo failure
    // loses one alert rather than retrying it on every dashboard load. The
    // signup still appears in the next daily digest.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unverified sender', { status: 400 })))
    const { admin, seen } = stubAdmin({ claim: { data: ROW } })

    expect(await notifyTeacherSignup(admin, 'teacher-uuid', 'email'))
      .toEqual({ sent: false, reason: 'send_failed' })
    expect(seen.patches).toHaveLength(1)
  })

  it('labels the Google path differently from the email path', async () => {
    const fetchMock = stubBrevoOk()
    const { admin } = stubAdmin({ claim: { data: ROW }, count: 3 })

    await notifyTeacherSignup(admin, 'teacher-uuid', 'google')
    expect(sentBody(fetchMock).textContent).toContain('Google sign-in')
  })

  it('still sends when the teacher count cannot be read', async () => {
    const fetchMock = stubBrevoOk()
    const { admin } = stubAdmin({ claim: { data: ROW }, count: null })

    expect(await notifyTeacherSignup(admin, 'teacher-uuid', 'email')).toEqual({ sent: true })
    expect(sentBody(fetchMock).textContent).not.toContain('in total')
  })
})
