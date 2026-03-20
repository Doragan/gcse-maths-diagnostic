import jsPDF from "jspdf";
import { buildTopicGrid } from "./buildTopicGrid";
import { skillsById } from "../skills/skillGraph";
import autoTable from "jspdf-autotable";

export function generatePDF({
  topicSkills,
  mastered,
  needsPractice,
  masteryPercent,
  masteredCount,
  totalSkills,
  recommendations,
}) {
  const doc = new jsPDF();
  let y = 20;

  const topicGrid = buildTopicGrid(topicSkills, mastered, needsPractice);

  const showUntested = topicGrid.some(
    row => row.untestedSkills.length > 0
  );

  const headers = showUntested
    ? ["Topic", "Mastered", "Needs Practice", "Not Tested"]
    : ["Topic", "Mastered", "Needs Practice"];

  const tableRows = topicGrid.map(row =>
    showUntested
      ? [
          row.topic,
          row.masteredSkills.map(id => skillsById[id].name).join("\n"),
          row.needsPracticeSkills.map(id => skillsById[id].name).join("\n"),
          row.untestedSkills.map(id => skillsById[id].name).join("\n")
        ]
      : [
          row.topic,
          row.masteredSkills.map(id => skillsById[id].name).join("\n"),
          row.needsPracticeSkills.map(id => skillsById[id].name).join("\n")
        ]
  );

  doc.setFontSize(18);
  doc.text("Progressa Diagnostic Report", 20, y);

  y += 12;

  doc.setFontSize(12);
  doc.text(`Overall Mastery: ${masteryPercent}%`, 20, y);

  y += 8;
  doc.text(`${masteredCount} of ${totalSkills} skills mastered`, 20, y);

  y += 14;

  if (recommendations.length > 0) {

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("We suggest working on the following skills:", 20, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    recommendations.forEach((id) => {
      const skill = skillsById[id];
      doc.text(`• ${skill.name}`, 20, y);
      y += 6;
    });

    y += 8;
  }

  autoTable(doc, {
    head: [headers],
    body: tableRows,
    startY: y,
    styles: {
      cellPadding: 3,
      fontSize: 10,
      overflow: "linebreak"
    },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  doc.save("maths-diagnostic-report.pdf");
}