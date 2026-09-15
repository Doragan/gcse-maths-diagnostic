-- ─────────────────────────────────────────────────────────────────────────────
-- Take EXECUTE on student_has_class_grant() away from PUBLIC.
--
-- FOUND BY probing the deployed function as `anon` on 2026-09-15, while checking
-- that the name the code calls matches the name in the database. It answered
-- `false` rather than refusing. It should not have been callable at all:
-- 20260915_schools_and_class_grant.sql granted EXECUTE only to `authenticated`.
--
-- ── The rule ────────────────────────────────────────────────────────────────
-- PostgreSQL grants EXECUTE on every new function to PUBLIC automatically. So
--
--     grant execute on function f() to authenticated;
--
-- does NOT restrict anything — it adds a grant beside one that is already there.
-- Restricting means revoking the implicit one first. This is the same shape as
-- the trap this repo has now hit twice in the table world: a column-level
-- REVOKE that cannot subtract from a table-level GRANT
-- (20260611_lock_sensitive_columns.sql), and a FOR ALL policy that silently
-- covered INSERT (20260914_close_teachers_self_admin.sql). Defaults are the
-- thing that keeps getting us, not the statements we write.
--
-- ── How much did it actually matter? Almost nothing, and that is the point ──
-- Be honest about the severity rather than dressing it up. The function takes no
-- argument and reads auth.uid(), which is NULL for anon, so the membership join
-- matches nothing and the answer is a constant `false`. It leaked no data and
-- could not be used as an oracle about anybody.
--
-- It is worth fixing anyway, for the reason the search_path pin was worth doing
-- (PR #72): the safety rests entirely on the function's current body. A later
-- edit that adds a parameter, or reads something other than auth.uid(), would
-- turn a harmless PUBLIC grant into a real one, and nothing would flag it. Close
-- the class now, while it costs one line.
--
-- ⚠ FOR THE NEXT SECURITY DEFINER FUNCTION: `grant execute ... to authenticated`
-- is not a restriction. Revoke from PUBLIC in the same statement block, always.
--
-- ── Noted, deliberately NOT changed here ────────────────────────────────────
-- is_active_class_member(_class_id, _uid) and teacher_owns_class(_class_id,
-- _uid) are granted to `anon, authenticated` explicitly and DO take a uid
-- parameter, so they can answer questions about other people. Whether that is
-- an exposure worth closing depends on what a caller could do with it, and it
-- predates this work by months. It belongs in its own reviewed change with its
-- own reasoning, not folded in here — the same rule PR #71 set.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent. No code change
-- and no deploy ordering: the only caller is a signed-in student's browser, and
-- `authenticated` keeps its grant.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

revoke execute on function public.student_has_class_grant() from public;
grant  execute on function public.student_has_class_grant() to authenticated;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
-- From a shell, with the ANON key — this is the probe that found it. EXPECT a
-- permission error now, where it previously returned `false`:
--
--   curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/student_has_class_grant" \
--     -H "apikey: $ANON_KEY" -H "Content-Type: application/json" -d '{}'
--
-- And confirm a signed-in student still gets an answer, which is the thing that
-- must not break:
--
--   begin;
--     set local role authenticated;
--     set local request.jwt.claims = '{"sub":"<STUDENT_UUID>"}';
--     select public.student_has_class_grant();   -- EXPECT false (or true if covered)
--   rollback;
