'use client'

/**
 * Renders a UsageReport. Presentation only — it takes the report as a prop and
 * fetches nothing, so it can be exercised with a fixture without an admin
 * session and without reaching the database.
 *
 * The headline is the day-2 return rate, because that is the number the whole
 * retention build was aimed at. Total signups is deliberately NOT a headline:
 * it reads like success while the return rate tells the real story, and a
 * flattering number at the top of a page is worse than no page.
 */

import Link from 'next/link'
import { MIN_SENDS_FOR_RATE, ENGAGED_THRESHOLD, type UsageReport } from '../../lib/adminUsage'
import { colors, font, radius, card, sectionTitle } from '../../lib/styles'

const pct = (n: number) => `${Math.round(n * 100)}%`

export default function UsageReportView({ report }: { report: UsageReport }) {
  const { totals, weekly, cohorts, email } = report
  const peakAttempts = Math.max(1, ...weekly.map(w => w.attempts))

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
        <h1 style={{ fontSize: font['2xl'], fontWeight: '600', margin: 0, color: colors.textPrimary }}>Usage</h1>
        <Link href="/admin" style={{ fontSize: font.sm, color: colors.primary }}>← Admin</Link>
      </div>

      {/* The headline. Return rate first; the raw counts are context for it. */}
      <div style={card}>
        <h2 style={sectionTitle}>Came back on a second day</h2>
        <p style={{ fontSize: '52px', fontWeight: '800', margin: '0 0 2px', lineHeight: 1, color: colors.textPrimary }}>
          {pct(totals.everReturnedRate)}
        </p>
        <p style={{ fontSize: font.base, color: colors.textSecondary, margin: '0 0 18px' }}>
          {totals.everReturned} of {totals.students} students, all time
        </p>
        <div style={styles.statsGrid}>
          <Stat label="Active last 7 days" value={String(totals.activeLast7)} />
          <Stat label="Premium access" value={String(totals.withPremiumAccess)} />
          <Stat label="Tracked purchases" value={String(totals.conversions)} />
          <Stat label="Questions answered" value={totals.attempts.toLocaleString()} />
        </div>
        <p style={styles.note}>
          &ldquo;Premium access&rdquo; is who the app lets through, which includes comped and
          manually-granted accounts — nothing in the schema records how access was
          given, so those are indistinguishable from purchases. &ldquo;Tracked purchases&rdquo;
          counts only what the Stripe webhook has recorded since 2 September 2026, so
          it is trustworthy but starts from zero rather than counting earlier customers.
        </p>
      </div>

      {/* Weekly activity — where a campaign starting or stopping shows up. */}
      <div style={card}>
        <h2 style={sectionTitle}>By week</h2>
        <div style={styles.scroller}>
          <table style={styles.table}>
            <thead>
              <tr><Th>Week</Th><Th right>Signups</Th><Th right>Active</Th><Th right>Questions</Th><Th> </Th></tr>
            </thead>
            <tbody>
              {weekly.map(w => (
                <tr key={w.weekStart}>
                  <Td>{w.weekStart}</Td>
                  <Td right>{w.signups || '—'}</Td>
                  <Td right>{w.activeStudents || '—'}</Td>
                  <Td right>{w.attempts || '—'}</Td>
                  <Td>
                    <div style={{
                      height: 8, borderRadius: radius.full, background: colors.primary,
                      width: `${(w.attempts / peakAttempts) * 100}%`, minWidth: w.attempts ? 3 : 0,
                    }} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* The funnel. Each column is a subset of the one to its left, so the
          drop-off is readable straight across a row. */}
      <div style={card}>
        <h2 style={sectionTitle}>Signup cohorts</h2>
        <div style={styles.scroller}>
          <table style={styles.table}>
            <thead>
              <tr>
                <Th>Joined</Th><Th right>Signed up</Th><Th right>Practised</Th>
                <Th right>{ENGAGED_THRESHOLD}+ questions</Th><Th right>Returned</Th><Th right>At 4 weeks</Th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map(c => (
                <tr key={c.cohort}>
                  <Td>{c.cohort}</Td>
                  <Td right>{c.signedUp}</Td>
                  <Td right>{c.practised}</Td>
                  <Td right>{c.engaged}</Td>
                  <Td right strong={c.returned > 0}>{c.returned}</Td>
                  <Td right>{c.retained}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={styles.note}>
          Each column is a subset of the one before it. &ldquo;At 4 weeks&rdquo; counts from each
          student&rsquo;s own signup, so a recent cohort isn&rsquo;t marked down for being recent.
        </p>
      </div>

      {/* Email. The denominator matters more than the rate until it's big enough. */}
      <div style={card}>
        <h2 style={sectionTitle}>Email</h2>
        <div style={styles.scroller}>
          <table style={styles.table}>
            <thead>
              <tr><Th>Channel</Th><Th right>Sent</Th><Th right>Students</Th><Th right>Clicks</Th><Th right>Rate</Th></tr>
            </thead>
            <tbody>
              {email.map(e => (
                <tr key={e.channel}>
                  <Td>{e.channel}</Td>
                  <Td right>{e.sends}</Td>
                  <Td right>{e.students}</Td>
                  <Td right>{e.clicks}</Td>
                  <Td right>
                    {e.clickRate === null
                      ? <span style={{ color: colors.textHint }}>—</span>
                      : pct(e.clickRate)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={styles.note}>
          A rate is withheld below {MIN_SENDS_FOR_RATE} sends. At a healthy 10%, an email
          shows zero clicks in 12 sends about 28% of the time — a percentage from a
          sample that small invites a conclusion it cannot support.
        </p>
      </div>

      <p style={{ ...styles.note, textAlign: 'center' as const }}>
        Generated {new Date(report.generatedAt).toLocaleString('en-GB')}
      </p>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: font.xl, fontWeight: '700', margin: '0 0 2px', color: colors.textPrimary }}>{value}</p>
      <p style={{ fontSize: font.sm, color: colors.textHint, margin: 0 }}>{label}</p>
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{
      textAlign: right ? 'right' : 'left', fontSize: font.sm, fontWeight: '600',
      color: colors.textHint, padding: '6px 10px 8px', borderBottom: `1px solid ${colors.border}`,
      whiteSpace: 'nowrap' as const,
    }}>{children}</th>
  )
}

function Td({ children, right, strong }: { children: React.ReactNode; right?: boolean; strong?: boolean }) {
  return (
    <td style={{
      textAlign: right ? 'right' : 'left', fontSize: font.base,
      color: strong ? colors.successText : colors.textPrimary,
      fontWeight: strong ? '700' : '400',
      padding: '8px 10px', borderBottom: `1px solid ${colors.cardAlt}`,
      whiteSpace: 'nowrap' as const,
    }}>{children}</td>
  )
}

const styles = {
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px',
  },
  // A wide table scrolls inside its own card rather than making the PAGE scroll
  // sideways, which on a phone is the difference between usable and not.
  scroller: { overflowX: 'auto' as const, maxWidth: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  note: { fontSize: font.sm, color: colors.textHint, margin: '12px 0 0', lineHeight: 1.6 },
}
