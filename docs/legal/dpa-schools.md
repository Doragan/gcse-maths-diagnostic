# Data protection agreement — schools

**DRAFT. NOT FOR SIGNATURE WITHOUT LEGAL REVIEW.**

_Version 0.2, 2026-09-17. The reasoning behind this document, and the evidence for
every factual claim in it, is in `docs/audit/21-school-data-protection-position.md`.
Section 3 (Roles) is the part a solicitor most needs to look at: it departs
deliberately from the processor arrangement a school will expect, and the
departure is substantive rather than cosmetic._

_**v0.2 corrects a factual error in §4.** v0.1 told the School that a teacher
cannot see which questions a Pupil answered or the answers they gave. That is
true of practice and false of mini-exams, which a teacher may open in full
(`get_class_exam_paper`). The correction is §4.2, and it matters more than a
wording fix: it was a claim a DPO could have disproved in ten minutes by sitting
a mini-exam as a pupil and opening it as a teacher. See `docs/audit/23` §2.3._

**Before issuing this to anyone, fill in:** the Provider's address (see §1 — a
service address is sufficient and need not be a home address), and the School's
details.

---

## 1. Parties

**The Provider:** Christopher Reay, a sole trader trading as **Mathsense**, of
[ADDRESS], United Kingdom.
Registered with the Information Commissioner's Office, registration **ZC152231**.
Data protection contact: privacy@mathsense.net

**The School:** [NAME], of [ADDRESS] ("the School").

In this agreement "Pupil" means a person who holds a Mathsense student account and
is a member of a class belonging to a teacher of the School.

---

## 2. What this agreement covers

The School purchases a number of **student seats**. That entitles Pupils who are
members of the School's classes to the full Mathsense service for the period
covered.

This agreement covers the personal data involved in that arrangement. It does not
vary the Mathsense privacy notice, which governs the Provider's relationship with
each Pupil directly, and which is published at mathsense.net/privacy.

---

## 3. Roles — please read, this is not the usual arrangement

Most school software is supplied on the basis that the school is the controller
and the supplier is its processor: the school decides, and the supplier acts on
instruction. **Mathsense is not built that way**, and it is better to say so
plainly than to sign a document that describes something the product does not do.

**3.1** A Mathsense student account is created by the Pupil. It exists before the
School's involvement, is not created by the School, and continues to exist if the
School's arrangement ends. The Provider is the **controller** of that account and
of the data in it.

**3.2** A teacher of the School sees a Pupil's record **because the Pupil joined
that teacher's class**, using a class code, as their own act. The Pupil may leave
the class at any time, which ends the disclosure. The School cannot create, join,
or end a membership on a Pupil's behalf, and the Provider has no mechanism by
which it could do so on the School's instruction.

**3.3** Accordingly the parties are **independent controllers** in respect of the
data disclosed to the School. The School is the controller of its own use of what
it sees, including anything it records in its own systems.

**3.4** The Provider does **not** act as the School's processor, because the
School does not instruct the Provider to process anyone's personal data. If the
parties later agree an arrangement under which the School directs the enrolment or
administration of Pupil accounts, that is a different arrangement and this
agreement must be replaced before it begins.

**3.5** Notwithstanding §3.4, the Provider gives the School the commitments in §6
to §11 below. Those are the assurances a school would ordinarily obtain from a
processor. The Provider offers them because they reflect what it does in any
event, and does not offer them as an admission that it acts as a processor.

---

## 4. The data involved

**Categories of data subject:** Pupils; teachers and staff of the School who hold
Mathsense accounts.

**Personal data disclosed to the School about a Pupil:**

- the Pupil's chosen display name
- the Pupil's year group, where they supplied one
- the Pupil's **practice record**: which maths skills they attempted, whether each
  attempt was correct, when it happened, and of what kind
- any **mini-exam the Pupil sits**, including the paper itself and the answers
  they gave (§4.2)
- work the teacher set for them, and papers the teacher marked for them

**§4.1 — the practice record includes private practice, and pre-dates the class.**
A Pupil's skill map is built from everything they do on Mathsense, not only from
work a teacher set, and what a teacher sees is that whole record — including
practice done before they joined the class. This is stated in the Pupil-facing
privacy notice and on the screen where a Pupil joins a class, and it is drawn to
the School's attention here because it is more than a school might assume.

**§4.2 — mini-exams are disclosed in full, unlike practice.** Where a Pupil sits
a Mathsense mini-exam, a teacher of their class may open the paper and see every
question and every answer the Pupil gave. A mini-exam is assessment rather than
private practice, and marking it means reading it. This is the one place the
withholding in the list below does not apply, and it is stated separately so it
cannot be read as an exception the School was not told about.

**Personal data NOT disclosed to the School:**

- the Pupil's **email address** — the Mathsense student record contains no email
  address. It is held only by the authentication provider and is not reachable by
  any teacher-facing function. This is a property of the system's design, not an
  access rule that could be changed by configuration.
- the Pupil's password, which the Provider does not hold in readable form
- which individual questions a Pupil answered **in practice**, or the answers they
  gave there. The teacher gets the skill map, never a transcript of private
  practice. Mini-exams are the exception and are disclosed in full (§4.2).
- any data about a person who is not an active member of that teacher's class

**Special category data:** none is collected. Mathsense does not ask for, and has
no field for, health, ethnicity, special educational needs, or any other special
category of data.

---

## 5. Lawful basis

The Provider processes Pupil data on the basis of performance of its contract with
the Pupil, and legitimate interests in enabling a teacher to see the results of a
Pupil who has chosen to join their class. Optional practice-reminder emails are
sent only on the Pupil's opt-in consent, which the Pupil may withdraw at any time.

The School is responsible for its own lawful basis for its use of the data it
receives.

---

## 6. Security

The Provider will maintain appropriate technical and organisational measures,
which currently include:

- row-level security on every database table, so access is enforced by the
  database rather than only by application code
- all cross-account reads confined to server-side routes running with elevated
  privilege, each gated on class ownership and active membership, and each
  returning only named columns
- encryption in transit throughout, and at rest by the hosting providers
- no pupil email address stored in the pupil record (§4)

**§6.1 — what the Provider does not have.** The Provider does not hold ISO 27001
or Cyber Essentials certification, and has not commissioned an independent
penetration test. The Provider is a sole trader and has not appointed a statutory
data protection officer, not being required to. The Provider states this rather
than leaving it to be discovered.

---

## 7. Sub-processors

| Sub-processor | Purpose | Location of processing | Transfer mechanism |
|---|---|---|---|
| Supabase | Database and authentication | London, United Kingdom | — |
| Vercel | Website hosting | London, United Kingdom | — |
| Stripe | Payment processing — receives an email address and payment details only, never practice or results data | Irish contracting entities; transfers to the United States | Standard Contractual Clauses, the UK Addendum, and the EU-US Data Privacy Framework |
| Resend | Sending confirmations, password resets, and opted-in reminders — receives an email address only | **United States** | Standard Contractual Clauses in its data processing addendum, and the Data Privacy Framework including the UK Extension |
| Upstash | Rate limiting — holds the visitor's IP address for approximately one minute to prevent automated abuse | ⚠ TO BE CONFIRMED BEFORE ISSUE | — |
| Google sign-in | Only where a Pupil chooses to sign in with Google, which passes us their name and email address | **United States** | Data Privacy Framework, UK Extension |
| Google Analytics | Website usage analytics, **only** for visitors who have accepted analytics cookies | **United States** | Data Privacy Framework, UK Extension |

_Locations verified 2026-09-22 against provider documentation and by resolving
the live endpoints. Evidence and method are recorded in `docs/audit/21` §5._

**§7.1 — international transfers.** Three of the recipients above process
personal data in the United States, each under the mechanism named in the table.

Google Analytics and Google sign-in are both optional for the Pupil: analytics
loads only after the visitor accepts analytics cookies and can be switched off
again at any time on the privacy page, and Google sign-in is offered alongside
an ordinary email and password. Declining either restricts nothing in the
service. No practice data, results data or account data is sent to Google.

Resend receives an email address in order to send the message. No practice or
results data is sent to it.

The Pupil database and the website itself are hosted in the United Kingdom.

⚠ **Before issue:** confirm the Upstash region in the console and complete the
row, and re-check that the Data Privacy Framework still stands. See
`docs/audit/21` §5 for why neither should be copied forward unchecked.

**§7.2** The Provider will give the School reasonable notice of any new
sub-processor that would process Pupil data, and the School may object.

---

## 8. Retention and deletion

- Data is retained while the account is in use.
- A student account with no sign-in and no practice for **one year** is deleted
  in full, automatically.
- A Pupil may delete their own account at any time from Account settings, which
  permanently removes their practice history, progress and class memberships.
- On request, the Provider will delete a named Pupil's account.

**§8.1** Expiry of the School's seat arrangement does **not** delete Pupil
accounts, and does not end a Pupil's access to their own record. The accounts
belong to the Pupils. What ends is the additional service the School paid for, and
the teacher's continued view of members' records.

---

## 9. Data subject rights

A Pupil may exercise their rights directly with the Provider, and the Provider
will respond to them directly, because the Provider is the controller of the
account. The Provider will assist the School with any request the School receives
that concerns data the School obtained through Mathsense.

---

## 10. Personal data breaches

The Provider will notify the School **without undue delay, and in any event within
72 hours** of becoming aware of a personal data breach affecting the School's
Pupils, giving what is known at the time and updating as more becomes known.

---

## 11. Audit

The Provider will answer reasonable written questions from the School about its
handling of Pupil data, and will provide evidence where it reasonably can. Given
the Provider's size, an on-site audit is not offered as a matter of course but
will not be unreasonably refused where a School has a specific concern.

---

## 12. Term

This agreement runs for as long as the School holds seats, and the obligations in
§8, §9 and §10 survive its end for as long as the Provider holds data obtained
under it.

---

**Signed for the Provider:** ................................  Date: ..............

**Signed for the School:** ..................................  Date: ..............

---

_Drafting notes, to be removed before issue:_

1. _Counterparty is a sole trader. If the Provider incorporates, §1 must be
   restated and any signed copy novated — cheaper before the first signature than
   after._
2. _§3 is deliberately unusual. A school's procurement may return their own
   processor agreement as a matter of course; that document will describe an
   arrangement this product does not implement, and signing it would commit the
   Provider to instructions it has no mechanism to receive._
3. _A DPIA now exists — `docs/legal/dpia-student-data.md`, v0.2, draft and not
   yet signed off. It should be signed off before this agreement is issued to
   anyone, because a school that asks for it will be given a document whose
   own status line says DRAFT._
4. _**The contradictory live page is gone, as of 2026-09-17.** `mathsense.net/dpa`
   served an Article 28 processor agreement — School as Controller, Mathsense as
   Processor, signature block, a three-row sub-processor schedule — for as long
   as this draft has existed, and neither this document nor `docs/audit/21`
   noticed. It has been replaced by a position statement consistent with §3 here
   (`app/dpa/page.tsx`), and the two Terms references to a "Data Processing
   Agreement" now point at it. **Nobody is known to have signed the old page**,
   which invited a school to request a signed copy by email; if anyone did, this
   note is where to start. Found by the red-team pass in `docs/audit/23`._
5. _§7's sub-processor table was **verified on 2026-09-22**, and every location
   is now evidenced rather than recalled — the method is recorded per row in
   `docs/audit/21` §5. The claim that Google was the only transfer outside the UK
   and EU was **false**: Resend stores in the United States as well, which is
   children's email addresses rather than page views. Corrected here and in the
   privacy notice._

   _**Two things still block issue.** The **Upstash region**, which only the
   console can settle because it is a Global database that replicates to chosen
   read regions; it is likely a settings fix rather than a migration. And a
   re-check that the **Data Privacy Framework still stands**, since it is under
   appeal and two equivalent arrangements have already collapsed._
