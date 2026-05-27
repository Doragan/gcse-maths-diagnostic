'use client'

import Link from 'next/link'
import { trackEvent } from '../lib/analytics'
import { colors, font, radius } from '../lib/styles'

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f8fafc' }}>

      {/* ── Navigation ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky' as const,
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${colors.border}`,
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: font.xl, fontWeight: '800', color: colors.primary, letterSpacing: '-0.02em' }}>
          Mathsense
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/for-teachers" style={{ fontSize: font.sm, color: colors.textSecondary, textDecoration: 'none', fontWeight: '500', padding: '8px 12px' }}>
            For teachers
          </Link>
          <Link href="/student" style={{ fontSize: font.sm, color: colors.textSecondary, textDecoration: 'none', fontWeight: '500', padding: '8px 12px' }}>
            Log in
          </Link>
          <Link
            href="/student/diagnostic"
            onClick={() => trackEvent('nav_diagnostic_clicked')}
            style={{
              background: colors.primary,
              color: '#fff',
              borderRadius: radius.md,
              padding: '8px 16px',
              fontSize: font.sm,
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            Start free diagnostic
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 65%, #3b82f6 100%)',
        padding: 'clamp(56px, 10vw, 96px) 24px',
        textAlign: 'center' as const,
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: radius.full,
            padding: '5px 16px',
            fontSize: font.sm,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: '600',
            marginBottom: '28px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
          }}>
            GCSE Maths Revision
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 64px)',
            fontWeight: '800',
            color: '#ffffff',
            margin: '0 0 20px',
            lineHeight: '1.08',
            letterSpacing: '-0.03em',
          }}>
            The smarter way to<br />revise GCSE Maths.
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: 'rgba(255,255,255,0.82)',
            margin: '0 0 40px',
            lineHeight: '1.65',
            maxWidth: '520px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Take a free 5-minute diagnostic, see exactly where your strengths and gaps are, and get a personalised revision plan across all 135 GCSE Maths skills. No sign-up needed to start.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: '28px' }}>
            <Link
              href="/student/diagnostic"
              onClick={() => trackEvent('hero_diagnostic_clicked')}
              style={{
                background: '#ffffff',
                color: colors.primary,
                padding: '15px 30px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-block',
                boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
                letterSpacing: '-0.01em',
              }}
            >
              Start free diagnostic →
            </Link>
            <Link
              href="/student"
              onClick={() => trackEvent('hero_login_clicked')}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '2px solid rgba(255,255,255,0.55)',
                padding: '15px 30px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Log in to your account
            </Link>
          </div>

          <p style={{ fontSize: font.sm, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '0.02em' }}>
            Free to start &nbsp;·&nbsp; No card required &nbsp;·&nbsp; 5-minute setup
          </p>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────────── */}
      <section style={{ background: '#ffffff', borderBottom: `1px solid ${colors.border}`, padding: '28px 24px' }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(24px, 6vw, 64px)',
          flexWrap: 'wrap' as const,
        }}>
          {[
            { number: '135', label: 'GCSE Maths skills' },
            { number: '5–10', label: 'minute diagnostic' },
            { number: '100%', label: 'free to start' },
          ].map(({ number, label }) => (
            <div key={label} style={{ textAlign: 'center' as const }}>
              <p style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '800', color: colors.primary, margin: '0 0 2px', letterSpacing: '-0.03em' }}>{number}</p>
              <p style={{ fontSize: font.sm, color: colors.textSecondary, margin: 0, fontWeight: '500' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '800',
            textAlign: 'center' as const,
            color: colors.textPrimary,
            margin: '0 0 48px',
            letterSpacing: '-0.02em',
          }}>
            Everything you need to revise smarter
          </h2>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
            {[
              {
                emoji: '📊',
                title: 'Instant skill map',
                body: 'Answer 20 carefully chosen questions and instantly see where your strengths and gaps are — across every GCSE Maths topic.',
              },
              {
                emoji: '🎯',
                title: 'Targeted practice',
                body: "Questions matched to your level, so you always work on the right thing. No time wasted on skills you've already mastered.",
              },
              {
                emoji: '📈',
                title: 'Track your mastery',
                body: "Watch 135 skills move from 'not started' to 'mastered'. See your progress build question by question, session by session.",
              },
            ].map(({ emoji, title, body }) => (
              <div key={title} style={{
                flex: '1 1 260px',
                background: '#ffffff',
                borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
                padding: '28px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '14px' }}>{emoji}</div>
                <h3 style={{ fontSize: font.lg, fontWeight: '700', color: colors.textPrimary, margin: '0 0 10px' }}>{title}</h3>
                <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.65' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '800',
            textAlign: 'center' as const,
            color: colors.textPrimary,
            margin: '0 0 48px',
            letterSpacing: '-0.02em',
          }}>
            From gaps to gains — in minutes
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' as const }}>
            {[
              {
                n: '1',
                title: 'Take the free diagnostic',
                body: '10 questions spanning all of GCSE Maths — takes about 5 minutes. No sign-up required.',
              },
              {
                n: '2',
                title: 'See your personalised skill map',
                body: 'Instantly see where you\'re strong and where the gaps are, across every major topic.',
              },
              {
                n: '3',
                title: 'Create your account and practise',
                body: 'Save your results, then get targeted questions with step-by-step explanations. Watch your skills go green one by one.',
              },
            ].map(({ n, title, body }, i) => (
              <div key={n} style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: colors.primary, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: font.lg, flexShrink: 0,
                  }}>
                    {n}
                  </div>
                  {i < 2 && <div style={{ width: 2, flex: 1, background: colors.border, minHeight: '32px', marginTop: '6px' }} />}
                </div>
                <div style={{ paddingBottom: i < 2 ? '32px' : 0, paddingTop: '8px' }}>
                  <h3 style={{ fontSize: font.lg, fontWeight: '700', color: colors.textPrimary, margin: '0 0 8px' }}>{title}</h3>
                  <p style={{ fontSize: font.base, color: colors.textSecondary, margin: 0, lineHeight: '1.65' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' as const, marginTop: '48px' }}>
            <Link
              href="/student/diagnostic"
              onClick={() => trackEvent('howitworks_cta_clicked')}
              style={{
                background: colors.primary,
                color: '#fff',
                padding: '15px 32px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-block',
                letterSpacing: '-0.01em',
              }}
            >
              Start free diagnostic →
            </Link>
          </div>
        </div>
      </section>

      {/* ── For teachers ───────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 7vw, 72px) 24px',
        background: '#eff6ff',
        borderTop: `1px solid #dbeafe`,
        borderBottom: `1px solid #dbeafe`,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' as const }}>
          <p style={{ fontSize: font.sm, fontWeight: '700', color: colors.primary, margin: '0 0 14px', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            For teachers
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: '800', color: colors.textPrimary, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Using Mathsense with a class?
          </h2>
          <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 28px', lineHeight: '1.65' }}>
            Track which skills each student has mastered, spot gaps across the group, and focus your teaching where it matters most.
          </p>
          <Link
            href="/for-teachers"
            onClick={() => trackEvent('teacher_cta_clicked')}
            style={{
              display: 'inline-block',
              border: `2px solid ${colors.primary}`,
              color: colors.primary,
              padding: '12px 24px',
              borderRadius: radius.md,
              fontSize: font.base,
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            Find out more for teachers →
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0f172a', padding: '40px 24px' }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          gap: '20px',
        }}>
          <span style={{ fontSize: font.xl, fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>Mathsense</span>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            {[
              { label: 'Free diagnostic', href: '/student/diagnostic' },
              { label: 'Student login', href: '/student' },
              { label: 'For teachers', href: '/for-teachers' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: font.sm, fontWeight: '500' }}>
                {label}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: font.sm, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            © 2026 Mathsense. Built to help students succeed.
          </p>
        </div>
      </footer>

    </div>
  )
}
