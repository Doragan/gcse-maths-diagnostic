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
import { REENGAGEMENT_COOLDOWN_DAYS, cooldownCutoff, dueForContact } from '../lib/email/cadence'

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
const COOLDOWN     = parseInt(process.env.REENGAGEMENT_COOLDOWN_DAYS || '', 10) || REENGAGEMENT_COOLDOWN_DAYS
const BATCH_LIMIT  = parseInt(process.env.REENGAGEMENT_BATCH_LIMIT || '', 10) || 100

async function main() {
  const supabase = createClient(url!, service!)
  const now = Date.now()
  const cutoff = cooldownCutoff(now, COOLDOWN)

  console.log(`lapsed_days=${DAYS}  min_attempts=${MIN_ATTEMPTS}  cooldown_days=${COOLDOWN}  batch_limit=${BATCH_LIMIT}`)
  console.log(`cooldown cutoff: ${cutoff.toISOString()}\n`)

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

  // ── 2. The cadence cap ──────────────────────────────────────────────────────
  const { data: recent, error: capErr } = await supabase
    .from('reengagement_sends')
    .select('student_id')
    .gte('sent_at', cutoff.toISOString())
  if (capErr) {
    console.error('✗ reengagement_sends not readable:', capErr.message)
    process.exit(1)
  }
  const cooling = new Set((recent ?? []).map(r => r.student_id as string))
  const due = dueForContact(cohort, cooling)
  const batch = due.slice(0, BATCH_LIMIT)

  console.log(`✓ ${cooling.size} still cooling down → ${due.length} due, ${batch.length} would send this run`)
  if (due.length > batch.length) {
    console.log(`  (${due.length - batch.length} held back by the batch limit — they go on the next run)`)
  }
  for (const c of batch) {
    const days = Math.floor((now - Date.parse(c.last_attempt)) / 86400000)
    console.log(`    ${c.student_id.slice(0, 8)}…  ${c.total_attempts} attempts, last active ${days}d ago`)
  }

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
