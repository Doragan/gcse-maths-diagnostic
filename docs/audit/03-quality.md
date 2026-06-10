# Quality Audit — Workstreams ③④⑤⑥ (Testing, Code, Performance, A11y)

_Read-only. Date: 2026-06-10._

## ③ Testing — thin _(High)_
- **1 test file** (`answerChecker.test.ts`, 56 tests) for the whole app.
- **23 lib modules have no test.** Highest-risk untested logic:
  - `questions/paramEngine` — the `new Function` evaluator + constraint solver +
    rounding; everything renders through it.
  - `entitlements` — decides paid access (money).
  - `skills/masteryEngine` (185 LOC) — scoring/progression.
  - `results/deriveResults` + `results/buildTopicGrid` — user-facing results.
  - `questions/multipleChoice` — distractor generation.
  - `questions/parts`, `diagnostic/diagnosticEngine`, `classes`, `assignments`.
- No API-route or component tests.
- **Action:** characterisation tests for the engines above first (they're pure
  functions — cheap to lock down), then API happy/expired-path tests.

## ④ Code quality
- **Lint is effectively unenforced** _(Medium)_ — `npx eslint .` → **208 problems
  (147 errors)**; **131 of the errors are in `app`/`lib`/`components`**, mostly
  `@typescript-eslint/no-explicit-any`. `next build` doesn't gate on it, so it
  silently accumulates. `tsc --strict` **passes** (good) and **TODO/FIXME = 0**.
  - **Action:** triage the `any`s, fix or scope-disable, then make lint a CI gate.
- **Scripts sprawl** _(Low)_ — 50 scripts (20 `fix-*` one-offs, 6 `add-*`), all
  holding the service-role key. Most are historical one-shot migrations.
  - **Action:** archive `fix-*`/`add-*` to `scripts/archive/`; keep reusable
    audits (bank sweep, coverage, analyze-coverage).
- **Repo junk** _(Low)_ — an empty 0-byte **`git`** file is committed (likely a
  stray `> git` redirect); `Foundation Skills Spreadsheet.xlsx` and
  `convertSkills.js` (one-off converter) sit in the repo root.
  - **Action:** `git rm git`; move/ignore the spreadsheet + converter.
- **`answerChecker.ts` is 636 LOC** _(Low)_ — the largest logic file; could split
  into `normalise` / matchers / units without behaviour change (tests now cover it).

## ⑤ Performance
- **N+1 in `assignments/[id]/results`** _(Low-Med)_ — per-target membership fetch
  and per-student fetch inside loops; fine for small classes, scales poorly.
  - **Action:** batch into `in (...)` queries + a single attempts pass.
- `select('*')` in 5 places _(Low)_ — minor over-fetch; column-scope hot reads.
- **Bundle is OK** — `jspdf`/`xlsx`/`katex` are **not** imported into client
  components (KaTeX is dynamically `import()`-ed in `MathInput`). No action.
- Practice flow already caches the student id per session (good).

## ⑥ Accessibility — light pass _(Low-Med)_
- **Inline question diagrams are `aria-hidden`** with no text alternative, so
  screen-reader users get nothing on diagram-dependent questions. Overlaps the
  exam-audit "visual/drawing" concern.
  - **Action:** add a `<title>`/`aria-label` (or visually-hidden description) to
    question SVGs; for parametric shapes the labels already encode the dimensions.
- Only 3 `aria-label`s across components — icon buttons (e.g. the `∑` keyboard
  toggle) likely need labels. Colour contrast not assessed statically.

## Cross-cutting theme
The **runtime logic is solid** (authZ patterns, grader, skill graph all clean),
but the **safety nets are thin**: no version-controlled security posture (S1),
near-zero tests, unenforced lint. The plan should build nets alongside fixes.
