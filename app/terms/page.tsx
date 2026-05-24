export default function TermsPage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <h1 style={styles.title}>Mathsense Terms of Service</h1>
          <p style={styles.subtitle}>Please read these terms carefully before using Mathsense.</p>
          <p style={styles.meta}>Version 1.0 — Last reviewed: 21 May 2026</p>
        </div>

        <Section title="1. Who we are">
          <P>Mathsense is operated by Christopher Reay, a sole trader. References to &ldquo;Mathsense&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; in these Terms refer to Christopher Reay (trading as Mathsense), 65 Amherst Road, Fawdon, NE3 2QR.</P>
          <P>You can contact us at: <a href="mailto:hello@mathsense.net" style={styles.link}>hello@mathsense.net</a></P>
        </Section>

        <Section title="2. What these Terms cover">
          <P>These Terms of Service govern your use of the Mathsense website and service at mathsense.net. By creating an account or using Mathsense, you agree to these Terms.</P>
          <P>If you are a teacher using Mathsense on behalf of a school or other institution, you agree on your own behalf and as an authorised representative of that institution.</P>
          <P>If you are a student under 18, your parent or guardian should read these Terms.</P>
        </Section>

        <Section title="3. The Mathsense service">
          <P>Mathsense provides:</P>
          <Ul items={[
            'GCSE maths diagnostic assessments, which teachers can create and assign to their classes',
            'A student practice and progress-tracking tool',
            'Class and individual results dashboards for teachers',
          ]} />
          <P>Mathsense is a revision and assessment aid. It is not a substitute for qualified teaching or professional educational advice.</P>
        </Section>

        <Section title="4. Accounts">
          <SubHeading>4.1 Teacher accounts</SubHeading>
          <P>Teacher accounts are for educators who wish to create and manage class diagnostics. To register you must:</P>
          <Ul items={[
            'Be 18 or over',
            'Provide a valid email address',
            'Accept these Terms',
          ]} />

          <SubHeading>4.2 Student accounts</SubHeading>
          <P>Student accounts are for learners who wish to track their progress and use the practice tool. To register you must:</P>
          <Ul items={[
            'Be 13 or over',
            'Provide a valid email address and confirm you meet the age requirement',
            'Accept these Terms',
          ]} />
          <P>Mathsense is not intended for children under 13. If we become aware that an account belongs to a child under 13, we will delete it without notice.</P>

          <SubHeading>4.3 Account security</SubHeading>
          <P>You are responsible for keeping your login credentials secure. Please notify us immediately if you believe your account has been compromised.</P>
        </Section>

        <Section title="5. Teacher responsibilities">
          <P>If you use Mathsense as a teacher, you are responsible for:</P>
          <Ul items={[
            "Ensuring your school or institution's data protection policies permit the use of Mathsense",
            'Informing students that they will be participating in a Mathsense diagnostic',
            'Sharing class codes only with your intended students — codes must not be made publicly available',
            'Complying with the terms of any Data Processing Agreement in place with Mathsense',
          ]} />
        </Section>

        <Section title="6. Acceptable use">
          <P>You agree not to:</P>
          <Ul items={[
            'Use Mathsense in any way that violates applicable law',
            'Share your account credentials with anyone else',
            "Attempt to access another user's account or data",
            'Use automated tools to scrape, copy or extract content from Mathsense',
            'Reverse-engineer or attempt to reproduce the diagnostic algorithm or question content',
            'Use Mathsense for any commercial purpose not expressly permitted by these Terms',
          ]} />
          <P>We reserve the right to suspend or terminate accounts that breach these rules.</P>
        </Section>

        <Section title="7. Subscriptions and payment">
          <SubHeading>7.1 Teacher subscriptions</SubHeading>
          <P>Access beyond the free tier requires a paid teacher subscription. Current pricing is available at mathsense.net/pricing. Payment is processed by Stripe — we do not store card details. Subscriptions are not transferable.</P>

          <SubHeading>7.2 Student subscriptions</SubHeading>
          <P>Some student features require a paid subscription. Current pricing is available at mathsense.net/pricing.</P>

          <SubHeading>7.3 Cancellation and refunds</SubHeading>
          <P>Under the Consumer Contracts Regulations 2013, you have the right to cancel within 14 days of purchase without giving a reason. However, by accessing paid features of Mathsense you expressly request that we begin providing the service immediately. If you cancel within 14 days having already used paid features, you may be charged for the portion of the service already provided.</P>
          <P>To cancel, contact us at <a href="mailto:hello@mathsense.net" style={styles.link}>hello@mathsense.net</a>. We do not offer refunds outside the cooling-off period except where required by law.</P>
        </Section>

        <Section title="8. Intellectual property">
          <P>All Mathsense content — including diagnostic questions, the skill graph, marking algorithms, and design — is owned by or licensed to Christopher Reay. You may not reproduce, distribute or create derivative works from any Mathsense content without prior written permission.</P>
          <P>Your use of Mathsense does not grant you any licence to our intellectual property beyond what is needed to use the service as intended.</P>
        </Section>

        <Section title="9. Availability">
          <P>We aim to keep Mathsense available at all times but do not guarantee uninterrupted access. We may take the service down for maintenance or for reasons outside our control, and will give reasonable notice of planned outages where possible.</P>
        </Section>

        <Section title="10. Limitation of liability">
          <P>To the fullest extent permitted by law:</P>
          <Ul items={[
            'Mathsense is provided "as is". We make no warranties about the accuracy, completeness or fitness for purpose of diagnostic results.',
            'We are not liable for any indirect, consequential or special loss arising from your use of Mathsense.',
            'Our total liability to you shall not exceed the greater of (a) the total amount you have paid us in the 12 months before the claim, or (b) £50.',
          ]} />
          <P>Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud, or any other matter that cannot be excluded by law.</P>
        </Section>

        <Section title="11. Changes to the service and these Terms">
          <P>We may update Mathsense or these Terms from time to time. We will give registered users at least 30 days&apos; notice of significant changes by email. Continued use of Mathsense after a change takes effect constitutes acceptance of the updated Terms.</P>
          <P>If you do not accept a change, you may close your account before it takes effect.</P>
        </Section>

        <Section title="12. Termination">
          <P>We may suspend or terminate your account if you breach these Terms, if we reasonably believe your use is unlawful or harmful, or if a subscription payment fails.</P>
          <P>You may close your account at any time via Account Settings or by contacting us. On termination, your right to use Mathsense ends immediately and we will delete your personal data in accordance with our Privacy Notice.</P>
        </Section>

        <Section title="13. Data protection">
          <P>We handle personal data in accordance with our <a href="/privacy" style={styles.link}>Privacy Notice</a> at mathsense.net/privacy. By using Mathsense, you confirm you have read and understood our Privacy Notice.</P>
          <P>Teachers who use Mathsense to process student data should also refer to the <a href="/dpa" style={styles.link}>Data Processing Agreement</a> at mathsense.net/dpa.</P>
        </Section>

        <Section title="14. Governing law">
          <P>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</P>
        </Section>

        <Section title="15. Contact">
          <Ul items={[
            'Email: hello@mathsense.net',
            'Post: Christopher Reay (trading as Mathsense), 65 Amherst Road, Fawdon, NE3 2QR',
          ]} />
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
