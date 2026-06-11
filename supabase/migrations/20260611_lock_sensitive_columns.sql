-- ─────────────────────────────────────────────────────────────────────────────
-- Lock sensitive columns against client-role UPDATE (SEC-CRIT-1 / SEC-CRIT-2).
--
-- WHY: both `students` and `teachers` have a self-row UPDATE policy
-- (USING auth.uid() = id). RLS is ROW-granular — it cannot stop that UPDATE from
-- touching individual columns. With the column UPDATE grant open, a signed-in
-- student could set their own subscription_tier/paid_until (free premium) and any
-- teacher could set their own is_admin (→ question authoring → arbitrary JS in
-- every student's browser).
--
-- SAFE TO APPLY WITH NO CODE CHANGE: the only legitimate writers of these columns
-- are the Stripe webhook and manual admin actions, both of which use the SERVICE
-- ROLE — which bypasses column grants entirely. Revoking from anon/authenticated
-- removes only the attack surface. Student profile edits (display_name,
-- year_group) keep their UPDATE grant and continue to work.
--
-- Apply via the Supabase SQL Editor (DDL constraint). After applying, re-run
-- query 4 of scripts/rls-introspect.sql: the revoked columns must NOT appear with
-- privilege_type = 'UPDATE' for 'authenticated'.
-- ─────────────────────────────────────────────────────────────────────────────

revoke update (subscription_tier, paid_until, stripe_customer_id, stripe_subscription_id)
  on students from anon, authenticated;

revoke update (is_admin, paid_until, free_assessments_used)
  on teachers from anon, authenticated;

-- NOTE (not fixed here — tracked as SEC-2b): student_sessions has a
-- "public update" policy USING true / CHECK true, letting anon update any
-- assessment session. Re-scope that policy separately to the owning session
-- before relying on the legacy assessment feature.
