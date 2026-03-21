"use client";

import TopicCard from "../topic/TopicCard";
import SummaryCard from "./SummaryCard";
import DownloadButtons from "./DownloadButtons";
import ShareButton from "./ShareButton";
import { skillsById } from "../../lib/skills/skillGraph";

import { trackEvent } from "../../lib/analytics";
import {
  deriveStrengths,
  deriveWeaknesses,
} from "../../lib/results/deriveResults";
import { buildShareText } from "../../lib/results/shareText";
import AdSlot from "../ads/AdSlot";

type Props = {
  masteryPercent: number;
  masteredCount: number;
  totalSkills: number;
  recommendations: string[];
  topicSummary: Record<
    string,
    {
      mastered: number;
      needsPractice: number;
      untested: number;
      total: number;
    }
  >;
  topicSkills: Record<string, string[]>;
  mastered: Set<string>;
  needsPractice: Set<string>;
  openTopics: string[];
  toggleTopic: (topic: string) => void;
  downloadReport: () => void;
  downloadPDF: () => void;
};

export default function ResultsView({
  masteryPercent,
  masteredCount,
  totalSkills,
  recommendations,
  topicSummary,
  topicSkills,
  mastered,
  needsPractice,
  openTopics,
  toggleTopic,
  downloadReport,
  downloadPDF,
}: Props) {
  // 👉 Derived data (clean + readable)
  const strengths = deriveStrengths(mastered);
  const weaknesses = deriveWeaknesses(needsPractice);

  const shareText = buildShareText({
    masteryPercent,
    strengths,
    weaknesses,
  });
  
  const recommendationNames = recommendations.map(
  (id) => skillsById[id].name
);

  return (
<main
  style={{
    width: "100%",
    maxWidth: "100%",
    margin: "0 auto",
    padding: "16px",
    boxSizing: "border-box",
  }}
>
      <h1>Diagnostic Complete</h1>

      <SummaryCard
        masteryPercent={masteryPercent}
        masteredCount={masteredCount}
        totalSkills={totalSkills}
      />

      <DownloadButtons
        downloadReport={downloadReport}
        downloadPDF={downloadPDF}
      />
<AdSlot />
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div
          style={{
            background: "#fff7d6",
            border: "1px solid #f2d675",
            padding: "12px",
            borderRadius: "8px",
            marginTop: "10px",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "18px", fontWeight: "bold" }}>
            We suggest working on:
          </h2>

          <ul style={{ paddingLeft: 20 }}>
            {recommendationNames.map((name) => (
  <li key={name}>{name}</li>
))}
          </ul>
        </div>
      )}

      <h2>Topic Mastery</h2>

      {Object.entries(topicSummary).map(([topic, data]) => {
        const isOpen = openTopics.includes(topic);

        return (
          <TopicCard
            key={topic}
            topic={topic}
            data={data}
            topicSkills={topicSkills}
            mastered={mastered}
            needsPractice={needsPractice}
            isOpen={isOpen}
            toggleTopic={toggleTopic}
          />
        );
      })}

      {/* Actions */}
      <button
        onClick={() => window.location.reload()}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          background: "#eee",
          border: "1px solid #ccc",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        Retake Diagnostic
      </button>

      <ShareButton text={shareText} />

      <button
        onClick={() => {
          window.open(
            "https://docs.google.com/forms/d/e/1FAIpQLSfF384C-gVaBWWiv4fItf1XDrP-pbfCteCCL758q5UskBX_NA/viewform?usp=header",
            "_blank"
          );
          trackEvent("feedback_clicked");
        }}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          background: "#4CAF50",
          color: "white",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        Give Feedback
      </button>
    </main>
  );
}