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
 * The HUB only. It is a grid of cards rather than a column of text, so it
 * takes the extra width usefully; everything else uses TEACHER_CONTENT_WIDTH
 * below. Two tiers on purpose, not an oversight.
 */
export const DASHBOARD_MAX_WIDTH = '960px'

/**
 * Every other teacher page: a single column of cards, forms and tables.
 *
 * It used to be six different numbers — 480, 600, 640, 700, 780 and unbounded
 * — so the content column jumped every time a teacher moved between pages,
 * and the two pages with no bound at all stretched the full width of a large
 * monitor.
 *
 * ── Why 780 ────────────────────────────────────────────────────────────────
 *
 * Measured, not chosen by eye. The progress table is the widest thing any of
 * these pages carries (Student · Progress · Score · Parts · Status · Last
 * attempt), and with realistic double-barrelled names it stops wrapping names
 * onto a second line at 700px: rows are 59–60px tall at 600 and 640, and 40px
 * at 700 and every width above it.
 *
 * So 700 is the floor and 780 is that floor plus room for a longer name or one
 * more column. It is also a width the product already shipped — classes/[id]
 * has used it since it was written — so this converges on something seen
 * rather than something invented.
 *
 * Note what this means: the table pages were NOT too narrow before. The 700s
 * were fine and the 600/640 pages would only have wrapped if they had carried
 * the table, which they do not. This change is about the jump between pages,
 * not about rescuing a squeezed layout.
 */
export const TEACHER_CONTENT_WIDTH = '780px'

/**
 * Checkout, and nothing else. A payment page is a single short form and a
 * price; letting it run to 780 would leave a lot of whitespace around very
 * little, and narrow reads as deliberate there in a way it would not
 * elsewhere.
 */
export const TEACHER_NARROW_WIDTH = '480px'

/**
 * A teacher page: one centred column of stacked cards.
 *
 * Every dashboard page had already written this out by hand, identically. The
 * two that had NOT — students and students/[id] — reached for `pageContainer`
 * below instead, which is a different thing wearing a similar name: it centres
 * a SINGLE card in the viewport with `align-items: center` and no
 * `flex-direction`, so it lays its children out in a ROW.
 *
 * On a page with a heading and a list of students that put the heading beside
 * the first card and pushed the leftmost content off the left edge of the
 * viewport (measured at x = -130px). `pageContainer` is right for the auth,
 * join and pay pages, which really do hold one card; it was never right here.
 */
export const teacherPage: React.CSSProperties = {
  maxWidth: TEACHER_CONTENT_WIDTH,
  margin: '0 auto',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}

/** Centres ONE card in the viewport. See teacherPage for what this is not. */
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