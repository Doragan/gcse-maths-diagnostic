# Runbook — custom SMTP for authentication email

_Written 2026-09-23. Console work; there is no code change in this._

## Why

Supabase's built-in mailer sends every confirmation and password reset today, and
it is **capped at 2 messages per hour**. Measured on 2026-09-23, the busiest hour
of email signups this service has ever had was also 2, so the ceiling has never
been hit and the problem is invisible.

A class of thirty signing up in a lesson needs **fifteen hours** to clear that
queue. Two learners get a confirmation email and twenty-eight do not, silently,
with no error anyone sees. That is the scenario the school workstream exists to
support.

It also closes a data protection question. Today Supabase's own infrastructure
sends those emails and **where it sends them from is not established**. With a
custom sender, we choose it and can put it in the schedule.

Evidence and workings: `docs/audit/21` §5.

---

## 1. Choose the sender

**Recommended: Amazon SES in Europe (London), `eu-west-2`.** It puts auth email
in the same region as the database, the hosting and the rate limiter, so every
store of learner data is then in the UK. It is also the cheapest by a distance at
this volume.

⚠ **The catch, and it is the whole reason to do this now rather than with a
school waiting.** A new SES account starts in the **sandbox**, where it will only
send to addresses you have verified. That is the exact failure we are fixing, so
going live mid-sandbox would make things worse rather than better. Production
access is a support request and takes at least a day and can be refused. Raise it
first and configure Supabase only once it is granted.

**Faster alternative: Brevo (France).** EU hosting *and* EU jurisdiction, free
tier well above this volume, SMTP credentials without a sandbox process. Choose
this if the SES sandbox turns into a fight.

---

## 1a. The sandbox request — do this first

> **Status: submitted 2026-09-23, awaiting AWS.** The domain identity
> `mathsense.net` was created in `eu-west-2` and the three Easy DKIM CNAMEs were
> published at Namecheap. All three were confirmed resolving to their
> `.dkim.amazonses.com` targets, with no doubled `mathsense.net.mathsense.net`
> suffix, before the request went in. SPF and DMARC were checked as untouched.
>
> AWS gives an initial response within 24 hours. If it is longer than that, they
> have probably come back with questions — see the drafted answers below.

**Order matters.** AWS states that verifying your domain *before* requesting
production access is a best practice that gets requests approved faster. Do not
submit the request first and verify afterwards.

0. **An AWS account**, if there isn't one. Supabase and Vercel run on AWS but
   they own those accounts, not you.
1. **SES → the `eu-west-2` (London) region.** Sandbox status, verification and
   credentials are all per-region, so work in London throughout or you will
   verify a domain in the wrong place.
2. **Verify the domain** and publish the three DKIM CNAMEs (§2).
3. **Then** request production access.

### Before ticking the acknowledgement

The form makes you confirm two things: that you only email people who asked for
it, and that **you have a process for handling bounces and complaints**. The
first is true. The second is currently handled by Resend, not by you, so decide
what your answer is before you tick it rather than after AWS asks.

An honest and adequate answer at this volume:

> SES account-level suppression is enabled, so hard bounces and complaints are
> suppressed automatically. Bounce and complaint notifications are delivered to a
> monitored mailbox and actioned by hand. Sending is transactional only and under
> 200 messages a month, so manual handling is proportionate. Addresses come only
> from self-service sign-up on our own site, each confirmed by a click-through
> link before any further mail is sent.

Every clause there is true today. Do not promise automated suppression wired into
the app, because that is not built.

### Form values

| Field | Value |
|---|---|
| Mail type | **Transactional** — sign-up confirmations and password resets, one-to-one and user-triggered |
| Website URL | `https://mathsense.net` |
| Additional contacts | a mailbox actually read, not a no-reply |
| Language | English |

AWS gives an initial response within 24 hours, and longer if they come back for
more. **You cannot edit the details while it is under review**, which is the
other reason to verify the domain first.

### They will ask for more detail — this is what they ask

**They did, on 2026-09-23, within hours of submission.** Treat the follow-up as
the normal path rather than the exception, and expect these four questions
verbatim:

1. How often you send email
2. How you maintain your recipient lists
3. How you manage bounces, complaints and unsubscribe requests
4. Examples of the email you plan to send

Answer them **in that order, under headings**, so a reviewer can tick them off.
Reply on the existing support case; do not open a new one.

What was sent on 2026-09-23, in substance:

- **Identity**: `mathsense.net` already verified in `eu-west-2`, Easy DKIM 2048,
  all three CNAMEs resolving. Their reply asks about this even when it is
  already done, so state it.
- **Volume**: 106 accounts, 38 created with email and password since March,
  averaging ~5/month, peak 11 in September, busiest single hour ever 2. Under
  200 messages a month expected.
- **The burst**: a class signing up together in a lesson, perhaps 30 at once.
  **Leave this in.** It is the answer to the obvious reviewer question of why a
  service sending five emails a month needs production access.
- **Lists**: there are none. Every address is self-entered on our own form and
  confirmed by click-through. Nothing purchased, rented, imported or scraped.
- **Bounces and complaints**: account-level suppression on; notifications to a
  monitored mailbox, actioned by hand; proportionate under 200/month, with
  automation if volume grows.
- **Unsubscribes**: every practice reminder carries a one-click unsubscribe
  (`app/api/email/unsubscribe`, built into both `lib/email/reengagement.ts` and
  `lib/email/weeklyNudge.ts`), plus a dashboard toggle. Auth mail carries none
  because it is transactional — say so explicitly rather than leaving a gap.

⚠ **Three things deliberately NOT claimed**, and they should stay unclaimed
until they are true: automated suppression wired into the app, any list-hygiene
process beyond confirmation, and open or click tracking. Every factual claim in
the reply was verified in the code first — the unsubscribe route and both
builders were checked before being described to AWS.

The original pre-drafted text, kept because it is a usable short form:

> Mathsense is a GCSE maths practice service used by learners aged 13 and over,
> who create their own accounts on mathsense.net. SES would send only
> transactional mail generated by the platform: sign-up confirmation, password
> reset, and occasional service notices such as a change to the privacy notice.
> There is no marketing list and no purchased or imported addresses. Expected
> volume is well under 200 messages a month, with occasional short bursts when a
> class signs up together. We currently send through another provider and are
> moving in order to keep data in the UK.

### What you can do while still in the sandbox

The sandbox is not useless. It allows 200 messages per 24 hours, at one a second,
**to verified addresses only**. That is enough to verify your own address and
test the whole path — DNS, credentials, Supabase config, template rendering —
before production access lands. Do that, so approval is the only thing standing
between you and a working sender.

⚠ **Do not point Supabase at SES while still sandboxed.** Learners' addresses are
not verified identities, so their confirmation emails would fail. That is worse
than the 2/hour cap you are fixing.

**Do not point it at Resend**, even though it would work in five minutes and the
DKIM record already exists. Resend stores in the United States, and today it only
ever sees learners who opted in to reminders. Routing auth through it would hand
it every learner's address instead.

---

## 2. DNS, before touching Supabase

Current state, checked 2026-09-23:

| Record | Value | Note |
|---|---|---|
| SPF | `v=spf1 include:_spf.google.com ~all` | Authorises Google Workspace only. **Resend is not in it** and sends on DKIM alone. |
| DKIM | `resend._domainkey` present | Resend already verified |
| DMARC | `v=DMARC1; p=none; rua=…` | **Monitoring only** — nothing is rejected on alignment failure |

`p=none` is why this change is low risk: a misconfigured sender degrades
deliverability but cannot get mail rejected outright. It is also why you should
not tighten DMARC until after this is working.

Add, for SES:

- the three **DKIM CNAME** records SES generates for the domain
- `include:amazonses.com` to the existing SPF record, keeping Google and keeping
  `~all` — one SPF record only, never two
- optionally a **custom MAIL FROM** subdomain, which improves alignment

Wait for SES to report the domain verified before continuing.

---

## 3. Configure Supabase

Dashboard → **Authentication → SMTP Settings**
(`https://supabase.com/dashboard/project/_/auth/smtp`)

| Field | Value |
|---|---|
| Host | the regional SES SMTP endpoint for `eu-west-2` |
| Port | `587` |
| Username / Password | **SES SMTP credentials**, which are generated in SES and are *not* your AWS access keys |
| Sender email | an address on the sending domain, not a Gmail address |
| Sender name | Mathsense |

---

## 4. ⚠ Raise the rate limit — the step that gets missed

Configuring SMTP does **not** lift the cap to unlimited. It moves it from 2 per
hour to **30 per hour**, and the real ceiling lives on a different page:

Dashboard → **Authentication → Rate Limits**
(`https://supabase.com/dashboard/project/_/auth/rate-limits`)

Thirty an hour is *exactly* a class of thirty. Leaving it there means the school
scenario still fails, just less obviously. Raise it to something that clears a
full class with headroom.

Stopping after step 3 is the most likely way this job goes wrong.

---

## 5. Test, and do not skip this

1. Sign up with an address on a domain **you do not control and which is not on
   the Supabase team** — a personal address on another provider. Confirm the mail
   arrives and the link works.
2. Trigger a password reset for the same address.
3. Check the message headers show SPF and DKIM passing.
4. Send a burst: create several accounts inside one hour and confirm none are
   silently dropped. This is the actual thing being fixed and the only step that
   proves it.

---

## 6. Rollback

Clear the SMTP fields in the dashboard and Supabase reverts to its built-in
mailer immediately. No deploy, no code change, no DNS change needed to revert —
leaving the DNS records in place is harmless.

---

## 7. Afterwards

- Add the chosen sender to the sub-processor schedule in
  `docs/legal/dpa-schools.md` §7 and to `docs/audit/21` §5, with its location and
  transfer mechanism. If it is SES London, the location is the UK and there is no
  transfer to declare.
- Update the privacy notice: §6 currently says password resets and confirmations
  are sent by Supabase. After this it is Supabase *through* the named sender.
- `RESEND_FROM_EMAIL` is **empty in `.env.local`**, so local sends fall back to
  `onboarding@resend.dev`. Check what production actually has set in Vercel; a
  fallback sender in production would be its own small problem.
