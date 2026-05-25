---
name: "OPSX: Queue"
description: Inspect and operate the parallel OpenSpec delivery queue
category: Workflow
tags: [workflow, openspec, queue, worktrees]
---

Use this command as a readable wrapper around the portable queue script:

```bash
node scripts/openspec-queue.mjs <command>
```

## What This Command Does

This command does not implement queue logic itself. It calls repo-local scripts so Codex, Claude Code, Cursor, and terminal usage share the same behavior.

## Common Subcommands

- `status [<change>]`: show queue state.
- `doctor`: check config, git/worktree state, ports, and recoverability.
- `approve <change>`: record explicit Gate 1 approval.
- `start [<change>|--next]`: create/reuse candidate worktree and snapshot approved OpenSpec artifacts.
- `builder-preflight <change>`: verify the Builder is in the assigned candidate worktree before editing.
- `setup <change>`: prepare dependencies and ignored local env files without printing secret values.
- `prepare-test <change>`: run setup, validate Node runtime, verify, check planning checkout contamination and landing readiness, probe dev server readiness, and emit manual testing handoff.
- `serve <change>`: start or restart the dev server, capture logs, and probe readiness.
- `stop <change>`: stop the dev server.
- `reject <change>`: record Gate 2 rejection and preserve worktree.
- `finalize <change> --confirm-gate2`: finalize only after explicit Gate 2 approval; archive failure blocks merge and push.
- `cleanup <change>`: remove finalized resources and finalized candidate branches only when safe.
- `recover [<change>]`: print safe recovery actions, finalization state, remaining steps, and risks.
- `recover-finalize <change> --confirm-recovery`: run approved recovery finalization after the user approves the listed recovery sub-steps.

## Safety Boundaries

- Do not call `approve` unless the user explicitly approves the Design Gate Brief.
- Do not call `finalize` unless the user explicitly approves Gate 2 after manual testing.
- Do not edit a candidate until `builder-preflight` passes from the assigned worktree.
- Do not use raw candidate lint/build/dev-server commands outside queue-managed setup.
- Do not present a Gate 2 URL as ready unless queue readiness succeeds.
- Do not call `recover-finalize` without explicit recovery approval.
- Do not delete dirty worktrees.
- Use `--json` when another tool needs machine-readable state.
- Use `--dry-run` before risky mutating commands when previewing behavior.
