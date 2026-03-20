import { useState } from "react";
import { skills } from "../../data/skills";
import { courses } from "../../data/courses";
import { skillsById, getPrerequisiteTree } from "../skills/skillGraph";
import {
  createDiagnostic,
  getCurrentSkill,
  answerSkill,
} from "./diagnosticEngine";

export function useDiagnostic() {
  const course = courses.find((c) => c.id === "gcse_foundation");

  const courseSkills = skills.filter((skill) =>
    course?.skills.includes(skill.id)
  );

  const [diagnostic, setDiagnostic] = useState(
    createDiagnostic(courseSkills.map((skill) => skill.id))
  );

  const currentSkill = getCurrentSkill(diagnostic);

  const questionsAsked =
    diagnostic.testedMastered.length +
    diagnostic.testedNotMastered.length;

  const diagnosedSkills = new Set([
    ...diagnostic.testedMastered,
    ...diagnostic.inferredMastered,
    ...diagnostic.testedNotMastered,
    ...diagnostic.inferredNotMastered,
  ]).size;

  const mastered = new Set([
    ...diagnostic.testedMastered,
    ...diagnostic.inferredMastered,
  ]);

  const needsPractice = new Set([
    ...diagnostic.testedNotMastered,
    ...diagnostic.inferredNotMastered,
  ]);

  const untested = new Set(
    courseSkills
      .map((s) => s.id)
      .filter((id) => !mastered.has(id) && !needsPractice.has(id))
  );

  const totalSkills = mastered.size + needsPractice.size + untested.size;
  const masteredCount = mastered.size;

  const masteryPercent =
    totalSkills > 0 ? Math.round((masteredCount / totalSkills) * 100) : 0;

  const recommendations = [...needsPractice]
    .map((id) => ({
      id,
      depth: getPrerequisiteTree(id).length,
    }))
    .sort((a, b) => a.depth - b.depth)
    .slice(0, 3)
    .map((r) => r.id);

  const topicSummary: Record<
    string,
    { mastered: number; needsPractice: number; untested: number; total: number }
  > = {};

  const topicSkills: Record<string, string[]> = {};

  for (const id of [...mastered, ...needsPractice, ...untested]) {
    const skill = skillsById[id];
    const topic = skill.topic;

    if (!topicSummary[topic]) {
      topicSummary[topic] = {
        mastered: 0,
        needsPractice: 0,
        untested: 0,
        total: 0,
      };

      topicSkills[topic] = [];
    }

    topicSummary[topic].total++;
    topicSkills[topic].push(id);

    if (mastered.has(id)) topicSummary[topic].mastered++;
    if (needsPractice.has(id)) topicSummary[topic].needsPractice++;
    if (untested.has(id)) topicSummary[topic].untested++;
  }

  function handleAnswer(knowsSkill: boolean) {
    if (!currentSkill) return;

    const updated = answerSkill(
      diagnostic,
      currentSkill.id,
      knowsSkill
    );

    setDiagnostic(updated);
  }

  function finishDiagnostic() {
    setDiagnostic({
      ...diagnostic,
      remainingSkills: [],
    });
  }

  return {
    diagnostic,
    currentSkill,
    questionsAsked,
    diagnosedSkills,
    courseSkills,
    mastered,
    needsPractice,
    untested,
    totalSkills,
    masteredCount,
    masteryPercent,
    recommendations,
    topicSummary,
    topicSkills,
    handleAnswer,
    finishDiagnostic,
  };
}