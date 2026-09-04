import type { PaperConfig, PaperQuestion } from '../demoPapers'
import { selectedItems, type ItemMarks, type ItemSelection } from './sittingMarks'

// ─────────────────────────────────────────────────────────────────────────────
// Marks in and out as CSV.
//
// This is the decided answer to "how do marks get in" (docs/audit/16, Part 9):
// a spreadsheet of students by question marks, NOT a scan of a marked paper.
// It matters more than its size suggests — if the only way in is typing thirty
// students into a grid, the marking tool's zero rows may never have been a
// catalogue problem at all.
//
// PURE ON PURPOSE. No File, no FileReader, no DOM: the caller reads the text and
// passes it in, so every parsing decision below is testable without a browser.
//
// FORGIVING ON INPUT, STRICT ON MEANING. A teacher's spreadsheet will have
// stray whitespace, quoted names, a trailing blank line and columns in a
// different order — all fine. What is NOT waved through is a mark that cannot
// be trusted: out of range, fractional, or against a question that was not set.
// Those stop the import rather than being silently dropped, because a silently
// dropped mark becomes a wrong sheet handed to a student.
// ─────────────────────────────────────────────────────────────────────────────

/** The header of the student-name column. Matched case-insensitively. */
export const STUDENT_COLUMN = 'Student'

export type ParsedRow = { studentRef: string; marks: ItemMarks }

export type ParseResult =
  | { ok: true; rows: ParsedRow[]; warnings: string[] }
  | { ok: false; error: string }

/**
 * One CSV field, handling quotes so a name like "Okonkwo, Ben" survives.
 *
 * Hand-rolled rather than pulled from a dependency: the format here is one
 * header row and numbers, and a CSV library would be a larger surface than the
 * problem.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      // A doubled quote inside a quoted field is a literal quote.
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      out.push(field); field = ''
    } else {
      field += ch
    }
  }
  out.push(field)
  return out.map(f => f.trim())
}

/**
 * Match a header cell to a paper question.
 *
 * Accepts the LABEL as printed on the paper ("11(c)") or the internal id
 * ("11c"), and ignores case, spaces and brackets — a teacher retyping a header
 * should not have to reproduce punctuation exactly.
 */
function normaliseHeader(s: string): string {
  return s.toLowerCase().replace(/[\s()._-]/g, '')
}

function questionForHeader(header: string, questions: PaperQuestion[]): PaperQuestion | undefined {
  const want = normaliseHeader(header)
  return questions.find(q => normaliseHeader(q.label) === want || normaliseHeader(q.id) === want)
}

/**
 * Parse a marks CSV against a paper and the questions that were set.
 *
 * Blank cells mean NOT ATTEMPTED and produce no mark, which is not the same as
 * a zero — the sheet counts a zero against the student and ignores an absence.
 * A teacher who means zero types 0.
 */
export function parseMarksCsv(
  text: string,
  paper: PaperConfig,
  selection?: ItemSelection,
): ParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (!lines.length) return { ok: false, error: 'That file is empty.' }

  const header = splitCsvLine(lines[0])
  const studentCol = header.findIndex(h => h.toLowerCase() === STUDENT_COLUMN.toLowerCase())
  if (studentCol === -1) {
    return {
      ok: false,
      error: `The first row needs a "${STUDENT_COLUMN}" column. Download the template if you are not sure of the format.`,
    }
  }

  const set = selectedItems(paper, selection)
  const setIds = new Set(set.map(q => q.id))
  const warnings: string[] = []

  // Map each column to a question, once, so an unknown column is reported by
  // name rather than as a mystery failure on row 14.
  const columns: (PaperQuestion | null)[] = header.map((h, i) => {
    if (i === studentCol) return null
    if (!h) return null
    const q = questionForHeader(h, paper.questions)
    if (!q) {
      warnings.push(`Ignored a column headed "${h}" — no question on this paper matches it.`)
      return null
    }
    if (!setIds.has(q.id)) {
      warnings.push(`Ignored "${h}" — that question was not one of the ones you set.`)
      return null
    }
    return q
  })

  if (!columns.some(Boolean)) {
    return { ok: false, error: 'No question columns matched this paper. Check the headings against the template.' }
  }

  const rows: ParsedRow[] = []
  const seen = new Set<string>()

  for (let r = 1; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r])
    const studentRef = cells[studentCol] ?? ''
    // A row with no name is almost always a stray line from the spreadsheet
    // rather than an anonymous student.
    if (!studentRef) continue

    const key = studentRef.toLowerCase()
    if (seen.has(key)) {
      return { ok: false, error: `"${studentRef}" appears twice. Each student needs one row.` }
    }
    seen.add(key)

    const marks: ItemMarks = {}
    for (let c = 0; c < columns.length; c++) {
      const q = columns[c]
      if (!q) continue
      const raw = (cells[c] ?? '').trim()
      // Blank means not attempted, which is not a zero.
      if (raw === '') continue

      const value = Number(raw)
      if (!Number.isFinite(value)) {
        return { ok: false, error: `Row ${r + 1} (${studentRef}): "${raw}" is not a number, under ${q.label}.` }
      }
      if (!Number.isInteger(value) || value < 0 || value > q.marks) {
        return {
          ok: false,
          error: `Row ${r + 1} (${studentRef}): ${q.label} must be a whole number between 0 and ${q.marks}, not ${raw}.`,
        }
      }
      marks[q.id] = value
    }
    rows.push({ studentRef, marks })
  }

  if (!rows.length) return { ok: false, error: 'That file has headings but no students.' }
  return { ok: true, rows, warnings }
}

/**
 * A blank CSV for this paper, so the expected shape is discoverable rather than
 * documented somewhere nobody reads.
 *
 * Includes the students already on screen, so the round trip is "download,
 * fill in, upload" rather than "download, retype the names, fill in, upload".
 */
export function marksCsvTemplate(
  paper: PaperConfig,
  studentRefs: string[] = [],
  selection?: ItemSelection,
): string {
  const set = selectedItems(paper, selection)
  const header = [STUDENT_COLUMN, ...set.map(q => q.label)]
  // A second header row would break the parser, so the per-question maximum
  // goes in a comment column at the end where it is visible but harmless.
  const rows = studentRefs.length ? studentRefs : ['']
  return [
    header.map(csvCell).join(','),
    ...rows.map(name => [csvCell(name), ...set.map(() => '')].join(',')),
  ].join('\r\n')
}

/** Quote a field only when it needs it, so the file stays readable. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Names pasted one per line, as a class list arrives from a register. */
export function parsePastedNames(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of text.split(/\r?\n/)) {
    // Tolerate a pasted spreadsheet column: take the first cell of each row.
    const name = line.split(/[\t,]/)[0].trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}
