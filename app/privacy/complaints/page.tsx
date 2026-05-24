export default function ComplaintsProcedurePage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <a href="/privacy" style={styles.back}>← Privacy Notice</a>
          <h1 style={styles.title}>Mathsense Data Protection Complaints Procedure</h1>
          <p style={styles.subtitle}>How to raise a concern about how Mathsense handles your personal data</p>
          <p style={styles.meta}>Version 1.1 — Last reviewed: 21 May 2026</p>
        </div>

        <Section title="1. Our commitment">
          <P>Mathsense is operated by Christopher Reay, a sole trader. We are committed to handling your personal data responsibly and in accordance with UK data protection law. If you believe we have not met that commitment, we want to hear from you.</P>
          <P>This procedure is available to all Mathsense users, including students, parents or guardians acting on behalf of a child, and teachers.</P>
        </Section>

        <Section title="2. What counts as a data protection complaint?">
          <P>A data protection complaint is any concern about how Mathsense collects, uses, stores, shares or deletes personal data. Examples include:</P>
          <Ul items={[
            'You believe we are holding data about you that is inaccurate',
            'You asked us to delete your data and we have not done so',
            'You believe your data has been accessed by someone who should not have access to it',
            'You believe we are using your data for a purpose you did not agree to',
            'You made a request to exercise your data rights and did not receive a timely response',
          ]} />
        </Section>

        <Section title="3. How to raise a complaint">
          <SubHeading>Step 1 — Contact us directly</SubHeading>
          <P>In most cases, we can resolve concerns quickly. Please contact us in the first instance:</P>
          <Ul items={[
            'Email: privacy@mathsense.net',
            'Subject line: Data Protection Complaint',
            'Address: 65 Amherst Road, Fawdon, NE3 2QR',
          ]} />
          <P>Please include:</P>
          <Ul items={[
            'Your name and the email address associated with your Mathsense account',
            'A description of your concern',
            'What outcome you are seeking',
          ]} />

          <SubHeading>Step 2 — What happens next</SubHeading>
          <P>We will:</P>
          <Ul items={[
            'Acknowledge your complaint within 5 working days',
            'Investigate your concern thoroughly and fairly',
            'Provide a full written response within one calendar month of receiving your complaint',
          ]} />
          <P>If we need more time (for complex cases), we will inform you within one month and explain why, giving a revised timescale of no more than three months in total.</P>

          <SubHeading>Step 3 — If you are not satisfied</SubHeading>
          <P>If you are unhappy with our response, or if we have not responded within the timeframes above, you have the right to escalate your complaint to the Information Commissioner's Office (ICO), the UK's independent data protection regulator:</P>
          <Ul items={[
            'Website: ico.org.uk/make-a-complaint',
            'Telephone: 0303 123 1113',
            'Post: Information Commissioner\'s Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF',
          ]} />
          <P>There is no charge for making a complaint to the ICO. You do not need to complain to us first before going to the ICO, though we encourage you to do so as we may be able to resolve the matter more quickly.</P>
        </Section>

        <Section title="4. Data subject rights requests">
          <P>If you wish to exercise a specific data right — such as accessing your data, correcting it, or deleting your account — please see our <a href="/privacy" style={styles.link}>Privacy Notice</a>, or email <a href="mailto:privacy@mathsense.net" style={styles.link}>privacy@mathsense.net</a>.</P>
          <P>Rights requests are handled separately from this complaints procedure but subject to the same one-month response timeframe.</P>
        </Section>

        <Section title="5. Record keeping">
          <P>We maintain a record of all data protection complaints received, including the nature of the complaint, our response, and the outcome. This record is kept for 3 years and is used to identify patterns and improve our data handling practices.</P>
          <P>Complaint records are themselves treated as personal data and handled in accordance with our Privacy Notice.</P>
        </Section>

        <Section title="6. Contact for data protection matters">
          <Ul items={[
            'Email: privacy@mathsense.net',
            'Operated by: Christopher Reay (trading as Mathsense)',
            'ICO registration number: ZC152231',
            'Address: 65 Amherst Road, Fawdon, NE3 2QR',
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
  back: {
    fontSize: '14px',
    color: '#2563eb',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '16px',
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
