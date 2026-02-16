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

Reference docs:
- `docs/railway-deployment-plan.md`
- `docs/research/railway-npm-ci-failure.md`

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

## Commit & Pull Request Guidelines
Use concise imperative commit subjects (`Add ...`, `Fix ...`, `Prepare ...`) and keep commits focused.

PRs should include:
1. problem and solution summary,
2. linked OpenSpec change/specs when applicable,
3. local verification steps and results,
4. screenshots/GIFs for UI changes,
5. any env or migration updates (for example, `supabase/migrations/...`).
