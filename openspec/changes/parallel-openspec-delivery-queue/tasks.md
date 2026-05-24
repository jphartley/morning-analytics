## 1. Queue State and Commands

- [ ] 1.1 Add committed `.openspec-queue/config.json` for portable workflow defaults
- [ ] 1.2 Add gitignored `.openspec-queue/state.local.json` for machine-local queue runtime state
- [ ] 1.3 Add `.openspec-queue/state.local.json` to `.gitignore` while keeping `.openspec-queue/config.json` committed
- [ ] 1.4 Add queue status tracking for change name, approval time, branch, worktree path, status, assigned port, and last verification result
- [ ] 1.5 Implement repo-local queue scripts as the portable source of truth
- [ ] 1.6 Implement script commands for `status`, `doctor`, `approve`, `start`, `prepare-test`, `serve`, `stop`, `reject`, `finalize`, `cleanup`, and `recover`
- [ ] 1.7 Support human-readable script output by default and machine-readable `--json` output for assistant wrappers
- [ ] 1.8 Require explicit approval or finalized state before scripts push, delete, stop servers, clean up worktrees, or finalize candidates
- [ ] 1.9 Add commands or skills to list queue items and show candidate status by calling the queue scripts
- [ ] 1.10 Define stable role prompts or skill boundaries for Queue Manager, Intent Reviewer, Conflict Guard, Builder, Test Preparer, and Finalizer
- [ ] 1.11 Ensure each skill or command states which scripts it calls, why it calls them, the safety boundary they enforce, and the expected output or state transition

## 2. Design Gate

- [ ] 2.1 Implement Design Gate Brief generation from OpenSpec proposal, specs, design, and tasks
- [ ] 2.2 Include intent, UX or behavior changes, scope boundaries, risks and assumptions, technical escalations, manual test focus, and ready-to-build recommendation
- [ ] 2.3 Require explicit user approval before a change enters the implementation queue
- [ ] 2.4 Route fuzzy or risky briefs back to artifact refinement instead of queueing

## 3. Worktree Execution

- [ ] 3.1 Create per-change branches and Git worktrees for approved queued changes
- [ ] 3.2 Snapshot the approved OpenSpec artifacts into the candidate branch before Builder implementation starts
- [ ] 3.3 Ensure the Builder invokes OpenSpec apply/context from inside the candidate worktree
- [ ] 3.4 Ensure OpenSpec artifacts and implementation changes travel together on the worktree branch
- [ ] 3.5 Create or reuse a dedicated clean landing worktree for `main` finalization
- [ ] 3.6 Implement FIFO scheduling with an initial configurable active implementation limit
- [ ] 3.7 Create local draft commits after implementation reaches a candidate state

## 4. Conflict Detection

- [ ] 4.1 Detect overlap between queued or active changes using OpenSpec capabilities, changed files, and high-risk path categories
- [ ] 4.2 Allow low-risk overlap while recording it in queue state or handoff output
- [ ] 4.3 Pause or sequence later changes when high-risk overlap is detected
- [ ] 4.4 Interrupt the user only for high-risk conflicts or newly discovered design ambiguity

## 5. Manual Testing Handoff

- [ ] 5.1 Allocate unique local ports for ready candidates
- [ ] 5.2 Run default automated verification: `npm run lint` and `npm run build` from `app/`
- [ ] 5.3 Run `npm run check:lockfile-registry` from `app/` when `app/package-lock.json` changed
- [ ] 5.4 Derive and run change-specific automated verification from OpenSpec artifacts when the change touches validation scripts, integrations, Supabase behavior, image generation, or AI output parsing
- [ ] 5.5 Start the app dev server from the candidate worktree when running-server capacity is available
- [ ] 5.6 Produce a compact handoff with change, branch, worktree, URL, changed behavior, manual test focus, verification result, known risks, and Gate 2 instructions
- [ ] 5.7 Keep extra candidates ready but stopped when the running-server limit is reached

## 6. Manual Test Gate and Finalization

- [ ] 6.1 Accept Gate 2 approval or rejection for a ready candidate
- [ ] 6.2 On rejection, keep the OpenSpec change active, update artifacts or tasks when needed, fix the same worktree, and prepare a new candidate
- [ ] 6.3 On approval, stop the candidate dev server and verify the landing worktree has no uncommitted changes
- [ ] 6.4 Update landing `main` from origin and rebase the candidate branch onto current `main` when conflict-free
- [ ] 6.5 Rerun required verification before final merge
- [ ] 6.6 Archive the OpenSpec change in the candidate branch
- [ ] 6.7 Generate the final squash commit message from the OpenSpec change
- [ ] 6.8 Squash merge into landing `main` and push main to trigger Railway deployment

## 7. Cleanup and Recovery

- [ ] 7.1 Remove finalized worktrees and clear local queue runtime state after successful push
- [ ] 7.2 Refuse automatic worktree deletion when uncommitted changes are present
- [ ] 7.3 Preserve branch and worktree state when finalization fails
- [ ] 7.4 Provide recovery instructions for conflicts, verification failure, push failure, or missing environment values

## 8. Validation

- [ ] 8.1 Validate the change with OpenSpec
- [ ] 8.2 Exercise the full flow with one queued change before enabling parallel execution
- [ ] 8.3 Exercise two queued worktrees with unique ports and conflict detection
- [ ] 8.4 Verify finalization archives OpenSpec, squash merges to main, pushes, and cleans up the worktree
