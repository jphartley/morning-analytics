#!/usr/bin/env node

/**
 * Safely removes explicitly named disposable test accounts.
 *
 * Preview:
 *   node scripts/cleanup-test-accounts.js --email test-one@example.com
 *
 * Apply after reviewing the preview:
 *   node scripts/cleanup-test-accounts.js --email test-one@example.com --apply --confirm-delete
 */

const path = require("path");
const { createRequire } = require("module");

const appRequire = createRequire(path.join(__dirname, "../app/package.json"));
const { createClient } = appRequire("@supabase/supabase-js");

const EMAIL_FLAG = "--email";
const APPLY_FLAG = "--apply";
const CONFIRM_DELETE_FLAG = "--confirm-delete";
const HELP_FLAG = "--help";
const IMAGE_BUCKET = "analysis-images";
const USAGE = [
  "Usage:",
  "  node scripts/cleanup-test-accounts.js --email test-one@example.com [--email test-two@example.com]",
  "  node scripts/cleanup-test-accounts.js --email test-one@example.com [--email test-two@example.com] --apply --confirm-delete",
  "",
  "The first form is a read-only preview. The second permanently deletes only the explicitly named accounts.",
].join("\n");

function normalizeEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Invalid email address: ${value || "(missing)"}`);
  }

  return email;
}

function parseArguments(args) {
  if (args.length === 1 && args[0] === HELP_FLAG) {
    return { help: true };
  }

  const emails = [];
  let apply = false;
  let confirmDelete = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === EMAIL_FLAG) {
      const email = args[index + 1];
      if (!email || email.startsWith("--")) {
        throw new Error(`${EMAIL_FLAG} requires an email address.`);
      }

      emails.push(normalizeEmail(email));
      index += 1;
      continue;
    }

    if (argument === APPLY_FLAG) {
      if (apply) {
        throw new Error(`${APPLY_FLAG} may be provided only once.`);
      }
      apply = true;
      continue;
    }

    if (argument === CONFIRM_DELETE_FLAG) {
      if (confirmDelete) {
        throw new Error(`${CONFIRM_DELETE_FLAG} may be provided only once.`);
      }
      confirmDelete = true;
      continue;
    }

    throw new Error(`Unrecognized argument: ${argument}`);
  }

  if (emails.length === 0) {
    throw new Error(`At least one ${EMAIL_FLAG} argument is required.`);
  }

  if (apply !== confirmDelete) {
    throw new Error(`${APPLY_FLAG} and ${CONFIRM_DELETE_FLAG} must be provided together.`);
  }

  return { emails: [...new Set(emails)], apply, help: false };
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

async function resolveTargetUsers(supabase, emails) {
  const users = await listAllAuthUsers(supabase);
  const usersByEmail = new Map(
    users
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user])
  );
  const missingEmails = emails.filter((email) => !usersByEmail.has(email));

  if (missingEmails.length > 0) {
    throw new Error(`Refusing cleanup because these accounts are missing: ${missingEmails.join(", ")}`);
  }

  return emails.map((email) => usersByEmail.get(email));
}

async function countRows(supabase, table, userId) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) {
    throw new Error(`Unable to count ${table}: ${error.message}`);
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

async function buildCleanupPlan(supabase, emails) {
  const users = await resolveTargetUsers(supabase, emails);
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

async function runCleanup(supabase, options) {
  const plan = await buildCleanupPlan(supabase, options.emails);
  printPlan(plan);

  if (!options.apply) {
    console.log(`\nDry run only. Add ${APPLY_FLAG} ${CONFIRM_DELETE_FLAG} after reviewing this preview.`);
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
    console.error(`\nCleanup incomplete: ${failures} account(s) were not deleted. Re-run the preview before retrying.`);
    return 1;
  }

  console.log("\nCleanup complete: all requested accounts were deleted.");
  return 0;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(USAGE);
      return;
    }

    process.exitCode = await runCleanup(createSupabaseClient(), options);
  } catch (error) {
    console.error(`Cleanup did not run: ${error.message}\n\n${USAGE}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  APPLY_FLAG,
  CONFIRM_DELETE_FLAG,
  EMAIL_FLAG,
  HELP_FLAG,
  batchImagePaths,
  collectOwnedImagePaths,
  parseArguments,
  removeAccount,
};
