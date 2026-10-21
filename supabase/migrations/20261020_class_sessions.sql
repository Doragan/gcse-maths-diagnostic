-- ─────────────────────────────────────────────────────────────────────────────
-- No-login class sessions — a lesson a whole class can join with a code and a
-- first name, holding nothing that outlives the day.
--
-- Scoped in docs/audit/29-no-login-class-session-plan.md. This is increment 1
-- of that plan's build order: the tables and the security posture, nothing else.
--
-- ── Why this exists ─────────────────────────────────────────────────────────
--
-- The trust this was built for takes TWO MONTHS to approve a new pupil login
-- system (first conversation, 2026-10-20). Any plan beginning "pupils sign up"
-- cannot be trialled this term. The question surface already works signed out
-- and the live teacher view already shipped (docs/audit/24 Part 3), so the only
-- thing missing is somewhere for an anonymous attempt to GO that a teacher can
-- read. That is all three tables below are.
--
-- It is also the freemium line from docs/audit/16 Part 7 expressed as schema:
-- pay for persistence, not for assessing. Free is a lesson that deletes itself;
-- paid is keeping it.
--
-- ── Why NOT a nullable student_id on assignment_attempts ────────────────────
--
-- That was the tempting shortcut and it is rejected. assignment_attempts.
-- student_id is NOT NULL REFERENCES students(id) and its insert policy is
-- `WITH CHECK (auth.uid() = student_id)`; both would have to be loosened on a
-- table a teacher can already read, which is the exact class of change that
-- produced the self-grant-admin hole found on 2026-09-14. The two things also
-- genuinely differ: an assignment attempt is owned by a pupil for ever and
-- feeds mastery, a session attempt is owned by nobody and feeds one lesson.
--
-- ── The deliberate limit, stated once here ──────────────────────────────────
--
-- THE ROSTER IS SELF-ASSERTED. With no identity, a pupil holding the code can
-- join under any name, including a classmate's. Nothing below prevents that and
-- nothing can without accounts. So a session is NEVER summative: it does not
-- feed mastery, it produces no report, and it is not evidence of anything. The
-- teacher UI says these are names pupils typed.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent. Apply BEFORE
-- deploying the code that reads these tables.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── class_sessions ───────────────────────────────────────────────────────────
-- One lesson. Teacher-owned, short-lived, and the only row anyone can own.
create table if not exists public.class_sessions (
  id            uuid        primary key default gen_random_uuid(),

  -- ON DELETE CASCADE, diverging from assignments deliberately.
  -- 20260915_class_ownership_survives_teacher.sql made assignments.teacher_id
  -- SET NULL so that deleting a teacher would not destroy pupils' attempts.
  -- There is nothing here worth preserving past the teacher: the session dies
  -- the same day regardless, and a session with no owner has no reader.
  teacher_id    uuid        not null references public.teachers(id) on delete cascade,

  title         text        not null check (char_length(title) between 1 and 120),

  -- The 4-character code pupils type. Minted by lib/classCode.ts
  -- (generateClassCode), whose alphabet omits I, O, 0 and 1 because these get
  -- read aloud across a classroom. The CHECK matches that alphabet.
  --
  -- The CREATE ROUTE owns generation and retries on the unique violation, the
  -- same contract classes.code already has — the generator stays pure, and the
  -- index below is what actually guarantees uniqueness.
  --
  -- The alphabet is spelled out rather than written as ranges (`[A-HJ-NP-Z2-9]`)
  -- on purpose: bracket RANGES in Postgres regexes are collation-dependent, so
  -- under a non-C collation `A-H` can admit lowercase. This set is exactly
  -- ALPHABET in lib/classCode.ts, and lib/classCode.test.ts asserts the two
  -- still agree — change one and that test names this file.
  code          text        not null
                            check (code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$'),

  -- What the class is working on. Fed straight into the pupil's existing
  -- `practice_focus_skills` session key, so serving needs no new selection code.
  skill_ids     text[]      not null default '{}',

  -- How many questions the session asks for. Capped lower than an assignment's
  -- 100: this is one lesson, and a target nobody can reach reads as a failure.
  target_count  integer     check (target_count > 0 and target_count <= 50),

  -- Qualification scoping, so a session cannot serve iGCSE questions to a GCSE
  -- class (the leak fixed in PR #140). Text and no FK, matching assessments.
  course_id     text        not null,

  status        text        not null default 'open'
                            check (status in ('open', 'closed')),

  -- A SCHOOL DAY, not a lesson. A teacher running the same session period 1 and
  -- period 5 should not be punished for it. This is the column the whole data
  -- protection position rests on: see the sweep in docs/audit/29 §4.5.
  expires_at    timestamptz not null default now() + interval '6 hours',

  created_at    timestamptz not null default now(),
  closed_at     timestamptz
);
alter table public.class_sessions enable row level security;

-- One live code at a time, and old codes die rather than exhausting a 32^4
-- space. A PARTIAL index: a closed session keeps its code for the record, and
-- that code becomes available again.
create unique index if not exists class_sessions_open_code
  on public.class_sessions (code) where status = 'open';

create index if not exists class_sessions_teacher on public.class_sessions (teacher_id);
-- For the expiry sweep.
create index if not exists class_sessions_expires_at on public.class_sessions (expires_at);

-- ── session_participants ─────────────────────────────────────────────────────
-- A pupil, for one lesson. This row IS the entire identity: there is no column
-- into which an account, an email address or a persistent id could be written,
-- which is what keeps the data protection answer to two sentences.
create table if not exists public.session_participants (
  id           uuid        primary key default gen_random_uuid(),
  session_id   uuid        not null references public.class_sessions(id) on delete cascade,

  -- A FIRST NAME. The form asks for one and says so; 24 characters is enough
  -- for "Jamie B" and not enough for a full name plus a school.
  --
  -- The `@` check is not decoration. A child typing an email address into a
  -- name box is the commonest way a minimised field stops being minimised, and
  -- the client check alone would not survive a direct call to the route.
  display_name text        not null
                           check (char_length(display_name) between 1 and 24)
                           check (display_name not like '%@%'),

  joined_at    timestamptz not null default now()
);
alter table public.session_participants enable row level security;

create index if not exists session_participants_session
  on public.session_participants (session_id);

-- ── session_attempts ─────────────────────────────────────────────────────────
-- One row per question, per participant.
--
-- ⚠ NEVER MIRROR THESE INTO practice_attempts. An assignment attempt is written
-- to both tables by design, but a session attempt has no student_id to key on —
-- a happy accident, written down here so nobody helpfully "fixes" it. The
-- consequence IS the product: session work earns no mastery, and keeping it is
-- what an account is for.
create table if not exists public.session_attempts (
  id             uuid        primary key default gen_random_uuid(),

  -- Denormalised, though it is reachable through the participant: the head
  -- probe and the results query both filter by session, and this keeps the hot
  -- path a single-column index rather than a join. The insert policy below is
  -- what stops it disagreeing with the participant's own session.
  session_id     uuid        not null references public.class_sessions(id) on delete cascade,
  participant_id uuid        not null references public.session_participants(id) on delete cascade,
  question_id    uuid        not null references public.questions(id) on delete cascade,
  correct        boolean     not null,
  attempted_at   timestamptz not null default now()
);
alter table public.session_attempts enable row level security;

-- Serves both reads: the results aggregation (every row for a session) and the
-- head probe (newest row for a session, via the descending scan).
create index if not exists session_attempts_session_time
  on public.session_attempts (session_id, attempted_at);

-- ── SECURITY DEFINER helper ──────────────────────────────────────────────────
--
-- WHY A FUNCTION AND NOT AN INLINE SUBQUERY. A policy's subquery runs as the
-- INVOKING role, so an inline `exists (select 1 from class_sessions ...)` would
-- be filtered by class_sessions' own RLS — under which anon sees nothing — and
-- the EXISTS would be false for every pupil in every session. The insert would
-- fail closed for everyone, which is the same trap 20260606 documents for
-- assignments ("bypass RLS to avoid mutually-recursive policy chains").
--
-- search_path is pinned, per 20260913_pin_definer_search_path.sql.
create or replace function public.session_accepts_attempt(
  _session_id uuid,
  _participant_id uuid
)
  returns boolean
  language sql security definer stable
  set search_path = public
as $$
  select exists (
    select 1
    from class_sessions s
    join session_participants p on p.session_id = s.id
    where s.id = _session_id
      and p.id = _participant_id
      -- The 20260612 SEC-2b lesson, generalised: gate on the row still being
      -- legitimately writable. A closed or expired session is immutable, so a
      -- code shared on a group chat is not writable next week.
      and s.status = 'open'
      and s.expires_at > now()
  );
$$;
grant execute on function public.session_accepts_attempt(uuid, uuid) to anon, authenticated;

-- ── RLS policies ─────────────────────────────────────────────────────────────
--
-- ⚠ NO `FOR ALL` POLICIES ANYWHERE IN THIS FILE. A FOR ALL policy with no
-- WITH CHECK makes USING the insert gate, which is how a student came to be
-- able to self-grant admin (found 2026-09-14). Every policy below names one
-- command.
--
-- ⚠ AND NO CLIENT SELECT, except a teacher's own session list. The teacher's
-- live view reads through a service-role route gated on teacher_id, exactly as
-- both assignment results routes already do. A pupil's own progress counter
-- already lives in sessionStorage, so the client never needs to read back what
-- it wrote — a tighter posture than assignment_attempts, deliberately.

-- class_sessions: a teacher reads their own. Nothing else reads here at all;
-- the code lookup pupils use is a service-role route, so anon needs no policy.
drop policy if exists cs_teacher_select on public.class_sessions;
create policy cs_teacher_select on public.class_sessions
  for select using (auth.uid() = teacher_id);

-- session_participants: no client policy of any kind.
--
-- Joining goes through a service-role route, which is where the rate limit, the
-- name validation and the code resolution belong — and it means the route can
-- return the new participant id without this table needing a SELECT policy,
-- which an `insert().select()` from the browser would have required.
-- RLS with no policy denies everything; the REVOKEs below are the belt.

-- session_attempts: a participant inserts, and that is the only client write in
-- this entire feature.
drop policy if exists sa_participant_insert on public.session_attempts;
create policy sa_participant_insert on public.session_attempts
  for insert with check (session_accepts_attempt(session_id, participant_id));

-- ── GRANTS ───────────────────────────────────────────────────────────────────
--
-- 🚨 Column-level REVOKE is a NO-OP against a table-level grant (learned
-- 2026-09-14). The pattern that works, and is now catalog-verified: REVOKE at
-- table level, then GRANT back the exact columns. Supabase's default privileges
-- hand anon and authenticated full access to new public tables, so saying
-- nothing here would leave all three wide open behind RLS alone.

revoke all on public.class_sessions       from anon, authenticated;
revoke all on public.session_participants from anon, authenticated;
revoke all on public.session_attempts     from anon, authenticated;

-- A teacher lists their own sessions in the browser; cs_teacher_select scopes
-- it to their rows. anon gets nothing.
grant select on public.class_sessions to authenticated;

-- The one client write. Columns named explicitly so a pupil cannot set `id` or
-- BACKDATE `attempted_at` — both have defaults, and a forged timestamp would
-- land a row at the top of the teacher's "answering now" column.
grant insert (session_id, participant_id, question_id, correct)
  on public.session_attempts to anon, authenticated;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 🚨 The SQL Editor is SUPERUSER and bypasses both RLS and grants, so selecting
-- from these tables here proves NOTHING about client access. Only the catalog
-- queries below answer that.
--
-- 1. All three tables exist with RLS on. EXPECT 3 rows, all relrowsecurity = t:
--
--      select relname, relrowsecurity
--      from pg_class
--      where relname in ('class_sessions','session_participants','session_attempts');
--
-- 2. The grants are exactly what is intended. EXPECT precisely:
--      authenticated | SELECT | class_sessions   (table-level)
--      anon          | INSERT | session_attempts (4 column rows)
--      authenticated | INSERT | session_attempts (4 column rows)
--    and NOTHING on session_participants:
--
--      select grantee, table_name, privilege_type, 'table' as scope
--      from information_schema.table_privileges
--      where table_schema = 'public'
--        and table_name in ('class_sessions','session_participants','session_attempts')
--        and grantee in ('anon','authenticated')
--      union all
--      select grantee, table_name, privilege_type || ' (' || column_name || ')', 'column'
--      from information_schema.column_privileges
--      where table_schema = 'public'
--        and table_name in ('class_sessions','session_participants','session_attempts')
--        and grantee in ('anon','authenticated')
--      order by table_name, grantee;
--
-- 3. No policy is FOR ALL. EXPECT 2 rows, cmd = SELECT and INSERT:
--
--      select tablename, policyname, cmd
--      from pg_policies
--      where tablename in ('class_sessions','session_participants','session_attempts');
--
-- 4. The partial unique index allows code reuse after closing. EXPECT the
--    second insert to SUCCEED and the third to FAIL:
--
--      begin;
--        insert into class_sessions (teacher_id, title, code, course_id)
--        select id, 'probe 1', 'AB23', 'gcse-maths' from teachers limit 1;
--        -- same code, but the first is closed: allowed
--        update class_sessions set status = 'closed' where code = 'AB23';
--        insert into class_sessions (teacher_id, title, code, course_id)
--        select id, 'probe 2', 'AB23', 'gcse-maths' from teachers limit 1;
--        -- same code while one is open: must raise unique_violation
--        insert into class_sessions (teacher_id, title, code, course_id)
--        select id, 'probe 3', 'AB23', 'gcse-maths' from teachers limit 1;
--      rollback;
--
-- 5. The attempt gate actually gates. EXPECT true, then false, then false:
--
--      begin;
--        insert into class_sessions (id, teacher_id, title, code, course_id)
--        select '00000000-0000-0000-0000-0000000000aa', id, 'probe', 'CD45', 'gcse-maths'
--        from teachers limit 1;
--        insert into session_participants (id, session_id, display_name)
--        values ('00000000-0000-0000-0000-0000000000bb',
--                '00000000-0000-0000-0000-0000000000aa', 'Probe');
--        -- open and matching: true
--        select session_accepts_attempt('00000000-0000-0000-0000-0000000000aa',
--                                       '00000000-0000-0000-0000-0000000000bb');
--        -- a participant from another session: false
--        select session_accepts_attempt('00000000-0000-0000-0000-0000000000aa',
--                                       gen_random_uuid());
--        -- expired: false
--        update class_sessions set expires_at = now() - interval '1 minute'
--        where id = '00000000-0000-0000-0000-0000000000aa';
--        select session_accepts_attempt('00000000-0000-0000-0000-0000000000aa',
--                                       '00000000-0000-0000-0000-0000000000bb');
--      rollback;
--
-- 6. The name constraints hold. EXPECT both inserts to FAIL:
--
--      begin;
--        insert into session_participants (session_id, display_name)
--        select id, 'jamie@example.com' from class_sessions limit 1;
--        insert into session_participants (session_id, display_name)
--        select id, 'Jamie Smith of 9C at Example High School' from class_sessions limit 1;
--      rollback;
