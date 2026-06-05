import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Teacher roster for a class.
//
// This is the cross-account read at the heart of the membership feature: a
// teacher reading fields from another user's (the student's) account. We keep
// it SERVER-SIDE under the service role and gate it on class ownership, and we
// expose ONLY display_name + year_group — never a student's subscription /
// billing columns or their private practice detail. (There is deliberately no
// broad SELECT policy on `students`.)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: classId } = await params

    // ── Authenticate ───────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // ── Authorise: caller must OWN this class before any student data leaks ─────
    const { data: cls } = await admin
      .from('classes')
      .select('id, teacher_id')
      .eq('id', classId)
      .single()
    if (!cls || cls.teacher_id !== user.id) {
      // 404 (not 403) so a non-owner can't even confirm a class id exists.
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ── Active roster (column-scoped) ──────────────────────────────────────────
    const { data: members, error } = await admin
      .from('class_memberships')
      .select('student_id, joined_at, students(display_name, year_group)')
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })
    if (error) {
      console.error('class members load failed:', error)
      return NextResponse.json({ error: 'Failed to load members' }, { status: 500 })
    }

    const roster = (members ?? []).map((m: any) => ({
      student_id: m.student_id,
      display_name: m.students?.display_name ?? 'Unknown',
      year_group: m.students?.year_group ?? null,
      joined_at: m.joined_at,
    }))

    return NextResponse.json({ members: roster })
  } catch (err: any) {
    console.error('class members route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
