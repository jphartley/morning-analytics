# App / Repo Hygiene For Queue Readiness

## Background

The first real Parallel OpenSpec Delivery Queue run completed successfully, but it exposed several hygiene issues in the morning analytics app and repository baseline. These issues are separate from the queue architecture itself.

The queue should eventually handle worktree setup, preflights, finalization, and recovery better. This document focuses on the underlying app/repo conditions that make queued work smoother:

- `main` should be reliably lint/build clean.
- Clean worktrees should have an obvious dependency setup path.
- Local env requirements should be clear for build, dev, auth, and manual testing.
- Baseline problems should not expand a small feature candidate after Gate 2 approval.

Use this as source context for a separate OpenSpec change, distinct from the Parallel OpenSpec Delivery Queue architecture hardening work.

## Problem Statement

Queued delivery assumes a candidate can be built, linted, served, manually tested, finalized, and merged without unrelated repository problems appearing midway through the process.

During the `analysis-reading-time-estimate` run, several app/repo hygiene problems made that harder:

- Full lint found unrelated baseline issues.
- Missing Supabase env values broke build or runtime behavior.
- Placeholder env values let build pass but caused login to fail during manual testing.
- Clean candidate worktrees did not have dependencies installed.
- A `node_modules` symlink shortcut was attempted and rejected by Turbopack.
- React markdown renderer lint warnings required a reusable pattern.

These are not primarily queue design bugs. They are repository-readiness issues that should be cleaned up so the queue can operate predictably.

## Recommended Order

Handle this after the Queue Architecture hardening unless `main` is currently failing `npm run lint` or `npm run build`.

Recommended order inside this hygiene change:

1. Establish baseline verification expectations for `main`.
2. Document and verify clean-worktree dependency setup.
3. Clarify local env requirements for build/dev/manual testing.
4. Standardize known lint patterns that are likely to recur.
5. Define a policy for what happens when baseline verification fails during queued work.

## Goals

- Keep `main` consistently passing required app verification.
- Make clean worktree setup predictable and boring.
- Prevent placeholder env from reaching manual test handoff for auth/backend flows.
- Separate feature work from unrelated baseline cleanup.
- Give future queue runs enough app-level documentation to avoid improvising.

## Non-Goals

- Do not redesign the Parallel OpenSpec Delivery Queue in this hygiene change.
- Do not change queue finalization, worktree placement, or sandbox permissions here.
- Do not introduce a full test suite unless a focused smoke check naturally fits.
- Do not commit local secrets or print secret values.

## Issue 1: Baseline Lint And Build Readiness

### What Happened

During finalization, full `npm run lint` failed on unrelated issues outside the approved reading-time change. The agent fixed those issues in the candidate branch so finalization could proceed.

Examples mentioned during the run:

- React hook lint issue in `ModelPicker.tsx`.
- Unused `router` variables in auth pages.
- Unused markdown renderer props such as `node`.
- Unused `content` in a Discord listener.

The final merged state passed lint and build, but the process showed that unrelated baseline failures can derail a small queued candidate.

### Why It Matters

If a candidate fails verification due to unrelated baseline problems, the run can expand beyond the approved OpenSpec scope. That creates ambiguity:

- Did Gate 2 approval cover only the feature?
- Is unrelated cleanup now part of the candidate?
- Should the queue block, ask, or auto-fix?

### Desired Outcome

- `main` should pass `npm run lint` and `npm run build` before queue work starts.
- If baseline verification fails, it should be fixed in a dedicated hygiene change.
- Feature candidates should not silently absorb unrelated cleanup after Gate 2 approval.

### Acceptance Criteria

- Running `npm run lint` from `app/` on `main` passes.
- Running `npm run build` from `app/` on `main` passes with documented env expectations.
- Any known baseline verification debt is documented or tracked separately.
- Future OpenSpec/queue guidance says unrelated baseline cleanup requires separate approval or a separate change.

## Issue 2: Verification Scope Policy

### What Happened

The queue reran full lint/build as part of candidate verification and finalization. This is generally good, but when full lint found unrelated issues, the feature branch expanded to include cleanup that was not part of the original reading-time estimate scope.

### Why It Matters

Full verification protects `main`, but it can blur ownership when baseline failures predate the candidate. The repo needs a clear policy so future runs know what to do.

### Desired Outcome

Define the expected behavior when full-app verification fails:

- If failures are caused by the candidate, fix them in the candidate.
- If failures are unrelated baseline issues, stop and report them.
- Only include unrelated cleanup in the candidate after explicit user approval.

### Acceptance Criteria

- Documentation states whether full lint/build are required for all candidates.
- Documentation distinguishes candidate-caused failures from baseline failures.
- Documentation says unrelated baseline cleanup should be separate unless explicitly approved.
- Optional: add a small baseline verification note to queue-facing docs or project docs.

## Issue 3: Local Env Requirements

### What Happened

Build initially failed because Supabase env vars were missing. Placeholder Supabase values were created to let build verification pass, but the candidate was then handed off for manual login testing while still using placeholder values. Login failed with known credentials until the real `app/.env.local` was copied into the candidate worktree.

### Why It Matters

Build-only env and manual-test env are different. Placeholder values may be acceptable to prove static build behavior, but they are not acceptable for auth or backend manual testing.

### Desired Outcome

The app should clearly document required env vars and their intended use:

- Required for build.
- Required for local dev.
- Required for auth/manual testing.
- Safe mock or placeholder behavior, if any.

### Acceptance Criteria

- `app/.env.example` exists or is updated with required keys and no secrets.
- Local docs identify which env vars are needed for Supabase-backed auth flows.
- Docs distinguish build-only placeholder/mock env from manual-test-ready env.
- Missing env behavior is documented clearly enough that a queue candidate is not handed off for auth testing with fake backend config.

## Issue 4: Clean Worktree Dependency Setup

### What Happened

The candidate worktree did not have `app/node_modules`, so `npm run build` failed with `next: command not found`. A symlink to the main checkout's `node_modules` was attempted, but Turbopack rejected the symlink because it pointed outside the filesystem root. Running `npm ci --prefer-offline` in the candidate app worked.

### Why It Matters

Fresh Git worktrees do not automatically share dependencies. Queue candidates should have a predictable setup path that matches normal project expectations and does not depend on fragile symlink shortcuts.

### Desired Outcome

Document and validate the expected setup for a clean worktree:

- Use Node version from `app/.nvmrc`.
- Run `npm ci` from `app/`.
- Keep registry-safe lockfile behavior.
- Avoid `node_modules` sharing unless explicitly validated.

### Acceptance Criteria

- Docs state that clean worktrees should run `npm ci` from `app/`.
- Docs mention `npm run check:lockfile-registry` when lockfile changes.
- Node version expectations remain aligned across `app/.nvmrc`, `app/package.json`, and `app/package-lock.json`.
- Symlink-based `node_modules` sharing is not recommended for Turbopack unless separately proven safe.

## Issue 5: Auth Manual Test Readiness

### What Happened

The manual tester used a known user/password and could not log in because the candidate app pointed at placeholder Supabase config.

### Why It Matters

Manual testing should test the intended behavior against the intended local backend configuration. If auth is part of the test path, the candidate should be explicitly marked as auth-ready before handoff.

### Desired Outcome

Add a simple local manual-test readiness convention:

- Candidate has real local env copied or linked.
- Supabase URL/key are present.
- Login page responds.
- Auth tests are not requested when using placeholder env.

### Acceptance Criteria

- Docs explain what "manual-test-ready for auth" means.
- Docs explain that placeholder env should not be used for login testing.
- Optional: add a lightweight local check that confirms required public Supabase env vars are present without printing values.

## Issue 6: Reusable Markdown Renderer Lint Pattern

### What Happened

React markdown renderers exposed unused `node` props. Renaming to `_node` did not help because the ESLint config still flags underscore-prefixed unused variables. The eventual fix used a helper that omits the internal `node` prop before spreading DOM props.

### Why It Matters

Markdown renderer components are likely to appear again. Without a standard pattern, future changes may rediscover the same lint behavior.

### Desired Outcome

Standardize how markdown renderer props are handled.

### Acceptance Criteria

- Existing markdown renderers use a lint-clean pattern.
- A short code comment or local helper clarifies why `node` is omitted before spreading props, if needed.
- Future code avoids relying on underscore-prefixed unused parameters unless ESLint is configured for that.

## Suggested OpenSpec Shape

Proposed change name:

```text
app-repo-hygiene-for-queue-readiness
```

Potential affected capabilities:

- app-local-development
- app-verification
- auth-local-testing
- queue-readiness, if a spec already exists for repository readiness

Potential task outline:

1. Audit current `main` lint/build status.
2. Update or add local env documentation and `.env.example`.
3. Document clean worktree dependency setup.
4. Add or document auth manual-test readiness checks.
5. Standardize markdown renderer lint pattern if remaining instances exist.
6. Update queue-facing docs to say unrelated baseline cleanup should be separated from feature candidates.
7. Run `npm run lint` and `npm run build` from `app/`.

## Verification

Minimum verification for this hygiene change:

```bash
cd app
npm run lint
npm run build
npm run check:lockfile-registry
```

If auth/local env docs are changed, manually confirm that the documented env keys match the actual app code paths for Supabase client/server usage.
