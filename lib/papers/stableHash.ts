/**
 * A stable hash of a short string (FNV-1a).
 *
 * Not for security — for making a choice that is the same every time it is
 * made. Two things in this pipeline need that and would otherwise reach for a
 * random pick: which sentence a student's feedback uses, and which challenge
 * questions a paper offers. In both cases a teacher who regenerates after
 * correcting a single mark must get back what they had before, and randomness
 * would quietly rewrite everyone's sheet.
 *
 * Lives on its own because the formatter and the challenge pool both need it,
 * and importing the formatter into the data layer to get at it would be the
 * wrong way round.
 */
export function stableHash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}
