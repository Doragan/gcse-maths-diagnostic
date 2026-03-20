import { skillsById, getPrerequisiteTree, getDependentTree, selectNextSkill } from "../skills/skillGraph";

export type DiagnosticState = {
  remainingSkills: string[];
  testedMastered: string[];
  testedNotMastered: string[];
  inferredMastered: string[];
  inferredNotMastered: string[];
};

export function createDiagnostic(initialSkills: string[]): DiagnosticState {
  return {
    remainingSkills: initialSkills,
    testedMastered: [],
    testedNotMastered: [],
    inferredMastered: [],
    inferredNotMastered: []
  };
}

export function getCurrentSkill(state: DiagnosticState) {
  const skillId = selectNextSkill(state.remainingSkills);
  return skillId ? skillsById[skillId] : null;
}

export function answerSkill(
  state: DiagnosticState,
  skillId: string,
  knowsSkill: boolean
): DiagnosticState {

  const prereqs = getPrerequisiteTree(skillId);
  const dependents = getDependentTree(skillId);

  if (knowsSkill) {

    const remove = new Set([skillId, ...prereqs]);

    return {
      ...state,
      remainingSkills: state.remainingSkills.filter(id => !remove.has(id)),
      testedMastered: [...new Set([...state.testedMastered, skillId])],
      inferredMastered: [...new Set([...state.inferredMastered, ...prereqs])]
    };

  } else {

    const remove = new Set([skillId, ...dependents]);

    return {
      ...state,
      remainingSkills: state.remainingSkills.filter(id => !remove.has(id)),
      testedNotMastered: [...new Set([...state.testedNotMastered, skillId])],
      inferredNotMastered: [...new Set([...state.inferredNotMastered, ...dependents])]
    };

  }
}