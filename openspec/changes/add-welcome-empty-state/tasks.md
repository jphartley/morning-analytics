## 1. History State Signal

- [x] 1.1 Add an optional history-count callback prop to `HistorySidebar`.
- [x] 1.2 Call the callback with the fetched history entry count after successful history loads and refreshes.
- [x] 1.3 Track history count and load status in `app/app/page.tsx` without adding a second history request.

## 2. Empty State UI

- [x] 2.1 Add a lightweight welcome empty-state component using design token Tailwind classes.
- [x] 2.2 Render the component only when the app is idle, history has loaded successfully, and the history count is zero.
- [x] 2.3 Ensure the guide copy explains writing or pasting morning pages, AI-powered psychoanalytic analysis, and 4 artistic images.

## 3. Verification

- [x] 3.1 Verify the guide appears for an idle user with zero history entries.
- [x] 3.2 Verify the guide is hidden for users with one or more history entries and after the first saved analysis refreshes history.
- [x] 3.3 Run frontend lint/build checks required for this scoped UI change.
