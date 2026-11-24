# Investigations — fitting them into the rest of the site

Scope written 2026-11-24, after the fourth investigation (ratio). It asked
**write a fifth, or make the four we have reachable and measurable first?** —
and the answer, after review, is **both, alongside each other**: authoring
continues (it is still the best use of the time we have — reviewer,
2026-11-24), and the small integration increments in §4 run beside it so that
what gets written is found, finished and measured.

`31-tutorial-content-plan.md` designed the layer. Its §9 said *do not author
investigations 3–20 before the shell has been measured*, and its §10 set the
bar: *a null result after a few dozen completions means stop at two*. We are at
four, with no completions by an outside student. Nothing here says the four are
wrong — they were each reviewed section by section and are good — but the
evidence §10 asked for does not exist yet. §4's first two increments are what
produce it, and they are small enough not to hold authoring up.

---

## 1. What the evidence says (analytics_events, 1 Oct – 24 Nov 2026)

Outside visitors only (`internal` rows excluded; the reviewer's own sessions on
the live site are the 1–2 per investigation that are not straight lines).

| | |
|---|---|
| Sessions that opened any investigation | **44** — against ~10,700 page views site-wide in the same weeks |
| …on the day of the 7 Nov Reddit share | **29** |
| …that landed on the investigation directly (a shared link) | **39** |
| …that arrived from a skill page or /skills | 4 |
| …from the wrong-answer prompt | 0 identifiable (2 clicks, both on investigations only the reviewer has used) |
| Investigations reached by outsiders | **straight lines only** |

How far those 44 got:

| furthest step | sessions |
|---|---|
| opened it, never predicted | 22 |
| made the first prediction | 7 |
| tried a value | 3 |
| completed a rule | 3 |
| finished at least one section | 6 |
| went on to the practice questions | 3 |
| finished the whole investigation | **0** |

Two problems, and neither is fixed by writing more:

1. **Almost nobody finds them.** Outside reach is one Reddit post. The built-in
   routes in (§2) carry close to nothing.
2. **Half leave before the first prediction.** The page opens with the notice,
   the title, a paragraph, four outcomes, the section pips and the question —
   the first thing to *do* is below all of it.

## 2. How a student reaches an investigation today (verified in code)

| entry | where | notes |
|---|---|---|
| After a wrong answer | `app/practice/question/[id]/page.tsx:1210` via `lib/skills/skillEntry.ts` | Every practice question and every class-session question goes through this page, so this is the widest door. **Its wording is wrong for three of four:** "you draw the graphs yourself" was written for straight lines and now shows under percentage, compound-unit and ratio questions. **It logs clicks but not impressions**, so its click-through cannot be measured |
| Briefing page | `app/skill/[slug]/page.tsx:525` — "Work it out for yourself first →" | Only reached by students already on the briefing |
| /skills | `app/skills/page.tsx:254` — a marker on the skill | Quiet by design (§8 of 31: "never a thing to browse") |
| Homepage | `app/Landing.tsx` → `lib/homeInvestigation.ts` | Straight lines only, chosen because the Reddit visitors used it |
| Sitemap | `app/sitemap.ts` | Listed, but the page is client-rendered, so a crawler sees little of the content |

What happens after: investigations write **no mastery** (by design — internal
steps are not evidence); the closing card sends the student to the authored
`transferQuestionIds`, answered through the real loop. That part is right and
does not change.

## 3. The decisions

Each with a recommendation. The user decides; the increments in §4 follow from
the answers.

### D1 — What is an investigation's job in a student's week?

Three candidates: **(a)** a response to being stuck on a skill, **(b)** the
first thing on a skill a student has not met, **(c)** something to browse.

**Recommendation: (a), plus the teacher route in D4 — not (c).** It is what 31
designed for and what the wrong-answer prompt already does; it puts the page in
front of the students who need it at the moment they need it. (b) needs a notion
of "not met yet" the product only has for signed-in students with history, and
(c) is what the numbers say nobody does.

What (a) needs that it lacks: the prompt's wording per investigation (fix the
"draw the graphs" copy from the investigation's own lead), an
`investigation_prompt_shown` event so click-through can be read, and a decision
on **when** it shows. Today it shows on every wrong answer; showing it after the
*second* wrong answer on the same skill in a session is a better signal of a
missing idea than one slip — but measure the first version before changing it.

### D2 — Get the student to the first prediction faster

Half leave before predicting.

**Decided (reviewer, 2026-11-24): keep the top section as it is on arrival, and
fold it away once the first section is finished.** The lead and the outcomes do
real work for a student deciding whether to start — they say what this is and
what they will be able to do — so they stay where they are. Once section 1 is
done they have done that job, and every later section opens under them; so
from then on they collapse to a one-line header ("Speed, Distance and Time ·
what you'll be able to do ▾") that opens again on a tap. The finished view
still ticks the outcomes off.

That leaves the open → predict drop where it was, so the measurement matters:
read open → predict before and after. If half still leave before predicting,
the next thing to try is shortening section 1's own run-up — the question and
the prediction — rather than the top section.

### D3 — Signed-in students: remember it

An investigation is anonymous whether or not the student is signed in: progress
lives in page state and is gone on reload, and nothing records that a student
has done one. **Recommendation:** for a signed-in student, record a completed
investigation (one row: student, skill, finished at) — still **not** mastery —
so the dashboard can show it, the wrong-answer prompt can stop offering one
they have done, and D5 has something to gate on. Small: one table, one write
on Finish.

### D4 — Teachers: an investigation as a lesson starter

The no-login class session (`29-no-login-class-session-plan.md`, live, no real
class yet) is the one route that puts a *whole class* through an investigation
at once — and the trust conversation made it the wedge. Every wrong prediction
and rule option already carries a misconception id, which is exactly what the
teacher's live "common mistakes" view reads.

**Recommendation: the biggest lever here, built after D1–D3.** A teacher
starting a session on a skill with an investigation can choose "start with the
investigation"; pupils land on it with the session attached; their predictions
and rule picks appear in the live view (who predicted what, which rule option
the class chose), and the closing card leads into the session's questions
rather than the transfer list. It is also the cleanest measurement: a class
completing one gives the transfer comparison 31 §10 wanted, with a teacher in
the room.

What it needs: the investigation page reading the `session` parameter the
question page already takes; its events written as session rows (the session's
existing anonymous-write path, `29` §5); one live-view panel. A real build —
scope it against a named teacher and a dated lesson, as `29` §8 insists.

### D5 — Free, or behind the paywall?

Investigations ship as code in the public bundle, so any paywall is a soft one
(the content is downloadable). The earlier recommendation was to decide at
about five. **Recommendation: all free while the evidence is gathered.** At
this reach they are an acquisition and teaching asset, not a revenue line, and
gating them would make the measurement in §5 impossible. Revisit once D3 exists
(something to gate on) and completions are in the tens a week.

### D6 — Which to write next

**Decided (reviewer, 2026-11-24): keep writing.** Authoring is not gated on
this plan; there is no better use of the time.

**Recommendation for choosing:** exam marks, as now
(`project_investigation_targets`), and — once increment 1 has run long enough
to read — **how often students get that skill wrong in practice**: the
wrong-answer prompt is the door, so the skills that send most students through
it are where a new investigation earns its week. And with D7 in view, prefer
skills that sit next to one another in the teaching order, so that a stretch
of a track gets investigations rather than scattered single skills.

### D7 — The long term: a progress track

**The reviewer's direction (2026-11-24):** a student works on a skill, then
the next skill or skills along a track. Not built now, and much more has to be
written first — but it is where these pieces are heading, so the increments
should not close it off.

What already exists for it:
- **The order.** `data/skills.ts` prerequisites encode the GCSE teaching order
  (`project_prereq_graph_is_teaching_order`), and `prerequisiteTreeWithin`
  already contains it per course — Foundation and Higher are each a track.
- **Where a student is.** Mastery per skill, which the track reads to say
  "done" and "next".
- **What to do at a stop.** Practice exists for every skill. Teaching does
  not: **25 of 164 skills have a briefing and 4 have an investigation.** That
  is the "much more written" — a track is only as good as its thinnest
  stretch, and today most stops would be practice alone.

What it would add: a track view (where you are, what is next), the "next
skill" offered at the end of a skill's practice and at the end of an
investigation's finished view, and per-stop content in a fixed order —
investigation to build the idea, briefing to shape it for the exam, practice
to make it stick.

What the increments here owe it: D3's completion record (the track needs to
know an investigation was done, separately from mastery); and the finished
view's "Try some questions" is where "Next on your track →" would later sit,
so it should stay one card that can take another button.

## 4. Increments, in order

1. **Fix the door.** Per-investigation prompt wording (from each
   investigation's own lead, not a straight-lines sentence); an
   `investigation_prompt_shown` event; an `investigation_finish` event on the
   Finish button. Small; no behaviour change.
2. **The run-up.** D2: the top section folds to one line once section 1 is
   done. Ship, then read open → predict and section 1 → section 2 for a few
   weeks.
3. **Remember it.** D3: the completion row for signed-in students; stop
   offering a finished investigation; show it on the student dashboard.
4. **The lesson starter.** D4, scoped against a named teacher.
5. **Later: the progress track** (D7), once enough of a track has content.

Alongside all of these, **authoring continues** (D6), starting once the ratio
investigation's review is done.

## 5. How we will know

| question | read it from | worry if |
|---|---|---|
| Is the door working? | prompt shown → clicked (after increment 1) | under 5% |
| Is the run-up fixed? | opened → first prediction; section 1 → section 2 | under 50% after increment 2 — then try shortening section 1's own run-up |
| Do they finish? | started → `investigation_finish` | zero after a month of increment 2 |
| Does it transfer? | `investigation_transfer` correct rate vs the same skill's first-attempt rate | no difference after a few dozen completions — 31 §10's stop rule |
| Do teachers use it? | sessions started "with the investigation" | none after the named lesson |

The cohort is small; treat these as directional, and the transfer comparison as
the one that decides whether investigations are worth writing at all.

## Explicitly not in scope

Any investigation writing mastery; a browsable investigations catalogue;
server-rendering the pages for search (worth doing only if D6's traffic shows
search matters); gating them (D5); building the progress track now (D7 — it
waits on content).

## Pointers

- `31-tutorial-content-plan.md` §8–§10 — the original attachment and measurement plan
- `29-no-login-class-session-plan.md` — the class session D4 builds on
- `lib/skills/skillEntry.ts`, `app/practice/question/[id]/page.tsx:1210` — the wrong-answer prompt
- `lib/homeInvestigation.ts` — the homepage link and why it is straight lines
- memory: `project_retention_baseline` (the cohort), `project_trust_conversation` (why the class route), `project_investigation_targets` (the marks ranking)
