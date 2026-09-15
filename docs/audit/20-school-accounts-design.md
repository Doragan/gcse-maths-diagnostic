# School & teacher accounts — design and build order

_Written 2026-09-13, from `docs/audit/19-school-accounts-brief.md`. The brief's
measured figures are taken as given and not re-derived. This document answers
the brief's §5, revises its §7 build order, and specifies the schema._

**Status of each part.** §2–§5 are decisions this document takes. §6 tracks the
items needing the user's product or commercial judgment — **three of the four are
now answered**, and only teacher pricing remains genuinely open. §7–§8 are the
build order and the provisioning runbook. §9–§10 were added on 2026-09-15: the
free/paid teacher boundary, and whether a teacher may create student accounts.

---

## 1. A correction to the brief

The brief records one known defect: `/auth` initialises `isSignUp = false`, so
it renders the login form. That is true but understates it. **There is no link
anywhere on the site that opens a teacher signup form.**

Every teacher call to action points at a bare `/auth`:

| Surface | Link text | Target |
|---|---|---|
| `/for-teachers` nav | "Teacher login" | `/auth` |
| `/for-teachers` hero | login CTA | `/auth` |
| `/for-teachers` footer | "Teacher login" | `/auth` |
| `/demo` tour end | **"Create a teacher account"** | `/auth` |
| `/student` footer | "Teacher login" | `/auth` |
| `/mark` | CTA | `/auth` |

The last two rows are the damaging ones. A CTA that says *create a teacher
account* lands on a login form, and the only way forward is a small text toggle
at the very bottom of the card, below the submit button and below
"Forgot your password?". `teacher_signup_start` fires on that toggle — which is
why the brief's funnel shows 22 teacher events, 3 signup starts and 0
completions. **Three people found the toggle.** That is a missing entry point,
not a conversion problem, and it is the same defect PR #70 fixed for students,
where the measured cost was 10 of 10 email signups lost.

This does not change the brief's conclusion that the teacher problem is
distribution. It does mean the fix is a prerequisite for anything measured
later: until the entry point exists, the teacher funnel cannot be read at all.

---

## 2. The entitlement model, end to end

The union in `lib/entitlements.ts` is kept exactly as written. The only change
is that the second arm stops being a parameter nothing sets.

```
student premium  =  personal grant  OR  class grant

personal grant : students.subscription_tier = 'paid'
                 AND students.paid_until > now          (Stripe-paced)

class grant    : an ACTIVE class_memberships row
                 -> classes.school_id
                 -> schools.granted_until > now         (invoice-paced)
```

Three properties this shape buys, all of which are load-bearing:

- **The school never owns the student.** The grant is read *through* a
  membership the student created themselves. Revoking consent by leaving the
  class removes the grant and touches nothing the student owns.
- **The promo is not a special case.** A promo teacher account is a `schools` row
  with `granted_until = '2027-08-31'` and that teacher's classes attached to it.
  No promo code, no second mechanism, and no promo *tier* either: it is a paid
  school account whose grant happens to cost £0 (§9). See §4 for how many rows.
- **One writer per arm.** Stripe writes the personal arm; a human writes the
  school arm. Neither can corrupt the other, which is why a school grant and a
  personal subscription can coexist without reconciliation.

### `paid_remaining_seconds` is dropped, not built

The brief asks whether the "pause the personal grant and bank the remaining
time" mechanism is needed. **It is not, and it should not be built.** Three
reasons:

1. It only pays off if the personal clock is paused, and for the recurring
   monthly and annual plans the clock is Stripe's, not ours. A column cannot
   pause a subscription; only cancelling it can.
2. The exam pass expires on a fixed calendar date
   (`STUDENT_EXAM_PASS_UNTIL`), so there is no per-student remainder to bank.
3. It would add a write path to `students.paid_until` on every class join and
   leave. That path can fail halfway and destroy paid time, and `students`
   UPDATE is revoked from the client precisely so that nothing but the service
   role writes those columns.

The union already guarantees the property the banking was meant to protect: a
paid student who joins a covered class loses nothing, because the personal arm
keeps running untouched. The residual case — a student paying for something
their school now covers — is a refund conversation, not a mechanism. Handle it
the way the teacher refund is handled: by hand, on request.

**Action:** delete the banking paragraph from the `lib/entitlements.ts` header
comment when the class arm is wired, so the file stops describing a mechanism
that does not exist.

---

## 3. Schema

Two tables' worth of change. Deliberately small.

```sql
create table schools (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  seats         integer     not null check (seats >= 0),
  granted_until timestamptz,        -- null = no access. Invoice-paced, by hand.
  notes         text,               -- invoice ref, contact, promo provenance
  created_at    timestamptz not null default now()
);

alter table classes add column school_id uuid references schools(id) on delete set null;
create index classes_school on classes (school_id);
```

`on delete set null` rather than cascade: deleting a school must never delete a
teacher's classes or, through them, students' membership history.

**RLS on `schools`: enabled, with no policy at all.** Deny is the correct
default here. No client role ever reads a school row — not the student, not the
teacher. Seat counts and grant dates are commercial data. The grant is observed
only through the function below, and the admin view reads it under the service
role.

If a policy is ever added to `schools`, **name its command**. Never `FOR ALL`.
That is not a style preference: a `FOR ALL` policy with no `WITH CHECK` reuses
its `USING` clause to decide which new rows may be inserted, which is how the
`teachers` escalation described in §7 happened. Revoking the table-level INSERT
grant as well is the second half of the same habit.

```sql
create or replace function public.student_has_class_grant()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from class_memberships m
    join classes c on c.id = m.class_id
    join schools  s on s.id = c.school_id
    where m.student_id = auth.uid()
      and m.status = 'active'
      and s.granted_until is not null
      and s.granted_until > now()
  );
$$;

grant execute on function public.student_has_class_grant() to authenticated;
```

**It takes no argument on purpose.** A `_uid` parameter would let any logged-in
caller ask "does this uuid have a class grant", which is a cheap oracle over
student ids and over which schools have paid. Reading `auth.uid()` inside the
function makes the question unaskable about anyone else. Server routes do not
use the RPC at all — they hold the service role, which bypasses RLS, so they
run the same join directly through a shared TypeScript helper.

`search_path` is pinned, per the fix in PR #72.

**`teachers.school_id` is not added yet.** The grant path runs
school → class → membership → student and never passes through `teachers`. A
teacher's own membership of a school matters only for teacher-side entitlement,
which does not exist until pricing does (§6A). Adding the column early would
create a second, divergent answer to "which school is this class part of".

---

## 4. Answers to the brief's §5

### Seats

**What counts as a seat: a distinct student across the school's classes.** The
brief already rules out charging twice for a student in two classes, so this is
arithmetic, not a decision. Counted as distinct `student_id` over active
memberships of classes whose `school_id` is the school. A student who has left
every class stops counting.

**At the cap: allow the join, flag the overage.** A hard block fails in the
worst possible place — a fifteen-year-old typing a join code in a lesson while
the teacher watches. It converts a commercial disagreement into a student-facing
failure, and because access is invoice-paced there is no self-serve way for the
school to clear it; they would wait days. The overage is surfaced in the admin
view and settled at renewal. If a school ever parks itself well above its seats,
the escalation is to block *new class creation*, which lands on the adult who
signed the invoice rather than on a child.

**A school seat grants the full personal-equivalent premium.** Any subset means
a second entitlement axis threaded through every call site, which is exactly
what routing everything through `isPaidStudent` was built to prevent. A school
paying per student expects that student to have the product.

### The promo's shape — settled 2026-09-15

**Three separate schools, one row each, seats for one class.** The three
early-access classes are expected to be at three different schools, so the promo
is three `schools` rows of roughly 32 seats, not one shared row. Nothing about
the mechanism changes; it is the same row either way, which is what makes this a
recruitment question rather than a technical one.

**If a school wants more than one class, that is a negotiation at the time**, not
a policy set in advance. The likely shape is a second free class for that school
while the remaining promo places go elsewhere, so the three places still reach
three schools. Implementation is the same row: raise `seats`, attach the second
teacher's classes to it. The seat count then reports what is actually being given
away, which is the number the renewal conversation turns on.

The pull the other way was real and was rejected deliberately. Three teachers
inside one department is a stronger position for the school conversation the
promo exists to create, because the head of maths hears it from three colleagues
rather than one. But with zero teacher signups ever recorded, requiring a cluster
of three from one school sets a recruitment bar above one that has not yet been
cleared at all. Reach beats concentration while the constraint is distribution.

### School ↔ teacher

**A teacher joins a school because an admin attaches them. Not by email
domain.** Domain matching is wrong in all the ways the brief lists, and wrong in
one more: it would attach a teacher to a paying school's seats with no human
deciding, which is the one thing invoice-paced provisioning is meant to avoid.
In year one this is a SQL update run a handful of times. When it becomes tedious
the second step is a **school join code**, deliberately the same shape as the
4-character class code that already exists and works — not a new mechanism.

**Any teacher in a school may create classes; only an admin attaches teachers.**
Classes are uncapped by design, and the seat count already bounds the commercial
exposure, so there is nothing to protect by restricting class creation. Teacher
attachment is the act that spends money and stays with the human. No permission
surface is built now; the eventual column is `teachers.school_role`, reserved
and unused.

### Free teacher tier

**Linking to a student account grants the student nothing.** This is the
security property the whole design rests on: if linking conferred access, every
free teacher account could mint unlimited premium by creating a class. Premium
comes only from a school grant. Linking is a teacher-side view, consented by the
student, and that is all it is.

**What the free teacher loses is persistence, not the act.** They can mark a
paper and see the feedback sheet; what they do not get is history — trends
across sittings, class aggregates, the longitudinal view. That is the "free to
use, paid to keep" doctrine already set in
`docs/audit/16-teacher-paywall-plan.md`.

**A free teacher's marking DOES write the student's mastery. Settled
2026-09-15.** The paid line is drawn at the teacher's data, never at the child's.
A `paper_sittings` row is recorded whoever marked it, the student's mastery
updates from it, and the student sees their own progress — because it is their
work and their account. What the teacher buys is the longitudinal view over it.

This is a constraint on the teacher tier, not a detail of it: **no paywall may be
implemented by discarding a student's own record.** Anything that would withhold
a teacher feature by not writing student data is the wrong design and has to be
built as a read-side restriction instead.

### Refund mechanics

**These questions cannot be answered yet, and nothing depends on them.** A
refund needs a teacher who has paid; `99255e0` closed the £10 pass deliberately,
so no teacher can pay today and the current maximum exposure of the "full year
refunded" promotion is **£0**. Pricing is the user's call (§6A), and the refund
design follows it. Two parts can be settled in advance because they do not
depend on the number:

- **Trigger:** manual, by the user, when the school's invoice is issued.
  Evidence is the teacher confirming, not a domain match.
- **Auto-renew: cancel it at school signup, do not let it lapse.** Letting it
  lapse charges the teacher once more for something the school now pays for,
  which is the exact opposite of keeping whole the person who did the internal
  selling.

### Provisioning

**A documented SQL runbook (§8), no UI.** As the brief says. The one thing built
is a read-only school row in the existing `app/admin` usage view, and only once
a real school exists.

### Lifecycle

**On expiry the student reverts to free and keeps everything.** History, attempt
records, mastery and marked work are the student's, in an account the student
owns; a school's invoice lapsing is not a reason to touch them. Only the
entitlement flips. Class memberships survive too — the consent the student gave
did not expire, so the teacher's view and the student's history both persist and
the grant resumes if the school renews.

**A departing teacher currently takes the school's classes with them.** Found in
the constraints introspection on 2026-09-14, and it is the most consequential
thing that pass turned up. Every link in this chain is `ON DELETE CASCADE`:

```
auth.users -> teachers -> classes     -> class_memberships
                       -> assignments -> assignment_targets
                                      -> assignment_attempts
```

So deleting one teacher's account destroys their classes, every membership row
in them, every assignment, and **every student's attempts at those assignments**.
The last of those is student-owned work deleted by someone else's action, which
contradicts the principle the rest of this design rests on. Core mastery history
survives, because `practice_attempts` hangs off the student rather than the
teacher, but assignment work does not.

For an individual teacher that is merely untidy. For a school it is a real
operational hazard: staff turnover is normal, and a school buying seats cannot
have a leaver's account deletion erase class records and pupil work.

**Recommended, as part of step 3:** once `classes.school_id` exists, make
`classes.teacher_id` nullable with `ON DELETE SET NULL`, and the same for
`assignments.teacher_id`. A class then survives its teacher and belongs to the
school, and reassignment is one `update`. The existing RLS needs no change to be
safe: `teacher_owns_class()` compares `teacher_id` to `auth.uid()`, and a null
never matches, so an unowned class is invisible until a human reassigns it.

Two details that come with it. A class with no teacher **and** no school is an
orphan nobody can see, which is harmless but should be swept periodically rather
than accumulating. And `app/api/classes/join` resolves a code to a class without
checking who owns it, so it would still admit students to an orphaned class and
grant them nothing. That check belongs in the same step.

**Leaving a class ends the class grant at once, with no tail.** The tempting
answer is a grace period, but the Children's Code argument actually runs the
other way: what it asks for is that the child understands what happens, not that
the consequence be softened. A tail would also be unfunded access outside the
seat count, and would make "what am I paying for" harder for the school to read.
What this does require is plain copy on the leave confirmation saying what
leaving means — and rejoining already works, because the join route is
idempotent and reactivates a left membership.

### Data protection

The architecture's implied position: **the school is not the controller of the
student's account.** The account exists before the school, outlives it, and is
created by the student on their own consent. What the school controls is the
class-scoped view the student consented to hand it — roster, mastery, assignment
and sitting results. That is a real distinction and it is the honest one, but a
school's data protection officer will ask for it in writing, and that answer
needs more than an inference from the schema (§6C).

One concrete fact supports it, confirmed by introspection on 2026-09-14:
**`public.students` has no email column.** A student's email address exists only
in `auth.users`, which no teacher-facing query reaches. Whatever the school is
told about controllership, it cannot obtain a child's email address through the
class-scoped view, because the application's own student table does not hold
one.

---

## 5. What the class grant changes in the code

Small, and confined to the seam that was built for it.

- `lib/entitlements.ts` — no signature change. `activeClassMembership` finally
  gets a caller. Delete the banking paragraph.
- A shared helper, `lib/classGrant.ts`: `fetchClassGrant(client, studentId)` for
  the service-role path, and a client-side RPC wrapper.
- Client call sites that currently pass no class flag: `app/practice/page.tsx`
  (two), `app/skill/[slug]/page.tsx`, `app/student/dashboard/page.tsx`.
- Server gates: `app/api/exam/quota/route.ts` is the one that actually enforces.
  It must read the grant, or a class-covered student is shown unlimited
  mini-exams by the client and refused by the server.
- `lib/adminUsage.ts` counts students with premium access through
  `isPaidStudent`; it needs the grant too or the count silently under-reports
  once a school exists.

The client-side checks control UI only; the server gate is the enforcement. Both
must move together, which is why they are one build step.

---

## 6. Flagged — the user's judgment is required

Work does not proceed past these on an assumption.

**A. Teacher pricing — narrowed 2026-09-15 to a number and a billing unit.** The
*shape* is no longer open: answering B fixed it. The proposed boundary is §9.
What still needs deciding is what it costs and what the unit is (per teacher, or
per department). It blocks the refund design and step 6, and nothing earlier —
the promo, the class grant and the school mechanism are student-seat-funded and
need no teacher price at all.

**B. ✅ ANSWERED 2026-09-15 — a free teacher's marking DOES write the student's
mastery.** The question was whether "a free teacher's feedback is not saved",
read literally, meant no `paper_sittings` row — which would have made a child
lose a signal derived from their own work because their teacher had not paid.

Answered as recommended: the sitting is written whoever marked it, the student's
mastery updates, and the paid tier buys the teacher the longitudinal view over
it. The line falls on the teacher's data, never the child's. Recorded in §4,
where it now stands as a constraint on the teacher tier rather than a preference:
no paywall may be implemented by discarding a student's own record.

**C. The school data protection position.** §4 states what the architecture
implies. Whether the user is comfortable asserting it to a school's data
protection officer, and what the agreement says, needs a decision and possibly
advice. It blocks the first invoice, not the build.

**D. ✅ ACCEPTED 2026-09-15 — the "full year refunded" exposure is fine.** The
arithmetic is teachers-in-one-school × annual price, unbounded by anything in the
design, and that is accepted deliberately. It is also self-limiting in the way
that matters: the refund only ever triggers when a school has just bought seats
for its students, which is worth more than the handful of teacher subscriptions
it refunds. Paying it is the good outcome.

No cap is being built. If a single school ever produces enough teacher
subscriptions for the number to sting, that is a problem worth having and can be
handled by hand at the time.

---

## 7. Build order

Revised from the brief's §7. The substantive change is that **its steps 3 and 4
merge**: wiring the class grant separately would mean inventing a class-level
grant column that adding `schools` would then have to reconcile. One source of
truth from the start is both less work and less risk.

| # | Step | Depends on | Size |
|---|---|---|---|
| 1a | **Teacher signup entry point.** `/auth` honours `?mode=signup`; the CTAs that promise an account point at it. | — | small |
| 1b | **Fix teacher signup itself.** `handle_new_user` and the provision route must supply `teachers.email`. Without this, 1a opens a form that cannot submit. | 2 | small |
| 2 | **Capture `students` and `teachers` in a migration.** No-op to apply; closes the same gap as PR #71, and is what surfaced 1b. | user-run introspection | small |
| 3 | **`schools` + `classes.school_id` + `student_has_class_grant()`,** plus surviving class ownership per §4: `classes.teacher_id` and `assignments.teacher_id` nullable with `ON DELETE SET NULL`, and the join route refusing an unowned class. SQL only, inert until step 4. | 2 | medium |
| 4 | **Wire the class grant through `isPaidStudent`** at every call site in §5, client and server together. | 3 | medium |
| 5 | **Seat counting + a read-only school row in `app/admin`.** Only once a real school exists. | 4 | small |
| 6 | **`teachers.school_id`, teacher entitlement, paid tier, refunds.** | §6A | blocked |

Steps 3 and 4 are separated only because step 3 is SQL the user applies by hand
and step 4 is a deploy. Applied in that order, step 3 is inert: no class has a
`school_id`, so the function returns false for everyone and nothing changes
until a school is provisioned.

**Not built, per the brief:** school self-signup, a provisioning UI, and any
further teacher feature before one real class has used the existing ones for a
term.

### What the first introspection pass returned (2026-09-14)

The column-privileges query has been run. It settles three things and turned up
one defect.

**Confirmed column inventory.** `students` holds `id`, `display_name`,
`year_group`, `confirmed_13`, `created_at`, `subscription_tier`, `paid_until`,
`stripe_customer_id`, `stripe_subscription_id`, `mini_exam_period`,
`mini_exams_used`. `teachers` holds `id`, `email`, `created_at`,
`free_assessments_used`, `is_admin`, `paid_until`.

- Neither table has a `school_id`, as §3 assumed.
- `teachers.paid_until` already exists, so step 6 needs no new column for
  teacher entitlement, only a price and a writer.
- **`students` has no email column at all.** Student email addresses live only
  in `auth.users`. This is worth stating to a school's data protection officer:
  the school's teachers cannot read a student's email through the application's
  tables, because the application does not hold one. It strengthens the position
  in §4 rather than merely being consistent with it.

**The 2026-06-11 lockdown held.** No UPDATE and no DELETE remains for `anon` or
`authenticated` on either table.

**One defect, and it was a live privilege escalation.** Both client roles still
held INSERT on every column of both tables. `20260611_lock_sensitive_columns.sql`
revoked UPDATE and only UPDATE, while a comment in
`app/api/auth/provision/route.ts` asserted that INSERT had been revoked too.

The policies query settled whether that was reachable, and it was. The policy
`teachers: own row` is `FOR ALL` with a `USING` clause and no `WITH CHECK`, and
PostgreSQL uses the `USING` expression as the `WITH CHECK` when one is omitted,
so it governs which new rows may be **added**. ALL covers INSERT, and the
resulting check constrained the id column and nothing else. Any signed-in
student could therefore insert a `teachers` row carrying their own id with
`is_admin` set true, which grants write access to the whole question bank
including publishing, write access to the public question-images bucket, and the
admin analytics. `students` was never exposed: it has no INSERT policy, so RLS
denied client inserts whatever the grant said.

Closed at both layers in its own PR, not folded into the capture, per the PR #71
rule that a file recording what exists must not also change behaviour.

**The lesson generalises and is worth carrying into §3.** This design adds
policies to `schools` and later to school membership. A `FOR ALL` policy is the
wrong default every time: it silently grants INSERT and DELETE on the strength
of a clause written to answer "which rows can this caller see". §3 already
specifies `schools` with RLS enabled and **no policy at all**, which is the
right shape, and any policy added later should name its command explicitly.

**Constraints and indexes came back on 2026-09-14.** Both tables are minimal:

| | `students` | `teachers` |
|---|---|---|
| Primary key | `id` | `id` |
| Foreign key | `id` to `auth.users(id)`, cascade | `id` to `auth.users(id)`, cascade |
| Check | `subscription_tier in ('free','paid')` | none |
| Indexes | the primary key only | the primary key only |

Three things follow.

- The cascade from `auth.users` is the head of the chain described in §4, where
  deleting a teacher account destroys their classes and their students'
  assignment work. That is the finding this pass was worth having for.
- `subscription_tier` is constrained to the two values `isPaidStudent` expects,
  so the personal arm of the union cannot be fed a third value.
- No index exists on `stripe_subscription_id`, which the Stripe webhook looks
  rows up by, and no unique constraint either. At the current number of students
  the scan costs nothing, and this is noted rather than proposed: the unique
  constraint is the part worth adding eventually, since the webhook updates
  every matching row.

### 🔴 The columns query found that teacher signup was broken

The last query returned on 2026-09-14, the capture was written, and it exposed
the thing this whole section was worth doing for.

`teachers.email` is `not null` with no default. `handle_new_user` inserts only
the id, and so does `/api/auth/provision` for Google. That is a 23502 not-null
violation, raised inside an `AFTER INSERT` trigger on `auth.users`, which aborts
the entire signup. Trigger introspection on `public.students` and
`public.teachers` then returned **zero rows**, so nothing populated the column
and nothing rescued it.

The evidence fits exactly. Two teacher accounts exist, created 31 March and
4 April, and none since. Three signup starts and no completions over 90 days.
Students were unaffected throughout, because `handle_new_student` supplies every
not-null column on `students` and the Google student path does too. The
asymmetry between the two tables is precisely where the bug lived.

**This revises §1 of this document.** The missing entry point was real and worth
fixing, but the form behind it could not have succeeded. The teacher funnel read
zero for two independent reasons, and step 1 is not complete until both are
fixed and one throwaway signup has been made by hand. Fixed by supplying the
column on both paths.

It also revises what the brief said about this area. The teacher problem is
still distribution, but "nobody arrives" was not the whole story: nobody could
have completed a signup even if they had.

**One methodological note worth keeping.** Three separate gaps in this area
turned out to be the same gap: objects that exist only in the database. The
triggers, caught by PR #71. The tables, caught here. And the policy that carried
the escalation, which was in version control but had never been re-read. The
capture is not bookkeeping; every pass over it has found a live defect.

### Step 2 needs introspection first

`students` and `teachers` exist only in the database. Capturing them honestly
means copying what is actually there, the way PR #71 copied
`pg_get_functiondef()` output verbatim. Run these in the SQL Editor and paste
the output back; they return schema only, no rows:

```sql
-- columns, types, nullability, defaults
select table_name, ordinal_position, column_name, data_type,
       is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('students','teachers')
order by table_name, ordinal_position;

-- constraints and indexes
select conrelid::regclass as tbl, conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid in ('students'::regclass,'teachers'::regclass);

select tablename, indexdef from pg_indexes
where schemaname = 'public' and tablename in ('students','teachers');

-- RLS policies, and the grants that decide whether they are even reached
select tablename, policyname, cmd, qual, with_check
from pg_policies where schemaname = 'public'
  and tablename in ('students','teachers');

select table_name, grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name in ('students','teachers')
  and grantee in ('anon','authenticated');
```

The last query matters most. `20260611_lock_sensitive_columns.sql` revoked
table-level UPDATE on both tables; the capture must record the grant state as it
actually is, or re-applying the file would quietly hand those privileges back.

---

## 8. Provisioning runbook

Run in the Supabase SQL Editor. This is the whole mechanism for the early-access
promo and for a paying school; they differ only in `seats` and `notes`.

**Edit the two quoted literals, then run it. Copy no ids.** An earlier version of
this runbook had you paste a returned uuid into the next statement, and a
separate probe keyed on a school name containing an em dash. Both failed, and
neither failure was in the mechanism: one pasted `<SCHOOL_UUID>` literally, the
other silently set `school_id` to NULL and reported a perfectly correct `false`.
A runbook that only works after a manual edit will eventually be run without it.

```sql
-- Create the school AND attach the teacher's classes, in ONE statement. The
-- INSERT feeds its new id straight into the UPDATE through a data-modifying CTE,
-- so no id is ever copied by hand.
--
-- The teacher is found by email, which is the only human-readable handle on the
-- teachers table. A wrong address matches nothing, the UPDATE touches no rows,
-- and you get an empty result rather than a wrong one.
with s as (
  insert into schools (name, seats, granted_until, notes)
  values (
    'Example High School',            -- ← edit
    32,                               -- one class, with headroom
    '2027-08-31',                     -- settled: end of the next academic year
    'early access promo, 1 class, free'
  )
  returning id
)
update classes
   set school_id = (select id from s)
 where teacher_id = (select id from teachers where email = 'teacher@school.ac.uk')  -- ← edit
returning id as class_id, teacher_id, school_id;
```

```sql
-- What was granted, and to how many students. Distinct students, so somebody in
-- two of the school's classes counts once.
select s.name, s.seats, s.granted_until,
       count(distinct m.student_id) filter (where m.status = 'active') as seats_used
from schools s
left join classes c on c.school_id = s.id
left join class_memberships m on m.class_id = c.id
group by s.id, s.name, s.seats, s.granted_until;
```

Renewal sets `granted_until` to a later date; withdrawal sets it to `now()`.
**Never delete a school to end access** — deleting sets `classes.school_id` back
to NULL, losing the record of what was granted to whom, and an expired grant can
be renewed where a deleted one cannot.

**Verify the grant as a client, not as the SQL Editor.** The editor runs as
superuser and bypasses both RLS and grants, so it will report success no matter
what the policies say. The same trap is documented at the foot of
`20260727_class_membership_scope.sql`. Impersonate instead:

```sql
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<a student uuid>"}';
  -- One SELECT: the editor shows only the last result set, so a block ending in
  -- several of them hides exactly the intermediate check you wanted.
  select coalesce(auth.uid()::text, 'NULL - impersonation not taking') as uid,
         public.student_has_class_grant()                              as has_grant;
rollback;
```

The impersonation does work in the Supabase editor — verified 2026-09-15, uid
resolved and the function returned true — so a NULL `uid` here means the claim
was not set, not that the pattern is unsupported.

### Verified end to end, 2026-09-15

The mechanism was run against the live database with a real class and a real
student, and every layer agreed:

| Check | Result |
|---|---|
| School created, class attached | one row, `school_id` populated |
| Seat count | 1 |
| Grant present in the data (superuser join) | true |
| `student_has_class_grant()` as the student | true, with `auth.uid()` resolving |

What that does **not** cover is the browser path — `getStudentProfile()` reading
the RPC and `isPaidStudent` acting on it. Only signing in as a covered student
and seeing premium unlocked proves that, and it is the half real students
actually run.

---

## 9. The free/paid teacher boundary

Written 2026-09-15, once §6B was answered. **The price is still open (§6A); this
is the shape it prices.**

### The principle, which follows from §6B rather than being chosen

Paid gates the teacher's view **over time** and **across students**. It never
gates a student's own record, and it never gates the act of teaching.

That single rule decides almost every case, which is the test of whether it is
the right rule. Free is everything about **now**; paid is everything about
**then**.

### Where the line falls

| | Free | Paid |
|---|---|---|
| Mark a paper, any number of papers | yes | yes |
| Feedback sheets for that sitting | yes | yes |
| The sitting is recorded | yes | yes |
| Student's mastery updates from it | **always** | **always** |
| Student sees their own progress | **always** | **always** |
| Classes | one | unlimited |
| Live class skill map — where they are now | yes | yes |
| Set assignments | yes | yes |
| The most recent sitting's results | yes | yes |
| History across sittings, trends over time | no | yes |
| Compare paper to paper, term to term | no | yes |
| Exam-readiness tracking | no | yes |
| Export | no | yes |

The "always" rows are the constraint from §6B and are not negotiable against
price. Everything else is a commercial choice.

**This supersedes the brief on one point.** The brief said the free tier means
"exam feedback is not saved". It is saved — it has to be, or the student loses
their own record. What free withholds is the teacher's *view across sittings*,
not the sitting.

### Why the class limit rather than a marking limit

A cap on marking would make the product worse at the exact moment a teacher is
evaluating it, and it gates the act of teaching, which the principle forbids. A
cap on *classes* gates none of that: everything works completely, for one class.

It also matches how adoption actually goes. A teacher trying this has one class;
a teacher who has adopted it has four or five. The limit therefore bites exactly
when the product has already proved itself, which is the only moment anyone is
willing to pay. And it takes nothing away retroactively: a free teacher's one
class keeps working forever.

### A school grant must carry the teacher tier

If a school buys seats for its students, its teachers must get the paid teacher
tier with it. Otherwise the school has paid and its teachers still cannot see a
trend, which is absurd to explain and worse to discover.

That needs `teachers.school_id`, deliberately deferred in §3 until there was a
reason for it. This is the reason. It lands in step 6 with the rest of the
teacher tier.

### The promo is a PAID school account, not a free one — settled 2026-09-15

A promo teacher is not on the free tier. They are a teacher whose school holds a
grant, and the rule above then gives them the paid tier. The grant costs £0; that
is the only difference between the promo and a school that pays an invoice.

**There is no promo tier, and there is nothing to build for one.** That is the
real value of this decision — it removes a concept rather than adding one:

- The free tier's design in this section never has to describe the promo. Free
  means an individual who found the product alone and has no school behind them.
- Step 6 needs one code path, not two: school grant in date → paid teacher tier.
  A promo flag would have been a second way to be paid, and second ways to be
  paid are where entitlement bugs live.
- The promo teacher sees **the product you are selling**, which is the point of a
  trial meant to convert a school. A promo that showed them the free tier would
  be demonstrating the wrong thing.

**It also puts the renewal conversation in the right place.** On 31 August 2027
the grant lapses and the teacher drops to the free tier: their classes and every
sitting remain, but the view across sittings stops. That is "free to use, paid to
keep" landing exactly where §6B says it must — on the teacher's aggregated view,
never on anyone's record, and with nothing deleted.

⚠ The students in those classes revert to free on the same day, and that surface
is child-facing. §4's lifecycle rules bind: history is kept, membership survives,
**no countdown and no loss-aversion prompt**. The teacher may be told their
renewal date plainly. A fifteen-year-old must not be shown a timer.

### One strategic observation, offered rather than decided

Teacher pricing is a **wedge, not a revenue line**. A department of 300 students
at any plausible per-seat price dwarfs five teacher subscriptions at any
plausible teacher price. The teacher tier exists to convert an individual who has
no budget and to give them a reason to argue internally, not to earn.

That argues for pricing it low, simply, and per teacher rather than per
department — a per-department price is a purchase decision, and a teacher who has
to make a purchase decision goes to ask their head of department, which is the
conversation the school tier is for anyway.

---

## 10. Teacher-provisioned student accounts

Asked 2026-09-15: is anything **fundamental** in the student-centric model
blocking a teacher from setting up accounts for their students in advance, using
school email addresses?

**No. Nothing in the schema or the entitlement model stands in the way.** The
grant path is school → class → membership → student, and a membership created by
a teacher reads identically to one created by a student. Bulk creation is a
service-role route and an afternoon's work.

What it costs is not technical, and it is worth being precise about, because
three of the four costs are recoverable and one is not.

### What pre-created accounts would actually break

1. **`confirmed_13` stops being evidence.** It is currently hardcoded true and
   means "the 13+ gate was passed", because the form will not submit without it.
   If a teacher creates the account, no child ever saw that gate, and the one
   piece of age assurance in the system becomes a column that says true because
   it always says true.

2. **The consent basis flips.** Today the student creates the account and joins
   by code, and *that act is the consent* that lets a teacher see their data. If
   the teacher creates both the account and the membership, no student act exists
   anywhere in the chain. This is the constraint in §6 — it is why the
   entitlement model is a union — and pre-creation removes its foundation.

3. **A school email is not the student's.** An account created on a school
   address dies with the school place. "Standalone and student-owned" is only
   true in practice if the account outlives the institution.

4. **Whoever sets the password can log in as the child.** A teacher holding the
   initial credential can enter a student's account, which undermines both the
   student's ownership and the integrity of self-reported mastery.

### The version that costs none of them: invite, don't impersonate

The teacher bulk-creates **invitations**, not accounts: an email address and a
class, nothing more. Each student receives a link. The first time they open it
they set their own password and pass the 13+ gate, and the account comes into
existence at that moment.

The teacher gets everything they actually wanted — a roster prepared in advance,
no join codes read out over a classroom, no student mistyping a code. The student
still performs the act that makes the account theirs. Every one of the four costs
above disappears:

- `confirmed_13` is evidence again, because the child passed the gate.
- The membership is still the student's own act — accepting is consenting.
- The account is theirs from the first moment and survives leaving the school.
  `/account` already lets them change the email address away from the school one.
- No teacher ever holds a student credential.

It is also barely more work than bulk-creating accounts: a `class_invitations`
table (email, class_id, token, status, expiry), one service-role route to create
them in bulk, and the existing signup flow taught to accept a token. The
invitation replaces the join code rather than adding a mechanism beside it.

### The one thing this does not solve

If a school wants pupils enrolled **without any pupil action at all**, no
invitation design helps, because the whole point is that the pupil acts. That is
a genuine fork, not a detail:

> Either the student owns the account and must therefore do something, or the
> school owns it and no student act is required. There is no third option, and
> the union model is built on the first.

School-directed enrolment is lawful — schools routinely deploy software under
public task rather than consent — but it is a different product with a different
data protection posture, and it would mean the school, not the student, is the
controller of the account. **That is exactly open item §6C**, and this question
collapses into it: answer C and this answers itself.

**Recommendation: build invitations, not pre-created accounts.** It gives the
teacher the convenience that makes bulk provisioning attractive, costs nothing
architecturally, and leaves the §6C decision genuinely open rather than quietly
taken by an implementation.

---

## 11. Pointers

- `docs/audit/19-school-accounts-brief.md` — the brief this answers
- `lib/entitlements.ts` — the union; the class arm is step 4
- `supabase/migrations/20260727_class_membership_scope.sql` — the column-grant
  pattern, and the superuser verification trap
- PR #70 (student signup mode) — the pattern for step 1
- PR #71 (trigger capture) — the pattern for step 2
- `docs/audit/16-teacher-paywall-plan.md` — "free to use, paid to keep". Its
  header still says "Read Parts 6–10 first" and the document has no Parts 6–10;
  fix when next editing that file.
