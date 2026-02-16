import fs from "node:fs";
import path from "node:path";

const lockfilePath = path.resolve(process.cwd(), "package-lock.json");
const leakedHost = "jfrog.booking.com";

if (!fs.existsSync(lockfilePath)) {
  console.error(`Lockfile not found: ${lockfilePath}`);
  process.exit(1);
}

const content = fs.readFileSync(lockfilePath, "utf8");

if (!content.includes(leakedHost)) {
  console.log("OK: package-lock.json has no private JFrog registry URLs.");
  process.exit(0);
}

const lines = content.split(/\r?\n/);
const matches = [];

for (let i = 0; i < lines.length; i += 1) {
  if (lines[i].includes(leakedHost)) {
    matches.push(i + 1);
  }
}

console.error("ERROR: package-lock.json contains private JFrog registry URLs.");
console.error(`Found ${matches.length} matching line(s).`);
console.error("Run `npm run fix:lockfile-registry` before committing.");

const previewLines = matches.slice(0, 5).join(", ");
if (previewLines.length > 0) {
  console.error(`First matching line numbers: ${previewLines}`);
}

process.exit(1);
