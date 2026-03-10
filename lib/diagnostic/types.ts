export type SkillState = "unknown" | "mastered" | "not_mastered";

export interface DiagnosticSession {
  skillStates: Record<string, SkillState>;
  askedSkills: string[];
}