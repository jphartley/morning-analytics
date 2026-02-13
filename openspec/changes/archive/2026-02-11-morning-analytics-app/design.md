## Context

This is a greenfield Next.js application for localhost use. Technical validation is complete:
- Gemini API works with `gemini-2.0-flash` and custom system prompt
- Midjourney automation works via Discord user token for triggering + bot for capturing responses
- All integration code exists in test scripts (`test-prompt.mjs`, `test-discord.mjs`, `test-midjourney.mjs`)

The application needs to orchestrate these validated integrations into a cohesive user experience.

## Goals / Non-Goals

**Goals:**
- Single-page app: paste text → click analyze → see results
- Server-side API calls (keys never exposed to client)
- Clean loading states during the ~60-90 second generation process
- Graceful error handling with retry capability

**Non-Goals:**
- Authentication or user accounts
- Persistent storage or history
- Public deployment or hosting
- Streaming responses (single response only)
- Mobile optimization

## Decisions

### 1. Next.js App Router

**Decision:** Use Next.js 14+ App Router with Server Actions.

**Rationale:** App Router is the current standard. Server Actions simplify the API layer—no need for separate API route files. The analysis flow is a natural fit: client calls server action → server orchestrates Gemini + Discord → returns result.

**Alternatives considered:**
- Pages Router + API routes: More boilerplate, older pattern
- Separate Express backend: Unnecessary complexity for localhost app

### 2. Single Server Action for Analysis

**Decision:** One `analyzeJournal` server action handles the entire pipeline.

**Flow:**
1. Receive journal text from client
2. Call Gemini API with system prompt
3. Parse response to extract image prompt (split on `---IMAGE PROMPT---`)
4. Trigger Midjourney `/imagine` via Discord user token
5. Poll/wait for Midjourney response via Discord bot
6. Return analysis text + 4 image URLs

**Rationale:** Keeps client simple. All orchestration logic stays server-side. Single request/response from user perspective.

### 3. Discord Integration Architecture

**Decision:** Dual-connection approach—user token for commands, bot for listening.

**Components:**
- `lib/discord/trigger.ts`: Sends `/imagine` via user token HTTP request
- `lib/discord/listener.ts`: Discord.js bot that captures Midjourney responses
- Bot runs as long-lived connection, started on first request

**Rationale:** This matches the validated approach from technical feasibility. User token is required to invoke slash commands; bot provides reliable event-based capture.

**Trade-offs:**
- User token is against Discord ToS → Personal use only, monitor for invalidation
- Bot needs to stay connected → First request may have cold start delay

### 4. Image Polling Strategy

**Decision:** Event-based capture with timeout.

**Flow:**
1. After sending `/imagine`, generate a unique nonce
2. Bot listens for Midjourney messages in channel
3. Match response by prompt content or interaction reference
4. Wait for final 4-image grid (not intermediate progress images)
5. Timeout after 120 seconds with error

**Rationale:** Midjourney sends multiple messages (progress updates, then final grid). Need to wait for the completed generation.

### 5. UI State Management

**Decision:** React `useState` + `useTransition` for the simple state machine.

**States:**
- `idle`: Show input form
- `analyzing`: Show loading spinner, disable input
- `complete`: Show results (analysis + images)
- `error`: Show error message + retry button

**Rationale:** Single-page app with linear flow doesn't need Redux/Zustand complexity.

### 6. Component Structure

**Decision:** Minimal component tree.

```
app/
  page.tsx          # Main page with state management
  actions.ts        # Server action (analyzeJournal)
components/
  JournalInput.tsx  # Text area + analyze button
  AnalysisPanel.tsx # Displays parsed analysis sections
  ImageGrid.tsx     # 2x2 grid of generated images
  LoadingState.tsx  # Spinner with status message
  ErrorState.tsx    # Error display with retry
lib/
  gemini.ts         # Gemini API client
  discord/
    trigger.ts      # User token /imagine trigger
    listener.ts     # Bot-based response capture
```

**Rationale:** Flat structure appropriate for MVP scope. Easy to navigate.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Discord user token invalidated | Document fallback options (DALL-E 3, Flux). Token stored in env for easy swap. |
| Midjourney generation timeout | 120s timeout with clear error message. User can retry. |
| Gemini rate limiting | Free tier has limits. Error message suggests waiting. Paid tier available. |
| Long generation time (~60-90s) | Clear loading states with progress indication. |
| Cold start on first request | Bot connects lazily. First request may take extra few seconds. |

## Open Questions

- **Image caching:** Should we cache generated images locally, or always fetch from Discord CDN? (Leaning toward CDN-only for MVP simplicity)
- **Concurrent requests:** What happens if user clicks analyze twice? (Likely: disable button during analysis)
