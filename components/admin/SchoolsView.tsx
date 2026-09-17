'use client'

/**
 * Renders the schools report. Takes the data as a prop so the markup can be
 * exercised without an admin session, matching UsageReportView.
 */

import { type SchoolsReport } from '../../lib/adminSchools'
import { colors, font, radius, card, sectionTitle } from '../../lib/styles'

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function SchoolsView({ report }: { report: SchoolsReport }) {
  const { totals, schools } = report

  return (
    <>
      <div style={card}>
        <h2 style={sectionTitle}>Totals</h2>
        <div style={styles.statRow}>
          <Stat label="Schools" value={totals.schools} />
          <Stat label="In date" value={totals.inDate} />
          <Stat label="Seats sold" value={totals.seats} />
          <Stat label="Seats used" value={totals.seatsUsed} />
          <Stat
            label="Over cap"
            value={totals.overCap}
            tone={totals.overCap > 0 ? colors.warningText : undefined}
          />
        </div>
        <p style={styles.note}>
          A seat is a <strong>distinct student</strong> across all of a school&apos;s classes,
          so somebody in two of them counts once. Seats are recorded, not enforced:
          going over is allowed and settled at renewal.
        </p>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>Schools</h2>
        {schools.length === 0 ? (
          <p style={styles.empty}>
            No schools yet. One is created by hand when a school is signed up — see
            the runbook in <code>20260915_schools_and_class_grant.sql</code>.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <Th>School</Th>
                  <Th align="right">Seats</Th>
                  <Th align="right">Used</Th>
                  <Th align="right">Classes</Th>
                  <Th align="right">Teachers</Th>
                  <Th>Access until</Th>
                </tr>
              </thead>
              <tbody>
                {schools.map(s => (
                  <tr key={s.id} style={{ opacity: s.inDate ? 1 : 0.55 }}>
                    <Td>
                      {s.name}
                      {!s.inDate && <span style={styles.lapsed}> lapsed</span>}
                    </Td>
                    <Td align="right">{s.seats}</Td>
                    <Td align="right">
                      <span style={s.overBy > 0 ? { color: colors.warningText, fontWeight: 700 } : undefined}>
                        {s.seatsUsed}
                        {s.overBy > 0 && ` (+${s.overBy})`}
                      </span>
                    </Td>
                    <Td align="right">{s.classes}</Td>
                    <Td align="right">{s.teachers}</Td>
                    <Td>{date(s.granted_until)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>Classes with no school</h2>
        <div style={styles.statRow}>
          <Stat label="Unattached" value={report.unattachedClasses} />
          <Stat
            label="Orphaned"
            value={report.orphanClasses}
            tone={report.orphanClasses > 0 ? colors.warningText : undefined}
          />
        </div>
        <p style={styles.note}>
          <strong>Unattached</strong> is normal — an individual teacher&apos;s class.
          {' '}<strong>Orphaned</strong> means no teacher <em>and</em> no school: the
          teacher&apos;s account was deleted, which keeps the class and everyone&apos;s work
          rather than destroying it. A class with a school is waiting to be reassigned;
          one with neither is waiting for nothing, and is worth sweeping.
        </p>
      </div>

      <p style={styles.generated}>
        Generated {new Date(report.generatedAt).toLocaleString('en-GB')}
      </p>
    </>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div style={styles.stat}>
      <span style={{ ...styles.statValue, color: tone ?? colors.textPrimary }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return <th style={{ ...styles.th, textAlign: align ?? 'left' }}>{children}</th>
}

function Td({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return <td style={{ ...styles.td, textAlign: align ?? 'left' }}>{children}</td>
}

const styles: Record<string, React.CSSProperties> = {
  statRow: { display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '8px' },
  stat: { display: 'flex', flexDirection: 'column' },
  statValue: { fontSize: '26px', fontWeight: '700', lineHeight: 1.1 },
  statLabel: { fontSize: font.sm, color: colors.textSecondary },
  note: {
    fontSize: font.sm, color: colors.textHint, margin: '12px 0 0', lineHeight: 1.6,
  },
  empty: { fontSize: font.base, color: colors.textHint, margin: '8px 0 0', lineHeight: 1.6 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: {
    fontSize: font.sm, color: colors.textSecondary, fontWeight: 600,
    padding: '6px 10px 6px 0', borderBottom: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
  },
  td: {
    fontSize: font.base, color: colors.textPrimary,
    padding: '8px 10px 8px 0', borderBottom: `1px solid ${colors.border}`,
  },
  lapsed: {
    fontSize: font.sm, color: colors.textHint, fontWeight: 400,
    border: `1px solid ${colors.border}`, borderRadius: radius.sm,
    padding: '1px 6px', marginLeft: '8px',
  },
  generated: { fontSize: font.sm, color: colors.textHint, margin: 0 },
}
