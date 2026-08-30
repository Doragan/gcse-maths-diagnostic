# Adaptive, map-linked exam surfacing — scoping plan

_Scoped 2026-08-30. Scope-only, nothing built. This is the item the exam-mode
design (`docs/audit/11-exam-conditions-plan.md`, and the roadmap's "surfacing
spectrum") called **the under-designed frontier**. It was right to; measuring it
against the live bank and real student data changes the design materially._

## Headline

The recorded intent is a loop:

> master a skill → be served an exam question applying it → dropped marks reveal
> a **style** gap rather than a **skill** gap → route to targeted exam-style
> practice → the two currencies feed each other through SELECTION, not just
> side-by-side measurement.

Measured against the live bank and 14 real students with mastery history,
**the loop cannot run today** — for three independent reasons, one of which is a
precondition nobody has costed. But the measurements also surface a rung of the
ramp the design skipped, which *is* reachable now and needs no new taxonomy.

## What was measured

Live published bank (256 questions) and every student with ≥5 attempts and ≥1
mastered skill (14 of 55).

| | |
|---|---|
| `kind='exam'` published questions | **43** |
| …target the mini-exam design set | 15–20 — **cleared** (memory said 6, then 11; the pool has grown) |
| Skills with an exam-kind question | 44 of 140 with any question (**31%**) |
| Of skills students have *actually* mastered | **51%** have one |
| Average difficulty of the exam question served | **d3.9** (spread: 1×d2, 4×d3, 22×d4, 16×d5) |
| Students for whom the strict trigger fires | **1 of 14** |
| Question-style / framing dimension on the bank | **does not exist** |
| Student-facing single-exam-question surface | **does not exist** (only the whole mini-exam) |

## Three findings that block the design as written

### 1. The style/skill distinction — the whole point — is uncomputable

The loop's diagnostic step is "dropped marks reveal a **style** gap, not a skill
gap", and the comprehension model rests on offering *two distinct advice types*:
"practise these **topics**" versus "develop these **question styles**".

`questions` has no framing, style or answer-form column. The audit has `framing`
(`bare / real_world / multi_route / decision_justify / consequence /
given_formula / inverse_operand`) per coded exam part, but that describes **real
exam papers**, not the parametric bank. Nothing links the two.

Without it, "adaptive map-linked surfacing" degrades to *"here is a harder
question about something you know"* — which is just harder practice, not a
second currency. **This is the precondition, and it is a tagging pass over 256
questions, not a code change.** Precedent exists for exactly this shape of work
(the calculator pass over 126 questions; the misconception pass over 708 traps,
which was partly rule-based off question wording).

### 2. Both candidate triggers fail, in opposite directions

- **Loose ("mastered any constituent skill")** fires often but serves a **d3.9**
  synthesis question to someone who just mastered `simple_arithmetic` or `mode`.
  That is not applying what you have learned; it is a wall.
- **Strict ("mastered *every* constituent skill")** is the natural fix — it turns
  the cliff into an earned "you are ready for this". It fires for **1 student in
  14**, averaging 0.7 available questions.

The cause is structural, not a content gap to author around: by the synthesis
authoring rule, an `exam`-kind question requires **2+ genuinely independent**
skills. Students master few skills (median ~5–8 among those who have mastered
any). The intersection of "mastered" and "all constituents of a synthesis
question" is nearly empty, and stays empty until engagement is far deeper.

The one student it does fire for is the paying customer (416 attempts, 28
skills mastered, 10 ready questions) — which is the honest shape of it: this
feature is built for a student who does not exist yet in any number.

### 3. Half the time there is nothing to serve

Even loosely, 49% of actually-mastered skills have no exam-kind question at all.
The most frequently mastered skills with no exam question are exactly the
foundational ones — `simple_arithmetic`, `relative_frequency`, `substitution`,
`indices`, `mode`, `symmetry` — and they are the *least* likely to ever acquire
one, since synthesis questions are grade 7–9 by construction.

## The reframe: the ramp has a middle rung, and it is invisible

The design assumed a two-rung ramp — single-skill practice → synthesis. The
data says that gap is a cliff. But the bank already holds the missing middle:

**Multi-part questions whose parts are each single-skill.** Several steps on one
stem, no leap to two independent skills. The roadmap already recognised these
("most multi-part questions = several short single-skill parts; the irreducible
synthesis part is the EXCEPTION") but the surfacing design never used them.

| | |
|---|---|
| Published multi-part questions | 40 |
| …with **no** synthesis part (the clean middle rung) | **38** |
| Difficulty spread | d1×1, **d2×9, d3×19**, d4×8, d5×1 — centred, not a cliff |
| Skills touched | 36 |
| Students with ≥1 available on a mastered skill | **10 of 14 (71%)** |
| Average available per student | 3.3 |

71% versus 7%. The middle rung is reachable **now**, needs no new taxonomy, and
is a genuine step up: multi-step, one stem, marks that add up — the experience
of a real exam question without the synthesis leap.

## Proposed increments

**Increment 1 — "Ready for a longer question" (no new schema).**
When a student masters a skill, offer a multi-part question that uses it,
framed as a step up rather than more practice. Fills the empty quadrant of the
2×2 (single question, exam framing) that today has nothing in it. Uses existing
content, existing grading, existing per-part attribution. Measurable: does
anyone take it up?

**Increment 2 — the style dimension. DO NOT BUILD YET — see below.**
Add framing to `questions` and tag the bank, reusing the audit's vocabulary so
bank and papers finally speak one language. Partly rule-based off question
wording, like the misconception pass. Only after this can "style gap vs skill
gap" mean anything — but its payoff was measured after this plan was first
written, and it is currently near-zero.

**Increment 3 — the adaptive loop proper.**
Now the recorded design becomes buildable: mastered skills select the question,
dropped marks are attributed to style or skill, and routing has somewhere to
route to. Gated on Increment 2 and on synthesis reach improving.

## What the style-tagging pass would actually buy — measured

Added after the plan above was first written, in answer to "what is the payoff
of that tagging exercise?". Three candidate payoffs were proposed; **two were
measured and do not hold, and the third is statistically impossible today.**
The honest answer is that the pass currently buys almost nothing.

### Payoff A — "the bank practises bare when the paper dresses up". FALSE.

The app already tells students how a skill is dressed on the real paper (skill
briefings, `bareClaim` in `lib/skills/examProfile.ts`). The worry was that we
say "it's nearly always wrapped in a real-life situation" and then serve bare
drill — an integrity gap worth fixing.

Measured across the 57 profiled skills with ≥2 published questions, using a
crude but honest bare/dressed proxy on the question text: **the bank averages 18
points LESS bare than the real paper.** Only 2 skills are ≥40 points barer.
The bank is, if anything, already more dressed-up than reality. There is no
integrity gap to close.

### Payoff B — personalised style diagnosis. NOT POSSIBLE AT CURRENT ENGAGEMENT.

"You can do percentages bare, but fall over when they are in context" needs
several attempts at **both** framings of the **same** skill for **one** student.

Across the 38 students with ≥5 attempts, over 772 (student, skill) pairs:

| | |
|---|---|
| Median attempts on a given skill | **1** |
| Pairs with ≥4 attempts — the bare minimum to split by framing at all | **107 (14%)** |

A median of one attempt per skill cannot be split into two framings, let alone
support a claim about the difference between them. This is a data-volume
ceiling, not a tagging problem: **no amount of tagging creates the signal.**
One student clears the bar (the paying customer: 416 attempts, 40 skills with
≥4) — the feature would exist for exactly one person.

### Payoff C — selection by framing mix. REAL BUT MARGINAL.

Serving practice in the framing mix the paper actually uses would work
mechanically. But per Payoff A the bank's mix is already roughly right, so the
gain is small.

### What WOULD make it pay, and the trigger to watch

**Aggregate style analysis pools across students and so needs far less
per-student data**: "students in general drop marks on real-world percentage
questions" is answerable at today's volumes. That is a **content-authoring
signal for the author, not a student-facing feature** — a different and much
cheaper thing than the design assumed, and the only version of this that pays
off now.

The trigger for the student-facing version is engagement depth, and it is
measurable: re-run the median-attempts-per-skill figure. **When the median
reaches ~6 and a decent share of pairs clear 8, Payoff B becomes real.** It is
1 today.

## Decisions needed before building

1. **Increment 1 alone, or wait and do the whole loop?** Recommend Increment 1
   alone — it is the only part with content and users today, and it produces
   the usage evidence the rest of the design is currently guessing at.
2. **Where does it surface?** Dashboard prompt after a mastery event, an option
   on `/practice`, or a distinct "step up" entry point. This is the actual
   product question; the selection logic is easy by comparison.
3. ~~**Is the style taxonomy worth a 256-question tagging pass?**~~ **ANSWERED:
   no, not yet.** See the measured payoffs above — two of the three do not hold
   and the third needs roughly six times the per-skill engagement we have. The
   only version that pays today is aggregate analysis for authoring, which does
   not need the student-facing feature at all.

## Recommendation

Build **Increment 1**. Do not build 2 or 3.

Increment 1 stands on its own: it uses content that already exists, needs no
schema change, and reaches 71% of engaged students. It is worth doing whatever
happens to the rest of the design.

Increments 2 and 3 are **blocked on engagement, not on engineering**. The
recorded design is sound in shape, but it assumes a student with enough history
to have a diagnosable *style*, and the median student has one attempt per skill.
Building the taxonomy now would produce a correct, well-tested dimension that
nothing could yet read anything out of.

The trigger is written above and is cheap to re-check: median attempts per
skill ≈ 6. Until then this plan is on the shelf deliberately, with the reason
recorded rather than re-derived.
