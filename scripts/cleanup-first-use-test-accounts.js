#!/usr/bin/env node

/**
 * Removes the four disposable accounts created during first-use testing.
 *
 * Usage:
 *   node scripts/cleanup-first-use-test-accounts.js
 *   node scripts/cleanup-first-use-test-accounts.js --apply
 *
 * The default command is a read-only dry run. `--apply` permanently deletes
 * only the fixed target accounts after removing their analysis rows and image
 * objects. It intentionally accepts no account-selection arguments.
 */

const path = require("path");
const { createRequire } = require("module");
const appRequire = createRequire(path.join(__dirname, "../app/package.json"));
const { createClient } = appRequire("@supabase/supabase-js");

const TEST_ACCOUNT_EMAILS = Object.freeze([
  "princess-daisy@morning.com",
  "princess-peanut@morning.com",
  "princess-donut@morning.com",
  "princess-peach@morning.com",
]);
const APPLY_FLAG = "--apply";
const IMAGE_BUCKET = "analysis-images";

function parseArguments(args) {
  if (args.length === 0) {
    return { apply: false };
  }

  if (args.length === 1 && args[0] === APPLY_FLAG) {
    return { apply: true };
  }

  throw new Error(`Usage: node scripts/cleanup-first-use-test-accounts.js [${APPLY_FLAG}]`);
}

function createSupabaseClient() {
  process.loadEnvFile(path.join(__dirname, "../app/.env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in app/.env.local."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

function batchImagePaths(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((batch) => (
    batch && typeof batch === "object" ? asStringArray(batch.imagePaths) : []
  ));
}

function collectOwnedImagePaths(analysis, listedNames = []) {
  const prefix = `${analysis.id}/`;
  const candidates = [
    ...asStringArray(analysis.image_paths),
    ...batchImagePaths(analysis.image_generation_batches),
    ...asStringArray(listedNames).map((name) => `${prefix}${name}`),
  ];

  return [...new Set(candidates.filter((candidate) => candidate.startsWith(prefix)))].sort();
}

async function listAllAuthUsers(supabase) {
  const users = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      throw new Error(`Unable to list Supabase Auth users: ${error.message}`);
    }

    const pageUsers = data.users || [];
    users.push(...pageUsers);

    if (pageUsers.length < 1000) {
      return users;
    }
  }
}

async function resolveTargetUsers(supabase) {
  const users = await listAllAuthUsers(supabase);
  const usersByEmail = new Map(users.filter((user) => user.email).map((user) => [user.email, user]));
  const missingEmails = TEST_ACCOUNT_EMAILS.filter((email) => !usersByEmail.has(email));

  if (missingEmails.length > 0) {
    throw new Error(`Refusing cleanup because these fixed test accounts are missing: ${missingEmails.join(", ")}`);
  }

  return TEST_ACCOUNT_EMAILS.map((email) => usersByEmail.get(email));
}

async function countRows(supabase, table, userId) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Unable to count ${table} for a test account: ${error.message}`);
  }

  return count || 0;
}

async function planAccountCleanup(supabase, user) {
  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("id, image_paths, image_generation_batches")
    .eq("user_id", user.id);

  if (analysesError) {
    throw new Error(`Unable to read analyses for ${user.email}: ${analysesError.message}`);
  }

  const imagePaths = new Set();
  for (const analysis of analyses || []) {
    const { data: objects, error: objectsError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .list(analysis.id);

    if (objectsError) {
      throw new Error(`Unable to list images for ${user.email}: ${objectsError.message}`);
    }

    for (const imagePath of collectOwnedImagePaths(analysis, (objects || []).map((object) => object.name))) {
      imagePaths.add(imagePath);
    }
  }

  const [memoryCount, evidenceCount] = await Promise.all([
    countRows(supabase, "memories", user.id),
    countRows(supabase, "memory_evidence", user.id),
  ]);

  return {
    user,
    analysisCount: (analyses || []).length,
    imagePaths: [...imagePaths].sort(),
    memoryCount,
    evidenceCount,
  };
}

async function buildCleanupPlan(supabase) {
  const users = await resolveTargetUsers(supabase);
  return Promise.all(users.map((user) => planAccountCleanup(supabase, user)));
}

function printPlan(plan) {
  console.log("\nCleanup preview (no journal text or credentials are displayed):");
  for (const account of plan) {
    console.log(
      `- ${account.user.email}: ${account.analysisCount} analyses, ${account.imagePaths.length} images, ${account.memoryCount} memories, ${account.evidenceCount} evidence rows`
    );
  }
}

async function removeStorageObjects(supabase, imagePaths) {
  const chunkSize = 100;
  for (let index = 0; index < imagePaths.length; index += chunkSize) {
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .remove(imagePaths.slice(index, index + chunkSize));

    if (error) {
      throw new Error(`Unable to remove referenced images: ${error.message}`);
    }
  }
}

async function removeAccount(supabase, account) {
  await removeStorageObjects(supabase, account.imagePaths);

  const { error: analysesError } = await supabase
    .from("analyses")
    .delete()
    .eq("user_id", account.user.id);
  if (analysesError) {
    throw new Error(`Unable to remove analyses: ${analysesError.message}`);
  }

  const remainingAnalyses = await countRows(supabase, "analyses", account.user.id);
  if (remainingAnalyses !== 0) {
    throw new Error(`Refusing to delete Auth user because ${remainingAnalyses} analyses remain.`);
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(account.user.id);
  if (authError) {
    throw new Error(`Unable to delete Auth user: ${authError.message}`);
  }
}

async function runCleanup(supabase, apply) {
  const plan = await buildCleanupPlan(supabase);
  printPlan(plan);

  if (!apply) {
    console.log(`\nDry run only. Re-run with ${APPLY_FLAG} to permanently clean these four fixed test accounts.`);
    return 0;
  }

  console.log("\nApplying cleanup...");
  let failures = 0;
  for (const account of plan) {
    try {
      await removeAccount(supabase, account);
      console.log(`- ${account.user.email}: deleted`);
    } catch (error) {
      failures += 1;
      console.error(`- ${account.user.email}: not deleted (${error.message})`);
    }
  }

  if (failures > 0) {
    console.error(`\nCleanup incomplete: ${failures} account(s) were not deleted. Re-run the dry run before retrying.`);
    return 1;
  }

  console.log("\nCleanup complete: all four fixed test accounts were deleted.");
  return 0;
}

async function main() {
  try {
    const { apply } = parseArguments(process.argv.slice(2));
    const exitCode = await runCleanup(createSupabaseClient(), apply);
    process.exitCode = exitCode;
  } catch (error) {
    console.error(`Cleanup did not run: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  APPLY_FLAG,
  TEST_ACCOUNT_EMAILS,
  batchImagePaths,
  collectOwnedImagePaths,
  parseArguments,
};
