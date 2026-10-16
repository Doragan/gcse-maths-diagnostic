# Runbook — granting a free trial to a tutoring outfit (or a school)

_Written 2026-10-04. The SQL here is lifted from the comment block in
`supabase/migrations/20260915_schools_and_class_grant.sql`, which was proven end
to end against the live database on 2026-09-15. This file adds the sequence
around it, which is where it actually goes wrong._

**What a grant does.** `student premium = personal grant OR class grant`
(`lib/entitlements.ts`). A class grant is an active membership → `classes.school_id`
→ `schools.granted_until > now()`. So attaching a tutor's classes to a `schools`
row with a future date gives every student in them the full paid feature set,
and it costs nothing and builds nothing.

---

## The order matters

**They sign up → each tutor creates their class → you run the grant → students
join.**

The grant attaches *classes that exist at the moment you run it*. A tutor who
creates a class afterwards gets `school_id = null` and their students silently
get nothing — no error, no warning, just a student who doesn't see the premium
features. This is the single most likely way this goes wrong.

So: do not run it until every tutor has created every class, or be ready to run
the top-up in §4.

---

## 1. Check the tutors exist

Each tutor needs a teacher account and at least one class. Ask them to confirm,
or check:

```sql
select t.id, t.email, count(c.id) as classes
from teachers t
left join classes c on c.teacher_id = t.id
group by t.id, t.email
order by t.email;
```

`teachers.email` is populated — verified on all 5 live rows, 2026-10-04. (A note
in `20260914_capture_students_teachers.sql` flags it as an open contradiction
that nothing sets it; the account count has since risen from 2 to 5, so whatever
fills it works. Treat that note as resolved by evidence.)

If a tutor shows `0` classes, stop and get them to create one first.

---

## 2. Create the school and attach the classes, in one statement

Edit the two marked literals. **Copy no ids** — the INSERT feeds its own new id
into the UPDATE.

```sql
with s as (
  insert into schools (name, seats, granted_until, notes)
  values (
    'Example Tutoring',                       -- <- edit. Plain ASCII, no dashes.
    20,                                       -- seats: headroom, not a limit
    '2026-12-05',                             -- <- edit. Trial end date.
    'free trial, online tutoring, 8 weeks'
  )
  returning id
)
update classes
   set school_id = (select id from s)
 where teacher_id = (select id from teachers where email = 'tutor@example.com')  -- <- edit
returning id as class_id, teacher_id, school_id;
```

**Name it in plain ASCII with no em dash or fancy punctuation.** You will need to
match this name by hand in §4, and a name with an em dash in it already caused
one failed provisioning attempt.

**Seats are not enforced.** At the cap the join is still allowed and the overage
surfaces at renewal — blocking a student's join code mid-session to settle a
commercial point is the wrong failure. Set it with headroom and don't think about
it again during a trial.

**If the UPDATE returns 0 rows**, the email matched no teacher, or that teacher
has no classes. The school row was still created — don't re-run the whole
statement or you'll create a second one. Go to §4 instead.

### Several tutors

Same statement, with the one line widened. Still no copied ids:

```sql
 where teacher_id in (
   select id from teachers where email in ('a@example.com', 'b@example.com')
 )
```

---

## 3. Verify

```sql
select s.name, s.seats, s.granted_until,
       count(distinct m.student_id) filter (where m.status = 'active') as seats_used
from schools s
left join classes c on c.school_id = s.id
left join class_memberships m on m.class_id = c.id
group by s.id, s.name, s.seats, s.granted_until;
```

Right after setup `seats_used` reads 0 — nobody has joined yet. That is correct,
not a failure. Re-run it a few days in to see students arriving, and it doubles as
your trial engagement check.

To prove the grant actually reaches a student, use the rolled-back impersonation
probe in the migration comment (§"Verifying") rather than reasoning about it.

---

## 4. Attaching a class created later

The common case: a tutor adds a class mid-trial, or you ran §2 too early. This
one *does* have to find the school by name, which is why §2 said plain ASCII.

```sql
update classes
   set school_id = (select id from schools where name = 'Example Tutoring')  -- <- exact
 where teacher_id = (select id from teachers where email = 'tutor@example.com')  -- <- edit
   and school_id is null
returning id as class_id, teacher_id, school_id;
```

The `school_id is null` guard means re-running it is safe and it will never move a
class off a different school.

If this returns 0 rows, check the school name matches exactly — including case and
spacing — before suspecting anything else.

---

## 5. Ending, extending, withdrawing

**Ending needs no action.** `granted_until` lapses and the premium features stop
on their own. Nothing is deleted: accounts, skill maps, marked papers and sat
mini-exams all stay, and students continue on the free tier.

**Extending** is an update to a later date. **Withdrawing early** is the same
update with a past date:

```sql
update schools set granted_until = '2026-12-19' where name = 'Example Tutoring';
```

**Never delete a `schools` row** to end a grant. `classes.school_id` is
`ON DELETE SET NULL`, so a delete would detach the classes and lose the record of
what you granted and when.

---

## 6. Housekeeping, as of 2026-10-04

There is one `schools` row in the live database:

- `internal verification (not a real school)`, expired `2026-09-16`, created
  during the 2026-09-15 end-to-end proof.
- **One real class is still attached to it.** Harmless — the grant is expired, so
  it confers nothing — but it will look odd in the §3 verification output, and
  that class's `school_id` is not null, so the §4 top-up would skip it.

If that class belongs to a tutor you later onboard, clear it first:

```sql
update classes set school_id = null
 where school_id = (select id from schools where name = 'internal verification (not a real school)');
```

Then run §2 as normal.

---

## Why it is shaped this way

- **One statement, no copied ids.** The original version of this runbook told you
  to paste a returned uuid into the next statement. One run pasted the
  placeholder literally; another set `school_id` to NULL and then reported a
  perfectly correct `false`. A runbook that only works after a manual edit will
  eventually be run without it.
- **Teacher found by email**, the only human-readable handle on the table. A
  wrong address matches nothing and the UPDATE touches no rows — an empty result
  rather than a wrong one.
- **Grants are dates, never deletes.** Every state — trial, renewal, withdrawal,
  expiry — is one column on one row.
