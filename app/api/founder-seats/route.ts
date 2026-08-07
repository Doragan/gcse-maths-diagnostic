import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { FOUNDER_SEAT_CAP, founderSeatsLeft } from '../../../lib/founderSeats'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Public: how many founder seats remain for the 2027 exam pass. Drives the sale
 * framing on the upgrade (/student/upgrade) and parent-pay (/pay/[token]) pages.
 * Aggregate only — no PII, no per-student data. The client is built inside the
 * handler (project convention: no module-top-level SDK clients).
 */
export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const seatsLeft = await founderSeatsLeft(admin)
  return NextResponse.json({ seatsLeft, cap: FOUNDER_SEAT_CAP, capReached: seatsLeft <= 0 })
}
