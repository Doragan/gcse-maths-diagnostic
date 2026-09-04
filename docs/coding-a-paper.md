# Coding an exam paper for the marking tool

How to turn a real GCSE maths paper into something `/mark` and the teacher
dashboard can use. Written after coding the fifteen AQA Higher papers and
Edexcel 1MA1 June 2025 (all six papers), so the awkward bits below are the ones
actually hit rather than the ones imagined.

**The whole job is one JSON file.** A script turns it into a `PaperConfig`; you
never write TypeScript.

---

## What you need

- The **question paper** — the primary source for marks, and the only way to tag
  skills honestly.
- The **mark scheme** — confirms the part structure and what each answer is.
- Four facts about the paper: **board and spec code, tier, paper number, whether
  a calculator is allowed, and the series**. Nothing infers these. See
  [why](#why-you-state-the-papers-identity).

## The three rules

**1. Derived metadata only. Never transcribe question text.** Question numbers,
marks and skill tags are facts about a paper. The text is the exam board's. Every
audit file says so in its own header and this is not a formality — it is the line
that makes the dataset publishable at all. `desc` describes the *task* ("metric
length conversion"), never the question.

**2. Untagged beats mis-tagged.** If a question tests something
`data/skills.ts` genuinely has no node for, leave `skill_ids` empty and say so in
`coding_notes`. A student credited with a skill they never demonstrated corrupts
the mastery map, which is the thing the whole product is for; a gap merely leaves
it quiet. The registry test allows **one** untagged item per paper.

*The judgement is "outside the taxonomy" vs "inside an existing skill's
territory".* Naming an angle as acute has no node of its own but sits inside
`angles_on_lines_and_circles` — tag it, and note it. Completing a kite is about
knowing what a kite *is*, and the taxonomy has `properties_of_3d_solids` with no
2D equivalent — leave it untagged, and give it a `topic`.

**An untagged item still needs a `topic`.** Without one it falls back to
Probability and Data, so a kite question would be filed under statistics — worse
on a feedback sheet than the missing skill it stands in for. Its marks still
count towards the score and the topic total.

### Prefer the LOWEST skill that honestly covers the question

Crediting a skill propagates backwards through its whole transitive prerequisite
tree (`lib/skills/masteryEngine.ts`), so a tag credits everything underneath it
too. Tagging high silently over-credits. Check the cost before choosing:

```bash
npx tsx -e "import{getPrerequisiteTree}from'./lib/skills/skillGraph';console.log(getPrerequisiteTree('reflections'))"
```

Two real examples from Edexcel 1MA1/1F:

- Completing a kite is genuinely a *reflection*, but `reflections` credits
  **eight** skills including Understanding Straight Line Graphs and Function
  Machines. A Foundation student would be recorded as understanding `y = mx + c`
  for drawing half a kite.
- Naming an angle was first tagged `measuring_lines_and_angles` (3 skills), whose
  own example is using a protractor. `angles_on_lines_and_circles` is its
  prerequisite, credits 2, and claims only that the student knows angle sizes.

**3. The marks must sum to the paper's printed total.** This is the cheapest
possible check that you have not skipped a part, and the generator reports a
mismatch. Give `total_marks` so it can.

---

## Extracting the paper

`pdftotext` is available; `pdftoppm` is not, so PDFs cannot be rendered to images
— text extraction is the route.

```bash
pdftotext -layout "Question paper.pdf" qp.txt
pdftotext -layout "Mark scheme.pdf" ms.txt
```

**Take the marks from the QUESTION PAPER, not the mark scheme.** The QP prints
`(Total for Question N is X marks)` after each question and a bare `(N)` after
each part. The mark scheme gives marks as codes — `B1`, `M1`, `P1`, `C1` — which
`-layout` extraction scatters across lines, so summing them is guesswork. Find
every total at once:

```bash
grep -n "Total for Question" qp.txt
grep -n "TOTAL FOR PAPER" qp.txt
```

Then read the question paper properly to tag skills. This strips the page
furniture that makes it unreadable:

```bash
sed 's/DO NOT WRITE IN THIS AREA//g; s/\.\{4,\}/…/g; s/  \+/ /g' qp.txt | grep -v '^\s*$'
```

**Trust the per-question total; check the per-part `(N)` against it.** The
`(Total for Question N is X marks)` line is reliable. The bare `(N)` part markers
are printed in the margin and `-layout` extraction sometimes interleaves them
across a page break, attaching a part total to the wrong question — this happened
twice on Edexcel 2F alone. Always confirm that a question's parts sum to its
stated total.

Expect mangled maths: fractions arrive as their numerators and denominators on
separate lines, and minus signs, `×` and `£` often come through as `�`. Usually
the surrounding words disambiguate; where they do not, the mark scheme's answer
does.

**And when neither does** — it happens; Edexcel 1H q7a survived both — tag from
what the mark scheme *rewards* rather than from what the question appears to say.
The accepted answers pin down the skill even when the printed expression is
unrecoverable. Say so in `coding_notes` when you have had to do this.

---

## The file

One JSON in `data/exam-audit/`, named for the paper (`EDEXCEL-JUN25-F-P1.json`).

```json
{
  "meta": {
    "board": "Pearson Edexcel",
    "qualification": "GCSE Mathematics (1MA1)",
    "tier": "Foundation",
    "paper": "Paper 1 (Non-calculator)",
    "series": "June 2025",
    "total_marks": 80,

    "paper_slug":     "edexcel-1ma1-1f-jun25",
    "paper_title":    "Edexcel GCSE Mathematics 1MA1/1F",
    "paper_subtitle": "Foundation Tier Paper 1 Non-calculator — June 2025",

    "source": "Coded from the published QP and mark scheme (…). Derived metadata only. No exam question text transcribed."
  },
  "coding_notes": [
    "q5 tagged angles_on_lines_and_circles: no 'classify an angle' node exists.",
    "q8a UNTAGGED: quadrilateral properties, and there is no 2D counterpart to properties_of_3d_solids. Topic stated so the marks still land under Shape and Space."
  ],
  "rows": [
    { "q": "1", "part": null, "marks": 1,
      "skill_ids": ["simplifying_expressions"], "kind": "mastery",
      "answer_form": "expression", "app_gap_note": "collect repeated like terms" },

    { "q": "8", "part": "a", "marks": 1,
      "skill_ids": [], "topic": "shape", "kind": "mastery",
      "answer_form": "draw_shape", "app_gap_note": "complete a kite on a grid" }
  ]
}
```

### meta

| Field | Required | Notes |
|---|---|---|
| `paper_slug` | yes* | Becomes the paper's id and its filename. Lowercase, hyphenated. |
| `paper_title` | yes* | Shown in the picker, e.g. `Edexcel GCSE Mathematics 1MA1/1F`. |
| `paper_subtitle` | yes* | `Foundation Tier Paper 1 Non-calculator — June 2025`. |
| `total_marks` | strongly | Checked against the summed rows. |
| everything else | no | Provenance. Record `source` so the next person can retrace it. |

\* All three together or none. Half-stated identity is refused — a paper filed
under a name nobody chose is worse than one that failed to build.

<a name="why-you-state-the-papers-identity"></a>
**Why you state these rather than the script inferring them.** Boards number
papers differently and arrange calculator rules differently. A script that
guessed would print "Non-calculator" on a calculator paper with complete
confidence, and nothing downstream would catch it. The AQA files are the one
exception: their identity is inferred from the `NOV24-H-P1` filename convention,
which has held since the audit began.

### rows

| Field | Required | Notes |
|---|---|---|
| `q` | yes | Question number as printed, a string. |
| `part` | yes | `"a"`, `"b"`, … or `null` for an unlettered question. |
| `marks` | yes | Whole number, from the QP's part total. |
| `skill_ids` | yes | Array of ids from `data/skills.ts`. **Order matters** — see below. |
| `kind` | yes | `"mastery"` or `"exam"`. |
| `answer_form` | no | Only `draw*` is read, to set `visual`. |
| `app_gap_note` | no | Becomes `desc`, the marking grid's tooltip. |
| `topic` | when untagged | One of `number`, `algebra`, `ratio`, `shape`, `probdata`. Overrides the topic the first skill implies; required in practice for an untagged item. |

**`q` + `part` become the item id and label**: `"12"` + `"a"` → id `12a`, label
`12(a)`. Ids must be unique; the generator reports duplicates.

**Parts nest more deeply than a single letter, outside AQA.** No AQA file goes
beyond `a`–`d`, but Edexcel prints `(a)(i)` / `(a)(ii)`, and also numbers
*unlettered* questions `(i)` / `(ii)` with no `(a)` at all. The convention set by
the June 2025 Edexcel papers, and to keep to:

| Printed as | `part` | id | label |
|---|---|---|---|
| `12 (a)` | `"a"` | `12a` | `12(a)` |
| `12 (a)(i)` | `"ai"` | `12ai` | `12(ai)` |
| `5 (i)` (no letter) | `"i"` | `5i` | `5(i)` |

**The FIRST skill id decides the topic column.** A multi-skill item can straddle
two topics and the mark scheme gives no way to split it, so put the skill the
question is *mainly* about first. A map-scale question tagged
`["ratio", "converting_measurements"]` files under Ratio and Proportion; reverse
them and it files under Number.

**`kind` barely matters here**, so do not agonise. `deriveAttempts` forces every
derived attempt to positive-only regardless. The rule of thumb is `exam` when one
answer needs two or more *independent* skills, `mastery` otherwise.

**`answer_form: "draw_plot"` or `"draw_shape"`** marks an item `visual`, meaning
no text-only retry question could replace it. Anything else is ignored.

---

## Code a tier pair together — and use the overlap as a free check

Roughly **a third of each Edexcel Foundation paper reappears verbatim on its
Higher partner**, at the crossover where Foundation ends and Higher begins. From
June 2025:

| Foundation | is also | Higher |
|---|---|---|
| 2F q20–q27 | = | 2H q1–q8 |
| 3F q22–q30 | = | 3H q1–q8 |
| 1F q22–q24 | = | 1H q4–q6 |

Two consequences:

- **Code the pair in one sitting**, so the shared questions get identical skill
  tags. Tagging them weeks apart is how the same question ends up credited two
  different ways on two papers.
- **It is the cheapest cross-check you have.** The marks must match item for
  item, even though the question numbers differ. A mismatch means one of the two
  codings is wrong, and you find out immediately instead of never.

AQA does not overlap its tiers this way, so this is a per-board fact worth
confirming rather than assuming.

## Checking it

```bash
# Dry run: validates and reports, writes nothing.
npx tsx scripts/generate-paper-from-audit.ts EDEXCEL-JUN25-F-P1
```

It reports unknown skill ids, duplicate item ids, untagged items, and a marks
total that disagrees with `total_marks`. **Aim for zero warnings** — every one is
either a coding slip or a taxonomy gap that belongs in `coding_notes`.

```bash
npx tsx scripts/generate-paper-from-audit.ts EDEXCEL-JUN25-F-P1 --write
```

Then paste the registry lines it prints into `lib/demoPapers/index.ts`, keeping
the newest-series-first order, and:

```bash
npx tsc --noEmit && npx vitest run lib/demoPapers/
```

The registry tests run against every paper automatically, so a new one is covered
the moment it is registered.

**Finally, look at a real sheet.** Tests pass on a paper whose skills are subtly
wrong; prose does not. Generate one for a strong, a middling and a weak student
and read it — a topic that never appears, or one carrying far more marks than it
should, is a tagging error you will not otherwise see.

### If it needs correcting

Generated files are ordinary source, meant to be edited. Fix the tagging in the
`.ts` **and** in the JSON, or the next regeneration undoes you — the script
refuses to overwrite without `--force` for exactly this reason.

---

## What a generated paper does not have

`retrySet` (practice questions) and `challengeQuestions` are written from
question text, so a coded paper has neither, and its feedback sheets omit
"Practise these" and "Push yourself" rather than printing empty headings. The
three hand-authored AQA Foundation Nov 2024 papers are the only ones with them.
Filling in either object turns its section back on with no other change.

## Before it works on the paid path

`/mark` needs nothing further — it writes nothing. Recording a *sitting* against
a real class additionally needs anchor rows in the `questions` table:

```bash
npx tsx scripts/sync-paper-items.ts --paper <slug> --apply
```

Until then `POST /api/papers/sittings` rejects the paper with "not set up for
tracking yet".

---

## Skill ids

`data/skills.ts` is the source of truth; regenerate this list with:

```bash
node -e "const s=require('fs').readFileSync('data/skills.ts','utf8');for(const m of s.matchAll(/\"id\":\s*\"([^\"]+)\",\s*\n\s*\"name\":\s*\"([^\"]+)\"/g))console.log(m[1],'—',m[2])"
```

**Known gaps found so far.** Two are covered by a nearby skill and noted in the
paper; two are genuinely outside the taxonomy and left untagged:

| Gap | Handling |
|---|---|
| Classifying an angle by type | tagged `angles_on_lines_and_circles` |
| Constructing a stem and leaf diagram | tagged `gathering_and_organising_data` |
| **Properties of 2D shapes** (name/complete a quadrilateral) | **untagged** — `properties_of_3d_solids` exists with no 2D counterpart, which looks like an oversight rather than a decision |
| **Identifying an outlier** | **untagged** — spotting an anomalous value is not calculating a range or a mean |
| **Similar solids** (area and volume scale factors) | tagged `congruence_and_similarity`, a poor fit — 5 marks on Edexcel 2H q16 |
| **Exponential graphs** (y = k^x) | no node at all; tagged `fractional_and_negative_indices` where the method is inverting a power |
| **Dividing a polynomial by a monomial** | falls between `simplifying_expressions` and `algebraic_fractions` |
| **Place value**, and **roots** as distinct from powers | tagged `decimals` and `indices` respectively |
| **Forming** a fraction from a context | every fraction node covers operating ON one, not writing one down |

Two oddities that are classification decisions in `data/skills.ts` rather than
tagging errors, but both show on a feedback sheet:

- Every Probability-and-Data path bottoms out in `sampling`, so tagging any data
  question also credits "can explain why a survey is biased".
- Every index skill is filed under **Number**, so index-law algebra lands in the
  Number column. With `percentage_change` also under Number, this pushed Edexcel
  3F's Number share to 36% against a 22-28% published weighting.

### Number (31)

- `simple_arithmetic`                  — Simple Arithmetic
- `indices`                            — Indices
- `rounding`                           — Rounding
- `significant_figures`                — Significant Figures
- `fractions_of_amounts`               — Fractions of Amounts
- `simplifying_fractions`              — Simplifying Fractions
- `irregular_and_improper_fractions`   — Irregular and Improper Fractions
- `decimals`                           — Decimals
- `converting_fractions_to_decimals`   — Converting Fractions to Decimals
- `converting_decimals_to_fractions`   — Converting Decimals to Fractions
- `adding_and_subtracting_fractions`   — Adding and Subtracting Fractions
- `multiplying_fractions`              — Multiplying Fractions
- `dividing_fractions`                 — Dividing Fractions
- `fractions_decimals_and_percentages` — Fractions Decimals and Percentages
- `exact_calculations`                 — Exact Calculations
- `estimating`                         — Estimating
- `converting_measurements`            — Converting Measurements
- `percentage_change`                  — Percentage Change
- `factors_and_multiples`              — Factors and Multiples
- `prime_factor_decomposition`         — Prime Factor Decomposition
- `lowest_common_multiple`             — Lowest Common Multiple
- `highest_common_factor`              — Highest Common Factor
- `simplifying_indices`                — Simplifying Indices
- `standard_form`                      — Standard Form
- `recurring_decimals_to_fractions`    — Recurring Decimals to Fractions
- `fractional_and_negative_indices`    — Fractional and Negative Indices
- `surds_simplifying`                  — Simplifying Surds
- `surds_expanding_and_rationalising`  — Expanding and Rationalising Surds
- `upper_and_lower_bounds`             — Upper and Lower Bounds
- `time_calculations`                  — Time Calculations
- `reciprocals`                        — Reciprocals

### Algebra (36)

- `simplifying_expressions`                        — Simplifying Expressions
- `substitution`                                   — Substitution
- `solving_linear_equations`                       — Solving Linear Equations
- `expanding_brackets`                             — Expanding Brackets
- `factorising`                                    — Factorising
- `expanding_double_brackets`                      — Expanding Double Brackets
- `factorising_quadratics`                         — Factorising Quadratics
- `difference_of_two_squares`                      — Difference of Two Squares
- `solving_quadratic_equations_factorising`        — Solving Quadratic Equations (Factorising)
- `solving_quadratic_equations_quadratic_equation` — Solving Quadratic Equations (Quadratic Equation)
- `simultaneous_equations`                         — Simultaneous Equations
- `inequalities`                                   — Inequalities
- `plotting_straight_line_graphs`                  — Plotting Straight Line Graphs
- `understanding_straight_line_graphs`             — Understanding Straight Line Graphs
- `perpendicular_gradients`                        — Perpendicular Gradients
- `sketching_functions`                            — Sketching Functions
- `kinematic_graphs`                               — Kinematic Graphs
- `quadratic_functions`                            — Quadratic Functions
- `sequences`                                      — Sequences
- `finding_the_nth_term`                           — Finding the nth Term
- `algebraic_fractions`                            — Algebraic Fractions
- `completing_the_square`                          — Completing the Square
- `quadratic_inequalities`                         — Quadratic Inequalities
- `simultaneous_equations_quadratic`               — Simultaneous Equations (Linear and Quadratic)
- `nth_term_quadratic_sequences`                   — Nth Term of Quadratic Sequences
- `equation_of_a_circle`                           — Equation of a Circle
- `algebraic_proof`                                — Algebraic Proof
- `functions_notation`                             — Functions Notation
- `composite_functions`                            — Composite Functions
- `inverse_functions`                              — Inverse Functions
- `iteration`                                      — Iteration
- `graph_transformations`                          — Graph Transformations
- `function_machines`                              — Function Machines
- `forming_expressions_and_formulae`               — Forming Expressions and Formulae
- `rearranging_formulae`                           — Rearranging Formulae (Changing the Subject)
- `trig_graphs`                                    — Trigonometric Graphs

### Ratio and Proportion (9)

- `proportion`             — Proportion
- `simplifying_ratio`      — Simplifying Ratio
- `ratio`                  — Ratio
- `compound_units`         — Compound Units
- `direct_proportion`      — Direct Proportion
- `inverse_proportion`     — Inverse Proportion
- `growth_and_decay`       — Growth and Decay
- `reverse_percentage`     — Reverse Percentage
- `proportion_with_powers` — Proportion with Powers

### Shape and Space (50)

- `angles_on_lines_and_circles`         — Angles on lines and Circles
- `measuring_lines_and_angles`          — Measuring Lines and Angles
- `alternate_and_corresponding_angles`  — Alternate and Corresponding Angles
- `bearings`                            — Bearings
- `angles_in_polygons`                  — Angles in Polygons
- `congruence_and_similarity`           — Congruence and Similarity
- `exterior_angles`                     — Exterior Angles
- `lengths_and_perimeters`              — Lengths and Perimeters
- `areas_of_squares_and_rectangles`     — Areas of Squares and Rectangles
- `areas_of_triangles`                  — Areas of Triangles
- `area_of_parallelograms`              — Area of Parallelograms
- `area_of_a_trapezium`                 — Area of a Trapezium
- `areas_of_compound_shapes`            — Areas of Compound Shapes
- `parts_of_a_circle`                   — Parts of a Circle
- `circumfrence_of_a_circle`            — Circumfrence of a Circle
- `area_of_a_circle`                    — Area of a Circle
- `sector_calculations`                 — Sector Calculations
- `volume_of_a_prism`                   — Volume of a prism
- `volume_of_a_pyramid_and_cone`        — Volume of a Pyramid and Cone
- `volume_of_a_sphere`                  — Volume of a Sphere
- `surface_area_of_a_sphere`            — Surface Area of a Sphere
- `surface_area_of_a_cone`              — Surface Area of a Cone
- `surface_area_of_a_cylinder`          — Surface Area of a Cylinder
- `pythagoras_theorem`                  — Pythagoras' Theorem
- `trigonometry_missing_sides`          — Trigonometry (missing sides)
- `trigonometry_missing_angles`         — Trigonometry (missing angles)
- `vectors`                             — Vectors
- `constructions`                       — Constructions
- `loci`                                — Loci
- `translations`                        — Translations
- `rotations`                           — Rotations
- `reflections`                         — Reflections
- `enlargements`                        — Enlargements
- `circle_theorem_angle_at_centre`      — Circle Theorem: Angle at Centre
- `circle_theorem_same_segment`         — Circle Theorem: Angles in Same Segment
- `circle_theorem_cyclic_quadrilateral` — Circle Theorem: Cyclic Quadrilateral
- `circle_theorem_tangent`              — Circle Theorem: Tangent and Radius
- `circle_theorem_alternate_segment`    — Circle Theorem: Alternate Segment
- `sine_rule`                           — Sine Rule
- `cosine_rule`                         — Cosine Rule
- `area_of_triangle_sine`               — Area of a Triangle (½ab sinC)
- `trigonometry_3d`                     — 3D Trigonometry
- `frustum`                             — Volume of a Frustum
- `vector_proof`                        — Vector Proof
- `fractional_enlargements`             — Fractional and Negative Enlargements
- `properties_of_3d_solids`             — Properties of 3D Solids
- `plans_and_elevations`                — Plans and Elevations
- `symmetry`                            — Symmetry (Line and Rotational)
- `coordinates`                         — Coordinates
- `exact_trig_values`                   — Exact Trigonometric Values

### Probability and Data (28)

- `sampling`                       — Sampling
- `gathering_and_organising_data`  — Gathering and Organising Data
- `simple_charts`                  — Simple Charts
- `pie_charts`                     — Pie Charts
- `mean`                           — Mean
- `mode`                           — Mode
- `median`                         — Median
- `range`                          — Range
- `calculating_simple_probability` — Calculating Simple Probability
- `expected_outcomes`              — Expected Outcomes
- `relative_frequency`             — Relative Frequency
- `mutually_exclusive_events`      — Mutually Exclusive Events
- `frequency_diagrams`             — Frequency Diagrams
- `grouped_frequency_tables`       — Grouped Frequency Tables
- `scatter_graphs`                 — Scatter Graphs
- `time_series`                    — Time Series
- `combined_events`                — Combined Events
- `probability_spaces`             — Probability Spaces
- `tree_diagrams`                  — Tree Diagrams
- `venn_diagrams`                  — Venn Diagrams
- `conditional_probability`        — Conditional Probability
- `histograms`                     — Histograms
- `cumulative_frequency`           — Cumulative Frequency
- `box_plots`                      — Box Plots
- `interquartile_range`            — Interquartile Range
- `systematic_listing`             — Systematic Listing
- `counting_without_listing`       — Counting Without Listing
- `frequency_trees`                — Frequency Trees
