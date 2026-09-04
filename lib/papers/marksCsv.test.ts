import { describe, it, expect } from 'vitest'
import { parseMarksCsv, marksCsvTemplate, parsePastedNames, STUDENT_COLUMN } from './marksCsv'
import type { PaperConfig } from '../demoPapers'

const paper = {
  id: 'test-paper',
  title: 'Test',
  subtitle: 'Test',
  topics: [{ id: 'number', label: 'Number' }],
  questions: [
    { id: '1a', label: '1(a)', marks: 1, topic: 'number', skill: 'A', skillIds: ['indices'], kind: 'mastery', desc: '', visual: false },
    { id: '1b', label: '1(b)', marks: 3, topic: 'number', skill: 'B', skillIds: ['ratio'], kind: 'mastery', desc: '', visual: false },
    { id: '2',  label: '2',    marks: 2, topic: 'number', skill: 'C', skillIds: ['median'], kind: 'mastery', desc: '', visual: false },
  ],
  retrySet: {},
  challengeQuestions: [],
  sampleStudents: [],
  sampleMarks: {},
} as unknown as PaperConfig

const ok = (r: ReturnType<typeof parseMarksCsv>) => {
  if (!r.ok) throw new Error(`expected a successful parse, got: ${r.error}`)
  return r
}

describe('parseMarksCsv', () => {
  it('reads a straightforward file', () => {
    const r = ok(parseMarksCsv('Student,1(a),1(b),2\nAmira,1,3,2\nBen,0,1,2', paper))
    expect(r.rows).toEqual([
      { studentRef: 'Amira', marks: { '1a': 1, '1b': 3, '2': 2 } },
      { studentRef: 'Ben', marks: { '1a': 0, '1b': 1, '2': 2 } },
    ])
  })

  it('treats a blank cell as not attempted, NOT as zero', () => {
    // The distinction matters: a zero counts against the student, an absence
    // does not. A teacher who means zero types 0.
    const r = ok(parseMarksCsv('Student,1(a),1(b),2\nAmira,1,,0', paper))
    expect(r.rows[0].marks).toEqual({ '1a': 1, '2': 0 })
    expect('1b' in r.rows[0].marks).toBe(false)
  })

  it('accepts the question id as well as the printed label', () => {
    const r = ok(parseMarksCsv('Student,1a,1b,2\nAmira,1,3,2', paper))
    expect(r.rows[0].marks).toEqual({ '1a': 1, '1b': 3, '2': 2 })
  })

  it('ignores case, spaces and brackets in the headings', () => {
    const r = ok(parseMarksCsv('student, 1 (A) , 1B ,2\nAmira,1,3,2', paper))
    expect(r.rows[0].marks).toEqual({ '1a': 1, '1b': 3, '2': 2 })
  })

  it('survives quoted names containing a comma', () => {
    const r = ok(parseMarksCsv('Student,1(a)\n"Okonkwo, Ben",1', paper))
    expect(r.rows[0].studentRef).toBe('Okonkwo, Ben')
  })

  it('handles a doubled quote inside a quoted field', () => {
    const r = ok(parseMarksCsv('Student,1(a)\n"Ben ""BJ"" Okonkwo",1', paper))
    expect(r.rows[0].studentRef).toBe('Ben "BJ" Okonkwo')
  })

  it('takes columns in any order', () => {
    const r = ok(parseMarksCsv('2,Student,1(a)\n2,Amira,1', paper))
    expect(r.rows[0]).toEqual({ studentRef: 'Amira', marks: { '2': 2, '1a': 1 } })
  })

  it('ignores blank lines and a trailing newline', () => {
    const r = ok(parseMarksCsv('Student,1(a)\nAmira,1\n\nBen,0\n', paper))
    expect(r.rows.map(x => x.studentRef)).toEqual(['Amira', 'Ben'])
  })

  it('skips a row with no name rather than inventing an anonymous student', () => {
    const r = ok(parseMarksCsv('Student,1(a)\nAmira,1\n,1', paper))
    expect(r.rows).toHaveLength(1)
  })

  it('warns about a column it does not recognise, and carries on', () => {
    const r = ok(parseMarksCsv('Student,1(a),Effort\nAmira,1,B', paper))
    expect(r.rows[0].marks).toEqual({ '1a': 1 })
    expect(r.warnings.join(' ')).toContain('Effort')
  })

  it('ignores a column for a question that was not set', () => {
    const r = ok(parseMarksCsv('Student,1(a),2\nAmira,1,2', paper, ['1a']))
    expect(r.rows[0].marks).toEqual({ '1a': 1 })
    expect(r.warnings.join(' ')).toContain('not one of the ones you set')
  })
})

describe('parseMarksCsv — what it refuses', () => {
  // A silently dropped mark becomes a wrong sheet handed to a student, so these
  // stop the import rather than being waved through.
  it('refuses a mark above the question maximum', () => {
    const r = parseMarksCsv('Student,1(a)\nAmira,5', paper)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('between 0 and 1')
  })

  it('refuses a negative or fractional mark', () => {
    expect(parseMarksCsv('Student,1(b)\nAmira,-1', paper).ok).toBe(false)
    expect(parseMarksCsv('Student,1(b)\nAmira,1.5', paper).ok).toBe(false)
  })

  it('refuses a cell that is not a number, and says which row', () => {
    const r = parseMarksCsv('Student,1(a)\nAmira,1\nBen,absent', paper)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error).toContain('Ben')
      expect(r.error).toContain('Row 3')
    }
  })

  it('refuses the same student twice', () => {
    const r = parseMarksCsv('Student,1(a)\nAmira,1\namira,0', paper)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('twice')
  })

  it('refuses a file with no Student column', () => {
    const r = parseMarksCsv('Name,1(a)\nAmira,1', paper)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain(STUDENT_COLUMN)
  })

  it('refuses a file whose headings match no question', () => {
    const r = parseMarksCsv('Student,Effort,Attitude\nAmira,1,2', paper)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('No question columns matched')
  })

  it('refuses an empty file, and one with headings but no students', () => {
    expect(parseMarksCsv('', paper).ok).toBe(false)
    expect(parseMarksCsv('Student,1(a)', paper).ok).toBe(false)
  })
})

describe('marksCsvTemplate', () => {
  it('heads the file with the questions that were set', () => {
    expect(marksCsvTemplate(paper).split('\r\n')[0]).toBe('Student,1(a),1(b),2')
    expect(marksCsvTemplate(paper, [], ['1a', '2']).split('\r\n')[0]).toBe('Student,1(a),2')
  })

  it('carries the students already on screen, so names are not retyped', () => {
    const lines = marksCsvTemplate(paper, ['Amira', 'Ben']).split('\r\n')
    expect(lines[1]).toBe('Amira,,,')
    expect(lines[2]).toBe('Ben,,,')
  })

  it('quotes a name containing a comma', () => {
    expect(marksCsvTemplate(paper, ['Okonkwo, Ben']).split('\r\n')[1])
      .toBe('"Okonkwo, Ben",,,')
  })

  it('round-trips: its own output parses back', () => {
    const csv = marksCsvTemplate(paper, ['Amira', 'Ben'])
    const r = ok(parseMarksCsv(csv, paper))
    expect(r.rows.map(x => x.studentRef)).toEqual(['Amira', 'Ben'])
    // Every cell blank, so nothing is attempted yet.
    expect(r.rows.every(x => Object.keys(x.marks).length === 0)).toBe(true)
  })
})

describe('parsePastedNames', () => {
  it('reads a column of names', () => {
    expect(parsePastedNames('Amira\nBen\nCharlotte')).toEqual(['Amira', 'Ben', 'Charlotte'])
  })

  it('takes the first cell when a spreadsheet column is pasted', () => {
    expect(parsePastedNames('Amira\t11B\nBen\t11B')).toEqual(['Amira', 'Ben'])
  })

  it('drops blanks and duplicates', () => {
    expect(parsePastedNames('Amira\n\n  \nBen\namira')).toEqual(['Amira', 'Ben'])
  })
})
