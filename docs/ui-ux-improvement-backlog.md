# Morning Analytics UI/UX Improvement Backlog

This backlog is based on a source review of the current Morning Analytics app on July 14, 2026. Items are ordered by user impact, with core-journey blockers, accidental submission or data-loss risks, and account recovery ranked ahead of discoverability and polish.

The list intentionally excludes improvements that are already implemented, including the journal word count, lightbox image counter, analysis/image fade-in, welcome empty state, analyst descriptions, image-prompt disclosure, reading-time estimate, and view-density modes.

## Priority key

- **P0 — Critical:** Blocks a core journey or creates a meaningful risk of accidental submission, data loss, or account lockout.
- **P1 — High:** Removes recurring friction from a primary workflow or makes stored content substantially easier to manage and use.
- **P2 — Medium:** Improves clarity, accessibility, or polish after the primary journeys are reliable.

## Ranked summary

| Rank | Improvement | Priority | Size | Difficulty |
| --- | --- | --- | --- | --- |
| 1 | Mobile navigation and history drawer | P0 | M | Medium |
| 2 | Safe journal drafts and paste confirmation | P0 | M | Medium |
| 3 | Password recovery and stronger auth forms | P0 | M | Medium |
| 4 | End-to-end progress and save status | P1 | M | Medium |
| 5 | Searchable, date-grouped history | P1 | M | Medium |
| 6 | Delete an analysis safely | P1 | M | Hard |
| 7 | Collapsible original entry in history view | P1 | S | Easy |
| 8 | Analysis reader navigation and export actions | P1 | M | Medium |
| 9 | Simplified setup controls with plain-language guidance | P2 | M | Medium |
| 10 | Accessible, mobile-friendly lightbox | P2 | M | Medium |

---

## 1. Mobile navigation and history drawer

**Priority: P0 — Critical**

### Summary

Make history and the “New Analysis” action available on phones and small tablets through a compact header and an accessible slide-out drawer.

### Details

The current `HistorySidebar` is hidden below the `md` breakpoint, which removes both saved-history navigation and the only persistent “New Analysis” action. Add a menu button to the authenticated app header that opens an off-canvas drawer containing the same new-analysis control and history list as desktop. On small screens, reduce the logo footprint and move the email/sign-out controls into a compact account menu so the header does not crowd the writing experience.

The desktop sidebar should remain visible and share its history content with the mobile drawer rather than maintaining two separate implementations.

### Acceptance Criteria

- [ ] A visible, labelled menu button is available below the `md` breakpoint.
- [ ] The drawer contains “New Analysis,” loading/error/empty states, and all history entries.
- [ ] Selecting a history entry or starting a new analysis closes the drawer and shows the requested view.
- [ ] The drawer traps focus while open, closes with Escape or the backdrop, and returns focus to its trigger.
- [ ] The authenticated header fits at 320px width without horizontal scrolling or clipped controls.
- [ ] Desktop history behavior remains unchanged.

### Context

- **Current behavior:** `HistorySidebar` uses `hidden md:flex`, so its functionality disappears on mobile.
- **Size:** M | **Difficulty:** Medium
- **Category:** Responsive Navigation

---

## 2. Safe journal drafts and paste confirmation

**Priority: P0 — Critical**

### Summary

Protect journal text from accidental loss and prevent a large paste from submitting private writing before the user has reviewed it.

### Details

The editor currently clears when a user starts a new analysis and loses its content on refresh. It also starts analysis immediately after a paste brings the editor to 300 or more words. Replace that surprise submission with an explicit confirmation banner or short countdown that offers “Analyze now” and “Keep editing.” Add debounced, per-user draft recovery for unfinished text and warn before actions that would discard a non-empty draft.

Morning pages can contain sensitive material, so recovery storage must be clearly described as local to the device, namespaced by user, removable by the user, and cleared after a successful save or sign-out. If product policy does not permit persistent local storage, use session-scoped recovery and state that limitation in the UI.

### Acceptance Criteria

- [ ] Pasting 300 or more words does not immediately submit without a visible confirmation or undo opportunity.
- [ ] The confirmation clearly offers both “Analyze now” and “Keep editing.”
- [ ] An unfinished draft can be restored after an accidental refresh in the supported recovery window.
- [ ] Starting a new analysis, opening history, or signing out warns before discarding changed text.
- [ ] Draft storage is isolated by user and never restores one user’s text into another user’s session.
- [ ] A successful analysis save or an explicit discard removes the corresponding local draft.
- [ ] The UI explains that draft recovery is local to the device and provides a way to clear it.

### Context

- **Current behavior:** `JournalInput` triggers `onAnalyze()` after a qualifying paste; `handleNewAnalysis()` clears `journalText` without a guard.
- **Product dependency:** The `auto-analyze-on-paste` OpenSpec requirement must be revised if confirmation replaces immediate submission.
- **Size:** M | **Difficulty:** Medium
- **Category:** Journal Safety & Recovery

---

## 3. Password recovery and stronger auth forms

**Priority: P0 — Critical**

### Summary

Give locked-out users a complete “Forgot password?” flow and improve the usability of sign-in and sign-up forms.

### Details

The current authentication screens support sign-in and sign-up but offer no recovery path. Add password-reset request and password-update screens using Supabase Auth, with neutral confirmation copy that does not reveal whether an email address exists. Improve both existing forms with password visibility toggles, appropriate browser autocomplete attributes, field-level errors, and a stable loading state.

### Acceptance Criteria

- [ ] The sign-in screen includes a visible “Forgot password?” link.
- [ ] A user can request a reset email and sees neutral confirmation regardless of account existence.
- [ ] A valid recovery link opens a screen where the user can set and confirm a new password.
- [ ] Expired or invalid recovery links show a helpful recovery action rather than a dead end.
- [ ] Email and password fields use appropriate `autocomplete` values and expose validation errors accessibly.
- [ ] Password fields provide an accessible show/hide control without moving focus or clearing input.
- [ ] Successful password update returns the user to a clear sign-in or authenticated state.

### Context

- **Current behavior:** The sign-in screen only offers sign-in and sign-up; password reset is listed in `TechnicalDebt.md`.
- **Size:** M | **Difficulty:** Medium
- **Category:** Authentication & Recovery

---

## 4. End-to-end progress and save status

**Priority: P1 — High**

### Summary

Show one persistent status model for text analysis, image generation, and history saving so users always know what is happening and what completed successfully.

### Details

The app currently presents separate loading states, then completes the UI before the history save result is visible. Replace the fragmented feedback with a compact three-stage progress component: “Analyzing writing,” “Generating images,” and “Saving to history.” Completed stages should remain visible while later stages run. Failures should identify the failed stage and offer a stage-specific retry when safe.

If a user tries to open history, start over, or sign out during an active request, explain whether the work will continue and require confirmation before abandoning in-memory work. A successful save should produce a persistent-enough confirmation near the result, not only a transient toast.

### Acceptance Criteria

- [ ] The user can distinguish queued, active, complete, warning, and failed stages.
- [ ] Text results remain readable while images are being generated.
- [ ] The UI shows whether the analysis was saved to history, including partial image/save outcomes.
- [ ] A failed stage offers an appropriate retry without rerunning successful work unnecessarily.
- [ ] Navigation during active work has explicit, tested behavior and cannot silently replace the current result.
- [ ] Status changes are announced through an `aria-live` region without repeatedly interrupting screen-reader users.
- [ ] Quiet mode remains visually calm while preserving essential success and failure information.

### Context

- **Current behavior:** State moves through `analyzing`, `text-ready`, and `complete`, while save feedback is handled separately through an error toast.
- **Size:** M | **Difficulty:** Medium
- **Category:** Progress, Feedback & Trust

---

## 5. Searchable, date-grouped history

**Priority: P1 — High**

### Summary

Help users find an earlier journal analysis without scanning a single undifferentiated list of truncated previews.

### Details

Add search above the history list and group results under human-readable date headings such as “Today,” “Yesterday,” “This week,” and “Older.” Search should match the available journal preview text and update without requiring a page reload. Preserve chronological order within each group and distinguish “no saved analyses” from “no search results.”

Start with client-side search over the currently loaded list if the expected history size is small. Define a pagination or server-search threshold so the interaction can scale without downloading every full journal entry.

### Acceptance Criteria

- [ ] History entries are grouped under accurate, locale-aware date headings.
- [ ] A labelled search field filters entries by preview text with a short debounce.
- [ ] Clearing search restores the grouped, chronological list and current selection.
- [ ] Empty history, no matches, loading, and load failure each have distinct states.
- [ ] Search and groups work identically in the desktop sidebar and mobile drawer.
- [ ] Keyboard and screen-reader users can understand group labels and the selected result.

### Context

- **Current behavior:** History is a flat list showing a timestamp and the first 100 characters of input.
- **Size:** M | **Difficulty:** Medium
- **Category:** History Discoverability

---

## 6. Delete an analysis safely

**Priority: P1 — High**

### Summary

Allow users to remove an individual saved analysis and its generated images from the history UI with clear confirmation and failure handling.

### Details

Add a contextual menu to each history entry and a delete action in the selected analysis view. The confirmation must identify the analysis by date and preview, explain that associated generated images will also be deleted, and require an intentional destructive action. After success, remove the entry from history and select a sensible neighboring item or return to the new-analysis state.

The operation must delete the database record and owned storage objects under server-verified authorization. Do not present success if only part of the cleanup completed; provide a recoverable error state and support-safe details without exposing secrets.

### Acceptance Criteria

- [ ] Each owned analysis has a discoverable delete action that is not triggered by a single accidental click.
- [ ] Confirmation identifies the item and states that the action removes its generated images.
- [ ] Cancel returns focus to the control that opened the confirmation.
- [ ] Success removes the entry from all history views and shows an accessible confirmation.
- [ ] The UI chooses the next logical view after deleting the selected item.
- [ ] Partial database/storage failures are reported accurately and can be retried safely.
- [ ] A user cannot delete another user’s analysis or images.

### Context

- **Current behavior:** The client supports listing and reading analyses but has no per-analysis delete action.
- **Technical dependency:** Requires authenticated server-side deletion and storage cleanup, not only UI work.
- **Size:** M | **Difficulty:** Hard
- **Category:** History Management & Privacy

---

## 7. Collapsible original entry in history view

**Priority: P1 — High**

### Summary

Collapse long original journal text by default so returning users reach the analysis and images quickly.

### Details

Historical analyses currently render the complete original input before the analysis. Replace that always-expanded card with a disclosure headed by the entry date, word count, and a short preview. Keep the first few lines visible when collapsed, offer clear “Show full entry” and “Hide entry” actions, and preserve the expansion state while the same history item remains selected.

### Acceptance Criteria

- [ ] Original input is collapsed by default for a newly selected history item.
- [ ] The collapsed state shows a useful preview plus date and word-count metadata.
- [ ] “Show full entry” reveals the complete formatted journal text without losing scroll position.
- [ ] “Hide entry” returns to the compact state and remains keyboard accessible.
- [ ] The disclosure exposes correct `aria-expanded` and `aria-controls` relationships.
- [ ] Short entries do not receive a redundant collapse control.

### Context

- **Current behavior:** The full `inputText` card appears before every historical analysis and can push the analysis far below the fold.
- **Size:** S | **Difficulty:** Easy
- **Category:** History Reading Experience

---

## 8. Analysis reader navigation and export actions

**Priority: P1 — High**

### Summary

Make long analyses easier to scan, revisit, copy, and save outside the app.

### Details

Add a compact reader toolbar to `AnalysisPanel`. For analyses with several headings, derive a section quick-nav from the rendered Markdown headings and let users jump to a section. Add “Copy analysis” and “Download Markdown” actions that preserve readable structure. Keep these actions secondary to the content and avoid showing section navigation for short analyses.

### Acceptance Criteria

- [ ] Analyses with at least three headings show a section quick-nav in source order.
- [ ] Activating a section link moves focus or scroll position to the matching unique heading.
- [ ] Navigation respects `prefers-reduced-motion` and does not hide the heading behind a sticky header.
- [ ] “Copy analysis” provides visible success/failure feedback and copies the full analysis.
- [ ] “Download Markdown” produces a sensibly named UTF-8 `.md` file containing the complete analysis.
- [ ] The toolbar works for fresh and historical analyses and remains usable at 320px width.

### Context

- **Current behavior:** `AnalysisPanel` renders structured Markdown but offers no navigation, copy, or export controls.
- **Size:** M | **Difficulty:** Medium
- **Category:** Analysis Reading & Portability

---

## 9. Simplified setup controls with plain-language guidance

**Priority: P2 — Medium**

### Summary

Reduce the control cluster above the page and explain analyst, model, provider, palette, and view-mode choices in language users can understand.

### Details

Keep the analyst persona as the primary pre-analysis choice and move technical or display-oriented controls into a labelled “View & settings” disclosure. Show the current selection in the trigger, explain what Quiet, Insight, and Test change, and clearly separate experience preferences from generation settings. Move the floating palette control into this settings surface on authenticated pages while keeping palette access available on auth screens.

Test-only provider overrides and diagnostics controls should look intentionally developer-oriented and remain unavailable unless their feature flags are enabled.

### Acceptance Criteria

- [ ] The main writing view has one clearly primary analysis-setting control and one secondary settings entry point.
- [ ] Every mode and picker option includes a plain-language description of its effect.
- [ ] Changing display density does not imply that the underlying analysis quality changes.
- [ ] Test-only provider controls are visually labelled as testing tools.
- [ ] Current selections are visible without opening every menu and continue to persist as they do today.
- [ ] Settings menus support Escape, arrow-key navigation where appropriate, outside-click dismissal, and correct focus return.
- [ ] The control area fits cleanly on mobile and desktop without awkward wrapping.

### Context

- **Current behavior:** Analyst, model, provider, and three icon-only view modes share the same top control row; palette selection floats separately at the bottom-left.
- **Size:** M | **Difficulty:** Medium
- **Category:** Information Architecture & Control Clarity

---

## 10. Accessible, mobile-friendly lightbox

**Priority: P2 — Medium**

### Summary

Upgrade the image lightbox into a correctly announced modal with reliable focus behavior and controls that remain usable on small screens.

### Details

The lightbox already supports Escape, arrow keys, backdrop close, and a position counter. Add dialog semantics, focus containment, focus restoration, and a mobile layout that overlays navigation controls without shrinking the image excessively. Ensure controls remain visible against every image and provide a touch-friendly path through the full image set.

### Acceptance Criteria

- [ ] The overlay uses dialog semantics with an accessible name and `aria-modal="true"`.
- [ ] Focus moves into the lightbox on open, stays within it, and returns to the originating thumbnail on close.
- [ ] Previous, next, and close controls meet a minimum 44×44px touch target and remain visible at 320px width.
- [ ] The image uses the maximum practical viewport area without horizontal overflow.
- [ ] Keyboard navigation, button navigation, backdrop close, and the existing position counter continue to work.
- [ ] Navigation is hidden or disabled appropriately when only one image is available.
- [ ] Screen readers are informed when the current image and position change without duplicate announcements.
- [ ] Crossfade behavior respects `prefers-reduced-motion`.

### Context

- **Current behavior:** The overlay handles keyboard events and scroll locking but has no modal role, focus trap, or focus restoration; side-by-side arrows consume mobile width.
- **Size:** M | **Difficulty:** Medium
- **Category:** Accessibility & Image Experience
