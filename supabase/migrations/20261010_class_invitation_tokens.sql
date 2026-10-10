-- ─────────────────────────────────────────────────────────────────────────────
-- Class invitations, revived — give every invitation a key that travels in the
-- emailed link.
--
-- ADDITIVE ONLY. public.class_invitations already EXISTS in production (see
-- 20260915_class_invitations.sql). This file adds two columns to it and does not
-- redefine it. Nothing here drops, renames or re-creates anything.
--
-- ── Why a token now, when the original build deliberately had none ──────────
--
-- 20260915 made a considered decision NOT to use a token, and the reasoning was
-- sound at the time: a token is a bearer credential, so anyone holding the link
-- is the invitee, whereas matching on a confirmed email requires control of the
-- mailbox, which is strictly stronger.
--
-- That argument rested on a premise which has since changed. In the original
-- build NOTHING WAS EMAILED — the teacher pasted the link into whatever channel
-- they already used to talk to the class, so a token in that link really would
-- have been a credential sitting in a shared classroom document, protected by
-- nothing. Email delivery went live on 2026-10-02 (Brevo, EU). The token is now
-- sent to the invited address and nowhere else, so holding it IS evidence of
-- control of that mailbox — the very property the email match was standing in
-- for. The token does not weaken the original guarantee; it carries it.
--
-- And it fixes the failure that got the feature reverted on 2026-09-16. Matching
-- on email alone means the key is invisible: a pupil who signs up with a
-- personal address instead of the school one the teacher typed saw an empty page
-- and no explanation. A join code at least says "code not found". With the key
-- in the URL, acceptance no longer depends on the student guessing which
-- address their teacher used, and an invitation that cannot be matched can say
-- so, because there is something concrete to fail to match.
--
-- It also makes the under-16 case work at all. The 13+ gate means some pupils
-- should be invited via a parent's address; under email-matching, an invitation
-- sent to a parent could NEVER be accepted, because the child signs up as
-- themselves. The parent forwards the link and the child accepts it.
--
-- ── What has NOT changed ────────────────────────────────────────────────────
--
-- The two load-bearing properties of the original design are untouched:
--
--   * ACCEPTANCE IS STILL AN EXPLICIT STUDENT ACT. The token identifies an
--     invitation; it does not grant a membership. Nothing auto-joins, at signup
--     or anywhere else, and the accepting account must still be a student whose
--     own email address is confirmed. A token in a URL is not consent.
--
--   * THE TOKEN IS NEVER RETURNED TO THE TEACHER. The invite route sends the
--     email server-side and the teacher's roster view never receives the token,
--     so a teacher cannot accept on a pupil's behalf by reading it out of their
--     own dashboard. Re-sending is an action on an invitation id.
--
-- When the accepting account's address differs from the invited one, that is
-- shown to the student before they accept and recorded for the teacher via
-- accepted_by, so the roster reconciles rather than silently disagreeing.
--
-- Apply via the Supabase SQL Editor. Idempotent. Apply BEFORE deploying.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- The key that travels in the emailed link.
--
-- DEFAULT, not just NOT NULL: an invitation with no token could never be
-- accepted by link, and the whole point of this migration is that the link
-- works. A default means no insert path anywhere can forget it.
--
-- gen_random_uuid() rather than gen_random_bytes(): it is core in PG13+, so this
-- does not depend on pgcrypto being installed. 122 bits of entropy, hex, with
-- the dashes stripped so the value is URL-safe without encoding.
alter table public.class_invitations
  add column if not exists token text not null
  default replace(gen_random_uuid()::text, '-', '');

-- Unique because it is a lookup key, and the lookup must not be ambiguous.
create unique index if not exists class_invitations_token
  on public.class_invitations (token);

-- When the invitation email was accepted by Brevo, or NULL if it was never
-- sent (no API key configured, or the send failed).
--
-- Worth a column rather than an inference: delivery was broken for the first two
-- days after Brevo was configured (Gmail greylisting, see
-- docs/runbooks/custom-smtp.md), and "the tutor thinks they invited someone who
-- was never told" is the one failure this feature cannot afford. The roster view
-- shows "not sent" distinctly from "sent, not joined", because the two call for
-- completely different actions from the teacher.
alter table public.class_invitations
  add column if not exists sent_at timestamptz;

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
--
-- 1. Both columns exist, token is NOT NULL with a default:
--
--      select column_name, is_nullable, column_default
--      from information_schema.columns
--      where table_schema = 'public' and table_name = 'class_invitations'
--        and column_name in ('token', 'sent_at');
--
-- 2. Every pre-existing row got a token, and they are all distinct. The table
--    held one pending test row when this was written, so EXPECT 0 and 0:
--
--      select count(*) from public.class_invitations where token is null;
--      select count(*) - count(distinct token) from public.class_invitations;
--
-- 3. The grants are still revoked — this migration must not have handed the
--    token to client roles. EXPECT 0 rows:
--
--      select grantee, privilege_type
--      from information_schema.table_privileges
--      where table_schema = 'public' and table_name = 'class_invitations'
--        and grantee in ('anon', 'authenticated');
--
--    🚨 The SQL Editor is SUPERUSER and bypasses RLS and grants, so selecting
--    from the table here proves nothing about client access. The grant query
--    above is the one that answers it.
--
-- 4. The default actually produces distinct values, which is the property the
--    unique index depends on. EXPECT 2 distinct, 32 characters each:
--
--      begin;
--        insert into public.class_invitations (class_id, email)
--        select id, 'token-probe-1@example.com' from public.classes limit 1;
--        insert into public.class_invitations (class_id, email)
--        select id, 'token-probe-2@example.com' from public.classes limit 1;
--        select count(distinct token), min(length(token)), max(length(token))
--        from public.class_invitations
--        where email like 'token-probe-%@example.com';
--      rollback;
