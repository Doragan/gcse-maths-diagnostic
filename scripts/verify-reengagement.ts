/**
 * Dry run for the re-engagement cron. READ-ONLY — it never inserts a send row
 * and never calls Resend, so it is safe against production.
 *
 * Run it after applying supabase/migrations/20260901_reengagement_cadence.sql,
 * BEFORE the next 16:00 UTC cron, to see exactly who the fortnightly cap
 * releases. The first run after that migration frees every student whose single
 * historical send is already older than the cooldown, so the burst is worth
 * looking at rather than discovering in the Resend dashboard.
 *
 *   npx tsx scripts/verify-reengagement.ts
 *
 * Prints aggregate counts and opaque student ids only — never an email address
 * or a display name.
 */
import './env'
import { createClient } from '@supabase/supabase-js'
import { BASE_COOLDOWN_DAYS, MAX_SENDS_PER_LAPSE, contactState, cooldownDaysAfter } from '../lib/email/cadence'

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !service) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}

// Derived exactly as the cron derives them, or the dry run models a different send.
const DAYS         = parseInt(process.env.REENGAGEMENT_DAYS || '', 10) || 4
const MIN_ATTEMPTS = parseInt(process.env.REENGAGEMENT_MIN_ATTEMPTS || '', 10) || 5
const COOLDOWN     = parseInt(process.env.REENGAGEMENT_COOLDOWN_DAYS || '', 10) || BASE_COOLDOWN_DAYS
const MAX_SENDS    = parseInt(process.env.REENGAGEMENT_MAX_SENDS || '', 10) || MAX_SENDS_PER_LAPSE
const BATCH_LIMIT  = parseInt(process.env.REENGAGEMENT_BATCH_LIMIT || '', 10) || 100

async function main() {
  const supabase = createClient(url!, service!)
  const now = Date.now()

  console.log(`lapsed_days=${DAYS}  min_attempts=${MIN_ATTEMPTS}  batch_limit=${BATCH_LIMIT}`)
  console.log(`taper: 1st on lapse, then ${[1, 2, 3, 4].map(n => cooldownDaysAfter(n, COOLDOWN)).join('d, ')}d — stop after ${MAX_SENDS}`)
  console.log('NB batch_limit here comes from .env.local, NOT from Vercel — check the cron\'s JSON for production.\n')

  // ── 1. The selector ─────────────────────────────────────────────────────────
  const { data, error } = await supabase.rpc('get_lapsed_students', {
    p_days: DAYS, p_min_attempts: MIN_ATTEMPTS,
  })
  if (error) {
    console.error('✗ get_lapsed_students failed:', error.message)
    process.exit(1)
  }
  const cohort = (data as { student_id: string; total_attempts: number; last_attempt: string }[]) ?? []
  console.log(`✓ selector returned ${cohort.length} lapsed student(s)`)

  // ── 2. Where each candidate sits in the taper ───────────────────────────────
  const { data: history, error: capErr } = await supabase
    .from('reengagement_sends')
    .select('student_id, sent_at')
    .in('student_id', cohort.map(c => c.student_id))
  if (capErr) {
    console.error('✗ reengagement_sends not readable:', capErr.message)
    process.exit(1)
  }
  const sendsByStudent = new Map<string, number[]>()
  for (const r of history ?? []) {
    const id = r.student_id as string
    if (!sendsByStudent.has(id)) sendsByStudent.set(id, [])
    sendsByStudent.get(id)!.push(Date.parse(r.sent_at as string))
  }

  const states = cohort.map(c => ({
    c,
    s: contactState({
      now, lastAttempt: Date.parse(c.last_attempt),
      sends: sendsByStudent.get(c.student_id) ?? [],
      baseDays: COOLDOWN, maxSends: MAX_SENDS,
    }),
  }))
  const due   = states.filter(x => x.s.due)
  const batch = due.slice(0, BATCH_LIMIT)
  const waiting   = states.filter(x => !x.s.due && !x.s.exhausted)
  const exhausted = states.filter(x => x.s.exhausted)

  console.log(`✓ ${due.length} due, ${waiting.length} waiting out a gap, ${exhausted.length} exhausted`)
  console.log(`  → ${batch.length} would send this run`)
  if (due.length > batch.length) {
    console.log(`  (${due.length - batch.length} held back by the batch limit — they go on the next run)`)
  }

  const line = (x: typeof states[number], note: string) => {
    const days = Math.floor((now - Date.parse(x.c.last_attempt)) / 86400000)
    console.log(`    ${x.c.student_id.slice(0, 8)}…  ${String(x.c.total_attempts).padStart(3)} attempts, ` +
      `last active ${String(days).padStart(3)}d ago, email #${x.s.priorSends + 1}  ${note}`)
  }
  for (const x of batch) line(x, 'SENDING')
  for (const x of waiting) {
    const inDays = Math.ceil((x.s.nextDueAt!.getTime() - now) / 86400000)
    line(x, `due in ${inDays}d`)
  }
  for (const x of exhausted) line(x, 'stopped — only a new attempt reopens it')

  // ── 3. The lifetime cap must be GONE ────────────────────────────────────────
  const { data: all } = await supabase.from('reengagement_sends').select('student_id')
  const rows = (all ?? []) as { student_id: string }[]
  const distinct = new Set(rows.map(r => r.student_id)).size
  console.log(`\n· ledger: ${rows.length} send(s) across ${distinct} student(s)` +
    (rows.length > distinct ? '  ✓ repeat sends exist — the lifetime cap is lifted' : '  (no repeats yet)'))

  // ── 4. The selector must NOT be callable by the client ──────────────────────
  if (anon) {
    const { error: anonErr } = await createClient(url!, anon)
      .rpc('get_lapsed_students', { p_days: DAYS, p_min_attempts: MIN_ATTEMPTS })
    console.log(anonErr
      ? `✓ anon call refused (${anonErr.code ?? 'error'}) — the selector exposes auth.users email`
      : '✗ SECURITY: anon could call get_lapsed_students — check the REVOKEs')
  }

  console.log('\nNothing was written and no email was sent.')
}

main().catch(err => { console.error(err); process.exit(1) })
