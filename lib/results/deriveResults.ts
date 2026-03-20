import { skillsById } from "../skills/skillGraph";

export function deriveStrengths(mastered: Set<string>) {
  return Array.from(mastered)
    .slice(0, 3)
    .map((id) => skillsById[id]?.name)
    .filter(Boolean);
}

export function deriveWeaknesses(needsPractice: Set<string>) {
  return Array.from(needsPractice)
    .slice(0, 3)
    .map((id) => skillsById[id]?.name)
    .filter(Boolean);
}