-- ── Which questions were actually set ───────────────────────────────────────
-- A teacher often gives only part of a paper — the first eight questions as a
-- starter, one section as a topic test. Until now a sitting recorded only the
-- marks, and marks_total was computed from the WHOLE paper, so a student
-- scoring 34 of an available 42 was stored as 34/80. Not a worse mark: the
-- wrong mark, and one that fed straight into the class average.
--
-- NULL MEANS THE WHOLE PAPER. Every existing row predates partial papers and
-- is therefore a full sitting, so the column is nullable with no backfill and
-- no default — a NULL here is a fact, not a gap.
--
-- WHY STORE IT RATHER THAN INFER IT from which keys the marks jsonb carries:
-- "not set" and "scored zero" are different, and inference cannot tell them
-- apart. A teacher who types 0 into every blank would silently shrink the
-- paper, moving the denominator under a student who simply did badly. It is
-- also what lets a sitting be re-opened for correction showing the same subset
-- it was entered with, rather than the whole paper with gaps.
--
-- text[] not jsonb: this is an ordered list of PaperConfig question ids
-- ('7a', '12'), the same ids used as keys in `marks` and stamped into
-- questions.question_template. jsonb would reorder them (see the recorded
-- jsonb key-ordering surprise); a text[] keeps the teacher's order.
alter table paper_sittings
  add column if not exists selected_items text[];

comment on column paper_sittings.selected_items is
  'PaperConfig question ids that were set, when only part of the paper was '
  'given. NULL means the whole paper. marks_total is computed from this '
  'subset, so it must not be inferred from the marks jsonb keys.';

-- A selection, when present, must name at least one question: marks_total has
-- a check constraint requiring > 0, and an empty array would mean a sitting
-- worth nothing at all. Guarded here as well as in validateEntries so the
-- invariant survives a caller that forgets.
alter table paper_sittings
  drop constraint if exists chk_paper_sitting_selection_nonempty;
alter table paper_sittings
  add constraint chk_paper_sitting_selection_nonempty
  check (selected_items is null or cardinality(selected_items) > 0);
