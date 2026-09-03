import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER CHECKOUT — CLOSED.
//
// This sold the £10 teacher pass, whose only benefit was lifting the
// one-diagnostic free limit. That limit is gone (see app/api/assessments/create),
// so the pass buys nothing — and a route that can still take £10 for nothing is
// worse than a missing feature.
//
// Closed rather than deleted, deliberately:
//   • a stale client, a bookmark or a cached bundle can still POST here, and a
//     410 tells the truth where a 404 looks like a bug;
//   • the Stripe webhook's teacher branch is INTENTIONALLY left working, so a
//     session created before this deploy still grants what was paid for.
//
// Teachers holding a pass keep it: nothing revokes paid_until. The previous
// implementation is in git history. Before reopening this, note that the pass
// granted a FIXED end date (STRIPE_TEACHER_PASS_UNTIL, currently 31 Dec 2026),
// so its value decayed as the season ran out — that needs rethinking before
// anything is sold again.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST() {
  return NextResponse.json(
    { error: 'Teacher passes are no longer sold — class diagnostics are free.', code: 'CHECKOUT_CLOSED' },
    { status: 410 },
  )
}
