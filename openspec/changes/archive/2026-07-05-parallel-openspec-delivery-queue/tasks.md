## 0. OPSX Start Harness

- [x] 0.1 Add canonical `.agents/skills/openspec-start/SKILL.md` as the portable `/opsx:start` workflow
- [x] 0.2 Add thin adapters for `.claude/commands/opsx/start.md`, `.claude/skills/openspec-start/SKILL.md`, and `.codex/skills/openspec-start/SKILL.md`
- [x] 0.3 Route `/opsx:start` input to `/opsx:explore`, `/opsx:propose`, `/opsx:continue`, or direct artifact review based on input readiness and existing change state
- [x] 0.4 Generate the Design Gate Brief only after proposal, specs, design, and tasks are apply-ready
- [x] 0.5 Enforce strict natural-language Gate 1 approval and never auto-approve implementation
- [x] 0.6 After Gate 1 approval, automatically run queue approval/start, invoke the Builder, run verification, and prepare Gate 2 without another user command
- [x] 0.7 Keep the candidate dev server running at Gate 2 when capacity permits and wait for strict approval or rejection
- [x] 0.8 On Gate 2 rejection, loop through implementation fixes or OpenSpec artifact updates as appropriate before presenting Gate 2 again
- [x] 0.9 On Gate 2 approval, invoke finalization and cleanup through the existing queue workflow

## 1. Queue State and Commands

- [x] 1.1 Add committed `.openspec-queue/config.json` for portable workflow defaults
- [x] 1.2 Add gitignored `.openspec-queue/state.local.json` for machine-local queue runtime state
- [x] 1.3 Add `.openspec-queue/state.local.json` to `.gitignore` while keeping `.openspec-queue/config.json` committed
- [x] 1.4 Add queue status tracking for change name, approval time, branch, worktree path, status, assigned port, and last verification result
- [x] 1.5 Implement repo-local queue scripts as the portable source of truth
- [x] 1.6 Implement script commands for `status`, `doctor`, `approve`, `start`, `prepare-test`, `serve`, `stop`, `reject`, `finalize`, `cleanup`, and `recover`
- [x] 1.7 Support human-readable script output by default and machine-readable `--json` output for assistant wrappers
- [x] 1.8 Require explicit approval or finalized state before scripts push, delete, stop servers, clean up worktrees, or finalize candidates
- [x] 1.9 Add commands or skills to list queue items and show candidate status by calling the queue scripts
- [x] 1.10 Define stable role prompts or skill boundaries for Queue Manager, Intent Reviewer, Conflict Guard, Builder, Test Preparer, and Finalizer
- [x] 1.11 Ensure each skill or command states which scripts it calls, why it calls them, the safety boundary they enforce, and the expected output or state transition

## 2. Design Gate

- [x] 2.1 Implement Design Gate Brief generation from OpenSpec proposal, specs, design, and tasks
- [x] 2.2 Include intent, UX or behavior changes, scope boundaries, risks and assumptions, technical escalations, manual test focus, and ready-to-build recommendation
- [x] 2.3 Require explicit user approval before a change enters the implementation queue
- [x] 2.4 Route fuzzy or risky briefs back to artifact refinement instead of queueing

## 3. Worktree Execution

- [x] 3.1 Create per-change branches and Git worktrees for approved queued changes
- [x] 3.2 Snapshot the approved OpenSpec artifacts into the candidate branch before Builder implementation starts
- [x] 3.3 Ensure the Builder invokes OpenSpec apply/context from inside the candidate worktree
- [x] 3.4 Ensure OpenSpec artifacts and implementation changes travel together on the worktree branch
- [x] 3.5 Create or reuse a dedicated clean landing worktree for `main` finalization
- [x] 3.6 Implement FIFO scheduling with an initial configurable active implementation limit
- [x] 3.7 Create local draft commits after implementation reaches a candidate state

## 4. Conflict Detection

- [x] 4.1 Detect overlap between queued or active changes using OpenSpec capabilities, changed files, and high-risk path categories
- [x] 4.2 Allow low-risk overlap while recording it in queue state or handoff output
- [x] 4.3 Pause or sequence later changes when high-risk overlap is detected
- [x] 4.4 Interrupt the user only for high-risk conflicts or newly discovered design ambiguity

## 5. Manual Testing Handoff

- [x] 5.1 Allocate unique local ports for ready candidates
- [x] 5.2 Run default automated verification: `npm run lint` and `npm run build` from `app/`
- [x] 5.3 Run `npm run check:lockfile-registry` from `app/` when `app/package-lock.json` changed
- [x] 5.4 Derive and run change-specific automated verification from OpenSpec artifacts when the change touches validation scripts, integrations, Supabase behavior, image generation, or AI output parsing
- [x] 5.5 Start the app dev server from the candidate worktree when running-server capacity is available
- [x] 5.6 Produce a compact handoff with change, branch, worktree, URL, changed behavior, manual test focus, verification result, known risks, and Gate 2 instructions
- [x] 5.7 Keep extra candidates ready but stopped when the running-server limit is reached

## 6. Manual Test Gate and Finalization

- [x] 6.1 Accept Gate 2 approval or rejection for a ready candidate
- [x] 6.2 On rejection, keep the OpenSpec change active, update artifacts or tasks when needed, fix the same worktree, and prepare a new candidate
- [x] 6.3 On approval, stop the candidate dev server and verify the landing worktree has no uncommitted changes
- [x] 6.4 Update landing `main` from origin and rebase the candidate branch onto current `main` when conflict-free
- [x] 6.5 Rerun required verification before final merge
- [x] 6.6 Archive the OpenSpec change in the candidate branch
- [x] 6.7 Generate the final squash commit message from the OpenSpec change
- [x] 6.8 Squash merge into landing `main` and push main to trigger Railway deployment

## 7. Cleanup and Recovery

- [x] 7.1 Remove finalized worktrees and clear local queue runtime state after successful push
- [x] 7.2 Refuse automatic worktree deletion when uncommitted changes are present
- [x] 7.3 Preserve branch and worktree state when finalization fails
- [x] 7.4 Provide recovery instructions for conflicts, verification failure, push failure, or missing environment values

## 8. Validation

- [x] 8.1 Validate the change with OpenSpec
- [x] 8.2 Exercise the full flow with one queued change before enabling parallel execution
- [x] 8.3 Defer two-queued-worktree stress testing to `TechnicalDebt.md`
- [x] 8.4 Verify finalization archives OpenSpec, squash merges to main, pushes, and cleans up the worktree
