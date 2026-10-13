# Call note — tutoring outfit

_One side, for glancing at during the call. Paper counts from the repo,
7 October 2026; database figures from 4 October 2026 and worth a refresh if the
call slips. Everything here was checked, not recalled._

---

## If they ask what it is, in one breath

GCSE maths practice and assessment. Students practise between sessions on their
own account; tutors see a skill map that builds up. Two assessment routes: mark a
real past paper and the marks feed the map, or set a mini-exam in the app that
marks itself. Mostly online outfits use the second.

---

## Numbers you can say out loud

| | |
|---|---|
| Published practice questions | **271** (222 at Foundation, mixed calculator) |
| Past papers in the marking tool | **66** |
| Mini-exams sat so far | **15** |
| Papers marked through the product, ever | **0** |
| Classes in existence, ever | **2** |
| Teacher accounts, ever | **5** |
| Student accounts, ever | **116** |

The last four are the honesty numbers. They would be an early user by any
measure, and the teacher side especially.

---

## Coverage — the first real question they'll ask

| Board | What's in the marking tool |
|---|---|
| **AQA 8300** | All 3 papers, both tiers — Jun 23, Nov 23, Jun 24, Nov 24, Jun 25 (30) |
| **Edexcel 1MA1** | All 3 papers, both tiers — Jun 24, Nov 24, Jun 25 (18) |
| **OCR J560** | All 6 papers — Jun 23, Jun 24, Jun 25 (18) |

All three major boards, both tiers, most recent series. AQA is the deepest at
five series; Edexcel and OCR have two each. That is a good answer to give — no
need to apologise for it.

**No iGCSE.** Edexcel 4MA1 is not in the marking tool at all. Online outfits
often take international students, so ask rather than wait to be asked.

The practice bank is deepest where the exam marks concentrate, and thin in
places — some topics have only one or two questions. Safe answer: *send me your
topic list and I'll tell you exactly what's covered.*

---

## What actually works

- **Practice on a phone.** Checked at 375px — stems, maths keypad, submit, no
  overflow. An in-person room with no computers can still run it.
- **Mini-exams**, auto-marked. Score comes back as a **confirmed floor plus an
  unknown band**: marks it can prove are counted, method marks it can't are
  flagged rather than guessed. Tutor opens the script and resolves the band by
  eye.
- **Paper marking** → WWW/EBI feedback sheet per student as a PDF, an answer key,
  a group mark summary, and the marks feed each student's skill map.
- **Class view**: group mastery by skill, scopeable to topics actually taught.
- **1:1 works properly.** No minimum class size, no aggregation threshold — a
  class of one reports that one student.
- **Free marking tool needs no account at all.** Best single thing to show them.

---

## Do not promise

- **A tutor cannot override a mini-exam mark the app recorded.** They can read
  the script and disagree out loud; the score stands.
- **No admin view across tutors.** Classes live on each tutor's own login. Moving
  one, or switching off a leaver, is you running SQL by hand.
- **No spreadsheet import, no school-system link.** Enrolment is a join code,
  one student at a time.
- **You cannot create accounts for their students.** Students sign up themselves;
  under-16s usually means a parent's email. This is deliberate — it's why you can
  say they aren't handing you a list of children — but it is a real cost on day
  one, and it's the most likely thing to stall the trial in week two.
- **No written-method marking.** It records marks a tutor awards; it never reads
  working.
- **It isn't a whiteboard.** Sits alongside Zoom or Teams, doesn't replace it.
- **No SLA, no insurance, no support line.** Sole trader.

---

## What the student record does

- A tutor sees: display name, year group, join date, skill map, work set, papers
  marked, and **any mini-exam in full — questions and answers**.
- A tutor never sees: email address, password, or a transcript of ordinary
  practice.
- **Joining shares the whole history**, including practice from before they
  joined.
- **If a student deletes their account, the papers you marked go with it.** Their
  record, not your assessment archive.
- Inactive student accounts are deleted after **1 year**.

---

## The trial, mechanically

Free, ~8 weeks, every student in their tutors' classes gets the full paid feature
set. No card. When it lapses the extras stop and **nothing is deleted**.

Setup is manual on your side and the order matters: **they sign up → each tutor
creates their class → you run the grant SQL → students join.** A class created
*after* you run it gets nothing. See `docs/runbooks/tutoring-trial-setup.md`.

Don't commit to a start date on the call without that sequence in mind.

---

## Worth finding out

1. How do they assess now — papers sent back, or worked through live? Decides
   whether marking features at all.
2. 1:1 or small groups?
3. Do they give parents anything written? If yes, the feedback PDF is the hook.
   If no, that part of the pitch is weaker than it looks.
4. Board and tier.
5. Does anyone currently do work between sessions? That's the honest version of
   the retention question — and if the answer is no, the trial can't test it.
6. How many tutors? Each one needs the grant SQL run against their email.

---

## The one thing to be careful about

It's a friendly call, you'll be answering from memory, and goodwill makes it easy
to say yes to things. The product's thin spots are specific and listed above —
reach for those rather than a general "it's early days", which they'll discount.
A trial that quietly disappoints costs a relationship as well as a customer.
