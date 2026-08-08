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
   **Superseded 2026-08-08 — see the content-coverage restatement below.**

### Content coverage — restated 2026-08-08
The bank has roughly doubled since this audit (133 → **233 published**, 113 →
**139 of 152 skills covered**) and the engine gained the equivalence grader,
`multi_blank` and `grid_draw`. Finding 4 above is obsolete:

- **Zero-coverage is closed** — 10 exam-tested skills remain at zero, worth
  **29 primary marks** (not 33 / ~280). Eight need drawing or free-text marking;
  only `trig_graphs` and `sketching_functions` are authorable-and-untouched.
- **The gap moved from breadth to shape** — real papers are **63 % exam-kind
  (synthesis) marks**; the bank is **9 %** (21 of 233). `proportion`,
  `growth_and_decay`, `kinematic_graphs` and `tree_diagrams` are among the
  heaviest synthesis skills and have **zero** synthesis questions.
- **Depth is the live problem** — 87 exam-tested skills sit at 1–2 questions,
  51 at exactly one.
- **Shipped capability is unexploited** — 6 `multi_blank` parts, 6 `grid_draw`
  parts and 3 `mark_bands` parts across the whole bank, against ~86 marks of
  coded exam traffic that `grid_draw`'s eight modes now fit.

Priorities are ranked by **primary marks** (the skill is `skill_ids[0]`, i.e.
the part is genuinely about it) with **near-root skills excluded** (transitive
dependents ≥ 8). Detail in `05-exam-coverage.md`; blocked set in
`06-app-gap-plan.md` §Revision 2026-08-08.

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
| D1 | ✅ 9/12 FIXED | Deleted 9 broken traps; `round(x±0.01)` replaced by a grader rounding check. 3 remain = Bucket C (left for user investigation) |
| E1 | ✅ LARGELY CLOSED | _(was: 33 zero-coverage skills / ~280 marks / 18 authorable)_ **Restated 2026-08-08: 10 exam-tested skills at zero, 29 primary marks.** 8 need drawing or free-text marking; only `trig_graphs` + `sketching_functions` are authorable-and-untouched |
| E2 | 🟠 Med | **Now the live content backlog.** 87 exam-tested skills at 1–2 questions, 51 at exactly one. Top by primary marks: `inverse_proportion` 18, `tree_diagrams` 15, `kinematic_graphs` 14, `simplifying_indices` 13 (near-root excluded; `simple_charts` 19 / `calculating_simple_probability` 19 / `fractions_decimals_and_percentages` 16 are hand-overrides) |
| E5 | 🟠 Med | **New 2026-08-08 — synthesis shortfall.** Papers are 63 % exam-kind marks; bank is 9 % exam-kind questions. `proportion` (49 involvement exam-kind marks), `growth_and_decay`, `kinematic_graphs`, `tree_diagrams` have zero synthesis questions |
| E6 | 🟠 Med | **New 2026-08-08 — shipped capability unexploited.** 6 `multi_blank` + 6 `grid_draw` + 3 `mark_bands` parts across 233 questions; ~308 of 479 previously app-blocked marks are authorable today. The `app_gap_note` text in `data/exam-audit/` is stale and must be cross-checked against current capability |
| ④-lint | ✅ DONE | 146 → 0 errors; pragmatic rules → warnings; CI lint now blocking |
| L3 | ✅ FIXED | `tryAgain` now folds the prior attempt into the mastery window (no false celebration) |
| L4 | ✅ FIXED | Multi-part drill question remounts via a reparam nonce ("Next" now re-serves it) |
| L5 | ✅ FIXED | Attempt inserts (practice/assignment/part) now check `.error` and log |
| S4 | ✅ FIXED | `report-question` service-role client moved into the handler (was breaking the CI build — the exact footgun S4 predicted) |
| S5 | 🟡 Deferred | Admin template = client code-exec (escalation path closed by the `is_admin` lock). CSP deferred — needs browser-tested rollout + can't bound `new Function`; see Phase 3 |
| ⑤-n+1 | ✅ FIXED | Assignment results route batches target resolution into two `in` queries |
| D2 | ✅ FIXED (clean cases) | Constrained the 3 high-frequency colliders (k≠a, n≥2, a≥2/c≥3) → 0; low-freq remainder left (user relaxed) |
| L6 | ✅ FIXED | `buildOptions` dedupes by normalised value |
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

**→ Phase 2 complete.**

### Phase 3 — Harden the edges ✅ DONE 2026-06-12 (S5 a documented deferral)
- ✅ **S3** — Upstash rate limiting on the 4 public endpoints (graceful degrade).
- ✅ **S4** — `report-question` client moved into the handler (CI surfaced it).
- ✅ **S6** — deleted the dead unauthenticated `/api/diagnostic` route.
- ✅ **SEC-2b** — `student_sessions` UPDATE gated on `completed_at IS NULL`.
- ✅ **⑤** — assignment results route batched (no more N+1).
- ✅ **L2** — practice-context prerequisite credit (3 attempts-worth, blends).
- ✅ **L4 / L5 / L7 / L8** — multi-part remount; attempt-insert error logging;
  explicit `student_id` filter; L8 resolved-by-RLS.
- **S5 — DEFERRED (documented).** A CSP can't strictly bound the core risk: the
  param engine relies on client-side `new Function`, so `script-src` must keep
  `'unsafe-eval'`. A CSP would still block inline event-handler XSS (the real
  admin-HTML vector) — worth having as defence-in-depth — but the escalation path
  is **already closed** (S1 locked `is_admin`, so only a deliberately-granted
  admin can author), and a correct CSP needs `'unsafe-inline'` styles + every
  external origin (Supabase, GA, jsdelivr/KaTeX, Stripe, Upstash) and
  **browser-testing of every page** to avoid breaking the live site. Shipping it
  blind is riskier than the low-probability threat it mitigates. Do it as its own
  browser-tested task (consider `Content-Security-Policy-Report-Only` first).
- **L2 design ruling**: how much should one correct answer on a dependent skill
  override direct needs_practice evidence on its prerequisites?

### Phase 4 — Bank quality & polish ✅ core DONE 2026-06-12
- ✅ **D1 (Bucket A+B):** deleted 9 of the 12 broken traps (3 units-reminder, now
  superseded by the grader's units handling; 6 `round(x±0.01)` rounding traps).
  The `round(x±0.01)` anti-pattern is replaced by a **generic grader rounding
  check** (off-by-one → reject w/ "check your rounding"; over-precise → accept w/
  "round to N dp"; gated to 1–4 dp so inert on integers/irrationals). 3 broken
  traps remain — the **Bucket C** set (`a653ffa7`, `3c72b3a4`, `5636b618`),
  **left at the user's request for separate investigation.**
- ✅ **D2:** added parameter constraints to the clean high-frequency colliders
  (`cb37e981` k≠a; `b1f3d882` n≥2; `c179e489` a≥2, c≥3) → 0 collisions. Remaining
  coincidental collisions are low-frequency / floor-truncation traps now
  complemented by the grader rounding check; left as-is (user is relaxed on them).
- ✅ **L6:** `buildOptions` dedupes by normalised value.
- ✅ **`scripts/audit-bank.ts`** committed (render-sweep, trap classifier,
  coverage, + unrounded-answer flag — found 0).
- **Remaining (polish, optional):** ⑥ SVG text alternatives + icon-button labels;
  ④ housekeeping (`git rm git`, archive one-off scripts).

### Phase 5 — Content build, exam-weighted _(from `05-exam-coverage.md`; this IS the Direction A on-ramp)_

**Rewritten 2026-08-08.** The original step list is complete or obsolete: the
compound-areas draft is published, every skill in the old "authorable-now
zero-coverage" list now has questions, and the drawing/equivalence blockers that
parked step 5 have shipped. The superseded version is preserved in
`05-exam-coverage.md` §H.

Ordering principle is unchanged: exam marks per unit of authoring effort — but
scored on **primary marks with near-root skills excluded**, not involvement.

1. **Synthesis on the heaviest skills (E5)** — the largest single mismatch.
   `proportion` (49 involvement exam-kind marks, 0 synthesis questions) and
   `ratio` first, then `compound_units`, `percentage_change`,
   `upper_and_lower_bounds`, `growth_and_decay`, `kinematic_graphs`. The
   best-buy / cheapest-shop / which-is-denser decision pattern is a multi-part
   numeric + final MC — no engine work. Apply the project's synthesis rule:
   `exam` kind only where one answer needs two *independent* skills.
2. **Thicken the thin list (E2) top-down by primary marks** —
   `inverse_proportion` (18), `tree_diagrams` (15), `kinematic_graphs` (14),
   `simplifying_indices` (13), `time_series` (12), `reverse_percentage` (12),
   `systematic_listing` (10), `completing_the_square` (10), then down. Add the
   three hand-overrides the near-root rule wrongly filters out: `simple_charts`
   (19), `calculating_simple_probability` (19),
   `fractions_decimals_and_percentages` (16).
3. **Exploit `grid_draw` (E6)** — ~86 marks of coded traffic fit its eight modes
   against 6 parts built. Lead with `plans_and_elevations` (12 marks, still zero
   coverage), then `symmetry` drawing, `time_series`, `cumulative_frequency`,
   `simple_charts`, `enlargements`/`translations`/`reflections`,
   `scatter_graphs` (plot side only).
4. **Close E1's authorable tail** — `trig_graphs` (3), `sketching_functions` (2).
5. **Watchlist (E4):** revisit the circle-parts-vocabulary node when the 2025
   series is coded (5 recurrences already inside 2024).
6. **Still parked behind app gaps** (~104 marks, down from ~295): free-text /
   proof marking (`algebraic_proof`, `vector_proof`, describe-transformation,
   describe-correlation, explain-the-error — 74 marks), the matching widget
   (15), compass/ruler (`constructions`, `loci` — 10), set-validity partial
   credit (5, grader-only), and a box-plot grid mode (3). Detail in
   `06-app-gap-plan.md` §Revision 2026-08-08.

Authoring gate is unchanged: every question through `scripts/verify-question.ts`,
left unpublished for review.

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
