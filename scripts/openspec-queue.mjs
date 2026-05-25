#!/usr/bin/env node

import { spawnSync, spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync, copyFileSync, openSync, readdirSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";

const initialCwd = process.cwd();
const repoRoot = discoverRepoRoot(initialCwd);
const queueDir = path.join(repoRoot, ".openspec-queue");
const configPath = path.join(queueDir, "config.json");
const statePath = path.join(queueDir, "state.local.json");

const args = process.argv.slice(2);
const command = args[0] || "help";
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const positional = args.slice(1).filter((arg) => !arg.startsWith("--"));
const jsonOutput = flags.has("--json");
const dryRun = flags.has("--dry-run");

function discoverRepoRoot(cwd) {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
    stdio: "pipe"
  });
  return result.status === 0 ? result.stdout.trim() : cwd;
}

function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
  rmSync(filePath, { force: true });
  cpSync(`${filePath}.tmp`, filePath);
  rmSync(`${filePath}.tmp`, { force: true });
}

function loadConfig() {
  const config = readJson(configPath, {
    version: 1,
    worktreeRoot: ".openspec-queue/worktrees",
    landingWorktree: ".openspec-queue/worktrees/_landing-main",
    maxActiveImplementations: 2,
    maxRunningDevServers: 2,
    portStart: 3001,
    branchPrefix: "codex/",
    envFiles: ["app/.env.local", ".env.local"],
    logRoot: ".openspec-queue/logs",
    readinessTimeoutMs: 30000,
    readinessIntervalMs: 500,
    allowPlanningCheckoutLanding: false,
    requiredNodeMajor: 22
  });
  config.envFiles ||= ["app/.env.local", ".env.local"];
  config.logRoot ||= ".openspec-queue/logs";
  config.readinessTimeoutMs ||= 30000;
  config.readinessIntervalMs ||= 500;
  config.allowPlanningCheckoutLanding ??= false;
  config.requiredNodeMajor ||= 22;
  return config;
}

function emptyState() {
  return {
    version: 1,
    items: []
  };
}

function loadState() {
  const state = readJson(statePath, emptyState());
  state.items ||= [];
  return state;
}

function saveState(state) {
  writeJson(statePath, state);
}

function copyQueueStateToWorktree(item) {
  if (!item.worktreePath || !existsSync(statePath)) return;
  const target = path.join(item.worktreePath, ".openspec-queue", "state.local.json");
  if (dryRun) return;
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(statePath, target);
}

function resolveRepoPath(value) {
  return path.resolve(repoRoot, value);
}

function branchFor(change, config) {
  return `${config.branchPrefix}${change}`;
}

function worktreeFor(change, config) {
  return path.join(resolveRepoPath(config.worktreeRoot), change);
}

function landingWorktree(config) {
  return resolveRepoPath(config.landingWorktree);
}

function logRoot(config) {
  return resolveRepoPath(config.logRoot);
}

function safeRelative(base, target) {
  const relative = path.relative(base, target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function repoPaths(config) {
  return {
    planningRoot: repoRoot,
    worktreeRoot: resolveRepoPath(config.worktreeRoot),
    landingPath: landingWorktree(config),
    logRoot: logRoot(config)
  };
}

function queuePaths(change, config) {
  return {
    ...repoPaths(config),
    change,
    branch: branchFor(change, config),
    worktreePath: worktreeFor(change, config),
    changeDir: changeDir(change),
    candidateChangeDir: changeDir(change, worktreeFor(change, config))
  };
}

function now() {
  return new Date().toISOString();
}

function run(cmd, cmdArgs, options = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: options.env || process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && options.check !== false) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(output || `${cmd} ${cmdArgs.join(" ")} failed with status ${result.status}`);
  }
  return result;
}

function telemetryEnv() {
  return {
    ...process.env,
    DO_NOT_TRACK: "1",
    OPENSPEC_TELEMETRY_DISABLED: "1",
    POSTHOG_DISABLED: "1"
  };
}

function classifyTelemetry(output) {
  const lines = output.split("\n").filter(Boolean);
  const telemetry = [];
  const other = [];
  for (const line of lines) {
    if (/posthog|edge\.openspec\.dev|telemetry/i.test(line)) telemetry.push(line);
    else other.push(line);
  }
  return { telemetry, other };
}

function runOpenSpec(cmdArgs, options = {}) {
  const result = run("openspec", cmdArgs, {
    cwd: options.cwd || repoRoot,
    capture: true,
    check: false,
    env: telemetryEnv()
  });
  const stdout = result.stdout.trim();
  const stderr = result.stderr.trim();
  const warnings = classifyTelemetry([stdout, stderr].filter(Boolean).join("\n"));
  return {
    command: `openspec ${cmdArgs.join(" ")}`,
    cwd: path.relative(repoRoot, options.cwd || repoRoot) || ".",
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    stdout,
    stderr,
    telemetryWarnings: warnings.telemetry,
    nonTelemetryOutput: warnings.other
  };
}

function capture(cmd, cmdArgs, cwd = repoRoot, check = true) {
  return run(cmd, cmdArgs, { cwd, capture: true, check }).stdout.trim();
}

function emit(value, text) {
  if (jsonOutput) {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(text);
  }
}

function fail(message, extra = {}) {
  if (jsonOutput) {
    console.error(JSON.stringify({ ok: false, error: message, ...extra }, null, 2));
  } else {
    console.error(message);
  }
  process.exit(1);
}

function usage() {
  console.log(`Usage: node scripts/openspec-queue.mjs <command> [args] [--json] [--dry-run]

Commands:
  status [change]                 Show queue state
  doctor                          Check config, git, worktrees, and runtime state
  approve <change>                Record explicit Gate 1 approval and enqueue
  start [change|--next]           Create/reuse candidate worktree and snapshot artifacts
  builder-preflight <change>      Verify Builder is in the assigned candidate worktree
  setup <change>                  Prepare candidate dependencies and env
  prepare-test <change>           Run verification, allocate port, start server when possible
  serve <change>                  Start/restart candidate dev server
  stop <change>                   Stop candidate dev server
  reject <change>                 Record Gate 2 rejection and preserve worktree
  finalize <change> --confirm-gate2  Archive, squash merge to landing main, push
  cleanup <change>                Remove finalized local resources when safe
  recover [change]                Print safe recovery actions
  recover-finalize <change> --confirm-recovery  Run approved finalization recovery

Recovery flags:
  --allow-partial-finalization --confirm-recovery  Allow explicitly approved merge/push without successful archive
`);
}

function getItem(state, change) {
  return state.items.find((item) => item.change === change);
}

function requireItem(state, change) {
  const item = getItem(state, change);
  if (!item) fail(`No queue item found for '${change}'. Run approve first.`);
  return item;
}

function upsertItem(state, change, patch) {
  let item = getItem(state, change);
  if (!item) {
    item = { change, history: [] };
    state.items.push(item);
  }
  Object.assign(item, patch, { updatedAt: now() });
  item.history ||= [];
  item.history.push({ at: now(), status: item.status, event: patch.event || patch.status || "updated" });
  delete item.event;
  return item;
}

function changeDir(change, base = repoRoot) {
  return path.join(base, "openspec", "changes", change);
}

function assertChangeExists(change) {
  if (!existsSync(changeDir(change))) {
    fail(`OpenSpec change not found: openspec/changes/${change}`);
  }
}

function deriveExpectedTouchAreas(change, base = repoRoot) {
  const root = changeDir(change, base);
  if (!existsSync(root)) return [];
  const files = [
    path.join(root, "proposal.md"),
    path.join(root, "design.md"),
    path.join(root, "tasks.md")
  ];
  const specsDir = path.join(root, "specs");
  const text = files
    .filter(existsSync)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const areas = new Set();
  const pathMatches = text.match(/`([^`]+\.(?:ts|tsx|js|jsx|json|md|css|mjs|yaml|yml))`/g) || [];
  for (const match of pathMatches) {
    const value = match.slice(1, -1);
    if (!value.includes(" ")) areas.add(value);
  }
  const lower = text.toLowerCase();
  const keywordAreas = [
    ["supabase", "supabase/"],
    ["rls", "supabase/"],
    ["auth", "app/lib/supabase"],
    ["session", "app/lib/supabase"],
    ["server action", "app/app/actions.ts"],
    ["actions.ts", "app/app/actions.ts"],
    ["package-lock", "app/package-lock.json"],
    ["dependency", "app/package.json"],
    ["image generation", "app/lib/"],
    ["ai output parsing", "app/app/actions.ts"],
    ["validation", "validation/"]
  ];
  for (const [keyword, area] of keywordAreas) {
    if (lower.includes(keyword)) areas.add(area);
  }
  if (existsSync(specsDir)) {
    areas.add(`openspec/changes/${change}/specs/`);
  }
  return [...areas].sort();
}

function activeItems(state) {
  return state.items.filter((item) => ["queued", "active", "ready-for-test", "rejected", "blocked"].includes(item.status));
}

function nextQueued(state) {
  return [...state.items]
    .filter((item) => item.status === "queued")
    .sort((a, b) => String(a.approvedAt).localeCompare(String(b.approvedAt)))[0];
}

function listWorktrees() {
  return capture("git", ["worktree", "list", "--porcelain"], repoRoot, false);
}

function branchExists(branch) {
  return run("git", ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], { capture: true, check: false }).status === 0;
}

function worktreeExists(worktreePath) {
  return existsSync(path.join(worktreePath, ".git")) || listWorktrees().includes(worktreePath);
}

function ensureWorktree(change, config) {
  const branch = branchFor(change, config);
  const worktreePath = worktreeFor(change, config);
  mkdirSync(path.dirname(worktreePath), { recursive: true });
  if (worktreeExists(worktreePath)) return { branch, worktreePath, created: false };
  const args = ["worktree", "add"];
  if (!branchExists(branch)) args.push("-b", branch);
  args.push(worktreePath, branchExists(branch) ? branch : "HEAD");
  if (dryRun) return { branch, worktreePath, created: false, dryRun: true, command: `git ${args.join(" ")}` };
  run("git", args);
  return { branch, worktreePath, created: true };
}

function snapshotArtifacts(change, worktreePath) {
  const source = changeDir(change);
  const target = changeDir(change, worktreePath);
  if (!existsSync(source)) fail(`Cannot snapshot missing source artifacts: ${source}`);
  if (dryRun) return { source, target, dryRun: true };
  rmSync(target, { recursive: true, force: true });
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
  return { source, target };
}

function readChangedFiles(worktreePath) {
  const committed = capture("git", ["diff", "--name-only", "main...HEAD"], worktreePath, false)
    .split("\n")
    .filter(Boolean);
  const working = capture("git", ["diff", "--name-only"], worktreePath, false)
    .split("\n")
    .filter(Boolean);
  const staged = capture("git", ["diff", "--cached", "--name-only"], worktreePath, false)
    .split("\n")
    .filter(Boolean);
  return [...new Set([...committed, ...working, ...staged])].sort();
}

function readStatusEntries(worktreePath) {
  return capture("git", ["status", "--porcelain"], worktreePath, false)
    .split("\n")
    .filter(Boolean)
    .map((line) => ({ code: line.slice(0, 2), path: line.slice(3) }));
}

function trackedStatusEntries(worktreePath) {
  return readStatusEntries(worktreePath).filter((entry) => entry.code !== "??");
}

function untrackedStatusEntries(worktreePath) {
  return readStatusEntries(worktreePath).filter((entry) => entry.code === "??");
}

function currentBranch(worktreePath) {
  return capture("git", ["branch", "--show-current"], worktreePath, false);
}

function listFilesRecursive(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root)) {
    const fullPath = path.join(root, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...listFilesRecursive(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function recordPreGateArtifacts(change) {
  const root = changeDir(change);
  return listFilesRecursive(root).map((file) => path.relative(repoRoot, file)).sort();
}

function preflightBuilder(item, config, cwd = initialCwd) {
  const expected = {
    ...repoPaths(config),
    change: item.change,
    branch: item.branch,
    worktreePath: item.worktreePath,
    changeDir: changeDir(item.change),
    candidateChangeDir: changeDir(item.change, item.worktreePath)
  };
  const actualRoot = discoverRepoRoot(cwd);
  const actualBranch = currentBranch(expected.worktreePath);
  const checks = [
    {
      name: "repo-root",
      status: path.resolve(actualRoot) === path.resolve(expected.worktreePath) ? "passed" : "failed",
      expected: expected.worktreePath,
      actual: actualRoot
    },
    {
      name: "cwd-inside-worktree",
      status: safeRelative(expected.worktreePath, cwd) || path.resolve(cwd) === path.resolve(expected.worktreePath) ? "passed" : "failed",
      expected: expected.worktreePath,
      actual: cwd
    },
    {
      name: "branch",
      status: actualBranch === item.branch ? "passed" : "failed",
      expected: item.branch,
      actual: actualBranch || "(detached or unknown)"
    },
    {
      name: "queue-worktree",
      status: path.resolve(item.worktreePath || "") === path.resolve(expected.worktreePath) ? "passed" : "failed",
      expected: expected.worktreePath,
      actual: item.worktreePath || "(missing)"
    }
  ];
  return {
    status: checks.every((check) => check.status === "passed") ? "passed" : "failed",
    checks,
    expected,
    recovery: `cd ${expected.worktreePath} && node scripts/openspec-queue.mjs builder-preflight ${item.change}`
  };
}

function builderPreflightFresh(item) {
  const preflight = item.lastBuilderPreflight;
  const maxAgeMs = 10 * 60 * 1000;
  if (!preflight) return { status: "failed", reason: "missing-builder-preflight" };
  if (preflight.status !== "passed") return { status: "failed", reason: "builder-preflight-not-passed" };
  if (preflight.worktreePath !== item.worktreePath) return { status: "failed", reason: "builder-preflight-worktree-mismatch" };
  if (preflight.branch !== item.branch) return { status: "failed", reason: "builder-preflight-branch-mismatch" };
  if (Date.now() - Date.parse(preflight.at) > maxAgeMs) return { status: "failed", reason: "builder-preflight-stale" };
  return { status: "passed", at: preflight.at };
}

function planningContamination(item) {
  const baseline = new Set(item.planningBaselineStatus || []);
  const current = readStatusEntries(repoRoot).map((entry) => `${entry.code} ${entry.path}`);
  const newEntries = current.filter((entry) => !baseline.has(entry));
  const suspicious = newEntries.filter((entry) => {
    const file = entry.slice(3);
    return file.startsWith("app/")
      || file.startsWith("scripts/")
      || file.startsWith("validation/")
      || file.startsWith("supabase/")
      || file.startsWith(".openspec-queue/")
      || file === `openspec/changes/${item.change}/tasks.md`
      || file.startsWith(`openspec/changes/${item.change}/`)
      || file.startsWith(`openspec/specs/`);
  });
  return {
    status: suspicious.length === 0 ? "passed" : "failed",
    baseline: [...baseline],
    current,
    suspicious
  };
}

function choosePort(state, config, item) {
  if (item.port) return item.port;
  const used = new Set(state.items.map((entry) => entry.port).filter(Boolean));
  let port = config.portStart;
  while (used.has(port)) port += 1;
  return port;
}

function runningServerItems(state) {
  return state.items.filter((item) => item.devServerPid && isProcessRunning(item.devServerPid));
}

function isProcessRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function stopServer(item) {
  if (!item.devServerPid || !isProcessRunning(item.devServerPid)) return false;
  if (dryRun) return true;
  process.kill(item.devServerPid, "SIGTERM");
  return true;
}

function fileContainsAny(filePath, values) {
  if (!existsSync(filePath)) return false;
  const text = readFileSync(filePath, "utf8");
  return values.some((value) => text.includes(value));
}

function envModeFromFiles(files) {
  if (files.length === 0) return "placeholder";
  if (files.some((file) => fileContainsAny(file, ["USE_AI_MOCKS=true", "NEXT_PUBLIC_IMAGE_PROVIDER=mock"]))) return "mock";
  if (files.some((file) => fileContainsAny(file, ["example.supabase.co", "placeholder", "mock-service-role-key"]))) return "placeholder";
  return "real-local";
}

function requiredNodeMajor(config) {
  const nvmrc = path.join(repoRoot, "app", ".nvmrc");
  if (existsSync(nvmrc)) {
    const value = readFileSync(nvmrc, "utf8").trim().match(/\d+/)?.[0];
    if (value) return Number(value);
  }
  return Number(config.requiredNodeMajor || 22);
}

function nodeRuntime(config) {
  const version = process.versions.node;
  const major = Number(version.split(".")[0]);
  const required = requiredNodeMajor(config);
  return {
    status: major === required ? "passed" : "failed",
    version: `v${version}`,
    major,
    requiredMajor: required,
    executable: process.execPath,
    instruction: `Run queue commands with Node ${required}. For this repo, use the Node version from app/.nvmrc before running npm ci, lint, build, or dev server commands.`
  };
}

function assertNodeRuntime(config, action) {
  const runtime = nodeRuntime(config);
  if (runtime.status !== "passed") {
    throw new Error(`${action} requires Node ${runtime.requiredMajor}. Current runtime is ${runtime.version} at ${runtime.executable}. ${runtime.instruction}`);
  }
  return runtime;
}

function writePlaceholderEnv(worktreePath) {
  const target = path.join(worktreePath, "app", ".env.local");
  const content = [
    "USE_AI_MOCKS=true",
    "NEXT_PUBLIC_IMAGE_PROVIDER=mock",
    "NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder",
    "SUPABASE_SERVICE_ROLE_KEY=mock-service-role-key"
  ].join("\n");
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${content}\n`, { mode: 0o600 });
  return target;
}

function prepareCandidateEnv(item, config) {
  const copied = [];
  for (const relativeFile of config.envFiles || []) {
    const source = path.join(repoRoot, relativeFile);
    const target = path.join(item.worktreePath, relativeFile);
    if (!existsSync(source)) continue;
    if (dryRun) {
      copied.push({ source: relativeFile, target: relativeFile, dryRun: true });
      continue;
    }
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(source, target);
    copied.push({ source: relativeFile, target: relativeFile });
  }
  const targetFiles = copied.map((entry) => path.join(dryRun ? repoRoot : item.worktreePath, dryRun ? entry.source : entry.target));
  const placeholderCreated = copied.length === 0 && !dryRun ? writePlaceholderEnv(item.worktreePath) : null;
  if (placeholderCreated) targetFiles.push(placeholderCreated);
  return {
    copied,
    placeholderCreated: placeholderCreated ? path.relative(item.worktreePath, placeholderCreated) : null,
    mode: envModeFromFiles(targetFiles)
  };
}

function needsNpmCi(worktreePath) {
  return !existsSync(path.join(worktreePath, "app", "node_modules"));
}

function setupCandidate(item, config) {
  if (!item.worktreePath) fail(`${item.change} has no worktree. Run start first.`);
  const runtime = assertNodeRuntime(config, "Candidate setup");
  const env = prepareCandidateEnv(item, config);
  const appDir = path.join(item.worktreePath, "app");
  const installNeeded = needsNpmCi(item.worktreePath);
  let install = { status: "skipped", reason: "node_modules-present", command: "npm ci" };
  if (dryRun) {
    install = { status: installNeeded ? "dry-run" : "skipped", reason: installNeeded ? "would-run" : "node_modules-present", command: "npm ci" };
  } else if (installNeeded) {
    const result = run("npm", ["ci"], { cwd: appDir, capture: true, check: false });
    install = {
      status: result.status === 0 ? "passed" : "failed",
      command: "npm ci",
      cwd: path.relative(repoRoot, appDir),
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim()
    };
    if (result.status !== 0) {
      item.status = "blocked";
      item.blockedReason = "candidate-setup-failed";
      item.lastSetup = { at: now(), env, install };
      throw new Error(`Candidate setup failed for ${item.change}: npm ci failed.`);
    }
  }
  const setup = { at: now(), env, install, node: runtime, worktreePath: item.worktreePath, branch: item.branch };
  item.lastSetup = setup;
  return setup;
}

function setupFresh(item) {
  const setup = item.lastSetup;
  if (!setup) return { status: "failed", reason: "missing-setup" };
  if (setup.worktreePath !== item.worktreePath) return { status: "failed", reason: "setup-worktree-mismatch" };
  if (setup.branch !== item.branch) return { status: "failed", reason: "setup-branch-mismatch" };
  if (setup.install?.status === "failed") return { status: "failed", reason: "setup-install-failed" };
  if (setup.node?.status !== "passed") return { status: "failed", reason: "setup-node-runtime-failed" };
  return { status: "passed" };
}

function changeNeedsBackendTesting(item) {
  const areas = (item.expectedTouchAreas || []).join("\n").toLowerCase();
  const changeText = [
    path.join(changeDir(item.change), "proposal.md"),
    path.join(changeDir(item.change), "design.md"),
    path.join(changeDir(item.change), "tasks.md")
  ].filter(existsSync).map((file) => readFileSync(file, "utf8").toLowerCase()).join("\n");
  return /auth|backend|supabase|rls|session/.test(`${areas}\n${changeText}`);
}

function runVerification(worktreePath) {
  const config = loadConfig();
  assertNodeRuntime(config, "Candidate verification");
  const commands = [
    { id: "lint", cmd: "npm", args: ["run", "lint"], cwd: path.join(worktreePath, "app") },
    { id: "build", cmd: "npm", args: ["run", "build"], cwd: path.join(worktreePath, "app") }
  ];
  const changedFiles = readChangedFiles(worktreePath);
  if (changedFiles.includes("app/package-lock.json")) {
    commands.push({ id: "check-lockfile-registry", cmd: "npm", args: ["run", "check:lockfile-registry"], cwd: path.join(worktreePath, "app") });
  }
  if (changedFiles.some((file) => file.startsWith("validation/"))) {
    commands.push({ id: "validation-test-prompt", cmd: "npm", args: ["run", "test-prompt"], cwd: path.join(worktreePath, "validation"), optional: true });
  }
  const results = [];
  for (const commandSpec of commands) {
    if (dryRun) {
      results.push({ ...commandSpec, status: "dry-run" });
      continue;
    }
    const result = run(commandSpec.cmd, commandSpec.args, { cwd: commandSpec.cwd, capture: true, check: false });
    results.push({
      id: commandSpec.id,
      command: `${commandSpec.cmd} ${commandSpec.args.join(" ")}`,
      cwd: path.relative(repoRoot, commandSpec.cwd),
      status: result.status === 0 ? "passed" : "failed",
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim()
    });
  }
  return {
    status: results.every((result) => result.status === "passed" || result.status === "dry-run") ? "passed" : "failed",
    commands: results,
    changedFiles
  };
}

function assertReadyForVerification(item) {
  const preflight = builderPreflightFresh(item);
  if (preflight.status !== "passed") {
    throw new Error(`Builder preflight required before verification: ${preflight.reason}. Run builder-preflight from ${item.worktreePath}.`);
  }
  const setup = setupFresh(item);
  if (setup.status !== "passed") {
    throw new Error(`Candidate setup required before verification: ${setup.reason}. Run setup ${item.change} or prepare-test ${item.change}.`);
  }
}

function readinessProbe(port) {
  return new Promise((resolve) => {
    const request = http.get({
      hostname: "127.0.0.1",
      port,
      path: "/",
      timeout: 1000
    }, (response) => {
      response.resume();
      resolve({ ok: response.statusCode >= 200 && response.statusCode < 500, statusCode: response.statusCode });
    });
    request.on("timeout", () => {
      request.destroy();
      resolve({ ok: false, error: "timeout" });
    });
    request.on("error", (error) => resolve({ ok: false, error: error.code || error.message }));
  });
}

async function waitForReadiness(item, config) {
  const deadline = Date.now() + config.readinessTimeoutMs;
  let lastProbe = { ok: false, error: "not-started" };
  while (Date.now() <= deadline) {
    lastProbe = await readinessProbe(item.port);
    if (lastProbe.ok) {
      return { status: "reachable", url: `http://localhost:${item.port}`, probe: lastProbe };
    }
    if (item.devServerPid && !isProcessRunning(item.devServerPid)) {
      return { status: "failed", reason: "process-exited", probe: lastProbe };
    }
    await new Promise((resolve) => setTimeout(resolve, config.readinessIntervalMs));
  }
  return { status: "failed", reason: "readiness-timeout", probe: lastProbe };
}

async function startServer(item, state, config) {
  const logsDir = path.join(logRoot(config), item.change);
  const logPath = path.join(logsDir, "dev-server.log");
  if (item.devServerPid && isProcessRunning(item.devServerPid)) {
    const readiness = await waitForReadiness(item, config);
    return { alreadyRunning: true, pid: item.devServerPid, logPath, readiness };
  }
  if (runningServerItems(state).length >= config.maxRunningDevServers) {
    return { skipped: true, reason: "running-server-limit", readiness: { status: "stopped" } };
  }
  if (dryRun) return { dryRun: true, readiness: { status: "dry-run" } };
  mkdirSync(logsDir, { recursive: true });
  const out = openSync(logPath, "a");
  const err = openSync(logPath, "a");
  const child = spawn("npm", ["run", "dev", "--", "--port", String(item.port)], {
    cwd: path.join(item.worktreePath, "app"),
    detached: true,
    stdio: ["ignore", out, err],
    env: process.env
  });
  child.unref();
  closeSync(out);
  closeSync(err);
  item.devServerPid = child.pid;
  const readiness = await waitForReadiness(item, config);
  return { pid: child.pid, logPath, readiness };
}

function ensureLandingWorktree(config) {
  const landingPath = landingWorktree(config);
  mkdirSync(path.dirname(landingPath), { recursive: true });
  if (worktreeExists(landingPath)) return { landingPath, created: false };
  const args = ["worktree", "add", "--detach", landingPath, "main"];
  if (dryRun) return { landingPath, created: false, dryRun: true, command: `git ${args.join(" ")}` };
  run("git", args);
  return { landingPath, created: true };
}

function worktreeDirty(worktreePath) {
  return capture("git", ["status", "--porcelain"], worktreePath, false).length > 0;
}

function checkIgnored(relativePath) {
  return run("git", ["check-ignore", "-q", relativePath], { cwd: repoRoot, capture: true, check: false }).status === 0
    || run("git", ["check-ignore", "-q", `${relativePath}/`], { cwd: repoRoot, capture: true, check: false }).status === 0;
}

function worktreeRootPreflight(config) {
  const paths = repoPaths(config);
  const relative = path.relative(repoRoot, paths.worktreeRoot) || ".";
  const insideRepo = safeRelative(repoRoot, paths.worktreeRoot);
  const ignored = insideRepo && checkIgnored(relative);
  return {
    status: insideRepo && ignored ? "passed" : "warning",
    path: paths.worktreeRoot,
    insideRepo,
    ignored,
    message: insideRepo && ignored
      ? "candidate worktree root is repo-local, writable, and ignored"
      : "candidate worktree root is outside the repo-local ignored workspace or is not gitignored; configure a writable root before normal queue writes"
  };
}

function landingPreflight(config) {
  const landingPath = landingWorktree(config);
  const parent = path.dirname(landingPath);
  const exists = worktreeExists(landingPath);
  const dirty = exists && worktreeDirty(landingPath);
  const insideRepo = safeRelative(repoRoot, landingPath);
  return {
    status: dirty ? "failed" : "passed",
    landingPath,
    parent,
    exists,
    dirty,
    strategy: insideRepo ? "repo-local-detached-worktree" : "external-detached-worktree",
    message: dirty
      ? `landing worktree is dirty: ${landingPath}`
      : "landing worktree can use a detached main checkout for finalization"
  };
}

function makeDraftCommit(item) {
  if (dryRun) return { dryRun: true };
  run("git", ["add", "-A"], { cwd: item.worktreePath });
  const status = capture("git", ["status", "--porcelain"], item.worktreePath, false);
  if (!status) return { created: false, reason: "nothing-to-commit" };
  const result = run("git", ["commit", "-m", `Draft ${item.change}`], { cwd: item.worktreePath, capture: true, check: false });
  return { created: result.status === 0, output: [result.stdout, result.stderr].filter(Boolean).join("\n").trim() };
}

function finalCommitMessage(change, worktreePath) {
  const proposal = path.join(changeDir(change, worktreePath), "proposal.md");
  const title = change
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  let summary = `Implements OpenSpec change: ${change}`;
  if (existsSync(proposal)) {
    const text = readFileSync(proposal, "utf8");
    const firstBullet = text.split("\n").find((line) => line.startsWith("- "));
    if (firstBullet) summary = firstBullet.replace(/^- /, "");
  }
  return `${title}\n\n${summary}\n\nOpenSpec change: ${change}`;
}

function archivePreflight(item) {
  const candidatePath = changeDir(item.change, item.worktreePath);
  const archiveRoot = path.join(item.worktreePath, "openspec", "changes", "archive");
  const specPath = path.join(candidatePath, "specs");
  const specChecks = validateArchiveSpecs(item);
  const failedSpecs = specChecks.filter((check) => check.status === "failed");
  return {
    status: existsSync(candidatePath) && failedSpecs.length === 0 ? "passed" : "failed",
    candidatePath,
    specPath,
    archiveRoot,
    specChecks,
    nonInteractive: true,
    message: !existsSync(candidatePath)
      ? `candidate change path is missing: ${candidatePath}`
      : failedSpecs.length
        ? `archive preflight found invalid main specs: ${failedSpecs.map((check) => check.capability).join(", ")}`
        : "archive can run from the candidate worktree"
  };
}

function validateArchiveSpecs(item) {
  const specsDir = path.join(changeDir(item.change, item.worktreePath), "specs");
  if (!existsSync(specsDir)) return [];
  return readdirSync(specsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const capability = entry.name;
      const mainSpec = path.join(item.worktreePath, "openspec", "specs", capability, "spec.md");
      if (!existsSync(mainSpec)) return { capability, status: "passed", reason: "main-spec-will-be-created" };
      const text = readFileSync(mainSpec, "utf8");
      const requirementsIndex = text.indexOf("## Requirements");
      const firstRequirementIndex = text.indexOf("### Requirement:");
      if (requirementsIndex === -1) {
        return { capability, status: "failed", path: mainSpec, reason: "missing ## Requirements section" };
      }
      if (firstRequirementIndex !== -1 && firstRequirementIndex < requirementsIndex) {
        return { capability, status: "failed", path: mainSpec, reason: "requirement appears before ## Requirements section" };
      }
      return { capability, status: "passed", path: mainSpec, reason: "main-spec-structure-valid" };
    });
}

function finalizationPlan(item, config) {
  const landing = landingPreflight(config);
  const archive = archivePreflight(item);
  const steps = [
    "stop candidate dev server",
    "ensure detached landing worktree at main",
    "fetch origin and reset detached landing to origin/main",
    "checkout candidate branch and rebase on origin/main",
    "rerun verification in candidate worktree",
    "archive OpenSpec from candidate worktree",
    "squash merge candidate branch into landing",
    "commit final change",
    "push landing HEAD to origin/main",
    "mark queue item finalized"
  ];
  return {
    status: landing.status === "passed" && archive.status === "passed" ? "ready" : "blocked",
    landing,
    archive,
    steps,
    risks: [
      landing.status !== "passed" ? landing.message : null,
      archive.status !== "passed" ? archive.message : null
    ].filter(Boolean)
  };
}

function step(status, detail = {}) {
  return { status, at: now(), ...detail };
}

function planningCheckoutReconciliation(item) {
  const result = {
    branch: currentBranch(repoRoot),
    trackedDirty: trackedStatusEntries(repoRoot).map((entry) => `${entry.code} ${entry.path}`),
    untrackedPreserved: untrackedStatusEntries(repoRoot).map((entry) => entry.path),
    status: "skipped",
    reason: null
  };
  if (result.branch !== "main") {
    result.reason = "planning-checkout-not-on-main";
    return result;
  }
  if (result.trackedDirty.length > 0) {
    result.reason = "planning-checkout-has-tracked-changes";
    return result;
  }
  if (dryRun) {
    result.status = "dry-run";
    result.reason = "would-fetch-and-fast-forward";
    return result;
  }
  run("git", ["fetch", "origin"], { cwd: repoRoot });
  const counts = capture("git", ["rev-list", "--left-right", "--count", "HEAD...origin/main"], repoRoot, false).split(/\s+/);
  result.ahead = Number(counts[0] || 0);
  result.behind = Number(counts[1] || 0);
  if (result.behind === 0) {
    result.status = "passed";
    result.reason = "already-up-to-date";
    return result;
  }
  const pull = run("git", ["pull", "--ff-only", "origin", "main"], { cwd: repoRoot, capture: true, check: false });
  result.status = pull.status === 0 ? "passed" : "failed";
  result.reason = pull.status === 0 ? "fast-forwarded" : "fast-forward-failed";
  result.stdout = pull.stdout.trim();
  result.stderr = pull.stderr.trim();
  return result;
}

function isTracked(relativePath) {
  return run("git", ["ls-files", "--error-unmatch", relativePath], { cwd: repoRoot, capture: true, check: false }).status === 0;
}

function cleanupDuplicateArtifacts(item) {
  const removed = [];
  const preserved = [];
  const paths = item.preGateArtifactPaths || [];
  for (const relativePath of paths) {
    if (!relativePath.startsWith(`openspec/changes/${item.change}/`)) {
      preserved.push({ path: relativePath, reason: "outside-change-dir" });
      continue;
    }
    const absolutePath = path.join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) continue;
    if (isTracked(relativePath)) {
      preserved.push({ path: relativePath, reason: "tracked-file" });
      continue;
    }
    if (!dryRun) rmSync(absolutePath, { force: true });
    removed.push(relativePath);
  }
  if (!dryRun) {
    const dirs = [
      path.join(repoRoot, "openspec", "changes", item.change, "specs"),
      path.join(repoRoot, "openspec", "changes", item.change)
    ];
    for (const dir of dirs) {
      try {
        rmSync(dir, { recursive: false });
      } catch {
        // Directory is not empty or does not exist; preserve it.
      }
    }
  }
  return { status: "passed", removed, preserved };
}

function branchPatchEquivalent(branch, base = "main") {
  if (!branchExists(branch)) return { status: "skipped", reason: "local-branch-missing" };
  const diff = run("git", ["diff", "--quiet", base, branch], { cwd: repoRoot, capture: true, check: false });
  if (diff.status === 0) return { status: "passed", method: "empty-tree-diff" };
  const cherry = capture("git", ["cherry", "-v", base, branch], repoRoot, false);
  const commits = cherry.split("\n").filter(Boolean);
  if (commits.length > 0 && commits.every((line) => line.startsWith("-"))) {
    return { status: "passed", method: "git-cherry-patch-equivalent", cherry };
  }
  return { status: "failed", reason: "branch-not-patch-equivalent", cherry };
}

function cleanupCandidateBranch(item) {
  const result = {
    local: { status: "skipped" },
    remote: { status: "skipped" }
  };
  if (!item.branch || !item.branch.startsWith("codex/")) {
    result.local = { status: "skipped", reason: "branch-not-owned-by-queue", branch: item.branch };
    return result;
  }
  if (item.status !== "finalized") {
    result.local = { status: "skipped", reason: "item-not-finalized", branch: item.branch };
    return result;
  }
  if (item.worktreePath && existsSync(item.worktreePath)) {
    result.local = { status: "skipped", reason: "candidate-worktree-still-exists", branch: item.branch };
    return result;
  }
  const equivalence = branchPatchEquivalent(item.branch);
  if (equivalence.status !== "passed") {
    result.local = { status: "skipped", branch: item.branch, ...equivalence };
    return result;
  }
  if (!dryRun) run("git", ["branch", "-D", item.branch], { cwd: repoRoot });
  result.local = { status: dryRun ? "dry-run" : "passed", branch: item.branch, equivalence };
  const remoteExists = run("git", ["ls-remote", "--exit-code", "--heads", "origin", item.branch], { cwd: repoRoot, capture: true, check: false }).status === 0;
  if (remoteExists) {
    if (!dryRun) run("git", ["push", "origin", "--delete", item.branch], { cwd: repoRoot });
    result.remote = { status: dryRun ? "dry-run" : "passed", branch: item.branch };
  } else {
    result.remote = { status: "skipped", reason: "remote-branch-missing", branch: item.branch };
  }
  return result;
}

function doStatus(change) {
  const state = loadState();
  const config = loadConfig();
  const items = change ? state.items.filter((item) => item.change === change) : state.items;
  emit({ ok: true, config, items }, items.length ? items.map(formatItem).join("\n\n") : "Queue is empty.");
}

function formatItem(item) {
  return [
    `${item.change}: ${item.status}`,
    `  branch: ${item.branch || "(not created)"}`,
    `  worktree: ${item.worktreePath || "(not created)"}`,
    `  port: ${item.port || "(none)"}`,
    `  verification: ${item.lastVerification?.status || "(not run)"}`,
    item.blockedReason ? `  blocked: ${item.blockedReason}` : null
  ].filter(Boolean).join("\n");
}

function doDoctor() {
  const config = loadConfig();
  const state = loadState();
  const rootPreflight = worktreeRootPreflight(config);
  const landing = landingPreflight(config);
  const checks = [];
  checks.push({ name: "config", status: existsSync(configPath) ? "passed" : "failed", path: configPath });
  checks.push({ name: "git", status: run("git", ["rev-parse", "--show-toplevel"], { capture: true, check: false }).status === 0 ? "passed" : "failed" });
  checks.push({ name: "planningRoot", status: "passed", path: repoRoot });
  checks.push({ name: "worktreeRoot", status: rootPreflight.status, path: rootPreflight.path, message: rootPreflight.message });
  checks.push({ name: "landingWorktree", status: landing.status, path: landing.landingPath, message: landing.message });
  checks.push({ name: "logRoot", status: "passed", path: logRoot(config) });
  for (const item of state.items) {
    checks.push({ name: `item:${item.change}`, status: item.worktreePath && existsSync(item.worktreePath) ? "passed" : "not-created", statusValue: item.status });
  }
  const ok = checks.every((check) => check.status !== "failed");
  emit({ ok, checks }, checks.map((check) => {
    const detail = [check.path ? `(${check.path})` : null, check.message].filter(Boolean).join(" ");
    return `${check.name}: ${check.status}${detail ? ` ${detail}` : ""}`;
  }).join("\n"));
  if (!ok) process.exit(1);
}

function doApprove(change) {
  if (!change) fail("Usage: approve <change>");
  assertChangeExists(change);
  const config = loadConfig();
  const state = loadState();
  const item = upsertItem(state, change, {
    status: "queued",
    approvedAt: getItem(state, change)?.approvedAt || now(),
    branch: branchFor(change, config),
    worktreePath: worktreeFor(change, config),
    landingWorktreePath: landingWorktree(config),
    expectedTouchAreas: deriveExpectedTouchAreas(change),
    preGateArtifactPaths: recordPreGateArtifacts(change),
    event: "gate1-approved"
  });
  saveState(state);
  emit({ ok: true, item }, `Queued ${change} for implementation. Gate 1 approval recorded.`);
}

function doStart(changeArg) {
  const config = loadConfig();
  const state = loadState();
  const rootPreflight = worktreeRootPreflight(config);
  const item = changeArg && changeArg !== "--next" ? requireItem(state, changeArg) : nextQueued(state);
  if (!item) fail("No queued item is ready to start.");
  const active = state.items.filter((entry) => entry.status === "active").length;
  if (item.status !== "active" && active >= config.maxActiveImplementations) {
    fail(`Active implementation limit reached (${config.maxActiveImplementations}).`);
  }
  if (rootPreflight.status === "warning") {
    item.worktreeRootWarning = rootPreflight.message;
  }
  assertChangeExists(item.change);
  const conflict = detectConflict(item, state);
  if (conflict.highRisk) {
    item.status = "blocked";
    item.blockedReason = conflict.highRisk.reason;
    item.updatedAt = now();
    saveState(state);
    fail(`High-risk conflict: ${conflict.highRisk.reason}`, { item });
  }
  item.lowRiskOverlaps = conflict.lowRisk;
  const worktree = ensureWorktree(item.change, config);
  const snapshot = snapshotArtifacts(item.change, worktree.worktreePath);
  Object.assign(item, {
    status: "active",
    branch: worktree.branch,
    worktreePath: worktree.worktreePath,
    landingWorktreePath: landingWorktree(config),
    startedAt: item.startedAt || now(),
    planningBaselineStatus: readStatusEntries(repoRoot).map((entry) => `${entry.code} ${entry.path}`),
    preGateArtifactPaths: item.preGateArtifactPaths || recordPreGateArtifacts(item.change),
    lastSnapshot: { at: now(), source: snapshot.source, target: snapshot.target }
  });
  saveState(state);
  copyQueueStateToWorktree(item);
  emit({ ok: true, item, worktree, snapshot, rootPreflight }, [
    `Started ${item.change} in ${worktree.worktreePath}`,
    `Branch: ${worktree.branch}`,
    "Builder preflight:",
    `  cd ${worktree.worktreePath}`,
    `  node scripts/openspec-queue.mjs builder-preflight ${item.change}`
  ].join("\n"));
}

function detectConflict(item, state) {
  const highRiskPatterns = [
    "app/app/actions.ts",
    "app/package.json",
    "app/package-lock.json",
    "app/lib/supabase",
    "supabase/",
    "openspec/specs/"
  ];
  const itemFiles = item.worktreePath && existsSync(item.worktreePath) ? readChangedFiles(item.worktreePath) : [];
  const itemAreas = new Set([...(item.expectedTouchAreas || []), ...itemFiles]);
  const lowRisk = [];
  for (const other of activeItems(state)) {
    if (other.change === item.change || !other.worktreePath || !existsSync(other.worktreePath)) continue;
    const otherFiles = readChangedFiles(other.worktreePath);
    const otherAreas = new Set([...(other.expectedTouchAreas || []), ...otherFiles]);
    const overlap = [...itemAreas].filter((file) => otherAreas.has(file));
    const highRisk = overlap.find((file) => highRiskPatterns.some((pattern) => file.startsWith(pattern) || file === pattern));
    if (highRisk) return { highRisk: { reason: `${item.change} and ${other.change} both touch ${highRisk}` }, lowRisk };
    if (overlap.length > 0) {
      lowRisk.push({ change: other.change, overlap });
    }
  }
  return { highRisk: null, lowRisk };
}

function doBuilderPreflight(change) {
  if (!change) fail("Usage: builder-preflight <change>");
  const config = loadConfig();
  const state = loadState();
  const item = requireItem(state, change);
  const result = preflightBuilder(item, config, initialCwd);
  if (result.status === "passed") {
    item.lastBuilderPreflight = {
      at: now(),
      status: "passed",
      worktreePath: result.expected.worktreePath,
      branch: result.expected.branch,
      cwd: initialCwd
    };
    item.updatedAt = now();
    saveState(state);
    copyQueueStateToWorktree(item);
  }
  const text = [
    `Builder preflight for ${change}: ${result.status}`,
    `Expected worktree: ${result.expected.worktreePath}`,
    `Expected branch: ${result.expected.branch}`,
    ...result.checks.map((check) => `  ${check.name}: ${check.status} (expected ${check.expected}, actual ${check.actual})`),
    result.status === "passed" ? `Edit boundary: every implementation patch path must be under ${result.expected.worktreePath}` : `Recovery: ${result.recovery}`
  ].join("\n");
  emit({ ok: result.status === "passed", result }, text);
  if (result.status !== "passed") process.exit(1);
}

function doSetup(change) {
  if (!change) fail("Usage: setup <change>");
  const config = loadConfig();
  const state = loadState();
  const item = requireItem(state, change);
  let setup;
  try {
    setup = setupCandidate(item, config);
  } catch (error) {
    saveState(state);
    fail(error.message || String(error), { item });
  }
  item.updatedAt = now();
  saveState(state);
  emit({ ok: setup.install.status !== "failed", item, setup }, [
    `Candidate setup for ${change}: ${setup.install.status}`,
    `Env mode: ${setup.env.mode}`,
    `Env files prepared: ${setup.env.copied.length || (setup.env.placeholderCreated ? 1 : 0)}`,
    setup.env.placeholderCreated ? `Placeholder env: ${setup.env.placeholderCreated}` : null,
    `Dependency install: ${setup.install.status}`
  ].filter(Boolean).join("\n"));
}

async function doPrepareTest(change) {
  if (!change) fail("Usage: prepare-test <change>");
  const config = loadConfig();
  const state = loadState();
  const item = requireItem(state, change);
  if (!item.worktreePath) fail(`${change} has no worktree. Run start first.`);
  item.port = choosePort(state, config, item);
  try {
    setupCandidate(item, config);
  } catch (error) {
    saveState(state);
    fail(error.message || String(error), { item });
  }
  try {
    assertReadyForVerification(item);
  } catch (error) {
    item.status = "blocked";
    item.blockedReason = "pre-verification-gate-failed";
    saveState(state);
    fail(error.message || String(error), { item });
  }
  const verification = runVerification(item.worktreePath);
  item.lastVerification = { at: now(), ...verification };
  if (verification.status === "passed") {
    const draft = makeDraftCommit(item);
    item.lastDraftCommit = { at: now(), ...draft };
  }
  const contamination = planningContamination(item);
  item.lastPlanningContaminationCheck = { at: now(), ...contamination };
  const landing = landingPreflight(config);
  item.lastLandingPreflight = { at: now(), ...landing };
  const backendBlocked = item.lastSetup?.env?.mode === "placeholder" && changeNeedsBackendTesting(item);
  const server = verification.status === "passed" && contamination.status === "passed" && landing.status === "passed" && !backendBlocked
    ? await startServer(item, state, config)
    : { skipped: true, reason: backendBlocked ? "placeholder-backend-env" : contamination.status !== "passed" ? "planning-checkout-contamination" : landing.status !== "passed" ? "landing-preflight-failed" : "verification-failed", readiness: { status: "stopped" } };
  if (server.pid) item.devServerPid = server.pid;
  item.url = `http://localhost:${item.port}`;
  const serverReady = server.readiness?.status === "reachable" || server.readiness?.status === "dry-run";
  const serverDryRun = server.readiness?.status === "dry-run";
  item.server = { at: now(), ...server };
  item.status = verification.status === "passed" && contamination.status === "passed" && landing.status === "passed" && !backendBlocked && serverReady ? "ready-for-test" : "blocked";
  item.blockedReason = item.status === "ready-for-test"
    ? undefined
    : backendBlocked ? "placeholder-backend-env" : contamination.status !== "passed" ? "planning-checkout-contamination" : landing.status !== "passed" ? "landing-preflight-failed" : verification.status !== "passed" ? "verification-failed" : "server-not-ready";
  item.updatedAt = now();
  saveState(state);
  const text = [
    `Ready status for ${change}: ${item.status}`,
    `Branch: ${item.branch}`,
    `Worktree: ${item.worktreePath}`,
    serverReady && !serverDryRun ? `URL: ${item.url}` : serverDryRun ? `URL: dry-run only (${item.url} not probed)` : `URL: not ready (${item.blockedReason})`,
    `Verification: ${verification.status}`,
    `Env mode: ${item.lastSetup?.env?.mode || "unknown"}`,
    `Planning checkout check: ${contamination.status}`,
    `Landing preflight: ${landing.status} (${landing.strategy})`,
    server.skipped ? `Dev server: not started (${server.reason})` : `Dev server: ${serverDryRun ? "dry-run, not started" : serverReady ? `reachable at ${item.url}` : `failed (${server.readiness?.reason || server.readiness?.status || "unknown"})`}`,
    server.logPath ? `Dev server log: ${server.logPath}` : null,
    "",
    "Gate 2:",
    `  approve: node scripts/openspec-queue.mjs finalize ${change} --confirm-gate2`,
    `  reject:  node scripts/openspec-queue.mjs reject ${change}`
  ].filter(Boolean).join("\n");
  emit({ ok: item.status === "ready-for-test", item, server, landing, contamination }, text);
  if (item.status !== "ready-for-test") process.exit(1);
}

async function doServe(change) {
  if (!change) fail("Usage: serve <change>");
  const config = loadConfig();
  const state = loadState();
  const item = requireItem(state, change);
  item.port = choosePort(state, config, item);
  try {
    setupCandidate(item, config);
  } catch (error) {
    saveState(state);
    fail(error.message || String(error), { item });
  }
  const server = await startServer(item, state, config);
  if (server.pid) item.devServerPid = server.pid;
  item.url = `http://localhost:${item.port}`;
  item.server = { at: now(), ...server };
  saveState(state);
  const ready = server.readiness?.status === "reachable" || server.readiness?.status === "dry-run";
  const serverDryRun = server.readiness?.status === "dry-run";
  emit({ ok: ready, item, server }, server.skipped
    ? `Server not started: ${server.reason}`
    : serverDryRun
      ? `Server dry-run for ${change}; ${item.url} was not started or probed.`
      : ready
      ? `Serving ${change} at ${item.url}`
      : `Server failed readiness for ${change}. Log: ${server.logPath || "(none)"}`);
  if (!ready) process.exit(1);
}

function doStop(change) {
  if (!change) fail("Usage: stop <change>");
  const state = loadState();
  const item = requireItem(state, change);
  const stopped = stopServer(item);
  item.devServerPid = undefined;
  item.updatedAt = now();
  saveState(state);
  emit({ ok: true, stopped, item }, stopped ? `Stopped dev server for ${change}.` : `No running dev server for ${change}.`);
}

function doReject(change) {
  if (!change) fail("Usage: reject <change>");
  const state = loadState();
  const item = requireItem(state, change);
  item.status = "rejected";
  item.rejectedAt = now();
  item.blockedReason = "manual-test-rejected";
  saveState(state);
  emit({ ok: true, item }, `Rejected ${change}. Worktree preserved for artifact/task refinement and retest.`);
}

function doFinalize(change) {
  if (!change) fail("Usage: finalize <change> --confirm-gate2");
  if (!flags.has("--confirm-gate2")) fail("Finalization requires explicit --confirm-gate2.");
  const allowPartial = flags.has("--allow-partial-finalization") && flags.has("--confirm-recovery");
  const config = loadConfig();
  const state = loadState();
  const item = requireItem(state, change);
  if (!["ready-for-test", "blocked"].includes(item.status)) fail(`${change} is not ready for finalization.`);
  item.finalizationSteps = item.finalizationSteps || {};
  stopServer(item);
  const plan = finalizationPlan(item, config);
  item.lastFinalizationPlan = { at: now(), ...plan };
  item.finalizationSteps.archivePreflight = step(plan.status === "ready" ? "passed" : "failed", plan.archive);
  if (plan.status !== "ready") {
    if (!allowPartial) {
      item.status = "blocked";
      item.blockedReason = "archive-preflight-failed";
      saveState(state);
      fail(`Archive preflight failed for ${change}; finalization stopped before merge and push.`, { item, plan });
    }
    item.finalizationSteps.archivePreflight.partialOverride = true;
  }
  const landing = ensureLandingWorktree(config);
  if (worktreeDirty(landing.landingPath)) fail(`Landing worktree is dirty: ${landing.landingPath}`);
  if (!dryRun) {
    run("git", ["fetch", "origin"], { cwd: landing.landingPath });
    run("git", ["checkout", "--detach", "origin/main"], { cwd: landing.landingPath });
    run("git", ["checkout", item.branch], { cwd: item.worktreePath });
    run("git", ["rebase", "origin/main"], { cwd: item.worktreePath });
  }
  try {
    setupCandidate(item, config);
    const setup = setupFresh(item);
    if (setup.status !== "passed") throw new Error(`Candidate setup required before finalization verification: ${setup.reason}.`);
  } catch (error) {
    saveState(state);
    fail(error.message || String(error), { item });
  }
  const verification = runVerification(item.worktreePath);
  item.lastVerification = { at: now(), ...verification };
  if (verification.status !== "passed") {
    item.status = "blocked";
    item.blockedReason = "verification-failed-after-rebase";
    saveState(state);
    fail(`Verification failed after rebase for ${change}.`, { item });
  }
  if (!dryRun) {
    if (plan.status === "ready") {
      const archive = runOpenSpec(["archive", change, "--yes"], { cwd: item.worktreePath });
      const archiveOutput = `${archive.stdout}\n${archive.stderr}`;
      const archiveAborted = /aborted|no files were changed/i.test(archiveOutput) && !/archived as/i.test(archiveOutput);
      item.finalizationSteps.archive = step(archive.status === "passed" && !archiveAborted ? "passed" : "failed", archive);
      if (archive.status !== "passed" || archiveAborted) {
        item.status = "blocked";
        item.blockedReason = "archive-failed";
        saveState(state);
        fail(`Archive failed for ${change}; finalization stopped before merge and push.`, { item, archive });
      }
    } else {
      item.finalizationSteps.archive = step("partial-skipped", { reason: "partial-finalization-approved" });
    }
    run("git", ["add", "-A"], { cwd: item.worktreePath });
    run("git", ["commit", "-m", `Archive ${change}`], { cwd: item.worktreePath, check: false });
    run("git", ["merge", "--squash", item.branch], { cwd: landing.landingPath });
    item.finalizationSteps.merge = step("passed", { branch: item.branch, landingPath: landing.landingPath });
    run("git", ["commit", "-m", finalCommitMessage(change, item.worktreePath)], { cwd: landing.landingPath });
    run("git", ["push", "origin", "HEAD:main"], { cwd: landing.landingPath });
    item.finalizationSteps.push = step("passed", { remote: "origin", ref: "HEAD:main" });
    const planningSync = planningCheckoutReconciliation(item);
    item.finalizationSteps.planningSync = step(planningSync.status, planningSync);
    const duplicateCleanup = cleanupDuplicateArtifacts(item);
    item.finalizationSteps.duplicateArtifactCleanup = step(duplicateCleanup.status, duplicateCleanup);
  } else {
    item.finalizationSteps.archive = step(plan.status === "ready" ? "dry-run" : "partial-dry-run");
    item.finalizationSteps.merge = step("dry-run");
    item.finalizationSteps.push = step("dry-run");
    item.finalizationSteps.planningSync = step("dry-run");
    item.finalizationSteps.duplicateArtifactCleanup = step("dry-run");
  }
  item.status = allowPartial && plan.status !== "ready" ? "partial-finalized" : "finalized";
  item.finalizedAt = now();
  item.devServerPid = undefined;
  saveState(state);
  const summary = [
    `${item.status === "finalized" ? "Finalized" : "Partially finalized"} ${change}.`,
    `Archive: ${item.finalizationSteps.archive?.status || item.finalizationSteps.archivePreflight?.status}`,
    `Merge: ${item.finalizationSteps.merge?.status}`,
    `Push: ${item.finalizationSteps.push?.status}`,
    `Planning sync: ${item.finalizationSteps.planningSync?.status}`,
    `Duplicate artifact cleanup: ${item.finalizationSteps.duplicateArtifactCleanup?.status}`,
    `Branch cleanup: pending cleanup command`
  ].join("\n");
  emit({ ok: item.status === "finalized", item }, summary);
}

function doCleanup(change) {
  if (!change) fail("Usage: cleanup <change>");
  const state = loadState();
  const item = requireItem(state, change);
  if (item.status !== "finalized") fail("Cleanup requires finalized state.");
  if (item.worktreePath && existsSync(item.worktreePath) && worktreeDirty(item.worktreePath)) {
    fail(`Refusing to remove dirty worktree: ${item.worktreePath}`);
  }
  if (!dryRun && item.worktreePath && existsSync(item.worktreePath)) {
    run("git", ["worktree", "remove", item.worktreePath]);
  }
  item.finalizationSteps = item.finalizationSteps || {};
  item.finalizationSteps.worktreeCleanup = step(item.worktreePath && existsSync(item.worktreePath) ? "skipped" : "passed", { worktreePath: item.worktreePath });
  const branchCleanup = cleanupCandidateBranch(item);
  item.finalizationSteps.branchCleanup = step(branchCleanup.local.status === "passed" || branchCleanup.local.status === "skipped" || branchCleanup.local.status === "dry-run" ? "passed" : "failed", branchCleanup);
  state.items = state.items.filter((entry) => entry.change !== change);
  saveState(state);
  emit({ ok: true, item, branchCleanup }, [
    `Cleaned up ${change}.`,
    `Worktree cleanup: ${item.finalizationSteps.worktreeCleanup.status}`,
    `Local branch cleanup: ${branchCleanup.local.status}`,
    `Remote branch cleanup: ${branchCleanup.remote.status}`
  ].join("\n"));
}

function doRecover(change) {
  const config = loadConfig();
  const state = loadState();
  const items = change ? [requireItem(state, change)] : state.items;
  const recovery = items.map((item) => ({
    change: item.change,
    status: item.status,
    worktreePath: item.worktreePath,
    branch: item.branch,
    finalizationSteps: item.finalizationSteps || null,
    finalizationPlan: item.worktreePath ? finalizationPlan(item, config) : null,
    suggestedActions: recoveryActions(item)
  }));
  emit({ ok: true, recovery }, recovery.map((entry) => [
    `${entry.change}: ${entry.suggestedActions.join("; ")}`,
    entry.finalizationPlan ? `  recovery approval: node scripts/openspec-queue.mjs recover-finalize ${entry.change} --confirm-recovery` : null,
    entry.finalizationPlan ? `  remaining steps: ${entry.finalizationPlan.steps.join("; ")}` : null,
    entry.finalizationPlan?.risks?.length ? `  risks: ${entry.finalizationPlan.risks.join("; ")}` : null
  ].filter(Boolean).join("\n")).join("\n") || "No queue items.");
}

function recoveryActions(item) {
  if (item.status === "blocked") return ["inspect verification/conflict output", `run recover ${item.change} --json`, "fix in worktree or reject"];
  if (item.status === "ready-for-test") return ["manual test", `finalize ${item.change} --confirm-gate2 or reject ${item.change}`];
  if (item.status === "finalized") return [`cleanup ${item.change}`];
  if (item.status === "queued") return [`start ${item.change}`];
  return ["inspect status"];
}

function doRecoverFinalize(change) {
  if (!change) fail("Usage: recover-finalize <change> --confirm-recovery");
  if (!flags.has("--confirm-recovery")) fail("Recovery finalization requires explicit --confirm-recovery after reviewing the recovery plan.");
  flags.add("--confirm-gate2");
  doFinalize(change);
}

try {
  switch (command) {
    case "help":
    case "--help":
    case "-h":
      usage();
      break;
    case "status":
      doStatus(positional[0]);
      break;
    case "doctor":
      doDoctor();
      break;
    case "approve":
      doApprove(positional[0]);
      break;
    case "start":
      doStart(positional[0] || (flags.has("--next") ? "--next" : undefined));
      break;
    case "builder-preflight":
      doBuilderPreflight(positional[0]);
      break;
    case "setup":
      doSetup(positional[0]);
      break;
    case "prepare-test":
      await doPrepareTest(positional[0]);
      break;
    case "serve":
      await doServe(positional[0]);
      break;
    case "stop":
      doStop(positional[0]);
      break;
    case "reject":
      doReject(positional[0]);
      break;
    case "finalize":
      doFinalize(positional[0]);
      break;
    case "cleanup":
      doCleanup(positional[0]);
      break;
    case "recover":
      doRecover(positional[0]);
      break;
    case "recover-finalize":
      doRecoverFinalize(positional[0]);
      break;
    default:
      usage();
      process.exit(1);
  }
} catch (error) {
  fail(error.message || String(error));
}
