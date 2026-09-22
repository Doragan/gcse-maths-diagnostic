/**
 * The school data protection page.
 *
 * ⚠ THIS PAGE REPLACES A PROCESSOR AGREEMENT THAT SHOULD NEVER HAVE BEEN
 * PUBLISHED. Until 2026-09-17 this route served a full Article 28 Data
 * Processing Agreement naming the School as Controller and Mathsense as its
 * Processor, with a signature block and a Schedule 1 of sub-processors.
 *
 * It described an arrangement this product does not implement. A pupil creates
 * their own Mathsense account; the school cannot create one, cannot read one
 * without the pupil joining a class, and cannot delete one. We are the
 * controller of that account. There is no instruction path by which a school
 * could direct us to process a pupil's data, which is the thing an Article 28
 * agreement exists to govern. See docs/audit/21-school-data-protection-position.md.
 *
 * WHY THIS IS A POSITION STATEMENT AND NOT THE NEW AGREEMENT. The school-facing
 * agreement is docs/legal/dpa-schools.md, which is marked DRAFT and not for
 * signature without legal review. Publishing an unreviewed agreement in place of
 * a wrong one would repeat the mistake in the other direction. This page states
 * the position and invites a school to ask for the agreement.
 *
 * WHY THE ROUTE STAYS ALIVE. app/terms links here, and a school part-way through
 * procurement may hold the link. A 404 would lose them the explanation at the
 * exact moment they need it.
 *
 * NO SUB-PROCESSOR TABLE HERE, DELIBERATELY. The old table listed three
 * providers, omitted Resend, Upstash, Google Analytics and Google sign-in, and
 * gave locations that are not evidenced anywhere in this repository. The
 * privacy notice carries the current list; the full schedule belongs with the
 * agreement, once its locations and transfer mechanisms have been verified
 * rather than recalled.
 */
export default function SchoolDataProtectionPage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <h1 style={styles.title}>Mathsense and school data protection</h1>
          <p style={styles.subtitle}>How pupil data works when a school uses Mathsense</p>
          <p style={styles.meta}>Version 2.0 — Last reviewed: 17 September 2026</p>
        </div>

        <div style={styles.notice}>
          <p style={styles.noticeText}>
            <strong>This replaces version 1.1 of this page</strong>, which was a data
            processing agreement describing Mathsense as a school&rsquo;s data processor.
            That did not describe how Mathsense actually works, and it has been withdrawn.
            If your school holds a copy, please treat this page as superseding it and
            contact us before relying on it.
          </p>
        </div>

        <Section title="1. Why this is not a data processing agreement">
          <P>Most school software is supplied on the basis that the school is the controller and the supplier is its processor: the school decides, and the supplier acts on the school&rsquo;s instruction. Mathsense is not built that way, and it is better to say so plainly than to sign a document describing something the product does not do.</P>
          <P>A Mathsense pupil account is created by the pupil. It exists before any school is involved, and it continues to exist if the school&rsquo;s arrangement ends. A school cannot create one, cannot read one unless the pupil joins a class, and cannot delete one. There is no mechanism by which a school could instruct us to process a pupil&rsquo;s data, which is the thing an Article 28 agreement exists to govern.</P>
        </Section>

        <Section title="2. Who is the controller of what">
          <Ul items={[
            'The pupil account — sign-up, practice, skill mastery. Mathsense is the controller, and the pupil is our data subject.',
            'The class view — a teacher seeing the record of a pupil who joined their class. The pupil authorises the disclosure; we build it; the school uses it.',
            'What the school then does with what it sees, including anything it records in its own systems. The school is the controller of that, and we are not involved.',
          ]} />
          <P>A school&rsquo;s data protection officer may reasonably say: these are our pupils, we told them to use it, and the educational purpose is ours. That argument has real force, and how the roles are best described is a question we are happy to work through with you rather than assert at you. What is not in doubt is the mechanism: the account is the pupil&rsquo;s, and a teacher sees it because the pupil joined their class.</P>
        </Section>

        <Section title="3. What a teacher of your school can see">
          <SubHeading>Disclosed to the teacher of a class the pupil has joined</SubHeading>
          <Ul items={[
            'The pupil’s chosen display name, and their year group if they supplied one.',
            'Their practice record: which maths skills they attempted, whether each attempt was correct, when it happened, and of what kind.',
            'Any mini-exam the pupil sits, including the paper itself and the answers they gave. A mini-exam is assessment rather than private practice, and marking it means reading it.',
            'Work the teacher set for them, and papers the teacher marked for them.',
          ]} />
          <P><strong>The practice record includes private practice.</strong> A pupil&rsquo;s skill map is built from everything they do on Mathsense, not only from work a teacher set, and what a teacher sees is that whole record — including practice done before they joined the class. This is stated in the pupil-facing privacy notice and on the screen where a pupil joins a class. It is drawn to your attention here because it is more than a school might assume.</P>

          <SubHeading>Not disclosed to the teacher</SubHeading>
          <Ul items={[
            'The pupil’s email address. The Mathsense pupil record contains no email address at all — it is held only by our authentication provider and is not reachable by any teacher-facing function. This is a property of the system’s design, not an access rule that could be changed by configuration.',
            'The pupil’s password, which we do not hold in readable form.',
            'For private practice, which individual questions the pupil answered or the answers they gave. The teacher gets the skill map, not a transcript.',
            'Anything about a pupil who is not an active member of that teacher’s class.',
          ]} />
        </Section>

        <Section title="4. Where the data is held">
          <P>Pupil data is held in the United Kingdom and the European Union. The current list of the providers we use, what each one receives, and where it processes it, is in the <a href="/privacy" style={styles.link}>privacy notice</a>. A full sub-processor schedule, with the transfer mechanism for each, comes with the school agreement.</P>
          <P>We will give you reasonable notice of any new sub-processor that would process your pupils&rsquo; data, and you may object.</P>
        </Section>

        <Section title="5. What we commit to">
          <P>We do not claim to be your processor. We do offer the assurances a school would ordinarily obtain from one, because they reflect what we do in any event:</P>
          <Ul items={[
            'Row-level security on every database table, so access is enforced by the database rather than only by application code.',
            'Every cross-account read confined to a server-side route gated on class ownership and active membership, returning named columns only.',
            'Encryption in transit throughout, and at rest by our hosting providers.',
            'Notification of a personal data breach affecting your pupils without undue delay, and in any event within 72 hours of becoming aware of it.',
            'Answers to reasonable written questions about how we handle pupil data, with evidence where we can give it.',
            'Deletion of a named pupil’s account on request. A pupil may also delete their own account at any time, and an account unused for a year is deleted automatically.',
          ]} />
          <P>If your seat arrangement ends, pupil accounts are not deleted and pupils keep their own records. What ends is the additional service you paid for, and the teacher&rsquo;s continued view of their class members.</P>
        </Section>

        <Section title="6. What we do not have">
          <P>We state these rather than leave them to be discovered by a questionnaire.</P>
          <Ul items={[
            'No ISO 27001 and no Cyber Essentials certification.',
            'No independent penetration test.',
            'No statutory data protection officer. Mathsense is a sole trader and is not required to appoint one; the contact below is the route for any data protection question.',
          ]} />
        </Section>

        <Section title="7. If your school needs to be the controller">
          <P>Some schools will require pupils to be enrolled without any pupil action, which means the school is the controller of the account and we are processing on its behalf. That is lawful and ordinary, but it is a different arrangement from the one described above rather than a setting we can switch on, and it would need a different agreement in place before it began.</P>
          <P>If that is what your school needs, tell us and we will work out what it involves rather than quietly treat it as covered by this page.</P>
        </Section>

        <Section title="8. The agreement, and getting in touch">
          <P>There is a school agreement covering the arrangement described here. To ask for a copy, to send us your own questionnaire, or to raise anything on this page, contact us at <a href="mailto:privacy@mathsense.net" style={styles.link}>privacy@mathsense.net</a>.</P>
          <P>Mathsense is operated by Christopher Reay, a sole trader, registered with the Information Commissioner&rsquo;s Office under registration number ZC152231. Our pupil-facing privacy notice is at <a href="/privacy" style={styles.link}>mathsense.net/privacy</a>.</P>
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
    marginBottom: '20px',
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
  notice: {
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '12px',
  },
  noticeText: {
    fontSize: '14px',
    color: '#78350f',
    lineHeight: '1.7',
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
