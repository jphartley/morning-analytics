## 1. Preset Storage Contract

- [x] 1.1 Add guarded, typed localStorage readers and writers for analyst persona, Gemini model, image provider, and view-density mode while preserving the existing model and view-density keys.
- [x] 1.2 Validate persona and model values against their current option lists, validate provider values against the current registry and Dual-mode flag, and return each existing safe default for missing, stale, invalid, or unavailable storage.
- [x] 1.3 Add unit tests covering valid restoration of all four independent choices, invalid values, unavailable storage, and a stored Dual-mode value when Dual mode is disabled.

## 2. Controlled Top-Bar Presets

- [x] 2.1 Convert the analyst persona and Gemini model pickers to controlled `value`/`onChange` contracts so their displayed choices cannot drift from page state.
- [x] 2.2 Initialize all four page-level preset states with hydration-safe defaults, restore one validated snapshot after client mount, and persist every change without blocking in-session updates when writes fail.
- [x] 2.3 Restore an available provider preference only for the gated picker workflow, retain the deployment-derived default otherwise, and preserve the existing server override checks for generation and regeneration.
- [x] 2.4 Add or update component tests to verify each picker displays page state, emits selections correctly, and keeps provider options aligned with current feature flags.

## 3. Verification

- [x] 3.1 Run the focused storage and top-bar component tests plus repository lint and production build checks through the queue-managed verification flow.
- [ ] 3.2 Manually verify that choosing non-default values for all four controls, reloading, and starting an analysis restores and uses the same choices.
- [ ] 3.3 Manually verify safe defaults with cleared or invalid localStorage and verify that a saved Dual-mode choice is not restored when the Dual-mode flag is disabled.
