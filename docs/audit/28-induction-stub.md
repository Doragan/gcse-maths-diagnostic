# Induction — a stub, not a plan

_Parked 2026-10-15. This records why the question came up and what is already
known about it, so none of it has to be rediscovered. **It is deliberately not
scoped**: there is no design, no increments and no recommendation here, and the
next person to pick it up should expect to do that work._

---

## 1. Where this came from

Building the tutor's student list (`docs/audit/26`) and trying two different
percentages on it, both of which failed. §5 of that doc has the detail; the part
that matters here is **why counts worked when no ratio did**:

> Early mastery is achievable while any whole-course denominator is enormous.

A student three weeks in has mastered a handful of about 170 skills. Any
percentage of the course is near zero; any ratio over what they have attempted
falls when they try something new. Counts work because **what a beginner
actually accumulates is a small number of concrete wins**.

Which turns a display problem into a product one: if the first sessions do not
produce visible wins, there is nothing for any view to show, and nothing for the
student to feel.

---

## 2. Why it matters more than it looks

**10 of 56 students have ever returned on a second day** (`docs/audit/18`). The
leak is day 1 → day 2, not the trial: 38 did six or more questions on day one.
So the product's standing problem is not that people bounce off immediately —
it is that a session which went fine does not produce a reason to come back.

A first session that ends with *"you've mastered four things"* is a different
experience from one that ends with *3%*. That is the whole hypothesis, and it is
untested.

---

## 3. What already exists to build on

Induction is not greenfield. Four things are already here:

- **The fast-track in `masteryStatusFor`.** First three attempts on a skill all
  correct marks it mastered early, rather than making a capable student grind
  out a five-attempt window. This is already the "make early progress visible"
  mechanism; it was built for exactly this instinct and nothing currently
  arranges a first session around it.
- **Placement Increment 2, already scoped and unbuilt.**
  `docs/audit/17-placement-test-plan.md` lists *"Practise your gaps" hand-off —
  a session from the results screen targeting the gaps just found*, gated on its
  Decision 1. Increment 1 shipped in PR #64. **Increment 2 is induction work
  under another name**, and it is the most obvious starting point.
- **The paper-marking route** (`docs/audit/27`). Marking a past paper seeds the
  skill map from real evidence, so a tutored student can be placed without
  sitting a diagnostic at all.
- **Counts on the tutor list** (`docs/audit/26` §5), which is the surface where
  an adult sees whether induction worked.

---

## 4. What the tutor conversation contributed

From the call on 2026-10-09. Recorded because it is the only outside input on
this question so far, and because it is otherwise only in a chat log.

- **Her spreadsheet is an induction route.** She enters past-paper marks into
  Excel and it tells her which topics to focus on. That is placement with no
  placement test — and the trial starts straight after the Year 9 mocks, so
  every student will have a freshly marked paper available. Mark it, and the map
  is seeded before the student answers anything.
- **She named STAR / Renaissance as a diagnostic to learn from** — the only
  product she flagged as worth studying rather than simply using. Our own
  placement test has a measured-real signal and a hand-off that is still
  unbuilt, so the lesson to take may be about what happens *after* a diagnostic
  rather than about the diagnostic itself.
- **Colour overlays for SEN.** Raised as a feature request, but it bites hardest
  at first contact: a student who cannot comfortably read the screen in session
  one never reaches an induction at all. Arguably a prerequisite rather than a
  separate item.
- **Kahoot and Wordwall are what she reaches for now.** That is the implicit
  comparison for how a first session should *feel* — quick, light, rewarding —
  as distinct from what it should measure.
- **Her students are Year 9, pre-GCSE.** Early wins have to come from material
  they can actually do. Placement that drops a Year 9 into Higher content means
  the fast-track never fires and the counts stay at zero, which is precisely the
  failure this is meant to avoid.

One risk from the same conversation: **"hard to find something in one place"** —
she already runs four tools. An induction that consumes a whole session competes
with all of them, which is an argument for the paper-marking route over a
sit-down placement test.

---

## 5. Open questions, unanswered on purpose

- Is induction a **student** experience, a **tutor** one, or both? A self-serve
  signup and a tutored Year 9 arrive completely differently, and the paper route
  only exists for the second.
- Does it mean *changing* the first session, or only *measuring* it better?
- What is the success measure — day-2 return, skills mastered in week one, or
  something the student reports?
- Does the fast-track need to change at all, or just to be arranged for?

---

## 6. Status

**Parked.** Not scheduled, not estimated, not started. The trial after the Year 9
mocks will produce the first real evidence about first sessions from anyone who
is not us, and that is worth having before designing around a hypothesis.
