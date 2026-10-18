/**
 * Fetches what the daily digest needs and turns it into the builder's input —
 * server-only, the I/O half of lib/email/dailyDigest.ts. Shared by the cron route
 * and scripts/verify-daily-digest.ts so the dry run exercises exactly the code
 * that sends.
 *
 * ⚠ Requires a service-role client (bypasses RLS) — call only from server code.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { FOUNDER_SEAT_CAP, founderSeatsLeft } from '../founderSeats'
import {
  summariseStudents,
  summariseTraffic,
  type DailyDigestInput,
  type DigestEvent,
  type PaidAccess,
  type PracticeRow,
} from './dailyDigest'

const DAY_MS = 86_400_000
const PAGE_SIZE = 1000
/** Paying students listed individually; the rest are summarised as "…and N more". */
const MAX_PAID_LISTED = 10
/** Concurrent per-student lookups, so a busy week cannot fire hundreds at once. */
const LOOKUP_CHUNK = 10

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>

/**
 * Read every row of a query. A bare select is silently capped at the project's
 * max-rows (1000), which under-counts a multi-day window; and range() without a
 * total order can drop or repeat rows between pages. Callers must therefore order
 * by a column that is unique per row (or add `id` as the tie-breaker).
 */
async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows
}

async function inChunks<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += LOOKUP_CHUNK) {
    out.push(...(await Promise.all(items.slice(i, i + LOOKUP_CHUNK).map(fn))))
  }
  return out
}

/** A student's first or last non-placement practice answer, or null if none. */
async function practiceEdge(
  supabase: SupabaseClient,
  studentId: string,
  ascending: boolean,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('practice_attempts')
    .select('attempted_at')
    .eq('student_id', studentId)
    .neq('kind', 'placement')
    .order('attempted_at', { ascending })
    .limit(1)
  if (error) throw new Error(error.message)
  return (data?.[0]?.attempted_at as string | undefined) ?? null
}

/**
 * Build the digest for the UTC day that ended at the most recent midnight before
 * `nowMs`. Throws on any query error, so the caller can fail loudly instead of
 * emailing numbers that are quietly wrong.
 */
export async function loadDailyDigestInput(
  supabase: SupabaseClient,
  nowMs: number,
): Promise<DailyDigestInput> {
  const now = new Date(nowMs)
  const todayStartMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const todayStart = new Date(todayStartMs).toISOString()
  const weekStart = new Date(todayStartMs - 7 * DAY_MS).toISOString()
  const trafficStart = new Date(todayStartMs - 14 * DAY_MS).toISOString()

  const events = await fetchAll<DigestEvent>((from, to) =>
    supabase
      .from('analytics_events')
      .select('event, session_id, properties, created_at')
      .gte('created_at', trafficStart)
      .lt('created_at', todayStart)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to),
  )

  const attempts = await fetchAll<PracticeRow>((from, to) =>
    supabase
      .from('practice_attempts')
      .select('student_id, attempted_at')
      .neq('kind', 'placement')
      .gte('attempted_at', weekStart)
      .lt('attempted_at', todayStart)
      .order('attempted_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to),
  )

  const activeIds = [...new Set(attempts.map(a => a.student_id))]
  const firstAttemptAt: Record<string, string> = {}
  await inChunks(activeIds, async id => {
    const first = await practiceEdge(supabase, id, true)
    if (first) firstAttemptAt[id] = first
  })

  const { count: totalStudents, error: countErr } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
  if (countErr) throw new Error(countErr.message)

  const { data: paidRows, error: paidErr } = await supabase
    .from('students')
    .select('id, paid_until')
    .gt('paid_until', now.toISOString())
    .order('paid_until', { ascending: true })
    .order('id', { ascending: true })
  if (paidErr) throw new Error(paidErr.message)

  const listed = (paidRows ?? []).slice(0, MAX_PAID_LISTED)
  const paid: PaidAccess[] = await inChunks(listed, async row => {
    const last = await practiceEdge(supabase, row.id as string, false)
    return {
      id: row.id as string,
      daysSincePractised: last ? Math.floor((nowMs - Date.parse(last)) / DAY_MS) : null,
    }
  })

  const dateLabel = new Date(todayStartMs - DAY_MS).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })

  return {
    dateLabel,
    traffic: summariseTraffic(events, todayStartMs),
    students: summariseStudents(attempts, firstAttemptAt, todayStartMs),
    totalStudents: totalStudents ?? 0,
    paidCount: (paidRows ?? []).length,
    paid,
    founderSeatsLeft: await founderSeatsLeft(supabase),
    founderSeatCap: FOUNDER_SEAT_CAP,
  }
}
