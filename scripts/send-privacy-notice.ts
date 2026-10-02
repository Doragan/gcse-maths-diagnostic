/**
 * One-off sender for a privacy-notice change notification.
 *
 * The published notice (§11) promises to tell registered users about
 * significant changes by email. This is how that promise is kept. It is not a
 * cron and not part of the app: run it by hand, once, per notice version.
 *
 *   npx tsx scripts/send-privacy-notice.ts --body email.txt            # dry run
 *   npx tsx scripts/send-privacy-notice.ts --body email.txt --send     # for real
 *
 * ── Why a script and not Brevo's campaign tools ─────────────────────────────
 * A campaign would mean importing every learner as a marketing contact, which
 * creates a contact list that outlives the send and files a service notice as
 * marketing. This sends each person their own message and stores no list.
 *
 * ── Why not BCC ─────────────────────────────────────────────────────────────
 * One mis-click puts every recipient's address in front of every other
 * recipient. Most of these belong to children. That is a reportable breach
 * caused by a UI slip, so the possibility is removed rather than managed.
 *
 * ── Why Brevo and not Resend ────────────────────────────────────────────────
 * Resend stores in the United States. Most learners never opted in to practice
 * reminders, so Resend holds nothing for them; sending this through Resend
 * would transfer their address to the US purely to tell them about transfers to
 * the US. Brevo stores in the EU. See docs/audit/21 §5.
 *
 * ── Who is excluded, deliberately ───────────────────────────────────────────
 * Accounts whose email address was never confirmed. An unconfirmed address may
 * not belong to the person who typed it, and emailing it would tell whoever
 * does own it that an account exists in their name.
 *
 * ── Idempotency ─────────────────────────────────────────────────────────────
 * Every success is appended to a local ledger keyed on the notice version, and
 * addresses already in it are skipped. A crash halfway through, or a nervous
 * second run, cannot double-mail anyone. The ledger holds addresses, so it is
 * written outside the repo and must not be committed.
 */
import './env'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'

// ── The version this send belongs to. BUMP IT for a new notice version, or the
// ledger will think everyone has already been told. ────────────────────────────
const NOTICE_VERSION = '1.4'
const SUBJECT = 'An update to our privacy notice'

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'accounts@mathsense.net'
const FROM_NAME = 'Mathsense'

/** Pause between sends. Brevo's free tier allows 300/day; this is politeness,
 *  not a limit — it keeps a burst of ~112 from looking like a blast. */
const GAP_MS = 1200

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const brevoKey = process.env.BREVO_API_KEY

const args = process.argv.slice(2)
const send = args.includes('--send')
const bodyPath = args[args.indexOf('--body') + 1]

if (!url || !service) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}
if (!bodyPath || !existsSync(bodyPath)) {
  console.error('Pass the message body with --body <file.txt>. Plain text, no HTML.')
  process.exit(1)
}
if (send && !brevoKey) {
  console.error('Set BREVO_API_KEY to send. It is the API key, NOT the SMTP key.')
  process.exit(1)
}

const body = readFileSync(bodyPath, 'utf-8')

// Ledger lives outside the repo: it contains email addresses.
const ledgerPath = join(tmpdir(), 'mathsense', `privacy-notice-${NOTICE_VERSION}.sent`)
mkdirSync(dirname(ledgerPath), { recursive: true })
const alreadySent = new Set(
  existsSync(ledgerPath)
    ? readFileSync(ledgerPath, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean)
    : [],
)

const admin = createClient(url, service, { auth: { persistSession: false } })

async function recipients(): Promise<string[]> {
  const out: string[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    for (const u of data.users) {
      // Confirmed only. See the header for why.
      if (u.email && u.email_confirmed_at) out.push(u.email)
    }
    if (data.users.length < 1000) break
  }
  return [...new Set(out)]
}

async function sendOne(to: string): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoKey!,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject: SUBJECT,
      textContent: body,
    }),
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`)
  }
}

async function main() {
  const all = await recipients()
  const pending = all.filter(e => !alreadySent.has(e))

  console.log(`notice version   : ${NOTICE_VERSION}`)
  console.log(`subject          : ${SUBJECT}`)
  console.log(`from             : ${FROM_NAME} <${FROM_EMAIL}>`)
  console.log(`confirmed accounts: ${all.length}`)
  console.log(`already sent      : ${all.length - pending.length}`)
  console.log(`to send           : ${pending.length}`)
  console.log(`ledger            : ${ledgerPath}`)

  if (!send) {
    console.log('\n─── DRY RUN. Nothing sent. Re-run with --send. ───')
    console.log('\nFirst 400 characters of the body:\n')
    console.log(body.slice(0, 400))
    return
  }

  let ok = 0
  const failures: string[] = []
  for (const [i, to] of pending.entries()) {
    try {
      await sendOne(to)
      // Append immediately, before the next send. If the process dies here the
      // ledger is still correct; the alternative loses the record of a message
      // that actually went out, and re-running would mail that person twice.
      appendFileSync(ledgerPath, to + '\n')
      ok++
    } catch (err) {
      // Carry on. One rejected address must not strand the other 111.
      failures.push(`${to}: ${err instanceof Error ? err.message : String(err)}`)
    }
    if (i < pending.length - 1) await new Promise(r => setTimeout(r, GAP_MS))
  }

  console.log(`\nsent    : ${ok}`)
  console.log(`failed  : ${failures.length}`)
  if (failures.length) {
    console.log('\nFailures — re-running the script will retry exactly these:')
    for (const f of failures) console.log('  ' + f)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
