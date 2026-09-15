import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Delete the caller's own account.
//
// 🔴 THIS ROUTE NEVER WORKED, for two independent reasons. Account deletion has
// never succeeded for anyone, teacher or student.
//
// 1. IT WAS AT THE WRONG PATH. The file lived at app/account/delete/route.ts,
//    serving /account/delete, while lib/auth.ts has always fetched
//    /api/account/delete. That is a 404, which is the "Failed to delete
//    account" people actually hit. It was also the only route handler in the
//    app outside app/api/; moving it here matches every other one.
//
// 2. IT READ THE SESSION FROM COOKIES, via @supabase/ssr's createServerClient.
//    lib/supabase.ts builds the browser client with plain
//    @supabase/supabase-js, which keeps the session in localStorage, so there
//    is no Supabase auth cookie anywhere in this app. Even at the right path it
//    would have found nobody and answered 401. It was the only route using the
//    cookie pattern and the only consumer of @supabase/ssr; every other
//    authenticated route takes the token in an Authorization header. It does
//    now too.
//
// lib/auth.ts threw a generic "Failed to delete account" for any failure, which
// is why a 404 and a 401 were indistinguishable from the outside. It now
// surfaces what the server said, and sends the token.
//
// That matters beyond the bug: app/terms says "You may close your account at any
// time via Account Settings", and the right to erasure was not actually
// deliverable through the product.
//
// Pattern: validate the caller's JWT with the anon client (no RLS bypass), then
// do the deletion under the service role. Deleting the auth.users row is what
// removes the account; `students` and `teachers` both reference it with
// ON DELETE CASCADE, so the profile row and everything hanging off it goes with
// it. See 20260914_capture_students_teachers.sql for the full cascade.
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
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

    // The caller can only ever delete themselves: the id comes from the
    // validated token, never from the request body.
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      // Returned verbatim, and lib/auth.ts now surfaces it. A deletion can also
      // fail on a foreign key: any table referencing students(id) or
      // teachers(id) WITHOUT on delete cascade blocks it, and the message names
      // the table. paper_sittings.marked_by is one such reference today.
      console.error('account delete failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('account delete route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
