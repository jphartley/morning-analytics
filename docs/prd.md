# Morning Analytics — PRD (Week 1 MVP)

**Status:** Technical Validation Complete
**Owner:** Jeremy
**Last Updated:** 2026-02-11

---

## Related Documents

- [Technical Feasibility](../technical-feasibility.md) - Integration validation results
- [Gemini Prompt](../prompt.md) - System prompt for analysis

---

## Background

Morning Pages is a 15-minute stream-of-consciousness writing practice used by creative professionals. Morning Analytics adds AI interpretation and symbolic imagery to help users extract meaning and emotional resonance from their daily writing.

---

## Problem Statement

Daily journaling users want fast, meaningful insights and symbolic imagery from their morning pages, but analysis and visualization are manual and inconsistent.

---

## Goals & Success Metrics

- A single user can paste or write morning pages and receive Gemini analysis plus 4 Midjourney images.
- MVP success = 1 user, 1 analysis, 4 images displayed, fully automated.

---

## Target User

- Primary: You.
- Generalized: People with daily journaling habits seeking insights and emotional resonance.

---

## Core User Journey

1. User writes/pastes into a large text box.
2. User clicks “Analyze.”
3. App returns analysis + 4 images.

---

## Scope

### In Scope (MVP)

- Large text area for paste or direct writing.
- Analyze action that triggers analysis + image generation.
- Gemini analysis output following the required structure and tone.
- Midjourney image generation via Discord bot automation.
- Display analysis and 4 images in a styled UI.

### Out of Scope (MVP)

- Accounts/auth.
- Hosting/public deployment.
- History/storage.
- Payments/premium features.

---

## Functional Requirements

### UX & Flow

- Provide a large text area for paste or direct writing.
- Provide an “Analyze” button to start the pipeline.
- Show a clear loading state during analysis and image generation.

### Gemini Analysis Output

- Tone: warm, quirky psychoanalyst with a mystic/spiritual lens.
- Output structure includes:
  - Short reflective analysis paragraph (2–3 sentences).
  - Single keyword (“Essence”).
  - Left-field insight (question or provocative observation).
  - Next step prompt.
  - Midjourney-optimized image prompt at the end.
- Do not output a Nano Banana prompt.
- Do not output a video prompt.

### Image Generation

- Send `/imagine` via Discord bot to Midjourney using the Gemini prompt.
- Retrieve and display 4 images.

### Display

- Analysis panel + image grid.

### Error Handling

- Clear failure state and retry for Gemini or Midjourney errors.

### Data Handling

- Stateless for MVP (no persistence).

---

## Non-Functional Requirements

- Localhost only (macOS).
- Styled UI (Tailwind).
- Single response (no streaming).
- API keys remain server-side.

---

## Stack (Agreed MVP)

- Next.js on localhost.
- Node API calls to Gemini.
- Discord bot automation for Midjourney.
- Tailwind for UI styling.

---

## Open Questions

- ~~Gemini gem endpoint/schema for structured output~~ [VERIFIED - see [technical-feasibility.md](../technical-feasibility.md)]
- ~~Midjourney automation stability and compliance~~ [VERIFIED - user token approach works]
- Long-term stability of Discord user token approach [MONITORING]

---

## Risks & Mitigations

- Midjourney Discord automation uses user token (against ToS) → Personal use only; fallback options documented in [technical-feasibility.md](../technical-feasibility.md)
- User token may expire or get invalidated → Monitor; fallback to DALL-E 3, Flux, or third-party MJ API
- Unstructured Gemini output → Enforced with `---IMAGE PROMPT---` delimiter in [prompt.md](../prompt.md)

---

## Next Steps

1. ~~Confirm Gemini API access and response schema.~~ ✅ Done
2. ~~Validate Discord bot workflow for Midjourney (single test run).~~ ✅ Done
3. ~~Decide fallback image model if Discord automation fails.~~ ✅ Documented in [technical-feasibility.md](../technical-feasibility.md)
4. Build Next.js application

---

## Glossary

- **Morning Pages**: 15-minute stream-of-consciousness journaling practice.
- **Morning Analytics**: The product that analyzes Morning Pages and generates symbolic imagery.
- **Gemini Gem**: A Gemini prompt/config that generates the analysis output.
- **Essence**: A single keyword summarizing the session’s core theme.
- **Left-Field Insight**: An unexpected, provocative observation or question.
- **Midjourney Prompt**: The image prompt optimized for Midjourney generation.
- **Discord Bot Automation**: Using a Discord bot to send `/imagine` commands and retrieve images.
