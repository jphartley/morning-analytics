---
name: openspec-start
description: Start an OpenSpec-powered delivery flow from an idea, detailed request, or existing change and continue through the Design Gate, queued worktree implementation, verification, dev-server handoff, and Gate 2.
license: MIT
compatibility: Requires openspec CLI and Node.js.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "parallel-openspec-delivery-queue"
---

This is the Claude Code adapter for `/opsx:start`.

Use the canonical workflow at:

```text
.agents/skills/openspec-start/SKILL.md
```

The adapter must preserve the same behavior:
- route fuzzy input through `/opsx:explore`, detailed input through `/opsx:propose`, incomplete existing changes through `/opsx:continue`, and apply-ready existing changes through direct artifact review
- create the Design Gate Brief from apply-ready OpenSpec artifacts
- require strict Gate 1 approval before queue state is created
- after Gate 1 approval, automatically call `node scripts/openspec-queue.mjs approve <change>`, `start <change> --json`, run `builder-preflight <change>` from the candidate worktree immediately before implementation edits, implement only under the absolute candidate path, then call `prepare-test <change>`
- keep the candidate dev server running at Gate 2 only when queue readiness succeeds and capacity permits
- require strict Gate 2 approval before `finalize <change> --confirm-gate2` and `cleanup <change>`; archive failure blocks merge and push
- call `reject <change>` and loop through fixes or artifact updates when Gate 2 is rejected
- use `recover <change>` and `recover-finalize <change> --confirm-recovery` only after normal finalization fails and the user explicitly approves the listed recovery sub-steps

Do not duplicate or change the canonical safety rules here. If this adapter and the canonical skill disagree, follow the canonical skill.
