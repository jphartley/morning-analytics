## Why

Selecting **Dual** image generation and then leaving Test view (or reloading) silently produces single-provider results with no error and no Midjourney attempt. The persisted provider selection outlives the only view mode in which it is honored, so the app quietly discards the user's choice. Users experience this as "dual mode is broken" — every generation returns only Black Forest Labs images. The image provider is a generation concern, not a display-density concern, and coupling the two is the root cause.

## What Changes

- **BREAKING (behavior):** The image provider selection is decoupled from view density. A selected provider — including `dual` — is honored in **any** view mode, gated only by the server-side feature flags, not by whether the user happens to be in Test view.
- The image provider picker becomes reachable outside Test view whenever provider override support is enabled (it is no longer hidden in Quiet/Insight modes).
- The client dispatch guard stops conditioning the request override on `viewMode === "test"`; it forwards the selected override whenever it differs from the deployment default and the flags allow it.
- The server contract for overrides (including `dual`) is re-gated on the explicit server feature flags (`IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED`, `IMAGE_PROVIDER_DUAL_MODE_ENABLED`) rather than on a request-supplied `testMode` signal.
- **Codify the client/server default-agreement invariant.** Investigation showed the previously-suspected env-var mismatch is *not* a real bug: `next.config.ts` builds `NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER` from the same `IMAGE_GENERATION_PROVIDER || NEXT_PUBLIC_IMAGE_PROVIDER || "midjourney"` chain the server uses, so the client default already mirrors the server default at build time. This change adds a spec requirement pinning that invariant (and a code comment) so a future edit does not accidentally break the agreement the override guard depends on. No env-var behavior changes.
- Persisted provider selections continue to be restored, now without any view-mode condition — restoration remains gated on registry validity and client feature flags.

## Capabilities

### New Capabilities
<!-- None. This change modifies existing spec behavior only. -->

### Modified Capabilities
- `image-provider-selection`: Provider overrides (single and `dual`) are no longer gated on test/view mode — they are authorized by the server feature flags in any view mode. The picker is displayed whenever override support is enabled. A new requirement pins the existing invariant that the client-derived default provider mirrors the server deployment default. The former "test-mode only" and "hidden in quiet/insight" scenarios are replaced.

## Impact

- **Client:** `app/app/page.tsx` (dispatch guards at ~229–233 and ~375–379, picker render gate at ~509), `app/lib/top-bar-presets.ts` (`getStoredImageProvider` doc comment — no longer implies test scope). The default derivation stays on `NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER` (unchanged); `app/components/ImageProviderPicker.tsx` is a native `<select>` and needs no change.
- **Server:** `app/lib/image-providers/registry.ts` (`resolveImageGenerationSelection` and `resolveImageProvider` — override/`dual` gating no longer requires `testMode`; `testMode` field removed from options), server actions in `app/app/actions.ts` that passed `testMode` through to resolution.
- **Config/deploy:** No env-var changes. Cost note: dual roughly doubles per-run image cost and is now reachable in normal use — it remains flag-gated and off by default.
- **Tests:** `app/lib/image-providers/registry.test.ts` updated for the new flag-only gating; no database or auth changes.
