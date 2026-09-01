/**
 * Dry run for the weekly-goal nudge cron. READ-ONLY — it never inserts a send
 * row and never calls Resend, so it is safe to run against production.
 *
 * Run it after applying supabase/migrations/20260901_weekly_nudge.sql to confirm
 * the selector exists, is locked down, and picks the cohort you expect, before
 * the first Saturday send.
 *
 *   npx tsx scripts/verify-weekly-nudge.ts
 *
 * Prints aggregate counts and opaque student ids only — never an email address
 * or a display name.
 */
import { createClient } from '@supabase/supabase-js'
import { WEEKLY_GOAL, mondayOf, weekStartDate } from '../lib/skills/weeklyGoal'
import { buildWeeklyNudgeEmail } from '../lib/email/weeklyNudge'

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !service) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}

const ACTIVE_DAYS  = parseInt(process.env.REENGAGEMENT_DAYS || '', 10) || 4
const MIN_PROGRESS = parseInt(process.env.WEEKLY_NUDGE_MIN_PROGRESS || '', 10) || 3
const GOAL         = parseInt(process.env.WEEKLY_GOAL || '', 10) || WEEKLY_GOAL

async function main() {
  const supabase = createClient(url!, service!)
  const now       = Date.now()
  const weekStart = new Date(mondayOf(now)).toISOString()
  const weekKey   = weekStartDate(now)

  console.log(`Week beginning ${weekKey} (UTC Monday)`)
  console.log(`goal=${GOAL}  min_progress=${MIN_PROGRESS}  active_days=${ACTIVE_DAYS}\n`)

  // ── 1. The selector ─────────────────────────────────────────────────────────
  const { data, error } = await supabase.rpc('get_weekly_goal_candidates', {
    p_week_start:   weekStart,
    p_goal:         GOAL,
    p_min_progress: MIN_PROGRESS,
    p_active_days:  ACTIVE_DAYS,
  })
  if (error) {
    console.error('✗ get_weekly_goal_candidates failed:', error.message)
    console.error('  Has 20260901_weekly_nudge.sql been applied in the SQL Editor?')
    process.exit(1)
  }
  const cohort = (data as { student_id: string; answered: number }[]) ?? []
  console.log(`✓ selector returned ${cohort.length} candidate(s)`)
  for (const c of cohort) {
    console.log(`    ${c.student_id.slice(0, 8)}…  ${c.answered}/${GOAL} this week`)
  }

  // ── 2. The frequency cap ────────────────────────────────────────────────────
  const { data: already, error: capErr } = await supabase
    .from('weekly_nudge_sends')
    .select('student_id')
    .eq('week_start', weekKey)
  if (capErr) {
    console.error('\n✗ weekly_nudge_sends not readable:', capErr.message)
    process.exit(1)
  }
  const emailed = new Set((already ?? []).map(r => r.student_id as string))
  const wouldSend = cohort.filter(c => !emailed.has(c.student_id))
  console.log(`\n✓ ${emailed.size} already emailed this week → would send ${wouldSend.length}`)

  // ── 3. The selector must NOT be callable by the client ──────────────────────
  if (anon) {
    const { error: anonErr } = await createClient(url!, anon).rpc('get_weekly_goal_candidates', {
      p_week_start: weekStart, p_goal: GOAL, p_min_progress: MIN_PROGRESS, p_active_days: ACTIVE_DAYS,
    })
    console.log(anonErr
      ? `✓ anon call refused (${anonErr.code ?? 'error'}) — the selector exposes auth.users email`
      : '✗ SECURITY: anon could call get_weekly_goal_candidates — check the REVOKEs')
  } else {
    console.log('· skipped the anon lockdown check (no NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  // ── 4. What the first recipient would actually read ─────────────────────────
  if (wouldSend.length > 0) {
    const { subject } = buildWeeklyNudgeEmail({
      displayName: '', answered: wouldSend[0].answered, goal: GOAL,
      practiceUrl: '…', unsubscribeUrl: '…',
    })
    console.log(`\nFirst subject line would be: "${subject}"`)
  }
  console.log('\nNothing was written and no email was sent.')
}

main().catch(err => { console.error(err); process.exit(1) })
