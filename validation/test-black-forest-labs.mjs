import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../app/.env.local"), quiet: true });

const apiKey = process.env.BLACK_FOREST_LABS_API_KEY;
const apiBaseUrl = (process.env.BLACK_FOREST_LABS_API_BASE_URL || "https://api.eu.bfl.ai/v1").replace(/\/$/, "");
const model = process.env.BLACK_FOREST_LABS_MODEL || "flux-2-pro";
const outputPath = process.env.BLACK_FOREST_LABS_SMOKE_OUTPUT || "/private/tmp/black-forest-labs-smoke.jpg";
const prompt = process.env.BLACK_FOREST_LABS_SMOKE_PROMPT
  || "A luminous blue lotus held within precise golden sacred geometry, painterly, no text";

if (!apiKey) {
  throw new Error("BLACK_FOREST_LABS_API_KEY is missing from app/.env.local.");
}

function assertAllowedUrl(value, kind) {
  const url = new URL(value);
  const apiHosts = new Set(["api.bfl.ai", "api.eu.bfl.ai", "api.us.bfl.ai"]);
  const allowed = url.protocol === "https:"
    && !url.username
    && !url.password
    && (kind === "api"
      ? apiHosts.has(url.hostname) || /^api\.(?:eu|us)\d+\.bfl\.ai$/i.test(url.hostname)
      : /^delivery(?:[.-][a-z0-9-]+)*\.bfl\.ai$/i.test(url.hostname));
  if (!allowed) {
    throw new Error(`Provider returned an unexpected ${kind} host: ${url.hostname}.`);
  }
  return url;
}

const submitUrl = assertAllowedUrl(`${apiBaseUrl}/${model}`, "api");
console.log(`Submitting one credit-conscious smoke image with ${model}...`);
const submitResponse = await fetch(submitUrl, {
  method: "POST",
  headers: {
    accept: "application/json",
    "content-type": "application/json",
    "x-key": apiKey,
  },
  body: JSON.stringify({
    prompt,
    width: 1024,
    height: 1024,
    output_format: "jpeg",
    safety_tolerance: 2,
  }),
});

if (!submitResponse.ok) {
  throw new Error(`BFL submission failed with HTTP ${submitResponse.status}.`);
}

const submission = await submitResponse.json();
if (!submission.id || !submission.polling_url) {
  throw new Error("BFL submission did not return an ID and polling URL.");
}

const pollingUrl = assertAllowedUrl(submission.polling_url, "api");
const deadline = Date.now() + 90000;
let deliveryUrl;
let lastStatus = "";

while (Date.now() < deadline) {
  const pollResponse = await fetch(pollingUrl, {
    headers: { accept: "application/json", "x-key": apiKey },
  });
  if (!pollResponse.ok) {
    throw new Error(`BFL polling failed with HTTP ${pollResponse.status}.`);
  }

  const result = await pollResponse.json();
  if (result.status !== lastStatus) {
    console.log(`Status: ${result.status}`);
    lastStatus = result.status;
  }
  if (result.status === "Ready") {
    deliveryUrl = assertAllowedUrl(result.result?.sample, "delivery");
    break;
  }
  if (["Error", "Failed", "Task not found", "Request Moderated", "Content Moderated"].includes(result.status)) {
    throw new Error(`BFL generation ended with status: ${result.status}.`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

if (!deliveryUrl) {
  throw new Error("BFL smoke generation timed out after 90 seconds.");
}

const imageResponse = await fetch(deliveryUrl, { headers: { accept: "image/jpeg" } });
if (!imageResponse.ok) {
  throw new Error(`BFL image download failed with HTTP ${imageResponse.status}.`);
}
const bytes = Buffer.from(await imageResponse.arrayBuffer());
if (!bytes.length) {
  throw new Error("BFL returned an empty image.");
}

await writeFile(outputPath, bytes);
console.log(`Ready: ${bytes.length} bytes written to ${outputPath}`);
if (submission.cost !== undefined) {
  console.log(`Reported cost: ${submission.cost} credits`);
}
