## Why

The app currently runs only on localhost. We want to prepare for deploying to Railway so that when the time comes, deployment is straightforward. The goal is local-cloud parity: developing locally and deploying to Railway should be nearly identical from a developer perspective, with no environment-specific code paths or configuration gymnastics.

## What Changes

- Move `/prompts` directory into `/app/prompts` so the Next.js app is fully self-contained (no cross-directory filesystem reads)
- Update prompt loading path in `lib/gemini.ts` to reflect the new location
- Pin Node.js version to 22 LTS via `.nvmrc` file at the project root
- Add `engines.node` field to `/app/package.json` specifying Node 22.x
- Update `@types/node` to match Node 22 if needed

## Capabilities

### New Capabilities

- `node-version-pinning`: Ensures consistent Node.js version across local development and cloud deployment environments via `.nvmrc` and `engines` field.

### Modified Capabilities

- `analyst-personas`: Persona prompt files move from `/prompts` to `/app/prompts`, changing the filesystem layout for prompt loading. The capability itself (selecting and applying personas) is unchanged, but the requirement for where prompts are located changes.

## Impact

- **Code**: `lib/gemini.ts` — prompt loading path changes from `join(process.cwd(), "..", "prompts", ...)` to `join(process.cwd(), "prompts", ...)`
- **Project structure**: `/prompts/*.md` moves to `/app/prompts/*.md`
- **Dependencies**: `@types/node` version may need updating to `^22`
- **Developer setup**: Developers will need Node 22 LTS installed (version manager recommended but not enforced by this change)
- **No runtime behavior changes**: The app functions identically; this is purely structural preparation
