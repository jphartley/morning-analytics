## 1. Server: authorize overrides by flags, not test mode

- [x] 1.1 In `app/lib/image-providers/registry.ts`, remove the `options.testMode` gate from `resolveImageGenerationSelection` so a `dual` override is authorized by `IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED` + `IMAGE_PROVIDER_DUAL_MODE_ENABLED` alone; keep the existing "overrides disabled" and "dual mode disabled" configuration errors.
- [x] 1.2 Ensure single-provider overrides are likewise authorized by `IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED` regardless of any test-mode signal, still rejecting unregistered providers with a configuration error.
- [x] 1.3 In `app/app/actions.ts`, stop threading a view-mode-derived `testMode` argument into provider resolution (remove the parameter or ignore it); confirm no other caller depends on that gating.
- [x] 1.4 Update `app/lib/image-providers/registry.test.ts` to cover: dual authorized with both flags and no test mode; dual rejected when dual flag off; single override authorized without test mode; override ignored/rejected when override support off.

## 2. Client: decouple dispatch and picker from view mode

- [x] 2.1 In `app/app/page.tsx`, change both image-generation dispatch guards (initial generate ~229–233 and regenerate ~375–379) to forward `selectedImageProvider` whenever it differs from `defaultImageProvider`, removing the `viewMode === "test"` condition and the `testMode` argument to the server action.
- [x] 2.2 Change the picker render gate (~509) from `isTestMode && providerOverrideEnabled` to `providerOverrideEnabled` so the picker is reachable in any view mode.
- [x] 2.3 Verify `ImageProviderPicker` renders correctly in quiet/insight layouts (no test-mode-only styling assumptions); adjust placement in the control row if needed. (It is a native `<select>` with no test-mode styling — no change required.)

## 3. Pin the deployment-default agreement invariant

- [x] 3.1 CORRECTED: `next.config.ts` already builds `NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER` from the same `IMAGE_GENERATION_PROVIDER || NEXT_PUBLIC_IMAGE_PROVIDER || "midjourney"` chain the server uses, so the client default already mirrors the server default. Keep `page.tsx` reading `NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER` (do NOT switch to `NEXT_PUBLIC_IMAGE_PROVIDER`, which would break agreement) and add a comment documenting the mirror.
- [x] 3.2 No env-var changes required; `.env.example` and the Railway plan already document the model (canonical `IMAGE_GENERATION_PROVIDER`, `NEXT_PUBLIC_*` baked at build). Invariant is captured as a spec requirement instead.
- [x] 3.3 Update the doc comment on `getStoredImageProvider` in `app/lib/top-bar-presets.ts` to reflect that restoration is not view-mode scoped; adjust any test names that imply "test-mode".

## 4. Verify

- [x] 4.1 Run `npm run lint` and `npm run build` from `/app`; both pass.
- [x] 4.2 Run the full vitest suite; all pass (72/72), including updated registry and actions tests.
- [x] 4.3 Run `openspec validate decouple-image-provider-from-view-density --strict`.
- [x] 4.4 Manual matrix (dev server): with override + dual flags on, select Dual in Insight mode → confirm diagnostics show `source: test-override` and both `midjourney` and `black-forest-labs` are attempted; reload and confirm Dual persists and is still honored; with dual flag off, confirm a saved Dual coerces to the default and is not submitted; with override support off, confirm the picker is absent and no override is sent. VERIFIED 2026-07-19: all four scenarios passed against dev server (Tests 1–4).
