export default function PrivacyNoticePage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <h1 style={styles.title}>Mathsense Privacy Notice</h1>
          <p style={styles.subtitle}>How Mathsense collects, uses and protects your personal data</p>
          <p style={styles.meta}>Version 1.1 — Last reviewed: 21 May 2026</p>
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
            'Teachers and school staff who create accounts and assessments',
            'Students (learners) who create accounts or complete assessments',
          ]} />
          <P>Mathsense is intended for users aged 13 and over. If you are under 13, you must not create an account. We treat all learner accounts as potentially belonging to a child under 18 and apply heightened privacy protections accordingly.</P>
        </Section>

        <Section title="3. What data we collect">
          <SubHeading>Teachers</SubHeading>
          <Ul items={[
            'Name and email address (via account registration)',
            'School or institution name',
            'Payment information (processed securely by Stripe — we do not store card details)',
            'Assessment data you create',
          ]} />
          <SubHeading>Students</SubHeading>
          <Ul items={[
            'Display name (the name you choose at registration or enter when joining an assessment)',
            'Email address (for account registration and password recovery)',
            'Year group (if provided)',
            'Confirmation that you are aged 13 or over',
            'Diagnostic results: which maths skills are mastered or need practice',
            'Assessment participation records',
          ]} />
          <SubHeading>Automatically collected data</SubHeading>
          <Ul items={[
            'Basic usage logs (collected by Supabase and Vercel for security and performance purposes)',
          ]} />
          <P>We do not use tracking cookies, advertising pixels, or behavioural analytics.</P>
        </Section>

        <Section title="4. Why we collect your data and our legal basis">
          <SubHeading>Teachers</SubHeading>
          <P>We process teacher data on the basis of contract performance (to provide the Mathsense service you have paid for) and legitimate interests (to manage accounts, prevent fraud, and improve the service).</P>
          <SubHeading>Students</SubHeading>
          <P>We process student data on the basis of:</P>
          <Ul items={[
            'Contract performance — to deliver the diagnostic assessment service to you',
            'Legitimate interests — to enable teachers to view class results and to maintain the integrity of assessments',
          ]} />
          <P>We do not use student data for advertising, marketing, or any commercial purpose beyond delivering the core service.</P>
        </Section>

        <Section title="5. How we use your data">
          <Ul items={[
            'To run the GCSE maths diagnostic and display your results',
            'To allow teachers to view class and individual results',
            'To maintain your account across sessions',
            'To send password reset emails if requested',
            'To improve the diagnostic algorithm (using anonymised, aggregated data only)',
          ]} />
          <P>We will never sell your personal data to third parties.</P>
        </Section>

        <Section title="6. Who we share your data with">
          <P>We use a small number of trusted third-party services to operate Mathsense:</P>
          <Ul items={[
            'Supabase (database and authentication) — servers in EU West (eu-west-2)',
            'Vercel (website hosting) — servers in London, UK (eu-west-2)',
            'Stripe (payment processing for teacher accounts) — does not process student data',
          ]} />
          <P>Each of these providers acts as a data processor under a formal data processing agreement. We do not share your data with any other third parties without your consent, unless required by law.</P>
        </Section>

        <Section title="7. How long we keep your data">
          <Ul items={[
            'Active accounts: data is retained while your account is active',
            'Student diagnostic results: retained for 1 year after last login, then deleted',
            'Deleted accounts: all personal data is permanently deleted within 30 days of account deletion',
            'Teacher payment records: retained for 7 years as required by HMRC rules',
          ]} />
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
            'Database access is protected by row-level security policies',
            'Authentication is handled by Supabase with industry-standard protections',
            'Access to student data is restricted to the teacher who created the relevant assessment',
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
          <P>Last updated: 21 May 2026</P>
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
