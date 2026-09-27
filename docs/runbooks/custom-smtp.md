# Runbook — custom SMTP for authentication email

_Written 2026-09-23 around Amazon SES. **Rewritten 2026-09-27 around Brevo,
after AWS refused production access.** Console work; there is no code change in
this._

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

## 1. The sender: Brevo

**Brevo (Paris, France).** A French company storing in the EU. SMTP relay at
`smtp-relay.brevo.com` port 587. Free tier is 300 messages a day, against our
five a month and a worst-case class of thirty.

⚠ **Brevo also requires manual approval for transactional sending**, checked
2026-09-27. There is no self-service switch, they will not activate until a
domain is verified, and it takes one to two business days. An earlier version of
this runbook said Brevo had "no approval process to be refused from". **That was
wrong**, and it was the main practical advantage claimed over SES.

It remains the better bet: a support ticket with a stated turnaround, reviewed
by a company whose business is sending mail for small senders, rather than an
opaque risk assessment with no criteria and no appeal. But it *can* be refused,
so do not treat activation as a formality.

**Better than SES would have been, but not for the reason first claimed.** An
earlier version of this runbook said a French provider "closes" the CLOUD Act
question. **That was wrong**, and reading the sub-processor table below is what
corrected it: Google Cloud and Cloudflare are American companies in Brevo's core
path, so the CLOUD Act reaches them too.

What is genuinely true is narrower and still worth having:

- **Storage is in the EU**, in France and Belgium, rather than the United
  States. An EU-to-UK transfer needs no Standard Contractual Clauses.
- **The contracting party is French**, so the controller relationship is
  governed in the EU rather than by a US entity's terms.
- Against SES, which would have put data in London under a US company, this is
  a lateral move on jurisdiction and a modest gain on contracting party. The
  practical advantages are real but smaller than first claimed: free at this
  volume, and an approval process that states its criteria and its turnaround
  rather than refusing without either.

### Signing up, in the order that works

Activation depends on the domain, so the sequence is not optional.

1. **Sign up free** at brevo.com.
2. **Authenticate the domain.** Settings → Senders, Domains & Dedicated IPs →
   add `mathsense.net`. Publish the records Brevo gives you — same Namecheap
   host-suffix trap as §2, enter only the prefix.
3. **Raise a support ticket from inside the account** asking to activate
   transactional sending. This is the step with no button; it does not happen
   on its own. **Reuse the AWS reply text in §8** — it already answers what
   they will ask: what you send, how often, where addresses come from, and how
   bounces and unsubscribes are handled.
4. **Wait one to two business days.**
5. **Generate credentials.** Settings → SMTP & API. The SMTP **login** is a
   distinct value, not your account email, and the **key** is not your account
   password.

⚠ **The SMTP key is shown in full exactly once, at creation.** Afterwards Brevo
displays only the last few characters. Put it straight into Supabase, or into a
password manager, before leaving the page.

### ✅ Sub-processors, checked rather than assumed — 2026-09-27

Read from Annex 2 of Brevo's terms of service, which embeds the DPA. The page is
~153,000 characters and truncates in most fetchers; it was read in a browser.
**The CLOUD Act flag was justified, and "French company" was not the whole
story.**

Infrastructure sub-processors, the ones that carry email:

| Sub-processor | Role | Company | Servers | Safeguard |
|---|---|---|---|---|
| OVH | Hosting | France | **France** | None needed |
| Google Cloud | Hosting | France | **Belgium** | DPF + SCCs |
| Cloudflare | CDN & WAF | **USA** | USA/EU | DPF + SCCs + Data Localization Suite |
| Zendesk | Support tickets | **USA** | EU/USA | BCR + SCCs |
| Omni | Dashboards | **USA** | EU | DPF + SCCs |

**What we can say:** all storage is in the EU, in France and Belgium.

**What we cannot say:** that there is no US involvement. Google Cloud and
Cloudflare are American companies in the core path. Brevo names them and applies
the Data Privacy Framework and Standard Contractual Clauses, which is the
correct handling, but the CLOUD Act reaches those companies.

**Still clearly better than Resend**, which stores everything in the United
States with no EU option at all. This is a difference in kind, not degree: EU
storage with US infrastructure providers under safeguards, versus US storage.

**Two things that make the paperwork easier than expected.** The DPA is embedded
in the terms rather than a separate document to chase, so signing up gets you
one. And the long tail of US sub-processors — SMS routers, AI providers, the
landing-page builder — are all marked *optional* and engage only if those
features are used. SMTP relay touches none of them.

**Schedule row, when we get there:** Brevo, transactional email, servers in
France and Belgium, noting Google Cloud and Cloudflare as US-domiciled
infrastructure sub-processors covered by the Framework and Standard Contractual
Clauses. An EU-to-UK transfer itself needs no mechanism.

_Why this was checked at all: "French company" is a claim, not a conclusion. The
same assumption about Resend — sending region Ireland, therefore EU — was wrong,
and its storage was in the United States. See `docs/audit/23`._

### Why not SES — recorded so nobody retries it by accident

SES London was the original recommendation and the work was done: an AWS account
created, the domain verified in `eu-west-2`, Easy DKIM 2048, all three CNAMEs
published at Namecheap and confirmed resolving.

**AWS refused production access on 2026-09-27.** They declined to share criteria
and pointed at the Acceptable Use Policy and best-practice docs, so there was
nothing concrete to fix and resubmit. The likely profile is a brand-new AWS
account with no history requesting production access for a stated volume of
about five messages a month.

**The AWS follow-up questions are recorded in §8**, because they are asked
verbatim every time and are worth having if SES is ever retried after the
account has some history.

**Leave the SES DNS in place.** The three DKIM CNAMEs cost nothing, break
nothing, and mean a future retry starts from a verified domain.

---

## 2. DNS, before touching Supabase

Current state, checked 2026-09-23:

| Record | Value | Note |
|---|---|---|
| SPF | `v=spf1 include:_spf.google.com ~all` | Authorises Google Workspace only. **Resend is not in it** and sends on DKIM alone. |
| DKIM | `resend._domainkey` present, plus three SES `_domainkey` CNAMEs | Both already verified; both now unused for auth |
| DMARC | `v=DMARC1; p=none; rua=…` | **Monitoring only** — nothing is rejected on alignment failure |

`p=none` is why this change is low risk: a misconfigured sender degrades
deliverability but cannot get mail rejected outright. It is also why you should
not tighten DMARC until after this is working.

Add, for Brevo:

- the **DKIM record** Brevo generates when you authenticate the domain
- Brevo's **SPF include**, added to the existing record, keeping Google and
  keeping `~all` — **one SPF record only, never two**
- any **domain-verification TXT** record Brevo asks for

⚠ **Namecheap appends the domain to the Host field.** Your DNS is Namecheap
BasicDNS (`dns1/dns2.registrar-servers.com`). If Brevo gives a record name of
`mail._domainkey.mathsense.net`, enter only `mail._domainkey` as the Host.
Pasting the full name produces `…mathsense.net.mathsense.net`, which resolves to
nothing and leaves verification stuck on Pending with no error shown. This is
AWS's own documented gotcha for non-Route53 providers and it applies identically
here.

Wait for Brevo to report the domain authenticated before continuing.

---

## 3. Configure Supabase

Dashboard → **Authentication → SMTP Settings**
(`https://supabase.com/dashboard/project/_/auth/smtp`)

| Field | Value |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username / Password | the **SMTP key** from Brevo, which is not your Brevo account password |
| Sender email | an address on `mathsense.net`, not a Gmail address |
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

Once activated, Brevo has no per-recipient sandbox, so unlike SES this can be
tested against a real outside address immediately.

1. Sign up with an address on a domain **you do not control** — a personal
   address on another provider. Confirm the mail arrives and the link works.
2. Trigger a password reset for the same address.
3. Check the message headers show SPF and DKIM passing.
4. Send a burst: create several accounts inside one hour and confirm none are
   silently dropped. This is the actual thing being fixed and the only step that
   proves it.
5. Check the spam folder on at least one consumer provider. A new sending
   identity has no reputation, and a confirmation email in junk is the same
   outcome as no confirmation email.

---

## 6. Rollback

Clear the SMTP fields in the dashboard and Supabase reverts to its built-in
mailer immediately. No deploy, no code change, no DNS change needed to revert —
leaving the DNS records in place is harmless.

---

## 7. Afterwards

- Add Brevo to the sub-processor schedule in `docs/legal/dpa-schools.md` §7 and
  to `docs/audit/21` §5. The row is drafted in §1 and the checking is done:
  servers in France and Belgium, no transfer mechanism needed for EU-to-UK, and
  Google Cloud and Cloudflare named as US-domiciled infrastructure
  sub-processors under the Framework and Standard Contractual Clauses. Say that
  last part rather than leaving it to be found.
- Update the privacy notice §6, which currently says password resets and
  confirmations are sent by Supabase. After this it is Supabase *through* Brevo.
- Consider moving the two learner-facing crons off Resend to the same sender.
  That would take children's email addresses out of the United States entirely,
  and it is two files. See `docs/audit/21` §5.
- `RESEND_FROM_EMAIL` is **empty in `.env.local`**, so local sends fall back to
  `onboarding@resend.dev`. Check what production actually has set in Vercel; a
  fallback sender in production would be its own small problem.

---

## 8. Appendix — the SES production request, if it is ever retried

Kept because the process is undocumented elsewhere and the questions are asked
verbatim. Superseded by §1; do not work through this unless deliberately
returning to SES.

**Order matters.** Verify the domain *before* requesting production access — AWS
say this speeds approval, and the request cannot be edited while under review.
Sandbox status, verification and credentials are all per-region, so work in
`eu-west-2` throughout.

**Form values:** Transactional (not Marketing), the website URL, contact
addresses that are actually read, English.

**The acknowledgement** commits you to only emailing people who asked, and to
having a bounce and complaint process. The second one is currently Resend's, not
ours, so have the answer ready before ticking it.

**They will always come back for detail**, within hours, asking these four
things verbatim:

1. How often you send email
2. How you maintain your recipient lists
3. How you manage bounces, complaints and unsubscribe requests
4. Examples of the email you plan to send

Answer in that order, under headings. Reply on the existing case; do not open a
new one. What was sent on 2026-09-23, in substance:

- **Identity**: already verified, stated explicitly because their template asks
  regardless.
- **Volume**: 106 accounts, 38 created with email and password since March,
  ~5/month, peak 11 in September, busiest single hour ever 2.
- **The burst**: a class of thirty signing up in a lesson. **Leave this in** — it
  is the answer to why a service sending five emails a month needs production
  access.
- **Lists**: none. Every address self-entered on our own form and confirmed by
  click-through. Nothing purchased, rented, imported or scraped.
- **Bounces and complaints**: account-level suppression on, notifications to a
  monitored mailbox, actioned by hand, proportionate under 200/month.
- **Unsubscribes**: every practice reminder carries a one-click unsubscribe
  (`app/api/email/unsubscribe`, in both `lib/email/reengagement.ts` and
  `lib/email/weeklyNudge.ts`), plus a dashboard toggle. Auth mail carries none
  because it is transactional — say so rather than leaving a gap.

⚠ **Three things deliberately not claimed**, and they should stay unclaimed until
true: automated suppression wired into the app, list hygiene beyond confirmation,
and open or click tracking.

**It was refused anyway**, on 2026-09-27, with no reason given.
