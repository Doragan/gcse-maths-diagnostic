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

**Increment 2 — the style dimension (the real precondition).**
Add framing to `questions` and tag the bank, reusing the audit's vocabulary so
bank and papers finally speak one language. Partly rule-based off question
wording, like the misconception pass. Only after this can "style gap vs skill
gap" mean anything.

**Increment 3 — the adaptive loop proper.**
Now the recorded design becomes buildable: mastered skills select the question,
dropped marks are attributed to style or skill, and routing has somewhere to
route to. Gated on Increment 2 and on synthesis reach improving.

## Decisions needed before building

1. **Increment 1 alone, or wait and do the whole loop?** Recommend Increment 1
   alone — it is the only part with content and users today, and it produces
   the usage evidence the rest of the design is currently guessing at.
2. **Where does it surface?** Dashboard prompt after a mastery event, an option
   on `/practice`, or a distinct "step up" entry point. This is the actual
   product question; the selection logic is easy by comparison.
3. **Is the style taxonomy worth a 256-question tagging pass?** It is the
   precondition for the feature as designed. Worth deciding deliberately rather
   than discovering mid-build — and worth weighing against the fact that the
   whole exam-mode design currently serves one paying student.

## Recommendation

Build **Increment 1**, defer 2 and 3. The recorded design is sound in shape but
its preconditions are two steps away, and one of them (the style dimension) is
a content pass rather than an engineering task. Meanwhile the middle rung is
sitting unused in the bank with 71% reach.
