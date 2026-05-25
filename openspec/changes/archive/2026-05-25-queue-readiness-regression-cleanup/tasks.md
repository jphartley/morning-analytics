## 1. Coordination And Reproduction

- [x] 1.1 Review current dirty queue changes and the active `repair-queue-hardening-gaps` artifacts before editing shared queue files.
- [x] 1.2 Reproduce or document the clean-worktree verification failure mode where lint/build can run before candidate setup installs dependencies.
- [x] 1.3 Reproduce or document the Node 26 warning path and confirm the app runtime pins still require Node 22.
- [x] 1.4 Reproduce or document the missing Supabase build-env failure path and expected safe placeholder build env.
- [x] 1.5 Reproduce or document the `app-shell` structural archive blocker for `add-welcome-empty-state`.

## 2. Candidate Setup And Runtime Gates

- [x] 2.1 Update queue setup/verification flow so candidate lint, build, serve, and finalization verification require successful queue-owned setup first.
- [x] 2.2 Add dependency-state detection that treats missing `app/node_modules` as setup state before verification rather than a lint/build failure.
- [x] 2.3 Add Node runtime detection and selection for queue-managed app npm commands.
- [x] 2.4 Fail before mutating candidate state when Node 22 cannot be selected, reporting current version, required version, and setup instruction.
- [x] 2.5 Report dependency state, active Node version, and env mode together before verification starts.

## 3. Build Env Preparation

- [x] 3.1 Ensure candidate setup prepares real local env, mock env, or safe placeholder Supabase env before build verification.
- [x] 3.2 Preserve the distinction between build/static-check-ready placeholder env and auth/backend-test-ready real env in setup and handoff output.
- [x] 3.3 Update queue/start wrappers to route raw build or lint instructions through the setup/preflight path.

## 4. OpenSpec Spec Hygiene And Archive Recovery

- [x] 4.1 Repair `openspec/specs/app-shell/spec.md` by adding valid top-level OpenSpec structure while preserving existing requirement behavior.
- [x] 4.2 Add or verify a finalization preflight that validates touched main specs before archive, merge, and push finalization.
- [x] 4.3 Archive `add-welcome-empty-state` after `app-shell` structure no longer blocks archive, or confirm no active artifacts remain.
- [x] 4.4 Confirm active artifacts for `add-welcome-empty-state` are removed only through normal archive behavior or are already absent.

## 5. Documentation And Validation

- [x] 5.1 Update affected queue docs and `.agents/`, `.codex`, and `.claude` wrappers to describe setup, Node, env, and spec-structure gates.
- [x] 5.2 Run `node --check scripts/openspec-queue.mjs`.
- [x] 5.3 Run `node scripts/openspec-queue.mjs doctor`.
- [x] 5.4 Run app verification from `app/`: `npm run lint`, `npm run build`, and `npm run check:lockfile-registry`.
- [x] 5.5 Run OpenSpec status/validation for `queue-readiness-regression-cleanup`, affected main specs, and the `add-welcome-empty-state` archive result.
