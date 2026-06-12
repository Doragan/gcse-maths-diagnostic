# Project Audit — Plan of Attack

_Consolidated roadmap from the 2026-06-10 read-only audit. See `01-security.md`,
`02-data-integrity.md`, `03-quality.md`, `04-logic-review.md`,
`05-exam-coverage.md` for detail._

## Headline
The app's **runtime logic is in good shape** — payment routes resist tampering,
privileged routes check ownership, the grader and 151-node skill graph are clean.
The risks are in the **safety nets, source-of-truth, and content depth**:

1. The security model on the core tables exists **only in the SQL editor**, not in
   version control — and can't be verified from code (S1).
2. The Stripe webhook **silently drops** entitlement writes — a student can pay and
   get nothing (S2).
3. **Near-zero test coverage** and **unenforced lint** mean regressions won't be caught.
4. The bank's coverage gap is **exam-relevant, quantified, and ranked**: 33
   exam-tested skills have zero questions (~280 involvement-weighted 2024 marks),
   and several of the heaviest skills sit at one question (E1/E2).

## Severity-ranked finding index
| ID | Severity | Finding |
|----|----------|---------|
| SEC-CRIT-1 | ✅ FIXED | _(was Critical)_ student self-grant premium — table-level UPDATE REVOKE'd from anon+authenticated; verified `42501`. `20260611_lock_sensitive_columns.sql` applied |
| SEC-CRIT-2 | ✅ FIXED | _(was Critical)_ teacher self-grant `is_admin` — same REVOKE; verified blocked |
| SEC-2b | 🟠 Med | `student_sessions` "public update" policy `USING true` — anon can tamper any legacy assessment session (still open) |
| S1 | ✅ FIXED | RLS posture now in version control — `20260611_rls_baseline.sql` captures all policies (Half 2 done) |
| S2 | ✅ FIXED | Webhook hardened — writes checked (500→retry), idempotency ledger, named expiries |
| ③-test | ✅ DONE | 115 tests across 8 files — entitlements, masteryEngine, paramEngine, multipleChoice, parts, buildTopicGrid, progressSeries; CI gates typecheck+test+build |
| S3 | 🟠 Med | No rate limiting on public endpoints; 4-char codes brute-forceable |
| L1 | ✅ FIXED | Multi-part questions excluded from diagnostic selection |
| L2 | 🟠 Med | Prerequisite inference overrides direct needs_practice evidence on 1 correct answer (design ruling needed) |
| D1 | 🟠 Med | 12 broken traps that never fire (feedback-quality, not mis-grading) |
| E1 | 🟠 Med | 33 exam-tested skills with zero questions (~280 marks of 2024 traffic); 18 authorable today, rest blocked by app gaps — supersedes ②-cov with exam weighting |
| E2 | 🟠 Med | ~40 heavy exam skills at one question (`simple_arithmetic` touches 75 marks); top skills overall at 1–3 (`proportion` 55→2, `ratio` 46→2) |
| ④-lint | ✅ DONE | 146 → 0 errors; pragmatic rules → warnings; CI lint now blocking |
| L3 | ✅ FIXED | `tryAgain` now folds the prior attempt into the mastery window (no false celebration) |
| L4 | ✅ FIXED | Multi-part drill question remounts via a reparam nonce ("Next" now re-serves it) |
| L5 | ✅ FIXED | Attempt inserts (practice/assignment/part) now check `.error` and log |
| S4 | ✅ FIXED | `report-question` service-role client moved into the handler (was breaking the CI build — the exact footgun S4 predicted) |
| S5 | 🟡 Low-Med | Admin template = client code-exec on students (by design; now hinges on the verified `is_admin` lock). Optional: add a CSP |
| ⑤-n+1 | ✅ FIXED | Assignment results route batches target resolution into two `in` queries |
| D2 | 🟡 Low | 47 coincidental trap collisions |
| L6 | 🟡 Low | MC options not value-deduped (duplicate options possible) |
| L7 | ✅ FIXED | `getMyAttempts` adds an explicit `student_id` filter (defence-in-depth) |
| L8 | ✅ RESOLVED | Phase 0 verified RLS: `questions: public read published` (`is_published = true`) already hides drafts from non-admins — no client filter needed |
| S6 | 🟡 Low | `diagnostic` trusts client-held session |
| ⑥-a11y | 🟡 Low | Question SVGs `aria-hidden`, no text alternative |
| ④-junk | 🟡 Low | Empty `git` file committed; scripts sprawl; root one-offs |
| E4 | 🔵 Info | Watchlist: circle-parts vocabulary recurred 5× across 4+ papers in one series — revisit node decision when 2025 papers are coded |

## Phased plan

### Phase 0 — Verify & capture the security baseline ✅ DONE 2026-06-11 (tail: SEC-2b)
- ✅ **Live RLS introspection** (behavioural probe + SQL-Editor `pg_policies`):
  found two confirmed escalations (SEC-CRIT-1/2), now fixed & verified.
- ✅ **Security posture committed as migrations** — `20260611_rls_baseline.sql`
  (all policies) + `20260611_lock_sensitive_columns.sql` (the REVOKE fix). S1's
  "only in the SQL Editor" gap is closed.
- ✅ `teachers.is_admin` client UPDATE revoked (closes the S5 reachability path).
- **Still open — SEC-2b:** re-scope the `student_sessions` public-update policy
  (`USING true`). Needs design — that table is the anonymous typed-name model
  with no `auth.uid()` to scope to.

### Phase 1 — Money leak + live student-facing bugs ✅ core DONE 2026-06-11
- ✅ **S2 — webhook hardened.** Every entitlement write returns 500 on failure
  (Stripe retries); idempotency ledger (`stripe_events`, graceful-degrade);
  expiries lifted to named constants. _Migration `20260611_stripe_events.sql`
  staged (optional — code degrades without it)._
- ✅ **L1** — multi-part questions excluded from diagnostic selection.
- ✅ **L3** — stale mastery window in `tryAgain` fixed (no false celebration).
- **Remaining:** add a test for the entitlement grant/renew/cancel paths
  (rolls into Phase 2).

### Phase 2 — Build the safety net ✅ core DONE 2026-06-11
- ✅ Characterisation tests added (115 total): `entitlements`, `masteryEngine`,
  `paramEngine`, `multipleChoice`, `parts`, `buildTopicGrid`, `progressSeries`.
- ✅ CI gate (`.github/workflows/ci.yml`) on typecheck + test + build + lint;
  `npm run verify` script.
- ✅ **④-lint DONE** — 146 → 0 errors (scripts/ ignored; cosmetic rule off;
  `any`/unused/React-Compiler-hooks → warnings; 4 real `<a>`→`<Link>` fixes).
  CI lint now blocking.
- **Deferred (conscious):** a webhook route-handler integration test. The access
  decision (`isPaidStudent`) is already unit-tested; mocking the Supabase builder
  chain + Stripe `constructEvent` is brittle, and re-refactoring the just-hardened
  revenue webhook for testability adds churn risk to the money path. Revisit if
  the webhook changes again.

**→ Phase 2 complete. Next: Phase 3 (harden the edges).**

### Phase 3 — Harden the edges
- S3 rate limiting (public email + lookup routes) + consider longer codes.
- ✅ **S4 DONE** (pulled forward — CI surfaced it): `report-question` client moved
  into the handler. S6 explicit ruling; S5 add a CSP.
- ⑤ batch the N+1 results query.
- L5 surface attempt-insert failures; L7 client-side `student_id` filter;
  L8 published check for non-admins; L4 multi-part remount nonce.
- **L2 design ruling**: how much should one correct answer on a dependent skill
  override direct needs_practice evidence on its prerequisites?

### Phase 4 — Bank quality & polish
- D1: fix the 12 broken traps; ban the `round(x±0.01)` pattern; re-parameterise the
  high-frequency D2 collisions. Recreate the bank-sweep as a permanent
  `scripts/audit-bank.ts` (trap-collision classifier + coverage check) and run it
  after every authoring batch.
- L6: dedupe MC options by normalised value (pairs naturally with the D1 fix).
- ⑥ SVG text alternatives + icon-button labels.
- ④ housekeeping: `git rm git`, archive one-off scripts, relocate root files,
  optionally split `answerChecker.ts`.

### Phase 5 — Content build, exam-weighted _(from `05-exam-coverage.md`; this IS the Direction A on-ramp)_
Ordering principle: marks of 2024 exam traffic per unit of authoring effort.
1. **Publish the compound-areas draft** (`44c3101d`, diagram added 2026-06-10) —
   instant −1 on the zero-coverage list.
2. **Author the authorable-now zero-coverage list top-down by marks** (E1):
   `forming_expressions_and_formulae` (16), `function_machines` (15),
   `tree_diagrams` (15), `kinematic_graphs` (14), `symmetry` (13), pie-chart
   calculations (12) — the first six cover ~85 marks; then `time_series`,
   `frequency_trees`, `systematic_listing`, `relative_frequency`,
   `rearranging_formulae`, `grouped_frequency_tables`, `perpendicular_gradients`,
   `exact_trig_values`, `fractional_enlargements`, `time_calculations`.
   These double as Direction A material: author them as multi-part where the exam
   parts decompose naturally, so the synthesis/`exam`-kind tail grows in the same
   pass rather than as separate work.
3. **Thicken the bank:1 heavy hitters** (E2) to 2–3 questions each:
   `simple_arithmetic` (75 marks!), `fractions_of_amounts`,
   `simplifying_expressions`, `coordinates`, `inverse_proportion`,
   `calculating_simple_probability`, `mean`, then down the list.
4. **Watchlist (E4):** revisit the circle-parts-vocabulary node when the 2025
   series is coded (5 recurrences already inside 2024).
5. **Parked behind app gaps** (roadmap decision needed first): the drawing
   cluster (`simple_charts` 19 marks, plotting, constructions, loci,
   plans/elevations, histograms, box plots) and the proof skills
   (`algebraic_proof`, `vector_proof`) — blocked on the drawing-input surface /
   free-text marking decisions already tracked in the product roadmap.

## How this meshes with the product roadmap
The product roadmap's **Direction A** (exam-style parametric content) and the
**mini-exam assembler** are gated on bank depth — exactly what Phase 5 builds, in
exam-weighted order. The equivalence grader (its other precondition) shipped
2026-06-09. Suggested interleave: Phases 0–1 first (security baseline + money
leak + live bugs — small and urgent), then Phase 5 content batches can run in
parallel with Phases 2–4, since authoring and engineering don't contend.

## Suggested first action
Phase 0 — run the read-only RLS introspection and report what's actually enforced.
That's the one open question the static audit couldn't answer, and it gates S1/S5
(plus L7/L8 from the logic review).
