# Repository Guidelines

## Project Structure & Module Organization
Primary code is in `app/` (Next.js App Router + TypeScript):
- `app/app/`: routes, auth pages, and server actions (`analyzeText`, `generateImages`, `saveAnalysis`).
- `app/components/`: UI components (PascalCase files).
- `app/lib/`: integrations/utilities (Gemini, Discord, Supabase, image splitting).
- `app/prompts/`: analyst persona prompts.
- `app/public/mock-images/`: local image fixtures for mock mode.

Specs and change artifacts are in `openspec/` (`specs/`, `changes/`, `changes/archive/`). Research/product docs are in `docs/`. Integration checks are in `validation/`. Admin scripts are in `scripts/`.

## Build, Test, and Development Commands
From `app/` (Node 22.x; see `.nvmrc`):
- `npm install`
- `npm run dev` (localhost:3000)
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run check:lockfile-registry` (fails if `app/package-lock.json` contains `jfrog.booking.com`)
- `npm run fix:lockfile-registry` (normalizes lockfile registry URLs to `registry.npmjs.org`)

From `validation/`:
- `npm install`
- `npm run test-prompt`
- `npm run test-discord`
- `npm run test-midjourney`

From repo root:
- `node scripts/cleanup-history.js --keep 5` (deletes older analyses after confirmation).

## Registry-Safe Workflow (Local vs Railway)
Local development may require a private npm registry (for example via `~/.npmrc`), while Railway must build from public npm.

- Railway service variables should include:
  - `NPM_CONFIG_REGISTRY=https://registry.npmjs.org/`
  - `NPM_CONFIG_REPLACE_REGISTRY_HOST=always`
- Before committing lockfile changes from local development:
  - Run `cd app && npm run check:lockfile-registry`
  - If it fails, run `cd app && npm run fix:lockfile-registry` and re-check
- Keep app runtime pins aligned in these files:
  - `app/.nvmrc`
  - `app/package.json` (`engines.node`)
  - `app/package-lock.json` (root `packages[""].engines.node`)

### Railway Environment Variable Sync
Railway does not read local `.env` files. Whenever an environment variable is added, removed, renamed, or its required value changes in `.env.example`, local `.env*` files, application code, or deployment configuration:

1. Identify the exact variable names affected without exposing secret values.
2. Remind the user to add or update them in the Railway `morning-analytics` service under **Variables** for the **production** environment. Variables are environment-scoped, so updating another Railway environment is not sufficient.
3. Treat the Railway change as incomplete until its staged changes have been reviewed and deployed. Saving a variable alone does not make it active in the running deployment.
4. Explicitly note that `NEXT_PUBLIC_*` values are compiled into the Next.js client bundle and therefore require a rebuild/redeploy. For consistency, require a Railway deploy/redeploy after any variable change, including server-only variables.
5. Include an `Environment / Railway variables` note in the final handoff and PR description, listing variable names and whether each is new, changed, or removed.

Never copy local secret values into documentation, commits, diagnostics, or chat. The user should enter secret values directly in Railway.

Reference docs:
- `docs/railway-deployment-plan.md`
- `docs/research/railway-npm-ci-failure.md`
- `docs/image-generation-architecture.md` (Midjourney/Discord failure conclusions, rejected approaches, and recommended direct-provider job architecture)

## Coding Style & Naming Conventions
Use strict TypeScript (`app/tsconfig.json`). Follow existing style: 2-space indentation, semicolons, double quotes, and `@/*` imports. Use PascalCase for component files, camelCase for functions/variables, and descriptive kebab-case names for non-component files. Use design-token Tailwind classes (`bg-page`, `text-ink`, `border-outline`) instead of hardcoded color utilities.

## Testing Guidelines
There is no full unit/integration suite yet in `app/`. Required baseline:
1. analyze journal text,
2. verify analysis renders,
3. verify image generation path (`NEXT_PUBLIC_IMAGE_PROVIDER=mock|midjourney`),
4. verify history persistence/load.

For no-API testing, use `USE_AI_MOCKS=true` and mock images. If changing Gemini output format, keep `---IMAGE PROMPT---` parsing in sync in `app/app/actions.ts`.

## OpenSpec & Change Workflow
Use OpenSpec for scoped changes. Create/continue/apply changes in `openspec/`, and archive completed work under `openspec/changes/archive/`. After archiving, commit artifacts with an `Archive: ...` subject. Review `TechnicalDebt.md` before starting major work and update it when deferring work.

### OPSX Start And Parallel OpenSpec Delivery Queue
For changes that should move from idea or approved design to testable implementation with less serial attention, use `/opsx:start` as the primary workflow. OpenSpec remains the source of truth for intent (`proposal.md`, specs, `design.md`, `tasks.md`); `/opsx:start` routes through explicit OpenSpec commands and the queue only orchestrates gates, worktrees, verification, handoff, finalization, and cleanup.

Key files:
- `.openspec-queue/config.json`: committed shared queue defaults.
- `.openspec-queue/state.local.json`: gitignored local runtime state.
- `scripts/openspec-queue.mjs`: portable queue command implementation.
- `.agents/skills/openspec-start/SKILL.md`: canonical portable `/opsx:start` workflow.
- `.codex/skills/openspec-start/SKILL.md`, `.claude/skills/openspec-start/SKILL.md`, `.claude/commands/opsx/start.md`: thin adapters for tool-specific entrypoints.
- `.agents/.codex/.claude` delivery queue skills/commands: readable wrappers around the lower-level queue script.

Primary workflow:
1. Run `/opsx:start <idea, bug report, issue, or existing change>`.
2. Route fuzzy input through `/opsx:explore`, detailed input through `/opsx:propose`, incomplete existing changes through `/opsx:continue`, or apply-ready existing changes through direct artifact review.
3. Produce a short Design Gate Brief from apply-ready OpenSpec artifacts.
4. Only after strict Gate 1 approval, enqueue/start the change, build in the candidate worktree, verify, start the dev server when capacity permits, and present Gate 2.
5. Keep the candidate dev server running at Gate 2 when possible and always include the clickable local dev server URL in the test handoff. If the server cannot be started or is not ready, say that explicitly and include the command or next action needed to get a test link.
6. If Gate 2 is rejected, preserve the same worktree and loop through implementation fixes or OpenSpec artifact updates as appropriate.
7. If Gate 2 is approved, finalize by archiving, squash merging to `main`, pushing, and cleaning up safe local resources.

Roles:
- Queue Manager: queue state, FIFO scheduling, worktree setup.
- Intent Reviewer: short Design Gate Brief from OpenSpec artifacts.
- Conflict Guard: high-risk overlap detection.
- Builder: implements only inside the assigned candidate worktree.
- Test Preparer: verification, dev server, and manual test handoff.
- Finalizer: after manual approval, archives, squash merges to `main`, pushes, and cleans up.

Lower-level queue commands are for `/opsx:start`, status checks, recovery, and advanced operation:
- `node scripts/openspec-queue.mjs status [<change>]`
- `node scripts/openspec-queue.mjs doctor`
- `node scripts/openspec-queue.mjs approve <change>`
- `node scripts/openspec-queue.mjs start [<change>|--next]`
- `node scripts/openspec-queue.mjs prepare-test <change>`
- `node scripts/openspec-queue.mjs serve|stop|reject|finalize|cleanup|recover`

Safety rules:
- Do not create queue state before Gate 1 approval.
- Do not let scripts or agents approve Gate 1 or Gate 2 for the user.
- Treat casual acknowledgements (`ok`, `sounds good`, `nice`, `continue`) as ambiguous, not approval.
- Do not edit the planning checkout from the Builder role.
- Do not finalize without explicit Gate 2 approval.
- Do not delete dirty worktrees.
- Whenever a change is ready for user testing, provide a clickable dev server link (for example, `http://localhost:3000` or the queue-assigned local URL) in the final handoff. Do not make the user ask for the link separately.
- Keep queue wrappers human readable: state which script they call, why, what safety boundary it enforces, and expected output.

## Commit & Pull Request Guidelines
In the Codex managed sandbox, run all Git commands with escalation on the first attempt. This avoids predictable `.git/index.lock`, `.git/worktrees/.../index.lock`, worktree metadata, and network failures. Treat anything Git-related as outside-sandbox work by default, including read-only inspection (`git status`, `git diff`, `git log`, `git branch`), metadata writes (`git add`, `git commit`, `git restore`, `git switch`, `git merge`, `git rebase`, `git stash`), branch/worktree cleanup, and remote operations (`git fetch`, `git pull`, `git push`).

Use concise imperative commit subjects (`Add ...`, `Fix ...`, `Prepare ...`) and keep commits focused.

PRs should include:
1. problem and solution summary,
2. linked OpenSpec change/specs when applicable,
3. local verification steps and results,
4. screenshots/GIFs for UI changes,
5. any env or migration updates (for example, `supabase/migrations/...`).
