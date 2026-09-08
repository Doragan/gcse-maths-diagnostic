/**
 * ONE notation for question text, on the website and on paper.
 *
 * The website renders an authored prompt as raw HTML (MultiPartQuestion.tsx
 * hands it to dangerouslySetInnerHTML), and the bank uses a small, stable
 * slice of it: <sup>, <sub>, <br>, and HTML entities. Paper questions grew up
 * separately as plain strings, so the two surfaces had drifted — the same
 * "x squared" was <sup>2</sup> in the bank and x² in a paper, and neither
 * could be pasted into the other.
 *
 * This parses that shared vocabulary into tokens a renderer can draw. The
 * browser needs none of it, which is the point: authored text stays valid HTML
 * and the site keeps rendering it natively, while the PDF gets the same
 * meaning through here.
 *
 * <frac> is the one addition, and it is new to BOTH surfaces. Fraction
 * notation is the thing paper questions most obviously lacked — "45p as a
 * fraction of £1.50" wants a stacked answer, not "45/150" — and there was
 * nothing to reuse, because the site had no fraction display either (KaTeX is
 * loaded in MathInput.tsx for the ANSWER BOX preview only, never for a stem).
 * It is deliberately not a real HTML element: an unknown inline tag renders
 * its children, so <frac>3/4</frac> reads as "3/4" in any browser even with no
 * stylesheet, and app/globals.css then stacks it properly.
 *
 * Everything here is format-agnostic and DOM-free — same reason gridSvg.ts is.
 */

/** A parsed piece of question text. `frac` nests, one level. */
export type InlineToken =
  | { kind: 'text' | 'sup' | 'sub'; text: string }
  | { kind: 'break' }
  | { kind: 'frac'; num: InlineToken[]; den: InlineToken[] }

/**
 * Entities the bank actually uses, plus the maths ones worth having.
 *
 * Decoded to the real character rather than left as HTML, so a renderer sees
 * "≤" whether the author wrote "≤" or "&le;". The browser does this itself.
 */
const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  times: '×', divide: '÷', minus: '−', plusmn: '±', ne: '≠',
  le: '≤', ge: '≥', deg: '°', pi: 'π', radic: '√', infin: '∞',
  rarr: '→', larr: '←', theta: 'θ', alpha: 'α', beta: 'β', pound: '£',
}

/** Unicode superscript digits and signs, to the characters they stand for. */
const SUPERSCRIPT: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁻': '-', '⁺': '+', 'ⁿ': 'n', 'ˣ': 'x',
}

/** Unicode subscript digits, for things like H₂O and a₁. */
const SUBSCRIPT: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
}

/**
 * Single-character fractions, which are worth expanding rather than drawing.
 *
 * ½ is in WinAnsi and prints fine, but ⅓ and ⅕ are not, and were being spelled
 * "1/3" at the PDF boundary. As a `frac` they now stack like any other, and
 * the data needs no edit.
 */
const VULGAR: Record<string, [string, string]> = {
  '½': ['1', '2'], '⅓': ['1', '3'], '⅔': ['2', '3'], '¼': ['1', '4'],
  '¾': ['3', '4'], '⅕': ['1', '5'], '⅖': ['2', '5'], '⅗': ['3', '5'],
  '⅘': ['4', '5'], '⅙': ['1', '6'], '⅚': ['5', '6'], '⅛': ['1', '8'],
  '⅜': ['3', '8'], '⅝': ['5', '8'], '⅞': ['7', '8'],
}

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10)
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : whole
    }
    return ENTITIES[body.toLowerCase()] ?? whole
  })
}

/**
 * Split a plain run on the characters that ARE notation without any markup —
 * x², H₂O, ⅔ — so an author never has to write <sup> for something a keyboard
 * can already produce, and so the existing paper data keeps working unchanged.
 */
function splitBareNotation(text: string): InlineToken[] {
  const out: InlineToken[] = []
  let plain = ''
  const flush = () => { if (plain) { out.push({ kind: 'text', text: plain }); plain = '' } }

  for (const ch of text) {
    if (SUPERSCRIPT[ch]) {
      const last = out[out.length - 1]
      // Consecutive superscripts are one exponent: 10⁻⁴ is a single "-4".
      if (!plain && last?.kind === 'sup') { last.text += SUPERSCRIPT[ch]; continue }
      flush()
      out.push({ kind: 'sup', text: SUPERSCRIPT[ch] })
    } else if (SUBSCRIPT[ch]) {
      const last = out[out.length - 1]
      if (!plain && last?.kind === 'sub') { last.text += SUBSCRIPT[ch]; continue }
      flush()
      out.push({ kind: 'sub', text: SUBSCRIPT[ch] })
    } else if (VULGAR[ch]) {
      flush()
      const [n, d] = VULGAR[ch]
      out.push({ kind: 'frac', num: [{ kind: 'text', text: n }], den: [{ kind: 'text', text: d }] })
    } else {
      plain += ch
    }
  }
  flush()
  return out
}

/** Every tag this understands. Anything else is left alone — see parseInline. */
const TAG = /<(\/?)(sup|sub|br|frac)\s*\/?>/gi

/**
 * Parse authored question text into tokens.
 *
 * UNKNOWN TAGS ARE LEFT AS LITERAL TEXT rather than stripped. Stripping would
 * quietly delete content, and a stray "<" in a maths question ("x < 5", which
 * an author will write sooner or later) is far more likely than a real tag
 * this does not know.
 */
export function parseInline(text: string, depth = 0): InlineToken[] {
  const out: InlineToken[] = []
  let at = 0

  const literal = (s: string) => {
    if (s) out.push(...splitBareNotation(decodeEntities(s)))
  }

  TAG.lastIndex = 0
  for (let m = TAG.exec(text); m; m = TAG.exec(text)) {
    const [whole, closing, rawName] = m
    const name = rawName.toLowerCase()

    if (closing) continue          // a stray close tag; handled with its opener
    literal(text.slice(at, m.index))

    if (name === 'br') {
      out.push({ kind: 'break' })
      at = TAG.lastIndex
      continue
    }

    const close = text.toLowerCase().indexOf(`</${name}>`, TAG.lastIndex)
    if (close === -1) {            // unclosed — treat the tag as text, as above
      literal(whole)
      at = TAG.lastIndex
      continue
    }
    const inner = text.slice(TAG.lastIndex, close)

    if (name === 'frac') {
      const parts = fracParts(inner)
      if (!parts || depth > 0) literal(inner)
      else {
        out.push({
          kind: 'frac',
          num: parseInline(parts[0], depth + 1),
          den: parseInline(parts[1], depth + 1),
        })
      }
    } else {
      // <sup>/<sub> take plain content — an exponent with its own markup is
      // not something the bank writes, and nesting it would only add ways to
      // be wrong.
      out.push({ kind: name as 'sup' | 'sub', text: decodeEntities(stripTags(inner)) })
    }

    at = close + name.length + 3
    TAG.lastIndex = at
  }
  literal(text.slice(at))
  return out
}

/**
 * Numerator and denominator of a <frac>, or null if it holds neither.
 *
 * TWO SPELLINGS, on purpose, because the two surfaces want different things:
 *
 *   <frac>3/4</frac>              concise, and what a paper question should use
 *   <frac><n>3</n><d>4</d></frac> structured, and the only one a BROWSER can
 *                                 stack — CSS has nothing to split "3/4" on
 *
 * The concise form still degrades honestly in a browser: an unknown inline tag
 * renders its children, so it reads "3/4". The structured form is stacked by
 * the rules in app/globals.css, so a bank question can use fraction notation on
 * the website and the same string prints stacked on paper.
 */
function fracParts(inner: string): [string, string] | null {
  const structured = inner.match(/<n>([\s\S]*?)<\/n>\s*<d>([\s\S]*?)<\/d>/i)
  if (structured) return [structured[1], structured[2]]
  // "3/4", or "(y-5)/3". Split on the LAST top-level slash so a numerator may
  // contain one; no slash at all means it is not a fraction, and the content is
  // better shown than swallowed.
  const cut = topLevelSlash(inner)
  return cut === -1 ? null : [inner.slice(0, cut), inner.slice(cut + 1)]
}

/** Index of the slash separating numerator from denominator, or -1. */
function topLevelSlash(s: string): number {
  let depth = 0, found = -1
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') depth--
    else if (s[i] === '/' && depth === 0) found = i
  }
  return found
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '')
}

/** The text of a token list, markup discarded — for widths, tests and search. */
export function plainText(tokens: InlineToken[]): string {
  return tokens.map(t =>
    t.kind === 'break' ? '\n'
      : t.kind === 'frac' ? `${plainText(t.num)}/${plainText(t.den)}`
        : t.text).join('')
}
