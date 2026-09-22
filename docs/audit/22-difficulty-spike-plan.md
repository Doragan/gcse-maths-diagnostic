# Difficulty-spike-on-failure — scope for a fix

_Written 2026-09-22 from a day-1/day-2 retention investigation. Numbers below are
from a fresh Supabase pull that session, not re-verified here — spot-check the
counts before building on them if this sits for long. See
[[project_retention_baseline]] in memory for the full trail._

> **Status: built.** Decisions resolved and shipped as
> `lib/skills/easeDown.ts` + the offer in `app/practice/question/[id]/page.tsx`.
> §1 was re-verified first and **one headline number did not survive** — see the
> correction below before quoting anything from this document. §4 records what
> was decided and why.

## 1. The finding this is fixing

Comparing the 11 students who ever returned on a later day against the 66 who
didn't (same fair-chance cohort as `18-retention-brief.md`, first attempt ≥48h
old so there's been time to return):

- **0 of 11 returners ended their first-day session on two wrong answers in a
  row. 23 of 66 (35%) non-returners did.** Small n, but the gap is large and in
  the obvious direction (peak-end effect — last experience colours the whole
  session).
- Of those 23, **19 had a usable difficulty baseline** (enough prior correct
  answers that session to compare against). **12 of 19 (63%) failed on
  questions at least a full difficulty point harder than what they'd just been
  getting right** — median jump ~1–2 points on the app's 1–5 scale. Two
  examples: prior-correct avg 1.50 → final fails at 3, 4, 4. Prior-correct avg
  1.33 (seven straight difficulty-1s) → final fails at 2, 5.
- One student (`517d7cb1`) shows both patterns at once: same skill
  (`upper_and_lower_bounds`) three times running, and all three were
  difficulty 5 (the pool max) after a run of mostly 3s.
- One counter-example: `74e7a6ac` got an *easier* question at the end and
  still didn't return. Not universal, but clearly the dominant pattern.

### Correction (2026-09-22, same day) — re-verified before building

Re-run against the live table with `scripts/verify-difficulty-spike.ts`, which
is now the committed, repeatable form of this check. The plan said "first-day
session" without fixing a rule, so both readings are reported: a **sitting**
(attempts <30 min apart, the rule `lib/practice/session.ts` measured
`SESSION_LENGTH` with) and the **whole first UTC day**. Cohort: 74 students,
11 returners / 63 not.

| | returners ended on 2 wrong | non-returners ended on 2 wrong |
|---|---|---|
| first sitting | **2 of 11 (18%)** | 19 of 63 (30%) |
| whole first day | **1 of 11 (9%)** | 21 of 63 (33%) |

- **"0 of 11 returners" does not hold.** It is 1 or 2 depending on the window.
  The direction survives — non-returners end badly about twice as often — but
  at n=11 the difference between 1 and 0 is noise, and this is no longer a gap
  anyone should call large. **The retention claim is not established.**
- **The spike itself replicates, and more strongly than reported.** Of the
  losing ends with a usable baseline, **8 of 10 (80%) by sitting, 9 of 12 (75%)
  by day**, against the 63% here. Median jump 2.33 points by sitting, 1.36 by
  day, both inside the "~1–2 points" originally claimed.
- The cohort is 74 rather than 77 because placement answers are excluded, as
  they are everywhere else in the app — they are priors, not practice.

So: the *moment* is real, common and well-characterised. The claim that it
costs retention is not. That is what makes an **offer** the right shape — it
is cheap, declinable, and instrumented, so the claim gets tested rather than
assumed. Nothing here should become automatic until the events say so.

**Nothing in the product currently responds to this.** Read directly from
`app/practice/question/[id]/page.tsx`: `resolveSkillIds()` fixes the skill
pool for a session up front; `nextQuestion()` / `prepareNext()` then call
`pickRandom(others)` — uniform random over whatever matches that pool,
**no difficulty-awareness, no repeat-avoidance, nothing keyed off whether the
last answer was right or wrong.** A difficulty cliff on any given draw is
ordinary variance, not a bug in the traditional sense — it's just uncaught.

The one adaptive mechanic that exists, `stepUp` (`stepup_offered` /
`stepup_accepted`, `pickStepUp()` — search the same file), is its mirror
image: it fires when a student **masters** a skill, offering something
*harder* as a reward. There's no equivalent going the other way.

## 2. What this is NOT yet

- Not proven causal. This is a correlation on n=11 vs n=66, and the whole
  September cohort is young — re-check the numbers before trusting them if
  more than a week or two has passed.
- Not the only lead. A secondary, unconfirmed pattern turned up in the same
  data: `calculating_simple_probability`→`combined_events` and
  `converting_decimals_to_fractions`→`factorising_quadratics` each appear as
  the last two skills for five different, unrelated non-returners. Could be a
  shared selection-order effect, could just be that those are widely hard
  GCSE topics independently tripping people up — **not distinguished, worth a
  quick check** (does skill selection follow any shared/deterministic order
  across sessions, or is it purely per-student mastery-driven?) before
  assuming it's covered by the difficulty-delta fix below.
  **Checked, and negative — selection is uniform random at every step, so there
  is no shared ordering for this to be an artefact of. See §4.2.**
- Not scoped as "add difficulty ramping to the whole algorithm." That's a
  bigger, riskier change (affects every session, not just failing ones) and
  isn't what the evidence calls for — the evidence is about the *failure*
  moment specifically.

## 3. Proposed direction

_Kept as written, as the record of what was proposed. Where §4 disagrees with
it, §4 is what was built and says why._

Build the mirror of `stepUp`: call it **`easeDown`** (naming open). Same
pattern as the existing feature — detect the moment, offer rather than force,
track the offer and the uptake separately (stepUp's own code comment explains
why: uptake alone is meaningless without the offer count as denominator).

**Trigger** (needs a decision, evidence supports either or both):
- Difficulty-delta based: current question's difficulty is ≥1 point above the
  student's rolling correct-answer average this session, AND it was answered
  wrong. This is the better-evidenced trigger — it's what actually
  distinguishes the 12/19 cases.
- Consecutive-wrong based (what `stepUp` already mirrors structurally): 2
  wrong in a row, regardless of measured difficulty delta. Simpler, catches
  the same-skill-repeated cases even when difficulty data is sparse (a skill
  with only 1–2 questions in the bank won't show a clean delta).
- Likely worth combining: either condition offers a step-down, since they
  catch overlapping but not identical cases (`517d7cb1` hits both;
  `d7ea2edd`'s three identical difficulty-2 `standard_form` questions would
  only be caught by the consecutive-wrong path).

**What "easier" means** (needs a decision):
- Simplest: a lower-difficulty question on the *same* skill, same pattern as
  `pickStepUp()` already does for the harder direction — reuse its shape.
- Doesn't address the cross-skill jump pattern in §2 if that turns out to be
  real (a hard skill entirely, not just a hard question within one). Worth
  deciding after the quick check above, not before — could be scope creep if
  the secondary pattern turns out to be coincidence.
- `lib/skills/skillGraph.ts` holds skill relationships if a prerequisite-level
  step-down (drop to an easier *prerequisite* skill, not just an easier
  question on the same skill) turns out to be warranted — not yet checked
  whether it's the right shape for this.

**Measurement plan** (build this alongside, not after — `stepUp`'s own
comments make the case): track `easedown_offered` (with `found: false` when
the pool has nothing easier to offer, same as `stepUp` does) and
`easedown_accepted`. Then the thing actually worth knowing: **does accepting
an ease-down correlate with not ending the session on a losing streak, and
with returning the next day?** That's the real test of whether this fix
works, not just uptake in isolation.

## 4. Decisions — resolved 2026-09-22

Each was decided against a measurement, not a preference. The measurements are
in `scripts/verify-difficulty-spike.ts` and reproduced in the module header of
`lib/skills/easeDown.ts`.

**1. Trigger — two wrong in a row. The delta is recorded, not used as a gate.**
The plan leaned toward "either condition fires". Measured over all 158 sittings
in the table, either-condition fires on **57% of all wrong answers and in 59% of
sittings**; the delta alone accounts for 33% of wrong answers, mostly single
wrong answers in otherwise fine sessions. At that rate the offer is nagging, not
rescue, and it tells a student who is simply learning that the app thinks they
are drowning. The delta also cannot carry the trigger alone: **60% of
losing-streak moments are on skills whose bank has nothing easier**, so a delta
gate silently skips the sparsest skills — where students are most stuck. The
delta rides on `easedown_offered` as `difficulty_delta` so the question can be
settled from data later.

Two further limits fall out of the same numbers: the offer fires only on the
answer that *completes* a streak (not on the third and fourth wrong — they
already declined), and there is a **cap of 2 per session**, because a sitting
that hits a streak hits one twice at the median and, in one case, 23 times.

**2. Scope of "easier" — same skill first, then widen inside the session pool.
No prerequisite-graph drop.** Same-skill-only, the plan's "simplest" option, is
**empty 60% of the time**: the bank runs to a median of 2 questions per skill
and only 63 of 140 skills carry more than one difficulty. Built that way the
feature would decline to fire in three moments out of five. So the search goes:
same skill → a skill they have already answered *correctly this session* → any
easier question in the pool. The pool is the session's own, so focus mode and
the calculator filter are honoured for free.

The cross-skill quick-check §2 asked for is **answered, and negative**: skill
selection is uniform `Math.random()` at every step — `pickRandom` on the
question page, and `data[Math.floor(Math.random() * data.length)]` on the entry
page — so there is no shared or deterministic ordering across sessions for those
skill pairs to be an artefact of. With the pattern indistinguishable from
coincidence, `skillGraph.ts` stays out of it.

Which of the easier ones: the **hardest question still at or below the baseline
they were already clearing**. Dropping to a difficulty 1 after failing a 4 is
its own kind of insult, and the gap to close is the jump, not the level.
Multi-part and `exam`-kind questions are excluded however they are rated — the
step up's own reasoning is that shape matters as much as the number.

**3. Offer, not automatic.** Matches `stepUp`, and §1's correction makes it the
only defensible choice: the retention claim behind this is not established, so
the intervention has to be the cheap, declinable, measurable one. "Try again"
and "Next question" are untouched and stay primary.

**4. Nothing in `resolveSkillIds()` or the selection path changes.** The offer
is a button that navigates, exactly like the step up's. `nextQuestion()` /
`prepareNext()` keep picking uniformly at random, so declining the offer leaves
the session behaving precisely as before. Candidates are queried on demand at
the moment the streak completes, rather than widening the session pool cache to
carry difficulty, kind and parts — that would make every session pay for a
moment that happens at most twice in it.

**5. Numbers re-verified** — see the correction in §1. One headline did not
survive.

## 5. What to look at once there is data

The events are `easedown_offered` (with `found`, `difficulty_delta`,
`from_difficulty`, `to_difficulty`, `answered`) and `easedown_accepted`. In
order of what would change the design:

1. **`found: false` rate.** Predicted high — this is the bank-density problem,
   and if it dominates then the fix is authoring easier questions on sparse
   skills, not tuning this feature.
2. **Acceptance rate against the offer count**, which is why the offer is
   tracked at all.
3. **Do accepters stop ending sessions on a losing streak**, and do they return
   the next day? That is the actual test of the §1 hypothesis, and the reason
   the claim was left standing as a question rather than asserted.
