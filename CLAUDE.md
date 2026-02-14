# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Morning Analytics: AI-powered psychoanalytic insights and symbolic imagery from morning pages journaling. Users paste morning pages text, receive psychoanalytic-style analysis (~2s), then view 4 AI-generated artistic images. Designed for "Morning Pages" practitioners from "The Artist's Way".

## Development Commands

All npm commands run from the `/app` directory:

```bash
cd app
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

Validation scripts (run from `/validation`):
```bash
cd validation
npm run test-prompt      # Test Gemini prompt
npm run test-discord     # Test Discord connection
npm run test-midjourney  # Test Midjourney integration
```

Set `USE_MOCKS=true` in `/app/.env.local` for testing without API calls.

Admin Utilities:
```bash
node scripts/cleanup-history.js --keep 5    # Delete all but 5 most recent analyses (CLI only, requires confirmation)
```

## Architecture

### Directory Structure

The Next.js application lives in `/app`:
- `/app/app/` - Next.js App Router pages and server actions
- `/app/components/` - React components
- `/app/lib/` - Utilities (Gemini client, Discord integration, image processing)

### UI State Machine
```
idle → analyzing → text-ready → complete
                    ↓ (parallel)
              (images loading)
```

### Two-Phase Processing
1. **analyzeText()** (~2s): Gemini returns analysis + image prompt (separated by `---IMAGE PROMPT---`)
2. **generateImages()** (~60-90s): Midjourney generates 2x2 grid, Sharp splits into 4 quadrants

### Discord Two-Token Strategy
- **User Token**: Triggers `/imagine` command
- **Bot Token**: Listens for Midjourney responses via Discord.js

## Environment Variables

Required in `/app/.env.local`:
```
GEMINI_API_KEY=
DISCORD_USER_TOKEN=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_CHANNEL_ID=
USE_MOCKS=false
```

Debug flags:
```
DEBUG_DISCORD=true   # Verbose Discord/Midjourney listener logging
```

## Git Workflow

This project is maintained on GitHub using the `gh` CLI tool. **After completing work on features or changes, commit and push regularly:**

```bash
# Check status and staged changes
git status
git diff

# Stage and commit implementation
git add <specific-files>
git commit -m "Clear, concise message describing the change"

# Push to remote
git push origin main
```

**Note**: Use `git add` with specific file names rather than `git add .` to avoid accidentally committing secrets or large files. After archiving OpenSpec changes with `/opsx:archive`, create a commit with those changes.

## OpenSpec Workflow

This project uses OpenSpec for structured change management. Feature specs live in `/openspec/specs/`. Use the OpenSpec skills (`/opsx:new`, `/opsx:continue`, `/opsx:apply`, etc.) for creating and implementing changes.

**After archiving a change with `/opsx:archive`, commit the archived artifacts:**
```bash
git add openspec/changes/archive/
git commit -m "Archive: [change-name] - completed and verified"
git push origin main
```
