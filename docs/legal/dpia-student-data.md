# Data Protection Impact Assessment — Mathsense student data

**DRAFT. NOT SIGNED OFF.**

_Version 0.1, 2026-09-17. Follows the ICO's DPIA structure so a school's data
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

| | |
|---|---|
| Harm | A teacher intervenes, sets work, or forms a view on the basis of a skill map that is wrong |
| Likelihood | **High.** Answer checking happens in the browser and the learner's own device records whether they were correct. A learner can inflate their map, and a bored one might. |
| Severity | Medium. Misdirected teaching, or a child's difficulty going unseen because the data says otherwise. |
| Measures | Today: none that prevent it. The accuracy limitation is known internally (accepted risk "F5", 2026-07-28) with the stated trigger for fixing it being teachers paying for mastery data. |
| Residual | **Medium–high, and this is the most substantial unmitigated risk in this assessment.** Article 5(1)(d) requires personal data to be accurate. Selling a school a skills map that the pupil can alter sits badly against that, independently of whether it is commercially acceptable. **Recommendation: server-side grading of at least assignment and class-visible attempts before the first school contract.** |

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

**Risks accepted as low after mitigation:** R5, R6, R7, and R1 and R4 at the lower
end of their ranges.

**Risks requiring action before a school contract:**

| Action | Addresses | Status |
|---|---|---|
| Server-side grading of class-visible attempts | R3 | **Not started. The most significant gap.** |
| Two-factor authentication on all provider accounts, written recovery procedure | R8 | Not started, cheap |
| Test the class-sharing wording with real teachers and learners | R1, Step 3 | Not started |
| Cyber Essentials certification | R4 | Optional; increasingly a procurement expectation |
| Independent penetration test | R4 | Optional at this scale |

**Not approved for sign-off in this state.** R3 is the item to resolve, and not
because a school will ask about it. It will not. It matters because charging a
school for a skills map that the pupil can alter is a poor foundation for the
thing being sold, and Article 5(1)(d) has a view about accuracy independent of
what any customer notices.

---

**Prepared by:** ................................  Date: ..............

**Reviewed by:** .................................  Date: ..............

_A DPIA is a living document. It should be revisited when: server-side grading
ships; the first school contract is signed; the teacher paid tier launches; or any
new category of personal data is collected._
