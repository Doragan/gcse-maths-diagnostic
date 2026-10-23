// Mathsense design system
// Import this wherever you need consistent styles

export const colors = {
  // Brand
  primary: '#2563eb',
  primaryHover: '#1d4ed8',

  // Semantic
  success: '#4CAF50',
  successLight: '#e8f5e9',
  successBorder: '#a5d6a7',
  successText: '#2e7d32',

  danger: '#f44336',
  dangerLight: '#ffebee',
  dangerBorder: '#ef9a9a',
  dangerText: '#c62828',

  warning: '#f59e0b',
  warningLight: '#fffbeb',
  warningBorder: '#fcd34d',
  warningText: '#92400e',

  // Neutrals
  background: '#f4f6f8',
  card: '#ffffff',
  cardAlt: '#fafafa',
  border: '#e5e5e5',
  borderStrong: '#d1d5db',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textHint: '#9ca3af',
}

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  full: '9999px',
}

export const font = {
  sm: '12px',
  base: '14px',
  md: '15px',
  lg: '16px',
  xl: '18px',
  '2xl': '22px',
  '3xl': '28px',
}

// Reusable component styles
export const card: React.CSSProperties = {
  background: colors.card,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  padding: '20px',
}

export const cardAlt: React.CSSProperties = {
  background: colors.cardAlt,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  padding: '20px',
}

export const primaryButton: React.CSSProperties = {
  background: colors.primary,
  color: '#ffffff',
  border: 'none',
  padding: '12px 20px',
  borderRadius: radius.md,
  fontSize: font.lg,
  fontWeight: '600',
  cursor: 'pointer',
  width: '100%',
}

export const secondaryButton: React.CSSProperties = {
  background: colors.card,
  color: colors.textPrimary,
  border: `1px solid ${colors.borderStrong}`,
  padding: '10px 20px',
  borderRadius: radius.md,
  fontSize: font.md,
  fontWeight: '600',
  cursor: 'pointer',
  width: '100%',
}

export const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  fontSize: font.md,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export const labelStyle: React.CSSProperties = {
  fontSize: font.base,
  fontWeight: '500',
  color: colors.textPrimary,
}

export const errorBox: React.CSSProperties = {
  fontSize: font.base,
  color: colors.dangerText,
  padding: '10px 12px',
  background: colors.dangerLight,
  borderRadius: radius.md,
  border: `1px solid ${colors.dangerBorder}`,
}

/**
 * Max content width for a teacher surface holding a table or a grid of cards.
 *
 * The teacher side had no width convention at all: every page picked its own
 * and they ranged from 480px to unbounded — 600 on the dashboard, 640 on
 * assignments, 700 on sessions, 780 on a class, and `pageContainer` (no limit)
 * on the student list. On a 1920px monitor the narrow ones read as a phone
 * layout that happens to be centred, which is what prompted this.
 *
 * 960 fits a four-column table and a three-card row without the cards wrapping
 * their descriptions, and keeps prose line lengths readable rather than
 * stretching to the window. A FORM is a different thing and should stay narrow
 * — /dashboard/upgrade at 480 is correct, not an oversight.
 *
 * Measured rather than guessed, with the real nav (eight buttons, admin
 * included) at a 1440px viewport:
 *
 *   600px  header 116px tall — title ABOVE the nav, buttons on two rows
 *   900px  header  34px tall — title beside the nav, buttons on one row
 *   960px  header  34px tall — same, with room to spare
 *
 * The eight buttons come to 775px and the title to 108px, so the breakpoint
 * sits just under 900. 960 clears it without being on the edge, which matters
 * because a longer nav label would otherwise silently push it back to two rows.
 *
 * ⚠ Only the dashboard uses this so far. The other table-bearing surfaces
 * (students, sessions/[id], assignments/[id], classes/[id]) still have their
 * own numbers, so moving between them still jumps. Converging them is a
 * follow-up, and this constant is the place to converge on.
 */
export const DASHBOARD_MAX_WIDTH = '960px'

export const pageContainer: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  background: colors.background,
  boxSizing: 'border-box',
}

export const narrowCard: React.CSSProperties = {
  background: colors.card,
  borderRadius: radius.lg,
  padding: '32px 28px',
  width: '100%',
  maxWidth: '420px',
  border: `1px solid ${colors.border}`,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

export const pageTitle: React.CSSProperties = {
  fontSize: font['3xl'],
  fontWeight: '600',
  margin: 0,
  color: colors.textPrimary,
}

export const sectionTitle: React.CSSProperties = {
  fontSize: font.lg,
  fontWeight: '600',
  margin: 0,
  color: colors.textPrimary,
}