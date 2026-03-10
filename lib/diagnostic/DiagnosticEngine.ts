import { DiagnosticSession } from "./types";

export class DiagnosticEngine {

  getNextSkill(session: DiagnosticSession) {

    const unknownSkills = Object.entries(session.skillStates)
      .filter(([_, state]) => state === "unknown");

    if (unknownSkills.length === 0) {
      return null;
    }

    return unknownSkills[0][0];
  }

  submitAnswer(
    session: DiagnosticSession,
    skillId: string,
    knowsSkill: boolean
  ): DiagnosticSession {

    const newSession = { ...session };

    newSession.skillStates[skillId] =
      knowsSkill ? "mastered" : "not_mastered";

    newSession.askedSkills.push(skillId);

    return newSession;
  }

}