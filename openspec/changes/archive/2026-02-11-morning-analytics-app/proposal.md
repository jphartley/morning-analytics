## Why

Daily journaling practitioners want fast, meaningful insights and symbolic imagery from their morning pages, but manual analysis is inconsistent and visualization requires separate tools. Technical validation is complete—Gemini API and Discord/Midjourney automation are both working. Time to build the actual application.

## What Changes

- New Next.js application for localhost use
- Text input interface for morning pages (paste or direct writing)
- Gemini API integration for psychoanalytic-style analysis
- Discord bot automation to trigger Midjourney `/imagine` and capture generated images
- Styled results display showing analysis + 4-image grid
- Loading states and error handling with retry capability

## Capabilities

### New Capabilities

- `journal-analysis`: Gemini-powered analysis of morning pages text. Takes user input, sends to Gemini with mystic analyst prompt, parses structured output (reflective analysis, key word, left-field insight, follow-up prompt, image prompt).
- `image-generation`: Midjourney image generation via Discord automation. Sends `/imagine` command using user token, listens for Midjourney response via bot, retrieves and returns 4 generated images.
- `app-shell`: Next.js application shell with Tailwind styling. Single-page UI with text input, analyze button, loading states, and results display (analysis panel + image grid).

### Modified Capabilities

<!-- No existing capabilities to modify - this is a greenfield application -->

## Impact

- **New files**: Next.js app structure (`app/`, `components/`, `lib/`)
- **APIs**: Server-side routes for Gemini and Discord integration
- **Dependencies**: Next.js, React, Tailwind, `@google/generative-ai`, `discord.js`
- **Environment**: Requires `GEMINI_API_KEY`, `DISCORD_BOT_TOKEN`, `DISCORD_USER_TOKEN`, `DISCORD_CHANNEL_ID`
- **Constraints**: Localhost only, single user, no persistence, no auth
