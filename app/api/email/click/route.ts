import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Click-tracking redirect for the re-engagement email CTA. The email's button
// points here with an opaque send-id token (?s=<uuid>) — no student id / PII in
// the URL. We record the click, then 302 to the dashboard (the CTA target is
// fixed server-side, so this can't be abused as an open redirect).

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const dashboard = `${siteUrl}/student/dashboard`
  const sendId = req.nextUrl.searchParams.get('s')

  // Always end up at the dashboard — tracking is best-effort and must never
  // block the student from getting where they're going.
  if (sendId) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const { data: row } = await supabase
        .from('reengagement_sends')
        .select('id, student_id, clicked_at')
        .eq('id', sendId)
        .single()

      if (row) {
        // Only stamp the first click (the funnel cares about clicked-or-not).
        if (!row.clicked_at) {
          await supabase
            .from('reengagement_sends')
            .update({ clicked_at: new Date().toISOString() })
            .eq('id', sendId)
        }
        await supabase.from('analytics_events').insert({
          event:      'reengagement_email_clicked',
          path:       '/email/reengagement',
          session_id: sendId,
          properties: { send_id: sendId, student_id: row.student_id },
        })
      }
    } catch (err) {
      console.error('[email/click] tracking failed:', err)
    }
  }

  return NextResponse.redirect(dashboard, { status: 302 })
}
