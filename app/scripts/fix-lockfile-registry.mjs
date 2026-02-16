import fs from "node:fs";
import path from "node:path";

const lockfilePath = path.resolve(process.cwd(), "package-lock.json");
const sourcePattern = /https:\/\/jfrog\.booking\.com(?::443)?\/artifactory\/api\/npm\/npm\//g;
const targetHost = "https://registry.npmjs.org/";

if (!fs.existsSync(lockfilePath)) {
  console.error(`Lockfile not found: ${lockfilePath}`);
  process.exit(1);
}

const content = fs.readFileSync(lockfilePath, "utf8");
const matches = content.match(sourcePattern);

if (!matches || matches.length === 0) {
  console.log("No JFrog lockfile URLs found. No changes made.");
  process.exit(0);
}

const updated = content.replace(sourcePattern, targetHost);
fs.writeFileSync(lockfilePath, updated, "utf8");

console.log(`Rewrote ${matches.length} lockfile URL(s) to ${targetHost}`);
