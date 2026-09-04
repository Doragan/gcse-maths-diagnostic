# Teacher paywall — scope, and the questions it can't answer yet

_Scoped 2026-09-03. NOT BUILT. Written after `99255e0` made class diagnostics
free and closed the £10 pass, which left the teacher side with no paid tier at
all — deliberately, until this is worked out._

_**Superseded in part.** Part 6 (2026-09-04) records the decided model — free to use, paid to keep. Read Parts 6–10 first; Parts 1–5 stand except where Part 6 corrects them._

## The decision in one line

**Everything shown in the teacher demo goes behind the paywall.** The free tier
is the class diagnostic, which is now unlimited.

And the change that reframes everything below: **payment may not go through
Stripe.** Schools pay by invoice and bank transfer, on their own timetable, for
reasons that have nothing to do with the product. That is not a payment-provider
swap — it changes who the customer is, how access is granted, and when.

## Part 1 — What the paid tier contains, and how much of it exists

Taken from `app/demo/dashboard/teacher/TeacherDemo.tsx`, which is what a teacher
is shown and therefore what they would be buying.

| Demo feature | Status today |
|---|---|
| Class list, per-class student table (mastery) | **Built** — `components/ClassAnalytics.tsx`, `/dashboard/classes/[id]` |
| Student detail: overall mastery, mastery over time, topic mastery | **Built** — `components/StudentDetailModal.tsx`, `ClassMasteryTrend.tsx` |
| "Needs support" flagging | **Partly** — `computeClassAnalytics` produces common gaps and per-student weak skills; there is no single flag or threshold |
| Homework: set, submitted/total, due dates | **Built** — `/dashboard/assignments`, `app/api/assignments/*` |
| Recent assessments with average scores | **Partly** — paper sittings exist (`paper_sittings`, `/dashboard/classes/[id]/papers`); the cross-class "recent assessments" roll-up does not |
| Marking tool | **Built** — reachable at `/demo/marking`; the real path is the papers page |
| Cross-class welcome overview + quick stats (classes / students / need support) | **Not built** — `/dashboard/classes` lists classes without aggregates |
| WWW / EBI written feedback per assessment | **NOT BUILT** — demo fixture only. No `www`/`ebi` anywhere in the real code |
| "To Do" list | **NOT BUILT** — demo fixture only |

**Two of the things being sold do not exist.** WWW/EBI feedback in particular
reads, in the demo, as the product writing a teacher's feedback for them — the
single most labour-saving thing on the screen, and the most likely reason a
department would pay. Selling the demo means either building it or removing it
from the demo before anyone is charged against it.

## Part 2 — The payment model changes the architecture

Stripe self-serve and school invoicing are not interchangeable. Each row below
is a real fork, not a detail.

| | Stripe self-serve | School invoice / bank transfer |
|---|---|---|
| Who is the customer | a teacher | a school or department |
| Who holds entitlement | `teachers.paid_until` | needs an organisation the teachers belong to |
| How access starts | webhook, seconds after payment | someone grants it by hand, possibly weeks after the decision |
| When it starts | on payment | often **before** payment — a school expects access on a PO, and pays in 30–60 days |
| Renewal | automatic or a fixed date | academic year, renegotiated |
| Failure mode | card declined | invoice unpaid for two months while a class keeps using it |

The consequences worth stating plainly:

1. **Entitlement probably cannot live on `teachers`.** If a department buys it,
   several teachers share one licence, and staff arrive and leave mid-term. That
   implies an organisation table and a membership link — the same shape as
   `classes` / `class_memberships`, and a migration.
2. **A manual grant path is required whatever else is decided.** Someone has to
   turn access on for a school that has sent a PO. Today the only way is editing
   `teachers.paid_until` by hand in the SQL editor, which is fine for one school
   and not for ten.
3. **"Paid" stops being binary.** Trialling, PO-received-not-yet-paid, paid, and
   lapsed-but-mid-term are different states with different behaviour, and a
   `paid_until` timestamp cannot express them.
4. **Stripe may still be wanted for individual teachers** buying for their own
   classes. If so, both routes have to grant the same entitlement, which is an
   argument for entitlement being its own concept rather than a Stripe artefact.

## Part 3 — Enforcement: the part with a technical answer

Independent of the commercial questions, three things are true.

**The client can call the analytics RPC directly.** `get_class_skill_mastery` is
`GRANT EXECUTE ... TO authenticated` (`20260615_class_mastery_rpc.sql`) and is
called from the browser at `lib/teacherAnalytics.ts:335`. Its gate is
`teacher_owns_class`, not payment. **Any** paywall over class analytics therefore
needs a migration — either a paid check inside the function, or revoking client
execute and proxying through an API route that checks. A UI-only paywall would
be bypassable from the console.

**There is no `isPaidTeacher`.** Every teacher payment check today is written
inline as `paid_until != null && new Date(paid_until) > new Date()`. That is the
exact pattern that produced a wrong "Paying" figure on the student side, fixed by
routing everything through `isPaidStudent`. Before that inline check is copied
into ten route handlers, it should exist once — and it is the natural home for
the non-binary states in Part 2.

**Gates belong on the API routes, not the pages.** `/dashboard/*` pages redirect
on `requireTeacher()`, which is a role check. The routes that would need a
payment gate: `classes/create`, `classes/[id]/members`, `classes/[id]/rotate-code`,
`assignments/create`, `assignments/[id]/results`, `papers/sittings`, and the
analytics RPC. Diagnostics (`assessments/create`, `assessment/lookup`) stay open.

## Part 4 — Open questions

Ordered by how much they block. None of these is answerable from the code.

1. **What can a school see before it pays?** Procurement does not buy unseen. A
   time-limited trial fits invoicing better than a feature-limited one, because
   the thing being evaluated is the full dashboard with their own students in it.
   It also needs a trial-start timestamp and expiry handling, which is more to
   build than a feature gate.
2. **Is the unit a teacher, a department, or a school?** Determines whether an
   organisation table is needed, and it is much cheaper to decide before the
   entitlement model is written than after.
3. **What happens when an invoice is late?** A hard cut-off mid-term takes a
   class's data away over an accounts-payable delay. A grace period needs a state
   the schema does not currently have.
4. **Do the two unbuilt demo features ship first, or come out of the demo?**
   Selling a screenshot of something that does not exist is the one option not
   available.
5. **Does a student keep anything if their school stops paying?** The recorded
   principle is that data belongs to whoever owns an account and students always
   keep their own results — which the current architecture already honours, since
   student practice is theirs. Worth confirming it survives this change.
6. **Is Stripe retained for individual teachers alongside school invoicing?**

## Part 5 — Prior art: this is half of a design already sketched

The roadmap already contains a freemium refactor, recorded as under
consideration:

> Move the paywall off the *act of assessing* and onto **persistence +
> aggregation**: unlimited free assessments, but data is stored only if the
> teacher pays… otherwise it's download/export there-and-then. *Data belongs to
> whoever owns an account; students always keep their own results; the teacher
> pays for the stored, longitudinal, aggregated class view.*

Making diagnostics free (`99255e0`) is the first half of exactly that, and it
explicitly named the `FREE_LIMIT` gate it would replace.

The framing is worth keeping because it draws the line somewhere a teacher can
understand — **the product is free to use, paid to keep** — rather than as a list
of locked features. It also survives the payment-model change: "your data stops
accumulating" is a far kinder lapse behaviour than "your dashboard went dark",
which matters when the lapse is an unpaid invoice rather than a choice.

Its one dependency is not built: **CSV/PDF export at completion**. Without it the
free tier is "see it once, lose it", which is worse for a teacher than what they
have today, and would make the free tier actively bad rather than merely limited.

## What was deliberately not done

No gating has been built. The £10 pass stays closed rather than being reopened
against the old fixed end date (31 Dec 2026), which decayed as the season ran
down — a teacher buying in November would have paid £10 for six weeks. The closed
checkout is the honest state until there is a decided thing to sell.

---

# Part 6 — The model, decided (2026-09-04)

**Free to use, paid to keep.** A teacher can mark a paper and generate feedback
sheets without paying. What they cannot do for free is *keep* it — no stored
sitting, no history, no analysis over time.

This is Part 5's freemium framing applied to the marking tool specifically,
rather than to diagnostics. It survives the invoice problem for the reason Part 5
gave: the lapse behaviour is "your data stops accumulating", not "your dashboard
went dark", which is the difference between an annoyance and a crisis when the
cause is an unpaid invoice rather than a decision.

Four smaller decisions taken at the same time:

- Marks arrive by **upload or direct entry**, where upload means **a CSV of
  marks** (Part 9); reading a scanned or photographed marked paper is deferred.
- **Other exam boards are needed.** Today everything is AQA.
- **WWW/EBI is one feedback format, not the format.** Others should be possible.
  Not required for first launch, but it constrains the design now (Part 9).
- **Partial papers**: a teacher often sets part of a paper. Setup gets a "full
  paper" checkbox, ticked by default, which can be unticked to select questions.

## Corrections to Parts 1–5

Three cost assumptions above are wrong, all in the same direction — the work is
cheaper than the earlier scoping thought.

1. **Export is built.** Part 5 says the freemium option's "one dependency is not
   built: CSV/PDF export". It is: `lib/results/generatePDF.ts` (jsPDF +
   jspdf-autotable, over `buildTopicGrid`), wired up by
   `components/results/DownloadButtons.tsx` for diagnostic results. It needs
   pointing at paper data, not writing.

2. **A feedback sheet is assembly, not generation.** Part 1 calls WWW/EBI "the
   product writing a teacher's feedback for them", implying prose generation.
   `PaperConfig` already carries, per question: `marks`, `topic`, a human `skill`
   label, a `desc`, and real `skillIds` — plus a **`retrySet`** (a same-skill
   retry question for every non-visual item) and **`challengeQuestions`** per
   topic. "Dropped marks to named skills to questions to practise to PDF" joins
   data that exists to a generator that exists.

3. **The catalogue, not the paywall, is why `paper_sittings` has 0 rows.** The
   paper picker exists (`app/dashboard/classes/[id]/papers/page.tsx:251`). There
   is just almost nothing to pick: the registry holds **three papers, all AQA
   Foundation, November 2024**. A department marking a mock in autumn 2026 needs
   Higher, or a recent series, or another board. This is a sufficient explanation
   for nobody ever having marked a paper, and it does not require the "typing 30
   students' marks is an evening's work" hypothesis to be true.

# Part 7 — What "paid to keep" does to the architecture

**The free tier is a new, simpler path — not a degraded version of the existing
one.** Today the only way to mark a paper is `POST /api/papers/sittings`, which
is write-first by design: it creates a `paper_sittings` row *and* derives
`practice_attempts` to feed the mastery engine. There is no way to mark a paper
and keep nothing.

So the split is:

| | Free (ephemeral) | Paid (kept) |
|---|---|---|
| Marks in | typed or uploaded | same |
| Sheets out | yes | yes |
| `paper_sittings` row | **none** | written |
| `practice_attempts` | **none** | derived, feeds mastery |
| Needs a class | **no** | yes — attempts are per `student_id` |
| Needs student accounts | **no** — names only | yes |
| Needs a teacher account | **no** (see below) | yes |

Four consequences worth taking seriously:

1. **The feedback generator must not depend on having persisted anything.** It
   takes `(paper, selected items, marks per student)` and returns sheets — a pure
   function, testable without auth or a database. That is the same instinct that
   already put the marking rules in `lib/papers/sittingMarks.ts` ("so they can be
   tested without standing up auth and a live class"). Build it there, and both
   paths call it.

2. **The paywall lands on one write, not seven reads.** Part 3 lists ~7 routes
   plus a migration to `get_class_skill_mastery`. For *this* product the gate is
   `POST /api/papers/sittings` — which already authenticates and proves class
   ownership, so it is one paid check on one route. The RPC problem is real but
   belongs to the **dashboard**, which is downstream of this and not day one.

3. **Sign-up answers itself.** The chain is: free = ephemeral = no class = no
   student accounts = nothing an account could hold. So requiring sign-up to mark
   is pure friction with nothing to show for it. But "keep this" *is* an account —
   that is literally what keeping means here. **Recommendation: no sign-up to
   mark and download; the account is what the "keep these" button asks for.**
   That puts the ask at the moment the teacher is holding thirty finished sheets,
   which is the strongest position it will ever be in, and it is honest rather
   than a toll gate. It also serves the stated reason for wanting sign-up — a
   teacher who has saved something has a reason to come back; one who was forced
   to register before seeing anything does not.

4. **An ephemeral path with no accounts needs abuse thinking that the current
   route gets for free.** `POST /api/papers/sittings` is protected by bearer auth
   and class ownership. An unauthenticated "mark a paper, get PDFs" endpoint has
   neither. Not a blocker — it is compute-only with no data to leak — but it wants
   a rate limit before it is public.

# Part 8 — Two paid tiers, and the one that already exists in code

The instinct in Part 6 is right that an individual teacher should not get the
school model. The clean split falls out of "paid to keep":

| | Individual teacher (card) | School / department (invoice) |
|---|---|---|
| Keep sittings, history, trends | yes — their own classes | yes — all staff |
| Class analytics dashboard | yes | yes |
| **Students get premium accounts** | **no** | **yes**, for class members |
| Billing | Stripe, self-serve | PO and bank transfer, manual grant |
| Unit | one teacher | an organisation |

This answers Part 4's question 6 (keep Stripe?) with **yes, for the individual
tier only** — and it gives the land-and-expand path: a teacher pays for their own
persistence, it works, the school buys the version where the students get
accounts too.

**The student half of the school tier is already designed.**
`lib/entitlements.ts` defines access as a union of a personal grant and a *class*
grant: `activeClassMembership` is documented as "True when the student currently
belongs to a class that grants premium. Undefined/false until classes exist
(Phase 2)", with paused personal grants and banked time
(`paid_remaining_seconds`) so an already-paying student loses nothing by joining
a class. It is covered by tests and **passed by no real call site**. The school
tier described here is exactly the thing that hook was left for.

The individual tier needs no organisation table — `teachers` is the unit. The
school tier does. Deciding the individual tier ships first therefore defers the
migration in Part 2 without painting over it.

# Part 9 — The four smaller decisions, and what each costs

## Upload means a CSV of marks — DECIDED

"Upload" had two readings an order of magnitude apart, and the decision is the
cheaper one: **a CSV of marks**, a spreadsheet of students by question marks,
uploaded instead of typed. It is half-anticipated already — `PaperQuestion.desc`
is documented as appearing "in the CSV template", so the idea has a foothold.

The rejected reading, recorded so it is not re-litigated: **a photographed or
scanned marked paper**, read with vision. Per-board layout variance, and a wrong
read is worse than no read because it silently corrupts a student's sheet. Not
ruled out forever, but separately scoped and not part of this.

Why this matters more than its size suggests: the free tier's whole appeal rests
on how marks get in. If the only way in is typing thirty students into a grid,
then `paper_sittings` having 0 rows may never have been a catalogue problem at
all, and CSV import is the fix for the actual cause rather than a convenience.

## Exam boards: AQA Higher is nearly free, other boards are not

All **30** papers in `data/exam-audit/` are AQA — 15 Foundation, 15 Higher — and
each row already carries `q`, `part`, `marks`, `skill_ids` and `kind`, which is
most of a `PaperQuestion`. So:

- **AQA Higher**: 15 papers coded, 0 in the registry. Largely a derivation.
- **Recent AQA Foundation series**: same.
- **Edexcel / OCR**: no data at all. Coding a paper from scratch, per paper.
  Worth confirming which board the target schools actually sit before paying that
  cost — it is the item most likely to decide whether a given school can use this
  at all.

Per paper the derivation gap is: topic grouping, the human-facing `skill` and
`desc` labels, the `visual` flag, and the hand-written `retrySet` — that last one
being the part that makes the feedback sheet good rather than merely correct.

## Partial papers: one concrete bug, one real ambiguity

`deriveAttempts` already handles partial marking correctly — it iterates the marks
actually supplied, so unset questions simply produce no attempt rows, and every
row is positive-only so nothing is penalised for not being set.

Two things do not:

- **`marksTotal(paper)` sums every question on the paper**
  (`lib/papers/sittingMarks.ts:61`). With eight questions set out of thirty, a
  student scoring 34 of an available 42 would read as 34/80. The denominator has
  to come from the selection, not the paper.
- **"Not set" and "scored zero" must be distinguishable.** If selection is
  inferred from which item ids carry marks, a teacher who leaves blanks meaning
  zero silently shrinks the paper. **Store the selected item ids explicitly on the
  sitting** rather than inferring them from key presence.

And for the sheet itself: a skill that was never assessed must not read as a skill
with no problem. Sheets need to state coverage, and to separate "dropped marks
here" from "not assessed".

## What the free sheet may CLAIM, which is narrower than what it may show

A late correction to the evidence layer, and the sharpest thing to come out of
building it: **one paper is one observation, so the free sheet cannot honestly
call a skill secure.** "Secure", "mastered", "still shaky" are judgements about
a student over time — the mastery engine wants repeated correct attempts before
it will say a skill is held — and a single sitting cannot support them however
well it went.

So the evidence layer reports `fullMarks` (full marks on every item assessing
that skill, on this paper) and claims nothing more. The first draft called it
`secure`, which borrowed the engine's vocabulary for a single sitting and
overclaimed in precisely the place it matters least defensibly: the free path,
which has no history by construction.

**This is the tier difference, stated as a sentence each tier can actually say:**

| | The honest sentence |
|---|---|
| Free, one paper, nothing kept | "Full marks on every equations question on this paper." |
| Paid, with history | "Equations is secure." |

Which is a far better paid tier than a gated feature. The paid sheet says
something the free sheet **cannot truthfully say**, rather than something it has
merely been forbidden from saying — and it means adoption, not enforcement, is
what unlocks it. It also gives the "paid to keep" line a second meaning: what
accumulates is not just data but the right to draw a conclusion from it.

A note for whoever builds the first formatter: `fullMarks` is NOT the WWW/EBI
split. A student on 6 of 7 for equations belongs in what-went-well and the flag
excludes them. Split praise on the marks (`earned`/`available`, or a topic's
`ratio`) and reserve the flag for sentences that really are "dropped nothing".

## Feedback formats: separate evidence from presentation now

WWW/EBI being one format of several costs nothing to allow today and is expensive
to retrofit. Split the generator in two:

- **Evidence** (per student, format-agnostic): marks by item, skills with dropped
  marks, skills fully secure, what was covered, suggested retry questions from
  `retrySet`, challenge questions for strong topics.
- **Presentation**: a formatter over that evidence. WWW/EBI is the first one; the
  demo's fixture strings become its output rather than its specification.

This also settles Part 4's question 4 honestly. WWW/EBI stops being a not-built
demo feature and becomes the first formatter — but **the To Do list is still
fixture-only and unclaimed by this plan**, and should come out of the demo unless
something intends to build it.

# Part 10 — Still open after this

1. ~~What does "upload" mean?~~ **Decided: a CSV of marks** (Part 9). Scanning a
   marked paper is deferred, not adopted.
2. **Does the individual teacher tier ship before the school tier?** Recommended
   yes — it needs no organisation table, and it is the cheaper half of the same
   entitlement model.
3. **What does an individual teacher pay, and per what?** Per month, per year, per
   paper marked? "Paid to keep" prices naturally per seat per year; a department
   invoice does too.
4. **Trial shape for schools** (old question 1) — still open, but less urgent:
   under this model the entire marking-and-sheets flow is already free to
   evaluate, with their own students, forever. What a trial adds is *keeping*.
5. **Late invoices** (old question 3) — the lapse behaviour is now "stops
   accumulating, existing data stays readable" unless decided otherwise. Cheaper
   and kinder than a cut-off; needs confirming.
6. **Rate limiting the unauthenticated marking endpoint** (Part 7, consequence 4).

Old questions 2 and 5 are answered: the unit is *both* (Part 8), and students keep
their own data because student practice was never teacher-owned.
