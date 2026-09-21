# The school proposition, attacked

_Written 2026-09-17 against `docs/audit/20-school-accounts-design.md`,
`docs/audit/21-school-data-protection-position.md`, `docs/legal/dpa-schools.md`
and `docs/legal/dpia-student-data.md`. Every objection below was checked against
the code before it was kept; the ones that did not survive checking are in §4,
because a sceptic who raises them is wrong and the docs should say so._

_**One exception to that claim, and it is recorded rather than quietly removed.**
The `paper_sittings.marked_by` finding in §2.8 was checked against a code
**comment** rather than against the schema, and was wrong: the fix had shipped
five hours after the comment was written. It is struck through in §2.8 with the
reasoning, because how a false finding got into a document whose whole purpose is
checking claims is worth more than the finding was. Corrected 2026-09-18._

**Two readers, in turn.** A head of maths with a small budget (§1), then a school
data protection officer with the draft agreement in front of them (§2). §3 ranks
what survives by whether it actually stops a sale or a signature. No prices are
proposed; nothing here is legal advice.

**The short version.** The design in doc 20 is sound and most of the position in
doc 21 holds. What would stop a signature is not the independent-controller
argument itself but three things the authors did not check: a live processor
agreement at `mathsense.net/dpa` that says the opposite of the draft; a
teacher-facing function that shows a pupil's full mini-exam script, which every
document says cannot happen; and a sub-processor table with blank cells and an
unlisted Google sign-in. What would stop a sale is simpler: today the school's
money buys nothing the teacher can see.

---

## 1. The head of maths

### 1.1 What would stop me buying

**The seat buys nothing I can see.** Doc 20 §9 draws the teacher line at "history
across sittings, trends, export", and step 6 of the build order, the one that
implements it, is marked *blocked*. There is no class cap in the code (grep for
one: nothing), `teachers.paid_until` gates nothing on the dashboard, and the
upgrade page redirects with "there's nothing to upgrade". So on the day of the
pitch every teacher feature is free and unlimited, and the seat unlocks things on
the *pupil's* screen: unblurred weak spots, per-skill practice, unlimited
mini-exams. A head of department is being asked to pay for a change they will
never personally observe. Doc 20 knows the teacher tier is unbuilt; it does not
notice that this makes the school sale a sale of invisible goods.

The sale that *does* exist is not made anywhere. The teacher's exam-readiness view
(`lib/exam/classReadiness.ts`, "how would they score on a paper") is fed by
mini-exams, and a free pupil gets one a month (`app/api/exam/quota`). A class of
free pupils gives the teacher a readiness table with one data point per pupil per
month. The seat is what fills that table. That is a concrete, teacher-visible
reason to pay, and none of the three documents says it.

**There is no school.** A teacher account is a personal login on whatever email
the teacher typed. The school cannot see which of its staff have classes, cannot
move a class from one teacher to another, cannot switch a leaver off, cannot see
seats used. Every one of those is "email the vendor, who runs SQL" (doc 20 §8).
Doc 20 defends no self-serve provisioning, and that is right for the first three
schools, but a head of department reads it as: I am buying seats in a product
that has no concept of my department that I can touch.

**Getting 150 pupils in.** The only enrolment path is a 4-character code read out
in a lesson; invitations were built and reverted the next day (migration
`20260915_class_invitations.sql`). Pupils sign up on an email address of their
own, choose a display name that may be a nickname, and appear on the roster as
whatever they typed. There is no MIS link, no Wonde or Xporter, no Google
Classroom, no SSO, no CSV import, and no way to see who has *not* joined. A
department that has just deployed Sparx or Hegarty has been spoiled by roster
sync. This is the most likely reason a trial dies in week two, and doc 20 §10
treats it as a philosophical question about account ownership rather than a
purchasing objection.

**School Google accounts break the story.** Most secondary pupils have a school
Google or Microsoft identity and many schools forbid personal email in lessons.
The product offers Google sign-in (`lib/auth.ts`). A pupil who signs in with
their school Google account gets an account that dies when the school deletes
that identity in Year 11, which is precisely the "account outlives the school"
property doc 20 §10 says makes the model honest. The docs never mention this
path, and it is the one a school will actually use.

**Who am I buying from.** The counterparty is a sole trader. There are no terms
of supply for a school at all: no order form, no service level, no support
commitment, no statement of what happens to the data or the licence if the
business stops, no professional indemnity or public liability insurance, no
Cyber Essentials. The draft agreement is a data protection document and is the
*only* document. A school's supplier-onboarding form asks for most of the above
before a purchase order can be raised, and a head of department cannot answer it
from what exists. Doc 21 §6 lists Cyber Essentials as "worth considering"; for a
MAT it is usually a gate, not a preference.

**Evidence.** There is none to show. Two teacher accounts have ever existed and
no teacher has completed signup since April (doc 20 §7). No paper has ever been
marked through the product. Day-two return is under one pupil in five. The
teacher demo sells written WWW/EBI feedback that does not exist in the code
(doc 16, Part 1). A head of maths asks "who else uses this" and the honest answer
is nobody yet, which is survivable, but only if nothing on the demo overclaims.

**Coverage.** The published bank is 267 questions, 45 of them exam-kind, and 83
exam-tested skills have one or two questions each (doc 05). The free marking tool
loads a handful of AQA Foundation papers. The first question from an Edexcel
Higher department is "do you cover my paper", and the answer today is mostly no.

### 1.2 Where the free tier makes paying unnecessary, and where it makes the product look thin

*Unnecessary:* everything on the teacher side, today, without exception. A
department of five teachers each with one class runs the whole product free, and
even the one-class limit is a plan rather than a gate. Doc 20 §9 is right that
the cap should be on classes rather than marking, but the cap has to exist.

*Thin:* "history across sittings" is the paid feature, and no sitting has ever
been recorded. Export is paid and unbuilt. The paid tier's headline items are the
ones with least evidence they will ever be used, which is the wrong order for a
tier that is supposed to convert a trial.

### 1.3 Missing, and expected

- What overage means in money. Doc 20 §4 says allow the join and "settle at
  renewal". A school needs it in writing that it will never be invoiced
  retrospectively for pupils who joined over the seat count, or that it will and
  at what rate. Silence here reads as a surprise bill.
- Whether access starts on the purchase order or on payment. Doc 16 Part 2 raised
  it; doc 20 does not answer it.
- Pupils whose parents already pay. Doc 20 §2 makes that a refund conversation
  "by hand, on request", which is fine, but the school should be told before the
  first parent asks the teacher.
- Whose data the school's marked papers are. See §2.8: a pupil deleting their
  account, or a year of inactivity, removes the sittings the teacher marked. A
  head of department will assume their mock data is theirs. It is not.

---

## 2. The data protection officer

Ordered by what would stop the signature.

### 2.1 You have already published the opposite position

> **✅ CLOSED 2026-09-17, the day this was written.** The route now serves a
> position statement consistent with the draft: no Article 28 clauses, no
> signature block, no sub-processor table. It says in a notice box that it
> replaces v1.1 and asks a school holding a copy to get in touch. Both Terms
> references to a "Data Processing Agreement" were rewritten, and `lib/pageTitles.ts`
> follows. The provenance is recorded in the draft's drafting note 4.
> **Still open:** nobody has checked whether the old page was ever sent to or
> signed by anyone. It invited a school to request a signed copy by email.

`app/dpa/page.tsx` is live at `mathsense.net/dpa`, linked from the Terms ("refer
to the Data Processing Agreement at mathsense.net/dpa"). It is an Article 28
processor agreement in which the School is "Controller" and Mathsense is
"Processor", promising to process "only on the documented instructions of the
Controller" and to "delete or return all Personal Data" on termination. Its
Schedule 1 lists three sub-processors and places Stripe in the **US**.

The draft in `docs/legal/dpa-schools.md` says, in bold, that Mathsense is *not*
the School's processor and that a processor agreement "would describe an
arrangement this product does not implement". A DPO who searches the domain
finds both within five minutes. The question is not which is right; it is why a
supplier has two incompatible legal positions live at once, and nothing in doc 21
shows the authors knew the first one existed. **Nothing else in this section can
be discussed until the live page is withdrawn or reconciled.**

### 2.2 "The School instructs us to do nothing" is not true

Doc 21 §2 rests the whole roles analysis on the last row of its table being
empty: no processing happens at the school's direction. Two features contradict
that, and both are built:

- **Paper marking.** `app/api/papers/sittings` takes marks a teacher entered and,
  under the service role, writes a `paper_sittings` row *and* `practice_attempts`
  rows into each pupil's record. That is school-originated data about a pupil,
  entered by the school, written into the pupil's account by Mathsense at the
  school's request. It then feeds the pupil's mastery. This is processing on the
  school's instruction in the plainest sense.
- **Assignments.** A teacher targets named pupils with work; Mathsense records
  their attempts against the assignment for the teacher.

The architecture still supports "the pupil owns the account". It does not support
"we never act on the school's instruction". For the teacher-originated data the
school is at least a controller and Mathsense processes it for them; for the
class view, where the school supplies the purpose and Mathsense the means, a DPO
will raise **joint controllership (Article 26)**, which doc 21 never considers:
it weighs processor against independent controller and stops. An Article 26
arrangement is not far from the draft, but "independent controllers" as drafted
lets the school assume it has no transparency duty of its own, and a careful DPO
will not sign that.

### 2.3 The scripts are visible, and four documents say they are not

> **◑ PARTLY CLOSED 2026-09-17.** Corrected in the two documents touched by the
> `/dpa` takedown: the school agreement now carries §4.2 stating that mini-exams
> are disclosed in full, and doc 21 §3 carries the correction in red. The new
> live page states it correctly rather than repeating the claim.
> **Still open, and both are pupil-facing:** `app/privacy/page.tsx` and the
> class-join screen still say a teacher cannot see the answers a pupil typed,
> and the DPIA repeats it in Step 2. The pupil-facing copy is the one that
> matters most for the Children's Code, and it is the one still wrong.

The privacy notice, the draft agreement §4, doc 21 §3 and the DPIA all state that
a teacher cannot see "which individual questions a pupil answered, or the answers
they typed". `supabase/migrations/20260801_class_exam_readiness.sql` defines
`get_class_exam_paper`, whose own header says the paper "holds every question id
and everything the student typed" and that "the paper IS exposed here", and
`app/dashboard/classes/[id]/exam/[sessionId]/page.tsx` renders it to the teacher.

The product decision (a mini-exam is assessment, reading the script is marking)
is defensible. The documents are wrong on a point any DPO can test by sitting a
mini-exam as a pupil and opening it as a teacher. It also matters for the
Children's Code: a pupil sitting a mini-exam alone at home is told their teacher
sees a skill map, not their answers. Every statement of the withholding needs the
exception written in, and the join-screen copy needs it most.

### 2.4 The sub-processor table cannot be signed as it stands

- **Google sign-in is absent from every list.** It is a live path for pupils
  (`lib/auth.ts`, `app/auth/callback`). Google learns that a child uses Mathsense;
  Mathsense receives and stores the Google full name and avatar URL in
  `auth.users` metadata, and pre-fills the display name with the child's real
  name. That is a US transfer of a child's identity, and §7.1's claim that Google
  Analytics is "the only routine transfer outside the UK and EU" is false for
  every Google-signed-in pupil.
- **Resend and Upstash have no location.** A table with a dash in the location
  column is a table a DPO sends back. Resend is a US company; the region it
  actually uses and the transfer mechanism have to be stated.
- **Stripe is "UK / EU" in the draft and "US" on the live page.** Stripe's own
  terms transfer data to the US. Pick one and cite it.
- **Vercel "London" is not pinned anywhere in the repository.** `vercel.json`
  carries only crons; no function region is set in code. Whether server routes
  run in London depends on a dashboard setting the docs do not evidence. Doc 21
  says every fact was "verified against the code on the day"; this one cannot be
  verified from the code at all.
- **No transfer mechanism is named for anything.** The live page at least
  mentions IDTAs; the draft does not.

### 2.5 Consent, legitimate interests, or contract: the docs use all three

Doc 20 says the union model rests on "consent that the pupil gave and can
withdraw". The DPIA and the notice say the account is *contract* and the teacher
view is *legitimate interests*. These are not interchangeable, and a DPO will
ask which:

- If it is consent: a 14-year-old typing a code because a teacher told them to
  in a lesson is not freely giving it. The ICO's position on consent under an
  imbalance of power is well known, and doc 21 §2 itself records the school's
  "we told them to use it" argument without noticing it undoes the consent story.
- If it is legitimate interests: there is no legitimate interests assessment on
  file, no children's balancing test, and leaving the class is then an exercise
  of the right to object, not a withdrawal of consent, so every "consent" in the
  design docs and copy is the wrong word.
- Contract with a minor: the ICO expects a controller to consider whether the
  child has the competence to enter it. Not addressed.

None of this is fatal. It does need one answer, written down, used consistently.

### 2.6 A teacher who leaves the school keeps the pupils

Class ownership is `classes.teacher_id`, a personal account. The SET NULL
migration (`20260915_class_ownership_survives_teacher.sql`) covers a teacher who
*deletes* their account. A teacher who simply leaves the school keeps their login
and, until someone at Mathsense reassigns the class by SQL, keeps seeing every
member's record. The school has no control over it and no way to know. "How do
you offboard a leaver" is on every DPO checklist and no document answers it.

### 2.7 Who is a Pupil, and who is a teacher

The agreement defines a Pupil as a member of a class "belonging to a teacher of
the School". The system cannot establish either half. Anyone can create a teacher
account with any email and start collecting children's display names, year groups
and skill maps; anyone with the code can join. The data exposed to a bogus
teacher is small and the join code can now be rotated, which is the right answer,
but the agreement's definitions assume a link the product does not make, and a
safeguarding lead will ask the identity question in the same meeting.

### 2.8 "Deletion works" overclaims in three places

- ~~`app/api/account/delete` deletes the auth user and never touches Stripe.~~
  **✅ FIXED 2026-09-18.** The subscription is now cancelled before the account is
  deleted, in that order, because the id lives on the row the deletion destroys.
  A Stripe outage blocks the deletion rather than stranding a live subscription,
  and a subscription already gone from Stripe is treated as success. The
  decisions are pure and tested in `lib/subscriptionCancel.ts`. This also closed
  the parent-paid case, where the payer is a third party who would never have
  seen the child's deletion. The privacy notice and the account page now say what
  happens, and the notice tells anyone already affected to ask for a refund.
- ~~`paper_sittings.marked_by` references `teachers(id)` with no delete action, so
  a teacher who has marked a paper cannot delete their account at all.~~
  **🔴 THIS FINDING WAS WRONG, AND IT IS THE MOST INSTRUCTIVE ENTRY IN THIS
  DOCUMENT. Withdrawn 2026-09-18.** The fix had already been written:
  `20260915_class_ownership_survives_teacher.sql` drops the constraint, drops the
  NOT NULL, and re-adds the reference with `ON DELETE SET NULL`, reasoning
  correctly that the sitting is the student's record so only the attribution
  should be lost.

  **How it got in here.** The finding was sourced from the comment in
  `app/api/account/delete/route.ts`, which said the blocker existed "today". That
  comment was written at 09:01 on 2026-09-15 and was true then. The migration
  landed at 14:05 the same day. The comment was never updated, and this red-team
  pass read it, believed it, and promoted a fixed bug to a published finding. It
  was then repeated twice more before anyone checked the migration.

  **The lesson is the one this document keeps finding, turned on the document
  itself.** Every other entry here was checked against the code. This one was
  checked against a comment *about* the code, which is the same mistake as doc 21
  verifying its disclosure wording against the other copies of that wording. A
  comment is a claim, not evidence. The evidence is the schema.

  **What is actually open:** whether that migration has been applied to the live
  database. It is hand-applied SQL and the file ships its own verification query.
  Also worth knowing, and not noted anywhere before: `marked_by` is write-only.
  It is set once in `app/api/papers/sittings` and read nowhere, so the attribution
  the SET NULL fix preserves has never been surfaced to anyone.

  **Where the original design was right:** the obvious fix, `ON DELETE CASCADE` to
  match the rest of the teacher chain, would have been far worse than the block.
  `practice_attempts.sitting_id` cascades from `paper_sittings`, so cascading from
  the teacher would have destroyed pupils' marked results and the mastery derived
  from them. Deleting one adult's account would have erased children's work.
- Deleting a pupil, by their own act or by the one-year rule, removes every
  sitting the teacher marked for them and their assignment attempts. The school's
  assessment record lives at the pupil's discretion. That follows correctly from
  pupil ownership, and it must be stated to the school in §8 of the agreement,
  not discovered.

### 2.9 Smaller assertions a DPO would strike out

- **"Enforced server-side"** (DPIA R2). `app/api/auth/provision` checks a boolean
  the client always sends as `true`. That is a required field, not enforcement.
  Say "the gate must be passed", and the DPIA's Step 1 should not then assert as
  fact that "every learner account belongs to someone aged 13 or over".
- **Joining shares history, not just private practice.** `get_class_skill_mastery`
  has no `joined_at` filter, so a pupil who joins in Year 11 shares everything
  since the account was created. The three disclosures say "private", none says
  "past".
- **The notice is dated 21 May 2026** and still says access is "restricted to the
  teacher who created the relevant assessment", while doc 21 says it was corrected
  on 17 September. Version drift on the document a DPO reads first undermines
  "verified on the day" for everything else.
- **Retention promises Stripe cannot keep.** The notice keeps *teacher* payment
  records seven years; pupil and parent payments are not mentioned, and Stripe
  retains them regardless.
- **R4 admits "more remain".** Four access defects in one month and no
  independent test reads, to a DPO, as "penetration test before signature", not
  "optional at this scale". R8's two-factor authentication is listed as not
  started; a DPO asks that question directly, and the DPIA answers it against you.
- **"We do not share your data with advertisers."** **CONFIRMED FALSE by the user
  2026-09-21: GA4 is linked to Google Ads.** The finding went through two wrong
  states before landing, and both are worth keeping. First it was asserted from
  memory, then over-corrected to "the notice is true as written" once the code
  showed no advertising tag. Both errors came from treating one sentence as the
  whole claim. The notice made two: *no advertising pixels*, which the code
  settles and which is **true**, and *no sharing with advertisers*, which the code
  cannot settle either way because the link is a console setting. Only the user
  could answer the second, and the answer was yes.

  **The lesson is about scope, not about Google.** Absence of a tag in a
  repository is evidence about tags, not about data sharing. A configuration made
  outside version control is invisible to every method this document used, which
  is the same blind spot as hand-applied SQL. Where a claim depends on a console,
  the honest finding is "ask", and it should be recorded as an open question
  rather than resolved in either direction.

  Corrected in the notice on 2026-09-21, in sections 3, 4 and 6, and in the change
  log. The user intends to stop advertising after the current campaign, at which
  point unlinking makes the original sentence true again and it can return.

---

## 3. Ranked

| # | Finding | Blocks | Fix is |
|---|---|---|---|
| 1 | ~~Live `/dpa` page says processor; draft says not~~ **✅ done 2026-09-17** (§2.1) | Signature, outright | Withdrawn and replaced; Terms references rewritten |
| 2 | Pupil scripts visible to teachers; four docs say they are not (§2.3) | Signature, and a Children's Code transparency problem | **◑ school-facing docs corrected 2026-09-17; the privacy notice, join screen and DPIA still say otherwise** |
| 3 | Sub-processor table: Google sign-in missing, blank locations, Vercel region unevidenced (§2.4) | Signature | Fill the table, name the transfer mechanisms, screenshot the Vercel region |
| 4 | "School instructs nothing" is false; joint controllership never considered (§2.2) | Signature, at a careful school | Solicitor, with the sittings route in front of them |
| 5 | Seats buy nothing a teacher can see; the readiness argument is unmade (§1.1) | Sale | Make the readiness argument now; build the class cap before pitching the paid tier |
| 6 | No leaver offboarding (§2.6) | Signature, at most schools | A runbook answer at minimum; a school admin surface eventually |
| 7 | Enrolment by read-out code, no roster sync, school Google accounts unaddressed (§1.1) | Sale, in week two of the trial | Product; at least document the school-Google case honestly |
| 8 | Lawful basis used inconsistently; no LIA (§2.5) | Signature, at a careful school | Pick one, write the assessment |
| 9 | No supply terms, insurance, continuity, Cyber Essentials (§1.1) | Purchase order | Paperwork, mostly |
| 10 | ~~Deletion overclaims, Stripe never cancelled~~ **✅ cancellation fixed 2026-09-18** (§2.8) | Questionnaire | Done. The `marked_by` half of this row **was never a real finding** and is withdrawn in §2.8 |
| 11 | Overage, PO-vs-payment, parent-paid pupils unstated (§1.3) | Purchase order | Two paragraphs |
| 12 | Bogus-teacher identity (§2.7) | Safeguarding question | Answerable as-is; say it |

Items 1 to 3 are cheap and cannot be argued around. Item 4 needs advice. Item 5
is the sale.

---

## 4. Where the docs are right and a sceptic would be wrong

- **A teacher genuinely cannot reach a pupil's email address.** `public.students`
  has no email column and the roster route selects `display_name, year_group`
  only. A DPO who says "every edtech leaks emails" is wrong here, and the docs are
  right to lead with it.
- **Not claiming to be a processor while offering processor-grade commitments**
  (draft §3.5) is the honest shape, and the reasoning in doc 21 §2 is better than
  most suppliers' boilerplate. It just needs §2.2's correction and the live page
  removed.
- **Refusing teacher-created pupil accounts** (doc 20 §10) is the right call for
  exactly the reasons given, and a DPO will prefer it to the alternative.
- **Allowing the join at the seat cap** rather than failing a child in a lesson is
  right, and so is seat = distinct pupil.
- **Nothing is deleted when a grant lapses**, and a teacher's account deletion no
  longer destroys pupil work: the migration exists and the join route refuses
  orphaned classes.
- **The private-practice disclosure** is genuinely in three places in matching
  words. The gap is "historic", not "private".
- **Deferring the marked-versus-self-reported split** until the first sitting
  (DPIA R3) is correct; building it now would show nothing.
- **The one-year deletion rule** is conservative in every branch and tested; a
  DPO who wants it shorter for a school can be given a per-school answer later,
  not a different mechanism.
- **The refund exposure** being unbounded is fine; it only triggers on a sale.

---

## 5. Pointers

- `app/dpa/page.tsx` — the live processor agreement (§2.1)
- `supabase/migrations/20260801_class_exam_readiness.sql` — `get_class_exam_paper`
  (§2.3)
- `app/api/papers/sittings/route.ts` — teacher-originated pupil data (§2.2)
- `lib/auth.ts`, `app/auth/callback/page.tsx` — Google sign-in and name pre-fill
  (§2.4)
- `vercel.json` — no function region (§2.4)
- `app/api/account/delete/route.ts` — no Stripe cancellation (§2.8)
- `supabase/migrations/20260615_class_mastery_rpc.sql` — no `joined_at` filter
  (§2.9)
- `docs/audit/16-teacher-paywall-plan.md` Part 1 — what the demo sells that does
  not exist (§1.1)
- `docs/audit/05-exam-coverage.md` — bank depth (§1.1)
