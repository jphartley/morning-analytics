---
name: "OPSX: Start"
description: Start an OpenSpec delivery flow from idea or existing change through Gate 2
category: Workflow
tags: [workflow, openspec, queue, worktrees, delivery]
---

Use this command as the primary OpenSpec delivery entrypoint:

```text
/opsx:start <idea, bug report, issue, or existing change>
```

This command is a thin adapter. Follow the canonical workflow in:

```text
.agents/skills/openspec-start/SKILL.md
```

## What This Command Does

It routes the user's input through explicit OpenSpec commands, creates the Design Gate Brief, waits for strict Gate 1 approval, then automatically drives the queue/build/verify/serve flow to Gate 2.

Routes:
- fuzzy, short, speculative, or exploratory input -> `/opsx:explore`, then `/opsx:propose`
- detailed request, bug report, issue, reproduction steps, or acceptance criteria -> `/opsx:propose`
- existing active change with missing artifacts -> `/opsx:continue`
- existing active change with apply-ready artifacts -> read artifacts and create the Design Gate Brief

## Queue Scripts Called After Gate 1

- `node scripts/openspec-queue.mjs approve <change>` records explicit Gate 1 approval and enqueues the change.
- `node scripts/openspec-queue.mjs start <change> --json` creates or reuses the candidate branch/worktree and snapshots approved artifacts.
- `node scripts/openspec-queue.mjs prepare-test <change>` runs verification, creates the candidate handoff, allocates a port, and starts the dev server when capacity permits.

## Gate 2 Scripts

- `node scripts/openspec-queue.mjs reject <change>` records a strict Gate 2 rejection and preserves the worktree for fixes.
- `node scripts/openspec-queue.mjs finalize <change> --confirm-gate2` finalizes only after strict Gate 2 approval.
- `node scripts/openspec-queue.mjs cleanup <change>` removes finalized resources only when safe.

## Safety Boundaries

- Do not create queue state before Gate 1 approval.
- Do not treat casual acknowledgement as approval.
- Do not approve Gate 1 or Gate 2 for the user.
- Do not edit the planning checkout from the Builder role.
- Do not finalize without strict Gate 2 approval after manual testing.
- Do not delete dirty worktrees.
