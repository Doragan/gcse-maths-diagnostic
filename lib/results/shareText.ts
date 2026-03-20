export function buildShareText({
  masteryPercent,
  strengths,
  weaknesses,
}: {
  masteryPercent: number;
  strengths: string[];
  weaknesses: string[];
}) {
  return `📊 My Maths Diagnostic Results

Score: ${masteryPercent}%

${
  strengths.length ? `✅ Strong in: ${strengths.join(", ")}\n` : ""
}${
  weaknesses.length ? `❌ To improve: ${weaknesses.join(", ")}\n` : ""
}
Try it yourself: ${window.location.origin}`;
}