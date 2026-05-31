import './env'
import { createClient } from '@supabase/supabase-js'

// Replicates EXACTLY what app/api/assessments/create does at the DB layer, using
// the service role, to find out whether the insert itself is failing. Inserts a
// marker row then deletes it (clean up). Effect-free on success.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

async function main() {
  // Use a real teacher id so teacher_id FK is satisfied.
  const { data: teacher } = await admin
    .from('teachers')
    .select('id, email')
    .limit(1)
    .single()
  if (!teacher) { console.error('no teacher row'); process.exit(1) }
  console.log('using teacher:', teacher.email, teacher.id)

  const row = {
    title: '__INSERT_PROBE__',
    code: generateCode(),
    teacher_id: teacher.id,
    course_id: 'gcse_foundation',
  }
  console.log('inserting:', row)

  const { data, error } = await admin
    .from('assessments')
    .insert(row)
    .select()
    .single()

  if (error) {
    console.error('❌ INSERT FAILED')
    console.error('   code   :', error.code)
    console.error('   message:', error.message)
    console.error('   details:', error.details)
    console.error('   hint   :', error.hint)
    process.exit(1)
  }

  console.log('✓ insert succeeded, row id:', data.id)
  console.log('  columns returned:', Object.keys(data).join(', '))

  // Clean up.
  const { error: delErr } = await admin.from('assessments').delete().eq('id', data.id)
  console.log(delErr ? `⚠ cleanup failed: ${delErr.message}` : '✓ cleaned up probe row')
}

main().then(() => process.exit(0))
