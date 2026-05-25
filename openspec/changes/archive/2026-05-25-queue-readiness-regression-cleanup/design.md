## Context

The latest queue validation run happened after app/repo hygiene documentation and queue hardening work were already in place. The run still exposed readiness regressions: verification reached a clean worktree before dependencies were installed, queue-managed commands inherited Node 26 despite the app's Node 22 pin, safe build-time Supabase placeholders were applied manually after a failed build, and archive of `add-welcome-empty-state` was blocked by invalid `app-shell` main spec structure.

There is an active `repair-queue-hardening-gaps` change that addresses broad queue mechanics. This change captures the app/repo regression cleanup from `docs/app-repo-hygiene-queue-readiness.md` and should coordinate with that work rather than duplicate every queue hardening task.

## Goals / Non-Goals

**Goals:**

- Convert the app readiness documentation into queue-consumed setup/preflight behavior for dependency install and build env.
- Enforce the repo-pinned Node 22 runtime before queue-managed candidate install, lint, build, or serve commands.
- Ensure candidate setup reports dependency state, active Node version, and env mode before verification starts.
- Repair `openspec/specs/app-shell/spec.md` structure without changing app-shell product behavior.
- Archive `add-welcome-empty-state` after spec repair removes the archive blocker, or confirm no active artifacts remain if prior cleanup already removed them.
- Add or validate a finalization preflight that catches structurally invalid touched main specs before merge/push finalization proceeds.

**Non-Goals:**

- Reopen non-recurring issues from the earlier hygiene run, including unrelated baseline lint cleanup, auth manual testing with placeholder env, markdown renderer lint patterns, or `node_modules` symlink sharing.
- Redesign the whole queue finalization model beyond the regression gates named here.
- Change Morning Analytics product UI behavior.
- Commit or print real local secrets.

## Decisions

### Make setup the only path to candidate verification

Queue-facing flows should reject or redirect raw candidate lint/build/serve commands until setup has established dependency state, Node runtime, and env mode. The implementation can share mechanics with `repair-queue-hardening-gaps`, but this change's acceptance focuses on the specific regressions from the latest run.

Alternative considered: leave docs as guidance and rely on the assistant to remember setup order. That has already failed in a clean candidate, so setup must become a precondition.

### Enforce Node through the local version-manager path when available

Candidate commands should select Node 22 through the configured local runtime path or an available version manager before invoking npm. If Node 22 cannot be selected, the queue should fail before install/build commands mutate candidate state and print the current and required versions.

Alternative considered: allow npm engine warnings when commands succeed. That keeps runs moving but makes queue verification non-reproducible and contradicts the repo pin.

### Prepare build env before build, not after failure

Candidate setup should copy/link real local env when available, use mock env when requested, or create safe placeholder env for build/static checks. The setup output must distinguish build-ready placeholder env from auth/backend-test-ready real env.

Alternative considered: pass env inline only when a build fails. That hides the contract in ad hoc commands and risks different behavior between build, serve, and finalization verification.

### Treat app-shell repair as structural hygiene

`openspec/specs/app-shell/spec.md` should be wrapped in valid OpenSpec structure while preserving existing requirement text. This is not a product behavior change and does not need an app-shell delta spec.

Alternative considered: archive `add-welcome-empty-state` without repairing main spec structure. That leaves archive broken and can keep active artifacts around after the candidate is already merged.

## Risks / Trade-offs

- Overlap with `repair-queue-hardening-gaps` could create duplicate queue edits -> Mitigation: keep implementation focused on the regression scenarios and reconcile with any existing queue changes before editing.
- Node runtime selection can vary by developer machine -> Mitigation: fail early with current/required version and local setup instructions when Node 22 cannot be selected.
- Placeholder env can be mistaken for manual-test readiness -> Mitigation: report env mode before build and preserve the existing rule that placeholder backend env blocks auth/backend handoff.
- App-shell structural repair could accidentally alter requirement content -> Mitigation: move existing requirements under `## Requirements` without changing text except for minimal formatting needed by OpenSpec.
