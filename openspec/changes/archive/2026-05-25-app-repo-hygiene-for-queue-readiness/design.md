## Context

The app is a Next.js project under `app/` with Supabase-backed auth/storage, mock AI/image modes, and queue-managed candidate worktrees. The first real queued run showed that repository baseline issues can surface during final verification, and that fresh worktrees need predictable dependency and env setup before they are useful for build, dev, or manual auth testing.

Queue architecture hardening already established first-class candidate setup and placeholder-env reporting. This change focuses on the app/repo contract that setup depends on: baseline checks, documented env expectations, clean worktree install guidance, auth manual-test readiness, and repeatable markdown renderer lint patterns.

## Goals / Non-Goals

**Goals:**

- Make the app baseline verification contract explicit for `main` and queued candidates.
- Document clean worktree dependency setup using the app's existing Node/npm workflow.
- Provide a non-secret env example and local documentation that distinguishes build-only placeholders, mock mode, local dev, and Supabase-backed manual testing.
- Define when an auth manual-test handoff is ready and when it must be withheld.
- Preserve or standardize the lint-clean React markdown renderer pattern.
- Document queue behavior when full verification finds unrelated baseline failures.

**Non-Goals:**

- Redesign the Parallel OpenSpec Delivery Queue architecture.
- Change queue worktree placement, finalization strategy, or sandbox approval policy.
- Add a broad test suite or replace manual auth verification.
- Commit local secrets, print secret values, or require a real Supabase project for build-only verification.

## Decisions

### Use documentation plus lightweight local examples as the primary app contract

The hygiene problems are mostly ambiguity rather than missing runtime capability. The implementation should update `app/.env.example`, app/local development docs, and queue-facing guidance before adding new code. A small env-readiness check is acceptable if it only verifies key presence or placeholder status and never prints values.

Alternative considered: enforce every readiness rule in the queue script. The queue already owns candidate setup mechanics, but app-specific env semantics belong close to the app so they can be maintained when auth, storage, or provider requirements change.

### Treat clean worktrees as normal npm installs

Fresh worktrees should run `npm ci` from `app/` using the Node version declared by `app/.nvmrc` and app package engines. The docs should explicitly discourage `node_modules` symlink sharing for Turbopack unless separately validated.

Alternative considered: shared `node_modules` or shared Next binaries for faster setup. The first queue run showed those shortcuts can create toolchain-specific failures and hide dependency drift.

### Separate placeholder build verification from manual auth readiness

Placeholder Supabase values may be enough for static build paths that only require env variables to exist. They must not be described as manual-test-ready for signin, signup, history persistence, or storage flows. Manual auth readiness requires real local Supabase URL/key values copied, linked, or otherwise loaded without exposing secrets.

Alternative considered: require real Supabase env for all builds. That would make build verification stricter than necessary and less useful for clean CI-like smoke checks.

### Stop on unrelated baseline failures unless scope is explicitly expanded

Full `npm run lint` and `npm run build` remain valuable candidate checks. When failures are unrelated to the candidate, the queue-facing guidance should require reporting the baseline failure and preserving the candidate scope until the user approves cleanup or creates a dedicated hygiene change.

Alternative considered: automatically fix unrelated baseline failures in the candidate. That keeps a run moving, but it blurs Gate 2 approval scope and can bury separate repository debt inside feature work.

## Risks / Trade-offs

- Baseline failures can still appear after a candidate starts -> Mitigation: document the stop/report/approval policy and keep verification output clear enough to classify the failure.
- Env documentation can drift from code paths -> Mitigation: implementation must compare documented keys with Supabase, Gemini, Discord, image provider, and cleanup script usage before finishing.
- `npm ci` in each clean worktree is slower than sharing dependencies -> Mitigation: prefer correctness now; optimize with proven cache behavior later.
- A presence-only env check cannot prove credentials are valid -> Mitigation: document that auth manual-test readiness means real-looking config is present, while actual login remains a manual verification step.
