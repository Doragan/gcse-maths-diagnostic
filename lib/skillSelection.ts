/**
 * Adding and removing whole topics' worth of skills.
 *
 * Pulled out of SkillPicker because "select all" is where a multi-select goes
 * wrong, and the failures are quiet ones: a duplicated id makes a count read
 * 48 when 40 are chosen, and an over-broad removal silently drops skills the
 * teacher picked on another topic. Both end up in `class_sessions.skill_ids`,
 * where the consequence is the wrong question pool in front of a class.
 *
 * Order is preserved on purpose. `skill_ids` goes to the database and into the
 * pupil's `practice_focus_skills`, and a set that reshuffles on every click
 * makes two identical selections look like different rows.
 */

/** Adds `ids` that are not already present, keeping existing order. */
export function addAll(value: string[], ids: string[]): string[] {
  const have = new Set(value)
  return [...value, ...ids.filter(id => !have.has(id))]
}

/** Removes exactly `ids`, leaving every other choice untouched. */
export function removeAll(value: string[], ids: string[]): string[] {
  const drop = new Set(ids)
  return value.filter(v => !drop.has(v))
}

/** Adds one, or removes it if it is already there. */
export function toggleOne(value: string[], id: string): string[] {
  return value.includes(id) ? removeAll(value, [id]) : addAll(value, [id])
}

/**
 * Whether every id in `ids` is chosen — what the Select all / Deselect all
 * label flips on.
 *
 * An EMPTY `ids` is not "all chosen". A topic with no practisable skills is
 * filtered out before it reaches the picker, so this is defensive, but
 * `every()` on an empty array returning true would offer "Deselect all 0".
 */
export function allChosen(value: string[], ids: string[]): boolean {
  if (ids.length === 0) return false
  const have = new Set(value)
  return ids.every(id => have.has(id))
}
