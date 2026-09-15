-- ─────────────────────────────────────────────────────────────────────────────
-- Schools, seats, and the class arm of the entitlement union.
--
-- Step 3 of docs/audit/20-school-accounts-design.md. This is the load-bearing
-- piece: it is what makes a school grant reach a student, and it is the same
-- mechanism the 3-teacher early-access promo runs on. The promo is not a
-- separate feature — it is one `schools` row with seats and an end date.
--
-- ⚠ INERT WHEN APPLIED. No class has a school_id until one is set by hand, so
-- student_has_class_grant() returns false for everybody and nothing changes.
-- Wiring it into isPaidStudent is step 4, a separate deploy.
--
-- ── The model ───────────────────────────────────────────────────────────────
--   student premium = personal grant OR class grant
--
--   personal : students.subscription_tier = 'paid' AND paid_until > now
--              (Stripe-paced, already built)
--   class    : an ACTIVE class_memberships row
--              -> classes.school_id -> schools.granted_until > now
--              (invoice-paced, set by hand — this file)
--
-- The grant is read THROUGH a membership the student created themselves, so the
-- school never owns the account and leaving the class revokes access. That is
-- the constraint the whole design exists to respect.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── schools ──────────────────────────────────────────────────────────────────
-- seats is the unit a school buys. It is NOT enforced here: at the cap the join
-- is allowed and the overage is surfaced at renewal (design §4). Blocking a
-- fifteen-year-old's join code mid-lesson to settle a commercial dispute is the
-- wrong failure, and invoice pacing means the school could not clear it quickly
-- even if they wanted to.
--
-- granted_until NULL means no access. Renewal is an update; withdrawal is the
-- same update with a past date. Never a delete.
create table if not exists public.schools (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  seats         integer     not null check (seats >= 0),
  granted_until timestamptz,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── classes.school_id ────────────────────────────────────────────────────────
-- ON DELETE SET NULL, never cascade: removing a school must not delete a
-- teacher's classes, nor — through them — students' membership history.
alter table public.classes add column if not exists school_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.classes'::regclass
      and conname  = 'classes_school_id_fkey'
  ) then
    alter table public.classes
      add constraint classes_school_id_fkey
      foreign key (school_id) references public.schools(id) on delete set null;
  end if;
end $$;

create index if not exists classes_school on public.classes (school_id);

-- ── RLS: deny, with no policy at all ─────────────────────────────────────────
-- No client role ever reads a school row — not the student, not the teacher.
-- Seat counts and grant dates are commercial data. RLS with zero policies denies
-- everything, and the REVOKE is the second layer: this repo has now been bitten
-- twice by trusting one layer alone (20260611_lock_sensitive_columns.sql and
-- 20260914_close_teachers_self_admin.sql).
--
-- ⚠ IF A POLICY IS EVER ADDED HERE, NAME ITS COMMAND. Never `for all`. A policy
-- with no WITH CHECK reuses its USING clause to decide which NEW ROWS may be
-- inserted, which is exactly how the self-granted-admin hole on `teachers`
-- happened. See 20260914_close_teachers_self_admin.sql.
alter table public.schools enable row level security;
revoke all on public.schools from anon, authenticated;

-- ── The class grant ──────────────────────────────────────────────────────────
-- TAKES NO ARGUMENT ON PURPOSE. A _uid parameter would let any logged-in caller
-- ask "does this uuid have a class grant", which is a cheap oracle over student
-- ids and over which schools have paid. Reading auth.uid() inside the function
-- makes the question unaskable about anyone else.
--
-- SECURITY DEFINER because it must see `schools`, which no client role may read.
-- That is the whole point: the answer is exposed, the data behind it is not.
--
-- Server routes do NOT use this. They hold the service role, which bypasses RLS,
-- so they run the same join directly (step 4).
--
-- search_path pinned, per PR #72.
create or replace function public.student_has_class_grant()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from class_memberships m
    join classes c on c.id = m.class_id
    join schools  s on s.id = c.school_id
    where m.student_id = auth.uid()
      and m.status = 'active'
      and s.granted_until is not null
      and s.granted_until > now()
  );
$$;

grant execute on function public.student_has_class_grant() to authenticated;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 🚨 The SQL Editor runs as SUPERUSER and bypasses BOTH RLS and grants, so
-- `select * from schools` there proves nothing about whether clients are denied.
-- Impersonate instead. Nothing below writes; both blocks roll back.
--
-- (1) A student with no school-backed class — EXPECT false, and 0 rows:
--
--       begin;
--         set local role authenticated;
--         set local request.jwt.claims = '{"sub":"<STUDENT_UUID>"}';
--         select public.student_has_class_grant();  -- expect false
--         select * from schools;                    -- EXPECT 0 rows (denied)
--       rollback;
--
-- (2) Prove the grant actually flows, without provisioning anything for real.
--     Create a school, attach the student's class, check, then roll it all back:
--
--       begin;
--         insert into schools (name, seats, granted_until)
--         values ('probe', 5, now() + interval '1 day')
--         returning id \gset
--
--         update classes set school_id = :'id'
--         where id in (select class_id from class_memberships
--                      where student_id = '<STUDENT_UUID>' and status = 'active');
--
--         set local role authenticated;
--         set local request.jwt.claims = '{"sub":"<STUDENT_UUID>"}';
--         select public.student_has_class_grant();  -- EXPECT true
--       rollback;
--
--     If (2) returns false, the student has no active membership — check that
--     first, before suspecting the function.
--
-- ── Provisioning (the real thing) ────────────────────────────────────────────
-- The whole mechanism, for the promo and for a paying school alike. They differ
-- only in `seats` and `notes`.
--
--   insert into schools (name, seats, granted_until, notes)
--   values ('Example High School', 35, '2027-08-31', 'early access promo, 3 teachers')
--   returning id;
--
--   update classes set school_id = '<SCHOOL_UUID>' where teacher_id = '<TEACHER_UUID>';
--
--   -- what was granted, and to how many distinct students (the seat count)
--   select s.name, s.seats, s.granted_until,
--          count(distinct m.student_id) filter (where m.status = 'active') as seats_used
--   from schools s
--   left join classes c on c.school_id = s.id
--   left join class_memberships m on m.class_id = c.id
--   where s.id = '<SCHOOL_UUID>'
--   group by s.id, s.name, s.seats, s.granted_until;
