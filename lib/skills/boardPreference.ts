import { codedBoards } from './examProfile'

// ─────────────────────────────────────────────────────────────────────────────
// Which exam board the student is sitting.
//
// The exam panel on a skill page is scoped to a BOARD and a tier, because those
// are the two things a student actually sits. The tier has been switchable
// since the panel was built; the board was hard-coded to AQA, so an OCR student
// was shown AQA's numbers as though they were theirs.
//
// That is the same error the tier scoping exists to prevent, with one
// difference that makes it quieter: AQA is the only board coded in depth (15
// papers a tier, against 3 each for OCR and Edexcel), so switching board
// usually replaces a confident claim with "we haven't been through enough of
// those papers yet". That is the honest answer, and better than a confident
// claim about the wrong exam.
//
// Stored per browser, like the tier, and for the same reason: a `board` column
// on `students` would follow the account across devices but needs a migration.
// See tierPreference.ts, which this deliberately mirrors.
// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_KEY = 'mathsense_board'

/**
 * AQA by default — not a judgement about the student, but about the evidence:
 * it is the only slice with enough coded papers for most skills to clear the
 * bar, so it is the default that shows something rather than nothing.
 */
export const DEFAULT_BOARD = 'AQA'

/** Boards we hold coded papers for. Anything else cannot be scoped to. */
const isCodedBoard = (v: unknown): v is string =>
  typeof v === 'string' && codedBoards().includes(v)

/** Best known board for this browser. */
export function getBoard(): string {
  if (typeof window === 'undefined') return DEFAULT_BOARD

  try {
    const stored = localStorage.getItem(LOCAL_KEY)
    if (isCodedBoard(stored)) return stored
  } catch {
    // Private browsing, or storage disabled. The default is still correct.
  }
  return DEFAULT_BOARD
}

/** Persist the student's board. Ignores a board we hold no papers for. */
export function setBoard(board: string): void {
  if (typeof window === 'undefined' || !isCodedBoard(board)) return
  try {
    localStorage.setItem(LOCAL_KEY, board)
  } catch {
    // Nothing to do — the page still works, the choice just will not persist.
  }
}

/**
 * The board as a student would say it. "Pearson Edexcel" is how the audit codes
 * it and how the exam certificates read, but nobody calls it that, and the full
 * name pushes the switch off the side of a phone.
 */
export function boardLabel(board: string): string {
  return board === 'Pearson Edexcel' ? 'Edexcel' : board
}
