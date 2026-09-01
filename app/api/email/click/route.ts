import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseSendKind, SEND_TABLE, SEND_DESTINATION, SEND_ANALYTICS } from '../../../../lib/email/sendKind'

// Click-tracking redirect for the practice emails' CTA. The button points here
// with an opaque send-id token (?s=<uuid>) and a channel (&k=) — no student id /
// PII in the URL. We record the click, then 302 to that channel's destination.
//
// The destination is looked up from a fixed server-side map keyed by the
// channel, never taken from the request, so this cannot be an open redirect.

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const kind = parseSendKind(req.nextUrl.searchParams.get('k'))
  const destination = `${siteUrl}${SEND_DESTINATION[kind]}`
  const sendId = req.nextUrl.searchParams.get('s')

  // Always end up at the destination — tracking is best-effort and must never
  // block the student from getting where they're going.
  if (sendId) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const table = SEND_TABLE[kind]
      const { data: row } = await supabase
        .from(table)
        .select('id, student_id, clicked_at')
        .eq('id', sendId)
        .single()

      if (row) {
        // Only stamp the first click (the funnel cares about clicked-or-not).
        if (!row.clicked_at) {
          await supabase
            .from(table)
            .update({ clicked_at: new Date().toISOString() })
            .eq('id', sendId)
        }
        await supabase.from('analytics_events').insert({
          event:      `${SEND_ANALYTICS[kind].prefix}_clicked`,
          path:       SEND_ANALYTICS[kind].path,
          session_id: sendId,
          properties: { send_id: sendId, student_id: row.student_id },
        })
      }
    } catch (err) {
      console.error('[email/click] tracking failed:', err)
    }
  }

  return NextResponse.redirect(destination, { status: 302 })
}
