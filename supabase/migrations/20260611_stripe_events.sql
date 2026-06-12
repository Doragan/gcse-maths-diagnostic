-- ─────────────────────────────────────────────────────────────────────────────
-- Idempotency ledger for the Stripe webhook (audit S2).
--
-- The webhook records each fully-processed event id here and skips ids it has
-- already seen, so Stripe's re-deliveries (and our own 500-triggered retries)
-- don't re-run entitlement writes. The webhook code degrades gracefully if this
-- table is absent (it logs and processes without dedupe), so apply order is not
-- critical — but apply this to get the dedupe guarantee.
--
-- Only the service role (the webhook) touches this table. RLS is enabled with no
-- policies, so anon/authenticated are denied by default; the service role
-- bypasses RLS. Grants are revoked from the client roles as belt-and-braces.
--
-- Apply via the Supabase SQL Editor (DDL constraint).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists stripe_events (
  id           text primary key,        -- Stripe event id (evt_...)
  processed_at timestamptz not null default now()
);

alter table stripe_events enable row level security;

revoke all on stripe_events from anon, authenticated;
