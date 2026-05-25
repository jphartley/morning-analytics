## Context

The app shell renders the journal input in `app/app/page.tsx` while `HistorySidebar` owns fetching and displaying saved analyses. The new-user guide depends on both app state (`idle`) and history state (zero entries), so the page needs a lightweight signal from the sidebar once history has loaded.

## Goals / Non-Goals

**Goals:**

- Show first-use guidance only while the main app is idle and the user has no saved analysis history.
- Keep the guidance close to the journal input, visually lightweight, and styled with existing design token Tailwind classes.
- Update the empty-state visibility after history loads and after a successful first analysis save refreshes history.

**Non-Goals:**

- Do not add a multi-step onboarding flow, modal, tour, persistence preference, or dismissal control.
- Do not change analysis, image generation, saving, auth, Supabase, or history storage behavior.
- Do not add new package dependencies.

## Decisions

- `HistorySidebar` will expose an optional history-count callback to the page after each successful history fetch. This reuses the existing history query and refresh trigger instead of adding a second client-side request.
- The page will track whether history has loaded and how many entries were returned, then render the guide when `state === "idle"` and the count is `0`.
- The guide will be implemented as a small presentational component, likely below `JournalInput`, using token classes such as `bg-surface`, `border-outline`, `text-ink`, `text-ink-muted`, and `bg-accent-soft`.
- The copy will describe the flow in three short steps: write or paste morning pages, receive an AI-powered psychoanalytic analysis, and receive 4 artistic images inspired by the writing.

## Risks / Trade-offs

- [Risk] History load errors could make the count unknown. → Mitigation: hide the guide until a successful history fetch reports a count, avoiding a misleading first-run message for users whose history could not load.
- [Risk] A second history fetch from the page could duplicate sidebar work. → Mitigation: pass count from the existing sidebar fetch.
- [Risk] The guide could compete visually with the editor. → Mitigation: keep it compact, below the primary input, and use muted token styling.
