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
