## 1. History Empty-State Signal

- [x] 1.1 Update `HistorySidebar` props to accept an optional callback that reports whether history loading completed with zero entries.
- [x] 1.2 Invoke the callback after `listAnalyses()` succeeds, passing `true` for zero entries and `false` when at least one entry exists.
- [x] 1.3 Invoke the callback with `false` or leave the welcome hidden when history loading fails, so the app does not show misleading first-run guidance.

## 2. Welcome Empty-State UI

- [x] 2.1 Add a lightweight `WelcomeEmptyState` component that explains the morning-pages, AI-analysis, and four-image flow in concise copy.
- [x] 2.2 Style the component with existing design-token Tailwind classes and keep the visual weight lower than the journal input.
- [x] 2.3 Render the component in `app/app/page.tsx` only when the app is idle and history is known to be empty.
- [x] 2.4 Place the component above `JournalInput` in the main column so it appears near the top of the screen below the navigation/header.

## 3. Verification

- [x] 3.1 Run `npm run lint` from `app/`.
- [ ] 3.2 Manually verify a user with no history sees the welcome guide near the top below the navigation/header.
- [ ] 3.3 Manually verify a user with one or more history entries does not see the welcome guide.
- [ ] 3.4 Manually verify analyzing, completed, error, and history-view states do not show the welcome guide.
