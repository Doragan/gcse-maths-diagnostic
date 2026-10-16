import './env'
import { createClient } from '@supabase/supabase-js'
import { skills } from '../data/skills'
import { generateClassCode } from '../lib/classCode'

// ─────────────────────────────────────────────────────────────────────────────
// Seed a realistic 1:1 class, so the teacher dashboard has something to show.
//
//   npx tsx scripts/seed-demo-class.ts --teacher=you@example.com            (plan only)
//   npx tsx scripts/seed-demo-class.ts --teacher=you@example.com --apply    (write)
//   npx tsx scripts/seed-demo-class.ts --teardown                           (remove)
//
// WHY THIS EXISTS. The per-student view is the best thing on the teacher side —
// overall mastery, per-topic bars, a per-skill breakdown and the student's own
// weekly trend — and it is unusable as a demo because almost nobody has ever
// used it. Showing a prospective tutor an empty dashboard is worse than showing
// them nothing. This fills ONE class with one student's plausible history, in
// the one-class-per-student shape a 1:1 tutor should actually use.
//
// ⚠ THIS WRITES TO THE LIVE DATABASE. There is no separate development
// instance; `.env.local` points at production. That is the whole reason for the
// care below, and for `--apply` not being the default.
//
//   * EVERYTHING IS TAGGED. The class name, the student's display name and the
//     email address all carry MARKER, and --teardown deletes exactly the rows
//     that carry it. Nothing is matched by shape or guessed at.
//
//   * THE ADDRESS CAN NEVER RECEIVE MAIL. `.invalid` is reserved by RFC 2606
//     and does not resolve, so even a bug that tried to email this account
//     could not reach a real inbox.
//
//   * NO REMINDER CONSENT IS SET. Both email crons gate on
//     `raw_user_meta_data.email_reminders` being true (20260630_reengagement),
//     and this never sets it, so the seeded account is invisible to them twice
//     over.
//
//   * IT MOVES YOUR NUMBERS. One extra student account, one extra class, and
//     ~45 practice attempts. Student counts and day-2 retention are computed
//     over these tables, so run --teardown before reading those figures again,
//     or subtract one.
//
// ── What it deliberately does NOT seed ──────────────────────────────────────
//
//   * NO paper_sittings. "Zero papers have ever been marked through the
//     product" is a true statement you may want to make to a tutor, and a
//     seeded sitting would quietly make it false. The marking tool also demos
//     perfectly well live, with no account at all.
//   * NO exam_sessions. The readiness panel stays empty, which is honest: it is
//     fed by real mini-exams and faking one means fabricating a paper, a
//     parameter draw and a set of typed answers convincing enough to re-grade.
//
// So the modal shows mastery, topics, per-skill detail and the trend, and the
// readiness section is absent. That is the bulk of it and none of it is a lie.
// ─────────────────────────────────────────────────────────────────────────────

/** Carried by every row this script creates. Teardown matches on it. */
const MARKER = 'demo-seed'

const CLASS_NAME = `Thursday 4pm (${MARKER})`
const STUDENT_NAME = `Priya K (${MARKER})`
const STUDENT_EMAIL = `${MARKER}-priya@example.invalid`
const YEAR_GROUP = 'Year 9'

/** Weeks of history to spread attempts over, so the trend chart has points. */
const WEEKS = 6

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const TEARDOWN = args.includes('--teardown')
const teacherEmail = args.find(a => a.startsWith('--teacher='))?.split('=')[1]?.toLowerCase()

/**
 * The three mastery outcomes, and the attempt sequences that produce them.
 *
 * Taken from `masteryStatusFor` in lib/skills/masteryEngine.ts rather than
 * guessed: with 5 or more attempts it is 4-of-the-last-5 correct for
 * `mastered`, otherwise `needs_practice`; under 5 attempts, the first three all
 * correct fast-tracks to `mastered`, otherwise `in_progress`.
 *
 * Oldest first. Each sequence is the shortest one that lands unambiguously on
 * its target, so a later change to the thresholds breaks this loudly rather
 * than drifting into a dashboard that quietly means something else.
 */
const SEQUENCES: Record<'mastered' | 'needs_practice' | 'in_progress', boolean[]> = {
  // 5 attempts, 4 of the last 5 correct. The early slip is deliberate: an
  // unbroken run would also fast-track, and this proves the window works.
  mastered:       [false, true, true, true, true],
  // 5 attempts, 3 correct — one short of the bar.
  needs_practice: [true, false, true, false, true],
  // 2 attempts: too few for the window, too few to fast-track.
  in_progress:    [true, false],
}

/** A plausible spread for one student a few weeks into tutoring. */
const PLAN: Array<{ status: keyof typeof SEQUENCES; count: number }> = [
  { status: 'mastered', count: 5 },
  { status: 'needs_practice', count: 4 },
  { status: 'in_progress', count: 3 },
]

type SkillPick = { skillId: string; questionIds: string[]; topic: string }

/**
 * Choose skills that actually have published questions, spread across topics.
 *
 * `practice_attempts.question_id` is a real foreign key, so an invented id
 * fails the insert. Reading the bank also means this script keeps working as
 * the bank changes, instead of carrying a hard-coded list that rots.
 */
async function pickSkills(need: number): Promise<SkillPick[]> {
  const { data, error } = await db
    .from('questions')
    .select('id, skill_ids')
    .eq('is_published', true)
  if (error) throw new Error(`questions: ${error.message}`)

  const bySkill = new Map<string, string[]>()
  for (const q of data ?? []) {
    for (const s of (q.skill_ids as string[] | null) ?? []) {
      if (!bySkill.has(s)) bySkill.set(s, [])
      bySkill.get(s)!.push(q.id as string)
    }
  }

  const topicOf = new Map(skills.map(s => [s.id, s.topic]))

  // Round-robin across topics so the per-topic bars are not all one colour.
  const byTopic = new Map<string, SkillPick[]>()
  for (const [skillId, questionIds] of bySkill) {
    const topic = topicOf.get(skillId)
    if (!topic) continue
    if (!byTopic.has(topic)) byTopic.set(topic, [])
    byTopic.get(topic)!.push({ skillId, questionIds, topic })
  }

  const queues = [...byTopic.values()].map(list =>
    // Deepest skills first: more questions means a more plausible history.
    [...list].sort((a, b) => b.questionIds.length - a.questionIds.length),
  )

  const out: SkillPick[] = []
  for (let round = 0; out.length < need; round++) {
    const before = out.length
    for (const q of queues) {
      if (out.length >= need) break
      const next = q[round]
      if (next) out.push(next)
    }
    if (out.length === before) break // every topic exhausted
  }
  return out
}

async function findTeacher(email: string): Promise<string> {
  const { data, error } = await db.from('teachers').select('id, email').eq('email', email).maybeSingle()
  if (error) throw new Error(`teachers: ${error.message}`)
  if (!data) throw new Error(`No teacher account with address ${email}. Sign up as a teacher first.`)
  return data.id as string
}

// ── Teardown ────────────────────────────────────────────────────────────────

/**
 * Remove everything this script made, in foreign-key order.
 *
 * Deleting the auth user cascades to `students`, and `class_memberships`
 * references the student, so attempts and memberships go first. The class is
 * last because the membership points at it.
 */
async function teardown() {
  const { data: students } = await db
    .from('students').select('id, display_name').ilike('display_name', `%${MARKER}%`)
  const studentIds = (students ?? []).map(s => s.id as string)

  const { data: classes } = await db
    .from('classes').select('id, name').ilike('name', `%${MARKER}%`)
  const classIds = (classes ?? []).map(c => c.id as string)

  console.log(`found ${studentIds.length} seeded student(s), ${classIds.length} seeded class(es)`)
  if (!APPLY) {
    console.log('\nDRY RUN — nothing deleted. Re-run with --apply to remove them.')
    return
  }

  for (const id of studentIds) {
    const { count } = await db
      .from('practice_attempts').delete({ count: 'exact' }).eq('student_id', id)
    console.log(`  deleted ${count ?? 0} attempt(s) for ${id}`)
    await db.from('class_memberships').delete().eq('student_id', id)
    const { error } = await db.auth.admin.deleteUser(id)
    // The students row goes with the auth user; if that fails, say so rather
    // than leaving a half-removed account behind without a word.
    console.log(`  deleted account ${id}${error ? ` — FAILED: ${error.message}` : ''}`)
  }
  for (const id of classIds) {
    await db.from('classes').delete().eq('id', id)
    console.log(`  deleted class ${id}`)
  }
  console.log('\nTeardown complete.')
}

// ── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  if (!teacherEmail) {
    throw new Error('Pass --teacher=<the email on your teacher account>')
  }
  const teacherId = await findTeacher(teacherEmail)

  const needed = PLAN.reduce((n, p) => n + p.count, 0)
  const picks = await pickSkills(needed)
  if (picks.length < needed) {
    console.warn(`⚠ only ${picks.length} skills with published questions — seeding those`)
  }

  // Assign a target status to each skill, in plan order.
  const assigned: Array<{ pick: SkillPick; status: keyof typeof SEQUENCES }> = []
  let i = 0
  for (const { status, count } of PLAN) {
    for (let n = 0; n < count && i < picks.length; n++, i++) {
      assigned.push({ pick: picks[i], status })
    }
  }

  // Build the attempts. Spread back over WEEKS so the weekly trend has shape,
  // with each skill's own attempts in order and a day or so apart.
  const now = Date.now()
  const DAY = 86_400_000
  const rows: Array<Record<string, unknown>> = []
  assigned.forEach(({ pick, status }, idx) => {
    const seq = SEQUENCES[status]
    // Stagger skills across the window so they do not all land in week one.
    const startDaysAgo = WEEKS * 7 - Math.floor((idx / assigned.length) * (WEEKS * 7 - 3))
    seq.forEach((correct, n) => {
      const daysAgo = Math.max(0, startDaysAgo - n * 2)
      rows.push({
        student_id: null, // filled once the account exists
        question_id: pick.questionIds[n % pick.questionIds.length],
        skill_ids: [pick.skillId],
        correct,
        attempted_at: new Date(now - daysAgo * DAY).toISOString(),
        kind: 'mastery',
      })
    })
  })

  console.log(`\nteacher    : ${teacherEmail} (${teacherId})`)
  console.log(`class      : ${CLASS_NAME}`)
  console.log(`student    : ${STUDENT_NAME} <${STUDENT_EMAIL}>, ${YEAR_GROUP}`)
  console.log(`attempts   : ${rows.length} across ${assigned.length} skills, over ${WEEKS} weeks`)
  for (const { pick, status } of assigned) {
    console.log(`             ${status.padEnd(15)} ${pick.topic.padEnd(22)} ${pick.skillId}`)
  }

  if (!APPLY) {
    console.log('\nDRY RUN — nothing written. Re-run with --apply.')
    return
  }

  // ── Student ──────────────────────────────────────────────────────────────
  // FIRST, before the class, because this is the step that can fail. An earlier
  // version created the class first and a trigger rejection left an orphaned
  // class behind with no student in it. The account is the risky write; do it
  // while there is still nothing to clean up.
  //
  // THE METADATA KEYS ARE LOAD-BEARING, all three of them:
  //
  //   role         — the signup trigger routes on
  //                  raw_user_meta_data->>'role' (20260913_auth_signup_triggers
  //                  .sql §62). Without it, no students row is created at all.
  //   display_name — `students.display_name` is NOT NULL and handle_new_student
  //                  takes it straight from the metadata, so omitting it aborts
  //                  the whole insert inside the trigger. Supabase surfaces that
  //                  only as "Database error creating new user", which names
  //                  neither the column nor the trigger — so it is written down
  //                  here rather than rediscovered.
  //   year_group   — nullable, but passed through the same path.
  //
  // email_confirm bypasses the confirmation mail: there is no inbox to send it
  // to, and an unconfirmed account cannot accept an invitation anyway.
  //
  // Note what is NOT here: email_reminders. Leaving it unset is what keeps this
  // account out of both email crons.
  const { data: created, error: userErr } = await db.auth.admin.createUser({
    email: STUDENT_EMAIL,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      role: 'student',
      display_name: STUDENT_NAME,
      year_group: YEAR_GROUP,
      confirmed_13: true,
    },
  })
  if (userErr || !created.user) throw new Error(`createUser: ${userErr?.message}`)
  const studentId = created.user.id
  console.log(`\n✅ student account ${studentId}`)

  // Belt and braces: the trigger should already have set these from the
  // metadata above. If it did not, the seeded student would be unrecognisable
  // on the roster AND invisible to --teardown, which matches on the name.
  const { error: profErr } = await db
    .from('students')
    .update({ display_name: STUDENT_NAME, year_group: YEAR_GROUP, confirmed_13: true })
    .eq('id', studentId)
  if (profErr) throw new Error(`students update: ${profErr.message} (did the trigger run?)`)

  // ── Class ────────────────────────────────────────────────────────────────
  const { data: cls, error: clsErr } = await db
    .from('classes')
    .insert({ name: CLASS_NAME, code: generateClassCode(), teacher_id: teacherId })
    .select('id, code').single()
  if (clsErr || !cls) throw new Error(`class insert: ${clsErr?.message}`)
  console.log(`✅ class ${cls.id} (join code ${cls.code})`)

  // ── Membership ───────────────────────────────────────────────────────────
  const { error: memErr } = await db
    .from('class_memberships')
    .insert({ class_id: cls.id, student_id: studentId, status: 'active' })
  if (memErr) throw new Error(`membership: ${memErr.message}`)
  console.log('✅ joined the class')

  // ── Attempts ─────────────────────────────────────────────────────────────
  const withStudent = rows.map(r => ({ ...r, student_id: studentId }))
  const { error: attErr } = await db.from('practice_attempts').insert(withStudent)
  if (attErr) throw new Error(`attempts: ${attErr.message}`)
  console.log(`✅ ${withStudent.length} practice attempts`)

  console.log(`\nOpen the class, click ${STUDENT_NAME}, and the detail modal should show`)
  console.log('overall mastery, a per-topic breakdown, the per-skill list and a 6-week trend.')
  console.log(`\nWhen you are done:  npx tsx scripts/seed-demo-class.ts --teardown --apply`)
}

async function main() {
  if (TEARDOWN) return teardown()
  return seed()
}

main().then(() => process.exit(0)).catch(e => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
