import { skillsById } from "../../lib/skills/skillGraph";

type Props = {
  topic: string;
  data: {
    mastered: number;
    needsPractice: number;
    untested: number;
    total: number;
  };
  topicSkills: Record<string, string[]>;
  mastered: Set<string>;
  needsPractice: Set<string>;
  isOpen: boolean;
  toggleTopic: (topic: string) => void;
};

export default function TopicCard({
  topic,
  data,
  topicSkills,
  mastered,
  needsPractice,
  isOpen,
  toggleTopic,
}: Props) {
  return (
    <div
      style={{
        marginBottom: "16px",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          cursor: "pointer",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onClick={() => toggleTopic(topic)}
      >
        <span>{topic}</span>
        <span>{isOpen ? "▼" : "▶"}</span>
      </div>

      <div
        style={{
          fontSize: "14px",
          marginTop: "4px",
          marginBottom: "6px",
        }}
      >
        <span style={{ color: "#2e7d32", fontWeight: 500 }}>
          {data.mastered} mastered
        </span>

        <span style={{ margin: "0 6px", color: "#999" }}>•</span>

        <span style={{ color: "#c62828", fontWeight: 500 }}>
          {data.needsPractice} needs practice
        </span>

        <span style={{ margin: "0 6px", color: "#999" }}>•</span>

        <span style={{ color: "#777" }}>
          {data.untested} untested
        </span>
      </div>

      {isOpen && (
        <ul style={{ marginTop: "5px", listStyle: "none", paddingLeft: 0 }}>
          {(topicSkills[topic] ?? []).map((id) => {
            const skill = skillsById[id];

            let symbol = "•";

            if (mastered.has(id)) symbol = "✓";
            else if (needsPractice.has(id)) symbol = "✗";

            return (
              <li key={id} style={{ marginBottom: "4px", fontSize: "14px" }}>
                {symbol} {skill.name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}