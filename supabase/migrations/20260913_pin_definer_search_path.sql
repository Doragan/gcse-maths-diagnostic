-- ─────────────────────────────────────────────────────────────────────────────
-- Pin search_path on the two SECURITY DEFINER signup triggers.
--
-- WHAT: adds one line — `set search_path = public` — to handle_new_student and
-- handle_new_user. Both bodies are otherwise VERBATIM from pg_get_functiondef
-- (introspected 2026-09-13, see 20260913_auth_signup_triggers.sql).
--
-- ── Why, honestly ───────────────────────────────────────────────────────────
-- This is hardening, not a fix for a live hole. A SECURITY DEFINER function
-- runs with its OWNER's privileges, and one that does not pin search_path
-- inherits the CALLER's — so an attacker who can set search_path and create a
-- lookalike object can make an unqualified name inside the function resolve to
-- theirs, executing as the owner.
--
-- Three things blunt that here, and they are why this is low priority:
--   1. Both bodies already schema-qualify their only table reference
--      (public.students, public.teachers), so nothing is left to resolution.
--   2. pg_catalog is implicitly searched first, so the built-in operators
--      (->>, =) cannot be shadowed the way a table can, and nullif is a SQL
--      construct rather than a function lookup.
--   3. The caller is GoTrue on its own connection. Someone signing up issues
--      HTTP, never SQL, and so never controls a search_path at all.
--
-- It is still worth doing:
--   - Supabase's database linter flags it (function_search_path_mutable) and
--     will keep flagging it until pinned.
--   - The safety above rests entirely on those `public.` prefixes. The day
--     someone adds `insert into students` unqualified, or calls a helper, the
--     exposure becomes real and NOTHING will flag it. Pinning forecloses the
--     whole class in advance.
--   - get_weekly_goal_candidates already pins `set search_path = public`, so
--     the codebase is currently inconsistent with itself.
--
-- `set search_path = ''` is the stricter form Supabase recommends. Both bodies
-- would survive it, since each qualifies its one table reference — but the gain
-- over `public` is marginal here, while `public` is behaviourally identical to
-- what happens today. Taking the conservative one on an account-creation path.
--
-- ── ORDER MATTERS ───────────────────────────────────────────────────────────
-- Apply this AFTER 20260913_auth_signup_triggers.sql. That file is a verbatim
-- snapshot of the functions as they were BEFORE this change, so re-applying it
-- afterwards would silently remove the pin. Filename order already puts this
-- one second; the note is here because these are applied by hand.
--
-- ── VERIFICATION ────────────────────────────────────────────────────────────
-- This touches the live account-creation path, so it is not self-verifying.
-- After applying, create ONE throwaway account (email and Google if you can)
-- and confirm a public.students row appears with display_name and year_group
-- populated. If signup were to break, it would break silently for every new
-- user, which is why this shipped on its own rather than inside another change.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Student rows, email + the role-carrying paths. Body unchanged; only the
-- `set search_path` line is new.
CREATE OR REPLACE FUNCTION public.handle_new_student()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  if new.raw_user_meta_data->>'role' = 'student' then
    insert into public.students (id, display_name, year_group, confirmed_13)
    values (
      new.id,
      new.raw_user_meta_data->>'display_name',
      nullif(new.raw_user_meta_data->>'year_group', ''),
      true
    );
  end if;
  return new;
end;
$function$;

-- Teacher rows. This body also lives in 20260710_handle_new_user_oauth.sql,
-- which records what was applied then; THIS is now the current definition.
-- Migrations are latest-wins, so that file is deliberately left untouched
-- rather than edited after the fact.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  if new.raw_user_meta_data->>'role' = 'student' then
    return new;
  end if;
  -- Only auto-create a teacher row for EMAIL signups. Google (OAuth) teachers
  -- are provisioned explicitly via /api/auth/provision after /auth/callback, so
  -- that a Google *student* (who also arrives with no 'role') is not mis-filed
  -- as a teacher.
  if new.raw_app_meta_data->>'provider' = 'email' then
    insert into public.teachers (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$function$;

commit;
