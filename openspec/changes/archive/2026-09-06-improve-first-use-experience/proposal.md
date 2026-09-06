## Why

The first screen for a new account explains the product before inviting the person to write, repeats the product name, and exposes controls that are not useful until after a first reflection. A tighter first-use experience should make writing the clear next step while setting accurate expectations for the reflection and imagery that follow.

## What Changes

- Remove the redundant large in-page `Morning Analytics` heading from every main application state while retaining the centered `Insights From Your Morning Pages` subtitle and the branded application header.
- Move the welcome guide below the journal editor and primary submission button, and rename it `How it works`.
- Replace the welcome guide's intro and all three step labels and descriptions with the agreed, locked copy. The canonical wording, capitalization, punctuation, and contraction style must be rendered verbatim.
- Use the agreed journal-editor placeholder and primary button label for every new analysis, not only the first one.
- Simplify the empty-history sidebar: hide `+ New Analysis` during a first-use empty state and show the agreed future-history message instead.
- Keep the analyst-persona selector and detail-view controls stable before and after the first reflection. Leave the palette picker, account controls, persistence behavior, analysis behavior, and existing post-first-analysis controls unchanged.
- Show provider headings above image groups only while the admin image-provider picker is available; standard users see image grids directly without a provider title or its reserved space.

## Capabilities

### New Capabilities

- `first-use-experience`: Present a focused, copy-locked empty-history experience for a newly registered user before their first completed reflection.

### Modified Capabilities

- `image-generation`: Limit provider-labelled image headings to the admin provider-picker experience while preserving image display and provider attribution.

## Impact

- Affected UI: `app/app/page.tsx`, `app/components/WelcomeEmptyState.tsx`, `app/components/JournalInput.tsx`, `app/components/HistorySidebar.tsx`, `app/components/ProviderImageGroups.tsx`, `app/components/ImageGrid.tsx`, and the rendering of top-bar controls.
- Affected tests: first-use/empty-history rendering, provider-image-group rendering, and existing component tests for the journal input, history sidebar, and top-bar controls.
- No API, database, authentication, persistence, palette, image generation, or provider-selection behavior changes.
