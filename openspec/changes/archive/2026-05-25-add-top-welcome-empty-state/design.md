## Context

The authenticated home page renders `AppHeader`, `HistorySidebar`, and the main journal input/results area. `HistorySidebar` already fetches the current user's analysis list with `listAnalyses()`, but the parent page does not know whether that list is empty. The welcome guide needs to appear only when the user is idle and has no saved analysis history, and it must be visible near the top of the screen below the navigation bar.

## Goals / Non-Goals

**Goals:**
- Surface a lightweight welcome guide for first-time users before they create an analysis.
- Place the guide above the editor in the main content column, inside the top page header area below the title/subtitle and below `AppHeader`.
- Reuse the existing history fetch as the source of truth for whether the current user has saved analyses.
- Keep styling aligned with design tokens and the existing quiet app UI.

**Non-Goals:**
- Adding a multi-step onboarding wizard, modal, or dismiss/persistence setting.
- Changing how analyses are saved, loaded, selected, or deleted.
- Adding database queries beyond the existing history-list fetch.
- Changing unauthenticated sign-in or sign-up pages.

## Decisions

- **Lift history emptiness to the home page:** Add an optional callback from `HistorySidebar` to report whether history loading completed with zero entries. This avoids a duplicate `listAnalyses()` call in `page.tsx` while preserving the sidebar as the existing history fetch owner.
- **Render only in the idle main flow:** Show the guide when `state === "idle"` and history is known to be empty. This keeps loading, error, active analysis, and historical viewing states unchanged.
- **Use a small dedicated component:** Implement a lightweight `WelcomeEmptyState` component so copy and layout are easy to review without crowding `page.tsx`.
- **Place before `JournalInput`:** Render the guide in the top page header area above the input so it is visible near the top of the screen below the authenticated navigation/header.
- **Use tokenized Tailwind classes:** Style with `bg-surface`, `bg-accent-soft`, `text-ink`, `text-ink-muted`, and `border-outline` rather than hardcoded color utilities.

## Risks / Trade-offs

- **History loading delay** -> Do not show the guide until the sidebar reports loaded history state, avoiding a flash for returning users.
- **Sidebar hidden on mobile** -> Keep `HistorySidebar` mounted even when visually hidden, so its existing fetch and callback still provide the empty-history signal.
- **Save failure after first analysis** -> The guide remains tied to saved history, so if an analysis cannot be saved the app may still consider the user new on a future idle visit. That matches the requirement to disappear once the user has at least one analysis.
