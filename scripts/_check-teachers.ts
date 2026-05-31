import './env'
import { createClient } from '@supabase/supabase-js'

// Read-only diagnostic: shows each teacher's paid status + free usage, so we can
// see whether the dashboard's client-side guard (free_assessments_used >= 1) is
// what's blocking assessment creation.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

async function main() {
  const { data, error } = await admin
    .from('teachers')
    .select('id, email, paid_until, free_assessments_used, is_admin')
    .order('created_at', { ascending: false })

  if (error) { console.error('query failed:', error.message); process.exit(1) }

  const now = new Date()
  for (const t of data ?? []) {
    const paid = t.paid_until != null && new Date(t.paid_until) > now
    console.log(
      `${(t.email ?? '—').padEnd(34)} free_used=${t.free_assessments_used ?? 0}  paid=${paid}  paid_until=${t.paid_until ?? '—'}  admin=${t.is_admin ?? false}`,
    )
  }
  console.log(`\n${data?.length ?? 0} teacher(s).`)
}

main().then(() => process.exit(0))
