import './env'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// RLS lockdown probe  (effect-free)
//
// Talks to the database as the ANON role (the same key the browser uses) and
// tries to read and write each table. Reports what the database actually allows.
//
// Safety:
//   • A write that RLS BLOCKS writes nothing — that's the expected/safe result.
//   • INSERT probes use a marker row with most columns missing, so if RLS is
//     open the insert almost always fails a NOT NULL check and still writes
//     nothing. If a row somehow IS written, we delete it with the service role
//     and flag it loudly.
//   • UPDATE probe sets a column to its OWN current value — a no-op even if it
//     succeeds — so no data is ever changed.
//   • DELETE is NOT probed against real rows (too dangerous); we infer write
//     access from INSERT/UPDATE instead.
// ─────────────────────────────────────────────────────────────────────────────

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

const anon    = createClient(URL, ANON, { auth: { persistSession: false } })
const service = createClient(URL, SVC,  { auth: { persistSession: false } })

const MARKER = '__RLS_PROBE__'

const TABLES = [
  'questions',
  'teachers',
  'students',
  'practice_attempts',
  'assessments',
  'analytics_events',
]

type Verdict = 'BLOCKED' | 'ALLOWED' | 'error' | 'n/a'
const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n)

// Interpret a PostgREST error for a write attempt.
//   42501 / "row-level security" → RLS blocked it (good)
//   23502 / 23xxx (constraint)   → got PAST RLS to column checks → anon CAN write (bad)
function classifyWriteError(error: any): { verdict: Verdict; note: string } {
  if (!error) return { verdict: 'ALLOWED', note: 'no error — write went through' }
  const code = error.code ?? ''
  const msg  = (error.message ?? '').toLowerCase()
  if (code === '42501' || msg.includes('row-level security')) {
    return { verdict: 'BLOCKED', note: 'RLS policy denied' }
  }
  if (code.startsWith('23')) {
    return { verdict: 'ALLOWED', note: `passed RLS, hit constraint ${code} (anon write NOT blocked)` }
  }
  // Unknown error — report it verbatim so we don't misread it as locked down.
  return { verdict: 'error', note: `${code} ${error.message ?? ''}`.trim() }
}

async function probeSelect(table: string): Promise<{ verdict: Verdict; note: string }> {
  const { count, error } = await anon
    .from(table)
    .select('*', { count: 'exact', head: true })
  if (error) {
    const code = error.code ?? ''
    if (code === '42501' || (error.message ?? '').toLowerCase().includes('row-level security'))
      return { verdict: 'BLOCKED', note: 'anon cannot read' }
    return { verdict: 'error', note: `${code} ${error.message ?? ''}`.trim() }
  }
  return { verdict: 'ALLOWED', note: `anon can read (${count ?? '?'} rows visible)` }
}

async function probeInsert(table: string): Promise<{ verdict: Verdict; note: string }> {
  // Minimal marker row. A column we can search for later if it unexpectedly writes.
  const row: Record<string, unknown> = { id: undefined }
  delete row.id
  // Put the marker in a plausible text column per table; harmless if it doesn't exist
  // (PostgREST will reject unknown columns, which we treat as "couldn't determine").
  const markerCol: Record<string, string> = {
    questions:        'question_template',
    teachers:         'email',
    students:         'email',
    practice_attempts:'student_id',
    assessments:      'title',
    analytics_events: 'event',
  }
  const col = markerCol[table]
  if (col) row[col] = MARKER

  const { data, error } = await anon.from(table).insert(row).select('id')
  const { verdict, note } = classifyWriteError(error)

  // If a row was actually created, delete it with the service role and flag it.
  if (!error && Array.isArray(data) && data.length) {
    const ids = data.map((d: any) => d.id).filter(Boolean)
    if (ids.length) await service.from(table).delete().in('id', ids)
    return { verdict: 'ALLOWED', note: `⚠ anon INSERT SUCCEEDED — wrote & cleaned up ${ids.length} row(s)` }
  }
  return { verdict, note }
}

async function probeUpdateQuestions(): Promise<{ verdict: Verdict; note: string }> {
  // Fetch one real row with the service role, then ask anon to set a column to
  // its OWN value (a no-op). If the row comes back, anon can update it.
  const { data: sample } = await service
    .from('questions')
    .select('id, is_published')
    .limit(1)
    .single()
  if (!sample) return { verdict: 'n/a', note: 'no rows to test against' }

  const { data, error } = await anon
    .from('questions')
    .update({ is_published: sample.is_published }) // same value → no change
    .eq('id', sample.id)
    .select('id')

  if (error) {
    const { verdict, note } = classifyWriteError(error)
    return { verdict, note }
  }
  if (Array.isArray(data) && data.length)
    return { verdict: 'ALLOWED', note: '⚠ anon UPDATE affected a real row (no data changed)' }
  return { verdict: 'BLOCKED', note: 'RLS hid the row from anon (0 rows updated)' }
}

async function main() {
  // Sanity: confirm the service role works at all.
  const { error: svcErr } = await service.from('questions').select('id', { head: true, count: 'exact' })
  console.log(svcErr
    ? `⚠ service-role read failed: ${svcErr.message}\n`
    : `service-role connection OK\n`)

  console.log(`${pad('TABLE', 18)} ${pad('anon SELECT', 12)} ${pad('anon INSERT', 12)}  notes`)
  console.log('─'.repeat(100))

  for (const table of TABLES) {
    const sel = await probeSelect(table)
    const ins = await probeInsert(table)
    const note = `read: ${sel.note}  |  write: ${ins.note}`
    console.log(`${pad(table, 18)} ${pad(sel.verdict, 12)} ${pad(ins.verdict, 12)}  ${note}`)
  }

  console.log('\nFocused check — can anon WRITE to questions (the admin-protected table)?')
  const upd = await probeUpdateQuestions()
  console.log(`  anon UPDATE questions: ${upd.verdict}  (${upd.note})`)

  console.log('\nInterpretation:')
  console.log('  • questions: anon SELECT ALLOWED is fine (students read questions).')
  console.log('    anon INSERT/UPDATE must be BLOCKED — otherwise the admin guard is bypassable.')
  console.log('  • teachers/students: anon INSERT/UPDATE should be BLOCKED.')
  console.log('  • analytics_events: anon INSERT ALLOWED is expected (telemetry); SELECT should be BLOCKED.')
}

main().then(() => process.exit(0))
