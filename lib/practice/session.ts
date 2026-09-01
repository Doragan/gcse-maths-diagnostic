/**
 * When a practice session reaches a natural stopping point, and what to say
 * about it.
 *
 * ── Why a checkpoint exists ─────────────────────────────────────────────────
 * The session summary was already built, but reachable only by clicking a small
 * "End session" link in the header — so in practice a session had no ending. It
 * ran question → question → question until the student closed the tab, and the
 * summary was seen by whoever happened to find the link.
 *
 * That matters because of where this product actually loses people. Measured
 * 2026-09-01 over 56 students: 38 answered 6+ questions on their first day and
 * only 10 ever came back on a second. They have a real first session and then
 * leave. Everything else built for retention acts AFTER they have gone.
 *
 * ── Why ten ────────────────────────────────────────────────────────────────
 * Not chosen — measured. Across 120 sittings (attempts less than 30 minutes
 * apart) the median is 10, and the modal bucket is 10–14 with 42 of them. First
 * sittings have the same median. Ten is already what a session IS here, so the
 * checkpoint names the shape students had anyway rather than imposing one.
 *
 * ── A checkpoint, not a wall ───────────────────────────────────────────────
 * 27 of those 120 sittings ran past 15 questions, so a hard stop at 10 would
 * take something away from the most engaged students. The checkpoint recurs
 * every SESSION_LENGTH and never blocks: "keep practising" is always there.
 *
 * This is also the safer design for a service used by children, not just the
 * more effective one. A fixed length that can be COMPLETED makes stopping feel
 * like finishing; an endless stream has no win condition and no natural exit.
 * The summary's job is to make leaving feel earned — never to argue against it.
 */

/** Questions between checkpoints. Measured median sitting length. */
export const SESSION_LENGTH = 10

/**
 * True when `total` answers land exactly on a checkpoint.
 *
 * Recurs, so a student who keeps going gets another at 20 and 30 rather than one
 * ending followed by the old endless stream.
 */
export function isCheckpoint(total: number, length: number = SESSION_LENGTH): boolean {
  return total > 0 && total % sessionLength(length) === 0
}

/** Answers still to go before the next checkpoint. 0 when sitting on one. */
export function questionsToCheckpoint(total: number, length: number = SESSION_LENGTH): number {
  const n = sessionLength(length)
  if (total <= 0) return n
  return total % n === 0 ? 0 : n - (total % n)
}

/**
 * A nonsense length falls back to the default rather than clamping to 1.
 * Clamping looks safer and is worse: length 1 makes every single answer a
 * checkpoint, so a typo'd config would interrupt the student constantly —
 * exactly the behaviour the guard is meant to rule out.
 */
function sessionLength(length: number): number {
  return Number.isFinite(length) && length >= 1 ? Math.floor(length) : SESSION_LENGTH
}

export type SessionSkill = {
  masteredThisSession: boolean
  beforeCorrect: number
  beforeTotal: number
  correctInWindow: number
  totalInWindow: number
}

/**
 * The single skill closest to being mastered, and how many more it needs.
 *
 * This is the summary's forward-looking line — the one reason to come back that
 * is specific rather than a generic "see you soon". A named skill one question
 * from mastery is an open loop; "keep it up" is not.
 *
 * Skills already mastered this session are excluded: they are the celebration,
 * not the next step. Returns null when nothing is close enough to promise.
 */
export function closestToMastery(
  skills: Record<string, SessionSkill>,
): { skillId: string; remaining: number } | null {
  let best: { skillId: string; remaining: number } | null = null

  for (const [skillId, d] of Object.entries(skills)) {
    if (d.masteredThisSession) continue
    // Mirrors the mastery rule's rolling window: 4 of the last 5. Only a full
    // window supports a countdown — below five attempts the fast-track governs
    // and "N more" would be a different, wrong number.
    if (d.totalInWindow < 5) continue
    const remaining = 4 - d.correctInWindow
    if (remaining <= 0) continue
    if (!best || remaining < best.remaining || (remaining === best.remaining && skillId < best.skillId)) {
      best = { skillId, remaining }
    }
  }

  return best
}
