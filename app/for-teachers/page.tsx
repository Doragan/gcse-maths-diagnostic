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
            <button
              onClick={() => {
                trackEvent('teacher_contact_clicked')
                window.open('https://docs.google.com/forms/d/e/1FAIpQLSfF384C-gVaBWWiv4fItf1XDrP-pbfCteCCL758q5UskBX_NA/viewform?usp=header', '_blank')
              }}
              style={{
                background: 'transparent',
                border: `2px solid ${colors.borderStrong}`,
                color: colors.textPrimary,
                padding: '13px 28px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Get in touch
            </button>
          </div>
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

      {/* ── How students experience it ───────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 7vw, 72px) 24px', background: '#ffffff', borderTop: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' as const }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: '800', color: colors.textPrimary, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Your students get a great experience too
          </h2>
          <p style={{ fontSize: font.md, color: colors.textSecondary, margin: '0 0 36px', lineHeight: '1.7' }}>
            Mathsense isn't just a reporting tool — it's a revision companion students actually want to use. Animated progress, mastery tracking, and questions that adapt to their level keep them engaged between lessons.
          </p>
          <Link
            href="/diagnostic"
            onClick={() => trackEvent('teacher_try_diagnostic_clicked')}
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
            Try the student diagnostic yourself →
          </Link>
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
            <button
              onClick={() => {
                trackEvent('teacher_bottom_contact_clicked')
                window.open('https://docs.google.com/forms/d/e/1FAIpQLSfF384C-gVaBWWiv4fItf1XDrP-pbfCteCCL758q5UskBX_NA/viewform?usp=header', '_blank')
              }}
              style={{
                background: 'transparent',
                border: '2px solid rgba(255,255,255,0.5)',
                color: '#ffffff',
                padding: '13px 28px',
                borderRadius: radius.md,
                fontSize: font.lg,
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Get in touch
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0f172a', padding: '32px 24px', textAlign: 'center' as const }}>
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ fontSize: font.xl, fontWeight: '800', color: '#ffffff', textDecoration: 'none', letterSpacing: '-0.02em' }}>Mathsense</Link>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: font.sm }}>Home</Link>
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
