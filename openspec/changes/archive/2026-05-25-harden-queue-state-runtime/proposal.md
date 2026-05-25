## Why

Recent OpenSpec queue runs exposed reliability issues that do not stop the workflow completely, but add recovery friction and false alarms. The most important bug is split queue state: commands run from candidate worktrees can read and write a candidate-local `.openspec-queue/state.local.json`, leaving the planning checkout unable to see Builder preflight or setup state.

## What Changes

- Make queue runtime state canonical across planning, candidate, and landing worktrees.
- Add lightweight detection and explicit recovery for legacy candidate-local split state.
- Run queue-managed npm and dev-server commands through the repo-pinned Node 22 runtime when a compatible local runtime is available.
- Restore missing portable `.agents` propose skill parity.
- Tighten expected touch-area inference so frontend-only changes do not claim broad backend or package areas unless those areas are explicitly referenced.
- Make repeated `prepare-test` draft commits idempotent by amending the existing queue draft commit.

## Capabilities

### New Capabilities

### Modified Capabilities
- `openspec-delivery-queue`: canonical queue state, split-state recovery, touch-area precision, draft commit idempotence, and skill parity requirements.
- `node-version-pinning`: queue-managed child commands select Node 22 even when the queue script was launched from another Node runtime.

## Impact

- Affected code: `scripts/openspec-queue.mjs`, `.agents/skills/openspec-propose/SKILL.md`, OpenSpec queue specs and change artifacts.
- No public app UI, app runtime API, database, or deployment behavior changes.
- Existing candidate-local split state is not auto-merged; recovery remains explicit.
