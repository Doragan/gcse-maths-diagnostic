/**
 * Dry run for the daily digest cron. READ-ONLY — it never calls Resend and never
 * writes a row, so it is safe to run against production. It runs the SAME data
 * load and builder the cron route uses and prints the email it would send.
 *
 *   npx tsx scripts/verify-daily-digest.ts          # subject + plain-text body
 *   npx tsx scripts/verify-daily-digest.ts --json   # the builder's raw input
 *
 * Prints aggregates and opaque id prefixes only — never an email address or a
 * display name.
 */
import './env'
import { createClient } from '@supabase/supabase-js'
import { buildDailyDigestEmail } from '../lib/email/dailyDigest'
import { loadDailyDigestInput } from '../lib/email/dailyDigestData'

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !service) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}

async function main() {
  const supabase = createClient(url!, service!)
  const started = Date.now()
  const input = await loadDailyDigestInput(supabase, Date.now())
  const loadMs = Date.now() - started

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(input, null, 2))
    return
  }

  const { subject, text, html } = buildDailyDigestEmail(input)
  console.log(`Subject: ${subject}\n`)
  console.log(text)
  console.log(`\n(html ${html.length} chars; data load ${loadMs} ms — the cron's limit is 60000)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
