-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policy dump  (read-only)
--
-- Paste into the Supabase SQL Editor (Dashboard → SQL Editor → New query) and
-- run. It reads catalog views only — it makes NO changes.
--
-- The JS/PostgREST client can only see the `public` schema, so it cannot read
-- pg_policies. This must be run in the SQL Editor (which connects as a superuser
-- role) to get the authoritative policy definitions.
--
-- It answers two questions the empirical probe (scripts/probe-rls.ts) can't:
--   1. Is RLS actually ENABLED (and FORCED) on each table?  A "SELECT returned
--      0 rows" from anon is ambiguous — it could mean RLS hides everything, OR
--      the table is simply empty. relrowsecurity below tells you which.
--   2. The exact USING / WITH CHECK expression of every policy, per role/command.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. RLS on/off per table  ────────────────────────────────────────────────────
--    rls_enabled = is RLS turned on at all
--    rls_forced  = does it apply even to the table owner
--    policy_count = number of policies attached
SELECT
  c.relname                                   AS table_name,
  c.relrowsecurity                            AS rls_enabled,
  c.relforcerowsecurity                       AS rls_forced,
  (SELECT count(*) FROM pg_policies p
     WHERE p.schemaname = 'public'
       AND p.tablename  = c.relname)          AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'questions','teachers','students',
    'practice_attempts','assessments','analytics_events'
  )
ORDER BY c.relname;

-- ⚠ If any of these tables shows rls_enabled = false, RLS is OFF for that table
--    and the anon key can do whatever the table grants allow — regardless of any
--    policies listed below (policies only take effect when RLS is enabled).


-- 2. Full policy definitions  ─────────────────────────────────────────────────
--    cmd        = ALL / SELECT / INSERT / UPDATE / DELETE
--    roles      = which DB roles the policy applies to (anon, authenticated, …)
--    using_expr = row visibility filter (SELECT/UPDATE/DELETE)
--    check_expr = write gate (INSERT/UPDATE)  ← this is what blocks anon writes
SELECT
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual        AS using_expr,
  with_check  AS check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'questions','teachers','students',
    'practice_attempts','assessments','analytics_events'
  )
ORDER BY tablename, cmd, policyname;


-- 3. Table-level grants to anon / authenticated  ──────────────────────────────
--    Even with RLS enabled, a role needs the base privilege (e.g. INSERT) before
--    a policy is consulted. This shows what each role is granted at all.
SELECT
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated')
  AND table_name IN (
    'questions','teachers','students',
    'practice_attempts','assessments','analytics_events'
  )
GROUP BY table_name, grantee
ORDER BY table_name, grantee;


-- 4. Triggers on teachers / students  ─────────────────────────────────────────
--    The self-UPDATE policies on teachers/students gate only on auth.uid()=id
--    with NO column restriction. The ONLY thing (besides a column-level grant,
--    already ruled out) that could stop a user setting their own is_admin=true
--    is a BEFORE UPDATE trigger. If this returns no row guarding is_admin, the
--    escalation is real.
SELECT
  event_object_table  AS table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('teachers','students')
ORDER BY event_object_table, trigger_name;


-- 5. Columns of teachers / students  ──────────────────────────────────────────
--    Shows whether either table has a privilege/billing column a user could
--    self-grant via the self-UPDATE policy (e.g. is_admin, plan, subscription,
--    paid_until, credits). Read from the catalog — does NOT read any real rows,
--    so no personal data is exposed.
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('teachers','students')
ORDER BY table_name, ordinal_position;
