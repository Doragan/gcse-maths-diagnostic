// ─────────────────────────────────────────────────────────────────────────────
// Class join codes — the alphabet and the generator, in one place.
//
// Extracted when code rotation was added: creation and rotation must mint codes
// from the SAME alphabet, or a rotated class would start handing out codes with
// characters the original set deliberately excludes.
//
// The alphabet omits I, O, 0 and 1. These get read aloud across a classroom and
// copied off a whiteboard, so the ambiguous pairs are the ones that generate
// "it says the code is wrong" support questions.
// ─────────────────────────────────────────────────────────────────────────────

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Length of a join code. Also the length the join endpoint validates against. */
export const CLASS_CODE_LENGTH = 4

/**
 * A fresh random join code.
 *
 * 32^4 ≈ 1.05M combinations. Collisions are handled by the caller retrying
 * against the UNIQUE constraint on `classes.code` rather than by checking here,
 * so the generator stays pure and testable.
 */
export function generateClassCode(): string {
  let code = ''
  for (let i = 0; i < CLASS_CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

/**
 * A code drawn from this alphabet, at the right length.
 *
 * Deliberately NOT used to validate codes arriving at the join endpoint: that
 * still checks length only. Every code in the database was minted here, so the
 * two agree today — but tightening the join check to the alphabet would turn
 * any future alphabet change into a silent lockout of every existing class.
 */
export function isWellFormedClassCode(code: string): boolean {
  if (code.length !== CLASS_CODE_LENGTH) return false
  return [...code].every(ch => ALPHABET.includes(ch))
}
