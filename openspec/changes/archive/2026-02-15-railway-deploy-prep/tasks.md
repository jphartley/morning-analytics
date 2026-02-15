## 1. Move prompts into app directory

- [x] 1.1 Move `/prompts/*.md` files (jungian.md, mel-robbins.md, loving-parent.md) to `/app/prompts/`
- [x] 1.2 Update `lib/gemini.ts` `loadPersonaPrompts()` path from `join(process.cwd(), "..", "prompts", ...)` to `join(process.cwd(), "prompts", ...)`
- [x] 1.3 Remove the unused `getSystemPrompt()` function and its `systemPrompt` variable from `lib/gemini.ts` (dead code referencing non-existent `../docs/prompt.md`)

## 2. Pin Node version

- [x] 2.1 Create `.nvmrc` file at project root (`/morning-openspec/.nvmrc`) containing `22`
- [x] 2.2 Add `"engines": { "node": "22.x" }` to `/app/package.json`
- [x] 2.3 Update `@types/node` in `/app/package.json` from `^20` to `^22` and run `npm install`

## 3. Update documentation

- [x] 3.1 Update CLAUDE.md references to prompt file locations (change `/prompts/{persona}.md` to `/app/prompts/{persona}.md` in all relevant sections)
