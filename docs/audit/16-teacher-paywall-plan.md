# Teacher paywall — scope, and the questions it can't answer yet

_Scoped 2026-09-03. NOT BUILT. Written after `99255e0` made class diagnostics
free and closed the £10 pass, which left the teacher side with no paid tier at
all — deliberately, until this is worked out._

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
