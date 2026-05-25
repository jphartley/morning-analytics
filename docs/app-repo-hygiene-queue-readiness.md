# App / Repo Hygiene For Queue Readiness

## Background

This document is the app/repo hygiene follow-up from the `add-welcome-empty-state` queue validation run. It supersedes the earlier first-run hygiene brief by removing items that did not recur and focusing on items that were either still rough or were supposed to be fixed by prior readiness work but did not hold during the latest workflow.

The queue architecture document owns queue mechanics. This document focuses on repository contracts that queue candidates rely on:

- Clean app worktrees should have a predictable dependency setup path.
- Candidate verification should use the repo-pinned Node 22 runtime.
- Build-time env requirements should be satisfied by documented safe values.
- OpenSpec main specs should be structurally valid enough that archive can complete.

Do not re-open items that did not recur in this validation run:

- Unrelated baseline lint failures.
- Feature candidates expanding to include unrelated lint cleanup.
- Auth/manual login testing with placeholder Supabase env.
- Markdown renderer `node` prop lint patterns.
- `node_modules` symlink sharing attempts.

## Current Assessment

The previous `app-repo-hygiene-for-queue-readiness` work documented much of the desired behavior. The latest run shows that documentation alone is not enough in a queued workflow: the queue and assistant need to consume those contracts automatically, especially for Node version and env setup.

## Hygiene Issues

### Clean Worktree Dependency Setup Still Surfaced

This was meant to be covered by the prior app/repo hygiene work and by queue-owned candidate setup, but the candidate still reached verification without dependencies installed.

What happened in this run:

- The candidate worktree did not have `app/node_modules`.
- A raw verification attempt failed with `eslint: command not found`.
- Running `npm ci` from the candidate `app/` directory fixed the missing dependency state.

Why the previous fix was incomplete:

- The repo docs correctly describe that clean worktrees need `npm ci`.
- The queue script has candidate setup behavior.
- The workflow still allowed verification commands to run before that setup path was used.

Desired outcome:

- Keep the documented clean-worktree setup contract: use the app's pinned Node version, run `npm ci` from `app/`, and run lockfile registry checks when lockfiles change.
- Make queue-facing guidance treat a missing `app/node_modules` as a setup/preflight condition, not something discovered by a failed lint command.
- Avoid reintroducing shared `node_modules` or shared binary shortcuts unless separately validated for Next.js/Turbopack.

### Node 22 Pin Is Documented But Not Enforced In Candidate Commands

This was partially covered by prior work, but it was not fixed thoroughly enough. The repo is pinned to Node 22, yet candidate commands inherited Node 26 from the active shell.

What happened in this run:

- `npm ci` warned that the shell was on Node `v26.0.0`.
- The app pins Node `22.x` through `app/.nvmrc`, `app/package.json`, and `app/package-lock.json`.
- Install, lint, and build completed, but the warning should not appear in normal queue verification.

Why the previous fix was incomplete:

- The app/repo hygiene work documented the expected runtime.
- The queue and assistant command path did not select or enforce that runtime before running `npm ci`, lint, or build.

Desired outcome:

- Treat Node 22 as a hard candidate-verification precondition.
- Have queue-managed setup and verification select Node 22 through the local version manager when available, or fail early with a clear instruction.
- Report the active Node version in candidate setup output before dependency install.
- Keep `app/.nvmrc`, `app/package.json`, and `app/package-lock.json` aligned.

### Build-Time Supabase Env Was Documented But Not Applied Automatically

This was meant to be smoothed by the prior app/repo hygiene and queue bootstrap work, but the first build still failed because safe build-time env values were missing.

What happened in this run:

- `npm run build` compiled but failed during prerender because `NEXT_PUBLIC_SUPABASE_URL` was missing.
- The agent checked the repo env example and reran with safe placeholder values for:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Build passed with those values.

Why the previous fix was incomplete:

- `app/.env.example` and local docs provide safe placeholder expectations.
- Queue setup can create placeholder env, but raw build commands can still bypass that prepared environment.
- The build-only placeholder path is still being rediscovered manually instead of being part of the normal candidate setup path.

Desired outcome:

- Keep the app docs clear that placeholder Supabase values are valid for build/static checks only.
- Ensure candidate setup always prepares either real local env, mock env, or safe placeholder env before build.
- Report env mode before build so the Gate 2 handoff can distinguish build-ready from auth/backend-test-ready.
- Avoid requiring agents to rediscover `.env.example` during normal queue verification.

### OpenSpec Main Spec Hygiene Blocked Archive

This is a new repository hygiene issue found during finalization. It is not an app runtime problem, but it blocks the queue's ability to archive completed OpenSpec changes.

What happened in this run:

- Finalization attempted to archive `add-welcome-empty-state`.
- OpenSpec reported that `openspec/specs/app-shell/spec.md` is structurally invalid because its requirements are outside a main `## Requirements` section.
- The change merged to `main` unarchived, leaving active artifacts under `openspec/changes/add-welcome-empty-state/`.

Why it matters:

- Queue finalization assumes main specs are valid enough for `openspec archive` to update them.
- A structurally invalid existing spec can turn a completed candidate into a partial finalization.
- The broken spec now blocks archiving the active `add-welcome-empty-state` artifacts until the spec is repaired.

Desired outcome:

- Fix `openspec/specs/app-shell/spec.md` so it has valid OpenSpec structure, including a main `## Requirements` section.
- Archive `add-welcome-empty-state` after the spec hygiene fix.
- Add a lightweight preflight, likely queue-owned, that validates touched main specs before finalization can merge and push.

## Suggested OpenSpec Shape

Proposed change name:

```text
queue-readiness-regression-cleanup
```

Potential affected capabilities:

- app-repo-queue-readiness
- node-version-pinning
- openspec-delivery-queue
- app-shell

Potential task outline:

1. Verify current app clean-worktree setup docs still match the actual app install path.
2. Add queue-facing enforcement or preflight for Node 22 before candidate `npm ci`, lint, build, or serve.
3. Ensure candidate setup prepares documented safe build env before build verification.
4. Repair `openspec/specs/app-shell/spec.md` structure.
5. Archive `add-welcome-empty-state` after spec repair.
6. Run `npm run lint`, `npm run build`, and `npm run check:lockfile-registry` from `app/` with documented env expectations.
7. Run OpenSpec validation/status for affected specs and confirm archive can complete.

## Verification

Minimum verification for this cleanup:

```bash
cd app
npm run lint
npm run build
npm run check:lockfile-registry
```

Also verify candidate setup through the queue path rather than only by raw app commands, so dependency install, Node version, and env mode are exercised together.
