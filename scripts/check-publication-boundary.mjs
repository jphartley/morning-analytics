import { spawnSync } from "node:child_process";

const staged = spawnSync("git", [
  "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z",
], { encoding: "utf8" });

if (staged.status !== 0) {
  console.error("Unable to inspect staged paths for the publication check.");
  process.exit(1);
}

if (staged.stdout.length === 0) process.exit(0);

const ignored = spawnSync("git", [
  "check-ignore", "--no-index", "--stdin", "-z",
], { input: staged.stdout, encoding: "utf8" });

if (ignored.status === 1) process.exit(0);
if (ignored.status !== 0) {
  console.error("Unable to evaluate publication ignore rules.");
  process.exit(1);
}

console.error("Commit blocked: staged files match repository ignore rules.");
for (const path of ignored.stdout.split("\0").filter(Boolean)) {
  console.error(`  ${JSON.stringify(path)}`);
}
console.error("Unstage these files. See docs/publication-policy.md.");
process.exit(1);
