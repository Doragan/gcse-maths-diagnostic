"use client";

import { useState } from "react";
import { validateSkills } from "../lib/diagnostic/validateSkills";
import { skillsById } from "../lib/skills/skillGraph";
import type { Skill } from "../data/skills";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import StartScreen from "../components/diagnostic/StartScreen";
import QuestionScreen from "../components/diagnostic/QuestionScreen";
import ResultsView from "../components/results/ResultsView";
import { useDiagnostic } from "../lib/diagnostic/useDiagnostic";
import { buildTopicGrid } from "../lib/results/buildTopicGrid";

import { trackEvent } from "../lib/analytics";
import { generatePDF } from "../lib/results/generatePDF";

type ReportRow = {
  skill: string;
  topic: string;
  status: string;
};

validateSkills();

export default function Home() {

  const [started, setStarted] = useState(false);
  const [openTopics, setOpenTopics] = useState<string[]>([]);

  function toggleTopic(topic: string) {
    setOpenTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  }

  function downloadReport() {
    const rows: ReportRow[] = [];

    const addRows = (ids: string[], status: string) => {
      ids.forEach((id) =>
        rows.push({
          skill: skillsById[id].name,
          topic: skillsById[id].topic,
          status,
        })
      );
    };

    addRows(diagnostic.testedMastered, "Mastered (Tested)");
    addRows(diagnostic.inferredMastered, "Mastered (Inferred)");
    addRows(diagnostic.testedNotMastered, "Needs Practice (Tested)");
    addRows(diagnostic.inferredNotMastered, "Needs Practice (Inferred)");

    const csv = [
      "Skill,Topic,Status",
      ...rows.map((r) => `${r.skill},${r.topic},${r.status}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "diagnostic_results.csv";
    a.click();
  }

  const {
    diagnostic,
    currentSkill,
    questionsAsked,
    diagnosedSkills,
    courseSkills,
    mastered,
    needsPractice,
    totalSkills,
    masteredCount,
    masteryPercent,
    recommendations,
    topicSummary,
    topicSkills,
    handleAnswer,
    finishDiagnostic
  } = useDiagnostic();
  
  function downloadPDF() {
  trackEvent("pdf_downloaded");

  generatePDF({
    topicSkills,
    mastered,
    needsPractice,
    masteryPercent,
    masteredCount,
    totalSkills,
    recommendations,
  });
}

  if (!started) {
    return <StartScreen startDiagnostic={() => setStarted(true)} />;
  }

  if (!currentSkill) {
	  trackEvent("diagnostic_completed");
    return (
      <ResultsView
        masteryPercent={masteryPercent}
        masteredCount={masteredCount}
        totalSkills={totalSkills}
        recommendations={recommendations}
        topicSummary={topicSummary}
        topicSkills={topicSkills}
        mastered={mastered}
        needsPractice={needsPractice}
        openTopics={openTopics}
        toggleTopic={toggleTopic}
        downloadReport={downloadReport}
        downloadPDF={downloadPDF}
      />
    );
  }

  return (
    <QuestionScreen
      currentSkill={currentSkill}
      questionsAsked={questionsAsked}
      diagnosedSkills={diagnosedSkills}
      courseSkillsLength={courseSkills.length}
      remainingSkills={diagnostic.remainingSkills.length}
      finishDiagnostic={finishDiagnostic}
      handleAnswer={handleAnswer}
    />
  );
}