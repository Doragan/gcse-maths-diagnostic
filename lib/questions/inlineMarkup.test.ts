import { describe, it, expect } from 'vitest'
import { parseInline, plainText, type InlineToken } from './inlineMarkup'

/** Compact rendering of a token list, so an assertion is readable. */
const show = (tokens: InlineToken[]): string =>
  tokens.map(t =>
    t.kind === 'break' ? '¶'
      : t.kind === 'frac' ? `[${show(t.num)}÷${show(t.den)}]`
        : t.kind === 'sup' ? `^(${t.text})`
          : t.kind === 'sub' ? `_(${t.text})`
            : t.text).join('')

describe('the website\'s markup', () => {
  // The point of this module: the bank writes prompts as HTML and paper
  // questions were plain strings, so the same "x squared" was spelled two ways
  // and neither could be pasted into the other.
  it('reads sup, sub and br', () => {
    expect(show(parseInline('3x<sup>2</sup>'))).toBe('3x^(2)')
    expect(show(parseInline('a<sub>1</sub>'))).toBe('a_(1)')
    expect(show(parseInline('one<br>two'))).toBe('one¶two')
    expect(show(parseInline('one<br />two'))).toBe('one¶two')
  })

  it('decodes the entities a browser would', () => {
    expect(plainText(parseInline('x &le; 4'))).toBe('x ≤ 4')
    expect(plainText(parseInline('&pi;r&sup2;'))).toBe('πr&sup2;')  // &sup2; is not one we claim
    expect(plainText(parseInline('a &amp; b'))).toBe('a & b')
    expect(plainText(parseInline('&#960; and &#x3c0;'))).toBe('π and π')
  })

  it('is case-insensitive about tags, as HTML is', () => {
    expect(show(parseInline('3x<SUP>2</SUP>'))).toBe('3x^(2)')
  })
})

describe('notation without any markup', () => {
  // Existing paper data is full of these, and an author should never have to
  // write <sup> for something a keyboard already produces.
  it('raises Unicode superscripts, keeping a run together', () => {
    expect(show(parseInline('10⁻⁴'))).toBe('10^(-4)')
    expect(show(parseInline('x²y³'))).toBe('x^(2)y^(3)')
  })

  it('lowers Unicode subscripts', () => {
    expect(show(parseInline('H₂O'))).toBe('H_(2)O')
  })

  it('stacks the single-character fractions', () => {
    expect(show(parseInline('⅓ of 90'))).toBe('[1÷3] of 90')
    expect(show(parseInline('½'))).toBe('[1÷2]')
  })
})

describe('fractions', () => {
  it('takes the concise spelling', () => {
    expect(show(parseInline('<frac>3/4</frac>'))).toBe('[3÷4]')
  })

  it('takes the structured spelling a browser can stack', () => {
    expect(show(parseInline('<frac><n>3</n><d>4</d></frac>'))).toBe('[3÷4]')
  })

  it('splits on the LAST top-level slash, so a numerator may hold one', () => {
    expect(show(parseInline('<frac>(y-5)/3</frac>'))).toBe('[(y-5)÷3]')
  })

  it('carries markup inside the numerator', () => {
    expect(show(parseInline('<frac>x²/2</frac>'))).toBe('[x^(2)÷2]')
  })

  it('shows the content rather than swallowing it when there is no slash', () => {
    expect(show(parseInline('<frac>oops</frac>'))).toBe('oops')
  })
})

describe('text that only looks like markup', () => {
  // Stripping unknown tags would quietly delete content, and a stray "<" in a
  // maths question is far likelier than a tag this does not know.
  it('keeps a less-than sign', () => {
    expect(plainText(parseInline('Solve x < 5'))).toBe('Solve x < 5')
    expect(plainText(parseInline('0 < s ≤ 10 000'))).toBe('0 < s ≤ 10 000')
  })

  it('keeps an unknown tag as text', () => {
    expect(plainText(parseInline('a <weird> b'))).toBe('a <weird> b')
  })

  it('keeps an unclosed tag as text rather than eating the rest', () => {
    expect(plainText(parseInline('3x<sup>2 and more'))).toBe('3x<sup>2 and more')
  })

  it('leaves an inequality chain alone', () => {
    expect(plainText(parseInline('10 ≤ t < 20    frequency 18')))
      .toBe('10 ≤ t < 20    frequency 18')
  })
})

describe('plainText', () => {
  it('round-trips a fraction as a slash', () => {
    expect(plainText(parseInline('<frac>3/4</frac> of 20'))).toBe('3/4 of 20')
  })

  it('turns a break into a newline', () => {
    expect(plainText(parseInline('one<br>two'))).toBe('one\ntwo')
  })
})
