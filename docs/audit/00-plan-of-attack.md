# Project Audit — Plan of Attack

_Consolidated roadmap from the 2026-06-10 read-only audit. See `01-security.md`,
`02-data-integrity.md`, `03-quality.md`, `04-logic-review.md` for detail._

## Headline
The app's **runtime logic is in good shape** — payment routes resist tampering,
privileged routes check ownership, the grader and 151-node skill graph are clean.
The risks are in the **safety nets and source-of-truth**, not the live behaviour:

1. The security model on the core tables exists **only in the SQL editor**, not in
   version control — and can't be verified from code (S1).
2. The Stripe webhook **silently drops** entitlement writes — a student can pay and
   get nothing (S2).
3. **Near-zero test coverage** and **unenforced lint** mean regressions won't be caught.

## Severity-ranked finding index
| ID | Severity | Finding |
|----|----------|---------|
| S1 | 🔴 High | RLS/REVOKE on `students`/`teachers`/`questions`/`practice_attempts` not in version control; live state unverified |
| S2 | 🟠 Med | Stripe webhook swallows entitlement-write failures; no idempotency; hardcoded expiries |
| ③-test | 🟠 Med-High | 1 test file; paramEngine/entitlements/masteryEngine/results untested |
| S3 | 🟠 Med | No rate limiting on public endpoints; 4-char codes brute-forceable |
| L1 | 🟠 Med | Diagnostic can serve a multi-part question as single-part → unanswerable (confirmed reachable) |
| L2 | 🟠 Med | Prerequisite inference overrides direct needs_practice evidence on 1 correct answer (design ruling needed) |
| D1 | 🟠 Med | 12 broken traps that never fire (feedback-quality, not mis-grading) |
| ②-cov | 🟠 Med | 38/151 skills have no published question |
| ④-lint | 🟡 Med | 131 lint errors in app/lib; not gated |
| L3 | 🟡 Low-Med | `tryAgain` stale mastery window → wrong dots / possible false "Mastered!" celebration |
| L4 | 🟡 Low-Med | Multi-part question stuck when sole question in a drill pool ("Next" does nothing) |
| L5 | 🟡 Low-Med | Practice/assignment attempt inserts fail silently (data loss invisible) |
| S4 | 🟡 Low-Med | `report-question` service-role client at module scope |
| S5 | 🟡 Low-Med | Admin template = client code-exec on students (by design; hinges on S1) |
| ⑤-n+1 | 🟡 Low-Med | N+1 in assignments results route |
| D2 | 🟡 Low | 47 coincidental trap collisions |
| L6 | 🟡 Low | MC options not value-deduped (duplicate options possible) |
| L7 | 🟡 Low | `getMyAttempts` scoping relies entirely on unverified RLS |
| L8 | 🟡 Low | Practice page fetches drafts by id; visibility depends on RLS (ties to S1) |
| S6 | 🟡 Low | `diagnostic` trusts client-held session |
| ⑥-a11y | 🟡 Low | Question SVGs `aria-hidden`, no text alternative |
| ④-junk | 🟡 Low | Empty `git` file committed; scripts sprawl; root one-offs |

## Phased plan

### Phase 0 — Verify & capture the security baseline _(do first; mostly read-only)_
- **Live RLS introspection** (read-only): dump `pg_policies`, `relrowsecurity`,
  and column grants for the core tables. This either closes S1 or escalates it.
- **Commit the current security posture as migrations** (RLS enable + policies +
  REVOKEs) so there's a reviewable source of truth. _Code/migration only — no live
  DB change; it documents what's already there._
- Confirm `teachers.is_admin` is REVOKE-locked (closes the S5 dependency).
- _Outcome: we actually know what's enforced, and it's in git._

### Phase 1 — Stop the money leak + live student-facing bugs _(small, high value)_
- S2: check every webhook write, return 500 on failure (so Stripe retries); add an
  idempotency guard on `event.id`; replace hardcoded expiries with config.
- Add a test for the entitlement grant/renew/cancel paths.
- **L1**: exclude multi-part questions from diagnostic selection (one-line filter;
  a student can hit an unanswerable question today).
- **L3**: fix the stale mastery window in `tryAgain` (false-celebration bug).

### Phase 2 — Build the safety net _(unblocks everything after)_
- Characterisation tests for `paramEngine`, `entitlements`, `masteryEngine`,
  `deriveResults`/`buildTopicGrid`, `multipleChoice`, `parts`.
- Triage lint `any`s in app/lib; make `lint` + `test` a pre-push/CI gate.

### Phase 3 — Harden the edges
- S3 rate limiting (public email + lookup routes) + consider longer codes.
- S4 module-scope client refactor; S6 explicit ruling; S5 add a CSP.
- ⑤ batch the N+1 results query.
- L5 surface attempt-insert failures; L7 client-side `student_id` filter;
  L8 published check for non-admins; L4 multi-part remount nonce.
- **L2 design ruling**: how much should one correct answer on a dependent skill
  override direct needs_practice evidence on its prerequisites?

### Phase 4 — Content & polish
- D1: fix the 12 broken traps; ban the `round(x±0.01)` pattern; re-parameterise the
  high-frequency D2 collisions. Keep the bank-sweep script as `scripts/audit-bank.ts`.
- ②-coverage: prioritise the 38 question-less skills by exam frequency.
- ⑥ SVG text alternatives + icon-button labels.
- ④ housekeeping: `git rm git`, archive one-off scripts, relocate root files,
  optionally split `answerChecker.ts`.

## Suggested first action
Phase 0 — run the read-only RLS introspection and report what's actually enforced.
That's the one open question the static audit couldn't answer, and it gates S1/S5.
