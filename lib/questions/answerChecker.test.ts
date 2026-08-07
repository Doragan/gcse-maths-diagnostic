import { describe, it, expect } from 'vitest'
import { checkAnswer } from './answerChecker'

// Convenience: most calls have no traps.
const check = (
  student: string,
  correct: string,
  type: 'exact' | 'numeric' | 'fraction' | 'expression' | 'set' | 'ratio' | 'coordinate',
  tol: number | null = null,
  traps: { answer: string; response: string }[] = [],
) => checkAnswer(student, correct, type, tol, traps)

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTERISATION — locks in the CURRENT behaviour of the grader so the
// equivalence extensions can't silently regress it. If one of these starts
// failing after a change, that change altered existing grading behaviour.
// ─────────────────────────────────────────────────────────────────────────────
describe('characterisation: numeric', () => {
  it('matches exact integers', () => {
    expect(check('25', '25', 'numeric', 0).correct).toBe(true)
  })
  it('ignores units on the student number', () => {
    expect(check('25 cm', '25', 'numeric', 0).correct).toBe(true)
  })
  it('is unit-safe for area units (33 cm² → 33, not 332)', () => {
    expect(check('33', '33 cm²', 'numeric', 0).correct).toBe(true)
  })
  it('nudges when units were expected but omitted', () => {
    const r = check('33', '33 cm²', 'numeric', 0)
    expect(r.correct).toBe(true)
    expect(r.message).toMatch(/units/i)
  })
  it('respects tolerance', () => {
    expect(check('10.4', '10', 'numeric', 0.5).correct).toBe(true)
    expect(check('11', '10', 'numeric', 0.5).correct).toBe(false)
  })
})

describe('characterisation: fraction', () => {
  it('accepts the same fraction', () => {
    expect(check('3/4', '3/4', 'fraction').correct).toBe(true)
  })
  it('rejects an unsimplified fraction when simplest form is required (default)', () => {
    const r = check('6/8', '3/4', 'fraction')
    expect(r.correct).toBe(false)
    expect(r.message).toMatch(/simplest/i)
  })
  it('accepts an unsimplified fraction with a reminder when simplest not required', () => {
    const r = checkAnswer('6/8', '3/4', 'fraction', null, [], false)
    expect(r.correct).toBe(true)
    expect(r.message).toMatch(/simplif/i)
  })
  it('accepts an exact decimal equivalent', () => {
    expect(check('0.75', '3/4', 'fraction').correct).toBe(true)
  })
  it('rejects a rounded decimal guess (0.1667 for 1/6)', () => {
    expect(check('0.1667', '1/6', 'fraction').correct).toBe(false)
  })
  it('rejects a LONG decimal truncation of a non-terminating fraction (4/11 loophole)', () => {
    // Previously "enough digits" crept under the 1e-9 exactness tolerance,
    // letting a student parrot a recurring decimal back instead of converting.
    const r = check('0.3636363636364', '4/11', 'fraction')
    expect(r.correct).toBe(false)
    expect(r.message).toMatch(/fraction/i)
  })
  it('rejects an ultra-precise decimal for 1/3 (no exact decimal form exists)', () => {
    expect(check('0.3333333333333333', '1/3', 'fraction').correct).toBe(false)
  })
  it('still accepts exact decimals for terminating fractions (0.35 for 7/20)', () => {
    expect(check('0.35', '7/20', 'fraction').correct).toBe(true)
  })
  it('still accepts a decimal for an unreduced-but-terminating canonical (0.5 for 3/6)', () => {
    expect(checkAnswer('0.5', '3/6', 'fraction', null, [], false).correct).toBe(true)
  })
})

describe('characterisation: exact', () => {
  it('matches caret and superscript powers', () => {
    expect(check('x^2', 'x²', 'exact').correct).toBe(true)
  })
  it('matches the word "pi" to π', () => {
    expect(check('pi', 'π', 'exact').correct).toBe(true)
  })
  it('treats unicode and ascii minus the same', () => {
    expect(check('x−3', 'x-3', 'exact').correct).toBe(true)
  })
})

describe('characterisation: expression (commutative)', () => {
  it('accepts reordered additive terms', () => {
    expect(check('6+2x', '2x+6', 'expression').correct).toBe(true)
  })
  it('accepts reordered multiplicative factors', () => {
    expect(check('(x+3)(x+2)', '(x+2)(x+3)', 'expression').correct).toBe(true)
  })
  it('accepts reordered solutions', () => {
    expect(check('x=-2andx=-3', 'x=-3andx=-2', 'expression').correct).toBe(true)
  })
})

describe('characterisation: set', () => {
  it('ignores order and separator style', () => {
    expect(check('20 10 5 4 2 1', '1,2,4,5,10,20', 'set').correct).toBe(true)
  })
  it('ignores case (letter-code combinations)', () => {
    // systematic_listing: "sc, sf, gc" should match "SC, SF, GC"
    expect(check('sc, sf, gc', 'SC, SF, GC', 'set').correct).toBe(true)
    expect(check('Sc Gc sF', 'SC, SF, GC', 'set').correct).toBe(true)
    expect(check('SC, SF', 'SC, SF, GC', 'set').correct).toBe(false) // incomplete still fails
  })
})

describe('currency symbols are ignored', () => {
  it('accepts £ in an expression answer asked "in pounds"', () => {
    expect(check('£3+£2m', '3+2m', 'expression').correct).toBe(true)
    expect(check('£3+2m', '3+2m', 'expression').correct).toBe(true)
    expect(check('3+2m', '3+2m', 'expression').correct).toBe(true)
  })
  it('accepts a currency symbol on a numeric answer', () => {
    expect(check('£5', '5', 'numeric').correct).toBe(true)
    expect(check('$5', '5', 'numeric').correct).toBe(true)
  })
  it('still marks a wrong money expression wrong', () => {
    expect(check('£2+£3m', '3+2m', 'expression').correct).toBe(false)
  })
})

describe('characterisation: traps', () => {
  it('returns the trap response on a known wrong answer', () => {
    const r = check('5', '6', 'numeric', 0, [
      { answer: '5', response: 'You added instead of multiplying.' },
    ])
    expect(r.correct).toBe(false)
    expect(r.trap?.response).toBe('You added instead of multiplying.')
  })
  it('gives the generic message on an unknown wrong answer', () => {
    const r = check('7', '6', 'numeric', 0)
    expect(r.correct).toBe(false)
    expect(r.trap).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NEW — equivalence extensions (increment 1)
// ─────────────────────────────────────────────────────────────────────────────
describe('ratio', () => {
  it('matches identical ratios', () => {
    expect(check('2:3', '2:3', 'ratio').correct).toBe(true)
  })
  it('rejects an unsimplified ratio when simplest form is required (default)', () => {
    const r = check('4:6', '2:3', 'ratio')
    expect(r.correct).toBe(false)
    expect(r.message).toMatch(/simplest/i)
  })
  it('ignores spaces around the colon', () => {
    expect(check('2 : 3', '2:3', 'ratio').correct).toBe(true)
  })
  it('accepts a decimal-scaled equivalent (1:1.5 = 2:3) when simplest not required', () => {
    expect(checkAnswer('1:1.5', '2:3', 'ratio', null, [], false).correct).toBe(true)
  })
  it('matches three-part ratios when simplest not required (2:4:6 = 1:2:3)', () => {
    expect(checkAnswer('2:4:6', '1:2:3', 'ratio', null, [], false).correct).toBe(true)
  })
  it('rejects a genuinely different ratio', () => {
    expect(check('3:2', '2:3', 'ratio').correct).toBe(false)
  })
  it('accepts an unsimplified ratio with a reminder when simplest not required', () => {
    const r = checkAnswer('4:6', '2:3', 'ratio', null, [], false)
    expect(r.correct).toBe(true)
    expect(r.message).toMatch(/simplif/i)
  })
  it('accepts the simplified ratio cleanly (no reminder)', () => {
    const r = check('2:3', '2:3', 'ratio')
    expect(r.correct).toBe(true)
    expect(r.message).toBe('Correct!')
  })
})

describe('coordinate', () => {
  it('matches identical coordinates', () => {
    expect(check('(2,1)', '(2,1)', 'coordinate').correct).toBe(true)
  })
  it('accepts missing brackets', () => {
    expect(check('2,1', '(2,1)', 'coordinate').correct).toBe(true)
  })
  it('ignores spaces', () => {
    expect(check('(2, 1)', '(2,1)', 'coordinate').correct).toBe(true)
  })
  it('accepts x=,y= labels', () => {
    expect(check('x=2, y=1', '(2,1)', 'coordinate').correct).toBe(true)
  })
  it('is order-sensitive: (1,2) ≠ (2,1)', () => {
    expect(check('(1,2)', '(2,1)', 'coordinate').correct).toBe(false)
  })
  it('accepts negative and fractional components', () => {
    expect(check('(-3,1/2)', '(-3,0.5)', 'coordinate').correct).toBe(true)
  })

  // A bare scalar is never the correct coordinate, but CAN be trapped so a
  // student who gives just the value gets targeted feedback.
  it('a lone value is not the coordinate answer', () => {
    expect(check('21', '(0,21)', 'coordinate').correct).toBe(false)
  })
  it('fires a bare-scalar trap when the student gives just the value', () => {
    const r = check('21', '(0,21)', 'coordinate', 0, [{ answer: '21', response: 'That is the y-value.' }])
    expect(r.correct).toBe(false)
    expect(r.trap).not.toBeNull()
    expect(r.message).toBe('That is the y-value.')
  })
  it('a bare-scalar trap does NOT fire on a coordinate answer', () => {
    // Student gave a full (wrong) coordinate — the bare trap must not match it.
    const r = check('(3,0)', '(0,21)', 'coordinate', 0, [{ answer: '21', response: 'value only' }])
    expect(r.trap).toBeNull()
  })
  it('the correct coordinate never triggers a bare-scalar trap', () => {
    const r = check('(0,21)', '(0,21)', 'coordinate', 0, [{ answer: '21', response: 'value only' }])
    expect(r.correct).toBe(true)
    expect(r.trap).toBeNull()
  })
  it('still matches a coordinate-shaped trap (e.g. axes swapped)', () => {
    const r = check('(21,0)', '(0,21)', 'coordinate', 0, [{ answer: '(21,0)', response: 'axes swapped' }])
    expect(r.message).toBe('axes swapped')
  })
})

describe('implied multiplication / π / surds', () => {
  it('accepts 135*π for 135π', () => {
    expect(check('135*π', '135π', 'exact').correct).toBe(true)
  })
  it('accepts 135 π (spaces) for 135π', () => {
    expect(check('135 π', '135π', 'exact').correct).toBe(true)
  })
  it('accepts 3*√2 for 3√2', () => {
    expect(check('3*√2', '3√2', 'exact').correct).toBe(true)
  })
  it('accepts √(2) for √2', () => {
    expect(check('√(2)', '√2', 'exact').correct).toBe(true)
  })
  it('keeps numeric products splittable (5*3*2^2 = 2^2*3*5)', () => {
    expect(check('5*3*2^2', '2^2*3*5', 'expression').correct).toBe(true)
  })
})

describe('pi word form ("pi" → π)', () => {
  it('accepts standalone "pi" for π', () => {
    expect(check('pi', 'π', 'exact').correct).toBe(true)
  })
  it('accepts "pi" glued to a number — the π keypad button produces "36pi"', () => {
    expect(check('36pi', '36π', 'exact').correct).toBe(true)
  })
  it('accepts "2pi" for 2π', () => {
    expect(check('2pi', '2π', 'exact').correct).toBe(true)
  })
  it('accepts "pi" next to an operator (2*pi = 2π)', () => {
    expect(check('2*pi', '2π', 'exact').correct).toBe(true)
  })
  it('accepts uppercase "PI"', () => {
    expect(check('36PI', '36π', 'exact').correct).toBe(true)
  })
  it('does not convert "pi" embedded in a word (set answer "pink")', () => {
    // "pink" must survive untouched — would mismatch "πnk" if over-eager.
    expect(check('pink', 'pink', 'set').correct).toBe(true)
    expect(check('pink', 'πnk', 'exact').correct).toBe(false)
  })
  it('accepts "pi" glued straight onto a unit — "9picm^2" for "9π cm²"', () => {
    // Exactly what the π keypad button produces: 9 → "pi" → "cm^2".
    expect(check('9picm^2', '9π cm²', 'exact').correct).toBe(true)
  })
  it('accepts "9pi cm^2" (spaced) for "9π cm²"', () => {
    expect(check('9pi cm^2', '9π cm²', 'exact').correct).toBe(true)
  })
})

describe('units handling (exact / expression)', () => {
  it('accepts a unit-less exact answer with correct units added (36π cm² for 36π)', () => {
    const r = check('36π cm²', '36π', 'exact')
    expect(r.correct).toBe(true)
    // Adding units where none were required needs no reminder.
    expect(r.message).toBe('Correct!')
  })
  it('accepts the bare value when the answer carries units, with a reminder (36π for 36π cm²)', () => {
    const r = check('36π', '36π cm²', 'exact')
    expect(r.correct).toBe(true)
    expect(r.message).toMatch(/units/i)
  })
  it('still accepts an exact match that includes the same units', () => {
    expect(check('36π cm²', '36π cm²', 'exact').correct).toBe(true)
  })
  it('triggers a trap written without units when the student adds units', () => {
    const r = check('12π cm²', '36π', 'exact', null, [
      { answer: '12π', response: 'That is the circumference.' },
    ])
    expect(r.correct).toBe(false)
    expect(r.trap?.response).toBe('That is the circumference.')
  })
  it('does not falsely accept a genuinely wrong value because of units', () => {
    expect(check('40π cm²', '36π', 'exact').correct).toBe(false)
  })
})

describe('rounding feedback (numeric, Bucket B)', () => {
  it('rejects a one-place-out answer with a rounding hint', () => {
    const r = check('157.07', '157.08', 'numeric', 0)
    expect(r.correct).toBe(false)
    expect(r.message).toMatch(/rounded/i)
  })
  it('also catches one-place-out on the high side', () => {
    expect(check('157.09', '157.08', 'numeric', 0).correct).toBe(false)
  })
  it('accepts the full unrounded value with a "round to N dp" reminder', () => {
    const r = check('157.0796', '157.08', 'numeric', 0)
    expect(r.correct).toBe(true)
    expect(r.message).toMatch(/2 decimal places/i)
  })
  it('uses singular "place" for 1 dp', () => {
    const r = check('3.14159', '3.1', 'numeric', 0)
    expect(r.correct).toBe(true)
    expect(r.message).toMatch(/1 decimal place\b/)
  })
  it('does not fire on integer answers', () => {
    const r = check('41', '42', 'numeric', 0)
    expect(r.correct).toBe(false)
    expect(r.message).not.toMatch(/rounded/i)
    expect(r.message).toMatch(/correct answer is 42/i)
  })
  it('stays inert on an irrational/over-precise canonical (dp > 4)', () => {
    // A near-miss against a 6-dp canonical is just wrong, no rounding hint.
    const r = check('3.141500', '3.141593', 'numeric', 0)
    expect(r.correct).toBe(false)
    expect(r.message).not.toMatch(/rounded/i)
  })
  it('a genuine miss bigger than one place is plain wrong', () => {
    const r = check('150.00', '157.08', 'numeric', 0)
    expect(r.message).not.toMatch(/rounded/i)
  })
  it('never overrides a within-tolerance answer', () => {
    expect(check('157.07', '157.08', 'numeric', 0.5).correct).toBe(true) // tol covers it
  })
  it('an authored trap still wins over the rounding hint', () => {
    const r = check('157.07', '157.08', 'numeric', 0, [{ answer: '157.07', response: 'You truncated.' }])
    expect(r.trap?.response).toBe('You truncated.')
  })
})

describe('inequality equivalence', () => {
  it('matches identical inequalities', () => {
    expect(check('x≤-3/5', 'x≤-3/5', 'expression').correct).toBe(true)
  })
  it('accepts flipped direction with swapped operands', () => {
    expect(check('-3/5≥x', 'x≤-3/5', 'expression').correct).toBe(true)
  })
  it('accepts a decimal-equivalent bound (-0.6 = -3/5)', () => {
    expect(check('x≤-0.6', 'x≤-3/5', 'expression').correct).toBe(true)
  })
  it('respects strictness (< is not ≤)', () => {
    expect(check('x<-3/5', 'x≤-3/5', 'expression').correct).toBe(false)
  })
  it('respects the variable side / direction', () => {
    expect(check('x≥-3/5', 'x≤-3/5', 'expression').correct).toBe(false)
  })
})
