-- ─────────────────────────────────────────────────────────────────────────────
-- One "a teacher signed up" email, once per teacher.
--
-- WHY A COLUMN. The alert has to fire from the signup paths themselves, because
-- the alternative — a cron that looks for rows created in the last few minutes
-- — cannot exist here: Vercel's Hobby plan fails the whole deployment for any
-- cron scheduled more than once a day (see app/api/cron/session-sweep). Firing
-- from the paths means it can fire more than once for the same teacher: a
-- Google provision retried after a dropped connection, or a dashboard opened in
-- three tabs. This column is what makes that harmless. lib/email/
-- teacherSignupNotify.ts claims it with
--
--     update teachers set signup_alert_sent_at = now()
--      where id = $1 and signup_alert_sent_at is null returning ...
--
-- so exactly one caller gets a row back and every other one sends nothing.
--
-- It doubles as the record of what was sent and when, which is the only reason
-- it is a timestamp rather than a boolean.
--
-- ── EXISTING TEACHERS ARE BACKFILLED, and that is the point ─────────────────
-- Every teacher that already exists signed up before this existed. Left null,
-- each of them would generate a "new teacher signup" email the next time they
-- opened a dashboard — an alert about an account from months ago, which is
-- exactly the kind of thing that teaches you to ignore the alerts. They are
-- stamped with their own created_at: truthful (that IS when they signed up) and
-- it closes the claim, so none of them can fire.
--
-- ── NO POLICY AND NO GRANT, deliberately ───────────────────────────────────
-- Clients hold neither UPDATE (20260611_lock_sensitive_columns.sql) nor INSERT
-- (20260914_close_teachers_self_admin.sql) on `teachers`, and this changes
-- nothing about that: the claim runs with the service role from server code,
-- the same shape as every other teacher write here. `teachers` keeps its
-- table-level SELECT for client roles, so the new column needs no grant of its
-- own and no client query breaks on it — and nothing client-side reads it: the
-- dashboard asks the server to try the alert and is never told the answer.
--
-- Apply via the Supabase SQL Editor (DDL convention). Idempotent.
-- ⚠ APPLY BEFORE DEPLOYING: the moment the new code is live it writes this
--    column, and until the column exists every claim fails (logged, alert
--    skipped — no user-facing error, but no alerts either).
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Nullable, and null is the meaningful state: "no alert has been sent for this
-- teacher yet". Nothing reads it except the claim.
alter table public.teachers
  add column if not exists signup_alert_sent_at timestamptz;

-- Close the claim for everyone who predates the feature. `coalesce` because
-- created_at is itself nullable on this table (default now(), no not-null
-- constraint) and a null here would leave the row able to fire.
update public.teachers
   set signup_alert_sent_at = coalesce(created_at, now())
 where signup_alert_sent_at is null;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 1. The column exists and is nullable. EXPECT one row, is_nullable = YES:
--
--      select column_name, data_type, is_nullable
--      from information_schema.columns
--      where table_schema = 'public' and table_name = 'teachers'
--        and column_name = 'signup_alert_sent_at';
--
-- 2. No existing teacher can fire an alert. EXPECT pending = 0, and total =
--    the number of teachers:
--
--      select count(*) as total,
--             count(*) filter (where signup_alert_sent_at is null) as pending
--      from public.teachers;
--
-- 3. ⚠ CLIENTS STILL CANNOT WRITE THIS TABLE. The SQL Editor is SUPERUSER and
--    bypasses RLS and grants, so updating a row here proves nothing. Check the
--    grant instead — EXPECT 0 rows:
--
--      select grantee, privilege_type
--      from information_schema.table_privileges
--      where table_schema = 'public' and table_name = 'teachers'
--        and grantee in ('anon', 'authenticated')
--        and privilege_type in ('UPDATE', 'INSERT');
--
-- 4. The claim is single-shot. Rolled back, so it leaves nothing behind:
--
--      begin;
--        update public.teachers set signup_alert_sent_at = null
--         where id = (select id from public.teachers order by created_at desc limit 1);
--        -- EXPECT 1 row returned:
--        update public.teachers set signup_alert_sent_at = now()
--         where id = (select id from public.teachers order by created_at desc limit 1)
--           and signup_alert_sent_at is null
--        returning id;
--        -- EXPECT 0 rows — the second caller sends nothing:
--        update public.teachers set signup_alert_sent_at = now()
--         where id = (select id from public.teachers order by created_at desc limit 1)
--           and signup_alert_sent_at is null
--        returning id;
--      rollback;
