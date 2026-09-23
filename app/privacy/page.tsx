import CookieSettings from '../../components/CookieSettings'

export default function PrivacyNoticePage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <h1 style={styles.title}>Mathsense Privacy Notice</h1>
          <p style={styles.subtitle}>How Mathsense collects, uses and protects your personal data</p>
          <p style={styles.meta}>Version 1.3 — Last reviewed: 23 September 2026</p>
        </div>

        <Section title="1. Who we are">
          <P>Christopher Reay is a sole trader operating the Mathsense service at mathsense.net ("Mathsense", "we", "us"). Mathsense is registered with the Information Commissioner's Office (ICO) as a data controller.</P>
          <P>ICO registration number: ZC152231</P>
          <P>You can contact us about data protection at:<br />
          Email: <a href="mailto:privacy@mathsense.net" style={styles.link}>privacy@mathsense.net</a><br />
          Address: 65 Amherst Road, Fawdon, NE3 2QR</P>
        </Section>

        <Section title="2. Who this notice applies to">
          <P>This privacy notice applies to:</P>
          <Ul items={[
            'Students (learners) who create their own account to practise, and anyone who practises without one',
            'Teachers and school staff who create accounts, classes and assessments',
          ]} />
          <P>Mathsense is intended for users aged 13 and over. If you are under 13, you must not create an account. We treat all learner accounts as potentially belonging to a child under 18 and apply heightened privacy protections accordingly.</P>
        </Section>

        <Section title="3. What data we collect">
          <SubHeading>Teachers</SubHeading>
          <Ul items={[
            'Email address (via account registration)',
            'Payment information (processed securely by Stripe — we do not store card details)',
            'Classes you create, and the work you set and mark',
          ]} />
          <SubHeading>Students</SubHeading>
          <Ul items={[
            'Display name (the name you choose at registration or enter when joining an assessment)',
            'Email address — held by our authentication provider for sign-in and password recovery. It is not stored in your student record, and your teacher cannot see it through Mathsense.',
            'Year group (if provided)',
            'Confirmation that you are aged 13 or over',
            'Your practice record: which maths skills you attempted, whether each attempt was correct, when it happened, and what kind of activity it was. Your skill map is worked out from these.',
            'Mini-exams you sit: the paper itself, the answers you gave, and the score. These are kept so you can re-open a paper and so your progress is comparable over time.',
            'Papers a teacher marks for you, and the marks they entered',
            'Assignments set for you and your attempts at them, and which classes you have joined or left',
            'If you or a parent pays for a subscription: your subscription status, and the reference numbers our payment provider uses to identify the subscription. We never hold your card details.',
          ]} />
          <SubHeading>Automatically collected data</SubHeading>
          <Ul items={[
            'Basic usage logs (collected by Supabase and Vercel for security and performance purposes)',
            'Product analytics we store ourselves: pages viewed and actions taken, recorded against a per-tab session identifier rather than your account',
            'Google Analytics — only if you accept analytics cookies. See below.',
          ]} />
          <P>
            We use Google Analytics to understand how people find and use Mathsense.
            It is loaded <strong>only after you accept analytics cookies</strong>, and not
            at all if you decline or ignore the banner. Declining does not limit anything
            you can do on Mathsense. Google is based in the United States, so accepting
            means some usage data is transferred there.
          </P>
          <P>
            <strong>Advertising.</strong> We advertise Mathsense on Google, and our
            Google Analytics account is linked to our Google Ads account. That means
            the usage data described above can be used by Google to measure and improve
            those adverts. There is no advertising tag on Mathsense, we never send
            Google your practice, your results or your account details, and we do not
            sell your personal data to anyone.
          </P>
          <P>
            All of this depends on accepting analytics cookies. If you decline, or
            ignore the banner, nothing is sent to Google at all, and nothing about
            Mathsense works differently for you.
          </P>
          <SubHeading>Change your choice</SubHeading>
          <P>
            You can turn analytics on or off here at any time, whether or not you have
            an account. Turning it off stops anything further being sent, and deletes
            the cookies Google has already set.
          </P>
          <CookieSettings />
        </Section>

        <Section title="4. Why we collect your data and our legal basis">
          <SubHeading>Teachers</SubHeading>
          <P>We process teacher data on the basis of contract performance (to provide the Mathsense service you have paid for) and legitimate interests (to manage accounts, prevent fraud, and improve the service).</P>
          <SubHeading>Students</SubHeading>
          <P>We process student data on the basis of:</P>
          <Ul items={[
            'Contract performance — to give you the practice, progress tracking and mini-exams the service is made of',
            'Legitimate interests — to let a teacher whose class you have chosen to join see your results, and to maintain the integrity of assessments',
            'Consent — to send you optional practice-reminder emails, only if you opt in. You can withdraw this consent at any time, either from your dashboard settings or via the unsubscribe link in any reminder email.',
          ]} />
          <P>Your practice, your results and your progress are never used for advertising, and we never sell your personal data or share it for marketing. There is one thing to be aware of alongside that: if you accept analytics cookies, website usage data goes to Google and can be used to measure our adverts, as described in section 3. That is usage data only and never your work. The only non-essential emails we send are practice reminders, and only to students who have actively opted in.</P>
        </Section>

        <Section title="5. How we use your data">
          <Ul items={[
            'To give you practice questions, work out your skill map, and show you your progress',
            'To run mini-exams and diagnostics, and display your results',
            'To allow a teacher whose class you have joined to view class and individual results',
            'To maintain your account across sessions',
            'To send password reset emails if requested',
            'To send occasional practice-reminder emails — only if you have opted in, and you can turn these off at any time',
            'To improve the diagnostic algorithm (using anonymised, aggregated data only)',
          ]} />
          <P>We will never sell your personal data to third parties.</P>
        </Section>

        <Section title="6. Who we share your data with">
          <P>We use a small number of trusted third-party services to operate Mathsense:</P>
          <Ul items={[
            'Supabase (database and authentication) — servers in London, United Kingdom',
            'Vercel (website hosting) — servers in London, UK (eu-west-2)',
            'Stripe (payment processing) — receives an email address and payment details when an account is paid for, whether by a teacher, a student, or a parent paying on a student’s behalf. It never receives practice or results data.',
            'Resend (email delivery) — receives an email address when we send you a practice reminder you have opted in to. Resend stores its data in the United States, so that means your address is held there. It never receives your practice or your results. If you have not opted in to reminders, Resend never receives your address at all.',
            'Password reset and sign-up confirmation emails are sent by Supabase, not by Resend, as part of the authentication service above.',
            'Upstash (rate limiting) — servers in London, United Kingdom. Briefly holds your IP address to stop automated abuse of sign-in and class-join endpoints. It is held for minutes, is never linked to your account, and is not used for anything else.',
            'Google sign-in — only if you choose to sign in with Google. Google then knows you use Mathsense, and passes us your email address and the name on your Google account, which we use to pre-fill your display name. You can sign up with an email address and password instead, and nothing about Mathsense works differently if you do. Google is based in the United States.',
            'Google Analytics — only for visitors who accept analytics cookies, and only usage data. Google processes this in the United States. This account is linked to our Google Ads account, so that usage data can also be used to measure our adverts. See section 3.',
          ]} />
          <P>Each of these providers acts as a data processor under a formal data processing agreement. We do not share your data with any other third parties without your consent, unless required by law.</P>
          <P>
            <strong>Teachers and schools.</strong> When you join a class, your teacher can
            see your display name, your year group, and your practice record: which skills
            you have attempted, whether you got each one right, and when. That includes
            practice you do on your own, not only work your teacher sets, and practice you
            did before you joined the class — your skill map is built from everything you
            do, so sharing it shares all of it. They can also see any work they set or mark
            for you.
          </P>
          <P>
            <strong>Mini-exams are different from practice.</strong> If you sit a mini-exam,
            a teacher of your class can open the paper and see every question and the answer
            you gave. A mini-exam is assessment rather than private practice, and marking it
            means reading it. This is the one place the limit below does not apply.
          </P>
          <P>
            They <strong>cannot</strong> see your email address, your password, or — for
            ordinary practice — which individual questions you answered or the answers you
            typed. For practice, your teacher gets your skill map, never a transcript of
            what you wrote.
          </P>
          <P>
            Joining a class is your own choice, and nobody can add you to one. You can
            leave at any time from <em>My classes</em>, which stops the sharing from that
            point on.
          </P>
        </Section>

        <Section title="7. How long we keep your data">
          <Ul items={[
            'Active accounts: data is retained while your account is in use',
            'Inactive student accounts: if you do not sign in or practise for 1 year, we delete the account and everything in it',
            'Deleted accounts: all personal data is permanently deleted within 30 days of account deletion',
            'Payment records: where anyone has paid us — a teacher, a student, or a parent — the record of that payment is retained for 7 years as required by HMRC rules. This is held by us and by our payment provider, and it survives deletion of the account, because we are required to keep it.',
          ]} />
          <P>
            You do not have to wait for that. You can delete your account yourself at any
            time from <em>Account settings</em>, which removes your practice history,
            your progress, and your class memberships permanently.
          </P>
          <P>
            <strong>Deleting your account also cancels any paid subscription</strong>, so
            you will not be charged again. This applies however the subscription was paid
            for, including by a parent. You do not need to cancel it separately first.
          </P>
          <P>
            Before this version of the notice, that was not the case, and a subscription
            could carry on being charged after the account was deleted. If that happened
            to you, email us at <a href="mailto:privacy@mathsense.net" style={styles.link}>privacy@mathsense.net</a> and
            we will cancel it and refund anything taken after the deletion.
          </P>
        </Section>

        <Section title="8. Your rights">
          <P>Under UK GDPR, you have the right to:</P>
          <Ul items={[
            'Access the personal data we hold about you',
            'Correct inaccurate data',
            'Delete your account and all associated data',
            'Restrict how we process your data',
            'Object to processing based on legitimate interests',
            'Data portability (receive your data in a machine-readable format)',
          ]} />
          <P>To exercise any of these rights, contact us at <a href="mailto:privacy@mathsense.net" style={styles.link}>privacy@mathsense.net</a>. We will respond within one month.</P>
          <P>If you are a student aged under 18, a parent or guardian with parental responsibility may also exercise these rights on your behalf.</P>
        </Section>

        <Section title="9. Security">
          <P>We take the security of your data seriously. Our measures include:</P>
          <Ul items={[
            'All data is encrypted in transit (HTTPS/TLS)',
            'Every database table is protected by row-level security, so access is enforced by the database itself rather than only by the website',
            'Authentication is handled by Supabase with industry-standard protections',
            'A teacher can only reach a student’s record through a class they own, and only while that student is an active member of it. Leaving the class ends that access.',
            'Anywhere the site reads across accounts, it runs on our server, checks who is asking, and returns only the named fields it needs',
          ]} />
        </Section>

        <Section title="10. Complaints">
          <P>If you have a concern about how we handle your personal data, please contact us first at <a href="mailto:privacy@mathsense.net" style={styles.link}>privacy@mathsense.net</a> and we will aim to resolve it promptly.</P>
          <P>Our full complaints procedure is available at <a href="/privacy/complaints" style={styles.link}>mathsense.net/privacy/complaints</a>.</P>
          <P>If you are not satisfied with our response, you have the right to lodge a complaint with the Information Commissioner's Office (ICO):</P>
          <Ul items={[
            'Website: ico.org.uk',
            'Helpline: 0303 123 1113',
          ]} />
        </Section>

        <Section title="11. Changes to this notice">
          <P>We may update this privacy notice from time to time. We will notify registered users of any significant changes by email. The current version will always be available at mathsense.net/privacy.</P>
          <SubHeading>What changed in version 1.3 (23 September 2026)</SubHeading>
          <P>We checked where each of the companies in section 6 actually keeps data, rather than relying on what we had written down before. Two things were wrong and one was missing.</P>
          <Ul items={[
            'Resend, which sends our practice reminders, stores its data in the United States. We had not said so. If you have opted in to reminders, it means your email address is held there. It never receives your practice or your results, and if you have not opted in it never receives your address at all.',
            'We had also said Resend sends your password reset and confirmation emails. It does not — those come from Supabase, as part of the sign-in service.',
            'Supabase, our database, is in London. We had described it as “EU West”, which was vaguer than the truth.',
            'Upstash, which does our rate limiting, is in London. We had not said where it was.',
          ]} />
          <P>Taken together: everything we store about you is in the United Kingdom, apart from your email address reaching the United States when we send you a message, and the optional analytics described in section 3.</P>
          <SubHeading>What changed in version 1.2 (22 September 2026)</SubHeading>
          <P>Version 1.1 was written in May 2026 and was not revised while the service changed. This version corrects it. We are recording the changes rather than making them quietly, because one of them tells you something about your data that the previous version got wrong.</P>
          <Ul items={[
            'Mini-exams. Version 1.1 said a teacher can never see the answers you type. That is true of practice and was wrong about mini-exams, which a teacher of your class can open and read in full. Section 6 now says so.',
            'We also now say plainly that a teacher who you share with sees practice from before you joined their class, not only practice since.',
            'Google sign-in is now listed in section 6. It was missing, and it means Google knows you use Mathsense and passes us your name and email address.',
            'Section 3 now lists everything we hold, including mini-exam papers and payment references. The old list was incomplete.',
            'Rate limiting: we now say plainly that this briefly holds your IP address, rather than calling it a request identifier.',
            'Advertising. Version 1.1 said we do not share your data with advertisers. Our Google Analytics account is linked to our Google Ads account, so that was not accurate about website usage data, and sections 3, 4 and 6 now say what actually happens. Your practice and results have never been part of it, and still are not.',
            'Deleting your account now cancels any paid subscription too. Before this version it did not, and a subscription could carry on being charged after the account was gone. Section 7 says what to do if that happened to you.',
            'You can now turn analytics off again after turning it on, using the switch in section 3. Before this version there was no way to change your mind. Declining is also remembered now, instead of the banner asking again on every visit.',
            'Section 9 described access as being limited to the teacher who created an assessment. That was out of date; access now runs through class membership, and section 9 describes what actually happens.',
          ]} />
          <P>Last updated: 23 September 2026</P>
        </Section>

      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div style={styles.sectionBody}>{children}</div>
    </section>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 style={styles.subHeading}>{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={styles.p}>{children}</p>
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={styles.ul}>
      {items.map((item, i) => <li key={i} style={styles.li}>{item}</li>)}
    </ul>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: '#f4f6f8',
    minHeight: '100vh',
    padding: '40px 20px',
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0 0 4px',
  },
  meta: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: 0,
  },
  section: {
    borderTop: '1px solid #e5e5e5',
    padding: '24px 0',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 12px',
  },
  subHeading: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '16px 0 6px',
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  p: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.7',
    margin: '0 0 8px',
  },
  ul: {
    margin: '0 0 8px',
    paddingLeft: '20px',
  },
  li: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.7',
    marginBottom: '4px',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
}
