-- ─────────────────────────────────────────────────────────────────────────────
-- ⚠ THIS TABLE IS APPLIED BUT UNUSED. The code that read it was reverted on
-- 2026-09-16, one day after it shipped. Nothing writes to it and nothing reads
-- it. It holds one test row.
--
-- WHY IT WAS REVERTED: without email delivery, invitations are strictly worse
-- than the join code they were meant to improve on. Both require the teacher to
-- tell the class something. A code is explicit and self-checking — typing it
-- wrong says "code not found" — whereas an invitation is matched on an invisible
-- key, so a pupil who signs up with a personal address instead of their school
-- one sees an empty page and no explanation. It added a failure mode and
-- removed nothing.
--
-- The one thing a join code cannot do is tell a teacher WHO HAS NOT JOINED yet,
-- since a code implies no expected roster. That is real, and it is the reason to
-- revisit this. It only matters once a real class is chasing stragglers, and
-- docs/audit/19 §4 is explicit that teacher features should not be built before
-- a real class has used the existing ones. This was built ahead of that rule.
--
-- WHY THE FILE STAYS: the table EXISTS in production. Deleting this migration
-- would leave a live table defined nowhere in version control, which is audit
-- finding S1 and the exact gap this whole line of work has been closing (see
-- 20260913_auth_signup_triggers.sql and 20260914_capture_students_teachers.sql).
-- A file describing an unused table is a much smaller problem than a table
-- nobody can find.
--
-- TO REVIVE IT: `git revert` the revert. The schema below is unchanged and still
-- correct, and the design reasoning is docs/audit/20 §10. Do the email delivery
-- at the same time, or it will be worse than a join code again.
--
-- The one pending test row can be removed at any time; it is inert either way:
--   delete from public.class_invitations;
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- Class invitations — a teacher prepares a roster without owning the accounts.
--
-- docs/audit/20-school-accounts-design.md §10. The question was whether a teacher
-- could create student accounts in advance. Nothing technical prevents it, but
-- pre-created accounts cost four things: confirmed_13 stops being evidence, the
-- consent basis flips, a school email dies with the school place, and whoever
-- sets the password can sign in as the child.
--
-- Invitations cost none of them. The teacher invites an EMAIL to a CLASS. The
-- student still creates their own account, sets their own password, passes the
-- 13+ gate, and accepts. The teacher gets the roster prepared in advance and no
-- join codes read out over a classroom; the student still performs the act that
-- makes the account, and the membership, theirs.
--
-- ── Three decisions worth the words ─────────────────────────────────────────
--
-- 1. NO TOKEN. An invitation is matched by EMAIL, not by a secret in a link.
--    A token is a bearer credential: anyone holding the link is the invitee.
--    An email match instead requires control of the mailbox, which is strictly
--    stronger, and it removes a secret from the system rather than adding one.
--    The link a teacher shares is a convenience, not a credential, so it can be
--    pasted into a shared classroom document without becoming an access grant.
--
-- 2. THE EMAIL MUST BE CONFIRMED before an invitation can be accepted, and the
--    route enforces it. This matters here more than it looks:
--    20260913_auth_signup_triggers.sql records that a students row is created at
--    SIGNUP, BEFORE the email is confirmed. So without this check, anyone could
--    sign up as a guessed school address they cannot read and claim that pupil's
--    place in the class. The whole security of decision 1 rests on this.
--
-- 3. ACCEPTANCE IS AN EXPLICIT STUDENT ACT. Nothing auto-joins on signup, even
--    though it easily could. Auto-joining would quietly recreate the very
--    problem invitations exist to avoid — a membership that no student ever
--    agreed to — and the student-consented membership is what the entitlement
--    union is built on. The convenience being bought here is the teacher's, and
--    it must not be paid for with the student's consent.
--
-- ── Not in this build, deliberately ─────────────────────────────────────────
-- No email is sent. Delivery means Resend templates, deliverability, and a
-- considered position on emailing children — a larger piece than the mechanism,
-- and not needed for the mechanism to be useful. The teacher shares the link
-- however they already communicate with their class. What the teacher gains
-- today is the roster known in advance, so they can see who has not joined yet.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- Apply BEFORE deploying the code, which reads this table.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

create table if not exists public.class_invitations (
  id          uuid        primary key default gen_random_uuid(),
  class_id    uuid        not null references public.classes(id) on delete cascade,

  -- Stored lower-case, enforced rather than trusted: the unique constraint below
  -- is on the raw text, so 'A@x.sch.uk' and 'a@x.sch.uk' would otherwise be two
  -- invitations for one pupil. The route normalises; this makes it impossible to
  -- get wrong from anywhere else.
  email       text        not null check (email = lower(email)),

  status      text        not null default 'pending'
                          check (status in ('pending', 'accepted', 'revoked')),

  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '180 days'),
  accepted_at timestamptz,

  -- Who accepted. ON DELETE SET NULL, never cascade: a student closing their
  -- account must not erase the teacher's record that the place was taken.
  accepted_by uuid        references public.students(id) on delete set null,

  -- One invitation per pupil per class. Re-inviting updates rather than
  -- duplicates, which is what makes the bulk route safely re-runnable when a
  -- teacher pastes the same list twice.
  unique (class_id, email)
);

create index if not exists class_invitations_class on public.class_invitations (class_id);
create index if not exists class_invitations_email on public.class_invitations (email)
  where status = 'pending';

-- ── RLS: deny, with no policy at all ─────────────────────────────────────────
-- Every read and write goes through a service-role route, the same shape as
-- `schools` and for the same reason: this table is a list of children's email
-- addresses attached to a named class, which is the most sensitive data in the
-- schema. There is no client-side read that would be safe to write.
--
-- A student cannot even read their OWN invitation directly — the route returns
-- it, together with the class name, which the student could not otherwise see
-- (classes_member_select requires membership, which is the thing they have not
-- accepted yet).
--
-- ⚠ IF A POLICY IS EVER ADDED HERE, NAME ITS COMMAND. Never `for all`: a policy
-- with no WITH CHECK reuses its USING clause to decide which new rows may be
-- inserted, which is how the self-granted-admin hole on `teachers` happened.
-- See 20260914_close_teachers_self_admin.sql.
alter table public.class_invitations enable row level security;
revoke all on public.class_invitations from anon, authenticated;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 🚨 The SQL Editor is SUPERUSER and bypasses RLS and grants, so selecting from
-- the table here proves nothing about whether clients are denied. Impersonate.
-- Substitute any real student uuid. EXPECT 0 rows, NOT an error — a denied
-- SELECT under RLS returns empty.
--
--   begin;
--     set local role authenticated;
--     set local request.jwt.claims = '{"sub":"<a student uuid>"}';
--     select * from public.class_invitations;   -- EXPECT 0 rows
--   rollback;
--
-- And confirm the grant is gone outright:
--
--   select grantee, privilege_type
--   from information_schema.table_privileges
--   where table_schema = 'public' and table_name = 'class_invitations'
--     and grantee in ('anon','authenticated');   -- EXPECT 0 rows
--
-- The normalisation check is worth one probe too, since it is the constraint
-- that keeps one pupil from holding two invitations:
--
--   begin;
--     -- EXPECT ERROR 23514 (check constraint)
--     insert into public.class_invitations (class_id, email)
--     values ((select id from public.classes limit 1), 'MixedCase@example.com');
--   rollback;
