# Edexcel International GCSE 4MA1 — curriculum delta against the app's skill list

_Written 2026-10-07 from the official specification (`IGCSE-4MA1-SPECIFICATION.PDF`,
**Issue 2, November 2017**) and the June 2025 question papers, both in
`~/Downloads/PastPapers/Edexcel-iGCSE/`. Mapped against `data/skills.ts` (159
skills) and the tier lists in `data/courses.ts` as of commit `41e969f`._

> **Status (2026-10-07): the two SET skills are now BUILT. Everything else here
> is still analysis.** `set_notation` and `counting_elements_in_sets` are in
> `data/skills.ts`, placed in new provisional `igcse_foundation` /
> `igcse_higher` courses in `data/courses.ts`, and the 14 affected audit rows
> are retagged off their interim `venn_diagrams` tag. **Neither course is
> selectable anywhere** — no UI offers them and `ALLOWED_COURSES` does not list
> them — so nothing reaches a student yet. `npm run verify` passes (1889 tests).
> See §9 for what was done and what is deliberately left.
>
> The remaining candidates (calculus, arithmetic series, domain and range) are
> still gathering evidence; see §2.4. For where this sits against everything
> else — currently *behind* the retention work — see `00-plan-of-attack.md`.

**Scope note:** this covers **Mathematics A (4MA1)** only. Cambridge IGCSE 0580
is a different qualification with Core/Extended tiers instead of
Foundation/Higher, and is deliberately out of scope here — see §7.

---

## 1. Why 4MA1 is the cheap board to add first

The spec's structural model is the one `data/courses.ts` already implements:

> "Knowledge of the Foundation Tier content is assumed for students being
> prepared for the Higher Tier."

That is exactly `higher.skills = [...foundationSkillIds, ...higherOnlySkillIds]`.
The spec lists its content twice, once per tier, under the same topic headings,
with Higher-only subsections flagged inline as `Higher Tier only`. Tiers are
named Foundation and Higher, same axis as GCSE.

So registering the course is a data edit, not an architecture change. **But the
tier lists cannot be reused** — see §3.

Paper shape, read off the June 2025 papers rather than the spec summary:

| | 1MA1 (GCSE) | 4MA1 (iGCSE) |
|---|---|---|
| Papers per tier | 3 | **2** |
| Marks per paper | 80 | **100** |
| Duration | 1h30 | **2h** |
| Calculator | 1 of 3 papers non-calc | **all papers** |
| Foundation grades | 5–1 | 5–1 |
| Higher grades | 9–4 | 9–4 |
| Formulae sheet | — | Appendix 4 (F), Appendix 5 (H) |

The calculator difference is a filter default, not a blocker — noted for
completeness and not treated as a design problem.

---

## 2. New content — 8 skills to author

None of these exist in `data/skills.ts`. Prerequisites below are proposals, not
verified against `skillGraph`; check them with `courses.test.ts` before landing.

### 2.1 Calculus (spec 3.4, Higher only) — the big one

The only wholly new *topic*. Spec items A–E:

| Proposed skill | Covers | Proposed prerequisites |
|---|---|---|
| `differentiation` | "differentiate integer powers of x"; variable rate of change | `simplifying_indices`, `substitution` |
| `stationary_points` | gradients, rates of change, stationary and turning points (maxima/minima) by differentiation, related to graphs; distinguishing max from min **by the general shape of the graph only** | `differentiation`, `quadratic_functions` |
| `calculus_kinematics` | "apply calculus to linear kinematics and to other simple practical problems" | `differentiation`, `kinematic_graphs` |

The spec's own worked example is displacement → velocity → acceleration:
`s = 24t² − t³`, find expressions for velocity and acceleration. Note the app's
existing `gradient_of_a_curve` is tangent/chord gradients (spec 3.3 D) — adjacent
to this, and a sensible prerequisite, but **not a substitute**.

### 2.2 Set language and notation (spec 1.5) — and it starts at Foundation

This is the one most likely to be got wrong by analogy with GCSE, where set
notation does not appear at all.

**The Foundation/Higher line is a real one, and it is testable.** The spec
divides 1.5 cleanly, and the coded papers discriminate on it perfectly:

| Foundation 1.5 | Higher 1.5 |
|---|---|
| A — definition of a set | A — sets defined in **algebraic terms**, and **subsets** |
| B — the notation ∪, ∩, ⊂, ℰ, ∅ | B — Venn diagrams representing sets **and the number of elements** |
| C — the universal set and the empty set | C — the notation **n(A)** for the number of elements |
| | D — sets in practical situations |

`n( )` appears on **zero of the four coded Foundation papers and two of the four
Higher papers**. Foundation asks you to *list the members*; Higher asks *how
many*. Membership against cardinality.

| Proposed skill | Tier | Topic | Prerequisites | Covers |
|---|---|---|---|---|
| `set_notation` | **Foundation** | **Number** | — | definition of a set; ∪, ∩, ⊂, ∈; universal set ℰ; empty set ∅; listing the members of a set given in notation |
| `counting_elements_in_sets` | Higher | **Number** | `set_notation` | `n(A)` for the number of elements; Venn diagrams carrying counts; sets defined in algebraic terms; subsets |

**Neither takes `venn_diagrams` as a prerequisite, deliberately.**
`venn_diagrams` credits four skills and every one of them is probability
(`mutually_exclusive_events`, `calculating_simple_probability`,
`simple_arithmetic`, `combined_events`). On 4MA1 set language is spec 1.5, filed
under *Numbers and the number system* — a Number topic. Hanging the set skills
off `venn_diagrams` would credit a student who listed the members of B′ with
understanding mutually exclusive events, which is the "completing a kite credits
Function Machines" error that `docs/coding-a-paper.md` warns about. Costs 1 and 2
against `venn_diagrams`' 4, and keeps set questions out of the probability column
on a feedback sheet.

Naming: `counting_elements_in_sets` rather than `set_cardinality`, to match the
app's plain-descriptive style (`area_and_volume_scale_factors`,
`properties_of_2d_shapes`) and because students will not recognise "cardinality".

See §3 for the knock-on to `venn_diagrams`' tier placement.

### 2.3 Three smaller gaps

| Proposed skill | Spec | Tier | Covers |
|---|---|---|---|
| `arithmetic_series_sum` | 3.1 C | Higher | sum of the first n terms of an arithmetic series (Sₙ). The app has `sequences`, `finding_the_nth_term` and `nth_term_quadratic_sequences`, but nothing that sums a series. **Held pending evidence — see the tally below.** |
| `domain_and_range` | 3.2 C | Higher | the terms "domain" and "range", and which values must be excluded from a domain (spec example: f(x) = 1/(x−2), exclude x = 2). `functions_notation` exists but does not cover this. |
| `intersecting_chords` | 4.6 A | Higher | internal and external intersecting chord properties. **Not in UK GCSE at all.** The five `circle_theorem_*` skills cover the rest of 4.6 cleanly. |

### 2.4 Gap candidates held pending evidence

**User ruling, 2026-10-07:** do not add a skill off a single sighting. The spec
says what *may* be examined; a node earns its place when the coded papers show it
recurring. This mirrors `skillExamProfiles.json`'s own `"minParts": 4` — the app
will not make a claim about a skill below four coded parts, so neither should the
taxonomy.

Each candidate item is flagged in its paper's `coding_notes` with a greppable
prefix, so the tally never has to be re-derived by re-reading papers:

```bash
# Count only notes that OPEN with the prefix — a note that merely mentions
# another candidate must not inflate its tally.
node -e "const fs=require('fs');const t={};\
for(const f of fs.readdirSync('data/exam-audit').filter(x=>x.startsWith('IGCSE-')))\
for(const n of JSON.parse(fs.readFileSync('data/exam-audit/'+f,'utf8')).coding_notes||[])\
{const m=n.match(/^GAP-CANDIDATE ([a-z_]+)/);if(m)t[m[1]]=(t[m[1]]||0)+1}\
console.log(t)"
```

**One item, one note, prefix first.** The first version of this counted 2 for a
single item, because the note explained the convention by quoting the prefix
inside itself. Anchor the match to the start of the note.

**Tally at 8 of 20 papers coded** (June 2025 and November 2024 complete).

**Count PARTS, not questions and not notes.** `minParts: 4` is a parts bar, and
profiles are sliced by board **and tier**, so a crossover question legitimately
evidences its skill on both slices — exactly as every other crossover item is
already handled. The greppable note count is one per paper and is only an index
into this table, not the measure.

| Candidate | Parts (F) | Parts (H) | Where | Interim tag |
|---|---|---|---|---|
| **`set_notation`** | **7 ✓** | **7 ✓** | Jun24 1F q22(4 parts) + crossover 1H q7; Nov24 1F q21(3 parts) + crossover 1H q4 | **none on Jun24 — untagged**; `venn_diagrams` on Nov24 |
| **`counting_elements_in_sets`** | 0 | **4 ✓** | Jun25 2H q20(b); Nov24 2H q21; Jun24 2H q16(c),(d) | `venn_diagrams` |
| `arithmetic_series_sum` | 0 | 3 | Jun25 1H q24; Nov24 1H q19; Jun24 1H q24 | `simultaneous_equations`, `angles_in_polygons` |
| `differentiation` | 0 | 3 | Jun25 2H q17(a); Nov24 1H q20; Jun24 1H q18 | **none — untagged** |
| `stationary_points` | 0 | 1 | Jun25 2H q17(b) | `solving_quadratic_equations_factorising` |
| `domain_and_range` | 0 | 1 | Jun24 1H q15(a) | `functions_notation` |

**Both set skills have now CLEARED `minParts: 4`**, at 12 of 20 papers —
`set_notation` at 7 parts on each slice, `counting_elements_in_sets` at 4 on
Higher. The membership/cardinality line held up across every sighting: `n( )`
still appears on **zero** coded Foundation papers.

Jun24 2H q16 is the cleanest demonstration that the split is operable rather
than theoretical. One question, four parts, three different skills: **(a)**
completing the Venn is `venn_diagrams`, **(b)** is `conditional_probability`,
and only **(c)** and **(d)** — both `n( )` of a set expression — are cardinality.
Jun25 2H q20 splits the same way.

`arithmetic_series_sum` and `differentiation` are both at 3 of 4 with 8 papers
left, so both look likely to clear. `stationary_points` and `domain_and_range`
have one sighting each and may not.

**One interim tag is worse than the others and should not be left indefinitely.**
Every other interim tag *under*-claims — it credits part of what the question
tests and stays silent on the rest. `venn_diagrams` on the pure membership rows
*mis*-claims: it costs 4 and all four are probability skills, so a student who
listed the members of B′ is currently recorded as understanding mutually
exclusive events and combined events, having demonstrated no probability at all.

`differentiation` is the only candidate with **no** honest partial tag
available, so its items are the corpus's only genuinely untagged rows. The
generator reports those as "untagged by design" and points at `coding_notes`,
which is the intended behaviour rather than a slip — hence 2 of the 8 papers
carrying exactly one warning each.

`stationary_points` has not recurred. Nov24 1H q20 needs a turning point but
asks for the tangent there, so it was counted under `differentiation`; if the
two end up merged into one calculus skill this distinction disappears.

Note every sighting except Nov24 1F q21 sits on a **Higher** paper, so the
ceiling for those is 10 papers, not 20.

**Interim tagging.** A candidate item is tagged with whatever existing skill
honestly covers *part* of it, rather than left untagged, where such a skill
exists — `deriveAttempts` is positive-only, so a tag can only over-credit a
correct answer, never penalise a wrong one. Jun25 1H q24 is tagged
`simultaneous_equations` on that basis (3 of its 5 marks). **This is a holding
position, not a judgement that the gap is closed**, and these rows are the first
to retag if the skill is added.

**Decide at 20 papers**, not before. Note the arithmetic series is a Higher-only
topic, so the realistic ceiling is 10 Higher papers — one sighting per paper
would reach the bar comfortably, none would settle it the other way.

---

## 3. Tier re-placements — existing skills, different tier

**This is the finding that stops the GCSE tier lists being reusable.** Three
direct contradictions, all verified against the spec's inline tier flags:

> **Correction, 2026-10-07, same day — read this before using the table.** The
> first version of this table claimed quadratics were Higher-only in 4MA1. **That
> was wrong**, and it was wrong for a reason worth recording: under `pdftotext
> -layout` the spec's left-hand *heading* column and right-hand *content* column
> drift out of alignment, because headings are evenly spaced while content blocks
> vary in height. A `Higher Tier only` marker printed on the same extracted line
> as `2.7 Quadratic equations` actually belongs to **2.5 Proportion**, two
> headings earlier. Pair markers by *sequence* within each column, never by the
> line they share. June 2025 1F q23(b) — factorise y² − 11y + 30, hence solve —
> is the proof, and the paper is the authority over my reading of the spec.

| App skill(s) | App tier | 4MA1 tier | Spec |
|---|---|---|---|
| `vectors` | Foundation | **Higher only** | 5.1 `Higher Tier only` (re-derived with correct column pairing) |
| `venn_diagrams` | Higher only | **Foundation** | 6.3 D "find probabilities from a Venn diagram". Confirmed on a paper: Jun25 1F q16 |
| `upper_and_lower_bounds` | Higher only | **Foundation** | 1.8 C "identify upper and lower bounds where values are given to a degree of accuracy". Confirmed on a paper: Jun25 1F q19(b),(c). Higher 1.8 A adds *solving problems* with bounds |
| `direct_proportion`, `inverse_proportion`, `proportion_with_powers` | Foundation (first two) | **Higher only** *in the algebraic sense* | 2.5 Proportion is `Higher Tier only`. Foundation keeps ratio and proportion word problems under the Number strand (1.7), so this is a split, not a clean move — see note below |

**Quadratics are Foundation in 4MA1**, but narrower than GCSE Foundation: spec
2.7 A limits it to "solve quadratic equations by factorisation (limited to
x² + bx + c = 0)". The formula, completing the square and harder factorising
(2.2 B/D) are Higher. So `solving_quadratic_equations_factorising` and
`factorising_quadratics` are Foundation; `solving_quadratic_equations_quadratic_equation`
and `completing_the_square` are Higher.

The proportion row is the awkward one: 4MA1 splits a single app concept across
two strands and two tiers. Foundation gets ratio/proportion word problems
including maps and scale diagrams (1.7 E); Higher gets the algebraic form,
y ∝ x², relating algebraic solutions to graphs (2.5). The app's
`direct_proportion` / `inverse_proportion` straddle that line. **Resolve this
against the coded papers rather than the spec** — it is the one row here I would
not act on from the specification alone.

Also confirmed Higher-only in 4MA1 and already Higher-only in the app, so no
change: `functions_notation` (3.2), `nth_term_quadratic_sequences` (3.1).

### Consequence for the test suite

`lib/skills/courses.test.ts` asserts that every skill sits in **exactly one
tier**, globally:

```ts
it('places every defined skill in exactly one tier', () => { ... })
it('never lists the same skill as both Foundation and Higher-only', () => { ... })
```

Both become false the moment an iGCSE course exists: `vectors` is Foundation for
GCSE and Higher for iGCSE. The invariant has to become **one tier per course**,
not one tier globally. That is a rewrite of those two tests, not an extension —
and the reachability tests below them (which hard-code `foundationSkillIds`) need
to loop over courses instead.

---

## 4. GCSE skills with no 4MA1 home

If an iGCSE course inherited the Foundation list wholesale, these would serve
questions for content the student will never be examined on.

**Verified absent** (searched the full spec text, and read the surrounding
sections rather than trusting the count):

- `scatter_graphs` — no occurrence of "scatter" anywhere in the spec
- `time_series` — no occurrence
- `sampling` — no occurrence
- `box_plots` — no occurrence. Higher 6.2 has the quartiles and the IQR, but no box plot
- `frequency_trees` — no occurrence (probability *tree* diagrams are present, Higher 6.3 A — different thing)
- `plans_and_elevations` — the only "elevation" in the spec is **angles of elevation and depression** (4.8 B)
- `loci` — **every apparent match was inside the word "ve‑loci‑ty"**. Constructions themselves *are* present at Foundation (perpendicular bisector, angle bisector, constructing triangles, 4.5), so it is loci specifically that goes, not the pair
- `iteration` — no occurrence

The Foundation data strand is explicitly capped by the spec's own note on 6.1:

> "Pictograms, bar charts and pie charts, and only two-way tables"

**Probable but not confirmed** — these turned up zero matches on the obvious
search term, but the spec may word them differently, so check before excluding:

- `frequency_diagrams` (searched "frequency polygon") — note `grouped_frequency_tables` **is** present (6.2 C/D: estimated mean and modal class for grouped data)
- `relative_frequency` (searched "relative frequency", "trial", "estimate of probability")
- `exact_trig_values` (searched "exact value")

---

## 5. Everything else maps cleanly

Checked section by section; these spec items land on existing skills with no
work beyond tier placement:

- **1.x Number** — recurring decimals (1.2), surds (1.3/1.4), fractional and negative indices (1.4 C), repeated percentage change and compound interest (1.6 → `growth_and_decay`), upper and lower bounds (1.8), standard form (1.9/1.10)
- **2.x Algebra** — expanding products of 2+ linear expressions (2.2 A), factorising quadratics (2.2 B), algebraic fractions (2.2 C), completing the square (2.2 D), algebraic proof (2.2 E), rearranging formulae with the subject appearing twice (2.3), proportion with powers (2.5), one-linear-one-quadratic simultaneous equations (2.6), quadratic inequalities (2.8)
- **3.x Graphs** — cubic and reciprocal graphs (3.3 A), trig graphs (3.3 A), graph transformations f(x)+a, f(ax), f(x+a), af(x) (3.3 B), gradient of a curve by tangent (3.3 D), perpendicular gradients (3.3 G)
- **4.x Geometry** — all five circle theorems (4.6 C i–v), geometrical reasoning (4.7), sine and cosine rules (4.8 C), 3D Pythagoras (4.8 D), ½ab sin C (4.8 E), 3D trigonometry (4.8 F), sectors (4.9), sphere and cone (4.10), area and volume scale factors (4.11), three-figure bearings (Foundation 4.4), congruence and similarity
- **5.x Vectors** — magnitude, column vectors, scalar multiples, resultants, modulus, vector proof (5.1 A–G)
- **6.x Data** — histograms with unequal class intervals (6.1 A), cumulative frequency (6.1 B/C), IQR (6.2 C/D), tree diagrams (6.3 A), independent events (6.3 B → `combined_events`), conditional probability (6.3 C), sample space (Foundation 6.3 E → `probability_spaces`), systematic listing (Foundation 6.3 F)

---

## 6. Authoring constraints worth lifting from the spec

Narrower than the GCSE equivalents; these belong in the skill briefings if the
course is built:

- **4.9 Mensuration:** "Radian measure is excluded"
- **Foundation 5.2 Transformation geometry:** enlargements are "Positive scale factor only (including fractions)" — so `fractional_enlargements` is in scope at Foundation, negative scale factors are not
- **4.8 F:** 3D trigonometry includes the angle between a line and a plane, but "The angle between two planes will not be required"
- **4.1 Higher:** "Formal proof of these theorems is not required"
- **Foundation 1.2 D:** converting a decimal to a fraction is "Terminating decimals only"
- Questions are set in SI units; diagrams are not to scale unless stated

---

## 7. What this does to the cost estimate

Against the first-pass estimate (in conversation, 2026-10-05):

- **Content goes up.** ~8 new skills rather than the 2 first guessed, and
  calculus needs a prerequisite chain that does not exist in the graph yet. At
  the bank's current density (271 published questions over 140 live skills,
  ~2 each) that is ~16–20 authored questions plus 8 briefings, all through the
  verify harness and your publish gate.
- **Code is roughly unchanged**, except `courses.test.ts`, which needs a real
  rewrite (§3) rather than the tweak first assumed.
- **The exam-evidence corpus is unaffected** — 40 4MA1 PDFs are already on disk
  covering five series (Jun23, Nov23, Jun24, Nov24, Jun25), which is the same
  depth as the AQA slice. Coding them is the large remaining line item.
- **4MA1 before Cambridge 0580, if both are ever wanted.** 4MA1 keeps the
  Foundation/Higher axis, so it reuses the existing tier plumbing. 0580's
  Core/Extended would force a tier-label refactor through the **6 files that
  separately declare a `Tier` union** (`lib/exam/blueprint.ts`,
  `lib/exam/examPaper.ts`, `lib/skills/examProfile.ts`,
  `app/practice/page.tsx`, `app/student/diagnostic/page.tsx`, plus
  `lib/papers/challengePool.ts` as `'F' | 'H'`) and the **24 files that
  reference the Foundation/Higher string literals** at all.

---

## 8. What I did not verify

Flagged so nobody treats this document as settled fact where it is not — the
repeated lesson being that a document describing a thing is not the thing.

1. **The spec is Issue 2, November 2017.** It is the version Pearson links from
   the qualification page, so it is very probably current for 4MA1, but the
   issue number is recorded here rather than asserted as current. Confirm from
   the "Specification and sample assessments" category before committing
   authoring effort.
2. **The three "probable but not confirmed" exclusions** in §4.
3. **Most of this is not checked against the papers.** The mapping is
   spec-derived apart from the rows in §3 marked "confirmed on a paper". The
   spec says what *may* be examined; the coded papers say what *is*, and the
   app's evidence bar (4 parts) is built on the latter. Expect the coded corpus
   to narrow this list, as it did for GCSE — several spec items will turn out
   never to appear. **The §3 correction above is what this risk looks like in
   practice**: one paper question overturned a tier claim taken from the spec,
   within a day of writing it.
4. **Prerequisite chains in §2 are proposals.** They have not been run against
   `getAccessibleSkillIds`, which is exactly the check that caught 19 silently
   unreachable skills in August.
5. **Spec 3.3 E** (intersection of a linear and a non-linear graph as the
   solution of an equation) may or may not be covered by `sketching_functions`
   plus `quadratic_functions`. Worth a look; it may be a ninth skill.

---

Related: [[project_exam_audit_corpus]] (where the PDFs are, and the Pearson
soft-404 trap), [[project_roadmap]], `docs/coding-a-paper.md`.

---

## 9. What was built, 2026-10-07

The two set skills cleared `minParts: 4` at 12 of 20 papers coded, so they were
added. Four files of production data and one test changed; nothing else.

**`data/skills.ts`** — two nodes, both `topic: "Number"` (4MA1 files set
language under *Numbers and the number system*), with
`counting_elements_in_sets` taking `set_notation` as its only prerequisite.
Costs 1 and 2. Neither takes `venn_diagrams`, for the reason in §2.2.

**`data/courses.ts`** — `igcse_foundation` (119 skills) and `igcse_higher`
(161), built from the GCSE lists by applying only the deltas the coded papers
evidence. The GCSE courses are untouched at 118 and 159, and **neither new skill
appears in any GCSE tier list**, so nothing reaches a GCSE student.

**`lib/skills/courses.test.ts`** — the invariant changed from "every skill is in
exactly one tier" (true only while GCSE was the only qualification) to "every
skill is in at least one course, and within a course sits in exactly one tier".
The reachability tests now run per course via `it.each`. 11 tests, all passing.

**14 audit rows retagged** across six files, off the interim `venn_diagrams`
tag. The eight deliberate "untagged by design" warnings on the June 2024 papers
are gone; the two that remain are the calculus rows, which is correct because
that skill does not exist yet. All six crossover pairs still match item-for-item
at 40 marks each.

### The one judgement call, which may want overturning

`translations` was moved to iGCSE Higher-only. **This is not evidence-driven.**
It is forced by the prerequisite graph: `vectors` is `translations`' only
prerequisite, and moving vectors to Higher left translations permanently
unreachable in the iGCSE Foundation pool. `courses.test.ts` caught it, which is
exactly what that test is for.

It was taken on the grounds that translations appears **0 times across all 12
coded papers at either tier**, so excluding it from Foundation costs nothing
measurable, while keeping vectors at Foundation would serve a whole topic 4MA1
does not examine there. But spec 5.2 does place transformation geometry at
Foundation, so this is the weakest link in the course definition. Revisit if
translations appears on a Foundation paper in the remaining eight.

The real culprit is the `translations ← vectors` edge, which is a GCSE-shaped
modelling choice rather than a fact about the mathematics. Worth questioning
independently of iGCSE.

### Deliberately NOT done

- **`skillExamProfiles.json` was not regenerated.** The board switcher on every
  skill page is `codedBoards().map(...)`, so regenerating would put "Edexcel
  International" in front of every GCSE student as a selectable board. Defer
  until the switcher is filtered by qualification.
- **The §4 exclusions are not applied** to the iGCSE lists. That needs the full
  corpus; three of them are still only "probable".
- **No briefings and no questions.** Briefings are optional (21 of 161 skills
  have one). Questions are gated on `isPractisable`, so a question-less skill is
  invisible rather than broken — but it is also the reason these skills cannot
  yet teach anybody anything.
- **The 24-file tier refactor** (§7) is untouched and not needed while no iGCSE
  course is selectable.

### §4 exclusions applied, 2026-10-08 — partially

Prompted by noticing that `translations` was not a one-off: **40 of the 161
skills in the iGCSE courses had zero parts across the 12 coded papers.** That
number conflates three different causes, and only one of them is an exclusion:

- **A — absent from 4MA1.** Verified against the specification text *and* the
  papers. The §4 list had only the spec side, and its three "probable but not
  confirmed" entries (`frequency_diagrams`, `relative_frequency`,
  `exact_trig_values`) are now settled, as are four the §4 analysis missed
  entirely: `nth_term_quadratic_sequences` (4MA1's 3.1 is arithmetic only),
  `equation_of_a_circle` (the spec's one `x² + y² =` is an example of a
  simultaneous pair), `exponential_graphs`, `frustum`, `equations_and_identities`.
- **B — in the spec, just not in 12 papers.** The three unseen circle theorems,
  `algebraic_proof`, `gradient_of_a_curve`, `kinematic_graphs`,
  `fractional_enlargements`, `surface_area_of_a_cone`, and several ordinary
  Number skills. **Not excluded.** Twelve papers is a small sample.
- **C — zero because of how the audit was TAGGED, not because the content is
  absent.** `significant_figures` is the clearest: four coded rows say "give
  your answer to 3 significant figures" in their notes and none is tagged on it,
  because the papers use it as an instruction and the lowest-skill rule puts the
  tag on what is being tested. Also `alternate_and_corresponding_angles` and
  `measuring_lines_and_angles` (routed to `angles_on_lines_and_circles` by the
  same rule), `difference_of_two_squares` (Jun24 2H q23), and
  `surface_area_of_a_cylinder` (both surface-area questions hit the cuboid/prism
  taxonomy gap). **Reading these as "4MA1 does not examine them" would be wrong.**

**Only bucket A was applied, and only 11 of its 17 members.** The other six are
absent from 4MA1 but load-bearing in the prerequisite graph: `sampling`,
`function_machines`, `frequency_diagrams`, `frequency_trees`, `box_plots`,
`exact_trig_values`. Excluding all seventeen would have made **63 of 161 skills
unreachable**, including `substitution`, `pythagoras_theorem` and
`solving_linear_equations`. They stay in the pool as scaffolding, documented in
`data/courses.ts`.

Result: `igcse_foundation` 119 → **113**, `igcse_higher` 161 → **150**.
Zero-evidence skills in the iGCSE pool: 40 → **29**. GCSE courses untouched at
118 and 159, and every excluded skill is still GCSE content, so none is orphaned.
`npm run verify` passes.

**The recurring theme, now seen three times.** `translations ← vectors`,
`substitution ← function_machines`, `gathering_and_organising_data ← sampling`:
the prerequisite graph encodes a GCSE *teaching order*, not mathematical
dependency, and that is what keeps forcing compromises in a second
qualification. Revisiting those edges is the real fix, it would improve GCSE too,
and it is a separate piece of work.

### Prerequisites scoped per course, 2026-10-09 — the compromises removed

The two awkward results above (`translations` moved on no evidence; six topics
4MA1 does not teach kept in the pool as scaffolding) had the same cause, and the
user named it: **if a course does not contain a parent skill, the dependent
should simply not have that parent in that course.**

`lib/skills/skillGraph.ts` gains `prerequisiteTreeWithin(pool)`, which filters
the tree to the course's own skills. `getAccessibleSkillIds` and
`studentMastery` already took the tree as an injected function, so this needed
no change to either — and `app/student/diagnostic/page.tsx:83` was already doing
the same filtering ad hoc, which is a decent sign the shape was right.

It filters the **transitive closure** rather than cutting the edge. Given
C → B → A with B outside the course and A inside, C still requires A: A is
genuinely upstream and genuinely taught, and only the untaught stepping stone is
skipped. Cutting at B would silently drop A as well.

**Verified inert before it was wired in**: scoping changes nothing for any of
the four current courses, because each is already closed under its own
prerequisites. So this carries no risk to shipped GCSE behaviour; its whole
value is what it unlocks.

What it unlocked, immediately:

| | Before | After |
|---|---|---|
| `igcse_foundation` | 113 | **109** |
| `igcse_higher` | 150 | **144** |
| Zero-evidence skills in pool | 29 | **23** |

- All six scaffolding topics are now properly excluded — `sampling`,
  `function_machines`, `frequency_diagrams`, `frequency_trees`, `box_plots`,
  `exact_trig_values`. An iGCSE student is no longer served questions on
  content their exam does not contain.
- **`translations` is back at Foundation**, where spec 5.2 puts transformation
  geometry. That move was the weakest link in the course definition and it is
  gone rather than documented-around.
- All 109 / 144 skills are reachable at full mastery, as are all 118 / 159 GCSE
  ones. `npm run verify` passes.

**Why this mattered more than the four skills it moved.** A course previously
had to carry every topic sitting upstream of something it teaches, whether or
not it taught that topic. That is survivable for a qualification one step from
GCSE and not survivable for one several steps away: an A-level or Further Maths
course would have dragged the entire GCSE graph behind it. The constraint was
structural, not a 4MA1 quirk.

The underlying edges are still wrong — `substitution ← function_machines`,
`gathering_and_organising_data ← sampling`, `translations ← vectors` encode a
GCSE teaching order rather than a mathematical dependency. Measured rather than
assumed (2026-10-09): a correct answer gives each transitive prerequisite two
synthetic credits, so an UNTESTED prerequisite caps at `in_progress` and can
never reach `mastered` by inference alone — one correct `reflections` answer
moves seven unrelated skills to `in_progress`, it does not fabricate mastery.
The real costs are that `in_progress` also unlocks downstream skills via
`getAccessibleSkillIds`, and that a mis-tag can promote a half-evidenced skill.
Scoping contains this per course; it does not fix the edges. **User ruling
2026-10-09: leave them** — unlike everything else here, they are shipped
behaviour for real students.

### November 2023 coded, and two exclusions overturned — 2026-10-09

16 of 20 papers. Both crossover blocks confirmed at 40 marks (1F q15–q24 =
1H q1–q10; 2F q17–q26 = 2H q1–q10).

**Two of the §4 exclusions applied the day before were wrong**, and the way they
were wrong matters more than the two skills:

- `function_machines` — Nov23 2F q10 is a two-step number machine. The spec
  never writes the phrase, but it uses the format as the vehicle for 2.2's
  "derive a formula or expression".
- `frustum` — Nov23 2H q23 opens "Here is a frustum of a cone". The spec never
  writes the word, but 4.10 gives the right circular cone and a frustum is one
  cone removed from another.

Thirteen papers of silence, then the fourteenth examines both. The test was
"absent from the specification text AND absent from the coded papers", and it
was too literal: **absence of a WORD is weak evidence**, weakest for question
FORMATS and for COMPOSITES of listed content. Both restored; iGCSE is now
110 Foundation / 146 Higher.

Four remaining exclusions carry the same risk and should be re-tested at 20
papers rather than trusted: `relative_frequency` (examinable as "estimate the
probability from these results"), `equations_and_identities` (a concept, not a
named topic), `exact_trig_values`, `frequency_diagrams`. The safer entries are
those the spec rules out by POSITIVE STATEMENT rather than silence —
`nth_term_quadratic_sequences` (3.1 is arithmetic sequences only),
`scatter_graphs` and `time_series` (Foundation data capped by the spec's own
note at pictograms, bar charts, pie charts and two-way tables).

**Gap candidates after 16 papers** (parts, Higher slice unless stated):

| Candidate | Parts | Status |
|---|---|---|
| `differentiation` | **4** | clears the bar — Nov23 1H q16 |
| `arithmetic_series_sum` | **4** | clears the bar — Nov23 1H q19 |
| `domain_and_range` | 2 | Jun24 1H q15(a), Nov23 2H q19(a) |
| `calculus_kinematics` | 1 | **first sighting** — Nov23 2H q18 |
| `stationary_points` | 1 | |

`calculus_kinematics` had been zero across thirteen papers. Nov23 2H q18 gives
displacement as a cubic in t and asks for the time at a stated ACCELERATION —
two differentiations, and spec 3.4 E is the one calculus item the specification
gives its own worked example. Left untagged: `kinematic_graphs` would be a
false claim, since there is no graph and nothing is being read off one.

Three skills that had read as unexamined got first sightings, all of them
Bucket B or C rather than genuine absences: `trigonometry_missing_angles`
(Nov23 1F q24 — it looks like a sine-rule question on a Foundation paper, but
the mark scheme's primary route drops a perpendicular and uses right-angled
trigonometry twice), `alternate_and_corresponding_angles` (Nov23 2F q8) and
`dividing_fractions` (Nov23 2F q22).

---

## 10. Corpus complete — June 2023 coded, 20 of 20

All twenty 4MA1 papers are now coded: June 2023, November 2023, June 2024,
November 2024 and June 2025, both tiers, both papers. Four warnings across the
set, every one a deliberately untagged calculus row.

**The 40-mark crossover was an observation, not a rule.** Six consecutive tier
pairs came to exactly 40 marks, which started to look like a property of the
qualification. June 2023 Paper 1 is **41** (1F q16–q24 = 1H q1–q9), verified by
reading q16 against q1 rather than trusting the arithmetic. Paper 2 that series
is 40 again. Treat the mark sequence as a strong hint for locating the block,
never as a check that it is right.

### Gap candidates — final

| Candidate | Papers | Verdict |
|---|---|---|
| `differentiation` | 5 | **clears** — build it |
| `arithmetic_series_sum` | 5 | **clears** — build it |
| `domain_and_range` | 3 | below the bar, but close and consistent |
| `stationary_points` | 1 | fold into `differentiation` rather than build separately |
| `calculus_kinematics` | 1 | the spec's own worked example for 3.4 E, but one sighting |

`set_notation` (4 papers) and `counting_elements_in_sets` (3) are already built.

The calculus picture is now clear enough to act on: five papers carry a
differentiation item, and the three sub-skills originally proposed in §2.1 do
not separate in practice — `stationary_points` and `calculus_kinematics` each
appeared once, always alongside differentiating. One `differentiation` node
with turning points and kinematics as its contexts fits the evidence better
than three.

### Exclusions re-tested against all twenty papers

**All fifteen hold.** No excluded skill is tagged anywhere in the completed
corpus, and the four flagged as at-risk after the `function_machines` and
`frustum` corrections — `relative_frequency`, `equations_and_identities`,
`exact_trig_values`, `frequency_diagrams` — have zero hits in the June 2023
papers on any wording searched. The two that were wrong were caught; the rest
survived the full corpus.

### One tier conflict left, and it is real

`circle_theorem_tangent` is **Higher-only** in `data/courses.ts` but appears on
**Jun23 2F q23**, a Foundation paper — the angle between two tangents. The
specification backs the paper: Foundation 4.6 B is "understand chord and
tangent properties of circles", with the notes spelling out that tangents are
perpendicular to the radius at the point of contact and that two tangents from
a point are equal in length. The Higher listing adds the *angle* properties
(4.6 C) and intersecting chords (4.6 A) — not the tangent.

One Foundation part, so it does not clear `minParts: 4`. **Recorded, not
acted on.** It is the same shape as the `venn_diagrams` and
`upper_and_lower_bounds` moves, which had 6 and 4 Foundation parts behind them.

### Zero-evidence skills remaining

11 of 146 in the iGCSE pool, down from 40 at twelve papers: `algebraic_proof`,
`area_of_parallelograms`, `circle_theorem_alternate_segment`,
`counting_without_listing`, `fractional_enlargements`, `gradient_of_a_curve`,
`inverse_proportion`, `kinematic_graphs`, `reciprocals`,
`surface_area_of_a_cone`, `surface_area_of_a_cylinder`.

These are Bucket B — in the specification, not seen in twenty papers. **Do not
exclude them**; that was the error corrected on 2026-10-09, and twenty papers
is still a sample. Several resolved themselves as the corpus grew:
`significant_figures`, `prime_factor_decomposition`, `difference_of_two_squares`,
`translations`, `trigonometry_missing_angles`,
`alternate_and_corresponding_angles`, `measuring_lines_and_angles`,
`dividing_fractions`, `circle_theorem_same_segment` and `circle_theorem_tangent`
all got their first sighting in the last eight papers.

**`direct_proportion` settled the one question §3 left open.** It and
`inverse_proportion` had appeared on no coded paper at either tier, so the
spec's split — algebraic proportion at Higher, ratio word problems at
Foundation — could not be acted on. Jun23 2H q16 is the first sighting: a
HIGHER paper, proportion given as a graph and wanted as a formula, which is
spec 2.5's "relate algebraic solutions to graphical representation" exactly.
One part, so still below the bar, but the direction now matches the spec.
`inverse_proportion` remains unseen across all twenty.
