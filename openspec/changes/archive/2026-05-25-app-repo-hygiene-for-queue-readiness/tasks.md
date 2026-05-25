## 1. Baseline Audit

- [x] 1.1 Audit current `app/` env usage across Supabase, Gemini, Discord/Midjourney, image provider, and cleanup script paths.
- [x] 1.2 Audit current markdown renderer implementations for the `node` prop omission pattern and identify any duplicate or missing helper documentation.
- [x] 1.3 Run or record the current status of `npm run lint`, `npm run build`, and `npm run check:lockfile-registry` from `app/`, separating baseline failures from candidate-caused failures.

## 2. Local Env And Worktree Documentation

- [x] 2.1 Add or update `app/.env.example` with required keys, safe placeholder values, and no real secrets.
- [x] 2.2 Update local app documentation to classify env keys by build, local dev, mock operation, auth/manual testing, history/storage, and admin cleanup usage.
- [x] 2.3 Document that placeholder Supabase values can support only build/static checks and must not be used for signin, signup, history, or storage manual testing.
- [x] 2.4 Document clean worktree setup: use the Node version from `app/.nvmrc`, run `npm ci` from `app/`, and run the lockfile registry check when lockfiles change.
- [x] 2.5 Document that `node_modules` symlink sharing is not recommended for Turbopack/Next.js candidates unless separately validated.

## 3. Readiness And Lint Patterns

- [x] 3.1 Add a lightweight local auth/env readiness check or documentation convention that verifies required Supabase env presence without printing values.
- [x] 3.2 Ensure auth manual-test handoff guidance requires real local Supabase URL and anon key values and rejects placeholder backend config.
- [x] 3.3 Standardize existing markdown renderers on a lint-clean prop omission helper and add a short comment or local helper name explaining why `node` is omitted.

## 4. Queue-Facing Policy

- [x] 4.1 Update queue-facing docs or skills to state that full lint/build remain expected candidate verification checks.
- [x] 4.2 Document the policy for classifying verification failures as candidate-caused versus unrelated baseline issues.
- [x] 4.3 Document that unrelated baseline cleanup must stop for a separate hygiene change or explicit user approval before being included in the current candidate.

## 5. Verification

- [x] 5.1 Run `npm run lint` from `app/` and confirm it passes or document any remaining baseline debt.
- [x] 5.2 Run `npm run build` from `app/` with documented env expectations and confirm it passes.
- [x] 5.3 Run `npm run check:lockfile-registry` from `app/`.
- [x] 5.4 Run `openspec status --change app-repo-hygiene-for-queue-readiness` and confirm the change is apply-ready or complete for the implementation phase.
