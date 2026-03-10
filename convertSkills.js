const XLSX = require("xlsx");
const fs = require("fs");

const workbook = XLSX.readFile("Foundation Skills Spreadsheet.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];

const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

function toId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

const skills = [];

for (let i = 1; i < rows.length; i++) {

  const row = rows[i];
  const name = row[0];
  const topic = row[1];

  if (!name) continue;

	const prerequisites = row
	  .slice(2)
	  .filter(Boolean)
	  .map(p => toId(p));

	skills.push({
	  id: toId(name),
	  name,
	  topic,
	  prerequisites
	});

}

const output =
`export const skills = ${JSON.stringify(skills, null, 2)};`;

fs.writeFileSync("generatedSkills.ts", output);

console.log("Skills generated successfully");