'use client'

import Link from 'next/link'
import { trackEvent } from '../../lib/analytics'
import { colors, font, radius } from '../../lib/styles'

export default function ForTeachersPage() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f8fafc', minHeight: '100dvh' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${colors.border}`,
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontSize: font.xl, fontWeight: '800', color: colors.primary, textDecoration: 'none', letterSpacing: '-0.02em' }}>
          Mathsense
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/student" style={{ fontSize: font.sm, color: colors.textSecondary, textDecoration: 'none', fontWeight: '500', padding: '8px 12px' }}>
            Student login
          </Link>
          <Link href="/auth" style={{
            background: colors.primary,
            color: '#fff',
            borderRadius: radius.md,
            padding: '8px 16px',
            fontSize: font.sm,
            fontWeight: '700',
            textDecoration: 'none',
          }}>
            Teacher login
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 9vw, 88px) 24px',
        background: '#ffffff',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' as const }}>
          <p style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, margin: '0 0 14px', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            For teachers &amp; tutors
          </p>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: '800', color: colors.textPrimary, margin: '0 0 20px', lineHeight: '1.1', letterSpacing: '-0.03em' }}>
            Know exactly where each student needs help.
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: colors.textSecondary, margin: '0 0 36px', lineHeight: '1.7' }}>
            Mathsense gives students a diagnostic and personalised practice — and gives you clear insight into their progress, so you can focus your teaching where it counts.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <Link
              href="/auth"
              onClick={() => trackEvent('teacher_hero_login_clicked')}
              style={{
                background: colors.primary,
                color: '#fff',
                padding: '13px 28px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Teacher login →
            </Link>
            <Link
              href="/contact?from=for_teachers_hero"
              onClick={() => trackEvent('teacher_contact_clicked')}
              style={{
                background: 'transparent',
                border: `2px solid ${colors.borderStrong}`,
                color: colors.textPrimary,
                padding: '13px 28px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      {/* ── Free marking tool ───────────────────────────────────────────────────
          Placed directly under the hero because it is the only thing on this
          page a teacher can USE today: no account, no class, no setup. Everything
          else here asks them to log in or book a conversation first.

          The copy says what the tool does NOT do (nothing is saved, and only a
          few papers are loaded) on purpose. A teacher who clicks through
          expecting their own November mock and finds three AQA Foundation papers
          bounces and does not come back; one who was told first might still try
          it on a past paper. ───────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 7vw, 64px) 24px' }}>
        <div style={{
          maxWidth: '880px', margin: '0 auto',
          background: '#ffffff', borderRadius: radius.lg,
          border: `2px solid ${colors.primary}`,
          padding: 'clamp(24px, 4vw, 36px)',
        }}>
          <p style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, margin: '0 0 12px', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            Free — no account needed
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: '800', color: colors.textPrimary, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Already marked a paper? Turn it into feedback sheets.
          </h2>
          <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 10px', lineHeight: '1.7', maxWidth: '620px' }}>
            Enter the marks you already have — type them in or paste a CSV — and download
            a sheet for every student: what went well, what to work on, and questions to
            practise. One page each, ready to hand out. No sign-up, and no limit on how
            many papers you do.
          </p>
          <p style={{ fontSize: font.base, color: colors.textHint, margin: '0 0 24px', lineHeight: '1.65', maxWidth: '620px' }}>
            Nothing is saved, so there is nothing to cancel. AQA Foundation papers to
            begin with, with more being added — an account is what lets you keep the
            marks and compare one paper with the next.
          </p>
          <Link
            href="/mark"
            onClick={() => trackEvent('teacher_free_marking_clicked')}
            style={{
              background: colors.primary,
              color: '#fff',
              padding: '13px 28px',
              borderRadius: radius.md,
              fontSize: font.lg,
              fontWeight: '800',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Mark a paper →
          </Link>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 24px' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: '800', textAlign: 'center' as const, color: colors.textPrimary, margin: '0 0 44px', letterSpacing: '-0.02em' }}>
            Built for the way you actually teach
          </h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
            {[
              {
                emoji: '🗺️',
                title: 'Class skill map',
                body: 'See which skills each student has mastered and where their gaps are — across every topic in GCSE Maths.',
              },
              {
                emoji: '🔍',
                title: 'Spot the gaps early',
                body: "Don't wait until the mock. Mathsense flags students who are struggling with foundational skills before it becomes a bigger problem.",
              },
              {
                emoji: '🎯',
                title: 'Targeted by design',
                body: "Each student gets questions matched to their level — so they're always working on the right thing without taking up your time.",
              },
              {
                emoji: '📋',
                title: 'Diagnostic ready',
                body: 'Share the diagnostic link with a class and instantly get a structured picture of where everyone stands — no marking required.',
              },
            ].map(({ emoji, title, body }) => (
              <div key={title} style={{
                flex: '1 1 360px',
                background: '#ffffff',
                borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
                padding: '24px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '28px', flexShrink: 0, marginTop: '2px' }}>{emoji}</span>
                <div>
                  <h3 style={{ fontSize: font.md, fontWeight: '700', color: colors.textPrimary, margin: '0 0 8px' }}>{title}</h3>
                  <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.65' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard preview ────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: '#ffffff', borderTop: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: '36px' }}>
            <p style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, margin: '0 0 14px', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              See it in action
            </p>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: '800', color: colors.textPrimary, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              The whole thing, in about ten minutes
            </h2>
            {/* This said "with real student data" — it is a sample class, and
                the demo dashboards now say so on the page itself. */}
            <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 auto 24px', lineHeight: '1.7', maxWidth: '560px' }}>
              Below is a preview of the teacher dashboard for a sample class — class mastery, common gaps, and students who need support. The guided tour walks you through it, plus the question bank and the free marking tool.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <Link
                href="/demo"
                onClick={() => trackEvent('teacher_demo_tour_clicked')}
                style={{
                  display: 'inline-block',
                  background: colors.primary,
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: radius.md,
                  fontSize: font.base,
                  fontWeight: '700',
                  textDecoration: 'none',
                }}
              >
                Take the guided tour →
              </Link>
              <Link
                href="/demo/dashboard/teacher"
                onClick={() => trackEvent('teacher_demo_dashboard_clicked')}
                style={{
                  display: 'inline-block',
                  background: '#fff',
                  color: colors.textPrimary,
                  border: `1px solid ${colors.borderStrong}`,
                  padding: '12px 24px',
                  borderRadius: radius.md,
                  fontSize: font.base,
                  fontWeight: '700',
                  textDecoration: 'none',
                }}
              >
                Straight to the dashboard
              </Link>
            </div>
          </div>

          {/* Mini dashboard preview */}
          <div style={{
            border: `1.5px solid ${colors.border}`,
            borderRadius: radius.lg,
            overflow: 'hidden',
            boxShadow: '0 6px 28px rgba(0,0,0,0.08)',
          }}>
            {/* Dashboard header bar */}
            <div style={{
              background: '#fff',
              borderBottom: `1px solid ${colors.border}`,
              padding: '10px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '6px',
                  background: colors.primary, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '800', fontSize: font.base, flexShrink: 0,
                }}>M</div>
                <div>
                  <div style={{ fontSize: font.base, fontWeight: '700', color: colors.textPrimary }}>Mathsense — Teacher Dashboard</div>
                  <div style={{ fontSize: font.sm, color: colors.textSecondary }}>Greenfield Academy · Mr Thompson</div>
                </div>
              </div>
              <span style={{ fontSize: font.sm, color: colors.primary, fontWeight: '700', background: '#eff6ff', padding: '2px 10px', borderRadius: '9999px', border: `1px solid #bfdbfe` }}>Demo</span>
            </div>

            {/* Dashboard body */}
            <div style={{ background: colors.background, padding: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap' as const }}>

              {/* Class roster */}
              <div style={{
                flex: '1 1 340px',
                background: '#fff',
                borderRadius: radius.md,
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: font.md, fontWeight: '700', color: colors.textPrimary }}>Year 10 Set 2 · 8 students</span>
                  <span style={{ background: '#fffbeb', color: '#92400e', borderRadius: '6px', padding: '2px 10px', fontSize: font.sm, fontWeight: '700', border: '1px solid #fcd34d' }}>52% ↑10%</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: font.sm }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      <th style={{ padding: '6px 12px', textAlign: 'left' as const, fontWeight: '600', color: colors.textSecondary, borderBottom: `1px solid ${colors.border}` }}>Student</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' as const, fontWeight: '600', color: colors.textSecondary, borderBottom: `1px solid ${colors.border}` }}>Mastery</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center' as const, fontWeight: '600', color: colors.textSecondary, borderBottom: `1px solid ${colors.border}` }}>Change</th>
                      <th style={{ padding: '6px 12px', textAlign: 'left' as const, fontWeight: '600', color: colors.textSecondary, borderBottom: `1px solid ${colors.border}` }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Harry Wilson',    m: 88, ch: '+8%',  status: 'Strong',       sb: '#e8f5e9', sc: '#2e7d32' },
                      { name: 'Amira Patel',     m: 85, ch: '+11%', status: 'Strong',       sb: '#e8f5e9', sc: '#2e7d32' },
                      { name: 'Ben Okonkwo',     m: 57, ch: '+16%', status: 'Improving',    sb: '#eff6ff', sc: '#2563eb' },
                      { name: 'Charlotte Evans', m: 54, ch: '+6%',  status: 'Developing',   sb: '#fffbeb', sc: '#92400e' },
                      { name: 'Finn McCarthy',   m: 25, ch: '+3%',  status: 'Needs support',sb: '#ffebee', sc: '#c62828' },
                      { name: 'Grace Adeyemi',   m: 18, ch: '−2%',  status: 'Needs support',sb: '#ffebee', sc: '#c62828' },
                    ].map((s, i, arr) => (
                      <tr key={i} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                        <td style={{ padding: '7px 12px', color: colors.primary, fontWeight: '600', fontSize: font.sm }}>{s.name}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'center' as const, fontWeight: '700', fontSize: font.sm, color: s.m >= 70 ? '#2e7d32' : s.m >= 40 ? '#92400e' : '#c62828' }}>{s.m}%</td>
                        <td style={{ padding: '7px 8px', textAlign: 'center' as const, fontSize: font.sm, fontWeight: '600', color: s.ch.startsWith('+') ? '#4CAF50' : '#f44336' }}>{s.ch}</td>
                        <td style={{ padding: '7px 12px' }}>
                          <span style={{ background: s.sb, color: s.sc, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right column */}
              <div style={{ flex: '1 1 210px', display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>

                {/* Common gaps */}
                <div style={{ background: '#fff', borderRadius: radius.md, border: `1px solid ${colors.border}`, padding: '12px 14px' }}>
                  <div style={{ fontSize: font.base, fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>Common Gaps</div>
                  {[
                    { skill: 'Solving Linear Equations', pct: 25, priority: true },
                    { skill: 'Factorising',               pct: 18, priority: true },
                    { skill: 'Angles in Polygons',        pct: 40, priority: false },
                  ].map((g, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 8px', marginBottom: i < 2 ? '6px' : 0,
                      borderRadius: '6px',
                      background: g.priority ? '#ffebee' : '#fffbeb',
                      border: `1px solid ${g.priority ? '#ef9a9a' : '#fcd34d'}`,
                    }}>
                      <span style={{ fontSize: font.sm, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>{g.skill}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <span style={{ fontSize: font.sm, fontWeight: '700', color: g.priority ? '#c62828' : '#92400e' }}>{g.pct}%</span>
                        {g.priority && <span style={{ fontSize: '10px', background: '#f44336', color: '#fff', borderRadius: '3px', padding: '1px 5px', fontWeight: '700' }}>Priority</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Needs support */}
                <div style={{ background: '#fff', borderRadius: radius.md, border: `1px solid ${colors.border}`, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: font.base, fontWeight: '700', color: colors.textPrimary }}>Needs Support</span>
                    <span style={{ background: '#ffebee', color: '#c62828', borderRadius: '9999px', padding: '1px 10px', fontSize: font.sm, fontWeight: '700', border: '1px solid #ef9a9a' }}>2</span>
                  </div>
                  {[
                    { name: 'Finn McCarthy',  m: 25, weak: 'Algebra (18%)' },
                    { name: 'Grace Adeyemi', m: 18, weak: 'Algebra (8%)'  },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '7px 8px', borderRadius: '6px', background: '#ffebee', border: '1px solid #ef9a9a', marginBottom: i === 0 ? '6px' : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: font.sm, fontWeight: '700', color: colors.textPrimary }}>{s.name}</span>
                        <span style={{ fontSize: font.sm, fontWeight: '700', color: '#c62828' }}>{s.m}%</span>
                      </div>
                      <div style={{ fontSize: '11px', color: colors.textSecondary }}>Weakest: {s.weak}</div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How students experience it ───────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 7vw, 72px) 24px', background: '#f8fafc', borderTop: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' as const }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: '800', color: colors.textPrimary, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Your students get a great experience too
          </h2>
          <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 28px', lineHeight: '1.7' }}>
            Mathsense isn't just a reporting tool — it's a revision companion students actually want to use. Mastery tracking, targeted questions, and specific feedback on every mistake keep them engaged between lessons.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <Link
              href="/demo/dashboard/student"
              onClick={() => trackEvent('teacher_student_demo_clicked')}
              style={{
                display: 'inline-block',
                background: colors.primary,
                color: '#fff',
                padding: '12px 24px',
                borderRadius: radius.md,
                fontSize: font.base,
                fontWeight: '700',
                textDecoration: 'none',
              }}
            >
              See the student dashboard →
            </Link>
            <Link
              href="/student/diagnostic"
              onClick={() => trackEvent('teacher_try_diagnostic_clicked')}
              style={{
                display: 'inline-block',
                border: `2px solid ${colors.borderStrong}`,
                color: colors.textPrimary,
                padding: '12px 24px',
                borderRadius: radius.md,
                fontSize: font.base,
                fontWeight: '700',
                textDecoration: 'none',
              }}
            >
              Try the diagnostic yourself
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 8vw, 80px) 24px',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        textAlign: 'center' as const,
      }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800', color: '#ffffff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: font.md, color: 'rgba(255,255,255,0.8)', margin: '0 0 32px', lineHeight: '1.65' }}>
            Log in to the teacher dashboard, or get in touch if you&apos;d like to discuss how Mathsense could work for your school.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <Link
              href="/auth"
              style={{
                background: '#ffffff',
                color: colors.primary,
                padding: '13px 28px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Teacher login
            </Link>
            <Link
              href="/contact?from=for_teachers_bottom"
              onClick={() => trackEvent('teacher_bottom_contact_clicked')}
              style={{
                background: 'transparent',
                border: '2px solid rgba(255,255,255,0.5)',
                color: '#ffffff',
                padding: '13px 28px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0f172a', padding: '32px 24px', textAlign: 'center' as const }}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ fontSize: font.xl, fontWeight: '800', color: '#ffffff', textDecoration: 'none', letterSpacing: '-0.02em' }}>Mathsense</Link>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: font.sm }}>Home</Link>
            <Link href="/mark" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: font.sm }}>Mark a paper</Link>
            <Link href="/diagnostic" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: font.sm }}>Student diagnostic</Link>
            <Link href="/student" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: font.sm }}>Student login</Link>
            <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: font.sm }}>Privacy</Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: font.sm }}>Terms</Link>
          </div>
          <p style={{ fontSize: font.sm, color: 'rgba(255,255,255,0.3)', margin: 0 }}>© 2026 Mathsense</p>
        </div>
      </footer>

    </div>
  )
}
