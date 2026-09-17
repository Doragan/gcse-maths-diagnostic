# The school data protection position

_Written 2026-09-17. Answers §6C of `docs/audit/20-school-accounts-design.md`, the
last item standing between the product and a school signature. Facts about the
system were verified against the code on the day, not recalled._

**What this is.** The reasoning behind what we tell a school, and the evidence
for it. The school-facing document is `docs/legal/dpa-schools.md`; this is why it
says what it says, and where it is weakest.

**What this is not.** Legal advice. The roles analysis in §2 is the part that
most needs a solicitor, because getting it wrong moves liability rather than just
wording. Everything factual here is checkable against the repository, and that is
the half worth paying a solicitor to review rather than to invent.

---

## 1. The short version

A school's data protection officer will arrive expecting a standard arrangement:
they are the controller, we are their processor, they instruct and we obey. **That
is not what this product is**, and the difference is architectural rather than
presentational.

A Mathsense student account is created by the student, exists before any school
is involved, and outlives the school's involvement. A school cannot create one,
cannot read one, and cannot delete one. What a teacher sees, they see because the
student joined their class, which is the student's own act and reversible by the
student alone.

So for the account we are the controller, not anyone's processor. What the school
gets is a **disclosure the pupil authorised**, not a service we perform on the
school's instruction.

---

## 2. Roles, honestly

The role depends on which processing is meant, and pretending otherwise is how
these documents go wrong.

| Processing | Who decides purpose and means | Role |
|---|---|---|
| The account: sign-up, practice, mastery, retention | Us | We are **controller**. The pupil is our data subject. |
| The class view: a teacher seeing a member's record | The pupil authorises it; we build it; the school uses it | Disclosure between **independent controllers** |
| What the school then does with what it sees | The school | School is **controller**, and we are not involved |
| Anything the school directs us to do for it | — | Would make us a **processor**. See below. |

**The last row is empty today, and that is deliberate.** A school instructs us to
do nothing. It buys seats; it does not tell us whose data to process or how. This
is exactly why `docs/audit/20` §10 concluded that teacher-created student accounts
should not be built: bulk enrolment at the school's direction is the thing that
would move us into the processor row and change the whole analysis.

**Where a DPO will push back, and they are not being difficult.** They can
reasonably say: these are our pupils, we told them to use it, we pay for it, and
the educational purpose is ours — so we are the controller and you are processing
on our behalf. That argument has real force, and it gets stronger the more the
school directs use of the product.

The counter is the architecture, and it is not rhetorical: the pupil's account
exists whether or not the school buys anything, survives the school, and the
school has no means to reach it. We could not act on a school's instruction about
a pupil's account even if we wanted to, because no such instruction path exists.

**Practical position.** We do not claim to be a processor, but we offer the
protections a school would want from one — security, breach notification,
sub-processor transparency, audit, deletion — because those commitments cost us
nothing we were not already doing, and refusing them to win an argument about
labels would be a poor trade.

---

## 3. What a school actually gets, verified

Every row below was checked against the code on 2026-09-17.

| A teacher of a class can see | Evidence |
|---|---|
| Display name, year group | `app/api/classes/[id]/members` — service-role, column-scoped, gated on class ownership |
| The member's **whole practice record**: skills attempted, correct or not, when, and kind | `get_class_skill_mastery` (`20260615`) |
| Work they set, and papers they marked | assignments and `paper_sittings` |

| A teacher **cannot** see | Why |
|---|---|
| Email address | `students` has **no email column at all**. It lives only in `auth.users`, which no teacher-facing query reaches. |
| Password | Never held in readable form; authentication is the provider's. |
| Which questions, or the answers typed | `get_class_skill_mastery` deliberately withholds `question_id` and the submitted answer |
| Anything about a pupil not in their class | Every read is gated on `teacher_owns_class` and active membership |
| Seat counts, grant dates, commercial data | `schools` denies every client role — no policy, grants revoked |

**The email point is the strongest single fact in the whole position.** Most
edtech can hand a school a pupil's email address. We cannot, because the
application does not store one against the pupil's record. It is a structural
guarantee rather than a policy promise, and it is worth saying plainly.

**The practice-record point is the one to disclose loudest.** A teacher sees
practice done privately, not only work they set. That was a deliberate product
decision ("mastery is mastery", 2026-06-15) and it is defensible, but it must be
stated rather than discovered. The pupil-facing copy now says so in all three
places it is mentioned; a DPO who tests the product against the document will
find them consistent.

---

## 4. The consent chain, and its one weak link

1. The pupil creates their own account and passes a 13-or-over gate.
2. The pupil enters a class code their teacher gave them. INSERT on memberships
   is revoked from clients, so this must go through a server route that resolves
   the code — knowing the code is genuinely required
   (`20260727_class_membership_scope.sql`).
3. The teacher can now see that pupil's record, and only while the membership is
   `active`.
4. The pupil can leave at any time, which is a client-side update of their own
   row and stops the sharing from that point.

**The weak link is step 1, and we should say so before a DPO says it.**
`confirmed_13` is hardcoded `true`; it records that the gate was passed, not an
independent verification of age. The form will not submit without it, so the
column means "the question was asked and answered", nothing more. That is
ordinary for a service in this category, and the notice already states the 13+
rule, but it is not age assurance and should not be presented as though it were.

---

## 5. Sub-processors

| Processor | Purpose | Location |
|---|---|---|
| Supabase | Database and authentication | EU West (eu-west-2) |
| Vercel | Hosting | London, UK |
| Stripe | Payments — email and payment details only, never practice or results | UK/EU, global company |
| Resend | Transactional and opted-in email — email address only | — |
| Upstash | Rate limiting — a short-lived request identifier | — |
| Google Analytics | Usage analytics, **only** after the visitor accepts cookies | **United States** |

**Google is the one a school may refuse**, and refusing is a coherent position
for them to take. It is the only routine transfer outside the UK and EU, it
concerns a service used by children, and "we asked for consent" is a weaker
answer to a school than to an individual. Decision taken 2026-09-17: keep it and
disclose it honestly. If a school makes removal a condition of signing, that is a
commercial trade to weigh at the time, and the consent gate means switching it
off for everyone is a configuration change rather than a rebuild.

---

## 6. What we can commit to today, and what we cannot

**Can, because it is already true:**

- Data at rest in the UK/EU for everything except consented analytics.
- No pupil email address disclosed to a school, structurally.
- Deletion on request, self-serve, working — `/api/account/delete`, fixed and
  verified 2026-09-16.
- Automatic deletion after a year of inactivity — shipped 2026-09-17, currently
  dry-run, first possible deletion 29 May 2027.
- A pupil can end the sharing themselves at any time.
- Row-level security on every table, with cross-account reads confined to
  service-role routes that are column-scoped and ownership-gated.

**Cannot yet, and a DPO may ask:**

- **No DPIA.** Processing children's data and profiling their attainment is
  squarely the kind of processing the ICO expects one for. This is the largest
  documentation gap and it is not satisfied by this document.
- **No named data protection officer.** Not required at this size, but the
  question gets asked; the honest answer is the contact address in the notice.
- **No formal security certification.** No ISO 27001, no Cyber Essentials.
  Cyber Essentials is cheap and is increasingly a procurement tick-box for
  schools; worth considering before a MAT-scale conversation.
- **No penetration test.** The security work this month was introspection and
  reasoning, which found real holes, but it is not an independent assessment.

Stating these plainly is better than being found out by a questionnaire. A small
supplier that knows its gaps reads as more competent than one that claims none.

---

## 7. If a school insists on being the controller

Some will, and the product can accommodate it — but not silently, because it
changes the thing the design is built on.

School-directed enrolment means pupils enrolled without a pupil act, which means
the school is the controller of the account, which means we become a processor,
which means `docs/audit/20`'s union model loses the foundation it rests on:
consent that the pupil gave and can withdraw.

That is a different product with a different legal shape, not a setting. The
answer to a school asking for it is not "no", it is "that is a different
arrangement and here is what changes" — and the work to support it is designed
already, in `docs/audit/20` §10, precisely so the decision can be taken
deliberately rather than arrived at by an implementation.

---

## 8. Pointers

- `docs/legal/dpa-schools.md` — the school-facing document this reasoning backs
- `docs/audit/20-school-accounts-design.md` §10 — teacher-provisioned accounts,
  and why they were not built
- `app/privacy/page.tsx` — the published notice, corrected 2026-09-17
- `supabase/migrations/20260615_class_mastery_rpc.sql` — what a teacher sees, and
  what is withheld
- `supabase/migrations/20260727_class_membership_scope.sql` — why knowing the
  class code is genuinely required
- `lib/retention.ts` — the one-year rule
