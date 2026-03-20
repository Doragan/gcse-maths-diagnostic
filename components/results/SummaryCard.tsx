type Props = {
  masteryPercent: number;
  masteredCount: number;
  totalSkills: number;
};

export default function SummaryCard({
  masteryPercent,
  masteredCount,
  totalSkills,
}: Props) {
  return (
    <div
      style={{
        marginTop: "10px",
        marginBottom: "25px",
        padding: "12px",
        borderRadius: "8px",
        background: "#f5f5f5",
        border: "1px solid #e0e0e0",
      }}
    >
      <div style={{ fontSize: "18px", fontWeight: "bold" }}>
        Overall Mastery: {masteryPercent}%
      </div>

      <div style={{ fontSize: "14px", marginTop: "4px" }}>
        {masteredCount} of {totalSkills} skills mastered
      </div>
    </div>
  );
}