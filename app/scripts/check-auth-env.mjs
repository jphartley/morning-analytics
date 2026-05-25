import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
const requiredKeys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const placeholderPatterns = [
  /example\.supabase\.co/i,
  /placeholder/i,
  /mock-service-role-key/i,
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    values[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }

  return values;
}

const fileValues = parseEnvFile(envPath);
const missing = [];
const placeholders = [];

for (const key of requiredKeys) {
  const value = process.env[key] || fileValues[key] || "";
  if (!value) {
    missing.push(key);
  } else if (placeholderPatterns.some((pattern) => pattern.test(value))) {
    placeholders.push(key);
  }
}

if (missing.length === 0 && placeholders.length === 0) {
  console.log("OK: Supabase auth env keys are present and do not look like placeholders.");
  process.exit(0);
}

if (missing.length > 0) {
  console.error("ERROR: Missing Supabase auth env key(s):");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
}

if (placeholders.length > 0) {
  console.error("ERROR: Supabase auth env key(s) still look like placeholders:");
  for (const key of placeholders) {
    console.error(`- ${key}`);
  }
}

console.error("Auth manual testing is not ready until these keys use real local Supabase values.");
process.exit(1);
