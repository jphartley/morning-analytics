## Context

The Morning Analytics Next.js app lives in `/app` but reads persona prompt files from a sibling `/prompts` directory using `join(process.cwd(), "..", "prompts", ...)`. This cross-directory dependency makes the app non-self-contained and will break on Railway, where the deploy root would be `/app`.

Additionally, no Node.js version is pinned anywhere. The developer is on Node 25.x (Homebrew latest) while Railway's Nixpacks defaults to Node 18. This creates a risk of version-specific behavior differences.

There is also a dead code path in `lib/gemini.ts` referencing `../docs/prompt.md` (the `getSystemPrompt()` function) which is never called and points to a non-existent file.

## Goals / Non-Goals

**Goals:**
- Make the Next.js app in `/app` fully self-contained (no filesystem reads outside `/app`)
- Pin Node.js to version 22 LTS consistently across local dev and Railway
- Ensure Railway can deploy with root directory set to `/app` and default Nixpacks detection

**Non-Goals:**
- Actually deploying to Railway (that's a separate future step)
- Switching to Next.js standalone output mode (deferred, tracked in TechnicalDebt.md)
- Installing a local Node version manager (developer setup, outside code scope)
- Changing any runtime behavior of the app

## Decisions

### Move prompts into app directory

**Decision**: Move `/prompts/*.md` to `/app/prompts/*.md` and update the loading path in `lib/gemini.ts`.

**Rationale**: The alternative was configuring Railway to deploy from project root with `cd app && npm run build` commands. Moving prompts is simpler, makes the app self-contained, and eliminates a class of path-related bugs. The `validation/` and `scripts/` directories are local-only tools and don't need to be in the deploy.

**Path change**: `join(process.cwd(), "..", "prompts", ...)` → `join(process.cwd(), "prompts", ...)`

### Pin Node 22 LTS

**Decision**: Use Node 22 LTS, pinned via both `.nvmrc` (at project root) and `engines.node` in `package.json`.

**Rationale**: Node 22 is the current LTS with EOL April 2027. Node 20 LTS goes EOL April 2026 (too soon). The codebase uses no Node 23+ specific APIs — standard `fs`, `path`, `Buffer` operations only. Both `.nvmrc` and `engines` are needed: `.nvmrc` is read by version managers (fnm, nvm) and Railway's Nixpacks; `engines` provides a safety net via npm warnings.

### Clean up dead getSystemPrompt function

**Decision**: Remove the unused `getSystemPrompt()` function and its `systemPrompt` cache variable from `lib/gemini.ts`.

**Rationale**: It references `../docs/prompt.md` which doesn't exist. The function is never called — all prompt loading goes through `loadPersonaPrompts()` / `getPromptForPersona()`. Leaving dead code that references paths outside `/app` is confusing.

## Risks / Trade-offs

- **[Risk] Scripts that reference `/prompts` break** → The `validation/` scripts don't reference prompts. The `scripts/cleanup-history.js` only touches Supabase. No external references found. CLAUDE.md will need updating to reflect the new location.
- **[Risk] Node 22 vs current Node 25 causes issues** → Codebase scan shows no Node 23+ APIs used. All dependencies (Next.js 16, discord.js 14, sharp 0.34) support Node 22. Low risk.
- **[Risk] `.nvmrc` at project root, not `/app`** → `.nvmrc` goes at project root (where developers clone and `cd` into). Railway's root directory setting points to `/app` for deployment, and Nixpacks also reads `engines.node` from `package.json`. Both locations are covered.
