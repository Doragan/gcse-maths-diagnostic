/**
 * The investigation the homepage links to.
 *
 * Kept apart from app/Landing.tsx so a test can check it still exists without
 * rendering the page. It deliberately does NOT import data/investigations: that
 * registry carries every investigation's full content, and the landing page is
 * a performance-sensitive client bundle. The link needs only the skill id.
 *
 * Why this one: it is the only investigation outside visitors have used (the 7
 * Nov Reddit share), so it is the one we can read results for.
 */
export const HOME_INVESTIGATION_SKILL = 'understanding_straight_line_graphs'
