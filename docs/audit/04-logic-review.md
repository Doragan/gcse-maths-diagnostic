# Logic Review — Workstream ⑦ (Engines & Client Flows)

_Read-only line-by-line review of the modules the structural audit didn't read.
Date: 2026-06-10._

**Covered:** `masteryEngine`, `diagnosticEngine`, `useDiagnostic`, `deriveResults`,
`buildTopicGrid`, `progressSeries`, `multipleChoice`, `classes`, `assignments`,
`analytics`, `shareText`, the practice question page, `MultiPartQuestion`, and the
student diagnostic page.
**Skipped (low risk):** `generatePDF.ts` (jspdf layout code), static dashboard pages,
admin list pages.

## Findings (severity-ranked)

### 🟠 L1 — Diagnostic can serve a multi-part question as single-part → unanswerable _(Medium, CONFIRMED reachable)_
`app/student/diagnostic/page.tsx` builds its items from **all** published questions
overlapping the tier and renders each with the single-part `renderQuestion(...,
q.answer_template, ...)`. It never filters out multi-part questions. One published
multi-part question exists (`40ee97d5`, rectangle area/enlargement) whose top-level
`answer_template` is `""` and whose skills are Foundation-tier. If selection lands
on either skill and picks it, every student answer grades against an empty string →
always "Incorrect", blank "Correct answer:". The practice page handles parts
properly; the diagnostic doesn't.
**Fix:** exclude questions with non-empty `parts` from diagnostic selection (or
teach the diagnostic the per-part flow).

### 🟠 L2 — Prerequisite inference overrides direct evidence on 1 correct answer _(Medium, design question)_
`inferPrerequisiteMastery`: any skill with ≥1 recent correct (even 1/5 =
needs_practice) marks **all transitive prerequisites mastered**, overriding a
prerequisite's own *needs_practice* status earned from 5 direct attempts. The code
comments say this is deliberate ("harder-skill evidence beats brief diagnostics"),
but one lucky correct out of five on a hard skill erasing direct struggle-evidence
on its foundations seems too aggressive. Worth a deliberate ruling (e.g. require
the dependent skill to not be needs_practice itself, or ≥2 correct).

### 🟡 L3 — `tryAgain` leaves the mastery window stale → wrong dots, possible false "Mastered!" _(Low-Med)_
Practice page: each graded attempt is inserted into `practice_attempts`, but
`tryAgain()` does **not** refresh `priorSkillAttempts` (unlike
`reparametriseCurrent()`, which does). After try-again → correct, the 5-dot window
and `detectMastery` compute over a window missing the just-recorded wrong attempt —
the dots over-count and the 🎉 mastery celebration can fire when the true DB window
is 3/5. Display/celebration only — the DB and dashboard are correct.
**Fix:** append the recorded attempt to `priorSkillAttempts` in `recordAttempt`
(no refetch needed), or refetch in `tryAgain` like `reparametriseCurrent`.

### 🟡 L4 — Multi-part question stuck when it's the only question in the pool _(Low-Med, edge)_
`nextQuestion()` with a single-question pool calls `reparametriseCurrent()`, which
resets single-part state. But multi-part rendering short-circuits to
`<MultiPartQuestion>`, whose internal `useMemo`/state are keyed on `question.id` —
which didn't change. Result: "Next question →" visibly does nothing; the student
stays on the completed question. Reachable when a skill-focus drill has exactly one
multi-part question.
**Fix:** pass a render-nonce prop (or `key={question.id + nonce}`) so the component
remounts on reparametrise.

### 🟡 L5 — Silent write failures for attempts _(Low-Med, reliability)_
`recordAttempt` (practice), `recordPartAttempt` / `recordAssignmentRollup`
(multi-part), and `recordAssignmentAttempt` (lib/assignments) all ignore the insert
result — a failed write (RLS change, network) silently loses progress data. The
diagnostic page **does** log its insert error (good pattern to copy).
`analytics.trackEvent` fires `.then()` with no rejection handler.
**Fix:** check `.error`, at minimum `console.error`; consider a retry/queue for
practice attempts.

### 🟡 L6 — MC options aren't value-deduped _(Low)_
`buildOptions` filters traps against the correct answer by **exact string** match
only; traps aren't deduped against each other, and a trap differing only in format
("12" vs "12.0") slips through → two visually identical/equivalent options. Links
to finding D1: a "broken" trap that equals the answer becomes a duplicate option in
MC presentation (grading is still correct — `checkAnswer` passes either).
**Fix:** dedupe by `normalise()`d value when building options.

### 🟡 L7 — `getMyAttempts` relies entirely on RLS for scoping _(Low, defence-in-depth)_
`lib/assignments.ts` `getMyAttempts()` selects all attempts for an assignment with
no `student_id` filter — "my" is enforced only by an unverified RLS policy (ties to
S1). If that policy lets teachers read attempts for their assignments, a student
calling this could receive other students' rows.
**Fix:** add `.eq('student_id', user.id)` client-side regardless of RLS.

### 🟡 L8 — Practice page fetches any question by id, draft visibility unverified _(Low, ties to S1)_
`loadQuestion()` selects by id with no `is_published` filter; whether drafts leak to
students depends entirely on the unverified RLS posture. (The admin editor uses the
same anon client to edit drafts, so *some* client path to drafts exists.)
**Fix:** confirm via S1 introspection; consider a client-side published check for
non-admins as belt-and-braces.

### 🔵 L9–L13 — Minor / informational
- **L9** `questionCache`/`poolCache` (module scope) never invalidate — admin edits
  or unpublishing don't take effect mid-session. Acceptable; document it.
- **L10** `deriveStrengths`/`deriveWeaknesses` take the first 3 items in Set
  iteration order — arbitrary, not "top" strengths. Fine for now; rename or rank.
- **L11** The greedy yes/no diagnostic engine (`diagnosticEngine`, `useDiagnostic`)
  is clean — contradiction-free by construction (dependents/prereqs pruned on each
  answer). No issues found.
- **L12** `progressSeries` month buckets step a fixed 30 days — label drift over
  long ranges. Cosmetic.
- **L13** `buildShareText` reads `window.location` directly — client-only by usage;
  would throw if ever SSR'd.

## What was checked and found CLEAN
- `calculateMastery` window logic (last-5, ≥4 correct, exam-kind positive-only) ✓
- `getAccessibleSkillIds` / `getWeightedSkillPool` / `getNeedsPracticeSkillIds` ✓
- `buildTopicGrid` ✓ · `classes.ts` join/leave/reactivate (23505 path) ✓
- `progressSeries` bucket replay semantics ✓
- Diagnostic skill selection (impact scoring, topic caps, coverage-aware) ✓
- Multi-part per-part attribution + assignment rollup-on-last-part ✓
