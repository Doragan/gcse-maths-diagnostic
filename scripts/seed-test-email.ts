/**
 * Deliverability seed test — sends the REAL practice emails to addresses you
 * own, so you can see where they land before real students find out.
 *
 *   npx tsx scripts/seed-test-email.ts you@gmail.com you@outlook.com
 *   npx tsx scripts/seed-test-email.ts you@gmail.com --send
 *
 * Dry run unless you pass --send. Add --only=nudge or --only=reengagement to
 * send just one of the two.
 *
 * ── What this is for ────────────────────────────────────────────────────────
 * The re-engagement email has 12 sends and 0 clicks lifetime. That single
 * number has two explanations with opposite fixes:
 *
 *   • it never reached the inbox   → deliverability: DNS, reputation, warming
 *   • it reached the inbox, ignored → the email is wrong: subject, timing, offer
 *
 * A click rate cannot separate them. Seeing a message sit in spam rather than
 * the inbox separates them in a minute, which is the whole point of this file.
 *
 * ── What it deliberately does NOT do ───────────────────────────────────────
 * It writes NOTHING. No `reengagement_sends` row, no `weekly_nudge_sends` row,
 * no analytics event. Triggering the real cron instead would send to real
 * students AND consume their place in the taper — a student lapsed 33 days with
 * 416 attempts would have their one shot spent on a test.
 *
 * It also does not build sender reputation, and self-sends should not be used
 * to try: a handful of addresses belonging to one person, rescuing mail from
 * spam, is the pattern filter-gaming makes — providers weight engagement by
 * recipient diversity, and a detectable seed loop counts against a domain
 * rather than for it. This is a measurement, nothing more.
 */
import './env'
import { Resend } from 'resend'
import { buildReengagementEmail } from '../lib/email/reengagement'
import { buildWeeklyNudgeEmail } from '../lib/email/weeklyNudge'
import { WEEKLY_GOAL } from '../lib/skills/weeklyGoal'

const MAX_RECIPIENTS = 6

const args       = process.argv.slice(2)
const send       = args.includes('--send')
const onlyArg    = args.find(a => a.startsWith('--only='))?.split('=')[1]
const recipients = args.filter(a => !a.startsWith('--'))

const resendKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL
const siteUrl   = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

function fail(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

if (recipients.length === 0) {
  fail('Give at least one address you own:\n' +
       '    npx tsx scripts/seed-test-email.ts you@gmail.com you@outlook.com [--send]')
}
if (recipients.length > MAX_RECIPIENTS) {
  fail(`${recipients.length} recipients — cap is ${MAX_RECIPIENTS}. This is a placement test, not a send.`)
}
for (const r of recipients) {
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(r)) fail(`"${r}" does not look like an email address.`)
}
if (onlyArg && onlyArg !== 'nudge' && onlyArg !== 'reengagement') {
  fail(`--only must be "nudge" or "reengagement", got "${onlyArg}".`)
}
if (!resendKey) fail('RESEND_API_KEY is not set.')

// The guard that makes the test mean anything. With RESEND_FROM_EMAIL unset the
// cron routes fall back to onboarding@resend.dev — Resend's shared sandbox
// domain. Mail from there says nothing whatsoever about how mathsense.net is
// treated, and a clean inbox result would be actively misleading.
if (!fromEmail) {
  fail('RESEND_FROM_EMAIL is not set, so this would send from onboarding@resend.dev —\n' +
       '  a shared sandbox domain. The result would tell you nothing about your own\n' +
       '  domain\'s reputation, which is the entire point. Set it to your real sender.')
}
if (/@resend\.dev$/i.test(fromEmail)) {
  fail(`RESEND_FROM_EMAIL is "${fromEmail}" — a shared sandbox domain, not yours.\n` +
       '  Set it to an address on the domain whose reputation you are testing.')
}

// The same argument as the sender guard, for the other end of the message.
// NEXT_PUBLIC_SITE_URL is localhost in .env.local, and a mail full of
// http://localhost links is both broken for the reader and a spam signal in its
// own right — several filters score unresolvable or non-public hosts. A spam
// verdict caused by the test rig would be indistinguishable from the real thing.
if (/localhost|127\.0\.0\.1|\.local\b/i.test(siteUrl)) {
  fail(`NEXT_PUBLIC_SITE_URL is "${siteUrl}", so every link would point at localhost.\n` +
       '  That breaks the CTA and is itself a spam signal, so the result would not be\n' +
       '  about your email. Run with the live site:\n' +
       `    NEXT_PUBLIC_SITE_URL=https://mathsense.net RESEND_FROM_EMAIL=... \\\n` +
       '      npx tsx scripts/seed-test-email.ts you@gmail.com --send')
}

/**
 * Placeholder link token. The click route resolves the id, finds nothing and
 * still redirects (tracking is best-effort), so the CTA behaves normally. The
 * unsubscribe link will report "Link not recognised" — expected, since there is
 * no ledger row to resolve, and not worth writing one for a test.
 */
const TOKEN = '00000000-0000-0000-0000-000000000000'

const emails = [
  {
    kind: 'reengagement',
    ...buildReengagementEmail({
      displayName:   'Alex',
      totalAttempts: 23,
      skillNames:    ['Rounding', 'Pythagoras’ Theorem'],
      dashboardUrl:   `${siteUrl}/api/email/click?s=${TOKEN}`,
      unsubscribeUrl: `${siteUrl}/api/email/unsubscribe?s=${TOKEN}`,
    }),
  },
  {
    kind: 'nudge',
    ...buildWeeklyNudgeEmail({
      displayName: 'Alex',
      answered:    7,
      goal:        WEEKLY_GOAL,
      practiceUrl:    `${siteUrl}/api/email/click?s=${TOKEN}&k=nudge`,
      unsubscribeUrl: `${siteUrl}/api/email/unsubscribe?s=${TOKEN}&k=nudge`,
    }),
  },
].filter(e => !onlyArg || e.kind === onlyArg)

async function main() {
  console.log(`from:       ${fromEmail}`)
  console.log(`links to:   ${siteUrl}`)
  console.log(`recipients: ${recipients.join(', ')}`)
  console.log(`emails:     ${emails.map(e => e.kind).join(', ')}`)
  console.log(`total:      ${emails.length * recipients.length} message(s)\n`)

  for (const e of emails) console.log(`  [${e.kind}] "${e.subject}"`)

  if (!send) {
    console.log('\nDRY RUN — nothing sent. Add --send to send it.')
    return
  }

  const resend = new Resend(resendKey!)
  let sent = 0, failed = 0

  for (const to of recipients) {
    for (const e of emails) {
      const unsub = e.kind === 'nudge'
        ? `${siteUrl}/api/email/unsubscribe?s=${TOKEN}&k=nudge`
        : `${siteUrl}/api/email/unsubscribe?s=${TOKEN}`
      const { error } = await resend.emails.send({
        from: fromEmail!,
        to,
        subject: e.subject,
        html: e.html,
        text: e.text,
        // Sent with the real headers: List-Unsubscribe is itself a positive
        // signal to several providers, so omitting it would make the test
        // kinder than production and the result useless.
        headers: {
          'List-Unsubscribe': `<${unsub}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      if (error) { console.error(`  ✗ ${e.kind} → ${to}: ${error.message}`); failed++ }
      else       { console.log(`  ✓ ${e.kind} → ${to}`); sent++ }
    }
  }

  console.log(`\nsent ${sent}, failed ${failed}. Nothing was written to the database.`)
  console.log(`
Now check each inbox and record where it landed:

  provider          reengagement   nudge
  ----------------  -------------  -------------
  Gmail             inbox/promo/spam
  Outlook           …
  Yahoo             …

What the result tells you:
  • spam everywhere      → deliverability. Reputation and DNS, not the copy.
  • Promotions/inbox     → it is being SEEN. The 0/10 click rate is then about
                           the email itself, and rewriting the subject and offer
                           is the work — not more DNS.
  • mixed by provider    → usually reputation, since content would fail evenly.`)
}

main().catch(err => { console.error(err); process.exit(1) })
