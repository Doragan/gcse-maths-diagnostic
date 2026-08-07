-- ─────────────────────────────────────────────────────────────────────────────
-- Bring the `question-images` bucket under version control (audit F3).
--
-- WHY: the bucket's policies lived ONLY in the Supabase dashboard — the same
-- "no reviewable, diffable source of truth" gap that 20260611_rls_baseline.sql
-- closed for table RLS. A 2026-07-27 probe confirmed anon UPLOAD is already
-- denied ("new row violates row-level security policy"), so *a* policy exists;
-- what it actually says, and whether an ordinary authenticated STUDENT can
-- upload, was unknowable from git. This file states the intended posture
-- explicitly so it can be reviewed and reproduced.
--
-- The same probe found the bucket EMPTY (0 objects, service-role view), so
-- everything here is zero-risk to apply: there is nothing to break and nothing
-- currently exposed.
--
-- INTENDED POSTURE:
--   • Bucket stays PUBLIC — question images render for logged-out visitors on
--     /practice, and a public bucket serves /object/public/... without RLS.
--   • NO anon/authenticated SELECT policy, on purpose. Reads happen through the
--     public object URL (which bypasses RLS); the /object/list/ API does NOT,
--     so withholding SELECT is what stops the bucket being ENUMERATED. Public
--     by URL, not browsable.
--   • Writes are ADMIN-ONLY, matching "questions: admin full access" — only
--     /admin/questions uploads, and it runs on the admin's own browser session.
--   • image/svg+xml REMOVED from the MIME allowlist: an SVG served from the
--     storage origin is script, i.e. stored XSS against that origin, and the
--     upload path is a browser client. Rasters only.
--
-- Apply via the Supabase SQL Editor (DDL constraint). Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- ── 1. Drop SVG from the bucket's MIME allowlist ─────────────────────────────
update storage.buckets
set    allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
where  id = 'question-images';

-- ── 2. Clear any pre-existing policies scoped to this bucket ─────────────────
-- Their names weren't knowable from git (dashboard-created), and Postgres
-- combines PERMISSIVE policies with OR — so adding a strict policy alongside a
-- loose one grants the UNION, not the intersection. They must be removed, not
-- merely out-voted. Matched on the bucket name appearing in the policy body.
do $$
declare p record;
begin
  for p in
    select policyname
    from   pg_policies
    where  schemaname = 'storage'
      and  tablename  = 'objects'
      and  coalesce(qual, '') || coalesce(with_check, '') like '%question-images%'
  loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
  end loop;
end $$;

-- ⚠ NOT caught by the loop above: a BLANKET policy that grants access to every
-- bucket without naming one (e.g. a dashboard "allow authenticated uploads"
-- template). Such a policy would still OR-in write access for any signed-in
-- student. After applying, check Storage → Policies for any remaining policy on
-- storage.objects whose body does not name a specific bucket.

-- ── 3. Admin-only writes ─────────────────────────────────────────────────────
-- Same admin test as the questions table, so authoring rights are defined once
-- in substance: a teachers row with is_admin = true.
create policy "question_images_admin_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'question-images'
    and exists (select 1 from public.teachers t where t.id = auth.uid() and t.is_admin = true)
  )
  with check (
    bucket_id = 'question-images'
    and exists (select 1 from public.teachers t where t.id = auth.uid() and t.is_admin = true)
  );

commit;

-- ── Verify after applying ────────────────────────────────────────────────────
-- Anonymous listing must stay empty even once images exist:
--   curl -X POST "$SUPABASE_URL/storage/v1/object/list/question-images" \
--     -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
--     -d '{"prefix":"","limit":100}'          → []
-- A public object URL must still render:       → 200
-- Upload as a NON-admin student                → 403 "violates row-level security policy"
-- Upload as an admin via /admin/questions      → succeeds
