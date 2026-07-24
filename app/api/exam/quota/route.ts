import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isPaidStudent } from '../../../../lib/entitlements'
import { resolveMiniExamQuota, FREE_MINI_EXAMS_PER_MONTH } from '../../../../lib/exam/monthlyQuota'

// ─────────────────────────────────────────────────────────────────────────────
// Mini-exam monthly allowance — server-side gate.
//
// Free students get FREE_MINI_EXAMS_PER_MONTH generations per calendar month;
// paid students are unlimited. The count MUST be enforced here: a student can
// read but not write their own `students` row (UPDATE is REVOKEd — the
// SEC-CRIT-1 lockdown), so the browser can't be trusted to hold the line.
//
//   GET  — peek: how many the caller has left this month (no mutation).
//   POST — consume: check-and-increment; 402 when the free limit is spent.
//
// Mirrors app/api/assessments/create: authenticate the JWT with the anon client
// (no RLS bypass), then read/write authoritatively under the service role.
// ─────────────────────────────────────────────────────────────────────────────

async function authedStudent(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return { error: 'Not authenticated' as const, status: 401 }
  const token = authHeader.replace('Bearer ', '')

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: { user }, error } = await authClient.auth.getUser(token)
  if (error || !user) return { error: 'Not authenticated' as const, status: 401 }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: student, error: sErr } = await admin
    .from('students')
    .select('subscription_tier, paid_until, mini_exam_period, mini_exams_used')
    .eq('id', user.id)
    .single()
  if (sErr || !student) return { error: 'Student not found' as const, status: 404 }

  return { userId: user.id, admin, student }
}

export async function GET(req: Request) {
  try {
    const ctx = await authedStudent(req)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const isPaid = isPaidStudent(ctx.student)
    const q = resolveMiniExamQuota(
      { period: ctx.student.mini_exam_period ?? null, used: ctx.student.mini_exams_used ?? 0 },
      new Date(), isPaid,
    )
    return NextResponse.json({ isPaid, remaining: q.remaining, limit: FREE_MINI_EXAMS_PER_MONTH })
  } catch (err) {
    console.error('exam quota GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await authedStudent(req)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const isPaid = isPaidStudent(ctx.student)
    const q = resolveMiniExamQuota(
      { period: ctx.student.mini_exam_period ?? null, used: ctx.student.mini_exams_used ?? 0 },
      new Date(), isPaid,
    )

    if (!q.allowed) {
      return NextResponse.json(
        { allowed: false, code: 'LIMIT_REACHED', remaining: 0, isPaid },
        { status: 402 },
      )
    }

    // Persist the consumed generation. Read-then-write (not atomic): the worst a
    // deliberate race buys a free student is one extra mini-exam — the same
    // trade-off the assessments free counter accepts.
    const { error: upErr } = await ctx.admin
      .from('students')
      .update({ mini_exam_period: q.next.period, mini_exams_used: q.next.used })
      .eq('id', ctx.userId)
    if (upErr) {
      console.error('exam quota increment failed:', upErr.message)
      return NextResponse.json({ error: 'Could not start the mini-exam' }, { status: 500 })
    }

    const remaining = isPaid ? null : Math.max(0, FREE_MINI_EXAMS_PER_MONTH - q.next.used)
    return NextResponse.json({ allowed: true, remaining, isPaid })
  } catch (err) {
    console.error('exam quota POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
