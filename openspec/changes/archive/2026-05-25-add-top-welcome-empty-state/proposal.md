## Why

New users currently land on an idle app that shows the editor and controls without explaining what to do next. A lightweight welcome empty state will orient first-time users without turning the product into an onboarding flow.

## What Changes

- Show a welcome guide when the authenticated app is idle and the user has no saved analysis history.
- Position the welcome guide near the top of the page, below the navigation/header and above the main journal input area.
- Explain the core flow in 2-3 concise steps: write or paste morning pages, receive AI analysis, and get four generated images.
- Hide the guide once the user has at least one saved analysis.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `app-shell`: Adds first-run welcome empty-state behavior to the main authenticated app shell.

## Impact

- Affected code: `app/app/page.tsx`, `app/components/HistorySidebar.tsx`, and likely a new lightweight welcome component under `app/components/`.
- No API, database, dependency, package, or environment changes expected.
- The app needs a reliable client-side signal for whether the current user has zero history entries.
