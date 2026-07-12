-- ─────────────────────────────────────────────────────────────────────────────
-- handle_new_user — teach the auth.users signup trigger about OAuth (Google).
--
-- WHY: email/password signups create their teachers/students row here, keyed off
-- raw_user_meta_data->>'role' ('student' ⇒ students row; absent ⇒ teachers row).
-- Google OAuth carries no 'role' and can't run the student 13+ age gate, so an
-- OAuth signup would fall through to the teacher branch and get the WRONG row.
-- We make the trigger create NO row for OAuth users; provisioning is then done
-- explicitly, server-side, by app/api/auth/provision (which the /auth/callback
-- page calls once the OAuth session exists and — for students — consent is given).
--
-- This also closes an audit gap: the trigger previously lived ONLY in the
-- Supabase dashboard, with no diffable source of truth. It is now in git.
--
-- MINIMAL CHANGE — this is the LIVE handle_new_user (verified 2026-07-10 via
-- pg_get_functiondef) with ONE addition: the teacher insert is gated to email
-- signups. The student early-return is preserved verbatim; students rows are
-- created by a SEPARATE mechanism (not this function), which we do not touch.
--
-- Behaviour by signup type:
--   • email + role='student'  → early return (student row created elsewhere) — UNCHANGED
--   • email, no role          → teacher row (provider='email' branch)        — UNCHANGED
--   • Google, no role         → NO row here → provisioned by /api/auth/provision  ← NEW
--   • Google + role='student' → n/a (Google never sets role)
--
-- Provider is read from raw_app_meta_data->>'provider' ('email' for password
-- signups, 'google' for Google). `security definer` + empty search-path guard
-- match the live function. Apply via the Supabase SQL editor (DDL constraint,
-- same convention as 20260611_rls_baseline.sql).
--
-- NB: does NOT redefine the trigger object itself (the existing on-insert trigger
-- already points at this function name) — `create or replace function` swaps the
-- body in place.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
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
