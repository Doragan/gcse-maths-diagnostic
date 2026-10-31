'use client'

import Link from 'next/link'
import SiteNav from '../../components/SiteNav'
import { colors, font, radius } from '../../lib/styles'

// ─────────────────────────────────────────────────────────────────────────────
// The tutor/teacher quick start.
//
// WHY A PAGE AND NOT A PDF. The point is the anchors. Every section here is a
// question someone asks while looking at a specific screen, so the screens can
// link straight to the answer — /guide#invite beside the invite box,
// /guide#sessions on the session page, /guide#marks above the marking grid.
// A document you email is read once, if at all; a link is read at the moment
// of confusion. Keep the ids stable: they are the API of this page.
//
// EVERY CLAIM HERE WAS CHECKED AGAINST THE CODE on 2026-10-27, not written
// from how the features are meant to work. Several were wrong the first time
// (see docs/guides/tutor-guide.md's history). The ones most likely to rot:
//
//   • the 6-hour session expiry      supabase/migrations/20261020_class_sessions.sql
//   • blank === zero                 lib/papers/feedbackEvidence.ts (`marks[q.id] ?? 0`)
//   • five attempts for needs_practice  lib/skills/masteryEngine.ts
//   • which papers carry retrySet    lib/demoPapers/* — 10 of 66 today
//
// If you change one of those, change it here too.
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'setup', n: '1', label: 'Set yourself up' },
  { id: 'students', n: '2', label: 'Get your students in' },
  { id: 'answering', n: '3', label: 'Get them answering questions' },
  { id: 'marking', n: '4', label: 'Mark a paper' },
  { id: 'progress', n: '5', label: 'See how they’re doing' },
  { id: 'reference', n: '', label: 'Quick reference' },
]

const page: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  background: '#f8fafc',
  minHeight: '100dvh',
  color: colors.textPrimary,
}

const wrap: React.CSSProperties = {
  maxWidth: '760px',
  margin: '0 auto',
  padding: '0 24px 80px',
}

const h2: React.CSSProperties = {
  fontSize: font['2xl'],
  fontWeight: '700',
  letterSpacing: '-0.01em',
  margin: '48px 0 4px',
  scrollMarginTop: '76px',
}

const h3: React.CSSProperties = {
  fontSize: font.lg,
  fontWeight: '700',
  margin: '28px 0 8px',
  scrollMarginTop: '76px',
}

const p: React.CSSProperties = {
  fontSize: font.md,
  lineHeight: '1.65',
  color: colors.textPrimary,
  margin: '0 0 14px',
}

const cardBox: React.CSSProperties = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  padding: '20px 22px',
  margin: '0 0 16px',
}

const noteBox: React.CSSProperties = {
  ...cardBox,
  background: colors.warningLight,
  border: `1px solid ${colors.warningBorder}`,
  padding: '14px 18px',
}

const tipBox: React.CSSProperties = {
  ...cardBox,
  background: '#eff6ff',
  border: `1px solid #bfdbfe`,
  padding: '14px 18px',
}

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: font.base,
  margin: '0 0 18px',
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  overflow: 'hidden',
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: `1px solid ${colors.border}`,
  background: colors.cardAlt,
  fontWeight: '700',
  fontSize: font.sm,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: colors.textSecondary,
}

const td: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: `1px solid ${colors.border}`,
  verticalAlign: 'top',
  lineHeight: '1.55',
}

const li: React.CSSProperties = {
  fontSize: font.md,
  lineHeight: '1.65',
  margin: '0 0 8px',
}

/** A step number + its instruction, so the eye can find its place again. */
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '12px', margin: '0 0 12px', alignItems: 'baseline' }}>
      <span style={{
        flex: '0 0 auto',
        width: '22px', height: '22px',
        borderRadius: radius.full,
        background: colors.primary,
        color: '#fff',
        fontSize: '11px',
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>{n}</span>
      <span style={{ fontSize: font.md, lineHeight: '1.6' }}>{children}</span>
    </div>
  )
}

function Where({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: font.base,
      fontWeight: '600',
      color: colors.textSecondary,
      background: colors.cardAlt,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.sm,
      padding: '8px 12px',
      margin: '0 0 14px',
    }}>{children}</p>
  )
}

/**
 * A screenshot of a real screen. Captured from the live site with invented
 * student names — NEVER a real pupil's name or email: this page is public.
 */
function Figure({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure style={{ margin: '0 0 18px' }}>
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%', height: 'auto', display: 'block',
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
          background: colors.card,
        }}
      />
      <figcaption style={{
        fontSize: font.base, color: colors.textSecondary,
        margin: '8px 2px 0', lineHeight: '1.5',
      }}>{caption}</figcaption>
    </figure>
  )
}

export default function GuidePage() {
  return (
    <div style={page}>

      <SiteNav audience="teacher" />

      <div style={wrap}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header style={{ padding: '48px 0 8px' }}>
          <h1 style={{ fontSize: font['3xl'], fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            Quick start
          </h1>
          <p style={{ ...p, fontSize: font.lg, color: colors.textSecondary, margin: 0 }}>
            For tutors and teachers. About 15 minutes to get a student working.
          </p>
        </header>

        <div style={tipBox}>
          <p style={{ ...p, margin: 0 }}>
            <strong>Want to try something before signing up for anything?</strong>{' '}
            Take a paper you’ve already marked, type the marks into{' '}
            <Link href="/mark" style={{ color: colors.primary, fontWeight: '600' }}>the marking tool</Link>,
            and it’ll tell you which skills those dropped marks point at. No account, nothing to cancel.
          </p>
        </div>

        {/* ── Contents ───────────────────────────────────────────────────── */}
        <table style={table}>
          <tbody>
            {SECTIONS.map(s => (
              <tr key={s.id}>
                <td style={{ ...td, width: '34px', color: colors.textHint, fontWeight: '700' }}>{s.n}</td>
                <td style={td}>
                  <a href={`#${s.id}`} style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}>
                    {s.label}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ ...p, color: colors.textSecondary }}>
          Parts 1 to 3 go together. Part 4 works on its own and needs no account.
        </p>

        {/* ── 1. Setup ───────────────────────────────────────────────────── */}
        <h2 id="setup" style={h2}>1 · Set yourself up</h2>

        <h3 style={h3}>Create your account</h3>
        <p style={p}>
          Go to <Link href="/auth" style={{ color: colors.primary, fontWeight: '600' }}>the sign-up page</Link> and
          use an email address and password, or <strong>Sign in with Google</strong>.
        </p>

        <h3 style={h3}>Create a class</h3>
        <Where>Dashboard → Classes → New class</Where>
        <p style={p}>
          Give it a name — “Year 10 Tuesday”, “GCSE Higher group”, anything — and press <strong>Create</strong>.
        </p>

        <h3 id="one-to-one" style={h3}>If you teach one-to-one, read this bit</h3>
        <div style={noteBox}>
          <p style={{ ...p, margin: '0 0 10px' }}>
            <strong>Make one class per student, named after the student.</strong>
          </p>
          <p style={{ ...p, margin: '0 0 10px' }}>
            It looks strange, and you’d be forgiven for putting all eight of your individual
            students into one class called “My students”. That reports the wrong thing, and it
            won’t warn you.
          </p>
          <p style={{ ...p, margin: 0 }}>
            Here’s why: you can tick off the topics you’ve taught, and progress is measured
            against that list — but <strong>the list belongs to the class, not the student</strong>.
            Eight students in one class share a single list, so their percentages end up measured
            against topics most of them have never been taught.
          </p>
        </div>

        {/* ── 2. Students ────────────────────────────────────────────────── */}
        <h2 id="students" style={h2}>2 · Get your students in</h2>
        <p style={p}>
          Two ways in. Email invitations are better if you want to know who hasn’t joined yet;
          otherwise either is fine.
        </p>

        <h3 id="invite" style={h3}>Option A · Invite by email</h3>
        <Where>Your class → People → Invite by email</Where>
        <Step n={1}>Paste in the email addresses — commas, spaces, or one per line.</Step>
        <Step n={2}>Press <strong>Invite</strong>.</Step>
        <Step n={3}>Each student gets an email with a link. They click it, choose their own password, and accept.</Step>
        <Step n={4}>You’ll see <strong>Invited (3 of 8 joined)</strong>, so you always know who still needs a nudge.</Step>

        <Figure
          src="/guide/invite-roster.png"
          alt="The invite box above a roster: three addresses marked Joined, five marked Invited, not joined yet, each with Send again and Withdraw buttons."
          caption="The roster after inviting eight. The five who haven’t joined keep a Send again button, which is the whole point of inviting by email rather than handing out a code."
        />

        <h3 id="code" style={h3}>Option B · Give out the class code</h3>
        <Where>Your class → People → Join code</Where>
        <p style={p}>It’s four characters, like <code>MX4T</code>.</p>
        <Step n={1}>
          Send your students to <strong>mathsense.net/student?mode=signup</strong> to create an account.
        </Step>
        <Step n={2}>Once they’re in, they go to <strong>My classes</strong> and type the code.</Step>
        <div style={tipBox}>
          <p style={{ ...p, margin: 0 }}>
            Keep the <code>?mode=signup</code> on the end of that link. Without it they land on a
            login page, and the sign-up link sits underneath where most people don’t spot it.
          </p>
        </div>

        <h3 style={h3}>Three things worth knowing before you invite a group</h3>
        <ul style={{ paddingLeft: '20px', margin: '0 0 14px' }}>
          <li style={li}>
            <strong>Inviting doesn’t create accounts.</strong> Students sign up themselves and
            accept. That’s deliberate — it’s what makes the account theirs, and it’s why we can’t
            hand you a list of ready-made logins.
          </li>
          <li style={li}><strong>They can use any email address</strong>, not only the one you invited.</li>
          <li style={li}><strong>For anyone under 16</strong>, invite a parent’s address and let them pass the link on.</li>
        </ul>

        {/* ── 3. Answering ───────────────────────────────────────────────── */}
        <h2 id="answering" style={h2}>3 · Get them answering questions</h2>
        <p style={p}>Three ways. You don’t have to choose — most tutors use all three.</p>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Way in</th>
              <th style={th}>Who needs an account</th>
              <th style={th}>Saved?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}><a href="#sessions" style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}>Run a session</a></td>
              <td style={td}>Just you</td>
              <td style={td}>No</td>
            </tr>
            <tr>
              <td style={td}><a href="#practice" style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}>Let them practise</a></td>
              <td style={td}>Both of you</td>
              <td style={td}>Yes</td>
            </tr>
            <tr>
              <td style={td}><a href="#assignments" style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}>Set them work</a></td>
              <td style={td}>Both of you</td>
              <td style={td}>Yes</td>
            </tr>
          </tbody>
        </table>

        <h3 id="sessions" style={h3}>A · Run a session — nobody has to sign up</h3>
        <p style={p}>
          The fastest way to see it working, and the easiest thing to put in front of a student
          who doesn’t want an account.
        </p>
        <Where>Dashboard → Run a lesson → Start a session</Where>
        <p style={p}>
          Choose the qualification and how many questions each, then <strong>Start session</strong>.
          You get a short code. They go to <strong>mathsense.net/s</strong> and type the code and a
          first name — no email, no password, nothing to install. You watch their answers come in,
          right and wrong, as they work.
        </p>

        <Figure
          src="/guide/session-code.png"
          alt="A session screen showing the address mathsense.net/s in large type, a four-character code, a projector view button, and empty Progress and Where the class is struggling panels."
          caption="What you see the moment a session starts. Open projector view puts the code on a screen; the panels below fill as pupils answer."
        />
        <div style={noteBox}>
          <p style={{ ...p, margin: '0 0 10px' }}><strong>Two time limits.</strong></p>
          <p style={{ ...p, margin: '0 0 10px' }}>
            The session <strong>stops accepting answers 6 hours after you start it</strong>, so a
            9am session is dead by 3pm. Just start a new one.
          </p>
          <p style={{ ...p, margin: 0 }}>
            Everything is <strong>deleted the same evening</strong>. Excellent for a lesson, no use
            at all as a record.
          </p>
        </div>

        <h3 id="practice" style={h3}>B · Let them practise — the one that matters</h3>
        <p style={p}>
          Once a student is in your class they can just use it: pick a skill or a topic, answer
          questions, and get the answer explained whenever they’re wrong. Nothing for you to set up.
        </p>
        <p style={p}>
          <strong>This is what most students do most of the time, and it’s what builds the skill
          map</strong> you’ll be looking at in part 5. If you do one thing after they join, it’s
          this: tell them to go and practise something.
        </p>

        <h3 id="assignments" style={h3}>C · Set them specific work</h3>
        <Where>Dashboard → Assignments → Create</Where>
        <table style={table}>
          <tbody>
            <tr><td style={{ ...td, fontWeight: '600', width: '170px' }}>Details</td><td style={td}>Name it, and say when it’s due</td></tr>
            <tr><td style={{ ...td, fontWeight: '600' }}>Questions</td><td style={td}>Choose what’s on it</td></tr>
            <tr><td style={{ ...td, fontWeight: '600' }}>Completion rules</td><td style={td}>What counts as finished</td></tr>
            <tr><td style={{ ...td, fontWeight: '600' }}>Assign to</td><td style={td}>Who gets it</td></tr>
          </tbody>
        </table>
        <p style={p}>
          Then press <strong>Create assignment</strong>. Worth it when you want everyone doing the
          same thing — not worth bothering with in the first week.
        </p>

        {/* ── 4. Marking ─────────────────────────────────────────────────── */}
        <h2 id="marking" style={h2}>4 · Mark a paper</h2>
        <p style={p}>
          The part closest to a marks spreadsheet, and it needs no account at all.
        </p>

        <h3 style={h3}>What it does, and what it doesn’t</h3>
        <p style={p}>
          <strong>It doesn’t mark anything.</strong> There’s no question text, no answers and no
          mark scheme in here. <strong>You mark the paper yourself, exactly as you do now.</strong>
        </p>
        <p style={p}>
          What it has is every question of 66 past papers tagged with the skills it tests — all
          2,466 of them, read and coded by hand. So when you type in the marks, it can tell you the
          thing the marks alone can’t: <strong>which skills those dropped marks point at.</strong>
        </p>

        <h3 style={h3}>Step by step</h3>
        <Step n={1}><strong>Choose the paper.</strong> 66 of them — AQA, Edexcel and OCR, both tiers, back to 2023.</Step>
        <Step n={2}><strong>Leave “They sat the whole paper” ticked</strong>, unless they only did part of it.</Step>
        <Step n={3}><strong>Paste your student names</strong>, one per line, then <strong>Add these students</strong>.</Step>
        <Step n={4}><strong>Type the marks in.</strong> Hover a question number to see which skill it tests.</Step>
        <Step n={5}><strong>Watch “The class so far” build as you type.</strong> Nothing to press.</Step>
        <Step n={6}><strong>Press “Get feedback sheets”</strong> for a PDF, one sheet per student.</Step>

        <Figure
          src="/guide/feedback-sheet.png"
          alt="A feedback sheet for one student: name, score out of 80, a What went well list, an Even better if list naming specific skills, and a Practise these section with questions to try."
          caption="One student’s sheet. What went well and Even better if are worked out from the skills behind the marks; the practice questions are the ones they dropped marks on. Most sheets fit a page — a strong paper with a stretch question added can run to two."
        />

        <div style={tipBox}>
          <p style={{ ...p, margin: 0 }}>
            Prefer a spreadsheet? <strong>Download CSV template</strong> gives you one with the
            question numbers and marks already in it. Fill it in, then <strong>Import marks from CSV</strong>.
          </p>
        </div>

        <p style={p}>
          Step 5 gives you the average, median, highest and lowest, a breakdown by topic, and — the
          useful one — <strong>Questions to revisit</strong>, ordered so the biggest lesson is at
          the top. That part is yours; it never appears on a student’s sheet.
        </p>

        <Figure
          src="/guide/questions-to-revisit.png"
          alt="The class summary: a bar per topic, then Questions to revisit listing each question with the marks the class lost."
          caption="What you get while you type — the sample names here are invented. Questions to revisit is ordered by marks lost, so the first row is the lesson to reteach."
        />

        <h3 id="marks" style={h3}>Three things to know</h3>
        <div style={noteBox}>
          <p style={{ ...p, margin: '0 0 10px' }}>
            <strong>Blank and zero are the same thing.</strong> Leaving a box empty doesn’t take the
            question out — it still counts as nought out of whatever it was worth. To genuinely
            leave questions out, untick <strong>They sat the whole paper</strong> and deselect them.
          </p>
          <p style={{ ...p, margin: '0 0 10px' }}>
            <strong>Nothing is saved.</strong> It all lives in that browser tab and vanishes when
            you close it. Download the PDF first.
          </p>
          <p style={{ ...p, margin: 0 }}>
            <strong>For your first go, pick an AQA June 2025 paper.</strong> Those sheets come with
            practice questions to hand out. Most papers don’t have them yet — they’re written by
            hand, and that’s how far we’ve got.
          </p>
        </div>

        <h3 style={h3}>Making it count towards their skill map</h3>
        <Where>Your class → Papers → Record a marked paper</Where>
        <p style={p}>
          Same grid, but it saves, and each student’s skill map updates —{' '}
          <strong>full marks counts as secure, and a dropped mark never pulls a skill down.</strong>{' '}
          A bad morning can’t undo a term’s evidence.
        </p>

        {/* ── 5. Progress ────────────────────────────────────────────────── */}
        <h2 id="progress" style={h2}>5 · See how they’re doing</h2>
        <Where>Dashboard → Your students</Where>
        <table style={table}>
          <tbody>
            <tr>
              <td style={{ ...td, fontWeight: '600', width: '140px' }}>mastered</td>
              <td style={td}>Skills they’ve shown they can do</td>
            </tr>
            <tr>
              <td style={{ ...td, fontWeight: '600' }}>to work on</td>
              <td style={td}>Skills they’ve had a proper go at and aren’t getting right yet</td>
            </tr>
          </tbody>
        </table>
        <p style={p}>
          Sort by <strong>Quietest first</strong> to find whoever has drifted — usually more useful
          than finding whoever is struggling loudly, because they’ll tell you themselves. Tap any
          student for the full breakdown.
        </p>

        <Figure
          src="/guide/your-students.png"
          alt="A list of students, each row showing a name, when they were last active, and three figures: mastered, to work on, and questions this week."
          caption="One row per student, sorted by who has most to work on. The names here are invented."
        />
        <div style={noteBox}>
          <p style={{ ...p, margin: 0 }}>
            <strong>“To work on” needs five attempts</strong> at a skill before it says anything.
            Below that it sits quietly as “in progress”. So the number barely moves at first —
            that’s normal, not a sign nothing is happening.
          </p>
        </div>

        <h3 id="topics-covered" style={h3}>Once you’re past the first week</h3>
        <p style={p}>
          Open a class and there’s more: mastery by topic, progress over time, and{' '}
          <strong>Topics covered</strong> — tick off what you’ve actually taught, and progress is
          measured against that instead of the whole GCSE. Worth doing, or the percentages look
          bleak for no good reason.
        </p>

        {/* ── Reference ──────────────────────────────────────────────────── */}
        <h2 id="reference" style={h2}>Quick reference</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Where</th>
              <th style={th}>What it’s for</th>
              <th style={th}>Sign in?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}><Link href="/mark" style={{ color: colors.primary, fontWeight: '600' }}>mathsense.net/mark</Link></td>
              <td style={td}>Mark a paper, get feedback sheets</td>
              <td style={td}>No</td>
            </tr>
            <tr>
              <td style={td}><Link href="/auth" style={{ color: colors.primary, fontWeight: '600' }}>mathsense.net/auth</Link></td>
              <td style={td}>Your account</td>
              <td style={td}>—</td>
            </tr>
            <tr>
              <td style={td}>mathsense.net/student?mode=signup</td>
              <td style={td}>Where students sign up</td>
              <td style={td}>—</td>
            </tr>
            <tr>
              <td style={td}>mathsense.net/s</td>
              <td style={td}>Where students join a session</td>
              <td style={td}>No</td>
            </tr>
            <tr>
              <td style={td}>My classes <span style={{ color: colors.textHint }}>(their dashboard)</span></td>
              <td style={td}>Where students enter a class code</td>
              <td style={td}>Yes</td>
            </tr>
          </tbody>
        </table>

        <h3 style={h3}>Five things that catch people out</h3>
        <ol style={{ paddingLeft: '20px', margin: '0 0 24px' }}>
          <li style={li}><strong>One class per student</strong> if you teach one-to-one.</li>
          <li style={li}><strong>The class code goes in My classes</strong>, on their own dashboard.</li>
          <li style={li}><strong>Sessions stop after 6 hours.</strong> Just start another.</li>
          <li style={li}><strong>Inviting isn’t joining.</strong> Nothing appears until they’ve signed up and accepted.</li>
          <li style={li}><strong>“To work on” needs five goes</strong> at a skill before it shows up.</li>
        </ol>

        <div style={cardBox}>
          <p style={{ ...p, margin: 0 }}>
            <strong>Anything that looks wrong probably is.</strong>{' '}
            <Link href="/contact" style={{ color: colors.primary, fontWeight: '600' }}>Tell us</Link> —
            especially about the marking, which is the newest part of this.
          </p>
        </div>

      </div>
    </div>
  )
}
