## Context

The top bar contains four user choices: analyst persona, Gemini model, test-mode image provider, and view-density mode. `ModelPicker` already stores `gemini-model`, and the view-density helpers already store `morning-analytics-view-density`. Persona is held in both picker-local and page state and always starts as `jungian`; provider is page state and always starts from the deployment-derived default.

These values are browser preferences, not durable user or analysis records. The app must also retain its current safety boundary: an image-provider preference is only a UI request override, and the server still decides whether overrides are enabled and authorized.

## Goals / Non-Goals

**Goals:**

- Restore all four top-bar choices after reload in the same browser.
- Keep each control independently changeable and ensure its visible value matches the value used by analysis or image generation.
- Validate stored values against current option lists and environment-gated provider availability.
- Fail closed to existing defaults when localStorage cannot be read or written.
- Preserve existing model and view-density storage keys so current preferences continue working.

**Non-Goals:**

- Cross-browser or cross-device synchronization through Supabase.
- Changing which personas, models, providers, or view modes are available.
- Changing server-side image-provider authorization, deployment defaults, or secrets.
- Storing a provider choice on an analysis record beyond existing generation-attempt attribution.
- Guaranteeing persistence after users clear site data or use private browsing that discards storage.

## Decisions

### Keep one validated localStorage entry per preset

Use separate string keys so one invalid preference cannot invalidate the other three. Preserve the existing `gemini-model` and `morning-analytics-view-density` keys, and add namespaced keys for analyst persona and image provider. Centralize guarded read/write helpers and validators so every control follows the same fallback behavior.

A single versioned JSON object was considered, but it would require migration from the two existing keys and create unnecessary coupling between otherwise independent controls.

### Make page state the source of truth for visible and submitted selections

Initialize the page’s four preset states with deterministic defaults during server rendering and hydration, then restore one validated preset snapshot in a client-mount effect. Pass explicit `value` and `onChange` props to the pickers, including converting the analyst and model pickers to controlled components. Each page change handler updates state and attempts a localStorage write. This avoids hydration differences between browsers as well as separate picker-local values drifting from the values passed to server actions.

Keeping storage inside each picker was considered, but the current analyst picker demonstrates the synchronization risk: its displayed local state and the page’s submitted state are initialized separately.

Reading localStorage directly from React state initializers was also rejected after cross-browser manual testing. The server cannot read browser storage, so that pattern can render defaults on the server and stored values during hydration; restoring after mount keeps the server and first client render identical.

### Validate provider preferences against current client availability

Restore a stored provider only when it is a registered picker option under the current flags. A stored `dual` value is invalid when Dual mode is disabled; any stored test override is operational only while test mode and provider-override UI are enabled. Invalid values fall back to the deployment-derived client default, while the existing server-side checks remain authoritative for every request.

Persisting and sending the stored provider regardless of current flags was rejected because it could surface unavailable UI state and would blur the existing override safety boundary.

### Treat localStorage as best-effort

All reads and writes remain guarded for server rendering, disabled storage, private browsing, and browser exceptions. Read failures, missing values, and unsupported values return the relevant default. Write failures do not block the user’s in-session selection.

### Cover the behavior at storage and control boundaries

Add unit tests for valid restoration, independent stored values, invalid/stale values, provider flag changes, and unavailable storage. Add or update component coverage to confirm controlled picker values and callbacks stay aligned. Existing model and view-density persistence receives regression coverage as part of the four-preset contract.

## Risks / Trade-offs

- [A previously stored provider becomes unavailable after a deployment flag changes] → Validate against the current provider option set and fall back to the deployment-derived default.
- [Client storage is unavailable or throws] → Catch access errors and continue with safe defaults and in-memory state.
- [Refactoring pickers to controlled values changes initialization behavior] → Keep current defaults and cover visible value plus callback behavior in focused tests.
- [Client-mount restoration can briefly show defaults] → Restore all four values in one effect immediately after hydration, accepting a short visual transition in exchange for deterministic cross-browser behavior.
- [Preferences do not follow an authenticated user to another device] → Accept this explicitly as the browser-local scope; future account synchronization would be a separate change.

## Migration Plan

No data or deployment migration is required. Existing model and view-density keys remain readable. New persona and provider keys begin populating when the user changes those controls. Rollback removes the new readers/writers; stale localStorage entries are harmless.

## Open Questions

None. Browser-local persistence and default behavior are sufficiently defined for implementation.
