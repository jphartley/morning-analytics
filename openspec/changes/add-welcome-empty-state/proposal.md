## Why

New users currently land on the app with an editor and an Analyze button, but no lightweight context for what will happen after they paste or type morning pages. A brief empty state will make the first-use flow clearer without adding a full onboarding step.

## What Changes

- Show a welcoming empty-state guide when the app is idle and the current user has no saved analysis history.
- Briefly explain the app flow: write or paste morning pages, receive AI-powered psychoanalytic analysis, then receive 4 generated images inspired by the writing.
- Hide the guide once the user has at least one saved analysis history entry.
- Keep the guide visually lightweight so the journal input remains the primary action.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: Add first-use empty-state guidance to the idle app shell based on history availability.

## Impact

- Affected frontend components: `app/app/page.tsx`, `app/components/HistorySidebar.tsx`, and likely a small new presentational component in `app/components/`.
- No API, database, auth, Supabase, or dependency changes are expected.
- The implementation needs a reliable way for the main page to know whether history has zero entries after the sidebar loads and after a new analysis is saved.
