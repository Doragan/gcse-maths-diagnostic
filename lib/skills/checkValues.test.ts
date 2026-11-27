import { describe, it, expect } from 'vitest'
import { numbersIn, repeatsNumbers } from './checkValues'

describe('numbersIn', () => {
  it('reads pounds, pence, decimals and thousands out of text and HTML', () => {
    expect(numbersIn('<p>Share <strong>£4.20</strong> in the ratio 3 : 5</p>')).toEqual([4.2, 3, 5])
    expect(numbersIn('Sam has 1,100 g of flour and 900 g')).toEqual([1100, 900])
    expect(numbersIn('£4.20 is the same as £4.2')).toEqual([4.2, 4.2])
  })

  it('keeps numbers in a list apart, and reads none from plain words', () => {
    expect(numbersIn('3, 5 and 7')).toEqual([3, 5, 7])
    expect(numbersIn('What fraction are red?')).toEqual([])
  })
})

describe('repeatsNumbers', () => {
  const stage = 'Amy and Ben share some money in the ratio 3 : 5. Ben gets £25. How much does Amy get?'

  it('catches the check drawn on the very numbers the section just worked', () => {
    // Seen live in ratio section 2 (2026-11-27).
    expect(repeatsNumbers('<p>Amy and Ben share some money in the ratio <strong>3 : 5</strong>.</p>'
      + '<p>Ben gets <strong>£25</strong>.</p><p>How much does Amy get?</p>', stage)).toBe(true)
  })

  it('lets through a check that only shares some of them', () => {
    expect(repeatsNumbers('In the ratio 3 : 5, Ben gets £40.', stage)).toBe(false)
    expect(repeatsNumbers('In the ratio 2 : 7, Ben gets £28.', stage)).toBe(false)
  })

  it('repeats nothing when the question has no numbers', () => {
    expect(repeatsNumbers('Which pack is better value?', stage)).toBe(false)
  })

  it('matches £4.20 with £4.2, and 1,100 with 1100', () => {
    expect(repeatsNumbers('£4.2 for 1100 g', 'It costs £4.20 for 1,100 g.')).toBe(true)
  })
})
