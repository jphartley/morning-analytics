## 1. Failure Reproduction And Baseline Checks

- [x] 1.1 Add or document a queue validation scenario that demonstrates Builder edits can bypass preflight if wrappers do not enforce the candidate path.
- [x] 1.2 Add or document a candidate verification scenario where raw lint/build fails before setup because dependencies, Node runtime, or env are missing.
- [x] 1.3 Add or document an archive-abort scenario using a structurally invalid main spec so finalization can be proven to stop before merge and push.
- [x] 1.4 Add or document planning checkout reconciliation and candidate branch cleanup scenarios from a detached landing push.

## 2. Builder Boundary Enforcement

- [x] 2.1 Add queue state for the latest passed `builder-preflight` including change, worktree path, branch, and timestamp.
- [x] 2.2 Require the Builder workflow wrappers to run `builder-preflight <change>` immediately before implementation edits.
- [x] 2.3 Update Builder instructions to require absolute candidate worktree paths for every implementation patch after queue start.
- [x] 2.4 Strengthen planning-checkout contamination detection so implementation, task, and candidate-only artifact edits in the planning checkout block `prepare-test`.
- [x] 2.5 Report boundary failures with the expected candidate path, actual edit/root path, and recovery instruction.

## 3. Setup And Runtime Gating

- [x] 3.1 Make queue-owned setup a hard prerequisite for candidate lint, build, serve, and finalization verification.
- [x] 3.2 Add Node runtime detection for queue-managed `npm ci`, lint, build, and dev server commands.
- [x] 3.3 Use a configured Node 22 runtime when available, or fail before mutating with current version, required version, and setup instructions.
- [x] 3.4 Report dependency state, Node version, and env mode together before verification starts.
- [x] 3.5 Remove or rewrite wrapper/docs guidance that suggests raw candidate `npm run lint` or `npm run build` outside queue-managed setup.

## 4. OpenSpec Command Noise Handling

- [x] 4.1 Wrap queue-managed OpenSpec commands in a helper that disables telemetry when supported.
- [x] 4.2 Classify known telemetry or `edge.openspec.dev` network warnings as non-blocking when command exit status and required output are successful.
- [x] 4.3 Keep real OpenSpec command failures blocking even when telemetry warnings are also present.
- [x] 4.4 Include telemetry warning classification in queue logs without mixing it into the command failure summary.

## 5. Archive And Finalization Gating

- [x] 5.1 Add archive preflight that validates touched main specs before merge/push finalization.
- [x] 5.2 Capture archive execution status separately from merge, push, cleanup, and branch cleanup status.
- [x] 5.3 Treat archive failure, archive abort, or unexpected no-file-changed archive output as a hard blocker before squash merge and push.
- [x] 5.4 Add explicit partial-finalization recovery approval for any intentional merge/push without successful archive.
- [x] 5.5 Update finalization output to show archive, merge, push, planning-sync, worktree-cleanup, and branch-cleanup statuses separately.

## 6. Planning Checkout Reconciliation

- [x] 6.1 Record queue-created pre-Gate artifact paths at approve/start time for later duplicate cleanup.
- [x] 6.2 After detached landing push, detect whether the planning checkout is behind `origin/main`.
- [x] 6.3 Safely fast-forward the planning checkout when tracked state allows `git pull --ff-only`.
- [x] 6.4 Preserve unrelated untracked files and report them separately from queue-created duplicate artifacts.
- [x] 6.5 Remove or offer to remove only recorded queue-created duplicate artifacts after successful finalization.

## 7. Finalized Branch Cleanup

- [x] 7.1 Add local candidate branch cleanup after successful archive, merge, push, and worktree cleanup.
- [x] 7.2 Use patch-equivalence checks rather than only Git ancestry for squash-merged branch cleanup.
- [x] 7.3 Delete remote candidate branches only after successful push, local branch safety checks, and queue-state ownership checks.
- [x] 7.4 Preserve branches and report skip reasons when patch-equivalence or queue-state ownership cannot be proven.

## 8. Documentation And Validation

- [x] 8.1 Update `.agents/`, `.codex/`, and `.claude/` queue/start wrappers with the enforced preflight, setup, archive, planning-sync, and branch-cleanup behavior.
- [x] 8.2 Update queue documentation to distinguish recurring fixed gaps from non-recurring issues that should stay out of scope.
- [x] 8.3 Run `node --check scripts/openspec-queue.mjs`.
- [x] 8.4 Run `node scripts/openspec-queue.mjs doctor`.
- [x] 8.5 Run targeted dry-run or scripted validation for preflight enforcement, setup/runtime gating, archive abort blocking, planning checkout reconciliation, and branch cleanup.
- [x] 8.6 Run `cd app && npm run lint`, `cd app && npm run build`, and `openspec status --change repair-queue-hardening-gaps`.
