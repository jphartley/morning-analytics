# Morning Analytics — PRD

**Status:** Implemented & Deployed
**Owner:** Jeremy
**Last Updated:** 2026-02-15

---

## Related Documents

- [Technical Feasibility](../technical-feasibility.md) - Integration validation results
- [CLAUDE.md](../CLAUDE.md) - Full technical architecture reference
- [TechnicalDebt.md](../TechnicalDebt.md) - Deferred work and known limitations

---

## Background

Morning Pages is a 15-minute stream-of-consciousness writing practice from "The Artist's Way." Morning Analytics adds AI-powered psychoanalytic interpretation and symbolic imagery to help users extract meaning and emotional resonance from their daily writing.

---

## Problem Statement

Daily journaling users want fast, meaningful insights and symbolic imagery from their morning pages, but analysis and visualization are manual and inconsistent.

---

## What Was Built

The project began as a minimal MVP (paste text → get analysis + 4 images, stateless, localhost-only, single user) and evolved into a multi-user, cloud-ready application with personalization, persistence, and a polished design system.

### Core Pipeline

1. User writes or pastes morning pages text.
2. User selects a Gemini model and analyst persona.
3. User clicks "Analyze."
4. Analysis text displays immediately (~2s). Images generate in background (~60-90s).
5. 4 AI-generated images appear in a 2×2 grid. Analysis and images persist to history.

### Features Delivered

**Analysis Engine**
- Gemini API integration with 3 selectable models (gemini-3-pro-preview, gemini-2.5-pro, gemini-2.5-flash)
- 3 analyst personas with distinct voices: Jungian (psychoanalytic depth), Mel Robbins (action-oriented), Loving Parent (compassionate)
- Persona-specific system prompts that shape both analysis tone and image generation style
- Markdown rendering of analysis output with styled headers, lists, and emphasis

**Image Generation**
- Midjourney automation via Discord (dual-token strategy: user token triggers, bot token listens)
- Automatic grid splitting: downloads 2×2 grid, Sharp extracts 4 quadrants as JPEG
- Images uploaded to Supabase S3 storage with persistent URLs

**Progressive UX**
- Two-phase display: analysis text appears in ~2s, images load while user reads
- Full-screen lightbox for image viewing
- Loading states and error handling with retry at each phase
- Graceful degradation (image failure doesn't block analysis display)

**User Authentication & Data Privacy**
- Email/password auth via Supabase Auth (signup, signin, session management)
- Row-Level Security on all data: each user sees only their own analyses
- Protected routing with automatic redirect to signin

**History & Persistence**
- All analyses saved to Supabase PostgreSQL with full metadata
- History sidebar for browsing and revisiting past analyses
- Admin CLI tool for storage cleanup (`scripts/cleanup-history.js`)

**Design System**
- 20 switchable color palettes via CSS custom properties
- Semantic design tokens (`bg-page`, `text-ink`, `bg-accent`, etc.)
- Runtime palette switching with localStorage persistence
- Unified visual identity across auth pages and main app

**Deployment Readiness**
- Node 22 LTS pinned (.nvmrc + engines field)
- Self-contained app directory (prompts bundled inside /app)
- Environment variable configuration for localhost and cloud (Railway)
- Mock mode for development without external API calls

---

## Target User

- Primary: Jeremy (daily Morning Pages practitioner).
- Generalized: People with daily journaling habits seeking insights and emotional resonance.

---

## Stack

- **Frontend/Backend:** Next.js (App Router, Server Actions)
- **Styling:** Tailwind CSS v4 with custom palette token system
- **AI Analysis:** Google Generative AI (Gemini)
- **Image Generation:** Midjourney via Discord automation
- **Database & Storage:** Supabase (PostgreSQL + S3)
- **Auth:** Supabase Auth (email/password)
- **Image Processing:** Sharp (grid splitting)
- **Deployment Target:** Railway

---

## Risks & Mitigations

- Midjourney Discord automation uses user token (against ToS) → Personal use only; fallback to DALL-E 3, Flux, or third-party MJ API documented
- User token may expire or get invalidated → Monitor; fallback options ready
- Server actions receive userId from client session → Production hardening tracked in TechnicalDebt.md

---

## What's Next

See [TechnicalDebt.md](../TechnicalDebt.md) for the full list of deferred work, including:
- Password reset and account deletion flows
- Server-side auth middleware (replace client-side userId passing)
- Email confirmation enforcement
- Performance optimizations (parallel uploads, caching)
- Export functionality

---

## Glossary

- **Morning Pages**: 15-minute stream-of-consciousness journaling practice.
- **Morning Analytics**: The product that analyzes Morning Pages and generates symbolic imagery.
- **Analyst Persona**: A selectable analysis voice (Jungian, Mel Robbins, Loving Parent) that shapes tone and imagery.
- **Essence**: A single keyword summarizing the session's core theme.
- **Left-Field Insight**: An unexpected, provocative observation or question.
- **Design Palette**: One of 20 switchable color themes applied via CSS custom properties.
