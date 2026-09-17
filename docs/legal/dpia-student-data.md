# Data Protection Impact Assessment — Mathsense student data

**DRAFT. NOT SIGNED OFF.**

_Version 0.2, 2026-09-18 (see revision history at the foot). Follows the ICO's DPIA structure so a school's data
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
  learner account belongs to someone aged 13 or over, and the service is aimed at
  GCSE candidates, so the overwhelming majority are 14 to 16.
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
(Supabase, EU West). Email is sent via Resend. Payments go to Stripe. Consented
website analytics go to Google in the United States.

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
| Exam sittings and marked papers | Where a teacher has marked work |
| Subscription status | Tier, paid-until, Stripe identifiers where the learner or a parent has paid |

**Volume, as at 2026-09-17:** 80 learner accounts, 4 with a live subscription, and
in the region of a few thousand practice attempts. This is a small service and the
assessment should be read at that scale, not at the scale it aspires to.

**No special category data is collected.** There is no field for health, ethnicity,
special educational needs, or free school meals status, and none is inferred.

### Context

Learners are children. They arrive either directly, typically via search or
advertising, or because a teacher told them to. The relationship with the learner
is direct: they hold the account, not their school and not their parent.

Where a school buys seats, the learners in its teachers' classes receive the full
service. The school does not own, create or control those accounts. The role
analysis is in `docs/audit/21` and concludes independent controllers rather than
controller and processor.

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
- The teacher view withholds the question identifier and the submitted answer, so
  a teacher gets the skill map and never a transcript of what a child typed.
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
| Measures | Stated in three places in matching words: privacy notice, the join screen, and the school agreement. Joining requires the learner's own act, and a code they must be given. Leaving is one click and ends it. |
| Residual | **Low–medium.** Wording can only do so much. Step 3 consultation is the real test and has not happened. |

### R2 — An under-13 uses the service

| | |
|---|---|
| Harm | Processing a young child's data without a valid basis |
| Likelihood | Medium. The gate is a self-declared tick box. |
| Severity | Medium |
| Measures | 13+ gate on every signup path, enforced server-side as well as in the form. Terms state the rule. No special category data collected, so the data held about an under-13 would be no more sensitive than for anyone else. Deletion on request. |
| Residual | **Medium.** This is not age assurance and should not be described as such. Stronger verification is disproportionate for a service of this kind and scale, but the honest position is that we would not detect a determined 12-year-old. |

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

### R7 — Website analytics transferred to the United States

| | |
|---|---|
| Harm | Usage data about a child's browsing transferred outside the UK |
| Likelihood | Medium — only for visitors who accept |
| Severity | Low. No account, practice or results data is sent. |
| Measures | Loads only after explicit consent; not loaded at all on decline or if the banner is ignored; declining restricts nothing. Disclosed in the notice and the school agreement. |
| Residual | **Low.** A school may still object on principle, and removing it is a configuration change rather than a rebuild. |

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

**Risks accepted as low after mitigation:** R3 (revised), R5, R6, R7, and R1 and
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
or any new category of personal data is collected._

_Revision history: v0.1 2026-09-17 first draft. v0.2 2026-09-18 R3 downgraded
from medium-high to low and the recommended action withdrawn, on the controller's
challenge; outcome changed from withheld to ready for sign-off._
