## 1. Project Setup

- [x] 1.1 Initialize Next.js project with App Router and TypeScript
- [x] 1.2 Install dependencies: `@google/generative-ai`, `discord.js`
- [x] 1.3 Configure Tailwind CSS
- [x] 1.4 Set up environment variables

## 2. Mock Integrations

- [x] 2.1 Create `lib/gemini.ts` with mock that returns sample analysis + image prompt
- [x] 2.2 Create `lib/discord/trigger.ts` with mock that logs and returns success
- [x] 2.3 Create `lib/discord/listener.ts` with mock that returns placeholder image URLs
- [x] 2.4 Add configurable delay to mocks to simulate real latency

## 3. Server Action

- [x] 3.1 Create `app/actions.ts` with `analyzeJournal` server action
- [x] 3.2 Orchestrate mock Gemini → parse → mock Discord → return result
- [x] 3.3 Return structured result (analysis text + image URLs) or error

## 4. UI Components

- [x] 4.1 Create `components/JournalInput.tsx` (text area + analyze button)
- [x] 4.2 Create `components/AnalysisPanel.tsx` (displays analysis text)
- [x] 4.3 Create `components/ImageGrid.tsx` (2x2 image grid)
- [x] 4.4 Create `components/LoadingState.tsx` (spinner with message)
- [x] 4.5 Create `components/ErrorState.tsx` (error message + retry button)

## 5. Main Page

- [x] 5.1 Create `app/page.tsx` with state management (idle/analyzing/complete/error)
- [x] 5.2 Wire up components and server action
- [x] 5.3 Style with Tailwind for clean presentation

## 6. Verify with Mocks

- [x] 6.1 Test full flow with mock integrations
- [x] 6.2 Verify loading states display correctly
- [x] 6.3 Verify error handling works (force mock to fail)

## 7. Real Integrations

- [x] 7.1 Implement real Gemini API call in `lib/gemini.ts`
- [x] 7.2 Load system prompt from `docs/prompt.md`
- [x] 7.3 Implement real Discord trigger via user token
- [x] 7.4 Implement real Discord listener for Midjourney responses
- [x] 7.5 Add timeout handling (120s) for generation

## 8. End-to-End Testing

- [x] 8.1 Test full flow with real APIs
- [x] 8.2 Test error scenarios (API failures, timeouts)
