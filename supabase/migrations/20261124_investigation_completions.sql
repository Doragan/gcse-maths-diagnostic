-- ─────────────────────────────────────────────────────────────────────────────
-- investigation_completions — which investigations a signed-in student has
-- finished. docs/audit/32-investigation-integration-plan.md, D3 / increment 3.
--
-- NOT mastery. Investigations write none (docs/audit/31 §8): their internal
-- steps are not evidence of the skill. This is a record that a student pressed
-- Finish, for three things:
--   * the wrong-answer card stops offering an investigation already done
--     (lib/skills/skillEntry.ts), and offers the briefing instead;
--   * the student dashboard can list what they have done;
--   * a later progress track (doc 32, D7) can tell an investigation was done,
--     separately from practice.
--
-- One row per student and skill: the FIRST completion. Finishing again does
-- nothing (the client inserts with ON CONFLICT DO NOTHING), so there is no
-- UPDATE path at all.
--
-- Anonymous visitors write nothing here — there is no student to key on, and
-- the page works signed out exactly as before.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.investigation_completions (
  -- The students PK is the auth uid (20260914_capture_students_teachers.sql),
  -- so auth.uid() = student_id is the ownership test, as on practice_attempts.
  -- ON DELETE CASCADE joins the account-deletion chain:
  --   auth.users -> students -> investigation_completions
  student_id   uuid        not null references public.students(id) on delete cascade,
  skill_id     text        not null,
  completed_at timestamptz not null default now(),
  primary key (student_id, skill_id)
);

alter table public.investigation_completions enable row level security;

-- Per command, never FOR ALL: a FOR ALL policy without WITH CHECK makes its
-- USING the insert gate (the 2026-09-14 escalation; memory: project_security_rls).
drop policy if exists "Students can view own completions" on public.investigation_completions;
create policy "Students can view own completions" on public.investigation_completions
  for select to authenticated using (auth.uid() = student_id);

drop policy if exists "Students can record own completions" on public.investigation_completions;
create policy "Students can record own completions" on public.investigation_completions
  for insert to authenticated with check (auth.uid() = student_id);

-- No UPDATE or DELETE policy, and no grant either: a completion is a fact, and
-- it goes only with the account. Anonymous has no business here at all.
revoke all on public.investigation_completions from anon;
revoke update, delete, truncate on public.investigation_completions from authenticated;

-- ── Verify after applying ────────────────────────────────────────────────────
-- The SQL Editor runs as a superuser, so it cannot prove the policies; check
-- the catalog instead (memory: project_security_rls):
--   select policyname, cmd, roles, qual, with_check
--     from pg_policies where tablename = 'investigation_completions';
--   select grantee, privilege_type
--     from information_schema.role_table_grants
--    where table_name = 'investigation_completions' order by 1, 2;
-- Expect two policies (SELECT, INSERT, both to authenticated), no anon grants,
-- and authenticated holding SELECT and INSERT (plus REFERENCES/TRIGGER) only.
