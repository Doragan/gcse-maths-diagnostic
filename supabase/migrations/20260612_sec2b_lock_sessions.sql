-- ─────────────────────────────────────────────────────────────────────────────
-- SEC-2b: lock submitted assessment sessions against further UPDATE.
--
-- The legacy join-by-code assessment flow is anonymous (no auth.uid() to scope
-- to), and its UPDATE policy was `USING (true)` — letting anyone update any
-- student_sessions row. The session lifecycle is:
--   1. INSERT on join  (app/join/page)            — creates the row
--   2. UPDATE exactly once at completion           — sets completed_at +
--      (app/join/diagnostic)                         questions_asked
--   3. SELECT by the owning teacher                — read-only
--
-- So a legitimate update only ever targets a NOT-yet-completed session. Gating
-- the policy on `completed_at IS NULL` keeps that one update working while making
-- a submitted session immutable — results can't be tampered with after the fact.
-- (Session ids are unguessable UUIDs, so this closes the remaining realistic
-- surface without needing an authenticated identity.)
--
-- Apply via the Supabase SQL Editor (DDL constraint).
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "student_sessions: public update" on student_sessions;
create policy "student_sessions: public update" on student_sessions
  for update to public
  using (completed_at is null)   -- only an in-progress (unsubmitted) session is updatable
  with check (true);             -- the one legit update sets completed_at; allow it
