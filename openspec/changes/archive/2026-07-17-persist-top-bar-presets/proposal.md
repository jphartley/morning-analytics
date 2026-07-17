## Why

The main header exposes four choices that shape each analysis, but only the Gemini model and view-density mode currently survive a reload. Remembering every top-bar choice in the same browser removes repetitive setup and makes the app reopen in the user’s last working configuration.

## What Changes

- Save the selected analyst persona in browser localStorage and restore it on later visits.
- Save the selected test-mode image provider (including Dual mode when available) in browser localStorage and restore it on later visits.
- Keep the existing persisted Gemini model and view-density behavior, and verify all four choices remain independent and survive reloads together.
- Validate stored values against the options currently available; use each control’s safe default when storage is unavailable, corrupt, stale, or disabled by environment-gated UI configuration.
- Keep persistence browser-local only; do not sync preset choices to the user account or analysis history beyond the existing per-analysis metadata.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analyst-persona-selection`: Extend persona persistence from in-memory component state to browser localStorage with safe restoration and fallback.
- `image-provider-selection`: Persist and safely restore the explicitly gated test-mode provider selection without weakening server-controlled provider authorization.

## Impact

- Affects main-page preset initialization and change handlers plus the analyst and image-provider picker contracts.
- Adds focused client-side storage validation tests and regression coverage for the already-persisted model and view-density choices.
- Adds no dependency, API, database, authentication, migration, environment-variable, or Railway configuration change.
