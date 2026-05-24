export default function DpaPage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <h1 style={styles.title}>Mathsense Data Processing Agreement</h1>
          <p style={styles.subtitle}>Between schools and Mathsense — governing the processing of student personal data</p>
          <p style={styles.meta}>Version 1.1 — Last reviewed: 21 May 2026</p>
        </div>

        <Section title="1. Parties">
          <P>This Data Processing Agreement ("Agreement") is entered into between:</P>
          <Ul items={[
            'The School or educational institution accessing Mathsense ("Controller"); and',
            'Christopher Reay, a sole trader operating under the trading name Mathsense, whose principal address is 65 Amherst Road, Fawdon, NE3 2QR ("Processor").',
          ]} />
          <P>Together referred to as the "Parties".</P>
        </Section>

        <Section title="2. Background">
          <P>The Controller uses the Mathsense platform to administer GCSE maths diagnostic assessments for its students. In doing so, the Processor will process personal data on behalf of the Controller. This Agreement sets out the terms on which that processing will occur, as required by Article 28 of the UK GDPR.</P>
          <P>The Processor is registered with the ICO as a data controller under registration number ZC152231.</P>
        </Section>

        <Section title="3. Definitions">
          <Ul items={[
            '"UK GDPR" means the UK General Data Protection Regulation as it forms part of the law of England and Wales by virtue of the European Union (Withdrawal) Act 2018',
            '"Data Protection Law" means the UK GDPR and the Data Protection Act 2018',
            '"Personal Data" has the meaning given in UK GDPR Article 4',
            '"Processing" has the meaning given in UK GDPR Article 4',
            '"Data Subject" means the students whose personal data is processed under this Agreement',
          ]} />
        </Section>

        <Section title="4. Subject matter and nature of processing">
          <SubHeading>4.1 Purpose</SubHeading>
          <P>The Processor will process Personal Data solely for the purpose of providing the Mathsense diagnostic assessment service to the Controller, including:</P>
          <Ul items={[
            'Storing student display names and assessment participation records',
            'Recording and displaying diagnostic skill results',
            'Enabling teachers to view class and individual results via the dashboard',
          ]} />

          <SubHeading>4.2 Categories of data subjects</SubHeading>
          <P>Students enrolled at the Controller's institution who participate in Mathsense assessments.</P>

          <SubHeading>4.3 Categories of personal data</SubHeading>
          <Ul items={[
            'Student display name',
            'Year group (if provided)',
            'Diagnostic results (skill mastery status)',
            'Assessment participation records',
          ]} />

          <SubHeading>4.4 Duration</SubHeading>
          <P>Processing will continue for the duration of the Controller's active subscription to Mathsense, and for up to 30 days thereafter to allow for data export, unless earlier deletion is requested.</P>
        </Section>

        <Section title="5. Processor obligations">
          <P>The Processor shall:</P>
          <Ul items={[
            'Process Personal Data only on the documented instructions of the Controller, as set out in this Agreement and the Mathsense Terms of Service',
            'Ensure that persons authorised to process the Personal Data are bound by appropriate confidentiality obligations',
            'Implement appropriate technical and organisational measures to protect Personal Data against unauthorised or unlawful processing, accidental loss, destruction or damage',
            'Not engage any sub-processor without prior written authorisation from the Controller, except as set out in Schedule 1',
            'Assist the Controller in responding to Data Subject rights requests, including access, rectification, erasure, and portability requests',
            'Notify the Controller without undue delay (and in any event within 72 hours) upon becoming aware of a Personal Data breach involving the Controller\'s data',
            'Delete or return all Personal Data to the Controller upon termination of this Agreement, at the Controller\'s choice',
            'Make available to the Controller all information necessary to demonstrate compliance with this Agreement',
          ]} />
        </Section>

        <Section title="6. Controller obligations">
          <P>The Controller shall:</P>
          <Ul items={[
            'Ensure it has a lawful basis for sharing student personal data with the Processor',
            'Ensure students (and parents where required) are informed about the use of Mathsense, including by reference to the Mathsense Privacy Notice at mathsense.net/privacy',
            'Only instruct the Processor to process Personal Data in accordance with Data Protection Law',
            'Be responsible for the accuracy of any personal data provided to the Processor',
          ]} />
        </Section>

        <Section title="7. Sub-processors">
          <P>The Controller authorises the Processor to use the sub-processors listed in Schedule 1. The Processor shall ensure each sub-processor is bound by obligations equivalent to those in this Agreement and shall remain liable to the Controller for the acts or omissions of sub-processors.</P>
          <P>The Processor shall provide the Controller with at least 14 days' notice of any intended changes to sub-processors, giving the Controller the opportunity to object.</P>
        </Section>

        <Section title="8. International transfers">
          <P>Some sub-processors may process data outside the UK. Where this occurs, the Processor shall ensure appropriate safeguards are in place in accordance with UK GDPR Chapter V, including the use of UK International Data Transfer Agreements (IDTAs) or equivalent mechanisms.</P>
        </Section>

        <Section title="9. Security measures">
          <P>The Processor implements the following technical and organisational measures:</P>
          <Ul items={[
            'Encryption of all data in transit using TLS',
            'Row-level security policies restricting database access',
            'Role-based access controls limiting access to personal data',
            'Incident response procedures for personal data breaches',
          ]} />
        </Section>

        <Section title="10. Data subject rights">
          <P>Where the Controller receives a Data Subject rights request relating to data processed by the Processor, the Processor shall provide reasonable assistance to enable the Controller to respond within the statutory timeframe. The Processor will provide this assistance at no additional cost unless the volume of requests is disproportionate.</P>
        </Section>

        <Section title="11. Audit">
          <P>The Processor shall, on reasonable notice (not less than 14 days), provide the Controller with information and access reasonably necessary to demonstrate compliance with this Agreement. The Controller may carry out audits no more than once per calendar year unless there are reasonable grounds to suspect non-compliance.</P>
        </Section>

        <Section title="12. Term and termination">
          <P>This Agreement shall remain in force for the duration of the Controller's use of Mathsense. Either party may terminate this Agreement on written notice if the other party materially breaches its obligations and fails to remedy that breach within 30 days of written notice.</P>
          <P>On termination, the Processor shall, at the Controller's written election, either securely delete or return all Personal Data within 30 days.</P>
        </Section>

        <Section title="13. Governing law">
          <P>This Agreement is governed by the laws of England and Wales. The parties submit to the exclusive jurisdiction of the courts of England and Wales.</P>
        </Section>

        <Section title="14. Signatures">
          <SubHeading>Signed on behalf of the Controller:</SubHeading>
          <div style={styles.signatureBlock}>
            <SignatureLine label="Name" />
            <SignatureLine label="Title" />
            <SignatureLine label="Institution" />
            <SignatureLine label="Date" />
          </div>
          <SubHeading>Signed on behalf of the Processor (Mathsense):</SubHeading>
          <div style={styles.signatureBlock}>
            <SignatureLine label="Name" />
            <SignatureLine label="Date" />
          </div>
          <P>To request a signed copy of this agreement, please contact <a href="mailto:privacy@mathsense.net" style={styles.link}>privacy@mathsense.net</a>.</P>
        </Section>

        <Section title="Schedule 1 — Authorised Sub-processors">
          <P>The following sub-processors are authorised as of the date of this Agreement:</P>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Provider</th>
                <th style={styles.th}>Purpose</th>
                <th style={styles.th}>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>Supabase Inc</td>
                <td style={styles.td}>Database hosting and authentication</td>
                <td style={styles.td}>EU West (eu-west-2)</td>
              </tr>
              <tr style={{ background: '#f9fafb' }}>
                <td style={styles.td}>Vercel Inc</td>
                <td style={styles.td}>Website hosting and deployment</td>
                <td style={styles.td}>London, UK (eu-west-2)</td>
              </tr>
              <tr>
                <td style={styles.td}>Stripe Inc</td>
                <td style={styles.td}>Payment processing (teacher accounts only; does not process student data)</td>
                <td style={styles.td}>US</td>
              </tr>
            </tbody>
          </table>
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

function SignatureLine({ label }: { label: string }) {
  return (
    <div style={styles.signatureLine}>
      <span style={styles.signatureLabel}>{label}:</span>
      <span style={styles.signatureDots}>................................................................</span>
    </div>
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
  signatureBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    margin: '8px 0 16px',
  },
  signatureLine: {
    display: 'flex',
    gap: '12px',
    alignItems: 'baseline',
  },
  signatureLabel: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
    minWidth: '80px',
  },
  signatureDots: {
    fontSize: '14px',
    color: '#9ca3af',
    letterSpacing: '0.05em',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
    marginTop: '8px',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    background: '#f3f4f6',
    color: '#111827',
    fontWeight: '600',
    borderBottom: '1px solid #e5e5e5',
  },
  td: {
    padding: '10px 12px',
    color: '#374151',
    borderBottom: '1px solid #e5e5e5',
    verticalAlign: 'top' as const,
  },
}
