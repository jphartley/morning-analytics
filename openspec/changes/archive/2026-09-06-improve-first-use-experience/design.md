## Context

The existing empty-history state is detected after history loading and already conditionally renders a welcome guide in the idle view. The journal editor, history sidebar, analyst-persona selector, and view-detail controls are separate components. See proposal.md and `specs/first-use-experience/spec.md` for the user-visible contract.

## Goals / Non-Goals

**Goals:**
- Make the first actionable element on the empty-history screen the journal editor.
- Preserve the agreed language as a single, reviewable source of truth so implementation and tests cannot silently rewrite it.
- Apply the first-use treatment only while history is empty, without changing the established experience after a completed reflection exists.

**Non-Goals:**
- Changing journal analysis, image generation, history persistence, authentication, or palette behavior.
- Adding privacy, data-retention, tooltip, onboarding-tour, or modal content.
- Changing analyst-persona options or the behavior controlled by the detail-view modes.

## Decisions

### Gate the experience on the existing empty-history state

The new composition will use the existing resolved empty-history plus idle-state condition only to show the `How it works` guide. The main header, subtitle, toolbar, editor placeholder, and action label remain stable throughout new-analysis, loading, and completed-result states.

Alternative considered: track a separate “onboarding completed” preference. Rejected because a person with no history should receive the useful empty-state guidance even if local storage is cleared or they use another device.

### Treat the agreed copy as immutable UI content

The guide's title, introduction, steps, editor placeholder, button label, and sidebar message will be defined as canonical strings in the first-use UI. The editor placeholder and action label apply to every new analysis, while the guide remains first-use-only. Tests will assert the complete rendered strings, their order, and the intended bold treatment of the complete introductory sentence. Copy changes require an explicit spec update rather than implementation-level editorial judgment.

Alternative considered: retain the existing generic `steps` array and update the strings inline. Rejected because this change has an explicit verbatim-copy constraint and should make accidental rewrites easy to detect in review and tests.

### Recompose instead of duplicating the guide

The existing guide component will be moved from the header region to immediately after the editor and primary action. The large page heading will be removed from every main application state, while the centered subtitle remains. This gives the writing surface priority without losing the explanation of what follows.

Alternative considered: keep the guide above the editor or add a new introductory hero. Rejected because both delay the primary action and the latter repeats meaning already covered by the guide.

### Preserve toolbar visibility across first use

The analyst-persona selector and detail-view icon controls remain available under their existing role and capability rules before and after the first reflection. The palette picker and account controls remain unchanged and unexplained.

Alternative considered: hide the detail-view controls in first use. Rejected because a toolbar changing as analysis begins creates unnecessary visual discontinuity.

### Keep post-first-use behavior intact

The sidebar's `+ New Analysis` action and the view-detail controls return under their existing conditions after a saved reflection exists. The change does not alter data saving or add a persistence/privacy disclosure.

### Couple provider headings to provider-picker availability

Provider attribution remains available in persisted image groups, but its visible heading is an implementation/provider-selection detail for standard users. The page will pass a single picker-availability flag to image-group rendering for fresh and historical results. The image grid will render its heading only when a title is supplied, and the pending-generation panel will not introduce a generic heading, eliminating blank heading space for standard users.

Alternative considered: infer heading visibility from the current provider or hide headings only for Midjourney. Rejected because the requested boundary is access to the provider picker, and the same rule must apply consistently to all providers and historical results.

## Risks / Trade-offs

- [History resolution is asynchronous] → Render the first-use composition only after the existing empty-history state is resolved, preserving the current loading behavior and avoiding a temporary incorrect state.
- [Verbatim text is accidentally edited during UI work] → Centralize canonical copy and cover complete strings, ordering, punctuation, and full-sentence bold emphasis with tests.
- [First-use and later layouts diverge unexpectedly] → Test both empty-history and non-empty-history states, including the stable subtitle, editor affordances, analyst selector, and view-detail control visibility.
- [Moving the guide lowers its visibility] → Retain its full three-step structure and render it directly after the primary action rather than hiding it behind a disclosure.
- [Provider headings diverge between fresh and historical results] → Pass the same picker-availability condition to both image-group call sites and cover both render modes in tests.

## Migration Plan

1. Deploy the UI-only change with its component tests.
2. Verify a new authenticated account sees the copy and control treatment described by the spec.
3. Complete one reflection and verify the standard history action and detail-view controls return.
4. Roll back by reverting the UI-only change; no data migration or cleanup is required.
