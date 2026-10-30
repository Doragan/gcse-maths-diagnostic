import './env'
import { randomBytes } from 'crypto'
import { writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// A throwaway TEACHER account, plus invitations on the demo class.
//
//   npx tsx scripts/seed-demo-teacher.ts                       (plan only)
//   npx tsx scripts/seed-demo-teacher.ts --apply --out=PATH    (write)
//   npx tsx scripts/seed-demo-teacher.ts --teardown --apply    (remove)
//
// WHY THIS EXISTS, separately from seed-demo-class.ts. That script attaches a
// class to a teacher who ALREADY EXISTS (`--teacher=you@example.com`), because
// its job is to fill a real tutor's dashboard. This one creates an account
// nobody owns, so screenshots of the signed-in surfaces can be taken WITHOUT
// anyone's real password and WITHOUT a real pupil's name reaching a public
// page. Run this first, then seed-demo-class against the address below, then
// this again to add the invitations (it is idempotent, and the invitations need
// the class to exist).
//
// ⚠ THIS WRITES TO THE LIVE DATABASE. `.env.local` points at production; there
// is no separate development instance. Hence:
//
//   * EVERYTHING IS TAGGED with MARKER, and --teardown deletes exactly the rows
//     carrying it. Nothing is matched by shape or guessed at.
//   * THE ADDRESSES CAN NEVER RECEIVE MAIL. `.invalid` is reserved by RFC 2606
//     and does not resolve.
//   * NO REMINDER CONSENT IS SET, so both email crons ignore the account twice
//     over (they gate on raw_user_meta_data.email_reminders).
//   * NO `paid_until` IS SET. The teacher-grant arm added in 20261027 turns
//     that column into an entitlement for every student in the teacher's
//     classes, so setting it here would quietly hand premium to the seeded
//     cohort and make a seeded row look like a paying customer.
//
//   * ⚠ IT MOVES A NUMBER YOU READ. This is one extra row in `teachers`, and
//     "teacher accounts created since <date>" has been used as evidence in this
//     project within the last week. Tear it down before reading that figure, or
//     subtract one. The marker makes it filterable either way.
//
// THE PASSWORD IS NEVER PRINTED TO THE TERMINAL. It is written to --out, which
// should be a path OUTSIDE the repository, so it cannot be committed. Sign in
// with it ONLY against a local dev server (http://localhost:3000); it is a test
// credential for a throwaway account and belongs nowhere else.
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const TEARDOWN = args.includes('--teardown')
const OUT = args.find(a => a.startsWith('--out='))?.split('=')[1]

const MARKER = 'demo-seed-teacher'
const EMAIL = `${MARKER}@example.invalid`
const DISPLAY = `Demo Teacher (${MARKER})`

/** The class seed-demo-class.ts --shape=class creates. */
const CLASS_MARKER = 'demo-seed-class'

/**
 * Eight invitations, three already accepted — so the roster reads
 * "Invited (3 of 8 joined)", which is the state the guide screenshot is for.
 *
 * `sent_at` is set on the pending five deliberately: invitationState() maps a
 * pending row with no sent_at to 'not_sent' ("Not sent"), which is a DIFFERENT
 * and more alarming label than 'waiting' ("Invited, not joined yet"). A
 * screenshot showing five "Not sent" rows would advertise a delivery failure.
 */
const INVITES = [
  { local: 'a.pupil', joined: true },
  { local: 'b.pupil', joined: true },
  { local: 'c.pupil', joined: true },
  { local: 'd.pupil', joined: false },
  { local: 'e.pupil', joined: false },
  { local: 'f.pupil', joined: false },
  { local: 'g.pupil', joined: false },
  { local: 'h.pupil', joined: false },
]

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

async function findUser(): Promise<{ id: string } | null> {
  // listUsers is paginated; this project has few hundred users at most.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    const hit = data.users.find(u => u.email?.toLowerCase() === EMAIL)
    if (hit) return { id: hit.id }
    if (data.users.length < 200) return null
  }
  return null
}

async function teardown() {
  const existing = await findUser()

  const { data: cls } = await db
    .from('classes').select('id, name').ilike('name', `%${CLASS_MARKER}%`)
  const classIds = (cls ?? []).map(c => c.id)

  let inviteCount = 0
  if (classIds.length) {
    const { data: inv } = await db
      .from('class_invitations').select('id').in('class_id', classIds)
      .ilike('email', `%@example.invalid`)
    inviteCount = (inv ?? []).length
  }

  console.log('teardown plan:')
  console.log('  teacher account:', existing ? EMAIL : '(none)')
  console.log('  invitations:    ', inviteCount)
  if (!APPLY) { console.log('\n(plan only — pass --apply to delete)'); return }

  if (classIds.length) {
    const { error } = await db
      .from('class_invitations').delete().in('class_id', classIds)
      .ilike('email', `%@example.invalid`)
    if (error) throw new Error(`invitations: ${error.message}`)
  }
  if (existing) {
    const { error } = await db.auth.admin.deleteUser(existing.id)
    if (error) throw new Error(`auth user: ${error.message}`)
  }
  console.log('\ndeleted.')
}

async function apply() {
  // ── The account ───────────────────────────────────────────────────────────
  let user = await findUser()
  let password: string | null = null

  if (user) {
    console.log('teacher account: already exists, left as it is')
  } else if (!APPLY) {
    console.log('teacher account: WOULD create', EMAIL)
  } else {
    // 24 bytes of urandom, base64url. Written to --out, never logged.
    password = randomBytes(24).toString('base64url')
    const { data, error } = await db.auth.admin.createUser({
      email: EMAIL,
      password,
      email_confirm: true,                       // so sign-in works immediately
      user_metadata: { display_name: DISPLAY },  // NO email_reminders, ever
    })
    if (error) throw new Error(`createUser: ${error.message}`)
    user = { id: data.user.id }
    console.log('teacher account: created', EMAIL)

    // handle_new_user inserts `(id)` only, but teachers.email is NOT NULL in
    // the captured schema — so set it here rather than relying on the trigger
    // having produced a usable row.
    const { error: tErr } = await db
      .from('teachers').upsert({ id: user.id, email: EMAIL }, { onConflict: 'id' })
    if (tErr) throw new Error(`teachers row: ${tErr.message}`)
  }

  if (password && OUT) {
    writeFileSync(OUT, JSON.stringify({
      email: EMAIL,
      password,
      note: 'Throwaway account. Sign in ONLY at http://localhost:3000. Delete with --teardown --apply.',
    }, null, 2))
    console.log('credentials written to', OUT)
  } else if (password && !OUT) {
    console.error('\n⚠ No --out given, so the password is lost. Tear down and re-run with --out=PATH.')
  }

  // ── The invitations ───────────────────────────────────────────────────────
  const { data: cls } = await db
    .from('classes').select('id, name').ilike('name', `%${CLASS_MARKER}%`).limit(1)
  const klass = (cls ?? [])[0]

  if (!klass) {
    console.log('\ninvitations: no class matching', `%${CLASS_MARKER}%`,
      '— run seed-demo-class.ts --shape=class --apply first, then re-run this.')
    return
  }

  const now = new Date()
  const rows = INVITES.map((inv, i) => ({
    class_id: klass.id,
    email: `${inv.local}@example.invalid`,
    status: inv.joined ? 'accepted' : 'pending',
    // Spread over the last few days so the list does not look machine-made.
    created_at: new Date(now.getTime() - (9 - i) * 86_400_000).toISOString(),
    sent_at: new Date(now.getTime() - (9 - i) * 86_400_000 + 60_000).toISOString(),
    accepted_at: inv.joined
      ? new Date(now.getTime() - (6 - i) * 86_400_000).toISOString()
      : null,
  }))

  console.log(`\ninvitations: ${APPLY ? 'writing' : 'WOULD write'} ${rows.length} on "${klass.name}"`,
    `(${INVITES.filter(i => i.joined).length} joined)`)
  if (!APPLY) return

  const { error } = await db
    .from('class_invitations')
    .upsert(rows, { onConflict: 'class_id,email' })
  if (error) throw new Error(`invitations: ${error.message}`)
  console.log('done.')
}

async function main() {
  if (!APPLY) console.log('── PLAN ONLY (pass --apply to write) ──\n')
  if (TEARDOWN) await teardown()
  else await apply()
}

main().catch(e => { console.error('\nFAILED:', e.message ?? e); process.exit(1) })
