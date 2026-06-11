-- ─────────────────────────────────────────────────────────────────────────────
-- Lock client-role UPDATE on students/teachers (SEC-CRIT-1 / SEC-CRIT-2).
--
-- ⚠ SUPERSEDES a first attempt that used column-level REVOKEs — those were a
-- NO-OP and verified ineffective. PostgreSQL rule: a table-level
-- `GRANT UPDATE ON <table>` confers UPDATE on every column, and a column-level
-- `REVOKE UPDATE (col)` cannot subtract from it. Query 3 of the introspection
-- showed the table-level UPDATE grant present, so the column REVOKEs did nothing.
--
-- CORRECT FIX: revoke the blanket table-level UPDATE from the client roles.
--
-- WHY IT'S EXPLOITABLE: both tables have a self-row UPDATE policy
-- (USING auth.uid() = id). RLS is row-granular and cannot stop that UPDATE from
-- touching is_admin / subscription_tier / paid_until on the caller's OWN row.
--
-- WHY THIS IS SAFE WITH NO CODE CHANGE: there are ZERO
-- `.from('students'|'teachers').update(...)` calls anywhere in app/lib/scripts.
-- Every legitimate write (Stripe webhook, the free_assessments_used counter in
-- app/api/assessments/create, manual admin) goes through the SERVICE ROLE, which
-- bypasses these grants. The "Students can update own record" / "teachers: update
-- own row" RLS policies are latent (no client uses them); after this they're
-- simply unreachable (grant is checked before the policy).
--
-- Apply via the Supabase SQL Editor (DDL constraint). After applying, re-run the
-- anon-UPDATE probe: setting any column on these tables must return 42501.
--
-- If a profile-edit feature is ever added, re-grant only those columns, e.g.:
--   grant update (display_name, year_group) on students to authenticated;
-- ─────────────────────────────────────────────────────────────────────────────

revoke update on students from anon, authenticated;
revoke update on teachers from anon, authenticated;

-- SEC-2b (separate, not fixed here): student_sessions has a "public update"
-- policy USING true / CHECK true — anon can update any legacy assessment session.
-- Re-scope that policy to the owning session before relying on that feature.
