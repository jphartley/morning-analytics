## Context

The image provider selection today lives at the intersection of two previously-shipped changes:

- `add-dual-image-provider-trial` scoped provider overrides (including `dual`) to Test view. The picker only renders when `isTestMode && providerOverrideEnabled` (`app/app/page.tsx:509`), the client only forwards the override when `viewMode === "test"` (`page.tsx:229–233`, `page.tsx:375–379`), and the server rejects a `dual` override unless `options.testMode` is true (`app/lib/image-providers/registry.ts`).
- `persist-top-bar-presets` persists the provider selection to localStorage and restores it on mount (`page.tsx:114–129`), independent of view mode. `getStoredImageProvider` only coerces `dual` back to the default when the *dual client flag* is off (`top-bar-presets.ts:107`) — it has no view-mode reasoning.

The interaction: a user selects Dual in Test view (persisted), then switches to the default `insight` mode or reloads. Now `selectedImageProvider === "dual"` but `viewMode !== "test"`. The picker is hidden (no feedback), and the dispatch guard evaluates `viewMode === "test"` → false → sends `override: null`. The server falls back to its deployment default and returns single-provider results with no error. Diagnostics confirm this: `source: deployment-default` (not `test-override`) and `startIndex: 4` proving no prior run was ever true dual.

A suspected second defect was investigated and **ruled out**: `next.config.ts:9-12` builds `NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER` (read by `page.tsx:68`) from the exact same `IMAGE_GENERATION_PROVIDER || NEXT_PUBLIC_IMAGE_PROVIDER || "midjourney"` chain the server uses in `getDeploymentImageProviderId()` (`registry.ts:34-35`). Because Railway shares service variables between build and runtime, the client default already mirrors the server default; they cannot disagree in a normal deployment. The override guard's comparison against `defaultImageProvider` is therefore sound today. This invariant is currently implicit (nothing prevents a future edit from pointing the client at a different variable), so this change pins it with a spec requirement and a code comment rather than altering any env-var wiring.

## Goals / Non-Goals

**Goals:**
- Honor a selected provider — including `dual` — in any view-density mode, gated only by server feature flags.
- Make the provider picker reachable whenever override support is enabled, not only in Test view.
- Eliminate silent fallback: an authorized selection must be forwarded; an unauthorized one must be rejected with an actionable error, never silently downgraded.
- Preserve and pin the existing client/server default-agreement invariant (via `next.config.ts`) so the override guard can never be poisoned by a future edit that diverges the two.

**Non-Goals:**
- No new persisted preferences, no new providers, no database/auth/RLS changes.
- No change to which server flags gate dual (`IMAGE_PROVIDER_DUAL_MODE_ENABLED`) or overrides (`IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED`); dual stays flag-gated and off by default because it roughly doubles per-run image cost.
- No change to view-density behavior itself (Quiet/Insight/Test still control chrome density).

## Decisions

**1. Move the override authorization boundary entirely server-side, keyed on flags.**
Remove the `options.testMode` gate from `resolveImageGenerationSelection` in `registry.ts`. Overrides (single and `dual`) are authorized by `IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED` (and additionally `IMAGE_PROVIDER_DUAL_MODE_ENABLED` for dual). The client no longer needs to send a `testMode` signal for authorization; server actions in `actions.ts` stop threading view-mode-derived `testMode` into resolution. Rationale: authorization must not depend on a client-supplied display state — that was the root of the silent-discard bug and also a soft security smell.

**2. Client dispatch guard compares against the shared default only.**
The guard becomes `selectedImageProvider !== defaultImageProvider ? selectedImageProvider : null` with the `viewMode === "test"` clause removed, at both call sites (`page.tsx:229–233` and `page.tsx:375–379`). Combined with Decision 4, the guard is now correct in every view mode.

**3. Picker visibility keys on `providerOverrideEnabled` alone.**
`page.tsx:509` changes from `isTestMode && providerOverrideEnabled` to `providerOverrideEnabled`. The picker appears in the top control row in any view mode when overrides are enabled. (It remains absent entirely when the feature flag is off — normal deployments are unaffected.)

**4. Keep `NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER` as the client default; pin the invariant.**
The browser cannot read the server-canonical `IMAGE_GENERATION_PROVIDER` (not a `NEXT_PUBLIC_*` var), so `next.config.ts` already derives a public mirror, `NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER`, from the identical fallback chain at build time. This is the correct single-source mechanism and must **not** be changed — pointing the client at `NEXT_PUBLIC_IMAGE_PROVIDER` directly would *break* agreement, because production sets only `IMAGE_GENERATION_PROVIDER` (the public var is documented legacy). We therefore leave `page.tsx:68` on `NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER`, add a comment explaining the mirror, and add a spec requirement that pins client/server default agreement so the invariant is explicit and testable.

**5. Rename away from "test-mode" in `top-bar-presets.ts`.**
`getStoredImageProvider` keeps its signature but its restoration no longer implies test scope; update the doc comment. No view-mode parameter is introduced (it never had one) — the fix is that callers stop gating on view mode, not that storage learns about it.

## Risks / Trade-offs

- **Cost exposure:** Dual is now reachable in normal views, doubling image cost per run when selected. Mitigation: it stays behind `IMAGE_PROVIDER_DUAL_MODE_ENABLED`, off by default; the picker only appears when override support is explicitly enabled.
- **Server contract change is behavioral, not just UI:** Removing the `testMode` gate means any client that previously relied on test-mode rejection now gets flag-based authorization. Acceptable — the only client is this app, and the spec is updated to match.
- **Build-time vs runtime drift (inherent, not introduced):** `NEXT_PUBLIC_*` values are baked at build; the server reads `IMAGE_GENERATION_PROVIDER` at runtime. Changing the runtime provider without rebuilding would leave the client mirror stale. This is inherent to Next.js public env vars and is already documented in `.env.example` ("NEXT_PUBLIC_* values require a rebuild to reach browsers"); this change does not alter that and adds no new env vars.
- **Touch surface in `page.tsx`:** Two dispatch call sites plus the picker gate must change together; missing one reintroduces an inconsistency. Mitigation: covered by the manual test matrix (dual honored in quiet/insight/test) and unit tests on `resolveImageGenerationSelection`.
