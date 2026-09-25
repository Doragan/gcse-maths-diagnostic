import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getBoard, setBoard, boardLabel, DEFAULT_BOARD } from './boardPreference'
import { codedBoards } from './examProfile'

// ─────────────────────────────────────────────────────────────────────────────
// The board scopes every claim in the exam panel. Storing one we hold no papers
// for would send getExamProfile looking for a slice that does not exist, and
// the panel would silently show nothing — so the guard on the way IN matters
// more than the one on the way out.
// ─────────────────────────────────────────────────────────────────────────────

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
  })
})

afterEach(() => { vi.unstubAllGlobals() })

describe('board preference', () => {
  it('defaults to a board we actually hold papers for', () => {
    expect(codedBoards()).toContain(DEFAULT_BOARD)
    expect(getBoard()).toBe(DEFAULT_BOARD)
  })

  it('round-trips every coded board', () => {
    for (const b of codedBoards()) {
      setBoard(b)
      expect(getBoard()).toBe(b)
    }
  })

  it('ignores a board we hold no papers for', () => {
    setBoard('AQA')
    setBoard('WJEC')          // real board, no coded papers
    expect(getBoard()).toBe('AQA')
  })

  it('falls back to the default when storage holds something unusable', () => {
    store.set('mathsense_board', 'Pearson')   // close, but not how the audit codes it
    expect(getBoard()).toBe(DEFAULT_BOARD)
  })

  it('survives storage throwing, as in private browsing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
    })
    expect(getBoard()).toBe(DEFAULT_BOARD)
    expect(() => setBoard('OCR')).not.toThrow()
  })

  it('does not touch storage during server rendering', () => {
    vi.stubGlobal('window', undefined)
    expect(getBoard()).toBe(DEFAULT_BOARD)
    setBoard('OCR')
    expect(store.size).toBe(0)
  })
})

describe('boardLabel', () => {
  it('shortens the one board nobody calls by its full name', () => {
    expect(boardLabel('Pearson Edexcel')).toBe('Edexcel')
  })

  it('leaves the others alone', () => {
    expect(boardLabel('AQA')).toBe('AQA')
    expect(boardLabel('OCR')).toBe('OCR')
  })

  it('gives every coded board a label short enough for the switch', () => {
    // Three buttons plus padding have to fit a 375px phone alongside nothing
    // else. Anything much longer than "Edexcel" pushes the switch off the side.
    for (const b of codedBoards()) {
      expect(boardLabel(b).length, `${b} renders as a long label`).toBeLessThanOrEqual(10)
    }
  })
})
