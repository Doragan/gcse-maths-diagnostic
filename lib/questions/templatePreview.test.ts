import { describe, it, expect } from 'vitest'
import { templatePreview, templatePreviewShort } from './templatePreview'

describe('templatePreview', () => {
  it('handles the shape a real template actually has', () => {
    // Taken from the bank: HTML wrapper, bold, {{ }} parameters.
    expect(templatePreview('<p>Calculate <strong>{{a}} × {{b}}</strong></p>'))
      .toBe('Calculate […] × […]')
  })

  it('replaces a {{ }} parameter, not the {{a} the old pattern matched', () => {
    // The bug this file exists for: /\{[^}]+\}/ leaves a stray brace.
    const out = templatePreview('{{a}} and {{b}}')
    expect(out).toBe('[…] and […]')
    expect(out).not.toContain('}')
  })

  it('leaves a single-brace SET alone — it is maths, not a parameter', () => {
    expect(templatePreview('<p>List the members of {1, 2, 3}</p>'))
      .toBe('List the members of {1, 2, 3}')
  })

  it('takes a parameter spanning more than one line', () => {
    expect(templatePreview('Work out {{\n  a + b\n}} exactly')).toBe('Work out […] exactly')
  })

  it('keeps two parameters separate rather than eating the text between', () => {
    expect(templatePreview('{{a}} of {{b}}')).toBe('[…] of […]')
  })

  describe('diagrams', () => {
    it('removes an svg whole, so its labels do not fall into the sentence', () => {
      const t = '<p>Find angle x</p><svg><text>12</text><text>A</text><line/></svg>'
      const out = templatePreview(t)
      expect(out).toBe('Find angle x [diagram]')
      expect(out).not.toContain('12')
      expect(out).not.toContain('A')
    })

    it('handles an svg carrying attributes and nested groups', () => {
      const t = '<p>The shape</p><svg viewBox="0 0 10 10" class="d"><g><polygon points="1,2"/><text x="3">P</text></g></svg><p>is a kite.</p>'
      expect(templatePreview(t)).toBe('The shape [diagram] is a kite.')
    })

    it('drops MathML without leaving its digits behind', () => {
      expect(templatePreview('<p>Evaluate <math><msup><mn>2</mn><mn>5</mn></msup></math></p>'))
        .toBe('Evaluate')
    })
  })

  it('separates block elements instead of running them together', () => {
    expect(templatePreview('<p>First.</p><p>Second.</p>')).toBe('First. Second.')
  })

  describe('punctuation left stranded by tag stripping', () => {
    it('closes up a full stop that followed a closing tag', () => {
      expect(templatePreview('<p>Round <strong>{{a}}</strong> to 1 dp.</p>'))
        .toBe('Round […] to 1 dp.')
      expect(templatePreview('<p>Pay <strong>7</strong>.</p>')).toBe('Pay 7.')
    })

    it('closes up the other marks that cannot follow a space', () => {
      expect(templatePreview('a <b>x</b>, b <b>y</b>; c <b>z</b>? d <b>w</b>!'))
        .toBe('a x, b y; c z? d w!')
      expect(templatePreview('<p>(<strong>3</strong>)</p>')).toBe('(3)')
      expect(templatePreview('<p><strong>50</strong>%</p>')).toBe('50%')
    })

    it('keeps a space that belongs there', () => {
      // An opening bracket and a currency symbol both follow a real space.
      expect(templatePreview('<p>Work out {{a}} (in £)</p>')).toBe('Work out […] (in £)')
      expect(templatePreview('<p>It costs £{{a}}</p>')).toBe('It costs £[…]')
    })
  })

  it('decodes the entities the bank actually contains', () => {
    expect(templatePreview('a&nbsp;b &#215; c &minus; d &#8594; e &lt;f&gt;'))
      .toBe('a b × c − d → e <f>')
  })

  it('collapses the whitespace a multi-line template carries', () => {
    expect(templatePreview('<p>\n  Work   out\n  {{a}}\n</p>')).toBe('Work out […]')
  })

  it('is empty, not a crash, for a missing template', () => {
    expect(templatePreview(null)).toBe('')
    expect(templatePreview(undefined)).toBe('')
    expect(templatePreview('')).toBe('')
  })

  it('survives a template that is nothing but a diagram', () => {
    expect(templatePreview('<svg><text>1</text></svg>')).toBe('[diagram]')
  })
})

describe('templatePreviewShort', () => {
  it('leaves a short preview alone', () => {
    expect(templatePreviewShort('<p>Short one</p>')).toBe('Short one')
  })

  it('cuts a long one and marks it', () => {
    const out = templatePreviewShort('<p>' + 'word '.repeat(80) + '</p>', 50)
    expect(out.length).toBeLessThanOrEqual(51)
    expect(out.endsWith('…')).toBe(true)
  })

  it('cuts on a word boundary rather than mid-word', () => {
    const out = templatePreviewShort('alpha bravo charlie delta echo foxtrot', 20)
    expect(out).toBe('alpha bravo charlie…')
  })

  it('cuts mid-word rather than throwing away most of the line', () => {
    // No space anywhere near the limit, so a word-boundary cut would lose it all.
    const out = templatePreviewShort('a' + 'b'.repeat(200), 30)
    expect(out).toHaveLength(31)
  })

  it('does not leave a space before the ellipsis', () => {
    expect(templatePreviewShort('alpha bravo charlie delta', 12)).toBe('alpha bravo…')
  })
})
