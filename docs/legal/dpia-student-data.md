# Data Protection Impact Assessment — Mathsense student data

**DRAFT. NOT SIGNED OFF.**

_Version 0.5, 2026-10-21 (see revision history at the foot). The header read
"0.3" until now while the history already recorded a v0.4 — corrected rather than
left, because a version number nobody can trust is worse than none. Follows the ICO's DPIA structure so a school's data
protection officer recognises the shape. Every factual statement was checked
against the code and the live database on the day; the evidence trail is in
`docs/audit/21-school-data-protection-position.md`._

**Controller:** Christopher Reay trading as Mathsense. ICO registration ZC152231.
**Contact:** privacy@mathsense.net

**An admission up front.** Article 35 expects a DPIA *before* processing begins.
This one is being written after roughly six months of live processing, prompted by
preparing to sell to schools. That is a finding in its own right and it is
recorded here rather than quietly fixed by backdating. The assessment below is
otherwise written as it should have been.

---

## Step 1 — Is a DPIA required?

Yes. Two of the ICO's screening criteria apply squarely:

- **Data concerning vulnerable data subjects**, specifically children. Every
  learner **account** belongs to someone aged 13 or over, and the service is aimed
  at GCSE candidates, so the overwhelming majority are 14 to 16. Since 2026-10-20
  there is one path with no age gate at all — a class session, where a teacher's
  pupils join with a code and a first name and no account exists. See the class
  sessions note in Step 2 and R2.
- **Profiling or automated evaluation.** Mathsense infers, per skill, whether a
  pupil has mastered it, is making progress, or needs practice, and surfaces that
  inference to the pupil's teacher.

Neither triggers a mandatory DPIA on its own in every case, but together, on a
service whose entire purpose is evaluating children's attainment, the answer is
not in doubt.

**Not applicable:** no special category data, no criminal offence data, no
biometric or genetic data, no systematic monitoring of a public area, no
automated decision with legal or similarly significant effect (see risk R6).

---

## Step 2 — Describe the processing

### Nature

Learners create their own accounts and answer GCSE maths questions. Each answer
is recorded as an attempt: which skills it exercised, whether it was correct, when
it happened, and what kind of activity it was. From those attempts the service
derives a skill map.

A learner may join a teacher's class by entering a 4-character code the teacher
gives them. Doing so allows that teacher to see the learner's record. The learner
may leave at any time.

Data flows: learner's browser → our application (Vercel, London) → database
(Supabase, London). Email is sent via Brevo, with opted-in practice reminders via
Resend. Payments go to Stripe. **No analytics data leaves our own database**:
Google Analytics was removed on 2026-10-10 and nothing replaced it.

### Scope

**Personal data held about a learner**

| Field | Note |
|---|---|
| Display name | Chosen by the learner; may be a first name or a nickname |
| Email address | Held by the authentication provider only. **There is no email column on the learner record.** |
| Year group | Optional |
| Confirmation of being 13 or over | A record that the gate was passed, not verified age |
| Practice attempts | Skills, correct or not, timestamp, kind. No question identifier, no submitted answer is retained for teacher view |
| Derived skill mastery | Computed, not stored as a judgement |
| Class memberships | Which classes, joined when, active or left |
| Mini-exam papers | The paper, **every answer the learner gave**, and the score (`exam_sessions.paper`). Durable, and readable in full by a teacher of their class |
| Exam sittings and marked papers | Where a teacher has marked work |
| Subscription status | Tier, paid-until, Stripe identifiers where the learner or a parent has paid |

**Volume, as at 2026-09-17:** 80 learner accounts, 4 with a live subscription, and
in the region of a few thousand practice attempts. This is a small service and the
assessment should be read at that scale, not at the scale it aspires to.

**No special category data is collected.** There is no field for health, ethnicity,
special educational needs, or free school meals status, and none is inferred.

**Class sessions — outside the scope above, and someone else's assessment**

_Added 2026-10-21. A class session is a lesson a teacher runs with no pupil
accounts: they read out a four-character code, each pupil types a first name, and
the teacher watches progress live. `docs/audit/29` is the design, and
`20261020_class_sessions.sql` the schema._

Everything above describes the **account** path, where we are the controller. A
class session is different in the two ways that matter to this document, and
neither is about how much data is held:

| | Account path | Class session |
|---|---|---|
| Our role | Controller | **Processor.** The school instructs; we act |
| Data subjects | Self-registering learners, 13+ | **Any pupil in the lesson, including under-13s** |
| Held | The table above | A first name; per question, right or wrong |
| Retained | Until deletion or a year's inactivity | **Deleted the same day**, by an hourly job |
| Feeds mastery | Yes | No — there is no account to attach it to |

Two consequences for this assessment:

1. **The risk work above already covers it, and no new measures are needed.** A
   session holds strictly less than any row in the scope table, for hours rather
   than years, with no email address, no identifier that outlives the lesson, and
   no profiling — the mastery engine never sees it. Every risk below is either
   inapplicable or less severe here. Short retention is the mitigation, not a new
   hazard.
2. **But the Article 35 duty for it is the school's, not ours.** A DPIA is a
   controller's obligation. For class sessions the school decides the purpose and
   the means, so the school assesses them, under its own lawful basis — which is
   the school's to choose and is deliberately not stated anywhere in this document
   or in our privacy notice. What we owe is an accurate account of what we do on
   instruction, which is the table above, and we will help a school complete its
   own assessment on request.

So this note exists to mark the boundary of the assessment rather than to extend
it. A school's DPO reading this document should be able to see at once which
processing it covers and which it does not.

### Context

Learners are children. They arrive either directly, typically via search or
advertising, or because a teacher told them to. The relationship with the learner
is direct: they hold the account, not their school and not their parent.

Where a school buys seats, the learners in its teachers' classes receive the full
service. The school does not own, create or control those accounts. The role
analysis is in `docs/audit/21` and concludes independent controllers rather than
controller and processor.

**Both statements above are about accounts, and a class session has none.** There
the relationship is not direct — the pupil is there because their teacher told the
class to join — and the role is the ordinary one of controller and processor, with
the school as controller. That is the single exception to the paragraph above, and
it is set out in the class sessions note in Scope.

### Purposes

To let a learner practise GCSE maths and see where they stand; to let a teacher
the learner has chosen to share with see the same; to operate and be paid for the
service.

---

## Step 3 — Consultation

**Not yet carried out, and this is a gap.** The ICO expects the views of data
subjects, or a reason for not seeking them.

What has informed the design in place of formal consultation: the Children's Code
has been applied deliberately to learner-facing surfaces, which is why there are
no countdowns, no streak-loss mechanics and no loss-aversion prompts anywhere in
the learner journey, and why the weekly goal was designed as two days of activity
rather than a daily streak.

**To do:** ask two or three teachers, and if possible some learners, whether the
class-sharing explanation is understood. The specific question worth testing is
whether a learner realises that joining a class shares practice they do on their
own, not only work the teacher sets. That is the disclosure most likely to
surprise them and the one hardest to word well.

---

## Step 4 — Necessity and proportionality

**Lawful basis.** Performance of the contract with the learner for the core
service; legitimate interests for the teacher's view of a learner who chose to
join their class; consent, separately and revocably, for practice-reminder emails
and for website analytics.

**Is the processing necessary?** For attempts and derived mastery, yes: the
service is the skill map, and it cannot exist without the attempts behind it.

**Data minimisation — what is deliberately not done**

- No email address on the learner record, so none can be disclosed to a teacher.
  A structural limit rather than an access rule.
- The **practice** teacher view withholds the question identifier and the
  submitted answer, so a teacher gets the skill map and never a transcript of
  what a child typed in practice. **Mini-exams are the exception and are
  disclosed in full** (`get_class_exam_paper`): a mini-exam is assessment, and
  marking it means reading it. v0.2 of this assessment stated the withholding
  without the exception, which overstated the minimisation; see R1.
- No real name is required. A display name may be anything.
- Year group is optional.
- No school name is collected from teachers, and none from learners.
- The analytics event store keys on a per-tab session identifier rather than the
  account.

**One place where minimisation is weaker than it looks.** A teacher sees the
learner's *whole* practice record, including practice done privately, rather than
only work relevant to the class. This is a deliberate product decision
("mastery is mastery", 2026-06-15) on the reasoning that a partial skill map is
misleading to a teacher. It is defensible, but it is the least minimising choice
in the design and it is the one that most needs to be disclosed clearly. It is
now stated in the privacy notice, on the join screen, and in the school
agreement.

**Retention.** Data is kept while the account is in use. An account with no
sign-in and no practice for one year is deleted in full. A learner may delete
their own account at any time, which removes everything. Implemented
2026-09-17 (`lib/retention.ts`), currently in dry run; the earliest possible
deletion is 29 May 2027, because no account is yet a year old.

**Learner rights.** Access, rectification, erasure and objection are exercised
directly with us because we are the controller. Erasure is self-serve and does
not require asking. Reminder-email consent is withdrawable from the dashboard or
any email footer.

---

## Step 5 and 6 — Risks, and measures to reduce them

Likelihood and severity are judged for a learner, not for the business.

### R1 — A learner shares more than they realise by joining a class

| | |
|---|---|
| Harm | A child's private practice, including failures, seen by a teacher they did not expect to see it |
| Likelihood | Medium before mitigation. Children skim. |
| Severity | Low to medium. Embarrassment; in the worst case a teacher's judgement formed on private struggle. |
| Measures | Stated in four places in matching words: privacy notice, the join screen, the school agreement and the school-facing page. Joining requires the learner's own act, and a code they must be given. Leaving is one click and ends it. |
| Residual | **Low–medium.** Wording can only do so much. Step 3 consultation is the real test and has not happened. |

**🔴 The wording was wrong until 2026-09-18, in the learner's favour twice over.**
Every one of those places told the learner a teacher never sees the answers they
type, and told them the sharing covered their practice without saying it reached
back before they joined. Mini-exam scripts are readable in full, and the practice
record shared is the whole history. Both are now stated on the join screen and in
the notice, which is where a learner actually reads them.

This does not change the rating, but it changes what the rating rests on. The
residual was justified by "stated in three places in matching words" — the words
matched each other and did not match the system. Any future measure of this kind
should be checked against the code, not against the other copies of itself.

### R2 — An under-13 creates an account

_Retitled 2026-10-21. This entry used to be called "an under-13 uses the service",
and that is no longer the same question: on one path an under-13 using the service
is intended. The risk is about an under-13 holding an **account**, which is where
the age gate lives and where we are the controller._

| | |
|---|---|
| Harm | Processing a young child's data as controller without a valid basis |
| Likelihood | Medium. The gate is a self-declared tick box. |
| Severity | Medium |
| Measures | 13+ gate on every **signup** path, enforced server-side as well as in the form. Terms state the rule. No special category data collected, so the data held about an under-13 would be no more sensitive than for anyone else. Deletion on request. |
| Residual | **Medium.** This is not age assurance and should not be described as such. Stronger verification is disproportionate for a service of this kind and scale, but the honest position is that we would not detect a determined 12-year-old. |

**Class sessions are not this risk, and must not be mistaken for it.** An under-13
in a class session is not a gate being evaded: there is no gate, by design, because
there is no account and so no agreement with the pupil to be of an age to make. A
Year 7 class is eleven. The school decides to run the session, is the controller of
it, and operates under its own basis and its own privacy information.

What that leaves us accountable for is narrow and worth stating plainly: a first
name and some right-or-wrong marks, deleted the same day, never linked to an
account, and never used to profile anyone. Because nothing persists, the harm this
entry is about — a child's record accumulating without a valid basis — has nothing
to accumulate in. Residual risk from the session path alone: **low**.

The thing that would change this assessment is persistence. If a session ever
retained anything past the day, fed mastery, or carried an identifier between
lessons, it would stop being the school's short-lived processing and start being
a record we hold about a child who passed no age gate — at which point this entry
needs rewriting and the school's basis is no longer sufficient. That is why
`docs/audit/29` puts the deletion job and the no-mastery rule in the schema rather
than in a policy, and why both are on the "revisit this document" list below.

### R3 — Inaccurate attainment data informs a decision about a child

_Revised 2026-09-18, downwards. The first version of this entry rated the risk
medium-to-high and recommended server-side grading before any school contract.
The controller challenged that as disproportionate, and was right. The original
reasoning conflated two different things, and the revision is recorded here
rather than replacing the original silently._

**The conflation.** There are two ways a skill map could overstate a pupil, and
they are not the same risk.

*Forging the record.* Answer checking happens in the browser and the pupil's own
device reports whether they were correct, so the request could be tampered with.
This needs developer tools and some understanding of what is being sent. It is
rare, and the motive is weak: the only prize is a flattering chart that misleads
nobody but themselves.

*Looking up the answer.* This needs no knowledge at all — but it is **not an
accuracy failure**. It is the nature of unsupervised practice, every teacher
already knows homework is not invigilated, and "the pupil answered this
correctly" is an accurate record of what happened. Calling it inaccurate data
conflates a limit on what the data *means* with the data being *wrong*, which is
a materially weaker claim than the first version made.

| | |
|---|---|
| Harm | A teacher forms a view, or sets work, on a skill map that overstates a pupil |
| Likelihood | **Low** for forgery, which needs technical knowledge and offers nothing. Unsupervised practice being unsupervised is expected rather than a failure. |
| Severity | Low to medium. Practice charts are not assessment evidence, and a teacher triangulates against classwork and tests. |
| Measures | Teacher-marked papers are written under the **service role** (`app/api/papers/sittings`), so the evidence a teacher most relies on is not self-reported at all. Each attempt already carries a `sitting_id`, so marked and self-reported evidence are distinguishable in the data. |
| Residual | **Low.** |

**Not being done, deliberately.** `get_class_skill_mastery` does not return
`sitting_id`, so a teacher cannot currently see which skills rest on a paper they
marked and which on self-practice. Surfacing that would be the proportionate fix,
and it is not being built, because **no paper sitting has ever been recorded**.
Every piece of mastery data in the system is self-reported, so a provenance split
would show the same thing for every pupil on every skill — which is to say
nothing. Building it now would repeat the mistake of the class-invitations
feature, built ahead of use and reverted a week later.

**Trigger to revisit.** The first time a teacher marks a paper. From that point
marked and self-reported evidence coexist, the distinction becomes real, and the
useful version is not a disclaimer but a prompt: where a pupil looks strong on
self-practice with no marked evidence, that is where the next test should spend a
question.

**One caveat that survives the downgrade.** If exam readiness or a predicted
grade is ever surfaced to a school off this data, the stakes rise, because a
prediction carries more weight than a practice chart. Revisit then.

### R4 — One learner's data is shown to the wrong person

| | |
|---|---|
| Harm | Disclosure of a child's record to a teacher or learner with no right to it |
| Likelihood | Low, but demonstrated non-zero: in September 2026 a privilege escalation was found by which any signed-in learner could have made themselves an administrator. It was closed the day it was found. |
| Severity | High |
| Measures | Row-level security on every table. Cross-account reads confined to server-side routes running with elevated privilege, each gated on class ownership and active membership, each returning named columns only. Commercial tables deny all client roles outright. Table-level privileges revoked rather than relying on policies alone, after that trap was hit twice. |
| Residual | **Low–medium.** The controls are good and were tested empirically, not assumed. But four separate access defects were found in one month by looking, which is evidence that looking works and also that more remain. No independent penetration test has been done. |

### R5 — Automatic deletion removes data it should not

| | |
|---|---|
| Harm | A child's work destroyed irrecoverably |
| Likelihood | Low |
| Severity | High, and irreversible |
| Measures | The rule is a pure function with 18 tests. Every judgement resolves towards keeping: activity is the later of signing in and practising; a live subscription is never deleted; unreadable dates are never deleted; the one-year boundary keeps rather than deletes. Deletion is off by default and requires an explicit environment flag. Per-run cap bounds the damage. Nothing qualifies until 29 May 2027, so it will report zero nightly for eight months before it can act. |
| Residual | **Low.** |

### R6 — Profiling a child's ability

| | |
|---|---|
| Harm | A child categorised by an algorithm as weak at something, and internalising it |
| Likelihood | Certain — it is the product |
| Severity | Low to medium |
| Measures | Categories are per skill and transient, recomputed from attempts rather than stored as a verdict, and always improvable by practice. Learner-facing language is about what to practise next rather than what they are. No decision with legal or similarly significant effect is made, so Article 22 is not engaged. No profiling for advertising. |
| Residual | **Low.** Worth revisiting if attainment prediction is ever surfaced to a learner as a grade. |

### R7 — Website analytics transferred to the United States — ✅ CLOSED 2026-10-10

_Closed by removal rather than by mitigation, which is the better way to close a
risk. Kept in the register rather than deleted, because a closed risk and a risk
that was never identified look identical once the entry is gone._

| | |
|---|---|
| Harm | Usage data about a child's browsing transferred outside the UK |
| Likelihood | **Nil.** Google Analytics was removed when the ad campaign it measured ended. |
| Severity | Low while it applied. No account, practice or results data was ever sent. |
| Measures | Removal. Verified in the browser: no request to any Google host, no `gtag`, no GA cookie. The consent banner went with it, having existed solely to gate this. |
| Residual | **None.** No usage data about a learner now leaves the United Kingdom. |

**What the banner's removal assumed**, recorded because reinstating it is cheap
and reinstating it late is not: first-party, per-tab, UK-only analytics that never
leave our infrastructure sit in the ICO's low-risk category, where a third-party
US transfer did not. **Any future change that sends usage data to a third party
re-opens this risk and needs the consent mechanism rebuilt before it ships.**

### R8 — A single person holds every key

| | |
|---|---|
| Harm | Compromise of one laptop or one account exposes the entire database |
| Likelihood | Low |
| Severity | High |
| Measures | Service-role credentials are never shipped to the browser and live only in server environment variables. Client roles hold no privilege that row-level security does not also gate. |
| Residual | **Medium.** There is no separation of duties and cannot be in a one-person business. No formal access review, no hardware token requirement, no documented recovery plan. Cheap improvements available: two-factor authentication on Supabase, Vercel, Stripe and the domain registrar, and a written recovery procedure. **Worth doing regardless of any school.** |

---

## Step 7 — Outcome

**Risks CLOSED outright:** R7, by removing Google Analytics (2026-10-10).

**Risks accepted as low after mitigation:** R3 (revised), R5, R6, and R1 and
R4 at the lower end of their ranges.

**Outstanding actions**

| Action | Addresses | Status |
|---|---|---|
| Two-factor authentication on Supabase, Vercel, Stripe and the domain registrar; a written recovery procedure | R8 | **Not started. The largest remaining gap, and cheap.** |
| Test the class-sharing wording with real teachers and learners | R1, Step 3 | Not started |
| Cyber Essentials certification | R4 | Optional; increasingly a procurement expectation |
| Independent penetration test | R4 | Optional at this scale |
| Surface marked-versus-self-reported evidence in the teacher view | R3 | Deliberately deferred. Trigger: the first recorded paper sitting. |

**Ready for the controller's sign-off, with those actions recorded as
outstanding.** No risk in this assessment is now rated above medium residual, and
the one that is — R8, a single person holding every key — is inherent to a
one-person business rather than a defect, and is partly addressable this week for
almost nothing.

The earlier version of this section withheld sign-off over R3. That has been
revised: see R3 for the reasoning, and for the record that the original rating
was the assessor's error rather than a change in the facts.

**Sign-off is the controller's, not the assessor's.** Nothing above should be read
as approval; it is a recommendation that the document is now in a state where
approval is a reasonable decision.

---

**Prepared by:** ................................  Date: ..............

**Reviewed by:** .................................  Date: ..............

_A DPIA is a living document. It should be revisited when: **the first paper
sitting is recorded** (R3); the first school contract is signed; the teacher paid
tier launches; exam readiness or a predicted grade is surfaced to a school (R3);
any new category of personal data is collected; **or any third-party analytics or tracking is introduced, which re-opens R7 and requires the consent mechanism to be rebuilt first**.
Also: **if a class session ever persists anything past the day, writes to mastery,
or carries an identifier between lessons** — any one of those moves that path from
the school's processing into a record we hold as controller about a child who
passed no age gate, and R2 would need rewriting (see R2)._

_Revision history: v0.1 2026-09-17 first draft. v0.2 2026-09-18 R3 downgraded
from medium-high to low and the recommended action withdrawn, on the controller's
challenge; outcome changed from withheld to ready for sign-off. v0.3 2026-09-18
corrected the scope table and the minimisation claim: mini-exam papers are held
in full and are readable by a teacher, which v0.1 and v0.2 both denied. R1 amended
with the reason the error survived three documents. v0.4 2026-10-10 R7 CLOSED:
Google Analytics removed with the ad campaign it measured, and the consent banner
with it; the assumption that removal rests on is recorded in R7. v0.5 2026-10-21
a scope and accuracy amendment for class sessions, NOT a risk reassessment: three
statements had become false descriptions of the service — Step 1's "every learner
account belongs to someone aged 13 or over", Context's direct relationship and
independent-controller conclusion, and R2's "13+ gate on every signup path" read
as covering every path. A class sessions note added to Scope marks the boundary of
this assessment, since for that path we are the processor and the Article 35 duty
is the school's. No new risk and no new measures: a session holds less, for hours,
with no profiling. R2 retitled and given an explicit "what would change this"
trigger. The header version was also stale at 0.3 while this history recorded a
v0.4._
