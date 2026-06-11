-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 0 / Half 1b — RLS & grant introspection (READ-ONLY: SELECT only).
--
-- Run in the Supabase SQL Editor and share the four result sets. This reads the
-- live security posture the agent cannot reach via the REST API (PostgREST does
-- not expose pg_catalog). Nothing is modified.
--
-- What to look for is noted above each query.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Is RLS actually ENABLED on each table?
--    Every table below should show rls_enabled = true. A 'false' here is a hole
--    (the table is wide open regardless of any policies that exist).
select c.relname              as table_name,
       c.relrowsecurity       as rls_enabled,
       c.relforcerowsecurity  as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- 2. Every RLS policy, with the actual USING / WITH CHECK expressions.
--    This is the policy text the agent needs to (a) answer the authenticated
--    escalation question and (b) reproduce the posture as a committed migration.
select tablename,
       policyname,
       cmd,                         -- SELECT / INSERT / UPDATE / DELETE / ALL
       roles,                       -- {anon}, {authenticated}, {public}, …
       permissive,
       qual        as using_expr,   -- row-visibility / row-targetability filter
       with_check  as check_expr    -- what a written row must satisfy
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 3. Table-level privileges granted to the client roles.
--    Expect: SELECT on the public read surface; note any INSERT/UPDATE/DELETE.
--    Under the RLS-only model these grants are open and RLS is the gate — fine,
--    AS LONG AS query 4 shows the sensitive columns are REVOKE-locked.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- 4. THE DECISIVE ONE — column-level UPDATE privileges on the sensitive tables.
--    A column-level REVOKE shows up as the column being ABSENT from this list.
--    PASS  = students.{subscription_tier, paid_until, stripe_customer_id,
--            stripe_subscription_id} and teachers.is_admin do NOT appear with
--            UPDATE for 'authenticated' → a logged-in student can't self-grant.
--    FAIL  = any of those columns appears with privilege_type = 'UPDATE' for
--            'authenticated' → a student can update their own billing / admin flag.
select table_name, column_name, grantee, privilege_type
from information_schema.role_column_grants
where table_schema = 'public'
  and table_name in ('students', 'teachers')
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('UPDATE', 'INSERT')
order by table_name, column_name, grantee, privilege_type;
