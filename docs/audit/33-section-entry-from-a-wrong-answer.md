# 33 — A wrong answer opens the section that teaches it

**Status:** plan, 2026-11-27. Nothing built.
**Follows:** [32 — fitting investigations into the rest of the site](32-investigation-integration-plan.md).
**Chosen by the reviewer** from a list of pedagogy suggestions, as the first to scope.

## The idea

Today a wrong answer on an investigated skill shows a card offering the whole
investigation: four sections, from the start. The student has just made one
specific mistake; we offer them everything.

Instead, the card should open **the one section that teaches what they got
wrong**, say so in plain words, and when that section is done, send them
**back to the same question on fresh numbers** to try again.

Three reasons, in order of weight:

1. **Feedback is worth most straight after the error, and aimed at it.** A
   section is five or so minutes on exactly one idea. Four sections in one
   sitting is not what a student who has just got one question wrong signed up
   for, and doc 32 measured the result: of 44 outside sessions, 22 left before
   the first prediction and none finished (one has since, 24–27 Nov).
2. **The retry closes the loop.** Without it, the section teaches and nothing
   checks that the original mistake is gone. With it, the student meets the
   same kind of question again within minutes, which is the repair we want, and
   we can measure it.
3. **It makes each section stand on its own**, which the progress track
   (doc 32, D7) needs anyway: a track's stop for a skill can be one section,
   not a whole investigation.

## 1. What the evidence says

Measured 2026-11-27 on the five investigated skills (straight lines,
percentage change, compound units, ratio, proportion). Demo-seed students
excluded, as always.

**Misconception tags cannot drive the routing on their own.**

- **They are rare on real wrong answers.** Since tagging began (3 Sept), 14 of
  the 112 wrong answers on these skills carry a misconception, and 51 of 825
  across the whole bank. Most wrong answers match no authored trap at all.
- **They are shared between sections.** Tags are deliberately broad, so the
  same one belongs to several sections:
  - `part_used_as_whole` is claimed by all four ratio sections;
  - `stopped_at_an_intermediate` by three ratio sections and three compound-units ones.
- **So a tag on its own usually cannot name one section.** Of the 14 tagged
  answers, only 3 would map to exactly one.

**The question can, though.** Every question on an investigated skill is about
something one section teaches. Those 112 wrong answers came from 32 distinct
questions, and the five skills have **47 published questions** between them
(straight lines 8, percentage change 7, compound units 12, ratio 13,
proportion 7). **24 of them are already section checks**, so they map
themselves. That leaves 23 to map by hand, well under an hour.

**Traffic is thin, so judge this on design, not on numbers, for now.** Since
the card started counting itself (24 Nov), it has been shown to no outside
student, and there were 6 outside investigation starts. Whatever this changes
will take weeks to show up in figures.

**Most sections already stand alone. Four lean on the one before:**

| section | its opening leans on |
|---|---|
| straight lines §3 | "You know which way it leans" |
| percentage change §2 | "We now know that a rise of 10%… is £20" |
| percentage change §3 | "Now the other way" |
| compound units §2 | "Now the other way round" |

Each needs one alternative opening line for a student who arrives directly.
Ratio and proportion need none.

## 2. How it works today (verified in code)

- **The card:** `components/practice/TeachingPrompt.tsx`, shown only by
  `app/practice/question/[id]/page.tsx`. It gets the question's `skill_ids`.
  It does not get the matched trap, though the page has it
  (`result.trap?.misconception`, already recorded with the attempt).
- **Which tutorial:** `lib/skills/skillEntry.ts` `entryForSkills` picks the
  investigation, or the briefing once that investigation is finished (doc 32, D3).
- **The page:** `/skill/[slug]/investigate` always opens at section 1.
  - A section is **locked** until the one before is done (`locked = i > 0 && !states[i - 1].done`).
  - There is no URL parameter for a section.
- **The retry:** `/practice/question/[id]` draws fresh numbers on every visit,
  so "the same question again" needs nothing new.

## 3. The decisions

### D1 — What decides the section: the question, with the trap as an override

**Recommended.**
- **Each investigation carries a map from question id to section**, authored
  once per published question on its skill.
  - A section's own checks map to it automatically.
  - A question can name no section, and then the card offers section 1,
    exactly as today.
- **Override:** when the matched trap's misconception belongs to exactly one
  section of that skill, that section wins. For example,
  `compared_unlike_quantities` on a proportion question goes to best buys,
  whichever question it came from. On today's tags this is a refinement, not
  the engine.
- **An audit script** (not a vitest test, because it reads the database) lists
  published questions on an investigated skill that have no section. It runs
  alongside `verify-question`, so a newly published question is never silently
  unmapped.

*Rejected:* routing by misconception tag alone (§1: too rare and too shared),
and per-trap mapping. Traps have no ids, only their position in a list the
reviewer edits by hand, so a position-keyed map would break silently.

### D2 — Arriving at a section directly

**Recommended.**
- **The URL** names the section: `/skill/ratio/investigate?section=3&from=<question id>`.
- **That section opens unlocked.**
  - Earlier sections stay reachable from the numbered buttons, but are not required.
  - Later sections lock exactly as now.
- **A one-line frame** above it: "This section is about the mistake in that
  question: ratios and fractions. The rest of the investigation is here if you
  want it."
- **The four sections in §1 get a `coldAsk`**: their opening as it reads
  without the section before. It is shown only on direct entry, and a test
  holds that every section whose `ask` leans back has one.

### D3 — The way back

**Recommended.** When a section entered from a question is done, its foot
offers two buttons:
- **"Try that question again"**, to `/practice/question/<id>` on fresh numbers.
  This is the main button.
- **"Carry on with the investigation"**, to the next section.

The retry is the point. Without it the section is a detour; with it, it is a
repair.

### D4 — After the investigation is finished

Doc 32, D3 offers the **briefing** once an investigation is finished.

**Recommended change:** a specific mistake still goes to its **section**,
framed as "revisit". A finished investigation tells us the student has *seen*
the idea, not that it held. The briefing remains the offer when the question
maps to no section.

**Needs your call:** this partly reverses D3.

### D5 — What a section on its own records

**Recommended:** analytics only. `investigation_completions` stays a
whole-investigation record. A section done from a question is logged as
`investigation_section_done` with `from: 'question'` and the question id. A
per-section completions table can wait for the progress track, which would be
its first real reader.

### D6 — The card's wording

**Recommended:** name the section, not the investigation. For example:

> That looks like the mistake in **Ratios and fractions** — one short section
> of the ratio investigation is about exactly this.
> **Open that section →**

It promises "one short section", not a number of minutes. We have no
measured section times yet. The "There's an investigation for this one" card
stays for questions that map to no section.

## 4. Increments, in order

1. **Direct entry.**
   - `?section=` and `from=` on the investigate page, with the target section unlocked.
   - The one-line frame (D2).
   - `coldAsk` on the four sections, plus its test.
   - The two buttons at the section's foot (D3).
   - Testable on its own by typing the URL; nothing links to it yet.
2. **The map and the card.**
   - The question-to-section map for all five investigations: 47 questions, 24 already checks, 23 to map.
   - The audit script for unmapped questions (D1).
   - The card links to the section and names it (D6), with D4 applied if agreed.
   - The card receives the matched trap's misconception for the override.
3. **Measure the repair.**
   - Events: section entered from a question, and the retry.
   - The first figure worth having is the **repair rate**: of students who
     enter a section from a wrong answer and then retry, how many get the
     question right.
   - Read it once there are a few dozen retries, not before.

Each increment is its own PR, merged to main before the next starts.

## 5. How we will know

| question | read it from | worry if |
|---|---|---|
| Do students take the shorter offer? | card shown → section entered, by `from: 'question'` | under the whole-investigation click-through |
| Do they finish the section? | section entered → `investigation_section_done` | most leave before its rule |
| Does it repair the mistake? | retry after the section → correct | no better than a plain second try on fresh numbers |

The last row needs a comparison. Students who got the question wrong and
retried **without** the section are the natural baseline. That data already
exists in `practice_attempts`.

## Not in scope

- New tags, or re-tagging the bank. D1 works without them.
- A section picker on the investigation page for students who arrive any other way.
- Class sessions. Their own wrong-answer view is a separate surface (doc 32, D4).

## Pointers

- The card: `components/practice/TeachingPrompt.tsx`; choosing it: `lib/skills/skillEntry.ts`.
- The page: `app/skill/[slug]/investigate/page.tsx`. Locking is where `locked` is computed.
- Attempt tags: `practice_attempts.misconception`; the taxonomy: `data/misconceptions.ts`.
- The suggestion list this came from: the session of 2026-11-27 (repair loop, live
  class predictions, a delayed check, example-generation tasks).
