#!/usr/bin/env node

import { spawnSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const queueDir = path.join(repoRoot, ".openspec-queue");
const configPath = path.join(queueDir, "config.json");
const statePath = path.join(queueDir, "state.local.json");

const args = process.argv.slice(2);
const command = args[0] || "help";
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const positional = args.slice(1).filter((arg) => !arg.startsWith("--"));
const jsonOutput = flags.has("--json");
const dryRun = flags.has("--dry-run");

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
  return readJson(configPath, {
    version: 1,
    worktreeRoot: "../morning-openspec-worktrees",
    landingWorktree: "../morning-openspec-worktrees/_landing-main",
    maxActiveImplementations: 2,
    maxRunningDevServers: 2,
    portStart: 3001,
    branchPrefix: "codex/"
  });
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

function now() {
  return new Date().toISOString();
}

function run(cmd, cmdArgs, options = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && options.check !== false) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(output || `${cmd} ${cmdArgs.join(" ")} failed with status ${result.status}`);
  }
  return result;
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
  prepare-test <change>           Run verification, allocate port, start server when possible
  serve <change>                  Start/restart candidate dev server
  stop <change>                   Stop candidate dev server
  reject <change>                 Record Gate 2 rejection and preserve worktree
  finalize <change> --confirm-gate2  Archive, squash merge to landing main, push
  cleanup <change>                Remove finalized local resources when safe
  recover [change]                Print safe recovery actions
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

function runVerification(worktreePath) {
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

function startServer(item, state, config) {
  if (item.devServerPid && isProcessRunning(item.devServerPid)) return { alreadyRunning: true, pid: item.devServerPid };
  if (runningServerItems(state).length >= config.maxRunningDevServers) {
    return { skipped: true, reason: "running-server-limit" };
  }
  if (dryRun) return { dryRun: true };
  const child = spawn("npm", ["run", "dev", "--", "--port", String(item.port)], {
    cwd: path.join(item.worktreePath, "app"),
    detached: true,
    stdio: "ignore",
    env: process.env
  });
  child.unref();
  return { pid: child.pid };
}

function ensureLandingWorktree(config) {
  const landingPath = landingWorktree(config);
  mkdirSync(path.dirname(landingPath), { recursive: true });
  if (worktreeExists(landingPath)) return { landingPath, created: false };
  const args = ["worktree", "add", landingPath, "main"];
  if (dryRun) return { landingPath, created: false, dryRun: true, command: `git ${args.join(" ")}` };
  run("git", args);
  return { landingPath, created: true };
}

function worktreeDirty(worktreePath) {
  return capture("git", ["status", "--porcelain"], worktreePath, false).length > 0;
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
  const checks = [];
  checks.push({ name: "config", status: existsSync(configPath) ? "passed" : "failed", path: configPath });
  checks.push({ name: "git", status: run("git", ["rev-parse", "--show-toplevel"], { capture: true, check: false }).status === 0 ? "passed" : "failed" });
  checks.push({ name: "worktreeRoot", status: "info", path: resolveRepoPath(config.worktreeRoot) });
  checks.push({ name: "landingWorktree", status: existsSync(landingWorktree(config)) ? "passed" : "not-created", path: landingWorktree(config) });
  for (const item of state.items) {
    checks.push({ name: `item:${item.change}`, status: item.worktreePath && existsSync(item.worktreePath) ? "passed" : "not-created", statusValue: item.status });
  }
  const ok = checks.every((check) => check.status !== "failed");
  emit({ ok, checks }, checks.map((check) => `${check.name}: ${check.status}${check.path ? ` (${check.path})` : ""}`).join("\n"));
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
    event: "gate1-approved"
  });
  saveState(state);
  emit({ ok: true, item }, `Queued ${change} for implementation. Gate 1 approval recorded.`);
}

function doStart(changeArg) {
  const config = loadConfig();
  const state = loadState();
  const item = changeArg && changeArg !== "--next" ? requireItem(state, changeArg) : nextQueued(state);
  if (!item) fail("No queued item is ready to start.");
  const active = state.items.filter((entry) => entry.status === "active").length;
  if (item.status !== "active" && active >= config.maxActiveImplementations) {
    fail(`Active implementation limit reached (${config.maxActiveImplementations}).`);
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
    lastSnapshot: { at: now(), source: snapshot.source, target: snapshot.target }
  });
  saveState(state);
  emit({ ok: true, item, worktree, snapshot }, `Started ${item.change} in ${worktree.worktreePath}`);
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

function doPrepareTest(change) {
  if (!change) fail("Usage: prepare-test <change>");
  const config = loadConfig();
  const state = loadState();
  const item = requireItem(state, change);
  if (!item.worktreePath) fail(`${change} has no worktree. Run start first.`);
  item.port = choosePort(state, config, item);
  const verification = runVerification(item.worktreePath);
  item.lastVerification = { at: now(), ...verification };
  if (verification.status === "passed") {
    const draft = makeDraftCommit(item);
    item.lastDraftCommit = { at: now(), ...draft };
  }
  const server = startServer(item, state, config);
  if (server.pid) item.devServerPid = server.pid;
  item.url = `http://localhost:${item.port}`;
  item.status = verification.status === "passed" ? "ready-for-test" : "blocked";
  item.blockedReason = verification.status === "passed" ? undefined : "verification-failed";
  item.updatedAt = now();
  saveState(state);
  const text = [
    `Ready status for ${change}: ${item.status}`,
    `Branch: ${item.branch}`,
    `Worktree: ${item.worktreePath}`,
    `URL: ${item.url}`,
    `Verification: ${verification.status}`,
    server.skipped ? `Dev server: not started (${server.reason})` : `Dev server: ${server.pid ? `pid ${server.pid}` : "already running or dry-run"}`,
    "",
    "Gate 2:",
    `  approve: node scripts/openspec-queue.mjs finalize ${change} --confirm-gate2`,
    `  reject:  node scripts/openspec-queue.mjs reject ${change}`
  ].join("\n");
  emit({ ok: verification.status === "passed", item, server }, text);
  if (verification.status !== "passed") process.exit(1);
}

function doServe(change) {
  if (!change) fail("Usage: serve <change>");
  const config = loadConfig();
  const state = loadState();
  const item = requireItem(state, change);
  item.port = choosePort(state, config, item);
  const server = startServer(item, state, config);
  if (server.pid) item.devServerPid = server.pid;
  item.url = `http://localhost:${item.port}`;
  saveState(state);
  emit({ ok: !server.skipped, item, server }, server.skipped ? `Server not started: ${server.reason}` : `Serving ${change} at ${item.url}`);
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
  const config = loadConfig();
  const state = loadState();
  const item = requireItem(state, change);
  if (!["ready-for-test", "blocked"].includes(item.status)) fail(`${change} is not ready for finalization.`);
  stopServer(item);
  const landing = ensureLandingWorktree(config);
  if (worktreeDirty(landing.landingPath)) fail(`Landing worktree is dirty: ${landing.landingPath}`);
  if (!dryRun) {
    run("git", ["fetch", "origin"], { cwd: landing.landingPath });
    run("git", ["checkout", "main"], { cwd: landing.landingPath });
    run("git", ["pull", "--ff-only", "origin", "main"], { cwd: landing.landingPath });
    run("git", ["checkout", item.branch], { cwd: item.worktreePath });
    run("git", ["rebase", "main"], { cwd: item.worktreePath });
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
    run("openspec", ["archive", change], { cwd: item.worktreePath });
    run("git", ["add", "-A"], { cwd: item.worktreePath });
    run("git", ["commit", "-m", `Archive ${change}`], { cwd: item.worktreePath, check: false });
    run("git", ["checkout", "main"], { cwd: landing.landingPath });
    run("git", ["merge", "--squash", item.branch], { cwd: landing.landingPath });
    run("git", ["commit", "-m", finalCommitMessage(change, item.worktreePath)], { cwd: landing.landingPath });
    run("git", ["push", "origin", "main"], { cwd: landing.landingPath });
  }
  item.status = "finalized";
  item.finalizedAt = now();
  item.devServerPid = undefined;
  saveState(state);
  emit({ ok: true, item }, `Finalized ${change}. Main pushed; Railway will deploy from main.`);
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
  state.items = state.items.filter((entry) => entry.change !== change);
  saveState(state);
  emit({ ok: true, item }, `Cleaned up ${change}.`);
}

function doRecover(change) {
  const state = loadState();
  const items = change ? [requireItem(state, change)] : state.items;
  const recovery = items.map((item) => ({
    change: item.change,
    status: item.status,
    worktreePath: item.worktreePath,
    branch: item.branch,
    suggestedActions: recoveryActions(item)
  }));
  emit({ ok: true, recovery }, recovery.map((entry) => `${entry.change}: ${entry.suggestedActions.join("; ")}`).join("\n") || "No queue items.");
}

function recoveryActions(item) {
  if (item.status === "blocked") return ["inspect verification/conflict output", `run recover ${item.change} --json`, "fix in worktree or reject"];
  if (item.status === "ready-for-test") return ["manual test", `finalize ${item.change} --confirm-gate2 or reject ${item.change}`];
  if (item.status === "finalized") return [`cleanup ${item.change}`];
  if (item.status === "queued") return [`start ${item.change}`];
  return ["inspect status"];
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
    case "prepare-test":
      doPrepareTest(positional[0]);
      break;
    case "serve":
      doServe(positional[0]);
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
    default:
      usage();
      process.exit(1);
  }
} catch (error) {
  fail(error.message || String(error));
}
